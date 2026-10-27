import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("wrld-world.mjs"),html=read("index.html"),stylesheet=read("wrld-polish.css");

async function openProgress({loggedIn=true,failQuest=false,failOnce=false,failAlways=false}={}){
 const panel={innerHTML:""},feedback={textContent:""},handlers={};
 const root={
  innerHTML:"",
  querySelector(selector){return selector==="#ww-body"?panel:selector==="#ww-feedback"?feedback:null},
  addEventListener(event,fn){handlers[event]=fn}
 };
 let visible=false;
 const document={
  documentElement:{lang:"uk"},
  getElementById(id){
   if(id==="wrld-world-root")return root;
   if(id==="page-world")return {classList:{contains:()=>visible}};
   return null;
  }
 };
 const calls=[];
 let networkFailures=0;
 const fetch=async url=>{
  const path=new URL(url).pathname;
  calls.push(path);
  if(path==="/world/quests"&&(failAlways||(failOnce&&networkFailures++===0)))throw new TypeError("NetworkError when attempting to fetch resource.");
  const results={
   "/world/ranking":{ranking:[]},
   "/world/progress":{progress:{level:2,xp:85,badges:["first-post"]}},
   "/world/quests":{quests:[{id:"share-post",emoji:"✍️",title:"Share a post",uk:"Опублікуй допис",xp:30,complete:true,claimed:false}]}
  };
  if(path==="/world/quests"&&failQuest)return {ok:false,status:503,json:async()=>({error:"Quests temporarily unavailable"})};
  return {ok:true,status:200,json:async()=>results[path]||{}};
 };
 const window={addEventListener(){},dispatchEvent(){}};
 const sandbox={document,fetch,sessionStorage:{getItem:()=>loggedIn?"mock-token":null},window,
  AbortController,URL,Date,Number,JSON,String,Promise,setTimeout,clearTimeout,console};
 const standalone=source.replace(/^import \{feedMarkup,commentsMarkup,clubsMarkup\} from ".+";$/m,
  'const feedMarkup=()=>"";const commentsMarkup=()=>"";const clubsMarkup=()=>"";');
 if(standalone===source)throw Error("Cannot isolate the real World module");
 vm.runInNewContext(standalone,sandbox,{filename:"wrld-world.mjs"});
 visible=true;
 await handlers.click({target:{closest:s=>s==="[data-ww]"?{dataset:{ww:"tab",id:"progress"}}:null}});
 for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));
 return {output:panel.innerHTML,requests:calls};
}

test("World Progress renders authenticated XP and real quests without ReferenceError",async()=>{
 const {output,requests}=await openProgress();
 assert.match(output,/85 XP/);
 assert.match(output,/Опублікуй допис/);
 assert.match(output,/Забрати XP/);
 assert.doesNotMatch(output,/quests is not defined/);
 assert.ok(requests.includes("/world/quests"));
});

test("A transient network failure retries the read once and still displays quests",async()=>{
 const {output,requests}=await openProgress({failOnce:true});
 assert.match(output,/Опублікуй допис/);
 assert.equal(requests.filter(x=>x==="/world/quests").length,2);
});

test("Persistent network failures show a localized retry message",async()=>{
 const {output,requests}=await openProgress({failAlways:true});
 assert.match(output,/API світу недоступний/);
 assert.match(output,/data-ww="retry"/);
 assert.equal(requests.filter(x=>x==="/world/quests").length,2);
});

test("Failed quest API does not hide XP and shows a working retry control",async()=>{
 const {output}=await openProgress({failQuest:true});
 assert.match(output,/85 XP/);
 assert.match(output,/Quests temporarily unavailable/);
 assert.match(output,/data-ww="retry"/);
 assert.doesNotMatch(output,/quests is not defined/);
});

test("Guest ranking remains accessible without attempting private quest requests",async()=>{
 const {output,requests}=await openProgress({loggedIn:false});
 assert.match(output,/Рейтинг спільноти/);
 assert.doesNotMatch(output,/quests is not defined/);
 assert.equal(requests.includes("/world/quests"),false);
});

test("Header language selector uses the shared site theme and responsive accessible controls",()=>{
 assert.match(html,/class="wrld-lang-picker"/);
 assert.match(html,/id="siteLanguage" aria-label="Site language"/);
 assert.match(html,/wrld-lang-caption" data-en="Language" data-uk="Мова"/);
 assert.match(html,/wrld-world\.mjs\?v=7/);
 assert.match(html,/wrld-polish\.css\?v=2/);
 assert.match(stylesheet,/\.wrld-lang-picker:focus-within/);
 assert.match(stylesheet,/#siteLanguage\{appearance:none/);
 assert.match(stylesheet,/var\(--panel\)/);
 assert.match(stylesheet,/var\(--accent2\)/);
 assert.match(stylesheet,/@media\(max-width:470px\)/);
});
