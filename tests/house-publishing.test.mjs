import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import * as core from "../wrld-home-core.mjs";
import {houseHandle} from "../backend/houses.js";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const backend=get("backend/houses.js"),creator=get("wrld-house-creator.mjs"),profile=get("wrld-profile.js"),html=get("index.html");
test("House publication requires sign-in but not 2FA; reactions remain protected",()=>{
 const publish=backend.indexOf('if(method==="PUT"&&path==="/houses/publish")');
 const reactions=backend.indexOf('if(method==="POST"&&path==="/houses/react")');
 const check=backend.indexOf('if(!authorized(user))');
 assert.ok(publish>0&&reactions>publish&&check>reactions);
 assert.match(backend,/Verify Auth2FA for this session/);
 assert.match(backend,/const user=await auth\(req,db\);if\(!user\)/);
});
test("Garage floor plans are serializable in the publishing payload",()=>{
 for(const id of ["garage","garagehouse","workshop"]){
  core.setLayout(id);
  const items=core.cloneItems(core.START_ITEMS);
  assert.ok(items.length>0);
  for(const item of items)assert.ok(["id","type","x","z","rot"].every(k=>k in item));
 }
 core.setLayout("starter");
});
test("Share, publish and profile all persist the visible in-profile flag",()=>{
 assert.match(creator,/publish\(true\)/);
 assert.match(creator,/in_profile:showInProfile/);
 assert.match(creator,/check\.house\.in_profile!==showInProfile/);
 assert.match(creator,/wrld:house-published/);
 assert.match(creator,/wrld:house-publish-error/);
 assert.doesNotMatch(creator,/houseProfileCard/);
});
test("Profile Studio shows published houses and offers a publish button",()=>{
 assert.match(profile,/\["house","⌂","My house","Мій будинок"\]/);
 assert.match(profile,/data-wp="publish-house"/);
 assert.match(profile,/\/houses\/mine/);
 assert.match(profile,/\/houses\/profile\?user=/);
 assert.match(profile,/housePreview\(myHouse\)/);
 assert.match(html,/wrld-house-creator\.mjs\?v=8/);
 assert.match(html,/wrld-profile\.js\?v=5/);
 assert.match(html,/wrld-profile\.css\?v=3/);
 assert.doesNotThrow(()=>new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]));
});

test("Actual house endpoint publishes a garage without 2FA, stores it for the owner and exposes its profile card",async()=>{
 const account={id:"owner-1",username:"garageowner"},env={};
 let row=null;
 env.DB={
  prepare(sql){return{
   bind(...args){return{
    async run(){
     if(sql.startsWith("INSERT INTO wrld_houses(")){
      const [owner,name,template,layout_json,published,in_profile,updated_at]=args;
      row={owner,name,template,layout_json,published,in_profile,updated_at,username:account.username,display_name:"Garage Owner"};
     }
     return {success:true};
    },
    async first(){
     if(sql.includes("FROM wrld_houses"))return row;
     return null;
    },
    async all(){return {results:[]}}
   }}
  }}
 };
 const fake={auth:async()=>account,authorized:()=>false};
 const layout=[{id:"item-1",type:"tools",x:0,z:0,rot:0},{id:"item-2",type:"car",x:2,z:0,rot:0}];
 const url="https://example.test";
 const publish=new Request(url+"/houses/publish",{method:"PUT",body:JSON.stringify({name:"My garage",template:"garage",items:layout,published:true,in_profile:true}),headers:{"Content-Type":"application/json"}});
 const result=await houseHandle(publish,env,"/houses/publish",fake);
 assert.equal(result.status,200);
 const confirmed=await result.json();
 assert.equal(confirmed.published,true);assert.equal(confirmed.in_profile,true);
 const mine=await houseHandle(new Request(url+"/houses/mine"),env,"/houses/mine",fake);
 const saved=(await mine.json()).house;
 assert.equal(saved.template,"garage");assert.equal(saved.published,true);assert.equal(saved.in_profile,true);
 assert.deepEqual(saved.items,layout);
 const publicProfile=await houseHandle(new Request(url+"/houses/profile?user=garageowner"),env,"/houses/profile",{auth:async()=>null,authorized:()=>false});
 assert.equal(publicProfile.status,200);
 assert.equal((await publicProfile.json()).house.name,"My garage");
 const reaction=await houseHandle(new Request(url+"/houses/react",{method:"POST",body:JSON.stringify({user:"garageowner",emoji:"❤️"})}),env,"/houses/react",fake);
 assert.equal(reaction.status,403,"Reactions must continue to require Auth2FA");
 const verified={auth:async()=>account,authorized:()=>true};
 const self=await houseHandle(new Request(url+"/houses/react",{method:"POST",body:JSON.stringify({user:"garageowner",emoji:"❤️"})}),env,"/houses/react",verified);
 assert.equal(self.status,200,"Owner with verified Auth2FA can react to their own house");
 assert.equal((await self.json()).your_reaction,"❤️");
 const removal=await houseHandle(new Request(url+"/houses/react",{method:"POST",body:JSON.stringify({user:"garageowner",emoji:null})}),env,"/houses/react",verified);
 assert.equal(removal.status,200);
 assert.equal((await removal.json()).your_reaction,null);
});
test("Reaction errors distinguish missing session verification from unrelated failures",()=>{
 const frontend=get("wrld-house-creator.mjs"),backend=get("backend/houses.js");
 assert.match(frontend,/error.status=response.status/);
 assert.match(frontend,/e.status===403/);
 assert.match(frontend,/e.status===401/);
 assert.doesNotMatch(frontend,/Перевір, чи увійшов у профіль та пройшов 2FA/);
 assert.match(frontend,/aria-pressed/);
 assert.match(frontend,/currentReaction=result.your_reaction/);
 assert.doesNotMatch(backend,/You cannot react to your own home/);
 assert.match(backend,/your_reaction:previous\?\.emoji\|\|null/);
});
