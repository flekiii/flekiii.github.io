import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const client=get("wrld-discover.mjs"),server=get("backend/discover.js"),css=get("wrld-discover.css"),html=get("index.html");
const minor="123e4567-e89b-42d3-a456-426614174000";
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve))};
function setup(){
 const handlers={},events={},requests=[],root={innerHTML:"",addEventListener(k,fn){handlers[k]=fn},querySelector(){return {value:"anime"}}};
 const doc={documentElement:{lang:"uk"},getElementById(id){return id==="wrld-discover-root"?root:id==="page-discover"?{classList:{contains:()=>true}}:null}};
 const fetch=async(url,opt={})=>{
  const path=new URL(url).pathname,mode=new URL(url).searchParams.get("q");requests.push({path,method:opt.method,body:opt.body?JSON.parse(opt.body):null,mode});
  const json=body=>({ok:true,json:async()=>body});
  if(path==="/discover/friends")return json({members:[{id:minor,username:"tester",display_name:"Member",age_group:"15–17",interests:["Anime"],common:1,media_public:true}],age_group:"15–17"});
  if(path==="/discover/dating")return json({members:[],age_group:"15–17",enabled:false});
  if(path==="/discover/dating/optin")return json({enabled:true,age_group:"15–17"});
  if(path==="/discover/request")return json({ok:true});
  if(path==="/discover/report")return json({ok:true});
  throw Error("Unexpected "+path);
 };
 const window={addEventListener(k,fn){events[k]=fn},WrldInterests:{label:x=>x==="Anime"?"Аніме":x}};
 const ctx={document:doc,window,sessionStorage:{getItem:()=>"secure-session"},fetch,URL,AbortController,setTimeout,clearTimeout,confirm:()=>true,prompt:()=>"Inappropriate behavior",location:{hash:""}};
 runInNewContext(client,ctx);
 const click=async(type,dataset={})=>{await handlers.click({target:{closest:()=>({dataset:{fd:type,...dataset},disabled:false})}});await flush()};
 return {root,requests,events,click};
}
test("Meet People fits one screen and only scrolls the cards",()=>{
 assert.match(html,/classList\.toggle\('discover-view',id==='discover'\)/);
 assert.match(html,/p\.innerHTML='<div id="wrld-discover-root"><\/div>'/);
 assert.match(css,/body\.discover-view\{height:100dvh;overflow:hidden/);
 assert.match(css,/\.fd-results\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.doesNotMatch(client,/Dating · 18\+ \(not available\)/);
});
test("Public friend search and dating 15+ remain separate opt-in modes",async()=>{
 const s=setup();s.events["wrld:page-change"]({detail:{id:"discover"}});await flush();
 assert.match(s.root.innerHTML,/Знайти друзів/);
 assert.match(s.root.innerHTML,/Знайомства · 15\+/);
 assert.match(s.root.innerHTML,/Аніме/);
 await s.click("mode",{mode:"dating"});
 assert.ok(s.requests.some(r=>r.path==="/discover/dating"));
 assert.match(s.root.innerHTML,/Увімкнути знайомства/);
 assert.doesNotMatch(s.root.innerHTML,/Member<\/h3>/);
});
test("Dating requires an explicit consent request and can be switched off",async()=>{
 const s=setup();s.events["wrld:page-change"]({detail:{id:"discover"}});await flush();
 await s.click("mode",{mode:"dating"});
 await s.click("enable-dating");
 assert.ok(s.requests.some(r=>r.path==="/discover/dating/optin"&&r.body?.enabled===true));
 assert.match(client,/data-fd="disable-dating"/);
});
test("Server strictly isolates 15-17 teen pool and 18+ adult pool; excludes non-opted-in accounts",()=>{
 assert.match(server,/wrld_discovery_dating d JOIN wrld_profile_extras/);
 assert.match(server,/d\.enabled=1/);
 assert.match(server,/mine\.age<18/);
 assert.match(server,/teen\?"e\.age<18":"e\.age>=18"/);
 assert.match(server,/sourceMode==="dating"/);
 assert.match(server,/Both accounts must opt in to dating discovery/);
 assert.match(server,/NOT EXISTS\(SELECT 1 FROM blocks/);
 assert.match(server,/wrld_profile_bans/);
 assert.match(server,/verified_age:false/);
 const migration=get("backend/migrations/2026-10-27-dating-discovery.sql");
 assert.match(migration,/enabled INTEGER NOT NULL DEFAULT 0/);
});
test("Report/block and limited public data are included",()=>{
 assert.match(client,/data-fd="report"/);
 assert.match(client,/data-fd="block"/);
 assert.match(client,/media_public&&isId/);
 assert.doesNotMatch(server,/phone|district|address/);
 assert.match(html,/wrld-discover\.mjs\?v=3/);
 assert.match(html,/wrld-discover\.css\?v=2/);
});
