/* Opt-in age-separated discovery. Friend and dating modes require independent consent. Self-declared age is NOT verification. */
const ORIGIN="https://flekiii.github.io";
const respond=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{"Content-Type":"application/json","Cache-Control":"private,no-store","Access-Control-Allow-Origin":ORIGIN}});

const allowedModes=new Set(["friends","dating"]);
const ageRange=(age,mode)=>{
 const n=Number(age);
 if(!Number.isInteger(n)||n<(mode==="friends"?14:15)||n>120)return null;
 // No cross-over between minors and adults. For a 15yo: friends 14-17; dating 15-17.
 const lower=mode==="friends"?14:15,groupMax=n<18?17:120,groupMin=n<18?lower:18;
 return {min:Math.max(groupMin,n-2),max:Math.min(groupMax,n+2)};
};
const groupLabel=r=>r?r.min+"–"+r.max:"";
const validGender=new Set(["boy","girl","other","undisclosed"]);
const validSeeking=new Set(["boys","girls","everyone"]);
const cleanText=(value,n)=>String(value??"").trim().slice(0,n+1);
const readCard=(db,id,mode)=>db.prepare("SELECT active,bio,gender,seeking FROM wrld_discovery_cards WHERE user_id=? AND mode=?").bind(id,mode).first();
const tryPhoto=async(db,id,mode)=>!!await db.prepare("SELECT 1 FROM wrld_discovery_photos WHERE user_id=? AND mode=?").bind(id,mode).first();
const consentActive=(mode,extra,dating,card)=>mode==="friends"?extra?.discoverable===1&&card?.active!==0:dating?.enabled===1&&card?.active!==0;
const imageMime=b=>{
 if(b.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n))return "image/png";
 if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return "image/jpeg";
 if(b.length>=6&&/^GIF8[79]a$/.test(String.fromCharCode(...b.slice(0,6))))return "image/gif";
 if(b.length>=12&&b[0]===82&&b[1]===73&&b[2]===70&&b[3]===70&&String.fromCharCode(...b.slice(8,12))==="WEBP")return "image/webp";
 return "";
};

