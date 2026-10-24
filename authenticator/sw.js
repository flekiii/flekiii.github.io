/* Offline-first Fleki Authenticator. Never cache vault data or user secrets. */
const CACHE="fleki-auth-static-v3";
const ASSETS=["/","/index.html","/style.css","/app.js","/icon.svg","/manifest.webmanifest"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const u=new URL(event.request.url);
 if(u.origin!==self.location.origin||event.request.method!=="GET"||!ASSETS.includes(u.pathname))return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
   if(response.ok){const duplicate=response.clone();void caches.open(CACHE).then(cache=>cache.put(event.request,duplicate))}
   return response;
 })).catch(()=>caches.match("/index.html")));
});
