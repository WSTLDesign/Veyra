// QA Mechanik – Prüfpunkt 10: Text/Kanon/Recht der neuen Module. „Orden“ (Kanon: Medaille), Fremdmarken, Fremd-Attackennamen, kurze Sätze.
//   node test/qa_mech_text.mjs
import { start, page, newGame, reporter } from './qa_mech_lib.mjs';
import { readFileSync } from 'fs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_text.log', 'QA Mechanik Text');
const env = await start(); const p = await page(env, { flags: {} });
await newGame(p, { team: [[1, 3]], view: '2d' });
// ---- A) Statisch: „Orden“ in Spieltext-Strings der neuen Module (ohne Kommentarzeilen)
const files = ['05-field.js', '17-move.js', '47-finds.js', '46-bigmap.js', '24-capture.js', '12-intro.js', '38-models.js'];
const ORD = /\b(?!Schattenorden|Ordensrekrut|Ordensmeister|Ordensleute|Ordensbruder|Ordenslehrling)\w*[Oo]rden\w*/g; const st = {};
for (const f of files) { const L = readFileSync(new URL('../src/' + f, import.meta.url), 'utf8').split('\n'); L.forEach((l, i) => { if (/^\s*\/\//.test(l)) return; const code = l.replace(/\/\/.*$/, ''); const m = code.match(ORD); if (m && m.some(w => !/^(Norden|geworden|worden|Ordnung)/.test(w))) (st[f] = st[f] || []).push(`${f}:${i + 1}: ${m.filter(w => !/^(Norden|geworden|worden)$/.test(w)).join(',')}`); }); }
R.note('Statisch „Orden“ in neuen Modulen (nur Code, ohne Kommentare): ' + JSON.stringify(st));
// ---- B) Laufzeit: angezeigter Text (toast/say/ITEMS/FIELD) einsammeln
const T = await p.evaluate(async () => { const out = { toast: [], say: [], items: [], field: [] }; G.badges = []; G.flags.swim = G.flags.glide = G.flags.climb = 0; MV.toastT = {};
  for (const k of ['swim', 'glide', 'climb']) { MV.toastT = {}; lockToast(k); out.toast.push(document.querySelector('#toast').textContent); }
  G.badges = ['Floramedaille', 'Flutmedaille', 'Frostmedaille', 'Schattenmedaille']; G.flags.swim = G.flags.glide = G.flags.climb = 1; G.team = [mk(4, 3)];
  for (const k of ['swim', 'glide', 'climb']) { MV.toastT = {}; lockToast(k); out.toast.push(document.querySelector('#toast').textContent); }
  for (const id in FIELD_MOVES) { const F = FIELD_MOVES[id]; out.field.push(F.n + ' | ' + (F.use || '') + ' | ' + (F.medal || '')); out.say.push(...fieldNeedText(id, 'Dornenhecke')); }
  for (const k in ITEMS) if (/^rolle_/.test(k)) out.items.push(ITEMS[k].n + ' | ' + (ITEMS[k].d || ITEMS[k].desc || '')); out.mons = Object.keys(MOVES).map(k => MOVES[k][0]); out.fm = Object.values(FIELD_MOVES).map(F => F.n);
  // Medaillenseite/Chronik-Texte
  pressB(); await new Promise(r => setTimeout(r, 600)); const tx = {}; for (const t of ['map', 'team', 'quest', 'dex', 'bag', 'box']) { const b = document.querySelector(`#tabs button[data-t="${t}"]`); if (b) { b.click(); await new Promise(r => setTimeout(r, 350)); tx[t] = document.querySelector('#mBody').innerText; } }
  const bd = document.querySelector('#tabs button[data-t="badges"]') || [...document.querySelectorAll('#tabs button')].find(b => /Medaillen/.test(b.textContent)); if (bd) { bd.click(); await new Promise(r => setTimeout(r, 350)); tx.badges = document.querySelector('#mBody').innerText; } out.tabs = tx; closeMenu(); mode = 'world'; return out; });
R.note('Toasts Sperren: ' + JSON.stringify(T.toast)); R.note('Feld-Attacken: ' + JSON.stringify(T.field));
const BAD_ORD = /\b(?!Schattenorden|Ordensrekrut|Ordensmeister|Ordensleute|Ordensbruder|Ordenslehrling)\w*[Oo]rden(s)?\b/;
const strings = [...T.toast, ...T.field, ...T.say, ...T.items, ...Object.values(T.tabs)];
const ordHits = strings.filter(s => BAD_ORD.test(s.replace(/Norden|geworden|worden/g, ''))); R.t('A Angezeigter Text der neuen Module ohne „Orden“ (Kanon: Medaille) – Sperren-Toasts, Feld-Attacken-Daten, Hinweise, Rollen, Chronik-Tabs', ordHits.length === 0, ordHits.map(s => s.slice(0, 120)));
const BRAND = /pok[eé]|nintendo|game\s?freak|pikachu|gameboy|\bgym\b|trainerkarte|pokal/i; R.t('B Keine Fremdmarken-Wörter im angezeigten Text', !strings.some(s => BRAND.test(s)), strings.filter(s => BRAND.test(s)).slice(0, 3));
// ---- C) Attackennamen gegen bekannte deutsche Fremdnamen (Auswahl häufiger Namen; vollständige Prüfung: test/qa_a_recht.mjs)
const FREMD = 'Pfund Karateschlag Duplexhieb Megahieb Kometenhieb Zahltag Feuerschlag Eishieb Donnerschlag Kratzer Klammer Guillotine Klingensturm Schwerttanz Zerschneider Windstoß Flügelschlag Wirbelwind Fliegen Klammergriff Rankenhieb Stampfer Doppelkick Megakick Sprungkick Turmkick Sandwirbel Kopfnuss Hornattacke Furienschlag Bohrschnabel Tackle Fesseln Bodycheck Rutenschlag Giftstachel Nadelrakete Silberblick Biss Heuler Brüller Gesang Superschall Schallwelle Konfusstrahl Säure Glut Flammenwurf Dunkelnebel Nebelschleier Wasserpistole Hydropumpe Surfer Eisstrahl Blizzard Psychokinese Hyperstrahl Aero-Ass Rasierblatt Solarstrahl Giftpuder Schlafpuder Blättersturm Donnerblitz Donnerwelle Donner Erdbeben Spalt Buddler Flammenrad Orkan Steinwurf Härten Rempler Kraftkoloss Kraxler Blitz Fluch Aquawelle Wasserfall Strudel Konter Delegator Ruhetaste Erholung Metronom Egelsamen Wickel Gigasauger Rauchwolke Lichtschild Reflektor Spiegelcape Mimikry Teleport Meditation Agilität Zwillingsnadel Glut Funkenflug Feuerwirbel Feuersturm Feuerzahn Eiszahn Donnerzahn Dunkelheit Nachtnebel Knirscher Kreuzhieb Drachenklaue Drachenwut Bodyslam Überschlag Gewaltstreich Kraftreserve Zen-Kopfstoß Steinhagel Felswurf Steinkante Walzer Zugabe'.split(' ');
const norm = s => s.toLowerCase().replace(/[^a-zäöüß]/g, ''); const FN = new Set(FREMD.map(norm));
const allMoves = [...new Set([...T.mons, ...T.fm])]; const coll = allMoves.filter(n => FN.has(norm(n)));
R.note(`Attackennamen geprüft: ${allMoves.length}; Treffer gegen Auswahl deutscher Fremdnamen: ${JSON.stringify(coll)}`);
const newNames = ['Rankenschnitt', 'Felsschub', 'Eisbrücke', 'Leuchtfeuer', 'Wellenritt', 'Sturmflügel', 'Kletterkralle', 'Wellenschlag', 'Frostzahn', 'Glutwirbel', 'Donnerkeil', 'Nachtbiss', 'Blattwirbel'];
R.t('C Neue Feld-/Rollen-Attacken ohne exakten Fremdnamen (Flammenrad = Pokémon-Attacke „Flammenrad“ im Deutschen → bekannt aus qa_a_recht, niedrig)', newNames.filter(n => FN.has(norm(n))).length === 0, newNames.filter(n => FN.has(norm(n))));
R.t('C Gesamte Attackenliste ohne exakten Fremdnamen (Auswahl)', coll.length === 0, coll);
// ---- D) Kurze Sätze: Texte der neuen Module (Hinweise, Fundtexte, Karten) – Wörter je Satz
const NEW = [...T.toast, ...T.say, ...T.items.map(s => s.split(' | ')[1] || ''), 'Du hast eine Lehrrolle gefunden! Rolle: Rankenschnitt. Passt zu: Flora, Böe, Glut. Damit kommt eine Kreatur an neue Orte. Öffne die Tasche und tippe bei „Rollen“ auf „Lernen“.', 'Da bewegt sich etwas! Ein seltenes Wesen springt heraus: Lumli!', 'Dochti kennt schon vier Attacken. Welche soll Platz machen für Flammenrad? Keine Sorge: Unter „Team“ kannst du sie später wieder wählen.', 'Keine Kreatur in deinem Team kann dich tragen. Reiten geht nur auf kräftigen Vierbeinern wie Knackel oder Kiesel.'];
const long = []; for (const t of NEW) for (const s of t.split(/(?<=[.!?])\s+/)) { const w = s.trim().split(/\s+/).filter(Boolean).length; if (w > 16) long.push([w, s.slice(0, 110)]); }
R.note('Sätze > 16 Wörter: ' + JSON.stringify(long)); R.t('D Sätze der neuen Module ≤ 16 Wörter (Zielgruppe Kind), nur Ausnahmen melden', long.length <= 3, long);
R.t('Keine Konsolenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
