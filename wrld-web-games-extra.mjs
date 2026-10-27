/* Ten real, original browser mini-games. All are local-only entertainment;
   XP remains reserved for the server-verified math arcade. */
const choose=arr=>arr[Math.floor(Math.random()*arr.length)];
const shuffle=x=>{const a=[...x];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const escape=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lexicon=["GALAXY","PLANET","FOREST","PUZZLE","ORANGE","ROCKET","GARDEN","BRIDGE","CASTLE","SPRING","DRAGON","STREAM","WINTER","MARKET","FLOWER","SILVER"];
export const EXTRA_GAMES=Object.freeze(["wordmix","hangman","typing","sequence","colors","simon","mines","lights","slide","connect"]);
export function scramble(word){let s=shuffle(word.split("")).join("");if(s===word)s=word.split("").reverse().join("");return s}
export const slideAdjacent=(a,b)=>Math.abs((a%3)-(b%3))+Math.abs(Math.floor(a/3)-Math.floor(b/3))===1;
export function toggleLights(b,i){const out=b.slice();for(let k=0;k<16;k++)if(Math.abs(Math.floor(k/4)-Math.floor(i/4))+Math.abs(k%4-i%4)<=1)out[k]=!out[k];return out}
export function connectWinner(b){for(let row=0;row<6;row++)for(let col=0;col<7;col++){const p=b[row*7+col];if(!p)continue;for(const [dx,dy] of [[1,0],[0,1],[1,1],[-1,1]]){let ok=true;for(let n=1;n<4;n++){const x=col+dx*n,y=row+dy*n;if(x<0||x>6||y<0||y>5||b[y*7+x]!==p){ok=false;break}}if(ok)return p;}}return b.every(Boolean)?"draw":null}
export function dropChip(b,col,sign){if(!Number.isInteger(col)||col<0||col>6)return null;const n=b.slice();for(let row=5;row>=0;row--)if(!n[row*7+col]){n[row*7+col]=sign;return n}return null}
export function mineNeighbors(i){const out=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const r=Math.floor(i/5)+y,c=i%5+x;if((x||y)&&r>=0&&r<5&&c>=0&&c<5)out.push(r*5+c)}return out}

