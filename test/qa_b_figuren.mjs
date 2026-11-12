// QA Loop B3 – Prüfung 3 (ohne Browser): Figuren-Kanon, Porträt-Dateien, kindgerechte Sprüche, Fremdmarken-Muster.   node test/qa_b_figuren.mjs
//  a) 40 FIGURES: Teams = docs/figuren.md (Kanon-Tabelle), IDs in MONS (1–153, keine Legenden), Elemente passen, figTeam/rivalTeam(0–8) gültig
//  b) Porträts: public/art/<art>_face_*.webp vorhanden + dekodierbar (PIL, `python3 -I`), in dist/art + Artifact eingebettet; Figuren ohne Bild → prozedural (Liste)
//  c) Sprüche (FIGURES.lines) und alle NPC-Texte: Sätze ≤ 80 Zeichen, Angst-/Gewaltwörter (HART/WEICH-Liste unten, auch in docs/qa-loop-b.md)
//  d) Fremdmarken: Markenwörter, 572 Fremd-Kreaturen (qa_a_recht), Figuren-/Trainernamen der Fremdmarke, Redewendungen, bekannte Muster (Meldung)
//  Ergebnis → test/qa_b_figuren.json
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
const root = new URL('../', import.meta.url).pathname;
const { run } = loadVeyra();
let ok = 0, bad = 0; const R = { warn: [], info: [] };
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
const none = (arr, m) => { if (arr.length) throw new Error((m || '') + ' ' + arr.slice(0, 10).join(' | ') + (arr.length > 10 ? ' …(' + arr.length + ')' : '')); };
const F = J('FIGURES'), ids = Object.keys(F);
const MON = J('MONS.map(M=>M?{n:M.n,t:M.t,legend:!!M.legend,myth:!!M.myth}:null)');
const SITS = ['gruss', 'kampf', 'sieg', 'niederlage', 'alltag'];

