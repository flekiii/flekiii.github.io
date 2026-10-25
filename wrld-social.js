/* Fleki's Wrld — Cloudflare D1 community client (independent of other projects). */
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const root=document.getElementById("wrld-community-root"),alerts=document.getElementById("wrld-notifications-root"),accountRoot=document.getElementById("wrld-account-root");
const esc=x=>String(x??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
const time=x=>new Date(x).toLocaleString("en",{dateStyle:"short",timeStyle:"short"});
const S={token:sessionStorage.getItem("fw-token")||"",user:null,providers:{google:false,apple:false,github:false,discord:false},tab:"global",mode:"login",friends:[],blocks:[],contactPins:[],messages:[],pins:[],dm:[],dmPins:[],notifications:[],people:[],query:"",peer:null,secret:null,recovery:null,error:""};
let pending=false;
const button=(t,act,id="")=>'<button type="button" class="social-mini" data-action="'+esc(act)+'" data-id="'+esc(id)+'">'+esc(t)+'</button>';
const msg=x=>{S.error=x;for(const id of ["fw-feedback","fw-profile-feedback"]){const n=document.getElementById(id);if(n)n.textContent=x}};
const openProfile=()=>{const link=document.querySelector("#dock [data-go=\"profile\"]");if(link)link.click();};
async function api(path,method="GET",body=null){
 const headers={Accept:"application/json"};if(S.token)headers.Authorization="Bearer "+S.token;if(body!==null)headers["Content-Type"]="application/json";
 const response=await fetch(API+path,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:"no-store",mode:"cors"});
 const data=await response.json().catch(()=>({error:"Invalid server response."}));
 if(!response.ok){if(response.status===401&&path!=="/auth/login"){S.token="";sessionStorage.removeItem("fw-token");S.user=null}throw Error(data.error||"Server error "+response.status)}
 return data;
}
function verified(){return !!S.user?.mfa_verified}
function ensure2fa(){if(!S.user){openProfile();msg("Sign in first.");return false}if(!verified()){openProfile();msg("Verified authenticator 2FA is required.");return false}return true}
function userRow(u,actions){return '<div class="social-person"><div class="social-person-main"><strong>'+esc(u.display_name||u.name||u.username)+'</strong><small>@'+esc(u.username)+'</small></div><div class="social-person-actions">'+actions+'</div></div>'}
function renderPasswordToggle(type){const btn=document.querySelector(".auth-show-password");if(btn){btn.textContent=type==="password"?"Show":"Hide";btn.setAttribute("aria-label",type==="password"?"Show password":"Hide password")}}
function account(){
 if(!S.user){
 const method=(name,icon,key)=>'<button type="button" class="auth-provider '+(S.providers?.[key]?'ready':'unavailable')+'" data-action="oauth" data-id="'+key+'" '+(S.providers?.[key]?'':'disabled title="Provider setup pending"')+'><span class="auth-provider-icon '+key+'">'+icon+'</span><span>Continue with '+name+'</span><span class="auth-provider-status">'+(S.providers?.[key]?'→':'Soon')+'</span></button>';
 const providers=method('fmail','✦','fmail')+method('Google','G','google')+method('Apple','●','apple')+method('GitHub','⌘','github')+method('Discord','◈','discord');
 const signup=S.mode==="register";
 return '<div class="auth-experience"><section class="auth-main"><div class="auth-kicker">FLEKI’S WRLD ID</div><div class="auth-heading"><span class="auth-logo" aria-hidden="true">f.</span><div><h2>'+(signup?'Create your account':'Welcome back')+'</h2><p>'+(signup?'Start your journey in a world made for everyone.':'Your world, your people. Good to see you again.')+'</p></div></div><div class="auth-switcher" role="group" aria-label="Sign in or register"><button type="button" class="'+(!signup?'active':'')+'" data-action="mode" data-id="login">Sign in</button><button type="button" class="'+(signup?'active':'')+'" data-action="mode" data-id="register">Create account</button></div><form id="fw-auth" class="auth-fields"><label>Username <input class="social-input" name="username" pattern="[a-z][a-z0-9_]{2,23}" maxlength="24" autocomplete="username" placeholder="your_username" required></label>'+(signup?'<label>Display name <input class="social-input" name="display_name" maxlength="60" placeholder="How should we call you?" required></label>':'')+'<label>Password <span class="auth-input-wrap"><input class="social-input" name="password" type="password" minlength="'+(signup?'12':'1')+'" maxlength="128" autocomplete="'+(signup?'new-password':'current-password')+'" placeholder="'+(signup?'At least 12 characters':'Enter your password')+'" required><button type="button" class="auth-show-password" data-action="showpass" aria-label="Show password">Show</button></span></label><button class="btn primary auth-submit" type="submit">'+(signup?'Create my account':'Sign in to my world')+' <span aria-hidden="true">↗</span></button></form><div class="auth-divider"><span>or continue with</span></div><div class="auth-provider-grid">'+providers+'</div><p class="auth-provider-note">Social sign-in becomes available as each provider is securely configured. Your Fleki’s Wrld 2FA is still required before sending messages or adding friends.</p></section><aside class="auth-welcome"><span class="auth-welcome-symbol">✦</span><div class="auth-welcome-content"><span class="auth-kicker">ONE WORLD. INFINITE POSSIBILITIES.</span><h3>Make it <em>your world.</em></h3><p>A community for ideas, friends, games and things still waiting to be created.</p><div class="auth-welcome-points"><span>✦ A space that feels yours</span><span>♡ Find your people</span><span>♧ Privacy and safety first</span></div></div><span class="auth-welcome-orbit" aria-hidden="true"></span></aside></div><p class="auth-bottom-hint">No real name, phone number or email required for username signup. Account recovery by email is unavailable — keep your password and 2FA recovery codes safe.</p>';
 }
 let authPart="";
 if(S.secret)authPart='<div class="social-message warn social-mfa-onboarding"><strong>Connect Auth2FA to your Fleki’s Wrld account</strong><ol><li><a href="/auth2fa/" target="_blank" rel="noopener noreferrer">Install Auth2FA</a> on Windows, Android or Linux.</li><li>Tap + in Auth2FA and paste your private setup key below. Use service name Fleki’s Wrld.</li><li>Save the account in Auth2FA and enter its current six-digit code to activate protection.</li></ol><div class="social-mfa-secret">'+esc(S.secret.secret)+'</div>'+button("Copy private setup key","copy")+button("Copy authenticator link","copyuri")+'<p class="social-muted">The setup key is shown only during activation. Never share it. Auth2FA works offline; only your code is checked by the Fleki’s Wrld server.</p><form id="fw-activate" class="social-form"><label>Current 6-digit Auth2FA code<input class="social-input" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></label><button class="btn primary" type="submit">Verify code & activate 2FA</button></form></div>';
 else if(!S.user.mfa_enabled)authPart='<p>2FA must be enabled before sending messages or friend requests.</p>'+button("Set up authenticator","enroll");
 else if(!verified())authPart='<form class="social-form" id="fw-verify"><label>Authenticator code or recovery code<input class="social-input" name="code" maxlength="20" required></label><button class="btn primary" type="submit">Verify 2FA</button></form>';
 else authPart='<p>✓ Verified session. You can post, message friends and edit your profile.</p>'+(S.user.mfa_provider==="fmail"?'<p>Your second factor was securely verified by fmail.</p>':button("Replace authenticator","enroll"));
 return '<div class="social-split"><section><h3>Your profile</h3><p>Username: <strong>@'+esc(S.user.username)+'</strong></p><form id="fw-profile" class="social-form"><label>Display name<input class="social-input" name="display_name" value="'+esc(S.user.display_name)+'" maxlength="60" required></label><label>Bio<textarea class="social-textarea" name="bio" maxlength="350">'+esc(S.user.bio)+'</textarea></label><button class="btn primary" type="submit" '+(verified()?"":"disabled")+'>Save</button></form></section><aside class="social-card"><h3>Two-factor authentication</h3>'+authPart+
 (S.recovery?'<div class="social-message warn"><strong>Save these one-time recovery codes now!</strong><div class="social-mfa-secret">'+S.recovery.map(esc).join("<hr>")+'</div>'+button("I saved them","saved")+'</div>':"")+'<a class="authenticator-launch" href="/auth2fa/"><span class="authenticator-launch-mark">✦</span><span><strong>Auth2FA · Downloads ↗</strong><small>Install Auth2FA for Windows, Linux or Android. Generate genuine 30-second one-time codes offline; your setup key never leaves your device.</small></span></a><p class="social-muted">Private messages are stored on the server and are not end-to-end encrypted.</p>'+button("Log out","logout")+'</aside></div>';
}
function showMessages(records,pins){
 if(!records.length)return '<p class="social-message">No messages yet.</p>';
 const sorted=[...records].sort((a,b)=>Number(pins.includes(b.id))-Number(pins.includes(a.id))||a.created_at-b.created_at);
 return sorted.map(m=>'<article class="social-chat-item '+(S.user&&m.author===S.user.id?"mine":"")+'"><div class="social-chat-meta"><strong>'+esc(m.display_name||m.username)+'</strong><span class="social-muted">'+esc(time(m.created_at))+'</span>'+(pins.includes(m.id)?"📌":"")+'</div><p>'+esc(m.content)+'</p>'+(verified()?'<div class="social-person-actions">'+button(pins.includes(m.id)?"Unpin":"Pin","pin",m.id)+(m.author===S.user.id?button("Delete","delete",m.id):button("Block","block",m.author)+button("Report","report",m.id))+'</div>':"")+'</article>').join("");
}
function compose(id,placeholder){return '<form class="social-compose" id="'+id+'"><textarea class="social-textarea" name="content" maxlength="2000" placeholder="'+esc(placeholder)+'" required></textarea><button class="btn primary" type="submit" '+(verified()?"":"disabled")+'>Send →</button></form>'}
function globalChat(){
 const gate=!S.user?'<div class="social-read-gate"><span aria-hidden="true">🔐</span><div><strong>Read freely. Join to talk.</strong><p>Everyone can see the global chat. Sign in and verify Auth2FA to post a message.</p></div>'+button("Sign in / Register","openprofile")+'</div>':
 !verified()?'<div class="social-read-gate"><span aria-hidden="true">🛡</span><div><strong>One quick security check</strong><p>Verify your Auth2FA code in Profile to send messages.</p></div>'+button("Verify 2FA","openprofile")+'</div>':'';
 return '<div class="social-global"><div class="social-chat-top"><div><span class="social-room-meta">PUBLIC ROOM · LIVE COMMUNITY</span><h3># Global chat</h3><p>Read without an account. Posting requires verified 2FA.</p></div>'+button("Refresh","refresh")+'</div><div class="social-chat-list">'+showMessages(S.messages,S.pins)+'</div>'+gate+(verified()?compose("fw-global","Message everyone…"):"")+'<p class="social-global-rules">Be respectful. Messages are public and visible to visitors. Do not share secrets, passwords or private information.</p></div>';
}
const other=f=>f.user_low===S.user.id?{id:f.user_high,username:f.high_username,display_name:f.high_name}:{id:f.user_low,username:f.low_username,display_name:f.low_name};
function friends(){
 if(!S.user)return '<h3>Friends</h3>'+button("Sign in","openprofile");
 const accepted=S.friends.filter(f=>f.status==="accepted"),pending=S.friends.filter(f=>f.status==="pending");
 return '<div class="social-split"><section><h3>Find members</h3><form class="social-form" id="fw-search"><label>Username<input class="social-input" name="q" minlength="2" maxlength="35" value="'+esc(S.query)+'" placeholder="Search" required></label><button class="btn" type="submit">Search →</button></form>'+S.people.map(u=>userRow(u,button("Add friend","add",u.id)+button("Block","block",u.id))).join("")+'</section>'+
 '<aside class="social-card"><h3>Friends ('+accepted.length+')</h3>'+ (accepted.map(f=>userRow(other(f),button("Message","peer",other(f).id)+button("Remove","unfriend",f.id))).join("")||'<p class="social-muted">No friends yet.</p>')+
 '<h3>Requests</h3>'+ (pending.map(f=>userRow(other(f),f.requester===S.user.id?button("Cancel","unfriend",f.id):button("Accept","accept",f.id)+button("Decline","decline",f.id))).join("")||'<p class="social-muted">No requests.</p>')+
 '<h3>Blocked</h3>'+(S.blocks.map(b=>userRow(b,button("Unblock","unblock",b.blocked))).join("")||'<p class="social-muted">Nobody blocked.</p>')+'</aside></div>';
}
function direct(){
 if(!S.user)return '<h3>Private conversations</h3>'+button("Sign in","openprofile");
 const peers=S.friends.filter(f=>f.status==="accepted").map(other);
 peers.sort((a,b)=>Number(S.contactPins.includes(b.id))-Number(S.contactPins.includes(a.id)));
 return '<div class="social-split"><aside><h3>Friends</h3>'+ (peers.map(p=>'<div class="social-person">'+button(p.display_name,"peer",p.id)+button(S.contactPins.includes(p.id)?"Unpin":"Pin","pincontact",p.id)+'</div>').join("")||'<p class="social-muted">No friends yet.</p>')+'</aside><section><h3>'+(S.peer?"Chat with "+esc(peers.find(p=>p.id===S.peer)?.display_name||"friend"):"Choose a friend")+'</h3>'+(S.peer?'<div class="social-chat-list">'+showMessages(S.dm,S.dmPins)+'</div>'+compose("fw-dm","Message this friend…"):'<p class="social-message">Select a friend to view the conversation.</p>')+'</section></div>';
}
function renderNotifications(){
 if(!alerts)return;
 const verbs={friend_request:"sent a friend request",friend_accepted:"accepted your friend request",direct_message:"sent a private message"};
 alerts.innerHTML='<div class="social-wrap"><div class="social-bar"><strong>Notifications</strong>'+button("Mark all read","readall")+'</div><div class="social-card">'+(!S.user?'<p>Sign in to see notifications.</p>':S.notifications.map(n=>'<div class="social-person"><div><strong>'+esc(n.display_name||n.username||"Member")+'</strong><p class="social-muted">'+esc(verbs[n.kind]||"New activity")+' · '+esc(time(n.created_at))+'</p></div>'+(n.read_at?'<span class="social-muted">Read</span>':button("Mark read","read",n.id))+'</div>').join("")||'<p>Nothing new yet.</p>')+'</div></div>';
}
function render(){
 if(!root||!accountRoot)return;
 const tabs=[["global","Global chat","🌐"],["friends","Friends","👥"],["direct","Messages","✉"]];
 root.innerHTML='<div class="social-wrap social-modern"><div class="social-workspace"><aside class="social-rail"><div class="social-rail-brand"><span>✦</span><div><strong>Community</strong><small>Fleki’s Wrld</small></div></div><nav class="social-rail-nav" aria-label="Community sections">'+tabs.map(x=>'<button type="button" class="social-rail-link '+(S.tab===x[0]?"active":"")+'" data-action="tab" data-id="'+x[0]+'"><span aria-hidden="true">'+x[2]+'</span>'+x[1]+'</button>').join("")+'</nav><div class="social-rail-foot"><span class="social-rail-status">'+(verified()?"● Verified with 2FA":S.user?"○ Verify Auth2FA to post":"○ Public reading enabled")+'</span>'+button(S.user?"Open my profile":"Sign in / Register","openprofile")+'</div></aside><div class="social-workspace-content"><p class="social-feedback" id="fw-feedback" role="status">'+esc(S.error)+'</p><div class="social-layout">'+(S.tab==="global"?globalChat():S.tab==="friends"?friends():direct())+'</div></div></div></div>';
 accountRoot.innerHTML='<div class="social-wrap social-account-wrap"><div class="social-bar"><div class="social-id"><span class="social-avatar">'+(S.user?esc(S.user.username.slice(0,1).toUpperCase()):"✦")+'</span><div><strong>'+(S.user?esc(S.user.display_name):"Welcome to Fleki’s Wrld")+'</strong><small>'+(S.user?"@"+esc(S.user.username)+" · "+(verified()?"2FA verified":"Security setup required"):"A dedicated home for your account and security")+'</small></div></div><span class="social-status">'+(!S.user?"NOT SIGNED IN":verified()?"2FA ACTIVE":"2FA REQUIRED")+'</span></div><p class="social-feedback" id="fw-profile-feedback" role="status">'+esc(S.error)+'</p><div class="social-layout social-account-layout">'+account()+'</div></div>';
 renderNotifications();
}
async function reload(){
 if(!S.token){
  S.user=null;
  const feed=await api("/messages/public");
  S.messages=feed.messages||[];S.pins=[];
  return;
 }
 S.user=(await api("/me")).user;
 const [f,m,n]=await Promise.all([api("/friends"),api("/messages"),api("/notifications")]);
 S.friends=f.friends;S.blocks=f.blocks;S.contactPins=f.contact_pins;S.messages=m.messages;S.pins=m.pins;S.notifications=n.notifications;
 if(S.peer){try{const dm=await api("/messages?peer="+encodeURIComponent(S.peer));S.dm=dm.messages;S.dmPins=dm.pins}catch{S.peer=null;S.dm=[];S.dmPins=[]}}
}
async function action(op,id){
 if(op==="tab"){if(id==="account")return openProfile();S.tab=id;return render()}
 if(op==="openprofile"){openProfile();return}
 if(op==="mode"){S.mode=id;return render()}
 if(op==="showpass"){const field=document.querySelector("#fw-auth input[name=password]");if(field){field.type=field.type==="password"?"text":"password";renderPasswordToggle(field.type)}return}
 if(op==="oauth"){if(!S.providers?.[id])return msg("Sign-in with "+id+" is awaiting secure provider configuration.");window.location.assign(API+"/auth/oauth/start/"+encodeURIComponent(id));return}
 if(op==="saved"){S.recovery=null;return render()}
 if(op==="copy"){await navigator.clipboard.writeText(S.secret.secret);return msg("Copied setup key.")}
 if(op==="copyuri"){if(!S.secret?.uri)return;await navigator.clipboard.writeText(S.secret.uri);return msg("Authenticator link copied. Keep it private.")}
 if(op==="refresh"){await reload();return render()}
 if(op==="logout"){try{await api("/auth/logout","POST",{})}finally{S.token="";S.user=null;S.peer=null;sessionStorage.removeItem("fw-token");window.dispatchEvent(new Event("fw-auth-changed"));await reload();render()}return}
 if(op==="enroll"){S.secret=await api("/mfa/enroll","POST",{});return render()}
 if(op==="peer"){S.peer=id;S.tab="direct";await reload();return render()}
 if(op==="block"){if(!confirm("Block this member and hide their posts?"))return;await api("/blocks","POST",{target_id:id})}
 else if(op==="unblock")await api("/blocks/"+encodeURIComponent(id),"DELETE");
 else if(op==="add"){if(!ensure2fa())return;await api("/friends/request","POST",{target_id:id})}
 else if(op==="accept"||op==="decline"){if(!ensure2fa())return;await api("/friends/respond","POST",{id,accept:op==="accept"})}
 else if(op==="unfriend"){if(!ensure2fa())return;await api("/friends/remove","POST",{id})}
 else if(op==="pin"){if(!ensure2fa())return;if(S.pins.includes(id)||S.dmPins.includes(id))await api("/pins/remove","POST",{message_id:id});else await api("/pins","POST",{message_id:id})}
 else if(op==="pincontact"){if(!ensure2fa())return;await api(S.contactPins.includes(id)?"/pins/remove":"/pins","POST",{contact_id:id})}
 else if(op==="delete"){if(!ensure2fa())return;if(!confirm("Delete this message?"))return;await api("/messages/"+encodeURIComponent(id),"DELETE")}
 else if(op==="report"){const reason=prompt("Reason for reporting this message");if(reason)await api("/reports","POST",{message_id:id,reason});msg("Report sent.");return}
 else if(op==="read")await api("/notifications/read","POST",{id});
 else if(op==="readall")await api("/notifications/read","POST",{id:"all"});
 await reload();render();
}
document.addEventListener("click",async e=>{const target=e.target.closest("[data-action]");if(!target||pending)return;pending=true;try{await action(target.dataset.action,target.dataset.id||"")}catch(err){msg(err.message)}finally{pending=false}});
document.addEventListener("submit",async e=>{
 const form=e.target;if(!form.id.startsWith("fw-"))return;e.preventDefault();if(pending)return;pending=true;
 const values=Object.fromEntries(new FormData(form));
 try{
  if(form.id==="fw-auth"){const r=await api(S.mode==="register"?"/auth/register":"/auth/login","POST",values);S.token=r.token;sessionStorage.setItem("fw-token",r.token);await reload();window.dispatchEvent(new Event("fw-auth-changed"));openProfile()}
  else if(form.id==="fw-activate"){const r=await api("/mfa/activate","POST",values);S.secret=null;S.recovery=r.recovery_codes;await reload();window.dispatchEvent(new Event("fw-auth-changed"))}
  else if(form.id==="fw-verify"){await api("/mfa/verify","POST",values);await reload();window.dispatchEvent(new Event("fw-auth-changed"))}
  else if(form.id==="fw-profile"){if(ensure2fa()){await api("/profile","PUT",values);await reload()}}
  else if(form.id==="fw-search"){S.query=values.q;S.people=(await api("/users?q="+encodeURIComponent(values.q))).users}
  else if(form.id==="fw-global"){if(ensure2fa()){await api("/messages","POST",{content:values.content});await reload()}}
  else if(form.id==="fw-dm"){if(ensure2fa()&&S.peer){await api("/messages","POST",{content:values.content,recipient:S.peer});await reload()}}
  render();
 }catch(err){msg(err.message)}finally{pending=false}
});
window.addEventListener("wrld:profile",()=>openProfile());
(async()=>{try{await api("/health");try{S.providers=(await api("/auth/providers")).providers||S.providers}catch{}let incoming=null;try{incoming=JSON.parse(sessionStorage.getItem("fw-oauth-pending")||"null");sessionStorage.removeItem("fw-oauth-pending")}catch{}if(incoming?.key==="oauth_ticket"){const r=await api("/auth/oauth/redeem","POST",{ticket:incoming.value});S.token=r.token;sessionStorage.setItem("fw-token",r.token);msg("Connected with your external account.")}else if(incoming?.key==="oauth_error"){msg("External sign-in could not be completed: "+incoming.value.replace(/_/g," "))}await reload();window.dispatchEvent(new Event("fw-auth-changed"))}catch(err){msg("Sign-in or API error: "+err.message)}render()})();
setInterval(async()=>{if(!pending){try{await reload();const typing=document.activeElement?.closest("#wrld-community-root form, #wrld-account-root form");if(!typing&&(S.tab==="global"||S.tab==="direct"))render();else renderNotifications()}catch{}}},12000);
