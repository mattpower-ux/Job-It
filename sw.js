const CACHE_NAME = "job-it-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20261008-cache1",
  "./app.js?v=20261008-cache1",
  "./manifest.webmanifest",
  "./assets/realistic/concrete.png",
  "./assets/realistic/roof.png",
  "./assets/realistic/trim.png",
  "./assets/realistic/stairs.png",
  "./assets/realistic/takeoff.png",
  "./assets/realistic/layout.png",
  "./assets/specialties/concrete-slab.png",
  "./assets/specialties/concrete-footing.png",
  "./assets/specialties/concrete-pier.png",
  "./assets/specialties/roof-common.png",
  "./assets/specialties/roof-hip-valley.png",
  "./assets/specialties/roof-shed.png",
  "./assets/specialties/trim-inside-corner.png",
  "./assets/specialties/trim-baseboard.png",
  "./assets/specialties/trim-crown.png",
  "./assets/specialties/stairs-stringer.png",
  "./assets/specialties/stairs-decking.png",
  "./assets/specialties/stairs-ramp.png",
  "./assets/specialties/takeoff-framing.png",
  "./assets/specialties/takeoff-drywall.png",
  "./assets/specialties/takeoff-roofing.png",
  "./assets/specialties/layout-squaring.png",
  "./assets/specialties/layout-slope.png",
  "./assets/specialties/layout-spacing.png",
  "./assets/icons/job-it.svg",
  "./assets/icons/concrete.svg",
  "./assets/icons/roof.svg",
  "./assets/icons/trim.svg",
  "./assets/icons/stairs.svg",
  "./assets/icons/takeoff.svg",
  "./assets/icons/layout.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS.map((asset) => new Request(new URL(asset, self.registration.scope), { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("job-it-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
  const url = new URL(event.request.url);
  const documentOrCode = event.request.mode === "navigate" || /\.(?:html|css|js|webmanifest)$/.test(url.pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (!documentOrCode && cached) return cached;
    try {
      // Revalidate code and styles, preserving cached copies for offline use.
      const response = await fetch(event.request, { cache: documentOrCode ? "no-cache" : "default" });
      if (response.ok) {
        await cache.put(event.request, response.clone()).catch(() => {});
        return response;
      }
      return cached || response;
    } catch (error) {
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const document = await cache.match(new URL("index.html", self.registration.scope).href);
        if (document) return document;
      }
      throw error;
    }
  })());
});