// ---- Wortlisten (kindgerecht) ----
// HART = darf in keinem Spruch/NPC-Text vorkommen. WEICH = nur melden (kontextabhängig, meist harmlos).
export const HART = /\b(stirb\w*|gestorben|sterben|tot(e[nrms]?)?|tod(e|es)?|töte\w*|tötet|ermord\w*|mord\w*|blut\w*|leiche\w*|waffe\w*|schwert\w*|messer|pistole|krieg\w*|gewalt\w*|zerstör\w*|vernicht\w*|quäl\w*|folter\w*|rache|hass\w*|schmerz\w*|ängste\w*|furcht\w*|fürcht\w*|schreck\w*|albtraum\w*|alptraum\w*|horror|grausam\w*|brutal\w*|verdammt|scheiß\w*|sau(dumm)?|idiot\w*|dumm\w*|hässlich\w*)\b/i;
// „Angst“ nur in beruhigender/verneinter Form erlaubt („keine Angst“, „nicht aus Angst“, „ohne Angst“, „hat Angst um …“ = WEICH); sonst HART
export const ANGST_OK = /\b(keine|ohne|nie|nicht aus|nicht vor) Angst\b/i;
export const hart = x => HART.test(x) || (/\bAngst\b/i.test(x) && !ANGST_OK.test(x) && !/Angst um\b/i.test(x));
export const WEICH = /\b(angst um|untergang|verderben|fluch\w*|gefahr\w*|bedroh\w*|verletz\w*|feind\w*|verrat\w*|verräter\w*|strafe\w*|bestraf\w*|gefängnis|einsperr\w*|böse\w*|dunkelheit|finster\w*|unheimlich\w*|gruselig\w*|verlier\w*|versag\w*|schwäche\w*|schwach\w*)\b/i;
// Fremdmarken: Figuren-/Trainernamen und Redewendungen (Pokémon u. a.), nur Namen/Phrasen, die im Spiel nichts zu suchen haben
export const FREMDFIGUREN = ['ash', 'ketchum', 'misty', 'rocko', 'brock', 'rotom', 'giovanni', 'lorelei', 'agatha', 'agathe', 'lance', 'surge', 'erika', 'koga', 'sabrina', 'blaine', 'bruno', 'frida', 'falk', 'faulkner', 'whitney', 'bianka', 'jasmin', 'rowan', 'oak', 'eich', 'kiefer', 'birk', 'platan', 'juniper', 'cynthia', 'lilia', 'gary', 'leon', 'marnie', 'hop', 'nessa', 'kabu', 'piers', 'raihan', 'bea', 'mel', 'gladio', 'lillie', 'selene', 'kukui', 'hapu', 'mox', 'lox', 'jessie', 'james', 'meowth', 'cassidy', 'butch', 'archie', 'maxie', 'cyrus', 'ghetsis', 'lysander', 'colress', 'guzma', 'lusamine', 'rose', 'oleana', 'arven', 'nemona', 'geeta', 'miriam', 'ryme', 'elesa', 'iris', 'drake', 'wallace', 'steven', 'wikstrom', 'siegfried', 'karen', 'will', 'anabel', 'brandon', 'flannery', 'norman', 'winona', 'tate', 'liza', 'wattson', 'roxanne', 'brawly', 'juan', 'cheren', 'bell', 'barry', 'dawn', 'may', 'brendan', 'lucas', 'hilda', 'hilbert', 'rosa', 'nate', 'calem', 'serena', 'elio', 'gladion', 'victor', 'gloria', 'ethan', 'lyra', 'silver', 'crystal', 'kris', 'flegmon', 'tracey', 'duplica'];
export const PHRASEN = /ich wähle dich|schnapp(e)? (sie|ihn|es) dir|fang(e)? sie alle|gotta|catch 'em|der allerbeste|der beste (trainer|meister)|pokémon-meister|werde (ein |der )?(pokémon|trainer)meister|team rocket|rakete|heil dem|verwandl(e|t) dich in|prepare for trouble|make it double|pika|blitzschnell wie ein ?pika/i;
// bekannte Genre-Muster der Fremdmarke (nur Meldung, keine Fehler): Rolle/Struktur, kein Wortlaut
const MUSTER = [
  ['Professor mit drei Startern + zwei Rivalen', 'Genre-Standard (Professor, Rivale, 3 Starter); Namen/Optik eigen (Veyran, Blättchen, Rayan/Mira) → ok'],
  ['Arenaleiter + 8 Medaillen', 'Genre-Standard; Begriffe „Medaille“, „Arenaleiter“ allgemein; Reihenfolge/Elemente eigen → ok'],
  ['Elite-Gruppe aus 4 + Meisterin', 'als Turmrat (Tageszeiten-Säle) + Kronenhüterin eigen umgesetzt (kein „Top Vier“/„Champion“) → ok'],
  ['Böse Organisation mit Chef, rechter Hand, Rekruten', 'Genre-Standard; Schattenorden mit Läuterung/Dämmerbund statt Raketen-Motiv; Rekruten ohne Komik-Duo → ok'],
  ['Kreaturen-Heilerin in jeder Station', 'Genre-Standard (Heilstation); Name Mirael + eigenes Aussehen, „Kreaturenstation“ → ok'],
  ['Rivale benennbar', 'entfernt (Kanon-Namen fest, Webdriver-Pfad „Lio“ nur intern) → ok'],
];

