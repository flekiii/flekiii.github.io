// Authenticated owners may publish houses; reactions still require verified 2FA.
const ORIGIN="https://flekiii.github.io";
const TYPES=new Set("sofa table tv rug plant lamp bed dresser desk chair pc shelf wardrobe nightstand mirror bathtub sink toilet fridge stove dining kitchen car tools bike arcade console speaker painting flower piano guitar beanbag windowseat pool".split(" "));
const TEMPLATES=new Set("loft cottage starter townhouse family villa mansion garage garagehouse workshop".split(" "));
export const EMOJI_REACTIONS=["👍","👎","❤️","💜","💙","💚","💛","🧡","🩷","😍","🥰","🔥","✨","👏","🎉","🤩","😮","😂","🏠","💯"];
const j=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":ORIGIN,"Vary":"Origin"}});
const bad=(error,status=400)=>j({error},status);
const exec=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const rows=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results||[];
let initial=null;
async function tables(db){
 if(initial)return initial;
 initial=(async()=>{
  await exec(db,"CREATE TABLE IF NOT EXISTS wrld_houses (owner TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,template TEXT NOT NULL,layout_json TEXT NOT NULL,published INTEGER NOT NULL DEFAULT 0,in_profile INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL)");
  await exec(db,"CREATE TABLE IF NOT EXISTS wrld_house_reactions (owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,reactor TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,emoji TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(owner,reactor))");
  await exec(db,"CREATE TABLE IF NOT EXISTS wrld_house_drafts (owner TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,template TEXT NOT NULL,layout_json TEXT NOT NULL,updated_at INTEGER NOT NULL)");
 })();
 try{await initial}catch(e){initial=null;throw e}
}
function validItems(items){
 if(!Array.isArray(items)||items.length>90)return false;
 const ids=new Set();
 for(const x of items){
  if(!x||typeof x.id!=="string"||!/^[-a-zA-Z0-9]{1,50}$/.test(x.id)||ids.has(x.id)||!TYPES.has(x.type))return false;
  if(!Number.isFinite(x.x)||!Number.isFinite(x.z)||Math.abs(x.x)>5||Math.abs(x.z)>4||!Number.isInteger(x.rot)||x.rot<0||x.rot>3)return false;
  ids.add(x.id);
 }
 return true;
}
function house(row){
 if(!row)return null;
 let items=[];try{items=JSON.parse(row.layout_json)}catch{}
 return {owner:row.owner,username:row.username,display_name:row.display_name,name:row.name,template:row.template,items,published:!!row.published,in_profile:!!row.in_profile,updated_at:row.updated_at};
}
export async function houseHandle(req,env,path,{auth,authorized}){
 if(!path.startsWith("/houses/"))return null;
 const db=env.DB;await tables(db);
 const method=req.method,url=new URL(req.url);
 if(method==="GET"&&(path==="/houses/public"||path==="/houses/profile")){
  const username=String(url.searchParams.get("user")||"").trim().slice(0,50);
  if(!/^[a-z][a-z0-9_]{2,23}$/i.test(username))return bad("Invalid house owner.");
  const row=await one(db,"SELECT h.*,u.username,u.display_name FROM wrld_houses h JOIN users u ON u.id=h.owner WHERE u.username=? COLLATE NOCASE AND h.published=1",username);
  if(!row||(path==="/houses/profile"&&!row.in_profile))return bad("House not shared.",404);
  const reactions=await rows(db,"SELECT emoji,count(*) AS count FROM wrld_house_reactions WHERE owner=? GROUP BY emoji ORDER BY count DESC",row.owner);
  // Public counts need no account; signed-in members see their currently selected reaction.
  const visitor=req.headers.get("Authorization")?await auth(req,db):null;
  const previous=visitor?await one(db,"SELECT emoji FROM wrld_house_reactions WHERE owner=? AND reactor=?",row.owner,visitor.id):null;
  return j({house:house(row),reactions,reaction_options:EMOJI_REACTIONS,your_reaction:previous?.emoji||null});
 }
 const user=await auth(req,db);if(!user)return bad("Sign in required.",401);
 if(method==="GET"&&path==="/houses/mine"){
  const row=await one(db,"SELECT h.*,u.username,u.display_name FROM wrld_houses h JOIN users u ON u.id=h.owner WHERE h.owner=?",user.id);
  return j({house:house(row)});
 }

 if(method==="GET"&&path==="/houses/draft"){
  const row=await one(db,"SELECT d.*,u.username FROM wrld_house_drafts d JOIN users u ON u.id=d.owner WHERE d.owner=?",user.id);
  return j({draft:house(row)});
 }
 if(method==="PUT"&&path==="/houses/draft"){
  const raw=await req.text();if(raw.length>14500)return bad("House draft is too large.",413);
  let payload;try{payload=JSON.parse(raw)}catch{return bad("Invalid JSON.")}
  const name=String(payload.name||"").trim();
  if(name.length<1||name.length>55||!/[\p{L}\p{N}]/u.test(name))return bad("Enter a house name (1–55 characters).");
  if(!TEMPLATES.has(payload.template)||!validItems(payload.items))return bad("Invalid house plan or furniture.");
  const previous=await one(db,"SELECT updated_at FROM wrld_house_drafts WHERE owner=?",user.id);
  if(Number.isSafeInteger(payload.expected_updated_at)&&previous?.updated_at!==payload.expected_updated_at)return bad("Cloud draft changed elsewhere. Reload before overwriting.",409);
  const timestamp=Math.max(Date.now(),Number(previous?.updated_at||0)+1);
  const items=JSON.stringify(payload.items.map(x=>({id:x.id,type:x.type,x:x.x,z:x.z,rot:x.rot})));
  await exec(db,"INSERT INTO wrld_house_drafts(owner,name,template,layout_json,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,template=excluded.template,layout_json=excluded.layout_json,updated_at=excluded.updated_at",user.id,name,payload.template,items,timestamp);
  return j({ok:true,updated_at:timestamp,private:true});
 }
 if(method==="PATCH"&&path==="/houses/visibility"){
  const raw=await req.text();if(raw.length>500)return bad("Request too large.",413);
  let payload;try{payload=JSON.parse(raw)}catch{return bad("Invalid JSON.")}
  if(typeof payload.published!=="boolean"||typeof payload.in_profile!=="boolean")return bad("Invalid visibility.",400);
  const row=await one(db,"SELECT updated_at FROM wrld_houses WHERE owner=?",user.id);
  if(!row)return bad("Publish a house first.",404);
  const updated=Math.max(Date.now(),Number(row.updated_at||0)+1);
  const visible=payload.published&&payload.in_profile;
  await exec(db,"UPDATE wrld_houses SET published=?,in_profile=?,updated_at=? WHERE owner=?",Number(payload.published),Number(visible),updated,user.id);
  const result=await one(db,"SELECT h.*,u.username,u.display_name FROM wrld_houses h JOIN users u ON u.id=h.owner WHERE h.owner=?",user.id);
  return j({ok:true,house:house(result)});
 }
 if(method==="PUT"&&path==="/houses/publish"){
  const raw=await req.text();if(raw.length>14500)return bad("House is too large.",413);
  let payload;try{payload=JSON.parse(raw)}catch{return bad("Invalid JSON.")}
  const name=String(payload.name||"").trim();
  if(name.length<1||name.length>55||!/[\p{L}\p{N}]/u.test(name))return bad("Enter a house name (1–55 characters).");
  if(!TEMPLATES.has(payload.template)||!validItems(payload.items))return bad("Invalid house plan or furniture.");
  const published=payload.published===true?1:0,inProfile=published&&payload.in_profile===true?1:0;
  const items=JSON.stringify(payload.items.map(x=>({id:x.id,type:x.type,x:x.x,z:x.z,rot:x.rot})));
  await exec(db,"INSERT INTO wrld_houses(owner,name,template,layout_json,published,in_profile,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,template=excluded.template,layout_json=excluded.layout_json,published=excluded.published,in_profile=excluded.in_profile,updated_at=excluded.updated_at",user.id,name,payload.template,items,published,inProfile,Date.now());
  return j({ok:true,username:user.username,public_url:published?ORIGIN+"/#house?u="+encodeURIComponent(user.username):null,published:!!published,in_profile:!!inProfile});
 }
 if(method==="POST"&&path==="/houses/react"){
  if(!authorized(user))return bad("Verify Auth2FA for this session in Profile → Security before reacting.",403);
  const raw=await req.text();if(raw.length>400)return bad("Request too large.",413);
  let payload;try{payload=JSON.parse(raw)}catch{return bad("Invalid JSON.")}
  const name=String(payload.user||"").trim();
  if(!/^[a-z][a-z0-9_]{2,23}$/i.test(name))return bad("Invalid owner.");
  const target=await one(db,"SELECT h.owner FROM wrld_houses h JOIN users u ON u.id=h.owner WHERE u.username=? COLLATE NOCASE AND h.published=1",name);
  if(!target)return bad("House unavailable.",404);
  if(payload.emoji!==null&&!EMOJI_REACTIONS.includes(payload.emoji))return bad("Unsupported reaction.");
  if(payload.emoji===null)await exec(db,"DELETE FROM wrld_house_reactions WHERE owner=? AND reactor=?",target.owner,user.id);
  else await exec(db,"INSERT INTO wrld_house_reactions(owner,reactor,emoji,created_at) VALUES(?,?,?,?) ON CONFLICT(owner,reactor) DO UPDATE SET emoji=excluded.emoji,created_at=excluded.created_at",target.owner,user.id,payload.emoji,Date.now());
  const reactions=await rows(db,"SELECT emoji,count(*) AS count FROM wrld_house_reactions WHERE owner=? GROUP BY emoji ORDER BY count DESC",target.owner);
  return j({ok:true,reactions,your_reaction:payload.emoji});
 }
 return bad("Not found.",404);
}
