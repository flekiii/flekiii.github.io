(() => {
"use strict";
const uk={
skip:"До основного вмісту",navAbout:"Про мене",navProcess:"Підхід",navSupport:"Підтримати",navContact:"Контакти",
heroOverline:"НЕЗАЛЕЖНИЙ РОЗРОБНИК / УКРАЇНА",
heroTitle:'Створюю те,<br>що <em>уявляю.</em>',
heroLead:"Я flekiii. Пишу код, експериментую з іграми й створюю інтерфейси по-своєму. Без готових шаблонів — лише ідеї та бажання їх втілити.",
heroExplore:"Пізнати мій світ",heroTalk:"Зв’язатися",
heroBottom:"КОД. ТВОРЧІСТЬ. НАВЧАННЯ. РОЗВИТОК. — БЕЗ ШАБЛОНІВ.",
terminalStatus:"готовий створювати щось нове",editorReady:"● ГОТОВИЙ",devBottomLabel:"НЕЗАЛЕЖНИЙ ЗА ВИБОРОМ",
scrollPrompt:"ГОРТАЙ НИЖЧЕ",aboutEyebrow:"ХТО СТОЇТЬ ЗА КОДОМ",
aboutTitle:'Не йду за<br>шаблоном.<br><em>Створюю свій.</em>',
aboutLead:"Мені 15 років, я з України. Технології захоплюють мене тим, що дозволяють перетворити ідею на щось, чим люди справді можуть користуватися.",
aboutText:"Люблю створювати програми, досліджувати розробку ігор і проєктувати інтерфейси. Вчуся на практиці: експериментую, виправляю помилки та вдосконалюю результат.",
ageLabel:"ВІК",locationLabel:"КРАЇНА",osLabel:"МОЯ ОС",
toolkitTitle:"МОЇ ІНСТРУМЕНТИ",toolkitCaption:"те, з чим працюю",
processEyebrow:"ЯК ДУМАЮ / ЯК СТВОРЮЮ",
approachTitle:'Спочатку цікавість.<br><em>Потім реалізація.</em>',
approachLead:"Без складних формул. Знаходжу ідею, втілюю її та роблю кращою.",
approachA:"Знайти ідею",approachADesc:"Ставити запитання, досліджувати можливості та знаходити нові рішення.",
approachB:"Втілити її",approachBDesc:"Відкрити редактор, написати код, протестувати й отримати робочий прототип.",
approachC:"Покращувати",approachCDesc:"Шліфувати деталі, виправляти помилки та вдосконалювати результат.",
manifesto:"Мені не потрібен дозвіл, щоб навчитися чогось нового.",
supportEyebrow:"НЕЗАЛЕЖНА ТВОРЧІСТЬ / ПІДТРИМКА",
supportTitle:'Підтримай<br><em>наступну ідею.</em>',
supportLead:"Подобається те, що я створюю? Можеш підтримати моє навчання й майбутні експерименти. Без підписок і тиску — це допомагає рухатися вперед.",
donate:"Підтримати через Monobank",donationNote:"Оплата відкривається на Monobank. Інтерактивна картка — вигаданий концепт, а не справжній платіжний засіб.",
dragHint:"КРУТИ КАРТКУ / 360°",resetCard:"СКИНУТИ ↺",
contactEyebrow:"ВІДКРИТИЙ ДО СПІЛКУВАННЯ",
contactTitle:'Можемо створити<br><em>щось цікаве.</em>',
contactLead:"Є ідея, запитання або просто хочеш привітатися? Шукай мене тут.",
footerText:"Незалежний за вибором. Створюю власний шлях.",backToTop:"ДОГОРИ ↑",commandHelp:"CTRL+K / ШВИДКИЙ ПЕРЕХІД"
};
const originals=new Map();
document.querySelectorAll("[data-t]").forEach(el=>originals.set(el,el.innerHTML));
const rich=new Set(["heroTitle","aboutTitle","approachTitle","supportTitle","contactTitle"]);
let language="en",activeFile="about";
const files={
about:'// about.ts\nconst creator = {\n  name: "flekiii",\n  age: 15,\n  from: "Ukraine",\n  mindset: "independent",\n  passion: "building"\n};\n\nexport default creator;',
stack:'{\n  "os": "NixOS",\n  "languages": ["JS", "Dart", "Rust"],\n  "engines": ["Unity", "Unreal"],\n  "editor": "VS Code",\n  "mode": "always learning"\n}',
ideas:'# ideas.md\n\n- Imagine something new\n- Create a prototype\n- Keep improving\n\nBuild > wait.'
};
function showFile(name){
 if(!Object.hasOwn(files,name))return;
 activeFile=name;
 document.getElementById("codeDisplay").textContent=files[name];
 document.getElementById("lineNumbers").textContent=files[name].split("\n").map((_,i)=>String(i+1).padStart(2,"0")).join("\n");
 document.querySelectorAll("[data-code-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.codeTab===name)));
}
document.querySelectorAll("[data-code-tab]").forEach(b=>b.addEventListener("click",()=>showFile(b.dataset.codeTab)));
showFile("about");
document.getElementById("copyCode").addEventListener("click",async()=>{
 const btn=document.getElementById("copyCode");
 try{await navigator.clipboard.writeText(files[activeFile]);btn.title=language==="uk"?"Скопійовано":"Copied";}catch{btn.title="Select and copy text";}
 setTimeout(()=>btn.title="Copy code",1500);
});
const overlay=document.getElementById("commandOverlay"),input=document.getElementById("commandInput"),results=document.getElementById("commandResults");
let previousFocus=null;
const destinations=[["about","About","Про мене"],["approach","Process","Мій підхід"],["support","Support","Підтримка"],["contact","Contact","Контакти"]];
function showResults(){
 const q=input.value.trim().toLowerCase();results.replaceChildren();
 let matched=0;
 for(const item of destinations){
  if(!item.join(" ").toLowerCase().includes(q))continue;
  matched++;
  const button=document.createElement("button");
  button.type="button";button.className="command-option";button.textContent=(language==="uk"?item[2]:item[1])+"  ↗";
  button.addEventListener("click",()=>{closeCommands();document.getElementById(item[0]).scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});});
  results.appendChild(button);
 }
 if(!matched){const p=document.createElement("p");p.textContent=language==="uk"?"Нічого не знайдено":"No results";results.appendChild(p);}
}
function openCommands(){previousFocus=document.activeElement;overlay.hidden=false;input.value="";showResults();input.focus();}
function closeCommands(){overlay.hidden=true;previousFocus?.focus?.();}
document.getElementById("commandTrigger").addEventListener("click",openCommands);
document.getElementById("commandClose").addEventListener("click",closeCommands);
overlay.addEventListener("click",e=>{if(e.target===overlay)closeCommands();});
input.addEventListener("input",showResults);
input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();results.querySelector("button")?.click();}});
document.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();overlay.hidden?openCommands():closeCommands();}
 if(e.key==="Escape"&&!overlay.hidden){e.preventDefault();closeCommands();}
});
function setLanguage(value){
 language=value==="uk"?"uk":"en";document.documentElement.lang=language;
 document.querySelectorAll("[data-t]").forEach(el=>{
  const key=el.dataset.t;
  if(language==="en")el.innerHTML=originals.get(el);
  else if(Object.hasOwn(uk,key)){if(rich.has(key))el.innerHTML=uk[key];else el.textContent=uk[key];}
 });
 document.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===language)));
 input.placeholder=language==="uk"?"Пошук розділів...":"Search sections...";
 document.title=language==="uk"?"flekiii — Розробник та творець":"flekiii — Creator & Developer";
 showResults();
 try{localStorage.setItem("flekiii-lang",language);}catch{}
}
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setLanguage(b.dataset.lang)));
function setAccent(value){
 const a=["red","pink","blue"].includes(value)?value:"red";
 document.body.dataset.accent=a;
 document.querySelectorAll("[data-accent-choice]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.accentChoice===a)));
 try{localStorage.setItem("flekiii-accent",a);}catch{}
}
document.querySelectorAll("[data-accent-choice]").forEach(b=>b.addEventListener("click",()=>setAccent(b.dataset.accentChoice)));
let firstLang=navigator.language?.toLowerCase().startsWith("uk")?"uk":"en",firstAccent="red";
try{firstLang=localStorage.getItem("flekiii-lang")||firstLang;firstAccent=localStorage.getItem("flekiii-accent")||firstAccent;}catch{}
setAccent(firstAccent);setLanguage(firstLang);
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