import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* Genuine WebGL lantern. The original SVG remains visible if WebGL is unavailable. */
const canvas = document.getElementById("lantern3d");
const container = document.getElementById("fireflyLantern");
if (canvas && container) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  } catch {
    renderer = null;
  }

  if(renderer) {
    renderer.setClearColor(0,0);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.26;
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1.8,1.8,3.05,-3.05,.1,30);
    camera.position.set(0,0,10);camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffead8,2.0));
    const key=new THREE.DirectionalLight(0xffd9b9,3.0);
    key.position.set(-3,5,7);scene.add(key);
    const rim=new THREE.PointLight(0xffc8a1,18,7,2);
    rim.position.set(1.8,0,-1);scene.add(rim);

    const jar=new THREE.Group();
    const rest=new THREE.Vector2(0,-.68);
    const pos=rest.clone(),vel=new THREE.Vector2(),goal=rest.clone();
    jar.position.set(pos.x,pos.y,0);scene.add(jar);
    const anchor=new THREE.Vector3(0,2.98,0);

    // Hand-painted, gently quantized game-style lighting instead of photoreal metal.
    const ramp=new Uint8Array([90,155,220,255]);
    const toonGradient=new THREE.DataTexture(ramp,4,1,THREE.RedFormat);
    toonGradient.minFilter=THREE.NearestFilter;
    toonGradient.magFilter=THREE.NearestFilter;
    toonGradient.needsUpdate=true;
    const paint=(color)=>new THREE.MeshToonMaterial({color,gradientMap:toonGradient});
    const glass=new THREE.MeshPhongMaterial({
      color:0xe2e5d9,transparent:true,opacity:.34,depthWrite:false,
      side:THREE.DoubleSide,shininess:116,specular:0xfff7e9
    });
    const metal=paint(0x868078); // matte metal screw lid
    const gold=paint(0xc7ae84); // muted brass
    const profile=[
      [.29,-1.08],[.49,-1.08],[.65,-1.0],[.71,-.88],[.75,-.60],
      [.75,.36],[.70,.64],[.60,.86],[.53,.92],[.52,1.02],[.49,1.08]
    ].map(p=>new THREE.Vector2(...p));
    const jarGeometry=new THREE.LatheGeometry(profile,36);
    const ink=new THREE.Mesh(jarGeometry,new THREE.MeshBasicMaterial({
      color:0x745564,side:THREE.BackSide,transparent:true,opacity:.49,depthWrite:false
    }));
    ink.scale.set(1.055,1.018,1.055);ink.renderOrder=1;jar.add(ink);
    const body=new THREE.Mesh(jarGeometry,glass);
    body.renderOrder=3;jar.add(body);
    function hoop(radius,tube,y,mat){
      const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,7,48),mat);
      m.rotation.x=Math.PI/2;m.position.y=y;jar.add(m);
    }
    hoop(.67,.034,-.95,gold);hoop(.54,.036,.91,gold);
    const lid=new THREE.Mesh(new THREE.CylinderGeometry(.622,.59,.24,20),metal);
    lid.position.y=1.07;jar.add(lid);
    hoop(.616,.032,1.17,gold);hoop(.602,.024,1.01,gold);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.54,.54,.045,20),gold);
    top.position.y=1.188;jar.add(top);
    const loop=new THREE.Mesh(new THREE.TorusGeometry(.15,.039,10,28),gold);
    loop.position.y=1.34;jar.add(loop);
    const knot=new THREE.Mesh(new THREE.SphereGeometry(.082,12,8),gold);
    knot.position.y=1.48;jar.add(knot);

    // Colored glints and a second transparent layer make the glass feel rounded.
    const glint=new THREE.Mesh(new THREE.CylinderGeometry(.757,.751,.72,24,1,true,2.60,.18),
      new THREE.MeshBasicMaterial({color:0xfff5ff,transparent:true,opacity:.21,depthWrite:false,side:THREE.DoubleSide}));
    glint.position.y=-.05;jar.add(glint);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.54,.52,.024,40),
      new THREE.MeshPhysicalMaterial({color:0xffdbb6,transparent:true,opacity:.2,depthWrite:false}));
    base.position.y=-.97;jar.add(base);


    // Vintage illustration label: canvas painted locally; no external texture assets.
    const stickerCanvas=document.createElement("canvas");
    stickerCanvas.width=512;stickerCanvas.height=256;
    const pen=stickerCanvas.getContext("2d");
    pen.clearRect(0,0,512,256);
    pen.fillStyle="#dcd1b5";
    pen.strokeStyle="#77716b";pen.lineWidth=13;
    pen.beginPath();pen.roundRect(30,35,452,185,28);pen.fill();pen.stroke();
    pen.setLineDash([9,13]);pen.strokeStyle="#96907e";pen.lineWidth=4;
    pen.beginPath();pen.roundRect(48,52,416,150,20);pen.stroke();
    pen.setLineDash([]);
    pen.fillStyle="#49464b";pen.textAlign="center";
    pen.font="bold 53px ui-monospace, monospace";pen.fillText("FIREFLY / 01",256,133);
    pen.font="600 23px ui-monospace, monospace";pen.fillText("COLLECTED LIGHT / STUDIO",256,170);
    const stickerTexture=new THREE.CanvasTexture(stickerCanvas);
    stickerTexture.colorSpace=THREE.SRGBColorSpace;
    const sticker=new THREE.Mesh(
      new THREE.PlaneGeometry(.90,.46),
      new THREE.MeshBasicMaterial({map:stickerTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide})
    );
    sticker.position.set(0,-.46,.775);
    sticker.rotation.x=-.08;sticker.renderOrder=5;jar.add(sticker);

    // Hand-painted enamel lid dashes and stamped rivets give the jar a crafted prop look.
    const lidDetail=paint(0x555253);
    for(let i=0;i<16;i++){
      const angle=i*Math.PI*2/16;
      const dash=new THREE.Mesh(new THREE.BoxGeometry(.10,.034,.026),lidDetail);
      dash.position.set(Math.sin(angle)*.613,1.07,Math.cos(angle)*.613);
      dash.rotation.y=angle;
      jar.add(dash);
    }

    // Leather pull tag and metal rivet — subdued outdoor gear styling.
    const strap=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(.53,1.01,.12),new THREE.Vector3(.72,.80,.12),new THREE.Vector3(.73,.61,.12)
    ]),14,.027,6,false),paint(0x8f6f5e));jar.add(strap);
    const metalTag=new THREE.Mesh(new THREE.BoxGeometry(.20,.28,.06),paint(0x545055));
    metalTag.position.set(.73,.52,.12);metalTag.rotation.z=.13;jar.add(metalTag);
    const rivet=new THREE.Mesh(new THREE.SphereGeometry(.047,9,6),gold);
    rivet.position.set(.73,.61,.17);jar.add(rivet);

    // Tiny firefly home: leaves, pebbles and painted stars along the bottom.
    const leafMat=paint(0x748574),stoneMat=paint(0xa89f92);
    for(let i=0;i<5;i++){
      const phase=i*2.39996;
      const stone=new THREE.Mesh(new THREE.SphereGeometry(.10+(i%2)*.025,9,6),stoneMat);
      stone.scale.set(1,.38,.75);
      stone.position.set(Math.sin(phase)*.35,-.99,Math.cos(phase)*.27);jar.add(stone);
      const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16,9,7),leafMat);
      leaf.scale.set(.45,1,.25);
      leaf.position.set(Math.sin(phase)*.29,-.83,Math.cos(phase)*.23);
      leaf.rotation.z=phase;jar.add(leaf);
    }
    const glowCanvas=document.createElement("canvas");
    glowCanvas.width=glowCanvas.height=64;
    const ctx=glowCanvas.getContext("2d");
    const grad=ctx.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0,"rgba(255,251,211,1)");
    grad.addColorStop(.17,"rgba(255,246,166,.89)");
    grad.addColorStop(.48,"rgba(255,231,136,.27)");
    grad.addColorStop(1,"rgba(255,224,107,0)");
    ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
    const glow=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),
      color:0xffe9a7,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const wingMat=new THREE.MeshBasicMaterial({color:0xfff9d5,side:THREE.DoubleSide,transparent:true,opacity:.88,depthWrite:false});
    const lightMat=new THREE.MeshBasicMaterial({color:0xfff2b0});
    const bugs=[
      [-.23,.46,.17,0], [.26,.14,-.15,1.4], [-.28,-.36,.22,2.8],
      [.24,-.59,.12,4.3], [.08,-.10,.29,5.2]
    ].map(([x,y,z,phase],i)=>{
      const g=new THREE.Group();g.position.set(x,y,z);
      const abdomen=new THREE.Mesh(new THREE.SphereGeometry(.061,10,8),lightMat);
      abdomen.scale.set(.72,.95,.72);g.add(abdomen);
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.013,7,6),new THREE.MeshBasicMaterial({color:0x755b4a}));
      dot.position.set(.021,.008,.045);g.add(dot);
      for(const direction of [-1,1]){
        const wing=new THREE.Mesh(new THREE.SphereGeometry(.067,8,6),wingMat);
        wing.scale.set(1.0,.21,.40);
        wing.position.set(direction*.062,.045,-.01);
        wing.rotation.z=direction*.50;g.add(wing);
      }
      const sprite=new THREE.Sprite(glow);
      const radius=.48+(i%3)*.075;
      sprite.scale.set(radius,radius,1);g.add(sprite);
      jar.add(g);return {g,x,y,z,phase,i};
    });
    const bugLamp=new THREE.PointLight(0xffe6a2,7.3,3.6);
    bugLamp.position.set(0,-.15,.35);jar.add(bugLamp);
    const ambientGold=new THREE.PointLight(0xffdd95,8.4,4.1);
    scene.add(ambientGold);

    // Genuine tubular 3D rope. Shape updates continuously between fixed anchor and moving lid.
    const ropeMaterial=paint(0xcdbb9a);
    const threadMaterial=paint(0x847464);
    const rope=new THREE.Mesh(new THREE.BufferGeometry(),ropeMaterial);
    const thread=new THREE.Mesh(new THREE.BufferGeometry(),threadMaterial);
    scene.add(rope,thread);
    const topFastener=new THREE.Mesh(new THREE.SphereGeometry(.085,12,10),gold);
    topFastener.position.copy(anchor);scene.add(topFastener);
    function updateRope(t){
      const end=jar.localToWorld(new THREE.Vector3(0,1.49,0));
      const mid=anchor.clone().lerp(end,.52);
      mid.x+=Math.sin(t*.65)*.04;
      mid.y-=.048+Math.abs(end.x)*.065;
      const curve=new THREE.CatmullRomCurve3([
        anchor.clone(),anchor.clone().lerp(mid,.45),mid,mid.clone().lerp(end,.6),end
      ],false,"centripetal");
      const newGeometry=new THREE.TubeGeometry(curve,22,.043,7,false);
      rope.geometry.dispose();rope.geometry=newGeometry;
      const side=new THREE.Vector3(.014,0,.021);
      const braided=new THREE.CatmullRomCurve3([
        anchor.clone().add(side),anchor.clone().lerp(mid,.48).add(side),
        mid.clone().add(side),mid.clone().lerp(end,.6).add(side),end.clone().add(side)
      ]);
      const newThread=new THREE.TubeGeometry(braided,22,.014,5,false);
      thread.geometry.dispose();thread.geometry=newThread;
    }
    function constrain(v){
      v.x=THREE.MathUtils.clamp(v.x,-1.10,1.10);
      v.y=THREE.MathUtils.clamp(v.y,-1.38,.63);
      // Rope cannot stretch beyond its visual length.
      const delta=new THREE.Vector2(v.x,v.y+1.49-anchor.y);
      const length=delta.length();
      if(length>3.60){
        delta.multiplyScalar(3.60/length);
        v.set(delta.x,anchor.y+delta.y-1.49);
      }
    }

    // The entire jar is now movable in screen coordinates (see app.js).
    let dragging=false;

    function draw(t){
      jar.position.set(pos.x,pos.y,0);
      jar.rotation.set(Math.sin(t*.89)*.045,Math.sin(t*.76)*.13,-pos.x*.20+Math.sin(t*.73)*.022);
      ambientGold.position.set(pos.x,pos.y-.28,.9);
      if(!reduced.matches){
        bugs.forEach(b=>{
          b.g.position.set(b.x+Math.sin(t*(.9+b.i*.11)+b.phase)*.10,
            b.y+Math.cos(t*(.81+b.i*.09)+b.phase)*.095,
            b.z+Math.sin(t*(.64+b.i*.09)+b.phase)*.065);
          b.g.rotation.z=Math.sin(t*9+b.phase)*.35;
        });
      }
      updateRope(t);
      renderer.render(scene,camera);
    }
    function simulate(dt,t){
      if(dragging)return;
      const n=Math.min(2.2,dt/16.67);
      const targetX=reduced.matches?0:Math.sin(t*.71)*.135;
      const targetY=rest.y+(reduced.matches?0:Math.sin(t*.95)*.015);
      vel.x+=(targetX-pos.x)*.016*n;
      vel.y+=(targetY-pos.y)*.021*n;
      vel.multiplyScalar(Math.pow(.942,n));
      pos.addScaledVector(vel,n);
      constrain(pos);
    }
    function resize(){
      const width=Math.max(1,canvas.clientWidth);
      const height=Math.max(1,canvas.clientHeight);
      renderer.setSize(width,height,false);
      const worldHeight=6.13;
      camera.left=-worldHeight*width/height/2;camera.right=worldHeight*width/height/2;
      camera.top=worldHeight/2;camera.bottom=-worldHeight/2;
      camera.updateProjectionMatrix();
      draw(performance.now()/1000);
    }
    const observer=new ResizeObserver(resize);
    observer.observe(canvas);
    let working=true,last=0,previous=0;
    function frame(time){
      if(!working)return;
      requestAnimationFrame(frame);
      if(document.hidden||reduced.matches||time-last<25)return;
      simulate(Math.min(50,time-(previous||time)),time/1000);
      previous=time;last=time;
      draw(time/1000);
    }
    canvas.addEventListener("webglcontextlost",e=>{
      e.preventDefault();working=false;container.classList.remove("is-webgl");
    });
    canvas.addEventListener("webglcontextrestored",()=>{
      working=true;resize();container.classList.add("is-webgl");requestAnimationFrame(frame);
    });
    reduced.addEventListener?.("change",()=>draw(performance.now()/1000));
    document.addEventListener("visibilitychange",()=>{previous=0;});
    resize();
    container.classList.add("is-webgl");
    requestAnimationFrame(frame);
  }
}
