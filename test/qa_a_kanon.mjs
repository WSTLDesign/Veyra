// QA Loop A3 – Prüfung 1: Kanon-Konsistenz (ohne Browser). Aufruf: node test/qa_a_kanon.mjs
// Prüft MONS (153 Arten) gegen docs/kreaturen-kanon.md, AGENTS.md (DEX-KANON/WELT-KANON), EVO_DEF, Habitate, alte Namen in src/.
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
const { run } = loadVeyra();
const rd = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const D = JSON.parse(run(`JSON.stringify({M:MONS.slice(1).map((M,i)=>Object.assign({id:i+1},M,{nr:dexNr(i+1)})),EVO:EVO_DEF,TC:TYPE_CHART,T:Object.keys(TYPES),MV:Object.keys(MOVES),
 MAPS:Object.keys(MAPS),INT:Object.keys(INTERIORS),
 enc:(()=>{const o={};for(const id in MAPS){const e=MAPS[id].enc;if(e)for(const k in e)for(const r of e[k]){(o[r[0]]=o[r[0]]||new Set()).add(id);}}for(const k in o)o[k]=[...o[k]];return o;})(),
 npc:(()=>{const o={};for(const id in NPCS)for(const n of NPCS[id]){const add=s=>{(o[s]=o[s]||[]).push(id+':'+(n.name||n.t));};if(n.team)for(const[s]of n.team)add(s);if(n.mon)add(n.mon);}return o;})(),
 MAP:ID_MAP})`));
const M = D.M, byId = Object.fromEntries(M.map(m => [m.id, m]));
const bst = m => m.b6.reduce((a, b) => a + b, 0);
const REG = ['lichtlande', 'smaragdwald', 'flutkueste', 'glutlande', 'kristallgebirge', 'frosttundra', 'himmelsweiten', 'schattenmoor'];
const R = []; // {k,id,msg,sev}
const F = (k, msg, sev = 'mittel') => R.push({ k, msg, sev });
const sums = {};
const C = (k, label, bad, sev = 'mittel') => { sums[k] = sums[k] || []; sums[k].push([label, bad.length]); if (bad.length) F(k, label + ': ' + bad.slice(0, 15).join(' | ') + (bad.length > 15 ? ' … (' + bad.length + ')' : ''), sev); };

// ---- 1.1 Nummern
C('nummer', 'Artenzahl = 153', M.length === 153 ? [] : ['n=' + M.length], 'hoch');
C('nummer', 'dexNr 3-stellig und = Index', M.filter(m => m.nr !== '#' + String(m.id).padStart(3, '0')).map(m => m.id), 'hoch');
C('nummer', 'Name/Typ/Werte vorhanden', M.filter(m => !m.n || !m.t || !m.b6 || m.b6.length !== 6).map(m => m.id), 'hoch');

// ---- 1.2 Namen gegen docs/kreaturen-kanon.md (001–048) + Linien + AGENTS-Lieferungen
const kan = rd('../docs/kreaturen-kanon.md');
const nameBad = [];
const exp = {};
for (const ln of kan.split('\n')) {
  const mm = ln.match(/^(\d{3})–(\d{3})\t(.+?)\t/);
  if (mm) { const a = +mm[1], b = +mm[2], names = mm[3].split('→').map(s => s.trim()); for (let i = a; i <= b; i++) exp[i] = names[i - a]; }
}
for (const [id, n] of Object.entries(exp)) if (byId[id].n !== n) nameBad.push(`${id}: ${byId[id].n} ≠ ${n}`);
C('namen', 'docs/kreaturen-kanon.md 001–048 exakt', nameBad, 'hoch');
// Linien-Namen (Abschnitte 2–4): jeder Name muss als Art-Name oder Alias vorkommen (Ausnahmen mit Begründung)
const lineNames = ['Knister', 'Funkoro', 'Quallio', 'Wurzel', 'Wurzelin', 'Knackel', 'Brocken', 'Flausch', 'Wolkito', 'Blinki', 'Strahli', 'Schumi', 'Düstro', 'Glimmo', 'Feuerblatt', 'Sprudel', 'Glibbi', 'Lumedusa', 'Aquakrist', 'Kristallux',
  'Federling', 'Auregrif', 'Knips', 'Blitzahn', 'Frosti', 'Kristallo', 'Plitschi', 'Ozeano', 'Krabbi', 'Krystak', 'Axelli', 'Lumaxel', 'Eulumi', 'Waldorakel', 'Lunaris', 'Funkel', 'Plätscha',
  'Thalor', 'Ignivar', 'Sylvaris', 'Aetherion', 'Crystalon', 'Noctyra', 'Floravon', 'Aureon', 'Auralis', 'Terravon', 'Solaryx', 'Umbryx', 'Blitzmähne', 'Glazirr'];
