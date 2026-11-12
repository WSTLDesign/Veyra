// QA Loop C – Punkt 6: Dex-Versteck-Hinweise (Kindtauglichkeit, Korrektheit gegen enc-Daten/FINDS, Regionen nach dem 44-sky-Fix).
//   node test/qa_lc_dex.mjs     Bilder: test/qa_lc_dex_*.png
import { start, page, newGame, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('qa_lc_dex.log', 'QA Loop C – Dex-Hinweise');
const env = await start(); const p = await page(env); await newGame(p, { view: 'third' });
const ev = (f, a) => p.evaluate(f, a);
const D = await ev(() => { const out = { hints: [], none: [], regions: {} };
  G.dex.seen = {}; G.dex.caught = {}; const encs = {}; for (const id in MAPS) { const e = MAPS[id].enc; if (e) encs[id] = { name: MAPS[id].name, day: (e.day || []).map(q => q[0]), night: (e.night || []).map(q => q[0]), fish: (e.fish || []).map(q => q[0]) }; }
  const finds = {}; for (const id in NPCS) for (const n of NPCS[id] || []) if (n.f === 'hidden' && MONS[n.mon]) (finds[n.mon] = finds[n.mon] || []).push({ map: id, name: MAPS[id] && MAPS[id].name });
  for (let i = 1; i < MONS.length; i++) { const h = dexHint(i); if (h) out.hints.push({ i, n: MONS[i].n, h, legend: !!(MONS[i].legend || MONS[i].myth) }); else out.none.push({ i, n: MONS[i].n, legend: !!MONS[i].legend }); }
  out.encs = encs; out.finds = finds; out.total = MONS.length - 1; out.fh = FIND_HINTS && Object.fromEntries(Object.entries(FIND_HINTS).map(([k, v]) => [k, v])); out.reg = Object.fromEntries(Object.keys(MAPS).map(id => [id, skyRegion(id)])); out.skymap = typeof SKY_MAPREG !== 'undefined' ? Object.fromEntries(Object.entries(SKY_MAPREG).map(([k, v]) => [k, v[0]])) : null;
  out.fdreg = FD_REG; out.evo = {}; return out; });
R.note(`Arten ${D.total}; mit Hinweis ${D.hints.length}; ohne ${D.none.length}`);
const kinds = {}; for (const h of D.hints) { const k = h.h.replace(/:.*|\..*$/, '').slice(0, 30); kinds[k] = (kinds[k] || 0) + 1; } R.note('Hinweisarten: ' + JSON.stringify(kinds));
R.note('Ohne Hinweis: ' + D.none.map(x => x.i + ' ' + x.n + (x.legend ? '(Legende)' : '')).join(', '));
// ---- Länge/Wörter
const words = s => s.replace(/[.:!?]/g, ' ').split(/\s+/).filter(Boolean).length; const maxLen = Math.max(...D.hints.map(h => h.h.length)), maxW = Math.max(...D.hints.map(h => words(h.h)));
R.t('Kindtauglich: jeder Hinweis ≤ 45 Zeichen und ≤ 8 Wörter, ein Satz (max. ein Doppelpunkt)', maxLen <= 45 && maxW <= 8, { maxLen, maxW, longest: D.hints.filter(h => h.h.length > 40).map(h => h.h) });
const foreign = /\b(Habitat|Spawn|Encounter|Biom|Area|Zone|Evolution|Level|Typ|Rarit|Nacht-?aktiv|Pokémon|Pokemon)\b/i; R.t('Kindtauglich: keine Fremd-/Fachbegriffe', !D.hints.some(h => foreign.test(h.h)), D.hints.filter(h => foreign.test(h.h)));
// ---- Korrektheit: Hinweis-Ort gegen enc-Daten (unabhängig neu berechnet)
const wrong = [], checked = [];
const mapsWith = (i, k) => Object.entries(D.encs).filter(([, e]) => e[k].includes(i)).map(([id, e]) => e.name.replace(/ · .*/, ''));
for (const h of D.hints) { let m;
  if ((m = h.h.match(/^Lebt im hohen Gras: (.+?)( \(am Tag\))?\.$/))) { const day = mapsWith(h.i, 'day'), night = mapsWith(h.i, 'night'); const okName = day.includes(m[1]) || (!m[2] && night.includes(m[1])); const dayOnly = !!m[2]; const consistent = okName && (dayOnly ? !night.length : true); checked.push(h.i); if (!consistent) wrong.push({ h: h.h, day, night }); }
  else if ((m = h.h.match(/^Kommt nachts heraus: (.+)\.$/))) { const night = mapsWith(h.i, 'night'), day = mapsWith(h.i, 'day'); checked.push(h.i); if (!night.includes(m[1]) || day.length) wrong.push({ h: h.h, night, day }); }
  else if ((m = h.h.match(/^Beißt beim Angeln an: (.+)\.$/))) { const fish = mapsWith(h.i, 'fish'), day = mapsWith(h.i, 'day'), night = mapsWith(h.i, 'night'); checked.push(h.i); if (!fish.includes(m[1]) || day.length || night.length) wrong.push({ h: h.h, fish, day, night }); }
  else if ((m = h.h.match(/^Irgendwo (.+) versteckt\.$/))) { const f = D.finds[h.i]; checked.push(h.i); const reg = f && D.reg[f[0].map]; if (!f || D.fdreg[reg] !== m[1]) wrong.push({ h: h.h, f, reg }); }
}
R.t(`Korrektheit: ${checked.length} Orts-/Regions-Hinweise stimmen mit den enc-Listen bzw. FIND-Daten überein (Gras Tag/Nacht, Angeln, versteckt)`, wrong.length === 0, wrong.slice(0, 5));
// Stichprobe 15 (fest, jede 8. Art mit Hinweis) – Ausgabe zur Sichtprüfung
const sample = D.hints.filter((h, k) => k % Math.max(1, Math.floor(D.hints.length / 15)) === 0).slice(0, 15); R.note('Stichprobe 15:\n' + sample.map(h => `   #${h.i} ${h.n}: „${h.h}“`).join('\n'));
// ---- Versteckte Wesen: Karte → Region (44-sky-Fix) richtig
const regExpect = { morgenau: 'lichtlande', route1: 'lichtlande', route3: 'lichtlande', siegesstrasse: 'lichtlande', kupferhain: 'smaragdwald', route2: 'smaragdwald', fluestertal: 'smaragdwald', brisenhafen: 'flutkueste', windkueste: 'flutkueste', moewenbucht: 'flutkueste', glutschlucht: 'glutlande', nebelgrotte: 'kristallgebirge', frostheim: 'frosttundra', route4: 'schattenmoor', schattmoor: 'schattenmoor' };
const regBad = Object.entries(regExpect).filter(([m, r]) => D.reg[m] !== r); R.t('skyRegion(<Karten-ID als String>) liefert für alle 15 Karten die richtige Region (nicht mehr immer Lichtlande)', regBad.length === 0, regBad.map(([m, r]) => m + ': ' + D.reg[m] + ' statt ' + r));
const fhr = Object.entries(D.finds).map(([i, f]) => `${D.fh[i] ? D.fh[i].text : '??'} ← ${MONSN(i)} @${f[0].map}`); function MONSN(i) { return D.hints.find(h => h.i == i)?.n || i; } R.note('Versteckte Wesen: ' + fhr.join(' | '));
const distinctRegs = new Set(Object.values(D.fh).map(v => v.region)); R.t('Versteckte-Wesen-Hinweise nennen mehr als eine Region (Fix wirkt)', distinctRegs.size > 1, [...distinctRegs]);
// Regions-Zuordnung gegen Story-Kanon (SITES)
const sites = await ev(() => { try { return Object.fromEntries(Object.entries(SITES).map(([k, v]) => [k, { map: v.map, reg: v.reg, name: v.name }])); } catch (e) { return null; } }); if (sites) R.note('SITES: ' + JSON.stringify(sites).slice(0, 600));
// ---- Mehrfach-Vorkommen: nennt der Hinweis den frühesten Ort der Story?
const ORDER = ['morgenau', 'route1', 'kupferhain', 'route2', 'brisenhafen', 'route3', 'windkueste', 'moewenbucht', 'glutschlucht', 'frostheim', 'fluestertal', 'route4', 'schattmoor', 'siegesstrasse', 'nebelgrotte'];
const multi = []; for (const h of D.hints) { const m = h.h.match(/^(?:Lebt im hohen Gras|Kommt nachts heraus): (.+?)(?: \(am Tag\))?\.$/); if (!m) continue; const ids = Object.entries(D.encs).filter(([, e]) => e.day.includes(h.i) || e.night.includes(h.i)).map(([id]) => id).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)); if (ids.length > 1) { const first = D.encs[ids[0]].name.replace(/ · .*/, ''); multi.push({ n: h.n, hint: m[1], earliest: first, all: ids.length, ok: first === m[1] }); } }
R.note(`Arten auf mehreren Karten: ${multi.length}; Hinweis nennt nicht den frühesten Ort: ${multi.filter(x => !x.ok).length} – ${JSON.stringify(multi.filter(x => !x.ok).slice(0, 8))}`);
const generic = D.hints.filter(h => /anderen Kreatur/.test(h.h)).length; R.note(`Allgemeiner Evolutionshinweis ohne Ort: ${generic} von ${D.hints.length} (${Math.round(100 * generic / D.hints.length)} %)`);
// ---- UI: Dex-Liste mit Hinweispunkten, Tippen zeigt Hinweis (kurz)
await ev(() => { G.dex.seen = { 1: 1 }; G.dex.caught = { 1: 1 }; mode = 'world'; try { openMenu('dex'); } catch (e) { } });
await p.waitForTimeout(800);
const ui = await ev(() => { const hint = [...document.querySelectorAll('.dx.none.hint')], none = [...document.querySelectorAll('.dx.none')]; const b = hint[3]; const cs = b ? getComputedStyle(b, '::after') : null; return { hint: hint.length, none: none.length, dot: cs && [cs.content, cs.width, cs.backgroundColor], aria: b && b.getAttribute('aria-label'), w: b && Math.round(b.getBoundingClientRect().width), h: b && Math.round(b.getBoundingClientRect().height) }; });
R.note('Dex-UI: ' + JSON.stringify(ui)); await p.screenshot({ path: here('qa_lc_dex_liste.png') });
const toast = await ev(async () => { const b = [...document.querySelectorAll('.dx.none.hint')][3]; b && b.click(); await new Promise(r => setTimeout(r, 400)); const t = document.querySelector('#toast'); return t ? { text: t.textContent, vis: !t.hidden } : null; });
R.note('Antippen: ' + JSON.stringify(toast)); await p.screenshot({ path: here('qa_lc_dex_hinweis.png') });
R.t('Dex: ungesehene Felder mit Hinweis tragen Markierung und sind ≥ 44 px groß', ui.hint > 50 && ui.w >= 44 && ui.h >= 44, ui);
R.t('Antippen zeigt „Hinweis: …“ (Toast)', toast && /Hinweis: /.test(toast.text), toast);
R.t('keine Seitenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
