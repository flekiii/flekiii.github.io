"use strict";
// Fleki's Wrld public marketplace. The API, not the browser, authorizes listings and messages.
(() => {
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const root=document.getElementById("wrld-market-root");
if(!root)return;
const $=q=>root.querySelector(q),$$=q=>[...root.querySelectorAll(q)];
const tr=(en,uk)=>document.documentElement?.lang==="uk"?uk:en;
const escape=s=>String(s??"").replace(/[&<>"']/g,v=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[v]));
const categories={furniture:"Furniture & home",food:"Food & groceries",games:"Games",game_accounts:"Game accounts",game_currency:"In-game currency",electronics:"Computers & electronics",clothing:"Clothing",digital:"Digital products",services:"Services",other:"Other"};
const currencies=["UAH","USD","EUR","GBP","PLN","CAD","AUD","JPY","CHF","SEK","NOK","DKK","CZK","HUF","RON","TRY","BRL","INR"];
const codes="AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const dn=new Intl.DisplayNames(["en"],{type:"region"});
const countries=codes.map(c=>({code:c,name:dn.of(c)||c})).sort((a,b)=>a.name.localeCompare(b.name));
const selectCountries=selected=>countries.map(c=>'<option value="'+c.code+'" '+(selected?.includes(c.code)?"selected":"")+'>'+escape(c.name)+'</option>').join("");
const countryName=c=>dn.of(c)||c;
const regionLabels={UA:"Oblast / область",US:"State",CA:"Province or territory",AU:"State or territory",GB:"County or region",DE:"Bundesland",PL:"Województwo",FR:"Région",JP:"Prefecture",IN:"State / Union territory",BR:"Estado",ES:"Comunidad autónoma",IT:"Regione",CH:"Canton"};
const money=l=>new Intl.NumberFormat("en",{style:"currency",currency:l.currency||"USD"}).format((l.price_minor||0)/100);
let view="browse",listings=[],own=[],wishlist=[],conversations=[],selected=null,chatKey=null,loading=false,status="",statusError=false;
let queuedPhotos=[],photoPreviews=[],uploadedPhotos=[];
const MAX_MARKET_PHOTO=4*1024*1024;
let authState="loading",myId=null,shopFormOpen=false,editing=null,threadSide="buy";
let options=null,shippingProviders=[],carrierLoadToken=0;
let filters={q:"",category:"",subcategory:"",country:"",negotiable:""};
let filtersOpen=false,lastPaintIdentity="";
const choiceOptions=(items,selected="")=>items.map(x=>'<option value="'+escape(x.id)+'"'+(x.id===selected?" selected":"")+'>'+escape(x.label)+'</option>').join("");
const subcategoryChoices=(category,selected="")=>{
 const list=options?.categories?.[category]?.subcategories||[];
 return '<option value="">All types</option>'+list.map(x=>'<option value="'+escape(x.id)+'"'+(x.id===selected?" selected":"")+'>'+escape(x.label)+'</option>').join("")+'<option value="other"'+(selected==="other"?" selected":"")+'>Other / custom type</option>';
};
const categoryChoices=(selected="")=>{
 const all=options?.categories||Object.fromEntries(Object.entries(categories).map(([key,label])=>[key,{label}]));
 return Object.entries(all).map(([id,cat])=>'<option value="'+escape(id)+'"'+(id===selected?" selected":"")+'>'+escape(cat.label)+'</option>').join("");
};
const subcategoryName=(item)=>item.subcategory==="other"?(item.custom_type||"Other item"):(options?.categories?.[item.category]?.subcategories?.find(x=>x.id===item.subcategory)?.label||"Other item");
const carrierNames=new Map();
const shippingName=(item,id)=>carrierNames.get(item.origin_country+":"+id)||({"local_pickup":"Local pickup / in person","national_post":"National postal operator","international_courier":"International courier","other_method":"Other courier","digital_delivery":"Digital delivery"}[id]||id.replaceAll("_"," "));
const paymentName=id=>options?.payment_methods?.find(x=>x.id===id)?.label||id.replaceAll("_"," ");
async function loadOptions(country="",category=""){
 const p=new URLSearchParams();if(country)p.set("country",country);if(category)p.set("category",category);
 return call("/market/options?"+p.toString());
}
async function refreshShippingProviders(){
 const country=$("#marketOriginCountry")?.value,category=$("#marketSellCategory")?.value;
 if(!country||!category)return;
 const serial=++carrierLoadToken,area=$("#marketCarrierChoices");
 if(area)area.textContent="Checking delivery methods…";
 try{
  const data=await loadOptions(country,category);
  if(serial!==carrierLoadToken)return;
  shippingProviders=data.delivery_providers||[];
  for(const x of shippingProviders)carrierNames.set(country+":"+x.id,x.label);
  const region=$("#marketRegionLabel");if(region)region.textContent=regionLabels[country]||"Region / State / Province";
  if(area)area.innerHTML=shippingProviders.map(x=>'<label class="market-check" data-search-carrier="'+escape(x.label.toLowerCase())+'"><input type="checkbox" name="delivery_providers" value="'+escape(x.id)+'"'+(editing?.delivery_providers?.includes(x.id)?" checked":"")+'><span>'+escape(x.label)+'</span></label>').join("");
  filterCouriers();
  const hint=$("#marketCarrierHint");if(hint)hint.textContent=data.delivery_disclaimer||"Confirm routes and tariffs with the carrier.";
 }catch(err){if(serial===carrierLoadToken&&area)area.textContent="Delivery options unavailable: "+err.message}
}
function refreshSubcategories(){
 const sel=$("#marketSellSubcategory");if(!sel)return;
 sel.innerHTML='<option value="" selected disabled>Select specific item type</option>'+subcategoryChoices($("#marketSellCategory").value);
 const other=sel.querySelector('option[value="other"]');if(other)other.textContent="Other / specify item";
 refreshCustomType();
}
function refreshCustomType(){
 const wrap=$("#marketCustomTypeWrap"),show=$("#marketSellSubcategory")?.value==="other";
 if(!wrap)return;
 wrap.hidden=!show;
 const input=wrap.querySelector("input");if(input){input.required=show;if(!show)input.value=""}
}
function updateDestinationCount(){
 const checked=$('[name="shipping_countries"]:checked');
 const count=$("#marketDestinationCount");
 if(count)count.textContent=checked.length+" / 70 countries selected"+(checked.length===0?" — select at least one":"");
}
function filterCouriers(){
 const q=$("#marketCourierSearch")?.value.trim().toLowerCase()||"";
 for(const item of $("[data-search-carrier]"))item.hidden=!!q&&!item.dataset.searchCarrier.includes(q)&&!item.querySelector("input").checked;
}
function filterDestinations(){
 const q=$("#marketDestinationSearch")?.value.trim().toLocaleLowerCase()||"";
 for(const item of $("[data-search-country]")){
  const option=item.querySelector("input");
  item.hidden=!!q&&!item.dataset.searchCountry.includes(q)&&!option.checked;
 }
}


const token=()=>sessionStorage.getItem("fw-token")||"";
const message=(txt,error=false)=>{status=txt;statusError=error;const el=$("#market-status");if(el){el.textContent=txt;el.dataset.error=String(error)}};
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
 if(!token())throw Error("Sign in to Fleki's Wrld first.");
 const me=await call("/me");
 if(!me.user?.mfa_verified)throw Error("Enable and verify 2FA in Profile first.");
 myId=me.user.id;
 return me.user;
};
async function validateAccess(){
 if(!token()){authState="guest";myId=null;return false}
 try{
  const me=await call("/me");
  myId=me.user?.id||null;
  authState=me.user?.mfa_verified?"verified":"unverified";
  return authState==="verified";
 }catch{authState="guest";myId=null;return false}
}
const verifiedGate=()=>{
 const login=authState==="guest",busy=authState==="loading";
 return '<div class="market-auth-gate" role="region" aria-label="Marketplace access"><div class="market-auth-art" aria-hidden="true">✦</div><span class="market-auth-kicker">FLEKI’S WRLD · SECURE MARKETPLACE</span><h2>'+ (busy?'Checking your access…':login?'Enter the marketplace.':'One security check left.') +'</h2><p>'+ (busy?'Verifying your account and session.':login?'Sign in or create a Fleki’s Wrld account to browse goods, message sellers and save favorites.':'For everyone’s safety, verify your six-digit code in Profile using Auth2FA. Then the marketplace will unlock automatically.')+'</p>'+(busy?'':'<div class="market-gate-actions"><button type="button" class="btn primary" data-market-profile="1">'+(login?'Sign in / Register':'Verify Auth2FA')+' →</button><button type="button" class="btn" data-market-check="1">I’m ready · Recheck</button></div>')+'<span class="market-gate-note">🔒 Listings and messages stay private until 2FA is verified</span></div>';
};
function menu(){
 const nav=[["my",tr("My listings","Мої оголошення"),"▤"],["wishlist",tr("Wishlist","Обране"),"♡"],["messages",tr("Messages","Повідомлення"),"✉"]];
 return '<aside class="market-rail"><div class="market-rail-header"><span class="market-rail-mark">✦</span><div><strong>Marketplace</strong><small>'+tr("Trade · Discover · Connect","Купуй · Продавай · Спілкуйся")+'</small></div></div><a class="market-shop-link market-shop-top" href="https://t.me/flekusik" target="_blank" rel="noopener noreferrer" aria-label="Apply to register your store through Telegram">'+tr("Register a shop","Зареєструвати магазин")+' <span>↗</span></a><nav aria-label="'+tr("My marketplace","Розділи маркетплейсу")+'">'+nav.map(([id,label,icon])=>'<button type="button" class="market-rail-link '+(view===id?"active":"")+'" data-market-view="'+id+'" aria-pressed="'+(view===id)+'"><span>'+icon+'</span>'+label+'</button>').join("")+'</nav><button type="button" class="market-rail-link market-rail-home '+(view==="browse"?"active":"")+'" data-market-view="browse">← '+tr("Browse listings","Каталог товарів")+'</button></aside>';
}
function topbar(){
 const names={browse:tr("Explore listings","Каталог товарів"),my:tr("My listings","Мої оголошення"),wishlist:tr("Wishlist","Обране"),messages:tr("Buyer & seller chats","Чати покупця й продавця")};
 return '<div class="market-topbar"><div><small>FLEKI’S WRLD MARKETPLACE</small><h2>'+names[view]+'</h2></div><button type="button" class="market-topplus" data-market-create="1" title="'+tr("Create listing","Створити оголошення")+'" aria-label="'+tr("Create listing","Створити оголошення")+'">＋</button></div><p id="market-status" class="market-status" role="status" data-error="'+String(statusError)+'">'+escape(status)+'</p>'+(options?'':'<button type="button" class="btn" data-market-retry="1">Reload marketplace options</button>');
}
function mediaPreview(item){
 const images=Array.isArray(item.images)?item.images:[];
 return images.length?'<img src="'+escape(images[0])+'" loading="lazy" referrerpolicy="no-referrer" alt="">':'<span class="market-image-placeholder" aria-hidden="true">✧</span>';
}
function itemCard(item){
 return '<article class="market-card"><div class="market-thumb">'+mediaPreview(item)+'<button class="market-heart '+(item.favorited?'is-saved':'')+'" type="button" data-market-favorite="'+escape(item.id)+'" aria-label="'+(item.favorited?'Remove from wishlist':'Add to wishlist')+'" title="Wishlist">'+(item.favorited?'♥':'♡')+'</button></div><div class="market-card-content"><span class="market-pill">'+escape(categories[item.category]||item.category)+'</span><small>'+escape(subcategoryName(item))+'</small><h3>'+escape(item.title)+'</h3><strong>'+escape(money(item))+'</strong><small>'+(item.negotiable?'Negotiable · ':'Fixed price · ')+escape(countryName(item.origin_country))+'</small><p>'+escape(item.origin_region)+'</p><div class="market-item-counts"><span>♥ '+(item.favorite_count||0)+'</span><span>👍 '+(item.likes||0)+'</span><span>👎 '+(item.dislikes||0)+'</span></div><small>Seller: '+( /^fmail_[a-z0-9]+$/i.test(item.seller_username)?escape(item.seller_name||'Member'):'@'+escape(item.seller_username))+'</small><button class="btn" type="button" data-market-open="'+escape(item.id)+'">View listing →</button></div></article>';
}
function detail(item){
 const images=item.images||[],videos=item.videos||[];
 return '<div class="market-detail"><button type="button" class="market-back" data-market-back="1">← Back to listings</button><h2>'+escape(item.title)+'</h2><strong class="market-price">'+escape(money(item))+'</strong><span class="market-pill">'+(item.negotiable?'Offers welcome · Price negotiable':'Fixed price · No bargaining')+'</span><p>'+escape(item.description)+'</p><dl><dt>Category</dt><dd>'+escape(categories[item.category])+' / '+escape(subcategoryName(item))+'</dd><dt>Seller</dt><dd>'+( /^fmail_[a-z0-9]+$/i.test(item.seller_username)?escape(item.seller_name||'Member'):'@'+escape(item.seller_username))+'</dd><dt>Location</dt><dd>'+escape(countryName(item.origin_country))+', '+escape(item.origin_region)+'</dd><dt>Delivers to</dt><dd>'+escape((item.shipping_countries||[]).map(countryName).join(", "))+'</dd><dt>Delivery services</dt><dd>'+escape((item.delivery_providers||[]).map(id=>shippingName(item,id)).join(", ")||"Ask the seller")+'</dd><dt>Payment options</dt><dd>'+escape((item.payment_methods||[]).map(paymentName).join(", ")||"Ask the seller")+'</dd></dl>'+
 (images.length?'<div class="market-media">'+images.map(src=>'<a href="'+escape(src)+'" target="_blank" rel="noopener noreferrer"><img src="'+escape(src)+'" loading="lazy" referrerpolicy="no-referrer" alt="Item photo"></a>').join("")+'</div>':'')+
 (videos.length?'<div class="market-media">'+videos.map(src=>'<video controls preload="none" referrerpolicy="no-referrer" src="'+escape(src)+'"></video>').join("")+'</div>':'')+
 '<div class="market-actions"><button class="btn primary" type="button" data-market-chat="'+escape(item.id)+'">Message the seller</button><button type="button" class="btn '+(item.favorited?'market-liked':'')+'" data-market-favorite="'+escape(item.id)+'">'+(item.favorited?'♥ Saved':'♡ Wishlist')+' · '+(item.favorite_count||0)+'</button><button type="button" class="btn '+(item.my_reaction===1?'market-liked':'')+'" data-market-reaction="'+escape(item.id)+'" data-reaction="1">👍 '+(item.likes||0)+'</button><button type="button" class="btn '+(item.my_reaction===-1?'market-liked':'')+'" data-market-reaction="'+escape(item.id)+'" data-reaction="-1">👎 '+(item.dislikes||0)+'</button><button class="btn" type="button" data-market-report="'+escape(item.id)+'">Report listing</button></div><p class="market-footnote">Arrange payment and shipping with the seller directly. Fleki’s Wrld does not process payments, guarantee delivery or hold funds in escrow.</p></div>';
}
function renderBrowse(){
 if(selected)return detail(selected);
 const groups=options?.categories||Object.fromEntries(Object.entries(categories).map(([id,label])=>[id,{label}]));
 const option=(key,label,current)=>'<option value="'+escape(key)+'"'+(key===current?' selected':'')+'>'+escape(label)+'</option>';
 return '<div class="market-filters'+(filtersOpen?' filters-open':'')+'">'+
 '<input id="marketSearch" type="search" maxlength="70" placeholder="'+tr("Search products, games, electronics…","Пошук товарів, ігор, техніки…")+'" aria-label="'+tr("Search marketplace","Пошук по маркетплейсу")+'" value="'+escape(filters.q)+'">'+
 '<button class="btn market-filter-toggle" type="button" data-market-toggle-filters="1" aria-expanded="'+filtersOpen+'" aria-controls="marketAdvancedFilters">⚙ '+tr("Filters","Фільтри")+'</button>'+
 '<button class="btn primary market-search-button" data-market-search="1" type="button">'+tr("Search","Знайти")+' →</button>'+
 '<div class="market-filter-advanced" id="marketAdvancedFilters"><select id="marketCategory" aria-label="'+tr("Category","Категорія")+'"><option value="">'+tr("All categories","Усі категорії")+'</option>'+Object.entries(groups).map(([id,g])=>option(id,g.label,filters.category)).join("")+'</select>'+
 '<select id="marketFilterSubcategory" aria-label="'+tr("Product type","Тип товару")+'" '+(!filters.category?"disabled":"")+'>'+subcategoryChoices(filters.category,filters.subcategory)+'</select>'+
 '<select id="marketCountry" aria-label="'+tr("Seller country","Країна продавця")+'"><option value="">'+tr("All countries","Усі країни")+'</option>'+selectCountries(filters.country?[filters.country]:[])+'</select>'+
 '<select id="marketNegotiable" aria-label="'+tr("Price negotiation","Торг")+'"><option value="">'+tr("All prices","Усі ціни")+'</option><option value="true"'+(filters.negotiable==="true"?" selected":"")+'>'+tr("Negotiable only","З торгом")+'</option><option value="false"'+(filters.negotiable==="false"?" selected":"")+'>'+tr("Fixed price only","Фіксована ціна")+'</option></select></div></div>'+
 '<div class="market-results-heading"><strong>'+tr("Available listings","Доступні оголошення")+'</strong><span>'+listings.length+' '+tr("items","товарів")+'</span></div>'+
 '<div class="market-grid" role="list" aria-label="'+tr("Marketplace listings","Оголошення маркетплейсу")+'">'+(listings.length?listings.map(itemCard).join(""):'<div class="market-empty"><h3>'+tr("Nothing found yet","Поки нічого не знайдено")+'</h3><p>'+tr("Try different filters or publish the first real item.","Спробуй інші фільтри або опублікуй перший товар.")+'</p><button class="btn primary" data-market-create="1" type="button">'+tr("＋ Sell an item","＋ Продати товар")+'</button></div>')+'</div>'+
 '<p class="market-footnote">'+tr("List only goods you legally own and can transfer. Game-account trades may violate rules. Arrange payment and shipping with the seller.","Публікуй лише товари, якими законно володієш. Продаж ігрових акаунтів може порушувати правила. Оплату та доставку узгоджуй із продавцем.")+'</p>';
}
function photoQueueMarkup(){
 return '<div class="market-upload-gallery">'+photoPreviews.map((src,i)=>'<div class="market-upload-shot"><img src="'+escape(src)+'" alt="Photo '+(i+1)+'"><button type="button" data-market-photo-remove="'+i+'" aria-label="Remove photo">×</button></div>').join("")+'</div>';
}
function photoQueueRefresh(){
 const target=$("#marketPhotoQueue");if(target)target.innerHTML=photoQueueMarkup();
}
function photoQueueClear(){
 for(const url of photoPreviews)URL.revokeObjectURL(url);
 queuedPhotos=[];photoPreviews=[];uploadedPhotos=[];
}
async function uploadQueued(){
 for(let i=uploadedPhotos.length;i<queuedPhotos.length;i++){
  const file=queuedPhotos[i],raw=await file.arrayBuffer(),response=await fetch(API+"/market/media",{
   method:"POST",headers:{"Authorization":"Bearer "+token(),"Content-Type":file.type||"application/octet-stream"},body:raw,cache:"no-store"});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||"Unable to upload photo "+(i+1));
  uploadedPhotos.push(result.url);
  message("Uploaded photo "+(i+1)+" of "+queuedPhotos.length);
 }
}
function renderSell(){
 if(!options?.categories||!options?.payment_methods)return '<section class="market-panel"><h2>Prepare a listing</h2><p>Category and delivery options are unavailable at the moment. Publishing stays disabled until the options are loaded securely from the server.</p></section>';
 const first=Object.keys(options.categories)[0];
 const destinations=countries.map(x=>'<label class="market-country-option" data-search-country="'+escape(x.name.toLowerCase())+'"><input type="checkbox" name="shipping_countries" value="'+x.code+'"'+(x.code==="UA"?" checked":"")+'><span>'+escape(x.name)+'</span></label>').join("");
 const payments=options.payment_methods.map(x=>'<label class="market-check"><input type="checkbox" name="payment_methods" value="'+escape(x.id)+'"><span>'+escape(x.label)+'</span></label>').join("");
 return '<div class="market-panel market-seller-studio"><div class="market-studio-intro"><span class="overline">FLEKI’S WRLD · SELLER STUDIO</span><h2>'+(editing?'✦ Edit your listing':'✦ Create a listing')+'</h2><p>Beautiful offers start with a clear name, real photos, a fair price and trustworthy delivery information.</p><div class="market-studio-steps"><span>① Product</span><span>② Details</span><span>③ Delivery</span><span>④ Publish</span></div></div><form id="marketSellForm" class="market-form">'+
 '<label>Listing title (5–120 characters)<input name="title" minlength="5" maxlength="120" required placeholder="What are you selling?"></label>'+
 '<div class="market-inline"><label>Category<select id="marketSellCategory" name="category" required>'+categoryChoices(first)+'</select></label><label>Specific item type<select id="marketSellSubcategory" name="subcategory" required><option value="" disabled selected>Select item type</option>'+subcategoryChoices(first)+'</select></label></div>'+
 '<label id="marketCustomTypeWrap" hidden>Describe the item type (2–80 characters)<input name="custom_type" minlength="2" maxlength="80" placeholder="e.g. custom-made industrial shelving"></label>'+
 '<label>Description (10–1000 characters)<textarea name="description" minlength="10" maxlength="1000" rows="5" required placeholder="Condition, size, contents, delivery details, guarantees and what buyers should know"></textarea></label>'+
 '<div class="market-inline"><label>Price<input name="price" type="number" min="0" max="10000000" step=".01" value="0" required></label><label>Currency<select name="currency">'+currencies.map(x=>'<option value="'+x+'"'+(x==="UAH"?" selected":"")+'>'+x+'</option>').join("")+'</select></label></div>'+
 '<fieldset class="market-fieldset"><legend>Can the buyer negotiate the price? <span class="market-required">*</span></legend><div class="market-choice-row"><label class="market-check"><input type="radio" name="negotiable" value="yes" required><span>Yes — open to offers / bargaining</span></label><label class="market-check"><input type="radio" name="negotiable" value="no" required><span>No — fixed price</span></label></div></fieldset>'+
 '<div class="market-inline"><label>Country where you sell <span class="market-required">*</span><select id="marketOriginCountry" name="origin_country" required>'+selectCountries(["UA"])+'</select></label><label><span id="marketRegionLabel">Oblast / область</span> <span class="market-required">*</span><input name="origin_region" minlength="2" maxlength="100" required placeholder="Enter the real region or state (not a private street address)"></label></div>'+
 '<fieldset class="market-fieldset"><legend>Deliveries & destinations <span class="market-required">*</span></legend><p class="market-field-help">Separate searchable lists: choose the countries you ship to, and the carriers you use. Confirm that each service operates on your route.</p><div class="market-shipping-columns"><section class="market-picker-column"><h3>Delivery destinations</h3><input id="marketDestinationSearch" type="search" placeholder="Search country…"><div id="marketCountryChoices" class="market-country-choices">'+destinations+'</div><p id="marketDestinationCount" class="market-field-help">1 country selected</p></section><section class="market-picker-column"><h3>Postal services</h3><input id="marketCourierSearch" type="search" placeholder="Search delivery company…"><div id="marketCarrierChoices" class="market-carrier-choices">Loading delivery services…</div><p id="marketCarrierHint" class="market-field-help">Carrier availability depends on the route.</p></section></div></fieldset>'+
 
 '<fieldset class="market-fieldset"><legend>Accepted payment arrangements <span class="market-required">*</span></legend><div class="market-choice-grid">'+payments+'</div><p class="market-field-help">You choose which options you accept. Payment is agreed directly with the buyer — Fleki’s Wrld does not charge cards, transfer money, or guarantee delivery. Never post full card details.</p></fieldset>'+
 '<section class="market-upload-zone"><h3>📷 Product photos</h3><p>Choose up to 6 photos from your device. Each PNG, JPEG or WebP can be up to <strong>4 MB</strong>. These files are uploaded securely to fleki’s wrld.</p><label class="market-upload-trigger">＋ Select photos<input id="marketPhotoFiles" accept="image/png,image/jpeg,image/webp" type="file" multiple hidden></label><div id="marketPhotoQueue">'+photoQueueMarkup()+'</div></section>'+
 '<label>Photos (up to 30 direct HTTPS image links, one per line)<textarea name="images" rows="3" placeholder="https://example.com/photo.jpg"></textarea></label>'+
 '<label>Videos (up to 5 direct HTTPS MP4/WebM links, one per line)<textarea name="videos" rows="2" placeholder="https://example.com/demo.mp4"></textarea></label>'+
 '<p class="market-footnote">You can upload product photos directly (4 MB each) or optionally paste HTTPS image links. Keep private addresses, banking details, 2FA codes and passwords out of listings. Check publisher terms before selling game accounts or currencies.</p>'+
 '<button class="btn primary" type="submit">'+(editing?'Save changes':'Publish listing')+'</button></form></div>';
}
function renderMy(){
 const row=item=>'<article class="market-owner-card"><div class="market-owner-thumb">'+mediaPreview(item)+'</div><div class="market-owner-body"><span class="market-pill">'+escape(item.status)+'</span><h3>'+escape(item.title)+'</h3><strong>'+escape(money(item))+'</strong><div class="market-owner-stats"><span title="Unique buyers who sent a message">✉ '+(item.interested_buyers||0)+' interested</span><span title="Saved to wishlist">♥ '+(item.favorite_count||0)+' saved</span><span title="Likes">👍 '+(item.likes||0)+'</span><span title="Dislikes">👎 '+(item.dislikes||0)+'</span></div><div class="market-owner-actions"><button type="button" class="btn primary" data-market-edit="'+escape(item.id)+'">Edit listing</button><label>Status <select data-market-status-id="'+escape(item.id)+'" aria-label="Listing status"><option value="active" '+(item.status==="active"?"selected":"")+'>Active</option><option value="sold" '+(item.status==="sold"?"selected":"")+'>Sold</option><option value="hidden" '+(item.status==="hidden"?"selected":"")+'>Hidden</option></select></label></div></div></article>';
 return '<section class="market-panel market-owner-panel"><p class="market-muted">Manage your offers and see how many individual buyers wrote to you. Counts are based on real database activity.</p>'+(own.length?'<div class="market-owner-grid">'+own.map(row).join("")+'</div>':'<div class="market-empty"><h3>No listings yet</h3><p>Tap the plus button to publish your first offer.</p><button class="btn primary" type="button" data-market-create="1">＋ Create listing</button></div>')+'</section>';
}
function renderWishlist(){
 return '<section class="market-panel"><p class="market-muted">Items you saved with ♡. Only you can see your wishlist.</p>'+(wishlist.length?'<div class="market-grid">'+wishlist.map(itemCard).join("")+'</div>':'<div class="market-empty"><h3>Your wishlist is empty</h3><p>Explore listings and tap ♡ to keep products here.</p><button class="btn primary" type="button" data-market-view="browse">Explore products</button></div>')+'</section>';
}
function renderMessages(){
 const bought=conversations.filter(x=>x.buyer_id===myId),sold=conversations.filter(x=>x.buyer_id!==myId);
 const active=threadSide==="buy"?bought:sold;
 return '<section class="market-panel market-chat-panel"><div class="market-chat-tabs"><button type="button" class="'+(threadSide==="buy"?"active":"")+'" data-market-side="buy">I’m buying <span>'+bought.length+'</span></button><button type="button" class="'+(threadSide==="sell"?"active":"")+'" data-market-side="sell">Buying from me <span>'+sold.length+'</span></button></div><div class="market-inbox"><div class="market-inbox-list">'+(active.length?active.map(x=>'<button class="market-thread '+(chatKey?.listingId===x.listing_id&&chatKey?.buyerId===x.buyer_id?"active":"")+'" type="button" data-market-thread="'+escape(x.listing_id)+'" data-market-buyer="'+escape(x.buyer_id)+'"><strong>'+escape(x.title)+'</strong><small>'+(threadSide==="buy"?"Seller: @"+escape(x.seller_name):"Buyer: @"+escape(x.buyer_name))+'</small><span>'+escape(x.last_message)+'</span></button>').join(""):'<div class="market-empty"><p>No conversations in this category yet.</p></div>')+'</div><div class="market-conversation">'+(chatKey?'<h3>Conversation</h3><div id="marketChatMessages" class="market-chat-messages">Loading…</div><form id="marketChatForm" class="market-inline"><input name="message" maxlength="1500" required placeholder="Type your message" aria-label="Your message"><button class="btn primary" type="submit">Send →</button></form>':'<div class="market-empty"><h3>Select a conversation</h3><p>Choose a product from the left to view your private messages.</p></div>')+'</div></div><p class="market-footnote">Messages are accessible only to the buyer and seller. They are not end-to-end encrypted.</p></section>';
}
function renderStore(){
 return '<section class="market-panel"><h2>Register your own store</h2><p>Store accounts require manual approval so buyers can recognize official merchants. Ordinary users can publish individual listings immediately after verifying 2FA.</p><a class="btn primary" target="_blank" rel="noopener noreferrer" href="https://t.me/flekusik">Apply directly via Telegram · @flekusik ↗</a><p class="market-footnote">Do not send passwords, 2FA secrets or recovery codes to anyone, including store administrators.</p></section>';
}
function fillEditor(){
 const item=editing,form=$("#marketSellForm");if(!item||!form)return;
 const update=(name,value)=>{const el=form.elements.namedItem(name);if(el&&el.tagName)el.value=String(value??"")};
 update("title",item.title);update("description",item.description);update("price",(item.price_minor/100).toFixed(2));update("currency",item.currency);
 update("category",item.category);refreshSubcategories();update("subcategory",item.subcategory);refreshCustomType();update("custom_type",item.custom_type);
 const radio=form.querySelector('input[name="negotiable"][value="'+(item.negotiable?"yes":"no")+'"]');if(radio)radio.checked=true;
 update("origin_country",item.origin_country);update("origin_region",item.origin_region);
 for(const input of $('[name="shipping_countries"]'))input.checked=(item.shipping_countries||[]).includes(input.value);
 for(const input of $('[name="payment_methods"]'))input.checked=(item.payment_methods||[]).includes(input.value);
 update("images",(item.images||[]).join("\n"));update("videos",(item.videos||[]).join("\n"));
}
function paint(){
 if(authState!=="verified"){
  lastPaintIdentity="";root.innerHTML=verifiedGate();return;
 }
 const identity=view+"|"+(selected?.id||"")+"|"+(view==="messages"?threadSide+"|"+(chatKey?.listingId||"")+"|"+(chatKey?.buyerId||""):"");
 const oldScroll=identity===lastPaintIdentity?{main:$("#marketContent")?.scrollTop||0,threads:$(".market-inbox-list")?.scrollTop||0,chat:$("#marketChatMessages")?.scrollTop||0}:null;
 const main=view==="my"?renderMy():view==="wishlist"?(selected?detail(selected):renderWishlist()):view==="messages"?renderMessages():renderBrowse();
 root.innerHTML='<div class="market-shell market-workspace">'+menu()+'<main class="market-main">'+topbar()+'<div class="market-scroll" id="marketContent" role="region" aria-label="'+tr("Marketplace content","Вміст маркетплейсу")+'" tabindex="0">'+main+'</div></main></div>'+
 (shopFormOpen?'<div class="market-modal-backdrop" id="marketEditBackdrop"><div class="market-edit-dialog" role="dialog" aria-modal="true" aria-label="Listing editor"><button type="button" class="market-modal-close" data-market-close="1" aria-label="Close listing editor">×</button>'+renderSell()+'</div></div>':'');
 lastPaintIdentity=identity;
 if(oldScroll){const scroll=$("#marketContent"),threads=$(".market-inbox-list"),chat=$("#marketChatMessages");if(scroll)scroll.scrollTop=oldScroll.main;if(threads)threads.scrollTop=oldScroll.threads;if(chat)chat.scrollTop=oldScroll.chat;}
 if(shopFormOpen){fillEditor();void refreshShippingProviders();updateDestinationCount();
  const form=$("#marketSellForm");if(form&&!form.dataset.focused){form.dataset.focused="yes";Promise.resolve().then(()=>form.querySelector('input[name="title"]')?.focus())}
 }
 if(chatKey)void loadMessages();
}
async function browse(){
 loading=true;try{
  const params=new URLSearchParams();
  filters={q:$("#marketSearch")?.value.trim()||"",category:$("#marketCategory")?.value||"",
   subcategory:$("#marketFilterSubcategory")?.value||"",country:$("#marketCountry")?.value||"",
   negotiable:$("#marketNegotiable")?.value||""};
  for(const [k,v] of Object.entries(filters))if(v)params.set(k==="q"?"q":k,v);
  listings=(await call("/market/listings?"+params)).listings;selected=null;message("");paint();
 }catch(err){message(err.message,true)}finally{loading=false}
}
async function changeView(next){
 if(!["browse","my","wishlist","messages"].includes(next))return;
 view=next;selected=null;chatKey=null;shopFormOpen=false;editing=null;message("");
 try{
  if(next==="my")own=(await call("/market/mine")).listings;
  if(next==="wishlist")wishlist=(await call("/market/wishlist")).listings;
  if(next==="messages")conversations=(await call("/market/conversations")).conversations;
  if(next==="browse"){
   const qs=new URLSearchParams();for(const [k,v] of Object.entries(filters))if(v)qs.set(k,v);
   listings=(await call("/market/listings?"+qs)).listings;
  }
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
 if(el.id==="marketPhotoFiles"){
   const images=[...el.files||[]];el.value="";
   for(const file of images){
    if(queuedPhotos.length>=6){message("Maximum 6 photos per listing.",true);break}
    if(file.size>MAX_MARKET_PHOTO||file.size<32||!["image/png","image/jpeg","image/webp"].includes(file.type)){
     message("Each photo must be a PNG, JPG or WebP of 4 MB or less.",true);continue;
    }
    queuedPhotos.push(file);photoPreviews.push(URL.createObjectURL(file));
   }
   photoQueueRefresh();
  }else if(el.id==="marketOriginCountry"||el.id==="marketSellCategory"){
  if(el.id==="marketSellCategory")refreshSubcategories();
  await refreshShippingProviders();
 }else if(el.id==="marketSellSubcategory"){refreshCustomType()}
 else if(el.id==="marketCategory"){
  const sub=$("#marketFilterSubcategory");
  if(sub){sub.disabled=!el.value;sub.innerHTML=subcategoryChoices(el.value)}
 }else if(el.name==="shipping_countries"){
  if($('[name="shipping_countries"]:checked').length>70){el.checked=false;message("Choose up to 70 destination countries.",true)}
  updateDestinationCount();filterDestinations();
 }else if(el.matches("[data-market-status-id]")){
  try{await needLogin();await call("/market/listings/"+el.dataset.marketStatusId+"/status","POST",{status:el.value});message("Listing updated.");own=(await call("/market/mine")).listings;paint()}catch(err){message(err.message,true)}
 }
});
root.addEventListener("input",event=>{
 if(event.target?.id==="marketDestinationSearch")filterDestinations();
 if(event.target?.id==="marketCourierSearch")filterCouriers();
});
root.addEventListener("click",async event=>{
 if(event.target?.id==="marketEditBackdrop"){shopFormOpen=false;editing=null;paint();return}
 const target=event.target.closest("button");if(!target)return;
 try{
  if(target.dataset.marketPhotoRemove!==undefined){
    const i=Number(target.dataset.marketPhotoRemove);
    if(Number.isInteger(i)&&i>=0&&i<queuedPhotos.length){
     URL.revokeObjectURL(photoPreviews[i]);queuedPhotos.splice(i,1);photoPreviews.splice(i,1);
     // Uploaded queue is positional; a fresh submission must upload remaining images.
     uploadedPhotos=[];
     photoQueueRefresh();
    }
    return;
   }
   if(target.dataset.marketRetry){
    options=await loadOptions();
    const data=await call("/market/listings");listings=data.listings;
    message("Marketplace is ready.");paint();return;
  }
  if(target.dataset.marketProfile){document.querySelector('#dock [data-go="profile"]')?.click();return}
  if(target.dataset.marketCheck){await initialize();return}
  if(target.dataset.marketClose){shopFormOpen=false;editing=null;photoQueueClear();paint();return}
  if(target.dataset.marketCreate){await needLogin();editing=null;photoQueueClear();shopFormOpen=true;paint();return}
  if(target.dataset.marketEdit){
   await needLogin();editing=own.find(x=>x.id===target.dataset.marketEdit);
   if(!editing)throw Error("Your listing was not found.");
   shopFormOpen=true;paint();return;
  }
  if(target.dataset.marketView){await changeView(target.dataset.marketView);return}
  if(target.dataset.marketSide){
   threadSide=target.dataset.marketSide;chatKey=null;paint();return;
  }
  if(target.dataset.marketToggleFilters){filtersOpen=!filtersOpen;paint();return}
  if(target.dataset.marketSearch){await browse();return}
  if(target.dataset.marketBack){selected=null;paint();return}
  if(target.dataset.marketOpen){
   selected=[...listings,...wishlist].find(x=>x.id===target.dataset.marketOpen);
   if(selected)try{
    const data=await loadOptions(selected.origin_country,selected.category);
    for(const x of data.delivery_providers||[])carrierNames.set(selected.origin_country+":"+x.id,x.label);
   }catch{}
   paint();return;
  }
  if(target.dataset.marketFavorite){
   await needLogin();
   const id=target.dataset.marketFavorite,old=[...listings,...wishlist].find(x=>x.id===id)||selected;
   const method=old?.favorited?"DELETE":"POST";
   await call("/market/favorites/"+encodeURIComponent(id),method);
   const results=await Promise.all([call("/market/listings"),call("/market/wishlist")]);
   listings=results[0].listings;wishlist=results[1].listings;
   if(selected?.id===id)selected=(await call("/market/listings/"+id)).listing;
   paint();return;
  }
  if(target.dataset.marketReaction){
   await needLogin();
   const id=target.dataset.marketReaction;
   const item=selected?.id===id?selected:[...listings,...wishlist].find(x=>x.id===id);
   const selectedValue=Number(target.dataset.reaction);
   await call("/market/reactions/"+encodeURIComponent(id),"PUT",{reaction:item?.my_reaction===selectedValue?0:selectedValue});
   if(selected?.id===id)selected=(await call("/market/listings/"+id)).listing;
   listings=(await call("/market/listings")).listings;
   paint();return;
  }
  if(target.dataset.marketChat){
   const me=await needLogin();
   const x=selected||[...listings,...wishlist].find(x=>x.id===target.dataset.marketChat);
   if(!x||me.id===x.seller_id)throw Error("You cannot message yourself.");
   view="messages";threadSide="buy";chatKey={listingId:x.id,buyerId:me.id};
   conversations=(await call("/market/conversations")).conversations;
   paint();return;
  }
  if(target.dataset.marketReport){await needLogin();const reason=window.prompt("Why should this listing be reviewed? (10–500 characters)");if(reason===null)return;await call("/market/reports","POST",{listing_id:target.dataset.marketReport,reason});message("Report received for moderation.");return}
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
   const data=new FormData(form),shipping=data.getAll("shipping_countries"),
    delivery=data.getAll("delivery_providers"),payments=data.getAll("payment_methods");
   const lines=name=>String(data.get(name)||"").split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean);
   const price=Number(data.get("price"));
   if(!Number.isFinite(price))throw Error("Invalid price.");
   const fields={title:data.get("title"),description:data.get("description"),category:data.get("category"),
    subcategory:data.get("subcategory"),custom_type:data.get("custom_type")||"",
    price_minor:Math.round(price*100),currency:data.get("currency"),negotiable:data.get("negotiable")==="yes",
    origin_country:data.get("origin_country"),origin_region:data.get("origin_region"),
    shipping_countries:shipping,delivery_providers:delivery,payment_methods:payments,
    images:lines("images"),videos:lines("videos")};
   if(!shipping.length||!delivery.length||!payments.length)throw Error("Select a delivery destination, carrier and at least one payment method.");
   if(shipping.length>70)throw Error("Select no more than 70 delivery countries.");
   if(queuedPhotos.length){
     if(fields.images.length+queuedPhotos.length>30)throw Error("A listing can contain up to 30 photo links and uploads combined.");
     message("Uploading "+queuedPhotos.length+" photos…");
     await uploadQueued();
     fields.images=[...fields.images,...uploadedPhotos];
    }
    await call(editing?"/market/listings/"+editing.id:"/market/listings",editing?"PUT":"POST",fields);
   message(editing?"Listing updated.":"Listing published successfully!");
   shopFormOpen=false;editing=null;photoQueueClear();view="my";own=(await call("/market/mine")).listings;paint();
  }else{
   const content=new FormData(form).get("message");
   await call("/market/messages","POST",{listing_id:chatKey.listingId,buyer_id:chatKey.buyerId,content});
   form.reset();conversations=(await call("/market/conversations")).conversations;
   paint();message("Message sent.");
  }
 }catch(err){message(err.message,true)}finally{loading=false}
});
async function initialize(){
 authState="loading";paint();
 if(!await validateAccess()){paint();return}
 try{
  const [catalog,list]=await Promise.all([loadOptions(),call("/market/listings")]);
  options=catalog;listings=list.listings;message("");paint();
 }catch(err){message("Marketplace could not load: "+err.message,true);paint()}
}
window.addEventListener("fw-auth-changed",()=>void initialize());
window.addEventListener("wrld:language-change",()=>{if(!shopFormOpen&&!document.activeElement?.closest?.("#wrld-market-root form"))paint()});
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&shopFormOpen){shopFormOpen=false;editing=null;paint()}
});
window.addEventListener("pageshow",()=>{if(token()&&authState!=="verified")void initialize()});
void initialize();
})();
