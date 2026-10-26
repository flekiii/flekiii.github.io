/* Browser arcade rules, shared with Node tests. */
export function shuffle(items,random=Math.random){
 const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
}
export const PAIRS=["🌙","🐈","🍓","🎮","⚡","🌈","🚀","🎧"];
export const memoryDeck=(random=Math.random)=>shuffle([...PAIRS,...PAIRS],random);
export function tttResult(b){
 for(const [a,c,d] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])
  if(b[a]&&b[a]===b[c]&&b[a]===b[d])return {winner:b[a],line:[a,c,d]};
 return b.every(Boolean)?{winner:"draw",line:[]}:null;
}
export function cpuMove(board){
 const free=board.map((v,i)=>v?-1:i).filter(i=>i>=0);
 if(!free.length)return -1;
 for(const sign of ["O","X"])for(const i of free){const b=[...board];b[i]=sign;if(tttResult(b)?.winner===sign)return i;}
 return [4,0,2,6,8,1,3,5,7].find(i=>free.includes(i));
}
