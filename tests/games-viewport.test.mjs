import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const css=get("wrld-games.css"),html=get("index.html"),js=get("wrld-games.js");
test("Games uses a fixed-height application viewport with a separately scrolling catalog",()=>{
 assert.match(html,/classList\.toggle\('games-view',id==='games'\)/);
 assert.match(css,/body\.games-view\{height:100dvh;overflow:hidden/);
 assert.match(css,/#page-games.active\{height:calc\(100dvh - 89px - 100px\)/);
 assert.match(css,/#page-games .page-heading\{display:none!important\}/);
 assert.match(css,/#page-games .games-hub\{display:flex;flex-direction:column/);
 assert.match(css,/#page-games .games-results\{flex:1 1 0;min-height:0;overflow-y:auto;overflow-x:hidden/);
 assert.match(html,/wrld-games\.css\?v=4/);
 assert.match(html,/wrld-games\.js\?v=4/);
});
test("Filters and platform controls remain usable on desktop and small phones",()=>{
 assert.match(css,/#page-games .games-toolbar\{display:grid/);
 assert.match(css,/#page-games .games-filter-menu\{[^}]*overflow-y:auto/);
 assert.match(css,/#page-games .games-quick-row\{[^}]*overflow-x:auto/);
 assert.match(css,/#page-games .games-applied\{[^}]*overflow-x:auto/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/#page-games .games-filter-menu\{position:fixed/);
 assert.match(css,/@media\(max-width:440px\)/);
 assert.match(css,/@media\(max-height:560px\)/);
});
function runtime(lang="en"){
 const events={},windows={};
 let htmlText="",elements={};
 const selectors=[".games-results",".games-genre-options",".games-quick-row",".games-applied"];
 const reset=()=>{
  elements=Object.fromEntries(selectors.map(x=>[x,{scrollTop:0,scrollLeft:0}]));
 };
 const root={
  get innerHTML(){return htmlText},
  set innerHTML(next){htmlText=next;reset()},
  querySelector:s=>elements[s]||null,
  querySelectorAll:()=>[],
  addEventListener:(event,fn)=>{events[event]=fn}
 };
 const document={documentElement:{lang},activeElement:null,getElementById:id=>id==="wrld-games-root"?root:null,addEventListener:()=>{}};
 vm.runInNewContext(js,{document,window:{addEventListener:(event,fn)=>windows[event]=fn}});
 return {root,events,windows,elements:()=>elements,setLang:l=>document.documentElement.lang=l};
}
test("Selecting genres doesn't jump back to the start of the genre chooser or chips",()=>{
 const app=runtime();
 app.events.click({target:{closest:()=>({id:"gamesToggle",dataset:{}})},stopPropagation(){}});
 app.elements()[".games-genre-options"].scrollTop=132;
 app.elements()[".games-quick-row"].scrollLeft=104;
 app.events.change({target:{name:"games-genre",value:"horror",checked:true}});
 assert.equal(app.elements()[".games-genre-options"].scrollTop,132);
 assert.equal(app.elements()[".games-quick-row"].scrollLeft,104);
 assert.match(app.root.innerHTML,/name="games-genre" value="horror" checked/);
 app.elements()[".games-results"].scrollTop=87;
 app.events.change({target:{id:"gamesPlatform",value:"android"}});
 assert.equal(app.elements()[".games-results"].scrollTop,87);
});
test("Ukrainian game names, tags and search cover both languages without inventing catalog releases",()=>{
 const app=runtime("uk");
 assert.match(app.root.innerHTML,/Ігри для кожного/);
 assert.match(app.root.innerHTML,/Каталог ігор/);
 assert.match(app.root.innerHTML,/Обрати жанри/);
 assert.match(app.root.innerHTML,/Пошук за назвою гри/);
 assert.match(app.root.innerHTML,/Ігор ще немає/);
 app.events.click({target:{closest:()=>({id:"gamesToggle",dataset:{}})},stopPropagation(){}});
 assert.match(app.root.innerHTML,/Жахи/);
 assert.match(app.root.innerHTML,/data-genre-label="horror жахи"/);
 app.setLang("en");app.windows["wrld:language-change"]();
 assert.match(app.root.innerHTML,/Browse games/);
 assert.match(app.root.innerHTML,/No games published yet/);
});
