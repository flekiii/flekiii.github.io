import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 LIMIT,TYPES,TYPE_BY_ID,ROOMS,START_ITEMS,WALLS,size,validItem,
 canPlace,restore,encode,cloneItems,findPlace,atRoom
} from "../wrld-home-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),css=read("wrld-home.css"),moduleCode=read("wrld-home.mjs");

test("The Home page is an editable house, not the old hero and marketing tiles",()=>{
 assert.match(html,/id="page-home"[^>]+wrld-house-page|class="page active wrld-house-page" id="page-home"/);
 for(const id of ["houseStage","houseCanvas","houseCatalogue","houseRotate","houseDelete","houseResetCamera","houseStorage","houseNotice","houseCount"]){
  assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 }
 for(const mode of ["auto","3d","2d"])assert.ok(html.includes('data-house-mode="'+mode+'"'));
 for(const room of ["living","bedroom","studio"])assert.ok(html.includes('data-house-room="'+room+'"'));
 assert.match(html,/wrld-home\.mjs\?v=1/);
 assert.match(html,/wrld-home\.css\?v=1/);
 assert.doesNotMatch(html,/id="homeTiles"|WELCOME TO SOMETHING DIFFERENT|YOUR DESTINATIONS/);
 for(const section of ["games","apps","marketplace","chat","profile","notifications","about"])
  assert.ok(html.includes('id:"'+section+'"')||html.includes("id:'"+section+"'"),"Lost navigation "+section);
 assert.match(html,/wrld:page-change/);
});

test("All default furniture fits three realistic rooms without wall or piece collisions",()=>{
 assert.equal(START_ITEMS.length,10);
 assert.equal(Object.keys(ROOMS).length,3);
 assert.ok(WALLS.length>=4);
 assert.ok(TYPES.length>=12);
 for(const item of START_ITEMS){
  assert.equal(validItem(item),true,"Invalid default item "+item.id);
  assert.equal(canPlace(item,START_ITEMS),true,"Furniture overlaps "+item.id);
 }
 for(const t of TYPES){
  assert.equal(TYPE_BY_ID[t.id],t);
  assert.ok(t.w>0&&t.d>0);
 }
});

test("Furniture can be rotated, cannot walk through walls or overlap other furniture",()=>{
 const example={id:"draft",type:"sofa",x:0,z:-2.0,rot:0};
 assert.equal(validItem(example),true);
 assert.equal(size({...example,rot:1}).w,TYPE_BY_ID.sofa.d);
 assert.equal(size({...example,rot:1}).d,TYPE_BY_ID.sofa.w);
 assert.equal(validItem({...example,x:4.8}),false);
 assert.equal(validItem({...example,z:.5}),false);
 const existing=[{id:"one",type:"bed",x:-3,z:2,rot:0}];
 assert.equal(canPlace({id:"two",type:"chair",x:-3,z:2,rot:0},existing),false);
 assert.equal(canPlace({id:"one",type:"bed",x:-3,z:2,rot:0},existing),true);
 assert.equal(canPlace({id:"rug",type:"rug",x:-3,z:2,rot:0},existing),true);
});

test("Any room can accept furniture; save/reload produces identical arrangement",()=>{
 for(const room of Object.keys(ROOMS)){
  let found=0;
  for(const t of TYPES){
   const item=findPlace(t.id,START_ITEMS,room);
   if(!item)continue;
   found++;
   assert.equal(atRoom(item.x,item.z),room);
   assert.equal(canPlace(item,START_ITEMS),true);
  }
  assert.ok(found>=7,"Not enough furniture choices fit "+room);
 }
 const raw=encode(START_ITEMS);
 assert.deepEqual(restore(raw),cloneItems(START_ITEMS));
 assert.deepEqual(restore("not valid"),cloneItems(START_ITEMS));
 assert.deepEqual(restore('{"version":999,"items":[]}'),cloneItems(START_ITEMS));
 assert.deepEqual(restore('{"version":1,"items":[{"type":"chair","id":"invalid","x":500,"z":0,"rot":0}]}'),[]);
 assert.equal(restore(JSON.stringify({version:1,items:Array.from({length:LIMIT+4},(_,i)=>({id:"thing-"+i,type:"plant",x:0,z:0,rot:0}))})).length,1);
});

test("Auto fallback, performance cap, scene disposal, and local-only persistence are explicit",()=>{
 assert.match(moduleCode,/deviceMemory/);
 assert.match(moduleCode,/prefers-reduced-motion/);
 assert.match(moduleCode,/webgl2/);
 assert.match(moduleCode,/three@0\.180\.0/);
 assert.match(moduleCode,/slow>30/);
 assert.match(moduleCode,/setMode\("2d",false\)/);
 assert.match(moduleCode,/dispose3d/);
 assert.match(moduleCode,/window\.addEventListener\("wrld:page-change"/);
 assert.match(moduleCode,/localStorage\.setItem\(STORE_KEY/);
 assert.doesNotMatch(moduleCode,/fetch\(|\/api\/house|\/api\/room/);
 assert.match(css,/body:has\(#page-home\.active\)/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/\.house-catalogue/);
});
