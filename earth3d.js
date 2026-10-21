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
    camera.position.z=6.4;
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
      stars.rotation.y=t*.0007;
      renderer.render(scene,camera);
    }
    function resize(){
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
      renderer.setSize(w,h,false);
      camera.aspect=w/h;camera.fov=w<420?45:40;camera.updateProjectionMatrix();
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