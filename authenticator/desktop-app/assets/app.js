"use strict";
const STORAGE="fleki_authenticator_v1", ITERATIONS=360000, LOCK_MS=5*60*1000, encoder=new TextEncoder(), decoder=new TextDecoder();
const $=id=>document.getElementById(id);
const to64=buf=>btoa(String.fromCharCode(...buf)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const from64=value=>Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")),ch=>ch.charCodeAt(0));
const rand=n=>crypto.getRandomValues(new Uint8Array(n));
const ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
let key=null, vault=null, busy=false, lastActive=0, installPrompt=null, currentVault=null, timer=null, warnTimeout=null;
let qrStream=null,qrTimer=null,scanning=false;
function notice(text){
 const n=$("notice");n.textContent=text;
 if(warnTimeout)clearTimeout(warnTimeout);
 warnTimeout=setTimeout(()=>n.textContent="",6500);
}
function validateSecret(value) {
 const clean=String(value||"").toUpperCase().replace(/[\s-]/g,"").replace(/=+$/,"");
 if(!/^[A-Z2-7]{16,128}$/.test(clean))throw Error("Invalid setup key. Use a base32 key (A–Z, 2–7).");
 return clean;
}
function base32ToBytes(str) {
 let buffer=0,bits=0,output=[];
 for(const ch of str){const idx=ALPHABET.indexOf(ch);if(idx===-1)throw Error("Invalid base32 key.");buffer=(buffer<<5)|idx;bits+=5;if(bits>=8){output.push((buffer>>>(bits-8))&255);bits-=8}}
 if(output.length<10)throw Error("Authenticator key is too short.");
 return new Uint8Array(output);
}
function unpackOtpInput(input,issuer,label){
 const value=String(input||"").trim();
 if(!value.startsWith("otpauth://"))return {secret:validateSecret(value),issuer:issuer.trim()||"Account",label:label.trim(),digits:6,period:30};
 const u=new URL(value);
 if(u.protocol!=="otpauth:"||u.hostname!=="totp")throw Error("Only TOTP authenticator links are supported.");
 if(!["SHA1",""].includes((u.searchParams.get("algorithm")||"SHA1").toUpperCase()))throw Error("Only SHA-1 TOTP is supported.");
 const digits=Number(u.searchParams.get("digits")||6),period=Number(u.searchParams.get("period")||30);
 if(![6,8].includes(digits)||!Number.isInteger(period)||period<15||period>120)throw Error("Unsupported code length or timer period.");
 const accountName=decodeURIComponent(u.pathname.slice(1));
 const colon=accountName.indexOf(":");
 return {secret:validateSecret(u.searchParams.get("secret")||""),issuer:issuer.trim()||u.searchParams.get("issuer")|| (colon>0?accountName.slice(0,colon):"Account"),label:label.trim()||(colon>0?accountName.slice(colon+1):accountName),digits,period};
}
async function derive(password,salt){
 const source=await crypto.subtle.importKey("raw",encoder.encode(password),{name:"PBKDF2"},false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},source,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encryptVault(){
 if(!key||!vault||!currentVault)throw Error("Vault is locked.");
 const iv=rand(12),data=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoder.encode(JSON.stringify(vault)));
 const blob={version:1,iterations:ITERATIONS,salt:currentVault.salt,iv:to64(iv),data:to64(new Uint8Array(data))};
 localStorage.setItem(STORAGE,JSON.stringify(blob));
 currentVault=blob;
 return blob;
}
function lock(){
 stopCamera();
 $("accounts").replaceChildren();
 $("addForm").reset();$("addForm").hidden=true;
 key=null;vault=null;currentVault=null;lastActive=0;
 clearInterval(timer);timer=null;
 $("unlocked").hidden=true;$("locked").hidden=false;
 $("vault-password").value="";$("vault-confirm").value="";
 renderLocked();
}
function renderLocked(){
 const exists=!!localStorage.getItem(STORAGE);
 $("vault-title").textContent=exists?"Unlock your vault":"Create an encrypted vault";
 $("vault-submit").innerHTML=(exists?"Unlock vault":"Create secure vault")+" <span>→</span>";
 $("confirm-row").hidden=exists;$("vault-confirm").required=!exists;
 $("vault-hint").textContent=exists?"Your codes are encrypted. Enter the password you created for this device.":"Choose a unique password with at least 10 characters. It cannot be reset if lost.";
}
function openVault(){
 lastActive=Date.now();
 $("locked").hidden=true;$("unlocked").hidden=false;
 renderCards();
 if(timer)clearInterval(timer);
 timer=setInterval(updateCodes,1000);
}
async function login(e) {
 e.preventDefault();if(busy)return;busy=true;
 const pass=$("vault-password").value;
 try {
  if(pass.length<10)throw Error("Vault password must have at least 10 characters.");
  const prior=localStorage.getItem(STORAGE);
  if(!prior) {
   if(pass!==$("vault-confirm").value)throw Error("Passwords do not match.");
   const salt=to64(rand(16));
   key=await derive(pass,from64(salt));
   currentVault={salt};
   vault={version:1,created_at:Date.now(),accounts:[]};
   await encryptVault();
   notice("Vault created. All your authenticator secrets stay encrypted on this device.");
  } else {
   const parsed=JSON.parse(prior);
   if(parsed.version!==1||parsed.iterations!==ITERATIONS||typeof parsed.salt!=="string"||typeof parsed.iv!=="string"||typeof parsed.data!=="string")throw Error("Unsupported or corrupt vault.");
   const candidate=await derive(pass,from64(parsed.salt));
   let result;
   try{result=await crypto.subtle.decrypt({name:"AES-GCM",iv:from64(parsed.iv)},candidate,from64(parsed.data))}
   catch{throw Error("Incorrect vault password or damaged backup.")}
   const contents=JSON.parse(decoder.decode(result));
   if(!Array.isArray(contents.accounts)||contents.version!==1)throw Error("Vault data is invalid.");
   key=candidate;vault=contents;currentVault=parsed;
  }
  $("vault-password").value="";$("vault-confirm").value="";
  openVault();
 } catch(e){key=null;vault=null;currentVault=null;notice(e.message||"Unlock failed.")}
 finally{busy=false}
}
async function totp(account){
 const secret=base32ToBytes(account.secret),period=account.period||30,digits=account.digits||6;
 const count=Math.floor(Date.now()/(period*1000)),input=new Uint8Array(8);
 new DataView(input.buffer).setBigUint64(0,BigInt(count),false);
 const cryptoKey=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-1"},false,["sign"]);
 const signed=new Uint8Array(await crypto.subtle.sign("HMAC",cryptoKey,input));
 const off=signed[signed.length-1]&15;
 const value=(((signed[off]&0x7f)<<24)|(signed[off+1]<<16)|(signed[off+2]<<8)|signed[off+3])%(10**digits);
 return String(value).padStart(digits,"0");
}
const formatCode=code=>code.slice(0,Math.floor(code.length/2))+" "+code.slice(Math.floor(code.length/2));
function touch(){lastActive=Date.now()}
async function updateCodes(){
 if(!key||!vault)return;
 if(Date.now()-lastActive>LOCK_MS){lock();notice("Vault locked automatically after inactivity.");return}
 for(const a of vault.accounts){
  const holder=document.querySelector('[data-code-id="'+CSS.escape(a.id)+'"]');
  const remain=document.querySelector('[data-time-id="'+CSS.escape(a.id)+'"]');
  const ring=document.querySelector('[data-ring-id="'+CSS.escape(a.id)+'"]');
  if(!holder||!remain||!ring)continue;
  try{
   const code=await totp(a);
   holder.textContent=formatCode(code);
   const period=a.period||30,left=period-Math.floor(Date.now()/1000)%period;
   remain.textContent=left+" seconds left";
   ring.style.setProperty("--percent",(left/period*100).toFixed(2));
  }catch{holder.textContent="Invalid key"}
 }
}
function make(tag,className,text){
 const el=document.createElement(tag);if(className)el.className=className;
 if(text!==undefined)el.textContent=String(text);
 return el;
}
function renderCards(){
 const host=$("accounts");host.replaceChildren();
 $("empty").hidden=vault.accounts.length>0;
 for(const a of vault.accounts){
  const card=make("article","account");
  const top=make("div","account-top"),branding=make("div","account-brand"),mark=make("div","account-mark",a.issuer.slice(0,1).toUpperCase());
  const info=make("div");info.append(make("h3","",a.issuer),make("p","",a.label||"Authenticator code"));
  branding.append(mark,info);
  const del=make("button","tiny","Remove");del.type="button";del.setAttribute("aria-label","Remove "+a.issuer);
  del.addEventListener("click",async()=>{if(!confirm("Remove "+a.issuer+"? Its setup key will be deleted from this device."))return;vault.accounts=vault.accounts.filter(x=>x.id!==a.id);await encryptVault();touch();renderCards();notice("Account removed.")});
  top.append(branding,del);
  const bottom=make("div","account-bottom"),left=make("div"),digits=make("div","otp","••• •••");digits.dataset.codeId=a.id;const remain=make("div","remaining","Generating code…");remain.dataset.timeId=a.id;
  left.append(digits,remain);
  const copy=make("button","copy","Copy code");copy.type="button";
  copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(await totp(a));touch();copy.textContent="Copied ✓";setTimeout(()=>copy.textContent="Copy code",1300)}catch{notice("Clipboard unavailable. Select the displayed code instead.")}});
  const ring=make("div","ring");ring.dataset.ringId=a.id;ring.setAttribute("aria-hidden","true");
  bottom.append(left,copy,ring);card.append(top,bottom);host.append(card);
 }
 void updateCodes();
}
async function addAccount(e){
 e.preventDefault();if(!vault||!key||busy)return;busy=true;
 try{
  if(vault.accounts.length>=80)throw Error("The vault supports up to 80 accounts.");
  const a=unpackOtpInput($("accountSecret").value,$("accountIssuer").value,$("accountLabel").value);
  if(a.issuer.length>60||a.label.length>90)throw Error("Service or label is too long.");
  base32ToBytes(a.secret);
  if(vault.accounts.some(x=>x.secret===a.secret&&x.issuer===a.issuer))throw Error("This account is already saved.");
  vault.accounts.push({...a,id:crypto.randomUUID(),added_at:Date.now()});
  await encryptVault();stopCamera();$("addForm").reset();$("addForm").hidden=true;touch();renderCards();notice("Account added securely.");
 }catch(e){notice(e.message)}
 finally{busy=false}
}
function exportBackup(){
 if(!vault)return;
 const data=localStorage.getItem(STORAGE),url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
 const el=make("a");el.href=url;el.download="fleki-auth-encrypted-backup-"+new Date().toISOString().slice(0,10)+".json";
 document.body.append(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 touch();notice("Encrypted backup saved. Keep the password in a separate safe place.");
}
async function importBackup(file){
 if(!file)return;
 if(file.size>1000000)throw Error("File too large.");
 const raw=await file.text(),blob=JSON.parse(raw);
 if(blob.version!==1||blob.iterations!==ITERATIONS||typeof blob.salt!=="string"||typeof blob.iv!=="string"||typeof blob.data!=="string")throw Error("This is not a valid Fleki Authenticator backup.");
 if(!confirm("Replace the vault on this device with the imported encrypted backup? You will need the backup's original password."))return;
 localStorage.setItem(STORAGE,JSON.stringify(blob));lock();notice("Encrypted backup imported. Unlock with its original password.");
}

function stopCamera(){
 scanning=false;if(qrTimer)clearInterval(qrTimer);qrTimer=null;
 if(qrStream){qrStream.getTracks().forEach(track=>track.stop());qrStream=null}
 const video=$("qrVideo");video.srcObject=null;video.hidden=true;
 $("stopScan").hidden=true;$("scanQr").hidden=false;
}
async function startCamera(){
 if(!("BarcodeDetector" in window)||!navigator.mediaDevices?.getUserMedia){notice("Your browser does not support offline QR scanning. Copy the setup key manually instead.");return}
 try{
  const formats=await BarcodeDetector.getSupportedFormats();
  if(!formats.includes("qr_code")){notice("QR scanning isn't supported in this browser. Paste the setup key instead.");return}
  const detector=new BarcodeDetector({formats:["qr_code"]});
  qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
  const video=$("qrVideo");video.srcObject=qrStream;video.hidden=false;
  $("scanQr").hidden=true;$("stopScan").hidden=false;
  await video.play();scanning=true;
  qrTimer=setInterval(async()=>{
   if(!scanning||video.readyState<2)return;
   try{
    const codes=await detector.detect(video);
    const raw=codes.find(c=>String(c.rawValue||"").startsWith("otpauth://totp/"))?.rawValue;
    if(raw){$("accountSecret").value=raw;stopCamera();touch();notice("QR code detected. Check the account details, then save.")}
   }catch{}
  },500);
 }catch(e){stopCamera();notice(e?.name==="NotAllowedError"?"Camera permission was denied. Use the manual key instead.":"Camera unavailable. Paste the setup key manually.")}
}

function bind(){
 $("vault-form").addEventListener("submit",login);
 $("lockBtn").addEventListener("click",()=>{lock();notice("Vault locked.")});
 const toggle=()=>{$("addForm").hidden=!$("addForm").hidden; if(!$("addForm").hidden)$("accountIssuer").focus();touch()};
 $("addToggle").addEventListener("click",toggle);$("addEmpty").addEventListener("click",toggle);
 $("cancelAdd").addEventListener("click",()=>{stopCamera();$("addForm").hidden=true;touch()});
 $("scanQr").addEventListener("click",startCamera);
 $("stopScan").addEventListener("click",stopCamera);
 $("addForm").addEventListener("submit",addAccount);
 $("backupBtn").addEventListener("click",exportBackup);
 $("importBtn").addEventListener("click",()=>$("fileInput").click());
 $("fileInput").addEventListener("change",async e=>{try{await importBackup(e.target.files[0])}catch(e){notice(e.message)}finally{e.target.value=""}});
 document.addEventListener("pointerdown",()=>{if(key)touch()},{passive:true});
 document.addEventListener("keydown",()=>{if(key)touch()});
 window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").hidden=false});
 $("installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").hidden=true});
 const online=()=>{$("connection").textContent=navigator.onLine?"Offline-ready":"Offline mode"};
 window.addEventListener("online",online);window.addEventListener("offline",online);online();

 renderLocked();
}
bind();
