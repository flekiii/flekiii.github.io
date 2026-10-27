/* Meet People — separate opt-in friend and dating questionnaires, with protected photos. */
const root=document.getElementById("wrld-discover-root");
if(root){
 const API="https://flekis-wrld-api.flekideveloper.workers.dev";
 const tr=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const token=()=>sessionStorage.getItem("fw-token")||"";
 const active=()=>document.getElementById("page-discover")?.classList.contains("active");
 const isId=x=>/^[a-f0-9-]{36}$/i.test(String(x||""));
 let mode="friends",query="",loading=false,busy=false,members=[],message="",error="",group="",enabled=false;
 let editor=false,self={card:{},age_ready:false},draft={bio:"",gender:"undisclosed",seeking:"everyone"},revision=0;
 const photos=new Map();
 let ownPhotoError="";
 async function api(path,method="GET",body){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
   const response=await fetch(API+path,{method,cache:"no-store",signal:ctl.signal,headers:{Accept:"application/json",Authorization:"Bearer "+token(),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||tr("Request failed.","Помилка запиту."));
   return data;
  }finally{clearTimeout(timer)}
 }
 const picKey=(m,id)=>m+":"+id;
 async function loadPhoto(p,m=mode){
  if(!p?.has_photo||!isId(p.id)||!token())return;
  const key=picKey(m,p.id);if(photos.has(key))return;
  photos.set(key,"");
  try{
   const r=await fetch(API+"/discover/photo/"+m+"/"+p.id,{headers:{Authorization:"Bearer "+token()},cache:"no-store"});
   if(!r.ok)throw Error("Not available");
   const blob=await r.blob();if(blob.size>900*1024)throw Error("Too large");
   const url=URL.createObjectURL(blob);photos.set(key,url);if(p.id===self.user_id)ownPhotoError="";
   if(mode===m&&root.querySelectorAll){
    for(const element of root.querySelectorAll('[data-fd-photo="'+p.id+'"]')){
     let img=element.querySelector("img");
     if(!img){img=document.createElement("img");img.alt="";element.append(img)}
     img.src=url;
     const placeholder=element.querySelector?.(".fd-photo-placeholder");if(placeholder)placeholder.remove();
    }
   }
  }catch(err){photos.delete(key);if(p.id===self.user_id){ownPhotoError=tr("Photo could not be displayed. Try uploading again.","Фото не вдалося показати. Спробуй завантажити ще раз.");const hint=root.querySelector?.("#fd-own-photo-error");if(hint)hint.textContent=ownPhotoError;}}
 }
 function hydrate(){for(const person of members)void loadPhoto(person);if(self?.card?.has_photo&&self.user_id)void loadPhoto({id:self.user_id,has_photo:true});}
 function picture(p){
  const initial=esc(String(p.display_name||p.username||"?").slice(0,1).toUpperCase());
  const cache=photos.get(picKey(mode,p.id));
  const src=cache||(p.media_public&&isId(p.id)?API+"/profiles/media/"+p.id+"/avatar":"");
  return '<span class="fd-avatar" data-fd-photo="'+esc(p.id)+'">'+initial+(src?'<img src="'+src+'" alt="" loading="lazy" decoding="async" onerror="this.remove()">':'')+'</span>';
 }
 function tags(p){
  const list=Array.isArray(p.interests)?p.interests.slice(0,8):[];
  return list.length?'<div class="fd-tags">'+list.map(x=>'<span>'+esc(window.WrldInterests?.label?.(x)||x)+'</span>').join("")+'</div>':
   '<p class="fd-card-nointerests">'+tr("No shared interests listed yet","Поки немає вказаних інтересів")+'</p>';
 }
 function ownCard(){
  if(mode!=="friends"||!self?.age_ready||!self.user_id)return "";
  const name=self.display_name||tr("My questionnaire","Моя анкета");
  const mine={id:self.user_id,display_name:name,media_public:false,has_photo:!!self.card?.has_photo};
  return '<article class="fd-card fd-own-card" data-fd-own="true" aria-label="'+tr("Your friends questionnaire","Твоя анкета для друзів")+'">'+
   '<div class="fd-card-photo-wrap">'+picture(mine)+'<div class="fd-own-label"><strong>✦ '+tr("Your questionnaire","Твоя анкета")+'</strong><span class="'+(enabled?"fd-own-public":"fd-own-private")+'">'+(enabled?tr("✓ Published","✓ Опубліковано"):tr("🔒 Only you · Not published","🔒 Тільки ти · Не опубліковано"))+'</span></div></div>'+
   '<div class="fd-card-top"><div class="fd-card-name"><h3>'+esc(name)+'</h3><p class="fd-age">'+esc(self.age_range||group)+'</p></div></div>'+
   (self.card?.bio?'<p class="fd-card-bio">'+esc(self.card.bio)+'</p>':'<p class="fd-card-nointerests">'+tr("Add a description to complete your card.","Додай опис, щоб завершити анкету.")+'</p>')+
   tags({interests:self.interests||[]})+
   (!enabled?'<p class="fd-publication-tip">'+tr("Not visible to anyone else yet. Add a short bio and publish your card.","Інші ще не бачать анкету. Додай короткий опис і опублікуй її.")+'</p>':'')+
   '<div class="fd-card-actions">'+(!enabled?'<button type="button" class="btn primary" data-fd="publish-own">✦ '+tr("Publish my card","Опублікувати анкету")+'</button>':'')+'<button type="button" class="btn" data-fd="edit-card">✎ '+tr("Edit my questionnaire","Редагувати анкету")+'</button></div></article>';
 }
 function card(p){
  const username=String(p.username||""),handle=/^fmail_[a-z0-9]+$/i.test(username)?"":"@"+esc(username);
  return '<article class="fd-card"><div class="fd-card-photo-wrap">'+picture(p)+'</div><div class="fd-card-top">'+
   '<div class="fd-card-name"><h3>'+esc(p.display_name||username)+'</h3><p>'+(handle?handle+' · ':'')+
   '<span class="fd-age">'+esc(p.age_group||group)+'</span></p></div></div>'+
   (p.bio?'<p class="fd-card-bio">'+esc(p.bio)+'</p>':'')+
   (p.status_text?'<p class="fd-status">'+esc((p.status_emoji||"💬")+" "+p.status_text)+'</p>':'')+
   '<div class="fd-card-shared">✦ '+Math.max(0,Number(p.common)||0)+' '+tr("shared interests","спільних інтересів")+'</div>'+tags(p)+
   '<div class="fd-card-actions"><button type="button" class="btn primary" data-fd="friend" data-id="'+esc(p.id)+'" '+(p.already_friends?'disabled':'')+'>'+(p.already_friends?tr("✓ Friends","✓ Уже друзі"):tr("👋 Add friend","👋 Додати в друзі"))+'</button>'+
   '<button type="button" class="btn" data-fd="view" data-username="'+esc(username)+'">'+tr("View profile","Профіль")+' ↗</button></div>'+
   '<div class="fd-card-safety"><button type="button" data-fd="report" data-username="'+esc(username)+'">⚑ '+tr("Report","Скарга")+'</button><button type="button" data-fd="block" data-id="'+esc(p.id)+'">⊘ '+tr("Block","Блокувати")+'</button></div></article>';
 }
 const profileLink=()=>'<button type="button" class="btn primary" data-fd="profile-settings">'+tr("Open profile settings","Налаштування профілю")+' ↗</button>';
 const option=(value,label,current)=>'<option value="'+value+'" '+(current===value?'selected':'')+'>'+label+'</option>';
 function form(){
  const photo=photos.get(picKey(mode,self.user_id));
  const name=mode==="dating"?tr("Your dating questionnaire","Твоя анкета знайомств"):tr("Your friends questionnaire","Твоя анкета для друзів");
  return '<div class="fd-editor"><header class="fd-editor-head"><div><span class="fd-editor-kicker">'+(mode==="dating"?"💜 DATING":"👥 FRIENDS")+'</span><h3>'+name+'</h3><p>'+tr("Customize what other people see in this section.","Налаштуй, що інші бачать саме в цьому розділі.")+'</p></div><button type="button" class="btn" data-fd="close-card">× '+tr("Close","Закрити")+'</button></header>'+
   '<div class="fd-editor-grid"><div class="fd-photo-panel"><div class="fd-editor-photo" data-fd-photo="'+esc(self.user_id||"")+'">'+(photo?'<img src="'+photo+'" alt="">':'<span class="fd-photo-placeholder" aria-hidden="true">📸</span>')+'</div>'+
   '<label class="btn fd-upload"><input id="fd-photo" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" hidden>＋ '+tr("Upload your photo","Додати своє фото")+'</label>'+
   (self.card?.has_photo?'<button type="button" class="fd-remove-photo" data-fd="remove-photo">'+tr("Remove photo","Прибрати фото")+'</button>':'')+
   '<small>'+tr("PNG/JPG/GIF/WebP, up to 900 KB. Your main profile avatar stays unchanged.","PNG/JPG/GIF/WebP, до 900 КБ. Аватар основного профілю не зміниться.")+'</small><small id="fd-own-photo-error" role="status">'+esc(ownPhotoError)+'</small></div>'+
   '<div class="fd-editor-fields"><label class="fd-field"><span>'+tr("A little about you","Трішки про себе")+'</span><textarea id="fd-bio" rows="4" maxlength="280" placeholder="'+tr("Your interests, games, and what kind of people you'd like to meet…","Твої захоплення, ігри та з якими людьми хотілося б познайомитися…")+'">'+esc(draft.bio)+'</textarea><small>'+tr("No address, phone number, or personal contacts.","Не вказуй адресу, телефон чи особисті контакти.")+'</small></label>'+
   (mode==="dating"?'<div class="fd-editor-selects"><label class="fd-field"><span>'+tr("I am","Я")+'</span><select id="fd-gender">'+option("undisclosed",tr("Choose…","Обери…"),draft.gender)+option("girl",tr("Girl","Дівчина"),draft.gender)+option("boy",tr("Boy","Хлопець"),draft.gender)+option("other",tr("Other","Інше"),draft.gender)+'</select></label>'+
   '<label class="fd-field"><span>'+tr("Looking for","Кого шукати")+'</span><select id="fd-seeking">'+option("everyone",tr("Everyone","Усіх"),draft.seeking)+option("girls",tr("Girls","Дівчат"),draft.seeking)+option("boys",tr("Boys","Хлопців"),draft.seeking)+'</select></label></div>':'')+
   '<p class="fd-editor-age">🛡️ '+tr("Matching ages: ","Вік для пошуку: ")+'<strong>'+esc(self.age_range||"—")+'</strong> · '+tr("Based on self-declared profile age.","За віком, вказаним у профілі.")+'</p>'+
   (self.interests?.length?'<div class="fd-tags">'+self.interests.slice(0,12).map(x=>'<span>'+esc(window.WrldInterests?.label?.(x)||x)+'</span>').join("")+'</div>':'')+
   '<div class="fd-editor-actions"><button type="button" class="btn primary" data-fd="publish-card">'+(enabled?tr("Save questionnaire","Зберегти анкету"):tr("Publish questionnaire","Опублікувати анкету"))+'</button>'+
   '<button type="button" class="btn" data-fd="save-hidden">'+tr("Save privately","Зберегти приватно")+'</button>'+
   (enabled?'<button type="button" class="fd-hide" data-fd="hide-card">'+tr("Hide my questionnaire","Приховати анкету")+'</button>':'')+'</div></div></div></div>';
 }
 function state(){
  if(!token())return '<div class="fd-state"><span class="fd-state-icon">🔐</span><h3>'+tr("Sign in to meet people","Увійди, щоб знайомитися")+'</h3>'+profileLink()+'</div>';
  if(editor)return form();
  if(!self.age_ready&&!loading)return '<div class="fd-state"><span class="fd-state-icon">🎂</span><h3>'+tr("Set your age first","Спершу вкажи свій вік")+'</h3><p>'+tr("Meet People uses the age saved in Profile → About me.","Meet People використовує вік із Профіль → Про мене.")+'</p>'+profileLink()+'</div>';
  if(mode==="friends"&&self?.age_ready&&self.user_id){
   const peers=members.filter(x=>x.id!==self.user_id);
   const summary=error?'<div class="fd-peer-note" role="status">'+esc(error)+'</div>':
    loading?'<div class="fd-peer-note" role="status">'+tr("Searching for friends…","Шукаємо друзів…")+'</div>':
    !peers.length?'<div class="fd-peer-note">'+tr("No other questionnaires found yet. Your own card is shown above.","Інших анкет поки немає. Твоя анкета відображається вище.")+'</div>':"";
   return '<div class="fd-cards">'+ownCard()+peers.map(card).join("")+summary+'</div>';
  }
  if(mode==="dating"&&!enabled&&!loading&&!error)return '<div class="fd-state fd-dating-consent"><span class="fd-state-icon">💜</span><h3>'+tr("Meet people your age","Знайомся з однолітками")+'</h3><p>'+tr("Create your own dating card. Only others in your age range who also opted in can see it.","Створи власну анкету. Її побачать лише користувачі відповідного віку, які також погодилися.")+'</p><button type="button" class="btn primary" data-fd="edit-card">'+tr("💜 Create my dating card","💜 Створити анкету знайомств")+'</button><small>'+tr("Ages are self-declared, not verified.","Вік указують самостійно, без перевірки.")+'</small></div>';
  if(error)return '<div class="fd-state" role="status"><span class="fd-state-icon">✦</span><h3>'+tr("Set up your questionnaire","Налаштуй свою анкету")+'</h3><p>'+esc(error)+'</p><button type="button" class="btn primary" data-fd="edit-card">'+tr("＋ Create my card","＋ Створити анкету")+'</button></div>';
  if(loading)return '<div class="fd-state" role="status"><span class="fd-loader">◌</span><p>'+tr("Finding people…","Шукаємо людей…")+'</p></div>';

  if(!members.length)return '<div class="fd-state"><span class="fd-state-icon">✦</span><h3>'+tr("Nobody here yet","Поки нікого немає")+'</h3><p>'+tr("Only profiles shared voluntarily in your eligible age range are shown. Try refreshing later.","Показуємо тільки добровільно опубліковані анкети відповідного віку. Спробуй оновити пізніше.")+'</p><button type="button" class="btn" data-fd="edit-card">'+tr("Edit my questionnaire","Моя анкета")+'</button></div>';
  return '<div class="fd-cards">'+members.map(card).join("")+'</div>';
 }
 function render(){
  if(!root)return;
  root.innerHTML='<div class="fd-shell"><header class="fd-hero"><span class="fd-hero-icon" aria-hidden="true">✦</span><div class="fd-hero-copy"><span class="overline">'+tr("FLEKI'S WRLD / MEET PEOPLE","FLEKI'S WRLD / ЗНАЙОМСТВА")+'</span><h2>'+tr("Meet your people.","Знайди своїх людей.")+'</h2><p>'+tr("Real profiles. Shared interests. Your age range.","Справжні анкети. Спільні інтереси. Твій віковий діапазон.")+'</p></div><span class="fd-hero-group">'+esc(group||(mode==="friends"?"14+":"15+"))+'</span></header>'+
   '<div class="fd-panel"><div class="fd-panel-top"><div class="fd-modes" role="group" aria-label="'+tr("Discovery mode","Режим пошуку")+'">'+
   '<button type="button" data-fd="mode" data-mode="friends" class="'+(mode==="friends"?"active":"")+'" aria-pressed="'+(mode==="friends")+'">👥 '+tr("Find friends","Знайти друзів")+'</button>'+
   '<button type="button" data-fd="mode" data-mode="dating" class="'+(mode==="dating"?"active":"")+'" aria-pressed="'+(mode==="dating")+'">💜 '+tr("Dating · 15+","Знайомства · 15+")+'</button></div>'+
   (token()?'<button type="button" class="btn fd-create" data-fd="edit-card">✎ '+(enabled?tr("My questionnaire","Моя анкета"):tr("＋ Create a questionnaire","＋ Створити анкету"))+'</button>':'')+'</div>'+
   '<div class="fd-notice"><span aria-hidden="true">🛡️</span><p>'+tr("Separate teen and adult groups. Your age comes from your profile and is not verified. You can hide your card anytime. Never share your address, phone or passwords.","Підлітки й дорослі окремо. Вік узято з профілю без перевірки. Анкету можна приховати будь-коли. Не поширюй адресу, телефон чи паролі.")+'</p></div>'+
   (editor?'':'<div class="fd-toolbar"><label class="fd-search"><span aria-hidden="true">⌕</span><input type="search" id="fd-query" maxlength="32" autocomplete="off" value="'+esc(query)+'" placeholder="'+tr("Search people or interests…","Пошук людей чи інтересів…")+'"></label><button type="button" class="btn primary" data-fd="search">'+tr("Search","Шукати")+'</button><button type="button" class="btn fd-refresh" data-fd="refresh" title="'+tr("Refresh","Оновити")+'">↻</button></div>')+
   '<div class="fd-results-header"><strong>'+(editor?tr("Edit your questionnaire","Редагуй свою анкету"):tr("People for you","Люди для тебе"))+'</strong><span>'+esc(group||"")+(!editor?' · '+(members.length+(mode==="friends"&&self?.age_ready&&self.user_id?1:0))+' '+tr("profiles","анкет"):'')+'</span></div>'+
   (message?'<p class="fd-feedback" role="status">'+esc(message)+'</p>':'')+
   '<section class="fd-results" aria-label="'+tr("People discovery","Пошук людей")+'">'+state()+'</section></div></div>';
 }
 async function load(){
  if(!active()||!token()){render();return}
  const rid=++revision,currentMode=mode;loading=true;error="";message="";render();
  try{
   const own=await api("/discover/me?mode="+currentMode);
   if(rid!==revision||mode!==currentMode)return;
   self=own;group=own.age_range||"";enabled=own.enabled===true;
   if(own.card?.has_photo&&own.user_id)void loadPhoto({id:own.user_id,has_photo:true},currentMode);else ownPhotoError="";
   if(!own.age_ready){error=tr("Set an eligible age in Profile → About me.","Вкажи відповідний вік у Профіль → Про мене.");members=[];return}
   if(!enabled){members=[];return}
   const data=await api((currentMode==="dating"?"/discover/dating":"/discover/friends")+"?q="+encodeURIComponent(query));
   if(rid!==revision||mode!==currentMode)return;
   members=Array.isArray(data.members)?data.members:[];group=data.age_group||own.age_range||"";
  }catch(err){if(rid===revision){members=[];error=err.message}}
  finally{if(rid===revision){loading=false;render();hydrate()}}
 }
 async function upload(file){
  if(!file||!self.age_ready)return;
  if(file.size<32||file.size>900*1024){message=tr("Photo must be under 900 KB.","Фото має бути до 900 КБ.");render();return}
  if(!["image/png","image/jpeg","image/gif","image/webp"].includes(file.type)){message=tr("Choose PNG, JPG, GIF or WebP.","Обери PNG, JPG, GIF або WebP.");render();return}
  busy=true;message=tr("Uploading photo…","Завантажуємо фото…");render();
  try{
   const response=await fetch(API+"/discover/photo?mode="+mode,{method:"POST",headers:{Authorization:"Bearer "+token(),"Content-Type":file.type},body:file,cache:"no-store"});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||tr("Photo upload failed.","Помилка завантаження фото."));
   const key=picKey(mode,self.user_id);if(photos.get(key))URL.revokeObjectURL?.(photos.get(key));photos.delete(key);
   self.card.has_photo=true;await loadPhoto({id:self.user_id,has_photo:true});
   message=tr("Photo saved ✓","Фото збережено ✓");
  }catch(err){message=err.message}finally{busy=false;render()}
 }
 root.addEventListener("click",async event=>{
  const button=event.target.closest?.("[data-fd]");if(!button||busy)return;
  const action=button.dataset.fd;
  if(action==="mode"){
   const next=button.dataset.mode==="dating"?"dating":"friends";if(next===mode)return;
   mode=next;query="";error="";message="";editor=false;members=[];group="";enabled=false;self={card:{},age_ready:false};++revision;loading=false;void load();return;
  }
  if(action==="search"||action==="refresh"){query=root.querySelector("#fd-query")?.value?.trim()||"";void load();return}
  if(action==="profile-settings"){location.hash="#profile";return}
  if(action==="edit-card"){draft={bio:self.card?.bio||"",gender:self.card?.gender||"undisclosed",seeking:self.card?.seeking||"everyone"};editor=true;render();return}
  if(action==="publish-own"){
   if(mode!=="friends"||!self.age_ready||enabled)return;
   if(!self.card?.bio?.trim()){
    draft={bio:self.card?.bio||"",gender:"undisclosed",seeking:"everyone"};
    editor=true;message=tr("Add a short description, then press Publish questionnaire.","Додай короткий опис, а потім натисни «Опублікувати анкету».");render();return;
   }
   if(!confirm(tr("Make your questionnaire visible to people in your age range?","Показувати твою анкету іншим людям відповідного віку?")))return;
   busy=true;button.disabled=true;
   try{await api("/discover/card","PUT",{mode:"friends",active:true,bio:self.card.bio,gender:self.card.gender||"undisclosed",seeking:self.card.seeking||"everyone"});enabled=true;self.card.active=true;void load()}
   catch(err){message=err.message;render()}finally{busy=false}
   return;
  }
  if(action==="close-card"){editor=false;render();return}
  if(action==="view"){window.WrldProfile?.openPublic?.(button.dataset.username);return}
  if(!token()){location.hash="#profile";return}
  if(action==="publish-card"||action==="save-hidden"||action==="hide-card"){
   if(!self.age_ready){message=tr("Set your age in Profile first.","Спершу вкажи вік у профілі.");render();return}
   const publishing=action==="publish-card";
   if(publishing&&!confirm(tr("Publish this questionnaire to other opted-in people within your age range? Age is not verified.","Опублікувати анкету для інших учасників твого вікового діапазону? Вік не перевірено.")))return;
   busy=true;button.disabled=true;
   try{
    await api("/discover/card","PUT",{mode,active:publishing,bio:draft.bio,gender:draft.gender,seeking:draft.seeking});
    enabled=publishing;editor=false;void load();
   }catch(err){message=err.message;render()}finally{busy=false}
   return;
  }
  if(action==="remove-photo"){
   if(!confirm(tr("Remove this questionnaire photo?","Прибрати фото з анкети?")))return;
   busy=true;button.disabled=true;
   try{await api("/discover/photo?mode="+mode,"DELETE");const key=picKey(mode,self.user_id);if(photos.get(key))URL.revokeObjectURL?.(photos.get(key));photos.delete(key);self.card.has_photo=false;message=tr("Photo removed.","Фото прибрано.");render()}
   catch(err){message=err.message;render()}finally{busy=false}
   return;
  }
  if(action==="block"&&!confirm(tr("Block this account?","Заблокувати цей акаунт?")))return;
  if(action==="report"){
   const reason=prompt(tr("Describe the issue (10–300 characters)","Опиши проблему (10–300 символів)"));
   if(!reason)return;
   if(reason.trim().length<10||reason.trim().length>300){message=tr("Use 10–300 characters.","Використай 10–300 символів.");render();return}
   busy=true;button.disabled=true;
   try{await api("/discover/report","POST",{username:button.dataset.username,reason:reason.trim()});message=tr("Report sent.","Скаргу надіслано.");render()}
   catch(err){message=err.message;render()}finally{busy=false}
   return;
  }
  busy=true;button.disabled=true;
  try{
   if(action==="friend"){await api("/discover/request","POST",{target_id:button.dataset.id,mode});message=tr("Friend request sent!","Запит у друзі надіслано!");members=members.map(p=>p.id===button.dataset.id?{...p,already_friends:true}:p)}
   if(action==="block"){await api("/blocks","POST",{target_id:button.dataset.id});members=members.filter(p=>p.id!==button.dataset.id);message=tr("Account blocked.","Акаунт заблоковано.")}
  }catch(err){message=err.message}finally{busy=false;render()}
 });
 root.addEventListener("input",e=>{if(e.target?.id==="fd-bio")draft.bio=e.target.value});
 root.addEventListener("change",e=>{
  if(e.target?.id==="fd-gender")draft.gender=e.target.value;
  else if(e.target?.id==="fd-seeking")draft.seeking=e.target.value;
  else if(e.target?.id==="fd-photo")void upload(e.target.files?.[0]);
 });
 root.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="fd-query"){e.preventDefault();query=e.target.value.trim();void load()}});
 window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="discover")void load()});
 window.addEventListener("fw-auth-changed",()=>{if(active())void load()});
 window.addEventListener("wrld:language-change",()=>{if(active())render()});
 render();
}