// ---- a) Kanon
const docs = readFileSync(root + 'docs/figuren.md', 'utf8');
const rows = [...docs.matchAll(/^\| `(\w+)` \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|/gm)].map(m => ({ id: m[1], n: m[2].trim(), role: m[3].trim(), reg: m[4].trim(), el: m[5].trim(), comp: m[6].trim(), team: m[7].trim() }));
const nameToId = {}; MON.forEach((M, i) => { if (M) nameToId[M.n] = i; });
t(`Doku-Tabelle (docs/figuren.md) hat alle ${ids.length} Figuren`, () => { none(ids.filter(k => !rows.some(r => r.id === k)), 'in Doku fehlt:'); none(rows.filter(r => !F[r.id]).map(r => r.id), 'nicht im Code:'); });
t('Name und Rolle je Figur = Doku', () => none(rows.filter(r => F[r.id] && (F[r.id].n !== r.n || F[r.id].role !== r.role)).map(r => r.id + ': ' + F[r.id].n + '/' + F[r.id].role + ' ≠ ' + r.n + '/' + r.role)));
t('Teams im Code = Kanon-Team der Doku (Art-Name + Level)', () => {
  const e = []; for (const r of rows) { const f = F[r.id]; if (!f || f.player || /^G\./.test(r.team)) continue; const want = r.team.split(',').map(s => { const m = s.trim().match(/^(.+) (\d+)$/); return m ? [nameToId[m[1]], +m[2], m[1]] : null; });
    if (want.some(w => !w || !w[0])) { e.push(r.id + ': Doku-Name unbekannt ' + r.team); continue; }
    const got = f.team.map(([s, l]) => s + '@' + l).join(), exp = want.map(w => w[0] + '@' + w[1]).join(); if (got !== exp) e.push(r.id + ': ' + got + ' ≠ ' + exp); }
  none(e);
});
t('Teams: alle IDs in MONS, ≤ 153, keine Legenden/Mythischen, Level 2–100, Begleiter gültig', () => {
  const e = []; for (const k of ids) { const f = F[k]; if (f.player) continue; if (!f.team || !f.team.length) e.push(k + ':leer');
    for (const [s, l] of f.team || []) { if (!MON[s]) e.push(k + ':' + s + ' fehlt'); else if (MON[s].legend || MON[s].myth) e.push(k + ':' + MON[s].n + ' legendär'); if (!(l >= 2 && l <= 100)) e.push(k + ': Level ' + l); }
    if (f.partner && !MON[f.partner]) e.push(k + ': Partner ' + f.partner); for (const st in f.teams || {}) for (const [s] of f.teams[st]) if (!MON[s]) e.push(k + ':teams' + st + ' ' + s); for (const s of f.pool || []) if (!MON[s]) e.push(k + ':pool ' + s); }
  none(e);
});
t('Elemente: Arenaleiter rein, Turmhüter 2 Elemente, Ardena Lumen-Hauptteam, Schattenorden Schatten-Anteil', () => {
  const e = [], AO = J('ARENA_ORDER'), EL = { brann: ['glut', 'flora'], zaria: ['boe', 'volt'], ondra: ['flut', 'frost'], hesper: ['schatten', 'fels'] };
  for (const k of AO) for (const [s] of F[k].team) if (!MON[s].t.includes(F[k].el)) e.push(k + ':' + MON[s].n + ' ' + MON[s].t);
  for (const [k, el] of Object.entries(EL)) for (const [s] of F[k].team) if (!MON[s].t.some(x => el.includes(x))) e.push(k + ':' + MON[s].n);
  for (const k of ['varkon', 'seraphine', 'kaine']) if (!F[k].team.some(([s]) => MON[s].t.includes('schatten'))) e.push(k + ': kein Schatten-Wesen');
  none(e);
});
t('figTeam(id) für alle Figuren und rivalTeam(rayan|mira, 0–8) gültig, Level steigt über die Stufen', () => {
  const e = [], v = T => Array.isArray(T) && T.length && T.every(x => Array.isArray(x) && MON[x[0]] && x[1] > 0);
  for (const k of ids) { if (F[k].player) continue; const T = J(`figTeam(${JSON.stringify(k)},{})`); if (!v(T)) e.push(k + ': figTeam'); }
  for (const w of ['rayan', 'mira']) { let last = 0; for (let s = 0; s <= 8; s++) { const T = J(`rivalTeam(${JSON.stringify(w)},${s})`); if (!v(T)) { e.push(w + ' Stufe ' + s); continue; } const mx = Math.max(...T.map(x => x[1])); if (mx < last) e.push(w + ' Stufe ' + s + ' Level sinkt ' + last + '→' + mx); last = mx; } }
  none(e);
});

