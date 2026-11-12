// Gegenprüfung Runde 1 – Punkt 2: Ankünfte nach Kartenwechsel (echter Pfad tryMove → transit), Startbilder aller 12 Karten, Laufserie nahe Kamera.
//   node test/qa_gp1_look.mjs    Bilder: test/qa_gp1_<name>.png
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('qa_gp1_look.log', 'Gegenprüfung Runde 1 – Look');
const env = await start(); const p = await page(env); await newGame(p, { view: 'third' });
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1', 'starter', 'firstcatch', 'champion', 'badge_boe', 'badge_glut', 'badge_fels', 'badge_lumen']) G.flags[f] = 1; });
const edgeStart = (from, to) => ev(([f, t]) => { const S = MAPS[f]; const key = ['n', 's', 'e', 'w'].find(k => S[k] === t); if (!key) return null; const m = getMap(f), dir = { n: 'up', s: 'down', e: 'right', w: 'left' }[key]; let best = null;
  const mid = key === 'n' || key === 's' ? m.w / 2 : m.h / 2; for (let i = 0; i < (key === 'n' || key === 's' ? m.w : m.h); i++) { const x = key === 'e' ? m.w - 1 : key === 'w' ? 0 : i, y = key === 'n' ? 0 : key === 's' ? m.h - 1 : i; const c = tileAt(m, x, y); if (c && !SOLID.has(c) && c !== '~') { if (!best || Math.abs(i - mid) < Math.abs(best.i - mid)) best = { x, y, i }; } }
  return best && { key, dir, x: best.x, y: best.y }; }, [from, to]);
async function arrive(from, to) { const st = await edgeStart(from, to); if (!st) return null; await goMap(p, from, st.x, st.y, st.dir); await p.waitForTimeout(1500);
  await ev(([d]) => { tryMove(d); }, [st.dir]); await p.waitForFunction(([t]) => G.map === t && mode === 'world', [to], { timeout: 14000, polling: 100 }).catch(() => { });
  await ev(() => { VILL.list = []; ROAM.list = []; ROAM.want = 0; }); await p.waitForTimeout(2600); return st; }
const info = () => ev(() => ({ map: cur.id, pos: [P.x, P.y], cd: +R3.cd.toFixed(2) }));
// Ankünfte (primär + Rückweg); jeweils Bild
const SEQ = [['morgenau', 'route1'], ['route1', 'kupferhain'], ['kupferhain', 'route2'], ['route2', 'brisenhafen'], ['brisenhafen', 'windkueste'], ['windkueste', 'moewenbucht'], ['brisenhafen', 'route3'], ['route3', 'glutschlucht'], ['glutschlucht', 'route3'], ['route3', 'brisenhafen'], ['route1', 'morgenau'], ['kupferhain', 'route1'], ['schattmoor', 'fluestertal'], ['schattmoor', 'siegesstrasse']];
for (const [f, t] of SEQ) { const st = await arrive(f, t); if (!st) { R.t(`${f}→${t} Ausgang`, false); continue; } const i = await info(); await p.screenshot({ path: here(`qa_gp1_an_${f}_${t}.png`) }); R.note(`${f} → ${t}: ${JSON.stringify(i)} (Rand ${st.x},${st.y})`); }
// Nebelgrotte
await ev(async () => { G.ret = { map: 'route2', x: 10, y: 3 }; loadMap('nebelgrotte'); P.dir = 'up'; P.ang = 0; mode = 'world'; VILL.list = []; ROAM.list = []; }); await p.waitForTimeout(400); await ev(() => { R3.snap = 1; }); await p.waitForTimeout(2800); await p.screenshot({ path: here('qa_gp1_an_nebelgrotte.png') });
// Morgenau aus Haus
await ev(async () => { G.ret = { map: 'morgenau', x: 4, y: 5 }; loadMap('haus_spieler'); mode = 'world'; await new Promise(r => setTimeout(r, 600)); P.ang = Math.PI; P.dir = 'down'; transit(warpBack, 'morgenau'); });
await p.waitForFunction(() => G.map === 'morgenau' && mode === 'world', null, { timeout: 14000, polling: 100 }).catch(() => { }); await ev(() => { VILL.list = []; ROAM.list = []; }); await p.waitForTimeout(2800); await p.screenshot({ path: here('qa_gp1_an_morgenau_haus.png') });
// Laufserie nahe Kamera: Route 1 / Kupferhain / Flüstertal, Stick nach oben, 10 Bilder je 150 ms
for (const [m, x, y] of [['route1', 10, 20], ['kupferhain', 9, 17], ['fluestertal', 9, 17]]) { await goMap(p, m, x, y, 'up'); await p.waitForTimeout(2500); await ev(() => { ROAM.list = []; VILL.list = []; MV.rw = false; STICK.x = 0; STICK.y = -1; });
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(260); await p.screenshot({ path: here(`qa_gp1_lauf_${m}_${i}.png`) }); } await ev(() => { STICK.y = 0; }); R.note(`Laufserie ${m} → ${JSON.stringify(await info())}`); }
R.t('keine Seitenfehler', p.errs.length === 0, p.errs); await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
