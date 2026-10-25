import test from "node:test";
import assert from "node:assert/strict";
import { marketHandle } from "./marketplace.js";
const fakeDB={prepare(){throw Error("DB must not be touched for unauthenticated marketplace writes")}};
const emptyReq=(path,method="POST")=>new Request("https://flekis-wrld-api.flekideveloper.workers.dev"+path,{method,headers:{"Content-Type":"application/json"},body:method==="GET"?undefined:"{}"});
test("Unauthenticated users cannot post marketplace listings or contact sellers",async()=>{
 for(const path of ["/market/listings","/market/messages"]){
  const res=await marketHandle(emptyReq(path),{DB:fakeDB},path,{auth:async()=>null,authorized:()=>false});
  assert.equal(res.status,401);
 }
});
test("Logged in but unverified users cannot sell or message",async()=>{
 for(const path of ["/market/listings","/market/messages"]){
  const res=await marketHandle(emptyReq(path),{DB:fakeDB},path,{auth:async()=>({id:"u"}) ,authorized:()=>false});
  assert.equal(res.status,403);
 }
});
test("Unrelated routes pass through to the existing community API",async()=>{
 assert.equal(await marketHandle(emptyReq("/health","GET"),{DB:fakeDB},"/health",{auth:async()=>null,authorized:()=>false}),null);
});
