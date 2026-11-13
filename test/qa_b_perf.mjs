// QA Loop B3 – Prüfung 9: Performance-Basismessung (Vorher-Stand für das Modul „Look-Modernisierung + Performance“).   node test/qa_b_perf.mjs
// Headless Chromium + SwiftShader (Software-GL) → NUR Richtwert (Verhältnisse/Draw-Calls/JS-Zeit zählen, absolute FPS sind auf einem Handy anders).
// Je Szene (route1, morgenau, kupferhain, Kampf 3D) und Viewport (860×400, 1920×1080; 860×400 zusätzlich mit CPU 4×):
//   FPS + Frame-Zeit (rAF-Abstände, Mittel/p95/max), JS-Zeit je Frame (performance.now()-Umhüllung der Hauptschleife `loop`), davon Render-Aufruf (R3.r.render / BT.r.render),
//   je Konfiguration standard (Auslieferung: res 1440, Schatten) / native (Renderhöhe = CSS-Höhe) / niedrig (Voreinstellung);
//   Draw-Calls/Dreiecke/Geometrien/Texturen (renderer.info), Render-Auflösung (Canvas-Pixel) und JS-Heap. Messfenster 4 s, SET.fps=0 (unbegrenzt; der Standard-Cap 30 würde nur begrenzen).
// Ergebnis → test/qa_b_perf.json, Tabelle in docs/perf-basis.md (von Hand übernommen).
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync } from 'fs';
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const RES = [];
const VPS = [{ w: 860, h: 400, cpu: 1 }, { w: 860, h: 400, cpu: 4 }, { w: 1920, h: 1080, cpu: 1 }];
const SCENES = [{ id: 'route1', map: 'route1', x: 9, y: 8 }, { id: 'morgenau', map: 'morgenau', x: 10, y: 10 }, { id: 'kupferhain', map: 'kupferhain', x: 16, y: 12 }, { id: 'kampf3d', battle: true }];
// Konfigurationen: standard = Auslieferungswerte (res 1440 = Renderhöhe 1440 px unabhängig von der CSS-Größe, Schatten an); native = Renderhöhe = CSS-Höhe × DPR (hier DPR 1); niedrig = Voreinstellung „niedrig“ (720, ohne Schatten/Licht/Partikel, Sicht nah)
const CFGS = [{ id: 'standard', set: { res: '1440', shadows: 1, light: 1, particles: 1, dist: 'mittel' } }, { id: 'native', set: { res: 'native', shadows: 1, light: 1, particles: 1, dist: 'mittel' } }, { id: 'niedrig', set: { res: '720', shadows: 0, light: 0, particles: 0, dist: 'nah' } }];
const MS = +(process.argv[2] || 4000);
for (const vp of VPS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 140)); });
  await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto(S.url + 'index.html', { waitUntil: 'load' });
  await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
  await page.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; SET.btl = 'runde'; G.team.push(mk(1, 12)); G.team.push(mk(4, 12)); ROAM.list.length = 0; ROAM.want = 0;
    window.__js = []; window.__rd = []; const L = loop; loop = function (t) { const a = performance.now(); try { return L.apply(this, arguments); } finally { window.__js.push(performance.now() - a); } }; });
  if (vp.cpu > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: vp.cpu }); }
  await page.evaluate(() => { setView('third'); }); await page.waitForTimeout(2500);
  await page.evaluate(() => { const w = r => { if (r && !r._pf) { r._pf = 1; const o = r.render; r.render = function () { const a = performance.now(); try { return o.apply(this, arguments); } finally { window.__rd.push(performance.now() - a); } }; } }; w(R3 && R3.r); });
  for (const sc of SCENES) {
    try {
      if (sc.battle) { await page.evaluate(() => startBattle({ wild: mk(59, 10) })); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 240000 }); await page.evaluate(() => { if (BT && BT.r && !BT.r._pf) { const r = BT.r, o = r.render; r._pf = 1; r.render = function () { const a = performance.now(); try { return o.apply(this, arguments); } finally { window.__rd.push(performance.now() - a); } }; } }); }
      else { await page.evaluate(s => { if (B) { endBattle('run'); } mode = 'world'; loadMap(s.map, s.x, s.y); }, sc); await page.waitForTimeout(2500); }
    } catch (e) { console.log('FEHLER Szene', vp.w, sc.id, e.message.slice(0, 200)); RES.push({ vp: `${vp.w}×${vp.h}`, cpu: vp.cpu, scene: sc.id, error: e.message.slice(0, 200) }); continue; }
    for (const cf of CFGS) {
      try {
        await page.evaluate(c => { Object.assign(SET, c.set, { fps: 0 }); applySet(); window.dispatchEvent(new Event('resize')); }, cf);
        await page.waitForTimeout(sc.battle ? 2500 : 2500);
        await page.evaluate(() => { window.__js.length = 0; window.__rd.length = 0; window.__ft = []; let last = 0; const f = t => { window.__ft.push(t); window.__raf = requestAnimationFrame(f); }; window.__raf = requestAnimationFrame(f); });
        await page.waitForTimeout(MS);
        const r = await page.evaluate(sc => { cancelAnimationFrame(window.__raf); const T = window.__ft, ft = T.slice(1).map((t, i) => t - T[i]), js = window.__js.slice(), rd = window.__rd.slice(), q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; }, m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
          const r3 = (sc.battle ? (typeof BT !== 'undefined' && BT) : R3), info = r3 && r3.r ? r3.r.info : null, cv = r3 && r3.r ? r3.r.domElement : null;
          return { frames: T.length, fps: ft.length ? +(1000 / m(ft)).toFixed(2) : 0, ftMean: +m(ft).toFixed(1), ftP95: +q(ft, .95).toFixed(1), ftMax: +Math.max(0, ...ft).toFixed(1), jsFrames: js.length, jsMean: +m(js).toFixed(2), jsP95: +q(js, .95).toFixed(2), renderMean: +m(rd).toFixed(2), renderP95: +q(rd, .95).toFixed(2),
            calls: info ? info.render.calls : null, tris: info ? info.render.triangles : null, geos: info ? info.memory.geometries : null, tex: info ? info.memory.textures : null, canvas: cv ? cv.width + '×' + cv.height : null, mpx: cv ? +(cv.width * cv.height / 1e6).toFixed(2) : null,
            heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null, view, res: SET.res, shadows: SET.shadows }; }, sc);
        const row = { vp: `${vp.w}×${vp.h}`, cpu: vp.cpu, scene: sc.id, cfg: cf.id, ...r }; RES.push(row); console.log(JSON.stringify(row));
      } catch (e) { console.log('FEHLER', vp.w, sc.id, cf.id, e.message.slice(0, 200)); RES.push({ vp: `${vp.w}×${vp.h}`, cpu: vp.cpu, scene: sc.id, cfg: cf.id, error: e.message.slice(0, 200) }); }
    }
    if (sc.battle) await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; });
  }
  RES.push({ vp: `${vp.w}×${vp.h}`, cpu: vp.cpu, scene: 'Fehler', errs: errs.slice(0, 5) }); await page.close();
}
writeFileSync(new URL('./qa_b_perf.json', import.meta.url), JSON.stringify(RES, null, 1));
await browser.close(); S.close();
