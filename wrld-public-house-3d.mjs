/* Public read-only 3D house viewer: same furniture modeling as the interactive home editor. */
import {TEMPLATE_BY_ID,TYPE_BY_ID} from "./wrld-home-core.mjs?v=2";
const COLORS=["#ded1c3","#e2c9d7","#cad5e4","#d9dbca","#e5d0b7","#d1d4d9","#d9bfc4"];
export function publicHouseRooms(template){
 const plan=TEMPLATE_BY_ID[template]||TEMPLATE_BY_ID.starter;
 const n=plan.rooms,cols=n<=2?n:n<=4?2:n<=6?3:4,rows=Math.ceil(n/cols),out=[];
 let i=0;
 for(let row=0;row<rows;row++){
  const count=Math.min(cols,n-i),w=10/count,d=8/rows;
  for(let col=0;col<count;col++){
   const garage=["garage","garagehouse","workshop"].includes(plan.id)&&i===n-1;
   out.push({id:"room"+(i+1),x:-5+(col+.5)*w,z:-4+(row+.5)*d,w,d,garage,
    color:garage?"#c1c5cd":COLORS[i%COLORS.length]});i++;
  }
 }
 return out;
}
export function publicHouseWalls(rooms){
 const out=[],seen=new Set();
 for(const a of rooms)for(const b of rooms){
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
  const key=[axis,at,from,to].join(":");if(seen.has(key))continue;seen.add(key);
  const mid=(from+to)/2,gap=Math.min(.54,(to-from)*.23);
  if(mid-gap>from+.1)out.push({axis,at,from,to:mid-gap});
  if(mid+gap<to-.1)out.push({axis,at,from:mid+gap,to});
 }
 return out;
}
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
export async function mountPublicHouse3D(stage,house,isCurrent=()=>true){
 if(!stage?.isConnected||!isCurrent())return null;
 const THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
 if(!stage.isConnected||!isCurrent())return null;
 let renderer,resizeObserver,frame=0,disposed=false;
 try{
  renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:"default"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  renderer.domElement.className="wrld-public-webgl";
  renderer.domElement.setAttribute("aria-label","Interactive 3D house viewer");
  stage.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color("#28263e");
  const camera=new THREE.PerspectiveCamera(44,1,.1,100);
  const env={THREE,renderer,scene,camera,target:{x:0,z:0},azimuth:.64,elevation:.84,distance:18.5,furniture:new Map()};
  const rooms=publicHouseRooms(house.template),walls=publicHouseWalls(rooms);
  scene.add(new THREE.HemisphereLight(0xebedff,0x72556d,2.55));
  const sun=new THREE.DirectionalLight(0xffe6cc,3.15);sun.position.set(-4,9,3);scene.add(sun);
  const fill=new THREE.DirectionalLight(0xb5b7ff,1.05);fill.position.set(6,7,-5);scene.add(fill);
  const materials={};
  const mat=(color,roughness=.8)=>{const k=color+"-"+roughness;return materials[k]??(materials[k]=new THREE.MeshStandardMaterial({color,roughness}))};
  const box=(target,x,y,z,w,h,d,color)=>{
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);target.add(mesh);return mesh;
  };
  const cyl=(target,x,y,z,r,h,color)=>{
   const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.93,h,12),mat(color));o.position.set(x,y,z);target.add(o);return o;
  };
  const ball=(target,x,y,z,r,color)=>{
   const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),mat(color));o.position.set(x,y,z);target.add(o);return o;
  };
  const floor=(x,z,w,d,c)=>box(scene,x,-.13,z,w,.22,d,c);
  for(const room of rooms)floor(room.x,room.z,room.w,room.d,room.color);
  // Exterior walls have no full-height front: a playable dollhouse cutaway.
  const wall=(x,z,w,d,h=1.8)=>{box(scene,x,h/2,z,w,h,d,"#f5ede7");box(scene,x,h-.055,z,w+.03,.09,d+.03,"#b69cb8")};
  wall(-5,0,.16,8);wall(5,0,.16,8);wall(0,4,10,.16);
  wall(-2.85,-4,4.3,.16,.45);wall(2.85,-4,4.3,.16,.45);
  for(const w of walls){
   if(w.axis==="z")wall((w.from+w.to)/2,w.at,w.to-w.from,.14,1.75);
   else wall(w.at,(w.from+w.to)/2,.14,w.to-w.from,1.75);
  }
  // Frosted glass windows and white framing on two outer walls.
  const windowAt=(x,z,w,alongX=true)=>{
   if(alongX){
    box(scene,x,1.1,z,w,.64,.025,"#91bace");
    box(scene,x,1.1,z,w,.055,.08,"#f9f7fa");box(scene,x,.78,z,w,.065,.08,"#f9f7fa");box(scene,x,1.42,z,w,.065,.08,"#f9f7fa");
    box(scene,x,1.1,z,.045,.65,.09,"#f9f7fa");
   }else{
    box(scene,x,1.1,z,.025,.64,w,"#91bace");
    box(scene,x,1.1,z,.07,.055,w,"#f9f7fa");
   }
  };
  windowAt(-3.1,3.89,1.55);windowAt(2.8,3.89,1.55);windowAt(4.89,-1.4,1.1,false);
  // Ground platform and soft background shadow.
  box(scene,0,-.3,0,10.5,.18,8.5,"#6a5b72");
  function buildFurniture(item){
   const group=new THREE.Group();group.position.set(item.x,0,item.z);group.rotation.y=item.rot*Math.PI/2;
   group.userData.furnitureId=item.id;
   const put=(...a)=>box(group,...a),round=(...a)=>cyl(group,...a),sphere=(...a)=>ball(group,...a);
   const foot=(w,d,h=.14)=>{for(const x of [-w/2+.13,w/2-.13])for(const z of [-d/2+.13,d/2-.13])put(x,h/2,z,.075,h,.075,"#675459")};
   switch(item.type){
    case "sofa":
     foot(1.94,.92);put(0,.36,0,1.98,.4,.96,"#8e83c5");put(0,.74,.37,2.02,.72,.24,"#695d9b");
     put(-.91,.61,0,.2,.48,1.02,"#7366ab");put(.91,.61,0,.2,.48,1.02,"#7366ab");
     for(const x of [-.45,.45])put(x,.58,-.16,.78,.12,.56,"#aaa0d9");break;
    case "bed":
     foot(1.65,2.04);put(0,.23,0,1.7,.25,2.14,"#966c82");put(0,.4,.11,1.56,.22,1.82,"#f7eae7");
     put(0,.7,-1.01,1.72,.82,.15,"#c18d9f");put(0,.52,.36,1.5,.14,1.26,"#c89caf");
     for(const x of [-.4,.4])put(x,.54,-.64,.67,.16,.36,"#fff8f0");break;
    case "table":
     foot(1.08,.85,.3);put(0,.48,0,1.15,.12,.9,"#ad8061");put(0,.55,0,1.02,.025,.75,"#cba282");break;
    case "tv":
     put(0,.26,0,1.6,.49,.57,"#9b765b");put(0,.98,.02,1.34,.82,.07,"#303248");
     put(0,.98,-.03,1.21,.66,.018,"#647b92");round(0,.55,0,.12,.17,"#4e4967");break;
    case "rug":
     put(0,.012,0,2.3,.024,1.55,"#a99fae");put(0,.027,0,1.93,.01,1.19,"#d8c0c9");break;
    case "plant":
     round(0,.24,0,.29,.46,"#ae7959");round(0,.59,0,.07,.4,"#527f5b");
     for(let q=0;q<6;q++){const angle=q*Math.PI/3;sphere(Math.cos(angle)*.2,.78+Math.sin(q)*.12,Math.sin(angle)*.2,.19,"#568a5b")}
     sphere(0,.9,0,.22,"#739d6b");break;
    case "lamp":
     round(0,.05,0,.23,.1,"#c49d85");round(0,.64,0,.04,1.2,"#e3dbd0");
     const shade=new THREE.Mesh(new THREE.ConeGeometry(.32,.53,14),mat("#f0d7b2"));shade.position.y=1.42;shade.rotation.x=Math.PI;group.add(shade);
     sphere(0,1.15,0,.12,"#ffdd8c");break;
    case "dresser":
     put(0,.5,0,1.3,1,.65,"#b48b76");for(let i=0;i<3;i++){put(0,.25+i*.27,-.335,1.13,.22,.045,"#d0ad95");round(0,.25+i*.27,-.369,.025,.035,"#6a5651")}break;
    case "desk":
     foot(1.65,.84,.65);put(0,.8,0,1.7,.095,.9,"#c09a79");
     put(0,1.23,.12,.91,.58,.05,"#31384b");put(0,1.23,.085,.82,.49,.015,"#687e98");
     put(0,.94,.15,.045,.25,.05,"#53566d");put(0,.86,.15,.27,.04,.23,"#4e4d5d");
     put(0,.875,-.25,.5,.018,.13,"#ddd0c3");break;
    case "chair":
     foot(.7,.7,.33);put(0,.52,0,.74,.13,.75,"#7a778d");put(0,.91,.32,.76,.78,.13,"#5b607a");break;
    case "pc":
     put(0,.42,0,.57,.84,.62,"#37374d");put(-.19,.48,-.318,.085,.42,.025,"#998ae8");
     for(let i=0;i<2;i++)round(.12,.28+i*.31,-.318,.12,.025,"#7973c7");break;
    case "shelf":
     put(-.61,.85,0,.12,1.7,.52,"#ab7b66");put(.61,.85,0,.12,1.7,.52,"#ab7b66");
     for(let i=0;i<4;i++){
      put(0,.13+i*.46,0,1.3,.09,.54,"#c09377");
      for(let j=0;j<6;j++)put(-.46+j*.17,.23+i*.46,0,.13,.2,.31,["#907aa4","#819c89","#d4b58e","#a07579"][j%4]);
     }break;
    case "car":
     put(0,.33,0,1.55,.33,2.18,"#bc86aa");
     put(0,.69,-.15,1.3,.43,1.09,"#d2a0c8");
     put(0,.79,-.71,1.15,.24,.08,"#7492af");
     for(const x of [-.72,.72])for(const z of [-.65,.65])round(x,.21,z,.22,.18,"#383746");
     put(0,.27,-1.04,1.2,.1,.06,"#e6d3cd");
     break;
    case "tools":case "kitchen":case "dresser":
     put(0,.5,0,1.28,1,.6,"#ad876b");
     for(let i=0;i<3;i++)put(0,.27+i*.25,-.32,1.13,.2,.06,"#d1aa88");
     if(item.type==="tools"){put(0,1.12,.25,1.3,.3,.15,"#696875");put(0,1.06,-.29,1.15,.08,.12,"#e2c87f")}
     break;
    case "bathtub":
     put(0,.35,0,1.65,.59,.85,"#f2e9ed");put(0,.68,0,1.32,.02,.53,"#a3c9d9");
     round(.65,.85,.25,.065,.3,"#dddde9");break;
    case "toilet":
     round(0,.37,0,.29,.42,"#f1eced");put(0,.83,.27,.55,.65,.23,"#ece9f2");break;
    case "sink":
     put(0,.65,0,.73,.2,.55,"#f4f0e9");round(0,.78,-.04,.2,.02,"#accada");break;
    case "fridge":
     put(0,1,0,.85,2,.75,"#cbd7e0");put(0,.45,-.4,.07,.32,.04,"#8795a5");
     put(0,1.43,-.4,.07,.38,.04,"#8795a5");break;
    case "stove":
     put(0,.48,0,.85,.91,.75,"#dfd8d4");put(0,.94,0,.83,.04,.72,"#404957");
     for(const x of [-.23,.23])for(const z of [-.2,.2])round(x,.97,z,.12,.02,"#73808d");break;
    case "dining":
     foot(1.44,.84,.52);put(0,.72,0,1.5,.14,.9,"#b88c6e");
     break;
    case "wardrobe":case "shelf":
     put(0,1,0,TYPE_BY_ID[item.type].w,2,TYPE_BY_ID[item.type].d,"#bc947a");
     put(-.3,1.0,-TYPE_BY_ID[item.type].d/2-.01,.04,.12,.035,"#6c5763");
     put(.3,1.0,-TYPE_BY_ID[item.type].d/2-.01,.04,.12,.035,"#6c5763");break;
    case "nightstand":case "windowseat":case "beanbag":
     put(0,.36,0,TYPE_BY_ID[item.type].w,.65,TYPE_BY_ID[item.type].d,item.type==="beanbag"?"#9186c6":"#b78f79");break;
    case "bike":
     for(const z of [-.49,.49])sphere(0,.36,z,.3,"#424653");
     put(0,.68,0,.12,.12,1.18,"#b391cc");put(0,.9,-.18,.07,.35,.12,"#d8c8cb");break;
    case "arcade":
     put(0,.75,0,.8,1.5,.76,"#654f8f");put(0,1.04,-.41,.63,.55,.045,"#7395b5");
     put(0,.55,-.4,.58,.13,.11,"#c47aba");break;
    case "piano":
     put(0,.66,0,1.55,.7,.64,"#3f344a");put(0,1.0,-.33,1.42,.09,.2,"#f3ece4");
     for(let i=0;i<9;i++)put(-.62+i*.155,1.057,-.32,.12,.02,.19,"#272936");break;
    case "guitar":
     put(0,.56,0,.14,1.08,.13,"#ad886a");sphere(0,.36,0,.26,"#cc986f");break;
    case "pc":case "speaker":case "console":
     put(0,.44,0,TYPE_BY_ID[item.type].w,.8,TYPE_BY_ID[item.type].d,"#33364c");
     put(0,.4,-TYPE_BY_ID[item.type].d/2-.005,.32,.36,.02,"#867ec3");break;
    default: {
     const t=TYPE_BY_ID[item.type];
     put(0,.32,0,t.w,.59,t.d,["#b59b87","#828eaa","#a57e9b"][t.id.length%3]);
     // Provide a distinct visible object for every additional furniture type.
     if(t.group==="Decor")round(0,.68,0,.16,.28,"#d1b8d5");
     break;
    }
   }
   group.traverse(o=>{o.userData.furnitureId=item.id});
   return group;
  }
  env.buildFurniture=buildFurniture;
  for(const item of house.items||[]){
   if(!item||!TYPE_BY_ID[item.type]||!Number.isFinite(item.x)||!Number.isFinite(item.z)||!Number.isInteger(item.rot))continue;
   const group=buildFurniture(item);env.furniture.set(item.id,group);scene.add(group);
  }
  function positionCamera(){
   const {azimuth:a,elevation:b,distance:d,target}=env;
   camera.position.set(target.x+Math.sin(a)*Math.cos(b)*d,Math.sin(b)*d,target.z+Math.cos(a)*Math.cos(b)*d);
   camera.lookAt(target.x,.35,target.z);
  }
  function render(){frame=0;if(!disposed&&stage.isConnected&&isCurrent())renderer.render(scene,camera)}
  function schedule(){if(!disposed&&!frame)frame=requestAnimationFrame(render)}
  function resize(){
   if(disposed||!stage.isConnected)return;
   const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();positionCamera();schedule();
  }
  const canvas=renderer.domElement;let drag=null;
  canvas.style.touchAction="none";
  const down=e=>{if(e.button!==0&&e.pointerType==="mouse")return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)};
  const move=e=>{if(!drag)return;env.azimuth-=(e.clientX-drag.x)*.008;env.elevation=clamp(env.elevation+(e.clientY-drag.y)*.007,.30,1.38);drag={x:e.clientX,y:e.clientY};positionCamera();schedule()};
  const end=()=>{drag=null};
  const wheel=e=>{e.preventDefault();env.distance=clamp(env.distance+Math.sign(e.deltaY),9,32);positionCamera();schedule()};
  canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);
  canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);
  canvas.addEventListener("lostpointercapture",end);canvas.addEventListener("wheel",wheel,{passive:false});
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);resize();
  return {
   zoom(delta){if(disposed)return;env.distance=clamp(env.distance+delta,9,32);positionCamera();schedule()},
   reset(){if(disposed)return;env.azimuth=.64;env.elevation=.84;env.distance=18.5;positionCamera();schedule()},
   destroy(){
    if(disposed)return;disposed=true;drag=null;resizeObserver?.disconnect();
    if(frame)cancelAnimationFrame(frame);
    canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);
    canvas.removeEventListener("pointerup",end);canvas.removeEventListener("pointercancel",end);
    canvas.removeEventListener("lostpointercapture",end);canvas.removeEventListener("wheel",wheel);
    scene.traverse(obj=>{obj.geometry?.dispose?.();if(obj.material)for(const mat of Array.isArray(obj.material)?obj.material:[obj.material])mat.dispose?.()});
    renderer.dispose();renderer.forceContextLoss?.();canvas.remove();
   }
  };
 }catch(error){
  if(frame)cancelAnimationFrame(frame);resizeObserver?.disconnect();
  renderer?.dispose();renderer?.domElement?.remove();
  throw error;
 }
}
