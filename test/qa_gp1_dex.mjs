// Gegenprüfung Runde 1 – Punkt 8 (Dex): Stichprobe 12 Hinweise mit Entwicklungsketten und allen Fundkarten (unabhängig aus MAPS/NPCS/MONS)
import { start, page, newGame } from './qa_lc_lib.mjs';
const env = await start(); const p = await page(env); await newGame(p, { view: 'third' });
const r = await p.evaluate(() => { G.dex.seen = {}; G.dex.caught = {}; const where = i => { const o = []; for (const id in MAPS) { const e = MAPS[id].enc; if (!e) continue; for (const k of ['day', 'night', 'fish', 'water']) if ((e[k] || []).some(q => q[0] === i)) o.push(id + ':' + k); } for (const id in NPCS) for (const n of NPCS[id] || []) if (n && n.mon === i) o.push(id + ':npc-' + n.t); return o; };
  const chain = i => { const c = [i]; for (let n = 0; n < 5; n++) { const j = dexPre(c[c.length - 1]); if (!j) break; c.push(j); } return c; };
  const out = []; for (const i of [9, 20, 36, 47, 65, 75, 83, 94, 104, 115, 125, 136, 28, 57]) out.push({ i, n: MONS[i].n, hint: dexHint(i), chain: chain(i).map(j => MONS[j].n + '#' + j).join(' <- '), where: chain(i).map(j => MONS[j].n + '=' + where(j).join(',')).join(' ; ') });
  const story = typeof STORY !== 'undefined' ? STORY.map(s => s.id || s.name || '').slice(0, 20) : null; return { out, story, dexOrder: DEX_ORDER }; });
for (const o of r.out) console.log(`#${o.i} ${o.n}: „${o.hint}“\n    Kette: ${o.chain}\n    Orte: ${o.where}`);
console.log(JSON.stringify(r.story)); await env.close();