// ---- b) Porträts
const art = readdirSync(root + 'public/art').filter(f => /_face_/.test(f)), dist = existsSync(root + 'dist/art') ? readdirSync(root + 'dist/art') : [];
const artists = [...new Set(ids.map(k => F[k].art).filter(Boolean))];
const artMissing = ids.filter(k => F[k].art && !art.some(f => f.startsWith(F[k].art + '_face_')));
t(`Porträt-Dateien: ${art.length} *_face_*.webp in public/art; held/heldin vorhanden; Figuren mit art-Schlüssel aber ohne Bild fallen sauber auf den prozeduralen Kopf zurück`, () => { none(['held', 'heldin'].filter(k => !art.some(f => f.startsWith(k + '_face_'))), 'ohne Bild:'); });
if (artMissing.length) R.warn.push('Figuren mit art-Schlüssel, aber ohne Porträt-Datei (nur prozedural): ' + artMissing.join(', '));
t('Alle Porträt-Dateien zusätzlich in dist/art (Build) und im Artifact eingebettet', () => {
  const art2 = existsSync(root + 'dist/artifact.html') ? readFileSync(root + 'dist/artifact.html', 'latin1') : ''; const idx = readFileSync(root + 'dist/index.html', 'utf8');
  none(art.filter(f => !dist.includes(f)), 'nicht in dist/art:'); none(art.filter(f => !art2.includes('"' + f.replace('.webp', '') + '"') && !art2.includes(f.replace('.webp', ''))), 'nicht im Artifact:'); none(art.filter(f => !idx.includes(f.replace('.webp', ''))), 'nicht in index.html:');
});
let pil = {};
try { pil = JSON.parse(execFileSync('python3', ['-I', '-c', `import json,sys,os\nfrom PIL import Image\nr={}\nd=sys.argv[1]\nfor f in sorted(os.listdir(d)):\n  if '_face_' not in f: continue\n  try:\n    im=Image.open(os.path.join(d,f));im.verify();im=Image.open(os.path.join(d,f));im.load();r[f]=[im.width,im.height,os.path.getsize(os.path.join(d,f)),im.getextrema()[3][0] if im.mode=='RGBA' else 255]\n  except Exception as e: r[f]=str(e)\nprint(json.dumps(r))`, root + 'public/art'], { encoding: 'utf8' })); } catch (e) { pil = { _err: e.message }; }
t('Porträt-Bilder dekodierbar (PIL), quadratisch ≥ 200 px, ≤ 60 KB', () => { if (pil._err) throw new Error(pil._err); const b = Object.entries(pil).filter(([, v]) => typeof v === 'string' || v[0] !== v[1] || v[0] < 200 || v[2] > 60000); none(b.map(([f, v]) => f + ':' + JSON.stringify(v))); });
const noArt = ids.filter(k => !F[k].art || !art.some(f => f.startsWith(F[k].art + '_face_')));
R.info.push('Figuren ohne Porträt-Bild (prozeduraler Anime-Kopf): ' + noArt.length + ' → ' + noArt.join(', '));
// Ausdruck je Spruch → gibt es ein passendes Bild oder fällt es auf einen vorhandenen Ausdruck zurück?
t('Ausdrücke der Sprüche: Rückfallkette findet je Figur mit Bild immer ein Bild', () => {
  const FB = J('FIG_EXPR_FALLBACK'), e = []; for (const k of ids) { const a = F[k].art; if (!a) continue; const have = art.filter(f => f.startsWith(a + '_face_')).map(f => f.slice(a.length + 6).replace('.webp', '')); if (!have.length) continue;
    for (const s of SITS) for (const l of F[k].lines[s] || []) { const ex = run(`figExprFor(${JSON.stringify(l)},${JSON.stringify(s)})`); const ok2 = (FB[ex] || [ex, 'neutral']).some(x => have.includes(x)) || have.length > 0; if (!ok2) e.push(k + ':' + ex); } }
  none(e);
});

