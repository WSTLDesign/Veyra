// QA Mechanik – Prüfpunkt 11: Performance mit den neuen Modulen. Welt (Figuren-Rig, Roamer, NPCs) Stufe low/high 860×484, CPU 1× und 4×, Draw-Calls/Dreiecke/JS-ms gegen docs/perf-basis.md;
// Long Tasks beim Öffnen der Großen Karte, beim Fang (Fangkarte), beim Betreten eines Gebäudes, beim Kampfstart.
//   node test/qa_mech_perf.mjs [ms=4000]    JSON: $QA_OUT (Standard /tmp/qa_mech_perf.json)
import { boot, scene } from './look_lib.mjs';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
const PART = process.env.QA_PART || 'all', CPUS = (process.env.QA_CPU || '1,4').split(',').map(Number), OUT = process.env.QA_OUT || (tmpdir() + '/qa_mech_perf.json'), MS = +(process.argv[2] || 3000), R = { frames: [], longtasks: [], errs: [] };
const run = async cpu => {
  const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } }), { page } = B;
  await page.evaluate(() => { SET.btl = 'runde'; window.__js = []; window.__rd = []; window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { }
    const L = loop; loop = function (t) { const a = performance.now(), lf = lastFrame; try { return L.apply(this, arguments); } finally { if (lastFrame !== lf) window.__js.push(performance.now() - a); } }; });
  if (cpu > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  const wrapR = () => page.evaluate(() => { const w = r => { if (r && !r._pf) { r._pf = 1; const o = r.render; r.render = function (s, c) { const a = performance.now(); try { return o.apply(this, arguments); } finally { if (!c || (!c.isCubeCamera && c.type !== 'CubeCamera')) window.__rd.push(performance.now() - a); } }; } }; w(R3 && R3.r); });
  await wrapR();
  const measure = async (label, map, x, y, tier, roam) => {
    await page.evaluate(([t]) => { SET.gfx = t; perfStart(); PERF.tier = t; PERF.scale = 1; w3Quality(); }, [tier]);
    await scene(page, map, x, y, 720); await page.evaluate(r => { if (!r) { ROAM.list.length = 0; ROAM.want = 0; } else { ROAM.want = Math.max(ROAM.want, 6); } mode = 'world'; }, roam); await page.waitForTimeout(2500); await wrapR();
    await page.evaluate(() => { window.__js.length = 0; window.__rd.length = 0; window.__ft = []; const f = t => { window.__ft.push(t); window.__raf = requestAnimationFrame(f); }; window.__raf = requestAnimationFrame(f); }); await page.waitForTimeout(MS);
    const r = await page.evaluate(() => { cancelAnimationFrame(window.__raf); const T = window.__ft, ft = T.slice(1).map((t, i) => t - T[i]), js = window.__js.slice(), rd = window.__rd.slice(), q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; }, m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      const info = R3.r.info; let rig = 0, npcs = 0; try { R3.scene.traverse(o => { if (o.isSkinnedMesh) rig++; }); npcs = (R3.scene.userData.npcs || []).length; } catch (e) { }
      return { n: js.length, ftMean: +m(ft).toFixed(0), jsMean: +m(js).toFixed(2), jsP95: +q(js, .95).toFixed(2), jsMax: +Math.max(0, ...js).toFixed(1), renderMean: +m(rd).toFixed(2), calls: info.render.calls, tris: info.render.triangles, geos: info.memory.geometries, tex: info.memory.textures, skinned: rig, npcs, roam: ROAM.list.length }; });
    const row = { label, map, tier, cpu, roam: !!roam, ...r }; R.frames.push(row); console.log(JSON.stringify(row));
  };
  if (PART !== 'lt') for (const tier of (process.env.QA_TIER || 'low,high').split(',')) for (const [m, x, y, roam] of [['route1', 9, 12, false], ['route1', 9, 12, true], ['morgenau', 10, 10, false], ['brisenhafen', 9, 11, false], ['kupferhain', 9, 9, false]]) await measure(`${m}${roam ? '+Roamer' : ''}-${tier}`, m, x, y, tier, roam);
  if (cpu === 1 && PART !== 'frames') {
    await page.evaluate(() => { SET.gfx = 'high'; perfStart(); PERF.tier = 'high'; w3Quality(); });
    const lt = async (kind, fn, settleMs = 3000) => { await page.evaluate(() => { window.__lt.length = 0; window.__t0 = performance.now(); }); await fn(); await page.waitForTimeout(settleMs); const x = await page.evaluate(() => ({ lt: window.__lt.slice(), t0: window.__t0 })); const rel = x.lt.map(([s, d]) => [s - Math.round(x.t0), d]); R.longtasks.push({ kind, tasks: rel }); console.log('LT', kind, JSON.stringify(rel)); };
    // Grundlinie: Welt im Leerlauf
    await scene(page, 'route1', 9, 12, 720); await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; mode = 'world'; }); await page.waitForTimeout(3500);
    await lt('Grundlinie Leerlauf 6 s', async () => { }, 6000);
    await lt('Karte öffnen (Tipp Minikarte → Basisbild Hier)', async () => { await page.evaluate(() => { mmShow(true); }); await page.waitForTimeout(300); await page.evaluate(() => { window.__lt.length = 0; window.__t0 = performance.now(); openBigMap(); }); await page.waitForTimeout(100); }, 3500);
    await page.evaluate(() => bmSetLevel('region')); await page.waitForTimeout(2500); await lt('Karte: Ebene Region zeichnen', async () => { await page.evaluate(() => { BM.L = {}; bmSetLevel('region'); }); }, 3000);
    await lt('Karte: Ebene Veyra zeichnen', async () => { await page.evaluate(() => { bmSetLevel('world'); }); }, 3500); await page.evaluate(() => bmClose()); await page.waitForTimeout(600);
    await lt('Betreten (Haus: Labor in Morgenau)', async () => { await scene(page, 'morgenau', 10, 10, 720); await page.evaluate(() => { mode = 'world'; ROAM.list.length = 0; }); await page.waitForTimeout(2500); await page.evaluate(() => { window.__lt.length = 0; window.__t0 = performance.now(); G.ret = { map: 'morgenau', x: 7, y: 11 }; transit(() => { loadMap('labor'); P.dir = 'up'; }, 'labor'); }); }, 4500);
    await scene(page, 'route1', 9, 12, 720); await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; mode = 'world'; G.bag.kapsel = 30; }); await page.waitForTimeout(2500);
    await lt('Kampfstart (wild)', async () => { await page.evaluate(() => { SET.skipBattleIntro = 1; startBattle({ wild: mk(59, 4) }); }); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }); }, 2500);
    await lt('Fang (Tasche → Kapsel → Fangkarte offen → zu)', async () => { await page.evaluate(() => { B.foe[B.fi].hp = 1; [...document.querySelectorAll('#bMenu button')].find(x => /Tasche/i.test(x.textContent)).click(); }); await page.waitForTimeout(500); await page.evaluate(() => { [...document.querySelectorAll('#bMenu button')].find(x => /Kapsel/i.test(x.textContent)).click(); }); await page.waitForFunction(() => document.querySelector('#bCard .cc'), null, { timeout: 150000 }); await page.waitForTimeout(2500);
      for (let i = 0; i < 40 && await page.evaluate(() => !!B); i++) { await page.evaluate(() => { document.querySelector('#bCard') && document.querySelector('#bCard').click(); TW && TW.finish && TW.finish(); }); await page.waitForTimeout(250); } }, 2500);
  }
  R.errs = R.errs.concat(B.errs.slice(0, 5)); await B.close();
};
for (const c of CPUS) await run(c);
writeFileSync(OUT, JSON.stringify(R, null, 1)); console.log('fertig', OUT);
