// Stabilität Runde 2 – Messung beim Laufen (Ruckeln, Wackeln, Hintergrundladen). EIN Chromium (Sperre .chromium.lock), SwiftShader.
//   node test/stabil2_mess.mjs [tag] [dist-ordner]      (Standard: tag=nachher, dist=./dist)
// Kleines Fenster (640×360, DPR 1), damit SwiftShader flüssig genug zeichnet, um Bildfolge und Wackeln zu messen; CPU-Drosselung ×4 (CDP) für die JS-Zeit.
// Gemessen je Szene (Morgenau/Route 1, Stufe auto/mittel/niedrig) während 8 s Laufen im Kreis:
//  fps, Bildabstand Ø/p95/max, JS je Bild Ø/p95 (gedrosselt), Draw-Calls/Dreiecke je Bild (inkl. Schatten-/Bloom-Pass), Stufen-/Skalenwechsel, Canvas-Größenwechsel,
//  Wackeln: Sprung der Figur auf dem Bildschirm von Bild zu Bild (px, Abweichung vom gleitenden Mittel), Tempo-Gleichmäßigkeit, Kamera-Abstand-Schwankung,
//  Hintergrundladen: Modelle fertig, Netz-/Skript-Abrufe, Szenen-Neubauten, Ladebildschirme.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
const ROOT = fileURLToPath(new URL('../', import.meta.url)), TAG = process.argv[2] || 'nachher', DIST = (process.argv[3] || join(ROOT, 'dist')).replace(/\/?$/, '/');
const THR = +(process.env.THR || 4), SZ = (process.env.SZ || 'morgenau,route1').split(','), TIERS = (process.env.TIERS || 'auto,mittel,niedrig').split(',');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.css': 'text/css', '.jpg': 'image/jpeg' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(DIST, p)); if (!f.startsWith(DIST)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const INIT = () => { const RN = 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)';
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const gp = C.prototype.getParameter; C.prototype.getParameter = function (p) { if (p === 0x9246) return RN; return gp.call(this, p); }; }
  try { localStorage.clear(); } catch (e) { } };
// Im Spiel: Aufzeichnung je gezeichnetem Weltbild
const HOOK = () => { const M = window.__M = { fr: [], js: [], ev: [], req: 0 }; const V = new THREE.Vector3();
  const r = R3.r, rr = r.render; r.render = function (s, c) { const o = rr.apply(this, arguments);
    if (s === R3.scene && r.getRenderTarget() === null && M.on) { const sc = R3.shown || c, p = R3.player.position; V.set(p.x, p.y + .9, p.z).project(sc);
      M.fr.push([performance.now(), (GFX.stat && GFX.stat.calls) || r.info.render.calls, (GFX.stat && GFX.stat.tris) || r.info.render.triangles, V.x, V.y, P.px, P.py, sc.position.distanceTo(p), r.domElement.width, PERF.tier]); }
    return o; };
  const lp = loop; loop = function (t) { const a = performance.now(); const lf = lastFrame; lp(t); if (M.on && lastFrame !== lf) M.js.push(performance.now() - a); }; loop._m = 1;
  const wrap = (n, f) => { const o = window[n]; if (typeof o !== 'function') return; window[n] = function () { if (M.on) M.ev.push([n, Math.round(performance.now()), String(arguments[0] ?? '').slice(0, 20)]); return o.apply(this, arguments); }; };
  ['perfSet', 'perfScale', 'build3d', 'ldRun', 'pilotLoad', 'tmLoad', 'w3HausLoad', 'transit'].forEach(n => wrap(n));
  if (R3.fit) { const f = R3.fit; R3.fit = function () { if (M.on) M.ev.push(['fit', Math.round(performance.now()), '']); return f.apply(this, arguments); }; } };
const SUM = () => { const M = window.__M, F = M.fr, n = F.length; if (n < 3) return { n };
  const iv = []; for (let i = 1; i < n; i++) iv.push(F[i][0] - F[i - 1][0]); const srt = a => [...a].sort((x, y) => x - y), pct = (a, q) => { const s = srt(a); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; }, avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  // Wackeln: Bildschirm-Sprung der Figur gegen das gleitende Mittel (5 Bilder) in Pixel bei 640×360
  const jx = [], jy = []; for (let i = 2; i < n - 2; i++) { let mx = 0, my = 0; for (let k = -2; k <= 2; k++) { mx += F[i + k][3]; my += F[i + k][4]; } mx /= 5; my /= 5; jx.push(Math.abs(F[i][3] - mx) * 320); jy.push(Math.abs(F[i][4] - my) * 180); }
  // Tempo: Weg je Bild / Bildabstand
  const sp = []; for (let i = 1; i < n; i++) { const d = Math.hypot(F[i][5] - F[i - 1][5], F[i][6] - F[i - 1][6]), dt = (F[i][0] - F[i - 1][0]) / 1000; if (dt > 0 && d > 0) sp.push(d / dt); }
  const spA = sp.length ? avg(sp) : 0, spSd = sp.length ? Math.sqrt(avg(sp.map(x => (x - spA) ** 2))) : 0, cd = F.map(f => f[7]), cdA = avg(cd);
  const evc = {}; for (const e of M.ev) evc[e[0]] = (evc[e[0]] || 0) + 1;
  return { n, dauer: +((F[n - 1][0] - F[0][0]) / 1000).toFixed(1), fps: +((n - 1) / ((F[n - 1][0] - F[0][0]) / 1000)).toFixed(1), ivAvg: +avg(iv).toFixed(1), ivP95: Math.round(pct(iv, .95)), ivMax: Math.round(Math.max(...iv)),
    ivSd: +Math.sqrt(avg(iv.map(x => (x - avg(iv)) ** 2))).toFixed(1), js: +avg(M.js).toFixed(1), jsP95: +pct(M.js, .95).toFixed(1), calls: Math.round(avg(F.map(f => f[1]))), tris: Math.round(avg(F.map(f => f[2])) / 1000) + 'k',
    wackelX: +avg(jx).toFixed(2), wackelY: +avg(jy).toFixed(2), wackelMax: +Math.max(...jx, ...jy).toFixed(1), tempo: +spA.toFixed(2), tempoCV: +(spA ? spSd / spA : 0).toFixed(3), camCV: +(Math.sqrt(avg(cd.map(x => (x - cdA) ** 2))) / cdA).toFixed(3),
    breiten: [...new Set(F.map(f => f[8]))].length, stufen: [...new Set(F.map(f => f[9]))].join('>'), ev: evc, req: M.req, stab: typeof stabInfo === 'function' ? (({ tier, cap, scale, fps, emerg, downs, ups, work }) => ({ tier, cap, scale, fps, emerg, downs, ups, work }))(stabInfo()) : null }; };
