import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const script=readFileSync(new URL("../wrld-social.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve))};
function setup({passwordIsValid=true,privateServicesWork=false,initialToken=""}={}){
 const state={session:initialToken,calls:[],submit:null,click:null,profileOpened:0};
 const elements=Object.fromEntries(["wrld-community-root","wrld-account-root","wrld-notifications-root"].map(id=>[id,{innerHTML:"",id}]));
 const doc={
  getElementById:id=>elements[id]||null,
  querySelector:selector=>selector.startsWith("#dock")?{click(){state.profileOpened++}}:null,
  addEventListener:(key,fn)=>state[key]=fn,
  activeElement:null
 };
 const sessionStorage={
  getItem:key=>key==="fw-token"?state.session:null,
  setItem:(key,value)=>{if(key==="fw-token")state.session=value},
  removeItem:key=>{if(key==="fw-token")state.session=""}
 };
 const me={id:"b6841111-aaaa-4444-bbbb-101010101010",username:"localtester",display_name:"Local Tester",bio:"",mfa_enabled:false,mfa_verified:false};
 const fetch=async (url,options={})=>{
  const path=new URL(url).pathname;state.calls.push({path,method:options.method||"GET",auth:options.headers?.Authorization});
  const json=(body,status=200)=>({ok:status<400,status,json:async()=>body});
  if(path==="/health")return json({ok:true});
  if(path==="/auth/providers")return json({providers:{}});
  if(path==="/auth/register")return json({token:"local-registration-token"},201);
  if(path==="/auth/login")return passwordIsValid?json({token:"local-login-token"}):json({error:"Wrong username or password."},401);
  if(path==="/me")return json({user:me});
  if(["/friends","/messages","/notifications"].includes(path))return privateServicesWork?json({friends:[],blocks:[],contact_pins:[],messages:[],pins:[],notifications:[]}):json({error:"Optional service unavailable"},503);
  if(path==="/messages/public")return json({messages:[],pins:[]});
  throw Error("Unexpected API path "+path);
 };
 const ctx={
  document:doc,sessionStorage,fetch,window:{
   WrldProfile:null,
   addEventListener(){},
   dispatchEvent(){},
   location:{assign(){}}
  },
  FormData:class {constructor(form){this.entries=()=>Object.entries(form.values||{})}},
  Event:class{constructor(type){this.type=type}},
  AbortController,URL,JSON,Date,Number,Math,String,Array,Map,Set,Promise,Uint8Array,
  console,setTimeout,clearTimeout,setInterval:()=>0
 };
 runInNewContext(script,ctx);
 return {state,elements};
}
const fire=async(set,mode,values)=>{
 if(mode==="register")await set.state.click({target:{closest:s=>s==="[data-action]"?{dataset:{action:"mode",id:"register"}}:null}});
 await set.state.submit({target:{id:"fw-auth",values},preventDefault(){}});
 await flush();
};
test("First-party username/password registration signs in without any third-party provider",async()=>{
 const s=setup();
 await flush();
 assert.match(s.elements["wrld-account-root"].innerHTML,/Create account/);
 await fire(s,"register",{username:"LocalTester",display_name:"Local Tester",password:"example-only-password-2026"});
 assert.equal(s.state.session,"local-registration-token");
 assert.ok(s.state.calls.some(c=>c.path==="/auth/register"));
 assert.ok(s.state.calls.some(c=>c.path==="/me"));
 assert.equal(s.state.profileOpened,1);
 assert.match(s.elements["wrld-account-root"].innerHTML,/Local Tester/);
 assert.match(s.elements["wrld-account-root"].innerHTML,/@localtester/);
 assert.equal(s.state.calls.some(c=>/\/auth\/(google|apple|fmail|oauth)/.test(c.path)),false);
});
test("Existing local account can log in even when chat, friends and notifications are down",async()=>{
 const s=setup();
 await flush();
 await fire(s,"login",{username:"LOCALTESTER",password:"example-only-password-2026"});
 assert.equal(s.state.session,"local-login-token");
 assert.equal(s.state.profileOpened,1);
 assert.match(s.elements["wrld-account-root"].innerHTML,/Local Tester/);
 assert.ok(s.state.calls.some(c=>c.path==="/friends"));
 assert.ok(s.state.calls.some(c=>c.path==="/notifications"));
});
test("Bad password remains a clear login error and does not create a session",async()=>{
 const s=setup({passwordIsValid:false});
 await flush();
 await fire(s,"login",{username:"localtester",password:"wrong-password"});
 assert.equal(s.state.session,"");
 assert.match(s.elements["wrld-account-root"].innerHTML,/Wrong username or password/);
 assert.equal(s.state.profileOpened,0);
});
test("Native auth form is reachable immediately, without waiting on optional OAuth providers",()=>{
 const s=setup();
 assert.match(s.elements["wrld-account-root"].innerHTML,/id="fw-auth"/);
 assert.match(s.elements["wrld-account-root"].innerHTML,/Create account/);
 assert.match(script,/Promise\.allSettled\(\[api\("\/friends"\),api\("\/messages"\),api\("\/notifications"\)\]\)/);
 assert.match(html,/wrld-social\.js\?v=13/);
});
