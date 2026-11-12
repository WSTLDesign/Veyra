// QA Loop C – Punkt 10 (Laufzeit): Kanon-Begriffe in der echten Oberfläche (HUD, alle Chronik-Tabs, Tor-Texte, Missionen, Feldattacken) + Fremdbegriffe.
import { start, page, newGame, reporter } from './qa_lc_lib.mjs';
const R = reporter('qa_lc_law.log', 'QA Loop C – Gesetz/Kanon zur Laufzeit');
const env = await start(); const p = await page(env, { w: 860, h: 484 }); await newGame(p, { view: 'third' }); const ev = (f, a) => p.evaluate(f, a);
const FOREIGN = /pok[eé]mon|pok[eé]ball|pikachu|nintendo|zerschneider|surfer|flammenrad|\bSurf\b|\bFlash\b|\bCut\b/i;
const ORD = /(?:\b(?:\d+|zwei|drei|vier|fünf|sechs|sieben|acht|ersten?|erster|alle)\s+Orden\b)|\b(?:Blüten|Wellen|Gletscher|Mond|Dämmer)orden\b|\/\d+\s+Orden\b|\bOrden\s+(?:gesammelt|erhalten|sammeln)\b/g;   // Abzeichen-Sinn; „der Orden“ (Schurkengruppe, Schattenorden, Ordensrekruten) und „Norden“ sind kanonisch bzw. kein Treffer
const scan = (where, txt) => ({ where, orden: [...new Set(txt.match(ORD) || [])], foreign: (txt.match(FOREIGN) || []) });
const rows = [];
await ev(() => { G.badges = []; G.flags.starter = 1; G.flags.firstcatch = 1; updHud(); });
rows.push(scan('HUD leer', await ev(() => $('#hudBadges').textContent))); rows.push({ where: 'HUD-Text (0 Medaillen)', t: await ev(() => $('#hudBadges').textContent) });
await ev(() => { G.badges = ['Floramedaille', 'Flutmedaille']; for (const f of ['badge1', 'badge2']) G.flags[f] = 1; updHud(); }); const hud2 = await ev(() => $('#hudBadges').textContent); rows.push({ where: 'HUD-Text (2 Medaillen)', t: hud2 }); rows.push(scan('HUD 2', hud2));
for (const t of ['quest', 'map', 'team', 'dex', 'bag', 'box', 'medals', 'game']) { const txt = await ev(t => { try { openMenu(t); } catch (e) { return 'ERR ' + e.message; } return new Promise(r => setTimeout(() => r(document.querySelector('#menu').innerText), 700)); }, t); rows.push(scan('Chronik-Tab ' + t, txt)); rows.push({ where: 'len ' + t, t: String(txt.length) }); await ev(() => { try { closeMenu(); } catch (e) { } mode = 'world'; }); }
// Tor-Texte (über dieselbe Textfunktion wie say())
const gates = await ev(() => { const out = []; for (const [id, m] of Object.entries(MAPS)) { if (m.gate) for (const [d, g] of Object.entries(m.gate)) out.push([id + '.' + d, kanonText(g.m)]); } return out; });
for (const [k, t] of gates) rows.push(scan('Tor ' + k, t)), rows.push({ where: 'Tor-Text ' + k, t });
const sq = await ev(() => SIDEQUESTS.concat(typeof SQ !== 'undefined' ? SQ : []).map(q => (q.title || '') + ' / ' + (q.d || '') + ' / ' + ((q.req && q.req.text) || '')).join('\n')); rows.push(scan('Nebenmissionen', sq));
const stories = await ev(() => QUESTS.map(q => q.title + ' / ' + (q.d || '')).join('\n')); rows.push(scan('alle Missionen', stories));
const moves = await ev(() => JSON.stringify(Object.values(FIELD_MOVES || {}).map(m => m.n || m.name || m.label))); rows.push({ where: 'Feldattacken', t: moves });
const fl = await ev(() => { const o = []; for (const k in MOVES) { const m = MOVES[k]; o.push(m.n || m.name); } return o.join(','); }); rows.push(scan('Attackennamen', fl));
const names = await ev(() => MONS.filter(Boolean).map(m => m.n || m.name).join(',')); rows.push(scan('Artnamen', names));
for (const r of rows) R.note(JSON.stringify(r).slice(0, 700));
const orden = rows.filter(r => r.orden && r.orden.length);
R.t('keine Fremdbegriffe (Pokémon, Pokéball, Pikachu, Nintendo, Zerschneider, Surfer, Flammenrad) in der Oberfläche', rows.every(r => !r.foreign || !r.foreign.length), rows.filter(r => r.foreign && r.foreign.length));
R.t('HUD zeigt Medaillen statt Orden', /Medaille/.test(hud2) && !/Orden/.test(hud2), hud2);
R.t('keine „Orden“-Reste im Sinn von Abzeichen in Tabs/Toren/Missionen', orden.length === 0, orden.map(r => r.where + ': ' + r.orden.join(',')));
R.t('keine Seitenfehler', p.errs.length === 0, p.errs); await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
