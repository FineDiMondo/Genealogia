"use strict";

const STATIC_CACHE = "gn370-static-v3";
const UI_ASSETS = [
  "./",
  "./index.html",
  "./version.json",
  "./assets/css/terminal.css",
  "./assets/css/animations.css",
  "./assets/js/boot.js",
  "./assets/js/state.js",
  "./assets/js/config.js",
  "./assets/js/db.js",
  "./assets/js/router.js",
  "./control/index.html",
  "./control/control.css",
  "./control/control.js",
  "./control/targets.json"
];

const DATA_REGEX = /(\/tables\/|\.table($|\?)|\/data\/current\/|\/records\/)/i;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(UI_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (DATA_REGEX.test(url.pathname)) {
    event.respondWith(fetch(req));
    return;
  }

  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