const have = new Set(M.flatMap(m => [m.n, m.alias].filter(Boolean)));
C('namen', 'Nutzer-Linien-Namen (Doc Abschnitt 2–4 + AGENTS) kommen vor', lineNames.filter(n => !have.has(n)));
C('namen', 'Quappi (Doc „Quappi → Quallio“) – bewusst als Dublette zu Glibbi → Quallio aufgelöst (Info)', have.has('Quappi') ? [] : [], 'info');
C('namen', 'Namen eindeutig (inkl. Aliasse)', (() => { const s = {}, o = []; M.forEach(m => [m.n, m.alias].filter(Boolean).forEach(n => { if (s[n] && s[n] !== m.id) o.push(n); s[n] = m.id; })); return o; })(), 'hoch');
C('namen', 'Namensnähe-Kollisionen (Wirbel 2×, Sylvarok, Aurelion, Solaryn, Kristallin, Mooslein)', M.filter(m => ['Sylvarok', 'Aurelion', 'Solaryn', 'Kristallin', 'Mooslein'].includes(m.n)).map(m => m.n).concat(M.filter(m => m.n === 'Wirbel' && m.id !== 26).map(m => m.id)), 'hoch');
// Nutzer-Namen der Lieferungen (verbindlich)
const LIEF = { 1: 'Funki', 4: 'Plippi', 7: 'Knospi', 66: 'Aquakrist', 68: 'Kristallux', 55: 'Wurzel', 56: 'Wurzelin', 69: 'Federling', 71: 'Auregrif', 72: 'Knips', 73: 'Blitzmähne', 74: 'Blitzahn', 75: 'Frosti', 76: 'Glazirr', 77: 'Kristallo', 78: 'Plitschi', 80: 'Ozeano', 81: 'Krabbi', 83: 'Krystak', 84: 'Axelli', 86: 'Lumaxel', 87: 'Eulumi', 89: 'Waldorakel',
  140: 'Lunaris', 141: 'Thalor', 142: 'Ignivar', 143: 'Sylvaris', 144: 'Aetherion', 145: 'Crystalon', 147: 'Noctyra', 148: 'Floravon', 149: 'Aureon', 150: 'Auralis', 151: 'Terravon', 152: 'Solaryx', 153: 'Umbryx' };
C('namen', 'Nutzer-Namen der AGENTS-Lieferungen an Kanon-Nummer', Object.entries(LIEF).filter(([i, n]) => byId[i].n !== n).map(([i, n]) => i + ':' + byId[i].n), 'hoch');

// ---- 1.3 Typen gegen Doc-/AGENTS-Erwartung (Haupttyp je Linie + Endtyp)
const TX = { 1: 'glut', 4: 'flut', 7: 'flora', 10: 'fels', 13: 'glut', 16: 'flut', 19: 'flora', 22: 'fels', 25: 'boe', 28: 'lumen', 31: 'schatten', 34: 'glut', 37: 'flut', 40: 'flora', 43: 'boe', 46: 'flut', 49: 'glut', 52: 'flut', 55: 'flora', 57: 'fels', 59: 'boe', 61: 'lumen', 63: 'schatten', 66: 'flut', 69: 'boe', 72: 'volt', 75: 'frost', 78: 'flut', 81: 'fels', 84: 'flut', 87: 'flora', 90: 'flora', 93: 'flut', 96: 'flora', 99: 'flut', 102: 'schatten', 105: 'flora', 108: 'glut', 110: 'flut',
  140: 'lumen', 141: 'flut', 142: 'glut', 143: 'flora', 144: 'boe', 145: 'fels', 146: 'frost', 147: 'schatten', 148: 'flora', 149: 'boe', 150: 'ursprung', 151: 'fels', 152: 'lumen', 153: 'schatten' };
