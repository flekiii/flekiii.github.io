import {HOUSE_TEMPLATES,TEMPLATE_BY_ID,TYPE_BY_ID,STORE_KEY,encode} from "./wrld-home-core.mjs?v=2";
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
let selected=getSettings()?.template||"starter",publishedUser=null,currentShareUser=null,publicHouse=null,public3D=null,publicLoadId=0,publicModeId=0,currentReaction=null;
let syncUser=null,syncToken="",syncVersion=null,syncTimer=0,cloudBusy=false,cloudPending=false,currentVisibility=null;
const setShareStatus=(en,uk)=>{$("houseShareStatus").textContent=tr(en,uk)};
function stopCloudSync(){clearTimeout(syncTimer);syncTimer=0;syncToken="";syncUser=null;syncVersion=null;cloudPending=false}
function localOwnerMismatch(user){
 const settings=getSettings();
 return !!(settings?.owner&&user?.id&&settings.owner!==user.id);
}
function checkBackup(input){
 if(!input||typeof input!=="object"||!TEMPLATE_BY_ID[input.template])throw Error(tr("Unknown house plan in backup.","Невідомий план будинку в копії."));
 if(typeof input.name!=="string"||!input.name.trim()||input.name.length>55)throw Error(tr("Invalid backup house name.","Некоректна назва будинку в копії."));
 if(!Array.isArray(input.items)||input.items.length>90)throw Error(tr("Invalid furniture in backup.","Некоректні меблі у копії."));
 const ids=new Set();
 for(const item of input.items){
  if(!item||typeof item.id!=="string"||!/^[-a-zA-Z0-9]{1,50}$/.test(item.id)||ids.has(item.id)||!TYPE_BY_ID[item.type]
    ||!Number.isFinite(item.x)||!Number.isFinite(item.z)||Math.abs(item.x)>5||Math.abs(item.z)>4
    ||!Number.isInteger(item.rot)||item.rot<0||item.rot>3)throw Error(tr("Backup contains invalid furniture.","Копія містить некоректні меблі."));
  ids.add(item.id);
 }
 return {name:input.name.trim(),template:input.template,items:input.items.map(({id,type,x,z,rot})=>({id,type,x,z,rot}))};
}
function restoreLocalPackage(raw,owner=null){
 const found=checkBackup(raw);
 const current=getSettings();
 if(current?.template&&!confirm(tr("Replace this device's house with the backup? A local restore point will be kept.","Замінити будинок на цьому пристрої резервною копією? Поточну версію збережемо.")))return false;
 backupLocal();stopCloudSync();
 const settings={template:found.template,name:found.name,createdAt:Date.now(),...(owner?{owner}:{})};
 writeSettings(settings);
 localStorage.removeItem(STORE_KEY);
 selected=found.template;$("houseNameInput").value=found.name;cards();
 window.dispatchEvent(new CustomEvent("wrld:house-import",{detail:{...settings,items:found.items}}));
 $("houseOpenButton").hidden=false;$("continueHouseBtn").hidden=false;
 const actual=snapshot();
 setShareStatus(actual?.items?.length===found.items.length?"Backup restored successfully ✓":"Backup restored; some invalid or overlapping items were skipped.","Резервну копію відновлено ✓");
 window.dispatchEvent(new CustomEvent("wrld:house-restored",{detail:{house:found}}));
 return true;
}
function exportBackupFile(){
 const details=checkBackup(localHouseData());
 const contents=JSON.stringify({format:"fleki-wrld-house",version:1,...details,exported_at:new Date().toISOString()},null,2);
 const blob=new Blob([contents],{type:"application/json"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="fleki-wrld-house-"+new Date().toISOString().slice(0,10)+".json";
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 setShareStatus("House backup downloaded ✓","Резервну копію будинку завантажено ✓");
}
function backupLocal(){
 try{
  const layout=localStorage.getItem(STORE_KEY),settings=localStorage.getItem(settingsKey);
  if(!layout&&!settings)return;
  localStorage.setItem("fleki_wrld_house_last_backup",JSON.stringify({layout,settings,savedAt:Date.now()}));
 }catch{}
}
function writeSettings(value){localStorage.setItem(settingsKey,JSON.stringify(value))}

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
 stopCloudSync();
 backupLocal();
 const settings={template:t.id,name,createdAt:Date.now()};
 try{writeSettings(settings);localStorage.removeItem(STORE_KEY)}catch{setShareStatus("Browser storage unavailable.","Недоступне сховище браузера.");return}
 window.dispatchEvent(new CustomEvent("wrld:house-create",{detail:settings}));
 $("houseShareStatus").textContent=tr("House created. Start decorating!","Будинок створено. Облаштовуй меблями!");
 $("houseOpenButton").hidden=false;$("continueHouseBtn").hidden=false;$("houseOpenButton").click();
}
$("houseCreateButton").addEventListener("click",createHouse);
function token(){try{return sessionStorage.getItem("fw-token")||""}catch{return ""}}
async function call(path,method="GET",body,authToken=token()){
 const t=authToken;const response=await fetch(API+path,{
  method,headers:{"Content-Type":"application/json",...(t?{Authorization:"Bearer "+t}:{})},
  ...(body!==undefined?{body:JSON.stringify(body)}:{})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(result.error||"Server returned "+response.status);error.status=response.status;throw error}
 return result;
}
async function whoAmI(){
 if(!token())throw Error(tr("Sign in to your fleki's wrld account first.","Спочатку увійди в акаунт fleki's wrld."));
 const capturedToken=token();
 const r=await call("/me","GET",undefined,capturedToken);
 if(token()!==capturedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
 if(!r.user?.id)throw Error(tr("Account verification failed.","Не вдалося перевірити акаунт."));
 return r.user;
}
function localHouseData(){
 const settings=getSettings(),layout=snapshot();
 if(!settings?.template||!TEMPLATE_BY_ID[settings.template]||!layout)throw Error(tr("Create a house before saving.","Створи будинок перед збереженням."));
 if(layout.template!==settings.template)throw Error(tr("House editor and selected plan differ. Reopen the editor.","План будинку й редактор не збігаються. Перевідкрий редактор."));
 return {name:settings.name||layout.name,template:settings.template,items:layout.items};
}
function markOwner(user){
 const old=getSettings();if(!old?.template)return;
 if(old.owner===user.id)return;
 writeSettings({...old,owner:user.id});
}
async function saveCloudDraft({manual=false}={}){
 if(cloudBusy){cloudPending=true;return}
 const startedToken=token();
 if(!startedToken){stopCloudSync();if(manual)throw Error(tr("Sign in to save your private house.","Увійди, щоб приватно зберегти будинок."));return}
 cloudBusy=true;
 try{
  const user=await whoAmI();
  if(token()!==startedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
  if(localOwnerMismatch(user))throw Error(tr("This browser house belongs to another account. Create or restore your own house.","Цей будинок у браузері належить іншому акаунту. Створи або віднови власний."));
  const local=localHouseData();
  // First cloud save is explicit: never silently overwrite another device's newer draft.
  if(!syncUser||syncUser!==user.id||syncToken!==startedToken){
   if(!manual)return;
   const remote=await call("/houses/draft","GET",undefined,startedToken);
   if(token()!==startedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
   if(remote.draft&&(remote.draft.template!==local.template||JSON.stringify(remote.draft.items)!==JSON.stringify(local.items))){
    if(!confirm(tr("Your account already has a private house draft. Replace it with the house on this device?","В акаунті вже є приватна чернетка. Замінити її будинком із цього пристрою?")))return;
   }
   syncVersion=remote.draft?.updated_at??null;
  }
  const payload={...local};
  if(syncVersion!==null)payload.expected_updated_at=syncVersion;
  if(token()!==startedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
  const saved=await call("/houses/draft","PUT",payload,startedToken);
  if(token()!==startedToken){stopCloudSync();return}
  syncUser=user.id;syncToken=startedToken;syncVersion=saved.updated_at;
  markOwner(user);
  if(manual)setShareStatus("Private cloud draft saved ✓ Auto-save is on.","Приватну чернетку збережено ✓ Автозбереження увімкнено.");
  else setShareStatus("Saved privately to your account ✓","Приватно збережено в акаунті ✓");
 }catch(error){
  if(error.status===409){stopCloudSync();setShareStatus("Your draft changed on another device. Restore it or save again manually.","Чернетку змінено на іншому пристрої. Віднови її або збережи ще раз вручну.");}
  else if(manual)throw error;
  else setShareStatus("Cloud auto-save failed. Your local house is still saved.","Автозбереження не вдалося. Будинок залишився у браузері.");
 }finally{
  cloudBusy=false;
  if(cloudPending){cloudPending=false;if(syncUser&&syncToken===token())queueCloudSave()}
 }
}
function queueCloudSave(){
 if(!syncUser||syncToken!==token())return;
 clearTimeout(syncTimer);
 syncTimer=setTimeout(()=>{syncTimer=0;void saveCloudDraft()},1500);
}
async function restoreCloudHouse(type="draft"){
 const expectedToken=token(),user=await whoAmI();
 if(token()!==expectedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
 const response=await call(type==="published"?"/houses/mine":"/houses/draft","GET",undefined,expectedToken);
 const source=type==="published"?response.house:response.draft;
 if(!source){setShareStatus(type==="published"?"No published house in your account yet.":"No private cloud draft in your account yet.",type==="published"?"У твоєму акаунті ще немає опублікованого будинку.":"В акаунті ще немає приватної чернетки.");return}
 if(expectedToken!==token())throw Error(tr("Account changed. Try again.","Акаунт змінився. Повтори дію."));
 const local=getSettings();
 if(local?.template&&!confirm(tr("Replace the house on this device with your saved account house? A local backup will be kept.","Замінити будинок на цьому пристрої версією з акаунта? Збережемо локальну резервну копію.")))return;
 backupLocal();stopCloudSync();
 const settings={template:source.template,name:source.name,owner:user.id,createdAt:Date.now(),...(type==="published"?{published_at:source.updated_at}:{})};
 writeSettings(settings);
 localStorage.removeItem(STORE_KEY);
 selected=source.template;$("houseNameInput").value=source.name;
 window.dispatchEvent(new CustomEvent("wrld:house-import",{detail:{...settings,items:source.items}}));
 $("houseOpenButton").hidden=false;$("continueHouseBtn").hidden=false;
 cards();
 if(type==="draft"){syncUser=user.id;syncToken=expectedToken;syncVersion=source.updated_at}
 setShareStatus("House restored from your account ✓","Будинок відновлено з акаунта ✓");
 window.dispatchEvent(new CustomEvent("wrld:house-restored",{detail:{house:source}}));
}
async function changeVisibility(published,inProfile){
 const capturedToken=token(),user=await whoAmI();
 if(token()!==capturedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
 const result=await call("/houses/visibility","PATCH",{published,in_profile:inProfile},capturedToken);
 currentVisibility=result.house;
 const settings=getSettings();if(settings?.owner===user.id)writeSettings({...settings,published_at:result.house.updated_at});
 window.dispatchEvent(new CustomEvent("wrld:house-published",{detail:{house:result.house}}));
 setShareStatus(published?(inProfile?"House is visible in your profile.":"House is public, but hidden from your profile."):"House hidden from public view. Your furniture remains saved.",published?(inProfile?"Будинок видно в профілі.":"Будинок публічний, але прихований із профілю."):"Будинок приховано від інших. Меблі залишилися збереженими.");
 updateVisibilityButtons();
}
function updateVisibilityButtons(){
 $("houseHideButton").hidden=!currentVisibility?.published;
 $("houseUnpublishButton").hidden=!currentVisibility?.published;
 if(currentVisibility?.published)$("houseHideButton").textContent=currentVisibility.in_profile?tr("Hide from profile","Приховати з профілю"):tr("Show in profile","Показати в профілі");
}
async function refreshVisibility(){
 if(!token()){currentVisibility=null;updateVisibilityButtons();return}
 try{const r=await call("/houses/mine");currentVisibility=r.house;updateVisibilityButtons()}catch{currentVisibility=null;updateVisibilityButtons()}
}
$("houseSaveCloudButton").addEventListener("click",async()=>{try{await saveCloudDraft({manual:true})}catch(e){setShareStatus(e.message,e.message)}});
$("houseRestoreCloudButton").addEventListener("click",async()=>{try{await restoreCloudHouse("draft")}catch(e){setShareStatus(e.message,e.message)}});
$("houseRestorePublishedButton").addEventListener("click",async()=>{try{await restoreCloudHouse("published")}catch(e){setShareStatus(e.message,e.message)}});
$("houseExportBackup").addEventListener("click",()=>{try{exportBackupFile()}catch(e){setShareStatus(e.message,e.message)}});
$("houseImportBackupButton").addEventListener("click",()=>{$("houseImportBackupFile").click()});
$("houseImportBackupFile").addEventListener("change",async event=>{
 const file=event.target.files?.[0];event.target.value="";
 if(!file)return;
 if(file.size>65536){setShareStatus("Backup is too large.","Завелика резервна копія.");return}
 try{
  const input=JSON.parse(await file.text());
  if(input.format!=="fleki-wrld-house"||input.version!==1)throw Error(tr("Unknown backup version.","Невідома версія резервної копії."));
  restoreLocalPackage(input);
 }catch(error){setShareStatus(error.message,error.message)}
});
$("houseRestoreLocalBackup").addEventListener("click",()=>{
 try{
  const found=JSON.parse(localStorage.getItem("fleki_wrld_house_last_backup")||"null");
  if(!found?.settings||!found.layout){setShareStatus("No previous local backup available.","Немає попередньої локальної копії.");return}
  const settings=JSON.parse(found.settings),layout=JSON.parse(found.layout);
  restoreLocalPackage({name:settings.name,template:settings.template,items:layout.items},settings.owner||null);
 }catch(error){setShareStatus(error.message,error.message)}
});
$("houseHideButton").addEventListener("click",async()=>{try{await changeVisibility(true,!currentVisibility.in_profile)}catch(e){setShareStatus(e.message,e.message)}});
$("houseUnpublishButton").addEventListener("click",async()=>{if(!confirm(tr("Hide your published house from everyone? Your house and furniture will not be deleted.","Приховати опублікований будинок від усіх? Будинок і меблі не видаляться.")))return;try{await changeVisibility(false,false)}catch(e){setShareStatus(e.message,e.message)}});
window.addEventListener("wrld:house-saved",()=>queueCloudSave());
window.addEventListener("fw-auth-changed",()=>{stopCloudSync();void refreshVisibility()});
window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="create-house")void refreshVisibility()});
window.addEventListener("wrld:house-restore",async e=>{try{await restoreCloudHouse(e.detail?.type==="published"?"published":"draft")}catch(error){window.dispatchEvent(new CustomEvent("wrld:house-restore-error",{detail:{message:error.message}}))}});
window.addEventListener("wrld:house-save-cloud",async()=>{
 try{await saveCloudDraft({manual:true});window.dispatchEvent(new CustomEvent("wrld:house-cloud-status",{detail:{message:tr("Private cloud draft saved ✓","Приватну чернетку збережено ✓")}}))}
 catch(error){window.dispatchEvent(new CustomEvent("wrld:house-cloud-status",{detail:{message:error.message}}))}
});
window.addEventListener("wrld:house-visibility",async e=>{
 try{
  if(!currentVisibility){await refreshVisibility()}
  const action=e.detail?.action;
  if(action==="private")await changeVisibility(false,false);
  else if(action==="profile")await changeVisibility(true,!currentVisibility?.in_profile);
 }catch(error){window.dispatchEvent(new CustomEvent("wrld:house-cloud-status",{detail:{message:error.message}}))}
});

void refreshVisibility();
async function publish(profile=true){
 const saved=getSettings();
 if(!saved?.template){$("houseShareStatus").textContent=tr("Create a house first.","Спочатку створи будинок.");return null}
 const capturedToken=token(),current=await whoAmI();
 if(token()!==capturedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
 if(localOwnerMismatch(current))throw Error(tr("This browser house belongs to another account. Restore your own house first.","Цей будинок у браузері належить іншому акаунту. Спочатку віднови власний будинок."));
 const layout=snapshot();
 if(!layout){$("houseShareStatus").textContent=tr("Open your house editor and try again.","Відкрий редактор будинку й повтори.");return null}
 const existing=await call("/houses/mine","GET",undefined,capturedToken);
 if(token()!==capturedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
 if(existing.house?.updated_at&&Number(saved.published_at||0)!==Number(existing.house.updated_at)){
  const same=existing.house.template===saved.template&&JSON.stringify(existing.house.items)===JSON.stringify(layout.items);
  if(!same&&!confirm(tr("A different house is already published on this account. Replace it with the current local layout?","У цьому акаунті вже є інший опублікований будинок. Замінити його поточним локальним?")))return null;
 }
 const showInProfile=profile||existing.house?.in_profile===true;
 const buttons=["housePublishButton","houseProfileButton","houseShareButton"].map($).filter(Boolean);
 buttons.forEach(b=>b.disabled=true);
 $("houseShareStatus").textContent=tr("Publishing and saving furniture…","Публікуємо будинок і зберігаємо меблі…");
 try{
  if(token()!==capturedToken)throw Error(tr("Account changed. Please try again.","Акаунт змінився. Повтори дію."));
  const r=await call("/houses/publish","PUT",{name:saved.name||layout.name,template:saved.template,items:layout.items,published:true,in_profile:showInProfile,expected_updated_at:existing.house?.updated_at||0},capturedToken);
  if(!r.published||r.in_profile!==showInProfile)throw Error(tr("The server could not confirm publication.","Сервер не підтвердив публікацію."));
  const check=await call("/houses/mine","GET",undefined,capturedToken);
  if(!check.house?.published||check.house.in_profile!==showInProfile)throw Error(tr("Publication did not persist. Retry.","Публікація не збереглася. Спробуй ще."));
  publishedUser=r.username;
  markOwner(current);
  const currentSettings=getSettings();if(currentSettings?.owner===current.id)writeSettings({...currentSettings,published_at:check.house.updated_at});
  currentVisibility=check.house;updateVisibilityButtons();
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
function reactionMarkup(counts,owner,selected=null){
 const map=new Map((counts||[]).map(v=>[v.emoji,Number(v.count)||0]));
 return REACTIONS.map((emoji)=>{
  const count=map.get(emoji)||0;
  return '<button type="button" class="wrld-reaction'+(selected===emoji?" selected":"")+'" aria-pressed="'+String(selected===emoji)+'" data-house-emoji="'+escapeHtml(emoji)+'" title="Реагувати '+escapeHtml(emoji)+'" aria-label="'+escapeHtml(emoji)+' — '+count+'">'+emoji+' <span>'+count+'</span></button>';
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
 const request=++publicLoadId;++publicModeId;disposePublic3D();publicHouse=null;currentReaction=null;
 if(!/^[a-z][a-z0-9_]{2,23}$/i.test(user)){viewer.innerHTML='<p>'+tr("Invalid house link.","Некоректне посилання.")+'</p>';return}
 currentShareUser=user;
 viewer.innerHTML='<p class="wrld-preview-loading">'+tr("Loading the shared house…","Завантажуємо будинок…")+'</p>';
 try{
  const result=await call("/houses/public?user="+encodeURIComponent(user));
  if(request!==publicLoadId)return;
  const h=result.house;publicHouse=h;currentReaction=result.your_reaction||null;
  viewer.innerHTML='<div class="wrld-public-top"><div><div class="overline">'+tr("SHARED HOUSE","ПУБЛІЧНИЙ ДІМ")+' · @'+escapeHtml(h.username)+'</div><h1>'+escapeHtml(h.name)+'</h1><p>'+escapeHtml(planText(TEMPLATE_BY_ID[h.template]||TEMPLATE_BY_ID.starter)[0])+' · '+(h.items?.length||0)+' '+tr("pieces of furniture","предметів меблів")+'</p></div><button type="button" data-go="create-house" class="wrld-house-cta">'+tr("Create your house ↗","Створити свій дім ↗")+'</button></div>'+
   '<div class="wrld-public-view-controls"><div class="wrld-public-mode-buttons" role="group" aria-label="'+tr("House view mode","Режим перегляду будинку")+'"><button type="button" class="active" aria-pressed="true" data-house-view-mode="3d">◈ 3D</button><button type="button" aria-pressed="false" data-house-view-mode="2d">▦ 2D</button></div><div class="wrld-public-camera-controls" id="publicHouseCameraControls"><button type="button" data-house-camera="zoom-in" aria-label="'+tr("Zoom in","Наблизити")+'">＋</button><button type="button" data-house-camera="zoom-out" aria-label="'+tr("Zoom out","Віддалити")+'">−</button><button type="button" data-house-camera="reset" aria-label="'+tr("Reset camera","Скинути камеру")+'">↺</button></div></div>'+
   '<div class="wrld-public-scene"><div id="publicHouse3D" class="wrld-public-3d" aria-label="'+tr("Interactive 3D house","Інтерактивний 3D будинок")+'"></div><div id="publicHouse2D" class="wrld-public-floor" hidden>'+housePlan(h)+'</div></div><p class="wrld-public-mode-message" id="publicHouseModeMessage" role="status"></p>'+
   '<div class="wrld-public-reactions"><div><h2>'+tr("How do you like this house?","Як тобі цей дім?")+'</h2><p>'+tr("You need an account and verified Auth2FA to react.","Для реакції потрібен акаунт і підтверджена 2FA.")+'</p></div><div class="wrld-reaction-grid" id="houseReactionGrid">'+reactionMarkup(result.reactions,user,currentReaction)+'</div></div>'+
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
 const b=event.target.closest("[data-house-emoji]");if(!b||!currentShareUser||b.disabled)return;
 b.disabled=true;
 const emoji=currentReaction===b.dataset.houseEmoji?null:b.dataset.houseEmoji;
 const status=$("houseReactionStatus");
 try{
  const result=await call("/houses/react","POST",{user:currentShareUser,emoji});
  currentReaction=result.your_reaction||null;
  const grid=$("houseReactionGrid");if(grid)grid.innerHTML=reactionMarkup(result.reactions,currentShareUser,currentReaction);
  if(status)status.textContent=emoji?tr("Reaction saved 💜","Реакцію збережено 💜"):tr("Reaction removed","Реакцію прибрано");
 }catch(e){
  if(status){
   status.textContent=e.message;
   if(e.status===403){
    status.insertAdjacentHTML("beforeend",' <span>'+tr("If you already connected Auth2FA, enter a fresh code for this session.","Якщо Auth2FA вже підключено, введи актуальний код для цього сеансу.")+'</span> <button type="button" class="wrld-house-secondary" data-go="profile">'+tr("Open Profile → Security","Відкрити профіль → Захист")+' ↗</button>');
   }else if(e.status===401){
    status.insertAdjacentHTML("beforeend",' <button type="button" class="wrld-house-secondary" data-go="profile">'+tr("Sign in","Увійти")+' ↗</button>');
   }
  }
  b.disabled=false;
 }
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
