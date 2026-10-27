import {feedMarkup,commentsMarkup,clubsMarkup} from "./wrld-world-social.mjs?v=1";
const root=document.getElementById("wrld-world-root"),API="https://flekis-wrld-api.flekideveloper.workers.dev";
if(root){
 const esc=x=>String(x??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
 const t=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const token=()=>sessionStorage.getItem("fw-token")||"";
 let tab="gallery",loading=false,feedMode="all",gallerySort="popular",search="",nonce=0;
 const active=()=>document.getElementById("page-world")?.classList.contains("active");
 async function api(path,method="GET",body){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const res=await fetch(API+path,{method,headers:{Accept:"application/json",...(token()?{Authorization:"Bearer "+token()}:{}),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store",signal:controller.signal});
   const json=await res.json().catch(()=>({}));if(!res.ok)throw Error(json.error||"Request failed: "+res.status);
   return json;
  }finally{clearTimeout(timeout)}
 }
 const notice=s=>{const n=root.querySelector("#ww-feedback");if(n)n.textContent=s};
 const tabs=[["gallery","🏠","Houses","Будинки"],["feed","✦","Activity","Активність"],["clubs","👥","Clubs","Клуби"],["progress","🏆","Progress","Прогрес"]];
 function shell(){
  root.innerHTML='<div class="ww-shell"><div class="ww-tabs">'+tabs.map(([id,icon,en,uk])=>'<button class="'+(id===tab?"active":"")+'" data-ww="tab" data-id="'+id+'">'+icon+' '+t(en,uk)+'</button>').join("")+'</div><div id="ww-body" class="ww-body" aria-live="polite"></div><p id="ww-feedback" class="ww-feedback" role="status"></p></div>';
 }
 const body=()=>root.querySelector("#ww-body");
 async function render(){
  if(!root||!active()||loading)return;const seq=++nonce;loading=true;shell();body().innerHTML='<p class="ww-empty">'+t("Loading world…","Завантажуємо світ…")+'</p>';
  try{
   let html="";
   if(tab==="gallery"){
    const r=await api("/world/gallery?sort="+gallerySort+"&q="+encodeURIComponent(search));
    html='<div class="ww-toolbar"><input id="ww-search" maxlength="50" placeholder="'+t("Search homes…","Пошук будинків…")+'" value="'+esc(search)+'"><button class="btn" data-ww="search">'+t("Find","Знайти")+'</button><button class="btn" data-ww="sort">'+(gallerySort==="popular"?t("Popular ↓","Популярні ↓"):t("Newest ↓","Нові ↓"))+'</button></div><div class="ww-cards">'+(r.houses?.length?r.houses.map(h=>'<article class="ww-item ww-home"><div class="ww-home-icon">'+(["garage","garagehouse","workshop"].includes(h.template)?"🚗":"🏡")+'</div><h3>'+esc(h.name)+'</h3><p>@'+esc(h.username)+' · '+esc(h.template)+'</p><small>💜 '+Number(h.reactions||0)+'</small><a class="btn primary" href="#house?u='+encodeURIComponent(h.username)+'">'+t("Visit in 3D →","Відвідати в 3D →")+'</a></article>').join(""):'<p class="ww-empty">'+t("No public houses found.","Публічних будинків не знайдено.")+'</p>')+'</div>';
   }else if(tab==="feed"){
    const r=await api("/world/feed?mode="+feedMode);html=feedMarkup(r.posts);
   }else if(tab==="clubs"){
    const r=await api("/world/clubs");html=clubsMarkup(r.clubs);
   }else{
    const [rank,own,quests]=await Promise.all([api("/world/ranking"),token()?api("/world/progress").catch(()=>({progress:null})):Promise.resolve({}),token()?api("/world/quests").catch(()=>({quests:[]})):Promise.resolve({quests:[]})]);
    const p=own.progress;
    html='<div class="ww-progress"><h2>'+t("Your level and rewards","Твій рівень і нагороди")+'</h2>'+(p?'<div class="ww-level">★ '+p.level+'</div><strong>'+p.xp+' XP</strong><p>'+t("Earn XP by posting and creating clubs. Daily caps stop easy farming.","Отримуй XP за публікації та створення клубів. Є щоденні обмеження від накрутки.")+'</p><div class="ww-badges">'+(p.badges?.length?p.badges.map(x=>'<span class="ww-badge">'+esc(x.replaceAll("-"," "))+'</span>').join(""):t("Badges are waiting for you.","Значки вже чекають на тебе."))+'</div>':'<p>'+t("Sign in to see your achievements.","Увійди, щоб побачити досягнення.")+'</p>')+'</div><h2>'+t("Community ranking","Рейтинг спільноти")+'</h2><div class="ww-ranking">'+(rank.ranking?.length?rank.ranking.map((r,i)=>'<p><strong>#'+(i+1)+' · @'+esc(r.username)+'</strong><span>★ '+r.level+' · '+r.xp+' XP</span></p>').join(""):'<p>'+t("Nobody has earned XP yet.","Ще ніхто не отримав XP.")+'</p>')+'</div>';
   }
   if(tab==="progress"&&token()){
    html+='<div class="ww-quests"><h2>'+t("Daily quests and milestones","Щоденні квести й цілі")+'</h2><p>'+t("Earn XP only for real actions. Completed quests can be claimed once per day or once ever, depending on the goal.","Отримуй XP лише за справжні дії. Нагороди доступні раз на день або один раз назавжди — залежно від цілі.")+'</p><div class="ww-quest-grid">'+(quests.quests||[]).map(q=>
      '<article class="ww-quest '+(q.claimed?"completed":"")+'"><span class="ww-quest-icon">'+esc(q.emoji)+'</span><div><strong>'+esc(t(q.title,q.uk))+'</strong><small>+'+Number(q.xp)+' XP</small></div>'+
      (q.claimed?'<span class="ww-quest-done">✓ '+t("Claimed","Отримано")+'</span>':
      '<button class="btn '+(q.complete?"primary":"")+'" data-ww="quest-claim" data-id="'+esc(q.id)+'" '+(q.complete?"":"disabled")+'>'
      +(q.complete?t("Claim XP","Забрати XP"):t("Not yet","Ще не виконано"))+'</button>')+'</article>').join("")+'</div></div>';
   }
   if(tab==="progress")html+='<p><a class="btn" href="/account-export.html">↓ '+t("Export my data","Експорт моїх даних")+'</a></p>';
   if(seq===nonce&&active())body().innerHTML=html;
  }catch(error){if(seq===nonce&&body())body().innerHTML='<p class="ww-empty">'+esc(error.message)+' <button class="btn" data-ww="retry">'+t("Retry","Повторити")+'</button></p>'}
  finally{loading=false}
 }
 root.addEventListener("click",async event=>{
  const el=event.target.closest("[data-ww]");if(!el||loading)return;
  const a=el.dataset.ww,id=el.dataset.id;
  if(a==="tab"){tab=id;void render();return}
  if(a==="retry"){void render();return}
  if(a==="search"){search=root.querySelector("#ww-search")?.value||"";void render();return}
  if(a==="sort"){gallerySort=gallerySort==="new"?"popular":"new";void render();return}
  if(a==="quest-claim"){
   el.disabled=true;
   try{const result=await api("/world/quest/claim","POST",{id});await render();notice(t("Reward claimed: +","Нагорода отримана: +")+result.xp+" XP");window.WrldProfile?.refresh?.()}
   catch(error){notice(error.message)}finally{el.disabled=false}
   return;
  }
  if(a==="feed-mode"){feedMode=el.dataset.mode;void render();return}
  const actions={post:["/world/post",{body:root.querySelector("#ww-post")?.value}],club:["/world/club",{name:root.querySelector("#ww-club-name")?.value,description:root.querySelector("#ww-club-description")?.value}],like:["/world/like",{id}],follow:["/world/follow",{username:el.dataset.user}],join:["/world/join",{id}],comment:["/world/comment",{id,body:root.querySelector('[data-comment-input="'+id+'"]')?.value}]};
  if(a==="comments"){
   try{const r=await api("/world/comments?post="+encodeURIComponent(id));const container=root.querySelector('[data-comments="'+id+'"]');if(container)container.innerHTML=commentsMarkup(r.comments,id)}catch(e){notice(e.message)}return;
  }
  if(!actions[a])return;
  if(!token()){location.hash="#profile";return}
  el.disabled=true;
  try{await api(actions[a][0],"POST",actions[a][1]);await render();notice(t("Saved!","Збережено!"))}
  catch(e){notice(e.message)}finally{el.disabled=false}
 });
 window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="world")void render()});
 window.addEventListener("wrld:language-change",()=>{if(active())void render()});
 window.addEventListener("fw-auth-changed",()=>{if(active())void render()});
 if(active())void render();
}
