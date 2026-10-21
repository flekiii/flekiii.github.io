/* Anchored cord, responsive to dragging, with natural tension and soft release. */
(() => {
  "use strict";
  const jar=document.getElementById("fireflyLantern");
  const handle=document.getElementById("lantern3d");
  const svg=document.getElementById("lanternTether");
  if(!jar||!handle||!svg)return;
  const mount=svg.querySelector("#tetherMount");
  const cord=svg.querySelector("#tetherCord");
  const shadow=svg.querySelector("#tetherShadow");
  const thread=svg.querySelector("#tetherBraided");
  const stitch=svg.querySelector("#tetherStitch");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const storeKey="flekiii-hanging-lantern-v4";
  const oldKey="flekiii-lantern-position-v2";
  let dragging=false,active=null,grabX=0,grabY=0;
  let wobbleUntil=0,wobbleBase=0,raf=0;
  function bounds(){
    return {w:Math.max(44,jar.getBoundingClientRect().width),h:Math.max(80,jar.getBoundingClientRect().height)};
  }
  function constrain(x,y){
    const b=bounds();
    return {x:Math.max(2,Math.min(Math.max(2,innerWidth-b.w-2),x)),
      y:Math.max(2,Math.min(Math.max(2,innerHeight-b.h-2),y))};
  }
  function setPosition(x,y,persist=true){
    const p=constrain(x,y);
    jar.style.left=p.x+"px";
    jar.style.top=p.y+"px";
    jar.style.right="auto";
    jar.classList.add("custom-position");
    if(persist){
      try{localStorage.setItem(storeKey,JSON.stringify(p));}catch{}
    }
    updateCable();
  }
  const fixtureX=()=>Math.max(28,innerWidth-(innerWidth<650?70:105));
  function updateCable(now=performance.now()){
    const r=jar.getBoundingClientRect(),x0=fixtureX(),y0=0;
    const endX=r.left+r.width*.50;
    const endY=r.top+r.height*.268;
    const dx=endX-x0,dy=endY-y0;
    const distance=Math.hypot(dx,dy);
    const slack=Math.min(90,Math.max(12,distance*.085));
    const waving=now<wobbleUntil&&!reduced.matches ?
      Math.sin((now-wobbleBase)*.033)*Math.max(0,(wobbleUntil-now)/(wobbleUntil-wobbleBase))*15:0;
    const control1x=x0+dx*.10+Math.sign(dx||1)*slack*.2+waving*.4;
    const control1y=y0+Math.max(38,dy*.30);
    const control2x=endX-dx*.16+Math.sign(dx||1)*slack*.25+waving;
    const control2y=endY-Math.max(26,dy*.16)+slack*.3;
    const shape="M "+x0.toFixed(1)+" "+y0+" C "+control1x.toFixed(1)+" "+control1y.toFixed(1)+" "+control2x.toFixed(1)+" "+control2y.toFixed(1)+" "+endX.toFixed(1)+" "+endY.toFixed(1);
    [cord,shadow,thread,stitch].forEach(path=>path?.setAttribute("d",shape));
    mount?.setAttribute("transform","translate("+x0.toFixed(1)+" 5)");
    svg.setAttribute("viewBox","0 0 "+Math.max(1,innerWidth)+" "+Math.max(1,innerHeight));
    svg.setAttribute("width",String(Math.max(1,innerWidth)));
    svg.setAttribute("height",String(Math.max(1,innerHeight)));
  }
  function motion(t){
    updateCable(t);
    if(t<wobbleUntil)raf=requestAnimationFrame(motion);
    else raf=0;
  }
  function release(e){
    if(e.pointerId!==active)return;
    dragging=false;active=null;
    jar.classList.remove("is-moving");
    const r=jar.getBoundingClientRect();
    setPosition(r.left,r.top,true);
    if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
    wobbleBase=performance.now();
    wobbleUntil=wobbleBase+(reduced.matches?0:620);
    cancelAnimationFrame(raf);
    if(!reduced.matches)raf=requestAnimationFrame(motion);
  }
  handle.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse"&&e.button!==0)return;
    const r=jar.getBoundingClientRect();
    active=e.pointerId;dragging=true;
    grabX=e.clientX-r.left;grabY=e.clientY-r.top;
    cancelAnimationFrame(raf);raf=0;wobbleUntil=0;
    jar.classList.add("is-moving");
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  handle.addEventListener("pointermove",e=>{
    if(!dragging||e.pointerId!==active)return;
    setPosition(e.clientX-grabX,e.clientY-grabY,false);
    e.preventDefault();
  });
  handle.addEventListener("pointerup",release);
  handle.addEventListener("pointercancel",release);
  handle.addEventListener("lostpointercapture",()=>{
    if(!dragging)return;
    dragging=false;active=null;
    jar.classList.remove("is-moving");
    const r=jar.getBoundingClientRect();
    setPosition(r.left,r.top,true);
  });
  handle.addEventListener("dragstart",e=>e.preventDefault());
  handle.addEventListener("selectstart",e=>e.preventDefault());
  function reset(){
    jar.style.removeProperty("left");
    jar.style.removeProperty("top");
    jar.style.removeProperty("right");
    jar.classList.remove("custom-position");
    try{localStorage.removeItem(storeKey);localStorage.removeItem(oldKey);}catch{}
    requestAnimationFrame(updateCable);
  }
  handle.addEventListener("dblclick",reset);
  handle.addEventListener("keydown",e=>{
    if(e.key==="Home"){reset();e.preventDefault();return;}
    const r=jar.getBoundingClientRect();
    const delta=e.shiftKey?32:14;
    let x=r.left,y=r.top;
    if(e.key==="ArrowLeft")x-=delta;
    else if(e.key==="ArrowRight")x+=delta;
    else if(e.key==="ArrowUp")y-=delta;
    else if(e.key==="ArrowDown")y+=delta;
    else return;
    e.preventDefault();setPosition(x,y,true);
  });
  let previous=null;
  try{previous=JSON.parse(localStorage.getItem(storeKey)||localStorage.getItem(oldKey)||"null");}catch{}
  if(previous&&Number.isFinite(previous.x)&&Number.isFinite(previous.y))setPosition(previous.x,previous.y,false);
  else updateCable();
  addEventListener("resize",()=>{
    if(jar.classList.contains("custom-position")){
      const r=jar.getBoundingClientRect();
      setPosition(r.left,r.top,true);
    }
    requestAnimationFrame(updateCable);
  },{passive:true});
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden)requestAnimationFrame(updateCable);
  });
  if("ResizeObserver" in window)new ResizeObserver(()=>requestAnimationFrame(updateCable)).observe(jar);
})();