C('typen', 'Haupttyp je Linie laut Kanon (Stufe 1 / Legende)', Object.entries(TX).filter(([i, t]) => byId[i].t[0] !== t).map(([i, t]) => i + ':' + byId[i].t.join('/') + '≠' + t), 'hoch');
const TEND = { 3: 'glut', 6: 'flut', 9: 'flora', 12: 'frost', 15: 'glut', 18: 'boe', 30: 'glut', 33: 'lumen', 36: 'fels', 39: 'fels', 42: 'fels', 45: 'lumen', 48: 'flora', 51: 'fels', 54: 'lumen', 65: 'lumen', 68: 'fels', 71: 'lumen', 74: 'boe', 77: 'boe', 80: 'flora', 83: 'glut', 86: 'lumen', 89: 'boe', 101: 'lumen', 104: 'fels', 107: 'lumen', 149: 'lumen', 151: 'flora', 152: 'ursprung', 153: 'ursprung' };
C('typen', 'Zweittyp/Endstufe laut AGENTS-Lieferungen enthalten', Object.entries(TEND).filter(([i, t]) => !byId[i].t.includes(t)).map(([i, t]) => i + ':' + byId[i].t.join('/') + '∌' + t), 'mittel');
C('typen', 'Ursprung kampfneutral (TYPE_CHART ursprung als Angreifer/Verteidiger 1×)', (() => { const o = []; for (const t of D.T) { if (D.TC.ursprung && D.TC.ursprung[t] !== undefined && D.TC.ursprung[t] !== 1) o.push('ursprung→' + t + '=' + D.TC.ursprung[t]); if (D.TC[t] && D.TC[t].ursprung !== undefined && D.TC[t].ursprung !== 1) o.push(t + '→ursprung=' + D.TC[t].ursprung); } return o; })(), 'hoch');

// ---- 1.4 Werte
const stageRange = { 1: [280, 335], 2: [400, 440], 3: [515, 545] };
C('werte', 'BST je Stufe plausibel (Linien: 1/3→280–335, 2/3→400–440, 3/3→515–545; 2-stufige: 1/2 ≤ 335, 2/2 400–500)', M.filter(m => m.id <= 138 && !(m.id >= 120 && m.id <= 124)).filter(m => {
  const lt = m.habitat && m.stage; const total = (() => { let s = 1, p = M.find(x => x.ev && x.ev.to === m.id); const chainTop = (x) => { let n = 1, c = x; while (c.ev) { c = byId[c.ev.to]; n++; } return n; }; return 0; })();
  const b = bst(m); if (m.stage === 1) return b < 280 || b > 335; const root = (() => { let c = m, g = 0; while (true) { const p = M.find(x => x.ev && x.ev.to === c.id); if (!p) return c; c = p; if (++g > 5) return c; } })();
  const len = (() => { let c = root, n = 1; while (c.ev) { c = byId[c.ev.to]; n++; } return n; })();
  if (len === 3) return m.stage === 2 ? (b < 400 || b > 440) : (b < 515 || b > 545);
  return m.stage === 2 ? (b < 440 || b > 500) : false;
}).map(m => `${m.id} ${m.n} s${m.stage} bst${bst(m)}`));
C('werte', 'Legenden BST exakt 580 / Mythische 600 / myth:1 / legend:1', M.filter(m => (m.id >= 140 && m.id <= 149 && (bst(m) !== 580 || !m.legend || m.myth)) || (m.id >= 150 && (bst(m) !== 600 || !m.myth))).map(m => m.id + ' ' + m.n + ' ' + bst(m)), 'hoch');
C('werte', 'Einzelwert-Rahmen 20–160 (kein Ausreißer, keine 0)', M.filter(m => m.b6.some(v => v < 20 || v > 160)).map(m => m.id + ' ' + m.n + ' ' + m.b6), 'mittel');
C('werte', 'Entwicklungs-BST steigend (ev + evolutions)', M.flatMap(m => [...(m.ev ? [m.ev.to] : []), ...(m.evolutions || []).map(e => e.into)].filter(x => byId[x] && bst(byId[x]) <= bst(m)).map(x => m.n + '→' + byId[x].n)), 'hoch');
C('werte', 'Fangquote: Stufe 1 ≥ 100 (leicht fangbar), Legenden ≤ 12, Mythische ≤ 8', M.filter(m => (m.stage === 1 && !m.legend && m.cr < 100 && m.id <= 139 && m.ev) || (m.legend && !m.myth && m.cr > 12) || (m.myth && m.cr > 8)).map(m => m.id + ' ' + m.n + ' cr' + m.cr), 'mittel');
// Hinweis: In der VM ist THREE gestubbt → 10-mon3d.js überschreibt shinyCols der Bild-Arten mit '#0'; echte Werte prüft test/qa_a_sprites.mjs im Browser.
C('werte', 'shinyCols gültige Hex-Farben (nur Arten ohne ART_HUE-Überschreibung; VM-Stub ausgenommen)', M.filter(m => !m.art && m.id < 140 && !(m.id >= 99 && m.id <= 101)).filter(m => !Array.isArray(m.shinyCols) || m.shinyCols.length !== 3 || m.shinyCols.some(c => !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c))).map(m => m.id + ' ' + m.n + ' ' + JSON.stringify(m.shinyCols)), 'info');
C('werte', 'Beschreibung (d) 20–260 Zeichen, deutsch, nicht leer', M.filter(m => !m.d || m.d.length < 20 || m.d.length > 260).map(m => m.id + ' ' + m.n), 'niedrig');

