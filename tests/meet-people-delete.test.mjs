import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const serverSource=readFileSync(new URL("../backend/discover.js",import.meta.url),"utf8");
const {discoverHandle}=await import("data:text/javascript;base64,"+Buffer.from(serverSource).toString("base64"));
const ID="123e4567-e89b-42d3-a456-426614174000";

function makeDb(){
 const batches=[];
 const db={
  prepare(sql){return {bind(...params){return {sql,params,
   async first(){if(sql.startsWith("SELECT age,interests,discoverable FROM wrld_profile_extras"))return {age:15,interests:"[]",discoverable:1};return null},
   async run(){return {success:true}},
   async all(){return {results:[]}}
  }}}},
  async batch(commands){batches.push(commands.map(q=>({sql:q.sql,params:q.params})));return []}
 };
 return {db,batches};
}
const handle=(db,mode,auth=async()=>({id:ID,username:"member"}))=>
 discoverHandle(new Request("https://example.com/discover/card?mode="+encodeURIComponent(mode),{method:"DELETE"}),{DB:db},"/discover/card",{auth});

test("Deleting friends questionnaire removes only that card and photo plus friends opt-in",async()=>{
 const {db,batches}=makeDb();
 const response=await handle(db,"friends");
 assert.equal(response.status,200);
 assert.equal((await response.json()).mode,"friends");
 assert.equal(batches.length,1);
 assert.equal(batches[0].length,3);
 assert.deepEqual(batches[0].map(x=>x.sql),[
  "DELETE FROM wrld_discovery_cards WHERE user_id=? AND mode=?",
  "DELETE FROM wrld_discovery_photos WHERE user_id=? AND mode=?",
  "UPDATE wrld_profile_extras SET discoverable=0 WHERE user_id=?"
 ]);
 assert.deepEqual(batches[0][0].params,[ID,"friends"]);
 assert.deepEqual(batches[0][1].params,[ID,"friends"]);
 assert.deepEqual(batches[0][2].params,[ID]);
 assert.equal(batches[0].some(x=>x.sql.includes("wrld_discovery_dating")),false);
});
test("Deleting dating questionnaire deletes only dating card/photo and resets dating consent",async()=>{
 const {db,batches}=makeDb();
 const response=await handle(db,"dating");
 assert.equal(response.status,200);
 assert.deepEqual(batches[0].map(x=>x.sql),[
  "DELETE FROM wrld_discovery_cards WHERE user_id=? AND mode=?",
  "DELETE FROM wrld_discovery_photos WHERE user_id=? AND mode=?",
  "DELETE FROM wrld_discovery_dating WHERE user_id=?"
 ]);
 assert.deepEqual(batches[0][0].params,[ID,"dating"]);
 assert.deepEqual(batches[0][1].params,[ID,"dating"]);
 assert.deepEqual(batches[0][2].params,[ID]);
 assert.equal(batches[0].some(x=>x.sql.includes("wrld_profile_extras")),false);
});
test("Missing or invalid mode fails closed without touching any DB data",async()=>{
 for(const mode of ["bogus","Friends","all","", "../profiles"]){
  const {db,batches}=makeDb();
  const response=await handle(db,mode);
  assert.equal(response.status,400);
  assert.deepEqual(batches,[]);
 }
});
test("Unauthenticated DELETE cannot access or delete a questionnaire",async()=>{
 const {db,batches}=makeDb();
 const response=await handle(db,"friends",async()=>null);
 assert.equal(response.status,401);
 assert.deepEqual(batches,[]);
});
