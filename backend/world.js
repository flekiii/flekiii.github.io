import {xpInfo} from "./world-gallery.js";
import {worldFeed} from "./world-feed.js";
import {worldClubs} from "./world-clubs.js";
import {worldDiscuss} from "./world-discuss.js";
import {worldExport} from "./world-export.js";
let setup=null;
async function init(db){
 if(setup)return setup;
 setup=(async()=>{for(const sql of [
 "CREATE TABLE IF NOT EXISTS wrld_world_posts(id TEXT PRIMARY KEY,author TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS wrld_world_likes(post_id TEXT NOT NULL REFERENCES wrld_world_posts(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,PRIMARY KEY(post_id,user_id))",
 "CREATE TABLE IF NOT EXISTS wrld_world_comments(id TEXT PRIMARY KEY,post_id TEXT NOT NULL REFERENCES wrld_world_posts(id) ON DELETE CASCADE,author TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS wrld_world_follows(follower TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,followed TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at INTEGER NOT NULL,PRIMARY KEY(follower,followed))",
 "CREATE TABLE IF NOT EXISTS wrld_world_clubs(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,description TEXT NOT NULL,created_at INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS wrld_world_members(club_id TEXT NOT NULL REFERENCES wrld_world_clubs(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,joined_at INTEGER NOT NULL,PRIMARY KEY(club_id,user_id))",
 "CREATE TABLE IF NOT EXISTS wrld_world_xp(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,action TEXT NOT NULL,amount INTEGER NOT NULL,created_at INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS wrld_world_quest_claims(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,quest TEXT NOT NULL,day INTEGER NOT NULL,claimed_at INTEGER NOT NULL,PRIMARY KEY(user_id,quest,day))"
 ])await db.prepare(sql).run()})();
 try{await setup}catch(e){setup=null;throw e}
}
const questHeaders={"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"https://flekiii.github.io","Vary":"Origin","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const questReply=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:questHeaders});
const err=(message,status)=>questReply({error:message},status);
async function award(db,id,action,xp,limit){
 const start=Math.floor(Date.now()/86400000)*86400000;
 const n=await db.prepare("SELECT COUNT(*) n FROM wrld_world_xp WHERE user_id=? AND action=? AND created_at>=?").bind(id,action,start).first();
 if(n?.n>=limit)return;
 await db.prepare("INSERT INTO wrld_world_xp(id,user_id,action,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),id,action,xp,Date.now()).run();
}

const QUESTS=[
 {id:"share-post",emoji:"✍️",title:"Share a post",uk:"Опублікуй допис",xp:30,query:"SELECT COUNT(*) n FROM wrld_world_posts WHERE author=? AND created_at>=?"},
 {id:"leave-comment",emoji:"💬",title:"Write a comment",uk:"Напиши коментар",xp:20,query:"SELECT COUNT(*) n FROM wrld_world_comments WHERE author=? AND created_at>=?"},
 {id:"give-like",emoji:"💜",title:"Like a post",uk:"Вподобай допис",xp:15,query:"SELECT COUNT(*) n FROM wrld_world_likes WHERE user_id=?"},
 {id:"join-club",emoji:"👥",title:"Join a club",uk:"Вступи до клубу",xp:40,query:"SELECT COUNT(*) n FROM wrld_world_members WHERE user_id=?"},
 {id:"arcade-add",emoji:"➕",title:"Win Math Add challenge",uk:"Виграй додавання",xp:15,required:1,query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND mode='add' AND created_at>=?"},
 {id:"arcade-multiply",emoji:"✖️",title:"Win Math Multiply challenge",uk:"Виграй множення",xp:20,required:1,query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND mode='multiply' AND created_at>=?"},
 {id:"arcade-three",emoji:"🎯",title:"Win 3 math rounds today",uk:"Виграй 3 математичні раунди",xp:35,required:3,query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND created_at>=?"}
];
async function questHandle(req,db,user){
 const currentDay=Math.floor(Date.now()/86400000),states=[];
 for(const q of QUESTS){
  const daily=q.id==="share-post"||q.id==="leave-comment"||q.id.startsWith("arcade-"),day=daily?currentDay:-1;
  const row=await (daily?db.prepare(q.query).bind(user.id,currentDay*86400000):db.prepare(q.query).bind(user.id)).first();
  const claim=await db.prepare("SELECT 1 FROM wrld_world_quest_claims WHERE user_id=? AND quest=? AND day=?").bind(user.id,q.id,day).first();
  states.push({id:q.id,emoji:q.emoji,title:q.title,uk:q.uk,xp:q.xp,complete:Number(row?.n||0)>=(q.required||1),claimed:!!claim,day});
 }
 if(req.method==="GET")return questReply({quests:states,reset_at:(currentDay+1)*86400000});
 if(req.method!=="POST")return err("Method not allowed",405);
 const raw=await req.text();if(raw.length>300)return err("Request too large",413);
 let input;try{input=JSON.parse(raw)}catch{return err("Invalid JSON",400)}
 const found=states.find(q=>q.id===input.id);if(!found)return err("Unknown quest",400);
 if(!found.complete)return err("Finish the quest before claiming",409);
 if(found.claimed)return err("Quest already claimed",409);
 const inserted=await db.prepare("INSERT OR IGNORE INTO wrld_world_quest_claims(user_id,quest,day,claimed_at) VALUES(?,?,?,?)").bind(user.id,found.id,found.day,Date.now()).run();
 if(Number(inserted.meta?.changes)!==1)return err("Quest already claimed",409);
 await db.prepare("INSERT INTO wrld_world_xp(id,user_id,action,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,"quest:"+found.id,found.xp,Date.now()).run();
 return questReply({ok:true,xp:found.xp});
}
export async function worldHandle(req,env,path,{auth,authorized}){
 if(!path.startsWith("/world/"))return null;
 await init(env.DB);
 const user=req.headers.get("Authorization")?await auth(req,env.DB):null;
 if(path==="/world/gallery")return err("House gallery retired",410);
 if(path==="/world/quests"&&req.method==="GET")return user?questHandle(req,env.DB,user):err("Sign in to view quests",401);
 if(path==="/world/quest/claim"&&req.method==="POST")return user?questHandle(req,env.DB,user):err("Sign in before claiming XP",401);
 if(["/world/ranking","/world/progress"].includes(path)&&req.method==="GET")return xpInfo(req,env,user);
 if(path==="/world/export"&&req.method==="GET")return user&&authorized(user)?worldExport(req,env,user):err("Verify Auth2FA before exporting private data.",403);
 if(req.method!=="GET"&&!authorized(user))return err("Verify Auth2FA for this session before posting.",403);
 let result;
 if(["/world/feed","/world/post","/world/like","/world/comments"].includes(path))result=await worldFeed(req,env.DB,user);
 else if(["/world/clubs","/world/club","/world/join"].includes(path))result=await worldClubs(req,env.DB,user);
 else if(["/world/comment","/world/follow"].includes(path))result=await worldDiscuss(req,env.DB,user);
 else return err("Not found",404);
 if(result.status===201&&user&&path==="/world/post")await award(env.DB,user.id,"post",15,3);
 if(result.status===201&&user&&path==="/world/club")await award(env.DB,user.id,"club",20,1);
 if(result.status===201&&user&&path==="/world/comment")await award(env.DB,user.id,"comment",4,5);
 return result;
}
