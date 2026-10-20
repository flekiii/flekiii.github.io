import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* Lightweight, hand-built 3D interpretations of AJAZZ AK680 and GamePro GM300B.
   No unlicensed third-party 3D assets. One render loop, capped, visible-only. */
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const stages = [];
const makeMat = (color, roughness=.45, metalness=.15, extras={}) =>
  new THREE.MeshStandardMaterial({color,roughness,metalness,...extras});
const box=(w,h,d,material,parent,x=0,y=0,z=0)=>{
  const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  obj.position.set(x,y,z);parent.add(obj);return obj;
};
const curveTube=(parent,coords,radius,material,segments=20)=>{
  const points=coords.map(p=>new THREE.Vector3(...p));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,radius,6,false),material);
  parent.add(mesh);return mesh;
};
function roundedShape(w,d,r){
  const s=new THREE.Shape();
  s.moveTo(-w/2+r,-d/2);
  s.lineTo(w/2-r,-d/2);
  s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);
  s.lineTo(w/2,d/2-r);
  s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);
  s.lineTo(-w/2+r,d/2);
  s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);
  s.lineTo(-w/2,-d/2+r);
  s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
  return s;
}
function roundedBlock(w,d,h,r,material,parent){
  const geometry=new THREE.ExtrudeGeometry(roundedShape(w,d,r),{
    depth:h,steps:1,bevelEnabled:true,bevelThickness:.035,bevelSize:.027,bevelSegments:2,curveSegments:4
  });
  geometry.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(geometry,material);
  parent.add(mesh);return mesh;
}
function labelTexture(lines,width=1024,height=512,fontSize=32){
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d");
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="700 "+fontSize+"px ui-monospace,monospace";
  for(const item of lines){
    const text=item.label;
    const px=((item.x+5.55)/11.1)*width;
    const py=((item.z+1.64)/3.28)*height;
    ctx.fillStyle=item.red?"#fff7ef":"#a73b47";
    ctx.fillText(text,px,py,Math.max(16,item.width/11.1*width*.81));
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
}
function makeKeyboard(root){
  const red=makeMat(0xa8293e,.34,.27);
  const redCap=makeMat(0xda4151,.36,.16);
  const whiteCap=makeMat(0xf6e6d7,.52,.05);
  const cherry=makeMat(0x721d30,.36,.21);
  const pink=makeMat(0xffb3c9,.32,.09,{emissive:0x981f62,emissiveIntensity:.25});
  const socket=makeMat(0x341e29,.7,.08);
  const shell=roundedBlock(11.65,4.26,.30,.19,red,root);
  shell.position.y=.105; // x-z flat, positive y is up after rotateX
  const underside=roundedBlock(11.77,4.33,.065,.20,cherry,root);
  underside.position.y=.045;
  const inset=roundedBlock(11.34,3.95,.014,.12,socket,root);
  inset.position.y=.385;
  const keyGeom=new THREE.ExtrudeGeometry(roundedShape(.58,.61,.09),{
    depth:.19,bevelEnabled:true,bevelSize:.025,bevelThickness:.020,bevelSegments:2,curveSegments:3
  });
  keyGeom.rotateX(-Math.PI/2);
  const layout=[
    ["ESC","1","2","3","4","5","6","7","8","9","0","-","=","BACK:1.55","DEL"],
    ["TAB:1.45","Q","W","E","R","T","Y","U","I","O","P","[","]","\\","PGUP"],
    ["CAPS:1.72","A","S","D","F","G","H","J","K","L",";","'","ENTER:1.95","PGDN"],
    ["SHIFT:1.98","Z","X","C","V","B","N","M",",",".","/","SHIFT:1.30","↑"],
    ["CTRL:1.30","WIN","ALT","SPACE:5.1","ALT","FN","CTRL","←","↓","→","FN"]
  ];
  // 15 + 15 + 14 + 13 + 11 = 68 modeled keycaps.
  const instances={red:[],white:[]};
  const legends=[];
  layout.forEach((row,r)=>{
    const keys=row.map((source)=>{
      const [label,size]=source.split(":");
      return {label,units:parseFloat(size)||1};
    });
    const rowUnits=keys.reduce((sum,k)=>sum+k.units,0);
    const available=10.95;
    const keyGap=.046;
    const unit=(available-keyGap*(keys.length-1))/rowUnits;
    let left=-available/2;
    const z=-1.61+r*.80;
    keys.forEach((key,i)=>{
      const w=key.units*unit;
      const x=left+w/2;
      const isRed=r===0||(r===4 && i!==3)||key.units>1.3||i===row.length-1;
      const matrix=new THREE.Matrix4().compose(
        new THREE.Vector3(x,.415,z),
        new THREE.Quaternion(),
        new THREE.Vector3(Math.max(.55,w/.58-.12),1,1)
      );
      instances[isRed?"red":"white"].push(matrix);
      legends.push({label:key.label,x,z,red:isRed,width:w});
      left+=w+keyGap;
    });
  });
  for(const [name,mats] of Object.entries(instances)){
    const inst=new THREE.InstancedMesh(keyGeom,name==="red"?redCap:whiteCap,mats.length);
    mats.forEach((m,i)=>inst.setMatrixAt(i,m));
    inst.instanceMatrix.needsUpdate=true;
    inst.castShadow=false;
    root.add(inst);
  }
  const legendsMat=new THREE.MeshBasicMaterial({
    map:labelTexture(legends),transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1
  });
  // One shared texture includes all 68 key legends: just one additional draw call.
  const legendsPlane=new THREE.Mesh(new THREE.PlaneGeometry(11.1,3.28),legendsMat);
  legendsPlane.rotation.x=-Math.PI/2;legendsPlane.position.y=.665;
  root.add(legendsPlane);
  // Decorative backlighting visible through case sides and beneath caps.
  for(let i=0;i<18;i++){
    const x=-5.35+i*.63;
    const tint=i%4===0?pink:whiteCap;
    box(.46,.012,.022,tint,root,x,.371,-2.015);
  }
  curveTube(root,[[-5.45,.205,-2.14],[0,.205,-2.16],[5.45,.205,-2.14]],.018,pink,30);
  curveTube(root,[[-5.43,.195,2.14],[0,.195,2.18],[5.43,.195,2.14]],.021,pink,30);
  const cable=makeMat(0x2e1b2a,.78,.08);
  curveTube(root,[[0,.24,-2.17],[.0,.21,-2.54],[.14,.06,-2.83],[.25,-.14,-3.11]],.048,cable,16);
  // Little kickstand profile and etched rear brand.
  box(1.2,.045,.08,whiteCap,root,-4.7,.24,-2.04);
  const led=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),
    new THREE.MeshBasicMaterial({color:0xffaad1}));
  led.position.set(5.43,.31,-2.04);root.add(led);
  return {root,glow:pink};
}
function mouseSurface(){
  // Hand-shaped ergonomic mouse upper housing: varying cross-section for each depth segment.
  const vertices=[],indices=[];
  const longitudinal=34,around=36;
  for(let j=0;j<=longitudinal;j++){
    const t=j/longitudinal;
    const z=-1.80+3.6*t;
    const taper=Math.pow(Math.max(.04,Math.sin(Math.PI*(t*.92+.04))),.42);
    const w=(.84+.12*Math.sin(t*Math.PI))*taper;
    const hump=(.68+.33*Math.sin(Math.PI*(t*.9+.15)))*taper;
    for(let i=0;i<=around;i++){
      const a=-Math.PI/2+(i/around)*Math.PI;
      vertices.push(w*Math.sin(a),.12+Math.max(0,Math.cos(a))*hump,z);
    }
  }
  for(let j=0;j<longitudinal;j++){
    for(let i=0;i<around;i++){
      const a=j*(around+1)+i,b=a+around+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function makeMouse(root){
  const black=makeMat(0x13131c,.34,.2);
  const graphite=makeMat(0x25242d,.4,.2);
  const matte=makeMat(0x090a10,.72,.1);
  const rubber=makeMat(0x111019,.88,0);
  const wheelMat=makeMat(0x24212c,.8,0);
  const rgb=new THREE.MeshStandardMaterial({color:0xffa3ce,emissive:0xff47ad,emissiveIntensity:1.1,roughness:.31,metalness:.04});
  const rgbSecond=new THREE.MeshStandardMaterial({color:0x9a7fff,emissive:0x995cff,emissiveIntensity:.95});
  // Angular rear base, smoothed mid-shell, split main buttons.
  const base=roundedBlock(1.70,3.72,.17,.36,matte,root);
  base.position.y=.035;
  const shell=new THREE.Mesh(mouseSurface(),black);
  shell.material.side=THREE.DoubleSide;
  root.add(shell);
  // Left and right upper button surfaces, slightly sloping with shell.
  for(const dir of [-1,1]){
    const top=box(.67,.055,1.21,graphite,root,dir*.35,.80,-.93);
    top.rotation.x=.095;top.rotation.z=-dir*.12;
    top.rotation.y=-dir*.03;
  }
  const seam=makeMat(0x080910,.9,.06);
  curveTube(root,[[0,.98,-1.59],[0,1.08,-1.13],[0,1.13,-.42]],.019,seam,14);
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.22,24),wheelMat);
  wheel.rotation.z=Math.PI/2;
  wheel.position.set(0,1.20,-.96);root.add(wheel);
  for(let k=0;k<12;k++){
    const theta=k*Math.PI*2/12;
    curveTube(root,[[-.105,1.20+Math.cos(theta)*.178,-.96+Math.sin(theta)*.178],[.105,1.20+Math.cos(theta)*.178,-.96+Math.sin(theta)*.178]],.008,rubber,2);
  }
  // DPI keys in the midline behind the wheel.
  const dpi=box(.32,.07,.25,graphite,root,0,1.043,-.42);
  dpi.rotation.x=-.08;
  box(.23,.066,.16,matte,root,0,1.03,-.15);
  // Ribbed left-side ergonomic grip and two extra side buttons.
  const leftGrip=box(.048,.46,1.36,rubber,root,-.78,.37,.32);
  leftGrip.rotation.z=-.15;
  for(let k=0;k<8;k++){
    curveTube(root,[[-.82,.28,.76-k*.15],[-.84,.48,.76-k*.15]],.011,graphite,2);
  }
  box(.12,.12,.36,graphite,root,-.79,.65,-.46).rotation.z=-.2;
  box(.12,.12,.34,graphite,root,-.80,.65,-.02).rotation.z=-.2;
  // Slim contrasting RGB line across the back, as in the GM300B reference.
  curveTube(root,[[-.75,.63,.94],[-.44,.85,.94],[0,.98,.94],[.44,.85,.94],[.74,.65,.94]],.041,rgb,24);
  curveTube(root,[[-.72,.18,1.23],[-.40,.12,1.33],[0,.11,1.39],[.42,.12,1.32],[.73,.19,1.22]],.030,rgbSecond,24);
  // Logo and fine details.
  const c=document.createElement("canvas");c.width=c.height=256;
  const ctx=c.getContext("2d");ctx.clearRect(0,0,256,256);
  const grad=ctx.createLinearGradient(40,30,220,225);
  grad.addColorStop(0,"#ffa1e2");grad.addColorStop(.5,"#ff7bb0");grad.addColorStop(1,"#bd84ff");
  ctx.strokeStyle=grad;ctx.lineWidth=23;ctx.lineCap="round";
  ctx.beginPath();ctx.arc(128,127,78,-.45,Math.PI*1.75);ctx.stroke();
  ctx.beginPath();ctx.moveTo(132,135);ctx.lineTo(190,135);ctx.lineTo(190,180);ctx.stroke();
  const logoTex=new THREE.CanvasTexture(c);
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(.78,.78),new THREE.MeshBasicMaterial({
    map:logoTex,transparent:true,depthWrite:false,side:THREE.DoubleSide
  }));
  logo.rotation.x=-Math.PI/2;logo.position.set(0,1.045,.56);root.add(logo);
  // Wired USB lead exits the mouse at its narrow front.
  curveTube(root,[[0,.23,-1.77],[0,.18,-2.08],[.09,.10,-2.50],[.25,.09,-2.87]],.045,rubber,17);
  const sensorPlate=box(.52,.022,.47,graphite,root,0,.015,.07);
  return {root,glow:rgb,glow2:rgbSecond};
}
function makeScene(canvas,id) {
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"low-power"});
  }catch{return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.38;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(37,1,.1,80);
  scene.add(new THREE.HemisphereLight(0xffe8fb,0x211326,2.2));
  const keyLight=new THREE.DirectionalLight(0xfff2eb,3.0);keyLight.position.set(-5,10,8);scene.add(keyLight);
  const rim=new THREE.PointLight(0xfca0df,28,32,2);rim.position.set(4,5,-6);scene.add(rim);
  const product=new THREE.Group();scene.add(product);
  const model=id==="keyboard"?makeKeyboard(product):makeMouse(product);
  const floorMat=new THREE.MeshBasicMaterial({color:id==="keyboard"?0xb35579:0x635080,transparent:true,opacity:.13,depthWrite:false});
  const halo=new THREE.Mesh(new THREE.TorusGeometry(id==="keyboard"?5.8:2.38,id==="keyboard"?.018:.027,8,70),floorMat);
  halo.rotation.x=Math.PI/2;halo.position.y=-.46;scene.add(halo);
  const yawDefault=id==="keyboard" ? -.28 : -.42;
  const pitchDefault=id==="keyboard" ? -.22 : -.16;
  const state={yaw:yawDefault,pitch:pitchDefault,targetYaw:yawDefault,targetPitch:pitchDefault,
    pressed:false,pointer:null,lastX:0,lastY:0,lastInteraction:0,
    inView:false,disposed:false};
  product.rotation.y=yawDefault;product.rotation.x=pitchDefault;
  if(id==="keyboard"){
    product.scale.setScalar(.84);
    camera.position.set(0,7.5,16.9);camera.lookAt(0,0,0);
  }else{
    product.scale.setScalar(1.75);
    camera.position.set(0,4.3,10.9);camera.lookAt(0,.12,0);
  }
  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.fov=id==="keyboard"?(w<420?45:37):(w<420?42:37);
    camera.updateProjectionMatrix();
    render(performance.now()/1000);
  }
  const ro=new ResizeObserver(resize);
  ro.observe(canvas);
  function render(t){
    if(state.disposed)return;
    const ease=reduced.matches?1:.18;
    state.yaw+= (state.targetYaw-state.yaw)*ease;
    state.pitch+=(state.targetPitch-state.pitch)*ease;
    const calm=!state.pressed&&!reduced.matches;
    const timeSince=t*1000-state.lastInteraction;
    const factor=calm?Math.min(1,Math.max(0,(timeSince-2000)/1200)):0;
    product.rotation.y=state.yaw+Math.sin(t*.33+(id==="mouse"?.75:0))*.11*factor;
    product.rotation.x=state.pitch+Math.sin(t*.42)*.035*factor;
    product.position.y=(reduced.matches?0:Math.sin(t*.95+(id==="mouse"?2:0))*.07);
    if(id==="mouse" && model.glow){
      model.glow.emissiveIntensity=reduced.matches?1:1.0+.40*Math.sin(t*1.7);
    }
    renderer.render(scene,camera);
  }
  canvas.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse"&&e.button!==0)return;
    state.pressed=true;state.pointer=e.pointerId;
    state.lastX=e.clientX;state.lastY=e.clientY;
    state.lastInteraction=performance.now();
    canvas.classList.add("dragging");canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove",e=>{
    if(!state.pressed||e.pointerId!==state.pointer)return;
    state.targetYaw+=(e.clientX-state.lastX)*.0125;
    state.targetPitch=THREE.MathUtils.clamp(state.targetPitch+(e.clientY-state.lastY)*.009,-1.25,1.20);
    state.lastX=e.clientX;state.lastY=e.clientY;
    state.lastInteraction=performance.now();
    render(state.lastInteraction/1000);
  });
  const release=e=>{
    if(e.pointerId!==state.pointer)return;
    state.pressed=false;state.pointer=null;canvas.classList.remove("dragging");
    state.lastInteraction=performance.now();
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener("pointerup",release);
  canvas.addEventListener("pointercancel",release);
  canvas.addEventListener("lostpointercapture",()=>{state.pressed=false;state.pointer=null;canvas.classList.remove("dragging")});
  canvas.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft")state.targetYaw-=.24;
    else if(e.key==="ArrowRight")state.targetYaw+=.24;
    else if(e.key==="ArrowUp")state.targetPitch=Math.max(-1.25,state.targetPitch-.17);
    else if(e.key==="ArrowDown")state.targetPitch=Math.min(1.2,state.targetPitch+.17);
    else if(e.key==="Home"){state.targetPitch=pitchDefault;state.targetYaw=yawDefault;}
    else return;
    e.preventDefault();state.lastInteraction=performance.now();render(state.lastInteraction/1000);
  });
  const button=document.querySelector('[data-reset-device="'+id+'"]');
  button?.addEventListener("click",()=>{
    state.targetYaw=yawDefault;state.targetPitch=pitchDefault;
    state.lastInteraction=performance.now();render(state.lastInteraction/1000);
    canvas.focus({preventScroll:true});
  });
  canvas.addEventListener("webglcontextlost",e=>{
    e.preventDefault();state.disposed=true;
    canvas.closest(".device-panel")?.classList.remove("is-3d");
  });
  canvas.closest(".device-panel")?.classList.add("is-3d");
  resize();
  return {state,render};
}
for(const id of ["keyboard","mouse"]){
  const canvas=document.getElementById(id+"3d");
  if(!canvas)continue;
  const scene=makeScene(canvas,id);
  if(scene)stages.push(scene);
}
if(stages.length) {
  const observer=new IntersectionObserver(entries=>{
    for(const e of entries) {
      const active=stages.find(s=>s.state && s.state.canvas===e.target);
      if(active)active.state.inView=e.isIntersecting;
    }
  },{rootMargin:"120px"});
  for(const s of stages){
    s.state.canvas=document.getElementById(s.state.modelId+"3d");
  }
  // Associate 3D instances with their canvases for visibility throttling.
  stages.forEach((s,i)=>{
    s.state.canvas=document.getElementById((i===0?"keyboard":"mouse")+"3d");
    observer.observe(s.state.canvas);
  });
  let last=0;
  function loop(ms){
    requestAnimationFrame(loop);
    if(document.hidden||ms-last<(reduced.matches?160:33))return;
    last=ms;
    for(const s of stages){
      if(s.state.inView&&!s.state.disposed)s.render(ms/1000);
    }
  }
  requestAnimationFrame(loop);
}
