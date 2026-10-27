import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const source=readFileSync(new URL("../wrld-profile.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");

function bootstrap(fetchImpl){
 const callbacks={},state={token:"token-1"},listeners={};
 const doc={
  documentElement:{lang:"en"},
  getElementById:()=>null,
  addEventListener:(name,fn)=>callbacks[name]=fn,
  createElement:()=>({addEventListener(){},append(){}}),
  body:{append(){}},
 };
 const win={
  addEventListener:(name,fn)=>listeners[name]=fn,
  dispatchEvent(ev){callbacks.lastEvent=ev.type;listeners[ev.type]?.(ev)}
 };
 const context={
  window:win,document:doc,sessionStorage:{getItem:key=>key==="fw-token"?state.token:null},
  fetch:fetchImpl,Event:class{constructor(type){this.type=type}},URL,Blob,Uint8Array,
  AbortController,Number,Promise,Map,Set,Date,String,JSON,Math,
  setTimeout,clearTimeout,console
 };
 runInNewContext(source,context);
 return {render:win.WrldProfile.renderAccount,callbacks,state,listeners};
}
const user={id:"aaaaaaaa-aaaa-4aaa-bbbb-aaaaaaaaaaaa",username:"builder",display_name:"Builder",bio:"",roles:[],favorite_games:[],current_games:[],socials:{},visibility:{}};
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve))};
test("The profile opens even when the house API never replies",async()=>{
 const {render}=bootstrap(async url=>{
  if(url.endsWith("/profiles/me"))return {ok:true,json:async()=>({profile:user,owner:false,moderator:false})};
  if(url.endsWith("/houses/mine"))return new Promise(()=>{});
  return {ok:false,status:404,json:async()=>({error:"Missing image"})};
 });
 assert.match(render({user}),/Loading your profile settings/);
 await flush();
 assert.match(render({user}),/wp-shell/);
 assert.doesNotMatch(render({user}),/Loading your profile settings/);
});
test("API failures show the real reason and a working retry instead of an infinite spinner",async()=>{
 let failed=true;
 const {render,callbacks}=bootstrap(async url=>{
  if(url.endsWith("/profiles/me"))return failed
   ? {ok:false,status:503,json:async()=>({error:"Server unavailable"})}
   : {ok:true,json:async()=>({profile:user,owner:false,moderator:false})};
  if(url.endsWith("/houses/mine"))return {ok:true,json:async()=>({house:null})};
  return {ok:false,status:404,json:async()=>({error:"No media"})};
 });
 render({user});await flush();
 const failure=render({user});
 assert.match(failure,/Couldn't load your profile/);
 assert.match(failure,/server is temporarily unavailable/i);
 assert.match(failure,/data-wp="retry-profile"/);
 failed=false;
 await callbacks.click({target:{closest:q=>q==="[data-wp]"?{dataset:{wp:"retry-profile"}}:null},preventDefault(){}});
 await flush();
 assert.match(render({user}),/wp-shell/);
});
test("Changed authentication tokens never show cached profile data from a different session",async()=>{
 let release;const oldPending=new Promise(resolve=>{release=resolve});
 const {render,state}=bootstrap(async(url,opts)=>{
  if(url.endsWith("/profiles/me")&&opts.headers.Authorization==="Bearer token-1")return oldPending;
  if(url.endsWith("/profiles/me"))return {ok:true,json:async()=>({profile:{...user,display_name:"Fresh login"},owner:false,moderator:false})};
  if(url.endsWith("/houses/mine"))return {ok:true,json:async()=>({house:null})};
  return {ok:false,status:404,json:async()=>({})};
 });
 render({user});state.token="token-2";render({user});await flush();
 assert.match(render({user}),/Fresh login/);
 release({ok:true,json:async()=>({profile:{...user,display_name:"Old session"}})});
 await flush();assert.doesNotMatch(render({user}),/Old session/);
 assert.match(render({user}),/Fresh login/);
});
test("Published asset versions correspond to new profile recovery UI",()=>{
 assert.match(html,/wrld-profile\.js\?v=6/);
 assert.match(html,/wrld-profile\.css\?v=4/);
 assert.match(source,/data-wp="retry-profile"/);
 assert.match(source,/\/houses\/mine",\{timeoutMs:8000\}/);
});