// ---- 1.5 Lernlisten
const MVD = JSON.parse(run('JSON.stringify(MOVES)'));
const upTo40 = m => [...new Set(m.ls.filter(([l]) => l <= 40).map(([, id]) => id))];
C('lern', '≥ 4 verschiedene Attacken bis L40', M.filter(m => upTo40(m).length < 4).map(m => m.id + ' ' + m.n + ':' + upTo40(m).length), 'hoch');
C('lern', 'Attacken existieren in MOVES', M.flatMap(m => m.ls.filter(([, id]) => !MVD[id]).map(([, id]) => m.n + ':' + id)), 'hoch');
C('lern', 'Schadensattacke ≤ L6 + sortiert', M.filter(m => !m.ls.some(([l, id]) => l <= 6 && MVD[id] && MVD[id][2] > 0) || !m.ls.every((e, i, a) => !i || a[i - 1][0] <= e[0])).map(m => m.id + ' ' + m.n), 'hoch');
C('lern', 'Eigentyp-Attacke (STAB, Stärke>0) bis L40', M.filter(m => !m.ls.some(([l, id]) => l <= 40 && MVD[id] && MVD[id][2] > 0 && m.t.includes(MVD[id][1]))).map(m => m.id + ' ' + m.n + ' ' + m.t), 'mittel');
C('lern', 'Legenden/Mythische: Signatur-Attacke L40 vorhanden', M.filter(m => m.id >= 140).filter(m => !m.ls.some(([l, id]) => l === 40 && MVD[id] && !['kratzer', 'knurren'].includes(id) && /^(sternenregen|gezeitenwoge|phoenixglut|lebensbluete|sturmschwinge|kristallbrecher|polarschein|mondschleier|waldkrone|greifenlicht|urlicht|urzeitbeben|sonnenthron|eklipse)$/.test(id))).map(m => m.id + ' ' + m.n), 'hoch');
C('lern', 'Gleiche Lernliste bei Legende und Starter-Funki (Info: Legenden teilen Typ-Grundliste, kein Fehler)', [], 'info');

