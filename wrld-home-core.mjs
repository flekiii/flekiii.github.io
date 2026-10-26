// Fleki's Wrld House — deterministic shared model for 3D and 2D.
// Model is browser-local. There is no account/cloud sync in this release.
export const STORE_KEY="fleki_wrld_house_v1";
export const LIMIT=36;
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
 {id:"shelf",name:"Bookshelf",icon:"📚",w:1.35,d:.5,group:"Decor"}
];
export const TYPE_BY_ID=Object.fromEntries(TYPES.map(t=>[t.id,t]));
export const ROOMS={
 living:{name:"Living room",x:-1.75,z:-1.9,color:"#dbcdbb"},
 bedroom:{name:"Bedroom",x:-2.55,z:2.15,color:"#e1cddd"},
 studio:{name:"Studio",x:2.6,z:2.15,color:"#cbd5e4"}
};
export const WALLS=[
 {axis:"z",at:.5,from:-5,to:-3.1},
 {axis:"z",at:.5,from:-2.15,to:1.7},
 {axis:"z",at:.5,from:2.8,to:5},
 {axis:"x",at:.45,from:.5,to:1.75},
 {axis:"x",at:.45,from:2.65,to:4}
];
export const START_ITEMS=[
 {id:"item-1",type:"sofa",x:-2.15,z:-1.65,rot:0},
 {id:"item-2",type:"table",x:-2.2,z:-2.85,rot:0},
 {id:"item-3",type:"tv",x:1.45,z:-3.3,rot:0},
 {id:"item-4",type:"rug",x:-2.05,z:-2.12,rot:0},
 {id:"item-5",type:"plant",x:-4.3,z:-3.2,rot:0},
 {id:"item-6",type:"bed",x:-2.8,z:2.3,rot:0},
 {id:"item-7",type:"dresser",x:-.85,z:3.15,rot:1},
 {id:"item-8",type:"desk",x:2.5,z:3.25,rot:0},
 {id:"item-9",type:"chair",x:2.5,z:1.98,rot:0},
 {id:"item-10",type:"lamp",x:4.3,z:2.6,rot:0}
];
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
 if(Math.abs(item.x)+w/2>4.89||Math.abs(item.z)+d/2>3.88)return false;
 for(const wall of WALLS){
  if(wall.axis==="z"&&Math.abs(item.z-wall.at)<d/2+.105&&item.x+w/2>wall.from&&item.x-w/2<wall.to)return false;
  if(wall.axis==="x"&&Math.abs(item.x-wall.at)<w/2+.105&&item.z+d/2>wall.from&&item.z-d/2<wall.to)return false;
 }
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
 if(z<.5)return "living";
 return x<.45?"bedroom":"studio";
}
export function findPlace(type,items,room="living"){
 if(!TYPE_BY_ID[type])return null;
 const preference=ROOMS[room]||ROOMS.living;
 const probes=[];
 for(let radius=0;radius<=5;radius+=.25)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/10){
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
 return JSON.stringify({version:1,items:items.map(({id,type,x,z,rot})=>({id,type,x,z,rot})),savedAt:Date.now()});
}
