// Stabilität Runde 2 – Handy-Pfad: Messung mit Mobil-Emulation (iPhone 14/15 Pro Max quer, Touch, DPR 3, „Apple GPU“, Home-Bildschirm/standalone,
// document.hasFocus() = false wie in iOS-Standalone) bzw. Laptop (Iris Xe). EIN Chromium (Sperre .chromium.lock), SwiftShader.
//   node test/stabil2_handy.mjs <tag> [dist]        Umgebung: TEIL=mess,wackel,laden,profil  DEV=iphone14,iphone15pm,laptop  SZ=morgenau,route1,kupferhain  THR=4
// mess   : je Gerät × Szene 6 s Laufen (CPU ×THR): Dreiecke/Draw-Calls je Bild (inkl. Schattenpass), JS je Bild (gesamt / ohne r.render), Stufe, Deckel, Drosselung
// wackel : Bildfolge eines 60-Hz-Handys simuliert (Zeitstempel je 16,7 ms, Spiel-Gates entscheiden selbst), 3 s Gehen + 3 s Rennen geradeaus:
//          Heldin- und Kamera-Abweichung von der Geraden, Kamera-Seitensprünge/Rollen, Bildschirmruhe der Figur (Welt dafür ausgeblendet, nur Logik zählt)
// laden  : 60 s in Morgenau stehen/laufen: alle Netz-Abrufe + Modell-Ladevorgänge (VMODEL_QUEUE), Szenen-Neubauten
// profil : CPU-Profil 6 s Laufen in Morgenau (CPU ×THR), eigene Zeit je Funktion (Top 25)
import { chromium, devices } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { writeFileSync, mkdirSync } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { WACKEL } from './stabil_wackel.mjs';
const ROOT = fileURLToPath(new URL('../', import.meta.url)), TAG = process.argv[2] || 'nachher', DIST = (process.argv[3] || join(ROOT, 'dist')).replace(/\/?$/, '/');
const THR = +(process.env.THR || 4), TEIL = (process.env.TEIL || 'mess,wackel,laden').split(','), DEVS = (process.env.DEV || 'iphone15pm').split(','), SZ = (process.env.SZ || 'morgenau,route1,kupferhain').split(',');
const DUR = +(process.env.DUR || 6000), STUFE = process.env.STUFE || '';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.css': 'text/css', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(DIST, p)); if (!f.startsWith(DIST)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const iUA = devices['iPhone 15 Pro Max'].userAgent;
const DEV = {
  iphone14: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: iUA, gpu: 'Apple GPU', mobil: 1 },
  iphone15pm: { viewport: { width: 932, height: 430 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: iUA, gpu: 'Apple GPU', mobil: 1 },
  laptop: { viewport: { width: 1536, height: 695 }, deviceScaleFactor: 1.25, gpu: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)', mobil: 0 } };
const INIT = ([gpu, mobil]) => {
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const gp = C.prototype.getParameter; C.prototype.getParameter = function (p) { if (p === 0x9246) return gpu; if (p === 0x9245) return mobil ? 'Apple Inc.' : 'Google Inc. (Intel)'; return gp.call(this, p); }; }
  if (mobil) { // iOS-Home-Bildschirm: standalone, hasFocus unzuverlässig (false), 6 Kerne, kein deviceMemory
    try { Object.defineProperty(navigator, 'standalone', { get: () => true }); } catch (e) { }
    try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 6 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => undefined }); } catch (e) { }
    try { document.hasFocus = () => false; } catch (e) { }
    const mm = window.matchMedia.bind(window), fake = q => ({ matches: true, media: q, onchange: null, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { }, dispatchEvent() { return false; } }); window.matchMedia = q => /display-mode:\s*standalone|pointer:\s*coarse|hover:\s*none/.test(q) ? fake(q) : mm(q);
  }
  try { localStorage.clear(); localStorage.setItem('veyra_set', JSON.stringify({ modelle3d: true })); } catch (e) { } // Schalter gespeichert, KEIN URL-Zusatz (wie Home-Bildschirm)
};
async function start(devK, map, x, y, opt = {}) {
  const D = DEV[devK], { gpu, mobil, ...cfg } = D; const ctx = await browser.newContext(cfg); await ctx.addInitScript(INIT, [gpu, mobil]);
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  p.reqs = []; p.on('request', q => { const u = q.url(); if (!/^data:/.test(u)) p.reqs.push([Date.now(), u.replace(URL0, '').slice(0, 70)]); });
  await p.goto(URL0 + 'index.html', { waitUntil: 'load', timeout: 240000 });
  try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(400); try { await p.click('#iSkip', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(600);
  await p.evaluate(() => { const i = document.getElementById('intro'); if (i) i.hidden = true; beginGame({}); });
  // Stufe festhalten (STUFE=hoch|mittel|niedrig): SwiftShader ist so langsam, dass der Wachhund sonst sofort auf „niedrig“ fällt – Dreiecke/Calls sollen je Stufe vergleichbar sein
  if (STUFE) await p.evaluate(t => { SET.gfx = t; if (typeof GFX === 'object') GFX.force = t; if (typeof STAB === 'object') { STAB.lim = STAB.ceil = t; STAB.grace = 1e9; STAB.lastBad = -1e9; } try { stabDown = () => { }; stabEmergency = () => { }; } catch (e) { } perfSet(t); }, { hoch: 'high', mittel: 'mid', niedrig: 'low' }[STUFE]);
  await p.waitForFunction(() => { if (typeof TW === 'object' && TW && TW.finish) TW.finish(); if (mode === 'dialog') advDlg(); return !!G && !!R3; }, null, { timeout: 90000, polling: 250 });
  await p.evaluate(([m, x, y]) => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; G.flags.firstcatch = 1; SET.skipBattleIntro = 1; G.team = [mk(1, 12), mk(4, 10)];
    setView('third'); loadMap(m, x, y); mode = 'world'; }, [map, x, y]);
  p.tLoad = Date.now();
  if (opt.settle !== false) { for (let i = 0; i < 120; i++) { const q = await p.evaluate(() => typeof VMODEL_QUEUE === 'object' ? VMODEL_QUEUE.q.length + (VMODEL_QUEUE.busy ? 1 : 0) : 0).catch(() => 1); if (!q && i > 8) break; await p.waitForTimeout(500); } await p.waitForTimeout(3000); }
  return { p, ctx };
}
const POS = { morgenau: [9, 8], route1: [9, 20], kupferhain: [4, 11] };
// ---------- Messhaken im Spiel ----------
const HOOK = () => { const M = window.__M = { fr: [], js: [], rj: [], on: false }; const r = R3.r, rr = r.render; let rs = 0;
  r.render = function (s, c) { const a = performance.now(); const o = rr.apply(this, arguments); rs += performance.now() - a; if (s === R3.scene && r.getRenderTarget() === null && M.on) M.fr.push([performance.now(), GFX.stat.calls, GFX.stat.tris, PERF.tier]); return o; };
  const lp = loop; loop = function (t) { const a = performance.now(); rs = 0; const lf = lastFrame; lp(t); if (M.on && lastFrame !== lf) { M.js.push(performance.now() - a); M.rj.push(performance.now() - a - rs); } }; loop._m = 1; };
const SUM = () => { const M = window.__M, F = M.fr, n = F.length, avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : 0; };
  const st = typeof stabInfo === 'function' ? stabInfo() : null;
  return { n, calls: Math.round(avg(F.map(f => f[1]))), tris: Math.round(avg(F.map(f => f[2])) / 100) / 10, trisMax: Math.round(Math.max(0, ...F.map(f => f[2])) / 1000), js: +avg(M.js).toFixed(1), jsP95: +pct(M.js, .95).toFixed(1), ohneRender: +avg(M.rj).toFixed(1),
    stufen: [...new Set(F.map(f => f[3]))].join('>'), px: R3.r.domElement.width + '×' + R3.r.domElement.height,
    stab: st ? { cls: st.cls, tier: st.tier, cap: st.cap, scale: st.scale, dpr: st.dpr, blur: st.blur, parked: st.parked, off: st.off, emerg: st.emerg, downs: st.downs } : null, budget: typeof GFX === 'object' && GFX.bud ? { lvl: GFX.bud.lvl, dev: GFX.bud.dev, ups: GFX.bud.ups } : null }; };
