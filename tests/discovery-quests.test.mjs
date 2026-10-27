import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),profile=read("wrld-profile.js"),backend=read("backend/profiles.js"),
 world=read("backend/world.js"),discovery=read("backend/discover.js"),worker=read("backend/worker.js"),games=read("backend/game-catalog.js"),picker=read("wrld-game-picker.js");
test("Quest XP must be granted only for a real server-side action, with unique claim constraint",()=>{
 assert.match(world,/CREATE TABLE IF NOT EXISTS wrld_world_quest_claims/);
 assert.match(world,/SELECT COUNT\(\*\) n FROM wrld_world_posts/);
 assert.match(world,/SELECT COUNT\(\*\) n FROM wrld_world_comments/);
 assert.match(world,/if\(!found.complete\)return err/);
 assert.match(world,/INSERT OR IGNORE INTO wrld_world_quest_claims/);
 assert.match(world,/Number\(inserted.meta\?\.changes\)!==1/);
 assert.match(world,/const daily=q.id==="share-post"\|\|q.id==="leave-comment"\|\|q.id.startsWith\("arcade-"\),day=daily\?currentDay:-1/);
});
test("Profile retains private exact age and controls public interests and status",()=>{
 assert.match(backend,/age:can\("age"\)&&extra.age\?Number\(extra.age\):null/);
 assert.match(backend,/visible\(privacyMap,field,relationType\)/);
 assert.match(backend,/p.discoverable===true/);
 assert.match(backend,/age<13\|\|age>120/);
 assert.match(profile,/data-wp-boolean="discoverable"/);
 assert.match(profile,/wp-level/);
 assert.match(profile,/status_emoji/);
 assert.match(profile,/interests/);
});
test("Discovery requires opt-in and restricts both sides to one self-reported age group",()=>{
 assert.match(discovery,/if\(!ageRange\(mine\?\.age,"friends"\)\)/);
 assert.match(discovery,/ageRange\(mine\.age,"dating"\)/);
 assert.match(discovery,/mine.discoverable!==1/);
 assert.match(discovery,/teen\?"e.age<18":"e.age>=18"/);
 assert.match(discovery,/NOT EXISTS\(SELECT 1 FROM blocks/);
 assert.match(discovery,/wrld_profile_bans/);
 assert.doesNotMatch(discovery,/phone|district|\.age\s*,\s*interests:/);
 const screen=read("wrld-discover.mjs");
 assert.match(screen,/Dating · 15\+/);
 assert.match(discovery,/wrld_discovery_dating/);
 assert.match(discovery,/if\(sourceMode==="dating"\)/);
 assert.match(screen,/data-fd="report"/);
 assert.match(screen,/data-fd="block"/);
 assert.match(html,/id="wrld-discover-root"/);
 assert.match(html,/id:"discover"/);
});
test("Game picker searches cross-platform titles without rate-limited 1,000-game paging",()=>{
 assert.match(games,/steamspy\.com\/api\.php\?request=all&page=/);
 assert.match(games,/slice\(0,1000\)/);
 assert.match(games,/next_page:n\+1/);
 assert.match(picker,/cheapshark\.com\/api\/1\.0\/games/);
 assert.match(picker,/freetogame\.com\/api\/games/);
 assert.match(picker,/Fortnite/);
 assert.doesNotMatch(picker,/\/games\/catalog\?page=/);
 assert.match(picker,/cdn\.akamai\.steamstatic\.com\/steam\/apps/);
 assert.match(profile,/WrldGamePicker\?\.render/);
 assert.match(html,/wrld-game-picker\.js\?v=3/);
});
test("Versioned assets and Worker routes match",()=>{
 assert.match(worker,/discoverHandle\(req,env,path/);
 assert.match(worker,/gamesCatalog\(req,path\)/);
 assert.match(html,/wrld-profile\.js\?v=11/);
 assert.match(html,/wrld-world\.mjs\?v=7/);
 assert.match(html,/wrld-discover\.mjs\?v=7/);
});
