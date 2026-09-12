const CACHE_NAME = "revenue-engine-static-v1";
const STATIC_PATTERNS = [/^\/_next\/static\//, /\.(?:png|svg|ico|woff2?)$/];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for static build assets/icons (safe, content-hashed and
// immutable). Everything else — pages, API/data routes — is left to the
// network untouched: this is a live CRM, serving stale data from a cache
// would be actively misleading.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isStatic = STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (!isStatic) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});
