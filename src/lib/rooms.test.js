import { test, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import RedisMock from 'ioredis-mock';
import { treaty } from '@elysia/eden';
import * as nextServer from 'next/server';
const afterJobs=[];
mock.module('next/server',()=>({...nextServer,after:job=>afterJobs.push(job)}));
const redis = new RedisMock();
let failEmits=false;
const adapter = {
 eval: (script,keys,args)=>failEmits && script.includes("PUBLISH") ? Promise.reject(new Error('Simulated notification failure')) : redis.eval("local cjson={encode=function() return '{}' end,decode=function() return {} end}\n"+script.replaceAll("redis.call('TIME')", "{'"+Math.floor(now/1000)+"','"+((now%1000)*1000)+"'}"),keys.length,...keys,...args),
 exists: key=>redis.exists(key),
 lrange: (...args)=>redis.lrange(...args),
};
mock.module('./redis',()=>({redis:adapter}));
const {roomPresence,isRoomMember}=await import('./rooms');
const {emitRoomEvent}=await import('./realtime');
let subscriptionMiddleware;
mock.module('@upstash/realtime',()=>({handle:config=>{subscriptionMiddleware=config.middleware;return()=>new Response();}}));
await import('../app/api/realtime/route');
const room='r'.repeat(21),A='a'.repeat(21),B='b'.repeat(21),C='c'.repeat(21);
const oldA='d'.repeat(21),newA='e'.repeat(21),sessionB='f'.repeat(21),sessionC='g'.repeat(21);
const actualNow=Date.now.bind(Date);
let now,clock;
beforeEach(async()=>{
 afterJobs.length=0;failEmits=false;
 now=actualNow();clock=spyOn(Date,'now').mockImplementation(()=>now);
 await redis.flushall();
 await redis.hset('meta:'+room,'createdAt',now,'initialTtl',900);
 await redis.expire('meta:'+room,900);
});
afterEach(()=>clock.mockRestore());
const admit=(token,connection)=>roomPresence(room,token,'admit',connection);
const member=(token,connection)=>isRoomMember(room,token,connection);
const {app: roomApp}=await import('../app/api/[[...slugs]]/route');
function api(token,connection){
 return treaty('http://localhost',{headers:{cookie:'x-auth-token='+token,'x-room-connection':connection},fetcher:(url,init)=>roomApp.fetch(new Request(url,init))}).api;
}

test('three simultaneous admissions produce exactly two members',async()=>{
 const results=await Promise.all([[A,oldA],[B,sessionB],[C,sessionC]].map(([token,connection])=>admit(token,connection)));
 expect(results.filter(r=>r[0]>0)).toHaveLength(2);expect(results.filter(r=>r[0]===-2)).toHaveLength(1);
 expect(await redis.zcard('presence:'+room)).toBe(2);
 expect(await member(A,oldA)).toBe(true);expect(await member(C,sessionC)).toBe(false);
});

test('refresh before ten seconds keeps both places, messages and original room deadline',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 await redis.rpush('messages:'+room,'encrypted-history');
 await roomPresence(room,A,'unload',oldA);
 now+=9000;await roomPresence(room,B,'renew',sessionB);
 const result=await admit(A,newA);
 expect(result[0]).toBe(2);expect(result[1]).toBe(891);expect(result[2]).toBe(900);
 expect(await member(A,newA)).toBe(true);expect(await member(A,oldA)).toBe(false);
 expect(await redis.lrange('messages:'+room,0,-1)).toEqual(['encrypted-history']);
 expect((await admit(C,sessionC))[0]).toBe(-2);
});

test('a delayed unload, leave or heartbeat from the old document cannot affect the refreshed one',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 now+=1000;await admit(A,newA);
 const lease=await redis.zscore('presence:'+room,A);
 for(const mode of ['unload','leave','renew'])expect((await roomPresence(room,A,mode,oldA))[0]).toBe(-3);
 expect(await redis.zscore('presence:'+room,A)).toBe(lease);
 expect(await member(A,newA)).toBe(true);expect(await member(B,sessionB)).toBe(true);
});

test('an unload cannot be undone or prolonged by already in-flight requests of the same document',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 await roomPresence(room,A,'unload',oldA);
 now+=9000;await roomPresence(room,B,'renew',sessionB);
 expect((await roomPresence(room,A,'renew',oldA))[0]).toBe(-3);
 expect((await roomPresence(room,A,'unload',oldA))[0]).toBe(-3);
 now+=1000;
 expect((await admit(C,sessionC))[0]).toBe(2);
 expect(await member(A,oldA)).toBe(false);expect(await member(C,sessionC)).toBe(true);
});

test('the place remains reserved until ten seconds and is reusable at exactly ten seconds',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 await roomPresence(room,A,'unload',oldA);
 now+=9999;await roomPresence(room,B,'renew',sessionB);
 expect((await admit(C,sessionC))[0]).toBe(-2);
 now+=1;
 expect((await admit(C,sessionC))[0]).toBe(2);
 expect(await member(B,sessionB)).toBe(true);expect(await member(C,sessionC)).toBe(true);
 expect((await admit(A,newA))[0]).toBe(-2);
});

