const C="https://flekiii.github.io";
const ok=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":C,"Cache-Control":"no-store"}});
const dbOne=(d,q,...p)=>d.prepare(q).bind(...p).first();
const dbList=async(d,q,...p)=>(await d.prepare(q).bind(...p).all()).results||[];
export async function xpInfo(req,env,viewer){
 const db=env.DB,u=new URL(req.url);
 if(u.pathname==="/world/ranking"){
  const r=await dbList(db,"SELECT u.username,u.display_name,SUM(x.amount) xp FROM wrld_world_xp x JOIN users u ON u.id=x.user_id WHERE NOT EXISTS(SELECT 1 FROM wrld_profile_bans b WHERE b.user_id=u.id AND (b.expires_at=0 OR b.expires_at>?)) GROUP BY x.user_id ORDER BY xp DESC LIMIT 20",Date.now());
  return ok({ranking:r.map(x=>({...x,level:Math.floor(Math.sqrt(x.xp/60))+1}))});
 }
 if(!viewer)return ok({error:"Sign in first"},401);
 const xp=Number((await dbOne(db,"SELECT COALESCE(SUM(amount),0) xp FROM wrld_world_xp WHERE user_id=?",viewer.id))?.xp||0);
 const posts=Number((await dbOne(db,"SELECT COUNT(*) n FROM wrld_world_posts WHERE author=?",viewer.id))?.n||0);

 return ok({progress:{xp,level:Math.floor(Math.sqrt(xp/60))+1,badges:[...(posts?["first-post"]:[]),...(posts>=10?["author"]:[]),...(xp>=200?["explorer"]:[])],posts}});
}
