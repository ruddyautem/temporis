import { test, expect, spyOn } from 'bun:test';
import { authorizedStream } from './authorized-stream';
const event=value=>new TextEncoder().encode('data: '+JSON.stringify(value)+'\n\n');
test('an existing subscription receives no more messages after membership is revoked',async()=>{
 let member=true,cancelled=false;
 const source=new ReadableStream({start(c){c.enqueue(event({event:'chat.message',data:{text:'first'}}));c.enqueue(event({event:'chat.message',data:{text:'secret-after-leave'}}));},cancel(){cancelled=true;}});
 const reader=authorizedStream(source,async()=>member).getReader();
 expect(new TextDecoder().decode((await reader.read()).value)).toContain('first');
 member=false;expect((await reader.read()).done).toBe(true);expect(cancelled).toBe(true);
});
test('the final destruction notification can still reach the room after its metadata is deleted',async()=>{
 const source=new ReadableStream({start(c){c.enqueue(event({event:'chat.destroy',data:{isDestroyed:true}}));c.close();}});
 const reader=authorizedStream(source,async()=>false).getReader();
 expect(new TextDecoder().decode((await reader.read()).value)).toContain('chat.destroy');expect((await reader.read()).done).toBe(true);
});


test('a live stream renews its lease without browser timers and stops when its generation is revoked',async()=>{
 let tick,cancelled=false,renewals=0,allowed=true;
 const set=spyOn(globalThis,'setInterval').mockImplementation(fn=>{tick=fn;return 123;});
 const clear=spyOn(globalThis,'clearInterval').mockImplementation(()=>{});
 try {
  const source=new ReadableStream({cancel(){cancelled=true;}});
  const reader=authorizedStream(source,async()=>true,async()=>{renewals++;return allowed;}).getReader();
  await tick();expect(renewals).toBe(1);expect(cancelled).toBe(false);
  allowed=false;const done=reader.read();await tick();expect((await done).done).toBe(true);
  expect(cancelled).toBe(true);expect(clear).toHaveBeenCalledWith(123);
  await tick();expect(renewals).toBe(2);
 }finally{set.mockRestore();clear.mockRestore();}
});

test('cancelling a realtime response stops its server heartbeat',async()=>{
 let tick,renewals=0;
 const set=spyOn(globalThis,'setInterval').mockImplementation(fn=>{tick=fn;return 124;});
 const clear=spyOn(globalThis,'clearInterval').mockImplementation(()=>{});
 try {
  const source=new ReadableStream();const reader=authorizedStream(source,async()=>true,async()=>{renewals++;return true;}).getReader();
  await reader.cancel();await tick();expect(renewals).toBe(0);expect(clear).toHaveBeenCalledWith(124);
 }finally{set.mockRestore();clear.mockRestore();}
});
