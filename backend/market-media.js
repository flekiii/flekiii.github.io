/* Real 4 MiB marketplace photos; D1 chunks stay under its per-BLOB size limit. */
const HOST="https://flekis-wrld-api.flekideveloper.workers.dev";
const ORIGIN="https://flekiii.github.io",MAX=4*1024*1024,CHUNK=512*1024;
const j=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":ORIGIN}});
const id=x=>typeof x==="string"&&/^[a-f0-9-]{36}$/i.test(x);
function mime(bytes){
 if(bytes.length>8&&[137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x))return "image/png";
 if(bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return "image/jpeg";
 if(bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "image/webp";
 return null;
}
export async function marketMedia(req,env,path,{auth,authorized}){
 if(path!=="/market/media"&&!/^\/market\/media\/[a-f0-9-]{36}$/i.test(path))return null;
 const db=env.DB,method=req.method,user=await auth(req,db),mediaId=path.split("/").at(-1);
 if(method==="POST"&&path==="/market/media"){
  if(!user)return j({error:"Sign in first"},401);
  if(!authorized(user))return j({error:"Verify Auth2FA to upload marketplace photos"},403);
  const declared=Number(req.headers.get("Content-Length")||0);
  if(declared>MAX)return j({error:"Each photo must be 4 MB or less"},413);
  const body=new Uint8Array(await req.arrayBuffer());
  if(body.length<32||body.length>MAX)return j({error:"Image must be between 32 bytes and 4 MB"},413);
  const actual=mime(body);if(!actual)return j({error:"Upload PNG, JPEG or WebP only"},415);
  const quota=await db.prepare("SELECT COUNT(*) c FROM market_uploaded_media WHERE owner=?").bind(user.id).first();
  if(Number(quota?.c||0)>=12)return j({error:"12 uploaded images per account maximum. Remove unused uploads to add more."},429);
  const recent=await db.prepare("SELECT COUNT(*) c FROM market_uploaded_media WHERE owner=? AND created_at>?").bind(user.id,Date.now()-60000).first();
  if(Number(recent?.c||0)>=4)return j({error:"Maximum 4 photo uploads per minute"},429);
  const uuid=crypto.randomUUID(),chunks=Array.from({length:Math.ceil(body.length/CHUNK)},(_,i)=>body.slice(i*CHUNK,Math.min((i+1)*CHUNK,body.length)));
  await db.batch([db.prepare("INSERT INTO market_uploaded_media(id,owner,mime,size,created_at) VALUES(?,?,?,?,?)").bind(uuid,user.id,actual,body.length,Date.now()),
   ...chunks.map((part,i)=>db.prepare("INSERT INTO market_uploaded_chunks(media_id,part,data) VALUES(?,?,?)").bind(uuid,i,part))]);
  return j({id:uuid,url:HOST+"/market/media/"+uuid,size:body.length,mime:actual},201);
 }
 if(!id(mediaId))return j({error:"Invalid image"},400);
 const media=await db.prepare("SELECT id,owner,mime,size FROM market_uploaded_media WHERE id=?").bind(mediaId).first();
 if(!media)return j({error:"Image not found"},404);
 const used=await db.prepare("SELECT 1 FROM market_listings WHERE status='active' AND instr(images,?)>0 LIMIT 1").bind(mediaId).first();
 if(method==="GET"){
  if(!used&&user?.id!==media.owner)return j({error:"Image unavailable"},404);
  const parts=(await db.prepare("SELECT data FROM market_uploaded_chunks WHERE media_id=? ORDER BY part").bind(mediaId).all()).results||[];
  const bytes=new Uint8Array(media.size);let offset=0;
  for(const row of parts){const part=new Uint8Array(row.data);if(offset+part.length>bytes.length)return j({error:"Corrupt photo"},500);bytes.set(part,offset);offset+=part.length}
  if(offset!==bytes.length)return j({error:"Incomplete photo"},500);
  return new Response(bytes,{headers:{"Content-Type":media.mime,"Cache-Control":used?"public,max-age=3600":"private,no-store","Access-Control-Allow-Origin":ORIGIN,"X-Content-Type-Options":"nosniff"}});
 }
 if(method==="DELETE"){
  if(user?.id!==media.owner)return j({error:"Not allowed"},403);
  if(used)return j({error:"Remove the image from your listing first"},409);
  await db.batch([db.prepare("DELETE FROM market_uploaded_chunks WHERE media_id=?").bind(mediaId),db.prepare("DELETE FROM market_uploaded_media WHERE id=?").bind(mediaId)]);
  return j({ok:true});
 }
 return j({error:"Method not allowed"},405);
}
