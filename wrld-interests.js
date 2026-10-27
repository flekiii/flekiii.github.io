/* Fleki's Wrld — searchable bilingual interests. Backend stores stable names, UI localizes them. */
(()=>{"use strict";
 const groups=[
  ["games","🎮","Games & esports","Ігри та кіберспорт",[
   "Gaming|Ігри|🎮","PC gaming|Ігри на ПК|🖥️","Console gaming|Консольні ігри|🎮","Mobile gaming|Мобільні ігри|📱",
   "Indie games|Інді-ігри|✨","Co-op games|Кооперативні ігри|🤝","Horror games|Горор-ігри|👻",
   "Survival games|Ігри на виживання|🌲","Strategy games|Стратегії|♟️","RPGs|Рольові ігри|⚔️",
   "Esports|Кіберспорт|🏆","Game development|Розробка ігор|🛠️","Game design|Геймдизайн|🕹️",
   "Speedrunning|Спідрани|⏱️","Sandbox games|Ігри-пісочниці|🧱"]],
  ["anime","🌸","Anime & manga","Аніме та манґа",[
   "Anime|Аніме|🌸","Manga|Манґа|📚","Manhwa|Манхва|📖","Cosplay|Косплей|🎭",
   "Japanese culture|Японська культура|⛩️","Anime art|Аніме-арт|🎨","Anime music|Музика з аніме|🎵",
   "Light novels|Ранобе|📕","VTubers|Вітубери|🎥","K-pop|Кей-поп|🎤"]],
  ["tech","💻","Technology & code","Технології та код",[
   "Coding|Програмування|💻","Web development|Веброзробка|🌐","App development|Розробка застосунків|📱",
   "Python|Python|🐍","JavaScript|JavaScript|✨","C++|C++|⌨️","Rust language|Мова Rust|🦀",
   "Linux|Linux|🐧","Open source|Відкритий код|🔓","Cybersecurity|Кібербезпека|🛡️",
   "Privacy|Приватність|🔒","AI|Штучний інтелект|🤖","Robotics|Робототехніка|🦾",
   "Hardware|Комп'ютерне залізо|🖥️","3D modeling|3D-моделювання|🧊","UI/UX design|Дизайн UI/UX|🎛️"]],
  ["music","🎧","Music & sound","Музика та звук",[
   "Music|Музика|🎧","Hip-hop|Хіп-хоп|🎤","Rock|Рок|🎸","Metal|Метал|🤘","Pop music|Попмузика|🎶",
   "Electronic music|Електронна музика|🎛️","Lo-fi|Лоу-фай|🌙","Classical music|Класична музика|🎻",
   "Singing|Спів|🎙️","Guitar|Гітара|🎸","Piano|Піаніно|🎹","Music production|Створення музики|🎼","DJing|Діджеїнг|💿"]],
  ["art","🎨","Art & creation","Мистецтво та творчість",[
   "Drawing|Малювання|✏️","Digital art|Цифрове мистецтво|🎨","Animation|Анімація|🎞️",
   "Graphic design|Графічний дизайн|🖌️","Photography|Фотографія|📷","Video editing|Відеомонтаж|✂️",
   "Filmmaking|Кіновиробництво|🎬","Writing|Письменництво|📝","Creative writing|Творче письмо|✍️",
   "Fashion design|Дизайн одягу|👗","Crafts|Рукоділля|🧵","Architecture|Архітектура|🏛️"]],
  ["media","📹","Video & internet","Відео та інтернет",[
   "YouTube|YouTube|▶️","Streaming|Стримінг|🔴","Twitch|Twitch|💜","Content creation|Створення контенту|🎥",
   "TikTok|TikTok|📱","Memes|Меми|😂","Internet culture|Інтернет-культура|🌍",
   "Live streaming|Прямі трансляції|📡","Video essays|Відеоесе|🎞️","Community building|Розвиток спільнот|🤝"]],
  ["films","🍿","Films & stories","Кіно та історії",[
   "Movies|Фільми|🎬","TV series|Серіали|📺","Horror movies|Фільми жахів|👻","Sci-fi|Наукова фантастика|🚀",
   "Fantasy|Фентезі|🐉","Comics|Комікси|💥","Marvel|Marvel|🦸","DC Comics|DC Comics|🦇",
   "Documentaries|Документалістика|📽️","Books|Книжки|📚","Reading|Читання|📖"]],
  ["sports","⚽","Sports & fitness","Спорт та активність",[
   "Football|Футбол|⚽","Basketball|Баскетбол|🏀","Volleyball|Волейбол|🏐","Tennis|Теніс|🎾",
   "Cycling|Велоспорт|🚲","Running|Біг|🏃","Swimming|Плавання|🏊","Gym|Тренажерний зал|🏋️",
   "Fitness|Фітнес|💪","Martial arts|Бойові мистецтва|🥋","Skateboarding|Скейтбординг|🛹",
   "Hiking|Піші походи|🥾","Dance|Танці|💃","Motorsport|Автоспорт|🏎️"]],
  ["life","🌿","Lifestyle & hobbies","Життя та хобі",[
   "Travel|Подорожі|✈️","Nature|Природа|🌿","Animals|Тварини|🐾","Cats|Коти|🐱",
   "Dogs|Собаки|🐶","Cooking|Кулінарія|🍳","Baking|Випічка|🥐","Coffee|Кава|☕",
   "Fashion|Мода|👟","Cars|Автомобілі|🚗","Motorcycles|Мотоцикли|🏍️",
   "DIY|Зроби сам|🛠️","Gardening|Садівництво|🌱","Collecting|Колекціонування|🧸",
   "Board games|Настільні ігри|🎲","Chess|Шахи|♟️","Puzzles|Головоломки|🧩"]],
  ["learning","🧠","Knowledge & science","Знання та наука",[
   "Science|Наука|🔬","Space|Космос|🌌","Astronomy|Астрономія|🔭","Physics|Фізика|⚛️",
   "Biology|Біологія|🧬","Chemistry|Хімія|🧪","Psychology|Психологія|🧠","History|Історія|🏺",
   "Languages|Іноземні мови|🗣️","Learning|Навчання|📚","Mathematics|Математика|📐",
   "Geography|Географія|🗺️","Economics|Економіка|📊","Philosophy|Філософія|💭","Environment|Довкілля|🌎"]],
  ["community","💬","People & community","Люди та спільноти",[
   "Making friends|Пошук друзів|🤝","Volunteering|Волонтерство|💚","Team projects|Командні проєкти|👥",
   "Entrepreneurship|Підприємництво|🚀","Startups|Стартапи|💡","Public speaking|Публічні виступи|🎤",
   "Debating|Дебати|💬","Charity|Благодійність|🫶","Education|Освіта|🎓","Design thinking|Дизайн-мислення|🧩"]]
 ];
 const items=groups.flatMap(([category,,groupEn,groupUk,values])=>values.map(raw=>{
  const [en,uk,icon]=raw.split("|");return {en,uk,icon,category,groupEn,groupUk};
 }));
 const norm=v=>String(v??"").normalize("NFKC").trim().toLocaleLowerCase();
 const aliases={Gaming:["games","геймінг","ігри"],Coding:["кодинг","programming","програмування"],Anime:["anime","аніме"],"Video editing":["монтаж","відео монтаж"],"Digital art":["діджитал арт"],"Content creation":["блогінг","блогерство"],"PC gaming":["комп’ютерні ігри"],"Web development":["веб дев","веб девелопмент"]};
 const match=v=>items.find(x=>[x.en,x.uk,...(aliases[x.en]||[])].some(y=>norm(y)===norm(v)));
 const key=v=>norm(match(v)?.en||v);
 const lang=()=>document.documentElement.lang==="uk"?"uk":"en";
 const t=(en,uk)=>lang()==="uk"?uk:en;
 const label=x=>match(x)?.[lang()]||String(x??"");
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let selected=[],category="all",query="",feedback="";
 const max=12;
 const picks=()=>selected.length?selected.map(x=>'<button type="button" class="wi-selected" data-wi="remove" data-value="'+esc(x)+'" aria-label="'+esc(t("Remove ","Прибрати ")+label(x))+'"><span>'+esc(label(x))+'</span><span aria-hidden="true">×</span></button>').join(""):
  '<span class="wi-empty">'+t("Choose what you enjoy — your interests will appear on your profile.","Обери, що тобі подобається — інтереси з’являться у твоєму профілі.")+'</span>';
 const tabs=()=>[['all','✦','All','Усі'],...groups.map(([id,icon,en,uk])=>[id,icon,en,uk])]
  .map(([id,icon,en,uk])=>'<button type="button" class="wi-category'+(id===category?' active':'')+'" data-wi="category" data-value="'+id+'" aria-pressed="'+(id===category)+'">'+icon+' '+(lang()==="uk"?uk:en)+'</button>').join("");
 function results(){
  const q=norm(query),chosen=new Set(selected.map(key));
  const shown=items.filter(x=>(category==="all"||x.category===category)&&(!q||[x.en,x.uk,x.groupEn,x.groupUk,...(aliases[x.en]||[])].some(y=>norm(y).includes(q))));
  const body='<div class="wi-grid">'+shown.map(x=>{
   const active=chosen.has(key(x.en));
   return '<button type="button" class="wi-tile'+(active?' chosen':'')+'" data-wi="toggle" data-value="'+esc(x.en)+'" aria-pressed="'+active+'">'+
    '<span class="wi-emoji" aria-hidden="true">'+x.icon+'</span><span class="wi-name"><strong>'+esc(x[lang()])+'</strong><small>'+esc(x[lang()==="uk"?"groupUk":"groupEn"])+'</small></span>'+
    '<span class="wi-mark" aria-hidden="true">'+(active?'✓':'+')+'</span></button>';
  }).join("")+'</div>';
  const custom=query.trim().replace(/\s+/g," ");
  const showCustom=category==="all"&&custom&&custom.length<=32&&!items.some(x=>key(x.en)===key(custom));
  return body+(shown.length?'':'<p class="wi-no-results">'+t("No matches. Try another search or add your own interest.","Немає збігів. Шукай інакше або додай власний інтерес.")+'</p>')+
   (showCustom?'<button type="button" class="wi-custom" data-wi="custom">✎ '+t("Add your own: ","Додати власний: ")+'<strong>'+esc(custom)+'</strong></button>':'');
 }
 function render(list){
  selected=Array.isArray(list)?list.filter(x=>typeof x==="string"&&x.trim()).slice(0,max):[];
  return '<section class="wi-picker" aria-label="'+t("Interests picker","Вибір інтересів")+'">'+
   '<div class="wi-top"><div><span class="wi-overline">'+t("YOUR INTERESTS","ТВОЇ ІНТЕРЕСИ")+'</span><strong>'+t("What are you into?","Що тобі до душі?")+'</strong><p>'+t("Choose up to twelve interests to share on your profile.","Обери до дванадцяти захоплень для свого профілю.")+'</p></div><span class="wi-count" id="wi-count">'+selected.length+' / 12</span></div>'+
   '<div class="wi-selected-box"><span class="wi-overline">'+t("SELECTED","ОБРАНО")+'</span><div id="wi-selected-list" class="wi-selected-list">'+picks()+'</div></div>'+
   '<label class="wi-search"><span aria-hidden="true">⌕</span><input type="search" id="wi-search" autocomplete="off" maxlength="32" value="'+esc(query)+'" placeholder="'+t("Search gaming, anime, coding…","Шукай ігри, аніме, кодинг…")+'" aria-label="'+t("Search interests","Пошук інтересів")+'"></label>'+
   '<div id="wi-categories" class="wi-categories" role="group" aria-label="'+t("Categories","Категорії")+'">'+tabs()+'</div>'+
   '<div id="wi-results" class="wi-results">'+results()+'</div>'+
   '<p class="wi-feedback" id="wi-feedback" aria-live="polite" role="status">'+esc(feedback)+'</p>'+
   '<p class="wi-hint">'+t("Press Save changes below to publish. Privacy settings apply.","Натисни «Зберегти зміни» нижче для публікації. Налаштування приватності діють.")+'</p></section>';
 }
 function paint(){
  const el=document.getElementById("wi-results"),sel=document.getElementById("wi-selected-list");
  if(!el||!sel)return;
  const resultsScroll=el.scrollTop||0;
  el.innerHTML=results();el.scrollTop=resultsScroll;sel.innerHTML=picks();
  const c=document.getElementById("wi-count");if(c)c.textContent=selected.length+" / 12";
  const tabsEl=document.getElementById("wi-categories");
  if(tabsEl){
   const buttons=tabsEl.querySelectorAll?.('[data-wi="category"]');
   if(buttons){for(const tab of buttons){const active=tab.dataset.value===category;tab.classList.toggle("active",active);tab.setAttribute("aria-pressed",String(active))}}
   else{const left=tabsEl.scrollLeft||0;tabsEl.innerHTML=tabs();tabsEl.scrollLeft=left}
  }
  const info=document.getElementById("wi-feedback");if(info)info.textContent=feedback;
 }
 function toggle(raw){
  const input=String(raw||"").trim().replace(/\s+/g," "),value=match(input)?.en||input;
  const at=selected.findIndex(x=>key(x)===key(value));
  if(at>=0)selected.splice(at,1);
  else{
   if(!value||value.length>32)return;
   if(selected.length>=max){feedback=t("Maximum 12 interests.","Максимум 12 інтересів.");paint();return}
   selected.push(value);
  }
  feedback="";window.dispatchEvent(new CustomEvent("wrld:profile-interest-change",{detail:{interests:[...selected]}}));paint();
 }
 document.addEventListener("click",e=>{
  const b=e.target.closest?.("[data-wi]");if(!b)return;e.preventDefault?.();
  if(b.dataset.wi==="category"){category=b.dataset.value||"all";paint()}
  else if(b.dataset.wi==="toggle"||b.dataset.wi==="remove")toggle(b.dataset.value);
  else if(b.dataset.wi==="custom")toggle(query);
 });
 document.addEventListener("input",e=>{
  if(e.target?.id!=="wi-search")return;
  query=e.target.value||"";category="all";feedback="";paint();
 });
 document.addEventListener("keydown",e=>{
  if(e.target?.id!=="wi-search"||e.key!=="Enter")return;
  e.preventDefault?.();
  const m=match(query);if(m)toggle(m.en);
  else if(query.trim().length<=32)toggle(query);
 });
 window.WrldInterests={render,label,items,categoryCount:groups.length};
})();
