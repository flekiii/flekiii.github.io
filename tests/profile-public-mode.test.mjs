import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const script=readFileSync(new URL("../wrld-profile.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../wrld-profile.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const user={id:"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",username:"tester",display_name:"Tester",phone:"PRIVATE_NUMBER_NEVER_RENDER",bio:"PRIVATE_TEXT_NEVER_RENDER",visibility:{phone:"private",bio:"private"},roles:[],socials:{},favorite_games:[],current_games:[]};
const publicUser={...user,relationship:"public",phone:null,bio:null,visibility:undefined};
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve))};
function setup({failPublic=false}={}){
 const callbacks={},events={},paths=[];
 const doc={documentElement:{lang:"en"},getElementById:()=>null,addEventListener:(k,fn)=>callbacks[k]=fn,body:{append(){}},createElement:()=>({append(){},addEventListener(){}})};
 const win={addEventListener:(k,fn)=>events[k]=fn,dispatchEvent:e=>events[e.type]?.(e)};
 const fetch=async url=>{
  const path=new URL(url).pathname+new URL(url).search;paths.push(path);
  if(path==="/profiles/me")return {ok:true,json:async()=>({profile:user,owner:false,moderator:false})};
  if(path==="/profiles/preview?as=public")return failPublic?{ok:false,status:503,json:async()=>({})}:{ok:true,json:async()=>({profile:publicUser})};
  return {ok:false,status:404,json:async()=>({})};
 };
 runInNewContext(script,{document:doc,window:win,sessionStorage:{getItem:()=>"token"},fetch,URL,AbortController,Date,Number,String,JSON,Math,Promise,Uint8Array,Blob,setTimeout,clearTimeout,console,Event:class {constructor(type){this.type=type}}});
 const render=()=>win.WrldProfile.renderAccount({user});
 const click=async(wp,id="")=>{await callbacks.click({target:{closest:q=>q==="[data-wp]"?{dataset:{wp,id}}:null},preventDefault(){}});await flush()};
 return {render,click,paths,events};
}
test("Default profile is the actual server-filtered public view",async()=>{
 const s=setup();s.render();await flush();
 const html=s.render();
 assert.match(html,/wp-published/);
 assert.match(html,/data-wp="open-editor"/);
 assert.match(html,/Tester/);
 assert.doesNotMatch(html,/PRIVATE_NUMBER_NEVER_RENDER/);
 assert.doesNotMatch(html,/PRIVATE_TEXT_NEVER_RENDER/);
 assert.ok(s.paths.includes("/profiles/preview?as=public"));
 assert.doesNotMatch(html,/class="wp-rail"/);
});
test("Customize profile, privacy and security are accessible only via their buttons",async()=>{
 const s=setup();s.render();await flush();
 await s.click("open-editor");assert.match(s.render(),/wp-studio-layout/);assert.match(s.render(),/Profile Studio|PROFILE STUDIO/);
 await s.click("back-public");assert.match(s.render(),/wp-published/);
 await s.click("edit-privacy");assert.match(s.render(),/Privacy/);
 await s.click("back-public");await s.click("open-security");assert.match(s.render(),/Account security/);
});
test("Unavailable public preview never falls back to private account fields",async()=>{
 const s=setup({failPublic:true});s.render();await flush();
 const markup=s.render();
 assert.match(markup,/Public view unavailable/);
 assert.doesNotMatch(markup,/PRIVATE_NUMBER_NEVER_RENDER|PRIVATE_TEXT_NEVER_RENDER/);
 assert.match(markup,/data-wp="retry-public"/);
 assert.match(markup,/data-wp="open-editor"/);
});
test("Published profile assets and presentation keep a clear public/edit split",()=>{
 assert.match(html,/wrld-profile\\.js\\?v=9/);
 assert.match(html,/wrld-profile\\.css\\?v=7/);
 assert.match(css,/\\.wp-published-grid/);
 assert.match(css,/\\.wp-studio-layout/);
 assert.match(script,/modal\\(profile,a,b,null\\)/);
});
