// Minimal service worker for PWA installability (e.g. iOS "Add to Home Screen").
// This file is intentionally minimal; it satisfies the SW check and avoids 404s.
const CACHE_NAME = "snap-and-seek-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Network-first: no caching; app stays installable and works online.
});
