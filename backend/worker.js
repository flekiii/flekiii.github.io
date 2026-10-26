import { oauthHandle } from "./oauth.js";
import { profileHandle } from "./profiles.js";
import { marketHandle } from "./marketplace.js";
import { houseHandle } from "./houses.js";
// Fleki's Wrld independent social API. No third-party login or shared identity database.
const ORIGIN="https://flekiii.github.io",enc=new TextEncoder(),dec=new TextDecoder();
const j=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Access-Control-Allow-Origin":ORIGIN,"Vary":"Origin"}});
const bad=(message,status=400)=>j({error:message},status),now=()=>Date.now();
const bytes=n=>crypto.getRandomValues(new Uint8Array(n));
const b64=x=>btoa(String.fromCharCode(...x)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const un64=x=>Uint8Array.from(atob(x.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const hash=async x=>b64(new Uint8Array(await crypto.subtle.digest("SHA-256",typeof x==="string"?enc.encode(x):x)));
const same=(a,b)=>{let x=enc.encode(a),y=enc.encode(b);if(x.length!==y.length)return false;let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0};
const stmt=(db,sql,...params)=>db.prepare(sql).bind(...params);
const one=(db,sql,...params)=>stmt(db,sql,...params).first();
const rows=async(db,sql,...params)=>(await stmt(db,sql,...params).all()).results||[];
const exec=(db,sql,...params)=>stmt(db,sql,...params).run();
const read=async req=>{const text=await req.text();if(text.length>9000)throw Error("Request too large.");try{return JSON.parse(text)||{}}catch{throw Error("Malformed JSON.")}};
const validUser=s=>typeof s==="string"&&/^[a-z][a-z0-9_]{2,23}$/.test(s);
const validName=s=>typeof s==="string"&&s.trim().length>=1&&s.trim().length<=60;
const pwd=async(pass,salt)=>{const key=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveBits"]);return b64(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",iterations:210000,salt:un64(salt)},key,256)))};
const issue=async(db,id)=>{const token=b64(bytes(32));await exec(db,"INSERT INTO sessions(token_hash,user_id,mfa_verified,created_at,expires_at) VALUES(?,?,?,?,?)",await hash(token),id,0,now(),now()+604800000);return token};
const auth=async(req,db)=>{const h=req.headers.get("Authorization")||"";if(!/^Bearer [A-Za-z0-9_-]{42,}$/.test(h))return null;return one(db,"SELECT s.token_hash,s.mfa_verified,s.external_mfa,u.id,u.username,u.display_name,u.bio,u.mfa_secret FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?",await hash(h.slice(7)),now())};
const authorized=u=>u?.mfa_verified===1&&(!!u.mfa_secret||u.external_mfa===1);
const limited=async(db,key,ip,limit=8,window=900000,record=true)=>{let h=await hash(ip+"|"+key),t=now(),old=await one(db,"SELECT count,expires_at FROM login_attempts WHERE key_hash=?",h);if(old&&old.expires_at>t&&old.count>=limit)return false;if(record)await exec(db,"INSERT INTO login_attempts(key_hash,count,expires_at) VALUES(?,?,?) ON CONFLICT(key_hash) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END",h,1,t+window,t,t,t+window);return true};
const clearLimit=async(db,key,ip)=>exec(db,"DELETE FROM login_attempts WHERE key_hash=?",await hash(ip+"|"+key));
const isBlocked=async(db,a,b)=>!!await one(db,"SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)",a,b,b,a);
const friend=async(db,a,b)=>{const [lo,hi]=[a,b].sort();return !!await one(db,"SELECT 1 FROM friendships WHERE user_low=? AND user_high=? AND status='accepted'",lo,hi)};
const note=(db,recipient,actor,kind,ref)=>exec(db,"INSERT INTO notifications(id,recipient,actor,kind,ref_id,created_at) VALUES(?,?,?,?,?,?)",crypto.randomUUID(),recipient,actor,kind,ref||null,now());
const abc="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const base32=arr=>{let v=0,bits=0,out="";for(let b of arr){v=(v<<8)|b;bits+=8;while(bits>=5){out+=abc[(v>>>(bits-5))&31];bits-=5}}return out+(bits?abc[(v<<(5-bits))&31]:"")};
const debase=s=>{let v=0,bits=0,r=[];for(let c of s.toUpperCase().replace(/[\s=-]/g,"")){const k=abc.indexOf(c);if(k<0)return new Uint8Array();v=(v<<5)|k;bits+=5;if(bits>=8){r.push((v>>>(bits-8))&255);bits-=8}}return new Uint8Array(r)};
// AES-256-GCM encryption at rest; never store new TOTP seeds in plaintext.
const mfaKey=async(env)=>{
 const raw=String(env.MFA_MASTER_KEY||"");
 if(!/^[A-Za-z0-9_-]{43}$/.test(raw))throw Error("MFA encryption is not configured.");
 const bytes=un64(raw);
 if(bytes.length!==32)throw Error("Invalid MFA encryption key.");
 return crypto.subtle.importKey("raw",bytes,"AES-GCM",false,["encrypt","decrypt"]);
};
const seal=async(s,env)=>{
 const iv=bytes(12),key=await mfaKey(env);
 const data=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(s)));
 return "v1:"+b64(new Uint8Array([...iv,...data]));
};
const unseal=async(s,env)=>{
 if(typeof s!=="string")throw Error("Invalid authenticator data");
 if(!s.startsWith("v1:")){
  // Read-only compatibility for existing, pre-encryption account secrets.
  if(!/^[A-Z2-7]{16,128}$/.test(s))throw Error("Unsupported authenticator data");
  return s;
 }
 const payload=un64(s.slice(3));
 if(payload.length<29)throw Error("Invalid encrypted authenticator data");
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:payload.slice(0,12)},await mfaKey(env),payload.slice(12));
 return dec.decode(plain);
};
async function verifyTotp(secret,code){if(!/^\d{6}$/.test(code))return false;const key=await crypto.subtle.importKey("raw",debase(secret),{name:"HMAC",hash:"SHA-1"},false,["sign"]);let counter=Math.floor(now()/30000);for(let d=-1;d<=1;d++){const b=new Uint8Array(8);new DataView(b.buffer).setBigUint64(0,BigInt(counter+d),false);const h=new Uint8Array(await crypto.subtle.sign("HMAC",key,b)),i=h[19]&15,n=(((h[i]&127)<<24)|(h[i+1]<<16)|(h[i+2]<<8)|h[i+3])%1000000;if(String(n).padStart(6,"0")===code)return true}return false}
async function endpoints(req,env,path,ip){
 const db=env.DB,url=new URL(req.url),m=req.method,t=now();
 const is=(method,p)=>method===m&&path===p;
 if(is("GET","/health"))return j({ok:true,service:"flekis-wrld-social",database:"D1",auth:"TOTP"});
 if(is("POST","/auth/register")){
  const p=await read(req),username=String(p.username||"").trim().toLowerCase(),display=String(p.display_name||username).trim();
  if(!validUser(username)||!validName(display)||typeof p.password!=="string"||p.password.length<12||p.password.length>128)return bad("Username: 3–24 lowercase letters, digits or _. Password: 12–128 characters.");
  if(!await limited(db,"register",ip,3,3600000))return bad("Registration rate limit. Try later.",429);
  if(await one(db,"SELECT id FROM users WHERE username=?",username))return bad("Username already taken.",409);
  const id=crypto.randomUUID(),salt=b64(bytes(16)),digest=await pwd(p.password,salt);
  await exec(db,"INSERT INTO users(id,username,display_name,bio,salt,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",id,username,display,"",salt,digest,t,t);
  return j({token:await issue(db,id)},201);
 }
 if(is("POST","/auth/login")){
  const p=await read(req),username=String(p.username||"").trim().toLowerCase();
  if(!validUser(username)||typeof p.password!=="string")return bad("Wrong username or password.",401);
  if(!await limited(db,"login:"+username,ip,8,900000,false))return bad("Too many login attempts.",429);
  const row=await one(db,"SELECT id,salt,password_hash FROM users WHERE username=?",username);
  const got=await pwd(p.password,row?.salt||b64(new Uint8Array(16)));
  if(!row||!same(row.password_hash,got)){await limited(db,"login:"+username,ip);return bad("Wrong username or password.",401)}
  await clearLimit(db,"login:"+username,ip);
  return j({token:await issue(db,row.id)});
 }
 if(is("GET","/messages/public")){
  const messages=await rows(db,"SELECT m.id,m.author,m.content,m.created_at,a.username,a.display_name FROM messages m JOIN users a ON a.id=m.author WHERE m.recipient IS NULL ORDER BY m.created_at DESC LIMIT 80");
  return j({messages:messages.reverse(),pins:[],read_only:true});
 }
 const u=await auth(req,db);if(!u)return bad("Sign in required.",401);
 if(is("GET","/me"))return j({user:{id:u.id,username:u.username,display_name:u.display_name,bio:u.bio,mfa_enabled:!!u.mfa_secret||u.external_mfa===1,mfa_verified:authorized(u),mfa_provider:u.external_mfa===1?"fmail":u.mfa_secret?"wrld":null}});
 if(is("POST","/auth/logout")){await exec(db,"DELETE FROM sessions WHERE token_hash=?",u.token_hash);return j({ok:true})}
 if(is("POST","/mfa/enroll")){
  if(u.mfa_secret&&!authorized(u))return bad("Verify existing 2FA first.",403);
  let secret=base32(bytes(20));await exec(db,"UPDATE users SET mfa_pending=? WHERE id=?",await seal(secret,env),u.id);
  return j({secret,uri:"otpauth://totp/"+encodeURIComponent("Fleki's Wrld:"+u.username)+"?secret="+secret+"&issuer="+encodeURIComponent("Fleki's Wrld")+"&digits=6&period=30"});
 }
 if(is("POST","/mfa/activate")){
  const {code}=await read(req);if(!await limited(db,"setup:"+u.id,ip))return bad("Too many attempts.",429);
  const row=await one(db,"SELECT mfa_pending,mfa_secret FROM users WHERE id=?",u.id);
  if(!row?.mfa_pending)return bad("Begin setup first.");
  if(row.mfa_secret&&!authorized(u))return bad("Verify existing 2FA.",403);
  if(!await verifyTotp(await unseal(row.mfa_pending,env),String(code||"")))return bad("Invalid code.",401);
  const recovery=Array.from({length:8},()=>b64(bytes(9)).toUpperCase());
  await db.batch([stmt(db,"UPDATE users SET mfa_secret=mfa_pending,mfa_pending=NULL WHERE id=?",u.id),stmt(db,"DELETE FROM recovery_codes WHERE user_id=?",u.id),...await Promise.all(recovery.map(async code=>stmt(db,"INSERT INTO recovery_codes(user_id,code_hash) VALUES(?,?)",u.id,await hash(code)))),stmt(db,"UPDATE sessions SET mfa_verified=0 WHERE user_id=?",u.id),stmt(db,"UPDATE sessions SET mfa_verified=1 WHERE token_hash=?",u.token_hash)]);
  return j({verified:true,recovery_codes:recovery});
 }
 if(is("POST","/mfa/verify")){
  const p=await read(req);if(!u.mfa_secret)return bad("Set up 2FA first.",409);
  if(!await limited(db,"verify:"+u.id,ip,8,900000,false))return bad("Too many attempts.",429);
  let ok=false,code=String(p.code||"").trim().toUpperCase();
  if(/^\d{6}$/.test(code))ok=await verifyTotp(await unseal(u.mfa_secret,env),code);
  else if(/^[A-Z0-9_-]{12}$/.test(code)){const digest=await hash(code);if(await one(db,"SELECT 1 FROM recovery_codes WHERE user_id=? AND code_hash=?",u.id,digest)){ok=true;await exec(db,"DELETE FROM recovery_codes WHERE user_id=? AND code_hash=?",u.id,digest)}}
  if(!ok){await limited(db,"verify:"+u.id,ip);return bad("Incorrect 2FA or recovery code.",401)}
  await clearLimit(db,"verify:"+u.id,ip);await exec(db,"UPDATE sessions SET mfa_verified=1 WHERE token_hash=?",u.token_hash);
  return j({verified:true});
 }
 if(is("GET","/users")){
  const q=String(url.searchParams.get("q")||"").trim().slice(0,35);
  if(q.length<2)return j({users:[]});
  return j({users:await rows(db,"SELECT id,username,display_name,bio FROM users WHERE id<>? AND (username LIKE ? OR display_name LIKE ?) LIMIT 25",u.id,"%"+q+"%","%"+q+"%")});
 }
 if(is("GET","/friends")){
  const friends=await rows(db,"SELECT f.*,a.username AS low_username,a.display_name AS low_name,b.username AS high_username,b.display_name AS high_name FROM friendships f JOIN users a ON a.id=f.user_low JOIN users b ON b.id=f.user_high WHERE f.user_low=? OR f.user_high=? ORDER BY f.created_at DESC LIMIT 150",u.id,u.id);
  const blocks=await rows(db,"SELECT x.blocked,y.username,y.display_name FROM blocks x JOIN users y ON x.blocked=y.id WHERE x.blocker=? LIMIT 100",u.id);
  const pins=await rows(db,"SELECT contact_id FROM contact_pins WHERE user_id=?",u.id);
  return j({friends,blocks,contact_pins:pins.map(x=>x.contact_id)});
 }
 if(is("POST","/blocks")){
  const p=await read(req);if(typeof p.target_id!=="string"||p.target_id===u.id||!await one(db,"SELECT 1 FROM users WHERE id=?",p.target_id))return bad("Unknown user.");
  await exec(db,"INSERT OR IGNORE INTO blocks(blocker,blocked,created_at) VALUES(?,?,?)",u.id,p.target_id,t);
  return j({ok:true});
 }
 if(m==="DELETE"&&path.startsWith("/blocks/")){await exec(db,"DELETE FROM blocks WHERE blocker=? AND blocked=?",u.id,path.slice(8));return j({ok:true})}
 if(is("GET","/messages")){
  const peer=url.searchParams.get("peer");
  if(peer){
   if(!await friend(db,u.id,peer)||await isBlocked(db,u.id,peer))return bad("Not an available friend.",403);
   const messages=await rows(db,"SELECT m.*,a.username,a.display_name FROM messages m JOIN users a ON a.id=m.author WHERE (m.author=? AND m.recipient=?) OR (m.author=? AND m.recipient=?) ORDER BY m.created_at DESC LIMIT 80",u.id,peer,peer,u.id);
   const pins=await rows(db,"SELECT p.message_id FROM pins p JOIN messages m ON m.id=p.message_id WHERE p.user_id=? AND ((m.author=? AND m.recipient=?) OR (m.author=? AND m.recipient=?))",u.id,u.id,peer,peer,u.id);
   return j({messages:messages.reverse(),pins:pins.map(p=>p.message_id)});
  }
  const messages=await rows(db,"SELECT m.*,a.username,a.display_name FROM messages m JOIN users a ON a.id=m.author WHERE m.recipient IS NULL AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.blocker=? AND b.blocked=m.author) OR (b.blocker=m.author AND b.blocked=?)) ORDER BY m.created_at DESC LIMIT 80",u.id,u.id);
  const pins=await rows(db,"SELECT p.message_id FROM pins p JOIN messages m ON m.id=p.message_id WHERE p.user_id=? AND m.recipient IS NULL",u.id);
  return j({messages:messages.reverse(),pins:pins.map(p=>p.message_id)});
 }
 if(is("GET","/notifications"))return j({notifications:await rows(db,"SELECT n.*,a.username,a.display_name FROM notifications n LEFT JOIN users a ON a.id=n.actor WHERE n.recipient=? ORDER BY n.created_at DESC LIMIT 80",u.id)});
 if(is("POST","/notifications/read")){
  const p=await read(req);
  if(p.id==="all")await exec(db,"UPDATE notifications SET read_at=? WHERE recipient=? AND read_at IS NULL",t,u.id);
  else await exec(db,"UPDATE notifications SET read_at=? WHERE recipient=? AND id=? AND read_at IS NULL",t,u.id,p.id);
  return j({ok:true});
 }
 if(!authorized(u))return bad("Verified 2FA is required for this action.",403);
 if(is("PUT","/profile")){
  const p=await read(req),display=String(p.display_name||"").trim(),bio=String(p.bio||"").trim();
  if(!validName(display)||bio.length>350)return bad("Name must be 1–60 characters; bio max 350.");
  await exec(db,"UPDATE users SET display_name=?,bio=?,updated_at=? WHERE id=?",display,bio,t,u.id);return j({ok:true});
 }
 if(is("POST","/friends/request")){
  const p=await read(req),target=p.target_id;
  if(typeof target!=="string"||target===u.id||!await one(db,"SELECT id FROM users WHERE id=?",target))return bad("Unknown user.");
  if(await isBlocked(db,u.id,target))return bad("Blocked account.",403);
  const [lo,hi]=[u.id,target].sort();
  if(await one(db,"SELECT 1 FROM friendships WHERE user_low=? AND user_high=?",lo,hi))return bad("Friendship or request already exists.",409);
  const fid=crypto.randomUUID();await exec(db,"INSERT INTO friendships(id,user_low,user_high,requester,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",fid,lo,hi,u.id,"pending",t,t);
  await note(db,target,u.id,"friend_request",fid);return j({ok:true});
 }
 if(is("POST","/friends/respond")){
  const p=await read(req),f=await one(db,"SELECT * FROM friendships WHERE id=?",p.id);
  if(!f||f.status!=="pending"||f.requester===u.id||(f.user_low!==u.id&&f.user_high!==u.id))return bad("Request unavailable.",404);
  if(p.accept===true){
    if(await isBlocked(db,f.user_low,f.user_high))return bad("Blocked account.",403);
    await exec(db,"UPDATE friendships SET status='accepted',updated_at=? WHERE id=? AND status='pending'",t,f.id);await note(db,f.requester,u.id,"friend_accepted",f.id);
  }else await exec(db,"DELETE FROM friendships WHERE id=?",f.id);
  return j({ok:true});
 }
 if(is("POST","/friends/remove")){const p=await read(req);await exec(db,"DELETE FROM friendships WHERE id=? AND (user_low=? OR user_high=?)",p.id,u.id,u.id);return j({ok:true})}
 if(is("POST","/messages")){
  const p=await read(req),content=String(p.content||"").trim(),recipient=p.recipient||null;
  if(content.length<1||content.length>2000)return bad("Message must be 1–2000 characters.");
  if(recipient&&(typeof recipient!=="string"||recipient===u.id||await isBlocked(db,u.id,recipient)||!await friend(db,u.id,recipient)))return bad("You can message accepted, unblocked friends only.",403);
  const latest=await one(db,"SELECT created_at FROM messages WHERE author=? ORDER BY created_at DESC LIMIT 1",u.id);
  if(latest&&t-latest.created_at<3500)return bad("Wait a few seconds before posting again.",429);
  const mid=crypto.randomUUID();await exec(db,"INSERT INTO messages(id,author,recipient,content,created_at) VALUES(?,?,?,?,?)",mid,u.id,recipient,content,t);
  if(recipient)await note(db,recipient,u.id,"direct_message",mid);
  return j({id:mid,created_at:t},201);
 }
 if(m==="DELETE"&&path.startsWith("/messages/")){await exec(db,"DELETE FROM messages WHERE author=? AND id=?",u.id,path.slice(10));return j({ok:true})}
 if(is("POST","/pins")){
  const p=await read(req);
  if(p.message_id){
   const msg=await one(db,"SELECT author,recipient FROM messages WHERE id=?",p.message_id);
   if(!msg||msg.recipient&&(msg.author!==u.id&&msg.recipient!==u.id)||await isBlocked(db,u.id,msg.author))return bad("Message unavailable.",403);
   await exec(db,"INSERT OR IGNORE INTO pins(user_id,message_id,created_at) VALUES(?,?,?)",u.id,p.message_id,t);
  }else if(p.contact_id){
   if(!await friend(db,u.id,p.contact_id)||await isBlocked(db,u.id,p.contact_id))return bad("Contact unavailable.",403);
   await exec(db,"INSERT OR IGNORE INTO contact_pins(user_id,contact_id,created_at) VALUES(?,?,?)",u.id,p.contact_id,t);
  }else return bad("Missing message or contact.");
  return j({ok:true});
 }
 if(is("POST","/pins/remove")){
  const p=await read(req);
  if(p.message_id)await exec(db,"DELETE FROM pins WHERE user_id=? AND message_id=?",u.id,p.message_id);
  if(p.contact_id)await exec(db,"DELETE FROM contact_pins WHERE user_id=? AND contact_id=?",u.id,p.contact_id);
  return j({ok:true});
 }
 if(is("POST","/reports")){
  const p=await read(req),reason=String(p.reason||"").trim(),msg=await one(db,"SELECT author,recipient FROM messages WHERE id=?",p.message_id);
  if(reason.length<3||reason.length>300||!msg||msg.author===u.id||msg.recipient&&(msg.recipient!==u.id&&msg.author!==u.id))return bad("Invalid report.");
  await exec(db,"INSERT OR IGNORE INTO reports(id,reporter,message_id,reason,created_at) VALUES(?,?,?,?,?)",crypto.randomUUID(),u.id,p.message_id,reason,t);return j({ok:true});
 }
 return bad("Not found.",404);
}
export default {async fetch(req,env){
 const origin=req.headers.get("Origin"),path=new URL(req.url).pathname;
 if(req.method==="OPTIONS"){if(origin!==ORIGIN)return new Response(null,{status:403});return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"Authorization,Content-Type","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Access-Control-Max-Age":"1800"}})}
 if(origin&&origin!==ORIGIN&&!(path==="/auth/oauth/callback/apple"&&origin==="https://appleid.apple.com"))return bad("Forbidden origin.",403);
 if(!env.DB)return bad("Backend not configured.",503);
 try{const socialAuth=await oauthHandle(req,env,path);if(socialAuth)return socialAuth;const profile=await profileHandle(req,env,path,{auth,authorized});if(profile)return profile;const market=await marketHandle(req,env,path,{auth,authorized});if(market)return market;const houses=await houseHandle(req,env,path,{auth,authorized});if(houses)return houses;return await endpoints(req,env,path,req.headers.get("CF-Connecting-IP")||"unknown")}
 catch(e){if(["Request too large.","Malformed JSON."].includes(e.message))return bad(e.message);if(String(e).includes("UNIQUE constraint failed"))return bad("Already exists.",409);return bad("Server error.",500)}
}};
