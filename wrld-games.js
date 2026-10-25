"use strict";
(() => {
 const root=document.getElementById("wrld-games-root");if(!root)return;
 const genres=[
 ["action","Action & adventure","⚔"],["shooter","Shooters / FPS","⌖"],["horror","Horror","☾"],
 ["survival","Survival","△"],["coop","Co-op","♧"],["multiplayer","Online & multiplayer","◎"],
 ["openworld","Open world","◇"],["rpg","RPG & roleplay","✧"],["sandbox","Sandbox","⬡"],
 ["strategy","Strategy","♜"],["simulation","Simulation","▣"],["racing","Racing","◉"],
 ["sports","Sports","◐"],["puzzle","Puzzle","▤"],["casual","Casual & chill","☁"],
 ["story","Story-rich","☷"],["platform","Platformers","↗"],["indie","Indie","✳"],
 ["vr","VR games","◈"],["mobile","Mobile games","▦"]];
 const platforms=[["all","All systems"],["windows","Windows"],["linux","Linux"],["android","Android"],["macos","macOS"],["console","Consoles"]];
 let search="",active="all",platform="all";
 const esc=s=>String(s).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
 function render(){
  const filtered=genres.filter(([id,name])=>(active==="all"||active===id)&&name.toLowerCase().includes(search.toLowerCase()));
  root.innerHTML='<section class="games-hub"><header class="games-hub-head"><div><small>GAMES / DISCOVERY</small><h2>Find your kind of game.</h2><p>Choose a genre or system. Only verified released titles will appear when they are published.</p></div><span class="games-hub-decor">✦</span></header><div class="games-toolbar"><label class="games-search"><span>⌕</span><input id="gamesSearch" type="search" placeholder="Search a genre…" maxlength="50" value="'+esc(search)+'"></label><select id="gamesPlatform" aria-label="Game platform">'+platforms.map(([id,name])=>'<option value="'+id+'"'+(id===platform?" selected":"")+'>'+name+'</option>').join("")+'</select></div><div class="games-section-head"><h3>Game categories</h3><button class="games-clear" type="button" id="gamesReset">All genres</button></div><div class="games-genres">'+filtered.map(([id,name,mark])=>'<button type="button" class="games-genre '+(id===active?"selected":"")+'" data-game-genre="'+id+'"><span class="games-genre-icon" aria-hidden="true">'+mark+'</span><strong>'+name+'</strong><span class="games-genre-arrow">↗</span></button>').join("")+'</div><div class="games-results"><div><span class="games-pulse">✧</span><h3>'+(active==="all"?"Games catalog":esc(genres.find(g=>g[0]===active)?.[1]||"Games"))+'</h3><p>No published games in this selection yet. Real downloads, trailers, requirements and screenshots will appear here when a game is released.</p></div><span class="games-status-tag">No games published</span></div></section>';
 }
 root.addEventListener("input",e=>{if(e.target.id==="gamesSearch"){search=e.target.value;const start=e.target.selectionStart;render();const field=root.querySelector("#gamesSearch");field?.focus();field?.setSelectionRange(start,start)}});
 root.addEventListener("change",e=>{if(e.target.id==="gamesPlatform"){platform=e.target.value;render()}});
 root.addEventListener("click",e=>{
  const genre=e.target.closest("[data-game-genre]");
  if(genre){active=active===genre.dataset.gameGenre?"all":genre.dataset.gameGenre;render()}
  if(e.target.closest("#gamesReset")){active="all";search="";platform="all";render()}
 });
 render();
})();
