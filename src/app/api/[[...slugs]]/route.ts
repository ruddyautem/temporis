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
    async ({ body, auth: { roomId } }) => {
      await realtime.channel(roomId).emit("chat.join", body);
      return { success: true };
    },
    { body: UsernameBody, query: RoomIdQuery },
  )

  .post(
    "/leave",
    async ({ body, auth: { roomId } }) => {
      await realtime.channel(roomId).emit("chat.leave", body);
      return { success: true };
    },
    { body: UsernameBody, query: RoomIdQuery },
  )

  .get(
    "/ttl",
    async ({ auth: { roomId } }) => ({
      ttl: Math.max(await redis.ttl(metaKey(roomId)), 0),
    }),
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

      await redis.rpush(msgKey(roomId), { ...message, token });
      await realtime.channel(roomId).emit("chat.message", message);

      const remaining = await redis.ttl(metaKey(roomId));
      if (remaining > 0) {
        await Promise.all([
          redis.expire(msgKey(roomId), remaining),
          redis.expire(metaKey(roomId), remaining),
          redis.expire(roomId, remaining),
        ]);
      }
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
