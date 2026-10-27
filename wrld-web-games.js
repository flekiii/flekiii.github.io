import {memoryDeck,tttResult,cpuMove,shift2048,newTile2048,canShift2048} from "./wrld-web-games-core.mjs";
const root=document.getElementById("wrld-web-games-root");
const endpoint="https://flekis-wrld-api.flekideveloper.workers.dev/me";
const L={
 gate:["Sign in to play","Увійди, щоб грати"],gateBody:["Web Games are exclusive to fleki's wrld members. Create your free account or sign in.","Web Games доступні лише користувачам fleki's wrld. Створи безкоштовний акаунт або увійди."],
 sign:["Sign in / Create account","Увійти / Створити акаунт"],note:["Account required · 2FA not required","Потрібен акаунт · 2FA не потрібна"],
 error:["We couldn't confirm your session. Please try again.","Не вдалося перевірити сесію. Спробуй ще."],retry:["Try again","Повторити"],
 checking:["Checking your account…","Перевіряємо акаунт…"],subtitle:["Choose a game. Play instantly in your browser.","Обери гру та грай одразу в браузері."],
 memory:["Memory Match","Знайди пару"],memoryAbout:["Find all eight matching pairs.","Знайди всі вісім пар карток."],ttt:["Tic Tac Toe","Хрестики-нулики"],tttAbout:["Try to beat the computer.","Спробуй перемогти комп'ютер."],
 reaction:["Reaction Test","Тест реакції"],reactionAbout:["Wait for green, then click as fast as you can.","Дочекайся зеленого та натисни якнайшвидше."],
 merge:["2048","2048"],mergeAbout:["Merge matching number tiles to reach 2048.","Об’єднуй плитки, щоб досягти 2048."],
 guess:["Guess the Number","Вгадай число"],guessAbout:["Find a hidden number from 1 to 100.","Відгадай число від 1 до 100."],
 rps:["Rock Paper Scissors","Камінь ножиці папір"],rpsAbout:["Challenge the computer to a quick match.","Зіграй проти комп’ютера."],
 coin:["Coin Flip","Орел чи решка"],coinAbout:["Predict heads or tails.","Вгадай орла чи решку."],
 dice:["Dice Duel","Дуель кубиків"],diceAbout:["Roll against the computer.","Грай у кубики з комп’ютером."],
 higher:["Higher or Lower","Більше чи менше"],higherAbout:["Predict the next number.","Вгадай наступне число."],
 odd:["Odd or Even","Парне чи непарне"],oddAbout:["Predict parity.","Вгадай парність числа."],
 mathadd:["Math Sprint · Addition","Математика · Додавання"],mathaddAbout:["Solve server-checked sums for XP.","Розв’язуй приклади за XP."],
 mathmultiply:["Math Sprint · Multiply","Математика · Множення"],mathmultiplyAbout:["Solve server-checked products for XP.","Розв’язуй множення за XP."],
 play:["Play now","Грати"],back:["← All games","← Усі ігри"],again:["New game","Нова гра"],moves:["Moves","Ходи"],pairs:["Pairs","Пари"],
 wonMemory:["All pairs found. Nice work! 🎉","Усі пари знайдено! Молодець! 🎉"],yourTurn:["Your turn: X","Твій хід: X"],won:["You win! 🎉","Ти переміг! 🎉"],lost:["Computer wins. Try again!","Комп'ютер переміг. Спробуй ще!"],draw:["It's a draw!","Нічия!"],
 ready:["Press Start to begin.","Натисни Старт, щоб почати."],start:["Start","Старт"],wait:["Wait for green…","Чекай на зелений…"],tap:["CLICK!","ТИСНИ!"],
 early:["Too early! Try again.","Зарано! Спробуй ще."],result:["Your reaction","Твоя реакція"]
};
const t=k=>L[k][document.documentElement.lang==="uk"?1:0];
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getToken=()=>{try{return sessionStorage.getItem("fw-token")||""}catch{return ""}};
let mergeGrid=Array(16).fill(0),mergeScore=0,guessNumber=0,guessTries=0,guessText="",rpsText="",rpsWins=0;
let miniScore=0,miniInfo="",miniPrevious=7,mathRound=null,mathInfo="",mathBusy=false;
let validated="",user=null,view="menu",deck=[],up=[],matched=new Set(),moves=0,locked=false,board=[],result=null,react="ready",reactionAt=0,reactMs=null,timeout=0,nonce=0,request=0;
const onPage=()=>document.getElementById("page-web-games")?.classList.contains("active");
const allowed=()=>!!(validated&&validated===getToken()&&user);
function cancel(){clearTimeout(timeout);timeout=0;nonce++}
function revoke(){request++;validated="";user=null;view="menu";cancel()}
function gate(error=false){
 root.innerHTML='<div class="wg-gate"><div class="wg-gate-icon">🎮</div><span class="overline">FLEKI\'S WRLD ARCADE</span><h2>'+t("gate")+'</h2><p>'+t("gateBody")+'</p>'+(error?'<p role="alert">'+t("error")+'</p>':'')+'<div class="wg-actions"><button class="btn primary" data-wg="sign">'+t("sign")+'</button>'+(error?'<button class="btn" data-wg="retry">'+t("retry")+'</button>':'')+'</div><p class="wg-note">'+t("note")+'</p></div>';
}
async function verify(showLoading=false){
 if(!onPage())return false;
 const id=++request,key=getToken();
 if(!key){revoke();gate();return false}
 if(showLoading)root.innerHTML='<div class="wg-loading" role="status">'+t("checking")+'</div>';
 try{
  const res=await fetch(endpoint,{headers:{Authorization:"Bearer "+key,Accept:"application/json"},cache:"no-store",mode:"cors"});
  if(id!==request||key!==getToken()||!onPage())return false;
  if(!res.ok){revoke();gate();return false}
  const data=await res.json();
  if(!data?.user?.id){revoke();gate(true);return false}
  if(validated!==key||data.user.id!==user?.id){view="menu";cancel()}
  validated=key;user=data.user;render();return true;
 }catch{if(id===request&&onPage()){revoke();gate(true)}return false}
}
function menu(){
 const items=[["memory","🧠"],["ttt","⭕"],["reaction","⚡"],["merge","🔢"],["guess","🎯"],["rps","✊"],["coin","🪙"],["dice","🎲"],["higher","🃏"],["odd","🔮"],["mathadd","➕"],["mathmultiply","✖️"]];
 root.innerHTML='<div class="wg-head"><p>'+t("subtitle")+'</p><span class="wg-account">● @'+escape(user.username)+'</span></div><div class="wg-grid">'+items.map(([id,icon])=>
  '<button class="wg-tile" data-wg="launch" data-game="'+id+'"><span class="wg-thumb">'+icon+'</span><strong>'+t(id)+'</strong><span class="wg-desc">'+t(id+"About")+'</span><span class="wg-play">'+t("play")+' ↗</span></button>').join("")+'</div>';
}
function frame(id,inside){
 root.innerHTML='<article class="wg-panel"><div class="wg-panel-head"><div><span class="overline">WEB GAMES</span><h2>'+t(id)+'</h2></div><button class="btn" data-wg="back">'+t("back")+'</button></div>'+inside+'<div class="wg-actions"><button class="btn primary" data-wg="again">'+t("again")+'</button></div></article>';
}
function newGame(id){
 cancel();view=id;
 if(id==="memory"){deck=memoryDeck();up=[];matched=new Set();moves=0;locked=false}
 if(id==="ttt"){board=Array(9).fill("");result=null}
 if(id==="reaction"){react="ready";reactionAt=0;reactMs=null}
 if(id==="merge"){mergeGrid=newTile2048(newTile2048(Array(16).fill(0)));mergeScore=0}
 if(id==="guess"){guessNumber=1+Math.floor(Math.random()*100);guessTries=0;guessText=""}
 if(id==="rps"){rpsWins=0;rpsText=""}
 if(["coin","dice","higher","odd"].includes(id)){miniScore=0;miniInfo="";miniPrevious=1+Math.floor(Math.random()*13)}
 if(["mathadd","mathmultiply"].includes(id)){mathRound=null;mathInfo="";void mathStart()}
 render();
}
function memoryView(){
 const tiles=deck.map((icon,i)=>{const flipped=matched.has(i)||up.includes(i);return '<button data-wg="card" data-i="'+i+'" class="'+(matched.has(i)?"wg-matched":flipped?"wg-up":"")+'" aria-label="'+(flipped?icon:"Hidden card")+'" '+(matched.has(i)?"disabled":"")+'>'+(flipped?icon:"✦")+'</button>'}).join("");
 frame("memory",'<div class="wg-stats">'+t("moves")+': '+moves+' · '+t("pairs")+': '+(matched.size/2)+'/8</div><div class="wg-memory">'+tiles+'</div><p class="wg-status" role="status">'+(matched.size===16?t("wonMemory"):t("memoryAbout"))+'</p>');
}
function card(i){
 if(locked||i<0||i>=16||matched.has(i)||up.includes(i))return;
 up.push(i);
 if(up.length===2){moves++;if(deck[up[0]]===deck[up[1]]){up.forEach(x=>matched.add(x));up=[]}
 else{locked=true;const turn=nonce;timeout=setTimeout(()=>{if(turn!==nonce||!allowed()||!onPage())return;up=[];locked=false;memoryView()},850)}}
 memoryView();
}
function tttView(){
 const buttons=board.map((v,i)=>'<button data-wg="square" data-i="'+i+'" aria-label="Square '+(i+1)+'" class="'+(result?.line?.includes(i)?"wg-win":"")+'" '+(v||result?"disabled":"")+'>'+v+'</button>').join("");
 const text=!result?t("yourTurn"):result.winner==="X"?t("won"):result.winner==="O"?t("lost"):t("draw");
 frame("ttt",'<div class="wg-ttt">'+buttons+'</div><p class="wg-status" role="status">'+text+'</p>');
}
function square(i){
 if(result||i<0||i>=9||board[i])return;
 board[i]="X";result=tttResult(board);
 if(!result){const cpu=cpuMove(board);if(cpu>=0)board[cpu]="O";result=tttResult(board)}
 tttView();
}
function reactionView(){
 const label=react==="ready"?t("start"):react==="waiting"?t("wait"):react==="go"?t("tap"):react==="early"?t("early"):reactMs+" ms";
 const instruction=react==="result"?t("result")+": "+reactMs+" ms":react==="early"?t("early"):t("reactionAbout");
 frame("reaction",'<button class="wg-reaction '+react+'" data-wg="react">'+label+'</button><p class="wg-status" role="status">'+instruction+'</p>');
}
function reactionClick(){
 if(react==="waiting"){cancel();react="early";reactionView();return}
 if(react==="go"){reactMs=Math.max(0,Math.round(performance.now()-reactionAt));react="result";reactionView();return}
 if(react==="ready"||react==="result"||react==="early"){
  cancel();react="waiting";reactMs=null;reactionView();
  const turn=nonce;timeout=setTimeout(()=>{if(turn!==nonce||!allowed()||!onPage())return;react="go";reactionAt=performance.now();reactionView()},1400+Math.random()*2600);
 }
}

