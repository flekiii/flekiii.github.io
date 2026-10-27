import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const css=get("wrld-market.css"),html=get("index.html"),js=get("wrld-market.js");

test("Marketplace uses viewport height and only its content pane scrolls",()=>{
 assert.match(html,/classList\.toggle\('marketplace-view',id==='marketplace'\)/);
 assert.match(css,/body\.marketplace-view\{height:100dvh;overflow:hidden/);
 assert.match(css,/#page-marketplace.active\{display:flex;flex-direction:column;height:calc\(100dvh - 89px - 100px\)/);
 assert.match(css,/#page-marketplace .page-heading\{display:none!important\}/);
 assert.match(css,/#page-marketplace .market-scroll\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(js,/class="market-scroll" id="marketContent"/);
 assert.match(html,/wrld-market\.css\?v=8/);
 assert.match(html,/wrld-market\.js\?v=9/);
});
test("Responsive filters can be collapsed on mobile without hiding search",()=>{
 assert.match(css,/#page-marketplace .market-filters\{position:sticky/);
 assert.match(css,/#page-marketplace .market-grid\{grid-template-columns:repeat\(auto-fill/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.market-filters:not\(\.filters-open\) \.market-filter-advanced\{display:none\}/);
 assert.match(js,/data-market-toggle-filters="1"/);
 assert.match(js,/filtersOpen=!filtersOpen;paint\(\)/);
 assert.match(js,/id="marketAdvancedFilters"/);
 assert.match(js,/aria-expanded="'\+filtersOpen/);
 assert.match(js,/const oldScroll=identity===lastPaintIdentity/);
 assert.match(js,/if\(scroll\)scroll.scrollTop=oldScroll.main/);
});
test("Marketplace messages retain separate scroll areas and a fixed composer",()=>{
 assert.match(css,/#page-marketplace .market-inbox-list\{[^}]*overflow-y:auto/);
 assert.match(css,/#page-marketplace .market-inbox .market-chat-messages\{[^}]*overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(js,/id="marketChatMessages"/);
 assert.match(js,/id="marketChatForm"/);
 assert.match(js,/if\(chat\)chat.scrollTop=oldScroll.chat/);
});
test("Marketplace still uses the real backend and keeps protected listing editing in a modal",()=>{
 assert.match(js,/if\(authState!=="verified"\)/);
 assert.match(js,/verifiedGate\(\)/);
 assert.match(js,/role="dialog" aria-modal="true"/);
 assert.match(js,/id="marketEditBackdrop"/);
 assert.match(js,/await needLogin\(\)/);
 assert.match(css,/#page-marketplace .market-edit-dialog\{overflow:auto/);
});
