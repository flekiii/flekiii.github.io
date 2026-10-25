import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const market=readFileSync(new URL("../wrld-market.js",import.meta.url),"utf8");
const social=readFileSync(new URL("../wrld-social.js",import.meta.url),"utf8");
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function marketRuntime({token="",verified=false}={}){
 const listeners={},visited=[],root={innerHTML:"",addEventListener:(n,fn)=>listeners[n]=fn,querySelector:()=>null,querySelectorAll:()=>[]};
 const document={getElementById:id=>id==="wrld-market-root"?root:null};
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
