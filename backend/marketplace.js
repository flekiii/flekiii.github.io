// Real Fleki's Wrld marketplace. 2FA is required for writes and private messages.
import {marketCategories,marketCountries,countryCarriers,marketPayments,availableShipping,validTaxon,digitalCategories} from "./market-catalog.js";
const ORIGIN="https://flekiii.github.io";
const categories=new Set(Object.keys(marketCategories));
const payments=new Set(marketPayments.map(x=>x.id));
const ok=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":ORIGIN,"vary":"Origin"}});
const fail=(message,status=400)=>ok({error:message},status);
const get=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const many=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results||[];
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const id=s=>typeof s==="string"&&/^[a-f0-9-]{36}$/.test(s);
const text=(value,max)=>typeof value==="string"?value.trim().slice(0,max+1):"";
const iso2=s=>typeof s==="string"&&/^[A-Z]{2}$/.test(s)&&marketCountries.has(s);
const media=(v,max,type)=>{
 if(!Array.isArray(v)||v.length>max)throw Error("Maximum "+max+" "+type+" URLs.");
 const rx=type==="images"?/\.(?:png|jpe?g|webp|gif)(?:$|\?)/i:/\.(?:mp4|webm)(?:$|\?)/i;
 return v.map(x=>{
  if(typeof x!=="string"||x.length>1000)throw Error("Invalid media URL.");
  let u;try{u=new URL(x)}catch{throw Error("Invalid media URL.")}
  if(u.protocol!=="https:"||u.username||u.password||!rx.test(u.pathname)||u.search||u.hash)throw Error("Use direct HTTPS photo/video file URLs without query parameters.");
  return u.href;
 });
};
async function body(req){const raw=await req.text();if(raw.length>105000)throw Error("Request too large.");try{return JSON.parse(raw)}catch{throw Error("Invalid JSON.")}}
const safeListing=async(db,row)=>{
 if(!row)return null;
 return {...row,images:JSON.parse(row.images||"[]"),videos:JSON.parse(row.videos||"[]"),
  shipping_countries:JSON.parse(row.shipping_countries||"[]"),
  delivery_providers:JSON.parse(row.delivery_providers||"[]"),
  payment_methods:JSON.parse(row.payment_methods||"[]"),
  negotiable:row.negotiable===1};
};
const choices=(value,max,allowed)=>{
 if(!Array.isArray(value)||value.length<1||value.length>max||value.some(x=>typeof x!=="string"||!allowed.has(x)))return null;
 const unique=[...new Set(value)];return unique.length===value.length?unique:null;
};
export async function marketHandle(req,env,path,{auth,authorized}){
 if(!path.startsWith("/market/"))return null;
 const db=env.DB,m=req.method,url=new URL(req.url),now=Date.now();
 if(m==="GET"&&path==="/market/options"){
  const country=text(url.searchParams.get("country")||"",2).toUpperCase();
  const category=text(url.searchParams.get("category")||"",40);
  if(country&&!iso2(country)||category&&!categories.has(category))return fail("Invalid country or category.");
  return ok({categories:marketCategories,payment_methods:marketPayments,
    delivery_providers:country&&category?availableShipping(country,category):[],
    countries_with_named_carriers:Object.keys(countryCarriers),
    delivery_disclaimer:"Carrier options are suggestions only. The seller must confirm actual route, COD eligibility, destination, rates and shipping conditions."});
 }
 if(m==="GET"&&path==="/market/listings"){
  const q=text(url.searchParams.get("q")||"",70);
  const category=text(url.searchParams.get("category")||"",40);
  const country=text(url.searchParams.get("country")||"",2).toUpperCase();
  const region=text(url.searchParams.get("region")||"",100);
  const subcategory=text(url.searchParams.get("subcategory")||"",80);
  const bargain=url.searchParams.get("negotiable");
  if(category&&!categories.has(category)||country&&!iso2(country)||
     subcategory&&(!category||!validTaxon(category,subcategory))||
     bargain!==null&&bargain!=="true"&&bargain!=="false")return fail("Invalid filter.");
  let query="SELECT l.*,u.username AS seller_username,u.display_name AS seller_name FROM market_listings l JOIN users u ON u.id=l.seller_id WHERE l.status='active'";
  const params=[];
  if(q){query+=" AND (l.title LIKE ? ESCAPE '\\' OR l.description LIKE ? ESCAPE '\\' OR l.subcategory LIKE ? ESCAPE '\\' OR l.custom_type LIKE ? ESCAPE '\\')";const needle="%"+q.replace(/[\\%_]/g,"\\$&")+"%";params.push(needle,needle,needle,needle)}
  if(category){query+=" AND l.category=?";params.push(category)}
  if(country){query+=" AND l.origin_country=?";params.push(country)}
  if(subcategory){query+=" AND l.subcategory=?";params.push(subcategory)}
  if(bargain!==null){query+=" AND l.negotiable=?";params.push(bargain==="true"?1:0)}
  if(region){query+=" AND l.origin_region LIKE ? ESCAPE '\\'";params.push("%"+region.replace(/[\\%_]/g,"\\$&")+"%")}
  query+=" ORDER BY l.created_at DESC LIMIT 60";
  return ok({listings:await Promise.all((await many(db,query,...params)).map(row=>safeListing(db,row)))});
 }
 if(m==="GET"&&/^\/market\/listings\/[a-f0-9-]{36}$/.test(path)){
  const listing=await get(db,"SELECT l.*,u.username AS seller_username,u.display_name AS seller_name FROM market_listings l JOIN users u ON u.id=l.seller_id WHERE l.id=? AND l.status='active'",path.split("/").at(-1));
  return listing?ok({listing:await safeListing(db,listing)}):fail("Listing not found.",404);
 }
 const u=await auth(req,db);
 if(!u)return fail("Sign in to Fleki's Wrld first.",401);
 if(!authorized(u))return fail("Verified 2FA is required to sell or message.",403);
 if(m==="GET"&&path==="/market/mine"){
  const listings=await many(db,"SELECT l.*,u.username AS seller_username,u.display_name AS seller_name FROM market_listings l JOIN users u ON u.id=l.seller_id WHERE l.seller_id=? ORDER BY l.created_at DESC LIMIT 100",u.id);
  return ok({listings:await Promise.all(listings.map(row=>safeListing(db,row)))});
 }
 if(m==="POST"&&path==="/market/listings"){
  const p=await body(req),title=text(p.title,120),description=text(p.description,1000);
  const category=text(p.category,40),currency=text(p.currency,3).toUpperCase();
  const country=text(p.origin_country,2).toUpperCase(),region=text(p.origin_region,100);
  const subcategory=text(p.subcategory,80),customType=text(p.custom_type||"",80);
  const bargaining=p.negotiable;
  const chosenProviders=p.delivery_providers;
  const chosenPayments=p.payment_methods;
  const price=Number(p.price_minor);
  if(title.length<5||title.length>120||description.length<10||description.length>1000)return fail("Title 5–120 characters, description 10–1000 characters.");
  if(!categories.has(category)||!iso2(country)||!region||region.length<2||region.length>100)return fail("Choose a category, country and region/state.");
  if(!validTaxon(category,subcategory))return fail("Choose a valid item subcategory.");
  if(subcategory==="other"&&(customType.length<2||customType.length>80)||subcategory!=="other"&&customType)return fail("Specify an item type only when selecting Other (2–80 characters).");
  if(typeof bargaining!=="boolean")return fail("Specify whether the price is negotiable.");
  const allowedProviders=new Set(availableShipping(country,category).map(x=>x.id));
  const delivery=choices(chosenProviders,8,allowedProviders);
  const payment=choices(chosenPayments,6,payments);
  if(!delivery)return fail("Choose up to 8 valid delivery services for your seller country and category.");
  if(!payment)return fail("Choose up to 6 supported payment methods.");
  if(digitalCategories.includes(category)&&payment.includes("cash_on_delivery"))return fail("Cash on delivery is not available for digital listings.");
  if(!/^[A-Z]{3}$/.test(currency)||!Number.isSafeInteger(price)||price<0||price>1000000000)return fail("Invalid price or currency.");
  const ships=p.shipping_countries;
  if(!Array.isArray(ships)||ships.length<1||ships.length>70||ships.some(v=>!iso2(v)))return fail("Choose countries where you can deliver.");
  const images=media(p.images||[],30,"images"),videos=media(p.videos||[],5,"videos");
  const count=await get(db,"SELECT count(*) AS total FROM market_listings WHERE seller_id=? AND created_at>?",u.id,now-3600000);
  if(Number(count?.total||0)>=5)return fail("Maximum 5 new listings per hour.",429);
  const uuid=crypto.randomUUID();
  await run(db,"INSERT INTO market_listings (id,seller_id,title,description,category,subcategory,custom_type,price_minor,currency,origin_country,origin_region,shipping_countries,delivery_providers,payment_methods,negotiable,images,videos,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    uuid,u.id,title,description,category,subcategory,customType,price,currency,country,region,JSON.stringify([...new Set(ships)]),JSON.stringify(delivery),JSON.stringify(payment),bargaining?1:0,JSON.stringify(images),JSON.stringify(videos),"active",now,now);
  return ok({id:uuid},201);
 }
 if(m==="POST"&&/^\/market\/listings\/[a-f0-9-]{36}\/status$/.test(path)){
  const p=await body(req),status=text(p.status,10);
  if(!["active","hidden","sold"].includes(status))return fail("Invalid listing status.");
  const listingId=path.split("/")[3];
  const result=await run(db,"UPDATE market_listings SET status=?,updated_at=? WHERE id=? AND seller_id=?",status,now,listingId,u.id);
  return result.meta.changes?ok({ok:true}):fail("Listing not found or not yours.",404);
 }
 if(m==="GET"&&path==="/market/conversations"){
  const r=await many(db,"SELECT l.id AS listing_id,l.title,m.buyer_id,MAX(m.created_at) AS last_at,(SELECT content FROM market_messages t WHERE t.listing_id=l.id AND t.buyer_id=m.buyer_id ORDER BY t.created_at DESC LIMIT 1) AS last_message,b.username AS buyer_name,s.username AS seller_name FROM market_messages m JOIN market_listings l ON l.id=m.listing_id JOIN users b ON b.id=m.buyer_id JOIN users s ON s.id=l.seller_id WHERE m.buyer_id=? OR l.seller_id=? GROUP BY l.id,m.buyer_id ORDER BY last_at DESC LIMIT 80",u.id,u.id);
  return ok({conversations:r});
 }
 if(m==="GET"&&path==="/market/messages"){
  const listingId=url.searchParams.get("listing_id"),buyer=url.searchParams.get("buyer_id")||u.id;
  if(!id(listingId)||!id(buyer))return fail("Invalid conversation.");
  const listing=await get(db,"SELECT seller_id FROM market_listings WHERE id=?",listingId);
  if(!listing||(u.id!==listing.seller_id&&u.id!==buyer))return fail("Not your conversation.",403);
  if(!await get(db,"SELECT 1 FROM market_messages WHERE listing_id=? AND buyer_id=?",listingId,buyer))return ok({messages:[]});
  const messages=await many(db,"SELECT id,sender_id,content,created_at FROM market_messages WHERE listing_id=? AND buyer_id=? ORDER BY created_at DESC LIMIT 100",listingId,buyer);
  return ok({messages:messages.reverse()});
 }
 if(m==="POST"&&path==="/market/reports"){
  const p=await body(req),reason=text(p.reason,500);
  if(!id(p.listing_id)||reason.length<10||reason.length>500)return fail("Provide a listing and a 10–500-character reason.");
  const listing=await get(db,"SELECT seller_id FROM market_listings WHERE id=?",p.listing_id);
  if(!listing||listing.seller_id===u.id)return fail("Cannot report this listing.",403);
  await run(db,"INSERT OR IGNORE INTO market_reports(id,reporter_id,listing_id,reason,created_at) VALUES(?,?,?,?,?)",crypto.randomUUID(),u.id,p.listing_id,reason,now);
  return ok({ok:true});
 }
 if(m==="POST"&&path==="/market/messages"){
  const p=await body(req),listingId=p.listing_id,buyer=id(p.buyer_id)?p.buyer_id:u.id,content=text(p.content,1500);
  if(!id(listingId)||content.length<1||content.length>1500)return fail("Message must be 1–1500 characters.");
  const listing=await get(db,"SELECT seller_id,status FROM market_listings WHERE id=?",listingId);
  if(!listing||listing.status==="hidden")return fail("Listing unavailable.",404);
  if(u.id!==listing.seller_id&&buyer!==u.id)return fail("Buyer mismatch.",403);
  if(u.id===listing.seller_id){
   if(!await get(db,"SELECT 1 FROM market_messages WHERE listing_id=? AND buyer_id=?",listingId,buyer))return fail("No buyer conversation to reply to.",403);
  }else if(listing.status!=="active")return fail("Listing is no longer available.",409);
  if(u.id===buyer&&u.id===listing.seller_id)return fail("Cannot message yourself.");
  if(await get(db,"SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)",buyer,listing.seller_id,listing.seller_id,buyer))return fail("Messaging unavailable.",403);
  const last=await get(db,"SELECT created_at FROM market_messages WHERE sender_id=? ORDER BY created_at DESC LIMIT 1",u.id);
  if(last&&now-last.created_at<2500)return fail("Please wait before sending another message.",429);
  const msgId=crypto.randomUUID();
  await run(db,"INSERT INTO market_messages(id,listing_id,buyer_id,seller_id,sender_id,content,created_at) VALUES(?,?,?,?,?,?,?)",msgId,listingId,buyer,listing.seller_id,u.id,content,now);
  return ok({id:msgId,created_at:now},201);
 }
 return fail("Marketplace route not found.",404);
}
