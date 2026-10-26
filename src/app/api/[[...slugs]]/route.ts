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
  await redis.eval(`redis.call('HSET',KEYS[1],'connected','[]','createdAt',ARGV[1],'initialTtl',ARGV[2]); redis.call('EXPIRE',KEYS[1],ARGV[2]); return 1`,[`meta:${roomId}`],[Date.now(),seconds]);
  return {roomId};
 },{query:t.Object({ttl:t.Optional(t.String())})})
 .use(authMiddleware)
 .post("/join",async ({body,auth:{roomId,token},set})=>{
  const [count]=await roomPresence(roomId,token);
  if(count<0){set.status=401;return {error:"Room expired"};}
  await emitRoomEvent(roomId,"chat.join",body);
  return {success:true,others:count-1};
 },{body:UsernameBody,query:RoomIdQuery})
 .post("/leave",async ({body,auth:{roomId,token},query})=>{
  const [count]=await roomPresence(roomId,token,query.unload==="true"?"unload":"leave");
  if(query.unload!=="true") {
   if(count===0) await emitRoomEvent(roomId,"chat.destroy",{isDestroyed:true});
   else if(count>0) await emitRoomEvent(roomId,"chat.leave",body);
  }
  return {success:true};
 },{body:UsernameBody,query:t.Object({roomId:t.String(),unload:t.Optional(t.String())})})
 .get("/ttl",async ({auth:{roomId,token}})=>{
  const [count,ttl,initialTtl]=await roomPresence(roomId,token);
  return {ttl:count<0?0:ttl,initialTtl:initialTtl||900,others:Math.max(0,count-1)};
 },{query:RoomIdQuery})
 .delete("/",async ({auth:{roomId}})=>{
  await redis.del(`meta:${roomId}`,`presence:${roomId}`,`messages:${roomId}`,roomId);
  // The deletion has succeeded even when delivery to other tabs fails.
  after(async () => {
   await emitRoomEvent(roomId,"chat.destroy",{isDestroyed:true}).catch(() => {
    console.warn("Room deleted; realtime notification failed");
   });
  });
  return {success:true};
 },{query:RoomIdQuery});
const messages=new Elysia({prefix:"/messages"}).use(authMiddleware)
 .post("/",async ({body,auth:{roomId,token},set})=>{
  const message:Message={id:nanoid(),timestamp:Date.now(),roomId,...body};
  const accepted=await redis.eval<unknown[], number>(`
   if redis.call('EXISTS',KEYS[1])==0 then return 0 end
   local lease=redis.call('ZSCORE',KEYS[2],ARGV[1])
   if not lease or tonumber(lease)<=tonumber(ARGV[2]) then return 0 end
   if redis.call('LLEN',KEYS[3])>=1000 then return -1 end
   redis.call('RPUSH',KEYS[3],ARGV[3]); redis.call('PEXPIREAT',KEYS[3],tonumber(ARGV[2])+redis.call('PTTL',KEYS[1])); return 1
  `,[`meta:${roomId}`,`presence:${roomId}`,`messages:${roomId}`],[token,Date.now(),JSON.stringify({...message,token})]);
  if(accepted!==1){set.status=accepted===-1?429:401;return {error:accepted===-1?"Room message limit reached":"Room expired"};}
  await emitRoomEvent(roomId,"chat.message",message).catch(()=>{});
  return {id:message.id};
 },{query:RoomIdQuery,body:t.Object({sender:t.String({minLength:1,maxLength:100}),text:t.String({maxLength:7000,pattern:"^[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]+$"})})})
 .get("/",async ({auth:{roomId,token}})=>({messages:(await redis.lrange<Message>(`messages:${roomId}`,0,999)).map(m=>({...m,token:m.token===token?token:undefined}))}),{query:RoomIdQuery});
export const app=new Elysia({prefix:"/api"}).use(rooms).use(messages);
export const GET=app.fetch;
export const POST=app.fetch;
export const DELETE=app.fetch;
