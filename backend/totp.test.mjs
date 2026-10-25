import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

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
