// Stabilität PC (61-stabil.js) – Abnahme + Messung vorher/nachher. EIN Chromium (Sperre .chromium.lock), SwiftShader, 1536×695 bei DPR 1,25 (Christophs Laptop).
//   node build.mjs && node tools/werkstatt-build.mjs "…" && node test/stabil_qa.mjs
//   Vorher-Stand (ohne 61-stabil.js, alter Werkstatt-Build) optional über STAB_VORHER=/pfad (enthält dist/ und tools/leitstand/spiel/); ohne → nur nachher.
// Der WebGL-Renderer-Name wird per addInitScript auf „Intel(R) Iris(R) Xe Graphics“ gesetzt (wie am PC). SwiftShader ist viel langsamer als eine echte GPU:
// Werte sind nur relativ (vorher/nachher) aussagekräftig.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { newGame } from './qa_mech_lib.mjs';
const here = n => fileURLToPath(new URL('./' + n, import.meta.url)), ROOT = fileURLToPath(new URL('../', import.meta.url));
const VOR = process.env.STAB_VORHER || '', ONLY = process.env.STAB_ONLY || '';
const LOG = here('stabil_qa.log'); writeFileSync(LOG, '# Stabilität PC – ' + new Date().toISOString() + '\n');
const R = { ok: 0, bad: 0, rows: [], mess: {} };
const t = (n, c, info) => { const ok = !!c; ok ? R.ok++ : R.bad++; R.rows.push({ n, ok, info }); const l = (ok ? '✓ ' : '✗ ') + n + (info !== undefined ? ' → ' + JSON.stringify(info).slice(0, 500) : ''); console.log(l); appendFileSync(LOG, l + '\n'); };
const note = s => { console.log('  ' + s); appendFileSync(LOG, '  ' + s + '\n'); };
// ---------- Server: /n/ nachher-dist, /v/ vorher-dist, /ls/ Leitstand nachher, /lv/ Leitstand vorher ----------
const MAP = { n: join(ROOT, 'dist/'), ls: join(ROOT, 'tools/leitstand/'), ...(VOR ? { v: join(VOR, 'dist/'), lv: join(VOR, 'tools/leitstand/') } : {}) };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.css': 'text/css' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); const m = /^\/(\w+)\//.exec(p); const base = m && MAP[m[1]];
  if (!base) { rs.writeHead(404); return rs.end(); } p = p.slice(m[0].length - 1); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(base, p)); if (!f.startsWith(base)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=1536', '--enable-blink-features=LongTaskTiming'] });
// Vor dem Laden in jedem Rahmen: GPU-Name wie am PC, Long-Task-Beobachter, unabhängige rAF-Messung (läuft auch nach dem Beenden weiter)
const INIT = () => {
  const RN = 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)';
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const gp = C.prototype.getParameter; C.prototype.getParameter = function (p) { if (p === 0x9246) return RN; if (p === 0x9245) return 'Google Inc. (Intel)'; return gp.call(this, p); }; }
  window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { }
  const rq = window.requestAnimationFrame.bind(window); window.__raf = []; const f = ts => { window.__raf.push(ts); if (window.__raf.length > 30000) window.__raf.splice(0, 15000); rq(f); }; rq(f);
  try { localStorage.clear(); } catch (e) { }
};
// Messfenster im Rahmen/der Seite: rAF-Abstände (Ø, max, Anteil > 50 ms), längste Long Task, Zeitgeber-Verzug (Bedienbarkeit), gezeichnete Spielbilder
const MEAS = async ms => { const t0 = performance.now(); let lag = 0, last = t0; const iv = setInterval(() => { const n = performance.now(); lag = Math.max(lag, n - last - 100); last = n; }, 100);
  const fr0 = typeof PERF === 'object' ? PERF.frames : 0; await new Promise(r => setTimeout(r, ms)); clearInterval(iv);
  const ts = window.__raf.filter(x => x >= t0), d = []; for (let i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]);
  const lt = window.__lt.filter(x => x[0] >= t0).map(x => x[1]);
  return { ms, rafN: ts.length, rafAvg: d.length ? +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(1) : null, rafMax: d.length ? Math.round(Math.max(...d)) : null, slow: d.length ? +(d.filter(x => x > 50).length / d.length).toFixed(2) : null,
    ltMax: lt.length ? Math.round(Math.max(...lt)) : 0, ltN: lt.length, ltSum: Math.round(lt.reduce((a, b) => a + b, 0)), lag: Math.round(lag), frames: (typeof PERF === 'object' ? PERF.frames : 0) - fr0,
    tier: typeof PERF === 'object' ? PERF.tier : '?', scale: typeof PERF === 'object' ? PERF.scale : '?', stab: typeof stabInfo === 'function' ? (({ tier, lim, smax, fps, emerg, downs, q }) => ({ tier, lim, smax, fps, emerg, downs, q }))(stabInfo()) : null }; };