// ---- 1.6 Evolutionen beidseitig
const evBad = [];
for (const m of M) {
  const evs = m.evolutions || [];
  if (m.ev) { const e = evs.find(x => x.method === 'level' && x.into === m.ev.to && x.value === m.ev.l); if (!e) evBad.push(`${m.id} ev(${m.ev.l}→${m.ev.to}) fehlt in evolutions`); }
  for (const e of evs) { if (e.method === 'level') { if (!m.ev || m.ev.to !== e.into) evBad.push(`${m.id} level-evolution ohne ev`); continue; } const d = (D.EVO[m.id] || []).find(x => x.method === e.method && x.into === e.into && JSON.stringify(x.value) === JSON.stringify(e.value)); if (!d) evBad.push(`${m.id} ${e.method}→${e.into} fehlt in EVO_DEF`); }
}
for (const [from, list] of Object.entries(D.EVO)) { const m = byId[from]; if (!m) { evBad.push('EVO_DEF unbekannte Art ' + from); continue; } for (const e of list) { if (!byId[e.into]) evBad.push(`EVO_DEF ${from}→${e.into} Ziel fehlt`); if (!(m.evolutions || []).some(x => x.method === e.method && x.into === e.into)) evBad.push(`EVO_DEF ${from} ${e.method}→${e.into} fehlt in MONS.evolutions`); } }
C('evo', 'EVO_DEF ↔ MONS.evolutions/ev deckungsgleich (beide Richtungen)', evBad, 'hoch');
C('evo', 'Entwicklungs-Ziel hat höhere Stufe, kein Zyklus, Ziel ≠ Quelle', M.flatMap(m => (m.evolutions || []).filter(e => byId[e.into] && (byId[e.into].stage <= m.stage && !(byId[e.into].stage === 2 && m.stage === 1) && !(byId[e.into].stage === m.stage + 0 && false)) || e.into === m.id).map(e => `${m.n}(s${m.stage})→${byId[e.into] && byId[e.into].n}(s${byId[e.into] && byId[e.into].stage})`)), 'mittel');
C('evo', 'Jede Art mit Stufe > 1 hat einen Vorgänger (ev oder evolutions)', M.filter(m => m.stage > 1 && !M.some(p => (p.evolutions || []).some(e => e.into === m.id))).map(m => m.id + ' ' + m.n), 'hoch');
C('evo', 'Jede Linie bis zur Endstufe per Level erreichbar (Kanon-Linien 001–107; Level-Weg)', M.filter(m => m.id <= 107 && m.stage > 1 && !M.some(p => p.ev && p.ev.to === m.id)).map(m => m.id + ' ' + m.n), 'hoch');
C('evo', 'Ort-Evolutionen: Karte existiert (MAPS/INTERIORS)', Object.values(D.EVO).flat().filter(e => e.method === 'location' && !D.MAPS.includes(e.value) && !D.INT.includes(e.value)).map(e => e.value), 'mittel');
C('evo', 'Item-Evolutionen: Item existiert in ITEMS', (() => { const IT = JSON.parse(run('JSON.stringify(Object.keys(ITEMS))')); return Object.values(D.EVO).flat().flatMap(e => [e.method === 'item' ? e.value : null, e.method === 'held' ? e.value.item : null].filter(Boolean)).filter(i => !IT.includes(i)); })(), 'mittel');
C('evo', 'Attacken-Evolution: Attacke existiert', Object.values(D.EVO).flat().filter(e => e.method === 'move' && !MVD[e.value]).map(e => e.value), 'mittel');
C('evo', 'Stufenangabe stage passt zur Kette (Linie 1→2→3)', M.filter(m => m.ev && byId[m.ev.to].stage !== m.stage + 1).map(m => m.n), 'mittel');