const OUT = {};
for (const tier of TIERS) for (const map of SZ) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 }); await ctx.addInitScript(INIT);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  const reqs = []; p.on('request', q => { const u = q.url(); if (!/^data:/.test(u)) reqs.push([Date.now(), u.replace(URL0, '').slice(0, 60)]); });
  await p.goto(URL0 + 'index.html?modelle3d=1' + (tier !== 'auto' ? '&gfx=' + tier : ''), { waitUntil: 'load', timeout: 180000 });
  try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(400); try { await p.click('#iSkip', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(600);
  await p.evaluate(() => { const i = document.getElementById('intro'); if (i) i.hidden = true; beginGame({}); });
  await p.waitForFunction(() => { if (typeof TW === 'object' && TW && TW.finish) TW.finish(); if (mode === 'dialog') advDlg(); return !!G && !!R3; }, null, { timeout: 60000, polling: 200 });
  await p.evaluate(m => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; G.flags.firstcatch = 1; SET.skipBattleIntro = 1; G.team = [mk(1, 12), mk(4, 10)];
    setView('third'); loadMap(m, m === 'morgenau' ? 9 : 9, m === 'morgenau' ? 8 : 20); mode = 'world'; }, map);
  // Einschwingen: Modelle/Hintergrundladen (bis 40 s), danach 4 s ruhig
  const t0 = Date.now(); for (let i = 0; i < 80; i++) { const q = await p.evaluate(() => typeof VMODEL_QUEUE === 'object' ? VMODEL_QUEUE.q.length + (VMODEL_QUEUE.busy ? 1 : 0) : (Object.values(PILOT.st).includes('load') || Object.values(TMOD.st).includes('load') ? 1 : 0)); if (!q && i > 6) break; await p.waitForTimeout(500); }
  const settle = ((Date.now() - t0) / 1000).toFixed(1); await p.waitForTimeout(4000);
  const cdp = await ctx.newCDPSession(p); if (THR > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  await p.evaluate(HOOK); const r0 = reqs.length;
  // 8 s laufen (leichter Kreis, damit man im Gebiet bleibt), Gehen
  await p.evaluate(() => { window.__M.on = true; P.state = 'walk'; STICK.y = -1; STICK.x = .22; });
  await p.waitForTimeout(8000);
  await p.evaluate(() => { STICK.x = STICK.y = 0; window.__M.on = false; });
  if (THR > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const s = await p.evaluate(SUM);
  // Aufschlüsselung der sichtbaren Dreiecke je Kategorie (mit der Entfernungs-LOD aus 59, so wie gezeichnet)
  s.budget = await p.evaluate(() => { const cam = R3.shown || R3.activeCam || R3.cam; try { if (typeof gfxModelPre === 'function') gfxModelPre(R3.scene, cam); } catch (e) { }
    const cat = o => { for (let q = o; q; q = q.parent) { const U = q.userData || {}; if (U.pilot) return U.pilot === 'fig_noa' || U.pilot === 'fig_heldin' || q === R3.player ? 'spieler' : U.pilot.startsWith('t') ? 'terra' : 'figur'; if (U.tm) return 'terra'; if (q.parent === R3.scene) return o.isInstancedMesh ? 'instanzen' : 'welt'; } return '?'; };
    const out = {}; R3.scene.traverse(o => { if (!o.isMesh) return; for (let q = o; q; q = q.parent) if (!q.visible) return; const g = o.geometry, t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      const k = cat(o) + (o.userData && o.userData.outline ? '-umriss' : ''); const e = out[k] || (out[k] = [0, 0, 0]); e[0] += Math.round(t); e[1]++; if (o.castShadow) e[2] += Math.round(t); });
    try { if (typeof gfxModelPost === 'function') gfxModelPost(); } catch (e) { } return out; }); s.req = reqs.slice(r0).map(x => x[1]); s.settle = settle; s.errs = errs;
  OUT[tier + '_' + map] = s; console.log(`[${TAG}] ${tier} ${map}: ${JSON.stringify(s).slice(0, 900)}`);
  await ctx.close();
}
mkdirSync(join(ROOT, 'test/stabil2'), { recursive: true }); writeFileSync(join(ROOT, 'test/stabil2/mess_' + TAG + '.json'), JSON.stringify(OUT, null, 1));
await browser.close(); srv.close();
