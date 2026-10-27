import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {EXTRA_GAMES,connectWinner,dropChip,slideAdjacent,toggleLights,mineNeighbors,scramble,createExtraArcade} from "../wrld-web-games-extra.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const client=read("wrld-web-games.js"),html=read("index.html"),css=read("wrld-web-games.css");
test("22 registered games with ten actual extra game modes and menu wiring",()=>{
 assert.equal(EXTRA_GAMES.length,10);
 assert.equal(new Set(EXTRA_GAMES).size,10);
 assert.match(client,/EXTRA_GAMES.includes\(key\)/);
 assert.match(client,/extra\.action\(b\.dataset\.command,b\.dataset\.choice\)/);
 assert.match(client,/extra\.submit\(e\.target\)/);
 assert.match(html,/wrld-web-games\.js\?v=4/);
 assert.match(css,/body\.web-games-view\{height:100dvh;overflow:hidden/);
});
test("Word scramble changes order without modifying letters",()=>{
 for(const word of ["GALAXY","PUZZLE","ROCKET"]){
  const mixed=scramble(word);
  assert.notEqual(mixed,word);
  assert.deepEqual([...mixed].sort(),[...word].sort());
 }
});
test("Lights Out flips only a cell and its orthogonal neighbors",()=>{
 const b=Array(16).fill(false),changed=toggleLights(b,5);
 assert.deepEqual(changed.map((v,i)=>v?i:-1).filter(i=>i>=0),[1,4,5,6,9]);
 assert.deepEqual(toggleLights(changed,5),b);
});
test("Sliding puzzle rejects row wrap-around and non-neighbor moves",()=>{
 assert.equal(slideAdjacent(2,3),false);
 assert.equal(slideAdjacent(3,4),true);
 assert.equal(slideAdjacent(4,7),true);
 assert.equal(slideAdjacent(0,8),false);
});
test("Connect Four uses gravity and detects horizontal, vertical and diagonal wins",()=>{
 let b=Array(42).fill("");
 for(let i=0;i<4;i++)b=dropChip(b,i,"P");
 assert.equal(connectWinner(b),"P");
 b=Array(42).fill("");
 for(let i=0;i<4;i++)b=dropChip(b,1,"C");
 assert.equal(connectWinner(b),"C");
 b=Array(42).fill("");
 for(let r=0;r<4;r++)b[(5-r)*7+r]="P";
 assert.equal(connectWinner(b),"P");
 assert.equal(dropChip(b,-1,"P"),null);
 b=Array(42).fill("");
 for(let i=0;i<6;i++)b=dropChip(b,1,"C");
 assert.equal(dropChip(b,1,"C"),null);
});
test("Minesweeper has bounded neighbors and never mines the first clicked square",()=>{
 assert.deepEqual(mineNeighbors(0),[1,5,6]);
 assert.equal(mineNeighbors(12).length,8);
 let markup="";
 const game=createExtraArcade({frame:(id,content)=>markup=content,t:()=> "← All games"});
 game.start("mines");game.action("mine","0");
 assert.match(markup,/Safe cells: [1-9]/);
 assert.doesNotMatch(markup,/Boom!/);
});
test("Each new mode renders nontrivial playable UI, not an empty card",()=>{
 let markup="",name="";
 const game=createExtraArcade({frame:(id,content)=>{name=id;markup=content},t:key=>key==="back"?"← All games":key});
 for(const id of EXTRA_GAMES){
  game.start(id);
  assert.equal(name,id);
  assert.ok(markup.length>90,"Empty game: "+id);
  assert.match(markup,/data-wg="extra"|id="wg-extra-form"/);
  game.cancel();
 }
});
test("New local games never mint XP themselves",()=>{
 assert.doesNotMatch(read("wrld-web-games-extra.mjs"),/\/world\/quest\/claim|\/arcade\/answer|\/world\/xp|Authorization/);
});
