// cacfp-receipt service worker — МЯГКОЕ АНТИ-СТЕЙЛ (образец родительской поверхности).
// Навигация — СЕТЬ ВПЕРЁД: HTML всегда свежий онлайн, директор/закупщик не живут на
// старом бандле после выкладки. Оффлайн — отдаём последнюю удачную страницу из кэша.
// skipWaiting + clients.claim → новая версия заступает сразу; клиенты перезагружаются
// на смену контроллера (см. регистрацию в каждом app).
const CACHE = 'cacfp-receipt-shell-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (!isDoc) return;                     // прочее — по умолчанию сети/браузера
  e.respondWith(
    fetch(req)
      .then((res) => {
        try { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); } catch { /* noop */ }
        return res;
      })
      .catch(() => caches.match(req))      // офлайн — последняя удачная копия
  );
});
