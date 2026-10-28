import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../wrld-web-games.js",import.meta.url),"utf8");
// VM injects exact functional stand-ins for module imports, so this catches
// actual runtime boot errors as well as syntax errors in the catalogue.
const standalone=code.replace(/^import .*$/gm,"");
const extraIds=["wordmix","hangman","typing","sequence","colors","simon","mines","lights","slide","connect"];
async function boot(authenticated){
 const root={innerHTML:"",addEventListener(){},contains(){return true}};
 const page={classList:{contains:()=>true}};
 const handlers={};
 const document={documentElement:{lang:"uk"},getElementById:id=>id==="wrld-web-games-root"?root:id==="page-web-games"?page:null,addEventListener(){}};
 const fake={document,window:{addEventListener:(event,fn)=>{handlers[event]=fn},WrldProfile:null},
 sessionStorage:{getItem:()=>authenticated?"test-token":null},
 fetch:async()=>({ok:true,json:async()=>({user:{id:"u1",username:"player"}})}),
 memoryDeck:()=>Array(16).fill("🎮"),tttResult:()=>null,cpuMove:()=>0,
 shift2048:()=>({board:Array(16).fill(0),moved:false,points:0}),newTile2048:a=>a,
 canShift2048:()=>true,EXTRA_GAMES:extraIds,
 createExtraArcade:()=>({cancel(){},start(){},render(){},action(){},submit(){}}),
 setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},console};
 vm.runInNewContext(standalone,fake,{filename:"wrld-web-games.js"});
 for(let i=0;i<6;i++)await Promise.resolve();
 return {markup:root.innerHTML,handlers};
}
test("The Web Games browser module has valid executable syntax",()=>{
 assert.doesNotThrow(()=>new vm.Script(standalone,{filename:"wrld-web-games.js"}));
});
test("Unauthenticated visitors see a sign-in gate, never a blank panel",async()=>{
 const {markup}=await boot(false);
 assert.match(markup,/wg-gate/);
 assert.match(markup,/data-wg="sign"/);
});
test("Signed-in members see all 22 playable game cards on first visit",async()=>{
 const {markup}=await boot(true);
 assert.match(markup,/22 браузерні ігри/);
 assert.match(markup,/wg-grid/);
 assert.equal((markup.match(/data-wg="launch"/g)||[]).length,22);
 for(const name of ["memory","ttt","mathadd","mathmultiply","connect","mines"])assert.ok(markup.includes('data-game="'+name+'"'),name);
});
