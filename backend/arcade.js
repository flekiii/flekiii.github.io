/* Authoritative math mini-game rounds. Client never receives the answer. */
const ORIGIN="https://flekiii.github.io",json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":ORIGIN,"Cache-Control":"no-store"}});
export async function arcadeHandle(req,env,path,{auth}){
 if(!path.startsWith("/arcade/"))return null;
 const user=await auth(req,env.DB);
 if(!user)return json({error:"Sign in to play and earn XP"},401);
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const raw=await req.text();if(raw.length>300)return json({error:"Invalid game request"},400);
 let body;try{body=JSON.parse(raw)}catch{return json({error:"Invalid JSON"},400)}
 const db=env.DB,now=Date.now(),today=Math.floor(now/86400000)*86400000;
 if(path==="/arcade/start"){
  const mode=String(body.mode||"");
  if(!["add","multiply"].includes(mode))return json({error:"Unknown math game"},400);
  const history=await db.prepare("SELECT COUNT(*) n FROM wrld_arcade_wins WHERE user_id=? AND created_at>=?").bind(user.id,today).first();
  const rounds=await db.prepare("SELECT COUNT(*) n FROM wrld_arcade_rounds WHERE user_id=? AND created_at>=?").bind(user.id,today).first();
  if(Number(rounds?.n||0)>=24)return json({error:"Daily challenge limit reached. Come back tomorrow!"},429);
  const a=mode==="add"?2+Math.floor(Math.random()*88):2+Math.floor(Math.random()*11),b=mode==="add"?2+Math.floor(Math.random()*88):2+Math.floor(Math.random()*11);
  const id=crypto.randomUUID(),answer=mode==="add"?a+b:a*b;
  await db.prepare("INSERT INTO wrld_arcade_rounds(id,user_id,mode,answer,used,created_at) VALUES(?,?,?,?,0,?)").bind(id,user.id,mode,answer,now).run();
  return json({id,mode,question:a+(mode==="add"?" + ":" × ")+b+" = ?",remaining:Math.max(0,24-Number(rounds?.n||0)-1),daily_wins:Number(history?.n||0)},201);
 }
 if(path==="/arcade/answer"){
  const id=String(body.id||""),answer=Number(body.answer);
  if(!/^[a-f0-9-]{36}$/i.test(id)||!Number.isInteger(answer)||answer<0||answer>500)return json({error:"Invalid answer"},400);
  const row=await db.prepare("SELECT answer,mode,created_at,used FROM wrld_arcade_rounds WHERE id=? AND user_id=?").bind(id,user.id).first();
  if(!row||row.used!==0||now-Number(row.created_at)>120000)return json({error:"Round expired. Start a new one."},409);
  const update=await db.prepare("UPDATE wrld_arcade_rounds SET used=1 WHERE id=? AND user_id=? AND used=0").bind(id,user.id).run();
  if(Number(update.meta?.changes)!==1)return json({error:"Round already finished"},409);
  const win=answer===row.answer;
  if(win){
   await db.prepare("INSERT INTO wrld_arcade_wins(round_id,user_id,mode,created_at) VALUES(?,?,?,?)").bind(id,user.id,row.mode,now).run();
   const prior=await db.prepare("SELECT COUNT(*) n FROM wrld_world_xp WHERE user_id=? AND action='arcade-win' AND created_at>=?").bind(user.id,today).first();
   if(Number(prior?.n||0)<6)await db.prepare("INSERT INTO wrld_world_xp(id,user_id,action,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,"arcade-win",5,now).run();
  }
  return json({correct:win,answer:row.answer,earned:win?5:0,message:win?"Correct! Great job!":"Not quite — try another round!"});
 }
 return json({error:"Not found"},404);
}