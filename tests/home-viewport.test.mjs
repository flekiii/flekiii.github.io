import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const html=load("index.html"),css=load("wrld-home.css");
const block=html.slice(html.indexOf('<section class="page active wrld-landing" id="page-home"'),html.indexOf("</section>",html.indexOf('<section class="page active wrld-landing" id="page-home"'))+10);
const ids=["world","web-games","discover","chat","marketplace","games","apps","services"];
test("Home fits a full viewport with only section cards scrolling",()=>{
 assert.match(html,/classList\.toggle\('home-view',id==='home'\)/);
 assert.match(css,/body\.home-view\{height:100dvh;overflow:hidden/);
 assert.match(css,/#page-home.active\{display:flex;flex-direction:column;height:calc\(100dvh - 89px - 100px\)/);
 assert.match(css,/#page-home .wrld-home-grid\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/#page-home .wrld-welcome-hero\{[^}]*height:clamp\(170px,26dvh,245px\);min-height:0/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(html,/wrld-home\.css\?v=1/);
});
test("All eight real destination cards exist and use working page navigation",()=>{
 assert.ok(block.length>2000);
 for(const id of ids)assert.match(block,new RegExp('class="tile wrld-home-tile" data-go="'+id+'"'));
 assert.equal((block.match(/class="tile wrld-home-tile"/g)||[]).length,8);
 assert.equal((block.match(/data-go="web-games"/g)||[]).length,2);
 assert.match(html,/document\.addEventListener\('click',e=>\{const t=e\.target\.closest\('\[data-go\]'\)/);
 assert.match(html,/go\(t\.dataset\.go\)/);
});
test("Bilingual home and accessible buttons remain intact",()=>{
 assert.match(block,/data-uk="Головна|data-uk="Куди сьогодні\?/);
 assert.match(block,/data-en="Where to today\?"/);
 assert.match(block,/data-uk="Вебігри"/);
 assert.match(block,/data-uk="Знайомства"/);
 assert.match(block,/data-en="Marketplace"/);
 assert.match(block,/role="navigation" aria-label="Fleki's Wrld sections" tabindex="0"/);
 assert.match(css,/\.wrld-home-tile:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
