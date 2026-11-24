/* AI Toque · service worker de la app instalable.
   - Páginas: primero la red (así cada cambio publicado llega al instante); sin conexión, la última copia guardada.
   - Íconos, manifiesto y configuración: copia guardada, actualizada en segundo plano.
   - No toca nada de otros dominios (API de SUNAT/LanAI, nube, fuentes) ni peticiones que no sean GET. */
'use strict';
const CACHE = 'aitoque-v3';
const BASE = ['./FacturacionelectronicaLanAI.html', './granate-config.js', './app.webmanifest', './icono-192.png', './icono-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    /* cache: 'no-cache' evita la copia del navegador (GitHub Pages la guarda 10 min): la app instalada recibe al momento lo publicado. */
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./FacturacionelectronicaLanAI.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(guardada => {
    const red = fetch(req).then(r => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return r; }).catch(() => guardada);
    return guardada || red;
  }));
});
