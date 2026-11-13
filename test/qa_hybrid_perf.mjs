// QA Hybrid (Sonnet hoch) – Prüfpunkt 7: Frame-/JS-Zeit Welt und Kampf (860×484, Stufe low/high, CPU 1× und 4×), Hybrid an/aus im selben Build (A/B), Long Tasks bei Kartenwechsel/Kampfstart, GPU-Speicher-Freigabe.
// Aufruf: node build.mjs && node test/qa_hybrid_perf.mjs [ms=4000] → JSON nach $QA_OUT. Vorher-Werte (vor Hybrid): test/qa_look_perf.json (860×400, Look-QA) bzw. docs/perf-basis.md.
import { boot, scene } from './look_lib.mjs';
import { writeFileSync } from 'fs';
const sceneA = async (...a) => { await scene(...a); await a[0].evaluate(() => { try { skyAttach(R3.scene, cur); } catch (e) { } }); };
import { tmpdir } from 'os';
const OUT = process.env.QA_OUT || (tmpdir() + '/qa_hybrid_perf.json'), MS = +(process.argv[2] || 4000), R = { frames: [], longtasks: [], memory: [] };
const run = async (cpu) => {
  const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } }), { page } = B;
  await page.evaluate(() => { SET.btl = 'runde'; ROAM.list.length = 0; ROAM.want = 0; window.VEYRA_DEMO = 0; window.__js = []; window.__rd = []; window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { } const L = loop; loop = function (t) { const a = performance.now(), lf = lastFrame; try { return L.apply(this, arguments); } finally { if (lastFrame !== lf) window.__js.push(performance.now() - a); } }; });
  if (cpu > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  const wrapR = () => page.evaluate(() => { const w = r => { if (r && !r._pf) { r._pf = 1; const o = r.render; r.render = function (s, c) { const a = performance.now(); try { return o.apply(this, arguments); } finally { if (!c || (!c.isCubeCamera && c.type !== 'CubeCamera')) window.__rd.push(performance.now() - a); } }; } }; w(R3 && R3.r); w(typeof BT !== 'undefined' && BT && BT.r); });
  await wrapR(); const sky0 = await page.evaluate(() => { window.__ART0 = Object.assign({}, window.ART_SRC); return Object.keys(window.ART_SRC).length; });
  const measure = async (label, scn, tier, hybrid) => {
    await page.evaluate(([t, hy]) => { SET.gfx = t; perfStart(); PERF.tier = t; PERF.scale = 1; w3Quality(); HYB.off = !hy; // Welt: Skybox-Bilder entfernen = prozeduraler Himmel (Zustand vor H1)
      for (const k of Object.keys(window.__ART0)) if (/^(sky_|horizon_)/.test(k)) { if (hy) window.ART_SRC[k] = window.__ART0[k]; else delete window.ART_SRC[k]; } SKY3.cache.clear(); }, [tier, hybrid]);
    await page.waitForTimeout(scn === 'kampf' ? 500 : 3500);
    if (scn === 'kampf') { await page.evaluate(() => { if (B) endBattle('run'); mode = 'world'; }); await page.waitForTimeout(400); await page.evaluate(() => { startBattle({ wild: mk(59, 10) }); }); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 240000 }); await wrapR(); await page.waitForTimeout(3500); }
    await page.evaluate(() => { window.__js.length = 0; window.__rd.length = 0; window.__ft = []; const f = t => { window.__ft.push(t); window.__raf = requestAnimationFrame(f); }; window.__raf = requestAnimationFrame(f); });
    await page.waitForTimeout(MS);
    const r = await page.evaluate(sc => { cancelAnimationFrame(window.__raf); const T = window.__ft, ft = T.slice(1).map((t, i) => t - T[i]), js = window.__js.slice(), rd = window.__rd.slice(), q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; }, m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      const r3 = sc === 'kampf' ? BT : R3, info = r3.r.info, cv = r3.r.domElement; return { fps: ft.length ? +(1000 / m(ft)).toFixed(2) : 0, ftMean: +m(ft).toFixed(0), n: js.length, jsMean: +m(js).toFixed(2), jsP95: +q(js, .95).toFixed(2), jsMax: +Math.max(0, ...js).toFixed(1), renderMean: +m(rd).toFixed(2), calls: info.render.calls, tris: info.render.triangles, geos: info.memory.geometries, tex: info.memory.textures, canvas: cv.width + '×' + cv.height, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null, tier: PERF.tier, sky: typeof skyActive === 'function' && skyActive(), hyb: HYB.on }; }, scn);
    const row = { label, scene: scn, tier, hybrid: hybrid ? 'an' : 'aus', cpu, ...r }; R.frames.push(row); console.log(JSON.stringify(row)); if (scn === 'kampf') await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; });
  };
  for (const [scn, map, x, y] of [['route1', 'route1', 9, 12], ['brisenhafen', 'brisenhafen', 9, 11], ['kampf', 'route1', 9, 12]]) {
    if (scn !== 'kampf') { await sceneA(page, map, x, y, 720); }
    else await sceneA(page, map, x, y, 720);
    for (const tier of ['low', 'high']) for (const hy of [false, true]) await measure(`${scn}-${tier}-${hy ? 'hybrid' : 'ohne'}`, scn, tier, hy);
  }
  if (cpu === 1) {
    // ---------- Long Tasks bei Kartenwechsel und Kampfstart (Hybrid an, Stufe high / low) ----------
    for (const tier of ['high', 'low']) {
      await page.evaluate(([t]) => { SET.gfx = t; perfStart(); PERF.tier = t; w3Quality(); HYB.off = false; for (const k of Object.keys(window.__ART0)) window.ART_SRC[k] = window.__ART0[k]; SKY3.cache.clear(); HYB.texs.forEach(e => { if (e.tex) e.tex.dispose(); }); HYB.texs.clear(); HYI.clear(); }, [tier]);
      for (const [m, x, y, t] of [['morgenau', 10, 10, 720], ['brisenhafen', 9, 11, 1125], ['frostheim', 8, 8, 1380], ['route1', 9, 12, 720], ['glutschlucht', 8, 8, 720]]) {
        await page.evaluate(() => { window.__lt.length = 0; window.__t0 = performance.now(); }); await sceneA(page, m, x, y, t); await page.waitForTimeout(6000);
        const lt = await page.evaluate(() => ({ lt: window.__lt.slice(), t0: window.__t0 })), rel = lt.lt.map(([s, d]) => [s - Math.round(lt.t0), d]);
        R.longtasks.push({ kind: 'Kartenwechsel', tier, map: m, tasks: rel }); console.log('LT Kartenwechsel', tier, m, JSON.stringify(rel));
        await page.evaluate(() => { window.__lt.length = 0; window.__t0 = performance.now(); SET.skipBattleIntro = 1; startBattle({ wild: mk(25, 8) }); }); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }); await page.waitForTimeout(2500);
        const lb = await page.evaluate(() => ({ lt: window.__lt.slice(), t0: window.__t0 })), relb = lb.lt.map(([s, d]) => [s - Math.round(lb.t0), d]);
        R.longtasks.push({ kind: 'Kampfstart', tier, map: m, tasks: relb }); console.log('LT Kampfstart', tier, m, JSON.stringify(relb)); await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); await page.waitForTimeout(400);
      }
    }
    // ---------- GPU-Speicher: 24 Wechsel Region × Zeit, Texturen/Cache zählen ----------
    await page.evaluate(() => { SET.gfx = 'high'; perfStart(); PERF.tier = 'high'; w3Quality(); });
    const REG = ['lichtlande', 'smaragdwald', 'flutkueste', 'glutlande', 'kristallgebirge', 'frosttundra', 'himmelsweiten', 'schattenmoor'];
    for (const reg of REG) for (const t of [720, 1125, 1380]) {
      await page.evaluate(r => { getMap('route1').region = r; }, reg); await sceneA(page, 'route1', 9, 12, t); await page.evaluate(() => { mode = 'wait'; }); await page.waitForTimeout(4200);
      const m = await page.evaluate(() => ({ glTex: R3.r.info.memory.textures, cache: SKY3.cache.size, keys: [...SKY3.cache.values()].map(e => e.key + (e.tex ? '' : '?')), pin: [...SKY3.cache.values()].filter(e => e.pin).length, heap: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null, geo: R3.r.info.memory.geometries }));
      R.memory.push({ reg, t, ...m }); console.log('MEM', reg, t, JSON.stringify({ glTex: m.glTex, cache: m.cache, heap: m.heap, keys: m.keys.join(',') }));
    }
    // Kampf-Texturen: 8 Regionen kurz hintereinander
    for (const reg of REG) { await page.evaluate(r => { getMap('route1').region = r; mode = 'world'; }, reg); await sceneA(page, 'route1', 9, 12, 720); await page.waitForTimeout(500); await page.evaluate(() => { startBattle({ wild: mk(25, 8) }); }); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }); await page.waitForTimeout(1200);
      const k = await page.evaluate(() => ({ btl: HYB.texs.size, glTex: BT.r.info.memory.textures })); R.memory.push({ kampf: reg, ...k }); console.log('MEM Kampf', reg, JSON.stringify(k)); await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); }
  }
  R.errs = (R.errs || []).concat(B.errs.slice(0, 5)); await B.close();
};
await run(1); await run(4);
writeFileSync(OUT, JSON.stringify(R, null, 1)); console.log('fertig', OUT);
