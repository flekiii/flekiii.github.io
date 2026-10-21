import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.getElementById("earthCanvas");
const host=canvas?.closest(".earth-stage");
if(canvas && host){
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});}
  catch{renderer=null;}
  if(renderer){
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    renderer.setClearColor(0,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.42;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);
    camera.position.z=7.55;
    const light=new THREE.DirectionalLight(0xe1ebff,3.4);
    light.position.set(-3,2.1,4);scene.add(light);
    const fill=new THREE.AmbientLight(0x5b8cb8,.55);scene.add(fill);
    const rim=new THREE.DirectionalLight(0x306dc1,2.2);
    rim.position.set(4,0,-2);scene.add(rim);

    const world=new THREE.Group();scene.add(world);
    const tilt=new THREE.Group();tilt.rotation.z=.408;world.add(tilt);
    const globe=new THREE.Mesh(new THREE.SphereGeometry(1.57,72,54),
      new THREE.MeshPhongMaterial({color:0x90c2ea,shininess:18,specular:0x324254,emissive:0x051021,emissiveIntensity:.16}));
    tilt.add(globe);
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.585,64,46),
      new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.22,depthWrite:false}));
    tilt.add(clouds);
    // Soft atmospheric Fresnel glow around the dark edge.
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.66,64,48),
      new THREE.ShaderMaterial({
        side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
        uniforms:{glowColor:{value:new THREE.Color(0x3d9cf1)}},
        vertexShader:"varying vec3 vNormal; varying vec3 vEye; void main(){vec4 wp=modelMatrix*vec4(position,1.0);vNormal=normalize(mat3(modelMatrix)*normal);vEye=normalize(cameraPosition-wp.xyz);gl_Position=projectionMatrix*viewMatrix*wp;}",
        fragmentShader:"varying vec3 vNormal; varying vec3 vEye; uniform vec3 glowColor; void main(){float d=abs(dot(normalize(vNormal),normalize(vEye)));float glow=pow(1.0-d,3.0);gl_FragColor=vec4(glowColor,glow*.5);}"
      }));tilt.add(atmosphere);

    // The Moon follows an elliptical projected orbit; its own textured surface spins slowly.
    const lunarCanvas=document.createElement("canvas");
    lunarCanvas.width=512;lunarCanvas.height=256;
    const craterContext=lunarCanvas.getContext("2d");
    craterContext.fillStyle="#b7b8b7";craterContext.fillRect(0,0,512,256);
    let lunarSeed=5149;
    const lunaRandom=()=>{lunarSeed=(1664525*lunarSeed+1013904223)>>>0;return lunarSeed/4294967296;};
    for(let i=0;i<950;i++){
      const x=lunaRandom()*512,y=lunaRandom()*256;
      const radius=1+lunaRandom()*12;
      craterContext.beginPath();craterContext.arc(x,y,radius,0,Math.PI*2);
      craterContext.fillStyle="rgba(42,48,55,"+(.028+lunaRandom()*.10)+")";
      craterContext.fill();
      if(i%3===0){
        craterContext.beginPath();craterContext.arc(x-radius*.13,y-radius*.15,radius*.73,0,Math.PI*2);
        craterContext.strokeStyle="rgba(248,246,239,.10)";craterContext.lineWidth=1.4;craterContext.stroke();
      }
    }
    const lunarTexture=new THREE.CanvasTexture(lunarCanvas);
    lunarTexture.colorSpace=THREE.SRGBColorSpace;
    const moon=new THREE.Mesh(
      new THREE.SphereGeometry(.30,48,36),
      new THREE.MeshStandardMaterial({map:lunarTexture,color:0xe5e4e0,roughness:.96,metalness:0})
    );
    scene.add(moon);
    const moonlight=new THREE.DirectionalLight(0xffefdd,1.5);
    moonlight.position.set(-4,2.5,5);scene.add(moonlight);
    const orbitPoints=[];
    for(let i=0;i<=160;i++){
      const th=i/160*Math.PI*2;
      orbitPoints.push(new THREE.Vector3(Math.cos(th)*2.26,Math.sin(th)*1.34,Math.sin(th+.4)*.45));
    }
    const orbitTrack=new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbitPoints),
      new THREE.LineBasicMaterial({color:0x82b4df,transparent:true,opacity:.20,depthWrite:false})
    );
    scene.add(orbitTrack);
    // Sun is set far behind the Earth: smaller apparent size, warm radial corona.
    const sunPosition=new THREE.Vector3(-3.05,2.23,-5.5);
    const sun=new THREE.Mesh(
      new THREE.SphereGeometry(.80,48,32),
      new THREE.MeshBasicMaterial({color:0xffe2a3})
    );
    sun.position.copy(sunPosition);scene.add(sun);
    const glowCanvas=document.createElement("canvas");
    glowCanvas.width=glowCanvas.height=256;
    const glowContext=glowCanvas.getContext("2d");
    const gradient=glowContext.createRadialGradient(128,128,6,128,128,126);
    gradient.addColorStop(0,"rgba(255,249,217,1)");
    gradient.addColorStop(.13,"rgba(255,226,158,.96)");
    gradient.addColorStop(.22,"rgba(255,195,93,.68)");
    gradient.addColorStop(.45,"rgba(255,155,50,.25)");
    gradient.addColorStop(1,"rgba(255,120,29,0)");
    glowContext.fillStyle=gradient;glowContext.fillRect(0,0,256,256);
    const corona=new THREE.Sprite(new THREE.SpriteMaterial({
      map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,
      blending:THREE.AdditiveBlending,color:0xffeac8
    }));
    corona.position.copy(sunPosition);
    corona.scale.set(4.7,4.7,1);scene.add(corona);
    const solarLight=new THREE.DirectionalLight(0xffd3a0,1.65);
    solarLight.position.set(-4,3,3);scene.add(solarLight);

    // Verified upstream Three.js planetary examples, CORS-capable image hosting.
    const base="https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/";
    const loader=new THREE.TextureLoader();loader.setCrossOrigin("anonymous");
    let loaded=false;
    loader.load(base+"earth_atmos_2048.jpg",texture=>{
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      globe.material.map=texture;globe.material.color.set(0xffffff);globe.material.needsUpdate=true;
      loaded=true;host.classList.add("earth-ready");render(performance.now()/1000);
    },undefined,()=>host.classList.remove("earth-ready"));
    loader.load(base+"earth_clouds_1024.png",texture=>{
      texture.colorSpace=THREE.SRGBColorSpace;clouds.material.map=texture;clouds.material.needsUpdate=true;
    },undefined,()=>{clouds.visible=false;});

    let seed=27198;
    const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    const points=[];
    for(let i=0;i<560;i++){
      const phi=random()*Math.PI*2,r=4.1+random()*13;
      points.push(Math.sin(phi)*r,(random()-.5)*18,Math.cos(phi)*r-7);
    }
    const starGeo=new THREE.BufferGeometry();
    starGeo.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
    const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xc6dafa,size:.034,sizeAttenuation:true,opacity:.72,transparent:true,depthWrite:false}));
    scene.add(stars);

    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    let yaw=-.18,pitch=.08,goalYaw=yaw,goalPitch=pitch,lastTouch=0;
    let grabbing=false,pointer=null,lastX=0,lastY=0;
    function render(t){
      const k=reduced.matches?1:.16;
      yaw+=(goalYaw-yaw)*k;
      pitch+=(goalPitch-pitch)*k;
      world.rotation.set(pitch,yaw,0);
      if(!reduced.matches && !grabbing && t*1000-lastTouch>600)goalYaw+=.0017;
      clouds.rotation.y=t*.008;
      // The Moon moves around the Earth rather than rotating in place.
      const moonPhase=t*.31+.42;
      moon.position.set(Math.cos(moonPhase)*2.26,Math.sin(moonPhase)*1.34,Math.sin(moonPhase+.4)*.45);
      moon.rotation.y=t*.07;
      corona.material.rotation=reduced.matches?0:Math.sin(t*.16)*.012;
      corona.scale.setScalar(4.7+(reduced.matches?0:Math.sin(t*.8)*.08));
      stars.rotation.y=t*.0007;
      renderer.render(scene,camera);
    }
    function resize(){
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
      renderer.setSize(w,h,false);
      camera.aspect=w/h;camera.fov=w<420?48:42;camera.updateProjectionMatrix();
      render(performance.now()/1000);
    }
    new ResizeObserver(resize).observe(canvas);
    canvas.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse"&&e.button!==0)return;
      pointer=e.pointerId;grabbing=true;lastX=e.clientX;lastY=e.clientY;
      lastTouch=performance.now();canvas.setPointerCapture(e.pointerId);canvas.classList.add("dragging");
      e.preventDefault();
    });
    canvas.addEventListener("pointermove",e=>{
      if(!grabbing||e.pointerId!==pointer)return;
      goalYaw+=(e.clientX-lastX)*.008;
      goalPitch=THREE.MathUtils.clamp(goalPitch+(e.clientY-lastY)*.005,-.82,.82);
      lastX=e.clientX;lastY=e.clientY;lastTouch=performance.now();render(lastTouch/1000);
    });
    const finish=e=>{
      if(e.pointerId!==pointer)return;
      pointer=null;grabbing=false;lastTouch=performance.now();
      canvas.classList.remove("dragging");
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener("pointerup",finish);canvas.addEventListener("pointercancel",finish);
    canvas.addEventListener("lostpointercapture",()=>{pointer=null;grabbing=false;canvas.classList.remove("dragging");});
    canvas.addEventListener("keydown",e=>{
      if(e.key==="ArrowLeft")goalYaw-=.25;
      else if(e.key==="ArrowRight")goalYaw+=.25;
      else if(e.key==="ArrowUp")goalPitch=Math.max(-.82,goalPitch-.15);
      else if(e.key==="ArrowDown")goalPitch=Math.min(.82,goalPitch+.15);
      else if(e.key==="Home"){goalPitch=.08;goalYaw=-.18;}
      else return;
      e.preventDefault();lastTouch=performance.now();render(lastTouch/1000);
    });
    canvas.addEventListener("dblclick",()=>{goalPitch=.08;goalYaw=-.18;render(performance.now()/1000);});
    let visible=true,working=true,lastFrame=0;
    new IntersectionObserver(entries=>{for(const entry of entries)visible=entry.isIntersecting;},{rootMargin:"100px"}).observe(canvas);
    function frame(ms){
      if(!working)return;
      requestAnimationFrame(frame);
      if(document.hidden||!visible||ms-lastFrame<(reduced.matches?350:33))return;
      lastFrame=ms;render(ms/1000);
    }
    canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();working=false;host.classList.remove("earth-ready");});
    canvas.addEventListener("webglcontextrestored",()=>{working=true;if(loaded)host.classList.add("earth-ready");resize();requestAnimationFrame(frame);});
    reduced.addEventListener?.("change",()=>render(performance.now()/1000));
    resize();requestAnimationFrame(frame);
  }
}
// Low-cost background stars, seeded so layout is stable between page loads.
const field=document.querySelector(".cosmic-stars");
if(field){
  let seed=7411;const items=document.createDocumentFragment();
  for(let i=0;i<120;i++){
    seed=(1664525*seed+1013904223)>>>0;
    const x=seed/4294967296*100;
    seed=(1664525*seed+1013904223)>>>0;
    const y=seed/4294967296*100;
    const star=document.createElement("span");
    star.style.left=x+"%";star.style.top=y+"%";
    star.style.opacity=.24+(seed%66)/100;
    if(i%13===0){star.style.width="2px";star.style.height="2px";}
    items.appendChild(star);
  }
  field.appendChild(items);
}