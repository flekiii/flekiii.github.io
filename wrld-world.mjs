import {feedMarkup,commentsMarkup,clubsMarkup} from "./wrld-world-social.mjs?v=1";
const root=document.getElementById("wrld-world-root"),API="https://flekis-wrld-api.flekideveloper.workers.dev";
if(root){
 const esc=x=>String(x??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
 const t=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const token=()=>sessionStorage.getItem("fw-token")||"";
 let tab="feed",loading=false,feedMode="all",gallerySort="popular",search="",nonce=0,questFilter="all",questTerm="",lastTab="";
 const active=()=>document.getElementById("page-world")?.classList.contains("active");
 async function api(path,method="GET",body){
  // Retry one transient network error for reads only. Never retry a claim or other write.
  for(let attempt=0;attempt<(method==="GET"?2:1);attempt++){
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
   try{
    const res=await fetch(API+path,{method,headers:{Accept:"application/json",...(token()?{Authorization:"Bearer "+token()}:{}),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store",signal:controller.signal});
    const json=await res.json().catch(()=>({}));if(!res.ok)throw Error(json.error||"Request failed: "+res.status);
    return json;
   }catch(error){
    const networkError=error?.name==="TypeError"||error?.name==="AbortError";
    if(networkError&&method==="GET"&&attempt===0)continue;
    if(networkError)throw Error(t("World API is unreachable. Check your connection or browser protection, then retry.","API світу недоступний. Перевір з’єднання або захист браузера та повтори."));
    throw error;
   }finally{clearTimeout(timeout)}
  }
 }
 const notice=s=>{const n=root.querySelector("#ww-feedback");if(n)n.textContent=s};
 const tabs=[["feed","✦","Activity","Активність"],["clubs","👥","Clubs","Клуби"],["progress","🏆","Progress","Прогрес"]];
 function shell(){
  root.innerHTML='<div class="ww-shell"><div class="ww-tabs">'+tabs.map(([id,icon,en,uk])=>'<button class="'+(id===tab?"active":"")+'" data-ww="tab" data-id="'+id+'">'+icon+' '+t(en,uk)+'</button>').join("")+'</div><div id="ww-body" class="ww-body" aria-live="polite"></div><p id="ww-feedback" class="ww-feedback" role="status"></p></div>';
 }
 const body=()=>root.querySelector("#ww-body");
 async function render(){
  if(!root||!active()||loading)return;const seq=++nonce,priorScroll=lastTab===tab?(body()?.scrollTop||0):0;loading=true;shell();body().innerHTML='<p class="ww-empty">'+t("Loading world…","Завантажуємо світ…")+'</p>';
  try{
   let html="",quests={quests:[]};
   if(tab==="feed"){
    const r=await api("/world/feed?mode="+feedMode);html=feedMarkup(r.posts);
   }else if(tab==="clubs"){
    const r=await api("/world/clubs");html=clubsMarkup(r.clubs);
   }else{
    const [rank,own,questResult]=await Promise.all([api("/world/ranking").catch(()=>({ranking:[]})),token()?api("/world/progress").catch(()=>({progress:null})):Promise.resolve({}),token()?api("/world/quests").catch(e=>({quests:[],error:e.message})):Promise.resolve({quests:[]})]);
    quests=questResult;
    const p=own.progress;
    html='<div class="ww-progress"><h2>'+t("Your level and rewards","Твій рівень і нагороди")+'</h2>'+(p?'<div class="ww-level">★ '+p.level+'</div><strong>'+p.xp+' XP</strong><p>'+t("Earn XP by posting and creating clubs. Daily caps stop easy farming.","Отримуй XP за публікації та створення клубів. Є щоденні обмеження від накрутки.")+'</p><div class="ww-badges">'+(p.badges?.length?p.badges.map(x=>'<span class="ww-badge">'+esc(x.replaceAll("-"," "))+'</span>').join(""):t("Badges are waiting for you.","Значки вже чекають на тебе."))+'</div>':'<p>'+t("Sign in to see your achievements.","Увійди, щоб побачити досягнення.")+'</p>')+'</div><h2>'+t("Community ranking","Рейтинг спільноти")+'</h2><div class="ww-ranking">'+(rank.ranking?.length?rank.ranking.map((r,i)=>'<p><strong>#'+(i+1)+' · @'+esc(r.username)+'</strong><span>★ '+r.level+' · '+r.xp+' XP</span></p>').join(""):'<p>'+t("Nobody has earned XP yet.","Ще ніхто не отримав XP.")+'</p>')+'</div>';
   }
   if(tab==="progress"&&token()){
    html+='<div class="ww-quests"><div class="ww-quest-heading"><div><span class="overline">'+t("REAL ACTIONS · REAL XP","СПРАВЖНІ ДІЇ · СПРАВЖНІ XP")+'</span><h2>'+t("Daily quests and milestones","Щоденні квести й цілі")+'</h2></div><strong>'+Number(quests.quests?.length||0)+' '+t("quests","квестів")+'</strong></div><div class="ww-quest-tools"><input id="ww-quest-search" type="search" maxlength="70" placeholder="'+t("Find quests…","Пошук квестів…")+'" aria-label="'+t("Search quests","Пошук квестів")+'" value="'+esc(questTerm)+'"><div class="ww-quest-filters">'+[["all",t("All","Усі")],["ready",t("Claimable","Готові")],["ongoing",t("In progress","У процесі")],["claimed",t("Claimed","Отримано")]].map(([v,l])=>'<button data-ww="quest-filter" data-id="'+v+'" type="button" class="'+(questFilter===v?"active":"")+'" aria-pressed="'+(questFilter===v)+'">'+l+'</button>').join("")+'</div></div><p>'+t("Earn XP only for real actions. Completed quests can be claimed once per day or once ever, depending on the goal.","Отримуй XP лише за справжні дії. Нагороди доступні раз на день або один раз назавжди — залежно від цілі.")+'</p>'+(quests.error?'<p class="ww-quest-alert" role="alert">'+esc(quests.error)+' <button data-ww="retry" class="btn">'+t('Retry','Повторити')+'</button></p>':'')+'<div class="ww-quest-grid">'+(quests.quests||[]).map(q=>
      '<article class="ww-quest '+(q.claimed?"completed":"")+'" data-state="'+(q.claimed?"claimed":q.complete?"ready":"ongoing")+'" data-search="'+esc((q.title+" "+q.uk).toLowerCase())+'"><span class="ww-quest-icon">'+esc(q.emoji)+'</span><div><strong>'+esc(t(q.title,q.uk))+'</strong><small>'+Math.min(Number(q.current||0),Number(q.required||1))+' / '+Number(q.required||1)+' · +'+Number(q.xp)+' XP</small><div class="ww-quest-meter"><span style="width:'+Math.min(100,Math.round(Number(q.current||0)/Number(q.required||1)*100))+'%"></span></div></div>'+
      (q.claimed?'<span class="ww-quest-done">✓ '+t("Claimed","Отримано")+'</span>':
      '<button class="btn '+(q.complete?"primary":"")+'" data-ww="quest-claim" data-id="'+esc(q.id)+'" '+(q.complete?"":"disabled")+'>'
      +(q.complete?t("Claim XP","Забрати XP"):t("Not yet","Ще не виконано"))+'</button>')+'</article>').join("")+'</div><p class="ww-no-filter-results" hidden>'+t("No matching quests","За цими фільтрами немає квестів")+'</p></div>';
   }
   if(tab==="progress")html+='<p><a class="btn" href="/account-export.html">↓ '+t("Export my data","Експорт моїх даних")+'</a></p>';
   if(seq===nonce&&active()){body().innerHTML=html;body().scrollTop=priorScroll;lastTab=tab;filterQuests()}
  }catch(error){if(seq===nonce&&body())body().innerHTML='<p class="ww-empty">'+esc(error.message)+' <button class="btn" data-ww="retry">'+t("Retry","Повторити")+'</button></p>'}
  finally{loading=false}
 }
 function filterQuests(){
  if(!root.querySelectorAll)return;
  let shown=0;
  for(const item of root.querySelectorAll(".ww-quest")){
   const state=item.dataset.state,name=item.dataset.search||"";
   const visible=(questFilter==="all"||questFilter===state)&&name.includes(questTerm.toLowerCase().trim());
   item.hidden=!visible;if(visible)shown++;
  }
  const empty=root.querySelector(".ww-no-filter-results");if(empty)empty.hidden=shown>0;
  for(const btn of root.querySelectorAll('[data-ww="quest-filter"]')){const isOn=btn.dataset.id===questFilter;btn.classList.toggle("active",isOn);btn.setAttribute("aria-pressed",String(isOn))}
 }
 root.addEventListener("input",event=>{if(event.target?.id==="ww-quest-search"){questTerm=event.target.value;filterQuests()}});
 root.addEventListener("click",async event=>{
  const el=event.target.closest("[data-ww]");if(!el||loading)return;
  const a=el.dataset.ww,id=el.dataset.id;
  if(a==="tab"){tab=id;void render();return}
  if(a==="retry"){void render();return}
  if(a==="quest-filter"){questFilter=id;filterQuests();return}
  
  
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
