(() => {
"use strict";
const uk={
skipLink:"Перейти до основного вмісту",
navAbout:"Про мене",navWork:"Напрямки",navSkills:"Навички",navContact:"Контакти",navCTA:"Написати ↗",
earthTitle:"Дім. Земля. Моя точка відліку.",planetHint:"ТЯГНИ, ЩОБ КРУТИТИ · АВТООБЕРТАННЯ",
profileRole:"Розробка програм і творчих проєктів",profileLocation:"КРАЇНА",profileEnvironment:"СЕРЕДОВИЩЕ",
heroScroll:"ГОРТАЙ НИЖЧЕ",
expertiseTitle:'Те, що мені <em>подобається створювати.</em>',
serviceApps:"Програми та застосунки",
serviceAppsDesc:"Створюю застосунки, вивчаю нові технології та працюю над корисними й зручними цифровими продуктами.",
serviceWeb:"Сайти та інтерфейси",
serviceWebDesc:"Проєктую та розробляю адаптивні інтерфейси, приділяючи увагу деталям і зручності використання.",
serviceGames:"Розробка ігор",
serviceGamesDesc:"Вивчаю ігрові рушії, системи взаємодії, ігрову логіку та створення світів.",
skillsTitle:'Технології, з якими<br><em>я працюю.</em>',
skillsIntro:"Інструменти й технології, які я використовую, вивчаю та випробовую. Цей список постійно зростає.",
skillsDev:"Програмування",skillsGame:"Створення ігор",skillsWorkflow:"Робоче середовище",
supportEyebrow:"ПІДТРИМКА",
supportTitle:'Підтримати <em>мій розвиток.</em>',
supportBody:"Я продовжую вчитися й створювати нове. Якщо хочеш підтримати мене, можеш зробити внесок через Monobank. Це цілком добровільно.",
donate:"Підтримати через Monobank",
contactKicker:"МАЄШ ІДЕЮ АБО ХОЧЕШ ПОСПІЛКУВАТИСЯ?",
contactTitle:'Будьмо на зв’язку<span>.</span>',
contactBody:"Я завжди радий новим знайомствам, цікавим ідеям і можливості дізнатися щось нове.",
footerText:"Незалежний розробник з України.",backToTop:"ДОГОРИ ↑"
};
const source=new Map();
document.querySelectorAll("[data-t]").forEach(el=>source.set(el,el.innerHTML));
const rich=new Set(["expertiseTitle","skillsTitle","supportTitle","contactTitle"]);
const buttons=[...document.querySelectorAll("[data-lang]")];
// Each letter forms as a small stream of falling numbers before resolving.
// Build only once when scrolled into view; changing language replays the effect.
const matrixHeading=document.getElementById("matrixHeading");
const matrixReduced=matchMedia("(prefers-reduced-motion: reduce)");
let matrixVisible=false;
function buildMatrix(language){
 if(!matrixHeading)return;
 const phrase=language==="uk"?matrixHeading.dataset.uk:matrixHeading.dataset.en;
 matrixHeading.classList.remove("matrix-start");
 matrixHeading.replaceChildren();
 matrixHeading.setAttribute("aria-label",phrase);
 if(matrixReduced.matches){matrixHeading.textContent=phrase;return;}
 const fragment=document.createDocumentFragment();
 let charIndex=0;
 const words=phrase.split(/\s+/u);
 words.forEach(word=>{
  const wrapper=document.createElement("span");
  wrapper.className="matrix-word";
  wrapper.setAttribute("aria-hidden","true");
  for(const char of word){
   const letter=document.createElement("span");
   letter.className="matrix-char";
   letter.textContent=char;
   letter.style.setProperty("--stagger",(charIndex*68)+"ms");
   // Number trails start above the final glyph and dissolve as it appears.
   for(let j=0;j<4;j++){
     const digit=document.createElement("span");
     digit.className="matrix-digit";
     digit.setAttribute("aria-hidden","true");
     digit.style.setProperty("--rain-delay",(j*85)+"ms");
     digit.textContent=String((charIndex*7+j*3+5)%10);
     letter.appendChild(digit);
   }
   wrapper.appendChild(letter);
   charIndex++;
  }
  fragment.appendChild(wrapper);
 });
 matrixHeading.appendChild(fragment);
 if(matrixVisible)requestAnimationFrame(()=>matrixHeading.classList.add("matrix-start"));
}
if(matrixHeading){
 if("IntersectionObserver" in window){
  const reveal=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)){
    matrixVisible=true;matrixHeading.classList.add("matrix-start");reveal.disconnect();
   }
  },{rootMargin:"0px 0px -12% 0px",threshold:.22});
  reveal.observe(matrixHeading);
 }else matrixVisible=true;
}
matrixReduced.addEventListener?.("change",()=>{
 buildMatrix(document.documentElement.lang==="uk"?"uk":"en");
});

