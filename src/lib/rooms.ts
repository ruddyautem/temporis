import { redis } from "./redis";
import { RECONNECT_GRACE_MS } from "./room-presence-config";

export const validRoomId = (id: string) => /^[\w-]{21}$/.test(id);
export type PresenceMode = "admit" | "renew" | "leave" | "unload";

// Admission replaces the document generation atomically. Old documents cannot
// renew or unload a slot after a refresh, even when their requests arrive late.
export const presenceScript = `
local meta,presence,messages,stream,connections = KEYS[1],KEYS[2],KEYS[3],KEYS[4],KEYS[5]
if redis.call('EXISTS',meta)==0 then return {-1,0,0} end
local time=redis.call('TIME')
local now=tonumber(time[1])*1000.0+math.floor(tonumber(time[2])/1000)
local token,mode,connection,lease = ARGV[1],ARGV[2],ARGV[3],tonumber(ARGV[4])
local deadline = tonumber(redis.call('HGET',meta,'createdAt'))+tonumber(redis.call('HGET',meta,'initialTtl'))*1000
if deadline<=now then redis.call('DEL',unpack(KEYS)) return {-1,0,0} end
local expired = redis.call('ZRANGEBYSCORE',presence,'-inf',now)
for _,member in ipairs(expired) do
 local username=redis.call('HGET',connections,member..':username')
 if username then
  local data=cjson.encode({username=username})
  local eventId=redis.call('XADD',stream,'MAXLEN',1000,'*','data',data,'event','chat.leave','channel',stream)
  redis.call('PEXPIREAT',stream,now+redis.call('PTTL',meta))
  redis.call('PUBLISH',stream,cjson.encode({id=eventId,event='chat.leave',channel=stream,data={username=username}}))
 end
 redis.call('HDEL',connections,member,member..':unloaded',member..':username')
end
redis.call('ZREMRANGEBYSCORE',presence,'-inf',now)
local member = redis.call('ZSCORE',presence,token)
if mode=='admit' then
 if not member and redis.call('ZCARD',presence)>=2 then return {-2,0,0} end
 redis.call('HSET',connections,token,connection)
 redis.call('HDEL',connections,token..':unloaded')
else
 if not member then return {-1,0,0} end
 if redis.call('HGET',connections,token)~=connection then return {-3,0,0} end
 if redis.call('HEXISTS',connections,token..':unloaded')==1 then return {-3,0,0} end
end
local joined=0
if ARGV[5]~='' and mode~='admit' and mode~='unload' and mode~='leave' then
 if redis.call('HGET',connections,token..':username')~=ARGV[5] then joined=1 end
 redis.call('HSET',connections,token..':username',ARGV[5])
end
if mode=='leave' then
 redis.call('ZREM',presence,token)
 redis.call('HDEL',connections,token,token..':unloaded',token..':username')
else
 if mode=='unload' then redis.call('HSET',connections,token..':unloaded','1') end
 redis.call('ZADD',presence,math.min(deadline,now+lease),token)
end
local count=redis.call('ZCARD',presence)
if count==0 then redis.call('DEL',unpack(KEYS)) return {0,0,0} end
local last=redis.call('ZRANGE',presence,-1,-1,'WITHSCORES')
local expiry=math.min(deadline,tonumber(last[2]))
for _,key in ipairs(KEYS) do redis.call('PEXPIREAT',key,expiry) end
return {count,math.ceil((deadline-now)/1000),tonumber(redis.call('HGET',meta,'initialTtl')),joined}
`;

export async function roomPresence(id: string, token: string, mode: PresenceMode, connectionId: string, username = "") {
  if (!validRoomId(id) || !validRoomId(token) || !validRoomId(connectionId)) return [-1, 0, 0];
  return redis.eval<unknown[], number[]>(presenceScript,
    [`meta:${id}`, `presence:${id}`, `messages:${id}`, id, `connections:${id}`],
    [token, mode, connectionId, RECONNECT_GRACE_MS, username]);
}

export async function isRoomMember(id: string, token: string, connectionId?: string) {
  if (!validRoomId(id) || !validRoomId(token) || !connectionId || !validRoomId(connectionId)) return false;
  const result = await redis.eval<unknown[], number>(`
    if redis.call('EXISTS',KEYS[1])==0 then return 0 end
    local time=redis.call('TIME')
    local now=tonumber(time[1])*1000.0+math.floor(tonumber(time[2])/1000)
    local lease=redis.call('ZSCORE',KEYS[2],ARGV[1])
    if not lease or tonumber(lease)<=now then return 0 end
    if redis.call('HGET',KEYS[3],ARGV[1])~=ARGV[2] then return 0 end
    if redis.call('HEXISTS',KEYS[3],ARGV[1]..':unloaded')==1 then return 0 end
    return 1
  `, [`meta:${id}`, `presence:${id}`, `connections:${id}`], [token, connectionId]);
  return result === 1;
}
