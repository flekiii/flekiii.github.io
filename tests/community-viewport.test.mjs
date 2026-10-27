import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const get=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const html=get("index.html"),css=get("wrld-community.css"),script=get("wrld-social.js");
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve))};

test("Community stays within viewport; only conversations and contact lists scroll",()=>{
 assert.match(html,/classList\.toggle\('community-view',id==='chat'\)/);
 assert.match(css,/body\.community-view\{height:100dvh;overflow:hidden;overscroll-behavior:none/);
 assert.match(css,/#page-chat.active\{display:flex;flex-direction:column;height:calc\(100dvh - 89px - 100px\);min-height:0/);
 assert.match(css,/#page-chat .page-heading\{display:none\}/);
 assert.match(css,/#page-chat .social-workspace\{height:100%;min-height:0;max-height:100%/);
 assert.match(css,/#page-chat .social-global .social-chat-list\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/#page-chat .social-contact-list\{[^}]*overflow-y:auto/);
 assert.match(css,/#page-chat .social-layout-direct .social-chat-list\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/#page-chat .social-layout-friends>.social-split>section/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(html,/wrld-community\.css\?v=3/);
 assert.match(html,/wrld-social\.js\?v=18/);
});

function fakeClient(){
 let currentPanel=null,interval,renderCount=0;
 const root={
  _markup:"",
  get innerHTML(){return this._markup},
  set innerHTML(value){this._markup=value;renderCount++;currentPanel={scrollTop:0,scrollHeight:1000,clientHeight:200}},
  querySelector(selector){
   if(selector===".social-layout-global")return this._markup.includes("social-layout-global")?{}:null;
   if(selector===".social-global .social-chat-list")return this._markup.includes("social-global")?currentPanel:null;
   return null;
  }
 };
 const account={innerHTML:"",querySelector:()=>null};
 const alerts={innerHTML:"",querySelector:()=>null};
 const nodes={"wrld-community-root":root,"wrld-account-root":account,"wrld-notifications-root":alerts};
 const doc={documentElement:{lang:"en"},activeElement:null,getElementById:id=>nodes[id]||null,addEventListener:()=>{},querySelector:()=>null};
 const ok=data=>({ok:true,json:async()=>data});
 const calls=[];
 const fetch=async url=>{
  const path=new URL(url).pathname;calls.push(path);
  if(path==="/health")return ok({});
  if(path==="/auth/providers")return ok({providers:{}});
  if(path==="/me")return ok({user:{id:"u1",display_name:"Alice",username:"alice",mfa_verified:true}});
  if(path==="/friends")return ok({friends:[],blocks:[],contact_pins:[]});
  if(path==="/messages")return ok({messages:[{id:"m1",author:"u2",username:"bob",display_name:"Bob",content:"Hello",created_at:"2026-10-27T10:00:00Z"}],pins:[]});
  if(path==="/notifications")return ok({notifications:[]});
  throw Error("Unexpected "+path);
 };
 const window={addEventListener:()=>{},dispatchEvent:()=>{}};
 vm.runInNewContext(script+"\nwindow.__testCommunityRefresh=()=>render({preserveAccount:true});",{document:doc,window,sessionStorage:{getItem:()=>"session"},fetch,URL,AbortController,Date,Number,Math,JSON,Array,Map,Set,String,Intl,Promise,console,setTimeout,clearTimeout,setInterval:fn=>{interval=fn}});
 return {root,panel:()=>currentPanel,interval:()=>interval,refresh:()=>window.__testCommunityRefresh(),renderCount:()=>renderCount,calls};
}
test("Background chat refresh keeps the member's previous scroll position",async()=>{
 const s=fakeClient();await flush();
 assert.ok(s.interval(),"Expected 12-second refresh callback");
 assert.ok(s.root.innerHTML.includes("social-global"));
 s.panel().scrollTop=280;
 const before=s.renderCount();
 s.refresh();await flush();
 assert.ok(s.renderCount()>before);
 assert.equal(s.panel().scrollTop,280);
});
test("When a member is at bottom, refresh stays with newest messages",async()=>{
 const s=fakeClient();await flush();
 s.panel().scrollTop=786;
 s.refresh();await flush();
 assert.equal(s.panel().scrollTop,s.panel().scrollHeight);
});
test("Private messages and contact navigation are independently scrollable",()=>{
 assert.match(script,/class="social-contact-list"/);
 assert.match(script,/communityScrollSelectors=\[/);
 assert.match(script,/".social-layout-direct .social-chat-list"/);
 assert.match(script,/aria-pressed/);
 assert.match(script,/tr\("Global chat","Загальний чат"\)/);
});
