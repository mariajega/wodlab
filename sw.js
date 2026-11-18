/* WODLAB Service Worker · GitHub Pages compatible */
const VERSION = 'wodlab-shell-v1';
const CORE = ['./', './index.html', './manifest.json', './icons/wodlab-192.png', './icons/wodlab-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    await Promise.all(CORE.map(async path=>{try{const res=await fetch(path,{cache:'no-store'});if(res.ok)await cache.put(path,res);}catch(_){}}));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('wodlab-shell-')&&k!==VERSION).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if(event.data&&event.data.type==='SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return; // Google APIs, OAuth y CDN siguen su flujo normal.
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(VERSION);
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh&&fresh.ok) await cache.put('./index.html',fresh.clone());
        return fresh;
      }catch(_){return (await cache.match(req))||(await cache.match('./index.html'))||Response.error();}
    })());
    return;
  }
  // App shell same-origin: cache first, then network refresh.
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION); const cached=await cache.match(req);
    const network=fetch(req).then(res=>{if(res&&res.ok)cache.put(req,res.clone());return res;}).catch(()=>null);
    return cached || (await network) || Response.error();
  })());
});
