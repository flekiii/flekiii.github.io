/* Opt-in public profile showcase, real one-account/one-rating voting. */
const ORIGIN="https://flekiii.github.io";
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":ORIGIN,"Cache-Control":"no-store"}});
export async function showcaseHandle(req,env,path,{auth}){
 if(!path.startsWith("/showcase/"))return null;
 const db=env.DB,user=await auth(req,db),method=req.method;
 if(path==="/showcase/list"&&method==="GET"){
  const query=(new URL(req.url).searchParams.get("q")||"").trim().toLowerCase().slice(0,35);
  const results=(await db.prepare(`SELECT c.user_id,u.username,u.display_name,u.bio,c.created_at,
   s.visibility,e.interests,e.status_emoji,e.status_text,
   (SELECT COALESCE(SUM(amount),0) FROM wrld_world_xp x WHERE x.user_id=c.user_id) xp,
   (SELECT AVG(v.stars) FROM wrld_showcase_votes v WHERE v.target_id=c.user_id) score,
   (SELECT COUNT(*) FROM wrld_showcase_votes v WHERE v.target_id=c.user_id) votes
   FROM wrld_showcase_profiles c JOIN users u ON u.id=c.user_id
   LEFT JOIN wrld_profile_settings s ON s.user_id=u.id LEFT JOIN wrld_profile_extras e ON e.user_id=u.id
   WHERE c.visible=1 AND NOT EXISTS(SELECT 1 FROM wrld_profile_bans b WHERE b.user_id=c.user_id AND (b.expires_at=0 OR b.expires_at>?))
   ORDER BY votes DESC,score DESC,c.created_at DESC LIMIT 100`).bind(Date.now()).all()).results||[];
  const cards=[];
  for(const row of results){
   if(user?.id&&await db.prepare("SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocked=? AND blocker=?)").bind(user.id,row.user_id,user.id,row.user_id).first())continue;
   if(query&&!String(row.username+" "+row.display_name).toLowerCase().includes(query))continue;
   let privacy={};try{privacy=JSON.parse(row.visibility||"{}")}catch{}
   let interests=[];try{interests=JSON.parse(row.interests||"[]")}catch{}
   const xp=Number(row.xp||0);
   cards.push({username:row.username,display_name:row.display_name,bio:privacy.bio==="public"?row.bio:"",
    interests:privacy.interests==="public"?interests:[],
    status_text:privacy.status==="public"?row.status_text||"":"",
    status_emoji:privacy.status==="public"?row.status_emoji||"":"",
    level:Math.floor(Math.sqrt(xp/60))+1,xp,score:Math.round(Number(row.score||0)*10)/10,
    votes:Number(row.votes||0),own:user?.id===row.user_id});
   if(cards.length>=36)break;
  }
  const my=user?await db.prepare("SELECT visible FROM wrld_showcase_profiles WHERE user_id=?").bind(user.id).first():null;
  return reply({profiles:cards,my_visible:my?.visible===1});
 }
 if(!user)return reply({error:"Sign in to publish and rate profiles"},401);
 if(path==="/showcase/publish"&&method==="PUT"){
  const raw=await req.text();if(raw.length>100)return reply({error:"Invalid request"},400);
  let body;try{body=JSON.parse(raw)}catch{return reply({error:"Invalid JSON"},400)}
  if(typeof body.visible!=="boolean")return reply({error:"Invalid visibility"},400);
  const existing=await db.prepare("SELECT 1 FROM wrld_showcase_profiles WHERE user_id=?").bind(user.id).first();
  if(existing)await db.prepare("UPDATE wrld_showcase_profiles SET visible=?,created_at=? WHERE user_id=?").bind(body.visible?1:0,Date.now(),user.id).run();
  else await db.prepare("INSERT INTO wrld_showcase_profiles(user_id,visible,created_at) VALUES(?,?,?)").bind(user.id,body.visible?1:0,Date.now()).run();
  return reply({ok:true,visible:body.visible});
 }
 if(path==="/showcase/vote"&&method==="POST"){
  const raw=await req.text();if(raw.length>150)return reply({error:"Invalid request"},400);
  let body;try{body=JSON.parse(raw)}catch{return reply({error:"Invalid JSON"},400)}
  const stars=Number(body.stars),username=String(body.username||"").trim();
  if(!Number.isInteger(stars)||stars<1||stars>5||!/^[a-z][a-z0-9_]{2,23}$/.test(username))return reply({error:"Invalid 1–5 star rating"},400);
  const target=await db.prepare("SELECT c.user_id FROM wrld_showcase_profiles c JOIN users u ON u.id=c.user_id WHERE c.visible=1 AND u.username=? COLLATE NOCASE").bind(username).first();
  if(!target)return reply({error:"Profile is not available"},404);
  if(target.user_id===user.id)return reply({error:"You cannot rate your own profile"},403);
  if(await db.prepare("SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocked=? AND blocker=?)").bind(user.id,target.user_id,user.id,target.user_id).first())return reply({error:"Profile unavailable"},403);
  await db.prepare("INSERT INTO wrld_showcase_votes(voter_id,target_id,stars,created_at) VALUES(?,?,?,?) ON CONFLICT(voter_id,target_id) DO UPDATE SET stars=excluded.stars,created_at=excluded.created_at").bind(user.id,target.user_id,stars,Date.now()).run();
  return reply({ok:true});
 }
 return reply({error:"Not found"},404);
}