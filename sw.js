/*
 * Mode hors ligne (quand l'application est servie par un site en https) :
 * tous les fichiers sont gardés sur le téléphone après la première visite.
 * Après une mise à jour des fichiers, change VERSION pour que les téléphones la récupèrent.
 */
const VERSION = 'arius-studio-1.1.0';
const FILES = [
    './',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/logo.png',
    './css/base.css',
    './css/controls.css',
    './css/dialogs.css',
    './css/layout.css',
    './css/mobile.css',
    './css/panels.css',
    './css/stage.css',
    './css/variables.css',
    './index.html',
    './js/app.js',
    './js/core/events.js',
    './js/core/history.js',
    './js/core/namespace.js',
    './js/core/presets.js',
    './js/core/state.js',
    './js/core/storage.js',
    './js/core/utils.js',
    './js/fonts/fonts.js',
    './js/fonts/monocraft-data.js',
    './js/render/compositor.js',
    './js/render/effects.js',
    './js/render/geometry.js',
    './js/render/layer-renderer.js',
    './js/render/patterns.js',
    './js/tools/kit.js',
    './js/tools/tool-background.js',
    './js/tools/tool-border.js',
    './js/tools/tool-corners.js',
    './js/tools/tool-effects.js',
    './js/tools/tool-elements.js',
    './js/tools/tool-patterns.js',
    './js/tools/tool-shadow.js',
    './js/tools/tool-text.js',
    './js/ui/categories.js',
    './js/ui/dialogs.js',
    './js/ui/export.js',
    './js/ui/fields.js',
    './js/ui/icons.js',
    './js/ui/layers-panel.js',
    './js/ui/mobile.js',
    './js/ui/preset-bar.js',
    './js/ui/project.js',
    './js/ui/properties-panel.js',
    './js/ui/shortcuts.js',
    './js/ui/stage.js',
    './js/ui/toast.js',
    './js/ui/tool-panel.js',
    './js/ui/topbar.js',
    './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour avoir la dernière version), copie locale si pas de connexion.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
