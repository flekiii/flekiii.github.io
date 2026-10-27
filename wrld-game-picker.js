/* Real searchable Steam catalogue for profile, from verified SteamSpy app IDs. */
(()=>{"use strict";
 const API="https://flekis-wrld-api.flekideveloper.workers.dev";
 const E=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
 const tr=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 let games=[],page=0,loading=false,loaded=false,error="",query="",section="favorite_games",selected={favorite_games:[],current_games:[]};
 const byName=new Map();
 const cover=id=>"https://cdn.akamai.steamstatic.com/steam/apps/"+id+"/header.jpg";
 async function fetchPage(){
  if(loading)return;
  loading=true;error="";paint();
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);
   let response;
   try{response=await fetch(API+"/games/catalog?page="+page,{cache:"no-store",signal:controller.signal})}finally{clearTimeout(timeout)}
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||tr("Game service unavailable","Каталог ігор недоступний"));
   if(!Array.isArray(data.games)||!data.games.length)throw Error(tr("No games were returned. Retry later.","Ігри не завантажилися. Повтори пізніше."));
   for(const item of data.games){
    if(!Number.isInteger(item.id)||typeof item.name!=="string"||item.name.length>56||byName.has(item.name.toLowerCase()))continue;
    games.push({id:item.id,name:item.name});byName.set(item.name.toLowerCase(),item.id);
   }
   loaded=true;page++;paint();
  }catch(e){error=e.name==="AbortError"?tr("Timed out, retry","Перевищено час очікування, повтори"):e.message;paint()}
  finally{loading=false;paint()}
 }
 const listed=()=>selected[section]||[];
 function miniCard(name){
  const id=byName.get(String(name).toLowerCase());
  return '<span class="wp-real-game-mini">'+(id?'<img loading="lazy" src="'+cover(id)+'" alt="" onerror="this.remove()">':'<span>🎮</span>')+E(name)+'</span>';
 }
 function render(p){
  selected={favorite_games:[...(p.favorite_games||[])],current_games:[...(p.current_games||[])]};
  return '<div class="wp-game-browser">'+
   '<div class="wp-game-sections"><button class="btn '+(section==="favorite_games"?"primary":"")+'" data-gp="section" data-id="favorite_games">'+tr("♥ Favorites","♥ Улюблені")+' ('+selected.favorite_games.length+'/10)</button>'+
   '<button class="btn '+(section==="current_games"?"primary":"")+'" data-gp="section" data-id="current_games">'+tr("▶ Playing","▶ Зараз граю")+' ('+selected.current_games.length+'/10)</button></div>'+
   '<div class="wp-game-search"><input id="wp-game-query" class="social-input" type="search" autocomplete="off" placeholder="'+tr("Search Steam games by name…","Шукай Steam-ігри за назвою…")+'" value="'+E(query)+'"><button type="button" class="btn" data-gp="search">'+tr("Find","Знайти")+'</button></div>'+
   '<div id="wp-game-results"></div></div>';
 }
 function paint(){
  const box=document.getElementById("wp-game-results");if(!box)return;
  const chosen=listed(),q=query.toLowerCase();
  const matches=games.filter(g=>g.name.toLowerCase().includes(q)).slice(0,48);
  box.innerHTML='<p class="wp-game-count">'+tr("Available real games: ","Реальних ігор у каталозі: ")+games.length+' · '+tr("Selected: ","Вибрано: ")+chosen.length+'/10</p>'+
   '<div class="wp-game-selected">'+(chosen.length?chosen.map(n=>'<button type="button" class="wp-game-chip" data-gp="remove" data-name="'+E(n)+'">'+E(n)+' ×</button>').join(""):'<small>'+tr("Pick games from the cards below.","Вибирай ігри з карток нижче.")+'</small>')+'</div>'+
   (error?'<p class="wp-game-error" role="alert">'+E(error)+'</p>':'')+
   '<div class="wp-game-grid">'+matches.map(g=>'<button type="button" class="wp-game-tile '+(chosen.includes(g.name)?"chosen":"")+'" data-gp="select" data-id="'+g.id+'">'+
   '<img loading="lazy" alt="" src="'+cover(g.id)+'" onerror="this.replaceWith(document.createTextNode(\'🎮\'))">'+
   '<strong>'+E(g.name)+'</strong><small>'+(chosen.includes(g.name)?"✓ "+tr("Selected","Вибрано"):tr("Add","Додати"))+'</small></button>').join("")+'</div>'+
   (loading?'<p>'+tr("Loading Steam games…","Завантажуємо Steam-ігри…")+'</p>':'')+
   '<div class="wp-game-actions"><button class="btn" data-gp="more" '+(loading?"disabled":"")+'>'+(games.length?tr("Load 1,000 more real games","Завантажити ще 1000 ігор"):tr("Load game catalogue","Завантажити каталог ігор"))+'</button>'+
   '<button class="btn" data-gp="custom">'+tr("Add typed title","Додати назву вручну")+'</button></div>'+
   '<p class="wp-hint">'+tr("Covers use the Steam CDN. Catalog data: SteamSpy. Loading the next page may be rate limited.","Обкладинки зі Steam CDN. Джерело каталогу — SteamSpy. Наступна сторінка може мати обмеження запитів.")+'</p>';
 }
 function update(){
  window.dispatchEvent(new CustomEvent("wrld:profile-game-change",{detail:{kind:section,games:[...listed()]}}));
  paint();
 }
 document.addEventListener("click",e=>{
  const b=e.target.closest("[data-gp]");if(!b)return;
  e.preventDefault();
  const a=b.dataset.gp;
  if(a==="section"){section=b.dataset.id;const sectionBox=document.querySelector(".wp-game-browser");if(sectionBox)sectionBox.outerHTML=render({favorite_games:selected.favorite_games,current_games:selected.current_games});paint();return}
  if(a==="search"){query=document.getElementById("wp-game-query")?.value?.trim()||"";paint();return}
  if(a==="more"){void fetchPage();return}
  if(a==="select"){
   const g=games.find(x=>String(x.id)===b.dataset.id);if(!g)return;
   const chosen=listed(),idx=chosen.indexOf(g.name);
   if(idx>=0)chosen.splice(idx,1);else if(chosen.length<10)chosen.push(g.name);
   else{error=tr("Maximum 10 games per section.","Максимум 10 ігор у розділі.");paint();return}
   update();return;
  }
  if(a==="remove"){selected[section]=listed().filter(x=>x!==b.dataset.name);update();return}
  if(a==="custom"){
   const name=prompt(tr("Enter the exact game title (max 56 characters)","Введи точну назву гри (до 56 символів)"));
   if(!name)return;const clean=name.trim();if(!clean||clean.length>56)return;
   if(!listed().includes(clean)&&listed().length<10)listed().push(clean);update();
  }
 });
 document.addEventListener("input",e=>{if(e.target.id==="wp-game-query"){query=e.target.value.trim();paint()}});
 document.addEventListener("focusin",e=>{if(e.target.id==="wp-game-query"&&!loaded&&!loading)void fetchPage()});
 window.addEventListener("wrld:profile-updated",()=>queueMicrotask(()=>{if(document.getElementById("wp-game-results")){paint();if(!loaded&&!loading)void fetchPage()}}));
 window.WrldGamePicker={render,miniCard};
})();
