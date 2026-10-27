import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8"),html=get("index.html"),worker=get("backend/worker.js");
test("Home editor and gallery are retired without destroying historic account data",()=>{
 for(const term of ['id:"create-house"','id="page-house-editor"','id="page-house-view"','id="page-create-house"','wrld-house-creator.mjs','wrld-home.mjs'])
  assert.equal(html.includes(term),false,term);
 assert.match(worker,/Houses have been retired/);
});
test("Marketplace accepts real 4 MiB uploads from authorized members",()=>{
 const code=get("backend/market-media.js");
 assert.match(code,/MAX=4\*1024\*1024/);
 assert.match(code,/!authorized\(user\)/);
 assert.match(code,/INSERT INTO market_uploaded_chunks/);
 assert.match(get("wrld-market.js"),/marketPhotoFiles/);
 assert.match(get("wrld-market.js"),/MAX_MARKET_PHOTO=4\*1024\*1024/);
});
test("Showcase is opt-in and stores one 1–5 star vote per account",()=>{
 assert.match(get("backend/showcase.js"),/visible=1/);
 assert.match(get("backend/showcase.js"),/target.user_id===user.id/);
 assert.match(get("backend/showcase.js"),/ON CONFLICT\(voter_id,target_id\)/);
 assert.match(html,/id:"showcase"/);
});
test("Arcade awards XP only for one-time server-verified answers",()=>{
 const code=get("backend/arcade.js");
 assert.match(code,/answer===row.answer/);
 assert.match(code,/UPDATE wrld_arcade_rounds SET used=1/);
 assert.match(code,/Number\(update.meta\?\.changes\)!==1/);
 assert.match(get("wrld-web-games.js"),/mathAnswer/);
});
test("Meet People is 15+ and separates adult and teen requests on server",()=>{
 const code=get("backend/discover.js");
 assert.match(code,/mine.age<15/);
 assert.match(code,/other.age<15/);
 assert.match(code,/\(mine.age<18\)!==\(other.age<18\)/);
 assert.match(get("wrld-discover.mjs"),/\/discover\/request/);
});
test("The site supports accessible focus effects and reduced motion",()=>{
 assert.match(get("wrld-polish.css"),/prefers-reduced-motion:reduce/);
 assert.match(html,/wrld-polish\.css\?v=2/);
});
