/* Auth2FA-gated account export. Never include credentials, MFA seeds or raw sessions. */
const q=(db,sql,...args)=>db.prepare(sql).bind(...args);
const one=(db,sql,...args)=>q(db,sql,...args).first();
const many=async(db,sql,...args)=>(await q(db,sql,...args).all()).results||[];
export async function worldExport(req,env,user){
 const db=env.DB,id=user.id;
 const [account,profile,posts,comments,following,clubs,houses,drafts,achievements,friends,messages]=await Promise.all([
  one(db,"SELECT id,username,display_name,bio,created_at,updated_at FROM users WHERE id=?",id),
  one(db,"SELECT status,country,region,district,phone,website,socials,favorite_games,current_games,visibility,updated_at FROM wrld_profile_settings WHERE user_id=?",id),
  many(db,"SELECT id,body,created_at FROM wrld_world_posts WHERE author=? ORDER BY created_at DESC LIMIT 1000",id),
  many(db,"SELECT id,post_id,body,created_at FROM wrld_world_comments WHERE author=? ORDER BY created_at DESC LIMIT 1000",id),
  many(db,"SELECT followed,created_at FROM wrld_world_follows WHERE follower=? LIMIT 500",id),
  many(db,"SELECT club_id,joined_at FROM wrld_world_members WHERE user_id=? LIMIT 250",id),
  one(db,"SELECT name,template,layout_json,published,in_profile,updated_at FROM wrld_houses WHERE owner=?",id),
  one(db,"SELECT name,template,layout_json,updated_at FROM wrld_house_drafts WHERE owner=?",id),
  many(db,"SELECT action,amount,created_at FROM wrld_world_xp WHERE user_id=? ORDER BY created_at DESC LIMIT 1000",id),
  many(db,"SELECT id,user_low,user_high,status,created_at FROM friendships WHERE user_low=? OR user_high=? LIMIT 500",id,id),
  many(db,"SELECT id,author,recipient,content,created_at FROM messages WHERE author=? OR recipient=? ORDER BY created_at DESC LIMIT 1000",id,id)
 ]);
 return new Response(JSON.stringify({format:"fleki-wrld-account-export",exported_at:new Date().toISOString(),
  account,profile,posts,comments,following,clubs,published_house:houses||null,private_house_draft:drafts||null,achievements,friends,messages,
  limits:"History is capped at 1000 entries per collection. Media files, credentials and MFA secrets are excluded."}),
 {status:200,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://flekiii.github.io","X-Content-Type-Options":"nosniff"}});
}
