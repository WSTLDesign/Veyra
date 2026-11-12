// Look L1 – Performance-Messung nach Methode docs/perf-basis.md (gleiche Szenen/Viewports, Messfenster 4 s, SET.fps 0):
// node test/look_welt_perf.mjs [ms] → test/look_welt_perf.json. Konfigurationen: auto (Auslieferung: res/gfx auto), hoch (gfx high, Gerätepixel), niedrig (gfx low, Gerätepixel).
import { boot } from './look_lib.mjs';
import { writeFileSync } from 'fs';
const MS = +(process.argv[2] || 4000), RES = [];
const VPS = [{ w: 860, h: 400, cpu: 1 }, { w: 860, h: 400, cpu: 4 }, { w: 1920, h: 1080, cpu: 1 }];
const SCENES = [{ id: 'route1', map: 'route1', x: 9, y: 8 }, { id: 'morgenau', map: 'morgenau', x: 10, y: 10 }, { id: 'kupferhain', map: 'kupferhain', x: 16, y: 12 }, { id: 'kampf3d', battle: true }];
const CFGS = [{ id: 'auto', set: { res: 'auto', gfx: 'auto', shadows: 1, light: 1, particles: 1, dist: 'mittel' } }, { id: 'hoch', set: { res: 'native', gfx: 'high', shadows: 1, light: 1, particles: 1, dist: 'mittel' } }, { id: 'niedrig', set: { res: 'native', gfx: 'low', shadows: 1, light: 1, particles: 1, dist: 'mittel' } }];
for (const vp of VPS) {
  const B = await boot({ w: vp.w, h: vp.h, cpu: 1 }), { page } = B;
  await page.evaluate(() => { SET.btl = 'runde'; ROAM.list.length = 0; ROAM.want = 0; window.__js = []; window.__rd = []; const L = loop; loop = function (t) { const a = performance.now(), lf = lastFrame; try { return L.apply(this, arguments); } finally { if (lastFrame !== lf) window.__js.push(performance.now() - a); } }; });
  if (vp.cpu > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: vp.cpu }); }
  await page.evaluate(() => { setView('third', 1); }); await page.waitForTimeout(2500);
  const wrapR = () => page.evaluate(() => { const w = r => { if (r && !r._pf) { r._pf = 1; const o = r.render; r.render = function (s, c) { const a = performance.now(); try { return o.apply(this, arguments); } finally { if (!c || !c.isCubeCamera && c.type !== 'CubeCamera') window.__rd.push(performance.now() - a); } }; } }; w(R3 && R3.r); w(typeof BT !== 'undefined' && BT && BT.r); });
  await wrapR();
  for (const sc of SCENES) {
    try {
      if (sc.battle) { await page.evaluate(() => startBattle({ wild: mk(59, 10) })); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big,#bMenu button'), null, { timeout: 240000 }); await wrapR(); }
      else { await page.evaluate(s => { if (B) { endBattle('run'); } mode = 'world'; loadMap(s.map, s.x, s.y); }, sc); await page.waitForTimeout(2500); }
    } catch (e) { console.log('FEHLER Szene', vp.w, sc.id, e.message.slice(0, 200)); RES.push({ vp: `${vp.w}×${vp.h}`, cpu: vp.cpu, scene: sc.id, error: e.message.slice(0, 200) }); continue; }
    for (const cf of CFGS) {
      try {
        await page.evaluate(c => { Object.assign(SET, c.set, { fps: 0 }); perfStart(); if (SET.gfx !== 'auto') PERF.tier = SET.gfx; PERF.scale = 1; applySet(); if (typeof w3Quality === 'function') w3Quality(); window.dispatchEvent(new Event('resize')); }, cf);
        await page.waitForTimeout(3000);
        await page.evaluate(() => { window.__js.length = 0; window.__rd.length = 0; window.__ft = []; const f = t => { window.__ft.push(t); window.__raf = requestAnimationFrame(f); }; window.__raf = requestAnimationFrame(f); });
        await page.waitForTimeout(MS);
        const r = await page.evaluate(sc => { cancelAnimationFrame(window.__raf); const T = window.__ft, ft = T.slice(1).map((t, i) => t - T[i]), js = window.__js.slice(), rd = window.__rd.slice(), q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; }, m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
          const r3 = (sc.battle ? (typeof BT !== 'undefined' && BT && BT.r && mode === 'battle' && document.getElementById('bcv3') && document.getElementById('bcv3').style.visibility !== 'hidden' ? BT : R3) : R3), info = r3 && r3.r ? r3.r.info : null, cv = r3 && r3.r ? r3.r.domElement : null;
          return { fps: ft.length ? +(1000 / m(ft)).toFixed(2) : 0, ftMean: +m(ft).toFixed(1), jsFrames: js.length, jsMean: +m(js).toFixed(2), jsP95: +q(js, .95).toFixed(2), renderMean: +m(rd).toFixed(2),
            calls: info ? info.render.calls : null, tris: info ? info.render.triangles : null, geos: info ? info.memory.geometries : null, tex: info ? info.memory.textures : null, canvas: cv ? cv.width + '×' + cv.height : null, mpx: cv ? +(cv.width * cv.height / 1e6).toFixed(2) : null,
            heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null, tier: PERF.tier, scale: PERF.scale, rdr: r3 === R3 ? 'R3' : 'BT' }; }, sc);
        const row = { vp: `${vp.w}×${vp.h}`, cpu: vp.cpu, scene: sc.id, cfg: cf.id, ...r }; RES.push(row); console.log(JSON.stringify(row));
      } catch (e) { console.log('FEHLER', vp.w, sc.id, cf.id, e.message.slice(0, 200)); }
    }
    if (sc.battle) await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; });
  }
  RES.push({ vp: `${vp.w}×${vp.h}`, cpu: vp.cpu, scene: 'Fehler', errs: B.errs.slice(0, 5) }); await B.close();
}
writeFileSync(new URL('./look_welt_perf.json', import.meta.url), JSON.stringify(RES, null, 1));
