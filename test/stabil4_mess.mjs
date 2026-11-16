// Stabilität Runde 4 – Messung „nach dem Ladebildschirm“ + LOD/Umriss-Budget am Handy. EIN Chromium (Sperre .chromium.lock), SwiftShader, 2 Kerne.
//   LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/stabil4_mess.mjs <tag> [dist]
// Gerät: iPhone 15 Pro Max quer (932×430, DPR 3, Touch, „Apple GPU“, standalone, hasFocus() = false), Modelle über gespeicherten Schalter, Stufe „mittel“ festgehalten
// (SwiftShader würde den Wachhund sonst auf „niedrig“ zwingen; Stufenwechsel wird getrennt gemessen).
// Ablauf: Morgenau (Spielstart) → Ladebildschirm → Route 1 → Ladebildschirm → Kupferhain → Ladebildschirm → Morgenau; je Ankunft 10 s stehen + 6 s laufen.
// Je gezeichnetem Bild: Kosten (Abstand bis zum nächsten rAF), JS-Zeit der Schleife (enthält synchrones Shader-Linken: three prüft LINK_STATUS sofort),
// neue Shader-Programme / Texturen / Geometrien, Ereignisse (aus 61 stabFrameRec). SwiftShader-Bildkosten (≈ 1 s je Bild) sind NICHT aussagekräftig – die Ursachen schon.
import { chromium, devices } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { writeFileSync, mkdirSync } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
const ROOT = fileURLToPath(new URL('../', import.meta.url)), TAG = process.argv[2] || 'nachher', DIST = (process.argv[3] || join(ROOT, 'dist')).replace(/\/?$/, '/');
const STUFE = process.env.STUFE || 'mid', TEIL = (process.env.TEIL || 'laden,stufe,budget').split(','), STEH = +(process.env.STEH || 10000), LAUF = +(process.env.LAUF || 6000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.css': 'text/css', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(DIST, p)); if (!f.startsWith(DIST)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=1536'] });
const INIT = () => {
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const gp = C.prototype.getParameter; C.prototype.getParameter = function (p) { if (p === 0x9246) return 'Apple GPU'; if (p === 0x9245) return 'Apple Inc.'; return gp.call(this, p); }; }
  try { Object.defineProperty(navigator, 'standalone', { get: () => true }); } catch (e) { } try { document.hasFocus = () => false; } catch (e) { }
  const mm = window.matchMedia.bind(window), fake = q => ({ matches: true, media: q, onchange: null, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { }, dispatchEvent() { return false; } });
  window.matchMedia = q => /display-mode:\s*standalone|pointer:\s*coarse|hover:\s*none/.test(q) ? fake(q) : mm(q);
  try { localStorage.clear(); localStorage.setItem('veyra_set', JSON.stringify({ modelle3d: true })); } catch (e) { }
  // echte Programm-Kompilierungen zählen (r.info.programs ist netto: freigegebene alte Programme verdecken neue)
  window.__links = 0; for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const lp = C.prototype.linkProgram; C.prototype.linkProgram = function (p) { window.__links++; return lp.call(this, p); }; }
};
const ctx = await browser.newContext({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 15 Pro Max'].userAgent });
await ctx.addInitScript(INIT); if (process.env.HOLD) await ctx.addInitScript(h => { window.__hold = h; }, +process.env.HOLD); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' })); p.setDefaultTimeout(60000);
const log = s => console.log(`[${TAG}] ` + s); const OUT = { tag: TAG, stufe: STUFE, zeit: new Date().toISOString() };
await p.goto(URL0 + 'index.html', { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(1200);
await p.evaluate(() => { const i = document.getElementById('intro'); if (i) i.hidden = true; beginGame({}); });
await p.waitForFunction(() => { if (typeof TW === 'object' && TW && TW.finish) TW.finish(); if (mode === 'dialog') advDlg(); return !!G && !!R3; }, null, { timeout: 90000, polling: 250 });
// Stufe festhalten + Aufzeichnung je Bild (Hülle um stabLong aus 61: bekommt Kosten + Datensatz des gezeichneten Bildes)
await p.evaluate(t => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); }
  G.flags.starter = 1; G.flags.firstcatch = 1; SET.skipBattleIntro = 1; G.team = [mk(1, 12), mk(4, 10)];
  SET.gfx = t; GFX.force = t; STAB.lim = STAB.ceil = t; STAB.grace = 1e9; STAB.lastBad = -1e9; stabDown = () => { }; stabEmergency = () => { }; perfSet(t);
  window.__R = []; window.__on = false; const sl = stabLong; stabLong = function (cost) { const r = STAB.fr; if (r && window.__on) window.__R.push(Object.assign({}, r, { lk: window.__links - (window.__lk0 || 0), ms: Math.round(cost), at: Math.round(performance.now() - window.__t0), ld: !!(LADEN && LADEN.active), tris: GFX.stat.tris, calls: GFX.stat.calls })); window.__lk0 = window.__links; return sl.apply(this, arguments); };
  if (window.__hold && typeof LOD4 === 'object') LOD4.holdMax = window.__hold;
  setView('third'); loadMap('morgenau', 9, 8); mode = 'world'; dispatchEvent(new Event('blur')); }, STUFE);
const qIdle = async cap => { const t0 = Date.now(); while (Date.now() - t0 < cap) { const s = await p.evaluate(() => VMODEL_QUEUE.q.length + (VMODEL_QUEUE.busy ? 1 : 0)); if (!s) return Math.round((Date.now() - t0) / 100) / 10; await p.waitForTimeout(400); } return 'timeout'; };
log('Start Morgenau, Warteschlange leer nach ' + await qIdle(+(process.env.QSTART || 240000)) + ' s'); await p.waitForTimeout(3000);
const SUMF = F => { const a = F.filter(f => !f.ld), sum = k => a.reduce((s, f) => s + (f[k] || 0), 0), mx = k => a.reduce((s, f) => Math.max(s, f[k] || 0), 0);
  return { bilder: a.length, kompiliert: sum('lk'), neueProgramme: sum('prog'), neueTexturen: sum('tex'), neueGeo: sum('geo'), bilderMitProgramm: a.filter(f => f.prog > 0).length, jsMax: mx('js'), jsUeber100: a.filter(f => f.js > 100).length, kostenMax: mx('ms'),
    trisMax: mx('tris'), callsMax: mx('calls'), ursachen: a.filter(f => f.lk > 0 || f.prog > 0 || f.tex > 0 || f.js > 100).slice(0, 8).map(f => `${f.at}ms js${f.js} k${f.lk} p${f.prog} t${f.tex} g${f.geo} ${f.ev.join('/')}`) }; };
// ---------- check: LOD-Netze und Szene kurz prüfen ----------
if (TEIL.includes('check')) { OUT.check = await p.evaluate(() => { const tri = g => g ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0; const o = { info: typeof lodInfo === 'function' ? lodInfo() : null, heldin: [] };
  R3.player.traverse(m => { if (m.isMesh) o.heldin.push([m.name || (m.userData.outline === 1 ? 'Hülle' : '?'), tri(m.geometry), m.visible, m.castShadow, m.userData.outline === 1 ? 'H' : m.userData.shadowOnly ? 'S' : '']); });
  o.prog = R3.r.info.programs.length; o.links = window.__links; return o; }); log('check: ' + JSON.stringify(OUT.check).slice(0, 2500)); }
// ---------- probe: Bildfolge nach Ladebildschirm (Fehlersuche) ----------
if (TEIL.includes('probe')) { for (const [id, x, y] of [['kupferhain', 4, 11], ['route1', 9, 20]]) {
  await p.evaluate(([id, x, y]) => { LOD4.holdMax = 90000; transit(() => loadMap(id, x, y), id); }, [id, x, y]);
  for (let i = 0; i < 40; i++) { const st = await p.evaluate(() => ({ fr: STAB.frames, cnt: LADEN.count, ldN: PC4.ldN, act: LADEN.active, nach: PC4.nach.length, tEnd: Math.round(PC4.tEnd), paused: LOOP.paused, lr: Math.round(STAB.lr), now: Math.round(performance.now()), stopped: STAB.stopped, mode })); log(id + ' ' + JSON.stringify(st)); if (!st.act && st.nach >= 3) break; await p.waitForTimeout(1000); } } }
// ---------- laden: drei Ladebildschirme ----------
if (TEIL.includes('laden')) { OUT.laden = {};
  for (const [id, x, y] of [['route1', 9, 20], ['kupferhain', 4, 11], ['morgenau', 9, 8]]) {
    const q0 = await p.evaluate(() => VMODEL_QUEUE.ms.length);
    await p.evaluate(([id, x, y]) => { window.__R = []; window.__t0 = performance.now(); window.__on = true; window.__ldEnd = 0; transit(() => loadMap(id, x, y), id); }, [id, x, y]);
    await p.waitForFunction(() => !LADEN.active, null, { timeout: 120000, polling: 50 }); const ldEnd = await p.evaluate(() => (window.__ldEnd = Math.round(performance.now() - window.__t0)));
    await p.waitForTimeout(STEH); await p.evaluate(() => { P.state = 'walk'; STICK.y = -1; STICK.x = .35; }); await p.waitForTimeout(LAUF); await p.evaluate(() => { STICK.x = STICK.y = 0; window.__on = false; });
    const r = await p.evaluate(q0 => ({ F: window.__R, lg: LADEN.log[LADEN.log.length - 1], q: VMODEL_QUEUE.ms.slice(q0), wait: VMODEL_QUEUE.q.map(x => x.name), prog: R3.r.info.programs.length, links: window.__links, r4: typeof lodInfo === 'function' ? lodInfo() : null }), q0);
    const lad = r.F.filter(f => f.ld), s = SUMF(r.F);
    OUT.laden[id] = { ladeMs: r.lg && r.lg.ms, ldEnd, imLaden: { bilder: lad.length, kompiliert: lad.reduce((a, f) => a + f.lk, 0), jsMax: lad.reduce((a, f) => Math.max(a, f.js), 0) }, danach: s, modelleFertig: r.q, wartend: r.wait, programmeGesamt: r.prog, links: r.links, r4: r.r4 && { hold: r.r4.pc.hold, warm: r.r4.pc.log.slice(-3), lod: r.r4.lod, nach: r.r4.nach } };
    log(`${id}: ${JSON.stringify(OUT.laden[id]).slice(0, 1600)}`); }
}
// ---------- stufe: Stufenwechsel mittel → niedrig → mittel (Schatten an/aus) ----------
if (TEIL.includes('stufe')) { OUT.stufe = {};
  for (const t of ['low', 'mid', 'low', 'mid']) { await p.evaluate(t => { window.__R = []; window.__t0 = performance.now(); window.__on = true; SET.gfx = t; GFX.force = t; STAB.lim = STAB.ceil = t; perfSet(t); }, t);
    await p.waitForTimeout(5000); const F = await p.evaluate(() => { window.__on = false; return window.__R; }); const s = SUMF(F); (OUT.stufe[t] = OUT.stufe[t] || []).push(s); log(`Stufe → ${t}: ${JSON.stringify(s).slice(0, 600)}`); } }
// ---------- budget: Morgenau/Route 1/Kupferhain stehend, Umrisse Heldin + 2 nächste Figuren, Dreiecke/Calls ----------
if (TEIL.includes('budget')) { OUT.budget = {};
  for (const [id, x, y] of [['morgenau', 9, 8], ['route1', 9, 20], ['kupferhain', 4, 11]]) {
    await p.evaluate(([id, x, y]) => { loadMap(id, x, y); mode = 'world'; }, [id, x, y]); await p.waitForTimeout(2500); await qIdle(90000);
    const b = await p.evaluate(async () => { const r = []; STAB.grace = 1e9;
      for (let i = 0; i < 30; i++) { R3.r.render(R3.scene, R3.activeCam || R3.cam); r.push([GFX.stat.tris, GFX.stat.calls, GFX.bud.lvl]); await new Promise(q => setTimeout(q, 0)); }
      // Sichtbarkeit wie im letzten Bild: Umrisshüllen der Heldin und der nächsten Figuren/Terras (mit Budget aus 59 vor dem Zeichnen gesetzt)
      const cam = R3.activeCam || R3.cam; let ol = null; try { gfxModelPre(R3.scene, cam); const vis = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
        const pp = R3.player.position, roots = []; R3.scene.traverse(o => { const U = o.userData || {}; if ((U.pilot || U.tm) && o !== R3.player && vis(o)) roots.push(o); });
        const hull = o => { let n = 0, t = 0, b = 0, tr = 0; o.traverse(m => { if (m.isMesh && m.userData.outline === 1) { n++; if (vis(m)) { b++; const g = m.geometry; tr += (g.index ? g.index.count : g.attributes.position.count) / 3; } } }); return { n, sichtbar: b, tris: Math.round(tr) }; };
        const near = roots.map(o => [o, o.getWorldPosition(new THREE.Vector3()).distanceTo(pp)]).sort((a, b) => a[1] - b[1]).slice(0, 3);
        ol = { heldin: hull(R3.player), naechste: near.map(([o, d]) => Object.assign({ k: o.userData.pilot || o.userData.tm, d: +d.toFixed(1), lod4: o.userData.lod4 || 0, lod1: !!(o.userData.lodOn || o.userData.lod === 1) }, hull(o))) }; } catch (e) { ol = { err: String(e) }; } finally { try { gfxModelPost(); } catch (e) { } }
      const kat = {}; try { gfxModelPre(R3.scene, cam); const vis = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
        const cat = o => { for (let q = o; q; q = q.parent) { const U = q.userData || {}; if (q === R3.player) return 'heldin'; if (U.pilot) return 'figur'; if (U.tm) return 'terra'; if (U.haus) return 'haus'; if (q.parent === R3.scene) return o.isInstancedMesh ? 'inst' : o.isPoints ? 'punkte' : o.isSprite ? 'sprite' : 'welt'; } return '?'; };
        R3.scene.traverse(o => { if (!(o.isMesh || o.isPoints || o.isSprite) || !vis(o) || o.userData.shadowOnly) return; if (o.isInstancedMesh && !o.count) return; const k = cat(o) + (o.userData.outline === 1 ? '-umriss' : ''); kat[k] = (kat[k] || 0) + 1; if (o.castShadow && R3.sun.castShadow) kat.schatten = (kat.schatten || 0) + 1; });
        R3.scene.traverse(o => { if (o.userData && o.userData.shadowOnly && vis(o) && o.castShadow && R3.sun.castShadow) kat.schatten = (kat.schatten || 0) + 1; }); } catch (e) { kat.err = String(e); } finally { try { gfxModelPost(); } catch (e) { } }
      const last = r.slice(-6); return { kat, tris: Math.max(...last.map(x => x[0])), calls: Math.max(...last.map(x => x[1])), lvl: last[5][2], erstes: r[0], umriss: ol, tier: PERF.tier }; });
    OUT.budget[id] = b; log(`Budget ${id}: ${JSON.stringify(b).slice(0, 900)}`); } }
OUT.errs = p.errs; mkdirSync(join(ROOT, 'test/stabil4'), { recursive: true }); writeFileSync(join(ROOT, 'test/stabil4/mess_' + TAG + '.json'), JSON.stringify(OUT, null, 1));
log('Fehler: ' + JSON.stringify(p.errs.slice(0, 5))); await browser.close(); srv.close();
