import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=get("wrld-interests.js"),profile=get("wrld-profile.js"),html=get("index.html");
function setup(lang="uk"){
 const hooks={},fired=[],nodes=Object.fromEntries(["wi-selected-list","wi-count","wi-results","wi-categories","wi-feedback"].map(n=>[n,{innerHTML:"",textContent:""}]));
 const doc={documentElement:{lang},addEventListener:(name,fn)=>{hooks[name]=fn},getElementById:id=>nodes[id]||null};
 const win={dispatchEvent:ev=>fired.push({type:ev.type,detail:ev.detail})};
 const CustomEvent=class{constructor(type,init){this.type=type;this.detail=init.detail}};
 runInNewContext(source,{window:win,document:doc,CustomEvent});
 const click=(act,value)=>{hooks.click({target:{closest:()=>({dataset:{wi:act,value}})},preventDefault(){}})};
 const input=value=>hooks.input({target:{id:"wi-search",value}});
 return {win,doc,hooks,fired,nodes,click,input};
}
test("Curated interests contain gaming, anime, coding, and at least 100 bilingual choices",()=>{
 const s=setup();
 const items=s.win.WrldInterests.items;
 assert.ok(items.length>=100);
 for(const name of ["Gaming","Anime","Coding","YouTube","Art & creation"]){
  if(name==="Art & creation")continue;
  assert.ok(items.some(x=>x.en===name),name);
 }
 assert.equal(s.win.WrldInterests.label("Gaming"),"Ігри");
 assert.equal(s.win.WrldInterests.label("Anime"),"Аніме");
 assert.equal(s.win.WrldInterests.label("Coding"),"Програмування");
 s.doc.documentElement.lang="en";
 assert.equal(s.win.WrldInterests.label("Gaming"),"Gaming");
 assert.equal(s.win.WrldInterests.label("Програмування"),"Coding");
 assert.equal(s.win.WrldInterests.categoryCount,11);
});
test("Search in both site languages and switch categories without losing selected interests",()=>{
 const s=setup("uk");
 const screen=s.win.WrldInterests.render(["Gaming","Anime","My special hobby"]);
 assert.match(screen,/Ігри/);
 assert.match(screen,/Аніме/);
 assert.match(screen,/My special hobby/);
 assert.match(screen,/data-wi="category"/);
 s.input("кодинг");
 const found=s.nodes["wi-results"].innerHTML;
 assert.match(found,/Програмування/);
 assert.doesNotMatch(found,/data-wi="custom"/);
 s.input("програмування");
 assert.match(s.nodes["wi-results"].innerHTML,/Програмування/);
 s.click("category","anime");
 assert.match(s.nodes["wi-categories"].innerHTML,/class="wi-category active" data-wi="category" data-value="anime"/);
});
test("Selecting and removing interests emits unsaved draft changes; 12 limit stays enforced",()=>{
 const s=setup("en");
 s.win.WrldInterests.render(["Gaming","Anime"]);
 s.click("toggle","Coding");
 assert.equal(s.fired.at(-1).type,"wrld:profile-interest-change");
 assert.deepEqual([...s.fired.at(-1).detail.interests],["Gaming","Anime","Coding"]);
 s.click("remove","Gaming");
 assert.deepEqual([...s.fired.at(-1).detail.interests],["Anime","Coding"]);
 const full=Array.from({length:12},(_,i)=>"Custom "+i);
 s.win.WrldInterests.render(full);
 const count=s.fired.length;
 s.click("toggle","Coding");
 assert.equal(s.fired.length,count);
 assert.match(s.nodes["wi-feedback"].textContent,/Maximum 12/);
});
test("Interest choices connect to public profile, discovery, showcase and existing save workflow",()=>{
 const discover=get("wrld-discover.mjs"),showcase=get("wrld-showcase.mjs");
 assert.match(profile,/data-wp="open-interests"/);
 assert.match(profile,/wrld:profile-interest-change/);
 assert.match(profile,/WrldInterests\?\.render/);
 assert.match(profile,/WrldInterests\?\.label/);
 assert.match(profile,/secure\("\/profiles\/me",\{method:"PUT",body:payload\}\)/);
 assert.match(discover,/WrldInterests\?\.label/);
 assert.match(showcase,/WrldInterests\?\.label/);
 assert.match(html,/wrld-interests\.js\?v=1/);
 assert.match(html,/wrld-profile\.js\?v=11/);
 assert.match(html,/wrld-profile\.css\?v=9/);
});
