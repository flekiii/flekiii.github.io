"use strict";
(() => {
  const platforms=["windows","android","linux"];
  const extension={windows:/\.exe$/i,android:/\.apk$/i,linux:/\.(AppImage|deb)$/i};
  const notices={
    pending:"Installers are not publicly released yet. This page will offer verified downloads when Auth2FA has passed packaging, signing and installation checks.",
    loading:"Checking the public release information…",
    available:"Verified installer downloads are available. Always keep backup recovery codes before switching devices.",
    unavailable:"Release information is temporarily unavailable. Download buttons remain disabled rather than linking to missing files."
  };
  const $=id=>document.getElementById(id);
  $("currentYear").textContent=String(new Date().getFullYear());
  const notice=$("downloadNotice");
  function disable(platform,label="Not released yet",description="Signed, verified build required."){
    const a=$(platform+"Download");
    a.removeAttribute("href");a.removeAttribute("download");
    a.classList.add("disabled");a.setAttribute("aria-disabled","true");a.setAttribute("tabindex","-1");
    a.querySelector("span").textContent=label;
    $(platform+"Meta").textContent=description;
  }
  function secureReleaseURL(value,platform){
    if(typeof value!=="string"||!value||/[\s"'<>]/.test(value))return null;
    let u;try{u=new URL(value,window.location.origin)}catch{return null}
    if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash)return null;
    const hosted=u.origin===window.location.origin&&u.pathname.startsWith("/downloads/auth2fa/");
    const publicRelease=u.origin==="https://github.com"&&u.pathname.startsWith("/flekiii/flekiii.github.io/releases/download/");
    if(!hosted&&!publicRelease||!extension[platform].test(u.pathname))return null;
    return {url:u.href,local:hosted};
  }
  function humanSize(bytes){
    if(!Number.isFinite(bytes)||bytes<=0)return "";
    return bytes>=1048576?(bytes/1048576).toFixed(1)+" MB":Math.ceil(bytes/1024)+" KB";
  }
  async function checkRelease(platform,item){
    if(!item||item.status!=="available"||item.verified!==true
       ||!Number.isSafeInteger(item.size_bytes)||item.size_bytes<1024
       ||typeof item.sha256!=="string"||!/^[a-f0-9]{64}$/i.test(item.sha256)){
      disable(platform,"Not released yet","Awaiting a signed and tested build.");
      return false;
    }
    const address=secureReleaseURL(item.url,platform);
    if(!address){disable(platform,"Not released yet","No valid public download URL.");return false}
    if(address.local){
      // A missing file should never produce an active download button.
      try{
        const response=await fetch(address.url,{method:"HEAD",cache:"no-store",signal:AbortSignal.timeout(8000)});
        const contentLength=Number(response.headers.get("content-length")||0);
        const type=response.headers.get("content-type")||"";
        if(!response.ok||/text\/html/i.test(type)||(contentLength&&contentLength!==item.size_bytes)){
          disable(platform,"File unavailable","Installer not yet published on this website.");
          return false;
        }
      }catch{
        disable(platform,"File unavailable","Could not verify the installer link.");
        return false;
      }
    }
    const anchor=$(platform+"Download");
    anchor.href=address.url;
    anchor.rel="noopener noreferrer";
    anchor.classList.remove("disabled");
    anchor.removeAttribute("aria-disabled");
    anchor.removeAttribute("tabindex");
    anchor.querySelector("span").textContent="Download "+platform[0].toUpperCase()+platform.slice(1);
    const shortHash=item.sha256.slice(0,16)+"…";
    $(platform+"Meta").textContent=(item.file||"Verified build")+" · "+humanSize(item.size_bytes)+" · SHA-256 "+shortHash;
    $(platform+"Meta").title="SHA-256: "+item.sha256;
    return true;
  }
  async function init(){
    platforms.forEach(p=>disable(p));
    notice.textContent=notices.loading;
    try{
      const response=await fetch("./releases.json",{cache:"no-store"});
      if(!response.ok)throw Error("Release data unavailable");
      const manifest=await response.json();
      if(manifest.schema!==1||manifest.product!=="Auth2FA"||!manifest.downloads)throw Error("Invalid release manifest");
      $("versionLabel").textContent="v"+String(manifest.version||"0.1.0").replace(/[^0-9.a-z-]/gi,"");
      const states=await Promise.all(platforms.map(p=>checkRelease(p,manifest.downloads[p])));
      const available=states.filter(Boolean).length;
      $("releaseStatus").textContent=available?"Downloads available":"In development";
      $("releaseStatus").style.color=available?"#bcf0c7":"#e5b98e";
      notice.textContent=available?notices.available:notices.pending;
    }catch(error){
      platforms.forEach(p=>disable(p,"Coming soon","Installer link not verified."));
      notice.textContent=notices.unavailable;
      $("releaseStatus").textContent="In development";
    }
  }
  init();
})();
