const out=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"https://flekiii.github.io"}});
const one=(d,q,...a)=>d.prepare(q).bind(...a).first(),run=(d,q,...a)=>d.prepare(q).bind(...a).run();
export async function worldFeed(req,db,me){
 const url=new URL(req.url),p=url.pathname;
 if(p==="/world/feed"){
  const rows=(await db.prepare("SELECT p.id,p.author,p.body,p.created_at,u.username,u.display_name,(SELECT COUNT(*) FROM wrld_world_likes l WHERE l.post_id=p.id) likes FROM wrld_world_posts p JOIN users u ON u.id=p.author ORDER BY p.created_at DESC LIMIT 35").all()).results||[];
  return out({posts:rows});
 }
 if(p==="/world/comments"&&req.method==="GET"){
  const id=(url.searchParams.get("post")||"").slice(0,48);
  const rows=(await db.prepare("SELECT c.id,c.body,c.created_at,u.username FROM wrld_world_comments c JOIN users u ON u.id=c.author WHERE c.post_id=? ORDER BY c.created_at DESC LIMIT 30").bind(id).all()).results||[];
  return out({comments:rows});
 }
 if(!me)return out({error:"Sign in first"},401);
 let v;try{v=JSON.parse(await req.text())}catch{return out({error:"Invalid JSON"},400)}
 if(p==="/world/post"&&req.method==="POST"){
  const body=String(v.body||"").trim();
  if(body.length<3||body.length>800)return out({error:"Use 3–800 characters"},400);
  const recent=await one(db,"SELECT created_at FROM wrld_world_posts WHERE author=? ORDER BY created_at DESC LIMIT 1",me.id);
  if(recent&&Date.now()-recent.created_at<45000)return out({error:"Wait 45 seconds between posts"},429);
  await run(db,"INSERT INTO wrld_world_posts(id,author,body,created_at) VALUES(?,?,?,?)",crypto.randomUUID(),me.id,body,Date.now());
  return out({ok:true},201);
 }
 if(p==="/world/like"&&req.method==="POST"){
  const id=String(v.id||"").slice(0,48);
  const post=await one(db,"SELECT author FROM wrld_world_posts WHERE id=?",id);
  if(!post)return out({error:"Post not found"},404);
  const old=await one(db,"SELECT 1 FROM wrld_world_likes WHERE post_id=? AND user_id=?",id,me.id);
  if(old)await run(db,"DELETE FROM wrld_world_likes WHERE post_id=? AND user_id=?",id,me.id);
  else await run(db,"INSERT INTO wrld_world_likes(post_id,user_id) VALUES(?,?)",id,me.id);
  return out({ok:true,liked:!old});
 }
 return out({error:"Not found"},404);
}
