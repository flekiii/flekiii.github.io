import {memoryDeck,tttResult,cpuMove} from "./wrld-web-games-core.mjs";
const root=document.getElementById("wrld-web-games-root");
const endpoint="https://flekis-wrld-api.flekideveloper.workers.dev/me";
const L={
 gate:["Sign in to play","Увійди, щоб грати"],gateBody:["Web Games are exclusive to fleki's wrld members. Create your free account or sign in.","Web Games доступні лише користувачам fleki's wrld. Створи безкоштовний акаунт або увійди."],
 sign:["Sign in / Create account","Увійти / Створити акаунт"],note:["Account required · 2FA not required","Потрібен акаунт · 2FA не потрібна"],
 error:["We couldn't confirm your session. Please try again.","Не вдалося перевірити сесію. Спробуй ще."],retry:["Try again","Повторити"],
 checking:["Checking your account…","Перевіряємо акаунт…"],subtitle:["Choose a game. Play instantly in your browser.","Обери гру та грай одразу в браузері."],
 memory:["Memory Match","Знайди пару"],memoryAbout:["Find all eight matching pairs.","Знайди всі вісім пар карток."],ttt:["Tic Tac Toe","Хрестики-нулики"],tttAbout:["Try to beat the computer.","Спробуй перемогти комп'ютер."],
 reaction:["Reaction Test","Тест реакції"],reactionAbout:["Wait for green, then click as fast as you can.","Дочекайся зеленого та натисни якнайшвидше."],
 play:["Play now","Грати"],back:["← All games","← Усі ігри"],again:["New game","Нова гра"],moves:["Moves","Ходи"],pairs:["Pairs","Пари"],
 wonMemory:["All pairs found. Nice work! 🎉","Усі пари знайдено! Молодець! 🎉"],yourTurn:["Your turn: X","Твій хід: X"],won:["You win! 🎉","Ти переміг! 🎉"],lost:["Computer wins. Try again!","Комп'ютер переміг. Спробуй ще!"],draw:["It's a draw!","Нічия!"],
 ready:["Press Start to begin.","Натисни Старт, щоб почати."],start:["Start","Старт"],wait:["Wait for green…","Чекай на зелений…"],tap:["CLICK!","ТИСНИ!"],
 early:["Too early! Try again.","Зарано! Спробуй ще."],result:["Your reaction","Твоя реакція"]
};
const t=k=>L[k][document.documentElement.lang==="uk"?1:0];
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getToken=()=>{try{return sessionStorage.getItem("fw-token")||""}catch{return ""}};
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
 const items=[["memory","🧠"],["ttt","⭕"],["reaction","⚡"]];
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
function render(){if(!onPage())return;if(!allowed())return gate();if(view==="memory")memoryView();else if(view==="ttt")tttView();else if(view==="reaction")reactionView();else menu()}
root.addEventListener("click",async e=>{
 const b=e.target.closest("[data-wg]");if(!b||!root.contains(b))return;
 const action=b.dataset.wg;
 if(action==="sign"){document.querySelector('#dock [data-go="profile"]')?.click();return}
 if(action==="retry"){void verify(true);return}
 if(!allowed()){revoke();gate();return}
 if(action==="launch"){const key=b.dataset.game;if(["memory","ttt","reaction"].includes(key)&&await verify())newGame(key);return}
 if(action==="back"){cancel();view="menu";render();return}
 if(action==="again"){newGame(view);return}
 if(action==="card"&&view==="memory")card(Number(b.dataset.i));
 if(action==="square"&&view==="ttt")square(Number(b.dataset.i));
 if(action==="react"&&view==="reaction")reactionClick();
});
window.addEventListener("wrld:page-change",e=>{if(e.detail?.id==="web-games")void verify(true);else revoke()});
window.addEventListener("fw-auth-changed",()=>{revoke();if(onPage())void verify(true)});
window.addEventListener("wrld:language-change",()=>{if(onPage())render()});
window.addEventListener("focus",()=>{if(onPage())void verify()});
setInterval(()=>{if(onPage())void verify()},60000);
if(onPage())void verify(true);
