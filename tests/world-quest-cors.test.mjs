import test from "node:test";
import assert from "node:assert/strict";
import {worldHandle} from "../backend/world.js";

const origin="https://flekiii.github.io";
const user={id:"00000000-1111-4222-8333-444444444444",username:"quest-tester"};
function mockDB(){
 const statements=[];
 return {
  statements,
  prepare(sql){
   const params=[];
   return {
    bind(...values){params.push(...values);return this},
    async first(){
     if(sql.includes("FROM wrld_world_quest_claims"))return null;
     if(sql.includes("FROM wrld_world_posts"))return {n:1};
     return {n:0};
    },
    async run(){statements.push({sql,params});return {success:true,meta:{changes:1}}}
   };
  }
 };
}
const handlers={auth:async()=>user,authorized:()=>true};
async function request(db,path,method="GET",data){
 return worldHandle(new Request("https://flekis-wrld-api.flekideveloper.workers.dev"+path,{
  method,headers:{Origin:origin,Authorization:"Bearer test",...(data?{"Content-Type":"application/json"}:{})},
  ...(data?{body:JSON.stringify(data)}:{})
 }),{DB:db},path,handlers);
}
function assertBrowserReadable(response){
 assert.equal(response.headers.get("Access-Control-Allow-Origin"),origin);
 assert.match(response.headers.get("Content-Type")||"",/application\/json/);
 assert.match(response.headers.get("Cache-Control")||"",/no-store/);
}
test("Quest list is readable cross-origin by logged-in browser instead of a NetworkError",async()=>{
 const db=mockDB(),response=await request(db,"/world/quests");
 assert.equal(response.status,200);
 assertBrowserReadable(response);
 const result=await response.json();
 assert.ok(result.quests.length>=5);
 assert.equal(result.quests.find(x=>x.id==="share-post").complete,true);
});
test("Claiming earned XP has the same CORS headers as the list",async()=>{
 const db=mockDB(),response=await request(db,"/world/quest/claim","POST",{id:"share-post"});
 assert.equal(response.status,200);
 assertBrowserReadable(response);
 assert.deepEqual(await response.json(),{ok:true,xp:30});
 assert.ok(db.statements.some(x=>x.sql.includes("INSERT OR IGNORE INTO wrld_world_quest_claims")));
 assert.ok(db.statements.some(x=>x.sql.includes("INSERT INTO wrld_world_xp")));
});
test("Quest errors also have CORS headers for meaningful in-page messages",async()=>{
 const db=mockDB(),response=await request(db,"/world/quest/claim","POST",{id:"missing"});
 assert.equal(response.status,400);
 assertBrowserReadable(response);
 assert.match((await response.json()).error,/Unknown quest/);
});
