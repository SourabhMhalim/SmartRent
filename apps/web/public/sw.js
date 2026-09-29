const CACHE_NAME = "smartrent-static-v2";
const STATIC_DESTINATIONS = new Set(["font", "image", "script", "style"]);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Business data is authenticated and must always come from the network. In
  // particular, never put API responses in Cache Storage: cache keys do not
  // isolate responses by the Authorization header.
  if (
    request.method !== "GET" ||
    request.mode === "navigate" ||
    url.origin !== self.location.origin ||
    url.pathname.includes("/api/") ||
    request.headers.has("Authorization") ||
    !STATIC_DESTINATIONS.has(request.destination)
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
      }
      return response;
    })),
  );
});