function setLanguage(raw){
 const language=raw==="uk"?"uk":"en";
 document.documentElement.lang=language;
 for(const [el,original] of source){
  const key=el.dataset.t;
  if(language==="en")el.innerHTML=original;
  else if(Object.hasOwn(uk,key)){
   if(rich.has(key))el.innerHTML=uk[key];
   else el.textContent=uk[key];
  }
 }
 buttons.forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.lang===language)));
 document.title=language==="uk"?"flekiii — Портфоліо розробника":"flekiii — Developer Portfolio";
 buildMatrix(language);
 const card=document.getElementById("cardStage");
 card?.setAttribute("aria-label",language==="uk"?
  "Інтерактивна 3D-картка. Перетягуй або використовуй стрілки клавіатури для обертання. Home скидає положення.":
  "Interactive fictional bank card. Drag or use arrow keys to rotate; Home resets.");
 try{localStorage.setItem("flekiii-lang",language);}catch{}
}
buttons.forEach(btn=>btn.addEventListener("click",()=>setLanguage(btn.dataset.lang)));
let initial=navigator.language?.toLowerCase().startsWith("uk")?"uk":"en";
try{initial=localStorage.getItem("flekiii-lang")||initial;}catch{}
setLanguage(initial);
document.getElementById("year").textContent=String(new Date().getFullYear());

document.querySelectorAll('a[href="#top"]').forEach(link=>{
 link.addEventListener("click",event=>{
  event.preventDefault();
  window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
 });
});

// Drag the hanging lantern to any viewport position. Store positions per browser.
const lantern=document.getElementById("fireflyLantern");
const lanternHandle=document.getElementById("lantern3d");
if(lantern && lanternHandle){
 let moving=false,pointerId=null,grabX=0,grabY=0;
 let moved=false,downX=0,downY=0;
 const storageKey="flekiii-lantern-position-v2";
 const clamp=(x,y)=>{
   const w=lantern.offsetWidth,h=lantern.offsetHeight;
   return {
     x:Math.max(2,Math.min(innerWidth-w-2,x)),
     y:Math.max(2,Math.min(innerHeight-h-2,y))
   };
 };
 function applyPosition(x,y,persist=true){
   const point=clamp(x,y);
   lantern.style.left=point.x+"px";
   lantern.style.top=point.y+"px";
   lantern.style.right="auto";
   lantern.classList.add("custom-position");
   if(persist){
     try{localStorage.setItem(storageKey,JSON.stringify(point));}catch{}
   }
 }
 function resetPosition(){
   lantern.style.left="";
   lantern.style.top="";
   lantern.style.right="";
   lantern.classList.remove("custom-position");
   try{localStorage.removeItem(storageKey);}catch{}
 }
 try{
   const saved=JSON.parse(localStorage.getItem(storageKey)||"null");
   if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))applyPosition(saved.x,saved.y,false);
 }catch{}
 lanternHandle.addEventListener("pointerdown",e=>{
   if(e.pointerType==="mouse"&&e.button!==0)return;
   pointerId=e.pointerId;
   const rect=lantern.getBoundingClientRect();
   grabX=e.clientX-rect.left;grabY=e.clientY-rect.top;
   downX=e.clientX;downY=e.clientY;
   moving=true;moved=false;
   lantern.classList.add("is-moving");
   lanternHandle.setPointerCapture(e.pointerId);
   e.preventDefault();
 });
 lanternHandle.addEventListener("pointermove",e=>{
   if(!moving||e.pointerId!==pointerId)return;
   if(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)>3)moved=true;
   applyPosition(e.clientX-grabX,e.clientY-grabY,!moving);
   e.preventDefault();
 });
 const stop=e=>{
   if(e.pointerId!==pointerId)return;
   moving=false;pointerId=null;
   lantern.classList.remove("is-moving");
   if(moved){
     const r=lantern.getBoundingClientRect();
     applyPosition(r.left,r.top,true);
   }
   if(lanternHandle.hasPointerCapture(e.pointerId))lanternHandle.releasePointerCapture(e.pointerId);
 };
 lanternHandle.addEventListener("pointerup",stop);
 lanternHandle.addEventListener("pointercancel",stop);
 lanternHandle.addEventListener("lostpointercapture",()=>{moving=false;pointerId=null;lantern.classList.remove("is-moving");});
 lanternHandle.addEventListener("dblclick",resetPosition);
 lanternHandle.addEventListener("keydown",e=>{
   if(e.key==="Home"){resetPosition();e.preventDefault();return;}
   const r=lantern.getBoundingClientRect(),step=e.shiftKey?32:15;
   if(e.key==="ArrowLeft")applyPosition(r.left-step,r.top);
   else if(e.key==="ArrowRight")applyPosition(r.left+step,r.top);
   else if(e.key==="ArrowUp")applyPosition(r.left,r.top-step);
   else if(e.key==="ArrowDown")applyPosition(r.left,r.top+step);
   else return;
   e.preventDefault();
 });
 addEventListener("resize",()=>{
   if(!lantern.classList.contains("custom-position"))return;
   const r=lantern.getBoundingClientRect();
   applyPosition(r.left,r.top);
 },{passive:true});
}

