import { Message, emitRoomEvent } from "@/lib/realtime";
import { redis } from "@/lib/redis";
import { roomPresence } from "@/lib/rooms";
import { Elysia,t } from "elysia";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";
import { after } from "next/server";
const RoomIdQuery=t.Object({roomId:t.String({pattern:"^[\\w-]{21}$"})});
const UsernameBody=t.Object({username:t.String({minLength:1,maxLength:100})});
const rooms=new Elysia({prefix:"/room"})
 .post("/create",async ({query:{ttl="15"},set})=>{
  if(!["5","15","30"].includes(ttl)){set.status=400;return {error:"Invalid duration"};}
  // Shared budget; never trust unconfigured forwarded IP headers.
  const count=await redis.eval<unknown[], number>(`local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],3600) end; return n`,["quota:room-create:"+Math.floor(Date.now()/3600000)],[]);
  if(count>1000){set.status=429;return {error:"Room creation limit reached"};}
  const roomId=nanoid(),seconds=Number(ttl)*60;
  await redis.eval(`local time=redis.call('TIME'); local now=tonumber(time[1])*1000.0+math.floor(tonumber(time[2])/1000); redis.call('HSET',KEYS[1],'createdAt',now,'initialTtl',ARGV[1]); redis.call('EXPIRE',KEYS[1],ARGV[1]); return 1`,[`meta:${roomId}`],[seconds]);
  return {roomId};
 },{query:t.Object({ttl:t.Optional(t.String())})})
 .use(authMiddleware)
 .post("/join",async ({body,auth:{roomId,token,connectionId},set})=>{
  const [count,,,joined]=await roomPresence(roomId,token,"renew",connectionId,body.username);
  if(count<0){set.status=401;return {error:"Room expired"};}
  if(joined===1) await emitRoomEvent(roomId,"chat.join",body).catch(()=>{});
  return {success:true,others:count-1};
 },{body:UsernameBody,query:RoomIdQuery})
 .post("/leave",async ({body,auth:{roomId,token,connectionId},query})=>{
  const [count]=await roomPresence(roomId,token,query.unload==="true"?"unload":"leave",connectionId);
  if(count<0) return {success:false};
  if(query.unload!=="true") {
   if(count===0) await emitRoomEvent(roomId,"chat.destroy",{isDestroyed:true});
   else if(count>0) await emitRoomEvent(roomId,"chat.leave",body);
  }
  return {success:true};
 },{body:UsernameBody,query:t.Object({roomId:t.String(),unload:t.Optional(t.String()),connectionId:t.Optional(t.String())})})
 .get("/ttl",async ({auth:{roomId,token,connectionId},set})=>{
  const [count,ttl,initialTtl]=await roomPresence(roomId,token,"renew",connectionId);
  if(count<0){set.status=401;return {error:"Room expired"};}
  return {ttl,initialTtl,others:Math.max(0,count-1)};
 },{query:RoomIdQuery})
 .delete("/",async ({auth:{roomId,token,connectionId},set})=>{
  const deleted=await redis.eval<unknown[],number>(`
    local time=redis.call('TIME')
    local now=tonumber(time[1])*1000.0+math.floor(tonumber(time[2])/1000)
    local lease=redis.call('ZSCORE',KEYS[2],ARGV[1])
    if not lease or tonumber(lease)<=now then return 0 end
    if redis.call('HGET',KEYS[5],ARGV[1])~=ARGV[2] then return 0 end
    if redis.call('HEXISTS',KEYS[5],ARGV[1]..':unloaded')==1 then return 0 end
    redis.call('DEL',unpack(KEYS)); return 1
  `,[`meta:${roomId}`,`presence:${roomId}`,`messages:${roomId}`,roomId,`connections:${roomId}`],[token,connectionId]);
  if(deleted!==1){set.status=401;return {error:"Room expired"};}
  // The deletion has succeeded even when delivery to other tabs fails.
  after(async () => {
   await emitRoomEvent(roomId,"chat.destroy",{isDestroyed:true}).catch(() => {
    console.warn("Room deleted; realtime notification failed");
   });
  });
  return {success:true};
 },{query:RoomIdQuery});
const messages=new Elysia({prefix:"/messages"}).use(authMiddleware)
 .post("/",async ({body,auth:{roomId,token,connectionId},set})=>{
  const message:Message={id:nanoid(),timestamp:Date.now(),roomId,...body};
  const accepted=await redis.eval<unknown[], number>(`
   if redis.call('EXISTS',KEYS[1])==0 then return 0 end
   local time=redis.call('TIME')
   local now=tonumber(time[1])*1000.0+math.floor(tonumber(time[2])/1000)
   local lease=redis.call('ZSCORE',KEYS[2],ARGV[1])
   if not lease or tonumber(lease)<=now then return 0 end
   if redis.call('HGET',KEYS[4],ARGV[1])~=ARGV[3] then return 0 end
   if redis.call('HEXISTS',KEYS[4],ARGV[1]..':unloaded')==1 then return 0 end
   if redis.call('LLEN',KEYS[3])>=1000 then return -1 end
   redis.call('RPUSH',KEYS[3],ARGV[2]); redis.call('PEXPIREAT',KEYS[3],now+redis.call('PTTL',KEYS[1])); return 1
  `,[`meta:${roomId}`,`presence:${roomId}`,`messages:${roomId}`,`connections:${roomId}`],[token,JSON.stringify({...message,token}),connectionId]);
  if(accepted!==1){set.status=accepted===-1?429:401;return {error:accepted===-1?"Room message limit reached":"Room expired"};}
  await emitRoomEvent(roomId,"chat.message",message).catch(()=>{});
  return {id:message.id};
 },{query:RoomIdQuery,body:t.Object({sender:t.String({minLength:1,maxLength:100}),text:t.String({maxLength:7000,pattern:"^[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]+$"})})})
 .get("/",async ({auth:{roomId,token}})=>({messages:(await redis.lrange<Message>(`messages:${roomId}`,0,999)).map(m=>({...m,token:m.token===token?token:undefined}))}),{query:RoomIdQuery});
export const app=new Elysia({prefix:"/api"}).use(rooms).use(messages);
export const GET=app.fetch;
export const POST=app.fetch;
export const DELETE=app.fetch;
