"use strict";
(() => {
 const root=document.getElementById("wrld-games-root");
 if(!root)return;

 const genres=[
  ["action","Action & adventure","⚔"],["shooter","Shooters / FPS","⌖"],["horror","Horror","☾"],
  ["survival","Survival","△"],["coop","Co-op","♧"],["multiplayer","Online & multiplayer","◎"],
  ["openworld","Open world","◇"],["rpg","RPG & roleplay","✧"],["sandbox","Sandbox","⬡"],
  ["strategy","Strategy","♜"],["simulation","Simulation","▣"],["racing","Racing","◉"],
  ["sports","Sports","◐"],["puzzle","Puzzle","▤"],["casual","Casual & chill","☁"],
  ["story","Story-rich","☷"],["platform","Platformers","↗"],["indie","Indie","✳"],
  ["vr","VR games","◈"],["mobile","Mobile games","▦"]
 ];
 const platforms=[
  ["all","All platforms"],["windows","Windows"],["linux","Linux"],["macos","macOS"],
  ["android","Android"],["ios","iOS (iPhone / iPad)"],["console","Consoles"]
 ];
 const byId=new Map(genres.map(g=>[g[0],g]));
 const selected=new Set();
 let platform="all",filterOpen=false,genreSearch="",titleQuery="";
 const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
 const label=id=>byId.get(id)?.[1]||"Unknown genre";
 const tr=(en,uk)=>document.documentElement?.lang==="uk"?uk:en;
 const ukGenres={action:"Екшен і пригоди",shooter:"Шутери / FPS",horror:"Жахи",survival:"Виживання",coop:"Кооперативні",multiplayer:"Онлайн і мультиплеєр",openworld:"Відкритий світ",rpg:"Рольові ігри",sandbox:"Пісочниці",strategy:"Стратегії",simulation:"Симулятори",racing:"Перегони",sports:"Спорт",puzzle:"Головоломки",casual:"Для відпочинку",story:"Сюжетні",platform:"Платформери",indie:"Інді",vr:"VR-ігри",mobile:"Мобільні ігри"};
 const ukPlatforms={all:"Усі платформи",windows:"Windows",linux:"Linux",macos:"macOS",android:"Android",ios:"iOS (iPhone / iPad)",console:"Консолі"};
 const shownGenre=id=>tr(label(id),ukGenres[id]||label(id));

 // Game inventory will use intersection (ALL selected genres) when real releases are published.
 // Until then, this interface is intentionally an honest empty catalog.
 function render(){
  const scrollPositions=[
   [".games-results","scrollTop"],[".games-genre-options","scrollTop"],
   [".games-quick-row","scrollLeft"],[".games-applied","scrollLeft"]
  ].map(([selector,prop])=>({selector,prop,value:root.querySelector?.(selector)?.[prop]||0}));
  const count=selected.size;
  const countLabel=count+" "+(count===1?"genre":"genres")+" selected";
  const hasFilters=count>0||platform!=="all"||!!titleQuery.trim();
  const platformLabel=platforms.find(x=>x[0]===platform)?.[1]||"All platforms";
  const chosen=[...selected].map(id=>'<button type="button" class="games-selected-tag" data-remove-genre="'+esc(id)+'" aria-label="Remove '+esc(label(id))+' filter">'+esc(label(id))+' <span aria-hidden="true">×</span></button>').join("");
  const options=genres.map(([id,name,icon])=>'<label class="games-genre-choice '+(selected.has(id)?"is-selected":"")+'" data-genre-label="'+esc(name.toLowerCase())+'"><input type="checkbox" name="games-genre" value="'+esc(id)+'" '+(selected.has(id)?"checked":"")+'><span class="games-choice-icon" aria-hidden="true">'+icon+'</span><span class="games-choice-name">'+esc(name)+'</span><span class="games-choice-check" aria-hidden="true">'+(selected.has(id)?"✓":"＋")+'</span></label>').join("");
  const quick=genres.filter(g=>["horror","survival","coop","multiplayer","shooter"].includes(g[0]))
   .map(([id,name])=>'<button class="games-quick-btn '+(selected.has(id)?"is-selected":"")+'" type="button" data-quick-genre="'+id+'" aria-pressed="'+selected.has(id)+'">'+esc(name)+'</button>').join("");
  const resultTitle=titleQuery.trim()?"No games found for “"+esc(titleQuery.trim())+"”":hasFilters?"Games matching your filters":"A home for great games";
  const resultDescription=titleQuery.trim()
    ?"No published games match this name yet. You can combine the title search with genres and platforms."
    :hasFilters
      ?"Your selection: "+(count?[...selected].map(label).join(" + "):"Any genre")+" · "+esc(platformLabel)+". Games will need to match every selected genre when titles are added."
      :"Game listings are not published yet. Your filters are ready for future releases on Windows, Linux, macOS, Android, iOS and consoles.";
  root.innerHTML=
   '<section class="games-hub">'+
    '<header class="games-hub-head"><div><small>FLEKI’S WRLD / GAMES</small><h2>Games for every kind of player.</h2><p>Mix genres, pick your platform and discover games when they’re published.</p></div><span class="games-hub-decor" aria-hidden="true">✦</span></header>'+
    '<section class="games-discovery" aria-label="Find games">'+
     '<div class="games-discovery-title"><div><small>FIND YOUR NEXT GAME</small><h3>Browse games</h3></div><span class="games-discovery-count">'+countLabel+'</span></div>'+
     '<div class="games-toolbar">'+
      '<label class="games-title-search"><span class="games-field-label" for="gamesTitleSearch">Search by game name</span><span class="games-title-search-box"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.4 4.4"/></svg><input id="gamesTitleSearch" type="search" maxlength="100" placeholder="Enter a game title…" autocomplete="off" value="'+esc(titleQuery)+'" aria-label="Search games by title"></span></label>'+
      '<div class="games-filter-picker">'+
       '<span class="games-field-label">Genres</span>'+
       '<button type="button" id="gamesToggle" class="games-filter-toggle '+(filterOpen?"is-open":"")+'" aria-expanded="'+String(filterOpen)+'" aria-controls="gamesGenreOptions">'+
        '<svg class="games-filter-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M7 12h10M10 17h4"/></svg><span>'+(count?countLabel:"Choose genres")+'</span><svg class="games-toggle-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6"/></svg>'+
       '</button>'+
       '<div id="gamesGenreOptions" class="games-filter-menu" '+(filterOpen?"":"hidden")+ '>'+
        '<div class="games-filter-menu-head"><strong>Select multiple categories</strong><span>'+count+' / '+genres.length+'</span></div>'+
        '<label class="games-genre-search"><span aria-hidden="true">⌕</span><input id="gamesGenreSearch" type="search" maxlength="50" placeholder="Search categories…" value="'+esc(genreSearch)+'" autocomplete="off" aria-label="Search game genres"></label>'+
        '<div class="games-genre-options" role="group" aria-label="Game categories">'+options+'</div>'+
        '<p id="gamesGenreNotFound" class="games-no-genres" hidden>No matching categories.</p>'+
        '<div class="games-menu-footer"><span>Choose any combination of genres.</span><button type="button" id="gamesDone" class="games-done">Done ✓</button></div>'+
       '</div>'+
      '</div>'+
      '<div class="games-system-picker"><label class="games-field-label" for="gamesPlatform">Platform</label>'+
       '<select id="gamesPlatform" aria-label="Game platform">'+platforms.map(([id,name])=>'<option value="'+id+'"'+(id===platform?" selected":"")+'>'+esc(name)+'</option>').join("")+'</select>'+
      '</div>'+
      '<button id="gamesReset" type="button" class="games-reset" '+(hasFilters?"":"disabled")+' aria-label="Clear all game filters">↺ <span>Reset</span></button>'+
     '</div>'+
     '<div class="games-quick-row"><span>Popular:</span>'+quick+'</div>'+
     (hasFilters?'<div class="games-applied" aria-label="Active filters"><strong>Selected filters</strong>'+chosen+(platform!=="all"?'<button type="button" class="games-selected-tag games-platform-tag" id="gamesRemovePlatform" aria-label="Remove '+esc(platformLabel)+' platform filter">'+esc(platformLabel)+' <span aria-hidden="true">×</span></button>':"")+'</div>':'')+
     '<div class="games-results" aria-live="polite"><span class="games-result-icon" aria-hidden="true">✧</span><div><h3>'+resultTitle+'</h3><p>'+resultDescription+'</p></div><span class="games-status-tag">No games published yet</span></div>'+
    '</section>'+
   '</section>';
  filterGenreOptions();
  for(const {selector,prop,value} of scrollPositions){
   const el=root.querySelector?.(selector);if(el)el[prop]=value;
  }
 }
 function filterGenreOptions(){
  const q=genreSearch.trim().toLowerCase();
  let visible=0;
  for(const item of root.querySelectorAll(".games-genre-choice")){
   const matched=!q||item.dataset.genreLabel.includes(q);
   item.hidden=!matched;
   if(matched)visible++;
  }
  const empty=root.querySelector("#gamesGenreNotFound");
  if(empty)empty.hidden=visible>0;
 }
 function toggleGenre(id){
  if(!byId.has(id))return;
  if(selected.has(id))selected.delete(id);else selected.add(id);
  render();
 }
 root.addEventListener("click",event=>{
  // A click that redraws the menu detaches its old target; do not let the
  // document outside-click handler interpret that same click as an outside click.
  event.stopPropagation?.();
  const button=event.target.closest("button");
  if(!button)return;
  if(button.id==="gamesToggle"){filterOpen=!filterOpen;render();if(filterOpen)root.querySelector("#gamesGenreSearch")?.focus();return}
  if(button.id==="gamesDone"){filterOpen=false;genreSearch="";render();root.querySelector("#gamesToggle")?.focus();return}
  if(button.id==="gamesReset"){selected.clear();platform="all";genreSearch="";titleQuery="";filterOpen=false;render();return}
  if(button.id==="gamesRemovePlatform"){platform="all";render();return}
  if(button.dataset.removeGenre){toggleGenre(button.dataset.removeGenre);return}
  if(button.dataset.quickGenre){toggleGenre(button.dataset.quickGenre);return}
 });
 root.addEventListener("change",event=>{
  const target=event.target;
  if(target.id==="gamesPlatform"){
   if(platforms.some(x=>x[0]===target.value)){platform=target.value;render()}
   return;
  }
  if(target.name==="games-genre"&&byId.has(target.value)){
   const id=target.value,wasFocused=document.activeElement===target;
   if(target.checked)selected.add(id);else selected.delete(id);
   render();
   if(filterOpen&&wasFocused)root.querySelectorAll('[name="games-genre"]').forEach(el=>{if(el.value===id)el.focus()});
  }
 });
 root.addEventListener("input",event=>{
  if(event.target.id==="gamesGenreSearch"){genreSearch=event.target.value;filterGenreOptions();return}
  if(event.target.id==="gamesTitleSearch"){
   titleQuery=event.target.value;
   const field=event.target;
   const index=typeof field.selectionStart==="number"?field.selectionStart:titleQuery.length;
   render();
   const next=root.querySelector("#gamesTitleSearch");
   if(next){next.focus();try{next.setSelectionRange(index,index)}catch{}}
  }
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&filterOpen){filterOpen=false;genreSearch="";render();root.querySelector("#gamesToggle")?.focus()}
 });
 document.addEventListener("click",event=>{
  if(filterOpen&&!event.target.closest("#wrld-games-root .games-filter-picker")){
   filterOpen=false;genreSearch="";render();
  }
 });
 if(typeof window!=="undefined")window.addEventListener("wrld:language-change",()=>{
  if(!document.activeElement?.closest?.("#wrld-games-root input"))render();
 });
 render();
})();
