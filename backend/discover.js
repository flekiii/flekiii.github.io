/* Opt-in age-separated discovery. Friend and dating modes require independent consent. Self-declared age is NOT verification. */
const ORIGIN="https://flekiii.github.io";
const respond=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{"Content-Type":"application/json","Cache-Control":"private,no-store","Access-Control-Allow-Origin":ORIGIN}});
export async function discoverHandle(req,env,path,{auth}){
 if(!path.startsWith("/discover/"))return null;
 const db=env.DB,user=await auth(req,db);
 if(!user)return respond({error:"Sign in to find friends."},401);
 const mine=await db.prepare("SELECT age,interests,discoverable FROM wrld_profile_extras WHERE user_id=?").bind(user.id).first();
 const peerGroup=age=>Number(age)>=15?(Number(age)<18?"15–17":"18+"):null;
 if(path==="/discover/dating/optin"&&req.method==="PUT"){
  if(!peerGroup(mine?.age))return respond({error:"Dating discovery requires a self-declared age of at least 15."},403);
  const raw=await req.text();if(raw.length>80)return respond({error:"Invalid preferences"},400);
  let body;try{body=JSON.parse(raw)}catch{return respond({error:"Invalid JSON"},400)}
  if(typeof body.enabled!=="boolean")return respond({error:"Invalid dating setting"},400);
  await db.prepare("INSERT INTO wrld_discovery_dating(user_id,enabled,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at").bind(user.id,body.enabled?1:0,Date.now()).run();
  return respond({enabled:body.enabled,age_group:peerGroup(mine.age),verified_age:false});
 }
 if(path==="/discover/dating"&&req.method==="GET"){
  if(!peerGroup(mine?.age))return respond({error:"Dating discovery is available from 15. Set your age in Profile → About me.",members:[],enabled:false},400);
  const ageGroup=peerGroup(mine.age),teen=mine.age<18;
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
    interests:shown,status_emoji:v.status==="private"?"":row.status_emoji||"",
    status_text:v.status==="private"?"":row.status_text||"",
    media_public:v.media==="public"||!v.media,common:overlap,already_friends:row.already_friends>0};
  }).filter(x=>!query||(x.username+" "+x.display_name+" "+x.interests.join(" ")).toLowerCase().includes(query));
  members.sort((a,b)=>b.common-a.common);
  return respond({members:members.slice(0,40),enabled:true,age_group:ageGroup,mode:"dating",verified_age:false});
 }
 if(path==="/discover/friends"&&req.method==="GET"){
  if(!mine?.age||mine.age<15)return respond({error:"Meet People requires age 15+. Set your age in Profile → About me.",members:[]},400);
  if(mine.discoverable!==1)return respond({error:"Enable friend discovery in your profile to browse and appear in results.",members:[]},403);
  const teen=mine.age<18;
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
    interests:shown,media_public:privacy.media==="public"||!privacy.media,status_emoji:privacy.status==="private"?"":row.status_emoji||"",
    status_text:privacy.status==="private"?"":row.status_text||"",common:overlap,already_friends:row.already_friends>0};
  }).filter(x=>!query||(x.username+" "+x.display_name+" "+x.interests.join(" ")).toLowerCase().includes(query));
  candidates.sort((a,b)=>b.common-a.common);
  return respond({members:candidates.slice(0,40),age_group:teen?"15–17":"18+",mode:"friends",verified_age:false});
 }
 if(path==="/discover/request"&&req.method==="POST"){
  if(!mine?.age||mine.age<15)return respond({error:"Meet People requires age 15+"},403);
  const raw=await req.text();if(raw.length>250)return respond({error:"Invalid request"},400);
  let payload;try{payload=JSON.parse(raw)}catch{return respond({error:"Invalid JSON"},400)}
  const target=String(payload.target_id||"");
  if(!/^[a-f0-9-]{36}$/i.test(target)||target===user.id)return respond({error:"Invalid user"},400);
  const other=await db.prepare("SELECT age,discoverable FROM wrld_profile_extras WHERE user_id=?").bind(target).first();
  if(!other||other.age<15||(mine.age<18)!==(other.age<18))return respond({error:"This account is not available in your age group."},403);
  const sourceMode=String(payload.mode||"friends");
  if(!["friends","dating"].includes(sourceMode))return respond({error:"Invalid discovery mode"},400);
  if(sourceMode==="friends"&&(mine.discoverable!==1||other.discoverable!==1))return respond({error:"Enable friend discovery in your profile"},403);
  if(sourceMode==="dating"){
   const settings=await db.prepare("SELECT user_id FROM wrld_discovery_dating WHERE user_id IN (?,?) AND enabled=1").bind(user.id,target).all();
   const active=new Set((settings.results||[]).map(r=>r.user_id));
   if(!active.has(user.id)||!active.has(target))return respond({error:"Both accounts must opt in to dating discovery."},403);
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
