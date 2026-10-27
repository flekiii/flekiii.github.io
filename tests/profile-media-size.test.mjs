import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const backend=read("backend/profiles.js"),frontend=read("wrld-profile.js"),html=read("index.html"),migration=read("backend/migrations/2026-10-26-profiles.sql");
const limitSource=backend.match(/const MAX_MEDIA_BYTES=[^;]+;/)?.[0];
assert.ok(limitSource);
const {MAX_MEDIA_BYTES,MEDIA_CHUNK_BYTES,mediaParts,joinMedia}=runInNewContext(limitSource+"\n"+backend.match(/function mediaParts\(raw\)\{[^\n]+\}/)?.[0]+"\n"+backend.match(/function joinMedia\(parts\)\{[^\n]+\}/)?.[0]+"\n({MAX_MEDIA_BYTES,MEDIA_CHUNK_BYTES,mediaParts,joinMedia})",{Uint8Array});
test("Photo and GIF both use exactly 3 MiB cap on client and server",()=>{
 assert.equal(MAX_MEDIA_BYTES,3145728);
 assert.match(frontend,/imageLimits=\{avatar:3\*1024\*1024,banner:3\*1024\*1024\}/);
 assert.match(frontend,/3 MB max/);
 assert.match(backend,/raw\.length>MAX_MEDIA_BYTES/);
 assert.match(html,/wrld-profile\.js\?v=11/);
});
test("3 MiB GIF data round-trips across safe D1 chunks without losing frames",()=>{
 const data=new Uint8Array(MAX_MEDIA_BYTES);data.set(Uint8Array.from(Buffer.from("GIF89a","ascii")));data[data.length-1]=77;
 const chunks=mediaParts(data);assert.equal(chunks.length,6);
 assert.ok(chunks.every(chunk=>chunk.length<=MEDIA_CHUNK_BYTES));
 const assembled=joinMedia(chunks.map(data=>({data})));
 assert.equal(assembled.length,data.length);
 assert.deepEqual([...assembled.slice(0,6)],[...data.slice(0,6)]);
 assert.equal(assembled.at(-1),77);
 assert.equal(joinMedia([{data:new Uint8Array(MAX_MEDIA_BYTES+1)}]),null);
});
test("D1 writes are atomic and legacy images remain readable",()=>{
 assert.match(backend,/await db\.batch\(\[/);
 assert.match(backend,/let bytes=new Uint8Array\(media\.data\)/);
 assert.match(backend,/wrld_profile_media_chunks WHERE user_id=\? AND kind=\? ORDER BY part ASC/);
 assert.match(backend,/DELETE FROM wrld_profile_media_chunks/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS wrld_profile_media_chunks/);
 assert.match(migration,/ON DELETE CASCADE/);
});
