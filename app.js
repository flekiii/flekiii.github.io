(() => {
"use strict";
const ua={
navWork:"Проєкти",navAbout:"Про мене",navContact:"Контакти",
heroKicker:"НЕЗАЛЕЖНИЙ РОЗРОБНИК · УКРАЇНА",
heroTitle:'Перетворюю ідеї<br><em>на реальність.</em>',
heroLead:"Привіт, я flekiii. Створюю програми, цифрові продукти та ігри — від першого ескізу до речей, якими можна користуватися.",
explore:"Мої проєкти",contactMe:"Зв'язатися",age:"років",ideas:"ідей попереду",scroll:"ДИВИТИСЯ ПРОЄКТИ ↓",
selected:"ВИБРАНІ ПРОЄКТИ",workTitle:'Те, що я <em>створюю.</em>',workSubtitle:"Продукти, експерименти й ігрові світи, над якими я працюю.",
released:"ВИПУЩЕНО",beta:"БЕТА",building:"У РОЗРОБЦІ",
flekora:"Офлайн-простір для нотаток, завдань і концентрації. Для щоденної продуктивності на Linux.",
motion:"Анімовані шпалери та кастомізація робочого столу з акцентом на творчість і контроль.",
release:"Настільний застосунок, який спрощує публікацію та керування релізами програм.",
flik:"Мій власний редактор коду для зручної веб- та ігрової розробки.",
aurvex:"Моя команда й амбітна екосистема для ігор, авторів та цифрових продуктів.",
devive:"Психологічний 2D-горор із видом збоку у старому моторошному будинку.",
note:"✳ &nbsp; Частина проєктів уже випущена. Інші ще створюються.",
aboutLabel:"ПРО МЕНЕ",aboutTitle:'Допитливий розум.<br><em>Люблю створювати.</em>',
bioLead:"Я flekiii, 15-річний розробник з України та засновник AURVEX.",
bioText:"Мені подобається втілювати ідеї: експериментувати з інтерфейсами, створювати програми, вивчати розробку ігор та розбиратися, як усе працює зсередини. Кожен проєкт навчає мене чогось нового.",
skillDev:"РОЗРОБКА",skillTools:"ІНСТРУМЕНТИ",skillGames:"СТВОРЕННЯ ІГОР",skillFocus:"ЗАРАЗ У ФОКУСІ",focus:"Програми, ігри й незалежні продукти",
connect:"НА ЗВ'ЯЗКУ",contactTitle:"Є цікава ідея?<br><em>Створімо щось разом.</em>",
contactText:"Мені цікаві нові ідеї, творчі люди й незвичайні проєкти. Мене можна знайти тут.",
footerText:"Незалежний розробник. Завжди в процесі."
};
const original=new Map();
document.querySelectorAll("[data-t]").forEach(el=>original.set(el,el.innerHTML));
const rich=new Set(["heroTitle","workTitle","aboutTitle","contactTitle","note"]);
function lang(next){
const l=next==="uk"?"uk":"en";document.documentElement.lang=l;
document.querySelectorAll("[data-t]").forEach(el=>{
const key=el.dataset.t;
if(l==="en")el.innerHTML=original.get(el);
else if(Object.prototype.hasOwnProperty.call(ua,key)){
if(rich.has(key))el.innerHTML=ua[key];else el.textContent=ua[key];
}});
document.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===l)));
document.title=l==="uk"?"flekiii — Розробник":"flekiii — Developer & Creator";
try{localStorage.setItem("flekiii-lang",l);}catch{}
}
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>lang(b.dataset.lang)));
document.getElementById("year").textContent=String(new Date().getFullYear());
let saved=navigator.language&&navigator.language.startsWith("uk")?"uk":"en";
try{saved=localStorage.getItem("flekiii-lang")||saved;}catch{}
lang(saved);
})();