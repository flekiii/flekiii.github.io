(() => {
"use strict";
const ua={
navAbout:"Про мене",navSupport:"Підтримати",navContact:"Контакти",
heroKicker:"НЕЗАЛЕЖНИЙ РОЗРОБНИК · УКРАЇНА",
heroTitle:'Перетворюю ідеї<br><em>на реальність.</em>',
heroLead:"Привіт, я flekiii. Мені 15, я з України й люблю досліджувати технології, код, творчість і красиві інтерфейси.",
explore:"Підтримати мене",contactMe:"Про мене",age:"років",country:"Україна",ideas:"ідей попереду",scroll:"ПІДТРИМАТИ МІЙ ШЛЯХ ↓",
aboutLabel:"ХТО Я",aboutTitle:'Допитливий розум.<br><em>Люблю створювати.</em>',
bioLead:"Я flekiii — 15-річний незалежний розробник з України, який любить навчатися та творити.",
bioText:"Мені подобається втілювати ідеї: експериментувати з інтерфейсами, писати програми, вивчати створення ігор і розбиратися, як усе працює зсередини. Щодня дізнаюся щось нове.",
skillDev:"РОЗРОБКА",skillTools:"ІНСТРУМЕНТИ",skillGames:"СТВОРЕННЯ ІГОР",skillFocus:"ЗАРАЗ У ФОКУСІ",focus:"Навчання, творчість і технології",
supportLabel:"ТРОХИ ПІДТРИМКИ",supportTitle:'Підтримай<br><em>мій шлях.</em>',
supportLead:"Якщо тобі подобається те, чим я займаюся, і ти хочеш підтримати моє навчання та майбутні ідеї — навіть невеликий донат для мене дуже важливий. ♡",
supportDetail:"Твоя підтримка допомагає мені більше вчитися, експериментувати й розвиватися. Без жодного тиску — я вже радий, що ти тут.",
donate:"Підтримати через Monobank",
donationNote:"Кнопка відкриває сторінку донату Monobank. Картка — лише інтерактивна ілюстрація, а не платіжна картка.",
dragHint:"↔ КРУТИ КАРТКУ · 360°",resetCard:"↺ Скинути",
connect:"БУДЬМО НА ЗВ’ЯЗКУ",contactTitle:'Залишаймося<br><em>на зв’язку.</em>',
contactText:"Хочеш привітатися? Мене можна знайти на цих платформах.",
footerText:"Створено з допитливістю й крапелькою рожевого."
};
const orig=new Map();document.querySelectorAll("[data-t]").forEach(el=>orig.set(el,el.innerHTML));
const rich=new Set(["heroTitle","aboutTitle","supportTitle","contactTitle"]);
function lang(next){
 const l=next==="uk"?"uk":"en";document.documentElement.lang=l;
 document.querySelectorAll("[data-t]").forEach(el=>{const k=el.dataset.t;
 if(l==="en")el.innerHTML=orig.get(el);
 else if(Object.prototype.hasOwnProperty.call(ua,k)){
 if(rich.has(k))el.innerHTML=ua[k];else el.textContent=ua[k];}});
 document.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===l)));
 document.title=l==="uk"?"flekiii — Розробник":"flekiii — Independent Developer";
 const stage=document.getElementById("cardStage");
 if(stage)stage.setAttribute("aria-label",l==="uk"?"Інтерактивна 3D-картка. Перетягуй, щоб обертати в будь-який бік. Стрілки на клавіатурі також працюють.":"Interactive 3D card. Drag to rotate in any direction, or use keyboard arrows.");
 try{localStorage.setItem("flekiii-lang",l);}catch{}
}
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>lang(b.dataset.lang)));
document.getElementById("year").textContent=String(new Date().getFullYear());
let saved=navigator.language&&navigator.language.toLowerCase().startsWith("uk")?"uk":"en";
try{saved=localStorage.getItem("flekiii-lang")||saved;}catch{}
lang(saved);
const stage=document.getElementById("cardStage"),card=document.getElementById("bankCard"),reset=document.getElementById("resetCard");
if(!stage||!card||!reset)return;
const home={x:-11,y:19},rot={x:home.x,y:home.y};
let pointer=null,px=0,py=0,dragging=false,animating=false;
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
const draw=(x=0,y=0)=>{card.style.transform="rotateX("+(rot.x+x)+"deg) rotateY("+(rot.y+y)+"deg)";};
stage.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;
pointer=e.pointerId;px=e.clientX;py=e.clientY;dragging=true;stage.classList.add("dragging");stage.setPointerCapture(e.pointerId);});
stage.addEventListener("pointermove",e=>{if(!dragging||e.pointerId!==pointer)return;
rot.y+=(e.clientX-px)*.7;rot.x-=(e.clientY-py)*.7;px=e.clientX;py=e.clientY;draw();});
const release=e=>{if(e.pointerId!==pointer)return;dragging=false;pointer=null;stage.classList.remove("dragging");if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);};
stage.addEventListener("pointerup",release);stage.addEventListener("pointercancel",release);
stage.addEventListener("lostpointercapture",()=>{dragging=false;pointer=null;stage.classList.remove("dragging");});
stage.addEventListener("keydown",e=>{
const d=15;if(e.key==="ArrowLeft")rot.y-=d;else if(e.key==="ArrowRight")rot.y+=d;
else if(e.key==="ArrowUp")rot.x-=d;else if(e.key==="ArrowDown")rot.x+=d;
else if(e.key==="Home"){rot.x=home.x;rot.y=home.y;}else return;e.preventDefault();draw();
});
reset.addEventListener("click",()=>{rot.x=home.x;rot.y=home.y;draw();});
const start=performance.now();
function frame(t){if(!animating)return;if(!dragging){const s=(t-start)/1000;draw(Math.sin(s*.41)*5,Math.sin(s*.29+1)*8);}requestAnimationFrame(frame);}
function syncMotion(){if(reduced.matches){animating=false;draw();}else if(!animating){animating=true;requestAnimationFrame(frame);}}
syncMotion();reduced.addEventListener?.("change",syncMotion);
})();