// ---- 1.7 Habitate
const hb = [];
for (const m of M) { const h = m.habitat; if (!h || !REG.includes(h.region) || !Array.isArray(h.zones) || !h.zones.length) hb.push(m.id + ' ' + m.n + ' ' + JSON.stringify(h)); }
C('habitat', 'Jede Art hat Region (8 Regionen) + ≥ 1 Zone', hb, 'hoch');
C('habitat', 'Jede Region ≥ 6 Arten / alle 8 vertreten', (() => { const c = {}; M.forEach(m => m.habitat && (c[m.habitat.region] = (c[m.habitat.region] || 0) + 1)); return REG.filter(r => (c[r] || 0) < 6).map(r => r + ':' + (c[r] || 0)); })(), 'mittel');
// Legenden-Orte laut WELT-KANON
const LEGPLACE = { 140: ['lichtlande', 'sternenklippe'], 152: ['lichtlande', 'wolkenthron'], 150: ['lichtlande', 'aurora_tempel'], 143: ['smaragdwald', 'altwurzeltempel'], 148: ['smaragdwald', 'altwurzeltempel'], 151: ['smaragdwald', 'wandernde_insel'], 141: ['flutkueste', 'offenes_meer'], 142: ['glutlande', 'ignivar_gipfel'], 145: ['kristallgebirge', 'amethystgrotte'], 146: ['frosttundra', 'nordlichtsee'], 144: ['himmelsweiten', 'sturmklippe'], 149: ['himmelsweiten', 'himmelsfeste'], 147: ['schattenmoor', 'mondklippe'], 153: ['schattenmoor', 'schattenhain'] };
C('habitat', 'Legenden-/Mythen-Orte laut WELT-KANON', Object.entries(LEGPLACE).filter(([i, [r, z]]) => !(byId[i].habitat.region === r && byId[i].habitat.zones.includes(z))).map(([i, [r, z]]) => i + ':' + byId[i].habitat.region + '/' + byId[i].habitat.zones.join(',') + '≠' + r + '/' + z), 'hoch');
// Zonen-Namen gegen WELT-KANON (Region → gültige Orte); speciesIn()/habitatOf() liefern dieselbe Zuordnung
const ZONES = { lichtlande: 'aurenstadt sonnenfels lichtbrunn sternenplatz aurora_tempel goldbluetenpark sternenklippe wolkenthron', smaragdwald: 'wurzelheim bluetenhain lichtquell feenlichtung altwurzeltempel wandernde_insel', flutkueste: 'azurhafen muschelbucht korallenriff leuchtturmklippen perleninsel offenes_meer',
  glutlande: 'flammenkrone glutheim aschental emberklamm ignivar_gipfel', kristallgebirge: 'kristallwacht splitterdorf bergwohnviertel tiefenmine amethystgrotte varkons_festung kristallkammern', frosttundra: 'eiswacht quellental gletschergrat eishoehlen nordlichtsee',
  himmelsweiten: 'windfels wolkenruh sturmhafen himmelsbruecke adlerhorst sturmklippe himmelsfeste', schattenmoor: 'nebelholm daemmerbruch ruinen_der_alten morastplateau schattenhain mondklippe' };
const zbad = []; for (const m of M) { const h = m.habitat; if (!h) continue; for (const z of h.zones) if (!(ZONES[h.region] || '').split(' ').includes(z) && !(z === 'aurenstadt' && ['starter'].includes(h.method))) zbad.push(`${m.id} ${m.n}: ${h.region}/${z}`); }
C('habitat', 'Zonen-Namen gehören zur Region laut WELT-KANON (Starter-Ausnahme Aurenstadt)', zbad, 'mittel');
C('habitat', 'speciesIn(region) über alle 8 Regionen deckt alle 153 Arten ab (Funktion = Datenfeld)', (() => { const r = JSON.parse(run(`JSON.stringify([].concat(...${JSON.stringify(REG)}.map(r=>speciesIn(r))))`)); const set = new Set(r); return M.filter(m => !set.has(m.id)).map(m => m.id); })(), 'hoch');
// Spielbarkeit: in welchen existierenden Karten sind Arten tatsächlich begegnungsfähig?
const reach = new Set(Object.keys(D.enc).map(Number));
const evoRoot = id => { let c = byId[id], g = 0; while (g++ < 6) { const p = M.find(x => (x.evolutions || []).some(e => e.into === c.id && (e.method === 'level' || true)) && x.stage < c.stage); if (!p) break; c = p; } return c.id; };
const reachAll = new Set(reach);
M.forEach(m => { if (m.habitat && ['starter', 'geschenk', 'event'].includes(m.habitat.method)) reachAll.add(m.id); });
for (let it = 0; it < 4; it++) M.forEach(m => { if (reachAll.has(m.id)) (m.evolutions || []).forEach(e => reachAll.add(e.into)); });
const npcSet = new Set(Object.keys(D.npc).map(Number));
const unreach = M.filter(m => !m.legend && !reachAll.has(m.id) && !npcSet.has(m.id));
const legInGame = M.filter(m => m.legend).filter(m => D.enc[m.id] || D.npc[m.id]).map(m => m.id);
F('habitat', `Spielbarkeit (Info): in aktuellen Karten (MAPS.enc, Trainer-Teams, Starter/Geschenk, Entwicklung) erreichbar: ${M.length - unreach.length - M.filter(m => m.legend && !legInGame.includes(m.id)).length}/153; NICHT erreichbar (nur Habitat-Metadaten, wartet auf Loop C/D): ${unreach.length} Arten → ${unreach.map(m => m.id).join(',')}; Legenden mit Fundort im Spiel: ${legInGame.join(',') || 'keine'} von 140–153 (${M.filter(m => m.legend).length})`, 'mittel');
writeFileSync(new URL('./qa_a_unreach.json', import.meta.url), JSON.stringify({ unreachable: unreach.map(m => [m.id, m.n, m.habitat.region]), reachable: [...reachAll].sort((a, b) => a - b), legendsInGame: legInGame }, null, 0));