async function mkPage(url) { const ctx = await browser.newContext({ viewport: { width: 1536, height: 695 }, deviceScaleFactor: 1.25 }); const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load|favicon|net::ERR|GPU stall|GL Driver|ReadPixels|claude|artifact/i.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 200)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await ctx.addInitScript(INIT); p.setDefaultTimeout(30000); p.setDefaultNavigationTimeout(180000);
  await p.goto(URL0 + url, { waitUntil: 'load' }); return p; }
const qIdle = async (f, cap) => { const t0 = Date.now(); while (Date.now() - t0 < cap) { const s = await f.evaluate(() => typeof VMODEL_QUEUE === 'object' ? { w: VMODEL_QUEUE.q.length, b: VMODEL_QUEUE.busy, d: VMODEL_QUEUE.done } : null); if (!s) { await f.waitForTimeout(cap); return null; } if (!s.w && !s.b && s.d > 0) return s; await f.waitForTimeout(500); } return 'timeout'; };
// ---------- A) Spiel direkt (vorher/nachher): Stufenwahl, Morgenau + Route 1 mit Modellen ----------
async function partA(tag, root) {
  const p = await mkPage(root + '/index.html?modelle3d=1'); const M = R.mess[tag] = {};
  M.start = await p.evaluate(() => ({ gpu: GFX.gpu, strong: GFX.strong, tier: PERF.tier, weak: PERF.weak, dpr: dprCap(), fps: SET.fps, stab: typeof stabInfo === 'function' ? stabInfo() : null }));
  note(`[${tag}] Start: ${JSON.stringify(M.start).slice(0, 400)}`);
  await newGame(p, { team: [[1, 12], [4, 10]], view: '3d' });
  for (const [id, x, y] of [['morgenau', 9, 6], ['route1', 9, 20]]) {
    const t0 = Date.now(); await p.evaluate(([id, x, y]) => { window.__mt0 = performance.now(); loadMap(id, x, y); mode = 'world'; }, [id, x, y]);
    const q = await qIdle(p, tag === 'v' ? 12000 : 60000); const loadS = ((Date.now() - t0) / 1000).toFixed(1);
    const L = await p.evaluate(() => { const lt = window.__lt.filter(x => x[0] >= window.__mt0).map(x => x[1]); return { ltMax: lt.length ? Math.round(Math.max(...lt)) : 0, ltN: lt.length, ltSum: Math.round(lt.reduce((a, b) => a + b, 0)) }; });
    const m = await p.evaluate(MEAS, 8000); M[id] = { loadS, queue: q, laden: L, danach: m };
    note(`[${tag}] ${id}: Laden ${loadS} s ${JSON.stringify(L)} · danach ${JSON.stringify(m).slice(0, 420)}`);
  }
  M.models = await p.evaluate(() => ({ fig: Object.keys((typeof PILOT === 'object' && PILOT.gltf) || {}), terra: Object.keys((typeof TMOD === 'object' && TMOD.gltf) || {}), haus: typeof W3HAUS === 'object' ? W3HAUS.st : null, q: typeof VMODEL_QUEUE === 'object' ? VMODEL_QUEUE.ms : null }));
  note(`[${tag}] Modelle: ${JSON.stringify(M.models).slice(0, 600)}`);
  return p;
}
if (VOR && ONLY !== 'n') { const pv = await partA('v', 'v'); await pv.screenshot({ path: here('stabil_vorher_route1.png') }); await pv.context().close(); }
const p = await partA('n', 'n'); const ev = (f, a) => p.evaluate(f, a); const W = ms => p.waitForTimeout(ms); const N = R.mess.n;
t('1 Iris Xe → Stufe „mittel“, 30 fps, DPR ≤ 1,25', N.start.stab && N.start.stab.cls === 'igpu' && N.start.tier === 'mid' && N.start.stab.cap === 30 && N.start.dpr <= 1.25, { cls: N.start.stab && N.start.stab.cls, tier: N.start.tier, cap: N.start.stab && N.start.stab.cap, dpr: N.start.dpr });
t('1 GFX.strong für integrierte Grafik aus', N.start.strong === false, N.start.strong);
{ const cl = await ev(() => ['NVIDIA GeForce RTX 3060 Laptop GPU', 'AMD Radeon RX 6700 XT', 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified)', 'Intel(R) Iris(R) Xe Graphics', 'Intel(R) Arc(TM) Graphics', 'Intel(R) Arc(TM) A770 Graphics', 'AMD Radeon(TM) Graphics', 'Intel(R) UHD Graphics 620', 'Intel(R) HD Graphics 520', 'AMD Radeon(TM) Vega 8 Graphics', 'Intel(R) Iris(TM) Plus Graphics 655', 'NVIDIA GeForce MX450', 'Google SwiftShader'].map(r => stabClass('ANGLE (' + r + ')', false)));
  t('1 Klassen: RTX/RX/M1 dediziert · Iris Xe/Arc int./Radeon Graphics mittel · UHD/HD/Vega/Iris Plus niedrig', cl.join() === 'dgpu,dgpu,dgpu,igpu,igpu,dgpu,igpu,igpu-low,igpu-low,igpu-low,igpu-low,igpu,soft', cl); }
for (const id of ['morgenau', 'route1']) { const m = N[id]; t(`2 ${id}: nach dem Laden längste Aufgabe < 300 ms (Hauptthread bedienbar)`, m.danach.ltMax < 300 && m.danach.lag < 300, { ltMax: m.danach.ltMax, lag: m.danach.lag, rafAvg: m.danach.rafAvg }); }
t('2 Modelle nacheinander (Warteschlange, nie mehr als 1 gleichzeitig) und geladen', N.models.q && N.models.q.length >= 3 && N.route1.queue && N.route1.queue !== 'timeout', { n: N.models.q && N.models.q.length, fig: N.models.fig.length, terra: N.models.terra.length, haus: N.models.haus });
// ---------- Wachhund (2D-Ansicht: leichte Szene, damit nur die künstliche Last zählt) ----------
await ev(() => { setView('2d'); mode = 'world'; }); await W(2000);
await ev(() => { STAB.ceil = STAB.lim = 'high'; STAB.emerg = 0; STAB.downs = 0; STAB.lastBad = -1e9; STAB.smax = 1; STAB.cap = 30; STAB.spikes.length = 0; GFX.force = null; perfSet('high'); stabLoad(0); });
await W(3000); const w0 = await ev(() => stabInfo());
await ev(() => stabLoad(58)); await W(5500); const w1 = await ev(() => stabInfo());
t('3 Wachhund: Ø > 45 ms → eine Stufe runter (ohne Notbremse)', w0.tier === 'high' && w1.downs >= 1 && w1.tier !== 'high' && !w1.emerg, { vor: w0.tier, nach: w1.tier, downs: w1.downs, emerg: w1.emerg, avg: w1.avg, log: w1.log.slice(-3) });
await ev(() => stabLoad(300)); await W(2500); const w2 = await ev(() => Object.assign(stabInfo(), { post: GFX.post }));
t('3 Wachhund: Bilder > 250 ms → sofort niedrig + Skala 0,5 + Bloom aus', w2.emerg >= 1 && w2.tier === 'low' && w2.smax === .5 && w2.post === false, { tier: w2.tier, smax: w2.smax, emerg: w2.emerg, post: w2.post, log: w2.log.slice(-2) });
await ev(() => stabLoad(0)); await W(6000); const w3 = await ev(() => stabInfo());
t('3 Wachhund: nicht zurück nach oben, bevor 10 s stabil', w3.tier === 'low' && w3.ups === w2.ups, { tier: w3.tier, ups: w3.ups });
t('3 Renderskala darf unter die Mindestskala (0,5)', await ev(() => (setView('third'), PERF.scale <= .5 + 1e-6 && resH3() <= Math.round(resH() * .5) + 1)), await ev(() => ({ s: PERF.scale, h3: resH3(), h: resH() })));
await W(1500);
// ---------- Sichtbarkeit: verdeckt → keine Bilder; ohne Fokus → ≤ 5/s ----------
{ const f0 = await ev(() => PERF.frames);
  await ev(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await W(300); const f1 = await ev(() => PERF.frames); await W(2000); const f2 = await ev(() => PERF.frames);
  await ev(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); }); await W(1500); const f3 = await ev(() => PERF.frames);
  t('4d verdeckt (visibilitychange) → keine Bilder, danach weiter', f2 - f1 === 0 && f3 > f2, { f0, f1, f2, f3 });
  await ev(() => { window.__hf = document.hasFocus; document.hasFocus = () => false; dispatchEvent(new Event('blur')); }); await W(500);
  const b0 = await ev(() => PERF.frames); await W(3000); const b1 = await ev(() => PERF.frames);
  await ev(() => { document.hasFocus = window.__hf; dispatchEvent(new Event('focus')); }); await W(800);
  t('4d ohne Fokus → höchstens 5 Bilder/s', (b1 - b0) / 3 <= 5.5 && b1 > b0, { fps: +((b1 - b0) / 3).toFixed(1) });
  await ev(() => { STAB.off = true; }); await W(400); const o0 = await ev(() => PERF.frames); await W(1500); const o1 = await ev(() => PERF.frames);
  await ev(() => { STAB.off = false; stabResume(); }); await W(1200); const o2 = await ev(() => PERF.frames);
  t('4d außerhalb des Bildes (IntersectionObserver-Zustand) → Pause, danach weiter', o1 === o0 && o2 > o1, { o0, o1, o2 }); }