const stage=document.getElementById("cardStage"),card=document.getElementById("bankCard"),reset=document.getElementById("resetCard");
if(!stage||!card||!reset)return;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const home={x:-10,y:18},angle={x:home.x,y:home.y},speed={x:0,y:0};
let active=null,dragging=false,lastX=0,lastY=0,lastTime=0,idle=0,lastFrame=0,rafId=0;
function draw(ix=0,iy=0){card.style.transform="rotateX("+(angle.x+ix).toFixed(2)+"deg) rotateY("+(angle.y+iy).toFixed(2)+"deg)";}
function resetView(){angle.x=home.x;angle.y=home.y;speed.x=speed.y=0;idle=0;draw();}
stage.addEventListener("selectstart",e=>e.preventDefault());
stage.addEventListener("dragstart",e=>e.preventDefault());
stage.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(e.pointerType==="mouse"&&e.button!==0)return;
 active=e.pointerId;dragging=true;
 lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;
 idle=0;speed.x=speed.y=0;
 stage.classList.add("dragging");stage.setPointerCapture(e.pointerId);
});
stage.addEventListener("pointermove",e=>{
 const bounds=stage.getBoundingClientRect();
 const x=Math.max(0,Math.min(100,(e.clientX-bounds.left)/Math.max(1,bounds.width)*100));
 const y=Math.max(0,Math.min(100,(e.clientY-bounds.top)/Math.max(1,bounds.height)*100));
 card.style.setProperty("--glint-x",x.toFixed(1)+"%");
 card.style.setProperty("--glint-y",y.toFixed(1)+"%");
 if(!dragging||e.pointerId!==active)return;
 const dx=e.clientX-lastX,dy=e.clientY-lastY,dt=Math.max(8,e.timeStamp-lastTime);
 angle.y+=dx*1.22;angle.x-=dy*1.22;
 speed.y=Math.max(-6,Math.min(6,dx*1.22*16/dt));
 speed.x=Math.max(-6,Math.min(6,-dy*1.22*16/dt));
 lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;
 draw();
});
function release(e){
 if(e.pointerId!==active)return;
 active=null;dragging=false;idle=0;stage.classList.remove("dragging");
 if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
}
stage.addEventListener("pointerup",release);
stage.addEventListener("pointercancel",release);
stage.addEventListener("lostpointercapture",()=>{active=null;dragging=false;stage.classList.remove("dragging");});
stage.addEventListener("pointerleave",()=>{
 card.style.setProperty("--glint-x","30%");
 card.style.setProperty("--glint-y","20%");
});
stage.addEventListener("keydown",e=>{
 if(e.key==="ArrowLeft")angle.y-=22;
 else if(e.key==="ArrowRight")angle.y+=22;
 else if(e.key==="ArrowUp")angle.x-=22;
 else if(e.key==="ArrowDown")angle.x+=22;
 else if(e.key==="Home")resetView();
 else return;
 e.preventDefault();idle=0;draw();
});
reset.addEventListener("click",resetView);
stage.addEventListener("dblclick",resetView);
const visible=()=>{const box=stage.getBoundingClientRect();return box.bottom>0&&box.top<innerHeight;};
function animate(time){
 if(reduced.matches)return;
 rafId=requestAnimationFrame(animate);
 if(document.hidden||!visible()){lastFrame=time;return;}
 const dt=Math.min(40,Math.max(1,time-(lastFrame||time)));lastFrame=time;
 if(dragging)return;
 if(Math.abs(speed.x)+Math.abs(speed.y)>.04){
  angle.x+=speed.x*dt/16;angle.y+=speed.y*dt/16;
  const damping=Math.pow(.9,dt/16);
  speed.x*=damping;speed.y*=damping;
  idle=0;
 }else idle+=dt;
 const a=Math.min(1,idle/1600),s=time/1000;
 draw(Math.sin(s*.38)*2*a,Math.sin(s*.32)*4*a);
}
function toggleAnimation(){
 cancelAnimationFrame(rafId);lastFrame=0;
 if(reduced.matches)draw();
 else rafId=requestAnimationFrame(animate);
}
toggleAnimation();
reduced.addEventListener?.("change",toggleAnimation);
})();