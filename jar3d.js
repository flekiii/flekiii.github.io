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
    renderer.toneMappingExposure=1.35;
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1.8,1.8,3.05,-3.05,.1,30);
    camera.position.set(0,0,10);camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffe7f8,2.3));
    const key=new THREE.DirectionalLight(0xfff4ef,3.1);
    key.position.set(-3,5,7);scene.add(key);
    const rim=new THREE.PointLight(0xffa5df,24,7,2);
    rim.position.set(1.8,0,-1);scene.add(rim);

    const jar=new THREE.Group();
    const rest=new THREE.Vector2(0,-.68);
    const pos=rest.clone(),vel=new THREE.Vector2(),goal=rest.clone();
    jar.position.set(pos.x,pos.y,0);scene.add(jar);
    const anchor=new THREE.Vector3(0,2.98,0);

    const glass=new THREE.MeshPhysicalMaterial({
      color:0xe6d3ed,transparent:true,opacity:.32,depthWrite:false,
      side:THREE.DoubleSide,roughness:.095,metalness:.03,clearcoat:1,
      clearcoatRoughness:.06,transmission:.12,thickness:.14
    });
    const metal=new THREE.MeshStandardMaterial({color:0xcda5b7,metalness:.73,roughness:.23});
    const gold=new THREE.MeshStandardMaterial({color:0xffdec8,metalness:.66,roughness:.28});
    const profile=[
      [.30,-1.04],[.46,-1.04],[.57,-.98],[.63,-.86],[.67,-.56],
      [.67,.47],[.63,.72],[.55,.86],[.52,.91],[.52,1.02],[.49,1.08]
    ].map(p=>new THREE.Vector2(...p));
    const body=new THREE.Mesh(new THREE.LatheGeometry(profile,48),glass);
    body.renderOrder=3;jar.add(body);
    function hoop(radius,tube,y,mat){
      const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,7,48),mat);
      m.rotation.x=Math.PI/2;m.position.y=y;jar.add(m);
    }
    hoop(.61,.023,-.95,glass);hoop(.53,.023,.91,gold);
    const lid=new THREE.Mesh(new THREE.CylinderGeometry(.615,.58,.21,48),metal);
    lid.position.y=1.07;jar.add(lid);
    hoop(.602,.019,1.16,gold);hoop(.59,.015,1.02,gold);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.026,48),gold);
    top.position.y=1.188;jar.add(top);
    const loop=new THREE.Mesh(new THREE.TorusGeometry(.15,.039,10,28),gold);
    loop.position.y=1.34;jar.add(loop);
    const knot=new THREE.Mesh(new THREE.SphereGeometry(.068,12,8),metal);
    knot.position.y=1.48;jar.add(knot);

    // Colored glints and a second transparent layer make the glass feel rounded.
    const glint=new THREE.Mesh(new THREE.CylinderGeometry(.686,.686,.78,32,1,true,2.60,.14),
      new THREE.MeshBasicMaterial({color:0xfff5ff,transparent:true,opacity:.21,depthWrite:false,side:THREE.DoubleSide}));
    glint.position.y=-.03;jar.add(glint);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.54,.52,.024,40),
      new THREE.MeshPhysicalMaterial({color:0xffdbb6,transparent:true,opacity:.2,depthWrite:false}));
    base.position.y=-.97;jar.add(base);

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
    const wingMat=new THREE.MeshBasicMaterial({color:0xfff6ec,side:THREE.DoubleSide,transparent:true,opacity:.72,depthWrite:false});
    const lightMat=new THREE.MeshBasicMaterial({color:0xfff2b0});
    const bugs=[
      [-.23,.46,.17,0], [.26,.14,-.15,1.4], [-.28,-.36,.22,2.8],
      [.24,-.59,.12,4.3], [.08,-.10,.29,5.2]
    ].map(([x,y,z,phase],i)=>{
      const g=new THREE.Group();g.position.set(x,y,z);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(.034,8,6),lightMat));
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
    const bugLamp=new THREE.PointLight(0xffe6a2,5.7,3.5);
    bugLamp.position.set(0,-.15,.35);jar.add(bugLamp);
    const ambientGold=new THREE.PointLight(0xffe3a6,6.5,3.8);
    scene.add(ambientGold);

    // Genuine tubular 3D rope. Shape updates continuously between fixed anchor and moving lid.
    const ropeMaterial=new THREE.MeshStandardMaterial({color:0xd3adae,roughness:.88,metalness:.03});
    const threadMaterial=new THREE.MeshStandardMaterial({color:0x8a657c,roughness:.86});
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
      const newGeometry=new THREE.TubeGeometry(curve,22,.034,6,false);
      rope.geometry.dispose();rope.geometry=newGeometry;
      const side=new THREE.Vector3(.014,0,.021);
      const braided=new THREE.CatmullRomCurve3([
        anchor.clone().add(side),anchor.clone().lerp(mid,.48).add(side),
        mid.clone().add(side),mid.clone().lerp(end,.6).add(side),end.clone().add(side)
      ]);
      const newThread=new THREE.TubeGeometry(braided,22,.009,5,false);
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

    let pointer=null,dragging=false,beginX=0,beginY=0,originalX=0,originalY=0,dx=0,dy=0;
    canvas.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse"&&e.button!==0)return;
      pointer=e.pointerId;dragging=true;
      beginX=e.clientX;beginY=e.clientY;originalX=pos.x;originalY=pos.y;
      dx=dy=0;vel.set(0,0);
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor="grabbing";
      e.preventDefault();
    });
    canvas.addEventListener("pointermove",e=>{
      if(!dragging||e.pointerId!==pointer)return;
      const rect=canvas.getBoundingClientRect();
      dx=e.movementX||0;dy=e.movementY||0;
      goal.set(originalX+(e.clientX-beginX)*3.6/Math.max(60,rect.width),
        originalY-(e.clientY-beginY)*6/Math.max(80,rect.height));
      constrain(goal);pos.copy(goal);vel.set(0,0);
      draw(performance.now()/1000);
    });
    const finish=e=>{
      if(e.pointerId!==pointer)return;
      pointer=null;dragging=false;vel.set(dx*.0018,-dy*.0018);
      canvas.style.cursor="grab";
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener("pointerup",finish);
    canvas.addEventListener("pointercancel",finish);
    canvas.addEventListener("lostpointercapture",()=>{pointer=null;dragging=false;canvas.style.cursor="grab";});
    canvas.addEventListener("keydown",e=>{
      const step=.15;
      if(e.key==="ArrowLeft")pos.x-=step;else if(e.key==="ArrowRight")pos.x+=step;
      else if(e.key==="ArrowUp")pos.y+=step;else if(e.key==="ArrowDown")pos.y-=step;
      else if(e.key==="Home"){pos.copy(rest);vel.set(0,0);}else return;
      constrain(pos);e.preventDefault();draw(performance.now()/1000);
    });

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
