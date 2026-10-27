import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../wrld-polish.css",import.meta.url),"utf8");
function makeEl(name=""){
 const listeners=new Map(),attributes={},classes=new Set();
 return {
  name,hidden:false,dataset:{},textContent:"",title:"",attributes,handlers:listeners,focused:false,
  classList:{toggle(key,on){if(on)classes.add(key);else classes.delete(key)},contains:key=>classes.has(key)},
  setAttribute(key,value){attributes[key]=value},addEventListener(type,fn){listeners.set(type,fn)},
  emit(type,event={}){listeners.get(type)?.(event)},focus(){this.focused=true;document.activeElement=this}
 };
}
let document;
function start(){
 const picker=makeEl("trigger"),menu=makeEl("menu"),current=makeEl("code");
 const en=makeEl("en"),uk=makeEl("uk");en.dataset.langOption="en";uk.dataset.langOption="uk";
 const opts=[en,uk];menu.hidden=true;menu.querySelectorAll=()=>opts;
 const search=makeEl("search"),events=[];
 document={activeElement:null,documentElement:{lang:"en"},handlers:new Map(),
  getElementById(id){return ({siteLanguage:picker,languageMenu:menu,languageCurrent:current,search})[id]??null},
  querySelectorAll(){return []},querySelector(){return null},
  addEventListener(type,fn){this.handlers.set(type,fn)}
 };
 const values=new Map();
 const storage={getItem:key=>values.get(key)??null,setItem:(key,v)=>values.set(key,v)};
 const window={addEventListener(){},dispatchEvent(e){events.push(e.type)}};
 const s=html.indexOf("const languagePicker=document.getElementById");
 const e=html.indexOf("\nfor(const section of SECTIONS)",s);
 assert.ok(s!==-1&&e>s);
 const snippet=html.slice(s,e);
 const sandbox=vm.createContext({document,localStorage:storage,window,SECTIONS:[],CustomEvent:class {constructor(type){this.type=type}}});
 vm.runInContext(snippet,sandbox,{filename:"language-picker.js"});
 const clickOption=option=>menu.emit("click",{target:{closest:()=>option}});
 return {picker,menu,current,en,uk,storage,events,clickOption,sandbox};
}

test("Language button opens from any part of its visible surface",()=>{
 assert.match(html,/<button type="button" class="wrld-lang-picker" id="siteLanguage"/);
 assert.doesNotMatch(html,/<select id="siteLanguage"/);
 assert.match(css,/\.wrld-lang-picker\{[\s\S]*?width:136px;height:43px/);
 const o=start();
 o.picker.emit("click");
 assert.equal(o.menu.hidden,false);
 assert.equal(o.picker.attributes["aria-expanded"],"true");
 o.picker.emit("click");
 assert.equal(o.menu.hidden,true);
 assert.equal(o.picker.attributes["aria-expanded"],"false");
});

test("Choosing Ukrainian updates visible language, saves it, and closes menu",()=>{
 const o=start();o.picker.emit("click");o.clickOption(o.uk);
 assert.equal(o.current.textContent,"УКР");
 assert.equal(o.storage.getItem("fleki_wrld_lang"),"uk");
 assert.equal(document.documentElement.lang,"uk");
 assert.equal(o.uk.attributes["aria-checked"],"true");
 assert.equal(o.en.attributes["aria-checked"],"false");
 assert.equal(o.menu.hidden,true);
 assert.equal(o.picker.focused,true);
 assert.ok(o.events.includes("wrld:language-change"));
});

test("Arrow keys, escape, and outside tap keep picker usable",()=>{
 const o=start();let prevented=false;
 o.picker.emit("keydown",{key:"ArrowDown",preventDefault(){prevented=true}});
 assert.equal(prevented,true);
 assert.equal(o.menu.hidden,false);
 assert.equal(o.en.focused,true);
 o.menu.emit("keydown",{key:"ArrowDown",preventDefault(){}});
 assert.equal(o.uk.focused,true);
 o.menu.emit("keydown",{key:"Escape",preventDefault(){}});
 assert.equal(o.menu.hidden,true);
 o.picker.emit("click");
 document.handlers.get("pointerdown")({target:{closest:()=>null}});
 assert.equal(o.menu.hidden,true);
});
