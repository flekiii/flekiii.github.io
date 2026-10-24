/* Fleki's Wrld — Cloudflare D1 community client (independent of other projects). */
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const root=document.getElementById("wrld-community-root"),alerts=document.getElementById("wrld-notifications-root");
const esc=x=>String(x??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
const time=x=>new Date(x).toLocaleString("en",{dateStyle:"short",timeStyle:"short"});
const S={token:sessionStorage.getItem("fw-token")||"",user:null,tab:"global",mode:"login",friends:[],blocks:[],contactPins:[],messages:[],pins:[],dm:[],dmPins:[],notifications:[],people:[],query:"",peer:null,secret:null,recovery:null,error:""};
let pending=false;
const button=(t,act,id="")=>'<button type="button" class="social-mini" data-action="'+esc(act)+'" data-id="'+esc(id)+'">'+esc(t)+'</button>';
const msg=x=>{S.error=x;const n=document.getElementById("fw-feedback");if(n)n.textContent=x};
async function api(path,method="GET",body=null){
 const headers={Accept:"application/json"};if(S.token)headers.Authorization="Bearer "+S.token;if(body!==null)headers["Content-Type"]="application/json";
 const response=await fetch(API+path,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:"no-store",mode:"cors"});
 const data=await response.json().catch(()=>({error:"Invalid server response."}));
 if(!response.ok){if(response.status===401&&path!=="/auth/login"){S.token="";sessionStorage.removeItem("fw-token");S.user=null}throw Error(data.error||"Server error "+response.status)}
 return data;
}
function verified(){return !!S.user?.mfa_verified}
function ensure2fa(){if(!S.user){S.tab="account";render();msg("Sign in first.");return false}if(!verified()){S.tab="account";render();msg("Verified authenticator 2FA is required.");return false}return true}
function userRow(u,actions){return '<div class="social-person"><div class="social-person-main"><strong>'+esc(u.display_name||u.name||u.username)+'</strong><small>@'+esc(u.username)+'</small></div><div class="social-person-actions">'+actions+'</div></div>'}
function account(){
 if(!S.user)return '<h3>Sign in or create an account</h3><p class="social-muted">No real name, phone or email required. Username and password only.</p><div class="social-controls">'+button("Sign in","mode","login")+button("Create account","mode","register")+'</div><form id="fw-auth" class="social-form" style="margin-top:18px"><label>Username<input class="social-input" name="username" pattern="[a-z][a-z0-9_]{2,23}" maxlength="24" required autocomplete="username"></label>'+
 (S.mode==="register"?'<label>Display name<input class="social-input" name="display_name" maxlength="60" required></label>':"")+
 '<label>Password<input class="social-input" name="password" type="password" minlength="'+(S.mode==="register"?"12":"1")+'" maxlength="128" required></label><button class="btn primary" type="submit">'+(S.mode==="register"?"Register":"Sign in")+' →</button></form><div class="social-message">Account recovery by email is not available. Use a password manager and save 2FA recovery codes.</div>';
 let authPart="";
 if(S.secret)authPart='<div class="social-message warn"><strong>Save your authenticator key</strong><p>Enter this key manually in Aegis, Google Authenticator or 2FAS:</p><div class="social-mfa-secret">'+esc(S.secret.secret)+'</div>'+button("Copy setup key","copy")+'<form id="fw-activate" class="social-form"><label>Current 6-digit code<input class="social-input" name="code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required></label><button class="btn primary" type="submit">Enable 2FA</button></form></div>';
 else if(!S.user.mfa_enabled)authPart='<p>2FA must be enabled before sending messages or friend requests.</p>'+button("Set up authenticator","enroll");
 else if(!verified())authPart='<form class="social-form" id="fw-verify"><label>Authenticator code or recovery code<input class="social-input" name="code" maxlength="20" required></label><button class="btn primary" type="submit">Verify 2FA</button></form>';
 else authPart='<p>✓ Verified session. You can post, message friends and edit your profile.</p>'+button("Replace authenticator","enroll");
 return '<div class="social-split"><section><h3>Your profile</h3><p>Username: <strong>@'+esc(S.user.username)+'</strong></p><form id="fw-profile" class="social-form"><label>Display name<input class="social-input" name="display_name" value="'+esc(S.user.display_name)+'" maxlength="60" required></label><label>Bio<textarea class="social-textarea" name="bio" maxlength="350">'+esc(S.user.bio)+'</textarea></label><button class="btn primary" type="submit" '+(verified()?"":"disabled")+'>Save</button></form></section><aside class="social-card"><h3>Two-factor authentication</h3>'+authPart+
 (S.recovery?'<div class="social-message warn"><strong>Save these one-time recovery codes now!</strong><div class="social-mfa-secret">'+S.recovery.map(esc).join("<hr>")+'</div>'+button("I saved them","saved")+'</div>':"")+'<p class="social-muted">Private messages are stored on the server and are not end-to-end encrypted.</p>'+button("Log out","logout")+'</aside></div>';
}
function showMessages(records,pins){
 if(!S.user)return '<p class="social-message">Sign in to read.</p>';
 if(!records.length)return '<p class="social-message">No messages yet.</p>';
 const sorted=[...records].sort((a,b)=>Number(pins.includes(b.id))-Number(pins.includes(a.id))||a.created_at-b.created_at);
 return sorted.map(m=>'<article class="social-chat-item '+(m.author===S.user.id?"mine":"")+'"><div class="social-chat-meta"><strong>'+esc(m.display_name||m.username)+'</strong><span class="social-muted">'+esc(time(m.created_at))+'</span>'+(pins.includes(m.id)?"📌":"")+'</div><p>'+esc(m.content)+'</p><div class="social-person-actions">'+button(pins.includes(m.id)?"Unpin":"Pin","pin",m.id)+ (m.author===S.user.id?button("Delete","delete",m.id):button("Block","block",m.author)+button("Report","report",m.id))+'</div></article>').join("");
}
function compose(id,placeholder){return '<form class="social-compose" id="'+id+'"><textarea class="social-textarea" name="content" maxlength="2000" placeholder="'+esc(placeholder)+'" required></textarea><button class="btn primary" type="submit" '+(verified()?"":"disabled")+'>Send →</button></form>'}
function globalChat(){
 if(!S.user)return '<h3>Global chat</h3><p class="social-muted">A shared room for every verified member.</p>'+button("Join the world","tab","account");
 return '<div class="social-split"><section><div class="social-chat-top"><h3># Global chat</h3>'+button("Refresh","refresh")+'</div><div class="social-chat-list">'+showMessages(S.messages,S.pins)+'</div>'+compose("fw-global","Message everyone…")+'</section><aside class="social-card"><h3>Community rules</h3><p>Be kind and protect privacy. Harassment, threats, scams and spam are not welcome.</p><p>Use Block or Report on harmful messages. Pins are visible only to you.</p><p>Posting requires verified 2FA and has a cooldown.</p></aside></div>';
}
const other=f=>f.user_low===S.user.id?{id:f.user_high,username:f.high_username,display_name:f.high_name}:{id:f.user_low,username:f.low_username,display_name:f.low_name};
function friends(){
 if(!S.user)return '<h3>Friends</h3>'+button("Sign in","tab","account");
 const accepted=S.friends.filter(f=>f.status==="accepted"),pending=S.friends.filter(f=>f.status==="pending");
 return '<div class="social-split"><section><h3>Find members</h3><form class="social-form" id="fw-search"><label>Username<input class="social-input" name="q" minlength="2" maxlength="35" value="'+esc(S.query)+'" placeholder="Search" required></label><button class="btn" type="submit">Search →</button></form>'+S.people.map(u=>userRow(u,button("Add friend","add",u.id)+button("Block","block",u.id))).join("")+'</section>'+
 '<aside class="social-card"><h3>Friends ('+accepted.length+')</h3>'+ (accepted.map(f=>userRow(other(f),button("Message","peer",other(f).id)+button("Remove","unfriend",f.id))).join("")||'<p class="social-muted">No friends yet.</p>')+
 '<h3>Requests</h3>'+ (pending.map(f=>userRow(other(f),f.requester===S.user.id?button("Cancel","unfriend",f.id):button("Accept","accept",f.id)+button("Decline","decline",f.id))).join("")||'<p class="social-muted">No requests.</p>')+
 '<h3>Blocked</h3>'+(S.blocks.map(b=>userRow(b,button("Unblock","unblock",b.blocked))).join("")||'<p class="social-muted">Nobody blocked.</p>')+'</aside></div>';
}
function direct(){
 if(!S.user)return '<h3>Private conversations</h3>'+button("Sign in","tab","account");
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
 if(!root)return;
 const tabs=[["global","Global chat"],["friends","Friends"],["direct","Messages"],["account","Profile & 2FA"]];
 root.innerHTML='<div class="social-wrap"><div class="social-bar"><div class="social-id"><span class="social-avatar">✦</span><div><strong>Fleki’s Wrld Community</strong><small>'+(S.user?"@"+esc(S.user.username)+" · "+(verified()?"2FA verified":"2FA required"):"Create your account to join")+'</small></div></div>'+button("Refresh","refresh")+'</div><p class="social-feedback" id="fw-feedback" role="status">'+esc(S.error)+'</p><nav class="social-tabs">'+tabs.map(x=>'<button type="button" class="social-tab '+(S.tab===x[0]?"active":"")+'" data-action="tab" data-id="'+x[0]+'">'+x[1]+'</button>').join("")+'</nav><div class="social-layout">'+(S.tab==="global"?globalChat():S.tab==="friends"?friends():S.tab==="direct"?direct():account())+'</div></div>';
 renderNotifications();
}
async function reload(){
 if(!S.token)return;
 S.user=(await api("/me")).user;
 const [f,m,n]=await Promise.all([api("/friends"),api("/messages"),api("/notifications")]);
 S.friends=f.friends;S.blocks=f.blocks;S.contactPins=f.contact_pins;S.messages=m.messages;S.pins=m.pins;S.notifications=n.notifications;
 if(S.peer){try{const dm=await api("/messages?peer="+encodeURIComponent(S.peer));S.dm=dm.messages;S.dmPins=dm.pins}catch{S.peer=null;S.dm=[];S.dmPins=[]}}
}
async function action(op,id){
 if(op==="tab"){S.tab=id;return render()}
 if(op==="mode"){S.mode=id;return render()}
 if(op==="saved"){S.recovery=null;return render()}
 if(op==="copy"){await navigator.clipboard.writeText(S.secret.secret);return msg("Copied setup key.")}
 if(op==="refresh"){await reload();return render()}
 if(op==="logout"){try{await api("/auth/logout","POST",{})}finally{S.token="";S.user=null;S.peer=null;sessionStorage.removeItem("fw-token");S.tab="account";render()}return}
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
  if(form.id==="fw-auth"){const r=await api(S.mode==="register"?"/auth/register":"/auth/login","POST",values);S.token=r.token;sessionStorage.setItem("fw-token",r.token);S.tab="account";await reload()}
  else if(form.id==="fw-activate"){const r=await api("/mfa/activate","POST",values);S.secret=null;S.recovery=r.recovery_codes;await reload()}
  else if(form.id==="fw-verify"){await api("/mfa/verify","POST",values);await reload()}
  else if(form.id==="fw-profile"){if(ensure2fa()){await api("/profile","PUT",values);await reload()}}
  else if(form.id==="fw-search"){S.query=values.q;S.people=(await api("/users?q="+encodeURIComponent(values.q))).users}
  else if(form.id==="fw-global"){if(ensure2fa()){await api("/messages","POST",{content:values.content});await reload()}}
  else if(form.id==="fw-dm"){if(ensure2fa()&&S.peer){await api("/messages","POST",{content:values.content,recipient:S.peer});await reload()}}
  render();
 }catch(err){msg(err.message)}finally{pending=false}
});
window.addEventListener("wrld:profile",()=>{S.tab="account";render()});
(async()=>{try{await api("/health");if(S.token)await reload()}catch(err){msg("API unavailable: "+err.message)}render()})();
setInterval(async()=>{if(S.token&&!pending){try{await reload();const typing=document.activeElement?.closest("#wrld-community-root form");if(!typing&&(S.tab==="global"||S.tab==="direct"))render();else renderNotifications()}catch{}}},12000);
