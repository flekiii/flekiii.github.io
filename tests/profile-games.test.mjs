import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=get("wrld-game-picker.js"),profile=get("wrld-profile.js"),html=get("index.html");
function setup(){
 const handlers={},events={},calls=[],boxes={
  "wp-game-results":{innerHTML:""},
  "wp-game-query":{value:"Fortnite"}
 };
 const doc={documentElement:{lang:"uk"},addEventListener(k,fn){handlers[k]=fn},getElementById(id){return boxes[id]||null},querySelector(){return null}};
 const win={addEventListener(k,fn){events[k]=fn},dispatchEvent(e){calls.push(e.detail)}};
 const api=async(url)=>{
  if(url.includes("cheapshark"))return {ok:true,json:async()=>[{external:"Red Dead Redemption 2",steamAppID:"1174180",thumb:"https://cdn.example.com/game.jpg"}]};
  if(url.includes("freetogame"))return {ok:true,json:async()=>[{title:"Fortnite",platform:"Windows",thumbnail:"https://www.freetogame.com/example.jpg"}]};
  throw Error("Unexpected "+url);
 };
 const ctx={document:doc,window:win,fetch:api,AbortController,URL,Map,Set,Number,Math,String,Array,JSON,Promise,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},setTimeout,clearTimeout,queueMicrotask,prompt:()=>null};
 vm.runInNewContext(source,ctx);
 const html=win.WrldGamePicker.render({favorite_games:[],current_games:[]});
 return {html,boxes,handlers,events,calls,win};
}
test("Fortnite is immediately selectable without any 1k download",()=>{
 const s=setup();
 s.events["wrld:profile-updated"]?.();
 s.handlers.click({target:{closest:()=>({dataset:{gp:"select",name:"Fortnite"}})},preventDefault(){}});
 assert.equal(s.calls.length,1);
 assert.equal(s.calls[0].games[0],"Fortnite");
 assert.match(s.html,/Epic, consoles and mobile|Epic Games/);
 assert.doesNotMatch(source,/games\/catalog\?page/);
});
test("Multi-store and free-to-play search are supported, with typed fallback",()=>{
 assert.match(source,/cheapshark\.com\/api\/1\.0\/games/);
 assert.match(source,/freetogame\.com\/api\/games/);
 assert.match(source,/data-gp="custom"/);
 assert.match(source,/Fortnite/);
 assert.match(source,/Mario Kart 8 Deluxe/);
 assert.doesNotMatch(source,/Load 1,000 more real games/);
});
test("Public view hides internal Fmail-generated username but keeps visitor preview",()=>{
 assert.match(profile,/fmail_\[a-z0-9\]/);
 assert.match(profile,/data-wp="preview" data-mode="public"/);
 assert.match(profile,/Побачити збоку/);
 assert.match(html,/wrld-game-picker\.js\?v=3/);
});


test("Switching game lists does not remove the picker or reset its list scroll",()=>{
 assert.doesNotMatch(source,/block\.outerHTML=render/);
 assert.match(source,/const gridScroll=root\.querySelector\?\./);
 assert.match(source,/newGrid\.scrollTop=gridScroll/);
 const social=get("wrld-social.js");
 assert.match(social,/render\(\{preserveAccount:true\}\)/);
 assert.match(social,/if\(repaintAccount\)\{accountRoot\.innerHTML=/);
});
