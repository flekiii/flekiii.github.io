import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ROOMS,setLayout,HOUSE_TEMPLATES,START_ITEMS} from "../wrld-home-core.mjs";
import {publicHouseRooms,publicHouseWalls} from "../wrld-public-house-3d.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const view=read("wrld-house-creator.mjs"),engine=read("wrld-public-house-3d.mjs"),html=read("index.html"),css=read("wrld-home-creator.css");
test("All public floor plans match the editor without mutating the editor's active layout",()=>{
 setLayout("garage");const old=JSON.stringify(ROOMS),furniture=JSON.stringify(START_ITEMS);
 for(const plan of HOUSE_TEMPLATES){
  const rooms=publicHouseRooms(plan.id);
  assert.equal(rooms.length,plan.rooms);
  assert.ok(rooms.every(r=>r.w>0&&r.d>0));
  const walls=publicHouseWalls(rooms);
  assert.ok(walls.every(w=>w.to>w.from&&["x","z"].includes(w.axis)));
  const shouldHaveGarage=["garage","garagehouse","workshop"].includes(plan.id)?1:0;
  assert.equal(rooms.filter(r=>r.garage).length,shouldHaveGarage);
 }
 assert.equal(JSON.stringify(ROOMS),old);
 assert.equal(JSON.stringify(START_ITEMS),furniture);
 setLayout("starter");
});
test("The visitor gets 3D first, can switch to 2D, zoom and reset camera",()=>{
 assert.match(view,/await switchPublicMode\("3d"\)/);
 assert.match(view,/data-house-view-mode="3d"/);
 assert.match(view,/data-house-view-mode="2d"/);
 assert.match(view,/data-house-camera="reset"/);
 assert.match(view,/data-house-camera="zoom-in"/);
 assert.match(view,/id="publicHouse2D"/);
 assert.match(view,/housePlan\(h\)/);
 assert.match(css,/\.wrld-public-3d/);
 assert.match(html,/wrld-house-creator\.mjs\?v=7/);
 assert.match(html,/wrld-home-creator\.css\?v=7/);
});
test("3D scene has the same real furniture meshes as the editable house",()=>{
 assert.match(engine,/for\(const item of house\.items\|\|\[\]\)/);
 for(const type of ['case "sofa"','case "bed"','case "car"','case "tools"','case "arcade"'])assert.ok(engine.includes(type),type);
 assert.match(engine,/new THREE\.WebGLRenderer/);
 assert.match(engine,/three@0\.180\.0\/build\/three\.module\.js/);
});
test("WebGL failures fall back to 2D; changes in page or mode dispose 3D properly",()=>{
 assert.match(view,/disposePublic3D\(\)/);
 assert.match(view,/if\(ticket!==publicModeId\)/);
 assert.match(view,/if\(request!==publicLoadId\)return/);
 assert.match(view,/flat\.hidden=false/);
 assert.match(engine,/renderer\.dispose\(\)/);
 assert.match(engine,/resizeObserver\?\.disconnect/);
 assert.match(engine,/cancelAnimationFrame/);
});
