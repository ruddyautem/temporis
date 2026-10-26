import { redis } from "./redis";
export const validRoomId = (id: string) => /^[\w-]{21}$/.test(id);
// Atomic admission and renewable leases. Redis expiry replaces background timers.
export const presenceScript = `
local meta,presence,messages,stream = KEYS[1],KEYS[2],KEYS[3],KEYS[4]
if redis.call('EXISTS',meta)==0 then return {-1,0,0} end
local now,token,mode = tonumber(ARGV[1]),ARGV[2],ARGV[3]
local deadline = tonumber(redis.call('HGET',meta,'createdAt'))+tonumber(redis.call('HGET',meta,'initialTtl'))*1000
redis.call('ZREMRANGEBYSCORE',presence,'-inf',now)
local member = redis.call('ZSCORE',presence,token)
if mode=='admit' then
 if not member and redis.call('ZCARD',presence)>=2 then return {-2,0,0} end
elseif not member then return {-1,0,0} end
if deadline<=now then redis.call('DEL',meta,presence,messages,stream) return {-1,0,0} end
if mode=='leave' then redis.call('ZREM',presence,token)
else
 local duration=120000
 if mode=='unload' then duration=10000 end
 redis.call('ZADD',presence,math.min(deadline,now+duration),token)
end
local users=redis.call('ZRANGE',presence,0,-1)
if #users==0 then redis.call('DEL',meta,presence,messages,stream) return {0,0,0} end
redis.call('HSET',meta,'connected',cjson.encode(users))
local last=redis.call('ZRANGE',presence,-1,-1,'WITHSCORES')
local expiry=math.min(deadline,tonumber(last[2]))
for _,key in ipairs(KEYS) do redis.call('PEXPIREAT',key,expiry) end
return {#users,math.ceil((deadline-now)/1000),tonumber(redis.call('HGET',meta,'initialTtl'))}
`;
export async function roomPresence(id: string, token: string, mode: "admit"|"renew"|"leave"|"unload" = "renew") {
 if (!validRoomId(id) || !/^[\w-]{21}$/.test(token)) return [-1,0,0];
 return redis.eval<unknown[], number[]>(presenceScript,[`meta:${id}`,`presence:${id}`,`messages:${id}`,id],[Date.now(),token,mode]);
}
export async function isRoomMember(id: string, token: string) {
 if (!validRoomId(id) || !/^[\w-]{21}$/.test(token)) return false;
 const [exists,expiry]=await Promise.all([redis.exists(`meta:${id}`),redis.zscore(`presence:${id}`,token)]);
 return exists===1 && expiry!==null && Number(expiry)>Date.now();
}
