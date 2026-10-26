/* fleki's wrld interactive profile studio. All public visibility decisions are made by the Worker. */
(()=>{"use strict";
const API="https://flekis-wrld-api.flekideveloper.workers.dev";
const defaults={bio:"public",media:"public",location:"friends",phone:"private",links:"public",games:"public",status:"public",roles:"public"};
const sections=[["overview","✦","Overview","Огляд"],["appearance","◈","Appearance","Оформлення"],["about","✎","About me","Про мене"],["contact","◎","Location & contact","Локація та контакти"],["games","▣","My games","Мої ігри"],["privacy","♧","Privacy","Приватність"],["security","♢","Security / Auth2FA","Захист / Auth2FA"],["preview","◉","View as others","Погляд зі сторони"]];
const labels={online:["Online","Онлайн"],away:["Away","Відійшов"],dnd:["Do not disturb","Не турбувати"],offline:["Offline","Офлайн"]};
const roles={owner:"Owner",aurvex_ceo:"AURVEX CEO",developer:"Developer",god:"God",moderator:"Moderator",creator:"Creator",vip:"VIP",tester:"Tester",member:"Member"};
const links=["telegram","discord","youtube","twitch","github","instagram","tiktok","steam"];
const keys=["bio","media","location","phone","links","games","status","roles"];
const en=()=>document.documentElement.lang!=="uk";
const tr=(a,b)=>en()?a:b;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tok=()=>{try{return sessionStorage.getItem("fw-token")||""}catch{return ""}};
const fmt=n=>n&&n>0?new Date(n).toLocaleDateString():"∞";
let activeTab="overview",who="",data=null,draft=null,loading=false,err="",owner=false,mod=false,view="self",avatar="",banner="",avatarTemp="",bannerTemp="",people=[],query="",lastSecret=null;
const secure=async(path,opts={})=>{
 const token=tok();if(!token)throw Error("Please sign in");
 const headers={Authorization:"Bearer "+token,...opts.headers};
 if(opts.body&&!(opts.body instanceof Uint8Array))headers["Content-Type"]="application/json";
 const r=await fetch(API+path,{...opts,headers,cache:"no-store",body:opts.body instanceof Uint8Array?opts.body:opts.body?JSON.stringify(opts.body):undefined});
 const json=await r.json().catch(()=>({error:"Server error"}));if(!r.ok)throw Error(json.error||"Request failed");return json;
};
function note(text){err=text;const target=document.getElementById("wp-feedback");if(target)target.textContent=text}
function resetMedia(){for(const url of [avatar,banner,avatarTemp,bannerTemp])if(url?.startsWith("blob:"))URL.revokeObjectURL(url);avatar="";banner="";avatarTemp="";bannerTemp=""}
function blank(p){return {display_name:p.display_name||"",bio:p.bio||"",status:p.status||"online",country:p.country||"",region:p.region||"",district:p.district||"",phone:p.phone||"",website:p.website||"",socials:{...(p.socials||{})},favorite_games:[...(p.favorite_games||[])],current_games:[...(p.current_games||[])],visibility:{...defaults,...(p.visibility||{})}}}
async function imageFor(id,kind){try{const response=await fetch(API+"/profiles/media/"+encodeURIComponent(id)+"/"+kind,{headers:tok()?{Authorization:"Bearer "+tok()}: {},cache:"no-store"});if(!response.ok)return "";const blob=await response.blob();return URL.createObjectURL(blob)}catch{return ""}}
async function load(userId){
 if(loading||!userId)return;loading=true;try{
 const obj=await secure("/profiles/me");
 if(userId!==who||!tok())return;
 data=obj.profile;draft=blank(data);owner=obj.owner===true;mod=obj.moderator===true;
 resetMedia();[avatar,banner]=await Promise.all([imageFor(data.id,"avatar"),imageFor(data.id,"banner")]);
 }catch(e){note(e.message)}finally{loading=false;window.dispatchEvent(new Event("wrld:profile-updated"))}
}
function langStatus(s){return (labels[s]||labels.offline)[en()?0:1]}
function statusMarkup(s){const x=s||"offline";return '<span class="wp-status '+esc(x)+'"><i></i>'+esc(langStatus(x))+'</span>'}
function roleMarkup(a){return (a||[]).map(r=>'<span class="wp-role" data-role="'+esc(r.role)+'">'+esc(roles[r.role]||r.role)+'</span>').join("")}
function imageBox(url,alt,fallback,classname){return url?'<img class="'+classname+'" src="'+esc(url)+'" alt="'+esc(alt)+'">':'<div class="'+classname+' wp-image-fallback">'+fallback+'</div>'}
function card(p,opts={}){
 const n=p.display_name||p.username||"Member",social=p.socials||{};
 const location=[p.country,p.region,p.district].filter(Boolean).map(esc).join(" · ");
 const showUrl=u=>{try{const url=new URL(u);return url.protocol==="https:"?'<a href="'+esc(url.href)+'" target="_blank" rel="noopener noreferrer">'+esc(url.hostname)+'</a>':""}catch{return ""}};
 const urls=[p.website&&showUrl(p.website),...links.filter(k=>social[k]).map(k=>showUrl(social[k]))].filter(Boolean);
 const fav=p.favorite_games||[],playing=p.current_games||[];
 return '<div class="wp-card">'+
 '<div class="wp-card-banner">'+imageBox(opts.banner??banner,"Profile banner","✦","wp-banner-image")+'</div>'+
 '<div class="wp-card-meta">'+imageBox(opts.avatar??avatar,"Avatar",esc((n||"?").slice(0,1).toUpperCase()),"wp-avatar-image")+
 '<div class="wp-card-name"><h3>'+esc(n)+'</h3><span>@'+esc(p.username||data?.username||"member")+'</span></div>'+statusMarkup(p.status)+'</div>'+
 '<div class="wp-badges">'+roleMarkup(p.roles)+'</div>'+
 (p.bio?'<p class="wp-card-bio">'+esc(p.bio)+'</p>':"")+
 (location?'<p class="wp-card-detail">⌖ '+location+'</p>':"")+
 (p.phone?'<p class="wp-card-detail">☎ '+esc(p.phone)+'</p>':"")+
 (urls.length?'<div class="wp-links">'+urls.join("")+'</div>':"")+
 (fav.length?'<div class="wp-games-text"><strong>'+tr("Favorite games","Улюблені ігри")+'</strong><div>'+fav.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div></div>':"")+
 (playing.length?'<div class="wp-games-text"><strong>'+tr("Currently playing","Зараз граю")+'</strong><div>'+playing.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div></div>':"")+
 '</div>';
}
const fld=(label,name,value,type="text",max=120)=>'<label class="wp-field"><span>'+label+'</span><input class="social-input" data-wp-field="'+name+'" type="'+type+'" maxlength="'+max+'" value="'+esc(value||"")+'"></label>';
const textarea=(label,name,value,max=350)=>'<label class="wp-field"><span>'+label+'</span><textarea class="social-textarea" data-wp-field="'+name+'" maxlength="'+max+'">'+esc(value||"")+'</textarea></label>';
const save=()=>'<button type="button" class="btn primary" data-wp="save">'+tr("Save changes","Зберегти зміни")+'</button>';
function content(state){
 const p=draft||blank(state.user),v=p.visibility;
 if(activeTab==="overview")return '<h2>'+tr("Your profile","Твій профіль")+'</h2><p>'+tr("Customize your world, choose what to share and see changes instantly.","Налаштуй свій профіль, обери, що показувати іншим, і переглядай зміни одразу.")+'</p><div class="wp-section-cards">'+sections.filter(s=>!["overview","preview"].includes(s[0])).map(s=>'<button type="button" data-wp="tab" data-id="'+s[0]+'"><strong>'+s[1]+' '+(en()?s[2]:s[3])+'</strong><span>↗</span></button>').join("")+'</div>';
 if(activeTab==="appearance")return '<h2>'+tr("Photos & banners","Фото та банери")+'</h2><p>'+tr("Upload JPG, PNG, WebP or GIF. Animated GIF banners will stay animated. Images are stored with your account.","Завантаж JPG, PNG, WebP або GIF. Анімовані GIF-банери залишаться рухомими. Зображення зберігаються у твоєму акаунті.")+'</p><div class="wp-upload-list">'+["avatar","banner"].map(kind=>'<div class="wp-upload"><strong>'+ (kind==="avatar"?tr("Profile photo","Фото профілю"):tr("Animated banner","Анімований банер"))+'</strong><small>'+ (kind==="avatar"?"420 KB max":"1.45 MB max")+'</small><label class="btn"><input hidden type="file" data-wp-upload="'+kind+'" accept="image/png,image/jpeg,image/webp,image/gif">'+tr("Choose image / GIF","Вибрати фото / GIF")+'</label><button class="btn" data-wp="remove-media" data-kind="'+kind+'">'+tr("Remove","Прибрати")+'</button></div>').join("")+'</div>';
 if(activeTab==="about")return '<h2>'+tr("About me","Про мене")+'</h2>'+fld(tr("Display name","Ім'я профілю"),"display_name",p.display_name,"text",60)+textarea(tr("Description","Опис"),"bio",p.bio,350)+'<label class="wp-field"><span>'+tr("My status","Мій статус")+'</span><select class="social-input" data-wp-field="status">'+["online","away","dnd","offline"].map(k=>'<option value="'+k+'" '+(p.status===k?"selected":"")+'>'+langStatus(k)+'</option>').join("")+'</select></label>'+save();
 if(activeTab==="contact")return '<h2>'+tr("Location & contact","Локація та контакти")+'</h2><p>'+tr("All fields are optional. Never publish an address or a phone number unless you want to.","Усі поля необов'язкові. Не публікуй адресу чи телефон, якщо цього не хочеш.")+'</p>'+fld(tr("Country","Країна"),"country",p.country,"text",60)+fld(tr("State / Oblast / Region","Штат / Область / Регіон"),"region",p.region,"text",80)+fld(tr("District","Район"),"district",p.district,"text",80)+fld(tr("Phone number (optional)","Номер телефону (необов'язково)"),"phone",p.phone,"tel",30)+fld(tr("Website (HTTPS)","Сайт (HTTPS)"),"website",p.website,"url",220)+'<h3>'+tr("Social media links","Посилання на соцмережі")+'</h3>'+links.map(k=>fld(k.charAt(0).toUpperCase()+k.slice(1)+" (https://)","social:"+k,p.socials[k],"url",220)).join("")+save();
 if(activeTab==="games")return '<h2>'+tr("My games","Мої ігри")+'</h2><p>'+tr("Write one title per line, up to 10 games in each section.","По одній грі на рядок, до 10 у кожному розділі.")+'</p>'+textarea(tr("Favorite games","Улюблені ігри"),"favorite_games",p.favorite_games.join("\n"),570)+textarea(tr("Currently playing","Актуальні ігри"),"current_games",p.current_games.join("\n"),570)+save();
 if(activeTab==="privacy")return '<h2>'+tr("Who can see my profile?","Хто бачить мій профіль?")+'</h2><p>'+tr("Server-enforced permissions. Your phone is private by default.","Доступ перевіряється сервером. Телефон початково прихований.")+'</p><div class="wp-privacy">'+keys.map(k=>'<label class="wp-field"><span>'+({bio:tr("Description","Опис"),media:tr("Avatar & banner","Аватар і банер"),location:tr("Country, region & district","Країна, область і район"),phone:tr("Phone number","Номер телефону"),links:tr("Website & social links","Сайт і соцмережі"),games:tr("Favorite & current games","Улюблені й актуальні ігри"),status:tr("Status & presence","Статус і присутність"),roles:tr("Roles","Ролі")})[k]+'</span><select class="social-input" data-wp-privacy="'+k+'">'+[["public",tr("Everyone","Усі")],["friends",tr("Friends only","Лише друзі")],["private",tr("Only me","Тільки я")]].map(([x,y])=>'<option value="'+x+'" '+(v[k]===x?"selected":"")+'>'+y+'</option>').join("")+'</select></label>').join("")+'</div>'+save();
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
 return '<aside class="wp-preview-col"><div class="wp-preview-title"><span class="overline">LIVE PROFILE PREVIEW</span><button class="social-mini" data-wp="preview" data-mode="public">'+tr("Public view ↗","Публічний вигляд ↗")+'</button></div><div id="wp-live-card">'+card(draftProfile)+'</div><small>'+tr("Preview updates as you edit. Click Save to publish.","Попередній перегляд змінюється одразу. Натисни Зберегти, щоб опублікувати.")+'</small></aside>';
}
function renderAccount(state){
 if(!state?.user)return null;
 const userId=state.user.id;
 if(who!==userId){who=userId;data=null;draft=null;owner=false;mod=false;activeTab="overview";resetMedia();void load(userId)}
 if(!data)return '<div class="wp-loading">'+tr("Loading your profile settings…","Завантажуємо налаштування профілю…")+'</div>';
 if(!draft)draft=blank(data);
 return '<div class="wp-shell">'+side(state)+'<div class="wp-editor"><div class="wp-editor-inner">'+content(state)+'<p class="wp-feedback" id="wp-feedback" role="status">'+esc(err)+'</p></div></div>'+previewPanel(state)+'</div>';
}
const liveUpdate=()=>{const p=document.getElementById("wp-live-card");if(p&&data&&draft)p.innerHTML=card({...data,...draft,username:data.username,roles:data.roles})};
async function saveData(){
 if(!data||!draft)return;
 const payload={...draft,visibility:{...draft.visibility}};
 if(payload.favorite_games.length>10||payload.current_games.length>10)throw Error("Max 10 games per list");
 await secure("/profiles/me",{method:"PUT",body:payload});
 const result=await secure("/profiles/me");data=result.profile;draft=blank(data);note(tr("Profile saved ✓","Профіль збережено ✓"));window.dispatchEvent(new Event("wrld:profile-updated"));window.dispatchEvent(new Event("fw-auth-changed"));
}
function modal(profile,a,b){
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
 modal(profile,a,b);
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
  const cap=kind==="avatar"?420000:1450000;
  if(file.size>cap||!["image/png","image/jpeg","image/gif","image/webp"].includes(file.type)){note(tr("Unsupported image or file too large","Непідтримуване зображення або завеликий файл"));return}
  try{
   const bytes=new Uint8Array(await file.arrayBuffer());
   await secure("/profiles/media/"+kind,{method:"POST",body:bytes,headers:{"Content-Type":file.type}});
   const loaded=await imageFor(data.id,kind);
   if(kind==="avatar"){if(avatar.startsWith("blob:"))URL.revokeObjectURL(avatar);avatar=loaded}else{if(banner.startsWith("blob:"))URL.revokeObjectURL(banner);banner=loaded}
   liveUpdate();note(tr("Image uploaded ✓","Зображення завантажено ✓"));
  }catch(err){note(err.message)}return;
 }
 if(input.dataset.wpPrivacy&&draft){draft.visibility[input.dataset.wpPrivacy]=input.value;liveUpdate()}
 if(input.dataset.wpField&&draft){updateField(input)}
});
function updateField(input){
 const key=input.dataset.wpField;
 if(key.startsWith("social:"))draft.socials[key.slice(7)]=input.value;
 else if(["favorite_games","current_games"].includes(key))draft[key]=input.value.split(/[\n,]/).map(s=>s.trim()).filter(Boolean).slice(0,11);
 else draft[key]=input.value;
 liveUpdate();
}
document.addEventListener("input",e=>{if(e.target.matches("[data-wp-field]")&&draft)updateField(e.target)});
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.getElementById("wp-public-modal")?.remove()});
window.addEventListener("wrld:language-change",()=>{if(data)window.dispatchEvent(new Event("wrld:profile-updated"))});
window.addEventListener("fw-auth-changed",()=>{if(!tok()){who="";data=null;draft=null;resetMedia()}});