test('a lost pagehide or crashed tab also releases its unrenewed place after ten seconds',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 now+=9000;await roomPresence(room,B,'renew',sessionB);
 now+=1000;
 expect((await admit(C,sessionC))[0]).toBe(2);
 expect(await member(A,oldA)).toBe(false);expect(await member(B,sessionB)).toBe(true);
});

test('repeated refreshes never accumulate slots or allow an earlier generation to renew',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 for(const connection of [newA,oldA,newA]){
  now+=1000;expect((await admit(A,connection))[0]).toBe(2);
  expect(await member(A,connection)).toBe(true);expect(await redis.zcard('presence:'+room)).toBe(2);
 }
});

test('explicit leave frees one slot immediately and preserves the participant who stays',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 await Promise.all([roomPresence(room,A,'leave',oldA),admit(C,sessionC)]);
 expect(await member(B,sessionB)).toBe(true);expect(await member(A,oldA)).toBe(false);expect(await member(C,sessionC)).toBe(true);
});

test('the last departure expires every room key after the grace period',async()=>{
 await admit(A,oldA);
 await redis.rpush('messages:'+room,'fixture');await emitRoomEvent(room,'chat.join',{username:'Fixture'});
 await roomPresence(room,A,'unload',oldA);
 for(const key of ['meta:'+room,'presence:'+room,'connections:'+room,'messages:'+room,room]){
  expect(await redis.pttl(key)).toBeGreaterThan(0);expect(await redis.pttl(key)).toBeLessThanOrEqual(10000);
 }
 now+=10001;
 expect((await roomPresence(room,A,'renew',oldA))[0]).toBe(-1);
 for(const key of ['meta:'+room,'presence:'+room,'connections:'+room,'messages:'+room,room])expect(await redis.exists(key)).toBe(0);
});

test('no connection lease can outlive the original room deadline',async()=>{
 await admit(A,oldA);await redis.hset('meta:'+room,'createdAt',now-899000);
 await roomPresence(room,A,'renew',oldA);
 expect(await redis.pttl('meta:'+room)).toBeLessThanOrEqual(1000);
 now+=1000;expect((await admit(A,newA))[0]).toBe(-1);
});

test('old HTTP requests are rejected after a refresh, while the new document stays usable',async()=>{
 await admit(A,oldA);await admit(B,sessionB);await admit(A,newA);
 const oldClient=api(A,oldA),newClient=api(A,newA);
 expect((await oldClient.room.leave.post({username:'Fixture'},{query:{roomId:room,unload:'true'}})).status).toBe(401);
 expect((await oldClient.room.ttl.get({query:{roomId:room}})).status).toBe(401);
 expect((await oldClient.room.delete(null,{query:{roomId:room}})).status).toBe(401);
 expect((await newClient.room.ttl.get({query:{roomId:room}})).status).toBe(200);
 expect(await member(A,newA)).toBe(true);
});

test('pagehide beacon authenticates its generation from the query without a custom header',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 const {app}=await import('../app/api/[[...slugs]]/route');
 const response=await app.fetch(new Request('http://localhost/api/room/leave?roomId='+room+'&unload=true&connectionId='+oldA,{method:'POST',headers:{cookie:'x-auth-token='+A,'content-type':'application/json'},body:JSON.stringify({username:'Fixture'})}));
 expect(response.status).toBe(200);expect(await member(A,oldA)).toBe(false);expect(await member(B,sessionB)).toBe(true);
 now+=9000;await roomPresence(room,B,'renew',sessionB);now+=1000;
 expect((await admit(C,sessionC))[0]).toBe(2);
});

test('a completed deletion succeeds even when realtime delivery fails',async()=>{
 await admit(A,oldA);failEmits=true;
 const client=api(A,oldA);expect((await client.room.delete(null,{query:{roomId:room}})).status).toBe(200);
 expect(afterJobs).toHaveLength(1);
 const warn=spyOn(console,'warn').mockImplementation(()=>{});
 try{await afterJobs[0]();}finally{warn.mockRestore();}
 for(const key of [room,'meta:'+room,'presence:'+room,'messages:'+room,'connections:'+room])expect(await redis.exists(key)).toBe(0);
});

test('atomic realtime emission expires its stream and destruction never recreates one',async()=>{
 await admit(A,oldA);await emitRoomEvent(room,'chat.join',{username:'Fixture'});
 expect(await redis.xlen(room)).toBe(1);expect(await redis.pttl(room)).toBeGreaterThan(0);
 await redis.rpush('messages:'+room,'fixture');await roomPresence(room,A,'leave',oldA);
 await emitRoomEvent(room,'chat.destroy',{isDestroyed:true});
 for(const key of [room,'meta:'+room,'presence:'+room,'messages:'+room,'connections:'+room])expect(await redis.exists(key)).toBe(0);
});