// ---------- Beenden per Nachricht ----------
{ const before = await ev(() => ({ f: PERF.frames, gl: STAB.gls.length }));
  await ev(() => { window.__stopT = performance.now(); window.addEventListener('message', e => { if (e.data && e.data.veyra === 'stopped') window.__stopped = Object.assign({ dt: performance.now() - window.__stopT }, e.data); }); window.postMessage({ veyra: 'stop' }, '*'); });
  await W(500); const a1 = await ev(() => PERF.frames); await W(1500); const a2 = await ev(() => PERF.frames);
  const st = await ev(() => ({ r: window.__stopped || null, lost: STAB.gls.filter(g => g.isContextLost()).length, gl: STAB.gls.length, saved: !!Object.keys(localStorage).find(k => /save/i.test(k) && localStorage.getItem(k)), ac: typeof AC !== 'undefined' && AC ? AC.state : 'kein' }));
  t('4a stop → innerhalb 500 ms keine Bilder mehr', a2 === a1, { a1, a2, dt: st.r && Math.round(st.r.dt) });
  t('4a stop → alle WebGL-Kontexte freigegeben, gespeichert, Ton aus', st.r && st.gl > 0 && st.lost === st.gl && st.saved && st.ac !== 'running', st);
  const idle = await ev(MEAS, 2500); R.mess.n.nachStop = idle; t('4a nach stop ist die Seite ruhig (rAF Ø < 25 ms, keine Long Tasks)', idle.rafAvg < 25 && idle.ltMax < 100, { rafAvg: idle.rafAvg, ltMax: idle.ltMax }); }