const countrySuggestions=["Ukraine","United States","United Kingdom","Poland","Germany","France","Italy","Spain","Canada","Australia","Austria","Belgium","Czechia","Denmark","Estonia","Finland","Georgia","Greece","Hungary","Ireland","Israel","Japan","Latvia","Lithuania","Netherlands","Norway","Portugal","Romania","Slovakia","Sweden","Switzerland","Türkiye","Moldova","Bulgaria","Croatia","Slovenia","India","Brazil","South Korea"];
const regionSuggestions=["Ivano-Frankivsk Oblast","Kyiv Oblast","Kyiv","Lviv Oblast","Volyn Oblast","Rivne Oblast","Ternopil Oblast","Khmelnytskyi Oblast","Vinnytsia Oblast","Zakarpattia Oblast","Chernivtsi Oblast","Zhytomyr Oblast","Chernihiv Oblast","Sumy Oblast","Poltava Oblast","Kharkiv Oblast","Dnipropetrovsk Oblast","Odesa Oblast","Mykolaiv Oblast","Kherson Oblast","Kirovohrad Oblast","Cherkasy Oblast","California","Texas","Florida","New York","Washington"];
document.addEventListener("focusin",event=>{const field=event.target?.dataset?.wpField;if(!["country","region"].includes(field))return;const id="wp-"+field+"-suggestions";let list=document.getElementById(id);if(!list){list=document.createElement("datalist");list.id=id;for(const name of (field==="country"?countrySuggestions:regionSuggestions)){const opt=document.createElement("option");opt.value=name;list.append(opt)}document.body.append(list)}event.target.setAttribute("list",id)});
window.WrldProfile={renderAccount,openPublic:showProfile,refresh:()=>{if(who){data=null;draft=null;void load(who)}}};
})();