export async function discoverHandle(req,env,path,{auth}){
 if(!path.startsWith("/discover/"))return null;
 const db=env.DB,user=await auth(req,db);
 if(!user)return respond({error:"Sign in to find friends."},401);
 const mine=await db.prepare("SELECT age,interests,discoverable FROM wrld_profile_extras WHERE user_id=?").bind(user.id).first();
 const peerGroup=age=>Number(age)>=15?(Number(age)<18?"15–17":"18+"):null;

 const url=new URL(req.url);
 const meMode=url.searchParams.get("mode")==="dating"?"dating":"friends";
 if(path==="/discover/me"&&req.method==="GET"){
  const dating=await db.prepare("SELECT enabled FROM wrld_discovery_dating WHERE user_id=?").bind(user.id).first();
  const card=await readCard(db,user.id,meMode);
  const range=ageRange(mine?.age,meMode);
  const hasPhoto=await tryPhoto(db,user.id,meMode);
  return respond({mode:meMode,age_range:groupLabel(range),age_ready:!!range,
   age_verified:false,enabled:consentActive(meMode,mine,dating,card),
   card:{bio:card?.bio||"",gender:card?.gender||"undisclosed",seeking:card?.seeking||"everyone",has_photo:hasPhoto},
   interests:(()=>{try{const x=JSON.parse(mine?.interests||"[]");return Array.isArray(x)?x:[]}catch{return []}})()});
 }
 if(path==="/discover/card"&&req.method==="PUT"){
  const raw=await req.text();if(raw.length>900)return respond({error:"Card too large"},413);
  let body;try{body=JSON.parse(raw)}catch{return respond({error:"Invalid JSON"},400)}
  const mode=body?.mode,range=ageRange(mine?.age,mode);
  if(!allowedModes.has(mode)||!range)return respond({error:"Choose an eligible age in your profile."},403);
  if(typeof body.active!=="boolean")return respond({error:"Invalid visibility setting"},400);
  const bio=cleanText(body.bio,280),gender=String(body.gender||"undisclosed"),seeking=String(body.seeking||"everyone");
  if(bio.length>280||!validGender.has(gender)||!validSeeking.has(seeking))return respond({error:"Invalid questionnaire fields"},400);
  const current=await readCard(db,user.id,mode);
  if(body.active&&!bio&&!current?.bio)return respond({error:"Add a short description to publish your questionnaire."},400);
  if(mode==="dating"&&body.active&&gender==="undisclosed")return respond({error:"Choose your gender to activate dating filters."},400);
  const now=Date.now();
  await db.batch([
   db.prepare("INSERT INTO wrld_discovery_cards(user_id,mode,active,bio,gender,seeking,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,mode) DO UPDATE SET active=excluded.active,bio=excluded.bio,gender=excluded.gender,seeking=excluded.seeking,updated_at=excluded.updated_at").bind(user.id,mode,body.active?1:0,bio,gender,seeking,now),
   ...(mode==="friends"?[
    db.prepare("UPDATE wrld_profile_extras SET discoverable=? WHERE user_id=?").bind(body.active?1:0,user.id)
   ]:[
    db.prepare("INSERT INTO wrld_discovery_dating(user_id,enabled,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at").bind(user.id,body.active?1:0,now)
   ])
  ]);
  return respond({ok:true,mode,enabled:body.active,age_range:groupLabel(range)});
 }
 if(path==="/discover/photo"&&req.method==="POST"){
  const mode=meMode,range=ageRange(mine?.age,mode);
  if(!range)return respond({error:"Set an eligible age in your profile."},403);
  const declared=Number(req.headers.get("Content-Length")||0);
  if(declared>900*1024)return respond({error:"Photo must be under 900 KB."},413);
  const buffer=new Uint8Array(await req.arrayBuffer());
  if(buffer.length<32||buffer.length>900*1024)return respond({error:"Photo must be 32 bytes–900 KB."},413);
  const mime=imageMime(buffer);
  if(!mime)return respond({error:"Upload a PNG, JPEG, GIF or WebP image."},415);
  await db.prepare("INSERT INTO wrld_discovery_photos(user_id,mode,mime,data,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,mode) DO UPDATE SET mime=excluded.mime,data=excluded.data,updated_at=excluded.updated_at").bind(user.id,mode,mime,buffer,Date.now()).run();
  return respond({ok:true,has_photo:true});
 }
 if(path==="/discover/photo"&&req.method==="DELETE"){
  await db.prepare("DELETE FROM wrld_discovery_photos WHERE user_id=? AND mode=?").bind(user.id,meMode).run();
  return respond({ok:true,has_photo:false});
 }
 if(path.startsWith("/discover/photo/")&&req.method==="GET"){
  const fields=path.split("/"),mode=fields[3],target=fields[4];
  if(fields.length!==5||!allowedModes.has(mode)||!/^[a-f0-9-]{36}$/i.test(target))return respond({error:"Not found"},404);
  const mineRange=ageRange(mine?.age,mode);
  if(!mineRange)return respond({error:"Unavailable"},403);
  const targetExtra=await db.prepare("SELECT age,discoverable FROM wrld_profile_extras WHERE user_id=?").bind(target).first();
  const targetRange=ageRange(targetExtra?.age,mode);
  if(!targetRange||targetExtra.age<mineRange.min||targetExtra.age>mineRange.max||mine.age<targetRange.min||mine.age>targetRange.max)return respond({error:"Unavailable"},403);
  const targetCard=await readCard(db,target,mode);
  const targetDating=mode==="dating"?await db.prepare("SELECT enabled FROM wrld_discovery_dating WHERE user_id=?").bind(target).first():null;
  const myCard=await readCard(db,user.id,mode);
  const myDating=mode==="dating"?await db.prepare("SELECT enabled FROM wrld_discovery_dating WHERE user_id=?").bind(user.id).first():null;
  if(target!==user.id&&(!consentActive(mode,targetExtra,targetDating,targetCard)||!consentActive(mode,mine,myDating,myCard)))return respond({error:"Unavailable"},403);
  if(target!==user.id&&await db.prepare("SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocked=? AND blocker=?)").bind(user.id,target,user.id,target).first())return respond({error:"Unavailable"},403);
  const photo=await db.prepare("SELECT mime,data FROM wrld_discovery_photos WHERE user_id=? AND mode=?").bind(target,mode).first();
  if(!photo)return respond({error:"Photo not found"},404);
  return new Response(photo.data,{status:200,headers:{"Content-Type":photo.mime,"Cache-Control":"private,no-store","Access-Control-Allow-Origin":ORIGIN,"X-Content-Type-Options":"nosniff"}});
 }
 if(path==="/discover/dating/optin"&&req.method==="PUT"){
  if(!peerGroup(mine?.age))return respond({error:"Dating discovery requires a self-declared age of at least 15."},403);
  const raw=await req.text();if(raw.length>80)return respond({error:"Invalid preferences"},400);
  let body;try{body=JSON.parse(raw)}catch{return respond({error:"Invalid JSON"},400)}
  if(typeof body.enabled!=="boolean")return respond({error:"Invalid dating setting"},400);
  await db.prepare("INSERT INTO wrld_discovery_dating(user_id,enabled,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at").bind(user.id,body.enabled?1:0,Date.now()).run();
  return respond({enabled:body.enabled,age_group:peerGroup(mine.age),verified_age:false});
 }
 if(path==="/discover/dating"&&req.method==="GET"){
  if(!ageRange(mine?.age,"dating"))return respond({error:"Dating discovery is available from 15. Set your age in Profile → About me.",members:[],enabled:false},400);
  const range=ageRange(mine.age,"dating"),ageGroup=groupLabel(range),teen=mine.age<18;
  const self=await db.prepare("SELECT enabled FROM wrld_discovery_dating WHERE user_id=?").bind(user.id).first();
  if(self?.enabled!==1)return respond({members:[],enabled:false,age_group:ageGroup,mode:"dating",verified_age:false});
  const query=(new URL(req.url).searchParams.get("q")||"").trim().toLowerCase().slice(0,32);
  const rows=(await db.prepare(`SELECT u.id,u.username,u.display_name,e.age,e.interests,e.status_emoji,e.status_text,s.visibility,
   (SELECT COUNT(*) FROM friendships f WHERE f.status='accepted' AND ((f.user_low=? AND f.user_high=u.id) OR (f.user_high=? AND f.user_low=u.id))) as already_friends
   FROM wrld_discovery_dating d JOIN wrld_profile_extras e ON e.user_id=d.user_id
   JOIN users u ON u.id=e.user_id LEFT JOIN wrld_profile_settings s ON s.user_id=u.id
   WHERE d.enabled=1 AND e.age>=15 AND e.user_id<>? AND ${teen?"e.age<18":"e.age>=18"}
   AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.blocker=? AND b.blocked=u.id) OR (b.blocked=? AND b.blocker=u.id))
   AND NOT EXISTS(SELECT 1 FROM wrld_profile_bans b WHERE b.user_id=u.id AND (b.expires_at=0 OR b.expires_at>?))
   ORDER BY u.created_at DESC LIMIT 120`).bind(user.id,user.id,user.id,user.id,user.id,Date.now()).all()).results||[];
  let mineInterests=[];try{const v=JSON.parse(mine.interests||"[]");mineInterests=Array.isArray(v)?v:[]}catch{}
  const members=rows.map(row=>{
   let v={};try{v=JSON.parse(row.visibility||"{}")}catch{}
   let interests=[];try{const list=JSON.parse(row.interests||"[]");interests=Array.isArray(list)?list:[]}catch{}
   const shown=v.interests==="private"||v.interests==="friends"&&!row.already_friends?[]:interests;
   const overlap=shown.filter(tag=>mineInterests.some(my=>typeof my==="string"&&typeof tag==="string"&&my.toLowerCase()===tag.toLowerCase())).length;
   return {id:row.id,username:row.username,display_name:row.display_name,age_group:ageGroup,
    interests:shown,status_emoji:v.status==="private"||v.status==="friends"&&!row.already_friends?"":row.status_emoji||"",
    status_text:v.status==="private"||v.status==="friends"&&!row.already_friends?"":row.status_text||"",
    media_public:v.media==="public"||!v.media,common:overlap,already_friends:row.already_friends>0};
  }).filter(x=>!query||(x.username+" "+x.display_name+" "+x.interests.join(" ")).toLowerCase().includes(query));
  members.sort((a,b)=>b.common-a.common);
  return respond({members:members.slice(0,40),enabled:true,age_group:ageGroup,mode:"dating",verified_age:false});
 }
 if(path==="/discover/friends"&&req.method==="GET"){
  if(!ageRange(mine?.age,"friends"))return respond({error:"Meet People friends requires age 14+. Set your age in Profile → About me.",members:[]},400);
  if(mine.discoverable!==1)return respond({error:"Publish your friend questionnaire here to browse and appear in results.",members:[]},403);
  const teen=mine.age<18,range=ageRange(mine.age,"friends");
  const query=(new URL(req.url).searchParams.get("q")||"").trim().toLowerCase().slice(0,32);
  const rows=(await db.prepare(`SELECT u.id,u.username,u.display_name,e.age,e.interests,e.status_emoji,e.status_text,s.visibility,
  (SELECT COUNT(*) FROM friendships f WHERE f.status='accepted' AND ((f.user_low=? AND f.user_high=u.id) OR (f.user_high=? AND f.user_low=u.id))) as already_friends
  FROM wrld_profile_extras e JOIN users u ON u.id=e.user_id LEFT JOIN wrld_profile_settings s ON s.user_id=u.id
  WHERE e.discoverable=1 AND e.age>=15 AND e.user_id<>? AND ${teen?"e.age<18":"e.age>=18"}
  AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.blocker=? AND b.blocked=u.id) OR (b.blocked=? AND b.blocker=u.id))
  AND NOT EXISTS(SELECT 1 FROM wrld_profile_bans b WHERE b.user_id=u.id AND (b.expires_at=0 OR b.expires_at>?))
  ORDER BY u.created_at DESC LIMIT 120`).bind(user.id,user.id,user.id,user.id,user.id,Date.now()).all()).results||[];
  let mineInterests=[];try{const v=JSON.parse(mine.interests||"[]");mineInterests=Array.isArray(v)?v:[]}catch{}
  const candidates=rows.map(row=>{
   let privacy={};try{privacy=JSON.parse(row.visibility||"{}")}catch{}
   let interests=[];try{interests=JSON.parse(row.interests||"[]")}catch{}
   const shown=privacy.interests==="private"||privacy.interests==="friends"&&!row.already_friends?[]:interests;
   const overlap=shown.filter(tag=>mineInterests.some(my=>typeof my==="string"&&typeof tag==="string"&&my.toLowerCase()===tag.toLowerCase())).length;
   return {id:row.id,username:row.username,display_name:row.display_name,age_group:teen?"15–17":"18+",
    interests:shown,media_public:privacy.media==="public"||!privacy.media,status_emoji:privacy.status==="private"||privacy.status==="friends"&&!row.already_friends?"":row.status_emoji||"",
    status_text:privacy.status==="private"||privacy.status==="friends"&&!row.already_friends?"":row.status_text||"",common:overlap,already_friends:row.already_friends>0};
  }).filter(x=>!query||(x.username+" "+x.display_name+" "+x.interests.join(" ")).toLowerCase().includes(query));
  candidates.sort((a,b)=>b.common-a.common);
  return respond({members:candidates.slice(0,40),age_group:teen?"15–17":"18+",mode:"friends",verified_age:false});
 }
 if(path==="/discover/request"&&req.method==="POST"){
  if(!ageRange(mine?.age,"friends"))return respond({error:"Meet People requires age 14+"},403);
  const raw=await req.text();if(raw.length>250)return respond({error:"Invalid request"},400);
  let payload;try{payload=JSON.parse(raw)}catch{return respond({error:"Invalid JSON"},400)}
  const target=String(payload.target_id||"");
  if(!/^[a-f0-9-]{36}$/i.test(target)||target===user.id)return respond({error:"Invalid user"},400);
  const other=await db.prepare("SELECT age,discoverable FROM wrld_profile_extras WHERE user_id=?").bind(target).first();
  const sourceMode=String(payload.mode||"friends");
  const myRange=ageRange(mine.age,sourceMode),theirRange=ageRange(other?.age,sourceMode);
  if(!other||!allowedModes.has(sourceMode)||!myRange||!theirRange||
     other.age<myRange.min||other.age>myRange.max||mine.age<theirRange.min||mine.age>theirRange.max)
   return respond({error:"This account is outside your age range."},403);
  if(!allowedModes.has(sourceMode))return respond({error:"Invalid discovery mode"},400);
  if(sourceMode==="friends"&&(mine.discoverable!==1||other.discoverable!==1))return respond({error:"Enable friend discovery in your profile"},403);
  if(sourceMode==="dating"){
   const settings=await db.prepare("SELECT user_id FROM wrld_discovery_dating WHERE user_id IN (?,?) AND enabled=1").bind(user.id,target).all();
   const active=new Set((settings.results||[]).map(r=>r.user_id));
   if(!active.has(user.id)||!active.has(target))return respond({error:"Both accounts must opt in to dating discovery."},403);
   const mineCard=await readCard(db,user.id,"dating"),otherCard=await readCard(db,target,"dating");
   if(mineCard?.active===0||otherCard?.active===0)return respond({error:"Dating questionnaire is hidden."},403);
   if(mineCard&&otherCard){
    const wanted=mineCard.seeking,gender=otherCard.gender;
    if(wanted!=="everyone"&&((wanted==="girls"&&gender!=="girl")||(wanted==="boys"&&gender!=="boy")))
     return respond({error:"Account does not match your dating preference."},403);
   }
  }
  if(await db.prepare("SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocked=? AND blocker=?)").bind(user.id,target,user.id,target).first())return respond({error:"User unavailable"},403);
  const pair=[user.id,target].sort();
  if(await db.prepare("SELECT 1 FROM friendships WHERE user_low=? AND user_high=?").bind(...pair).first())return respond({error:"Friendship or request already exists"},409);
  const now=Date.now();
  await db.prepare("INSERT INTO friendships(id,user_low,user_high,requester,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),pair[0],pair[1],user.id,"pending",now,now).run();
  return respond({ok:true});
 }
 if(path==="/discover/report"&&req.method==="POST"){
  const text=await req.text();if(text.length>600)return respond({error:"Report too long"},413);
  let body;try{body=JSON.parse(text)}catch{return respond({error:"Invalid report"},400)}
  const username=String(body.username||"").trim(),reason=String(body.reason||"").trim();
  if(!/^[a-z][a-z0-9_]{2,23}$/.test(username)||reason.length<10||reason.length>300)return respond({error:"Provide a username and a reason of 10–300 characters"},400);
  const target=await db.prepare("SELECT id FROM users WHERE username=? COLLATE NOCASE").bind(username).first();
  if(!target||target.id===user.id)return respond({error:"Invalid member"},400);
  await db.prepare("INSERT OR IGNORE INTO wrld_discovery_reports(reporter,target,reason,created_at) VALUES(?,?,?,?)").bind(user.id,target.id,reason,Date.now()).run();
  return respond({ok:true});
 }
 return respond({error:"Not found"},404);
}
