// Separate OAuth module for Fleki's Wrld; no provider secrets in frontend.
const SITE="https://flekiii.github.io/";
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const e=new TextEncoder(),d=new TextDecoder();
const providers={
  fmail:{auth:"https://xoni-mail.onrender.com/oauth/authorize",token:"https://xoni-mail.onrender.com/oauth/token",scope:"profile"},
  google:{id:"GOOGLE_CLIENT_ID",secret:"GOOGLE_CLIENT_SECRET",auth:"https://accounts.google.com/o/oauth2/v2/auth",token:"https://oauth2.googleapis.com/token",scope:"openid profile"},
  apple:{id:"APPLE_CLIENT_ID",team:"APPLE_TEAM_ID",kid:"APPLE_KEY_ID",key:"APPLE_PRIVATE_KEY",auth:"https://appleid.apple.com/auth/authorize",token:"https://appleid.apple.com/auth/token",scope:"openid"},
  github:{id:"GITHUB_CLIENT_ID",secret:"GITHUB_CLIENT_SECRET",auth:"https://github.com/login/oauth/authorize",token:"https://github.com/login/oauth/access_token",scope:"read:user"},
  discord:{id:"DISCORD_CLIENT_ID",secret:"DISCORD_CLIENT_SECRET",auth:"https://discord.com/oauth2/authorize",token:"https://discord.com/api/oauth2/token",scope:"identify"}
};
const enc=x=>btoa(String.fromCharCode(...x)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const dec=x=>Uint8Array.from(atob(x.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const rand=n=>crypto.getRandomValues(new Uint8Array(n));
const sha=async v=>enc(new Uint8Array(await crypto.subtle.digest("SHA-256",e.encode(v))));
const stmt=(db,sql,...args)=>db.prepare(sql).bind(...args);
const first=(db,sql,...args)=>stmt(db,sql,...args).first();
const sql=(db,q,...args)=>stmt(db,q,...args).run();
const respond=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":SITE.slice(0,-1),"Vary":"Origin"}});
const fail=(msg,status=400)=>respond({error:msg},status);
const available=(env,p)=>{const c=providers[p];return p==="fmail"||!!(c&&env[c.id]&&(p==="apple"?env[c.team]&&env[c.kid]&&env[c.key]:env[c.secret]))};
const redirectUri=p=>API+"/auth/oauth/callback/"+p;
const siteError=message=>Response.redirect(SITE+"#profile?oauth_error="+encodeURIComponent(message),303);
function tokenParts(jwt){const a=jwt.split(".");if(a.length!==3)throw Error("Malformed provider identity token");return {h:JSON.parse(d.decode(dec(a[0]))),p:JSON.parse(d.decode(dec(a[1]))),sig:dec(a[2]),text:a[0]+"."+a[1]}}
async function appleJWT(env){
 const now=Math.floor(Date.now()/1000);
 const header=enc(e.encode(JSON.stringify({alg:"ES256",typ:"JWT",kid:env.APPLE_KEY_ID})));
 const payload=enc(e.encode(JSON.stringify({iss:env.APPLE_TEAM_ID,iat:now,exp:now+3600,aud:"https://appleid.apple.com",sub:env.APPLE_CLIENT_ID})));
 const keyBytes=Uint8Array.from(atob(env.APPLE_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"")),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey("pkcs8",keyBytes,{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
 const signature=new Uint8Array(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},key,e.encode(header+"."+payload)));
 return header+"."+payload+"."+enc(signature);
}
async function appleIdentity(token,env,nonce){
 const p=tokenParts(token);
 if(p.h.alg!=="RS256"||!p.h.kid)throw Error("Bad Apple signing algorithm");
 const response=await fetch("https://appleid.apple.com/auth/keys");
 if(!response.ok)throw Error("Apple keys unavailable");
 const keys=(await response.json()).keys||[];
 const jwk=keys.find(k=>k.kid===p.h.kid&&k.kty==="RSA");
 if(!jwk)throw Error("Unknown Apple signing key");
 const k=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",k,p.sig,e.encode(p.text)))throw Error("Invalid Apple signature");
 const claims=p.p,now=Math.floor(Date.now()/1000);
 if(claims.aud!==env.APPLE_CLIENT_ID||claims.iss!=="https://appleid.apple.com"||claims.exp<=now||claims.nonce!==nonce||!claims.sub)throw Error("Invalid Apple identity claims");
 return {subject:String(claims.sub),name:"Apple member"};
}
async function getIdentity(provider,token,env,nonce){
 if(provider==="apple")return appleIdentity(token.id_token,env,nonce);
 if(!token.access_token)throw Error("Missing provider access token");
 const endpoint={fmail:"https://xoni-mail.onrender.com/oauth/userinfo",google:"https://openidconnect.googleapis.com/v1/userinfo",github:"https://api.github.com/user",discord:"https://discord.com/api/users/@me"}[provider];
 const request=await fetch(endpoint,{headers:{"Authorization":"Bearer "+token.access_token,"Accept":"application/json","User-Agent":"Flekis-Wrld"}});
 if(!request.ok)throw Error("Provider identity lookup failed");
 const user=await request.json();
 const sub=user.sub||user.id;
 if(!sub)throw Error("Missing provider account ID");
 return {subject:String(sub),name:String(user.name||user.global_name||user.login||user.username||provider+" member").slice(0,60),mfa_verified:provider==="fmail"&&user.mfa_verified===true};
}
async function start(env,p){
 if(!available(env,p))return fail("This provider is awaiting OAuth configuration.",503);
 const c=providers[p],state=enc(rand(30)),nonce=enc(rand(16)),verifier=enc(rand(32)),now=Date.now();
 const params={client_id:p==="fmail"?"flekis-wrld":env[c.id],redirect_uri:redirectUri(p),response_type:"code",scope:c.scope,state};
 if(p==="google"||p==="fmail"){params.nonce=nonce;params.code_challenge=await sha(verifier);params.code_challenge_method="S256";if(p==="google")params.prompt="select_account"}
 if(p==="apple"){params.nonce=nonce;params.response_mode="form_post"}
 await sql(env.DB,"INSERT INTO oauth_states(state_hash,provider,nonce,verifier,expires_at) VALUES(?,?,?,?,?)",await sha(state),p,nonce,verifier,now+600000);
 const url=new URL(c.auth);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
 return new Response(null,{status:302,headers:{"Location":url.toString(),"Cache-Control":"no-store","Referrer-Policy":"no-referrer","Set-Cookie":"wrld_oauth="+state+"; Path=/auth/oauth; Max-Age=600; Secure; HttpOnly; SameSite="+(p==="apple"?"None":"Lax")}});
}
async function callback(req,env,p){
 if(!available(env,p))return siteError("provider_not_ready");
 const input=req.method==="POST"?new URLSearchParams(await req.text()):new URL(req.url).searchParams;
 if(input.has("error"))return siteError("permission_denied");
 const state=input.get("state")||"",code=input.get("code")||"";
 const cookie=(req.headers.get("Cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("wrld_oauth="))?.slice("wrld_oauth=".length)||"";
 if(!/^[A-Za-z0-9_-]{40}$/.test(state)||state!==cookie||!code||code.length>3000)return siteError("security_check_failed");
 const key=await sha(state);
 const record=await first(env.DB,"SELECT provider,nonce,verifier,expires_at FROM oauth_states WHERE state_hash=?",key);
 if(!record||record.provider!==p||record.expires_at<Date.now())return siteError("login_expired");
 await sql(env.DB,"DELETE FROM oauth_states WHERE state_hash=?",key);
 const c=providers[p],form=new URLSearchParams({client_id:p==="fmail"?"flekis-wrld":env[c.id],code,redirect_uri:redirectUri(p),grant_type:"authorization_code"});
 if(p!=="fmail")form.set("client_secret",p==="apple"?await appleJWT(env):env[c.secret]);
 if(p==="google"||p==="fmail")form.set("code_verifier",record.verifier);
 const response=await fetch(c.token,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},body:form.toString()});
 if(!response.ok)return siteError("oauth_exchange_failed");
 const profile=await getIdentity(p,await response.json(),env,record.nonce);
 const stored=await first(env.DB,"SELECT user_id FROM oauth_identities WHERE provider=? AND subject=?",p,profile.subject);
 let userId=stored?.user_id;
 if(!userId){
  userId=crypto.randomUUID();
  const username=p+"_"+enc(rand(7)).replace(/[^a-zA-Z0-9]/g,"").slice(0,10).toLowerCase();
  await env.DB.batch([
   stmt(env.DB,"INSERT INTO users(id,username,display_name,bio,salt,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",userId,username,profile.name.trim()||p+" member","",enc(rand(16)),enc(rand(32)),Date.now(),Date.now()),
   stmt(env.DB,"INSERT INTO oauth_identities(provider,subject,user_id,created_at) VALUES(?,?,?,?)",p,profile.subject,userId,Date.now())
  ]);
 }
 const ticket=enc(rand(32));
 await sql(env.DB,"INSERT INTO oauth_tickets(ticket_hash,user_id,expires_at,external_mfa) VALUES(?,?,?,?)",await sha(ticket),userId,Date.now()+90000,p==="fmail"&&profile.mfa_verified?1:0);
 return new Response(null,{status:303,headers:{"Location":SITE+"#profile?oauth_ticket="+ticket,"Cache-Control":"no-store","Referrer-Policy":"no-referrer","Set-Cookie":"wrld_oauth=; Path=/auth/oauth; Max-Age=0; Secure; HttpOnly; SameSite=Lax"}});
}
async function redeem(req,env){
 const data=await req.json(),ticket=String(data.ticket||"");
 if(!/^[A-Za-z0-9_-]{43}$/.test(ticket))return fail("Invalid login ticket.");
 const h=await sha(ticket),r=await first(env.DB,"SELECT user_id,expires_at,external_mfa FROM oauth_tickets WHERE ticket_hash=?",h);
 if(!r||r.expires_at<Date.now())return fail("Sign-in link expired.",401);
 await sql(env.DB,"DELETE FROM oauth_tickets WHERE ticket_hash=?",h);
 const token=enc(rand(32));
 await sql(env.DB,"INSERT INTO sessions(token_hash,user_id,mfa_verified,created_at,expires_at,external_mfa) VALUES(?,?,?,?,?,?)",await sha(token),r.user_id,r.external_mfa?1:0,Date.now(),Date.now()+604800000,r.external_mfa?1:0);
 return respond({token});
}
export async function oauthHandle(req,env,path){
 if(req.method==="GET"&&path==="/auth/providers")return respond({providers:Object.fromEntries(Object.keys(providers).map(p=>[p,available(env,p)]))});
 if(req.method==="GET"&&path.startsWith("/auth/oauth/start/"))return start(env,path.slice("/auth/oauth/start/".length));
 if((req.method==="GET"||req.method==="POST")&&path.startsWith("/auth/oauth/callback/")){
  try{return await callback(req,env,path.slice("/auth/oauth/callback/".length))}catch{return siteError("sign_in_failed")}
 }
 if(req.method==="POST"&&path==="/auth/oauth/redeem")return redeem(req,env);
 return null;
}
