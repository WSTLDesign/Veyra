// Gegenprüfung Runde 1 – Laufserie (Flackern/Löcher der gerasterten Ausblendung): echte Schritte per tryMove, Bilder alle ~130 ms
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('qa_gp1_walk.log', 'Gegenprüfung – Laufserie'); const env = await start(); const p = await page(env); await newGame(p, { view: 'third' }); const ev = (f, a) => p.evaluate(f, a);
await ev(() => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1', 'starter', 'firstcatch']) G.flags[f] = 1; });
for (const [m, x, y, d] of [['brisenhafen', 10, 12, 'up'], ['route1', 10, 20, 'up'], ['kupferhain', 10, 12, 'up']]) {
  await goMap(p, m, x, y, d); await p.waitForTimeout(2500); await ev(() => { ROAM.list = []; VILL.list = []; window.__w = setInterval(() => { if (mode === 'world') tryMove('up'); }, 150); });
  const prev = []; for (let i = 0; i < 12; i++) { await p.waitForTimeout(90); await p.screenshot({ path: here(`qa_gp1_w_${m}_${i}.png`) }); }
  await ev(() => clearInterval(window.__w)); R.note(m + ' ' + JSON.stringify(await ev(() => ({ pos: [P.x, P.y], cd: +R3.cd.toFixed(2) })))); }
R.t('keine Seitenfehler', p.errs.length === 0, p.errs); await env.close();
