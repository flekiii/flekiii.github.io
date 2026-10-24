import { SOCIAL_CONFIG } from "./social-config.js";

const $ = id => document.getElementById(id);
const safe = s => String(s??"").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const actionButton = (label, op, id) => '<button class="social-action" data-sw-action="'+safe(op)+'" data-sw-id="'+safe(id||"")+'">'+safe(label)+'</button>';
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SOCIAL_CONFIG.url) && /^(sb_publishable_|eyJ)/.test(SOCIAL_CONFIG.publishableKey);
const state = {db:null,user:null,profile:null,aal:"aal1",existingFactor:null,enroll:null,mode:"signin",pane:"global",
  members:[],blocks:[],requests:[],global:[],direct:[],pins:new Set(),dmPins:new Set(),
  contactPins:new Set(),notifications:[],peer:null,fetching:false};
const uid=()=>state.user?.id;
const verified=()=>state.aal==="aal2";
const username=id=>state.members.find(p=>p.id===id)?.username||"member";
const name=id=>state.members.find(p=>p.id===id)?.display_name||username(id);
const blocked=id=>state.blocks.some(b=>b.blocked===id);
const connections=()=>state.requests.filter(r=>r.status==="accepted");
const friendsWith=id=>connections().some(r=>r.sender===id||r.recipient===id);
const labelDate=v=>new Date(v).toLocaleString("en",{dateStyle:"short",timeStyle:"short"});
const identity=id=>'<div class="social-identity"><div class="social-avatar">'+safe(name(id).slice(0,1).toUpperCase())+'</div><div><strong>'+safe(name(id))+'</strong><small>@'+safe(username(id))+'</small></div></div>';
const empty=(target,message)=>{$(target).innerHTML='<div class="social-subtle">'+safe(message)+'</div>'};
const flash=message=>{$("sw-flash").textContent=message||""};
const good=async(promise,text)=>{
  const {data,error}=await promise;if(error)throw error;if(text)flash(text);return data;
};
function choose(pane) {
  state.pane=pane;
  document.querySelectorAll("[data-sw-tab]").forEach(b=>b.classList.toggle("active",b.dataset.swTab===pane));
  document.querySelectorAll(".social-pane").forEach(p=>p.classList.toggle("active",p.id==="sw-pane-"+pane));
}
function require2FA(){
  if(!state.db){flash("Social services aren't connected yet. The public chat is not live.");return false}
  if(!uid()){flash("Sign in to continue.");choose("profile");return false}
  if(!verified()){flash("Verify 2FA first to post, message people or send friend requests.");choose("profile");return false}
  if(!state.profile){flash("Create your public profile after verifying 2FA.");choose("profile");return false}
  return true;
}
function banner(){
  $("sw-status").textContent=!state.db?"BACKEND PENDING":!uid()?"SIGNED OUT":verified()?"2FA VERIFIED":"2FA REQUIRED";
  $("sw-account-title").textContent=state.profile?name(uid())+" · @"+state.profile.username:uid()?"Signed in — finish setup":"Welcome to Fleki's Wrld";
  $("sw-account-details").textContent=!state.db?"A dedicated backend is still needed before registration and chat can go live.":!uid()?"Sign in or create an account to join.":verified()?"You can access messaging, friendships and your profile.":"You can read, but posting and adding friends require 2FA.";
  $("sw-signout").classList.toggle("social-hidden",!uid());
  $("sw-global-send").disabled=!verified()||!state.profile;
  $("sw-direct-send").disabled=!verified()||!state.profile||!state.peer||!friendsWith(state.peer)||blocked(state.peer);
}
function authForm(){
  const signed=!!uid();
  $("sw-auth-title").textContent=signed?"My profile":"Sign in / Sign up";
  $("sw-auth-desc").textContent=signed?"Your public username, name and bio.":"Email + password. No real name or phone number needed.";
  $("sw-auth-form").classList.toggle("social-hidden",signed||!state.db);
  $("sw-profile-form").classList.toggle("social-hidden",!signed);
  $("sw-new-fields").classList.toggle("social-hidden",state.mode!=="signup");
  $("sw-auth-submit").textContent=state.mode==="signup"?"Create account":"Sign in";
  $("sw-auth-switch").textContent=state.mode==="signup"?"I already have an account":"Create an account";
  $("sw-save-profile").disabled=!verified();
  if(signed) {
    $("sw-profile-username").value=state.profile?.username||"";
    $("sw-profile-name").value=state.profile?.display_name||"";
    $("sw-profile-bio").value=state.profile?.bio||"";
    $("sw-profile-help").textContent=!verified()?"Verify 2FA to edit or create your profile.":"Your email stays private; your username, name and bio are visible to members.";
  }
  mfaPanel();banner();
}
function mfaPanel(){
  if(!state.db)return empty("sw-mfa-panel","TOTP 2FA enrollment needs a new, connected Supabase Auth project.");
  if(!uid())return empty("sw-mfa-panel","Sign in first to set up your authenticator.");
  if(state.enroll){
    const qr=state.enroll.totp.qr_code;
    const src=qr.startsWith("data:")?qr:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(qr);
    $("sw-mfa-panel").innerHTML='<p class="social-muted">Scan the QR code with an authenticator app and enter the 6-digit code.</p><img class="social-qr" src="'+safe(src)+'" alt="TOTP enrollment QR code"><p class="social-muted">Manual setup key: <code id="sw-secret"></code></p><form class="social-form" id="sw-verify-form"><input class="social-input" id="sw-totp-code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required placeholder="6-digit code"><button class="social-cta primary" type="submit">Enable 2FA</button></form>';
    $("sw-secret").textContent=state.enroll.totp.secret;
  }else if(verified()){
    $("sw-mfa-panel").innerHTML='<div class="social-note"><strong>✓ 2FA verified.</strong> This session may write and send invitations.</div><button class="social-cta" data-sw-action="enroll">Add backup authenticator</button>';
  }else if(state.existingFactor){
    $("sw-mfa-panel").innerHTML='<div class="social-note">Your authenticator is already enrolled. Verify it to unlock writing.</div><form class="social-form" id="sw-verify-form"><input class="social-input" id="sw-totp-code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required placeholder="6-digit code"><button class="social-cta primary" type="submit">Verify 2FA</button></form>';
  }else{
    $("sw-mfa-panel").innerHTML='<div class="social-note">Authenticator 2FA is required before sending any messages or friend requests.</div><button class="social-cta primary" data-sw-action="enroll">Enable 2FA</button>';
  }
}
function messageMarkup(m,direct=false){
  const pinned=(direct?state.dmPins:state.pins).has(m.id);
  const from=direct?m.sender:m.author;
  const line='<strong>'+safe(from===uid()?"You":name(from))+'</strong> <time>'+safe(labelDate(m.created_at))+'</time>';
  return '<div class="social-item"><div class="social-bubble"><div class="social-by">'+line+(pinned?' <span>📌 Pinned</span>':'')+'</div><p>'+safe(m.content)+'</p><div class="social-actions">'+
    actionButton(pinned?"Unpin":"Pin",direct?"pin-direct":"pin-global",m.id)+
    (!direct&&from!==uid()?actionButton("Block","block",from):"")+
    (!direct&&from===uid()?actionButton("Delete","delete-global",m.id):"")+'</div></div></div>';
}
function renderGlobal(){
  if(!state.db)return empty("sw-global-list","Chat preview only. Connect the dedicated social backend to activate.");
  if(!uid())return empty("sw-global-list","Sign in to read messages.");
  if(!state.global.length)return empty("sw-global-list","No messages yet.");
  const ordered=[...state.global].sort((a,b)=>Number(state.pins.has(b.id))-Number(state.pins.has(a.id))||Date.parse(a.created_at)-Date.parse(b.created_at));
  $("sw-global-list").innerHTML=ordered.map(m=>messageMarkup(m)).join("");
}
function renderFriends(){
  if(!uid()){
    for(const id of ["sw-people-list","sw-friend-list","sw-requests","sw-blocked-list"])empty(id,"Sign in to see people.");
    return;
  }
  const q=$("sw-user-search").value.trim().toLowerCase();
  const people=state.members.filter(p=>p.id!==uid()&&!blocked(p.id)&&(!q||p.username.includes(q)||p.display_name.toLowerCase().includes(q))).slice(0,35);
  $("sw-people-list").innerHTML=people.map(p=>{
    const request=state.requests.find(r=>r.sender===p.id||r.recipient===p.id);
    const act=request?'<span class="social-count">'+(request.status==="accepted"?"Friends":"Request pending")+'</span>':actionButton("Add friend","request",p.id);
    return '<div class="social-person">'+identity(p.id)+'<div class="social-controls">'+act+actionButton("Block","block",p.id)+'</div></div>';
  }).join("")||'<div class="social-subtle">No matching users.</div>';
  $("sw-friend-list").innerHTML=connections().map(r=>{
    const other=r.sender===uid()?r.recipient:r.sender;
    return '<div class="social-person">'+identity(other)+'<div class="social-controls">'+actionButton("Message","peer",other)+actionButton("Remove","unfriend",r.id)+'</div></div>';
  }).join("")||'<p class="social-muted">No friends yet.</p>';
  $("sw-requests").innerHTML=state.requests.filter(r=>r.status==="pending").map(r=>{
    const other=r.sender===uid()?r.recipient:r.sender;
    return '<div class="social-person">'+identity(other)+'<div class="social-controls">'+(r.recipient===uid()?actionButton("Accept","accept",r.id):'<span class="social-count">Sent</span>')+actionButton("Remove","unfriend",r.id)+'</div></div>';
  }).join("")||'<p class="social-muted">No requests yet.</p>';
  $("sw-blocked-list").innerHTML=state.blocks.map(b=>'<div class="social-person">'+identity(b.blocked)+actionButton("Unblock","unblock",b.blocked)+'</div>').join("")||'<p class="social-muted">No blocked accounts.</p>';
}
function renderDirect(){
  if(!uid()){empty("sw-contacts","Sign in.");empty("sw-direct-list","Sign in to view your conversations.");return}
  const peers=connections().map(r=>r.sender===uid()?r.recipient:r.sender).filter(id=>!blocked(id));
  peers.sort((a,b)=>Number(state.contactPins.has(b))-Number(state.contactPins.has(a)));
  $("sw-contacts").innerHTML=peers.map(id=>'<div class="social-contact '+(id===state.peer?"active":"")+'">'+actionButton((state.contactPins.has(id)?"📌 ":"")+name(id),"peer",id)+actionButton(state.contactPins.has(id)?"Unpin":"Pin","pin-contact",id)+'</div>').join("")||'<p class="social-muted">Add a friend to begin.</p>';
  $("sw-direct-heading").textContent=state.peer?"Chat with "+name(state.peer):"Choose a friend";
  if(!state.peer||!friendsWith(state.peer)||blocked(state.peer))return empty("sw-direct-list","Select an accepted friend.");
  const messages=state.direct.filter(m=>(m.sender===uid()&&m.recipient===state.peer)||(m.sender===state.peer&&m.recipient===uid()));
  if(!messages.length)return empty("sw-direct-list","No private messages yet.");
  const ordered=[...messages].sort((a,b)=>Number(state.dmPins.has(b.id))-Number(state.dmPins.has(a.id))||Date.parse(a.created_at)-Date.parse(b.created_at));
  $("sw-direct-list").innerHTML=ordered.map(m=>messageMarkup(m,true)).join("");
}
function renderNotifications(){
  if(!state.db)return empty("sw-notifications-list","Notifications are prepared but not connected to a backend.");
  if(!uid())return empty("sw-notifications-list","Sign in to view personal notifications.");
  $("sw-notifications-caption").textContent=state.notifications.filter(n=>!n.read_at).length+" unread";
  const dictionary={friend_request:"sent you a friend request",friend_accepted:"accepted your friend request",direct_message:"sent you a private message"};
  $("sw-notifications-list").innerHTML=state.notifications.map(n=>'<div class="social-item"><div class="social-bubble"><div class="social-by">'+safe(name(n.actor))+' <time>'+safe(labelDate(n.created_at))+'</time></div><p>'+safe(dictionary[n.kind]||"New activity")+'</p><div class="social-actions">'+(n.read_at?'<span class="social-count">Read</span>':actionButton("Mark as read","read",n.id))+'</div></div></div>').join("")||'<div class="social-subtle">All caught up.</div>';
}
function draw(){banner();renderGlobal();renderFriends();renderDirect();renderNotifications();}
async function refreshData(){
  if(!state.db||!uid()||state.fetching)return;
  state.fetching=true;
  try{
    const db=state.db;
    const all=await Promise.all([
      db.from("profiles").select("id,username,display_name,bio").order("username").limit(300),
      db.from("blocks").select("blocked"),
      db.from("friend_requests").select("id,sender,recipient,status,created_at"),
      db.from("global_messages").select("id,author,content,created_at").order("created_at",{ascending:false}).limit(80),
      db.from("direct_messages").select("id,sender,recipient,content,created_at").order("created_at",{ascending:false}).limit(120),
      db.from("message_pins").select("message_id"),
      db.from("direct_message_pins").select("message_id"),
      db.from("pinned_contacts").select("contact_id"),
      db.from("notifications").select("id,actor,kind,read_at,created_at").order("created_at",{ascending:false}).limit(50)
    ]);
    const bad=all.find(x=>x.error);if(bad)throw bad.error;
    state.members=all[0].data||[];state.blocks=all[1].data||[];state.requests=all[2].data||[];
    state.global=all[3].data||[];state.direct=all[4].data||[];
    state.pins=new Set((all[5].data||[]).map(x=>x.message_id));
    state.dmPins=new Set((all[6].data||[]).map(x=>x.message_id));
    state.contactPins=new Set((all[7].data||[]).map(x=>x.contact_id));
    state.notifications=all[8].data||[];
    draw();
  }catch(e){flash("Could not load data: "+e.message)}
  finally{state.fetching=false}
}
async function refreshAuth(){
  if(!state.db)return;
  try{
    const res=await state.db.auth.getUser();if(res.error)throw res.error;
    state.user=res.data.user;
    if(!uid()){state.profile=null;state.aal="aal1";state.existingFactor=null;state.enroll=null;authForm();draw();return}
    const [a,f,p]=await Promise.all([
      state.db.auth.mfa.getAuthenticatorAssuranceLevel(),
      state.db.auth.mfa.listFactors(),
      state.db.from("profiles").select("id,username,display_name,bio").eq("id",uid()).maybeSingle()
    ]);
    const err=[a,f,p].find(x=>x.error);if(err)throw err.error;
    state.aal=a.data.currentLevel||"aal1";state.existingFactor=f.data.totp?.find(x=>x.status==="verified")||null;
    state.profile=p.data;
    authForm();await refreshData();
    if(!state.profile&&verified()){
      try{const pending=JSON.parse(sessionStorage.getItem("sw-pending-profile")||"null");
        if(pending){$("sw-profile-username").value=pending.username;$("sw-profile-name").value=pending.display}}
      catch{}
    }
  }catch(e){flash("Auth error: "+e.message)}
}
async function command(op,id){
  if(op==="auth-mode"){state.mode=state.mode==="signup"?"signin":"signup";authForm();return}
  if(op==="refresh"){await refreshAuth();return}
  if(op==="signout"){await good(state.db.auth.signOut(),"Signed out.");state.user=null;state.profile=null;state.aal="aal1";state.peer=null;authForm();draw();return}
  if(op==="peer"){state.peer=id;choose("direct");draw();return}
  if(op==="enroll"){
    if(!uid())return flash("Sign in first.");
    state.enroll=await good(state.db.auth.mfa.enroll({factorType:"totp",friendlyName:"Fleki's Wrld"}));
    mfaPanel();return;
  }
  if(op==="block"){
    if(!uid())return flash("Sign in first.");
    if(!confirm("Block this person and stop them contacting you?"))return;
    await good(state.db.from("blocks").insert({blocker:uid(),blocked:id}),"Person blocked.");
  }else if(op==="unblock"){
    if(!uid())return;
    await good(state.db.from("blocks").delete().eq("blocker",uid()).eq("blocked",id),"Unblocked.");
  }else if(op==="request"){
    if(!require2FA())return;
    await good(state.db.from("friend_requests").insert({sender:uid(),recipient:id}),"Friend request sent.");
  }else if(op==="accept"){
    if(!require2FA())return;
    await good(state.db.from("friend_requests").update({status:"accepted"}).eq("id",id),"Friend accepted.");
  }else if(op==="unfriend"){
    if(!uid())return;
    await good(state.db.from("friend_requests").delete().eq("id",id),"Request or friendship removed.");
  }else if(op==="pin-global"||op==="pin-direct"){
    if(!require2FA())return;
    const direct=op==="pin-direct",table=direct?"direct_message_pins":"message_pins",pins=direct?state.dmPins:state.pins;
    if(pins.has(id))await good(state.db.from(table).delete().eq("user_id",uid()).eq("message_id",id),"Unpinned.");
    else await good(state.db.from(table).insert({user_id:uid(),message_id:id}),"Pinned for you.");
  }else if(op==="pin-contact"){
    if(!require2FA())return;
    if(state.contactPins.has(id))await good(state.db.from("pinned_contacts").delete().eq("user_id",uid()).eq("contact_id",id),"Unpinned.");
    else await good(state.db.from("pinned_contacts").insert({user_id:uid(),contact_id:id}),"Contact pinned.");
  }else if(op==="delete-global"){
    if(!require2FA())return;
    await good(state.db.from("global_messages").delete().eq("id",id),"Message deleted.");
  }else if(op==="read"){
    if(!uid())return;
    await good(state.db.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id),"Read.");
  }
  await refreshData();
}
async function mount(){
  const response=await fetch("/social-ui.html?v=1");
  if(!response.ok)throw Error("Community templates unavailable.");
  const doc=new DOMParser().parseFromString(await response.text(),"text/html");
  const src1=doc.getElementById("community-ui"),src2=doc.getElementById("notifications-ui");
  if(!src1||!src2)throw Error("Community templates missing.");
  const c=$("page-chat"),n=$("page-notifications");
  c.replaceChildren(src1.content.cloneNode(true));n.replaceChildren(src2.content.cloneNode(true));
  document.addEventListener("click",async event=>{
    const tab=event.target.closest("[data-sw-tab]");
    if(tab){choose(tab.dataset.swTab);return}
    const node=event.target.closest("[data-sw-action]");if(!node)return;
    try{await command(node.dataset.swAction,node.dataset.swId)}
    catch(e){flash(e.message||"Action failed.")}
  });
  $("sw-user-search").addEventListener("input",renderFriends);
  $("sw-auth-form").addEventListener("submit",async event=>{
    event.preventDefault();
    if(!state.db)return flash("Social backend not configured.");
    const email=$("sw-email").value.trim(),password=$("sw-password").value;
    try{
      if(state.mode==="signup"){
        const username=$("sw-register-username").value.trim().toLowerCase(),display=$("sw-register-name").value.trim();
        if(!/^[a-z][a-z0-9_]{2,19}$/.test(username)||!display||display.length>60)throw Error("Check username and display name.");
        sessionStorage.setItem("sw-pending-profile",JSON.stringify({username,display}));
        const data=await good(state.db.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname+"#chat"}}));
        flash(data.session?"Account created. Enable 2FA next.":"Confirm the email sent to you, then sign in and set up 2FA.");
      }else{await good(state.db.auth.signInWithPassword({email,password}),"Signed in. Verify 2FA to write messages.");}
      await refreshAuth();
    }catch(e){flash(e.message)}
  });
  $("sw-profile-form").addEventListener("submit",async event=>{
    event.preventDefault();if(!require2FA()&&state.profile)return;
    if(!uid()||!verified())return flash("Verify 2FA before saving a profile.");
    const username=$("sw-profile-username").value.trim().toLowerCase(),
      display_name=$("sw-profile-name").value.trim(),bio=$("sw-profile-bio").value.trim();
    if(!/^[a-z][a-z0-9_]{2,19}$/.test(username)||!display_name||display_name.length>60||bio.length>350)return flash("Check username, display name and bio.");
    try{
      const db=state.db.from("profiles");
      if(state.profile)await good(db.update({username,display_name,bio,updated_at:new Date().toISOString()}).eq("id",uid()),"Profile saved.");
      else await good(db.insert({id:uid(),username,display_name,bio}),"Profile created.");
      sessionStorage.removeItem("sw-pending-profile");await refreshAuth();
    }catch(e){flash(e.message)}
  });
  $("sw-global-form").addEventListener("submit",async event=>{
    event.preventDefault();if(!require2FA())return;
    const content=$("sw-global-text").value.trim();if(!content)return;
    try{await good(state.db.from("global_messages").insert({author:uid(),content}),"Sent.");
      $("sw-global-text").value="";await refreshData()}catch(e){flash(e.message)}
  });
  $("sw-direct-form").addEventListener("submit",async event=>{
    event.preventDefault();if(!require2FA())return;
    if(!state.peer||!friendsWith(state.peer)||blocked(state.peer))return flash("Select an accepted friend.");
    const content=$("sw-direct-text").value.trim();if(!content)return;
    try{await good(state.db.from("direct_messages").insert({sender:uid(),recipient:state.peer,content}),"Private message sent.");
      $("sw-direct-text").value="";await refreshData()}catch(e){flash(e.message)}
  });
  document.addEventListener("submit",async event=>{
    if(event.target.id!=="sw-verify-form")return;event.preventDefault();
    const code=$("sw-totp-code").value.trim();
    const factorId=state.enroll?.id||state.existingFactor?.id;
    if(!/^[0-9]{6}$/.test(code))return flash("Enter six digits.");
    try{
      if(!factorId)throw Error("No authenticator factor found.");
      await good(state.db.auth.mfa.challengeAndVerify({factorId,code}),"2FA verified.");
      state.enroll=null;await refreshAuth();
    }catch(e){flash(e.message)}
  });
  authForm();draw();
}
async function init(){
  try{
    await mount();
    if(!configured){flash("Preview mode: registration, messages, friends and notifications are disabled until a separate Fleki's Wrld backend is connected.");return}
    const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2.58.0?bundle");
    state.db=createClient(SOCIAL_CONFIG.url,SOCIAL_CONFIG.publishableKey,
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    state.db.auth.onAuthStateChange(()=>setTimeout(refreshAuth,0));
    await refreshAuth();
    setInterval(()=>{if(uid())refreshData()},12000);
  }catch(e){
    const area=$("sw-flash");if(area)area.textContent="Could not load social module: "+e.message;
  }
}
init();
