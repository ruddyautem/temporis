import { test, expect } from 'bun:test';
import { generateRoomKey, encryptText, decryptText } from './crypto';
test('UTF-8 plaintext up to 5000 bytes fits the encrypted API contract and round-trips',async()=>{
 const previous=globalThis.window;globalThis.window={crypto:globalThis.crypto,btoa,atob};
 try{
  const key=await generateRoomKey();
  for(const text of ['x'.repeat(5000),'é'.repeat(2500),'🙂'.repeat(1250)]){
   const encrypted=await encryptText(text,key);
   expect(encrypted.length).toBeLessThanOrEqual(7000);expect(encrypted).toMatch(/^[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]+$/);
   expect(await decryptText(encrypted,key)).toBe(text);expect(await encryptText(text,key)).not.toBe(encrypted);
  }
 }finally{globalThis.window=previous;}
});
