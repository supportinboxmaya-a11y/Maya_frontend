// Maya PWA service worker.
// Strategy: network-first (always fetch the latest deployed version when
// online), with a cache fallback for offline resilience. skipWaiting() +
// clients.claim() below mean a new deploy takes over immediately instead of
// waiting for every open tab to be closed — combined with the
// 'controllerchange' listener in main.tsx, this is what makes updates
// automatic: no manual reinstall, no APK rebuild, just reopen the app.

const CACHE_NAME = "maya-cache-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
