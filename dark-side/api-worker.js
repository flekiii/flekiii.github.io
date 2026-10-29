// Fleki's Dark Side — isolated Cloudflare Worker API. No secrets belong in this file.
const ORIGIN = "https://flekiii.github.io";
const encoder = new TextEncoder();
const now = () => Date.now();
const fail = (message, status=400) => ({error:message,status});
const asHex = bytes => [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
const randomHex = size => asHex(crypto.getRandomValues(new Uint8Array(size)));
const b64url = size => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(size)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const sha = async s => asHex(await crypto.subtle.digest("SHA-256",encoder.encode(s)));
const equal = (a,b) => {if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;};
const validName = s => typeof s==="string" && /^[a-zA-Z0-9_]{3,24}$/.test(s);
const validPass = s => typeof s==="string"&&s.length>=12&&s.length<=128;
async function derive(password,salt) {
  const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
  return asHex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:Uint8Array.from(salt.match(/../g).map(h=>parseInt(h,16))),iterations:210000,hash:"SHA-256"},key,256));
}
function response(data,status=200,origin=ORIGIN) {
  return new Response(JSON.stringify(data),{status,headers:{
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, max-age=0",
    "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
    "Access-Control-Allow-Origin":origin,"Vary":"Origin",
    "Access-Control-Allow-Headers":"Content-Type, Authorization",
    "Access-Control-Allow-Methods":"GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age":"600"
  }});
}
async function body(req) {
  if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw fail("Очікується JSON",415);
  const size=Number(req.headers.get("content-length")||0);
  if(size>32768) throw fail("Завеликий запит",413);
  const t=await req.text();if(t.length>32768)throw fail("Завеликий запит",413);
  try {const v=JSON.parse(t);if(!v||typeof v!=="object"||Array.isArray(v))throw 0;return v;}
  catch {throw fail("Некоректні дані");}
}
const publicUser = u => ({id:u.id,username:u.username,role:u.role,created_at:u.created_at});
async function session(req,db) {
  const bearer=req.headers.get("authorization")||"";
  if(!/^Bearer [a-zA-Z0-9_-]{40,100}$/.test(bearer))throw fail("Потрібна авторизація",401);
  const tokenHash=await sha(bearer.slice(7));
  const u=await db.prepare("SELECT a.id,a.username,a.role,a.enabled,a.created_at FROM sessions s JOIN accounts a ON a.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?").bind(tokenHash,now()).first();
  if(!u||!u.enabled)throw fail("Сесія недійсна",401);
  return {...u,tokenHash};
}
async function issue(db,u) {
  const token=b64url(32), at=now();
  await db.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)").bind(await sha(token),u.id,at,at+12*60*60*1000).run();
  return {token,user:publicUser(u),expires_at:at+12*60*60*1000};
}
async function throttled(db,key) {
  const row=await db.prepare("SELECT attempts,blocked_until FROM login_attempts WHERE key=?").bind(key).first();
  if(row && row.blocked_until>now())throw fail("Забагато спроб. Спробуй пізніше.",429);
}
async function wrong(db,key) {
  const at=now(), row=await db.prepare("SELECT attempts,updated_at FROM login_attempts WHERE key=?").bind(key).first();
  const attempts=row&&at-row.updated_at<15*60*1000 ? row.attempts+1:1;
  const blocked=attempts>=5?at+15*60*1000:0;
  await db.prepare("INSERT INTO login_attempts(key,attempts,blocked_until,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,blocked_until=excluded.blocked_until,updated_at=excluded.updated_at").bind(key,attempts,blocked,at).run();
}
function ownerOnly(u){if(u.role!=="owner")throw fail("Недостатньо прав",403);}
export default {
async fetch(req,env) {
  const origin=req.headers.get("origin");
  if(origin && origin!==ORIGIN) return response({error:"Origin denied"},403,"null");
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"GET, POST, PATCH, DELETE, OPTIONS","Access-Control-Max-Age":"600","Vary":"Origin"}});
  try {
    if(!env.DB||!env.BOOTSTRAP_HASH)throw fail("Сервер не налаштовано",503);
    const db=env.DB,path=new URL(req.url).pathname;
    if(path==="/health"&&req.method==="GET")return response({status:"ok",service:"dark-side"});
    if(path==="/bootstrap/status"&&req.method==="GET"){
      const found=await db.prepare("SELECT 1 FROM accounts WHERE role='owner' LIMIT 1").first();
      return response({ready:!!found});
    }
    if(path==="/bootstrap"&&req.method==="POST"){
      const existing=await db.prepare("SELECT 1 FROM accounts WHERE role='owner' LIMIT 1").first();
      if(existing)throw fail("Власника вже створено",409);
      const b=await body(req);
      if(!validName(b.username)||!validPass(b.password)||typeof b.setupKey!=="string")throw fail("Логін: 3–24 символи. Пароль: 12–128 символів.");
      const key=await sha(b.setupKey);
      if(!equal(key,env.BOOTSTRAP_HASH))throw fail("Невірний ключ власника",403);
      const salt=randomHex(16), pw=await derive(b.password,salt),at=now();
      const u={id:crypto.randomUUID(),username:b.username,role:"owner",created_at:at};
      try{await db.prepare("INSERT INTO accounts(id,username,salt,password_hash,role,enabled,created_at) VALUES(?,?,?,?,?,1,?)").bind(u.id,u.username,salt,pw,u.role,at).run();}
      catch {throw fail("Не вдалося створити власника (можливо, він уже існує)",409);}
      return response(await issue(db,u),201);
    }
    if(path==="/join"&&req.method==="POST"){
      const b=await body(req);
      if(!validName(b.username)||!validPass(b.password)||typeof b.inviteCode!=="string"||b.inviteCode.length>128)throw fail("Недійсні дані реєстрації");
      const codeHash=await sha(b.inviteCode),at=now();
      const active=await db.prepare("SELECT id FROM invites WHERE code_hash=? AND revoked_at IS NULL AND used_at IS NULL AND expires_at>?").bind(codeHash,at).first();
      if(!active)throw fail("Запрошення недійсне або вже використане",403);
      const id=crypto.randomUUID(),salt=randomHex(16),pw=await derive(b.password,salt);
      try{
        const results=await db.batch([
          db.prepare("UPDATE invites SET used_by=?,used_at=? WHERE id=? AND used_at IS NULL AND revoked_at IS NULL AND expires_at>?").bind(id,at,active.id,at),
          db.prepare("INSERT INTO accounts(id,username,salt,password_hash,role,enabled,created_at) SELECT ?,?,?,?,'member',1,? WHERE EXISTS(SELECT 1 FROM invites WHERE id=? AND used_by=? AND used_at=?)").bind(id,b.username,salt,pw,at,active.id,id,at)
        ]);
        if(results[0]?.meta?.changes!==1||results[1]?.meta?.changes!==1)throw fail("Запрошення вже використане",409);
      }catch(e){if(e?.status)throw e;throw fail("Логін зайнятий або запрошення недійсне",409);}
      return response(await issue(db,{id,username:b.username,role:"member",created_at:at}),201);
    }
    if(path==="/login"&&req.method==="POST"){
      const b=await body(req);
      if(typeof b.username!=="string"||typeof b.password!=="string"||b.username.length>60||b.password.length>200)throw fail("Невірний логін або пароль",401);
      const key=await sha((req.headers.get("cf-connecting-ip")||"unknown")+"|"+b.username.toLowerCase());
      await throttled(db,key);
      const u=await db.prepare("SELECT * FROM accounts WHERE username=? AND enabled=1").bind(b.username).first();
      if(!u||!equal(await derive(b.password,u.salt),u.password_hash)){
        await wrong(db,key);throw fail("Невірний логін або пароль",401);
      }
      await db.prepare("DELETE FROM login_attempts WHERE key=?").bind(key).run();
      return response(await issue(db,u));
    }
    const u=await session(req,db);
    if(path==="/me"&&req.method==="GET")return response({user:publicUser(u)});
    if(path==="/logout"&&req.method==="POST"){
      await db.prepare("DELETE FROM sessions WHERE token_hash=?").bind(u.tokenHash).run();
      return response({ok:true});
    }
    if(path==="/entries"&&req.method==="GET"){
      const records=await db.prepare("SELECT id,title,body,created_at,updated_at FROM entries ORDER BY created_at DESC LIMIT 100").all();
      return response({entries:records.results||[]});
    }
    if(path==="/entries"&&req.method==="POST"){
      ownerOnly(u);const b=await body(req);
      if(typeof b.title!=="string"||!b.title.trim()||b.title.length>100||typeof b.body!=="string"||!b.body.trim()||b.body.length>8000)throw fail("Назва 1–100, вміст 1–8000 символів");
      const id=crypto.randomUUID(),at=now();
      await db.prepare("INSERT INTO entries(id,title,body,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?)").bind(id,b.title.trim(),b.body.trim(),u.id,at,at).run();
      return response({id},201);
    }
    const entryId=path.match(/^\/entries\/([a-z0-9-]+)$/);
    if(entryId&&req.method==="DELETE"){
      ownerOnly(u);
      await db.prepare("DELETE FROM entries WHERE id=?").bind(entryId[1]).run();
      return response({ok:true});
    }
    ownerOnly(u);
    if(path==="/members"&&req.method==="GET"){
      const rows=await db.prepare("SELECT id,username,role,enabled,created_at FROM accounts ORDER BY created_at DESC LIMIT 200").all();
      return response({members:rows.results||[]});
    }
    const m=path.match(/^\/members\/([a-z0-9-]+)$/);
    if(m&&req.method==="PATCH"){
      const b=await body(req);
      if(typeof b.enabled!=="boolean")throw fail("Очікується enabled");
      const target=await db.prepare("SELECT role FROM accounts WHERE id=?").bind(m[1]).first();
      if(!target)throw fail("Користувача не знайдено",404);
      if(target.role==="owner")throw fail("Не можна змінити власника",403);
      await db.batch([
        db.prepare("UPDATE accounts SET enabled=? WHERE id=?").bind(b.enabled?1:0,m[1]),
        db.prepare("DELETE FROM sessions WHERE user_id=?").bind(m[1])
      ]);
      return response({ok:true});
    }
    if(path==="/invites"&&req.method==="GET"){
      const rows=await db.prepare("SELECT id,created_at,expires_at,used_at,revoked_at FROM invites ORDER BY created_at DESC LIMIT 100").all();
      return response({invites:rows.results||[]});
    }
    if(path==="/invites"&&req.method==="POST"){
      const b=await body(req);
      const ttl=Number(b.ttlHours??48);
      if(!Number.isInteger(ttl)||ttl<1||ttl>168)throw fail("Термін дії: 1–168 годин");
      const code=b64url(24),id=crypto.randomUUID(),at=now(),expiry=at+ttl*60*60*1000;
      await db.prepare("INSERT INTO invites(id,code_hash,created_by,expires_at,created_at) VALUES(?,?,?,?,?)").bind(id,await sha(code),u.id,expiry,at).run();
      return response({id,code,expires_at:expiry},201);
    }
    const inv=path.match(/^\/invites\/([a-z0-9-]+)$/);
    if(inv&&req.method==="DELETE"){
      await db.prepare("UPDATE invites SET revoked_at=? WHERE id=? AND used_at IS NULL").bind(now(),inv[1]).run();
      return response({ok:true});
    }
    return response({error:"Не знайдено"},404);
  }catch(e){
    if(e&&typeof e.status==="number"&&typeof e.error==="string")return response({error:e.error},e.status);
    console.error("dark-side error",e?.message||"unknown");
    return response({error:"Помилка сервера"},500);
  }
}};