import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 LIMIT,TYPES,ROOMS,START_ITEMS,HOUSE_TEMPLATES,TEMPLATE_BY_ID,setLayout,
 validItem,canPlace,restore,encode,cloneItems,findPlace,atRoom
} from "../wrld-home-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),core=read("wrld-home-core.mjs"),code=read("wrld-home.mjs"),creator=read("wrld-house-creator.mjs"),css=read("wrld-home-creator.css");
test("English and Ukrainian navigation, separate welcome Home and 3D house editor",()=>{
 assert.match(html,/id:"home",name:"Home",uk:"Головна"/);
 assert.match(html,/id:"create-house",name:"Create House",uk:"Створити дім"/);
 for(const text of ['id="page-home" aria-label="Welcome','id="page-house-editor" aria-label="House editor"','id="siteLanguage"','id="houseOpenButton"','id="continueHouseBtn"',"function applyLanguage(lang)","id==='house-editor'&&!hasHouse()"])assert.ok(html.includes(text),text);
 assert.match(creator,/houseOpenButton"\)\.click\(\)/);
 assert.doesNotMatch(creator,/if\(!getSettings\(\)&&!location\.hash\.startsWith/);
 for(const id of ["page-home","page-create-house","houseTemplateGrid","houseNameInput","houseCreateButton","housePublishButton","houseProfileButton","houseShareButton","houseRooms","houseCanvas","wrldPublicHouse"])
  assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 assert.doesNotMatch(html,/data-house-mode="auto"/);
 assert.match(html,/data-house-mode="3d" aria-pressed="true"/);
 assert.match(code,/choice:"3d"/);
 assert.match(code,/page-house-editor/);
 assert.match(creator,/wrld:house-create/);
 assert.match(creator,/wrld:house-get/);
 assert.match(html,/wrld-house-creator\.mjs/);
});
test("Ten distinct plans include 1–7 rooms and multiple garages",()=>{
 assert.equal(HOUSE_TEMPLATES.length,10);
 assert.deepEqual([...new Set(HOUSE_TEMPLATES.map(x=>x.id))].length,10);
 assert.ok(HOUSE_TEMPLATES.some(x=>x.rooms===1));
 assert.ok(HOUSE_TEMPLATES.some(x=>x.rooms===7));
 assert.ok(HOUSE_TEMPLATES.some(x=>x.id==="garage"));
 for(const plan of HOUSE_TEMPLATES){
  setLayout(plan.id);
  assert.equal(Object.keys(ROOMS).length,plan.rooms,"Room count: "+plan.id);
  assert.ok(START_ITEMS.length>0,"No starter furniture: "+plan.id);
  for(const piece of START_ITEMS){
   assert.equal(validItem(piece),true,"Invalid piece in "+plan.id);
   assert.equal(canPlace(piece,START_ITEMS),true,"Collision in "+plan.id);
  }
  const rooms=Object.keys(ROOMS);
  for(const room of rooms){
   const spot=findPlace("lamp",START_ITEMS,room);
   assert.ok(spot,"Can't add a small lamp in "+room+" / "+plan.id);
   assert.equal(atRoom(spot.x,spot.z),room);
  }
 }
 setLayout("starter");
});
test("Expanded furniture library includes car, garage and house fittings",()=>{
 assert.ok(TYPES.length>=30);
 assert.ok(LIMIT>=60);
 for(const id of ["car","tools","bike","bathtub","stove","fridge","piano","arcade","wardrobe"])
  assert.ok(TYPES.some(x=>x.id===id),id);
 setLayout("garage");
 const x=findPlace("car",START_ITEMS,"room1");
 assert.ok(x,"Garage doesn't fit a car");
 assert.equal(canPlace(x,START_ITEMS),true);
 setLayout("starter");
});
test("Saves are versioned, validate pieces, and reject broken or overlapping coordinates",()=>{
 setLayout("starter");
 const items=cloneItems(START_ITEMS);
 assert.deepEqual(restore(encode(items)),items);
 assert.deepEqual(restore("broken JSON"),items);
 const bad=[{id:"bad",type:"chair",x:55,z:0,rot:0}];
 assert.deepEqual(restore(JSON.stringify({version:1,items:bad})),[]);
 const a=items[0];
 assert.equal(canPlace({...a,id:"another"},items),false);
});
test("Every statically referenced Home control exists and selection fixes are present",()=>{
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 const refs=[...code.matchAll(/\$\("([^"]+)"\)/g)].map(x=>x[1]);
 assert.deepEqual([...new Set(refs)].filter(id=>!ids.has(id)),[]);
 for(const marker of ["updateRoomButtons","chooseRoom","state.three.target","env.target","Object.values(ROOMS)","setMode(mode","setLayout(template)"])
  assert.ok(code.includes(marker),marker);
 assert.match(code,/document\.addEventListener\("keydown"/);
 assert.match(code,/wrld:page-change/);
});
test("Public house sharing and profile placement uses real server endpoints",()=>{
 assert.match(creator,/\/houses\/publish/);
 assert.match(creator,/\/houses\/react/);
 assert.match(creator,/\/houses\/public\?user=/);
 assert.match(creator,/\/houses\/mine/);
 assert.match(creator,/houseProfileCard/);
 assert.match(creator,/fw-token/);
 const backend=read("backend/houses.js");
 assert.match(backend,/authorized\(user\)/);
 assert.match(backend,/wrld_house_reactions/);
 assert.match(backend,/PRIMARY KEY\(owner,reactor\)/);
 assert.equal((backend.match(/"👍"/g)||[]).length,1);
 assert.match(css,/\.wrld-template-grid/);
 assert.match(css,/\.wrld-public-reactions/);
});
