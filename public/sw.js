// Veyra Service Worker – App-Shell offline verfügbar halten
const CACHE = 'veyra-__VERSION__';
// Intro-Film: eigener Cache, übersteht Versionswechsel (16 MB nicht bei jedem Update neu laden); NICHT vorab gecacht
const VCACHE = 'veyra-video-1';
const SHELL = ['./', './index.html', './three.min.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== VCACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Kreaturenbilder nach der Aktivierung im Hintergrund vorab ablegen (Dex offline vollständig); Liste setzt build.mjs
const ART = __ART__;
self.addEventListener('activate', e => { e.waitUntil(caches.open(CACHE).then(async c => { for (const f of ART) { try { if (!(await c.match(f))) { const r = await fetch(f); if (r.status === 200) await c.put(f, r); } } catch (err) {} } })); });
// Video: cache-first nach dem ersten Abruf; Range-Anfragen (Video-Element) werden aus dem Cache als 206 beantwortet.
// Erster Abruf: Netz direkt durchreichen (Streaming) und die ganze Datei einmal im Hintergrund ablegen (nicht bei Datensparmodus).
async function videoFetch(e) {
  const req = e.request, c = await caches.open(VCACHE), hit = await c.match(req.url);
  if (!hit) {
    const sd = self.navigator && navigator.connection && navigator.connection.saveData;
    if (!sd) e.waitUntil(c.match(req.url).then(h => h || fetch(req.url).then(r => r.status === 200 ? c.put(req.url, r) : null)).catch(() => {}));
    return fetch(req);
  }
  const rg = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (!rg) return hit;
  const b = await hit.blob(), n = b.size; let s = rg[1] === '' ? Math.max(0, n - +rg[2]) : +rg[1], end = rg[1] !== '' && rg[2] !== '' ? Math.min(+rg[2], n - 1) : n - 1;
  if (s >= n) return new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + n } });
  return new Response(b.slice(s, end + 1), { status: 206, headers: { 'Content-Type': hit.headers.get('Content-Type') || b.type || 'application/octet-stream', 'Content-Range': `bytes ${s}-${end}/${n}`, 'Content-Length': String(end - s + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin === location.origin && /\/video\/[^/]+$/.test(u.pathname) && !/\.jpe?g$/i.test(u.pathname)) { e.respondWith(videoFetch(e).catch(() => fetch(e.request))); return; }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.status === 200 && u.origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); }
    return res;
  }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