function mergeView(){
 const body='<div class="wg-stats">'+tr2048()+'</div><div class="wg-2048">'+mergeGrid.map(v=>'<div class="wg-number" data-v="'+v+'">'+(v||"")+'</div>').join("")+'</div><div class="wg-arrows"><button data-wg="move" data-dir="up" aria-label="Up">↑</button><button data-wg="move" data-dir="left" aria-label="Left">←</button><button data-wg="move" data-dir="down" aria-label="Down">↓</button><button data-wg="move" data-dir="right" aria-label="Right">→</button></div><p class="wg-status">'+(canShift2048(mergeGrid)?tr2048help():tr2048over())+'</p>';
 frame("merge",body);
}
const tr2048=()=>en2048("Score: ","Рахунок: ")+mergeScore;
const en2048=(en,uk)=>document.documentElement.lang==="uk"?uk:en;
const tr2048help=()=>en2048("Arrow keys or buttons to move tiles.","Використовуй стрілки чи кнопки для руху.");
const tr2048over=()=>en2048("No moves left. Try again!","Немає ходів. Спробуй ще!");
function shift(direction){if(!canShift2048(mergeGrid))return;const next=shift2048(mergeGrid,direction);if(!next.moved)return;mergeGrid=newTile2048(next.board);mergeScore+=next.points;mergeView()}
function guessView(){
 const title=en2048("Tries: ","Спроби: ")+guessTries;
 frame("guess",'<p class="wg-status">'+title+'</p><form id="wg-guess-form" class="wg-guess-form"><input class="social-input" name="guess" type="number" min="1" max="100" inputmode="numeric" required placeholder="1–100"><button class="btn primary" type="submit">'+en2048("Guess","Вгадати")+'</button></form><p class="wg-status" role="status">'+guessText+'</p>');
}
function guessIt(n){
 if(!Number.isInteger(n)||n<1||n>100)return;
 guessTries++;
 guessText=n===guessNumber?en2048("Correct! 🎉","Правильно! 🎉"):n<guessNumber?en2048("Try higher ↑","Спробуй більше ↑"):en2048("Try lower ↓","Спробуй менше ↓");
 guessView();
}
function rpsView(){
 frame("rps",'<div class="wg-stats">'+en2048("Your wins: ","Твої перемоги: ")+rpsWins+'</div><div class="wg-rps">'+[["rock","✊"],["paper","✋"],["scissors","✌️"]].map(([k,icon])=>'<button data-wg="rps-pick" data-pick="'+k+'" aria-label="'+k+'">'+icon+'</button>').join("")+'</div><p class="wg-status" role="status">'+(rpsText||en2048("Choose your move","Обери свій хід"))+'</p>');
}
function playRps(pick){
 const choices=["rock","paper","scissors"],opponent=choices[Math.floor(Math.random()*3)],win=(pick==="rock"&&opponent==="scissors")||(pick==="paper"&&opponent==="rock")||(pick==="scissors"&&opponent==="paper");
 if(win)rpsWins++;
 rpsText=en2048("Computer: ","Комп’ютер: ")+opponent+" · "+(pick===opponent?en2048("Draw!","Нічия!"):win?en2048("You win! 🎉","Ти переміг! 🎉"):en2048("Computer wins","Переміг комп’ютер"));
 rpsView();
}
function miniView(){
 const id=view,choices=id==="coin"?[["heads","🪙 Heads"],["tails","🌙 Tails"]]:id==="dice"?[["roll","🎲 Roll"]]:id==="higher"?[["higher","↑ Higher"],["lower","↓ Lower"]]:[["odd","Odd"],["even","Even"]];
 frame(id,'<div class="wg-mini-arena"><h3>🏆 '+en2048("Score: ","Рахунок: ")+miniScore+'</h3><div class="wg-card-number">'+(id==="higher"?miniPrevious:({coin:"🪙",dice:"🎲",odd:"🔮"}[id]))+'</div><div class="wg-mini-buttons">'+choices.map(([key,label])=>'<button type="button" data-wg="mini" data-choice="'+key+'">'+label+'</button>').join("")+'</div><p class="wg-status">'+(miniInfo||en2048("Choose!","Обирай!"))+'</p></div>');
}
function miniPlay(choice){
 let win=false,result="";
 if(view==="coin"){const x=Math.random()<.5?"heads":"tails";win=choice===x;result=x}
 if(view==="dice"){const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);win=a>b;result=a+" vs "+b}
 if(view==="higher"){const n=1+Math.floor(Math.random()*13);win=choice==="higher"?n>miniPrevious:n<miniPrevious;result=miniPrevious+" → "+n;miniPrevious=n}
 if(view==="odd"){const n=1+Math.floor(Math.random()*100);win=choice===(n%2?"odd":"even");result=String(n)}
 if(win)miniScore++;
 miniInfo=result+" · "+(win?en2048("Correct! ✅","Правильно! ✅"):en2048("Try again","Спробуй ще"));miniView();
}
async function mathStart(){
 if(mathBusy||!allowed())return;
 const mode=view,auth=getToken();mathBusy=true;mathRound=null;mathInfo=en2048("Loading question…","Завантажуємо запитання…");render();
 try{
  const response=await fetch("https://flekis-wrld-api.flekideveloper.workers.dev/arcade/start",{method:"POST",headers:{Authorization:"Bearer "+auth,"Content-Type":"application/json"},body:JSON.stringify({mode:mode==="mathadd"?"add":"multiply"}),cache:"no-store"});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||"Challenge unavailable");
  if(view===mode&&getToken()===auth){mathRound=data;mathInfo=""}
 }catch(e){mathInfo=e.message}finally{mathBusy=false;if(view===mode)render()}
}
function mathView(){
 frame(view,'<div class="wg-mini-arena"><span class="overline">SERVER-VERIFIED · +5 XP</span><div class="wg-card-number">'+escape(mathRound?.question||"…")+'</div>'+
 (mathRound?'<form id="wg-math-form" class="wg-guess-form"><input class="social-input" name="answer" type="number" required min="0" max="500" inputmode="numeric" placeholder="Answer"><button type="submit" class="btn primary">'+en2048("Check","Перевірити")+'</button></form>':'<button type="button" class="btn primary" data-wg="math-start">'+en2048("Next round","Новий раунд")+'</button>')+
 '<p class="wg-status" role="status">'+escape(mathInfo||en2048("Solve and earn XP.","Вирішуй і заробляй XP."))+'</p></div>');
}
async function mathAnswer(value){
 if(!mathRound||mathBusy||!Number.isInteger(value))return;
 const round=mathRound,mode=view,auth=getToken();mathRound=null;mathBusy=true;
 try{
  const response=await fetch("https://flekis-wrld-api.flekideveloper.workers.dev/arcade/answer",{method:"POST",headers:{Authorization:"Bearer "+auth,"Content-Type":"application/json"},body:JSON.stringify({id:round.id,answer:value}),cache:"no-store"});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||"Answer unavailable");
  mathInfo=(data.correct?"✅ ":"❌ ")+en2048("Answer: ","Відповідь: ")+data.answer+(data.correct?" · +5 XP":"");
  window.WrldProfile?.refresh?.();
 }catch(e){mathInfo=e.message}finally{mathBusy=false;if(view===mode)render()}
}
function render(){if(!onPage())return;if(!allowed())return gate();if(view==="memory")memoryView();else if(view==="ttt")tttView();else if(view==="reaction")reactionView();else if(view==="merge")mergeView();else if(view==="guess")guessView();else if(view==="rps")rpsView();else if(["coin","dice","higher","odd"].includes(view))miniView();else if(["mathadd","mathmultiply"].includes(view))mathView();else menu()}
root.addEventListener("click",async e=>{
 const b=e.target.closest("[data-wg]");if(!b||!root.contains(b))return;
 const action=b.dataset.wg;
 if(action==="sign"){document.querySelector('#dock [data-go="profile"]')?.click();return}
 if(action==="retry"){void verify(true);return}
 if(!allowed()){revoke();gate();return}
 if(action==="launch"){const key=b.dataset.game;if(["memory","ttt","reaction","merge","guess","rps","coin","dice","higher","odd","mathadd","mathmultiply"].includes(key)&&await verify())newGame(key);return}
 if(action==="back"){cancel();view="menu";render();return}
 if(action==="again"){newGame(view);return}
 if(action==="card"&&view==="memory")card(Number(b.dataset.i));
 if(action==="square"&&view==="ttt")square(Number(b.dataset.i));
 if(action==="react"&&view==="reaction")reactionClick();
 if(action==="move"&&view==="merge")shift(b.dataset.dir);
 if(action==="rps-pick"&&view==="rps")playRps(b.dataset.pick);
 if(action==="mini"&&["coin","dice","higher","odd"].includes(view))miniPlay(b.dataset.choice);
 if(action==="math-start"&&["mathadd","mathmultiply"].includes(view))void mathStart();
});
window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="web-games")void verify(true);else revoke()});
document.addEventListener("submit",e=>{
 if(e.target.id==="wg-guess-form"){e.preventDefault();if(onPage()&&allowed()&&view==="guess")guessIt(Number(new FormData(e.target).get("guess")))}
 if(e.target.id==="wg-math-form"){e.preventDefault();if(onPage()&&allowed()&&["mathadd","mathmultiply"].includes(view))void mathAnswer(Number(new FormData(e.target).get("answer")))}
});
window.addEventListener("keydown",e=>{if(!onPage()||!allowed()||view!=="merge"||e.target.closest("input,textarea,select,[contenteditable]"))return;const d={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"}[e.key];if(d){e.preventDefault();shift(d)}});
window.addEventListener("fw-auth-changed",()=>{revoke();if(onPage())void verify(true)});
window.addEventListener("wrld:language-change",()=>{if(onPage())render()});
window.addEventListener("focus",()=>{if(onPage())void verify()});
setInterval(()=>{if(onPage())void verify()},60000);
if(onPage())void verify(true);
