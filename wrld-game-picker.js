/* Multi-store game search: browser-side CheapShark + FreeToGame, curated cross-platform picks.
   SteamSpy's 1,000-game endpoint is intentionally not used: it is limited to one call/minute. */
(()=>{"use strict";
 const E=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const tr=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const cleanName=x=>String(x||"").trim().replace(/\s+/g," ").slice(0,56);
 const curated=[
  ["Fortnite","Epic Games"],["Roblox","Multi-platform"],["Minecraft","Multi-platform"],["Minecraft Dungeons","Multi-platform"],["League of Legends","Riot Games"],
  ["VALORANT","Riot Games"],["Teamfight Tactics","Riot Games"],["2XKO","Riot Games"],["Genshin Impact","HoYoverse"],["Honkai: Star Rail","HoYoverse"],
  ["Zenless Zone Zero","HoYoverse"],["Wuthering Waves","Multi-platform"],["World of Warcraft","Battle.net"],["Hearthstone","Battle.net"],["Overwatch 2","Battle.net / Steam"],
  ["Diablo IV","Battle.net / Steam"],["Call of Duty: Warzone","Multi-platform"],["Call of Duty: Mobile","Mobile"],["PUBG Mobile","Mobile"],
  ["Brawl Stars","Mobile"],["Clash Royale","Mobile"],["Clash of Clans","Mobile"],["Pokémon GO","Mobile"],["Pokémon Scarlet","Nintendo"],
  ["Pokémon Violet","Nintendo"],["The Legend of Zelda: Breath of the Wild","Nintendo"],["The Legend of Zelda: Tears of the Kingdom","Nintendo"],
  ["Super Mario Odyssey","Nintendo"],["Mario Kart 8 Deluxe","Nintendo"],["Animal Crossing: New Horizons","Nintendo"],
  ["Super Smash Bros. Ultimate","Nintendo"],["Splatoon 3","Nintendo"],["Astro Bot","PlayStation"],["Marvel's Spider-Man 2","PlayStation / PC"],
  ["God of War Ragnarök","PlayStation / PC"],["The Last of Us Part II","PlayStation"],["Gran Turismo 7","PlayStation"],
  ["Forza Horizon 5","Xbox / PC"],["Halo Infinite","Xbox / PC"],["Microsoft Flight Simulator","Xbox / PC"],["Sea of Thieves","Xbox / PC"],
  ["Grand Theft Auto V","Multi-platform"],["Grand Theft Auto VI","Multi-platform"],["Red Dead Redemption 2","Multi-platform"],
  ["Rocket League","Epic Games"],["Fall Guys","Epic Games"],["The Sims 4","EA / Steam"],["EA SPORTS FC 26","Multi-platform"],
  ["Counter-Strike 2","Steam"],["Dota 2","Steam"],["Apex Legends","Multi-platform"],["PUBG: BATTLEGROUNDS","Multi-platform"],
  ["Dead by Daylight","Multi-platform"],["Lethal Company","Steam"],["R.E.P.O.","Steam"],["Phasmophobia","Steam"],
  ["Content Warning","Steam"],["Among Us","Multi-platform"],["Stardew Valley","Multi-platform"],["Terraria","Multi-platform"],
  ["Palworld","Multi-platform"],["Rust","Steam"],["ARK: Survival Ascended","Multi-platform"],["Satisfactory","Steam"],
  ["No Man's Sky","Multi-platform"],["Hollow Knight","Multi-platform"],["Hollow Knight: Silksong","Multi-platform"],
  ["Elden Ring","Multi-platform"],["Baldur's Gate 3","Multi-platform"],["Cyberpunk 2077","Multi-platform"],["Hades II","Multi-platform"],
  ["Warframe","Multi-platform"],["Destiny 2","Multi-platform"],["War Thunder","Multi-platform"],["World of Tanks","Multi-platform"]
 ];
 const library=new Map(),sourceStatus={cheap:false,free:false};
 const keys=new Map();
 let favorite_games=[],current_games=[],section="favorite_games",query="",loading=false,error="",notice="",searched=false,viewLimit=48,queryRevision=0,searchTimer=null,abort=null,freeLibrary=null,resultsFor="";
 function add(item){
  const name=cleanName(item.name),key=name.toLocaleLowerCase();
  if(!name)return;
  const previous=library.get(key);
  const source=String(item.source||"Game"),id=Number(item.steamAppID||0);
  const thumb=String(item.thumb||"");
  const image=/^https:\/\/[a-z0-9.-]+\//i.test(thumb)?thumb:"";
  const game={name,source,id:id>0&&Number.isInteger(id)?id:0,thumb:image};
  if(!previous||(!previous.thumb&&game.thumb)||(!previous.id&&game.id))library.set(key,{...previous,...game});
  else if(previous&&previous.source==="More platforms"&&source!=="More platforms")previous.source=source;
 }
 for(const [name,source] of curated)add({name,source});
 const current=()=>section==="favorite_games"?favorite_games:current_games;
 function miniCard(name){
  const game=library.get(String(name).toLocaleLowerCase());
  const thumb=game?.thumb||(game?.id?"https://cdn.akamai.steamstatic.com/steam/apps/"+game.id+"/header.jpg":"");
  return '<span class="wp-real-game-mini">'+(thumb?'<img loading="lazy" src="'+E(thumb)+'" alt="" onerror="this.style.display=\'none\'">':'<span aria-hidden="true">🎮</span>')+'<span>'+E(name)+'</span></span>';
 }
 function selectedTag(name){return '<button type="button" class="wp-game-chip" data-gp="remove" data-name="'+E(name)+'">'+E(name)+' ×</button>'}
 function render(p){
  favorite_games=[...(p.favorite_games||[])];current_games=[...(p.current_games||[])];
  return '<div class="wp-game-browser">'+
   '<div class="wp-game-sections"><button type="button" class="btn '+(section==="favorite_games"?"primary":"")+'" data-gp="section" data-id="favorite_games">♥ '+tr("Favorites","Улюблені")+' ('+favorite_games.length+'/10)</button>'+
   '<button type="button" class="btn '+(section==="current_games"?"primary":"")+'" data-gp="section" data-id="current_games">▶ '+tr("Playing","Зараз граю")+' ('+current_games.length+'/10)</button></div>'+
   '<div class="wp-game-search"><input id="wp-game-query" class="social-input" type="search" autocomplete="off" maxlength="56" placeholder="'+tr("Search any game: Fortnite, Minecraft, CS2…","Пошук будь-якої гри: Fortnite, Minecraft, CS2…")+'" value="'+E(query)+'">'+
   '<button type="button" class="btn primary" data-gp="search">'+tr("Search","Знайти")+'</button></div>'+
   '<p class="wp-hint">'+tr("Steam, Epic Games, consoles, Riot, mobile and more. Search by name — no 1,000-game downloads.","Steam, Epic Games, консолі, Riot, мобільні та інші ігри. Шукай за назвою — без завантаження тисяч ігор.")+'</p>'+
   '<div id="wp-game-results" aria-live="polite"></div></div>';
 }
 function matches(){
  const q=query.trim().toLocaleLowerCase(),a=[...library.values()].filter(g=>!q||g.name.toLocaleLowerCase().includes(q));
  a.sort((x,y)=>(x.name.toLocaleLowerCase()===q?-1:0)-(y.name.toLocaleLowerCase()===q?-1:0)||x.name.localeCompare(y.name));
  return a;
 }
 function paint(){
  const root=document.getElementById("wp-game-results");if(!root)return;
  const all=matches(),shown=all.slice(0,viewLimit),chosen=current(),chosenKeys=new Set(chosen.map(x=>x.toLocaleLowerCase()));
  const gridScroll=root.querySelector?.(".wp-game-grid")?.scrollTop||0;
  root.innerHTML='<div class="wp-game-count">'+tr("Matches: ","Знайдено: ")+all.length+' · '+tr("Selected: ","Обрано: ")+chosen.length+'/10'+(loading?' · '+tr("Searching more stores…","Шукаємо в інших магазинах…"):'')+'</div>'+
    '<div class="wp-game-selected">'+(chosen.length?chosen.map(selectedTag).join(""):'<small>'+tr("Pick up to ten games for each list.","Обери до десяти ігор для кожного списку.")+'</small>')+'</div>'+
    (error?'<p class="wp-game-error" role="status">'+E(error)+'</p>':'')+
    (notice?'<p class="wp-hint">'+E(notice)+'</p>':'')+
    '<div class="wp-game-grid">'+shown.map((g,i)=>{
     const thumb=g.thumb||(g.id?"https://cdn.akamai.steamstatic.com/steam/apps/"+g.id+"/header.jpg":"");
     return '<button type="button" class="wp-game-tile '+(chosenKeys.has(g.name.toLocaleLowerCase())?'chosen':'')+'" data-gp="select" data-name="'+E(g.name)+'">'+
      (thumb?'<img loading="lazy" alt="" src="'+E(thumb)+'" onerror="this.style.display=\'none\'">':'<span class="wp-game-no-cover" aria-hidden="true">🎮</span>')+
      '<strong>'+E(g.name)+'</strong><small>'+E(g.source)+'</small></button>';
    }).join("")+'</div>'+
    (!all.length?'<div class="wp-game-no-results">'+tr("Not found in the catalogue? You can add any real game by its title.","Не знайшов у каталозі? Можна додати будь-яку реальну гру за назвою.")+'</div>':'')+
    '<div class="wp-game-actions">'+(all.length>viewLimit?'<button type="button" class="btn" data-gp="more">'+tr("Show more matches","Показати більше збігів")+'</button>':'')+
    '<button type="button" class="btn" data-gp="custom">✎ '+tr("Add game by title","Додати гру за назвою")+'</button></div>'+
    '<p class="wp-hint">'+tr("Results from CheapShark and FreeToGame where available. Missing titles can be added manually; no library covers every game.","Дані CheapShark і FreeToGame за наявності. Якщо гри немає, додай її вручну: жоден каталог не містить абсолютно всіх ігор.")+'</p>';
  const newGrid=root.querySelector?.(".wp-game-grid");if(newGrid)newGrid.scrollTop=gridScroll;
 }
 async function getFree(signal){
  if(freeLibrary)return freeLibrary;
  const res=await fetch("https://www.freetogame.com/api/games",{mode:"cors",signal});
  if(!res.ok)throw Error("FreeToGame API "+res.status);
  const list=await res.json();
  if(!Array.isArray(list))throw Error("Invalid free-to-play catalogue");
  freeLibrary=list.slice(0,800);
  for(const item of freeLibrary)if(item&&typeof item.title==="string")add({name:item.title,source:item.platform||"Free-to-play",thumb:item.thumbnail});
  sourceStatus.free=true;
  return freeLibrary;
 }
 async function searchNetwork(value){
  const q=value.trim();if(q.length<2){loading=false;searched=false;error="";paint();return}
  const rev=++queryRevision;
  if(abort)abort.abort();abort=new AbortController();
  const signal=abort.signal;
  loading=true;searched=true;error="";notice="";paint();
  const request=(async()=>{
   const u="https://www.cheapshark.com/api/1.0/games?title="+encodeURIComponent(q)+"&limit=60";
   const res=await fetch(u,{mode:"cors",signal});
   if(!res.ok)throw Error("Search unavailable");
   const list=await res.json();if(!Array.isArray(list))throw Error("Invalid search response");
   return list.map(item=>({name:item.external,source:item.steamAppID?"PC / Steam":"PC stores",steamAppID:item.steamAppID,thumb:item.thumb}));
  })();
  const free=getFree(signal);
  const outcomes=await Promise.allSettled([request,free]);
  if(rev!==queryRevision)return;
  for(const item of outcomes[0].status==="fulfilled"?outcomes[0].value:[])add(item);
  // FreeToGame is already added when it loads, but only show latest query results.
  loading=false;resultsFor=q;
  if(outcomes[0].status==="rejected"&&outcomes[1].status==="rejected")notice=tr("Online search unavailable. Popular games and manual entry still work.","Онлайн-пошук недоступний. Популярні ігри та ручне додавання працюють.");
  else notice="";
  paint();
 }
 function choose(name){
  const clean=cleanName(name),list=current();if(!clean)return;
  const index=list.findIndex(x=>x.toLocaleLowerCase()===clean.toLocaleLowerCase());
  if(index>=0)list.splice(index,1);
  else if(list.length<10)list.push(clean);
  else {error=tr("You can choose up to 10 games here.","У цьому списку можна обрати до 10 ігор.");paint();return}
  error="";window.dispatchEvent(new CustomEvent("wrld:profile-game-change",{detail:{kind:section,games:[...list]}}));paint();
 }
 document.addEventListener("click",e=>{
  const button=e.target.closest("[data-gp]");if(!button)return;e.preventDefault();
  const action=button.dataset.gp;
  if(action==="section"){
   section=button.dataset.id==="current_games"?"current_games":"favorite_games";
   // Keep the existing browser DOM and search focus; only the active list changes.
   const tabs=document.querySelectorAll?.('.wp-game-sections [data-gp="section"]')||[];
   for(const tab of tabs){const active=tab.dataset.id===section;tab.classList.toggle("primary",active);tab.setAttribute("aria-pressed",String(active))}
   paint();return;
  }
  if(action==="search"){query=document.getElementById("wp-game-query")?.value?.trim()||"";viewLimit=48;void searchNetwork(query);return}
  if(action==="more"){viewLimit+=48;paint();return}
  if(action==="select"){choose(button.dataset.name);return}
  if(action==="remove"){choose(button.dataset.name);return}
  if(action==="custom"){
   const typed=prompt(tr("Enter any real game name (max 56 characters)","Введи назву будь-якої реальної гри (до 56 символів)"),query||"");
   if(typed===null)return;
   const clean=cleanName(typed);if(!clean)return;
   add({name:clean,source:"More platforms"});choose(clean);return;
  }
 });
 document.addEventListener("input",e=>{
  if(e.target.id!=="wp-game-query")return;
  query=e.target.value.trim();viewLimit=48;error="";notice="";paint();
  if(searchTimer)clearTimeout(searchTimer);
  // Short debounce rather than fetching 1,000 games with every keystroke.
  if(query.length>=2)searchTimer=setTimeout(()=>void searchNetwork(query),520);
  else{queryRevision++;if(abort)abort.abort();loading=false;paint()}
 });
 window.addEventListener("wrld:profile-updated",()=>queueMicrotask(()=>{if(document.getElementById("wp-game-results"))paint()}));
 window.addEventListener("wrld:language-change",()=>queueMicrotask(()=>{if(document.getElementById("wp-game-results"))paint()}));
 window.WrldGamePicker={render,miniCard};
})();
