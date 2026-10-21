(() => {
"use strict";
const ua = {
brandCaption:"НЕЗАЛЕЖНИЙ РОЗРОБНИК",
navAbout:"Про мене",navSupport:"Підтримка",navContact:"Контакти",
heroEyebrow:"РОЗРОБНИК · УКРАЇНА",
heroTitle:'Створюю програми<br><em>з увагою до деталей.</em>',
heroLead:"Я flekiii — незалежний розробник. Поєдную програмування, продуманий дизайн та інтерактивні технології.",
heroLearn:"Більше про мене",heroReach:"Зв'язатися",
metaPlatform:"NixOS / KDE Plasma",metaFocus:"Програми · Дизайн · Ігри",
studioNote:"Спокійний простір, щоб думати й створювати.",
aboutEyebrow:"ПРО МЕНЕ",
aboutTitle:'Допитливий за характером.<br><em>Уважний до деталей.</em>',
aboutLead:"Я розробник з України. Мені подобається створювати корисні, продумані й якісні речі.",
aboutText:"Вивчаю технології, досліджую дизайн інтерфейсів і розробляю програми. Для мене важливо все: як продукт працює, який має вигляд і наскільки ним зручно користуватися.",
disciplineCode:"РОЗРОБКА",disciplinePlatform:"СЕРЕДОВИЩЕ",disciplineInteractive:"ІНТЕРАКТИВНЕ",
supportEyebrow:"НЕЗАЛЕЖНА РОЗРОБКА",
supportTitle:'Підтримати<br><em>мою роботу.</em>',
supportLead:"Якщо хочеш підтримати моє навчання й майбутні ідеї, можеш зробити внесок. Це допомагає мені продовжувати створювати нове.",
donate:"Підтримати через Monobank",
supportNote:"Оплата відкривається на Monobank. Інтерактивна картка — лише візуальний концепт, без справжніх платіжних даних.",
cardHint:"ПОКРУТИ КАРТКУ / 360°",resetCard:"Скинути вигляд ↺",
contactEyebrow:"КОНТАКТИ",
contactTitle:'Залишаймося<br><em>на зв’язку.</em>',
contactLead:"Для спілкування, запитань або просто привітання мене можна знайти тут.",
footerMade:"Незалежний розробник. Україна."
};
const source = new Map();
document.querySelectorAll("[data-t]").forEach(el=>source.set(el,el.innerHTML));
const rich = new Set(["heroTitle","aboutTitle","supportTitle","contactTitle"]);
const stages=document.querySelectorAll("[data-lang]");
function setLanguage(next){
  const code=next==="uk"?"uk":"en";
  document.documentElement.lang=code;
  document.querySelectorAll("[data-t]").forEach(el=>{
    const key=el.dataset.t;
    if(code==="en"){el.innerHTML=source.get(el)||"";}
    else if(Object.hasOwn(ua,key)){
      if(rich.has(key))el.innerHTML=ua[key];
      else el.textContent=ua[key];
    }
  });
  stages.forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.lang===code)));
  document.title=code==="uk"?"flekiii — Незалежний розробник":"flekiii — Independent Developer";
  const card=document.getElementById("cardStage");
  if(card)card.setAttribute("aria-label",code==="uk"?
    "Інтерактивна 3D-картка. Перетягуй для обертання. Стрілки повертають, Home скидає.":
    "Interactive concept bank card. Drag to rotate. Arrow keys rotate and Home resets.");
  try{localStorage.setItem("flekiii-lang",code);}catch{}
}
stages.forEach(button=>button.addEventListener("click",()=>setLanguage(button.dataset.lang)));
let language=navigator.language?.toLowerCase().startsWith("uk")?"uk":"en";
try{language=localStorage.getItem("flekiii-lang")||language;}catch{}
setLanguage(language);
document.getElementById("year").textContent=String(new Date().getFullYear());
const stage=document.getElementById("cardStage"),card=document.getElementById("bankCard");
const reset=document.getElementById("resetCard");
if(!stage||!card||!reset)return;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const initial={x:-12,y:24},rotation={x:initial.x,y:initial.y},speed={x:0,y:0};
let active=null,dragging=false,lastX=0,lastY=0,lastTime=0,atRest=0,frameHandle=0,lastFrame=0;
const render=(x=0,y=0)=>{
  card.style.transform="rotateX("+(rotation.x+x).toFixed(3)+"deg) rotateY("+(rotation.y+y).toFixed(3)+"deg)";
};
function resetView(){
  rotation.x=initial.x;rotation.y=initial.y;speed.x=speed.y=0;atRest=0;render();
}
stage.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse" && e.button!==0)return;
  active=e.pointerId;dragging=true;lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;
  speed.x=speed.y=0;atRest=0;stage.classList.add("dragging");
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener("pointermove",e=>{
  const r=stage.getBoundingClientRect();
  const x=Math.max(0,Math.min(100,(e.clientX-r.left)/Math.max(1,r.width)*100));
  const y=Math.max(0,Math.min(100,(e.clientY-r.top)/Math.max(1,r.height)*100));
  card.style.setProperty("--glint-x",x.toFixed(2)+"%");
  card.style.setProperty("--glint-y",y.toFixed(2)+"%");
  if(!dragging || e.pointerId!==active)return;
  const dx=e.clientX-lastX,dy=e.clientY-lastY;
  const dt=Math.max(8,e.timeStamp-lastTime);
  rotation.y+=dx*1.24;rotation.x-=dy*1.24;
  speed.y=Math.max(-6,Math.min(6,dx*1.24*16/dt));
  speed.x=Math.max(-6,Math.min(6,-dy*1.24*16/dt));
  lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;
  render();
});
function release(e){
  if(e.pointerId!==active)return;
  dragging=false;active=null;atRest=0;stage.classList.remove("dragging");
  if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
}
stage.addEventListener("pointerup",release);
stage.addEventListener("pointercancel",release);
stage.addEventListener("lostpointercapture",()=>{dragging=false;active=null;stage.classList.remove("dragging");});
stage.addEventListener("pointerleave",()=>{
  card.style.setProperty("--glint-x","29%");
  card.style.setProperty("--glint-y","20%");
});
stage.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft")rotation.y-=20;
  else if(e.key==="ArrowRight")rotation.y+=20;
  else if(e.key==="ArrowUp")rotation.x-=20;
  else if(e.key==="ArrowDown")rotation.x+=20;
  else if(e.key==="Home")resetView();
  else return;
  e.preventDefault();atRest=0;render();
});
reset.addEventListener("click",resetView);
stage.addEventListener("dblclick",resetView);
const visible=()=>{const r=stage.getBoundingClientRect();return r.bottom>=0&&r.top<=innerHeight;};
function frame(now){
  if(reduced.matches)return;
  frameHandle=requestAnimationFrame(frame);
  if(document.hidden||!visible()){lastFrame=now;return;}
  const dt=Math.min(40,Math.max(1,now-(lastFrame||now)));lastFrame=now;
  if(dragging)return;
  if(Math.abs(speed.x)+Math.abs(speed.y)>.035){
    rotation.x+=speed.x*dt/16;
    rotation.y+=speed.y*dt/16;
    speed.x*=Math.pow(.88,dt/16);speed.y*=Math.pow(.88,dt/16);
    atRest=0;
  }else{
    atRest+=dt;
  }
  const calm=Math.min(1,atRest/1300);
  const s=now/1000;
  render(Math.sin(s*.48)*2.5*calm,Math.sin(s*.37+.8)*5*calm);
}
function syncMotion(){
  cancelAnimationFrame(frameHandle);lastFrame=0;
  if(reduced.matches)render();
  else frameHandle=requestAnimationFrame(frame);
}
syncMotion();
reduced.addEventListener?.("change",syncMotion);
})();