import { test, expect } from 'bun:test';
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
