// Fleki's Wrld House — deterministic shared model for 3D and 2D.
// Model is browser-local. There is no account/cloud sync in this release.
export const STORE_KEY="fleki_wrld_house_v1";
export const LIMIT=90;
export const HOUSE_TEMPLATES=[
{id:"loft",name:"Міський лофт",rooms:1,icon:"🏙️",tag:"Студія"},
{id:"cottage",name:"Затишний котедж",rooms:2,icon:"🏡",tag:"2 кімнати"},
{id:"starter",name:"Перший дім",rooms:3,icon:"🏠",tag:"3 кімнати"},
{id:"townhouse",name:"Таунхаус",rooms:4,icon:"🏘️",tag:"4 кімнати"},
{id:"family",name:"Сімейний дім",rooms:5,icon:"🌷",tag:"5 кімнат"},
{id:"villa",name:"Сонячна вілла",rooms:6,icon:"🌴",tag:"6 кімнат"},
{id:"mansion",name:"Великий маєток",rooms:7,icon:"🏰",tag:"7 кімнат"},
{id:"garage",name:"Гаражна майстерня",rooms:1,icon:"🚙",tag:"Гараж"},
{id:"garagehouse",name:"Дім із гаражем",rooms:3,icon:"🚗",tag:"2 кімнати + гараж"},
{id:"workshop",name:"Творчий комплекс",rooms:5,icon:"🛠️",tag:"4 кімнати + гараж"}
];
export const TEMPLATE_BY_ID=Object.fromEntries(HOUSE_TEMPLATES.map(h=>[h.id,h]));
export const TYPES=[
 {id:"sofa",name:"Cloud sofa",icon:"🛋️",w:2,d:1,group:"Living"},
 {id:"table",name:"Coffee table",icon:"☕",w:1.15,d:.9,group:"Living"},
 {id:"tv",name:"TV console",icon:"📺",w:1.6,d:.6,group:"Living"},
 {id:"rug",name:"Soft rug",icon:"◈",w:2.3,d:1.55,group:"Decor",overlay:true},
 {id:"plant",name:"Houseplant",icon:"🪴",w:.7,d:.7,group:"Decor"},
 {id:"lamp",name:"Floor lamp",icon:"💡",w:.6,d:.6,group:"Decor"},
 {id:"bed",name:"Cozy bed",icon:"🛏️",w:1.7,d:2.15,group:"Bedroom"},
 {id:"dresser",name:"Dresser",icon:"▥",w:1.3,d:.65,group:"Bedroom"},
 {id:"desk",name:"Work desk",icon:"🖥️",w:1.7,d:.9,group:"Studio"},
 {id:"chair",name:"Desk chair",icon:"🪑",w:.8,d:.8,group:"Studio"},
 {id:"pc",name:"Gaming PC",icon:"⌘",w:.6,d:.65,group:"Studio"},
 {id:"shelf",name:"Bookshelf",icon:"📚",w:1.35,d:.5,group:"Decor"},
 {id:"wardrobe",name:"Шафа",icon:"🚪",w:1.25,d:.65,group:"Bedroom"},
 {id:"nightstand",name:"Тумбочка",icon:"▤",w:.55,d:.55,group:"Bedroom"},
 {id:"mirror",name:"Дзеркало",icon:"🪞",w:.55,d:.4,group:"Decor"},
 {id:"bathtub",name:"Ванна",icon:"🛁",w:1.65,d:.85,group:"Bathroom"},
 {id:"sink",name:"Раковина",icon:"🚰",w:.75,d:.55,group:"Bathroom"},
 {id:"toilet",name:"Туалет",icon:"🚽",w:.6,d:.72,group:"Bathroom"},
 {id:"fridge",name:"Холодильник",icon:"🧊",w:.85,d:.76,group:"Kitchen"},
 {id:"stove",name:"Плита",icon:"🍳",w:.85,d:.75,group:"Kitchen"},
 {id:"dining",name:"Обідній стіл",icon:"🍽️",w:1.5,d:.9,group:"Kitchen"},
 {id:"kitchen",name:"Кухонна стійка",icon:"🥣",w:1.45,d:.68,group:"Kitchen"},
 {id:"car",name:"Автомобіль",icon:"🚗",w:1.65,d:2.3,group:"Garage"},
 {id:"tools",name:"Верстак",icon:"🛠️",w:1.35,d:.65,group:"Garage"},
 {id:"bike",name:"Велосипед",icon:"🚲",w:.55,d:1.35,group:"Garage"},
 {id:"arcade",name:"Аркадний автомат",icon:"🕹️",w:.8,d:.76,group:"Gaming"},
 {id:"console",name:"Консоль",icon:"🎮",w:.85,d:.48,group:"Gaming"},
 {id:"speaker",name:"Колонки",icon:"🔊",w:.55,d:.48,group:"Gaming"},
 {id:"painting",name:"Картина",icon:"🖼️",w:.9,d:.18,group:"Decor"},
 {id:"flower",name:"Квіти",icon:"🌻",w:.52,d:.52,group:"Decor"},
 {id:"piano",name:"Піаніно",icon:"🎹",w:1.55,d:.65,group:"Music"},
 {id:"guitar",name:"Гітара",icon:"🎸",w:.47,d:.56,group:"Music"},
 {id:"beanbag",name:"Пуф",icon:"🟣",w:.85,d:.85,group:"Living"},
 {id:"windowseat",name:"Лавка",icon:"🪑",w:1.3,d:.55,group:"Living"},
 {id:"pool",name:"Міні-більярд",icon:"🎱",w:1.75,d:1,group:"Gaming"}
];
export const TYPE_BY_ID=Object.fromEntries(TYPES.map(t=>[t.id,t]));
// In-place mutable structures: existing 2D and Three.js renderers share layouts.
export const ROOMS={};
export const WALLS=[];
export const START_ITEMS=[];
export let activeTemplate="starter";
const PALETTE=["#ded1c3","#e2c9d7","#cad5e4","#d9dbca","#e5d0b7","#d1d4d9","#d9bfc4"];
const HOUSE_ROOM_NAMES=["Вітальня","Спальня","Кабінет","Кухня","Ванна","Ігрова","Їдальня"];
function wallsFromRooms(){
 WALLS.length=0;
 // only internal partitions: avoid duplicate segments for the same dividing wall
 const seen=new Set();
 for(const a of Object.values(ROOMS))for(const b of Object.values(ROOMS)){
  if(a.id>=b.id)continue;
  let axis,at,from,to;
  if(Math.abs(a.x+a.w/2-(b.x-b.w/2))<.01||Math.abs(b.x+b.w/2-(a.x-a.w/2))<.01){
   axis="x";at=Math.abs(a.x+a.w/2-(b.x-b.w/2))<.01?a.x+a.w/2:b.x+b.w/2;
   from=Math.max(a.z-a.d/2,b.z-b.d/2);to=Math.min(a.z+a.d/2,b.z+b.d/2);
  }else if(Math.abs(a.z+a.d/2-(b.z-b.d/2))<.01||Math.abs(b.z+b.d/2-(a.z-a.d/2))<.01){
   axis="z";at=Math.abs(a.z+a.d/2-(b.z-b.d/2))<.01?a.z+a.d/2:b.z+b.d/2;
   from=Math.max(a.x-a.w/2,b.x-b.w/2);to=Math.min(a.x+a.w/2,b.x+b.w/2);
  }else continue;
  if(to-from<.5)continue;
  const k=[axis,at,from,to].join(":");if(seen.has(k))continue;seen.add(k);
  // a centered pass-through doorway ~1 unit wide
  const mid=(from+to)/2,gap=Math.min(.54,(to-from)*.23);
  if(mid-gap>from+.1)WALLS.push({axis,at,from,to:mid-gap});
  if(mid+gap<to-.1)WALLS.push({axis,at,from:mid+gap,to});
 }
}
export function setLayout(id="starter"){
 const t=TEMPLATE_BY_ID[id]||TEMPLATE_BY_ID.starter;
 activeTemplate=t.id;
 for(const k of Object.keys(ROOMS))delete ROOMS[k];
 const n=t.rooms,cols=n<=2?n:n<=4?2:n<=6?3:4,rows=Math.ceil(n/cols);
 let counter=0;
 for(let row=0;row<rows;row++){
  const count=Math.min(cols,n-counter),width=10/count,height=8/rows;
  for(let col=0;col<count;col++){
   const garage=(t.id==="garage"||t.id==="garagehouse"||t.id==="workshop")&&counter===n-1;
   const id="room"+(counter+1);
   const w=width,d=height,x=-5+(col+.5)*width,z=-4+(row+.5)*height;
   ROOMS[id]={id,name:garage?"Гараж":HOUSE_ROOM_NAMES[counter%HOUSE_ROOM_NAMES.length],x,z,w,d,
    color:garage?"#c1c5cd":PALETTE[counter%PALETTE.length],garage};
   counter++;
  }
 }
 wallsFromRooms();START_ITEMS.length=0;
 // Make initial furnishings fit even the smallest floorplan.
 const defaults=["sofa","bed","desk","dining","bathtub","arcade","table"];
 let next=1;
 for(const [index,room] of Object.values(ROOMS).entries()){
  const type=room.garage?"tools":defaults[index%defaults.length];
  const pos=findPlace(type,START_ITEMS,room.id);
  if(pos){START_ITEMS.push({...pos,id:"item-"+next++});}
 }
 return t;
}
export const cloneItems=items=>items.map(item=>({...item}));
export const rounded=n=>Math.round(n*4)/4;
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function size(item){
 const type=TYPE_BY_ID[item?.type];
 if(!type)return {w:0,d:0};
 return item.rot%2===1?{w:type.d,d:type.w}:{w:type.w,d:type.d};
}
export function validItem(item){
 if(!item||!TYPE_BY_ID[item.type]||typeof item.id!=="string"||!/^[-a-zA-Z0-9]{1,50}$/.test(item.id))return false;
 if(!Number.isFinite(item.x)||!Number.isFinite(item.z)||!Number.isInteger(item.rot)||item.rot<0||item.rot>3)return false;
 const {w,d}=size(item);
 const room=ROOMS[atRoom(item.x,item.z)];
 if(!room)return false;
 if(Math.abs(item.x-room.x)+w/2>room.w/2-.13||Math.abs(item.z-room.z)+d/2>room.d/2-.13)return false;
 return true;
}
export function canPlace(item,existing){
 if(!validItem(item))return false;
 const t=TYPE_BY_ID[item.type],s=size(item);
 for(const other of existing){
  if(other.id===item.id)continue;
  const o=TYPE_BY_ID[other.type];if(!o)continue;
  // A floor rug is allowed beneath furniture and doesn't block movement.
  if(t.overlay||o.overlay)continue;
  const d=size(other);
  if(Math.abs(item.x-other.x)<(s.w+d.w)/2+.09&&Math.abs(item.z-other.z)<(s.d+d.d)/2+.09)return false;
 }
 return true;
}
export function atRoom(x,z){
 const room=Object.values(ROOMS).find(p=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2);
 return room?.id||null;
}
export function findPlace(type,items,room="living"){
 if(!TYPE_BY_ID[type])return null;
 const preference=ROOMS[room]||ROOMS.living;
 const probes=[];
 for(let radius=0;radius<=7;radius+=.25)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/10){
  probes.push({x:rounded(preference.x+radius*Math.cos(angle)),z:rounded(preference.z+radius*Math.sin(angle))});
 }
 for(const pos of probes){
  if(atRoom(pos.x,pos.z)!==room)continue;
  const candidate={id:"draft",type,...pos,rot:0};
  if(canPlace(candidate,items))return candidate;
 }
 return null;
}
export function restore(raw){
 let parsed;
 try{parsed=JSON.parse(raw)}catch{return cloneItems(START_ITEMS)}
 if(!parsed||parsed.version!==1||!Array.isArray(parsed.items))return cloneItems(START_ITEMS);
 const result=[];
 for(const item of parsed.items.slice(0,LIMIT)){
  if(typeof item?.id!=="string"||result.some(x=>x.id===item.id))continue;
  const n={id:item.id,type:item.type,x:item.x,z:item.z,rot:item.rot};
  if(canPlace(n,result))result.push(n);
 }
 return result;
}
export function encode(items){
 return JSON.stringify({version:1,template:activeTemplate,items:items.map(({id,type,x,z,rot})=>({id,type,x,z,rot})),savedAt:Date.now()});
}

setLayout("starter");
