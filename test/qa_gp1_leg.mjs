// Gegenprüfung Runde 1 – Punkt 8: Legenden-Sprites auf Route 3 / Siegesstraße (Aussehen, Begegnung/Kampf startet)
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('qa_gp1_leg.log', 'Gegenprüfung – Legenden-Sprites'); const env = await start(); const p = await page(env); await newGame(p, { view: 'third' }); const ev = (f, a) => p.evaluate(f, a);
await ev(() => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1', 'starter', 'firstcatch', 'champion']) G.flags[f] = 1; SET.skipBattleIntro = 1; });
for (const [m, lx, ly] of [['route3', 16, 3], ['siegesstrasse', 15, 2]]) {
  await goMap(p, m, lx, ly + 4, 'up', 12); await p.waitForTimeout(3000);
  const info = await ev(([lx, ly]) => { const n = npcs().find(q => q.t === 'legend'); return n ? { x: n.x, y: n.y, mon: n.mon, lvl: n.lvl, name: MONS[n.mon].n, flag: n.flag, kids: (() => { const e = R3.scene.userData.npcs && R3.scene.userData.npcs.find(q => q.n === n); return e ? { type: e.o.children[0].type, kids: e.o.children.length, meshes: (() => { let c = 0; e.o.traverse(q => { if (q.isMesh) c++; }); return c; })() } : null; })() } : null; }, [lx, ly]);
  R.note(m + ' Legende: ' + JSON.stringify(info));
  await p.screenshot({ path: here(`qa_gp1_leg_${m}_fern.png`) });
  await ev(([x, y]) => { P.x = P.fx = P.px = x; P.y = P.fy = P.py = y + 3; R3.snap = 1; }, [info.x, info.y]); await p.waitForTimeout(1500);
  await p.screenshot({ path: here(`qa_gp1_leg_${m}_nah.png`) });
  await ev(([x, y]) => { P.x = P.fx = P.px = x; P.y = P.fy = P.py = y + 1; P.dir = 'up'; R3.snap = 1; }, [info.x, info.y]); await p.waitForTimeout(1200);
  await p.screenshot({ path: here(`qa_gp1_leg_${m}_davor.png`) });
  await ev(() => { interact(); }); await p.waitForTimeout(300);
  let m1 = await ev(() => mode); await ev(() => { for (let i = 0; i < 6 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } }); await p.waitForTimeout(2500);
  const st = await ev(() => ({ mode, wild: typeof B !== 'undefined' && B && B.wild ? MONS[B.wild.id !== undefined ? B.wild.id : B.wild.s].n : null, legend: typeof B !== 'undefined' && B && !!B.legend }));
  R.t(`${m}: Interaktion startet Dialog und danach Kampf mit Legende`, m1 === 'dialog' && st.mode === 'battle' && !!st.legend, { m1, st });
  await p.screenshot({ path: here(`qa_gp1_leg_${m}_kampf.png`) });
  await ev(() => { try { endBattle && endBattle('flee'); } catch (e) { } }); await p.waitForTimeout(500);
}
R.t('keine Seitenfehler', p.errs.length === 0, p.errs); await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
