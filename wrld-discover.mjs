/* Opt-in, age-separated friend discovery. Romance is disabled without reliable adult age verification. */
const root=document.getElementById("wrld-discover-root");
if(root){
 const API="https://flekis-wrld-api.flekideveloper.workers.dev";
 const esc=s=>String(s??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
 const tr=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const token=()=>sessionStorage.getItem("fw-token")||"";
 let query="",loading=false,members=[],message="",group="";
 const active=()=>document.getElementById("page-discover")?.classList.contains("active");
 async function api(path,method="GET",body){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
   const result=await fetch(API+path,{method,cache:"no-store",signal:ctl.signal,headers:{Authorization:"Bearer "+token(),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
   const json=await result.json().catch(()=>({}));
   if(!result.ok)throw Error(json.error||tr("Could not complete the request.","Не вдалося виконати дію."));
   return json;
  }finally{clearTimeout(timer)}
 }
 function show(){
  if(!root)return;
  root.innerHTML='<div class="fd-layout"><div class="fd-hero"><span class="overline">FLEKI’S WRLD · FRIEND DISCOVERY</span><h2>👋 '+tr("Meet your people","Знайди своїх людей")+'</h2>'+
   '<p>'+tr("Find friends through shared interests and games. Nobody appears here without choosing to.","Знаходь друзів за спільними інтересами та іграми. Ніхто не з’являється тут без своєї згоди.")+'</p>'+
   '<div class="fd-modes"><button class="active" type="button">'+tr("👥 Find friends","👥 Знайти друзів")+'</button><button disabled type="button" title="'+tr("Adult age verification is not available yet.","Підтвердження повноліття ще недоступне.")+'">'+tr("💜 Dating · 18+ (not available)","💜 Пошук пари · 18+ (недоступно)")+'</button></div>'+
   '<p class="fd-caution">'+tr("Friend discovery is separate for under-18 and adult accounts, based on self-declared ages. Never share your address, phone or passwords. Report inappropriate behavior.","Пошук друзів розділений для підлітків і дорослих за самостійно вказаним віком. Не поширюй адресу, телефон чи паролі. Скаржся на неприйнятну поведінку.")+'</p></div>'+
   (!token()?'<div class="fd-empty">'+tr("Sign in first to find people.","Спочатку увійди, щоб знаходити людей.")+' <a class="btn primary" href="#profile">'+tr("Sign in","Увійти")+'</a></div>':
   '<div class="fd-toolbar"><input type="search" id="fd-query" placeholder="'+tr("Search nickname or interests…","Пошук нікнейму чи інтересів…")+'" value="'+esc(query)+'" maxlength="32"><button class="btn primary" data-fd="search">'+tr("Search","Шукати")+'</button><button class="btn" data-fd="refresh">↻</button></div>'+
   '<p class="fd-feedback" role="status">'+esc(message)+(group?' · '+esc(group):"")+'</p>'+
   (loading?'<p class="fd-empty">'+tr("Loading members…","Завантажуємо учасників…")+'</p>':
   '<div class="fd-grid">'+(members.length?members.map(p=>
   '<article class="fd-card"><div class="fd-card-top"><span class="fd-avatar">'+esc((p.display_name||p.username).slice(0,1).toUpperCase())+'</span><div><h3>'+esc(p.display_name)+'</h3><small>@'+esc(p.username)+' · '+esc(p.age_group)+'</small></div></div>'+
   (p.status_text?'<p>'+esc(p.status_emoji||"💬")+' '+esc(p.status_text)+'</p>':"")+
   '<div class="fd-tags">'+(p.interests||[]).map(x=>'<span>'+esc(x)+'</span>').join("")+'</div>'+
   '<small>'+p.common+' '+tr("shared interests","спільних інтересів")+'</small>'+
   '<div class="fd-actions"><button type="button" class="btn primary" data-fd="friend" data-id="'+esc(p.id)+'" '+(p.already_friends?"disabled":"")+'>'+(p.already_friends?tr("Already friends","Вже друзі"):tr("Add friend","Додати в друзі"))+'</button>'+
   '<button class="btn" data-fd="view" data-username="'+esc(p.username)+'">'+tr("Profile","Профіль")+'</button>'+
   '<button class="btn" data-fd="report" data-username="'+esc(p.username)+'">'+tr("Report","Скарга")+'</button><button class="btn" data-fd="block" data-id="'+esc(p.id)+'">'+tr("Block","Блокувати")+'</button></div></article>').join(""):'<div class="fd-empty">'+tr("Nobody found yet. You can opt in from Profile → About me.","Поки нікого немає. Увімкни пошук у Профіль → Про мене.")+'</div>')+'</div>'))+'</div>';
 }
 async function load(){
  if(!active()||!token()||loading){show();return}
  loading=true;show();
  try{const data=await api("/discover/friends?q="+encodeURIComponent(query));members=data.members||[];group=data.age_group;message=tr("Only people in your age group are shown.","Показано лише людей твоєї вікової групи.")}
  catch(e){members=[];message=e.message;group=""}
  finally{loading=false;show()}
 }
 root.addEventListener("click",async e=>{
  const button=e.target.closest("[data-fd]");if(!button||loading)return;
  const action=button.dataset.fd;let name=button.dataset.username;
  if(action==="search"||action==="refresh"){query=root.querySelector("#fd-query")?.value?.trim()||"";await load();return}
  if(action==="view"){window.WrldProfile?.openPublic?.(name);return}
  if(!token()){location.hash="#profile";return}
  button.disabled=true;
  try{
   if(action==="friend"){await api("/discover/request","POST",{target_id:button.dataset.id});message=tr("Friend request sent!","Запит у друзі надіслано!")}
   if(action==="block"){
    if(!confirm(tr("Block this account?","Заблокувати цей акаунт?")))return;
    await api("/blocks","POST",{target_id:button.dataset.id});members=members.filter(x=>x.id!==button.dataset.id);message=tr("Account blocked","Акаунт заблоковано");
   }
   if(action==="report"){
    const reason=prompt(tr("Describe the problem (10–300 characters)","Опиши проблему (10–300 символів)"));
    if(!reason)return;
    await api("/discover/report","POST",{username:name,reason});message=tr("Report submitted","Скаргу надіслано");
   }
  }catch(error){message=error.message}finally{button.disabled=false;show()}
 });
 root.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="fd-query"){e.preventDefault();query=e.target.value.trim();void load()}});
 window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="discover")void load()});
 window.addEventListener("wrld:language-change",()=>{if(active())show()});
 window.addEventListener("fw-auth-changed",()=>{if(active())void load()});
 show();
}
