/* fleki's wrld interactive profile studio. All public visibility decisions are made by the Worker. */
(()=>{"use strict";
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const defaults={bio:"public",media:"public",location:"friends",phone:"private",links:"public",games:"public",status:"public",roles:"public",interests:"public",age:"private"};
const sections=[["overview","✦","Overview","Огляд"],["appearance","◈","Appearance","Оформлення"],["about","✎","About me","Про мене"],["interests","♡","Interests","Інтереси"],["contact","◎","Location & contact","Локація та контакти"],["games","▣","My games","Мої ігри"],["privacy","♧","Privacy","Приватність"],["security","♢","Security / Auth2FA","Захист / Auth2FA"],["preview","◉","View as others","Погляд зі сторони"]];
const labels={online:["Online","Онлайн"],away:["Away","Відійшов"],dnd:["Do not disturb","Не турбувати"],offline:["Offline","Офлайн"]};
const roles={owner:"Owner",aurvex_ceo:"AURVEX CEO",developer:"Developer",god:"God",moderator:"Moderator",creator:"Creator",vip:"VIP",tester:"Tester",member:"Member"};
const links=["telegram","discord","youtube","twitch","github","instagram","tiktok","steam"];
const keys=["bio","media","location","phone","links","games","status","roles","interests","age"];
const en=()=>document.documentElement.lang!=="uk";
const tr=(a,b)=>en()?a:b;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tok=()=>{try{return sessionStorage.getItem("fw-token")||""}catch{return ""}};
const fmt=n=>n&&n>0?new Date(n).toLocaleDateString():"∞";
function sniffImageMime(bytes){
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return "image/png";
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return "image/jpeg";
 if(bytes.length>=6&&/^GIF8[79]a$/.test(String.fromCharCode(...bytes.subarray(0,6))))return "image/gif";
 if(bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==="RIFF"&&String.fromCharCode(...bytes.subarray(8,12))==="WEBP")return "image/webp";
 return "";
}
const imageLimits={avatar:3*1024*1024,banner:3*1024*1024};
async function uploadMedia(kind,file){
 if(!data||!tok()||!file||!Object.prototype.hasOwnProperty.call(imageLimits,kind))return;
 const limit=imageLimits[kind];
 if(file.size>limit){note(tr("Image is too large: ","Зображення завелике: ")+(file.size/1048576).toFixed(2)+" MB · "+tr("limit ","ліміт ")+(limit/1048576).toFixed(2)+" MB");return}
 if(file.size<32){note(tr("File is empty or damaged.","Файл порожній або пошкоджений."));return}
 let temporary="";
 try{
  const raw=new Uint8Array(await file.arrayBuffer());
  const mime=sniffImageMime(raw);
  if(!mime){note(tr("Not a valid PNG, JPEG, GIF or WebP image.","Це не правильне зображення PNG, JPEG, GIF чи WebP."));return}
  temporary=URL.createObjectURL(new Blob([raw],{type:mime}));
  if(kind==="avatar"){if(avatarTemp.startsWith("blob:"))URL.revokeObjectURL(avatarTemp);avatarTemp=temporary}
  else{if(bannerTemp.startsWith("blob:"))URL.revokeObjectURL(bannerTemp);bannerTemp=temporary}
  liveUpdate();note(tr("Uploading image…","Завантажую зображення…"));
  // The real file signature, not its .gif filename or browser MIME, defines Content-Type.
  const result=await secure("/profiles/media/"+kind,{method:"POST",body:raw,headers:{"Content-Type":mime}});
  if(result.mime!==mime)throw Error(tr("Unexpected image format on server.","Неочікуваний формат зображення на сервері."));
  const url=await imageFor(data.id,kind);
  if(!url)throw Error(tr("Uploaded, but preview could not load. Refresh your profile.","Завантажено, але перегляд не відкрився. Онови профіль."));
  if(kind==="avatar"){if(avatar.startsWith("blob:"))URL.revokeObjectURL(avatar);avatar=url;avatarTemp=""}
  else{if(banner.startsWith("blob:"))URL.revokeObjectURL(banner);banner=url;bannerTemp=""}
  URL.revokeObjectURL(temporary);temporary="";liveUpdate();
  if(/\.gif$/i.test(file.name)&&mime!=="image/gif")note(tr("Image saved! This file is actually a PNG/JPG/WebP, not an animated GIF.","Зображення збережено! Файл насправді PNG/JPG/WebP, а не анімований GIF."));
  else note(tr("Image uploaded ✓","Зображення завантажено ✓"));
 }catch(e){
  if(kind==="avatar")avatarTemp="";else bannerTemp="";
  if(temporary)URL.revokeObjectURL(temporary);
  liveUpdate();note(e.message||tr("Upload failed.","Помилка завантаження."));
 }
}

let activeTab="overview",who="",data=null,draft=null,loading=false,err="",owner=false,mod=false,view="self",avatar="",banner="",avatarTemp="",bannerTemp="",people=[],query="",lastSecret=null,myHouse=null,accountToken="",loadRevision=0,publicProfile=null,publicLoading=false,publicError="";
const secure=async(path,opts={})=>{
 const token=tok();
 if(!token)throw Error(tr("Your sign-in session is missing. Please sign in again.","Відсутній сеанс входу. Увійди в акаунт знову."));
 const headers={Authorization:"Bearer "+token,...opts.headers};
 if(opts.body&&!(opts.body instanceof Uint8Array))headers["Content-Type"]="application/json";
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),opts.timeoutMs??16000);
 try{
  const response=await fetch(API+path,{...opts,headers,signal:controller.signal,cache:"no-store",body:opts.body instanceof Uint8Array?opts.body:opts.body?JSON.stringify(opts.body):undefined});
  const json=await response.json().catch(()=>({}));
  if(!response.ok){
   const error=new Error(response.status===401?tr("Session expired. Sign out and sign in again.","Сеанс завершився. Вийди з акаунта та увійди знову."):response.status>=500?tr("Profile server is temporarily unavailable. Please retry.","Сервер профілю тимчасово недоступний. Спробуй знову."):json.error||tr("Request failed.","Не вдалося виконати запит."));
   error.status=response.status;throw error;
  }
  return json;
 }catch(error){
  if(error.name==="AbortError")throw Error(tr("The server did not respond in time. Retry loading.","Сервер не відповів вчасно. Повтори завантаження."));
  if(error instanceof TypeError)throw Error(tr("Cannot reach the profile server. Check your connection and retry.","Не вдалося з'єднатися із сервером профілю. Перевір інтернет та спробуй ще раз."));
  throw error;
 }finally{clearTimeout(timeout)}
};
function note(text){err=text;const target=document.getElementById("wp-feedback");if(target)target.textContent=text}
function resetMedia(){for(const url of [avatar,banner,avatarTemp,bannerTemp])if(url?.startsWith("blob:"))URL.revokeObjectURL(url);avatar="";banner="";avatarTemp="";bannerTemp=""}
function blank(p){return {display_name:p.display_name||"",bio:p.bio||"",status:p.status||"online",country:p.country||"",region:p.region||"",district:p.district||"",phone:p.phone||"",website:p.website||"",socials:{...(p.socials||{})},favorite_games:[...(p.favorite_games||[])],current_games:[...(p.current_games||[])],age:p.age||"",interests:[...(p.interests||[])],status_emoji:p.status_emoji||"",status_text:p.status_text||"",accent:p.accent||"#9b73e4",card_style:p.card_style||"glow",discoverable:p.discoverable===true,visibility:{...defaults,...(p.visibility||{})}}}
async function imageFor(id,kind){try{const response=await fetch(API+"/profiles/media/"+encodeURIComponent(id)+"/"+kind,{headers:tok()?{Authorization:"Bearer "+tok()}: {},cache:"no-store"});if(!response.ok)return "";const blob=await response.blob();return URL.createObjectURL(blob)}catch{return ""}}
const refreshAccount=()=>window.dispatchEvent(new Event("wrld:profile-updated"));
async function load(userId){
 if(loading||!userId)return;
 const token=tok(),revision=++loadRevision;
 loading=true;err="";refreshAccount();
 try{
  // Profile is critical. House, avatar and banner are optional and must never block it.
  const result=await secure("/profiles/me",{timeoutMs:14000});
  if(revision!==loadRevision||userId!==who||token!==tok())return;
  if(!result.profile||result.profile.id!==userId)throw Error(tr("Profile data is incomplete. Please retry.","Неповні дані профілю. Спробуй знову."));
  data=result.profile;draft=blank(data);owner=result.owner===true;mod=result.moderator===true;
  publicProfile=null;publicLoading=false;publicError="";resetMedia();
  loading=false;refreshAccount();
  void loadPublic(userId,revision,token);
  // Fetch nonessential sections after the profile is already visible.
  void Promise.resolve().then(h=>{
   if(revision!==loadRevision||userId!==who||token!==tok())return;
   refreshAccount();
  }).catch(()=>{ /* house failure must not block profile */ });
  void Promise.all([imageFor(userId,"avatar"),imageFor(userId,"banner")]).then(([a,b])=>{
   if(revision!==loadRevision||userId!==who||token!==tok()){
    for(const url of [a,b])if(url?.startsWith("blob:"))URL.revokeObjectURL(url);
    return;
   }
   resetMedia();avatar=a;banner=b;refreshAccount();
  }).catch(()=>{ /* images are optional */ });
 }catch(e){
  if(revision===loadRevision&&userId===who&&token===tok()){data=null;draft=null;err=e.message||tr("Failed to load profile.","Не вдалося завантажити профіль.")}
 }finally{
  if(revision===loadRevision){loading=false;refreshAccount()}
 }
}
async function loadPublic(userId,revision=loadRevision,token=tok()){
 if(!userId||!token)return;
 publicProfile=null;publicError="";publicLoading=true;refreshAccount();
 try{
  const result=await secure("/profiles/preview?as=public",{timeoutMs:14000});
  if(revision!==loadRevision||who!==userId||tok()!==token)return;
  if(!result.profile||result.profile.id!==userId)throw Error(tr("Public profile unavailable.","Публічний профіль недоступний."));
  publicProfile=result.profile;
 }catch(error){
  if(revision===loadRevision&&who===userId&&tok()===token)publicError=error.message||tr("Could not load public profile.","Не вдалося завантажити публічний профіль.");
 }finally{
  if(revision===loadRevision&&who===userId&&tok()===token){publicLoading=false;refreshAccount()}
 }
}
function langStatus(s){return (labels[s]||labels.offline)[en()?0:1]}
function statusMarkup(s,emoji="",custom=""){const x=s||"offline";return '<span class="wp-status '+esc(x)+'"><i></i>'+esc(emoji?emoji+" ":"")+esc(custom||langStatus(x))+'</span>'}
function roleMarkup(a){return (a||[]).map(r=>'<span class="wp-role" data-role="'+esc(r.role)+'">'+esc(roles[r.role]||r.role)+'</span>').join("")}
function imageBox(url,alt,fallback,classname){return url?'<img class="'+classname+'" src="'+esc(url)+'" alt="'+esc(alt)+'">':'<div class="'+classname+' wp-image-fallback">'+fallback+'</div>'}
function card(p,opts={}){
 const n=p.display_name||p.username||"Member",social=p.socials||{};
 const location=[p.country,p.region,p.district].filter(Boolean).map(esc).join(" · ");
 const showUrl=u=>{try{const url=new URL(u);return url.protocol==="https:"?'<a href="'+esc(url.href)+'" target="_blank" rel="noopener noreferrer">'+esc(url.hostname)+'</a>':""}catch{return ""}};
 const urls=[p.website&&showUrl(p.website),...links.filter(k=>social[k]).map(k=>showUrl(social[k]))].filter(Boolean);
 const fav=p.favorite_games||[],playing=p.current_games||[];
 const gameCard=x=>window.WrldGamePicker?.miniCard?.(x)||"<span>"+esc(x)+"</span>";
 const accent=/^#[0-9a-f]{6}$/i.test(p.accent||"")?p.accent:"#9b73e4";
  const style=["glow","glass","minimal","sunset"].includes(p.card_style)?p.card_style:"glow";
  return '<div class="wp-card wp-card-'+style+'" style="--wp-custom-accent:'+accent+'">'+
 '<div class="wp-card-banner">'+imageBox(opts.banner??(bannerTemp||banner),"Profile banner","✦","wp-banner-image")+'</div>'+
 '<div class="wp-card-meta">'+imageBox(opts.avatar??(avatarTemp||avatar),"Avatar",esc((n||"?").slice(0,1).toUpperCase()),"wp-avatar-image")+
 '<div class="wp-card-name"><h3>'+esc(n)+'</h3>'+(!/^fmail_[a-z0-9]+$/i.test(String(p.username||""))?'<span>@'+esc(p.username||data?.username||"member")+'</span>':'')+'</div>'+statusMarkup(p.status,p.status_emoji,p.status_text)+'</div>'+
 '<div class="wp-badges">'+roleMarkup(p.roles)+'<span class="wp-role wp-level">★ '+Number(p.level||1)+' · '+Number(p.xp||0)+' XP</span></div>'+
 (p.bio?'<p class="wp-card-bio">'+esc(p.bio)+'</p>':"")+
  (p.age?'<p class="wp-card-detail">🎂 '+tr("Age","Вік")+': '+Number(p.age)+'</p>':"")+
  (p.interests?.length?'<div class="wp-interest-tags">'+p.interests.map(x=>'<span>'+esc(window.WrldInterests?.label?.(x)||x)+'</span>').join("")+'</div>':"")+
 (location?'<p class="wp-card-detail">⌖ '+location+'</p>':"")+
 (p.phone?'<p class="wp-card-detail">☎ '+esc(p.phone)+'</p>':"")+
 (urls.length?'<div class="wp-links">'+urls.join("")+'</div>':"")+
 (fav.length?'<div class="wp-games-text"><strong>'+tr("Favorite games","Улюблені ігри")+'</strong><div>'+fav.map(gameCard).join("")+'</div></div>':"")+
 (playing.length?'<div class="wp-games-text"><strong>'+tr("Currently playing","Зараз граю")+'</strong><div>'+playing.map(gameCard).join("")+'</div></div>':"")+
 '</div>';
}
const fld=(label,name,value,type="text",max=120)=>'<label class="wp-field"><span>'+label+'</span><input class="social-input" data-wp-field="'+name+'" type="'+type+'" maxlength="'+max+'" value="'+esc(value||"")+'"></label>';
const textarea=(label,name,value,max=350)=>'<label class="wp-field"><span>'+label+'</span><textarea class="social-textarea" data-wp-field="'+name+'" maxlength="'+max+'">'+esc(value||"")+'</textarea></label>';
const save=()=>'<button type="button" class="btn primary" data-wp="save">'+tr("Save changes","Зберегти зміни")+'</button>';
function progressPanel(profile){
 const level=Math.max(1,Number(profile?.level||1)),xp=Math.max(0,Number(profile?.xp||0));
 const start=60*(level-1)*(level-1),next=60*level*level,percent=Math.max(0,Math.min(100,Math.round(100*(xp-start)/(next-start))));
 return '<div class="wp-level-progress"><div class="wp-progress-heading"><strong>★ '+tr("Level","Рівень")+' '+level+'</strong><span>'+xp+' XP</span></div>'+
 '<div class="wp-progress-track" role="progressbar" aria-label="'+tr("XP to next level","XP до наступного рівня")+'" aria-valuenow="'+(xp-start)+'" aria-valuemin="0" aria-valuemax="'+(next-start)+'"><span style="width:'+percent+'%"></span></div>'+
 '<small>'+tr("Next level at ","Наступний рівень із ")+next+' XP · '+tr("Complete quests in World → Progress","Виконуй квести у Світ → Прогрес")+'</small></div>';
}
function content(state){
 const p=draft||blank(state.user),v=p.visibility;
 if(activeTab==="overview")return '<h2>'+tr("Your profile","Твій профіль")+'</h2><p>'+tr("Customize your world, choose what to share and see changes instantly.","Налаштуй свій профіль, обери, що показувати іншим, і переглядай зміни одразу.")+'</p>'+progressPanel(data)+'<div class="wp-section-cards">'+sections.filter(s=>!["overview","preview"].includes(s[0])).map(s=>'<button type="button" data-wp="tab" data-id="'+s[0]+'"><strong>'+s[1]+' '+(en()?s[2]:s[3])+'</strong><span>↗</span></button>').join("")+'</div>';
 if(activeTab==="appearance")return '<h2>✦ '+tr("Style your profile","Створи свій стиль")+'</h2><p>'+tr("Choose your colors, profile card design, photos and animated banner. Your look is visible to other users.","Обирай кольори, стиль картки, фото й анімований банер. Твій стиль бачитимуть інші.")+'</p>'+
 '<h3>'+tr("Profile accent","Акцент профілю")+'</h3><div class="wp-palette">'+["#9b73e4","#67a8df","#eb8bb4","#5ccfaa","#f1b75f","#ec786e","#b8bed2","#976ded"].map(color=>'<button type="button" class="wp-swatch '+(p.accent===color?"selected":"")+'" data-wp="accent" data-color="'+color+'" style="background:'+color+'" aria-label="'+color+'"></button>').join("")+'</div>'+
 '<label class="wp-field"><span>'+tr("Custom accent color","Власний колір")+'</span><input type="color" data-wp-field="accent" value="'+esc(p.accent)+'"></label>'+
 '<label class="wp-field"><span>'+tr("Card style","Стиль картки")+'</span><select class="social-input" data-wp-field="card_style">'+[["glow",tr("Glow / Gradient","Сяйво / Градієнт")],["glass",tr("Glass / Frosted","Скло / Прозорість")],["minimal",tr("Minimal / Clean","Мінімалізм")],["sunset",tr("Sunset / Warm","Захід сонця")]].map(([v,label])=>'<option value="'+v+'" '+(p.card_style===v?"selected":"")+'>'+label+'</option>').join("")+'</select></label>'+
 '<div class="wp-upload-list">'+["avatar","banner"].map(kind=>'<div class="wp-upload"><strong>'+(kind==="avatar"?tr("Profile photo","Фото профілю"):tr("Animated banner","Анімований банер"))+'</strong><small>3 MB max</small><label class="btn"><input hidden type="file" data-wp-upload="'+kind+'" accept=".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/webp,image/gif">'+tr("Choose image / GIF","Вибрати фото / GIF")+'</label><button class="btn" data-wp="remove-media" data-kind="'+kind+'">'+tr("Remove","Прибрати")+'</button></div>').join("")+'</div>'+save();
 if(activeTab==="about")return '<h2>'+tr("About me","Про мене")+'</h2>'+
 fld(tr("Display name","Ім’я профілю"),"display_name",p.display_name,"text",60)+
 textarea(tr("Description","Опис"),"bio",p.bio,350)+
 '<label class="wp-field"><span>'+tr("Presence","Присутність")+'</span><select class="social-input" data-wp-field="status">'+["online","away","dnd","offline"].map(k=>'<option value="'+k+'" '+(p.status===k?"selected":"")+'>'+langStatus(k)+'</option>').join("")+'</select></label>'+
 fld(tr("Status emoji","Емодзі статусу"),"status_emoji",p.status_emoji,"text",16)+
 fld(tr("Personal status","Мій текстовий статус"),"status_text",p.status_text,"text",80)+
 fld(tr("Age (private)","Вік (приватний)"),"age",p.age,"number",3)+
 '<p class="wp-hint">'+tr("Enter 13–120. Your exact age is not shown in friend discovery.","Вкажи 13–120. Точний вік не показується в пошуку друзів.")+'</p>'+
 '<div class="wp-interest-shortcut"><div><strong>♡ '+tr("Your interests","Твої інтереси")+'</strong><small>'+tr("Choose your interests from a searchable catalogue.","Обери захоплення зі зручного каталогу з пошуком.")+'</small></div><button type="button" class="btn" data-wp="open-interests">'+tr("Choose interests","Обрати інтереси")+' ↗</button></div>'+
 '<label class="wp-discovery-opt"><input type="checkbox" data-wp-boolean="discoverable" '+(p.discoverable?"checked":"")+'><span>'+tr("Let people in my age group find me as a friend","Дозволити людям моєї вікової групи знаходити мене як друга")+'</span></label>'+
 '<p class="wp-hint">'+tr("Optional. Adult/teen searches are separated. Ages are self-reported.","Необов’язково. Пошук дорослих і підлітків розділений. Вік вказують самостійно.")+'</p>'+save();
 if(activeTab==="interests")return '<h2>♡ '+tr("Your interests","Твої інтереси")+'</h2><p>'+tr("Games, anime, coding, music and more — choose what you enjoy.","Ігри, аніме, програмування, музика та багато іншого — обери те, що любиш.")+'</p>'+(window.WrldInterests?.render(p.interests)||textarea(tr("Interests (up to 12)","Інтереси (до 12)"),"interests",p.interests.join("\n"),450))+save();
 if(activeTab==="contact")return '<h2>'+tr("Location & contact","Локація та контакти")+'</h2><p>'+tr("All fields are optional. Never publish an address or a phone number unless you want to.","Усі поля необов'язкові. Не публікуй адресу чи телефон, якщо цього не хочеш.")+'</p>'+fld(tr("Country","Країна"),"country",p.country,"text",60)+fld(tr("State / Oblast / Region","Штат / Область / Регіон"),"region",p.region,"text",80)+fld(tr("District","Район"),"district",p.district,"text",80)+fld(tr("Phone number (optional)","Номер телефону (необов'язково)"),"phone",p.phone,"tel",30)+fld(tr("Website (HTTPS)","Сайт (HTTPS)"),"website",p.website,"url",220)+'<h3>'+tr("Social media links","Посилання на соцмережі")+'</h3>'+links.map(k=>fld(k.charAt(0).toUpperCase()+k.slice(1)+" (https://)","social:"+k,p.socials[k],"url",220)).join("")+save();
 if(activeTab==="games")return '<h2>'+tr("My games","Мої ігри")+'</h2><p>'+tr("Find games across PC stores, Epic, consoles and mobile. Add any missing game by its name. Up to 10 in each list.","Шукай ігри для ПК, Epic, консолей і телефонів. Відсутню гру можна додати за назвою. До 10 у кожному списку.")+'</p>'+
 (window.WrldGamePicker?.render(p)||textarea(tr("Favorite games","Улюблені ігри"),"favorite_games",p.favorite_games.join("\n"),570)+textarea(tr("Currently playing","Зараз граю"),"current_games",p.current_games.join("\n"),570))+save();
 if(activeTab==="privacy")return '<h2>'+tr("Who can see my profile?","Хто бачить мій профіль?")+'</h2><p>'+tr("Server-enforced permissions. Your phone is private by default.","Доступ перевіряється сервером. Телефон початково прихований.")+'</p><div class="wp-privacy">'+keys.map(k=>'<label class="wp-field"><span>'+({bio:tr("Description","Опис"),media:tr("Avatar & banner","Аватар і банер"),location:tr("Country, region & district","Країна, область і район"),phone:tr("Phone number","Номер телефону"),links:tr("Website & social links","Сайт і соцмережі"),games:tr("Favorite & current games","Улюблені й актуальні ігри"),status:tr("Status & presence","Статус і присутність"),roles:tr("Roles","Ролі"),interests:tr("Interests","Інтереси"),age:tr("Age","Вік")})[k]+'</span><select class="social-input" data-wp-privacy="'+k+'">'+[["public",tr("Everyone","Усі")],["friends",tr("Friends only","Лише друзі")],["private",tr("Only me","Тільки я")]].map(([x,y])=>'<option value="'+x+'" '+(v[k]===x?"selected":"")+'>'+y+'</option>').join("")+'</select></label>').join("")+'</div>'+save();
 if(activeTab==="security")return security(state);
 if(activeTab==="preview")return '<h2>'+tr("View profile as others","Перегляд очима інших")+'</h2><p>'+tr("The server filters every field for the selected audience; your private phone and hidden sections will never be included.","Сервер приховає всі поля, не дозволені вибраній аудиторії.")+'</p><div class="wp-actions"><button class="btn primary" data-wp="preview" data-mode="public">'+tr("View as visitor","Очима гостя")+'</button><button class="btn" data-wp="preview" data-mode="friend">'+tr("View as friend","Очима друга")+'</button></div>';
 if(activeTab==="moderation")return moderation();
 return "";
}
function security(state){
 let content="";
 const s=state.secret;
 if(s){
  let qr="";try{if(window.qrcode&&s.uri){const q=window.qrcode(0,"M");q.addData(s.uri);q.make();qr=q.createSvgTag({cellSize:5,margin:16})}}catch{}
  content='<h3>'+tr("Connect Auth2FA","Підключити Auth2FA")+'</h3><p>'+tr("Scan this private QR with Auth2FA or any compatible mobile authenticator, then enter the current six-digit code.","Відскануй приватний QR-код через Auth2FA чи інший сумісний автентифікатор, потім введи 6-значний код.")+'</p>'+(qr?'<div class="wp-qr" role="img" aria-label="Private 2FA enrollment QR">'+qr+'</div>':'<p>'+tr("QR generator unavailable. Use the key below.","QR-генератор недоступний. Використай ключ нижче.")+'</p>')+'<div class="social-mfa-secret">'+esc(s.secret)+'</div><div class="wp-actions"><button class="btn" data-action="copy">'+tr("Copy key","Копіювати ключ")+'</button><button class="btn" data-action="copyuri">'+tr("Copy Auth2FA link","Копіювати посилання")+'</button></div><form id="fw-activate" class="social-form"><label>'+tr("6-digit code","6-значний код")+'<input class="social-input" name="code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" autocomplete="one-time-code" required></label><button class="btn primary" type="submit">'+tr("Verify and enable 2FA","Підтвердити й увімкнути 2FA")+'</button></form><p class="wp-warning">'+tr("Never share your QR, setup key or recovery codes.","Нікому не показуй QR, секретний ключ чи резервні коди.")+'</p>';
 }else if(!state.user.mfa_enabled)content='<p>'+tr("For messages and friends, enable Auth2FA. It is optional for profile editing and Web Games.","Для повідомлень і друзів потрібна Auth2FA. Для профілю та Web Games — необов'язкова.")+'</p><button class="btn primary" data-action="enroll">'+tr("Set up authenticator","Налаштувати автентифікатор")+'</button>';
 else if(!state.verified)content='<form class="social-form" id="fw-verify"><label>'+tr("Authenticator or recovery code","Код автентифікатора або відновлення")+'<input name="code" class="social-input" required maxlength="20"></label><button class="btn primary" type="submit">'+tr("Verify 2FA","Підтвердити 2FA")+'</button></form>';
 else content='<p>✓ '+tr("Two-factor authentication is verified.","Двофакторну автентифікацію підтверджено.")+'</p>'+(state.user.mfa_provider==="fmail"?"":'<button class="btn" data-action="enroll">'+tr("Replace authenticator","Замінити автентифікатор")+'</button>');
 return '<h2>'+tr("Account security","Безпека акаунта")+'</h2>'+content+
 (state.recovery?'<div class="social-message warn"><strong>'+tr("Save your one-time recovery codes","Збережи резервні коди")+'</strong><div class="social-mfa-secret">'+state.recovery.map(esc).join("<hr>")+'</div><button class="btn" data-action="saved">'+tr("I saved them","Я зберіг")+'</button></div>':"")+
 '<div class="wp-actions"><a class="btn" href="/auth2fa/" target="_blank" rel="noopener noreferrer">'+tr("Get Auth2FA","Завантажити Auth2FA")+' ↗</a><button class="btn" data-action="logout">'+tr("Log out","Вийти")+'</button></div>';
}
function moderation(){
 return '<h2>'+tr("Member moderation","Керування учасниками")+'</h2><p>'+tr("Roles and bans are enforced by the server. Only the verified site owner can grant roles.","Ролі й блокування застосовує сервер. Видавати ролі може лише підтверджений власник.")+'</p><div class="wp-search"><input class="social-input" id="wp-admin-query" placeholder="'+tr("Search username","Пошук логіна")+'" value="'+esc(query)+'"><button class="btn primary" data-wp="admin-search">'+tr("Find","Знайти")+'</button></div><div class="wp-results">'+people.map(p=>{
 const existing=(p.roles||[]).map(r=>'<span class="wp-role">'+esc(roles[r.role]||r.role)+' '+(r.expires_at?fmt(r.expires_at):"∞")+'</span>'+(owner&&r.role!=="owner"?'<button class="social-mini" data-wp="remove-role" data-id="'+esc(p.id)+'" data-role="'+esc(r.role)+'">×</button>':"")).join("");
 return '<div class="wp-person" data-member="'+esc(p.id)+'"><div><strong>@'+esc(p.username)+'</strong><small>'+esc(p.display_name)+'</small></div><div class="wp-badges">'+existing+'</div>'+(owner?'<div class="wp-actions"><select class="social-input wp-role-select">'+Object.keys(roles).filter(x=>x!=="owner").map(x=>'<option value="'+x+'">'+roles[x]+'</option>').join("")+'</select><select class="social-input wp-role-duration">'+durations()+'</select><button class="btn" data-wp="grant-role" data-id="'+esc(p.id)+'">'+tr("Grant role","Видати роль")+'</button></div>':"")+'<div class="wp-actions"><input class="social-input wp-ban-reason" placeholder="'+tr("Ban reason (required)","Причина бану (обов'язково)")+'" maxlength="200"><select class="social-input wp-ban-duration">'+durations()+'</select><button class="btn" data-wp="ban" data-id="'+esc(p.id)+'">'+tr("Ban","Забанити")+'</button>'+(p.banned?'<button class="btn" data-wp="unban" data-id="'+esc(p.id)+'">'+tr("Unban","Розбанити")+'</button>':"")+'</div></div>';
 }).join("")+'</div>';
}
function durations(){return [[0,tr("Forever","Назавжди")],[1,tr("1 day","1 день")],[7,tr("7 days","7 днів")],[30,tr("30 days","30 днів")],[90,tr("90 days","90 днів")],[365,tr("1 year","1 рік")]].map(([days,label])=>'<option value="'+days+'">'+label+'</option>').join("")}
function side(state){
 const list=[...sections,...(mod?[["moderation","⚑","Moderation","Модерація"]]:[])];
 return '<aside class="wp-rail"><div class="wp-rail-title">'+tr("PROFILE SETTINGS","НАЛАШТУВАННЯ ПРОФІЛЮ")+'</div>'+list.map(([key,icon,english,ukrainian])=>'<button class="'+(activeTab===key?"active":"")+'" data-wp="tab" data-id="'+key+'"><span>'+icon+'</span>'+(en()?english:ukrainian)+'</button>').join("")+'</aside>';
}
function previewPanel(state){
 const draftProfile={...data,...draft,username:data.username,roles:data.roles};
 return '<aside class="wp-preview-col"><div class="wp-preview-title"><span class="overline">LIVE PROFILE PREVIEW</span><button class="social-mini" data-wp="preview" data-mode="public">'+tr("Public view ↗","Публічний вигляд ↗")+'</button></div><div id="wp-live-card">'+card(draftProfile)+'</div>'+'<small>'+tr("Preview updates as you edit. Click Save to publish.","Попередній перегляд змінюється одразу. Натисни Зберегти, щоб опублікувати.")+'</small></aside>';
}
function publicAccount(){
 const p=publicProfile;
 const top='<header class="wp-published-head"><div><span class="overline">'+tr("MY SPACE · PUBLIC PROFILE","МІЙ ПРОСТІР · ПУБЛІЧНИЙ ПРОФІЛЬ")+'</span><h2>'+tr("Your profile","Твій профіль")+'</h2><p>'+tr("This is your profile as visitors see it.","Саме так твій профіль бачать відвідувачі.")+'</p></div><div class="wp-published-actions"><button type="button" class="btn primary" data-wp="open-editor">✎ '+tr("Customize profile","Налаштувати профіль")+'</button><button type="button" class="btn" data-wp="preview" data-mode="public">◉ '+tr("View as visitor","Побачити збоку")+'</button><button type="button" class="btn" data-wp="open-security">♢ '+tr("Security","Безпека")+'</button></div></header>';
 const stage=publicProfile?card(p,{avatar:p.avatar?avatar:"",banner:p.banner?banner:""}):publicError?
 '<div class="wp-public-failure" role="alert"><strong>'+tr("Public view unavailable","Публічний вигляд недоступний")+'</strong><p>'+esc(publicError)+'</p><button type="button" class="btn" data-wp="retry-public">↻ '+tr("Retry","Повторити")+'</button></div>':
 '<div class="wp-loading" role="status">'+tr("Loading public profile…","Завантажуємо публічний профіль…")+'</div>';
 const sidebar='<aside class="wp-published-aside"><div class="wp-published-tip"><span class="wp-published-symbol">✦</span><strong>'+tr("Your space. Your rules.","Твій простір. Твої правила.")+'</strong><p>'+tr("Only information visible to everyone appears here. Adjust what you share whenever you like.","Тут лише те, що відкрито для всіх. Ти сам обираєш, чим ділитися.")+'</p><button type="button" class="wp-published-link" data-wp="edit-privacy">♧ '+tr("Privacy settings","Налаштування приватності")+' ↗</button></div><div class="wp-published-tip"><strong>'+tr("Make your profile yours","Зроби профіль своїм")+'</strong><p>'+tr("Change your photo, banner, colors, bio and games in the editor.","Змінюй фото, банер, кольори, опис та ігри в редакторі.")+'</p><button type="button" class="wp-published-link" data-wp="open-interests">♡ '+tr("Choose interests","Обрати інтереси")+' ↗</button><button type="button" class="wp-published-link" data-wp="open-editor">✎ '+tr("Edit appearance","Редагувати оформлення")+' ↗</button></div>'+(p?'<div class="wp-published-tip"><strong>'+tr("Your progress","Твій прогрес")+'</strong>'+progressPanel(p)+'</div>':'')+'</aside>';
 return '<div class="wp-published wp-shell">'+top+'<div class="wp-published-grid"><section class="wp-published-profile" aria-label="'+tr("Public profile","Публічний профіль")+'">'+stage+'</section>'+sidebar+'</div><p class="wp-feedback" id="wp-feedback" role="status">'+esc(err)+'</p></div>';
}
function studioAccount(state){
 return '<div class="wp-studio-layout"><div class="wp-studio-heading"><div><span class="overline">'+tr("PROFILE STUDIO","РЕДАКТОР ПРОФІЛЮ")+'</span><h2>'+tr("Customize profile","Налаштування профілю")+'</h2></div><button type="button" class="btn" data-wp="back-public">← '+tr("Back to profile","До профілю")+'</button></div><div class="wp-shell">'+side(state)+'<div class="wp-editor"><div class="wp-editor-inner">'+content(state)+'<p class="wp-feedback" id="wp-feedback" role="status">'+esc(err)+'</p></div></div>'+previewPanel(state)+'</div></div>';
}
function renderAccount(state){
 if(!state?.user)return null;
 const userId=state.user.id,session=tok();
 if(!userId||!session)return '<div class="wp-load-error" role="alert"><strong>'+tr("Sign-in session unavailable","Сеанс входу недоступний")+'</strong><p>'+tr("Sign out and sign in again to restore profile access.","Вийди з акаунта та увійди знову, щоб відновити доступ до профілю.")+'</p></div>';
 if(who!==userId||accountToken!==session){
  ++loadRevision;loading=false;who=userId;accountToken=session;data=null;draft=null;err="";owner=false;mod=false;activeTab="overview";view="public";publicProfile=null;publicError="";publicLoading=false;resetMedia();void load(userId);
 }
 if(!data){
  if(!loading&&err)return '<div class="wp-load-error" role="alert"><strong>'+tr("Couldn't load your profile","Не вдалося завантажити профіль")+'</strong><p>'+esc(err)+'</p><button type="button" class="btn primary" data-wp="retry-profile">'+tr("↻ Retry loading profile","↻ Завантажити профіль знову")+'</button></div>';
  return '<div class="wp-loading" role="status">'+tr("Loading your profile settings…","Завантажуємо налаштування профілю…")+'</div>';
 }
 if(!draft)draft=blank(data);
 return view==="studio"?studioAccount(state):publicAccount();
}
const liveUpdate=()=>{const p=document.getElementById("wp-live-card");if(p&&data&&draft)p.innerHTML=card({...data,...draft,username:data.username,roles:data.roles})};
async function saveData(){
 if(!data||!draft)return;
 const payload={...draft,visibility:{...draft.visibility}};
 if(payload.favorite_games.length>10||payload.current_games.length>10)throw Error("Max 10 games per list");
 await secure("/profiles/me",{method:"PUT",body:payload});
 const result=await secure("/profiles/me");data=result.profile;draft=blank(data);publicProfile=null;void loadPublic(data.id);note(tr("Profile saved ✓","Профіль збережено ✓"));window.dispatchEvent(new Event("wrld:profile-updated"));window.dispatchEvent(new Event("fw-auth-changed"));
}
function modal(profile,a,b,house){
 document.getElementById("wp-public-modal")?.remove();
 const el=document.createElement("div");el.id="wp-public-modal";el.className="wp-modal";
 el.innerHTML='<div class="wp-modal-sheet" role="dialog" aria-modal="true" aria-label="Public profile"><div class="wp-modal-top"><strong>'+tr("Profile preview","Перегляд профілю")+'</strong><button class="btn" data-wp="close-modal">✕</button></div>'+card(profile,{avatar:a||"",banner:b||""})+'</div>';
 document.body.append(el);
}
async function showProfile(username,mode){
 try{
 const path=mode?"/profiles/preview?as="+encodeURIComponent(mode):"/profiles/public/"+encodeURIComponent(username);
 const result=await secure(path);
 const profile=result.profile;
 const [a,b]=await Promise.all([profile.avatar?imageFor(profile.id,"avatar"):"",profile.banner?imageFor(profile.id,"banner"):""]);
 modal(profile,a,b,null);
 }catch(e){note(e.message)}
}
function days(v){const n=Number(v);return n===0?0:Date.now()+n*86400000}
async function adminDo(action,button){
 const id=button.dataset.id,box=button.closest("[data-member]");
 if(!box)return;
 if(action==="grant-role"){
  await secure("/admin/roles",{method:"POST",body:{user_id:id,role:box.querySelector(".wp-role-select").value,expires_at:days(box.querySelector(".wp-role-duration").value)}});
 }else if(action==="remove-role"){
  if(!confirm(tr("Remove this role?","Забрати роль?")))return;
  await secure("/admin/roles",{method:"DELETE",body:{user_id:id,role:button.dataset.role}});
 }else if(action==="ban"){
  const reason=box.querySelector(".wp-ban-reason").value.trim();
  if(reason.length<3)throw Error("Ban reason must have at least 3 characters");
  if(!confirm(tr("Ban this account and end all sessions?","Забанити акаунт і завершити всі сесії?")))return;
  await secure("/admin/bans",{method:"POST",body:{user_id:id,reason,expires_at:days(box.querySelector(".wp-ban-duration").value)}});
 }else if(action==="unban"){
  await secure("/admin/bans",{method:"DELETE",body:{user_id:id}});
 }
 await searchUsers();note(tr("Moderation action saved ✓","Зміни збережено ✓"));
}
async function searchUsers(){if(query.trim().length<2){people=[];window.dispatchEvent(new Event("wrld:profile-updated"));return}const result=await secure("/admin/members?q="+encodeURIComponent(query.trim()));people=result.members||[];window.dispatchEvent(new Event("wrld:profile-updated"))}
document.addEventListener("click",async e=>{
 const target=e.target.closest("[data-wp]");if(!target)return;
 e.preventDefault();const a=target.dataset.wp;
 try{
 if(a==="open-editor"){view="studio";activeTab="overview";refreshAccount();return}
  if(a==="open-security"){view="studio";activeTab="security";refreshAccount();return}
  if(a==="edit-privacy"){view="studio";activeTab="privacy";refreshAccount();return}
  if(a==="open-interests"){view="studio";activeTab="interests";refreshAccount();return}
  if(a==="back-public"){view="public";refreshAccount();return}
  if(a==="retry-public"){if(!publicLoading&&who)void loadPublic(who);return}
  if(a==="accent"){if(draft&&/^#[0-9a-f]{6}$/i.test(target.dataset.color)){draft.accent=target.dataset.color;liveUpdate();window.dispatchEvent(new Event("wrld:profile-updated"))}return}
  if(a==="retry-profile"){if(!loading&&who){err="";void load(who)}return}
  if(a==="tab"){activeTab=target.dataset.id;window.dispatchEvent(new Event("wrld:profile-updated"));return}
  if(a==="close-modal"){document.getElementById("wp-public-modal")?.remove();return}
 if(a==="inspect"){await showProfile(target.dataset.username);return}
 if(a==="preview"){await showProfile(null,target.dataset.mode);return}
 if(a==="save"){await saveData();return}
 if(a==="admin-search"){query=document.getElementById("wp-admin-query")?.value||"";await searchUsers();return}
 if(["grant-role","remove-role","ban","unban"].includes(a)){await adminDo(a,target);return}
 if(a==="remove-media"){
  if(!confirm(tr("Remove this image?","Прибрати це зображення?")))return;
  const kind=target.dataset.kind;await secure("/profiles/media/"+kind,{method:"DELETE"});
  if(kind==="avatar"){if(avatar.startsWith("blob:"))URL.revokeObjectURL(avatar);avatar=""}else{if(banner.startsWith("blob:"))URL.revokeObjectURL(banner);banner=""}
  liveUpdate();note(tr("Image removed","Зображення видалено"));return;
 }
 }catch(ex){note(ex.message)}
});
document.addEventListener("change",async e=>{
 const input=e.target;
 if(input.matches("[data-wp-upload]")){
   const kind=input.dataset.wpUpload,file=input.files?.[0];if(!file)return;
   input.value="";
   await uploadMedia(kind,file);
   return;
  }
  if(input.dataset.wpPrivacy&&draft){draft.visibility[input.dataset.wpPrivacy]=input.value;liveUpdate()}
 if(input.dataset.wpField&&draft){updateField(input)}
  if(input.dataset.wpBoolean&&draft){draft[input.dataset.wpBoolean]=input.checked;liveUpdate()}
});
function updateField(input){
 const key=input.dataset.wpField;
 if(key.startsWith("social:"))draft.socials[key.slice(7)]=input.value;
 else if(["favorite_games","current_games","interests"].includes(key))draft[key]=input.value.split(/[\n,]/).map(s=>s.trim()).filter(Boolean).slice(0,12);
 else draft[key]=input.value;
 liveUpdate();
}
document.addEventListener("input",e=>{if(e.target.matches("[data-wp-field]")&&draft)updateField(e.target)});
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.getElementById("wp-public-modal")?.remove()});
window.addEventListener("wrld:language-change",()=>{if(data)window.dispatchEvent(new Event("wrld:profile-updated"))});
 window.addEventListener("wrld:profile-game-change",e=>{if(!draft||!["favorite_games","current_games"].includes(e.detail?.kind))return;draft[e.detail.kind]=e.detail.games.slice(0,10);liveUpdate()});
 window.addEventListener("wrld:profile-interest-change",e=>{if(!draft||!Array.isArray(e.detail?.interests))return;draft.interests=e.detail.interests.slice(0,12);liveUpdate()});
