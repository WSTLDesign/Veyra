// QA Loop C – Punkt 8: Leistung je Welt-I-Karte (Draw-Calls, Dreiecke, JS-Zeit je Frame) bei CPU 1× und 4×, kurze Messfenster, Vergleich mit docs/qa-mechanik.md P11.
//   QA_CPU=1|4  QA_MS=3500  QA_MAPS=route3,morgenau  node test/qa_lc_perf.mjs       JSON: test/qa_lc_perf_<cpu>.json
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const CPU = +(process.env.QA_CPU || 1), MS = +(process.env.QA_MS || 3500);
const MAPS_ = (process.env.QA_MAPS || 'morgenau,route1,kupferhain,route2,brisenhafen,windkueste,moewenbucht,route3,glutschlucht,fluestertal,siegesstrasse,nebelgrotte').split(',');
const R = reporter(`qa_lc_perf_${CPU}x.log`, `QA Loop C – Leistung CPU ${CPU}×`); const out = [];
const env = await start(); const p = await page(env, { w: 860, h: 484, cpu: CPU }); await newGame(p, { view: 'third' });
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { window.__js = []; window.__rd = []; const L = loop; loop = function (t) { const a = performance.now(), lf = lastFrame; try { return L.apply(this, arguments); } finally { if (lastFrame !== lf) window.__js.push(performance.now() - a); } };
  const w = r => { if (r && !r._pf) { r._pf = 1; const o = r.render; r.render = function (s, c) { const a = performance.now(); try { return o.apply(this, arguments); } finally { if (!c || (!c.isCubeCamera && c.type !== 'CubeCamera')) window.__rd.push(performance.now() - a); } }; } }; w(R3.r); window.__w = w; });
for (const id of MAPS_) {
  await ev(([id]) => { if (typeof B !== 'undefined' && B) { try { endBattle('run'); } catch (e) { } } for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1']) G.flags[f] = 1; G.time = 12 * 60; const m = getMap(id); let [x, y] = findWalk(Math.floor(m.w / 2), Math.floor(m.h / 2)); loadMap(id, x, y); P.dir = 'up'; P.ang = 0; mode = 'world'; VILL.list = []; ROAM.list = []; ROAM.want = 0; R3.snap = 1; }, [id]);
  await p.waitForTimeout(CPU > 1 ? 4500 : 3000); await ev(() => { window.__w(R3.r); window.__js.length = 0; window.__rd.length = 0; window.__ft = []; const f = t => { window.__ft.push(t); window.__raf = requestAnimationFrame(f); }; window.__raf = requestAnimationFrame(f); }); await p.waitForTimeout(MS);
  const r = await ev(() => { cancelAnimationFrame(window.__raf); const T = window.__ft, ft = T.slice(1).map((t, i) => t - T[i]), js = window.__js.slice(), rd = window.__rd.slice(), m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, q = (a, pp) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * pp))] : 0; };
    const info = R3.r.info; let rig = 0; R3.scene.traverse(o => { if (o.isSkinnedMesh) rig++; });
    return { id: G.map, pos: [P.x, P.y], n: js.length, ftMean: Math.round(m(ft)), jsMean: +m(js).toFixed(1), jsP95: +q(js, .95).toFixed(1), renderMean: +m(rd).toFixed(1), jsOnly: +(m(js) - m(rd)).toFixed(1), calls: info.render.calls, tris: info.render.triangles, geos: info.memory.geometries, tex: info.memory.textures, skinned: rig }; });
  out.push(r); R.note(JSON.stringify(r)); }
// Route 3 in 4 Blickrichtungen (Calls/Dreiecke, ohne Zeitmessung)
if (CPU === 1 && MAPS_.includes('route3')) { await ev(() => { loadMap('route3', 9, 12); mode = 'world'; VILL.list = []; ROAM.list = []; }); await p.waitForTimeout(2500); const yaws = [];
  for (const [d, a] of [['up', 0], ['left', Math.PI / 2], ['down', Math.PI], ['right', -Math.PI / 2]]) { await ev(([d, a]) => { P.dir = d; P.ang = a; R3.snap = 1; }, [d, a]); await p.waitForTimeout(2200); yaws.push(Object.assign({ d }, await ev(() => ({ calls: R3.r.info.render.calls, tris: R3.r.info.render.triangles })))); }
  R.note('Route 3 vier Blickrichtungen: ' + JSON.stringify(yaws)); out.push({ route3_yaws: yaws }); }
R.t('keine Seitenfehler', p.errs.length === 0, p.errs);
writeFileSync(here(`qa_lc_perf_${CPU}.json`), JSON.stringify(out, null, 1)); await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
