import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("wrld-showcase.mjs"),css=read("wrld-showcase.css"),html=read("index.html");
const userId="123e4567-e89b-42d3-a456-426614174000";
async function setup(detail={},resultOk=true){
 const received=[],handlers={},events={};
 const root={innerHTML:"",cardHTML:"",addEventListener:(name,fn)=>handlers[name]=fn,
  querySelector(query){
   if(query==='[data-sc-index="0"]')return {dataset:{scUsername:"testuser"},set outerHTML(markup){root.cardHTML=markup}};
   return null;
  }};
 const document={documentElement:{lang:"uk"},getElementById:id=>id==="wrld-showcase-root"?root:id==="page-showcase"?{classList:{contains:()=>true}}:null};
 const window={addEventListener:(name,fn)=>{events[name]=fn},WrldInterests:{label:x=>x==="Gaming"?"Ігри":x}};
 const base={username:"testuser",display_name:"Example",bio:"Public introduction",level:2,xp:90,score:4.5,votes:3,interests:["Gaming"],own:true};
 const fetch=async (url,options)=>{
  const {pathname}=new URL(url);received.push({pathname,authorization:options?.headers?.Authorization||null,credentials:options?.credentials});
  if(pathname==="/showcase/list")return {ok:true,json:async()=>({profiles:[base],my_visible:true})};
  if(pathname==="/profiles/public/testuser")return resultOk?{ok:true,json:async()=>({profile:{id:userId,username:"testuser",display_name:"Example",bio:"Public introduction",favorite_games:["Fortnite","Minecraft"],current_games:["VALORANT"],avatar:true,banner:true,interests:["Gaming"],accent:"#b476ec",...detail}})}:{ok:false,status:503,json:async()=>({})};
  throw Error("Unexpected path "+pathname);
 };
 vm.runInNewContext(source,{document,window,sessionStorage:{getItem:()=> "session"},fetch,AbortController,URL,encodeURIComponent,setTimeout:()=>1,clearTimeout:()=>{},location:{hash:""}});
 events["wrld:page-change"]({detail:{id:"showcase"}});
 for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));
 return {root,received,handlers,events};
}
test("Showcase fetches server-filtered public profiles without signed-in authentication",async()=>{
 const s=await setup();
 const list=s.received.find(x=>x.pathname==="/showcase/list");
 const detail=s.received.find(x=>x.pathname==="/profiles/public/testuser");
 assert.ok(list);assert.ok(detail);
 assert.equal(list.authorization,"Bearer session");
 assert.equal(detail.authorization,null);
 assert.equal(detail.credentials,"omit");
});
test("Real public avatar, animated banner and both saved game lists render",async()=>{
 const s=await setup(),markup=s.root.cardHTML;
 assert.match(markup,/sc-banner-image/);
 assert.match(markup,/sc-avatar/);
 assert.match(markup,/\/profiles\/media\/123e4567-e89b-42d3-a456-426614174000\/avatar/);
 assert.match(markup,/\/profiles\/media\/123e4567-e89b-42d3-a456-426614174000\/banner/);
 assert.match(markup,/Fortnite/);assert.match(markup,/Minecraft/);assert.match(markup,/VALORANT/);
 assert.match(markup,/Улюблені ігри/);assert.match(markup,/Зараз граю/);
 assert.match(markup,/--sc-accent:#b476ec/);
 assert.match(markup,/Ігри/);
});
test("Private image and game fields are never invented from the local account",async()=>{
 const s=await setup({avatar:false,banner:false,favorite_games:null,current_games:null,interests:null,bio:null});
 const markup=s.root.cardHTML;
 assert.doesNotMatch(markup,/sc-banner-image/);
 assert.doesNotMatch(markup,/\/profiles\/media\//);
 assert.doesNotMatch(markup,/Fortnite|VALORANT/);
 assert.doesNotMatch(markup,/Public introduction/);
 assert.doesNotMatch(markup,/Улюблені ігри/);
});
test("Unreachable profile API preserves the existing basic Showcase card",async()=>{
 const s=await setup({},false);
 assert.match(s.root.innerHTML,/Example/);
 assert.equal(s.root.cardHTML,"");
});
test("Compact card grid never stretches a single member across the full Showcase width",()=>{
 assert.match(css,/\.sc-showcase\{[^}]*max-width:1040px/);
 assert.match(css,/\.sc-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:590px\)/);
 assert.match(html,/wrld-showcase\.css\?v=2/);
 assert.match(html,/wrld-showcase\.mjs\?v=3/);
});