export function createExtraArcade({frame,t}){
 let id="",timer=0,word="",answer="",message="",score=0,turn=0;
 let stage=0,phase="",pattern=[],inputAt=0,misses=new Set(),letters=new Set();
 let grid=[],mines=new Set(),revealed=new Set(),flags=new Set(),flagMode=false,first=true,over=false,solution=0;
 let typed="",startAt=0,opts=[],target=0,offset=0,step=0;
 const tr=(en,uk)=>t("back")==="← Усі ігри"?uk:en;
 const setMessage=(en,uk)=>message=tr(en,uk);
 const resetTime=()=>{if(timer)clearTimeout(timer);timer=0};
 function cancel(){resetTime();id="";}
 function simonShow(){
  phase="show";resetTime();
  timer=setTimeout(()=>{if(id!=="simon")return;phase="input";inputAt=0;render()},Math.min(4300,1600+stage*270));
 }
 function makeSequence(){
  offset=2+Math.floor(Math.random()*13);step=1+Math.floor(Math.random()*10);
  target=offset+4*step;
  opts=shuffle(new Set([target,target+step,target-step,target+2*step])).slice(0,4);
 }
 function start(next){
  cancel();id=next;score=0;stage=0;turn=0;message="";over=false;
  if(next==="wordmix"){word=choose(lexicon);answer=scramble(word)}
  if(next==="hangman"){word=choose(lexicon);misses=new Set();letters=new Set()}
  if(next==="typing"){word=choose(["THE STARS ARE BRIGHT TONIGHT","GAMES MAKE EVERY DAY BETTER","SMALL STEPS CREATE BIG WINS","PRACTICE MAKES PROGRESS","CURIOUS MINDS DISCOVER MORE"]);startAt=performance.now()}
  if(next==="sequence")makeSequence();
  if(next==="colors"){const palette=["RED","BLUE","GREEN","PURPLE","ORANGE","YELLOW"];word=choose(palette);opts=shuffle([word,...shuffle(palette.filter(x=>x!==word)).slice(0,3)])}
  if(next==="simon"){pattern=[Math.floor(Math.random()*4),Math.floor(Math.random()*4)];stage=1;simonShow()}
  if(next==="mines"){grid=Array(25).fill(0);mines=new Set();revealed=new Set();flags=new Set();first=true;flagMode=false}
  if(next==="lights"){grid=Array(16).fill(false);for(let i=0;i<12;i++)grid=toggleLights(grid,Math.floor(Math.random()*16));if(grid.every(x=>!x))grid=toggleLights(grid,5)}
  if(next==="slide"){grid=[1,2,3,4,5,6,7,8,0];for(let i=0;i<75;i++){let empty=grid.indexOf(0);let options=grid.map((_,j)=>j).filter(j=>slideAdjacent(empty,j));let k=choose(options);[grid[k],grid[empty]]=[grid[empty],grid[k]]}if(grid.every((x,i)=>x===((i+1)%9)))[grid[7],grid[8]]=[grid[8],grid[7]]}
  if(next==="connect"){grid=Array(42).fill("");}
  render();
 }
 function show(id,inner){frame(id,inner)}
 function render(){
  if(!id)return;
  const status='<p class="wg-status" role="status">'+escape(message)+'</p>';
  if(id==="wordmix"){
   show(id,'<div class="wg-extra-center"><span class="wg-extra-kicker">🔤 '+tr("Unscramble the word","Склади слово")+'</span><div class="wg-extra-word">'+escape(answer)+'</div><form id="wg-extra-form" class="wg-guess-form"><input class="social-input" name="entry" type="text" maxlength="20" autocomplete="off" required placeholder="'+tr("Your word…","Твоє слово…")+'"><button class="btn primary">'+tr("Check","Перевірити")+'</button></form><p class="wg-stats">'+tr("Solved: ","Вгадано: ")+score+'</p>'+status+'</div>');
  }else if(id==="hangman"){
   const blanks=word.split("").map(x=>letters.has(x)?x:"_").join(" ");
   const finished=!blanks.includes("_"),lost=misses.size>=6;over=finished||lost;
   show(id,'<div class="wg-extra-center"><div class="wg-extra-word wg-word-slots">'+escape(blanks)+'</div><p class="wg-stats">'+tr("Mistakes: ","Помилки: ")+misses.size+'/6'+(lost?" · "+word:"")+'</p><div class="wg-letters">'+[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(c=>'<button type="button" data-wg="extra" data-command="letter" data-choice="'+c+'" '+(letters.has(c)||misses.has(c)||over?"disabled":"")+'>'+c+'</button>').join("")+'</div>'+status+'</div>');
  }else if(id==="typing"){
   show(id,'<div class="wg-extra-center"><span class="wg-extra-kicker">⌨ '+tr("Type the phrase accurately","Набери фразу без помилок")+'</span><p class="wg-type-prompt">'+escape(word)+'</p><form id="wg-extra-form" class="wg-guess-form"><input class="social-input" name="entry" type="text" maxlength="90" autocomplete="off" required placeholder="'+tr("Start typing…","Почни друкувати…")+'"><button class="btn primary">'+tr("Finish","Готово")+'</button></form>'+status+'</div>');
  }else if(id==="sequence"){
   show(id,'<div class="wg-extra-center"><p class="wg-extra-kicker">'+tr("What comes next?","Що буде далі?")+'</p><div class="wg-extra-word">'+[0,1,2,3].map(i=>offset+i*step).join(" · ")+' · ?</div><div class="wg-extra-choices">'+opts.map(n=>'<button type="button" data-wg="extra" data-command="sequence" data-choice="'+n+'">'+n+'</button>').join("")+'</div><p class="wg-stats">'+tr("Correct: ","Правильно: ")+score+'</p>'+status+'</div>');
  }else if(id==="colors"){
   const palette={RED:"#e84e66",BLUE:"#4d8fe8",GREEN:"#43b989",PURPLE:"#aa6de4",ORANGE:"#ed9854",YELLOW:"#e6cb53"};
   show(id,'<div class="wg-extra-center"><p class="wg-extra-kicker">'+tr("Name the color!","Назви колір!")+'</p><div class="wg-color-swatch" style="background:'+palette[word]+'"></div><div class="wg-extra-choices">'+opts.map(n=>'<button type="button" data-wg="extra" data-command="color" data-choice="'+n+'">'+escape(tr(n,({RED:"Червоний",BLUE:"Синій",GREEN:"Зелений",PURPLE:"Фіолетовий",ORANGE:"Помаранчевий",YELLOW:"Жовтий"})[n]))+'</button>').join("")+'</div><p class="wg-stats">'+tr("Correct: ","Правильно: ")+score+'</p>'+status+'</div>');
  }else if(id==="simon"){
   const icons=["🔴","🔵","🟢","🟡"];
   show(id,'<div class="wg-extra-center"><p class="wg-extra-kicker">'+(phase==="show"?tr("Memorize the pattern","Запам’ятай послідовність"):tr("Repeat the pattern","Повтори послідовність"))+'</p><div class="wg-simon-preview">'+(phase==="show"?pattern.map(x=>icons[x]).join("  "):"❔".repeat(pattern.length))+'</div><div class="wg-simon-pads">'+icons.map((x,i)=>'<button type="button" data-wg="extra" data-command="simon" data-choice="'+i+'" '+(phase!=="input"?"disabled":"")+'>'+x+'</button>').join("")+'</div><p class="wg-stats">'+tr("Level ","Рівень ")+stage+'</p>'+status+'</div>');
  }else if(id==="mines"){
   const icons=grid.map((_,i)=>{const rev=revealed.has(i),flag=flags.has(i),mine=mines.has(i);return '<button type="button" data-wg="extra" data-command="mine" data-choice="'+i+'" class="'+(rev?"wg-revealed ":"")+(mine&&rev?"wg-mine":"")+'" '+(rev||over?"disabled":"")+'>'+(rev?(mine?"💣":grid[i]||"·"):flag?"🚩":"✦")+'</button>'}).join("");
   show(id,'<div class="wg-extra-center"><p class="wg-extra-kicker">'+tr("Reveal safe cells, avoid five mines","Відкривай безпечні клітинки, оминай п’ять мін")+'</p><button class="btn" type="button" data-wg="extra" data-command="flag">🚩 '+(flagMode?tr("Flag mode ON","Позначення УВІМКНЕНО"):tr("Flag mode OFF","Позначення ВИМКНЕНО"))+'</button><div class="wg-mines-board">'+icons+'</div><p class="wg-stats">'+tr("Safe cells: ","Безпечних клітинок: ")+revealed.size+'/20</p>'+status+'</div>');
  }else if(id==="lights"){
   show(id,'<div class="wg-extra-center"><p class="wg-extra-kicker">'+tr("Turn off every light. A tap flips neighbors too.","Вимкни всі вогники. Натискання змінює сусідні.")+'</p><div class="wg-lights-board">'+grid.map((on,i)=>'<button type="button" class="'+(on?"wg-light-on":"")+'" data-wg="extra" data-command="light" data-choice="'+i+'">'+(on?"✦":"·")+'</button>').join("")+'</div><p class="wg-stats">'+tr("Moves: ","Ходи: ")+turn+'</p>'+status+'</div>');
  }else if(id==="slide"){
   show(id,'<div class="wg-extra-center"><p class="wg-extra-kicker">'+tr("Arrange 1–8 in order. Tap a tile next to the gap.","Склади числа 1–8 за порядком. Натискай сусідні з порожньою клітинкою.")+'</p><div class="wg-slide-board">'+grid.map((v,i)=>'<button type="button" class="'+(!v?"wg-gap":"")+'" data-wg="extra" data-command="slide" data-choice="'+i+'" '+(!v?"disabled":"")+'>'+(v||"")+'</button>').join("")+'</div><p class="wg-stats">'+tr("Moves: ","Ходи: ")+turn+'</p>'+status+'</div>');
  }else if(id==="connect"){
   show(id,'<div class="wg-extra-center"><p class="wg-extra-kicker">'+tr("Connect four. You are purple.","Збери чотири в ряд. Ти граєш фіолетовими.")+'</p><div class="wg-connect-board">'+grid.map((v,i)=>'<button type="button" class="wg-connect-cell '+(v==="P"?"wg-player":v==="C"?"wg-cpu":"")+'" data-wg="extra" data-command="connect" data-choice="'+i%7+'" '+(over?"disabled":"")+' aria-label="'+tr("Column ","Стовпець ")+(i%7+1)+'">'+(v?"●":"○")+'</button>').join("")+'</div>'+status+'</div>');
  }
 }
 const neighbors=(i)=>mineNeighbors(i);
 function reveal(i){
  if(revealed.has(i)||flags.has(i)||over)return;
  if(first){first=false;const available=shuffle(Array.from({length:25},(_,j)=>j).filter(j=>j!==i));mines=new Set(available.slice(0,5));grid=grid.map((_,j)=>mines.has(j)?-1:neighbors(j).filter(n=>mines.has(n)).length)}
  if(mines.has(i)){revealed.add(i);over=true;setMessage("Boom! Try another board.","Бум! Спробуй нове поле.");return}
  const stack=[i];
  while(stack.length){const j=stack.pop();if(revealed.has(j)||flags.has(j)||mines.has(j))continue;revealed.add(j);if(grid[j]===0)for(const k of neighbors(j))if(!revealed.has(k))stack.push(k)}
  if(revealed.size===20){over=true;setMessage("You cleared every safe cell! 🎉","Усі безпечні клітинки відкрито! 🎉")}
 }
 function connectPlay(col){
  if(over)return;
  const next=dropChip(grid,col,"P");if(!next)return;grid=next;
  let win=connectWinner(grid);
  if(win){over=true;setMessage(win==="P"?"You won! 🎉":"Draw!",win==="P"?"Ти переміг! 🎉":"Нічия!");return}
  let cpu=-1;
  for(const sign of ["C","P"]){
   for(let c=0;c<7;c++){
    const candidate=dropChip(grid,c,sign);
    if(candidate&&connectWinner(candidate)===sign){cpu=c;break}
   }
   if(cpu>=0)break;
  }
  if(cpu<0){const free=Array.from({length:7},(_,c)=>c).filter(c=>dropChip(grid,c,"C"));cpu=free.length?choose(free):-1}
  if(cpu>=0)grid=dropChip(grid,cpu,"C");
  win=connectWinner(grid);
  if(win){over=true;setMessage(win==="C"?"Computer connects four!":"Draw!",win==="C"?"Комп’ютер зібрав чотири!":"Нічия!")}
 }
 function action(cmd,value){
  if(!id)return;
  const n=Number(value);
  if(cmd==="letter"&&id==="hangman"&&!over&&/^[A-Z]$/.test(value)){
   if(!letters.has(value)&&!misses.has(value)){if(word.includes(value))letters.add(value);else misses.add(value)}
   const complete=word.split("").every(x=>letters.has(x));if(complete)setMessage("You guessed the word! 🎉","Слово вгадано! 🎉");else if(misses.size>=6)setMessage("The word was "+word,"Слово було "+word);
  }
  if(cmd==="sequence"&&id==="sequence"&&opts.includes(n)){if(n===target){score++;setMessage("Correct!","Правильно!")}else setMessage("The answer was "+target,"Правильна відповідь: "+target);makeSequence()}
  if(cmd==="color"&&id==="colors"&&opts.includes(value)){if(value===word){score++;setMessage("Correct!","Правильно!")}else setMessage("It was "+word,"Правильно: "+word);const palette=["RED","BLUE","GREEN","PURPLE","ORANGE","YELLOW"];word=choose(palette);opts=shuffle([word,...shuffle(palette.filter(x=>x!==word)).slice(0,3)])}
  if(cmd==="simon"&&id==="simon"&&phase==="input"&&n>=0&&n<4){
   if(pattern[inputAt]!==n){setMessage("Not quite — sequence restarted.","Помилка — почни спочатку.");pattern=[Math.floor(Math.random()*4),Math.floor(Math.random()*4)];stage=1;simonShow()}
   else{inputAt++;if(inputAt>=pattern.length){stage++;pattern.push(Math.floor(Math.random()*4));setMessage("Great memory!","Чудова пам'ять!");simonShow()}}
  }
  if(cmd==="flag"&&id==="mines")flagMode=!flagMode;
  if(cmd==="mine"&&id==="mines"&&n>=0&&n<25){if(flagMode){if(flags.has(n))flags.delete(n);else if(flags.size<5)flags.add(n)}else reveal(n)}
  if(cmd==="light"&&id==="lights"&&n>=0&&n<16){grid=toggleLights(grid,n);turn++;if(grid.every(x=>!x))setMessage("All lights off! You won! 🎉","Усі лампи вимкнені! Перемога! 🎉")}
  if(cmd==="slide"&&id==="slide"&&n>=0&&n<9){const empty=grid.indexOf(0);if(slideAdjacent(n,empty)){[grid[n],grid[empty]]=[grid[empty],grid[n]];turn++;if(grid.every((v,i)=>v===(i+1)%9))setMessage("Puzzle solved! 🎉","Головоломку складено! 🎉")}}
  if(cmd==="connect"&&id==="connect"&&n>=0&&n<=6)connectPlay(n);
  render();
 }
 function submit(form){
  if(!["wordmix","typing"].includes(id))return false;
  const entry=String(new FormData(form).get("entry")||"").trim().toUpperCase().replace(/\s+/g," ");
  if(!entry)return true;
  if(id==="wordmix"){if(entry===word){score++;setMessage("Correct! New word unlocked.","Правильно! Нове слово.");word=choose(lexicon);answer=scramble(word)}else setMessage("Try another arrangement.","Спробуй інший порядок букв.")}
  else {const now=performance.now();const seconds=Math.max(1,(now-(startAt||now-1000))/1000);startAt=now;if(entry===word){const wpm=Math.round(word.split(" ").length*60/seconds);setMessage("Excellent! "+wpm+" WPM","Чудово! "+wpm+" слів/хв");word=choose(["THE STARS ARE BRIGHT TONIGHT","GAMES MAKE EVERY DAY BETTER","SMALL STEPS CREATE BIG WINS","PRACTICE MAKES PROGRESS","CURIOUS MINDS DISCOVER MORE"])}else setMessage("Not quite. Match the phrase exactly.","Не зовсім. Введи фразу точно.")}
  render();return true;
 }
 return {start,render,action,submit,cancel,ids:EXTRA_GAMES};
}
