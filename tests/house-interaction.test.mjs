import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import * as core from "../wrld-home-core.mjs";
const source=readFileSync(new URL("../wrld-home.mjs",import.meta.url),"utf8");
test("Room controls really switch rooms, place furniture in chosen room and survive saved reload",()=>{
 const callbacks={},fields={},stored=new Map([
  ["fleki_wrld_house_mode","2d"],
  ["fleki_wrld_house_settings",JSON.stringify({template:"starter",name:"Test cottage"})]
 ]);
 const make=(id="")=>{
  const el={
   id,dataset:{},hidden:false,style:{},children:[],textContent:"",disabled:false,
   classList:{add(){},remove(){},toggle(){},contains(value){return id==="page-home"&&value==="active"}},
   setAttribute(){},
   append(child){this.children.push(child)},
   replaceChildren(...items){this.children.splice(0,this.children.length,...items)},
   addEventListener:(type,cb)=>callbacks[id+":"+type]=cb,
   querySelectorAll(sel){return id==="houseRooms"?this.children:
    id==="page-home"&&sel.includes("data-house-mode")?modes:[]},
   getBoundingClientRect:()=>({width:850,height:540,left:0,top:0,bottom:540}),
   setPointerCapture(){},remove(){},
   focus(){}
  };
  return el;
 };
 const modes=["3d","2d"].map(mode=>{const e=make();e.dataset.houseMode=mode;return e});
 const $=id=>fields[id]??(fields[id]=make(id));
 const gradient={addColorStop(){}};
 const ctx=new Proxy({},{
  get(_t,key){if(key==="createRadialGradient")return()=>gradient;return()=>{}},
  set(){return true}
 });
 $("houseCanvas").getContext=()=>ctx;
 const document={
  hidden:false,activeElement:null,getElementById:$,createElement:()=>make(),
  addEventListener:(type,cb)=>callbacks["document:"+type]=cb
 };
 const window={
  devicePixelRatio:1,addEventListener:(type,cb)=>callbacks["window:"+type]=cb,
  innerWidth:1050
 };
 const library={
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,val)=>stored.set(key,val),removeItem:key=>stored.delete(key)},
  matchMedia:()=>({matches:false}),
  ResizeObserver:class{observe(){}},
  requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  performance:{now:()=>20},confirm:()=>true,
  innerWidth:1050,window,document,navigator:{deviceMemory:1}
 };
 const body=source.replace(/^import[\s\S]*?from "\.\/wrld-home-core\.mjs\?v=\d+";/m,"");
 runInNewContext(body,{...core,...library});
 assert.equal($("houseRooms").children.length,3);
 const two=$("houseRooms").children[1];
 callbacks["page-home:click"]({target:{closest(selector){
  return selector==="[data-house-room]"?two:null;
 }}});
 assert.equal(two.dataset.houseRoom,"room2");
 assert.match($("houseNotice").textContent,/Обрано кімнату/);
 callbacks["houseCatalogue:click"]({target:{closest:()=>({dataset:{furniture:"plant"}})}});
 const saved=JSON.parse(stored.get(core.STORE_KEY));
 assert.equal(saved.items.length,4);
 assert.equal(core.atRoom(saved.items.at(-1).x,saved.items.at(-1).z),"room2");
 callbacks["window:wrld:house-create"]({detail:{template:"mansion",name:"Seven-room test house"}});
 assert.equal($("houseRooms").children.length,7);
 assert.equal($("houseCount").textContent,"7/90 items");
 assert.equal($("houseNameDisplay").textContent,"Seven-room test house");
 const seven=$("houseRooms").children[6];
 callbacks["page-home:click"]({target:{closest:sel=>sel==="[data-house-room]"?seven:null}});
 assert.match($("houseNotice").textContent,/Їдальня/);
 callbacks["houseCatalogue:click"]({target:{closest:()=>({dataset:{furniture:"plant"}})}});
 assert.equal(JSON.parse(stored.get(core.STORE_KEY)).items.length,8);
});
