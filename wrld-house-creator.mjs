import {HOUSE_TEMPLATES,TEMPLATE_BY_ID,STORE_KEY,encode} from "./wrld-home-core.mjs?v=2";
import {mountPublicHouse3D} from "./wrld-public-house-3d.mjs?v=1";
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const REACTIONS=["👍","👎","❤️","💜","💙","💚","💛","🧡","🩷","😍","🥰","🔥","✨","👏","🎉","🤩","😮","😂","🏠","💯"];
const $=id=>document.getElementById(id);
const gallery=$("houseTemplateGrid"),viewer=$("wrldPublicHouse");
const settingsKey="fleki_wrld_house_settings";
const houseLang=()=>document.documentElement?.lang==="uk"?"uk":"en",tr=(en,uk)=>houseLang()==="uk"?uk:en;
const PLANS_EN={loft:["City loft","Studio"],cottage:["Cozy cottage","2 rooms"],starter:["Starter home","3 rooms"],townhouse:["Townhouse","4 rooms"],family:["Family home","5 rooms"],villa:["Sunny villa","6 rooms"],mansion:["Grand mansion","7 rooms"],garage:["Garage workshop","Garage"],garagehouse:["House with garage","2 rooms + garage"],workshop:["Creative compound","4 rooms + garage"]};
const planText=t=>houseLang()==="uk"?[t.name,t.tag]:(PLANS_EN[t.id]||[t.name,t.tag]);
const escapeHtml=text=>String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getSettings=()=>{try{return JSON.parse(localStorage.getItem(settingsKey)||"null")}catch{return null}};
let selected=getSettings()?.template||"starter",publishedUser=null,currentShareUser=null,publicHouse=null,public3D=null,publicLoadId=0,publicModeId=0;
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
  b.innerHTML=previewMarkup(t)+'<span class="wrld-template-text"><strong>'+escapeHtml(planText(t)[0])+'</strong><small>'+escapeHtml(planText(t)[1])+'</small></span><span class="wrld-template-check">✓</span>';
  gallery.append(b);
 }
 const t=TEMPLATE_BY_ID[selected]||TEMPLATE_BY_ID.starter;
 $("houseTemplateSummary").textContent=planText(t).join(" · ")+" · "+t.rooms+" "+tr(t.rooms===1?"room":"rooms",t.rooms===1?"приміщення":"приміщень");
}
cards();
$("houseNameInput").value=getSettings()?.name||tr("My cozy home","Мій затишний дім");
$("houseOpenButton").hidden=!getSettings()?.template;$("continueHouseBtn").hidden=!getSettings()?.template;
window.addEventListener("wrld:language-change",()=>cards());
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
 if(!t||!name){$("houseShareStatus").textContent=tr("Name your house first.","Спочатку введи назву будинку.");return}
 const previous=getSettings();
 if(previous?.template&&!confirm(tr("Create a new house? This will replace your saved furniture layout on this device.","Створити новий будинок? Збережена розстановка меблів на цьому пристрої буде замінена.")))return;
 const settings={template:t.id,name,createdAt:Date.now()};
 try{localStorage.setItem(settingsKey,JSON.stringify(settings));localStorage.removeItem(STORE_KEY)}catch{}
 window.dispatchEvent(new CustomEvent("wrld:house-create",{detail:settings}));
 $("houseShareStatus").textContent=tr("House created. Start decorating!","Будинок створено. Облаштовуй меблями!");
 $("houseOpenButton").hidden=false;$("continueHouseBtn").hidden=false;$("houseOpenButton").click();
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
async function publish(profile=true){
 const saved=getSettings();
 if(!saved?.template){$("houseShareStatus").textContent=tr("Create a house first.","Спочатку створи будинок.");return null}
 const layout=snapshot();
 if(!layout){$("houseShareStatus").textContent=tr("Open your house editor and try again.","Відкрий редактор будинку й повтори.");return null}
 const existing=await call("/houses/mine");
 const showInProfile=profile||existing.house?.in_profile===true;
 const buttons=["housePublishButton","houseProfileButton","houseShareButton"].map($).filter(Boolean);
 buttons.forEach(b=>b.disabled=true);
 $("houseShareStatus").textContent=tr("Publishing and saving furniture…","Публікуємо будинок і зберігаємо меблі…");
 try{
  const r=await call("/houses/publish","PUT",{name:saved.name||layout.name,template:saved.template,items:layout.items,published:true,in_profile:showInProfile});
  if(!r.published||r.in_profile!==showInProfile)throw Error(tr("The server could not confirm publication.","Сервер не підтвердив публікацію."));
  const check=await call("/houses/mine");
  if(!check.house?.published||check.house.in_profile!==showInProfile)throw Error(tr("Publication did not persist. Retry.","Публікація не збереглася. Спробуй ще."));
  publishedUser=r.username;
  $("houseShareStatus").textContent=tr("Your house is now visible in your profile!","Твій будинок тепер видно у профілі!");
  window.dispatchEvent(new CustomEvent("wrld:house-published",{detail:{house:check.house}}));
  return r;
 }finally{buttons.forEach(b=>b.disabled=false)}
}
$("housePublishButton").addEventListener("click",async()=>{try{await publish(true)}catch(e){$("houseShareStatus").textContent=e.message+". "+tr("Sign in to publish your house.","Увійди в акаунт для публікації.")}});
$("houseProfileButton").addEventListener("click",async()=>{try{await publish(true)}catch(e){$("houseShareStatus").textContent=e.message+". "+tr("Sign in to publish your house.","Увійди в акаунт для публікації.")}});
$("houseShareButton").addEventListener("click",async()=>{
 try{
  const r=await publish(false);if(!r)return;
  await navigator.clipboard.writeText(r.public_url);
  $("houseShareStatus").textContent="Публічне посилання скопійовано!";
 }catch(e){$("houseShareStatus").textContent=e.message+". "+tr("Sign in to publish your house.","Увійди в акаунт для публікації.")}
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
function disposePublic3D(){public3D?.destroy();public3D=null}
async function switchPublicMode(mode){
 if(!publicHouse||!["3d","2d"].includes(mode))return;
 const ticket=++publicModeId;disposePublic3D();
 const stage=$("publicHouse3D"),flat=$("publicHouse2D"),status=$("publicHouseModeMessage");
 if(!stage||!flat||!status)return;
 for(const button of viewer.querySelectorAll("[data-house-view-mode]")){
  const selected=button.dataset.houseViewMode===mode;button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected));
 }
 const camera=$("publicHouseCameraControls");if(camera)camera.hidden=mode==="2d";
 stage.hidden=mode==="2d";flat.hidden=mode!=="2d";
 if(mode==="2d"){status.textContent=tr("2D floor plan","2D план будинку");return}
 status.textContent=tr("Loading interactive 3D house…","Завантажуємо інтерактивний 3D будинок…");
 try{
  const instance=await mountPublicHouse3D(stage,publicHouse,()=>ticket===publicModeId&&stage.isConnected&&!stage.hidden);
  if(!instance)return;
  if(ticket!==publicModeId){instance.destroy();return}
  public3D=instance;
  status.textContent=tr("Drag to rotate · Scroll to zoom · Use + / − on mobile","Перетягуй для обертання · Прокручуй для наближення · На телефоні кнопки + / −");
 }catch(error){
  if(ticket!==publicModeId)return;
  disposePublic3D();
  stage.hidden=true;flat.hidden=false;if(camera)camera.hidden=true;
  for(const button of viewer.querySelectorAll("[data-house-view-mode]")){
   const selected=button.dataset.houseViewMode==="2d";button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected));
  }
  status.textContent=tr("3D is unavailable on this device or network. Showing the 2D plan.","3D недоступне на цьому пристрої або в мережі. Показуємо 2D-план.");
 }
}
async function loadPublic(user){
 const request=++publicLoadId;++publicModeId;disposePublic3D();publicHouse=null;
 if(!/^[a-z][a-z0-9_]{2,23}$/i.test(user)){viewer.innerHTML='<p>'+tr("Invalid house link.","Некоректне посилання.")+'</p>';return}
 currentShareUser=user;
 viewer.innerHTML='<p class="wrld-preview-loading">'+tr("Loading the shared house…","Завантажуємо будинок…")+'</p>';
 try{
  const result=await call("/houses/public?user="+encodeURIComponent(user));
  if(request!==publicLoadId)return;
  const h=result.house;publicHouse=h;
  viewer.innerHTML='<div class="wrld-public-top"><div><div class="overline">'+tr("SHARED HOUSE","ПУБЛІЧНИЙ ДІМ")+' · @'+escapeHtml(h.username)+'</div><h1>'+escapeHtml(h.name)+'</h1><p>'+escapeHtml(planText(TEMPLATE_BY_ID[h.template]||TEMPLATE_BY_ID.starter)[0])+' · '+(h.items?.length||0)+' '+tr("pieces of furniture","предметів меблів")+'</p></div><button type="button" data-go="create-house" class="wrld-house-cta">'+tr("Create your house ↗","Створити свій дім ↗")+'</button></div>'+
   '<div class="wrld-public-view-controls"><div class="wrld-public-mode-buttons" role="group" aria-label="'+tr("House view mode","Режим перегляду будинку")+'"><button type="button" class="active" aria-pressed="true" data-house-view-mode="3d">◈ 3D</button><button type="button" aria-pressed="false" data-house-view-mode="2d">▦ 2D</button></div><div class="wrld-public-camera-controls" id="publicHouseCameraControls"><button type="button" data-house-camera="zoom-in" aria-label="'+tr("Zoom in","Наблизити")+'">＋</button><button type="button" data-house-camera="zoom-out" aria-label="'+tr("Zoom out","Віддалити")+'">−</button><button type="button" data-house-camera="reset" aria-label="'+tr("Reset camera","Скинути камеру")+'">↺</button></div></div>'+
   '<div class="wrld-public-scene"><div id="publicHouse3D" class="wrld-public-3d" aria-label="'+tr("Interactive 3D house","Інтерактивний 3D будинок")+'"></div><div id="publicHouse2D" class="wrld-public-floor" hidden>'+housePlan(h)+'</div></div><p class="wrld-public-mode-message" id="publicHouseModeMessage" role="status"></p>'+
   '<div class="wrld-public-reactions"><div><h2>'+tr("How do you like this house?","Як тобі цей дім?")+'</h2><p>'+tr("You need an account and verified Auth2FA to react.","Для реакції потрібен акаунт і підтверджена 2FA.")+'</p></div><div class="wrld-reaction-grid" id="houseReactionGrid">'+reactionMarkup(result.reactions,user)+'</div></div>'+
   '<p role="status" id="houseReactionStatus" class="wrld-share-feedback"></p>';
  await switchPublicMode("3d");
 }catch(error){
  if(request!==publicLoadId)return;
  viewer.innerHTML='<div class="wrld-view-error"><h2>'+tr("House unavailable","Дім недоступний")+'</h2><p>'+escapeHtml(error.message)+'</p><button type="button" data-go="create-house">'+tr("Create your own","Створити власний")+'</button></div>';
 }
}
viewer.addEventListener("click",async(event)=>{
 const switchButton=event.target.closest("[data-house-view-mode]");
 if(switchButton){void switchPublicMode(switchButton.dataset.houseViewMode);return}
 const cameraButton=event.target.closest("[data-house-camera]");
 if(cameraButton){
  if(cameraButton.dataset.houseCamera==="reset")public3D?.reset();
  else if(cameraButton.dataset.houseCamera==="zoom-in")public3D?.zoom(-1.5);
  else if(cameraButton.dataset.houseCamera==="zoom-out")public3D?.zoom(1.5);
  return;
 }
 const b=event.target.closest("[data-house-emoji]");if(!b||!currentShareUser)return;
 b.disabled=true;
 try{
  const result=await call("/houses/react","POST",{user:currentShareUser,emoji:b.dataset.houseEmoji});
  $("houseReactionGrid").innerHTML=reactionMarkup(result.reactions,currentShareUser);
  $("houseReactionStatus").textContent="Реакцію збережено 💜";
 }catch(e){$("houseReactionStatus").textContent=e.message+". Перевір, чи увійшов у профіль та пройшов 2FA.";b.disabled=false}
});
window.addEventListener("wrld:page-change",event=>{
 if(event.detail?.id!=="house-view"){++publicLoadId;++publicModeId;disposePublic3D();publicHouse=null;return}
 if(event.detail?.id==="house-view"){
  const match=location.hash.match(/^#house\?u=([a-z0-9_]{3,24})/i);
  if(match)loadPublic(match[1]);
 }
});
window.addEventListener("wrld:house-publish",async()=>{
 try{const r=await publish(true);if(!r)throw Error(tr("Open or create a house first.","Спочатку створи або відкрий будинок."));}
 catch(e){$("houseShareStatus").textContent=e.message;window.dispatchEvent(new CustomEvent("wrld:house-publish-error",{detail:{message:e.message}}))}
});
if(location.hash.startsWith("#house?")){
 const match=location.hash.match(/^#house\?u=([a-z0-9_]{3,24})/i);
 if(match)loadPublic(match[1]);
}
// Keep first-time visitors on welcome Home; house creation is optional.
