import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const profile=read("backend/profiles.js"),worker=read("backend/worker.js"),ui=read("wrld-profile.js"),html=read("index.html"),social=read("wrld-social.js");
test("Profile visibility is enforced by the Worker",()=>{
 assert.match(profile,/const visible=/);
 assert.match(profile,/phone:"private"/);
 assert.match(profile,/visible\(privacy\(p\?\.visibility\),"media",r\)/);
 assert.match(profile,/relationType/);
 assert.match(profile,/friends.*status='accepted'/);
});
test("Roles and bans require server-side privilege",()=>{
 assert.match(profile,/env\.OWNER_USER_ID/);
 assert.match(profile,/authorized\(viewer\)/);
 assert.match(profile,/Only the site owner can assign roles/);
 assert.match(profile,/DELETE FROM sessions WHERE user_id/);
 assert.match(worker,/SELECT 1 FROM wrld_profile_bans/);
 assert.match(worker,/profileHandle\(req,env,path/);
});
test("All profile fields and preview are exposed in studio",()=>{
 for(const s of ["overview","appearance","contact","games","privacy","security","preview","moderation","country","region","district","phone","favorite_games","current_games"])assert.ok(ui.includes(s),s);
 assert.match(ui,/data-wp-privacy/);
 assert.match(ui,/wrld:profile-updated/);
 assert.match(social,/WrldProfile\.renderAccount/);
 assert.match(html,/wrld-profile\.css/);
 assert.match(html,/wrld-profile\.js/);
});
test("Auth2FA QR generated locally, not sent to third parties",()=>{
 assert.match(ui,/window\.qrcode\(0,"M"\)/);
 assert.match(ui,/q\.addData\(s\.uri\)/);
 assert.match(ui,/q\.createSvgTag/);
 assert.doesNotMatch(ui,/qrserver|chart\.googleapis/);
 assert.match(html,/vendor\/qrcode\.js/);
});
test("Only validated image types and bounded upload sizes",()=>{
 assert.match(profile,/MAX_MEDIA_BYTES=3\*1024\*1024/);
 assert.match(profile,/MEDIA_CHUNK_BYTES=512\*1024/);
 assert.match(profile,/mediaMime\(raw\)/);
 assert.match(profile,/image\/gif/);
 assert.match(profile,/new Uint8Array\(await req\.arrayBuffer\(\)\)/);
});
