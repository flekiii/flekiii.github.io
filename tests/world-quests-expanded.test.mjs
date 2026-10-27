import test from "node:test";
import assert from "node:assert/strict";
import {metrics,QUESTS,questHandle} from "../backend/world-quests.js";
const user={id:"11111111-1111-4111-8111-111111111111"};
function mockDb(counts={}){
 const claims=new Set(),writes=[];
 return {claims,writes,prepare(sql){
  let args=[];
  const statement={
   bind(...params){args=params;return statement},
   async first(){const metric=metrics.find(m=>m.query===sql);return {n:metric?counts[metric.id]||0:0}},
   async all(){return {results:[]}},
   async run(){writes.push({sql,args});if(sql.includes("INSERT OR IGNORE INTO wrld_world_quest_claims")){const k=args.slice(0,3).join(":");if(claims.has(k))return {meta:{changes:0}};claims.add(k)}return {meta:{changes:1}}}
  };return statement;
 }};
}
test("137 unique milestone quests require persisted world or arcade actions",()=>{
 assert.equal(metrics.length,14);
 assert.equal(QUESTS.length,137);
 assert.equal(new Set(QUESTS.map(q=>q.id)).size,137);
 assert.deepEqual(QUESTS.filter(q=>q.metric==="clubs-created").map(q=>q.required),[1,2,3]);
 assert.deepEqual(QUESTS.filter(q=>q.metric==="math-multiply-today").map(q=>q.required).slice(1),[1,2,3,4,5,6,8]);
 for(const q of QUESTS){assert.ok(q.required>=1);assert.ok(q.xp>0&&q.xp<=40);assert.ok(["daily","once"].includes(q.period));assert.ok(metrics.some(m=>m.id===q.metric))}
 assert.ok(metrics.every(m=>m.query.startsWith("SELECT COUNT(*) n FROM wrld_")));
});
test("Progress is calculated from stored D1 events, not completion booleans",async()=>{
 const state=mockDb({"posts-today":2,posts:9,likes:6});
 const response=await questHandle(new Request("https://example.com/world/quests"),state,user);
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.total,137);
 assert.equal(payload.quests.length,137);
 assert.equal(payload.quests.find(q=>q.id==="share-post").complete,true);
 assert.equal(payload.quests.find(q=>q.id==="posts-8").complete,true);
 assert.equal(payload.quests.find(q=>q.id==="posts-12").complete,false);
 assert.equal(payload.quests.find(q=>q.id==="posts-12").current,9);
 assert.equal(state.writes.length,0);
});
test("Claim is single-use even if identical reward is sent again",async()=>{
 const state=mockDb({"posts-today":1});
 const request=()=>new Request("https://example.com/world/quest/claim",{method:"POST",body:JSON.stringify({id:"share-post"})});
 const a=await questHandle(request(),state,user);
 assert.equal(a.status,200);assert.equal((await a.json()).xp,30);
 const b=await questHandle(request(),state,user);
 assert.equal(b.status,409);
 assert.equal(state.writes.filter(x=>x.sql.includes("INSERT INTO wrld_world_xp")).length,1);
});
test("Unfinished or unknown goals cannot be forced into claimed state",async()=>{
 const state=mockDb(),send=x=>new Request("https://example.com/world/quest/claim",{method:"POST",body:JSON.stringify(x)});
 assert.equal((await questHandle(send({id:"posts-75"}),state,user)).status,409);
 assert.equal((await questHandle(send({id:"fake"}),state,user)).status,400);
 assert.equal((await questHandle(send({complete:true,xp:99999}),state,user)).status,400);
 assert.equal(state.writes.length,0);
});
