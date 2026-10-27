import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const a=readFileSync(new URL("../backend/world.js",import.meta.url),"utf8");
const b=readFileSync(new URL("../backend/world-feed.js",import.meta.url),"utf8");
test("Comment and follow writes route to the action handler, not the feed",()=>{
 assert.match(a,/\["\/world\/comment","\/world\/follow"\]\.includes\(path\)\)result=await worldDiscuss/);
 assert.doesNotMatch(a,/\["\/world\/feed","\/world\/post","\/world\/like","\/world\/comments","\/world\/comment"/);
});
test("Following feed only shows the account and followed users",()=>{
 assert.match(b,/url\.searchParams\.get\("mode"\)==="following"/);
 assert.match(b,/f\.follower=\? AND f\.followed=p\.author/);
 assert.match(b,/db\.prepare\(sql\)\.bind\(me\.id,me\.id\)/);
 assert.match(b,/if\(following&&!me\)return out\(\{posts:\[\]\}\)/);
});
