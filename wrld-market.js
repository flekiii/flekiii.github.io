"use strict";
// Fleki's Wrld public marketplace. The API, not the browser, authorizes listings and messages.
(() => {
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const root=document.getElementById("wrld-market-root");
if(!root)return;
const $=q=>root.querySelector(q),$$=q=>[...root.querySelectorAll(q)];
const escape=s=>String(s??"").replace(/[&<>"']/g,v=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[v]));
const categories={furniture:"Furniture & home",food:"Food & groceries",games:"Games",game_accounts:"Game accounts",game_currency:"In-game currency",electronics:"Electronics",clothing:"Clothing",digital:"Digital products",services:"Services",other:"Other"};
const currencies=["UAH","USD","EUR","GBP","PLN","CAD","AUD","JPY","CHF","SEK","NOK","DKK","CZK","HUF","RON","TRY","BRL","INR"];
const codes="AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const dn=new Intl.DisplayNames(["en"],{type:"region"});
const countries=codes.map(c=>({code:c,name:dn.of(c)||c})).sort((a,b)=>a.name.localeCompare(b.name));
const selectCountries=selected=>countries.map(c=>'<option value="'+c.code+'" '+(selected?.includes(c.code)?"selected":"")+'>'+escape(c.name)+'</option>').join("");
const countryName=c=>dn.of(c)||c;
const regionLabels={UA:"Oblast / область",US:"State",CA:"Province or territory",AU:"State or territory",GB:"County or region",DE:"Bundesland",PL:"Województwo",FR:"Région",JP:"Prefecture",IN:"State / Union territory",BR:"Estado",ES:"Comunidad autónoma",IT:"Regione",CH:"Canton"};
const money=l=>new Intl.NumberFormat("en",{style:"currency",currency:l.currency||"USD"}).format((l.price_minor||0)/100);
let view="browse",listings=[],own=[],conversations=[],selected=null,chatKey=null,loading=false,status="";
const token=()=>sessionStorage.getItem("fw-token")||"";
const message=(txt,error=false)=>{status=txt;const el=$("#market-status");if(el){el.textContent=txt;el.dataset.error=String(error)}};
async function call(path,method="GET",body=null){
 const headers={Accept:"application/json"};
 if(token())headers.Authorization="Bearer "+token();
 if(body!==null)headers["Content-Type"]="application/json";
 const response=await fetch(API+path,{method,headers,body:body===null?undefined:JSON.stringify(body),mode:"cors",cache:"no-store"});
 const data=await response.json().catch(()=>({error:"Invalid server response"}));
 if(!response.ok)throw Error(data.error||"Server error ("+response.status+")");
 return data;
}
const needLogin=async()=>{
 if(!token())throw Error("Sign in to Fleki's Wrld, then verify 2FA in your profile.");
 const me=await call("/me");
 if(!me.user?.mfa_verified)throw Error("Enable and verify 2FA in your Fleki's Wrld profile first.");
 return me.user;
};
function menu(){
 return '<div class="market-tabs">'+[["browse","Explore"],["sell","Sell an item"],["my","My listings"],["messages","Messages"],["store","Register a shop"]].map(([id,name])=>'<button class="market-tab '+(view===id?"active":"")+'" type="button" data-market-view="'+id+'">'+name+'</button>').join("")+'</div><p id="market-status" class="market-status" role="status" data-error="false">'+escape(status)+'</p>';
}
function mediaPreview(item){
 const images=Array.isArray(item.images)?item.images:[];
 return images.length?'<img src="'+escape(images[0])+'" loading="lazy" referrerpolicy="no-referrer" alt="">':'<span class="market-image-placeholder" aria-hidden="true">✧</span>';
}
function itemCard(item){
 return '<article class="market-card"><div class="market-thumb">'+mediaPreview(item)+'</div><div class="market-card-content"><span class="market-pill">'+escape(categories[item.category]||item.category)+'</span><h3>'+escape(item.title)+'</h3><strong>'+escape(money(item))+'</strong><p>'+escape(countryName(item.origin_country))+' · '+escape(item.origin_region)+'</p><small>Seller: @'+escape(item.seller_username)+'</small><button class="btn" type="button" data-market-open="'+escape(item.id)+'">View listing →</button></div></article>';
}
function detail(item){
 const images=item.images||[],videos=item.videos||[];
 return '<div class="market-detail"><button type="button" class="market-back" data-market-back="1">← Back to listings</button><h2>'+escape(item.title)+'</h2><strong class="market-price">'+escape(money(item))+'</strong><p>'+escape(item.description)+'</p><dl><dt>Category</dt><dd>'+escape(categories[item.category])+'</dd><dt>Seller</dt><dd>@'+escape(item.seller_username)+'</dd><dt>Location</dt><dd>'+escape(countryName(item.origin_country))+', '+escape(item.origin_region)+'</dd><dt>Delivers to</dt><dd>'+escape((item.shipping_countries||[]).map(countryName).join(", "))+'</dd></dl>'+
 (images.length?'<div class="market-media">'+images.map(src=>'<a href="'+escape(src)+'" target="_blank" rel="noopener noreferrer"><img src="'+escape(src)+'" loading="lazy" referrerpolicy="no-referrer" alt="Item photo"></a>').join("")+'</div>':'')+
 (videos.length?'<div class="market-media">'+videos.map(src=>'<video controls preload="none" referrerpolicy="no-referrer" src="'+escape(src)+'"></video>').join("")+'</div>':'')+
 '<button class="btn primary" type="button" data-market-chat="'+escape(item.id)+'">Message the seller</button><p class="market-footnote">Arrange payment and shipping with the seller directly. Fleki’s Wrld does not process payments, guarantee delivery or hold funds in escrow.</p></div>';
}
function renderBrowse(){
 return '<div class="market-filters"><input id="marketSearch" type="search" maxlength="70" placeholder="Search furniture, food, games, accounts, digital goods…" aria-label="Search marketplace" value="'+escape($("#marketSearch")?.value||"")+'"><select id="marketCategory"><option value="">All categories</option>'+Object.entries(categories).map(([v,n])=>'<option value="'+v+'">'+escape(n)+'</option>').join("")+'</select><select id="marketCountry"><option value="">All countries</option>'+selectCountries()+'</select><button class="btn" data-market-search="1" type="button">Search</button></div>'+
 '<p class="market-footnote">Only buy or sell items you legally own and have permission to transfer. Game accounts and currencies may be restricted by game publishers.</p>'+
 (selected?detail(selected):'<div class="market-grid">'+(listings.length?listings.map(itemCard).join(""):'<div class="market-empty"><h3>No listings match yet</h3><p>Be the first to publish a genuine item.</p><button class="btn primary" data-market-view="sell" type="button">Create a listing</button></div>')+'</div>');
}
function renderSell(){
 return '<div class="market-panel"><h2>List your item for sale</h2><p>Publish a real listing that other members can search. A verified 2FA session is required.</p><form id="marketSellForm" class="market-form">'+
 '<label>Listing title (5–120 characters)<input name="title" minlength="5" maxlength="120" required placeholder="What are you selling?"></label>'+
 '<label>Category<select name="category" required>'+Object.entries(categories).map(([v,n])=>'<option value="'+v+'">'+escape(n)+'</option>').join("")+'</select></label>'+
 '<label>Description (10–1000 characters)<textarea name="description" minlength="10" maxlength="1000" rows="5" required placeholder="Condition, contents, delivery details and what the buyer should know"></textarea></label>'+
 '<div class="market-inline"><label>Price<input name="price" type="number" min="0" max="10000000" step=".01" value="0" required></label><label>Currency<select name="currency">'+currencies.map(c=>'<option value="'+c+'" '+(c==="UAH"?"selected":"")+'>'+c+'</option>').join("")+'</select></label></div>'+
 '<div class="market-inline"><label>Country where you sell<select id="marketOriginCountry" name="origin_country" required>'+selectCountries(["UA"])+'</select></label><label><span id="marketRegionLabel">Oblast / область</span> <span class="market-required">*</span><input name="origin_region" minlength="2" maxlength="100" required placeholder="Enter your actual region"></label></div>'+
 '<label>Countries you deliver to <span class="market-required">*</span> <small>(Ctrl/Cmd + click to select multiple)</small><select name="shipping_countries" multiple size="6" required>'+selectCountries(["UA"])+'</select></label>'+
 '<label>Photos (up to 30 direct HTTPS image links, one per line)<textarea name="images" rows="3" placeholder="https://example.com/photo.jpg"></textarea></label>'+
 '<label>Videos (up to 5 direct HTTPS MP4/WebM links, one per line)<textarea name="videos" rows="2" placeholder="https://example.com/demo.mp4"></textarea></label>'+
 '<p class="market-footnote">For now, photos and videos must be hosted at direct HTTPS URLs. Direct file uploading needs a dedicated media storage service and is not active. Never post passwords, recovery codes or private addresses.</p>'+
 '<button class="btn primary" type="submit">Publish listing</button></form></div>';
}
function renderMy(){
 return '<section class="market-panel"><h2>My listings</h2>'+(own.length?own.map(item=>'<div class="market-own-row"><strong>'+escape(item.title)+'</strong><span>'+escape(item.status)+' · '+escape(money(item))+'</span><select data-market-status-id="'+escape(item.id)+'" aria-label="Change listing status"><option value="active" '+(item.status==="active"?"selected":"")+'>Active</option><option value="sold" '+(item.status==="sold"?"selected":"")+'>Sold</option><option value="hidden" '+(item.status==="hidden"?"selected":"")+'>Hidden</option></select></div>').join(""):'<p>Nothing listed yet. Publish your first item to get started.</p>')+'</section>';
}
function renderMessages(){
 return '<section class="market-panel"><h2>Buyer & seller messages</h2><p>Only the buyer and seller can read their conversation. No friend request is needed.</p>'+
 conversations.map(x=>'<button class="market-thread" type="button" data-market-thread="'+escape(x.listing_id)+'" data-market-buyer="'+escape(x.buyer_id)+'"><strong>'+escape(x.title)+'</strong><small>Buyer: @'+escape(x.buyer_name)+' · Seller: @'+escape(x.seller_name)+'</small><span>'+escape(x.last_message)+'</span></button>').join("")+
 (!conversations.length?'<p>No conversations yet. Find an item and message the seller.</p>':'')+
 (chatKey?'<div class="market-conversation"><h3>Conversation</h3><div id="marketChatMessages" class="market-chat-messages">Loading…</div><form id="marketChatForm" class="market-inline"><input name="message" maxlength="1500" required placeholder="Type a message (max 1500 characters)" aria-label="Your message"><button class="btn primary" type="submit">Send</button></form></div>':'')+'</section>';
}
function renderStore(){
 return '<section class="market-panel"><h2>Register your own store</h2><p>Store accounts require manual approval so buyers can recognize official merchants. Ordinary users can publish individual listings immediately after verifying 2FA.</p><a class="btn primary" target="_blank" rel="noopener noreferrer" href="https://t.me/flekusik">Apply directly via Telegram · @flekusik ↗</a><p class="market-footnote">Do not send passwords, 2FA secrets or recovery codes to anyone, including store administrators.</p></section>';
}
function paint(){
 root.innerHTML='<div class="market-shell">'+menu()+(view==="browse"?renderBrowse():view==="sell"?renderSell():view==="my"?renderMy():view==="messages"?renderMessages():renderStore())+'</div>';
 if(view==="sell")$("#marketOriginCountry")?.dispatchEvent(new Event("change"));
 if(chatKey)void loadMessages();
}
async function browse(){
 loading=true;try{
  const params=new URLSearchParams();
  const q=$("#marketSearch")?.value.trim(),cat=$("#marketCategory")?.value,country=$("#marketCountry")?.value;
  if(q)params.set("q",q);if(cat)params.set("category",cat);if(country)params.set("country",country);
  listings=(await call("/market/listings?"+params)).listings;selected=null;message("");paint();
 }catch(err){message(err.message,true)}finally{loading=false}
}
async function changeView(next){
 view=next;selected=null;chatKey=null;message("");
 try{
  if(next==="my"){await needLogin();own=(await call("/market/mine")).listings}
  if(next==="messages"){await needLogin();conversations=(await call("/market/conversations")).conversations}
 }catch(err){message(err.message,true)}
 paint();
}
async function loadMessages(){
 if(!chatKey)return;
 const {listingId,buyerId}=chatKey;
 try{
  const data=await call("/market/messages?listing_id="+encodeURIComponent(listingId)+"&buyer_id="+encodeURIComponent(buyerId));
  const target=$("#marketChatMessages");
  if(!target)return;
  target.innerHTML=(data.messages||[]).map(x=>'<div class="market-chat-bubble"><span>'+escape(x.content)+'</span><small>'+new Date(x.created_at).toLocaleString()+'</small></div>').join("")||'<p>Start the conversation below.</p>';
  target.scrollTop=target.scrollHeight;
 }catch(err){message(err.message,true)}
}
root.addEventListener("change",async event=>{
 const el=event.target;
 if(el.id==="marketOriginCountry"){
  const label=$("#marketRegionLabel");if(label)label.textContent=regionLabels[el.value]||"Region / State / Province";
 }else if(el.matches("[data-market-status-id]")){
  try{await needLogin();await call("/market/listings/"+el.dataset.marketStatusId+"/status","POST",{status:el.value});message("Listing updated.");own=(await call("/market/mine")).listings;paint()}catch(err){message(err.message,true)}
 }
});
root.addEventListener("click",async event=>{
 const target=event.target.closest("button");if(!target)return;
 try{
  if(target.dataset.marketView){await changeView(target.dataset.marketView);return}
  if(target.dataset.marketSearch){await browse();return}
  if(target.dataset.marketBack){selected=null;paint();return}
  if(target.dataset.marketOpen){selected=listings.find(x=>x.id===target.dataset.marketOpen);paint();return}
  if(target.dataset.marketChat){const me=await needLogin();const x=selected||listings.find(x=>x.id===target.dataset.marketChat);if(me.id===x.seller_id)throw Error("You own this listing.");view="messages";chatKey={listingId:x.id,buyerId:me.id};conversations=(await call("/market/conversations")).conversations;paint();return}
  if(target.dataset.marketThread){await needLogin();chatKey={listingId:target.dataset.marketThread,buyerId:target.dataset.marketBuyer};paint();return}
 }catch(err){message(err.message,true)}
});
root.addEventListener("submit",async event=>{
 const form=event.target;
 if(!["marketSellForm","marketChatForm"].includes(form.id))return;
 event.preventDefault();if(loading)return;loading=true;
 try{
  const me=await needLogin();
  if(form.id==="marketSellForm"){
   const data=new FormData(form),shipping=[...form.elements.shipping_countries.selectedOptions].map(x=>x.value);
   const lines=name=>String(data.get(name)||"").split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean);
   const price=Number(data.get("price"));
   if(!Number.isFinite(price))throw Error("Invalid price.");
   const fields={title:data.get("title"),description:data.get("description"),category:data.get("category"),price_minor:Math.round(price*100),currency:data.get("currency"),origin_country:data.get("origin_country"),origin_region:data.get("origin_region"),shipping_countries:shipping,images:lines("images"),videos:lines("videos")};
   await call("/market/listings","POST",fields);message("Listing published successfully!");view="my";own=(await call("/market/mine")).listings;paint();
  }else{
   const content=new FormData(form).get("message");
   await call("/market/messages","POST",{listing_id:chatKey.listingId,buyer_id:chatKey.buyerId,content});
   form.reset();await loadMessages();message("Message sent.");
  }
 }catch(err){message(err.message,true)}finally{loading=false}
});
void call("/market/listings").then(x=>{listings=x.listings;paint()}).catch(err=>message(err.message,true));
})();
