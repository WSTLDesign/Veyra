// Nachbesserung 1 – Vergleichsbilder (ein Chromium): Route-1-Ankunft (von Morgenau), Glutschlucht-Startbild (von Route 3), Optionen im Querformat.
//   node test/nb1_shots.mjs [Präfix]        → test/<Präfix>_route1_ankunft.png, _glutschlucht_start.png, _optionen_quer.png (Standard-Präfix nb1)
//   NB1_OUT=/abs/pfad  schreibt dorthin (z. B. Vorher-Bilder aus einem alten Build)
import { start, page, newGame, goMap, here } from './qa_lc_lib.mjs';
import { join } from 'path';
const pre = process.argv[2] || 'nb1', out = n => process.env.NB1_OUT ? join(process.env.NB1_OUT, pre + '_' + n + '.png') : here(pre + '_' + n + '.png');
const env = await start();
{ const p = await page(env); await newGame(p, { view: 'third' }); const ev = (f, a) => p.evaluate(f, a);
  await ev(() => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1', 'starter']) G.flags[f] = 1; });
  for (const [from, x, y, dir, to, name] of [['morgenau', 9, 0, 'up', 'route1', 'route1_ankunft'], ['route3', 19, 7, 'right', 'glutschlucht', 'glutschlucht_start']]) {
    await goMap(p, from, x, y, dir); await p.waitForTimeout(1500); await ev(([d]) => tryMove(d), [dir]);
    await p.waitForFunction(([t]) => G.map === t && mode === 'world', [to], { timeout: 14000, polling: 100 }).catch(() => { });
    await ev(() => { VILL.list = []; ROAM.list = []; ROAM.want = 0; }); await p.waitForTimeout(2800); await p.screenshot({ path: out(name) }); }
  await p.ctx.close(); }
{ const p = await page(env, { w: 852, h: 393, mobile: true }); await newGame(p, { view: 'third' });
  await p.evaluate(() => { $('#opts').hidden = false; rSettings($('#optBody')); }); await p.waitForTimeout(700); await p.screenshot({ path: out('optionen_quer') }); await p.ctx.close(); }
await env.close(); console.log('fertig', pre);
