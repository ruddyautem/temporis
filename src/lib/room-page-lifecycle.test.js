import { test, expect } from 'bun:test';
import { watchRoomPageLifecycle } from './room-page-lifecycle';

test('cancelled navigation and effect cleanup never disconnect a room',()=>{
 const target=new EventTarget();let departures=0;
 const stop=watchRoomPageLifecycle(()=>departures++,()=>{},target);
 target.dispatchEvent(new Event('beforeunload'));expect(departures).toBe(0);
 stop();expect(departures).toBe(0);target.dispatchEvent(new Event('pagehide'));expect(departures).toBe(0);
});
test('refresh and tab close announce departure exactly once',()=>{
 const target=new EventTarget();let departures=0;
 const stop=watchRoomPageLifecycle(()=>departures++,()=>{},target);
 target.dispatchEvent(new Event('pagehide'));target.dispatchEvent(new Event('pagehide'));
 expect(departures).toBe(1);stop();
});
test('restoring a BFCache document requests a fresh generation',()=>{
 const target=new EventTarget();let restores=0;
 const stop=watchRoomPageLifecycle(()=>{},()=>restores++,target);
 target.dispatchEvent(new Event('pageshow'));expect(restores).toBe(0);
 const restored=new Event('pageshow');Object.defineProperty(restored,'persisted',{value:true});target.dispatchEvent(restored);
 expect(restores).toBe(1);stop();
});
