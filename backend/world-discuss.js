const reply=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"https://flekiii.github.io"}});
export async function worldDiscuss(req,db,user){
 if(!user)return reply({error:"Sign in first"},401);
 let data={};try{data=JSON.parse(await req.text())}catch{return reply({error:"Bad request"},400)}
 const path=new URL(req.url).pathname;
 if(path==="/world/comment"){
  const id=String(data.id||"").slice(0,48),body=String(data.body||"").trim();
  if(body.length<2||body.length>400)return reply({error:"Comment length: 2–400"},400);
  const post=await db.prepare("SELECT author FROM wrld_world_posts WHERE id=?").bind(id).first();
  if(!post)return reply({error:"Post unavailable"},404);
  const last=await db.prepare("SELECT created_at FROM wrld_world_comments WHERE author=? ORDER BY created_at DESC LIMIT 1").bind(user.id).first();
  if(last&&Date.now()-last.created_at<9000)return reply({error:"Wait before commenting"},429);
  await db.prepare("INSERT INTO wrld_world_comments(id,post_id,author,body,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),id,user.id,body,Date.now()).run();
  return reply({ok:true},201);
 }
 if(path==="/world/follow"){
  const name=String(data.username||"").trim();
  if(!/^[a-z][a-z0-9_]{2,23}$/i.test(name))return reply({error:"Invalid username"},400);
  const target=await db.prepare("SELECT id FROM users WHERE username=? COLLATE NOCASE").bind(name).first();
  if(!target||target.id===user.id)return reply({error:"Member unavailable"},404);
  const old=await db.prepare("SELECT 1 FROM wrld_world_follows WHERE follower=? AND followed=?").bind(user.id,target.id).first();
  if(old)await db.prepare("DELETE FROM wrld_world_follows WHERE follower=? AND followed=?").bind(user.id,target.id).run();
  else await db.prepare("INSERT INTO wrld_world_follows(follower,followed,created_at) VALUES(?,?,?)").bind(user.id,target.id,Date.now()).run();
  return reply({ok:true,following:!old});
 }
 return reply({error:"Unknown action"},404);
}
