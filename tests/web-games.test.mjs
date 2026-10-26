import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
import {memoryDeck,tttResult,cpuMove} from "../wrld-web-games-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),js=read("wrld-web-games.js");
test("Web Games comes between Create House and Games",()=>{
 const c=html.indexOf('id:"create-house",name:"Create House"'),w=html.indexOf('id:"web-games",name:"Web Games"'),g=html.indexOf('id:"games",uk:"Ігри"');
 assert.ok(c>=0&&c<w&&w<g);assert.match(html,/wrld-web-games-root/);assert.match(html,/wrld-web-games.js/);
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);assert.doesNotThrow(()=>new Function(script));
});
test("Web Games requires a server-confirmed account but not 2FA",()=>{
 assert.match(js,/fetch\(endpoint/);assert.match(js,/Authorization:"Bearer "/);assert.match(js,/data\?\.user\?\.id/);assert.match(js,/fw-auth-changed/);
 assert.doesNotMatch(js,/mfa_verified|ensure2fa|\/mfa\/verify/);
});
test("Monobank donation linked in About",()=>{
 assert.match(html,/https:\/\/send\.monobank\.ua\/jar\/91HH8iY31q/);
 assert.match(html,/about-social-card donate/);assert.match(html,/Donate via Monobank/);
});
test("Memory has eight real pairs",()=>{
 const deck=memoryDeck(()=>0.5);assert.equal(deck.length,16);
 const counts=new Map();for(const s of deck)counts.set(s,(counts.get(s)||0)+1);
 assert.equal(counts.size,8);assert.ok([...counts.values()].every(x=>x===2));
});
test("Tic tac toe picks a win or block",()=>{
 assert.equal(tttResult(["X","X","X","","","","","",""])?.winner,"X");
 assert.equal(tttResult(["X","O","X","X","O","O","O","X","X"])?.winner,"draw");
 assert.equal(cpuMove(["X","X","","O","","","","",""]),2);
 assert.equal(cpuMove(["O","O","","X","X","","","",""]),2);
});
