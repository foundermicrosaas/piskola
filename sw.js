/* Service worker prototipe.
   Strategi: network-first untuk kode (ramah development — perubahan langsung
   terlihat), cache-first untuk file audio (materi statis — hemat bandwidth,
   mendukung offline). Saat audio ElevenLabs diintegrasikan, tambahkan manifes
   audio ke precache (lihat KONSEP-APLIKASI.md §9.2). */
const CACHE = 'piskola-v17';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/audio.js',
  './js/confetti.js',
  './js/letters.js',
  './js/game-tebak.js',
  './js/game-tracing.js',
  './js/game-sambung.js',
  './js/game-pasangan.js',
  './js/game-memory.js',
  './js/game-urutan.js',
  './js/game-balon.js',
  './js/game-kuis.js',
  './js/game-hilang.js',
  './js/game-susun.js',
  './js/game-math.js',
  './js/ui.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon-apple-180.png',
  './fonts/patrick-hand.ttf',
  './fonts/baloo2-latin.woff2',
  './fonts/baloo2-latin-ext.woff2',
  './fonts/baloo2-viet.woff2',
  './fonts/baloo2-devanagari.woff2',
  './fonts/OFL-PatrickHand.txt',
  './fonts/OFL-Baloo2.txt',
  './admin/index.html',
  './admin/admin.js',
  './pro/index.html',
  './pro/pro.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Audio statis: cache-first (offline & hemat kuota)
  if (e.request.url.includes('/audio/')) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
      )
    );
    return;
  }

  // Kode & halaman: network-first (perubahan pengembang langsung terlihat),
  // cache sebagai cadangan saat offline. cache:'no-store' menonaktifkan HTTP
  // cache browser (server dev seperti http.server mengirim Last-Modified tanpa
  // no-cache → rawan menyajikan kode lama).
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit
        || (e.request.url.includes('/admin') ? caches.match('./admin/index.html') : caches.match('./index.html'))))
  );
});