window.addEventListener("fw-auth-changed",()=>{if(!tok()){++loadRevision;who="";accountToken="";loading=false;err="";data=null;draft=null;myHouse=null;publicProfile=null;publicError="";publicLoading=false;view="public";resetMedia()}});

const countrySuggestions=["Ukraine","United States","United Kingdom","Poland","Germany","France","Italy","Spain","Canada","Australia","Austria","Belgium","Czechia","Denmark","Estonia","Finland","Georgia","Greece","Hungary","Ireland","Israel","Japan","Latvia","Lithuania","Netherlands","Norway","Portugal","Romania","Slovakia","Sweden","Switzerland","Türkiye","Moldova","Bulgaria","Croatia","Slovenia","India","Brazil","South Korea"];
const regionSuggestions=["Ivano-Frankivsk Oblast","Kyiv Oblast","Kyiv","Lviv Oblast","Volyn Oblast","Rivne Oblast","Ternopil Oblast","Khmelnytskyi Oblast","Vinnytsia Oblast","Zakarpattia Oblast","Chernivtsi Oblast","Zhytomyr Oblast","Chernihiv Oblast","Sumy Oblast","Poltava Oblast","Kharkiv Oblast","Dnipropetrovsk Oblast","Odesa Oblast","Mykolaiv Oblast","Kherson Oblast","Kirovohrad Oblast","Cherkasy Oblast","California","Texas","Florida","New York","Washington"];
document.addEventListener("focusin",event=>{const field=event.target?.dataset?.wpField;if(!["country","region"].includes(field))return;const id="wp-"+field+"-suggestions";let list=document.getElementById(id);if(!list){list=document.createElement("datalist");list.id=id;for(const name of (field==="country"?countrySuggestions:regionSuggestions)){const opt=document.createElement("option");opt.value=name;list.append(opt)}document.body.append(list)}event.target.setAttribute("list",id)});
window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="profile"&&view!=="public"){view="public";if(data)refreshAccount()}});
window.WrldProfile={renderAccount,openPublic:showProfile,refresh:()=>{if(who&&!loading){data=null;draft=null;publicProfile=null;publicError="";err="";void load(who)}}};
})();
