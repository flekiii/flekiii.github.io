"use strict";
const API="https://flekis-dark-side-api.flekideveloper.workers.dev";
const $=id=>document.getElementById(id);
const state={user:null,entries:[],members:[],invites:[],mode:"login",token:sessionStorage.getItem("darkside_session")||""};
let pendingInvite="";
if(location.hash.startsWith("#invite=")){
  try{pendingInvite=decodeURIComponent(location.hash.slice(8));}catch{}
  history.replaceState(null,"",location.pathname);
}
const show=(id,value=true)=>{const el=$(id);if(el)el.hidden=!value;};
function toast(message){const e=$("toast");e.textContent=message;e.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.hidden=true,4200);}
function notice(message){$("auth-error").textContent=message;show("auth-error",!!message);}
function date(ts){return new Date(ts).toLocaleString("uk-UA",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
async function api(path,{method="GET",body,authorized=true}={}){
  let headers={Accept:"application/json"};
  if(body!==undefined)headers["Content-Type"]="application/json";
  if(authorized&&state.token)headers.Authorization="Bearer "+state.token;
  let response;
  try{response=await fetch(API+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",credentials:"omit",mode:"cors",referrerPolicy:"no-referrer"});}
  catch {throw new Error("Немає зв'язку із сервером. Перевір інтернет і спробуй ще раз.");}
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw new Error(data.error||"Помилка запиту ("+response.status+")");
  return data;
}
async function passwordProof(password,salt){
  const secret=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const saltBytes=Uint8Array.from(salt.match(/../g).map(hex=>parseInt(hex,16)));
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:saltBytes,iterations:210000,hash:"SHA-256"},secret,256);
  return Array.from(new Uint8Array(bits)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}
function newSalt(){return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(byte=>byte.toString(16).padStart(2,"0")).join("");}
function authMode(mode){
  state.mode=mode;notice("");
  show("setup-wrap",mode==="setup");
  show("invite-wrap",mode==="join");
  show("password-rule",mode!=="login");
  show("auth-swap",mode!=="setup");
  $("username").autocomplete=mode==="login"?"username":"new-username";
  $("password").autocomplete=mode==="login"?"current-password":"new-password";
  const config={
    login:["Вхід до системи","Увійди за своїм логіном і паролем.","Увійти →","Маєш запрошення? Створити акаунт"],
    join:["Вхід за запрошенням","Створи окремий акаунт Dark Side. Реєстрація доступна лише за кодом.","Створити акаунт →","Вже є акаунт? Увійти"],
    setup:["Активація власника","Налаштуй перший акаунт із одноразовим ключем власника.","Активувати Dark Side →",""]
  }[mode];
  $("auth-title").textContent=config[0];$("auth-subtitle").textContent=config[1];$("auth-submit").textContent=config[2];$("auth-swap").textContent=config[3];
  if(mode==="join"&&pendingInvite)$("invite-code").value=pendingInvite;
  if(mode==="login")$("invite-code").value="";
}
async function init(){
  show("loading",true);show("auth",false);show("workspace",false);
  if(state.token){
    try{const d=await api("/me");state.user=d.user;await openWorkspace();return;}
    catch{sessionStorage.removeItem("darkside_session");state.token="";}
  }
  try{const d=await api("/bootstrap/status",{authorized:false});authMode(!d.ready?"setup":pendingInvite?"join":"login");show("auth",true);}
  catch(e){authMode("login");show("auth",true);notice(e.message);}
  finally{show("loading",false);}
}
$("auth-swap").addEventListener("click",()=>authMode(state.mode==="login"?"join":"login"));
$("auth-form").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("auth-submit");
  const username=$("username").value.trim(),password=$("password").value;
  if(!/^[A-Za-z0-9_]{3,24}$/.test(username)){notice("Логін: від 3 до 24 латинських літер, цифр або _.");return;}
  if(password.length<12||password.length>128){notice("Пароль має містити від 12 до 128 символів.");return;}
  btn.disabled=true;notice("");
  try{
    let path="/login",payload={username};
    if(state.mode==="login"){
      const challenge=await api("/auth/challenge",{method:"POST",body:{username},authorized:false});
      payload.proof=await passwordProof(password,challenge.salt);
    }else{
      const salt=newSalt();payload.salt=salt;
      payload.proof=await passwordProof(password,salt);
      if(state.mode==="setup"){path="/bootstrap";payload.setupKey=$("setup-key").value;}
      else {path="/join";payload.inviteCode=$("invite-code").value.trim();}
    }
    const d=await api(path,{method:"POST",body:payload,authorized:false});
    state.token=d.token;state.user=d.user;sessionStorage.setItem("darkside_session",state.token);
    $("password").value="";$("setup-key").value="";$("invite-code").value="";pendingInvite="";
    await openWorkspace();
    toast("Доступ підтверджено. Вітаємо в Dark Side.");
  }catch(err){notice(err.message);}
  finally{btn.disabled=false;}
});
async function openWorkspace(){
  const owner=state.user.role==="owner";
  document.querySelectorAll(".owner-only").forEach(el=>el.hidden=!owner);
  $("top-username").textContent=state.user.username;
  $("top-role").textContent=owner?"OWNER":"MEMBER";
  $("stat-role").textContent=owner?"Owner":"Member";
  show("loading",false);show("auth",false);show("workspace",true);navigate("dashboard");
  try{await refreshEntries();}catch(e){toast(e.message);}
  if(owner){try{await Promise.all([refreshMembers(),refreshInvites()]);}catch(e){toast(e.message);}}
}
function navigate(page){
  if((page==="members"||page==="invites")&&state.user?.role!=="owner")return;
  ["dashboard","vault","members","invites"].forEach(p=>{
    show("page-"+p,p===page);
    document.querySelector('[data-page="'+p+'"]')?.classList.toggle("selected",p===page);
  });
  $("crumb-page").textContent=({dashboard:"OVERVIEW",vault:"PRIVATE ENTRIES",members:"MEMBERS",invites:"INVITATIONS"})[page];
  if(page==="vault")refreshEntries().catch(e=>toast(e.message));
  if(page==="members")refreshMembers().catch(e=>toast(e.message));
  if(page==="invites")refreshInvites().catch(e=>toast(e.message));
}
document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.page)));
document.querySelectorAll("[data-action='go-vault']").forEach(btn=>btn.addEventListener("click",()=>navigate("vault")));
function empty(title,message){const x=node("div","empty-state");x.append(node("strong","",title),node("span","",message));return x;}
async function refreshEntries(){
  const d=await api("/entries");state.entries=d.entries;
  $("stat-entries").textContent=String(state.entries.length);
  renderEntries($("entries-list"),state.entries);
  renderEntries($("recent-entries"),state.entries.slice(0,3));
}
function renderEntries(root,items){
  root.replaceChildren();
  if(!items.length){root.append(empty("Поки що порожньо","Приватні записи з’являться тут після додавання власником."));return;}
  items.forEach(entry=>{
    const card=node("article","entry-card"),top=node("div","entry-top"),left=node("div"),meta=node("div","entry-meta","PRIVATE ENTRY");
    left.append(meta,node("h3","",entry.title));top.append(left);
    if(state.user?.role==="owner"){
      const del=node("button","mini-button danger","Видалити");
      del.type="button";
      del.addEventListener("click",()=>removeEntry(entry.id));
      top.append(del);
    }
    card.append(top,node("p","",entry.body),node("div","entry-date",date(entry.created_at)));
    root.append(card);
  });
}
$("new-entry").addEventListener("click",()=>{$("entry-form").reset();$("entry-dialog").showModal();});
$("entry-form").addEventListener("submit",async e=>{
  e.preventDefault();
  const title=$("entry-title").value.trim(),body=$("entry-body").value.trim();
  if(!title||!body){toast("Заповни назву і текст.");return;}
  const btn=e.target.querySelector("[type=submit]");btn.disabled=true;
  try{await api("/entries",{method:"POST",body:{title,body}});$("entry-dialog").close();await refreshEntries();toast("Запис збережено.");}
  catch(e){toast(e.message);}finally{btn.disabled=false;}
});
async function removeEntry(id){
  if(!confirm("Видалити приватний запис назавжди?"))return;
  try{await api("/entries/"+encodeURIComponent(id),{method:"DELETE"});await refreshEntries();toast("Запис видалено.");}catch(e){toast(e.message);}
}
async function refreshMembers(){
  if(state.user?.role!=="owner")return;
  const d=await api("/members");state.members=d.members;
  $("stat-members").textContent=String(state.members.filter(m=>m.enabled).length);
  const root=$("members-list");root.replaceChildren();
  d.members.forEach(m=>{
    const row=node("div","item-row"),person=node("div","person");
    person.append(node("div","person-icon",m.username.slice(0,1).toUpperCase()));
    const info=node("div");info.append(node("b","",m.username),node("small","",m.role==="owner"?"Власник · "+date(m.created_at):"Учасник · "+date(m.created_at)));
    person.append(info);row.append(person);
    const actions=node("div","row-actions");
    actions.append(node("span","state-pill"+(!m.enabled?" off":""),m.enabled?"Активний":"Вимкнений"));
    if(m.role!=="owner"){
      const toggle=node("button","mini-button",m.enabled?"Вимкнути":"Увімкнути");
      toggle.addEventListener("click",async()=>{
        if(m.enabled&&!confirm("Відкликати доступ для "+m.username+"? Усі його сесії буде завершено."))return;
        toggle.disabled=true;
        try{await api("/members/"+encodeURIComponent(m.id),{method:"PATCH",body:{enabled:!m.enabled}});await refreshMembers();toast("Доступ оновлено.");}
        catch(e){toast(e.message);}finally{toggle.disabled=false;}
      });
      actions.append(toggle);
    }
    row.append(actions);root.append(row);
  });
}
async function refreshInvites(){
  if(state.user?.role!=="owner")return;
  const d=await api("/invites");state.invites=d.invites;
  const root=$("invites-list");root.replaceChildren();
  if(!d.invites.length){root.append(empty("Немає запрошень","Створи перший код, щоб запросити довірену людину."));return;}
  d.invites.forEach(inv=>{
    const row=node("div","item-row"),info=node("div");
    info.append(node("b","","Запрошення · "+date(inv.created_at)),node("small","","Діє до "+date(inv.expires_at)));
    row.append(info);
    const actions=node("div","row-actions");
    let label="Активне",active=true;
    if(inv.used_at){label="Використано";active=false;}
    else if(inv.revoked_at){label="Скасовано";active=false;}
    else if(inv.expires_at<Date.now()){label="Прострочено";active=false;}
    actions.append(node("span","state-pill"+(!active?" off":""),label));
    if(active){
      const revoke=node("button","mini-button danger","Скасувати");
      revoke.addEventListener("click",async()=>{
        if(!confirm("Скасувати це запрошення?"))return;
        revoke.disabled=true;
        try{await api("/invites/"+encodeURIComponent(inv.id),{method:"DELETE"});await refreshInvites();toast("Запрошення скасовано.");}
        catch(e){toast(e.message);}
        finally{revoke.disabled=false;}
      });
      actions.append(revoke);
    }
    row.append(actions);root.append(row);
  });
}
$("create-invite").addEventListener("click",async()=>{
  const b=$("create-invite");b.disabled=true;
  try{
    const d=await api("/invites",{method:"POST",body:{ttlHours:Number($("ttl").value)}});
    $("invite-link").value=location.origin+location.pathname+"#invite="+encodeURIComponent(d.code);
    show("invite-result",true);await refreshInvites();
    toast("Запрошення створено. Скопіюй посилання зараз.");
  }catch(e){toast(e.message);}finally{b.disabled=false;}
});
$("copy-invite").addEventListener("click",async()=>{
  const input=$("invite-link");
  try{await navigator.clipboard.writeText(input.value);toast("Посилання скопійовано.");}
  catch{input.focus();input.select();toast("Виділи посилання та скопіюй Ctrl+C.");}
});
$("logout").addEventListener("click",async()=>{
  try{await api("/logout",{method:"POST"});}catch{}
  state.token="";state.user=null;state.entries=[];state.members=[];state.invites=[];
  sessionStorage.removeItem("darkside_session");show("invite-result",false);
  await init();
});
init();