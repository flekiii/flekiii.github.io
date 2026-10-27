/* Public opt-in profile showcase with server-tracked star ratings. */
const root=document.getElementById("wrld-showcase-root");
if(root){
 const API="https://flekis-wrld-api.flekideveloper.workers.dev";
 const tr=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const token=()=>sessionStorage.getItem("fw-token")||"";
 let search="",profiles=[],published=false,loading=false,feedback="";
 const active=()=>document.getElementById("page-showcase")?.classList.contains("active");
 const api=async(path,method="GET",body)=>{
  const timer=new AbortController(),time=setTimeout(()=>timer.abort(),12000);
  try{const r=await fetch(API+path,{method,headers:{Accept:"application/json",...(token()?{Authorization:"Bearer "+token()}:{}),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,signal:timer.signal,cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Server error");return d}finally{clearTimeout(time)}
 };
 function render(){
  root.innerHTML='<div class="sc-showcase"><div class="sc-hero"><div><span class="overline">FLEKI’S WRLD · PROFILE SHOWCASE</span><h2>✨ '+tr("Your profile deserves the spotlight","Покажи свій профіль світові")+'</h2><p>'+tr("Show off your colors, games and style. Browse real published profiles and give them 1 to 5 stars.","Ділися кольорами, іграми та стилем. Дивись реальні профілі та оцінюй їх від 1 до 5 зірок.")+'</p></div>'+
   '<button type="button" class="btn '+(published?"":"primary")+'" data-sc="publish" '+(!token()?"disabled":"")+'>'+(published?tr("✓ Published · Unpublish","✓ Опубліковано · Приховати"):tr("✦ Showcase my profile","✦ Опублікувати профіль"))+'</button></div>'+
   '<div class="sc-bar"><input id="sc-search" type="search" placeholder="'+tr("Search nicknames","Пошук за нікнеймом")+'" value="'+esc(search)+'"><button class="btn primary" data-sc="search">'+tr("Find","Знайти")+'</button><button class="btn" data-sc="refresh">↻</button></div>'+
   '<p role="status" class="sc-feedback">'+esc(feedback)+'</p>'+
   (loading?'<div class="sc-empty">'+tr("Loading profiles…","Завантажуємо профілі…")+'</div>':
   '<div class="sc-grid">'+(profiles.length?profiles.map((p,i)=>
     '<article class="sc-profile"><div class="sc-cover"><span class="sc-spark">✧</span><span class="sc-level">★ '+Number(p.level||1)+'</span></div><div class="sc-profile-inner"><div class="sc-person"><div class="sc-avatar">'+esc(p.display_name.slice(0,1).toUpperCase())+'</div><div><h3>'+esc(p.display_name)+'</h3>'+( /^fmail_[a-z0-9]+$/i.test(p.username)?'':'<p>@'+esc(p.username)+'</p>')+'</div></div>'+
     (p.status_text?'<p class="sc-status">'+esc(p.status_emoji||"💬")+' '+esc(p.status_text)+'</p>':'')+
     '<p class="sc-bio">'+esc(p.bio||tr("A world of creativity.","Світ творчості."))+'</p>'+
     '<div class="sc-interests">'+(p.interests||[]).slice(0,6).map(x=>'<span>'+esc(window.WrldInterests?.label?.(x)||x)+'</span>').join("")+'</div>'+
     '<div class="sc-count">★ '+(Number(p.score||0).toFixed(1))+' / 5 <small>('+Number(p.votes||0)+' '+tr("ratings","оцінок")+')</small> · '+Number(p.xp||0)+' XP</div>'+
     '<div class="sc-stars" aria-label="'+tr("Rate profile","Оцінити профіль")+'">'+[1,2,3,4,5].map(x=>'<button type="button" data-sc="rate" data-username="'+esc(p.username)+'" data-stars="'+x+'" '+(!token()||p.own?"disabled":"")+' aria-label="'+x+' stars">★</button>').join("")+'</div>'+
     '<button class="btn" data-sc="open" data-username="'+esc(p.username)+'">'+tr("View profile ↗","Переглянути профіль ↗")+'</button></div></article>'
    ).join(""):'<div class="sc-empty">'+tr("No public profiles yet. Be the first!","Поки немає опублікованих профілів. Будь першим!")+'</div>')+'</div>')+'</div>';
 }
 async function load(){
  if(!active()||loading)return;loading=true;render();
  try{const data=await api("/showcase/list?q="+encodeURIComponent(search));profiles=data.profiles||[];published=data.my_visible===true;feedback=""}
  catch(err){feedback=err.message}finally{loading=false;render()}
 }
 root.addEventListener("click",async e=>{
  const b=e.target.closest("[data-sc]");if(!b||loading)return;const a=b.dataset.sc;
  if(a==="open"){window.WrldProfile?.openPublic?.(b.dataset.username);return}
  if(a==="search"||a==="refresh"){search=root.querySelector("#sc-search")?.value.trim()||"";await load();return}
  if(!token()){location.hash="#profile";return}
  b.disabled=true;try{
   if(a==="publish"){
    await api("/showcase/publish","PUT",{visible:!published});published=!published;feedback=published?tr("Profile published!","Профіль опубліковано!"):tr("Profile hidden.","Профіль приховано.");
   }else if(a==="rate"){
    await api("/showcase/vote","POST",{username:b.dataset.username,stars:Number(b.dataset.stars)});feedback=tr("Thanks for rating!","Дякуємо за оцінку!");
   }else return;
   await load();
  }catch(err){feedback=err.message;render()}finally{b.disabled=false}
 });
 root.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="sc-search"){e.preventDefault();search=e.target.value.trim();void load()}});
 window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="showcase")void load()});
 window.addEventListener("fw-auth-changed",()=>{if(active())void load()});
 window.addEventListener("wrld:language-change",()=>{if(active())render()});
 render();
}
