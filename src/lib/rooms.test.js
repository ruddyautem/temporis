import { test, expect, mock, beforeEach } from 'bun:test';
import RedisMock from 'ioredis-mock';
import { treaty } from '@elysia/eden';
import * as nextServer from 'next/server';
const afterJobs=[];
mock.module('next/server',()=>({...nextServer,after:job=>afterJobs.push(job)}));
const redis = new RedisMock();
let failEmits=false;
const adapter = {
 // ioredis-mock runs Lua but omits Redis' cjson library. Serialization is
 // irrelevant to the membership/expiry assertions and is stubbed here only.
 eval: (script,keys,args)=>failEmits && script.includes("PUBLISH") ? Promise.reject(new Error('Simulated notification failure')) : redis.eval("local cjson={encode=function() return '{}' end,decode=function() return {} end}\n"+script,keys.length,...keys,...args),
 exists: key=>redis.exists(key), zscore:(key,token)=>redis.zscore(key,token),
 del: (...keys)=>redis.del(...keys),
};
mock.module('./redis',()=>({redis:adapter}));
const {roomPresence,isRoomMember}=await import('./rooms');
const {emitRoomEvent}=await import('./realtime');
let subscriptionMiddleware;
mock.module('@upstash/realtime',()=>({handle:config=>{subscriptionMiddleware=config.middleware;return()=>new Response();}}));
await import('../app/api/realtime/route');
const room='r'.repeat(21),A='a'.repeat(21),B='b'.repeat(21),C='c'.repeat(21);
beforeEach(async()=>{
 afterJobs.length=0;
 failEmits=false;
 await redis.flushall();
 await redis.hset('meta:'+room,'createdAt',Date.now(),'initialTtl',900,'connected','[]');
 await redis.expire('meta:'+room,900);
});
test('a realtime delivery failure cannot turn a completed deletion into an API error',async()=>{
 await roomPresence(room,A,'admit');
 failEmits=true;
 const {app}=await import('../app/api/[[...slugs]]/route');
 const client=treaty('http://localhost',{headers:{cookie:'x-auth-token='+A},fetcher:(url,init)=>app.fetch(new Request(url,init))}).api;
 const response=await client.room.delete(null,{query:{roomId:room}});
 expect(response.status).toBe(200);expect(await redis.exists('meta:'+room)).toBe(0);
 const originalWarn=console.warn;
 console.warn=()=>{};
 try{await afterJobs[0]();}finally{console.warn=originalWarn;}
 expect(await redis.exists(room)).toBe(0);
});
test('three simultaneous admissions produce exactly two members',async()=>{
 const results=await Promise.all([A,B,C].map(token=>roomPresence(room,token,'admit')));
 expect(results.filter(r=>r[0]>0)).toHaveLength(2);expect(results.filter(r=>r[0]===-2)).toHaveLength(1);
 expect(await redis.zcard('presence:'+room)).toBe(2);
 expect(await isRoomMember(room,A)).toBe(true);expect(await isRoomMember(room,C)).toBe(false);
});
test('leave and join do not overwrite the participant that stays',async()=>{
 await roomPresence(room,A,'admit');await roomPresence(room,B,'admit');
 await Promise.all([roomPresence(room,A,'leave'),roomPresence(room,C,'admit')]);
 expect(await isRoomMember(room,B)).toBe(true);expect(await isRoomMember(room,A)).toBe(false);expect(await isRoomMember(room,C)).toBe(true);
});
test('unload uses Redis expiry, refresh renews it, and no key can outlive the room deadline',async()=>{
 await roomPresence(room,A,'admit');await roomPresence(room,A,'unload');
 const short=await redis.pttl('meta:'+room);expect(short).toBeGreaterThan(0);expect(short).toBeLessThanOrEqual(10000);
 await roomPresence(room,A,'admit');expect(await redis.pttl('meta:'+room)).toBeGreaterThan(10000);
 await redis.hset('meta:'+room,'createdAt',Date.now()-899000);
 await roomPresence(room,A);expect(await redis.pttl('meta:'+room)).toBeLessThanOrEqual(1000);
});
test('atomic realtime emission expires its stream and destruction never recreates one',async()=>{
 await roomPresence(room,A,'admit');
 await emitRoomEvent(room,'chat.join',{username:'Fixture'});
 expect(await redis.xlen(room)).toBe(1);expect(await redis.pttl(room)).toBeGreaterThan(0);
 await redis.rpush('messages:'+room,'fixture');await roomPresence(room,A,'leave');
 await emitRoomEvent(room,'chat.destroy',{isDestroyed:true});
 for(const key of [room,'meta:'+room,'presence:'+room,'messages:'+room]) expect(await redis.exists(key)).toBe(0);
});
test('unknown, expired and malformed room memberships fail closed',async()=>{
 expect(await isRoomMember(room,A)).toBe(false);expect((await roomPresence('invalid',A,'admit'))[0]).toBe(-1);
 await redis.hset('meta:'+room,'createdAt',Date.now()-1000000);
 expect((await roomPresence(room,A,'admit'))[0]).toBe(-1);expect(await redis.exists('meta:'+room)).toBe(0);
});
test('realtime rejects anonymous, nonmember, expired and mixed-channel subscriptions',async()=>{
 await roomPresence(room,A,'admit');
 const request=token=>new Request('http://localhost/api/realtime',{headers:token?{cookie:'x-auth-token='+token}:{}});
 expect((await subscriptionMiddleware({request:request(),channels:[room]})).status).toBe(401);
 expect((await subscriptionMiddleware({request:request(B),channels:[room]})).status).toBe(401);
 expect((await subscriptionMiddleware({request:request(A),channels:[room,'other']})).status).toBe(401);
 expect(await subscriptionMiddleware({request:request(A),channels:[room]})).toBeUndefined();
 await redis.del('meta:'+room);
 expect((await subscriptionMiddleware({request:request(A),channels:[room]})).status).toBe(401);
});
test('the browser DELETE request reaches the authenticated room deletion route',async()=>{
 await roomPresence(room,A,'admit');
 const {app}=await import('../app/api/[[...slugs]]/route');
 const client=treaty('http://localhost',{headers:{cookie:'x-auth-token='+A},fetcher:(url,init)=>app.fetch(new Request(url,init))}).api;
 const response=await client.room.delete(null,{query:{roomId:room}});
 expect({status:response.status,error:response.error?.value}).toEqual({status:200,error:undefined});
 expect(await redis.exists('meta:'+room)).toBe(0);
 expect(afterJobs).toHaveLength(1);
 await afterJobs[0]();
 expect(await redis.exists(room)).toBe(0);
});