const OUT = { tag: TAG, thr: THR, zeit: new Date().toISOString() };
const log = s => console.log(`[${TAG}] ` + s);
// ---------- mess ----------
if (TEIL.includes('mess')) for (const dk of DEVS) for (const map of SZ) {
  const { p, ctx } = await start(dk, map, ...POS[map]);
  const cdp = await ctx.newCDPSession(p); if (THR > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  // Budget-Regelung (59, nur nachher) einschwingen lassen: 24 Bilder direkt zeichnen (wie auf dem Handy in < 1 s)
  await p.evaluate(async () => { for (let i = 0; i < 24; i++) { R3.r.render(R3.scene, R3.activeCam || R3.cam); await new Promise(r => setTimeout(r, 0)); } });
  await p.evaluate(HOOK); await p.evaluate(() => { window.__M.on = true; P.state = 'walk'; STICK.y = -1; STICK.x = .18; });
  await p.waitForTimeout(DUR); await p.evaluate(() => { STICK.x = STICK.y = 0; window.__M.on = false; });
  if (THR > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const s = await p.evaluate(SUM); s.errs = p.errs;
  // Aufschlüsselung der sichtbaren Dreiecke je Kategorie (mit Entfernungs-Budget aus 59, so wie gezeichnet): [Dreiecke, Meshes, davon Schattenwurf]
  s.kat = await p.evaluate(() => { const cam = R3.shown || R3.activeCam || R3.cam; try { if (typeof gfxModelPre === 'function') gfxModelPre(R3.scene, cam); } catch (e) { }
    const cat = o => { for (let q = o; q; q = q.parent) { const U = q.userData || {}; if (q === R3.player) return 'heldin'; if (U.pilot) return /^t\d/.test(U.pilot) ? 'terra' : 'figur'; if (U.tm || U.lod1) return 'terra'; if (U.haus) return 'haus'; if (q.parent === R3.scene) return o.isInstancedMesh ? 'instanzen' : 'welt'; } return '?'; };
    const out = {}; R3.scene.traverse(o => { if (!o.isMesh) return; for (let q = o; q; q = q.parent) if (!q.visible) return; const g = o.geometry, t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      const k = cat(o) + (o.userData && o.userData.outline ? '-umriss' : ''); const e = out[k] || (out[k] = [0, 0, 0]); e[0] += Math.round(t); e[1]++; if (o.castShadow) e[2] += Math.round(t); });
    try { if (typeof gfxModelPost === 'function') gfxModelPost(); } catch (e) { } return out; });
  (OUT.mess = OUT.mess || {})[dk + '_' + map + (STUFE ? '_' + STUFE : '')] = s; log(`mess ${dk} ${map}: ${JSON.stringify(s).slice(0, 700)}`); await ctx.close(); }
// ---------- wackel ----------
// Simuliert ein 60-Hz-Handy: Zeitstempel alle 16,67 ms (mit ±0,3 ms Streuung), das Spiel entscheidet selbst (Deckel/Wachhund), ob es zeichnet.
// Damit SwiftShader nicht bremst, ist die Welt ausgeblendet (Kamera-/Bewegungslogik hängt nur an Kacheln/Gelände, nicht an Meshes).
if (TEIL.includes('wackel')) for (const dk of DEVS) for (const [map, cap] of (process.env.WK || 'morgenau:30,morgenau:60,route1:30').split(',').map(x => x.split(':')).map(([m, c]) => [m, +c])) {
  const { p, ctx } = await start(dk, map, ...POS[map]);
  const res = await p.evaluate(WACKEL, [cap, +(process.env.KOST || 0), DEV[dk].viewport.width, DEV[dk].viewport.height]).catch(e => ({ err: String(e).slice(0, 300) }));
  (OUT.wackel = OUT.wackel || {})[dk + '_' + map + '_' + cap] = res; log(`wackel ${dk} ${map} ${cap}: ${JSON.stringify(res)}`); await ctx.close(); }
// ---------- laden ----------
if (TEIL.includes('laden')) for (const dk of DEVS) {
  const { p, ctx } = await start(dk, 'morgenau', 9, 8, { settle: false });
  await p.evaluate(() => { const L = window.__L = []; const w = n => { const o = window[n]; if (typeof o !== 'function') return; window[n] = function () { L.push([Math.round(performance.now()), n, String(arguments[0] ?? '').slice(0, 30)]); return o.apply(this, arguments); }; };
    ['pilotLoad', 'tmLoad', 'w3HausLoad', 'build3d', 'ldRun', 'transit', 'hyPlacePreload', 'vmqPush'].forEach(w); window.__t0 = performance.now(); });
  const r0 = p.reqs.length, t0 = Date.now();
  // 60 s: 20 s stehen, 25 s laufen (Kreis im Dorf), 15 s stehen
  await p.waitForTimeout(20000); await p.evaluate(() => { P.state = 'walk'; STICK.y = -1; STICK.x = .8; }); await p.waitForTimeout(25000); await p.evaluate(() => { STICK.x = STICK.y = 0; }); await p.waitForTimeout(15000);
  const s = await p.evaluate(() => ({ calls: window.__L, karte: cur.id, wechsel: (LADEN.log || []).length, queue: (VMODEL_QUEUE.ms || []).map(x => x[0] + ' ' + x[1] + 'ms'), wartend: VMODEL_QUEUE.q.map(x => x.name), lade: typeof LADEN === 'object' ? !!LADEN.active : null }));
  s.netz = p.reqs.filter(x => x[0] >= t0 - 15000).map(x => ((x[0] - p.tLoad) / 1000).toFixed(1) + 's ' + x[1]); s.errs = p.errs;
  (OUT.laden = OUT.laden || {})[dk] = s; log(`laden ${dk}: ${JSON.stringify(s).slice(0, 3000)}`); await ctx.close(); }
// ---------- profil ----------
if (TEIL.includes('profil')) for (const dk of DEVS) {
  const { p, ctx } = await start(dk, SZ[0], ...POS[SZ[0]]); const cdp = await ctx.newCDPSession(p);
  if (THR > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await p.evaluate(() => { P.state = 'walk'; STICK.y = -1; STICK.x = .18; }); await cdp.send('Profiler.start');
  await p.waitForTimeout(DUR); const { profile } = await cdp.send('Profiler.stop'); await p.evaluate(() => { STICK.x = STICK.y = 0; });
  const self = new Map(), dts = profile.timeDeltas, byId = new Map(profile.nodes.map(n => [n.id, n])); let tot = 0;
  for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]), d = dts[i] || 0; tot += d; const cf = n.callFrame, k = (cf.functionName || '(anon)') + ':' + cf.lineNumber; self.set(k, (self.get(k) || 0) + d); }
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + ' ' + (v / tot * 100).toFixed(1) + '%');
  (OUT.profil = OUT.profil || {})[dk] = top; log('profil ' + dk + ':\n  ' + top.join('\n  ')); await ctx.close(); }
mkdirSync(join(ROOT, 'test/stabil2'), { recursive: true }); writeFileSync(join(ROOT, 'test/stabil2/handy_' + TAG + '.json'), JSON.stringify(OUT, null, 1));
await browser.close(); srv.close();
