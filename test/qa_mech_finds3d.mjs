// QA Mechanik – Prüfpunkt 6: 3D-Fund-Arten als Nahaufnahme (Kapsel, Rolle, Verstecktes, Glitzer) bei Tag und Abend, 860×484.
import { start, page, newGame, goMap, here } from './qa_mech_lib.mjs';
const env = await start(); const p = await page(env, { flags: {} });
await newGame(p, { team: [[1, 12]], view: 'third' });
for (const [lab, time] of [['tag', 12 * 60], ['abend', 19 * 60]]) {
  const info = await p.evaluate(async ([time]) => { G.time = time; loadMap('route1', 9, 20); mode = 'world'; ROAM.list = []; ROAM.want = 0; const m = cur; const L = NPCS.route1; for (let i = L.length - 1; i >= 0; i--) if (L[i].qa) L.splice(i, 1);
    const kinds = [{ f: 'item', item: 'kapsel' }, { f: 'scroll', item: 'rolle_rankenschnitt' }, { f: 'hidden', mon: 28, lvl: 5 }, { f: 'sparkle', item: 'kapsel' }]; const xs = [6, 8, 10, 12]; const y = 19;
    xs.forEach((x, i) => L.push(Object.assign({ x, y, t: 'item', n: 1, flag: 'qa3d' + i, qa: 1 }, kinds[i]))); L.filter(n => n.qa).forEach(n => delete G.flags[n.flag]);
    R3.mapId = null; delete scenes.route1; loadMap('route1', 9, 22); mode = 'world'; P.dir = 'up'; P.ang = 0; R3.snap = 1; await new Promise(r => setTimeout(r, 3000)); return { row: m.rows[y].slice(4, 15), n: (R3.scene.userData.npcs || []).filter(e => e.n.qa).length }; }, [time]);
  console.log(lab, JSON.stringify(info)); await p.waitForTimeout(800);
  await p.screenshot({ path: here(`qa_mech_finds_3d_${lab}.png`) });
}
await p.evaluate(() => { const L = NPCS.route1; for (let i = L.length - 1; i >= 0; i--) if (L[i].qa) L.splice(i, 1); });
console.log(p.errs.length ? p.errs.join('\n') : 'keine Fehler'); await env.close();
