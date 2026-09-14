import { Message, realtime } from "@/lib/realtime";
import { redis } from "@/lib/redis";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";

// --- Schemas & Helpers ---
const RoomIdQuery = t.Object({ roomId: t.String() });
const UsernameBody = t.Object({ username: t.String() });

const metaKey = (id: string) => `meta:${id}`;
const msgKey = (id: string) => `messages:${id}`;

// --- Room Routes ---
const rooms = new Elysia({ prefix: "/room" })
  .post(
    "/create",
    async ({ query: { ttl = "15" } }) => {
      const roomId = nanoid();
      const ttlSeconds = parseInt(ttl, 10) * 60;

      await redis.hset(metaKey(roomId), {
        connected: [],
        createdAt: Date.now(),
        initialTtl: ttlSeconds,
      });
      await redis.expire(metaKey(roomId), ttlSeconds);
      return { roomId };
    },
    { query: t.Object({ ttl: t.Optional(t.String()) }) },
  )

  .use(authMiddleware)

  .post(
    "/join",
    async ({ body, auth: { roomId, token } }) => {
      // Mark ping for reconnect check (15s TTL to cover the 10s grace period)
      await redis.set(`ping:${roomId}:${token}`, "1", { ex: 15 });

      await realtime.channel(roomId).emit("chat.join", body);
      
      const meta = await redis.hgetall<{ createdAt: number; initialTtl: number }>(metaKey(roomId));
      if (meta && meta.createdAt && meta.initialTtl) {
        const absoluteRemaining = Math.max(0, Math.floor((meta.createdAt + meta.initialTtl * 1000 - Date.now()) / 1000));
        if (absoluteRemaining > 0) {
          await Promise.all([
            redis.expire(metaKey(roomId), absoluteRemaining),
            redis.expire(msgKey(roomId), absoluteRemaining),
            redis.expire(roomId, absoluteRemaining),
          ]);
        }
      }
      return { success: true };
    },
    { body: UsernameBody, query: RoomIdQuery },
  )

  .post(
    "/leave",
    async ({ body, auth: { roomId, token }, query }) => {
      // Prevent multiple concurrent leave processes for the same user session
      const lockAcquired = await redis.set(`lock:leave:${roomId}:${token}`, "1", { nx: true, ex: 30 });
      if (!lockAcquired) {
        return { success: true };
      }

      const processLeave = async () => {
        try {
          if (query.unload) {
            // Check if user reconnected within the 10s grace period (e.g. page refresh)
            const ping = await redis.get(`ping:${roomId}:${token}`);
            if (ping) {
              // User refreshed and came back within 10s: release lock and do not emit leave
              await redis.del(`lock:leave:${roomId}:${token}`);
              return;
            }
          }

          // Broadcast leave event
          await realtime.channel(roomId).emit("chat.leave", body);

          const meta = await redis.hgetall<{ connected: string[]; initialTtl: number }>(metaKey(roomId));
          
          if (meta && meta.connected) {
            const newConnected = meta.connected.filter((t) => t !== token);
            
            if (newConnected.length === 0) {
              // Instant destruction if last user truly left
              await Promise.all([
                realtime.channel(roomId).emit("chat.destroy", { isDestroyed: true }),
                redis.del(metaKey(roomId), msgKey(roomId), roomId, `lock:leave:${roomId}:${token}`),
              ]);
            } else {
              await redis.hset(metaKey(roomId), { connected: newConnected });
              const remaining = await redis.ttl(metaKey(roomId));
              if (remaining > 0) {
                await Promise.all([
                  redis.expire(metaKey(roomId), remaining),
                  redis.expire(msgKey(roomId), remaining),
                  redis.expire(roomId, remaining),
                ]);
              }
            }
          }
        } catch (err) {
          console.error("Error processing leave:", err);
        }
      };

      if (query.unload) {
        // Run asynchronously after 10s grace period so HTTP keepalive completes immediately
        setTimeout(() => {
          processLeave();
        }, 10000);
        return { success: true };
      }

      // Explicit user action (e.g., leave button clicked)
      await processLeave();
      return { success: true };
    },
    { 
      body: UsernameBody, 
      query: t.Object({ 
        roomId: t.String(),
        unload: t.Optional(t.String())
      }) 
    },
  )

  .get(
    "/ttl",
    async ({ auth: { roomId } }) => {
      const [remaining, meta] = await Promise.all([
        redis.ttl(metaKey(roomId)),
        redis.hgetall<{ initialTtl: number }>(metaKey(roomId)),
      ]);
      return {
        ttl: Math.max(remaining, 0),
        initialTtl: meta?.initialTtl || 900,
      };
    },
    { query: RoomIdQuery },
  )

  .delete("/", async ({ auth: { roomId } }) => {
    await Promise.all([
      realtime.channel(roomId).emit("chat.destroy", { isDestroyed: true }),
      redis.del(metaKey(roomId), msgKey(roomId), roomId),
    ]);
    return { success: true };
  });

// --- Message Routes ---
const messages = new Elysia({ prefix: "/messages" })
  .use(authMiddleware)

  .post(
    "/",
    async ({ body, auth: { roomId, token } }) => {
      const message: Message = {
        id: nanoid(),
        timestamp: Date.now(),
        roomId,
        ...body,
      };

      const meta = await redis.hgetall<{ createdAt: number; initialTtl: number }>(metaKey(roomId));
      if (!meta || !meta.createdAt) {
        return { error: "Room expired" };
      }

      const absoluteRemaining = Math.max(0, Math.floor((meta.createdAt + meta.initialTtl * 1000 - Date.now()) / 1000));
      if (absoluteRemaining <= 0) {
        return { error: "Room expired" };
      }

      await redis.rpush(msgKey(roomId), { ...message, token });
      await realtime.channel(roomId).emit("chat.message", message);

      await Promise.all([
        redis.expire(msgKey(roomId), absoluteRemaining),
        redis.expire(metaKey(roomId), absoluteRemaining),
        redis.expire(roomId, absoluteRemaining),
      ]);
      return { id: message.id };
    },
    {
      query: RoomIdQuery,
      body: t.Object({
        sender: t.String({ maxLength: 100 }),
        text: t.String({ maxLength: 5000 }),
      }),
    },
  )

  .get(
    "/",
    async ({ auth: { roomId, token } }) => ({
      messages: (await redis.lrange<Message>(msgKey(roomId), 0, -1)).map(
        (m) => ({
          ...m,
          token: m.token === token ? token : undefined,
        }),
      ),
    }),
    { query: RoomIdQuery },
  );

export const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
