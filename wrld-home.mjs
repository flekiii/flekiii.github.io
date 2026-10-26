import {
 STORE_KEY,LIMIT,TYPES,TYPE_BY_ID,ROOMS,WALLS,START_ITEMS,cloneItems,
 rounded,clamp,size,canPlace,atRoom,findPlace,restore,encode,HOUSE_TEMPLATES,setLayout
} from "./wrld-home-core.mjs?v=2";

const $=id=>document.getElementById(id);
const root=$("page-house-editor"),stage=$("houseStage"),canvas=$("houseCanvas"),ctx=canvas?.getContext("2d");
if(root&&stage&&canvas&&ctx){
 const catalogue=$("houseCatalogue"),notice=$("houseNotice"),selectedLabel=$("houseSelectedLabel");
 const state={items:cloneItems(START_ITEMS),selected:null,room:"room1",choice:"3d",view:"2d",
  busy:false,dirty:false,drag:null,three:null,next:11,frames:0};
 try{
  const settings=JSON.parse(localStorage.getItem("fleki_wrld_house_settings")||"null");
  if(settings?.template){
   setLayout(settings.template);
   const saved=localStorage.getItem(STORE_KEY);
   state.items=saved!==null?restore(saved):cloneItems(START_ITEMS);
  }
  const preference=localStorage.getItem("fleki_wrld_house_mode");
  if(["3d","2d"].includes(preference))state.choice=preference;
 }catch{state.items=cloneItems(START_ITEMS)}
 if(!ROOMS[state.room])state.room=Object.keys(ROOMS)[0];
 state.next=state.items.reduce((max,i)=>Math.max(max,Number(i.id.match(/^item-(\d+)$/)?.[1]||0)+1),11);
 const get=id=>state.items.find(item=>item.id===id);
 const announce=message=>{notice.textContent=message;};
 function save(){try{localStorage.setItem(STORE_KEY,encode(state.items));$("houseStorage").textContent="Saved on this device";return true}
  catch{$("houseStorage").textContent="Storage unavailable";announce("Unable to save here. Browser storage might be disabled.");return false}}
 const preferred=()=>state.choice;

 const houseLang=()=>document.documentElement?.lang==="uk"?"uk":"en";
 const roomsUk=["Вітальня","Спальня","Кабінет","Кухня","Ванна","Ігрова","Їдальня"],roomsEn=["Living room","Bedroom","Study","Kitchen","Bathroom","Game room","Dining room"];
 const roomLabel=n=>houseLang()==="en"?(roomsEn[roomsUk.indexOf(n)]||n):n;
 function furnitureCard(type){
  const b=document.createElement("button");b.type="button";b.className="house-furniture-card";
  b.dataset.furniture=type.id;b.title="Add "+type.name;b.innerHTML='<span class="house-furniture-icon">'+type.icon+'</span><span>'+type.name+'</span><span class="house-furniture-plus" aria-hidden="true">+</span>';
  return b;
 }
 for(const type of TYPES)catalogue.append(furnitureCard(type));
 function updateRoomButtons(){
  const panel=$("houseRooms");
  panel.replaceChildren();
  for(const room of Object.values(ROOMS)){
   const b=document.createElement("button");b.type="button";b.dataset.houseRoom=room.id;
   b.textContent=(room.garage?"🚗 ":"⌂ ")+roomLabel(room.name);
   b.classList.toggle("active",room.id===state.room);
   b.setAttribute("aria-pressed",String(room.id===state.room));
   panel.append(b);
  }
 }
 function chooseRoom(id){
  if(!ROOMS[id])return;
  state.room=id;
  const room=ROOMS[id];
  if(state.three){
   state.three.target={x:room.x,z:room.z};
   state.three.positionCamera();schedule3d();
  }
  $("houseStage").dataset.room=id;
  announce(houseLang()==="uk"?"Обрано кімнату: "+room.name+". Нові меблі з’являться саме тут.":"Selected room: "+roomLabel(room.name)+". New furniture will be placed here.");
  updateUi();
 }
 function replaceHouse(template,name,items=null){
  setLayout(template);
  state.room=Object.keys(ROOMS)[0];
  state.items=Array.isArray(items)?restore(JSON.stringify({version:1,items})):cloneItems(START_ITEMS);
  state.selected=null;
  state.next=state.items.reduce((v,i)=>Math.max(v,Number(i.id.match(/^item-(\d+)$/)?.[1]||0)+1),1);
  $("houseNameDisplay").textContent=String(name||(houseLang()==="uk"?"Мій дім":"My house"));
  updateRoomButtons();
  if(state.three){
   dispose3d();state.view="2d";stage.dataset.view="2d";canvas.hidden=false;
  }
  save();updateUi();if(sceneActive())switchView();
 }
 function updateUi(){
  $("houseCount").textContent=state.items.length+"/"+LIMIT+(houseLang()==="uk"?" предметів":" items");
  const s=get(state.selected);
  selectedLabel.textContent=s?TYPE_BY_ID[s.type].name:houseLang()==="uk"?"Нічого не вибрано":"Nothing selected";
  $("houseRotate").disabled=!s;$("houseDelete").disabled=!s;
  $("houseResetCamera").hidden=state.view!=="3d";
  $("houseModeLabel").textContent=state.view==="3d"?"3D HOUSE":"2D HOUSE";
  for(const b of root.querySelectorAll("[data-house-mode]")){
   b.classList.toggle("active",b.dataset.houseMode===state.choice);
   b.setAttribute("aria-pressed",String(b.dataset.houseMode===state.choice));
  }
  for(const b of $("houseRooms").querySelectorAll("[data-house-room]")){
   b.classList.toggle("active",b.dataset.houseRoom===state.room);
   b.setAttribute("aria-pressed",String(b.dataset.houseRoom===state.room));
  }
  for(const b of catalogue.children)b.disabled=state.items.length>=LIMIT;
  update3dSelection();
  if(state.view==="2d")draw2d();
 }
 function sceneActive(){return root.classList.contains("active")&&!document.hidden}
 function select(id){state.selected=get(id)?id:null;updateUi()}
 function changeItem(id,x,z,rot){
  const item=get(id);if(!item)return false;
  const moved={...item,x:rounded(x),z:rounded(z),rot:((rot%4)+4)%4};
  if(!canPlace(moved,state.items))return false;
  Object.assign(item,moved);
  if(state.view==="3d"){
   const group=state.three?.furniture.get(id);
   if(group){group.position.set(item.x,0,item.z);group.rotation.y=item.rot*Math.PI/2;group.updateMatrixWorld(true);state.three.selectionOutline?.update?.()}
   schedule3d();
  }else draw2d();
  return true;
 }
 function add(type){
  if(!TYPE_BY_ID[type]||state.items.length>=LIMIT){announce("Your house is full. Remove a piece to add another.");return}
  const spot=findPlace(type,state.items,state.room);
  if(!spot){announce("Not enough room here. Choose another room or move some furniture.");return}
  const item={...spot,id:"item-"+state.next++};
  state.items.push(item);state.selected=item.id;save();
  if(state.view==="3d")refreshFurniture3d();else draw2d();
  updateUi();announce(TYPE_BY_ID[type].name+" added. Drag to move it, or use Rotate.");
 }
 function rotateSelected(){const item=get(state.selected);if(!item)return; if(changeItem(item.id,item.x,item.z,item.rot+1)){save();refreshFurniture3d();updateUi();announce("Furniture rotated.")}else announce("Not enough space to rotate here. Move the item first.")}
 function deleteSelected(){const item=get(state.selected);if(!item)return;state.items=state.items.filter(x=>x.id!==item.id);state.selected=null;save();refreshFurniture3d();updateUi();announce("Furniture removed.")}
 function clearAll(){
  if(!confirm("Reset your house and restore the original furniture? Your saved arrangement on this device will be replaced."))return;
  state.items=cloneItems(START_ITEMS);state.selected=null;state.next=11;save();refreshFurniture3d();updateUi();announce("House reset to its original arrangement.");
 }
 function background2d(width,height){
  ctx.fillStyle="#131523";ctx.fillRect(0,0,width,height);
  const glow=ctx.createRadialGradient(width*.5,height*.50,20,width*.5,height*.5,width*.72);
  glow.addColorStop(0,"#3a3552");glow.addColorStop(1,"#161623");ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  for(let i=0;i<36;i++){const x=(i*191+41)%Math.max(1,width),y=(i*79+53)%Math.max(1,height);ctx.fillStyle="#d1baf338";ctx.fillRect(x,y,1.5,1.5)}
 }
 let map={ox:0,oy:0,scale:1};
 function project(x,z){return {x:map.ox+(x+5)*map.scale,y:map.oy+(4-z)*map.scale}}
 function unproject(x,y){return {x:(x-map.ox)/map.scale-5,z:4-(y-map.oy)/map.scale}}
 function rectWorld(x,z,w,d,color,radius=0){
  const p=project(x-w/2,z+d/2);
  ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(p.x,p.y,w*map.scale,d*map.scale,radius*map.scale);ctx.fill();
 }
 function lineWorld(x1,z1,x2,z2,color,width){
  const a=project(x1,z1),b=project(x2,z2);
  ctx.strokeStyle=color;ctx.lineWidth=width*map.scale;ctx.lineCap="square";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }
 function draw2d(){
  if(state.view!=="2d"||!ctx)return;
  const box=stage.getBoundingClientRect();if(box.width<20||box.height<20)return;
  const ratio=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(box.width*ratio);canvas.height=Math.round(box.height*ratio);
  canvas.style.width=box.width+"px";canvas.style.height=box.height+"px";
  ctx.setTransform(ratio,0,0,ratio,0,0);
  background2d(box.width,box.height);
  map.scale=Math.min((box.width-34)/10,(box.height-46)/8);
  map.ox=(box.width-10*map.scale)/2;map.oy=(box.height-8*map.scale)/2;
  ctx.shadowColor="#07071488";ctx.shadowBlur=23;
  rectWorld(0,0,10.17,8.18,"#c4b2a7",.07);ctx.shadowBlur=0;
  for(const room of Object.values(ROOMS))rectWorld(room.x,room.z,room.w,room.d,room.color);
  ctx.save();ctx.strokeStyle="#ffffff18";ctx.lineWidth=1;
  for(let x=-4.75;x<5;x+=.5){const a=project(x,-4),b=project(x,4);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  for(let z=-3.75;z<4;z+=.5){const a=project(-5,z),b=project(5,z);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.restore();
  // Cutaway exterior outline with a front entrance opening.
  for(const wall of [
   [-5,-4,-5,4],[-5,4,5,4],[5,4,5,-4],[-5,-4,-.7,-4],[.7,-4,5,-4]
  ])lineWorld(...wall,"#f9f1e9",.15);
  for(const wall of WALLS){
   const args=wall.axis==="z"?[wall.from,wall.at,wall.to,wall.at]:[wall.at,wall.from,wall.at,wall.to];
   lineWorld(...args,"#f9f1e9",.115);
  }
  lineWorld(-4.3,4,-2.75,4,"#80b6d1",.075);
  lineWorld(2.3,4,3.95,4,"#80b6d1",.075);
  lineWorld(5,-2,5,-.5,"#80b6d1",.075);
  const focus=ROOMS[state.room];
  if(focus){const corner=project(focus.x-focus.w/2,focus.z+focus.d/2);
   ctx.strokeStyle="#ab67f6";ctx.lineWidth=3;ctx.strokeRect(corner.x+3,corner.y+3,focus.w*map.scale-6,focus.d*map.scale-6)}
  ctx.fillStyle="#413547";ctx.font='700 '+Math.max(10,Math.min(13,map.scale*.16))+'px "DM Sans",sans-serif';
  for(const [key,pos] of Object.entries(ROOMS)){
   const p=project(pos.x-pos.w/2+.18,pos.z+pos.d/2-.22);
   ctx.fillStyle="#54485f88";ctx.textAlign="left";ctx.fillText(pos.name.toUpperCase(),p.x,p.y);
  }
  for(const item of [...state.items.filter(i=>i.type==="rug"),...state.items.filter(i=>i.type!=="rug")])drawItem2d(item);
  const a=project(-.7,-3.95),b=project(.7,-3.95);
  ctx.strokeStyle="#9f8eb4";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }
 function drawItem2d(item){
  const type=TYPE_BY_ID[item.type],s=size(item),p=project(item.x,item.z);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(item.rot*Math.PI/2);
  const w=type.w*map.scale,d=type.d*map.scale;
  ctx.shadowColor="#33273e52";ctx.shadowBlur=9;ctx.shadowOffsetY=3;
  ctx.fillStyle=item.type==="rug"?"#bcb0b2":item.type==="sofa"?"#7b7cba":item.type==="bed"?"#dfb0bf":item.type==="plant"?"#638b6d":item.type==="desk"?"#b18e71":"#a38b83";
  ctx.beginPath();ctx.roundRect(-w/2,-d/2,w,d,Math.min(10,w/6));ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.strokeStyle="#ffffff66";ctx.lineWidth=1.2;ctx.stroke();
  if(item.type==="sofa"){
   ctx.fillStyle="#d4c5df";ctx.fillRect(-w*.42,-d*.39,w*.84,d*.27);
   ctx.fillStyle="#ffffff30";ctx.fillRect(-w*.45,-d*.1,w*.9,d*.35);
  }else if(item.type==="bed"){
   ctx.fillStyle="#fae6dd";ctx.fillRect(-w*.44,-d*.41,w*.88,d*.74);
   ctx.fillStyle="#fffaf3";ctx.fillRect(-w*.4,-d*.34,w*.34,d*.2);ctx.fillRect(w*.06,-d*.34,w*.34,d*.2);
   ctx.fillStyle="#ca94ad";ctx.fillRect(-w*.44,d*.12,w*.88,d*.2);
  }else if(item.type==="rug"){
   ctx.strokeStyle="#ece6df";ctx.lineWidth=3;ctx.strokeRect(-w*.41,-d*.37,w*.82,d*.74);
  }else if(item.type==="desk"){
   ctx.fillStyle="#2e3147";ctx.fillRect(-w*.28,-d*.25,w*.55,d*.2);
   ctx.fillStyle="#d1b8a3";ctx.fillRect(-w*.23,d*.15,w*.45,d*.11);
  }else if(item.type==="tv"){
   ctx.fillStyle="#242a39";ctx.fillRect(-w*.45,-d*.36,w*.9,d*.48);
   ctx.fillStyle="#53677f";ctx.fillRect(-w*.4,-d*.31,w*.8,d*.37);
  }else if(item.type==="plant"){
   ctx.fillStyle="#d4a67f";ctx.beginPath();ctx.arc(0,0,w*.33,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#3b774f";for(const q of [0,1,2,3,4]){ctx.beginPath();ctx.ellipse(Math.cos(q*1.26)*w*.14,Math.sin(q*1.26)*w*.14,w*.15,w*.24,q*1.26,0,Math.PI*2);ctx.fill()}
  }else{
   const text=type.icon;ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=Math.max(16,Math.min(32,w*.53))+'px "Apple Color Emoji","Segoe UI Emoji",system-ui';ctx.fillText(text,0,0);
  }
  if(state.selected===item.id){
   ctx.shadowBlur=0;ctx.strokeStyle="#bf82ff";ctx.lineWidth=2.7;ctx.setLineDash([7,4]);ctx.strokeRect(-w/2-4,-d/2-4,w+8,d+8);ctx.setLineDash([]);
  }
  ctx.restore();
 }
 function pick2d(pos){
  const world=unproject(pos.x,pos.y);
  for(const item of [...state.items].reverse()){
   if(item.type==="rug")continue;
   const {w,d}=size(item);
   if(Math.abs(world.x-item.x)<=w/2&&Math.abs(world.z-item.z)<=d/2)return item.id;
  }
  return null;
 }
 function pointerLocation(ev){const b=stage.getBoundingClientRect();return {x:ev.clientX-b.left,y:ev.clientY-b.top}}
 function down2d(ev){
  if(ev.button!==0&&ev.pointerType==="mouse")return;
  const p=pointerLocation(ev),id=pick2d(p);
  if(id){select(id);const world=unproject(p.x,p.y),item=get(id);state.drag={kind:"piece",id,dx:item.x-world.x,dz:item.z-world.z,moved:false};}
  else{select(null);state.drag=null;}
  if(state.drag)stage.setPointerCapture?.(ev.pointerId);
 }
 function move2d(ev){
  const d=state.drag;if(!d||d.kind!=="piece")return;
  const pt=unproject(pointerLocation(ev).x,pointerLocation(ev).y);
  d.moved=changeItem(d.id,pt.x+d.dx,pt.z+d.dz,get(d.id)?.rot??0)||d.moved;
 }
 function up2d(){if(state.drag?.moved)save();state.drag=null;}
 function dispose3d(){
  const env=state.three;if(!env)return;
  if(env.raf)cancelAnimationFrame(env.raf);
  env.scene.traverse(obj=>{obj.geometry?.dispose?.();if(obj.material){for(const m of Array.isArray(obj.material)?obj.material:[obj.material])m.dispose?.()}});
  env.renderer.dispose();env.renderer.forceContextLoss?.();
  env.renderer.domElement.remove();
  state.three=null;
 }
 function create3d(THREE){
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"default"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(stage.clientWidth,stage.clientHeight);
  renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  renderer.domElement.className="house-webgl";renderer.domElement.setAttribute("aria-label","Interactive 3D house");stage.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color("#28263e");
  const camera=new THREE.PerspectiveCamera(44,1,.1,100);
  const focus=ROOMS[state.room]||{x:0,z:0};
  const env={THREE,renderer,scene,camera,target:{x:focus.x,z:focus.z},azimuth:.64,elevation:.84,distance:16.3,raf:0,furniture:new Map(),pointer:null,resize:()=>{}};
  state.three=env;
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
  for(const room of Object.values(ROOMS))floor(room.x,room.z,room.w,room.d,room.color);
  // Exterior walls have no full-height front: a playable dollhouse cutaway.
  const wall=(x,z,w,d,h=1.8)=>{box(scene,x,h/2,z,w,h,d,"#f5ede7");box(scene,x,h-.055,z,w+.03,.09,d+.03,"#b69cb8")};
  wall(-5,0,.16,8);wall(5,0,.16,8);wall(0,4,10,.16);
  wall(-2.85,-4,4.3,.16,.45);wall(2.85,-4,4.3,.16,.45);
  for(const w of WALLS){
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
  env.pointerToWorld=event=>{
   const r=renderer.domElement.getBoundingClientRect();
   const mouse=new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
   const raycaster=new THREE.Raycaster();raycaster.setFromCamera(mouse,camera);
   const at=new THREE.Vector3();
   return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),at)?at:null;
  };
  env.pick=event=>{
   const r=renderer.domElement.getBoundingClientRect();
   const coords=new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
   const ray=new THREE.Raycaster();ray.setFromCamera(coords,camera);
   const hits=ray.intersectObjects([...env.furniture.values()],true);
   return hits[0]?.object?.userData?.furnitureId||null;
  };
  env.render=()=>{if(!state.three||!sceneActive())return;env.raf=0;renderer.render(scene,camera)};
  env.resize=()=>{
   const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();positionCamera();schedule3d();
  };
  env.setSelection=id=>{
   // Materials are reused across objects; use a single independent outline,
   // otherwise selecting one sofa would highlight every object with that material.
   if(env.selectionOutline){
    scene.remove(env.selectionOutline);
    env.selectionOutline.geometry?.dispose?.();
    env.selectionOutline.material?.dispose?.();
    env.selectionOutline=null;
   }
   const selected=env.furniture.get(id);
   if(selected){
    selected.updateMatrixWorld(true);
    env.selectionOutline=new THREE.BoxHelper(selected,0xd4a6ff);
    scene.add(env.selectionOutline);
   }
   schedule3d();
  };
  function positionCamera(){
   const a=env.azimuth,b=env.elevation,d=env.distance;
   camera.position.set(env.target.x+Math.sin(a)*Math.cos(b)*d,Math.sin(b)*d,env.target.z+Math.cos(a)*Math.cos(b)*d);
   camera.lookAt(env.target.x,.35,env.target.z);
  }
  env.positionCamera=positionCamera;positionCamera();
  refreshFurniture3d();env.resize();
  return env;
 }
 function update3dSelection(){state.three?.setSelection?.(state.selected)}
 function schedule3d(){const env=state.three;if(env&&!env.raf)env.raf=requestAnimationFrame(env.render)}
 function refreshFurniture3d(){
  const env=state.three;if(!env)return;
  if(env.selectionOutline){env.scene.remove(env.selectionOutline);env.selectionOutline.geometry?.dispose?.();env.selectionOutline.material?.dispose?.();env.selectionOutline=null}
  for(const group of env.furniture.values()){
   env.scene.remove(group);group.traverse(o=>o.geometry?.dispose?.());
  }
  env.furniture.clear();
  for(const item of state.items){const group=env.buildFurniture(item);env.scene.add(group);env.furniture.set(item.id,group)}
  update3dSelection();schedule3d();
 }
 function down3d(ev){
  if(ev.button!==0&&ev.pointerType==="mouse")return;
  const env=state.three;if(!env)return;
  const id=env.pick(ev);if(id){select(id);const pos=env.pointerToWorld(ev),item=get(id);
   env.pointer={kind:"piece",id,x:pos?.x??item.x,z:pos?.z??item.z,ox:item.x-(pos?.x??item.x),oz:item.z-(pos?.z??item.z),changed:false};
  }else{select(null);env.pointer={kind:"camera",x:ev.clientX,y:ev.clientY}};
  stage.setPointerCapture?.(ev.pointerId);
 }
 function move3d(ev){
  const env=state.three,p=env?.pointer;if(!p)return;
  if(p.kind==="camera"){
   env.azimuth+=((ev.clientX-p.x)||0)*.007;env.elevation=clamp(env.elevation+((ev.clientY-p.y)||0)*.005,.33,1.4);
   p.x=ev.clientX;p.y=ev.clientY;env.positionCamera();schedule3d();
  }else{
   const point=env.pointerToWorld(ev),item=get(p.id);if(!point||!item)return;
   if(changeItem(p.id,point.x+p.ox,point.z+p.oz,item.rot))p.changed=true;
  }
 }
 function up3d(){if(state.three?.pointer?.changed)save();if(state.three)state.three.pointer=null}
 async function switchView(){
  if(state.busy)return;
  const wanted=preferred();
  if(wanted===state.view&&(!state.three||wanted==="3d")){updateUi();return}
  state.busy=true;stage.classList.add("loading");
  if(state.three)dispose3d();
  state.view="2d";stage.dataset.view="2d";canvas.hidden=false;
  try{
   if(wanted==="3d"){
    const THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
    if(!root.isConnected||!sceneActive()||state.choice!=="3d")return;
    create3d(THREE);
    state.view="3d";stage.dataset.view="3d";canvas.hidden=true;

   }
  }catch(e){
   if(state.three)dispose3d();
   state.view="2d";stage.dataset.view="2d";canvas.hidden=false;
   announce("3D isn't available on this device or network. 2D house is ready instead.");
  }finally{state.busy=false;stage.classList.remove("loading");updateUi();if(state.view==="2d")draw2d()}
 }
 function setMode(mode,remember=true){if(!["3d","2d"].includes(mode))return;state.choice=mode;
  if(remember)try{localStorage.setItem("fleki_wrld_house_mode",mode)}catch{}
  switchView();
 }
 function resetCamera(){if(!state.three)return;state.three.azimuth=.64;state.three.elevation=.84;state.three.distance=16.3;state.three.positionCamera();schedule3d()}
 stage.addEventListener("pointerdown",e=>{if(!sceneActive()||state.busy)return;if(state.view==="3d")down3d(e);else down2d(e)});
 stage.addEventListener("pointermove",e=>{if(!sceneActive()||state.busy)return;if(state.view==="3d")move3d(e);else move2d(e)});
 stage.addEventListener("pointerup",()=>{if(state.view==="3d")up3d();else up2d()});
 stage.addEventListener("pointercancel",()=>{if(state.view==="3d")up3d();else up2d()});
 stage.addEventListener("wheel",e=>{if(state.view!=="3d"||!state.three||!sceneActive())return;e.preventDefault();state.three.distance=clamp(state.three.distance+(e.deltaY>0?1:-1),10,25);state.three.positionCamera();schedule3d()},{passive:false});
 catalogue.addEventListener("click",e=>{const b=e.target.closest("[data-furniture]");if(b)add(b.dataset.furniture)});
 root.addEventListener("click",e=>{
  const room=e.target.closest("[data-house-room]");if(room){chooseRoom(room.dataset.houseRoom);return}
  const mode=e.target.closest("[data-house-mode]");if(mode){setMode(mode.dataset.houseMode);return}
  const command=e.target.closest("[data-house-action]");if(!command)return;
  switch(command.dataset.houseAction){
   case "rotate":rotateSelected();break;
   case "delete":deleteSelected();break;
   case "reset":clearAll();break;
   case "camera":resetCamera();break;
  }
 });
 document.addEventListener("keydown",e=>{
  if(!sceneActive()||!root.contains(document.activeElement)&&document.activeElement?.matches("input,textarea,select,[contenteditable]"))return;
  if(document.activeElement===stage&&get(state.selected)&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
   e.preventDefault();
   const item=get(state.selected),step=e.shiftKey?.5:.25;
   const x=item.x+(e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0);
   const z=item.z+(e.key==="ArrowUp"?step:e.key==="ArrowDown"?-step:0);
   if(changeItem(item.id,x,z,item.rot)){save();updateUi()}
   else announce("The furniture cannot pass through walls or overlap other pieces.");
  }else if(e.key==="Delete"||e.key==="Backspace"){if(get(state.selected)){e.preventDefault();deleteSelected()}}
  else if(e.key.toLowerCase()==="r"&&!e.ctrlKey&&!e.metaKey){if(get(state.selected)){e.preventDefault();rotateSelected()}}
  else if(e.key==="Escape"&&get(state.selected))select(null);
 });
 const resize=new ResizeObserver(()=>{if(state.view==="3d")state.three?.resize();else draw2d()});
 resize.observe(stage);
 window.addEventListener("wrld:page-change",e=>{
  if(e.detail?.id!=="house-editor"){if(state.three)dispose3d();state.view="2d";}
  else switchView();
 });
 window.addEventListener("visibilitychange",()=>{if(sceneActive())schedule3d()});
 window.addEventListener("wrld:language-change",()=>{updateRoomButtons();updateUi()});
 // The editor renders in 3D when visited, with a 2D fallback.
 updateRoomButtons();
 try{
  const settings=JSON.parse(localStorage.getItem("fleki_wrld_house_settings")||"null");
  $("houseNameDisplay").textContent=settings?.name||(houseLang()==="uk"?"Мій дім":"My house");
 }catch{}
 window.addEventListener("wrld:house-create",event=>{
  const d=event.detail||{};replaceHouse(d.template,d.name);
 });
 window.addEventListener("wrld:house-import",event=>{
  const d=event.detail||{};replaceHouse(d.template,d.name,d.items);
 });
 window.addEventListener("wrld:house-get",event=>{
  const d=event.detail||{};d.onResult?.({items:cloneItems(state.items),template:(JSON.parse(localStorage.getItem("fleki_wrld_house_settings")||"{}").template||"starter"),name:$("houseNameDisplay").textContent});
 });
 updateUi();if(sceneActive())switchView();
}