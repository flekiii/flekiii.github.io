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
donationNote:"Кнопка відкриває сторінку донату Monobank. Це вигаданий концепт приватної банківської картки, не справжній платіжний засіб.",
dragHint:"КРУТИ / ОБЕРТАЙ / ДОСЛІДЖУЙ · 360°",resetCard:"↺ Скинути",
connect:"БУДЬМО НА ЗВ’ЯЗКУ",contactTitle:'Залишаймося<br><em>на зв’язку.</em>',
contactText:"Хочеш привітатися? Мене можна знайти на цих платформах.",
devicesLabel:"МІЙ ЩОДЕННИЙ СЕТАП",
devicesTitle:'Мої <em>девайси.</em>',
devicesIntro:"Клавіатура та мишка, якими я користуюся щодня. Покрути 3D-моделі й роздивися їх ближче.",
keyboardType:"КЛАВІАТУРА",
keyboardDesc:"Моя компактна механічна клавіатура в червоно-білих кольорах.",
keyboardSpec1:"Формат 65%",keyboardSpec2:"68 клавіш",
mouseType:"МИШКА",
mouseDesc:"Моя дротова чорна ігрова мишка з RGB-підсвіткою.",
mouseSpec:"8 кнопок",
devicesGesture:"↻ КРУТИ МИШКОЮ · 360°",
devicesReset:"Скинути вигляд",
devicesFootnote:"Інтерактивні 3D-візуалізації моїх девайсів, не офіційні моделі виробників.",
footerText:"Створено з допитливістю й крапелькою рожевого."
};
const orig=new Map();document.querySelectorAll("[data-t]").forEach(el=>orig.set(el,el.innerHTML));
const rich=new Set(["heroTitle","aboutTitle","supportTitle","contactTitle","devicesTitle"]);
function lang(next){
 const l=next==="uk"?"uk":"en";document.documentElement.lang=l;
 document.querySelectorAll("[data-t]").forEach(el=>{const k=el.dataset.t;
 if(l==="en")el.innerHTML=orig.get(el);
 else if(Object.prototype.hasOwnProperty.call(ua,k)){
 if(rich.has(k))el.innerHTML=ua[k];else el.textContent=ua[k];}});
 document.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===l)));
 document.title=l==="uk"?"flekiii — Розробник":"flekiii — Independent Developer";
 const keyboard=document.getElementById("keyboard3d");
 const mouse=document.getElementById("mouse3d");
 if(keyboard)keyboard.setAttribute("aria-label",l==="uk"?"Інтерактивна 3D-клавіатура AJAZZ AK680. Перетягуй для обертання, стрілки клавіатури та Home для скидання.":"Interactive 3D AJAZZ AK680 keyboard. Drag to rotate, arrow keys and Home to reset.");
 if(mouse)mouse.setAttribute("aria-label",l==="uk"?"Інтерактивна 3D-мишка GamePro GM300B. Перетягуй для обертання, стрілки клавіатури та Home для скидання.":"Interactive 3D GamePro GM300B mouse. Drag to rotate, arrow keys and Home to reset.");
 const languageCard=document.getElementById("cardStage");
 if(languageCard)languageCard.setAttribute("aria-label",l==="uk"?
 "Інтерактивний концепт 3D-картки. Перетягуй, щоб обертати на 360° в будь-який бік. Стрілки клавіатури також працюють.":
 "Interactive 3D concept card. Drag to spin in any direction, or use the arrow keys.");
 try{localStorage.setItem("flekiii-lang",l);}catch{}
}
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>lang(b.dataset.lang)));
document.getElementById("year").textContent=String(new Date().getFullYear());
let saved=navigator.language&&navigator.language.toLowerCase().startsWith("uk")?"uk":"en";
try{saved=localStorage.getItem("flekiii-lang")||saved;}catch{}
lang(saved);
 const stage=document.getElementById("cardStage");