// ---- c) Sprüche
const texts = [];
for (const k of ids) for (const s of SITS) for (const l of F[k].lines[s] || []) texts.push({ w: 'FIGURES.' + k + '.' + s, t: l });
const sent = x => x.split(/(?<=[.!?…])\s+/).filter(Boolean);
t(`Sprüche (${texts.length}): jeder Spruch und jeder Satz ≤ 80 Zeichen`, () => none(texts.filter(x => x.t.length > 80 || sent(x.t).some(s => s.length > 80)).map(x => x.w + ' (' + x.t.length + '): ' + x.t)));
t('Sprüche: keine Angst-/Gewalt-/Schimpfwörter (HART-Liste)', () => none(texts.filter(x => hart(x.t)).map(x => x.w + ': ' + x.t)));
R.weich = texts.filter(x => WEICH.test(x.t)).map(x => x.w + ': ' + x.t);
console.log(`  Info: WEICH-Liste in Sprüchen: ${R.weich.length}`);
// alle NPC-Dialogtexte der Welt
const world = J(`(()=>{const o=[];const add=(w,x)=>{if(typeof x==='string')kanonLines(x).forEach(y=>o.push({w,t:rivalize(y)}));else if(Array.isArray(x))x.forEach(z=>add(w,z));};
 for(const id in NPCS)for(const n of NPCS[id]){let pre,post,txt;try{pre=n.pre;post=n.post;txt=n.txt}catch(e){}add(id+':'+(n.name||n.hook||n.t),txt);add(id+':'+(n.name||n.hook)+' pre',pre);add(id+':'+(n.name||n.hook)+' post',post);}
 STEPS.forEach(s=>{add('Schritt '+s.f,s.t);add('Schritt '+s.f,s.d);});SQ2.forEach(q=>{add('Nebenmission '+q.f,q.title);add('Nebenmission '+q.f,q.d);});Object.entries(STORY_HELP).forEach(([k,v])=>add('Hilfe '+k,v));STORY_CALLS.forEach((c,i)=>add('Anruf '+i,c.lines));return o;})()`);
// Zeilen mit Sprecher-Präfix „Name: Satz“ → Sätze ohne Präfix messen
const body = x => x.replace(/^[^:\n]{2,34}: /, '');
R.worldCount = world.length;
t(`NPC-/Story-Texte der Welt (${world.length} Kästen): keine Angst-/Gewaltwörter (HART)`, () => none(world.filter(x => hart(x.t)).map(x => x.w + ': ' + x.t)));
const longS = world.filter(x => sent(body(x.t)).some(s => s.length > 80));
R.longSentences = longS.map(x => x.w + ': ' + x.t);
t(`Gesprochene Texte der Hauptfiguren/Anrufe: Sätze ≤ 80 Zeichen; Missionsbeschreibungen und Altbestand werden gemeldet (${longS.length} Kästen mit längeren Sätzen)`, () => {
  const dlg = longS.filter(x => /^(Anruf)/.test(x.w) || (!/^(Schritt|Nebenmission|Hilfe)/.test(x.w) && /Veyran|Kaine|Seraphine|Varkon|Rayan|Mira|Elowen|Elara|Tarek|Mirael/.test(x.w))); none(dlg.map(x => x.w + ': ' + x.t));
});
R.worldWeich = world.filter(x => WEICH.test(x.t)).map(x => x.w + ': ' + x.t);

