import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const market=readFileSync(new URL("../wrld-market.js",import.meta.url),"utf8");
const social=readFileSync(new URL("../wrld-social.js",import.meta.url),"utf8");
const games=readFileSync(new URL("../wrld-games.js",import.meta.url),"utf8");
const communityCss=readFileSync(new URL("../wrld-community.css",import.meta.url),"utf8");
const siteHtml=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function marketRuntime({token="",verified=false}={}){
 const listeners={},visited=[],root={innerHTML:"",addEventListener:(n,fn)=>listeners[n]=fn,querySelector:()=>null,querySelectorAll:()=>[]};
 const document={getElementById:id=>id==="wrld-market-root"?root:null,addEventListener:()=>{}};
 const sandbox={document,window:{addEventListener(){}},sessionStorage:{getItem:key=>key==="fw-token"?token:null},
  fetch:async(url,request)=>{
   const path=new URL(url).pathname;visited.push(path);
   if(path==="/me")return {ok:true,status:200,json:async()=>({user:{id:"member",mfa_verified:verified}})};
   if(path==="/market/options")return {ok:true,status:200,json:async()=>({categories:{furniture:{label:"Furniture",subcategories:[]}},payment_methods:[]})};
   if(path==="/market/listings")return {ok:true,status:200,json:async()=>({listings:[]})};
   throw Error("Unexpected market request "+path);
  },URL,URLSearchParams,Intl};
 runInNewContext(market,sandbox);
 return {root,visited,listeners};
}
test("Guest never loads product catalog and sees fullscreen sign-in gate",async()=>{
 const ui=marketRuntime();await tick();
 assert.match(ui.root.innerHTML,/market-auth-gate/);
 assert.match(ui.root.innerHTML,/Sign in \/ Register/);
 assert.doesNotMatch(ui.root.innerHTML,/market-card-content|market-filters|market-shell/);
 assert.deepEqual(ui.visited,[]);
});
test("Signed-in account without Auth2FA verification sees only MFA gate",async()=>{
 const ui=marketRuntime({token:"auth-token",verified:false});await tick();
 assert.match(ui.root.innerHTML,/Verify Auth2FA/);
 assert.doesNotMatch(ui.root.innerHTML,/market-filters|market-card-content/);
 assert.deepEqual(ui.visited,["/me"]);
});
test("Verified account gets sidebar, marketplace and a real create popup",async()=>{
 const ui=marketRuntime({token:"auth-token",verified:true});await tick();await tick();
 assert.match(ui.root.innerHTML,/market-rail/);
 assert.match(ui.root.innerHTML,/My listings/);
 assert.match(ui.root.innerHTML,/Wishlist/);
 assert.match(ui.root.innerHTML,/Messages/);
 assert.match(ui.root.innerHTML,/market-topplus/);
 assert.match(ui.root.innerHTML,/market-filters/);
 assert.ok(ui.visited.includes("/market/listings"));
 await ui.listeners.click({target:{closest:()=>({dataset:{marketCreate:"1"}})}});
 await tick();
 assert.match(ui.root.innerHTML,/market-modal-backdrop/);
 assert.match(ui.root.innerHTML,/marketDestinationSearch/);
 assert.match(ui.root.innerHTML,/marketCourierSearch/);
});
test("Public community client never hides global message text from guests",()=>{
 assert.match(social,/await api\("\/messages\/public"\)/);
 assert.doesNotMatch(social,/if\(!S\.user\)return '<p class="social-message">Sign in to read/);
 assert.match(social,/if\(\!S\.user\)\{/);
 assert.match(social,/function ensure2fa\(\)/);
 assert.match(social,/verified\(\)\?compose\("fw-global"/);
});

function gamesRuntime(){
 const listeners={},documentListeners={};
 const root={
  innerHTML:"",
  addEventListener:(name,cb)=>listeners[name]=cb,
  querySelector:()=>null,
  querySelectorAll:()=>[]
 };
 const document={
  activeElement:null,
  getElementById:id=>id==="wrld-games-root"?root:null,
  addEventListener:(name,cb)=>documentListeners[name]=cb
 };
 runInNewContext(games,{document});
 return {root,listeners,documentListeners};
}
test("Games platform picker offers both Android and a separate iOS choice",()=>{
 const ui=gamesRuntime();
 assert.match(ui.root.innerHTML,/<option value="android">Android<\/option>/);
 assert.match(ui.root.innerHTML,/<option value="ios">iOS \(iPhone \/ iPad\)<\/option>/);
 ui.listeners.change({target:{id:"gamesPlatform",value:"ios"}});
 assert.match(ui.root.innerHTML,/<option value="ios" selected>iOS \(iPhone \/ iPad\)<\/option>/);
 assert.match(ui.root.innerHTML,/iOS \(iPhone \/ iPad\).*No games published yet/s);
});
test("Games permits selecting multiple genres, individually removing and resetting filters",()=>{
 const ui=gamesRuntime();
 const click=dataset=>ui.listeners.click({target:{closest:()=>({dataset,id:""})}});
 ui.listeners.click({target:{closest:()=>({id:"gamesToggle",dataset:{}})}});
 assert.match(ui.root.innerHTML,/id="gamesGenreOptions" class="games-filter-menu" >/);
 ui.listeners.change({target:{name:"games-genre",value:"horror",checked:true}});
 ui.listeners.change({target:{name:"games-genre",value:"coop",checked:true}});
 assert.match(ui.root.innerHTML,/2 genres selected/);
 assert.match(ui.root.innerHTML,/name="games-genre" value="horror" checked/);
 assert.match(ui.root.innerHTML,/name="games-genre" value="coop" checked/);
 assert.match(ui.root.innerHTML,/Horror \+ Co-op/);
 click({removeGenre:"horror"});
 assert.match(ui.root.innerHTML,/1 genre selected/);
 assert.doesNotMatch(ui.root.innerHTML,/name="games-genre" value="horror" checked/);
 click({quickGenre:"survival"});
 assert.match(ui.root.innerHTML,/2 genres selected/);
 ui.listeners.click({target:{closest:()=>({id:"gamesReset",dataset:{}})}});
 assert.match(ui.root.innerHTML,/0 genres selected/);
 assert.match(ui.root.innerHTML,/<option value="all" selected>All platforms<\/option>/);
});
test("Games multi-select menu is searchable and can close with Escape",()=>{
 const ui=gamesRuntime();
 ui.listeners.click({target:{closest:()=>({id:"gamesToggle",dataset:{}})}});
 ui.listeners.input({target:{id:"gamesGenreSearch",value:"rpg"}});
 assert.match(ui.root.innerHTML,/games-genre-options/);
 ui.documentListeners.keydown({key:"Escape"});
 assert.match(ui.root.innerHTML,/id="gamesGenreOptions" class="games-filter-menu" hidden/);
 assert.match(ui.root.innerHTML,/aria-expanded="false"/);
});


test("Games dropdown click does not bubble into the outside-click handler after replacing its own button",()=>{
 const ui=gamesRuntime();
 let stopped=false;
 const oldToggle={id:"gamesToggle",dataset:{},closest:()=>null};
 const click={target:{closest:()=>oldToggle},stopPropagation(){stopped=true}};
 ui.listeners.click(click);
 // Simulate browser bubbling only when the event wasn't cancelled.
 if(!stopped)ui.documentListeners.click({target:oldToggle});
 assert.equal(stopped,true,"Opening the dropdown must stop bubbling before the trigger is detached.");
 assert.match(ui.root.innerHTML,/aria-expanded="true"/);
 assert.match(ui.root.innerHTML,/id="gamesGenreOptions" class="games-filter-menu" >/);
 assert.match(ui.root.innerHTML,/class="games-toggle-chevron"/);
});
test("Title search is above genre and platform controls, tracks game name and resets cleanly",()=>{
 const ui=gamesRuntime();
 const html=ui.root.innerHTML;
 const searchPos=html.indexOf('id="gamesTitleSearch"');
 const genrePos=html.indexOf('id="gamesToggle"');
 const platformPos=html.indexOf('id="gamesPlatform"');
 assert.ok(searchPos>0&&searchPos<genrePos&&genrePos<platformPos);
 assert.match(html,/Search by game name/);
 assert.match(html,/class="games-title-search"/);
 ui.listeners.input({target:{id:"gamesTitleSearch",value:"Lethal Company",selectionStart:14}});
 assert.match(ui.root.innerHTML,/value="Lethal Company"/);
 assert.match(ui.root.innerHTML,/No games found for “Lethal Company”/);
 ui.listeners.click({target:{closest:()=>({id:"gamesReset",dataset:{}})}});
 assert.match(ui.root.innerHTML,/id="gamesTitleSearch"[^>]*value=""/);
 assert.doesNotMatch(ui.root.innerHTML,/No games found for/);
});
test("Game name input safely escapes untrusted user text",()=>{
 const ui=gamesRuntime();
 ui.listeners.input({target:{id:"gamesTitleSearch",value:'<img src=x onerror=alert(1)>',selectionStart:7}});
 assert.doesNotMatch(ui.root.innerHTML,/<img src=x onerror/);
 assert.match(ui.root.innerHTML,/&lt;img src=x onerror=alert\(1\)&gt;/);
});

test("Community uses a full-width responsive viewport workspace for all three panels",()=>{
 const has=(src,needle)=>assert.ok(src.includes(needle),"Missing "+needle);
 has(communityCss,":has(#page-chat.active)");
 has(communityCss,"#page-chat .social-workspace{");
 has(communityCss,"height:clamp(660px,calc(100dvh - 255px),1400px)");
 has(communityCss,"#page-chat .social-global .social-chat-list");
 has(communityCss,"#page-chat .social-layout-direct .social-chat-list");
 has(communityCss,"#page-chat .social-layout-friends>");
 has(communityCss,"@media(max-width:560px)");
 has(social,"social-layout social-layout-");
 has(social,'["global","Global chat"');
 has(social,'["friends","Friends"');
 has(social,'["direct","Messages"');
 has(siteHtml,'href="/wrld-community.css?v=2"');
 has(siteHtml,'src="/wrld-social.js?v=10"');
});
