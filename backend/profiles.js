/* Server-enforced Fleki's Wrld profiles, privacy, media and moderation.
   Roles never depend on browser data. OWNER_USER_ID is an immutable account UUID. */
const ORIGIN="https://flekiii.github.io";
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":ORIGIN,"X-Content-Type-Options":"nosniff"}});
const fail=(reason,status=400)=>reply({error:reason},status);
const stmt=(db,q,...p)=>db.prepare(q).bind(...p);
const one=(db,q,...p)=>stmt(db,q,...p).first();
const many=async(db,q,...p)=>(await stmt(db,q,...p).all()).results||[];
const exec=(db,q,...p)=>stmt(db,q,...p).run();
const visibilityFields=["bio","media","location","phone","links","games","status","roles","interests"];
const visibilityDefault={bio:"public",media:"public",location:"friends",phone:"private",links:"public",games:"public",status:"public",roles:"public",interests:"public"};
const roleNames=["aurvex_ceo","developer","god","moderator","creator","vip","tester","member"];
const statuses=["online","away","dnd","offline"];
// Cloudflare D1 max row/BLOB is 2,000,000 bytes; store larger media in <=512KiB chunks.
const MAX_MEDIA_BYTES=3*1024*1024,MEDIA_CHUNK_BYTES=512*1024;
function mediaParts(raw){const parts=[];for(let offset=0;offset<raw.length;offset+=MEDIA_CHUNK_BYTES)parts.push(raw.slice(offset,offset+MEDIA_CHUNK_BYTES));return parts}
function joinMedia(parts){let length=0;for(const part of parts)length+=part.data?.length||0;if(length<32||length>MAX_MEDIA_BYTES)return null;const bytes=new Uint8Array(length);let offset=0;for(const part of parts){const data=new Uint8Array(part.data);bytes.set(data,offset);offset+=data.length}return bytes}
const read=async req=>{const raw=await req.text();if(raw.length>12000)throw Error("Payload too large");try{return JSON.parse(raw)||{}}catch{throw Error("Invalid JSON")}};
const clean=(v,max)=>typeof v==="string"?v.trim().slice(0,max):"";
const js=v=>{try{return JSON.parse(v)}catch{return null}};
const owner=(env,user)=>!!(user&&/^[a-f0-9-]{36}$/i.test(String(env.OWNER_USER_ID||""))&&user.id===env.OWNER_USER_ID);
const safeUrl=v=>{const s=clean(v,220);if(!s)return "";try{const u=new URL(s);return u.protocol==="https:"&&u.username===""&&u.password===""?u.toString().slice(0,220):""}catch{return ""}};
function privacy(raw){const p=js(raw)||raw||{},v={...visibilityDefault};for(const field of visibilityFields)if(["public","friends","private"].includes(p[field]))v[field]=p[field];return v}
const visible=(v,key,relationship)=>relationship==="self"||v[key]==="public"||v[key]==="friends"&&relationship==="friend";
async function roles(db,id,t,env,user){const results=await many(db,"SELECT role,expires_at FROM wrld_profile_roles WHERE user_id=? AND (expires_at=0 OR expires_at>?) ORDER BY granted_at",id,t);const mapped=results.map(r=>({role:r.role,expires_at:r.expires_at}));if(owner(env,user))mapped.unshift({role:"owner",expires_at:0});return mapped}
async function relation(db,viewer,id,as){
 if(as==="public")return "public";
 if(as==="friend"&&viewer?.id===id)return "friend";
 if(viewer?.id===id)return "self";
 if(!viewer)return "public";
 const blocked=await one(db,"SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)",viewer.id,id,id,viewer.id);
 if(blocked)return "public";
 const [low,high]=[viewer.id,id].sort();
 return await one(db,"SELECT 1 FROM friendships WHERE user_low=? AND user_high=? AND status='accepted'",low,high)?"friend":"public";
}
async function buildProfile(db,env,viewer,person,as){
 const t=Date.now(),relationType=await relation(db,viewer,person.id,as);
 const settings=await one(db,"SELECT * FROM wrld_profile_settings WHERE user_id=?",person.id)||{};
 const privacyMap=privacy(settings.visibility);
 const extra=await one(db,"SELECT age,interests,status_emoji,status_text,discoverable FROM wrld_profile_extras WHERE user_id=?",person.id)||{};
 const xp=Number((await one(db,"SELECT COALESCE(SUM(amount),0) xp FROM wrld_world_xp WHERE user_id=?",person.id))?.xp||0);
 const can=field=>visible(privacyMap,field,relationType);
 const rawStatus=statuses.includes(settings.status)?settings.status:"offline";
 const online=rawStatus!=="offline"&&Number(settings.last_seen||0)>t-130000;
 const roleList=await roles(db,person.id,t,env,person);
 const profile={id:person.id,username:person.username,display_name:person.display_name,
  relationship:relationType,visibility:relationType==="self"?privacyMap:undefined,
  updated_at:settings.updated_at||person.updated_at,
  bio:can("bio")?person.bio:null,
  status:can("status")?(online?rawStatus:"offline"):null,
   status_emoji:can("status")?extra.status_emoji||"":null,status_text:can("status")?extra.status_text||"":null,
   age:relationType==="self"?Number(extra.age||0):null,
   interests:can("interests")?(js(extra.interests)||[]):null,
   discoverable:relationType==="self"?extra.discoverable===1:undefined,
   xp,level:Math.floor(Math.sqrt(xp/60))+1,
  country:can("location")?settings.country||"":null,region:can("location")?settings.region||"":null,district:can("location")?settings.district||"":null,
  phone:can("phone")?settings.phone||"":null,
  website:can("links")?settings.website||"":null,socials:can("links")?(js(settings.socials)||{}):null,
  favorite_games:can("games")?(js(settings.favorite_games)||[]):null,
  current_games:can("games")?(js(settings.current_games)||[]):null,
  roles:can("roles")?roleList:null,avatar:can("media"),banner:can("media")
 };
 return profile;
}
function mediaMime(data){
 const b=data;
 if(b.length>8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10)return "image/png";
 if(b.length>4&&b[0]===255&&b[1]===216&&b[2]===255)return "image/jpeg";
 if(b.length>9&&String.fromCharCode(...b.slice(0,6)).match(/^GIF8[79]a$/))return "image/gif";
 if(b.length>12&&String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP")return "image/webp";
 return null;
}
async function hasAdmin(db,env,u,t,authNeeded){
 if(!u||authNeeded&&!authNeeded(u))return false;
 if(owner(env,u))return true;
 return !!await one(db,"SELECT 1 FROM wrld_profile_roles WHERE user_id=? AND role='moderator' AND (expires_at=0 OR expires_at>?)",u.id,t);
}
export async function profileHandle(req,env,path,{auth,authorized}){
 if(!path.startsWith("/profiles/")&&!path.startsWith("/admin/"))return null;
 const db=env.DB,t=Date.now(),method=req.method,parts=path.split("/").filter(Boolean);
 const viewer=await auth(req,db);
 if(method==="GET"&&parts[0]==="profiles"&&parts[1]==="public"&&parts.length===3){
  const key=decodeURIComponent(parts[2]);if(!/^[a-z][a-z0-9_]{2,23}$/i.test(key))return fail("Invalid username");
  const p=await one(db,"SELECT id,username,display_name,bio,updated_at FROM users WHERE username=? COLLATE NOCASE",key);
  if(!p)return fail("Profile unavailable",404);
  const ban=await one(db,"SELECT 1 FROM wrld_profile_bans WHERE user_id=? AND (expires_at=0 OR expires_at>?)",p.id,t);if(ban)return fail("Profile unavailable",404);
  return reply({profile:await buildProfile(db,env,viewer,p)});
 }
 if(method==="GET"&&parts[0]==="profiles"&&parts[1]==="media"&&parts.length===4){
  const id=parts[2],kind=parts[3];
  if(!/^[a-f0-9-]{36}$/i.test(id)||!["avatar","banner"].includes(kind))return fail("Not found",404);
  const p=await one(db,"SELECT user_id,visibility FROM wrld_profile_settings WHERE user_id=?",id);
  const r=await relation(db,viewer,id);
  if(!visible(privacy(p?.visibility),"media",r))return fail("Forbidden",403);
  const media=await one(db,"SELECT data,mime FROM wrld_profile_media WHERE user_id=? AND kind=?",id,kind);
  if(!media)return fail("Not found",404);
  // Existing users' original one-piece media still reads without migration.
  let bytes=new Uint8Array(media.data);
  if(!bytes.length){
   const parts=await many(db,"SELECT data FROM wrld_profile_media_chunks WHERE user_id=? AND kind=? ORDER BY part ASC",id,kind);
   bytes=joinMedia(parts);
   if(!bytes)return fail("Image unavailable",404);
  }
  return new Response(bytes,{status:200,headers:{"Content-Type":media.mime,"Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff","Access-Control-Allow-Origin":ORIGIN}});
 }
 if(!viewer)return fail("Sign in required",401);
 const current=await one(db,"SELECT id,username,display_name,bio,updated_at FROM users WHERE id=?",viewer.id);
 if(!current)return fail("Account unavailable",401);
 if(method==="GET"&&path==="/profiles/me")return reply({profile:await buildProfile(db,env,viewer,current),owner:owner(env,viewer),moderator:await hasAdmin(db,env,viewer,t,authorized)});
 if(method==="GET"&&path==="/profiles/preview"){
  const mode=new URL(req.url).searchParams.get("as")==="friend"?"friend":"public";
  return reply({profile:await buildProfile(db,env,viewer,current,mode)});
 }
 if(method==="PUT"&&path==="/profiles/me"){
  const p=await read(req);
  const display=clean(p.display_name,61),bio=clean(p.bio,351);
  if(!display||display.length>60||bio.length>350)return fail("Invalid display name or bio");
  const status=p.status||"online";if(!statuses.includes(status))return fail("Invalid status");
  const country=clean(p.country,61),region=clean(p.region,81),district=clean(p.district,81),phone=clean(p.phone,30);
  if(country.length>60||region.length>80||district.length>80||phone&&!/^\+?[0-9() .-]{7,29}$/.test(phone))return fail("Invalid location or phone");
  const website=safeUrl(p.website);if(p.website&&!website)return fail("Website must be HTTPS");
  const socials={};for(const key of ["telegram","discord","youtube","twitch","github","instagram","tiktok","steam"]){
   const raw=p.socials?.[key];if(raw){const url=safeUrl(raw);if(!url)return fail("Social links must use HTTPS");socials[key]=url}
  }
  const games={};for(const k of ["favorite_games","current_games"]){const g=p[k];if(!Array.isArray(g)||g.length>10||g.some(v=>typeof v!=="string"||v.trim().length>56))return fail("Invalid game list");games[k]=[...new Set(g.map(x=>x.trim()).filter(Boolean))]}
  const age=p.age===""||p.age==null?0:Number(p.age);
   if(!Number.isInteger(age)||(age!==0&&(age<13||age>120)))return fail("Age must be between 13 and 120.");
   const interests=Array.isArray(p.interests)?p.interests:[];
   if(interests.length>12||interests.some(x=>typeof x!=="string"||x.trim().length<1||x.trim().length>32))return fail("Choose up to 12 interests, each up to 32 characters.");
   const uniqueInterests=[...new Set(interests.map(x=>x.trim()))];
   const emoji=clean(p.status_emoji,16),statusText=clean(p.status_text,81);
   if([...emoji].length>6||statusText.length>80)return fail("Invalid custom status.");
   const discoverable=p.discoverable===true;
   if(discoverable&&!age)return fail("Set your age to enable friend discovery.");
   const v=privacy(p.visibility);
  if(!p.visibility||typeof p.visibility!=="object")return fail("Invalid privacy settings");
  for(const field of visibilityFields)if(!["public","friends","private"].includes(p.visibility[field]))return fail("Invalid privacy preference");
  await db.batch([
   stmt(db,"UPDATE users SET display_name=?,bio=?,updated_at=? WHERE id=?",display,bio,t,viewer.id),
   stmt(db,`INSERT INTO wrld_profile_settings(user_id,status,country,region,district,phone,website,socials,favorite_games,current_games,visibility,last_seen,updated_at)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,country=excluded.country,region=excluded.region,district=excluded.district,phone=excluded.phone,website=excluded.website,socials=excluded.socials,favorite_games=excluded.favorite_games,current_games=excluded.current_games,visibility=excluded.visibility,updated_at=excluded.updated_at`,
   viewer.id,status,country,region,district,phone,website,JSON.stringify(socials),JSON.stringify(games.favorite_games),JSON.stringify(games.current_games),JSON.stringify(v),t,t),
   stmt(db,`INSERT INTO wrld_profile_extras(user_id,age,interests,status_emoji,status_text,discoverable)
   VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET age=excluded.age,interests=excluded.interests,status_emoji=excluded.status_emoji,status_text=excluded.status_text,discoverable=excluded.discoverable`,
   viewer.id,age,JSON.stringify(uniqueInterests),emoji,statusText,Number(discoverable))
  ]);
  return reply({ok:true});
 }
 if(method==="POST"&&parts[0]==="profiles"&&parts[1]==="media"&&parts.length===3){
  const kind=parts[2];if(!["avatar","banner"].includes(kind))return fail("Bad media type");
  const declared=Number(req.headers.get("Content-Length")||0);
  if(declared>MAX_MEDIA_BYTES)return fail("Image too large (3 MB max)",413);
  const raw=new Uint8Array(await req.arrayBuffer());
  if(raw.length<32||raw.length>MAX_MEDIA_BYTES)return fail("Image too large or empty (3 MB max)",413);
  const mime=mediaMime(raw);if(!mime)return fail("Only PNG, JPEG, GIF and WebP images",415);
  // Atomic replacement ensures old image survives failed or interrupted uploads.
  await db.batch([
   stmt(db,"INSERT INTO wrld_profile_media(user_id,kind,mime,data,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,kind) DO UPDATE SET mime=excluded.mime,data=excluded.data,updated_at=excluded.updated_at",viewer.id,kind,mime,new Uint8Array(0),t),
   stmt(db,"DELETE FROM wrld_profile_media_chunks WHERE user_id=? AND kind=?",viewer.id,kind),
   ...mediaParts(raw).map((chunk,part)=>stmt(db,"INSERT INTO wrld_profile_media_chunks(user_id,kind,part,data) VALUES(?,?,?,?)",viewer.id,kind,part,chunk))
  ]);
  return reply({ok:true,mime,size:raw.length});
 }
 if(method==="DELETE"&&parts[0]==="profiles"&&parts[1]==="media"&&parts.length===3){
  if(!["avatar","banner"].includes(parts[2]))return fail("Bad media type");
  await db.batch([
   stmt(db,"DELETE FROM wrld_profile_media_chunks WHERE user_id=? AND kind=?",viewer.id,parts[2]),
   stmt(db,"DELETE FROM wrld_profile_media WHERE user_id=? AND kind=?",viewer.id,parts[2])
  ]);return reply({ok:true});
 }
 if(!path.startsWith("/admin/"))return fail("Not found",404);
 if(!authorized(viewer))return fail("Verify your authenticator before moderation",403);
 const isOwner=owner(env,viewer);
 const moderator=await hasAdmin(db,env,viewer,t,authorized);
 if(!moderator)return fail("Moderator access required",403);
 if(method==="GET"&&path==="/admin/members"){
  const q=clean(new URL(req.url).searchParams.get("q"),40);
  if(q.length<2)return reply({members:[],roles:roleNames,owner:isOwner});
  const people=await many(db,"SELECT id,username,display_name FROM users WHERE username LIKE ? OR display_name LIKE ? LIMIT 12","%"+q+"%","%"+q+"%");
  const members=await Promise.all(people.map(async p=>({...p,roles:await roles(db,p.id,t,env,p),banned:!!await one(db,"SELECT 1 FROM wrld_profile_bans WHERE user_id=? AND (expires_at=0 OR expires_at>?)",p.id,t)})));
  return reply({members,roles:roleNames,owner:isOwner});
 }
 if(method==="POST"&&path==="/admin/roles"){
  if(!isOwner)return fail("Only the site owner can assign roles",403);
  const p=await read(req),role=clean(p.role,40),target=clean(p.user_id,80),expires=Number(p.expires_at||0);
  if(!roleNames.includes(role)||!/^[0-9a-f-]{36}$/i.test(target)||!await one(db,"SELECT id FROM users WHERE id=?",target))return fail("Unknown role or member");
  if(expires!==0&&(!Number.isSafeInteger(expires)||expires<=t+60000||expires>t+5*365*86400000))return fail("Invalid expiry");
  await exec(db,"INSERT INTO wrld_profile_roles(user_id,role,granted_by,granted_at,expires_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,role) DO UPDATE SET granted_by=excluded.granted_by,granted_at=excluded.granted_at,expires_at=excluded.expires_at",target,role,viewer.id,t,expires);
  return reply({ok:true});
 }
 if(method==="DELETE"&&path==="/admin/roles"){
  if(!isOwner)return fail("Only the site owner can revoke roles",403);
  const p=await read(req);if(!roleNames.includes(p.role))return fail("Unknown role");
  await exec(db,"DELETE FROM wrld_profile_roles WHERE user_id=? AND role=?",p.user_id,p.role);return reply({ok:true});
 }
 if(method==="POST"&&path==="/admin/bans"){
  const p=await read(req),target=clean(p.user_id,80),reason=clean(p.reason,201),expires=Number(p.expires_at||0);
  if(!/^[0-9a-f-]{36}$/i.test(target)||target===viewer.id||!await one(db,"SELECT id FROM users WHERE id=?",target)||target===env.OWNER_USER_ID)return fail("Invalid ban target",403);
  if(reason.length<3||reason.length>200||expires!==0&&(!Number.isSafeInteger(expires)||expires<=t+60000||expires>t+5*365*86400000))return fail("Invalid reason or expiry");
  if(!isOwner&&await one(db,"SELECT 1 FROM wrld_profile_roles WHERE user_id=? AND role='moderator' AND (expires_at=0 OR expires_at>?)",target,t))return fail("Moderators cannot ban moderators",403);
  await db.batch([
   stmt(db,"INSERT INTO wrld_profile_bans(user_id,banned_by,reason,created_at,expires_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET banned_by=excluded.banned_by,reason=excluded.reason,created_at=excluded.created_at,expires_at=excluded.expires_at",target,viewer.id,reason,t,expires),
   stmt(db,"DELETE FROM sessions WHERE user_id=?",target)
  ]);
  return reply({ok:true});
 }
 if(method==="DELETE"&&path==="/admin/bans"){
  const p=await read(req);await exec(db,"DELETE FROM wrld_profile_bans WHERE user_id=?",p.user_id);return reply({ok:true});
 }
 return fail("Not found",404);
}
