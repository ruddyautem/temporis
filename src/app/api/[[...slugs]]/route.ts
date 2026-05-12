import { Message, realtime } from "@/lib/realtime";
import { redis } from "@/lib/redis";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";

const rooms = new Elysia({ prefix: "/room" })
  .post(
    "/create",
    async ({ query }) => {
      const roomId = nanoid();
      const minutes = query.ttl ? parseInt(query.ttl, 10) : 15;
      const ttlSeconds = minutes * 60;
      await redis.hset(`meta:${roomId}`, {
        connected: [],
        createdAt: Date.now(),
        initialTtl: ttlSeconds,
      });
      await redis.expire(`meta:${roomId}`, ttlSeconds);
      return { roomId };
    },
    { query: t.Object({ ttl: t.Optional(t.String()) }) },
  )
  .use(authMiddleware)
  .post(
    "/join",
    async ({ body, auth }) => {
      await realtime
        .channel(auth.roomId)
        .emit("chat.join", { username: body.username });
      return { success: true };
    },
    {
      body: t.Object({ username: t.String() }),
      query: t.Object({ roomId: t.String() }),
    },
  )
  // --- NOUVELLE ROUTE POUR LEAVE ---
  .post(
    "/leave",
    async ({ body, auth }) => {
      await realtime
        .channel(auth.roomId)
        .emit("chat.leave", { username: body.username });
      return { success: true };
    },
    {
      body: t.Object({ username: t.String() }),
      query: t.Object({ roomId: t.String() }),
    },
  )
  // ----------------------------------
  .get(
    "/ttl",
    async ({ auth }) => {
      const ttl = await redis.ttl(`meta:${auth.roomId}`);
      return { ttl: ttl > 0 ? ttl : 0 };
    },
    { query: t.Object({ roomId: t.String() }) },
  )
  .delete("/", async ({ auth }) => {
    await Promise.all([
      realtime.channel(auth.roomId).emit("chat.destroy", { isDestroyed: true }),
      redis.del(`meta:${auth.roomId}`),
      redis.del(`messages:${auth.roomId}`),
      redis.del(auth.roomId),
    ]);
    return { success: true };
  });

const messages = new Elysia({ prefix: "/messages" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, auth }) => {
      const { sender, text } = body;
      const { roomId } = auth;

      const message: Message = {
        id: nanoid(),
        sender,
        text,
        timestamp: Date.now(),
        roomId,
      };

      await redis.rpush(`messages:${roomId}`, {
        ...message,
        token: auth.token,
      });

      await realtime.channel(roomId).emit("chat.message", message);

      const remaining = await redis.ttl(`meta:${roomId}`);
      if (remaining > 0) {
        await Promise.all([
          redis.expire(`messages:${roomId}`, remaining),
          redis.expire(`meta:${roomId}`, remaining),
          redis.expire(roomId, remaining),
        ]);
      }
      return { id: message.id };
    },
    {
      query: t.Object({ roomId: t.String() }),
      body: t.Object({
        sender: t.String({ maxLength: 100 }),
        text: t.String({ maxLength: 5000 }),
      }),
    },
  )
  .get(
    "/",
    async ({ auth }) => {
      const messages = await redis.lrange<Message>(
        `messages:${auth.roomId}`,
        0,
        -1,
      );
      return {
        messages: messages.map((m) => ({
          ...m,
          token: m.token === auth.token ? auth.token : undefined,
        })),
      };
    },
    { query: t.Object({ roomId: t.String() }) },
  );

export const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
