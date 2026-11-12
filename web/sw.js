// Veyra Service Worker – App-Shell offline verfügbar halten
const CACHE = 'veyra-0.9.0';
// Intro-Film: eigener Cache, übersteht Versionswechsel (16 MB nicht bei jedem Update neu laden); NICHT vorab gecacht
const VCACHE = 'veyra-video-1';
const SHELL = ['./', './index.html', './three.min.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== VCACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Kreaturenbilder nach der Aktivierung im Hintergrund vorab ablegen (Dex offline vollständig); Liste setzt build.mjs
const ART = ["./art/001_funki.webp","./art/004_plippi.webp","./art/007_knospi.webp","./art/008_rankel.webp","./art/009_bluehro.webp","./art/010_krumo.webp","./art/011_dornox.webp","./art/012_granthor.webp","./art/013_aschi.webp","./art/014_kohlo.webp","./art/015_brandor.webp","./art/016_molli.webp","./art/017_blubbo.webp","./art/018_stroemi.webp","./art/019_fipsa.webp","./art/020_blattin.webp","./art/021_kronella.webp","./art/022_kiesel.webp","./art/023_brummit.webp","./art/024_basalor.webp","./art/025_pusti.webp","./art/026_wirbel.webp","./art/027_sturmilo.webp","./art/028_lumli.webp","./art/029_glimma.webp","./art/030_solaro.webp","./art/031_dumbi.webp","./art/032_noxli.webp","./art/033_mondoro.webp","./art/034_zischi.webp","./art/035_funaro.webp","./art/036_vulkanjo.webp","./art/037_muschel.webp","./art/038_perlo.webp","./art/039_korallux.webp","./art/040_tilli.webp","./art/041_sonnblatt.webp","./art/042_floralis.webp","./art/043_flitzi.webp","./art/044_federel.webp","./art/045_himmora.webp","./art/046_mumpi.webp","./art/047_nebbel.webp","./art/048_daemmerin.webp","./art/049_knister.webp","./art/050_brutzel.webp","./art/051_funkoro.webp","./art/052_glibbi.webp","./art/053_quallio.webp","./art/054_lumedusa.webp","./art/055_wurzel.webp","./art/056_wurzelin.webp","./art/057_knackel.webp","./art/059_flausch.webp","./art/061_blinki.webp","./art/063_schumi.webp","./art/064_duestro.webp","./art/065_sternheuler.webp","./art/066_aquakrist.webp","./art/067_kristallschild.webp","./art/068_kristallux.webp","./art/069_federling.webp","./art/070_goldschwinge.webp","./art/071_auregrif.webp","./art/072_knips.webp","./art/073_blitzmaehne.webp","./art/074_blitzahn.webp","./art/075_frosti.webp","./art/076_glazirr.webp","./art/077_kristallo.webp","./art/078_plitschi.webp","./art/079_wogenwal.webp","./art/080_ozeano.webp","./art/081_krabbi.webp","./art/082_scherenwacht.webp","./art/083_krystak.webp","./art/084_axelli.webp","./art/085_kiemling.webp","./art/086_lumaxel.webp","./art/087_eulumi.webp","./art/088_waldgreif.webp","./art/089_waldorakel.webp","./art/090_moosel.webp","./art/091_moosgolem.webp","./art/092_kristallbaer.webp","./art/093_wellchen.webp","./art/094_riffschwimmer.webp","./art/095_gezeitenkoenig.webp","./art/096_pilzlein.webp","./art/097_glimmerpilz.webp","./art/098_laternenpilz.webp","./art/140_lunaris.webp","./art/141_thalor.webp","./art/142_ignivar.webp","./art/143_sylvaris.webp","./art/144_aetherion.webp","./art/145_crystalon.webp","./art/146_frostwaechter.webp","./art/147_noctyra.webp","./art/148_floravon.webp","./art/149_aureon.webp","./art/150_auralis.webp","./art/151_terravon.webp","./art/152_solaryx.webp","./art/153_umbryx.webp"];
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
