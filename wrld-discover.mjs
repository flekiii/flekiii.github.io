/* Meet People — age-separated, opt-in friend / dating discovery. */
const root=document.getElementById("wrld-discover-root");
if(root){
 const API="https://flekis-wrld-api.flekideveloper.workers.dev";
 const tr=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const token=()=>sessionStorage.getItem("fw-token")||"";
 const active=()=>document.getElementById("page-discover")?.classList.contains("active");
 const isId=id=>/^[a-f0-9-]{36}$/i.test(String(id||""));
 let mode="friends",query="",loading=false,busy=false,members=[],message="",error="",group="",enabled=false,loaded=false;
 let requestId=0;
 async function api(path,method="GET",body){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
   const response=await fetch(API+path,{method,cache:"no-store",signal:ctl.signal,headers:{Accept:"application/json",Authorization:"Bearer "+token(),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||tr("Unable to complete request.","Не вдалося виконати запит."));
   return data;
  }finally{clearTimeout(timer)}
 }
 function profilePicture(p){
  const fallback=esc(String(p.display_name||p.username||"?").slice(0,1).toUpperCase());
  const src=p.media_public&&isId(p.id)?API+"/profiles/media/"+p.id+"/avatar":"";
  return '<span class="fd-avatar">'+fallback+(src?'<img src="'+src+'" loading="lazy" decoding="async" alt="" onerror="this.remove()">':'')+'</span>';
 }
 function interestTags(p){
  const interests=Array.isArray(p.interests)?p.interests.slice(0,7):[];
  if(!interests.length)return '<p class="fd-card-nointerests">'+tr("No public interests yet","Поки немає публічних інтересів")+'</p>';
  return '<div class="fd-tags">'+interests.map(x=>'<span>'+esc(window.WrldInterests?.label?.(x)||x)+'</span>').join("")+'</div>';
 }
 function card(p){
  const handle=/^fmail_[a-z0-9]+$/i.test(String(p.username||""))?"":"@"+esc(p.username);
  const age=esc(p.age_group||group);
  const shared=Math.max(0,Number(p.common||0));
  return '<article class="fd-card"><div class="fd-card-top">'+profilePicture(p)+
    '<div class="fd-card-name"><h3>'+esc(p.display_name||p.username)+'</h3><p>'+(handle?'<span>'+handle+'</span> · ':'')+
    '<span class="fd-age">'+age+'</span></p></div></div>'+
    (p.status_text?'<p class="fd-status">'+esc((p.status_emoji||"💬")+" "+p.status_text)+'</p>':'')+
    '<div class="fd-card-shared"><span aria-hidden="true">✦</span> '+shared+' '+tr("shared interests","спільних інтересів")+'</div>'+
    interestTags(p)+
    '<div class="fd-card-actions"><button type="button" class="btn primary" data-fd="friend" data-id="'+esc(p.id)+'" '+(p.already_friends?'disabled':'')+'>'+
     (p.already_friends?tr("✓ Already friends","✓ Уже друзі"):tr("👋 Send friend request","👋 Запросити в друзі"))+'</button>'+
    '<button type="button" class="btn" data-fd="view" data-username="'+esc(p.username)+'">'+tr("View profile","Переглянути профіль")+' ↗</button></div>'+
    '<div class="fd-card-safety"><button type="button" data-fd="report" data-username="'+esc(p.username)+'">⚑ '+tr("Report","Скарга")+'</button><button type="button" data-fd="block" data-id="'+esc(p.id)+'">⊘ '+tr("Block","Блокувати")+'</button></div></article>';
 }
 const profileLink=()=>'<button type="button" class="btn primary" data-fd="profile-settings">'+tr("Open profile settings","Відкрити налаштування профілю")+' ↗</button>';
 function state(){
  if(!token())return '<div class="fd-state"><span class="fd-state-icon" aria-hidden="true">🔐</span><h3>'+tr("Your world starts with an account","Твій світ починається з акаунта")+'</h3><p>'+tr("Sign in to find people who share your interests.","Увійди, щоб знаходити людей зі спільними інтересами.")+'</p>'+profileLink()+'</div>';
  if(error)return '<div class="fd-state" role="status"><span class="fd-state-icon" aria-hidden="true">✦</span><h3>'+tr("Discovery needs your attention","Пошук потребує налаштувань")+'</h3><p>'+esc(error)+'</p>'+profileLink()+'<button type="button" class="btn" data-fd="refresh">'+tr("Try again","Спробувати ще раз")+'</button></div>';
  if(mode==="dating"&&!enabled&&!loading)return '<div class="fd-state fd-dating-consent"><span class="fd-state-icon" aria-hidden="true">💜</span><h3>'+tr("Dating, only if you choose","Знайомства — лише за твоїм бажанням")+'</h3><p>'+tr("Available from 15. Teen profiles (15–17) are shown only to other teens in that group; adults are separate. Joining is completely optional.","Доступно з 15 років. Профілі 15–17 років бачать тільки інші користувачі цієї групи; дорослі окремо. Участь повністю добровільна.")+'</p><button type="button" class="btn primary" data-fd="enable-dating">'+tr("💜 Join dating discovery","💜 Увімкнути знайомства")+'</button><small>'+tr("You can leave anytime. Ages are self-declared, not verified.","Можна вимкнути будь-коли. Вік вказують самостійно, без перевірки.")+'</small></div>';
  if(loading)return '<div class="fd-state" role="status"><span class="fd-loader" aria-hidden="true">◌</span><p>'+tr("Finding people for you…","Шукаємо людей для тебе…")+'</p></div>';
  if(!members.length)return '<div class="fd-state"><span class="fd-state-icon" aria-hidden="true">✦</span><h3>'+tr("No matches just yet","Поки немає збігів")+'</h3><p>'+(query?tr("Try a different nickname or interest.","Спробуй інший нікнейм чи інтерес."):mode==="friends"?tr("Only opted-in members in your age group appear here. Enable friend discovery in Profile → About me.","Тут видно лише тих, хто добровільно відкрив пошук у своїй віковій групі. Увімкни пошук друзів у Профіль → Про мене."):tr("No one else has joined dating in your age group yet. You can check again later.","Поки ніхто інший із твоєї вікової групи не ввімкнув знайомства. Спробуй пізніше."))+'</p>'+(mode==="friends"?profileLink():'')+'</div>';
  return '<div class="fd-cards">'+members.map(card).join("")+'</div>';
 }
 function render(){
  if(!root)return;
  root.innerHTML='<div class="fd-shell"><header class="fd-hero"><span class="fd-hero-icon" aria-hidden="true">✦</span><div class="fd-hero-copy"><span class="overline">'+tr("FLEKI'S WRLD / MEET PEOPLE","FLEKI'S WRLD / ЗНАЙОМСТВА")+'</span><h2>'+tr("Meet your people.","Знайди своїх людей.")+'</h2><p>'+tr("Find people who share your interests and games, at your pace.","Знайомся з людьми зі спільними інтересами та іграми, у власному темпі.")+'</p></div><span class="fd-hero-group">'+(group||"15+")+'</span></header>'+
   '<div class="fd-panel"><div class="fd-panel-top"><div class="fd-modes" role="group" aria-label="'+tr("Discovery mode","Режим пошуку")+'">'+
   '<button type="button" data-fd="mode" data-mode="friends" class="'+(mode==="friends"?"active":"")+'" aria-pressed="'+(mode==="friends")+'">👥 '+tr("Find friends","Знайти друзів")+'</button>'+
   '<button type="button" data-fd="mode" data-mode="dating" class="'+(mode==="dating"?"active":"")+'" aria-pressed="'+(mode==="dating")+'">💜 '+tr("Dating · 15+","Знайомства · 15+")+'</button></div>'+
   (mode==="dating"&&enabled?'<button class="fd-optout" type="button" data-fd="disable-dating">'+tr("Leave dating","Вимкнути знайомства")+'</button>':'')+'</div>'+
   '<div class="fd-notice"><span aria-hidden="true">🛡️</span><p>'+(mode==="dating"?
    tr("Separate 15–17 and 18+ age groups. Only people who opt in appear. Ages are self-declared, not verified. Never share private contact details.","Окремі групи 15–17 та 18+. Відображаються лише ті, хто погодився. Вік не перевірений. Не поширюй особисті контакти."):
    tr("Friend discovery uses separate teen and adult groups. Nobody appears without opting in. Never share your address, phone, or passwords.","Пошук друзів розділений за віком. Ніхто не з’являється без згоди. Не поширюй адресу, телефон чи паролі."))+'</p></div>'+
   '<div class="fd-toolbar"><label class="fd-search"><span aria-hidden="true">⌕</span><input type="search" id="fd-query" value="'+esc(query)+'" maxlength="32" autocomplete="off" placeholder="'+tr("Nickname or interests…","Нікнейм або інтереси…")+'" aria-label="'+tr("Search people","Пошук людей")+'"></label><button type="button" class="btn primary" data-fd="search">'+tr("Search","Шукати")+'</button><button type="button" class="btn fd-refresh" data-fd="refresh" title="'+tr("Refresh","Оновити")+'" aria-label="'+tr("Refresh","Оновити")+'">↻</button></div>'+
   '<div class="fd-results-header"><strong>'+tr("People for you","Люди для тебе")+'</strong><span>'+(group?esc(group)+' · ':'')+members.length+' '+tr("profiles","профілів")+'</span></div>'+
   (message?'<p class="fd-feedback" role="status">'+esc(message)+'</p>':'')+
   '<section class="fd-results" aria-label="'+tr("People matching your interests","Люди зі спільними інтересами")+'">'+state()+'</section></div></div>';
 }
 async function load(){
  if(!active()||!token()){render();return}
  const rid=++requestId,currentMode=mode;
  loading=true;error="";message="";render();
  try{
   const path=currentMode==="dating"?"/discover/dating":"/discover/friends";
   const data=await api(path+"?q="+encodeURIComponent(query));
   if(rid!==requestId||mode!==currentMode)return;
   members=Array.isArray(data.members)?data.members:[];
   group=data.age_group||"";
   enabled=currentMode==="dating"?data.enabled===true:false;
  }catch(err){if(rid===requestId){members=[];group="";error=err.message}}
  finally{if(rid===requestId){loading=false;render()}}
 }
 root.addEventListener("click",async e=>{
  const button=e.target.closest?.("[data-fd]");if(!button||busy)return;
  const action=button.dataset.fd;
  if(action==="mode"){
   const next=button.dataset.mode==="dating"?"dating":"friends";
   if(next===mode)return;
   mode=next;members=[];error="";message="";group="";enabled=false;query="";
   ++requestId;loading=false;void load();return;
  }
  if(action==="search"||action==="refresh"){query=root.querySelector("#fd-query")?.value?.trim()||"";void load();return}
  if(action==="profile-settings"){location.hash="#profile";return}
  if(action==="view"){window.WrldProfile?.openPublic?.(button.dataset.username);return}
  if(!token()){location.hash="#profile";return}
  if(action==="enable-dating"||action==="disable-dating"){
   const join=action==="enable-dating";
   if(join&&!confirm(tr("Enable dating discovery? Only others in your 15–17 or 18+ age group who also opted in will see you. Age is self-declared, not verified.","Увімкнути знайомства? Тебе бачитимуть тільки інші учасники твоєї групи 15–17 або 18+, які також погодилися. Вік не перевірений.")))return;
   busy=true;button.disabled=true;
   try{await api("/discover/dating/optin","PUT",{enabled:join});enabled=join;message=join?tr("You joined dating discovery.","Ти ввімкнув(-ла) знайомства."):tr("You left dating discovery.","Ти вимкнув(-ла) знайомства.");members=[];await load()}
   catch(err){error=err.message;render()}
   finally{busy=false}
   return;
  }
  if(action==="block"&&!confirm(tr("Block this account? They will no longer appear to you.","Заблокувати акаунт? Ти більше не бачитимеш цю людину.")))return;
  if(action==="report"){
   const reason=prompt(tr("Describe the issue (10–300 characters)","Опиши проблему (10–300 символів)"));
   if(!reason)return;
   if(reason.trim().length<10||reason.trim().length>300){message=tr("Please use 10–300 characters.","Використай від 10 до 300 символів.");render();return}
   busy=true;button.disabled=true;
   try{await api("/discover/report","POST",{username:button.dataset.username,reason:reason.trim()});message=tr("Report sent. Thank you for helping keep people safe.","Скаргу надіслано. Дякуємо, що допомагаєш підтримувати безпеку.");render()}
   catch(err){message=err.message;render()}finally{busy=false}
   return;
  }
  busy=true;button.disabled=true;
  try{
   if(action==="friend"){await api("/discover/request","POST",{target_id:button.dataset.id,mode});message=tr("Friend request sent!","Запит у друзі надіслано!");members=members.map(m=>m.id===button.dataset.id?{...m,already_friends:true}:m)}
   if(action==="block"){await api("/blocks","POST",{target_id:button.dataset.id});members=members.filter(m=>m.id!==button.dataset.id);message=tr("Account blocked.","Акаунт заблоковано.")}
  }catch(err){message=err.message}finally{busy=false;render()}
 });
 root.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="fd-query"){e.preventDefault();query=e.target.value.trim();void load()}});
 window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="discover")void load()});
 window.addEventListener("fw-auth-changed",()=>{if(active())void load()});
 window.addEventListener("wrld:language-change",()=>{if(active())render()});
 render();
}
