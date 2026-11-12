// Charaktere – im Spiel (Sperre nehmen!): node test/charaktere_welt.mjs
//   test/vorschau_charaktere_4.png + test/charaktere_welt.png  Morgenau: Held + Prof. Veyran + Rayan (1600 × 900)
//   test/charaktere_kampf.png  Kampf in der Welt, Held von hinten (Ausrüstungsstufe 2)
//   Messung: Draw-Calls Dorfszenen (Morgenau, Aurenstadt-Karten mit Bewohnern) – Figuren gesamt ≤ 60
import { start, page as mkPage, newGame, goMap, here } from './qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const env = await start(); const p = await mkPage(env, { w: 1600, h: 900, set: { quality: 'eigene' } }); await newGame(p, { view: 'third' });
const res = {};
// ---- Dorfszenen: Calls gesamt und der Figuren (Bewohner bleiben an)
const towns = await p.evaluate(() => Object.keys(MAPS).filter(k => (NPCS[k] || []).length >= 3 && MAPS[k].w > 12).slice(0, 6));
for (const t of towns) {
  await p.evaluate(m => { const M = MAPS[m]; let sx = Math.floor(M.w / 2), sy = Math.floor(M.h / 2); for (let r = 0; r < 8; r++) { let f = null; for (let y = sy - r; y <= sy + r && !f; y++)for (let x = sx - r; x <= sx + r && !f; x++)if (x > 0 && y > 0 && x < M.w && y < M.h && !blocked(x, y)) f = [x, y]; if (f) { sx = f[0]; sy = f[1]; break; } } G.time = 12 * 60; loadMap(m, sx, sy); mode = 'world'; }, t);
  await p.waitForTimeout(2500);
  res[t] = await p.evaluate(() => { const r = R3.r; r.info.autoReset = false; r.info.reset(); r.render(R3.scene, R3.activeCam || R3.cam); const calls = r.info.render.calls; r.info.autoReset = true; let fc = 0, fn = 0, ft = 0;
    R3.scene.traverse(o => { if (o.userData && o.userData.char && o.visible) { fn++; o.traverse(q => { if (q.isMesh && q.visible) { fc++; ft += (q.geometry.index ? q.geometry.index.count : q.geometry.attributes.position.count) / 3; } }); } });
    return { calls, figuren: fn, figurCalls: fc, figurTris: Math.round(ft), vill: typeof VILL !== 'undefined' ? VILL.list.length : 0 }; });
}
// ---- Welt-Szene Morgenau: Held + 2 NPCs
await p.evaluate(() => { G.badges = ['Floramedaille', 'Flutmedaille', 'Böenmedaille']; G.flags.badge1 = 1; });
const pos = await p.evaluate(() => { const M = MAPS.morgenau; const ok = (x, y) => x > 1 && y > 1 && x < M.w - 2 && y < M.h - 2 && !blocked(x, y); for (let y = 4; y < M.h - 3; y++)for (let x = 3; x < M.w - 3; x++)if (ok(x, y) && ok(x - 1, y + 2) && ok(x + 1, y + 2) && ok(x, y + 1) && ok(x, y - 1) && ok(x, y + 2) && ok(x, y + 3)) return [x, y]; return [8, 8]; });
await p.evaluate(([x, y]) => { NPCS.morgenau.push({ x: x - 1, y: y + 2, c: '#e8e8e8', t: 'talk', fig: 'veyran', d: 'up', txt: ['Hallo!'] }, { x: x + 1, y: y + 2, c: '#c8463a', t: 'talk', fig: 'rayan', d: 'up', txt: ['Na?'] }); VILL.list = []; G.time = 10 * 60; loadMap('morgenau', x, y); P.dir = 'down'; P.ang = Math.PI; mode = 'world'; if (typeof VILL !== 'undefined') VILL.list = []; R3.snap = 1; }, pos);
await p.waitForTimeout(4000);
await p.evaluate(() => { document.querySelectorAll('.toast,#toast').forEach(e => e.remove()); });
let b = await p.screenshot(); writeFileSync(here('vorschau_charaktere_4.png'), b); writeFileSync(here('charaktere_welt.png'), b);
res.weltScene = await p.evaluate(() => ({ calls: R3.r.info.render.calls, tris: R3.r.info.render.triangles }));
await p.evaluate(() => { NPCS.morgenau.splice(-2, 2); });
// ---- Kampf: Rückenansicht
await goMap(p, 'route1', 9, 14, 'up'); await p.waitForTimeout(2500);
await p.evaluate(() => { SET.skipBattleIntro = 1; SET.btl = 'runde'; mode = 'world'; startBattle({ wild: mk(1, 8) }); });
await p.waitForTimeout(6000);
b = await p.screenshot(); writeFileSync(here('charaktere_kampf.png'), b);
res.kampf = await p.evaluate(() => ({ mode, calls: R3.r.info.render.calls }));
console.log(JSON.stringify(res, null, 1)); console.log(p.errs.length ? p.errs.join('\n') : 'ok'); await env.close();
