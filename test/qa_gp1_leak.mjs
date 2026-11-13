// Gegenprüfung Runde 1 – Punkt 8: Textur-/Geometrie-Wachstum über 12 Runden Kartenwechsel (strenger als perf2: Minimum UND Maximum je Halbzeit)
import { start, page, newGame, reporter } from './qa_lc_lib.mjs';
const R = reporter('qa_gp1_leak.log', 'Gegenprüfung – Leck'); const env = await start(); const p = await page(env); await newGame(p, { view: 'third' }); const ev = (f, a) => p.evaluate(f, a);
const go = (id, x, y) => ev(([id, x, y]) => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1']) G.flags[f] = 1; G.time = 12 * 60; loadMap(id, x, y); P.dir = 'up'; mode = 'world'; VILL.list = []; ROAM.list = []; ROAM.want = 0; R3.snap = 1; }, [id, x, y]);
const seq = []; for (let i = 0; i < 12; i++) { for (const [id, x, y] of [['morgenau', 9, 7], ['route1', 10, 11], ['route3', 10, 8], ['brisenhafen', 10, 8]]) { await go(id, x, y); await p.waitForTimeout(1400); }
  await p.waitForTimeout(3300); const m = await ev(() => ({ geos: R3.r.info.memory.geometries, tex: R3.r.info.memory.textures, kids: R3.scene.children.length })); seq.push(m); console.log('Runde ' + (i + 1), JSON.stringify(m)); }
const tex = seq.map(s => s.tex), a = tex.slice(2, 7), b = tex.slice(7);
R.t('Texturen: Maximum Runden 8–12 ≤ Maximum Runden 3–7 + 2 (kein Trend)', Math.max(...b) <= Math.max(...a) + 2, tex);
R.t('Texturen: Minimum Runden 8–12 ≤ Minimum Runden 3–7 + 2', Math.min(...b) <= Math.min(...a) + 2, tex);
R.t('Geometrien konstant (±2)', Math.max(...seq.slice(2).map(s => s.geos)) - Math.min(...seq.slice(2).map(s => s.geos)) <= 2, seq.map(s => s.geos));
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
