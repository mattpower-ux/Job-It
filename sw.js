const CACHE_NAME = "job-it-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
