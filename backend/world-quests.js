/* 137 server-verified World quests: seven legacy goals + 130 real milestones.
   Only whitelisted, authenticated D1 events count toward rewards. */
const ORIGIN="https://flekiii.github.io";
const headers={"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":ORIGIN,"Vary":"Origin","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const periods={daily:"daily",once:"once"};
const DAY=86400000;
const milestones=[1,2,3,5,8,12,20,30,50,75];
const dailyMilestones=[1,2,3,4,5,6,8,10,12,16];
export const metrics=[
 {id:"posts",emoji:"✍️",title:"Publish posts",uk:"Публікуй дописи",period:"once",query:"SELECT COUNT(*) n FROM wrld_world_posts WHERE author=?"},
 {id:"posts-today",emoji:"📝",title:"Publish posts today",uk:"Дописи сьогодні",period:"daily",query:"SELECT COUNT(*) n FROM wrld_world_posts WHERE author=? AND created_at>=?"},
 {id:"comments",emoji:"💬",title:"Write comments",uk:"Пиши коментарі",period:"once",query:"SELECT COUNT(*) n FROM wrld_world_comments WHERE author=?"},
 {id:"comments-today",emoji:"🗣️",title:"Comment today",uk:"Коментарі сьогодні",period:"daily",query:"SELECT COUNT(*) n FROM wrld_world_comments WHERE author=? AND created_at>=?"},
 {id:"likes",emoji:"💜",title:"Like unique posts",uk:"Вподобай дописи",period:"once",query:"SELECT COUNT(*) n FROM wrld_world_likes WHERE user_id=?"},
 {id:"clubs-joined",emoji:"👥",title:"Join clubs",uk:"Вступай до клубів",period:"once",query:"SELECT COUNT(*) n FROM wrld_world_members WHERE user_id=?"},
 {id:"clubs-created",emoji:"🏠",title:"Create clubs",uk:"Створюй клуби",period:"once",query:"SELECT COUNT(*) n FROM wrld_world_clubs WHERE owner=?"},
 {id:"follows",emoji:"🤝",title:"Follow members",uk:"Підписуйся на людей",period:"once",query:"SELECT COUNT(*) n FROM wrld_world_follows WHERE follower=?"},
 {id:"math-add",emoji:"➕",title:"Win addition rounds",uk:"Перемагай у додаванні",period:"once",query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND mode='add'"},
 {id:"math-multiply",emoji:"✖️",title:"Win multiplication rounds",uk:"Перемагай у множенні",period:"once",query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND mode='multiply'"},
 {id:"math-total",emoji:"🎯",title:"Win math challenges",uk:"Математичні перемоги",period:"once",query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=?"},
 {id:"math-today",emoji:"⚡",title:"Win challenges today",uk:"Перемоги сьогодні",period:"daily",query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND created_at>=?"},
 {id:"math-add-today",emoji:"🌟",title:"Win addition today",uk:"Додавання сьогодні",period:"daily",query:"SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND mode='add' AND created_at>=?"}
];
const legacy=[
 {id:"share-post",emoji:"✍️",title:"Share a post",uk:"Опублікуй допис",xp:30,metric:"posts-today",required:1,period:"daily"},
 {id:"leave-comment",emoji:"💬",title:"Write a comment",uk:"Напиши коментар",xp:20,metric:"comments-today",required:1,period:"daily"},
 {id:"give-like",emoji:"💜",title:"Like a post",uk:"Вподобай допис",xp:15,metric:"likes",required:1,period:"once"},
 {id:"join-club",emoji:"👥",title:"Join a club",uk:"Вступи до клубу",xp:40,metric:"clubs-joined",required:1,period:"once"},
 {id:"arcade-add",emoji:"➕",title:"Win Math Add challenge",uk:"Виграй додавання",xp:15,metric:"math-add-today",required:1,period:"daily"},
 {id:"arcade-multiply",emoji:"✖️",title:"Win Math Multiply challenge",uk:"Виграй множення",xp:20,metric:"math-today",required:1,period:"daily",override:"multiply-today"},
 {id:"arcade-three",emoji:"🎯",title:"Win 3 math rounds today",uk:"Виграй 3 математичні раунди",xp:35,metric:"math-today",required:3,period:"daily"}
];
const extra=metrics.flatMap(m=>(m.period==="daily"?dailyMilestones:milestones).map((n,index)=>({
 id:m.id+"-"+n,emoji:m.emoji,title:m.title+" · "+n,uk:m.uk+" · "+n,
 xp:Math.min(30,3+index*2),metric:m.id,required:n,period:m.period,group:m.id
})));
export const QUESTS=Object.freeze([...legacy,...extra]);
export async function questHandle(req,db,user){
 const now=Date.now(),currentDay=Math.floor(now/DAY),dayStart=currentDay*DAY;
 if(req.method!=="GET"&&req.method!=="POST")return reply({error:"Method not allowed"},405);
 let requestId="";
 if(req.method==="POST"){
  const raw=await req.text();if(raw.length>300)return reply({error:"Request too large"},413);
  let body;try{body=JSON.parse(raw)}catch{return reply({error:"Invalid JSON"},400)}
  requestId=typeof body?.id==="string"?body.id:"";
  if(!QUESTS.some(q=>q.id===requestId))return reply({error:"Unknown quest"},400);
 }
 const metricIds=new Set(req.method==="POST"?[QUESTS.find(q=>q.id===requestId).metric]:metrics.map(m=>m.id));
 if(req.method==="POST"&&requestId==="arcade-multiply")metricIds.add("math-today");
 const metricQueries=metrics.filter(m=>metricIds.has(m.id));
 const counts=new Map(await Promise.all(metricQueries.map(async metric=>{
  const bind=metric.period==="daily"?[user.id,dayStart]:[user.id];
  const row=await db.prepare(metric.query).bind(...bind).first();
  return [metric.id,Number(row?.n||0)];
 })));
 // Legacy multiply quest is checked against multiplication-only wins today.
 if(req.method==="GET"||requestId==="arcade-multiply"){
  const row=await db.prepare("SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND mode='multiply' AND created_at>=?").bind(user.id,dayStart).first();
  counts.set("multiply-today",Number(row?.n||0));
 }
 const relevant=req.method==="POST"?QUESTS.filter(q=>q.id===requestId):QUESTS;
 const claimRows=req.method==="GET"?(await db.prepare("SELECT quest,day FROM wrld_world_quest_claims WHERE user_id=? AND (day=? OR day=-1)").bind(user.id,currentDay).all()).results||[]:[];
 const claimed=new Set(claimRows.map(row=>row.quest+"|"+row.day));
 const states=relevant.map(q=>{
  const day=q.period==="daily"?currentDay:-1;
  const completed=(counts.get(q.override||q.metric)||0)>=q.required;
  return {...q,complete:completed,claimed:claimed.has(q.id+"|"+day),day,current:counts.get(q.override||q.metric)||0};
 });
 if(req.method==="GET")return reply({quests:states,reset_at:(currentDay+1)*DAY,total:QUESTS.length,groups:metrics.map(m=>({id:m.id,title:m.title,uk:m.uk,emoji:m.emoji}))});
 const found=states[0];
 if(!found.complete)return reply({error:"Finish the quest before claiming",current:found.current,required:found.required},409);
 const inserted=await db.prepare("INSERT OR IGNORE INTO wrld_world_quest_claims(user_id,quest,day,claimed_at) VALUES(?,?,?,?)").bind(user.id,found.id,found.day,now).run();
 if(Number(inserted.meta?.changes)!==1)return reply({error:"Quest already claimed"},409);
 await db.prepare("INSERT INTO wrld_world_xp(id,user_id,action,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,"quest:"+found.id,found.xp,now).run();
 return reply({ok:true,xp:found.xp,id:found.id});
}
