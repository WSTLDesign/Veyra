// Charaktere – Vorschaubilder (Sperre nehmen!). node test/charaktere_vorschau.mjs [teile=held,stufen,npc,alle,run]
//   held   → test/vorschau_charaktere_1.png  Held: vorn · schräg · hinten · Gesicht nah (1600 px)
//   stufen → test/vorschau_charaktere_2.png + test/charaktere_entwicklung.png  5 Ausrüstungsstufen vorn + hinten (1600 px), 2D-Reihe test/charaktere_entwicklung_2d.png
//   npc    → test/vorschau_charaktere_3.png  Mama, Prof. Veyran, Rayan, Oma Elowen je vorn · schräg · seitlich (1600 px)
//   alle   → test/charaktere_nachher.png     Held + 6 NPCs (Mama, Veyran, Rayan, Elowen, Kael, Borwin) in 3 Ansichten
//   run    → test/charaktere_run.png         Rennen (5 Felder/s), 8 Bilder seitlich über einen Doppelschritt
import { start, page as mkPage, newGame, here } from './qa_lc_lib.mjs';
import { figStage, figShots, grid, FIG_CODE, STAGE_SET } from './charaktere_lib.mjs';
import { writeFileSync } from 'fs';
const parts = (process.argv[2] || 'held,stufen,npc,alle,run').split(',');
const env = await start(); const p = await mkPage(env, { w: 900, h: 640, set: { quality: 'eigene' } }); await newGame(p, { view: 'third' });
await figStage(p, { W: 400, H: 560, pr: 2 });
const log = [];
if (parts.includes('held')) {
  const r = await figShots(p, FIG_CODE('held'), ['vorn', 'schraeg', 'hinten', 'nah']);
  await grid(p, r.imgs.map((img, i) => ({ img, label: ['Held (Noa) – vorn', 'schräg', 'hinten', 'Gesicht nah'][i], sub: i ? '' : `Höhe ${r.h} Felder · ${r.heads} Kopfhöhen · ${r.cost.calls} Calls · ${(r.cost.tris / 1000).toFixed(1)} k Dreiecke` })), { cols: 4, cw: 400, ch: 560, title: 'Vorschau Charaktere 1 – Held: Proportionen, Gesicht, Kleidung', file: 'vorschau_charaktere_1.png' });
  log.push(['held', r.h, r.heads, r.cost]);
}
if (parts.includes('stufen')) {
  const cells = [[], []];
  for (let i = 0; i < 5; i++) { const code = `(()=>{${STAGE_SET[i]}const o=Object.assign(defaultOutfit(),G.outfit||{},{body:'held'});return person3d(o.top,o.capCol,o);})()`; const r = await figShots(p, code, ['vorn', 'hinten']);
    const n = await p.evaluate(() => CHAR_STAGES[charStage()].n); cells[0].push({ img: r.imgs[0], label: `Stufe ${i}: ${n}`, sub: `${r.cost.calls} Calls · ${(r.cost.tris / 1000).toFixed(1)} k Dreiecke` }); cells[1].push({ img: r.imgs[1], label: 'hinten' }); log.push(['stufe' + i, r.cost]); }
  const o = { cols: 5, cw: 320, ch: 448, title: 'Charakterentwicklung – das Aussehen wächst mit (Medaillen, Turmrat, Kristallkrone)' };
  await grid(p, cells[0].concat(cells[1]), { ...o, file: 'vorschau_charaktere_2.png' }); await grid(p, cells[0].concat(cells[1]), { ...o, file: 'charaktere_entwicklung.png' });
  const d2 = await p.evaluate(async (sets) => { const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 420; const c = cv.getContext('2d'); c.fillStyle = '#f4f5f7'; c.fillRect(0, 0, cv.width, cv.height);
    sets.forEach((set, i) => { (0, eval)(set); const L = heroLook(Object.assign(defaultOutfit(), G.outfit || {}, { body: 'held' })); drawFigure(c, 160 + i * 320, 400, 360, L, 1000, { expr: 'freudig', still: true }); c.fillStyle = '#26304a'; c.font = '700 16px sans-serif'; c.fillText('Stufe ' + i + ' · ' + CHAR_STAGES[i].n, 10 + i * 320, 22); });
    G.badges = []; G.flags = { starter: 1 }; return cv.toDataURL('image/png'); }, STAGE_SET);
  writeFileSync(here('charaktere_entwicklung_2d.png'), Buffer.from(d2.split(',')[1], 'base64'));
}
if (parts.includes('detail')) {
  const cells = []; for (const [id, v] of [['held', 'brust'], ['mama', 'brust'], ['rayan', 'nah'], ['veyran', 'nah']]) { const r = await figShots(p, FIG_CODE(id), [v]); cells.push({ img: r.imgs[0], label: id + ' – ' + v }); }
  await grid(p, cells, { cols: 4, cw: 400, ch: 560, title: 'Detail – Oberkörper und Gesicht', file: 'charaktere_detail.png' });
}
const NPC = [['mama', 'Mama'], ['veyran', 'Prof. Veyran'], ['rayan', 'Rivale Rayan'], ['elowen', 'Oma Elowen'], ['kael', 'Arenaleiter Kael'], ['borwin', 'Händler Borwin']];
async function sheet(ids, file, title, cw, ch) {
  const cells = []; for (const [id, label] of ids) { const r = await figShots(p, FIG_CODE(id), ['vorn', 'schraeg', 'seite']); log.push([id, r.h, r.heads, r.cost]);
    r.imgs.forEach((img, i) => cells.push({ img, label: i ? '' : label, sub: i ? '' : `${r.h} Felder · ${r.heads} Kopfh. · ${r.cost.calls} Calls · ${(r.cost.tris / 1000).toFixed(1)} k Dr.` })); }
  await grid(p, cells, { cols: 6, cw, ch, title, file });
}
if (parts.includes('npc')) await sheet(NPC.slice(0, 4), 'vorschau_charaktere_3.png', 'Vorschau Charaktere 3 – NPCs (vorn · schräg · seitlich)', 266, 380);
if (parts.includes('alle')) await sheet([['held', 'Held (Noa)'], ...NPC, ['heldin', 'Heldin']], 'charaktere_nachher.png', 'Nachher – Held + 6 NPCs + Heldin (vorn · schräg · seitlich)', 266, 380);
if (parts.includes('run')) {
  const imgs = await p.evaluate(() => { const f = CS.put((() => { const o = Object.assign(defaultOutfit(), { body: 'held' }); G.badges = ['Floramedaille', 'Flutmedaille', 'Böenmedaille']; return person3d(o.top, o.capCol, o); })()); f.userData.gait = null; const dt = 1 / 60, v = 5; let z = 0, out = [];
    for (let k = 0; k < 150; k++) { z -= v * dt; f.position.set(0, 0, z); gaitTick(f, dt, {}); }
    const G_ = f.userData.gait, S = G_.S || 2, n = Math.round(S / v / dt);// ein Doppelschritt
    for (let k = 0; k < 8; k++) { for (let j = 0; j < Math.max(1, Math.round(n / 8)); j++) { z -= v * dt; f.position.set(0, 0, z); gaitTick(f, dt, {}); } f.updateMatrixWorld(true);
      const cam = CS.cam, h = 1.32; cam.position.set(-4.4, h * .5 + .15, z); cam.lookAt(0, h * .5, z); CS.sun.position.set(-2.5, 6, z - 4); CS.sun.target.position.set(0, 0, z); CS.sun.target.updateMatrixWorld(); CS.rr.render(CS.S, cam); out.push(CS.rr.domElement.toDataURL('image/png')); }
    G.badges = []; return out; });
  await grid(p, imgs.map((img, i) => ({ img, label: `Bild ${i + 1}` })), { cols: 8, cw: 200, ch: 280, title: 'Rennen 5 Felder/s – seitlich, 8 Bilder über einen Doppelschritt', file: 'charaktere_run.png' });
}
console.log(JSON.stringify(log)); console.log(p.errs.length ? p.errs.join('\n') : 'ok'); await env.close();
