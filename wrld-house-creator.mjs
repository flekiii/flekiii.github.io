import {HOUSE_TEMPLATES,TEMPLATE_BY_ID,STORE_KEY,encode} from "./wrld-home-core.mjs?v=2";
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const REACTIONS=["👍","👎","❤️","💜","💙","💚","💛","🧡","🩷","😍","🥰","🔥","✨","👏","🎉","🤩","😮","😂","🏠","💯"];
const $=id=>document.getElementById(id);
const gallery=$("houseTemplateGrid"),viewer=$("wrldPublicHouse");
const settingsKey="fleki_wrld_house_settings";
const escapeHtml=text=>String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getSettings=()=>{try{return JSON.parse(localStorage.getItem(settingsKey)||"null")}catch{return null}};
let selected=getSettings()?.template||"starter",publishedUser=null,currentShareUser=null;
function previewMarkup(template){
 const n=template.rooms;
 const cols=n<=2?n:n<=4?2:n<=6?3:4,rows=Math.ceil(n/cols),cells=[];
 let counter=0;
 for(let row=0;row<rows;row++){
  const inRow=Math.min(cols,n-counter);
  for(let col=0;col<inRow;col++){const last=counter===n-1;
   cells.push('<span style="grid-column:'+((col*12/inRow)+1)+' / span '+(12/inRow)+';grid-row:'+(row+1)+';background:'+["#d7c4cb","#c7cbdc","#dacdbb","#d4d7c1"][counter%4]+'">'+((template.id.includes("garage")||template.id==="workshop")&&last?"🚗":counter===0?"🛋️":counter===1?"🛏️":counter===2?"🖥️":"🪴")+'</span>');
   counter++;
  }
 }
 return '<div class="wrld-plan-mini" style="grid-template-rows:repeat('+rows+',1fr)">'+cells.join("")+'</div>';
}
function cards(){
 gallery.replaceChildren();
 for(const t of HOUSE_TEMPLATES){
  const b=document.createElement("button");
  b.type="button";b.className="wrld-template-card"+(t.id===selected?" active":"");b.dataset.template=t.id;
  b.setAttribute("aria-pressed",String(t.id===selected));
  b.innerHTML=previewMarkup(t)+'<span class="wrld-template-text"><strong>'+escapeHtml(t.name)+'</strong><small>'+escapeHtml(t.tag)+'</small></span><span class="wrld-template-check">✓</span>';
  gallery.append(b);
 }
 const t=TEMPLATE_BY_ID[selected]||TEMPLATE_BY_ID.starter;
 $("houseTemplateSummary").textContent=t.name+" · "+t.tag+" · "+t.rooms+" приміщень.";
}
cards();
$("houseNameInput").value=getSettings()?.name||"Мій затишний дім";
gallery.addEventListener("click",event=>{
 const b=event.target.closest("[data-template]");if(!b)return;
 selected=b.dataset.template;cards();
});
function snapshot(){
 let house=null;
 window.dispatchEvent(new CustomEvent("wrld:house-get",{detail:{onResult:x=>{house=x}}}));
 return house;
}
function createHouse(){
 const t=TEMPLATE_BY_ID[selected];const name=$("houseNameInput").value.trim().slice(0,55);
 if(!t||!name){$("houseShareStatus").textContent="Спочатку введи назву будинку.";return}
 const settings={template:t.id,name,createdAt:Date.now()};
 try{localStorage.setItem(settingsKey,JSON.stringify(settings));localStorage.removeItem(STORE_KEY)}catch{}
 window.dispatchEvent(new CustomEvent("wrld:house-create",{detail:settings}));
 $("houseShareStatus").textContent="Будинок створено. Облаштовуй меблями!";
 document.querySelector('[data-go="home"]')?.click();
}
$("houseCreateButton").addEventListener("click",createHouse);
function token(){try{return sessionStorage.getItem("fw-token")||""}catch{return ""}}
async function call(path,method="GET",body){
 const t=token();const response=await fetch(API+path,{
  method,headers:{"Content-Type":"application/json",...(t?{Authorization:"Bearer "+t}:{})},
  ...(body!==undefined?{body:JSON.stringify(body)}:{})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||"Server returned "+response.status);
 return result;
}
async function publish(profile=false){
 const saved=getSettings();
 if(!saved?.template){$("houseShareStatus").textContent="Спочатку створи дім.";return null}
 const layout=snapshot();
 if(!layout){$("houseShareStatus").textContent="Редактор дому ще не готовий.";return null}
 $("houseShareStatus").textContent="Зберігаємо будинок для перегляду…";
 // Preserve an existing "show in profile" choice when using Share again.
 const existing=await call("/houses/mine");
 const inProfile=profile||existing.house?.in_profile===true;
 const r=await call("/houses/publish","PUT",{name:saved.name,template:saved.template,items:layout.items,published:true,in_profile:inProfile});
 publishedUser=r.username;
 $("houseShareStatus").textContent=inProfile?"Дім опубліковано й відображається в профілі.":"Дім опубліковано! Тепер можна поділитися посиланням.";
 updateProfileHouse();
 return r;
}
$("housePublishButton").addEventListener("click",async()=>{try{await publish(false)}catch(e){$("houseShareStatus").textContent=e.message+". Для публікації увійди й підтвердь Auth2FA."}});
$("houseProfileButton").addEventListener("click",async()=>{try{await publish(true)}catch(e){$("houseShareStatus").textContent=e.message+". Потрібен вхід і Auth2FA."}});
$("houseShareButton").addEventListener("click",async()=>{
 try{
  const r=await publish(false);if(!r)return;
  await navigator.clipboard.writeText(r.public_url);
  $("houseShareStatus").textContent="Публічне посилання скопійовано!";
 }catch(e){$("houseShareStatus").textContent=e.message+". Публічний доступ потребує акаунта та Auth2FA."}
});
function housePlan(house){
 const t=TEMPLATE_BY_ID[house.template]||TEMPLATE_BY_ID.starter;
 const n=t.rooms,cols=n<=2?n:n<=4?2:n<=6?3:4,rows=Math.ceil(n/cols);
 const cells=[];let i=0;
 for(let row=0;row<rows;row++){
  const num=Math.min(cols,n-i),width=10/num,height=8/rows;
  for(let col=0;col<num;col++){
   const centerX=-5+(col+.5)*width,centerZ=-4+(row+.5)*height;
   const x=(centerX-width/2+5)*10,y=(4-centerZ-height/2)*12.5;
   const garage=(t.id==="garage"||t.id==="garagehouse"||t.id==="workshop")&&i===n-1;
   cells.push('<div class="wrld-preview-room" style="left:'+x+'%;top:'+y+'%;width:'+width*10+'%;height:'+height*12.5+'%;background:'+["#dbcbbc","#dbc5d0","#c8d3e0","#d9d2b8"][i%4]+'"><small>'+(garage?"Гараж":["Вітальня","Спальня","Кабінет","Кухня","Ванна","Ігрова","Їдальня"][i%7])+'</small></div>');
   i++;
  }
 }
 const icons=Object.fromEntries([["sofa","🛋️"],["bed","🛏️"],["desk","🖥️"],["car","🚗"],["tv","📺"],["rug","▫️"],["plant","🪴"],["piano","🎹"],["dining","🍽️"],["fridge","🧊"],["chair","🪑"],["table","☕"],["arcade","🕹️"],["lamp","💡"],["tools","🛠️"]]);
 for(const item of house.items||[]){
  if(!Number.isFinite(item.x)||!Number.isFinite(item.z))continue;
  cells.push('<span class="wrld-preview-item" title="'+escapeHtml(item.type)+'" style="left:'+(item.x+5)*10+'%;top:'+(4-item.z)*12.5+'%;transform:translate(-50%,-50%) rotate('+item.rot*90+'deg)">'+(icons[item.type]||"◆")+'</span>');
 }
 return cells.join("");
}
function reactionMarkup(counts,owner){
 const map=new Map((counts||[]).map(v=>[v.emoji,Number(v.count)||0]));
 return REACTIONS.map((emoji)=>{
  const count=map.get(emoji)||0;
  return '<button type="button" class="wrld-reaction" data-house-emoji="'+escapeHtml(emoji)+'" title="Реагувати '+escapeHtml(emoji)+'" aria-label="'+escapeHtml(emoji)+' — '+count+'">'+emoji+' <span>'+count+'</span></button>';
 }).join("");
}
async function loadPublic(user){
 if(!/^[a-z][a-z0-9_]{2,23}$/i.test(user)){viewer.innerHTML="<p>Некоректне посилання.</p>";return}
 currentShareUser=user;
 viewer.innerHTML='<p class="wrld-preview-loading">Завантажуємо будинок користувача @'+escapeHtml(user)+'…</p>';
 try{
  const result=await call("/houses/public?user="+encodeURIComponent(user));
  const h=result.house;
  viewer.innerHTML='<div class="wrld-public-top"><div><div class="overline">ПУБЛІЧНИЙ ДІМ • '+escapeHtml(h.display_name||h.username)+'</div><h1>'+escapeHtml(h.name)+'</h1><p>'+escapeHtml((TEMPLATE_BY_ID[h.template]||{}).name||"Дім")+' · '+(h.items?.length||0)+' меблів</p></div><button data-go="create-house" class="wrld-house-cta">Створи свій дім ↗</button></div>'+
   '<div class="wrld-public-floor">'+housePlan(h)+'</div>'+
   '<div class="wrld-public-reactions"><div><h2>Як тобі цей дім?</h2><p>Обери одну з 20 реакцій. Щоб реагувати, потрібен акаунт і підтверджена 2FA.</p></div><div class="wrld-reaction-grid" id="houseReactionGrid">'+reactionMarkup(result.reactions,user)+'</div></div>'+
   '<p role="status" id="houseReactionStatus" class="wrld-share-feedback"></p>';
 }catch(e){viewer.innerHTML='<div class="wrld-view-error"><h2>Дім недоступний</h2><p>'+escapeHtml(e.message)+'</p><button data-go="create-house">Створити власний</button></div>'}
}
viewer.addEventListener("click",async(event)=>{
 const b=event.target.closest("[data-house-emoji]");if(!b||!currentShareUser)return;
 b.disabled=true;
 try{
  const result=await call("/houses/react","POST",{user:currentShareUser,emoji:b.dataset.houseEmoji});
  $("houseReactionGrid").innerHTML=reactionMarkup(result.reactions,currentShareUser);
  $("houseReactionStatus").textContent="Реакцію збережено 💜";
 }catch(e){$("houseReactionStatus").textContent=e.message+". Перевір, чи увійшов у профіль та пройшов 2FA.";b.disabled=false}
});
async function updateProfileHouse(){
 const root=$("page-profile");if(!root)return;
 let container=$("houseProfileCard");
 if(!container){
  container=document.createElement("section");container.id="houseProfileCard";container.className="wrld-profile-house";
  root.append(container);
 }
 const t=token();
 if(!t){container.innerHTML='<h2>🏠 Мій дім у профілі</h2><p>Увійди в акаунт, щоб опублікувати будинок у своєму профілі.</p>';return}
 try{
  const data=await call("/houses/mine");
  const house=data.house;
  if(!house?.in_profile){container.innerHTML='<h2>🏠 Мій дім у профілі</h2><p>Твій дім поки не показується в профілі.</p><button type="button" data-go="create-house" class="wrld-house-secondary">Додати свій дім ↗</button>';return}
  container.innerHTML='<div class="overline">ОПУБЛІКОВАНИЙ ДІМ</div><h2>🏠 '+escapeHtml(house.name)+'</h2><p>Кожен користувач може відвідати твій будинок і залишити реакцію.</p><a class="wrld-house-cta" href="#house?u='+encodeURIComponent(house.username)+'">Переглянути дім ↗</a>';
 }catch{container.innerHTML='<h2>🏠 Мій дім у профілі</h2><p>Не вдалося завантажити публікацію. Перевір зʼєднання.</p>'}
}
window.addEventListener("wrld:page-change",event=>{
 if(event.detail?.id==="house-view"){
  const match=location.hash.match(/^#house\?u=([a-z0-9_]{3,24})/i);
  if(match)loadPublic(match[1]);
 }else if(event.detail?.id==="profile")updateProfileHouse();
});
window.addEventListener("fw-auth-changed",()=>{if($("page-profile")?.classList.contains("active"))updateProfileHouse()});
if(location.hash.startsWith("#house?")){
 const match=location.hash.match(/^#house\?u=([a-z0-9_]{3,24})/i);
 if(match)loadPublic(match[1]);
}
if(!getSettings()&&!location.hash.startsWith("#house?")){
 document.querySelector('[data-go="create-house"]')?.click();
}
