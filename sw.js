(()=>{let e=[],n="";e=["index.html","scanner.36a75a38.png","scanner.22e57e18.png","scanner.4f92546c.png","scanner.720097cb.webmanifest","scanner.edc2ccf8.webp","scanner.e0388030.png","scanner.9c0e9440.webp","scanner.7f602baf.png","scanner.174b284e.webp","scanner.0b1caf3b.png","scanner.b5e5465e.webp","scanner.f90a7752.png","scanner.5319085a.webp","scanner.2fe05084.png","scanner.ac3a89e8.xml","scanner.c222b2de.png","scanner.5ab17dc4.png","scanner.71ae865e.png","scanner.73d4cb4b.png","index.3bdec287.js"],n="e905e2ab",self.addEventListener("install",(a=>a.waitUntil(async function(){const a=await caches.open(n);await a.addAll(e)}()))),self.addEventListener("activate",(e=>e.waitUntil(async function(){const e=await caches.keys();await Promise.all(e.map((e=>e!==n&&caches.delete(e))))}()))),self.addEventListener("fetch",(e=>{e.respondWith(async function(e){const a=await caches.open(n);try{const n=await fetch(e);return a.put(e,n.clone()),n}catch(n){return a.match(e)}}(e.request))}))})();
//# sourceMappingURL=sw.js.map
