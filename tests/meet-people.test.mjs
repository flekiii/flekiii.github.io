import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const client=get("wrld-discover.mjs"),server=get("backend/discover.js"),css=get("wrld-discover.css"),html=get("index.html");
const minor="123e4567-e89b-42d3-a456-426614174000";
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve))};
function setup(){
 const handlers={},events={},requests=[],root={innerHTML:"",addEventListener(k,fn){handlers[k]=fn},querySelector(){return {value:"anime"}}};
 const doc={documentElement:{lang:"uk"},getElementById(id){return id==="wrld-discover-root"?root:id==="page-discover"?{classList:{contains:()=>true}}:null}};
 const fetch=async(url,opt={})=>{
  const path=new URL(url).pathname,m=new URL(url).searchParams.get("mode");
  requests.push({path,method:opt.method,body:opt.body?JSON.parse(opt.body):null,mode:m});
  const json=body=>({ok:true,json:async()=>body});
  if(path==="/discover/me")return json({user_id:"223e4567-e89b-42d3-a456-426614174001",display_name:"Owner",age_range:m==="dating"?"15–17":"14–17",age_ready:true,enabled:m==="friends",card:{bio:"",gender:"undisclosed",seeking:"everyone",has_photo:false},interests:["Anime"]});
  if(path==="/discover/friends")return json({members:[{id:minor,username:"tester",display_name:"Member",age_group:"14–17",interests:["Anime"],common:1,media_public:false,has_photo:false}],age_group:"14–17"});
  if(path==="/discover/dating")return json({members:[],age_group:"15–17",enabled:false});
  if(path==="/discover/card")return json({ok:true,enabled:true});
  if(path==="/discover/request"||path==="/discover/report"||path==="/blocks")return json({ok:true});
  throw Error("Unexpected "+path);
 };
 const window={addEventListener(k,fn){events[k]=fn},WrldInterests:{label:x=>x==="Anime"?"Аніме":x}};
 const ctx={document:doc,window,sessionStorage:{getItem:()=>"secure-session"},fetch,URL,AbortController,setTimeout,clearTimeout,confirm:()=>true,prompt:()=>"Inappropriate behavior",location:{hash:""}};
 runInNewContext(client,ctx);
 const click=async(type,dataset={})=>{await handlers.click({target:{closest:()=>({dataset:{fd:type,...dataset},disabled:false})}});await flush()};
 return {root,requests,handlers,events,click};
}
test("Meet People fits the viewport and scrolls only people and questionnaires",()=>{
 assert.match(html,/classList\.toggle\('discover-view',id==='discover'\)/);
 assert.match(html,/p\.innerHTML='<div id="wrld-discover-root"><\/div>'/);
 assert.match(css,/body\.discover-view\{height:100dvh;overflow:hidden/);
 assert.match(css,/\.fd-results\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/\.fd-editor-grid/);
 assert.doesNotMatch(client,/Dating · 18\+ \(not available\)/);
});
test("Friends list is enabled within 14-17 for a 15yo; dating is separate 15-17",async()=>{
 const s=setup();s.events["wrld:page-change"]({detail:{id:"discover"}});await flush();
 assert.match(s.root.innerHTML,/Знайти друзів/);assert.match(s.root.innerHTML,/Знайомства · 15\+/);
 assert.match(s.root.innerHTML,/14–17/);assert.match(s.root.innerHTML,/Аніме/);
 await s.click("mode",{mode:"dating"});
 assert.ok(s.requests.some(r=>r.path==="/discover/me"&&r.mode==="dating"));
 assert.match(s.root.innerHTML,/15–17/);assert.match(s.root.innerHTML,/Створити анкету/);
});
test("Each mode has an editable questionnaire and explicit opt-in",async()=>{
 const s=setup();s.events["wrld:page-change"]({detail:{id:"discover"}});await flush();
 await s.click("edit-card");
 assert.match(s.root.innerHTML,/fd-editor-photo/);assert.match(s.root.innerHTML,/id="fd-bio"/);
 s.handlers.input({target:{id:"fd-bio",value:"I love indie games!"}});
 await s.click("publish-card");
 assert.ok(s.requests.some(r=>r.path==="/discover/card"&&r.method==="PUT"&&r.body?.mode==="friends"&&r.body?.active===true&&r.body?.bio==="I love indie games!"));
 await s.click("mode",{mode:"dating"});await s.click("edit-card");
 assert.match(s.root.innerHTML,/id="fd-gender"/);
 assert.match(s.root.innerHTML,/id="fd-seeking"/);
 assert.match(s.root.innerHTML,/id="fd-photo"/);
});
test("Server restricts friend matches and date matches by exact mutual age, not just broad age bracket",()=>{
 assert.match(server,/mode==="friends"\?14:15/);
 assert.match(server,/Math\.max\(groupMin,n-2\)/);
 assert.match(server,/Math\.min\(groupMax,n\+2\)/);
 assert.match(server,/e\.age BETWEEN \? AND \?/);
 assert.match(server,/mine\.age<theirRange\.min\|\|mine\.age>theirRange\.max/);
 assert.match(server,/other\.age<myRange\.min\|\|other\.age>myRange\.max/);
 assert.match(server,/teen\?"e\.age<18":"e\.age>=18"/);
 assert.match(server,/wanted==="girls"&&row\.card_gender==="girl"/);
 assert.match(server,/Both accounts must opt in to dating discovery/);
 assert.match(server,/NOT EXISTS\(SELECT 1 FROM blocks/);
});
test("Questionnaire media remains authenticated, size-limited and separate from profile avatar",()=>{
 assert.match(server,/wrld_discovery_photos/);
 assert.match(server,/buffer\.length>900\*1024/);
 assert.match(server,/\/discover\/photo\//);
 assert.match(server,/consentActive\(mode,targetExtra,targetDating,targetCard\)/);
 assert.match(client,/Authorization:"Bearer "\+token\(\)/);
 assert.match(client,/URL\.createObjectURL\(blob\)/);
 const migration=get("backend/migrations/2026-10-27-discovery-cards.sql");
 assert.match(migration,/PRIMARY KEY\(user_id,mode\)/);
 assert.match(migration,/mode IN \('friends','dating'\)/);
});
test("Report/block/privacy and multilingual published assets",()=>{
 assert.match(client,/data-fd="report"/);assert.match(client,/data-fd="block"/);
 assert.match(client,/tr\("Girls","Дівчат"\)/);
 assert.match(client,/tr\("Boys","Хлопців"\)/);
 assert.doesNotMatch(server,/phone|district|address/);
 assert.match(html,/wrld-discover\.mjs\?v=6/);
 assert.match(html,/wrld-discover\.css\?v=5/);
});
test("Editing a declared age revokes previous dating consent",()=>{
 const profile=get("backend/profiles.js");
 assert.match(profile,/const resetDating=previousAge!==age/);
 assert.match(profile,/UPDATE wrld_discovery_dating SET enabled=0/);
});

test("The own Friends questionnaire is pinned and not duplicated by discovery",async()=>{
 const s=setup();s.events["wrld:page-change"]({detail:{id:"discover"}});await flush();
 const markup=s.root.innerHTML;
 assert.match(markup,/data-fd-own="true"/);
 assert.match(markup,/Твоя анкета/);
 assert.match(markup,/Опубліковано/);
 assert.match(markup,/data-fd="edit-card"/);
 assert.equal((markup.match(/data-fd-own="true"/g)||[]).length,1);
 assert.ok(markup.indexOf('data-fd-own="true"')<markup.indexOf("tester"));
});
test("The own uploaded avatar has an authenticated live target in editor and list",async()=>{
 const s=setup();s.events["wrld:page-change"]({detail:{id:"discover"}});await flush();
 assert.match(s.root.innerHTML,/data-fd-photo="223e4567-e89b-42d3-a456-426614174001"/);
 await s.click("edit-card");
 assert.match(s.root.innerHTML,/class="fd-editor-photo" data-fd-photo="/);
 assert.match(client,/placeholder\.remove\(\)/);
 assert.match(client,/loadPhoto\(\{id:self\.user_id,has_photo:true\}\)/);
 assert.match(css,/\.fd-own-card/);
});

test("Own Friends card remains visible while searching or when the peer list is empty",()=>{
 assert.match(client,/if\(mode==="friends"&&self\?\.age_ready&&self\.user_id\)/);
 assert.match(client,/No other questionnaires found yet/);
 assert.match(client,/const summary=error\?/);
 assert.match(css,/\.fd-peer-note/);
});
