// Charaktere – Nahansicht (Gesicht) + Ganzkörper groß für einzelne Figuren → test/charaktere_detail.png (Sperre nehmen!)
//   node test/charaktere_detail.mjs [ids=held,mama,veyran] [views=nah,vorn,schraeg,hinten]
import { boot } from './look_lib.mjs';
import { figStage, figSheet, FIG_CODE } from './charaktere_lib.mjs';
const ids = (process.argv[2] || 'held,mama,veyran').split(','), views = (process.argv[3] || 'nah,vorn,schraeg,hinten').split(',');
const { page, errs, close } = await boot({ w: 900, h: 500 });
await figStage(page);
const r = await figSheet(page, ids.map(id => ({ label: id, code: FIG_CODE(id) })), process.argv[4] || 'charaktere_detail.png', { views, title: 'Detail' });
console.log(JSON.stringify(r)); await close(); console.log(errs.length ? errs.join('\n') : 'ok');
