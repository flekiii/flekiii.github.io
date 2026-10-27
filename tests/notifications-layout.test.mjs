import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=get("index.html"),css=get("wrld-notifications.css"),script=get("wrld-social.js");
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve))};
async function setup(){
 const nodes=Object.fromEntries(["wrld-community-root","wrld-account-root","wrld-notifications-root"].map(id=>[id,{innerHTML:"",querySelector:()=>null}]));
 const handlers={},events={},requests=[];let page="";
 const doc={documentElement:{lang:"uk"},activeElement:null,getElementById:id=>nodes[id]||null,addEventListener:(k,fn)=>{handlers[k]=fn},querySelector:()=>({click(){page="chat"}})};
 const notes=[{id:"n1",kind:"friend_request",actor:"u1",display_name:"Friend",created_at:"2026-10-24T10:00:00Z",read_at:null},{id:"n2",kind:"direct_message",actor:"u2",display_name:"Friend Two",created_at:"2026-10-24T11:00:00Z",read_at:"2026-10-25T10:00:00Z"}];
 const ok=x=>({ok:true,status:200,json:async()=>x});
 const fetch=async(u,opts={})=>{
 const path=new URL(u).pathname,body=opts.body?JSON.parse(opts.body):null;requests.push({path,body,method:opts.method});
 if(path==="/health")return ok({});
 if(path==="/auth/providers")return ok({providers:{}});
 if(path==="/me")return ok({user:{id:"owner",username:"tester",display_name:"Tester",mfa_verified:true}});
 if(path==="/friends")return ok({friends:[],blocks:[],contact_pins:[]});
 if(path==="/messages")return ok({messages:[],pins:[]});
 if(path==="/notifications")return ok({notifications:notes});
 if(path==="/notifications/read"){for(const n of notes)if(body.id==="all"||n.id===body.id)n.read_at="2026-10-27T10:00:00Z";return ok({})}
 if(path==="/messages/public")return ok({messages:[]});
 throw Error("Unexpected path "+path);
 };
 vm.runInNewContext(script,{document:doc,window:{addEventListener:(k,fn)=>{events[k]=fn},dispatchEvent(){}},sessionStorage:{getItem:()=>"session"},fetch,URL,AbortController,Date,Number,Math,JSON,Array,Map,Set,String,Intl,Promise,console,setTimeout,clearTimeout,setInterval:()=>0});
 await flush();
 const click=async (action,id="")=>{await handlers.click({target:{closest:q=>q==="[data-action]"?{dataset:{action,id}}:null}});await flush()};
 return {nodes,requests,click,notes,doc,events,page:()=>page};
}
test("Only the notification list scrolls",()=>{
 assert.match(html,/classList\.toggle\('notifications-view',id==='notifications'\)/);
 assert.match(css,/body\.notifications-view\{height:100dvh;overflow:hidden/);
 assert.match(css,/\.fn-list\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/@media\(max-width:640px\)/);
});
test("Actual notifications render and show unread status",async()=>{
 const s=await setup(),out=s.nodes["wrld-notifications-root"].innerHTML;
 assert.match(out,/Твої сповіщення/);assert.match(out,/1 <small>нових/);
 assert.match(out,/Friend Two/);assert.match(out,/data-action="notif-filter" data-id="unread"/);
});
test("Unread filtering and mark as read only change the selected notification",async()=>{
 const s=await setup();await s.click("notif-filter","unread");
 const out=s.nodes["wrld-notifications-root"].innerHTML;
 assert.match(out,/Friend/);assert.doesNotMatch(out,/Friend Two/);
 await s.click("read","n1");
 assert.ok(s.requests.some(x=>x.path==="/notifications/read"&&x.method==="POST"&&x.body?.id==="n1"));
 assert.match(s.nodes["wrld-notifications-root"].innerHTML,/Усе прочитано!/);
});
test("Opening friend requests goes to the Community Friends tab",async()=>{
 const s=await setup();await s.click("notif-open","n1");
 assert.equal(s.page(),"chat");assert.match(s.nodes["wrld-community-root"].innerHTML,/Друзі/);
});
test("Language can be changed in place",async()=>{
 const s=await setup();s.doc.documentElement.lang="en";s.events["wrld:language-change"]();
 assert.match(s.nodes["wrld-notifications-root"].innerHTML,/Your notifications/);
});
