/* Pad van Genade service worker.
   Offline-first: the shell is precached on install, and everything else is
   served cache-first with a background refresh. This is what makes the site
   usable on a phone with no data — the situation it is most needed in. */

// Bump when the precache list changes, or returning visitors keep the old
// shell and never fetch the new assets.
const VERSION = "pvg-v2";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app/css/app.css",
  "./app/js/app.js",
  "./app/js/i18n.js",
  "./app/js/store.js",
  "./data/content.json",
  "./data/daily.json",
  "./data/help.json",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/img/credits.json",
  "./assets/img/drakensberg.webp",
  "./assets/img/tablemount.webp",
  "./assets/img/sunflowers.webp",
  "./assets/img/springbok.webp",
  "./assets/img/drakensberg.jpg",
  "./assets/img/tablemount.jpg",
  "./assets/img/sunflowers.jpg",
  "./assets/img/springbok.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      // addAll fails the whole install if any single URL 404s, so add them one
      // at a time and keep going. One missing asset should not brick offline.
      .then((cache) =>
        Promise.all(
          SHELL.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {}))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) {
        // Refresh in the background so the next load gets fresh content.
        event.waitUntil(
          fetch(req)
            .then((res) => res.ok && caches.open(VERSION).then((c) => c.put(req, res.clone())))
            .catch(() => {})
        );
        return hit;
      }
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          // Navigation requests fall back to the cached shell rather than the
          // browser's offline error page.
          req.mode === "navigate" ? caches.match("./index.html") : Response.error()
        );
    })
  );
});