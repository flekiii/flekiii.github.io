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
 let platform="all",filterOpen=false,genreSearch="";
 const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
 const label=id=>byId.get(id)?.[1]||"Unknown genre";

 // Game inventory will use intersection (ALL selected genres) when real releases are published.
 // Until then, this interface is intentionally an honest empty catalog.
 function render(){
  const count=selected.size;
  const countLabel=count+" "+(count===1?"genre":"genres")+" selected";
  const hasFilters=count>0||platform!=="all";
  const platformLabel=platforms.find(x=>x[0]===platform)?.[1]||"All platforms";
  const chosen=[...selected].map(id=>'<button type="button" class="games-selected-tag" data-remove-genre="'+esc(id)+'" aria-label="Remove '+esc(label(id))+' filter">'+esc(label(id))+' <span aria-hidden="true">×</span></button>').join("");
  const options=genres.map(([id,name,icon])=>'<label class="games-genre-choice '+(selected.has(id)?"is-selected":"")+'" data-genre-label="'+esc(name.toLowerCase())+'"><input type="checkbox" name="games-genre" value="'+esc(id)+'" '+(selected.has(id)?"checked":"")+'><span class="games-choice-icon" aria-hidden="true">'+icon+'</span><span class="games-choice-name">'+esc(name)+'</span><span class="games-choice-check" aria-hidden="true">'+(selected.has(id)?"✓":"＋")+'</span></label>').join("");
  const quick=genres.filter(g=>["horror","survival","coop","multiplayer","shooter"].includes(g[0]))
   .map(([id,name])=>'<button class="games-quick-btn '+(selected.has(id)?"is-selected":"")+'" type="button" data-quick-genre="'+id+'" aria-pressed="'+selected.has(id)+'">'+esc(name)+'</button>').join("");
  root.innerHTML=
   '<section class="games-hub">'+
    '<header class="games-hub-head"><div><small>FLEKI’S WRLD / GAMES</small><h2>Games for every kind of player.</h2><p>Mix genres, pick your platform and discover games when they’re published.</p></div><span class="games-hub-decor" aria-hidden="true">✦</span></header>'+
    '<section class="games-discovery" aria-label="Find games">'+
     '<div class="games-discovery-title"><div><small>FIND YOUR NEXT GAME</small><h3>Browse games</h3></div><span class="games-discovery-count">'+countLabel+'</span></div>'+
     '<div class="games-toolbar">'+
      '<div class="games-filter-picker">'+
       '<span class="games-field-label">Genres</span>'+
       '<button type="button" id="gamesToggle" class="games-filter-toggle '+(filterOpen?"is-open":"")+'" aria-expanded="'+String(filterOpen)+'" aria-controls="gamesGenreOptions">'+
        '<span aria-hidden="true">☷</span><span>'+(count?countLabel:"Choose genres")+'</span><span class="games-toggle-chevron" aria-hidden="true">⌄</span>'+
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
     '<div class="games-results" aria-live="polite"><span class="games-result-icon" aria-hidden="true">✧</span><div><h3>'+(hasFilters?"Games matching your filters":"A home for great games")+'</h3><p>'+(hasFilters?'Your selection: '+(count?[...selected].map(label).join(" + "):"Any genre")+' · '+esc(platformLabel)+'. Games will need to match every selected genre when titles are added.':'Game listings are not published yet. Your filters are ready for future releases on Windows, Linux, macOS, Android, iOS and consoles.')+'</p></div><span class="games-status-tag">No games published yet</span></div>'+
    '</section>'+
   '</section>';
  filterGenreOptions();
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
  const button=event.target.closest("button");
  if(!button)return;
  if(button.id==="gamesToggle"){filterOpen=!filterOpen;render();if(filterOpen)root.querySelector("#gamesGenreSearch")?.focus();return}
  if(button.id==="gamesDone"){filterOpen=false;genreSearch="";render();root.querySelector("#gamesToggle")?.focus();return}
  if(button.id==="gamesReset"){selected.clear();platform="all";genreSearch="";filterOpen=false;render();return}
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
  if(event.target.id==="gamesGenreSearch"){genreSearch=event.target.value;filterGenreOptions()}
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&filterOpen){filterOpen=false;genreSearch="";render();root.querySelector("#gamesToggle")?.focus()}
 });
 document.addEventListener("click",event=>{
  if(filterOpen&&!event.target.closest("#wrld-games-root .games-filter-picker")){
   filterOpen=false;genreSearch="";render();
  }
 });
 render();
})();
