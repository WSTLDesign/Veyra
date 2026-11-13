// Charaktere – Bestandsaufnahme bzw. Bogen: Held + 6 typische Figuren in 3 Ansichten → test/charaktere_<name>.png (Sperre nehmen!)
//   node test/charaktere_vorher.mjs [name=vorher]
import { boot } from './look_lib.mjs';
import { figStage, figSheet, FIG_CODE } from './charaktere_lib.mjs';
const name = process.argv[2] || 'vorher';
const { page, errs, close } = await boot({ w: 900, h: 500 });
await figStage(page);
const ids = [['held', 'Held (Noa)'], ['heldin', 'Heldin'], ['mama', 'Mama'], ['veyran', 'Prof. Veyran'], ['rayan', 'Rayan'], ['elowen', 'Oma Elowen'], ['kael', 'Arenaleiter Kael'], ['borwin', 'Händler Borwin']];
const r = await figSheet(page, ids.map(([id, label]) => ({ label, code: FIG_CODE(id) })), `charaktere_${name}.png`, { title: name === 'vorher' ? 'Vorher – Figuren 12.11. (vorn · schräg · seitlich)' : 'Nachher – Figuren (vorn · schräg · seitlich)' });
console.log(JSON.stringify(r));
await close(); console.log(errs.length ? errs.join('\n') : 'ok');
