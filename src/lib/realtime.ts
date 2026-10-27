import z from "zod";
import { redis } from "./redis";
import { InferRealtimeEvents, Realtime } from "@upstash/realtime";

const message = z.object({
  id: z.string(),
  sender: z.string(),
  text: z.string(),
  timestamp: z.number(),
  roomId: z.string(),
  token: z.string().optional(),
});

const schema = {
  chat: {
    message,
    destroy: z.object({
      isDestroyed: z.literal(true),
    }),
    join: z.object({
      username: z.string(),
    }),
    leave: z.object({
      username: z.string(),
    }),
  },
};

export const realtime = new Realtime({ schema, redis, history: { maxLength: 1000, expireAfterSecs: 30 }, maxDurationSecs: 15, verbose: false });

// The installed library always creates a stream, even with history:false.
// Persist + expire + publish atomically so an emit cannot resurrect an expired room.
export async function emitRoomEvent(roomId: string, event: "chat.message" | "chat.join" | "chat.leave" | "chat.destroy", data: Message | { username: string } | { isDestroyed: true }) {
  await redis.eval(`
    local time=redis.call('TIME')
    local now=tonumber(time[1])*1000.0+math.floor(tonumber(time[2])/1000)
    local id=tostring(now)..'-0'
    if redis.call('EXISTS',KEYS[1])==1 then
      id=redis.call('XADD',KEYS[2],'MAXLEN',1000,'*','data',ARGV[3],'event',ARGV[2],'channel',ARGV[1])
      redis.call('PEXPIREAT',KEYS[2],now+redis.call('PTTL',KEYS[1]))
    end
    redis.call('PUBLISH',ARGV[1],cjson.encode({id=id,event=ARGV[2],channel=ARGV[1],data=cjson.decode(ARGV[3])}))
    return id
  `, [`meta:${roomId}`, roomId], [roomId, event, JSON.stringify(data)]);
}

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
export type Message = z.infer<typeof message>;
