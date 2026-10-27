import { test, expect } from 'bun:test';
import { copyRoomInviteLink } from './invite-link';

test('copies the join URL with its encryption fragment before recording success',async()=>{
 const writes=[];const stored=[];
 const result=await copyRoomInviteLink('fixture','#key=secret',{origin:'https://temporis.example',clipboard:{writeText:async text=>writes.push(text)},storage:{setItem:(...entry)=>stored.push(entry)}});
 expect(result).toBe(true);expect(writes).toEqual(['https://temporis.example/join/fixture#key=secret']);expect(stored).toEqual([['temporis_invite_copied_fixture','true']]);
});
test('clipboard failure never claims that the link was copied',async()=>{
 const stored=[];
 expect(await copyRoomInviteLink('fixture','#key=secret',{origin:'https://temporis.example',clipboard:{writeText:async()=>{throw new Error('Denied');}},storage:{setItem:(...entry)=>stored.push(entry)}})).toBe(false);
 expect(stored).toEqual([]);
});
test('success is recorded only after the clipboard write completes',async()=>{
 let finish;const stored=[];
 const copying=copyRoomInviteLink('fixture','#key=secret',{origin:'https://temporis.example',clipboard:{writeText:()=>new Promise(resolve=>{finish=resolve;})},storage:{setItem:(...entry)=>stored.push(entry)}});
 expect(stored).toEqual([]);finish();expect(await copying).toBe(true);expect(stored).toHaveLength(1);
});
test('unavailable session storage does not turn a successful copy into a failure',async()=>{
 expect(await copyRoomInviteLink('fixture','#key=secret',{origin:'https://temporis.example',clipboard:{writeText:async()=>{}},storage:{setItem:()=>{throw new Error('Unavailable');}}})).toBe(true);
});
