import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const code=readFileSync(new URL("../wrld-profile.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const backend=readFileSync(new URL("../backend/profiles.js",import.meta.url),"utf8");
const detector=code.match(/function sniffImageMime\(bytes\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(detector,"Missing image-signature detection");
const sniff=runInNewContext(detector+"\nsniffImageMime",{String,Uint8Array});

test("PNG mislabeled with a .gif extension is detected as PNG and accepted",()=>{
 const renamedGif=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,1,244]);
 assert.equal(sniff(renamedGif),"image/png");
 assert.match(code,/Content-Type":mime/);
 assert.match(backend,/const mime=mediaMime\(raw\)/);
});
test("Actual GIFs, JPEGs and WebPs retain their real MIME, without flattening animations",()=>{
 assert.equal(sniff(Uint8Array.from(Buffer.from("GIF89a","ascii"))),"image/gif");
 assert.equal(sniff(Uint8Array.from(Buffer.from("GIF87a","ascii"))),"image/gif");
 assert.equal(sniff(Uint8Array.from([255,216,255,0])),"image/jpeg");
 assert.equal(sniff(Uint8Array.from(Buffer.from("RIFFxxxxWEBP","ascii"))),"image/webp");
 assert.equal(sniff(Uint8Array.from(Buffer.from("<svg onload=alert(1) />"))),"");
 assert.doesNotMatch(code,/canvas\.toBlob|canvas\.toDataURL/);
});
test("Profile banner upload previews instantly and frontend assets refresh",()=>{
 assert.match(code,/bannerTemp\|\|banner/);
 assert.match(code,/URL\.createObjectURL\(new Blob\(\[raw\],\{type:mime\}\)\)/);
 assert.match(code,/await uploadMedia\(kind,file\)/);
 assert.match(html,/wrld-profile\.js\?v=4/);
});