test('realtime rejects old generations and unauthorized or mixed-channel subscriptions',async()=>{
 await admit(A,oldA);await admit(A,newA);
 const request=(token,connection)=>new Request('http://localhost/api/realtime/'+connection+'?channel='+room,{headers:token?{cookie:'x-auth-token='+token}:{}});
 expect((await subscriptionMiddleware({request:request(null,newA),channels:[room]})).status).toBe(401);
 expect((await subscriptionMiddleware({request:request(B,sessionB),channels:[room]})).status).toBe(401);
 expect((await subscriptionMiddleware({request:request(A,oldA),channels:[room]})).status).toBe(401);
 expect((await subscriptionMiddleware({request:request(A,newA),channels:[room,'other']})).status).toBe(401);
 expect(await subscriptionMiddleware({request:request(A,newA),channels:[room]})).toBeUndefined();
});

test('malformed and missing generation credentials fail closed',async()=>{
 expect((await admit(A,'invalid'))[0]).toBe(-1);expect((await roomPresence('invalid',A,'admit',oldA))[0]).toBe(-1);
 await admit(A,oldA);expect(await isRoomMember(room,A)).toBe(false);expect(await member(A,'invalid')).toBe(false);
});


test('Proxy preserves the auth cookie on refresh and replaces only the document generation',async()=>{
 const {NextRequest}=await import('next/server');const {proxy}=await import('../proxy');
 const request=()=>new NextRequest('http://localhost/room/'+room,{headers:{cookie:'x-auth-token='+A,'x-room-connection':oldA}});
 const first=await proxy(request());const firstGeneration=await redis.hget('connections:'+room,A);
 expect(first.status).toBe(200);expect(first.cookies.get('x-auth-token').value).toBe(A);
 expect(firstGeneration).toMatch(/^[\w-]{21}$/);expect(firstGeneration).not.toBe(oldA);
 await roomPresence(room,A,'unload',firstGeneration);now+=1000;
 const second=await proxy(request());const secondGeneration=await redis.hget('connections:'+room,A);
 expect(second.cookies.get('x-auth-token').value).toBe(A);expect(secondGeneration).not.toBe(firstGeneration);
 expect((await roomPresence(room,A,'unload',firstGeneration))[0]).toBe(-3);
 expect(await member(A,secondGeneration)).toBe(true);expect(await redis.zcard('presence:'+room)).toBe(1);
});


test('application clock skew cannot expire a connection lease early',async()=>{
 clock.mockImplementation(()=>now-12000);
 await admit(A,oldA);expect(await member(A,oldA)).toBe(true);
 expect(Number(await redis.zscore('presence:'+room,A))).toBe(now+10000);
 expect((await roomPresence(room,A,'renew',oldA))[1]).toBe(900);
 clock.mockImplementation(()=>now-60000);
 expect(await member(A,oldA)).toBe(true);
 expect((await admit(A,newA))[0]).toBe(1);
 expect(Number(await redis.zscore('presence:'+room,A))).toBe(now+10000);
});


test('a confirmed disconnect frees the slot and emits exactly one leave event with no page timer',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 await roomPresence(room,A,'renew',oldA,'Fixture A');await roomPresence(room,B,'renew',sessionB,'Fixture B');
 await roomPresence(room,A,'unload',oldA);
 now+=9000;await roomPresence(room,B,'renew',sessionB);
 expect(await redis.xlen(room)).toBe(0);
 now+=1000;await roomPresence(room,B,'renew',sessionB);
 const events=await redis.xrange(room,'-','+');
 expect(events).toHaveLength(1);expect(events[0][1]).toContain('chat.leave');
 expect(await redis.hget('connections:'+room,A+':username')).toBeNull();
 await roomPresence(room,B,'renew',sessionB);expect(await redis.xlen(room)).toBe(1);
 expect((await admit(C,sessionC))[0]).toBe(2);
 expect(await redis.pttl(room)).toBeGreaterThan(0);
});

test('refresh preserves the participant identity and emits neither a leave nor a new join',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 expect((await roomPresence(room,A,'renew',oldA,'Fixture A'))[3]).toBe(1);
 await roomPresence(room,A,'unload',oldA);now+=5000;
 await admit(A,newA);
 expect((await roomPresence(room,A,'renew',newA,'Fixture A'))[3]).toBe(0);
 expect(await redis.hget('connections:'+room,A+':username')).toBe('Fixture A');
 expect(await redis.xlen(room)).toBe(0);
});

test('a lost pagehide still announces the expired participant by name',async()=>{
 await admit(A,oldA);await admit(B,sessionB);
 await roomPresence(room,A,'renew',oldA,'Fixture A');
 now+=9000;await roomPresence(room,B,'renew',sessionB);now+=1000;
 await admit(C,sessionC);
 expect((await redis.xrange(room,'-','+'))[0][1]).toContain('chat.leave');
});
