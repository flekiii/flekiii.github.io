import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {worldHandle} from "../backend/world.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),worker=read("backend/worker.js"),app=read("wrld-world.mjs");
test("World navigation loads real feature modules",()=>{
 assert.match(html,/id:"world",name:"World"/);
 assert.match(html,/wrld-world-root/);
 assert.match(html,/wrld-world\.mjs\?v=5/);
 assert.match(worker,/worldHandle\(req,env,path/);
 for(const endpoint of ["/world/feed","/world/clubs","/world/progress","/world/quests"])assert.ok(app.includes(endpoint),endpoint);
});
test("Guests can browse public feed and clubs, but cannot write",async()=>{
 const db={prepare(sql){return {bind(){return this},async run(){return {success:true}},async all(){return {results:[]}},async first(){return {n:0}}}}};
 const env={DB:db},auth={auth:async()=>null,authorized:()=>false};
 for(const path of ["/world/feed","/world/clubs"]){
  const r=await worldHandle(new Request("https://world.invalid"+path),env,path,auth);
  assert.equal(r.status,200,path);
 }
 const p="/world/post",r=await worldHandle(new Request("https://world.invalid"+p,{method:"POST",body:JSON.stringify({body:"Hello world"})}),env,p,auth);
 assert.equal(r.status,403);
});
test("Experience comes only from capped server-side events",()=>{
 const src=read("backend/world.js");
 assert.match(src,/SELECT COUNT\(\*\) n FROM wrld_world_xp/);
 assert.match(src,/if\(n\?\.n>=limit\)return/);
 assert.doesNotMatch(app,/world\/xp[^a-z]/);
 assert.match(src,/authorized\(user\)/);
});
