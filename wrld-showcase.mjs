/* Public Showcase: real privacy-filtered profiles, photos and selected games. */
const root=document.getElementById("wrld-showcase-root");
if(root){
 const API="https://flekis-wrld-api.flekideveloper.workers.dev";
 const tr=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const token=()=>sessionStorage.getItem("fw-token")||"";
 const validId=x=>/^[a-f0-9-]{36}$/i.test(String(x||""));
 const validUsername=x=>/^[a-z][a-z0-9_]{2,23}$/i.test(String(x||""));
 let search="",profiles=[],published=false,loading=false,feedback="",revision=0;
 const active=()=>document.getElementById("page-showcase")?.classList.contains("active");
 const api=async(path,method="GET",body)=>{
  const timer=new AbortController(),time=setTimeout(()=>timer.abort(),12000);
  try{
   const r=await fetch(API+path,{method,headers:{Accept:"application/json",...(token()?{Authorization:"Bearer "+token()}:{}),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,signal:timer.signal,cache:"no-store"});
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(d.error||"Server error");
   return d;
  }finally{clearTimeout(time)}
 };
 // Never pass the signed-in session to this endpoint: Showcase must show EXACTLY
 // what a stranger is allowed to see, not private owner/friend profile data.
 async function publicDetails(username){
  if(!validUsername(username))throw Error("Invalid profile");
  const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),12000);
  try{
   const r=await fetch(API+"/profiles/public/"+encodeURIComponent(username),{method:"GET",headers:{Accept:"application/json"},credentials:"omit",cache:"no-store",signal:ctl.signal});
   if(!r.ok)throw Error("Public profile unavailable");
   const data=await r.json();
   if(!data?.profile||!validId(data.profile.id))throw Error("Public profile incomplete");
   return data.profile;
  }finally{clearTimeout(timeout)}
 }
 function imageLink(profile,kind){
  if(!profile||profile[kind]!==true||!validId(profile.id))return "";
  return API+"/profiles/media/"+encodeURIComponent(profile.id)+"/"+kind;
 }
 function gamesMarkup(label,icon,games){
  const list=Array.isArray(games)?games.filter(x=>typeof x==="string"&&x.trim()).slice(0,10):[];
  if(!list.length)return "";
  return '<section class="sc-game-section"><div class="sc-game-label"><span aria-hidden="true">'+icon+'</span>'+label+'</div><div class="sc-game-chips">'+
   list.map(name=>'<span class="sc-game-chip"><span aria-hidden="true">🎮</span> '+esc(name)+'</span>').join("")+'</div></section>';
 }
 function card(p,index){
  const d=p.detail||null;
  const accent=d&&/^#[0-9a-f]{6}$/i.test(String(d.accent||""))?d.accent:"#9b73e4";
  const name=String(p.display_name||p.username||tr("Member","Учасник")),initial=esc(name.slice(0,1).toUpperCase());
  const banner=imageLink(d,"banner"),avatar=imageLink(d,"avatar");
  const bio=d?(typeof d.bio==="string"?d.bio:""):String(p.bio||"");
  const interests=Array.isArray(d?.interests)?d.interests:Array.isArray(p.interests)?p.interests:[];
  const games=d?gamesMarkup(tr("Favorite games","Улюблені ігри"),"♥",d.favorite_games)+
      gamesMarkup(tr("Currently playing","Зараз граю"),"▶",d.current_games):"";
  const status=d?(typeof d.status_text==="string"?d.status_text:""):p.status_text||"";
  const emoji=d?(typeof d.status_emoji==="string"?d.status_emoji:""):p.status_emoji||"";
  const own=p.own===true,score=Number.isFinite(Number(p.score))?Number(p.score):0;
  const username=String(p.username||"");
  return '<article class="sc-profile" data-sc-index="'+index+'" data-sc-username="'+esc(username)+'" style="--sc-accent:'+accent+'">'+
    '<div class="sc-cover">'+(banner?'<img class="sc-banner-image" src="'+banner+'" loading="lazy" decoding="async" alt="" onerror="this.remove()">':'')+
     '<span class="sc-cover-mark" aria-hidden="true">✦</span><span class="sc-level">'+tr("LVL ","РІВЕНЬ ")+Math.max(1,Number(p.level||d?.level||1))+'</span></div>'+
    '<div class="sc-body"><div class="sc-person"><div class="sc-avatar">'+initial+
     (avatar?'<img src="'+avatar+'" loading="lazy" decoding="async" alt="" onerror="this.remove()">':'')+
     '</div><div class="sc-identity"><h3>'+esc(name)+'</h3>'+
     (/^fmail_[a-z0-9]+$/i.test(username)?'':'<p>@'+esc(username)+'</p>')+
     '</div>'+(own?'<span class="sc-own">'+tr("You","Ти")+'</span>':'')+'</div>'+
    (status?'<p class="sc-status">'+esc(emoji?emoji+" ":"")+esc(status)+'</p>':'')+
    '<p class="sc-bio">'+esc(bio||tr("No public description yet.","Поки немає публічного опису."))+'</p>'+
    (interests.length?'<div class="sc-interests">'+interests.slice(0,8).map(x=>'<span>'+esc(window.WrldInterests?.label?.(x)||x)+'</span>').join("")+'</div>':'')+
    (games?'<div class="sc-games">'+games+'</div>':'')+
    '<div class="sc-footer"><div class="sc-count"><strong>★ '+score.toFixed(1)+'</strong> / 5 <small>· '+Number(p.votes||0)+' '+tr("ratings","оцінок")+' · '+Number(p.xp||0)+' XP</small></div>'+
    '<div class="sc-stars" role="group" aria-label="'+tr("Rate profile","Оцінити профіль")+'">'+[1,2,3,4,5].map(x=>
     '<button type="button" data-sc="rate" data-username="'+esc(username)+'" data-stars="'+x+'" '+(!token()||own?'disabled ':'')+'aria-label="'+x+' '+tr("stars","зірок")+'" title="'+x+' / 5">★</button>').join("")+'</div>'+
    '<button type="button" class="btn sc-open" data-sc="open" data-username="'+esc(username)+'">'+tr("View profile","Переглянути профіль")+' ↗</button></div></div></article>';
 }
 function render(){
  root.innerHTML='<div class="sc-showcase"><header class="sc-hero"><div class="sc-hero-copy"><span class="overline">'+tr("FLEKI'S WRLD / SHOWCASE","FLEKI'S WRLD / ВІТРИНА")+'</span><h2>✦ '+tr("Discover profiles","Відкривай профілі")+'</h2><p>'+tr("Real styles, real games, real people. Share your profile and explore others.","Справжні оформлення, ігри та люди. Показуй свій профіль і відкривай інші.")+'</p></div>'+
   '<button type="button" class="btn '+(published?"":"primary")+' sc-publish" data-sc="publish" '+(!token()?'disabled':'')+'>'+(published?tr("✓ Published · Hide profile","✓ Опубліковано · Приховати"):tr("✦ Showcase my profile","✦ Опублікувати профіль"))+'</button></header>'+
   '<div class="sc-toolbar"><label class="sc-search"><span aria-hidden="true">⌕</span><input id="sc-search" type="search" autocomplete="off" maxlength="35" placeholder="'+tr("Search profiles…","Пошук профілів…")+'" value="'+esc(search)+'" aria-label="'+tr("Search profiles","Пошук профілів")+'"></label><button type="button" class="btn primary" data-sc="search">'+tr("Search","Шукати")+'</button><button type="button" class="btn sc-refresh" data-sc="refresh" aria-label="'+tr("Refresh profiles","Оновити профілі")+'" title="'+tr("Refresh","Оновити")+'">↻</button></div>'+
   '<p role="status" class="sc-feedback">'+esc(feedback)+'</p>'+
   (loading?'<div class="sc-empty">'+tr("Loading profiles…","Завантажуємо профілі…")+'</div>':
    '<div class="sc-grid">'+(profiles.length?profiles.map(card).join(""):
     '<div class="sc-empty">'+tr("No published profiles yet. Be the first!","Опублікованих профілів поки немає. Будь першим!")+'</div>')+'</div>')+
   '</div>';
 }
 async function hydrateCards(list,requestId){
  // Limit concurrent database requests; hydrate each visible card as its data arrives.
  let next=0;
  const workers=Array.from({length:Math.min(5,list.length)},async()=>{
   while(next<list.length&&requestId===revision){
    const index=next++,original=list[index];
    try{
     const detail=await publicDetails(original.username);
     if(requestId!==revision||!active()||profiles[index]?.username!==original.username)continue;
     profiles[index]={...profiles[index],detail};
     const element=root.querySelector?.('[data-sc-index="'+index+'"]');
     if(element?.dataset?.scUsername===original.username)element.outerHTML=card(profiles[index],index);
    }catch{ /* Show server-filtered basic card if detailed profile cannot be loaded. */ }
   }
  });
  await Promise.all(workers);
 }
 async function load(){
  if(!active()||loading)return;
  const requestId=++revision;
  loading=true;render();
  try{
   const data=await api("/showcase/list?q="+encodeURIComponent(search));
   if(requestId!==revision)return;
   profiles=Array.isArray(data.profiles)?data.profiles:[];
   published=data.my_visible===true;
   feedback="";
  }catch(err){if(requestId===revision)feedback=err.message||tr("Could not load profiles.","Не вдалося завантажити профілі.")}
  finally{
   if(requestId===revision){
    loading=false;render();
    if(profiles.length)void hydrateCards(profiles.slice(),requestId);
   }
  }
 }
 root.addEventListener("click",async event=>{
  const button=event.target.closest("[data-sc]");
  if(!button||loading)return;
  const action=button.dataset.sc;
  if(action==="open"){window.WrldProfile?.openPublic?.(button.dataset.username);return}
  if(action==="search"||action==="refresh"){search=root.querySelector("#sc-search")?.value.trim()||"";await load();return}
  if(!token()){location.hash="#profile";return}
  button.disabled=true;
  try{
   if(action==="publish"){
    const show=!published;await api("/showcase/publish","PUT",{visible:show});
    await load();feedback=show?tr("Your profile is now in Showcase.","Тепер твій профіль у вітрині."):tr("Your profile was removed from Showcase.","Профіль прибрано з вітрини.");
    const status=root.querySelector(".sc-feedback");if(status)status.textContent=feedback;
   }else if(action==="rate"){
    await api("/showcase/vote","POST",{username:button.dataset.username,stars:Number(button.dataset.stars)});
    await load();feedback=tr("Thanks for rating!","Дякуємо за оцінку!");
    const status=root.querySelector(".sc-feedback");if(status)status.textContent=feedback;
   }
  }catch(err){feedback=err.message||"Request failed";render()}
  finally{button.disabled=false}
 });
 root.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="sc-search"){e.preventDefault();search=e.target.value.trim();void load()}});
 window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="showcase")void load()});
 window.addEventListener("fw-auth-changed",()=>{if(active())void load()});
 window.addEventListener("wrld:profile-updated",()=>{if(active()&&!loading)void load()});
 window.addEventListener("wrld:language-change",()=>{if(active())render()});
 render();
}
