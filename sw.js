const CACHE="fleki-static-v1";
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/","/favicon.svg"]))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("fleki-static-")&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",event=>{const req=event.request,u=new URL(req.url);if(req.method!=="GET"||u.origin!==self.location.origin)return;if(req.mode==="navigate")event.respondWith(fetch(req).catch(()=>caches.match("/")));});
