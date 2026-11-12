// QA Mechanik – Prüfpunkt 3 (Spiel): Draw-Calls (3. Person + Ego), NPC-/Bewohner-Rig, Ego-Bob, Konsolenfehler.
//   node test/qa_mech_walk2.mjs
import { start, page, newGame, goMap, reporter, here } from './qa_mech_lib.mjs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_walk2.log', 'QA Mechanik Laufzyklus Spiel');
const env = await start(); const p = await page(env, { flags: {} });
await newGame(p, { view: 'third', team: [[1, 12], [4, 12]] }); await p.waitForTimeout(800);
// ---- Draw-Calls je Karte (3. Person, dann Ego), echter Render
const calls = {};
for (const m of ['morgenau', 'route1', 'kupferhain', 'brisenhafen', 'frostheim']) {
  await goMap(p, m, 8, 8); await p.waitForTimeout(1000);
  for (const v of ['third', 'ego']) { await p.evaluate(v => { setView(v, 1); }, v); await p.waitForTimeout(900);
    const c = await p.evaluate(() => { draw3d(); draw3d(); const i = R3.r.info; return { calls: i.render.calls, tris: i.render.triangles, npcs: (R3.scene.userData.npcs || []).length }; }); calls[m + '/' + v] = c; }
}
await p.evaluate(() => setView('third', 1));
R.note('Draw-Calls: ' + JSON.stringify(calls)); R.t('3 Draw-Calls ≤ 150 auf 5 Karten in 3. Person und Ego', Object.values(calls).every(c => c.calls > 0 && c.calls <= 150), calls);
// ---- NPC/Bewohner: Rig, Atmen, Gang
await goMap(p, 'morgenau', 8, 8); await p.waitForTimeout(1200);
const npc = await p.evaluate(async () => { const U = R3.scene.userData; const L = (U.npcs || []).filter(({ n, o }) => o.userData.rig && !['item', 'starter', 'legend'].includes(n.t)); const out = { n: L.length, withGait: 0, breathe: 0, types: [...new Set(L.map(x => x.n.t))] };
  const snap = () => L.map(({ o }) => o.userData.rig.b.map(b => b.rotation.x + b.position.y));
  const a = snap(); for (let i = 0; i < 90; i++) { draw3d(); } await new Promise(r => setTimeout(r, 1200)); for (let i = 0; i < 30; i++) draw3d(); const b = snap();
  L.forEach(({ o }, i) => { if (o.userData.gait) out.withGait++; if (b[i].some((v, j) => Math.abs(v - a[i][j]) > 1e-4)) out.breathe++; });
  out.vill = (typeof VILL !== 'undefined' && VILL.list) ? VILL.list.length : -1; return out; });
R.note('NPCs morgenau: ' + JSON.stringify(npc)); R.t('3 NPCs nutzen das Rig (Skelett) mit Gang-Zustand, mindestens 1 Figur auf der Karte', npc.n > 0 && npc.withGait === npc.n, npc);
R.t('3 Stehende NPCs „atmen“ (Knochen ändern sich über 1 s)', npc.n > 0 && npc.breathe >= Math.ceil(npc.n / 2), npc);
// Bewohner laufend (VILL) erzeugen, falls leer
const vil = await p.evaluate(async () => { const out = {}; try { out.before = VILL.list.length; } catch (e) { out.err = String(e); return out; }
  const S = R3.scene; for (let i = 0; i < 200; i++) draw3d(); const pm = S.userData.pm; out.pm = pm ? pm.size : 0; let anyG = 0; if (pm) for (const o of pm.values()) if (o.userData.gait) anyG++; out.gait = anyG; return out; });
R.note('Bewohner: ' + JSON.stringify(vil));
// ---- Ego-Bob an Schrittphase: Kamera-y variiert beim Gehen, still beim Stehen (render ausgesetzt, Zeit deterministisch)
const ego = await p.evaluate(() => { setView('ego', 1); const r0 = R3.r.render, res = {}; R3.r.render = () => {}; const pnow = performance.now.bind(performance); let pn = 0; performance.now = () => pnow() + pn;
  try { for (const [lab, run, sy] of [['stehen', false, 0], ['gehen', false, -.55], ['rennen', true, -1]]) { mode = 'world'; loadMap('route1', 9, 22); ROAM.list = []; ROAM.want = 0; ENC.calm = 1e15; P.ang = 0; P.v = 0; P.run = run; STICK.x = 0; STICK.y = sy;
      const ys = [], ph = []; for (let k = 0; k < 160; k++) { pn += 1000 / 60; freeMove(1000 / 60); if (mode !== 'world') break; draw3d(); if (k > 60) { ys.push(R3.cam.position.y - (R3.gy || 0)); const g = R3.player.userData.gait; ph.push(g ? g.ph : 0); } }
      res[lab] = { rng: +(Math.max(...ys) - Math.min(...ys)).toFixed(4), n: ys.length, view, fov: +R3.cam.fov.toFixed(1), vis: R3.player.visible };
      // Korrelation Kamera-y mit cos(4π(ph−β/2)) – Bob an Schrittphase gekoppelt
      const g = R3.player.userData.gait, beta = g && g.beta || .5; let sx = 0, sy2 = 0, sxy = 0, sxx = 0, syy = 0; const n = ys.length; const xs = ph.map(q => Math.cos((q - beta / 2) * Math.PI * 4)); for (let i = 0; i < n; i++) { sx += xs[i]; sy2 += ys[i]; sxy += xs[i] * ys[i]; sxx += xs[i] * xs[i]; syy += ys[i] * ys[i]; }
      res[lab].corr = +((n * sxy - sx * sy2) / Math.sqrt(Math.max(1e-12, (n * sxx - sx * sx) * (n * syy - sy2 * sy2)))).toFixed(2);
      STICK.y = 0; P.run = false; } } finally { R3.r.render = r0; performance.now = pnow; } ENC.calm = 0; setView('third', 1); return res; });
R.note('Ego: ' + JSON.stringify(ego)); R.t('3 Ego: Kamera ruhig im Stand (< 0,004), Bob beim Gehen/Rennen (> 0,008)', ego.stehen.rng < .004 && ego.gehen.rng > .008 && ego.rennen.rng > .008, ego);
R.t('3 Ego: Figur ausgeblendet, Bob mit Schrittphase korreliert (|r| ≥ 0,5 beim Gehen)', !ego.gehen.vis && Math.abs(ego.gehen.corr) >= .5, ego);
await p.evaluate(() => { setView('ego', 1); }); await p.waitForTimeout(600); await p.screenshot({ path: here('qa_mech_walk_ego.png') }); await p.evaluate(() => setView('third', 1));
R.t('3 Keine Konsolenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