// ---- 1.8 Alte Namen in src/
const OLD = ['Tröpfli', 'Troepfli', 'Keimling', 'Rankora', 'Sylvarok', 'Pieplo', 'Kieselix', 'Schemmo', 'Nachtmahr', 'Leuchtling', 'Funkfell', 'Frostel', 'Solaryn', 'Nocturyx', 'Tempestar', 'Aurelion', 'Kristallin', 'Flammigel', 'Glutigel', 'Pyrostachel', 'Quellotl', 'Wogendrak', 'Gezeitendrache', 'Blümling', 'Blattlöwe', 'Florleu', 'Schildkiesel', 'Kristallpanzer', 'Bergkoloss', 'Böenwolf', 'Sonnenwelp', 'Solfuchs', 'Heliomane', 'Mondwelp', 'Lunawolf', 'Astrowolf', 'Lavadrak', 'Vulkanor', 'Muschelfürst', 'Sprößling', 'Hainschild', 'Blütenarch', 'Sternküken', 'Himmelsflug', 'Astraphönix', 'Lotusquak', 'Teichfrosch', 'Lotusfürst', 'Lavapanzer', 'Magmaritter', 'Quallino', 'Schleierqualle', 'Tiefenschleier', 'Riffel', 'Korallix', 'Zephyrit', 'Sturmwisp', 'Felsmoll', 'Granitor', 'Magmaal', 'Astramahr', 'Mooslein', 'Bergwächter'];
const hits = [];
for (const f of readdirSync(new URL('../src/', import.meta.url)).filter(f => /\.(js|html|css)$/.test(f))) {
  rd('../src/' + f).split('\n').forEach((ln, i) => { for (const n of OLD) { const re = new RegExp('(?<![A-Za-zÄÖÜäöüß])' + n + '(?![A-Za-zÄÖÜäöüß])'); if (re.test(ln) && !/^\s*(\/\/|\/\*)/.test(ln) && !/ID_MAP/.test(ln)) hits.push(`${f}:${i + 1} ${n}`); } });
}
C('altnamen', 'Alte Namen in src/ (außerhalb ID_MAP/Kommentare)', hits, 'mittel');
writeFileSync(new URL('./qa_a_kanon.json', import.meta.url), JSON.stringify({ sums, findings: R, oldNameHits: hits }, null, 1));

// ---- Ausgabe
let bad = 0;
for (const k of Object.keys(sums)) { console.log('\n## ' + k); sums[k].forEach(([l, n]) => console.log((n ? '✗' : '✓'), l, n ? '(' + n + ')' : '')); }
console.log('\n--- Befunde ---'); R.forEach(r => { console.log(`[${r.sev}] ${r.k}: ${r.msg}`); if (r.sev !== 'info') bad++; });
console.log('\nBefunde (ohne info):', bad);
