import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import * as core from "../wrld-home-core.mjs";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const backend=get("backend/houses.js"),creator=get("wrld-house-creator.mjs"),profile=get("wrld-profile.js"),html=get("index.html");
test("House publication requires sign-in but not 2FA; reactions remain protected",()=>{
 const publish=backend.indexOf('if(method==="PUT"&&path==="/houses/publish")');
 const reactions=backend.indexOf('if(method==="POST"&&path==="/houses/react")');
 const check=backend.indexOf('if(!authorized(user))');
 assert.ok(publish>0&&reactions>publish&&check>reactions);
 assert.match(backend,/Verify Auth2FA before reacting/);
 assert.match(backend,/const user=await auth\(req,db\);if\(!user\)/);
});
test("Garage floor plans are serializable in the publishing payload",()=>{
 for(const id of ["garage","garagehouse","workshop"]){
  core.setLayout(id);
  const items=core.cloneItems(core.START_ITEMS);
  assert.ok(items.length>0);
  for(const item of items)assert.ok(["id","type","x","z","rot"].every(k=>k in item));
 }
 core.setLayout("starter");
});
test("Share, publish and profile all persist the visible in-profile flag",()=>{
 assert.match(creator,/publish\(true\)/);
 assert.match(creator,/in_profile:showInProfile/);
 assert.match(creator,/check\.house\.in_profile!==showInProfile/);
 assert.match(creator,/wrld:house-published/);
 assert.match(creator,/wrld:house-publish-error/);
 assert.doesNotMatch(creator,/houseProfileCard/);
});
test("Profile Studio shows published houses and offers a publish button",()=>{
 assert.match(profile,/\["house","⌂","My house","Мій будинок"\]/);
 assert.match(profile,/data-wp="publish-house"/);
 assert.match(profile,/\/houses\/mine/);
 assert.match(profile,/\/houses\/profile\?user=/);
 assert.match(profile,/housePreview\(myHouse\)/);
 assert.match(html,/wrld-house-creator\.mjs\?v=4/);
 assert.match(html,/wrld-profile\.js\?v=4/);
 assert.match(html,/wrld-profile\.css\?v=2/);
 assert.doesNotThrow(()=>new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]));
});
