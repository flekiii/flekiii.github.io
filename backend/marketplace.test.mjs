import test from "node:test";
import assert from "node:assert/strict";
import { marketHandle } from "./marketplace.js";
import { marketCategories,availableShipping,marketPayments,countryCarriers,validTaxon } from "./market-catalog.js";
const fakeDB={prepare(){throw Error("DB must not be touched for unauthenticated marketplace writes")}};
const emptyReq=(path,method="POST")=>new Request("https://flekis-wrld-api.flekideveloper.workers.dev"+path,{method,headers:{"Content-Type":"application/json"},body:method==="GET"?undefined:"{}"});
test("Unauthenticated users cannot post marketplace listings or contact sellers",async()=>{
 for(const path of ["/market/listings","/market/messages"]){
  const res=await marketHandle(emptyReq(path),{DB:fakeDB},path,{auth:async()=>null,authorized:()=>false});
  assert.equal(res.status,401);
 }
});
test("Logged in but unverified users cannot sell or message",async()=>{
 for(const path of ["/market/listings","/market/messages"]){
  const res=await marketHandle(emptyReq(path),{DB:fakeDB},path,{auth:async()=>({id:"u"}) ,authorized:()=>false});
  assert.equal(res.status,403);
 }
});
test("Unrelated routes pass through to the existing community API",async()=>{
 assert.equal(await marketHandle(emptyReq("/health","GET"),{DB:fakeDB},"/health",{auth:async()=>null,authorized:()=>false}),null);
});

test("Category taxonomy includes shorts, pants, bedside tables and hundreds of specific item types",()=>{
 assert.ok(Object.keys(marketCategories).length>=10);
 assert.ok(Object.values(marketCategories).reduce((n,g)=>n+g.subcategories.length,0)>=200);
 assert.ok(marketCategories.clothing.subcategories.some(t=>t.id==="shorts"));
 assert.ok(marketCategories.clothing.subcategories.some(t=>t.id==="trousers_pants"));
 assert.ok(marketCategories.furniture.subcategories.some(t=>t.id==="bedside_tables"));
 assert.ok(validTaxon("furniture","bedside_tables"));
 assert.equal(validTaxon("furniture","shorts"),false);
 assert.equal(validTaxon("clothing","other"),true);
});
test("Named delivery services are country-specific; payment arrangements are explicit",()=>{
 assert.ok(Object.keys(countryCarriers).length>=60);
 assert.ok(availableShipping("UA","furniture").some(x=>x.label==="Nova Poshta"));
 assert.ok(availableShipping("PL","clothing").some(x=>x.label==="InPost"));
 assert.ok(!availableShipping("US","clothing").some(x=>x.label==="Nova Poshta"));
 assert.ok(availableShipping("ZZ","furniture").some(x=>x.id==="national_post"));
 assert.deepEqual(availableShipping("UA","game_currency").map(x=>x.id),["digital_delivery","other_method"]);
 assert.ok(marketPayments.some(x=>x.id==="cash_on_delivery"));
 assert.ok(marketPayments.some(x=>x.id==="card_transfer"));
});
test("Authenticated marketplace options supply validated local couriers",async()=>{
 const r=await marketHandle(emptyReq("/market/options?country=UA&category=clothing","GET"),{DB:fakeDB},"/market/options",{auth:async()=>({id:"member"}),authorized:()=>true});
 assert.equal(r.status,200);
 const x=await r.json();
 assert.ok(x.delivery_providers.some(c=>c.label==="Nova Poshta"));
 assert.ok(!x.delivery_providers.some(c=>c.label==="InPost"));
 assert.ok(Array.isArray(x.payment_methods));
 assert.ok(x.categories.clothing);
});
test("Server rejects incorrect courier country, missing payments, invalid taxonomy and nonsensical delivery",async()=>{
 const user={id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",username:"seller"};
 const sellerAuth={auth:async()=>user,authorized:()=>true};
 const makeDb=()=>({prepare(sql){return {bind(...params){return {async first(){return {total:0}},async run(){return {meta:{changes:1}}}}}}}});
 const payload={
  title:"Oak bedside table",description:"Solid oak beside the bedroom, excellent condition",
  category:"furniture",subcategory:"bedside_tables",custom_type:"",
  price_minor:125000,currency:"UAH",origin_country:"UA",origin_region:"Ivano-Frankivsk Oblast",
  shipping_countries:["UA","PL"],delivery_providers:["nova_poshta"],payment_methods:["cash_on_delivery","card_transfer"],
  negotiable:true,images:[],videos:[]
 };
 const send=async data=>marketHandle(new Request("https://flekis-wrld-api.flekideveloper.workers.dev/market/listings",{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)
 }),{DB:makeDb()},"/market/listings",sellerAuth);
 for(const edits of [
   {subcategory:"shorts"},{delivery_providers:["inpost"]},{payment_methods:[]},
   {negotiable:"yes"},{custom_type:"secret"},{shipping_countries:[]}
 ]){
  const res=await send({...payload,...edits});
  assert.equal(res.status,400,"Must reject "+JSON.stringify(edits));
 }
 const good=await send(payload);assert.equal(good.status,201);
 const digital=await send({...payload,category:"digital",subcategory:"apps",delivery_providers:["digital_delivery"]});
 assert.equal(digital.status,400,"COD cannot be attached to digital delivery");
});

test("Marketplace catalog, wishlist, product editor, votes and conversations require sign-in AND 2FA",async()=>{
 const paths=["/market/options","/market/listings","/market/mine","/market/wishlist","/market/conversations","/market/messages"];
 const fake={DB:fakeDB};
 for(const path of paths){
  const req=emptyReq(path,"GET");
  const guest=await marketHandle(req,fake,path,{auth:async()=>null,authorized:()=>false});
  assert.equal(guest.status,401,path+" should reject guests");
  const unverified=await marketHandle(emptyReq(path,"GET"),fake,path,{auth:async()=>({id:"person"}),authorized:()=>false});
  assert.equal(unverified.status,403,path+" should reject unverified sessions");
 }
 const listing="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
 for(const path of ["/market/favorites/"+listing,"/market/reactions/"+listing,"/market/listings/"+listing]){
  const method=path.includes("favorites")?"POST":"PUT";
  const denied=await marketHandle(emptyReq(path,method),fake,path,{auth:async()=>({id:"member"}),authorized:()=>false});
  assert.equal(denied.status,403);
 }
});
test("Computing category includes RAM, monitors, keyboards, PC cooling and GPU",()=>{
 const ids=marketCategories.electronics.subcategories.map(x=>x.id);
 for(const value of ["monitors","computer_mice","keyboards","ram","pc_cases","cpu_coolers","case_fans","graphics_cards","motherboards","cpus"]){
  assert.ok(ids.includes(value),value);
 }
});
