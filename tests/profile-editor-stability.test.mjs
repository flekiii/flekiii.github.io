import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const social=read("wrld-social.js"),game=read("wrld-game-picker.js"),interests=read("wrld-interests.js"),css=read("wrld-profile.css");
test("Chat polling preserves the mounted profile editor and active draft",()=>{
 assert.match(social,/function render\(options=\{\}\)/);
 assert.match(social,/const repaintAccount=!options\.preserveAccount\|\|session!==renderedAccountSession/);
 assert.match(social,/render\(\{preserveAccount:true\}\)/);
 assert.match(social,/renderedAccountSession=session/);
});
test("Game selection and tabs keep browser DOM and preserve scroll position",()=>{
 assert.doesNotMatch(game,/\.outerHTML=render\(/);
 assert.match(game,/const gridScroll=root\.querySelector\?\./);
 assert.match(game,/newGrid\.scrollTop=gridScroll/);
 assert.match(game,/\.wp-game-sections \[data-gp="section"\]/);
});
test("Interests keep selected category buttons mounted and restore list scroll",()=>{
 assert.match(interests,/const resultsScroll=el\.scrollTop\|\|0/);
 assert.match(interests,/el\.scrollTop=resultsScroll/);
 assert.match(interests,/tabsEl\.querySelectorAll\?\./);
 assert.match(interests,/tabsEl\.scrollLeft=left/);
});
test("Interest chips are inset within edit, preview and public card boundaries",()=>{
 assert.match(css,/\.wp-editor \.wi-picker\{[^}]*padding-inline:8px 3px/);
 assert.match(css,/\.wp-published-profile \.wp-card \.wp-interest-tags\{[^}]*max-width:calc\(100% - 40px\)/);
 assert.match(css,/\.wp-card \.wp-interest-tags span\{[^}]*overflow-wrap:anywhere/);
});