const card=document.getElementById("bankCard");
const reset=document.getElementById("resetCard");
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
if(stage&&card&&reset){
  const home={x:-13,y:22},angle={x:home.x,y:home.y};
  const momentum={x:0,y:0};
  let activePointer=null, lastX=0,lastY=0, lastTime=0,dragging=false;
  let animationStarted=false,offset=0, lastTick=0, idleTime=0;
  const visible=()=>stage.getBoundingClientRect().bottom>0 && stage.getBoundingClientRect().top<window.innerHeight;
  const render=(idleX=0,idleY=0)=>{
    card.style.transform="rotateX("+(angle.x+idleX).toFixed(3)+"deg) rotateY("+(angle.y+idleY).toFixed(3)+"deg)";
  };
  stage.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse" && e.button!==0)return;
    activePointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;
    dragging=true;momentum.x=0;momentum.y=0;idleTime=0;
    stage.classList.add("dragging");stage.setPointerCapture(e.pointerId);
    render(); 
  });
  stage.addEventListener("pointermove",e=>{
    if(!dragging||e.pointerId!==activePointer)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;
    const dt=Math.max(8,e.timeStamp-lastTime);
    angle.y+=dx*1.35; angle.x-=dy*1.35;
    momentum.y=Math.max(-8,Math.min(8,dx*1.35*16/dt));
    momentum.x=Math.max(-8,Math.min(8,-dy*1.35*16/dt));
    lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;
    render();
  });
  const release=e=>{
    if(e.pointerId!==activePointer)return;
    dragging=false;activePointer=null;stage.classList.remove("dragging");
    if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
    idleTime=0;
  };
  stage.addEventListener("pointerup",release);stage.addEventListener("pointercancel",release);
  stage.addEventListener("lostpointercapture",()=>{dragging=false;activePointer=null;stage.classList.remove("dragging")});
  stage.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft")angle.y-=24;
    else if(e.key==="ArrowRight")angle.y+=24;
    else if(e.key==="ArrowUp")angle.x-=24;
    else if(e.key==="ArrowDown")angle.x+=24;
    else if(e.key==="Home"){angle.x=home.x;angle.y=home.y;momentum.x=momentum.y=0;}
    else return;
    e.preventDefault();idleTime=0;render();
  });
  reset.addEventListener("click",()=>{angle.x=home.x;angle.y=home.y;momentum.x=momentum.y=0;idleTime=0;render()});
  stage.addEventListener("dblclick",()=>{angle.x=home.x;angle.y=home.y;momentum.x=momentum.y=0;idleTime=0;render()});
  function animate(t){
    if(!animationStarted)return;
    const dt=Math.min(40,Math.max(1,t-(lastTick||t)));lastTick=t;
    if(document.hidden||!visible()){requestAnimationFrame(animate);return;}
    if(!dragging){
      if(Math.abs(momentum.x)+Math.abs(momentum.y)>.04){
        angle.x+=momentum.x*dt/16;angle.y+=momentum.y*dt/16;
        const damping=Math.pow(.91,dt/16);
        momentum.x*=damping;momentum.y*=damping;
        idleTime=0;
      } else {
        idleTime+=dt;
      }
      let amp=Math.min(1,idleTime/550);
      const sec=t/1000;
      render(Math.sin(sec*.92)*8*amp,Math.sin(sec*.73+.8)*17*amp);
    }
    requestAnimationFrame(animate);
  }
  function sync(){
    if(reduced.matches){animationStarted=false;render();return;}
    if(!animationStarted){animationStarted=true;lastTick=0;requestAnimationFrame(animate);}
  }
  sync();reduced.addEventListener?.("change",sync);
}
const lantern=document.getElementById("lanternScroll");
if(lantern){
  let previous=window.scrollY,restoreTimer=0;
  window.addEventListener("scroll",()=>{
    if(reduced.matches)return;
    const next=window.scrollY;
    const delta=next-previous;previous=next;
    const swing=Math.max(-9,Math.min(9,delta*.32));
    lantern.style.setProperty("--lantern-scroll",swing.toFixed(2)+"deg");
    window.clearTimeout(restoreTimer);
    restoreTimer=window.setTimeout(()=>lantern.style.setProperty("--lantern-scroll","0deg"),180);
  },{passive:true});
}
})();