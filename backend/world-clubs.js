const res=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"https://flekiii.github.io"}});
export async function worldClubs(req,db,me){
 const p=new URL(req.url).pathname;
 if(p==="/world/clubs"){
  const clubs=(await db.prepare("SELECT c.id,c.name,c.description,c.created_at,u.username,(SELECT COUNT(*) FROM wrld_world_members m WHERE m.club_id=c.id) members FROM wrld_world_clubs c JOIN users u ON u.id=c.owner ORDER BY members DESC,c.created_at DESC LIMIT 40").all()).results||[];
  return res({clubs});
 }
 if(!me)return res({error:"Sign in first"},401);
 let d;try{d=JSON.parse(await req.text())}catch{return res({error:"Invalid JSON"},400)}
 if(p==="/world/club"){
  const name=String(d.name||"").trim().slice(0,49),description=String(d.description||"").trim().slice(0,221);
  if(name.length<3||name.length>48||description.length>220)return res({error:"Invalid club name or description"},400);
  const count=await db.prepare("SELECT COUNT(*) n FROM wrld_world_clubs WHERE owner=?").bind(me.id).first();
  if(count?.n>=3)return res({error:"Limit of 3 clubs"},429);
  const last=await db.prepare("SELECT created_at FROM wrld_world_clubs WHERE owner=? ORDER BY created_at DESC LIMIT 1").bind(me.id).first();
  if(last&&Date.now()-last.created_at<86400000)return res({error:"One new club per day"},429);
  const id=crypto.randomUUID(),time=Date.now();
  await db.batch([db.prepare("INSERT INTO wrld_world_clubs(id,owner,name,description,created_at) VALUES(?,?,?,?,?)").bind(id,me.id,name,description,time),db.prepare("INSERT INTO wrld_world_members(club_id,user_id,joined_at) VALUES(?,?,?)").bind(id,me.id,time)]);
  return res({ok:true},201);
 }
 if(p==="/world/join"){
  const id=String(d.id||"").slice(0,50),club=await db.prepare("SELECT owner FROM wrld_world_clubs WHERE id=?").bind(id).first();
  if(!club)return res({error:"Club not found"},404);
  const old=await db.prepare("SELECT 1 FROM wrld_world_members WHERE club_id=? AND user_id=?").bind(id,me.id).first();
  if(old){if(club.owner===me.id)return res({error:"Owners must remain members"},403);await db.prepare("DELETE FROM wrld_world_members WHERE club_id=? AND user_id=?").bind(id,me.id).run()}
  else await db.prepare("INSERT INTO wrld_world_members(club_id,user_id,joined_at) VALUES(?,?,?)").bind(id,me.id,Date.now()).run();
  return res({ok:true,member:!old});
 }
 return res({error:"Not found"},404);
}