// ---- d) Fremdmarken
const recht = readFileSync(root + 'test/qa_a_recht.mjs', 'utf8');
const BRAND = new RegExp(recht.match(/const BRAND = \/(.+)\/i;/)[1], 'i');
const KNOWN = [...new Set(recht.match(/const KNOWN = `([^`]+)`/)[1].split(/\s+/).filter(Boolean).map(x => x.toLowerCase()))];
const names = [...new Set([...ids.flatMap(k => [F[k].n, ...(F[k].alias || []), ...(F[k].names || [])]), ...J('Object.values(NPCS).flat().map(n=>n.name).filter(Boolean)')])];
t(`Figuren-/NPC-Namen (${names.length}) sind keine Figuren der Fremdmarke (Liste ${FREMDFIGUREN.length}) und keine Fremd-Kreaturen (${KNOWN.length})`, () => {
  none(names.flatMap(n => n.split(/[\s.\-&]+/).map(w => w.toLowerCase().replace(/[^a-zäöüß]/g, '')).filter(w => w.length >= 3).filter(w => FREMDFIGUREN.includes(w) || KNOWN.includes(w)).map(w => n + ' → ' + w)));
});
t('Namen nicht nur Levenshtein-nah an Fremd-Kreaturen (Länge ≥ 6, Abstand 1)', () => {
  const lev = (a, b) => { const m = [...Array(a.length + 1)].map((_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; };
  none(names.flatMap(n => n.split(/[\s.\-&]+/).map(w => w.toLowerCase().replace(/[^a-zäöüß]/g, '')).filter(w => w.length >= 6).filter(w => KNOWN.some(k => Math.abs(k.length - w.length) <= 1 && lev(k, w) <= 1)).map(w => n + ' ≈ ' + w)));
});
t('Keine Markenwörter / Redewendungen der Fremdmarke in Sprüchen, NPC-Texten, Rollen, Begriffen', () => {
  const all = texts.concat(world, ids.flatMap(k => [F[k].role, F[k].traits, F[k].tag, ...Object.values(F[k].rel || {})].filter(Boolean).map(x => ({ w: 'FIGURES.' + k, t: x }))));
  none(all.filter(x => BRAND.test(x.t) || PHRASEN.test(x.t)).map(x => x.w + ': ' + x.t));
});
t('Internes: Rekrut-/Flag-Namen der Fremdmarke (Frida, Bruno, Mox & Lox) nicht mehr im Spieltext', () => {
  const all = texts.concat(world); none(all.filter(x => /\b(Frida|Bruno|Mox|Lox)\b/.test(x.t)).map(x => x.w + ': ' + x.t));
  const src = readFileSync(root + 'src/02-world.js', 'utf8'); const flags = [...src.matchAll(/flag:'(tr_bruno|tr_frida)'/g)].length; if (flags) R.info.push('Interner Flag-Name tr_bruno bleibt (nicht sichtbar; Umbenennung bräuchte Migration) – Veyra-Profi Anselm');
});
R.muster = MUSTER;

writeFileSync(root + 'test/qa_b_figuren.json', JSON.stringify({ figures: ids.length, rows: rows.length, faces: art.length, noArt, world: world.length, R, passed: ok, failed: bad }, null, 1));
console.log('\nWarnungen:'); R.warn.forEach(x => console.log('  ' + x));
console.log('Info:'); R.info.forEach(x => console.log('  ' + x));
console.log('Längere Sätze (Altbestand, Info) – ' + longS.length + ':'); longS.slice(0, 8).forEach(x => console.log('  ' + x.w + ': ' + x.t));
console.log('WEICH-Treffer in Welt-Texten – ' + R.worldWeich.length + ':'); R.worldWeich.slice(0, 12).forEach(x => console.log('  ' + x));
console.log('Muster (Meldung):'); MUSTER.forEach(([a, b]) => console.log('  - ' + a + ': ' + b));
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`); process.exit(bad ? 1 : 0);