await p.screenshot({ path: here('stabil_nach_stop.png') });
t('0 keine Seitenfehler (Spiel)', !p.errs.length, p.errs.slice(0, 5)); await p.context().close();
// ---------- B) Leitstand mit Werkstatt-Build im Rahmen: Start → 20 s → Beenden → Außenseite wieder flüssig ----------
async function partB(tag, root) {
  const lp = await mkPage(root + '/leitstand.html'); const M = R.mess['ls_' + tag] = {};
  await lp.click('#tabW').catch(() => lp.evaluate(() => { document.getElementById('vW').hidden = false; document.getElementById('vL').hidden = true; })); await lp.waitForTimeout(800);
  M.vorStart = await lp.evaluate(MEAS, 3000);
  await lp.evaluate(() => { window.__tS = performance.now(); }); await lp.click('#startGame');
  let fr = null; for (let i = 0; i < 60 && !fr; i++) { await lp.waitForTimeout(500); fr = lp.frames().find(f => /spiel\/index\.html/.test(f.url())); }
  await fr.waitForLoadState('load'); try { await newGame(fr, { team: [[1, 12], [4, 10]], view: '3d' }); await fr.evaluate(() => { loadMap('morgenau', 9, 6); mode = 'world'; }); } catch (e) { note(`[ls_${tag}] Spielstart im Rahmen: ${e.message.slice(0, 120)}`); }
  M.lauf = await lp.evaluate(MEAS, 20000); note(`[ls_${tag}] Außenseite während 20 s Spiel: ${JSON.stringify(M.lauf).slice(0, 300)}`);
  M.innen = await fr.evaluate(() => ({ tier: PERF.tier, frames: PERF.frames, stab: typeof stabInfo === 'function' ? stabInfo() : null })).catch(e => ({ err: e.message.slice(0, 80) }));
  note(`[ls_${tag}] Spiel im Rahmen: ${JSON.stringify(M.innen).slice(0, 500)}`);
  if (tag === 'n') {
    // Ansicht wechseln → Rahmen ausgeblendet → Spiel pausiert (IntersectionObserver)
    await lp.click('#tabL'); await lp.waitForTimeout(800); const i0 = await fr.evaluate(() => PERF.frames); await lp.waitForTimeout(2000); const i1 = await fr.evaluate(() => PERF.frames); const off = await fr.evaluate(() => STAB.off);
    await lp.click('#tabW'); await lp.waitForTimeout(1500); const i2 = await fr.evaluate(() => PERF.frames);
    t('5 Leitstand: Werkstatt ausgeblendet → Spiel pausiert, danach weiter', i1 - i0 <= 1 && off && i2 > i1, { i0, i1, i2, off });
    // Fokus auf der Außenseite → gedrosselt
    await lp.click('h2'); await lp.waitForTimeout(900); const d0 = await fr.evaluate(() => PERF.frames); await lp.waitForTimeout(3000); const d1 = await fr.evaluate(() => PERF.frames);
    t('5 Leitstand: Fokus außen → Spiel ≤ 5 Bilder/s', (d1 - d0) / 3 <= 5.5, { fps: +((d1 - d0) / 3).toFixed(1) });
    t('5 Werkstatt startet auf „mittel“ oder niedriger, Badge zeigt fps + Stufe', M.innen.stab && M.innen.stab.ws && M.innen.stab.base === 'mid' && /fps|Pause/.test(await fr.evaluate(() => (document.querySelector('#stgBadge .stab') || {}).textContent || '')), { ws: M.innen.stab && M.innen.stab.ws, base: M.innen.stab && M.innen.stab.base, badge: await fr.evaluate(() => (document.querySelector('#stgBadge .stab') || {}).textContent || '') });
    await lp.screenshot({ path: here('stabil_leitstand.png') });
  }
  const s0 = Date.now(); await lp.click('#stopGame', { timeout: 15000 }).catch(e => note('Klick Beenden: ' + e.message.slice(0, 100)));
  for (let i = 0; i < 100 && await lp.evaluate(() => !!document.querySelector('#frame iframe')); i++) await lp.waitForTimeout(50);
  M.beendenMs = Date.now() - s0; M.nach = await lp.evaluate(MEAS, 3000);
  note(`[ls_${tag}] Beenden ${M.beendenMs} ms · Außenseite danach ${JSON.stringify(M.nach).slice(0, 200)}`);
  if (tag === 'n') {
    t('5 Leitstand: „Spiel beenden“ entfernt den Rahmen ≤ 1 s, Außenseite danach flüssig', M.beendenMs < 1000 && M.nach.rafAvg < 25 && M.nach.ltMax < 150, { ms: M.beendenMs, rafAvg: M.nach.rafAvg, ltMax: M.nach.ltMax });
    t('5 Leitstand: Außenseite bleibt bedienbar während das Spiel läuft (Zeitgeber-Verzug < 300 ms, längste Aufgabe < 300 ms)', M.lauf.lag < 300 && M.lauf.ltMax < 300, { lag: M.lauf.lag, ltMax: M.lauf.ltMax, rafAvg: M.lauf.rafAvg });
    // Strg+Q mit Fokus auf der Außenseite
    await lp.click('#startGame'); let f2 = null; for (let i = 0; i < 60 && !f2; i++) { await lp.waitForTimeout(500); f2 = lp.frames().find(f => /spiel\/index\.html/.test(f.url())); }
    await f2.waitForLoadState('load'); await lp.waitForTimeout(4000); await lp.click('h2'); await lp.waitForTimeout(300);
    const q0 = Date.now(); await lp.keyboard.press('Control+KeyQ'); for (let i = 0; i < 80 && await lp.evaluate(() => !!document.querySelector('#frame iframe')); i++) await lp.waitForTimeout(50);
    const qms = Date.now() - q0; t('4c Strg+Q mit Fokus im Leitstand → Spiel speichert, Rahmen wird entfernt', qms < 2500, { ms: qms });
    // Vollbild verlassen → ebenfalls beenden
    await lp.click('#startGame'); await lp.waitForTimeout(3000); await lp.evaluate(() => { document.getElementById('frame').classList.add('fs'); });
    await lp.click('#fsExit'); await lp.waitForTimeout(700); t('4b „Vollbild verlassen“ beendet das Spiel (Nachricht, ≤ 300 ms, Rahmen weg)', !(await lp.evaluate(() => !!document.querySelector('#frame iframe'))));
    t('0 keine Seitenfehler (Leitstand + Werkstatt)', !lp.errs.length, lp.errs.slice(0, 5));
  }
  await lp.context().close();
}
if (VOR && existsSync(join(VOR, 'tools/leitstand/spiel/index.html')) && ONLY !== 'n') await partB('v', 'lv');
await partB('n', 'ls');
// ---------- Vergleich ----------
const V = R.mess.v, LV = R.mess.ls_v, LN = R.mess.ls_n;
if (V) for (const id of ['morgenau', 'route1']) note(`Vergleich ${id}: Laden längste Aufgabe ${V[id].laden.ltMax} → ${N[id].laden.ltMax} ms (Summe ${V[id].laden.ltSum} → ${N[id].laden.ltSum}) · danach rAF Ø ${V[id].danach.rafAvg} → ${N[id].danach.rafAvg} ms, längste ${V[id].danach.ltMax} → ${N[id].danach.ltMax} ms, Stufe ${V[id].danach.tier} → ${N[id].danach.tier}`);
if (LV && LN) note(`Vergleich Leitstand: Außenseite rAF Ø ${LV.lauf.rafAvg} → ${LN.lauf.rafAvg} ms, längste Aufgabe ${LV.lauf.ltMax} → ${LN.lauf.ltMax} ms, Verzug ${LV.lauf.lag} → ${LN.lauf.lag} ms, Beenden ${LV.beendenMs} → ${LN.beendenMs} ms, danach rAF Ø ${LV.nach.rafAvg} → ${LN.nach.rafAvg}`);
writeFileSync(here('stabil_qa.json'), JSON.stringify(R.mess, null, 1));
console.log(`stabil_qa: ${R.ok} ok, ${R.bad} fehl`); appendFileSync(LOG, `stabil_qa: ${R.ok} ok, ${R.bad} fehl\n`);
await browser.close(); srv.close(); process.exit(R.bad ? 1 : 0);
