import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {houseHandle} from "../backend/houses.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const houseUI=read("wrld-house-creator.mjs"),editor=read("wrld-home.mjs"),profile=read("wrld-profile.js"),markup=read("index.html");
const accounts={a:{id:"alice-1",username:"alice"},b:{id:"bob-2",username:"bob"}};
const houses=new Map(),drafts=new Map(),reactions=new Map();
const db={prepare(sql){return {bind(...values){return {
 async first(){
  if(sql.includes("FROM wrld_house_drafts"))return drafts.get(values[0])||null;
  if(sql.includes("SELECT updated_at FROM wrld_houses"))return houses.get(values[0])||null;
  if(sql.includes("FROM wrld_houses")){
   if(sql.includes("u.username=?"))return [...houses.values()].find(x=>x.username===values[0]&&x.published)||null;
   return houses.get(values[0])||null;
  }
  if(sql.includes("FROM wrld_house_reactions"))return reactions.get(values[0]+":"+values[1])||null;
  return null;
 },
 async run(){
  if(sql.startsWith("INSERT INTO wrld_house_drafts")){
   const [owner,name,template,layout_json,updated_at]=values;
   drafts.set(owner,{owner,username:owner===accounts.a.id?"alice":"bob",name,template,layout_json,updated_at});
  }else if(sql.startsWith("INSERT INTO wrld_houses")){
   const [owner,name,template,layout_json,published,in_profile,updated_at]=values;
   houses.set(owner,{owner,username:owner===accounts.a.id?"alice":"bob",name,template,layout_json,published,in_profile,updated_at});
  }else if(sql.startsWith("UPDATE wrld_houses SET published")){
   const [published,in_profile,updated_at,owner]=values;
   houses.set(owner,{...houses.get(owner),published,in_profile,updated_at});
  }else if(sql.startsWith("INSERT INTO wrld_house_reactions"))reactions.set(values[0]+":"+values[1],{emoji:values[2]});
  else if(sql.startsWith("DELETE FROM wrld_house_reactions"))reactions.delete(values[0]+":"+values[1]);
  return {success:true,meta:{changes:1}};
 },
 async all(){return {results:[]}}
 }}}}};
const env={DB:db},context={auth:async r=>accounts[r.headers.get("Authorization")?.replace("Bearer ","")]||null,authorized:()=>true};
const api=(path,method="GET",body,account="a")=>houseHandle(new Request("https://example.com"+path,{method,headers:{Authorization:"Bearer "+account,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,path.split("?")[0],context);
const layout={name:"Garage backup",template:"garage",items:[{id:"item-1",type:"car",x:0,z:0,rot:0}]};
test("Private cloud drafts are only accessible to the account owner and stay unpublished",async()=>{
 const save=await api("/houses/draft","PUT",layout);assert.equal(save.status,200);
 const stored=(await (await api("/houses/draft")).json()).draft;
 assert.equal(stored.name,"Garage backup");assert.equal(stored.template,"garage");
 assert.equal(stored.items[0].type,"car");
 assert.equal((await (await api("/houses/draft","GET",undefined,"b")).json()).draft,null);
 assert.equal((await api("/houses/public?user=alice")).status,404);
 assert.equal((await api("/houses/draft","PUT",layout,"wrong")).status,401);
 const conflict=await api("/houses/draft","PUT",{...layout,expected_updated_at:1});
 assert.equal(conflict.status,409,"Cloud saves must reject outdated versions");
});
test("Publishing and privacy controls never erase the private house draft",async()=>{
 const pub=await api("/houses/publish","PUT",{...layout,published:true,in_profile:true});
 assert.equal(pub.status,200);
 assert.equal((await api("/houses/public?user=alice")).status,200);
 const hidden=await api("/houses/visibility","PATCH",{published:false,in_profile:false});
 assert.equal(hidden.status,200);
 assert.equal((await api("/houses/public?user=alice")).status,404);
 assert.equal((await (await api("/houses/draft")).json()).draft.name,"Garage backup");
 const invisibleProfile=await api("/houses/visibility","PATCH",{published:true,in_profile:false});
 assert.equal(invisibleProfile.status,200);
 assert.equal((await api("/houses/public?user=alice")).status,200);
 assert.equal((await api("/houses/profile?user=alice")).status,404);
 const restored=await api("/houses/visibility","PATCH",{published:true,in_profile:true});
 assert.equal(restored.status,200);
 assert.equal((await api("/houses/profile?user=alice")).status,200);
 assert.equal((await api("/houses/visibility","PATCH",{published:true,in_profile:"public"})).status,400);
});
test("Creator, editor and profile expose explicit backup and recovery controls",()=>{
 for(const name of ["houseSaveCloudButton","houseRestoreCloudButton","houseRestorePublishedButton","houseHideButton","houseUnpublishButton","houseUndo","houseRedo"])
  assert.ok(markup.includes('id="'+name+'"'),"missing "+name);
 assert.match(houseUI,/wrld:house-saved/);
 assert.match(houseUI,/saveCloudDraft/);
 assert.match(houseUI,/stopCloudSync\(\)/);
 assert.match(houseUI,/localOwnerMismatch\(user\)/);
 assert.match(houseUI,/expected_updated_at/);
 assert.match(houseUI,/backupLocal\(\)/);
 assert.match(houseUI,/wrld:house-restored/);
 assert.match(editor,/wrld:house-saved/);
 assert.match(editor,/historyMove\("undo"\)/);
 assert.match(editor,/historyMove\("redo"\)/);
 assert.match(profile,/data-wp="restore-house-draft"/);
 assert.match(profile,/data-wp="save-house-draft"/);
});
