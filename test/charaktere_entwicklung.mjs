// Charakterentwicklung – fünf Ausrüstungsstufen des Helden nebeneinander (3D vorn/hinten) → test/charaktere_entwicklung.png, 2D → test/charaktere_entwicklung_2d.png (Sperre!)
//   node test/charaktere_entwicklung.mjs [held|heldin]
import { boot } from './look_lib.mjs';
import { figStage, figSheet } from './charaktere_lib.mjs';
import { writeFileSync } from 'fs';
import { here } from './qa_lc_lib.mjs';
const body = process.argv[2] || 'held';
// Fortschritt je Stufe (wie im Spiel gespeichert: G.badges = Namen, Flags)
export const STAGE_SET = [
  `G.badges=[];G.flags={starter:1};`,
  `G.badges=['Floramedaille'];G.flags={starter:1,badge1:1};`,
  `G.badges=['Floramedaille','Flutmedaille','Böenmedaille'];G.flags={starter:1,badge1:1,badge2:1,badge_boe:1};`,
  `G.badges=MEDALS.map(m=>m[0]);G.flags=Object.assign({starter:1,top1:1,top2:1,top3:1},Object.fromEntries(MEDALS.map(m=>[m[1],1])));`,
  `G.badges=MEDALS.map(m=>m[0]);G.flags=Object.assign({starter:1,top1:1,top2:1,top3:1,top4:1,champion:1},Object.fromEntries(MEDALS.map(m=>[m[1],1])));`];
const { page, errs, close } = await boot({ w: 900, h: 500 });
await figStage(page);
const list = STAGE_SET.map((set, i) => ({ label: `Stufe ${i}: ` + ['Start', 'Jacke', 'Expedition', 'Umhang', 'Krone'][i], code: `(()=>{${set}const o=Object.assign(defaultOutfit(),G.outfit||{},{body:'${body}'});const f=person3d(o.top,o.capCol,o);f.userData.stage=charStage();return f;})()` }));
const r = await figSheet(page, list, `charaktere_entwicklung${body === 'heldin' ? '_heldin' : ''}.png`, { views: ['vorn', 'schraeg', 'hinten'], title: 'Charakterentwicklung – das Aussehen wächst mit (vorn · schräg · hinten)' });
console.log(JSON.stringify(r));
// 2D: drawFigure (Porträt-/Chronik-Figur) je Stufe
const d2 = await page.evaluate(async ([sets, body]) => { const cv = document.createElement('canvas'); cv.width = 5 * 200; cv.height = 300; const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
  sets.forEach((set, i) => { (0, eval)(set); const L = heroLook(Object.assign(defaultOutfit(), G.outfit || {}, { body })); drawFigure(c, 100 + i * 200, 280, 250, L, 1000, { expr: 'freudig', still: true }); c.fillStyle = '#26304a'; c.font = '700 14px sans-serif'; c.fillText('Stufe ' + i + ' · ' + CHAR_STAGES[i].n, 8 + i * 200, 18); });
  return cv.toDataURL('image/png'); }, [STAGE_SET, body]);
writeFileSync(here(`charaktere_entwicklung_2d${body === 'heldin' ? '_heldin' : ''}.png`), Buffer.from(d2.split(',')[1], 'base64'));
await close(); console.log(errs.length ? errs.join('\n') : 'ok');
