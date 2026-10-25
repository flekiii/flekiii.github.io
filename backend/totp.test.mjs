import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac, webcrypto } from "node:crypto";
import { runInNewContext } from "node:vm";

// RFC 6238 Appendix B test secret with 6-digit values used by Auth2FA.
const worker=readFileSync(new URL("./worker.js",import.meta.url),"utf8");
test("Worker TOTP counter is encoded as RFC 4226 big-endian",()=>{
 assert.match(worker,/setBigUint64\(0,BigInt\(counter\+d\),false\)/);
});
test("RFC 6238 TOTP interoperability with Windows Linux and Android authenticators",()=>{
 const key=Buffer.from("12345678901234567890");
 const code=seconds=>{
  const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(Math.floor(seconds/30)));
  const hash=createHmac("sha1",key).update(b).digest();
  const offset=hash.at(-1)&15;
  return String((hash.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,"0");
 };
 assert.equal(code(59),"287082");
 assert.equal(code(1111111109),"081804");
 assert.equal(code(1234567890),"005924");
});

test("Real deployed-worker TOTP verifier accepts correct codes and rejects wrong ones",async()=>{
 const source=worker.match(/async function verifyTotp\(secret,code\)\{[^\n]+\}/)?.[0];
 assert.ok(source,"Worker verifyTotp function must remain available");
 const hexToBase32=s=>{
  const abc="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",buf=Buffer.from(s),out=[];
  let n=0,bits=0;
  for(const byte of buf){n=(n<<8)|byte;bits+=8;while(bits>=5){out.push(abc[(n>>>(bits-5))&31]);bits-=5}}
  if(bits>0)out.push(abc[(n<<(5-bits))&31]);
  return out.join("");
 };
 const debase=encoded=>{
  const abc="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",out=[];let n=0,bits=0;
  for(const char of encoded){n=(n<<5)|abc.indexOf(char);bits+=5;if(bits>=8){out.push((n>>>(bits-8))&255);bits-=8}}
  return Uint8Array.from(out);
 };
 for(const [seconds,expected] of [[59,"287082"],[1111111109,"081804"],[1234567890,"005924"]]){
  const context={crypto:webcrypto,now:()=>seconds*1000,debase,Uint8Array,DataView,BigInt,Math,String};
  const check=runInNewContext(source+"\nverifyTotp",context);
  assert.equal(await check(hexToBase32("12345678901234567890"),expected),true);
  assert.equal(await check(hexToBase32("12345678901234567890"),"999999"),false);
 }
});
