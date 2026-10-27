const C="https://flekiii.github.io";
const ok=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":C,"Cache-Control":"no-store"}});
const dbOne=(d,q,...p)=>d.prepare(q).bind(...p).first();
const dbList=async(d,q,...p)=>(await d.prepare(q).bind(...p).all()).results||[];
export async function gallery(req,env,viewer){
 const db=env.DB,u=new URL(req.url),q=(u.searchParams.get("q")||"").trim().toLowerCase().slice(0,60),sort=u.searchParams.get("sort")==="new"?"new":"popular";
 const rows=await dbList(db,"SELECT h.name,h.template,h.updated_at,h.owner,u.username,u.display_name,(SELECT COUNT(*) FROM wrld_house_reactions r WHERE r.owner=h.owner) reactions FROM wrld_houses h JOIN users u ON u.id=h.owner WHERE h.published=1 AND NOT EXISTS(SELECT 1 FROM wrld_profile_bans b WHERE b.user_id=h.owner AND (b.expires_at=0 OR b.expires_at>?)) ORDER BY "+(sort==="new"?"h.updated_at DESC":"reactions DESC,h.updated_at DESC")+" LIMIT 80",Date.now());
 const houses=[];
 for(const row of rows){
  if(q&&!String(row.name+" "+row.username+" "+row.template).toLowerCase().includes(q))continue;
  if(viewer&&await dbOne(db,"SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocked=? AND blocker=?)",viewer.id,row.owner,viewer.id,row.owner))continue;
  houses.push({name:row.name,template:row.template,username:row.username,display_name:row.display_name,reactions:row.reactions,updated_at:row.updated_at});
  if(houses.length===36)break;
 }
 return ok({houses});
}
export async function xpInfo(req,env,viewer){
 const db=env.DB,u=new URL(req.url);
 if(u.pathname==="/world/ranking"){
  const r=await dbList(db,"SELECT u.username,u.display_name,SUM(x.amount) xp FROM wrld_world_xp x JOIN users u ON u.id=x.user_id WHERE NOT EXISTS(SELECT 1 FROM wrld_profile_bans b WHERE b.user_id=u.id AND (b.expires_at=0 OR b.expires_at>?)) GROUP BY x.user_id ORDER BY xp DESC LIMIT 20",Date.now());
  return ok({ranking:r.map(x=>({...x,level:Math.floor(Math.sqrt(x.xp/60))+1}))});
 }
 if(!viewer)return ok({error:"Sign in first"},401);
 const xp=Number((await dbOne(db,"SELECT COALESCE(SUM(amount),0) xp FROM wrld_world_xp WHERE user_id=?",viewer.id))?.xp||0);
 const posts=Number((await dbOne(db,"SELECT COUNT(*) n FROM wrld_world_posts WHERE author=?",viewer.id))?.n||0);
 const homes=Number((await dbOne(db,"SELECT COUNT(*) n FROM wrld_houses WHERE owner=? AND published=1",viewer.id))?.n||0);
 return ok({progress:{xp,level:Math.floor(Math.sqrt(xp/60))+1,badges:[...(posts?["first-post"]:[]),...(posts>=10?["author"]:[]),...(homes?["home-designer"]:[]),...(xp>=200?["explorer"]:[])],posts,homes}});
}
