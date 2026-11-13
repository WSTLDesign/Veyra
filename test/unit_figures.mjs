// Loop B1 Figuren – Unit-Test ohne Browser (VM wie tools/balance.mjs):   node test/unit_figures.mjs
// Kanon-IDs der Teams, Sprüche je Situation, Elemente der Arenaleiter/Turmhüter, Rivalen-Starter-Regel, Namenssuche, NPC-Bausteine, Begriffe für B2,
// Spielstand-Migration (G.figs, outfit.body), Markenwörter/Fremdnamen (Wortlisten aus test/qa_a_recht.mjs), Intro-Sätze ≤ 2 Zeilen.
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync } from 'fs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
const none = (arr, m) => { if (arr.length) throw new Error((m || '') + ' ' + arr.slice(0, 12).join(' | ') + (arr.length > 12 ? ' …(' + arr.length + ')' : '')); };
const F = J('FIGURES'), ids = Object.keys(F), SITS = ['gruss', 'kampf', 'sieg', 'niederlage', 'alltag'];
const MON = J('MONS.map(M=>M?{n:M.n,t:M.t,ev:M.ev||null}:null)');

t(`Kanon vollständig (${ids.length} Figuren): Held/Heldin, Rivalen, Mentor, 8 Arenaleiter, Turmrat, Kronenhüterin, Schattenorden`, () => {
  const need = ['held', 'heldin', 'rayan', 'mira', 'veyran', 'tarek', 'mirael', 'borwin', 'elara', 'elowen', 'kael', 'neria', 'lior', 'torvik', 'sylva', 'solan', 'nymera', 'eira',
    'brann', 'zaria', 'ondra', 'hesper', 'ardena', 'varkon', 'seraphine', 'kaine', 'lehrling', 'mama'];
  none(need.filter(k => !F[k]), 'fehlt:'); const AO = J('ARENA_ORDER'), TR = J('TURMRAT');
  if (AO.length !== 8 || new Set(AO.map(k => F[k].el)).size !== 8) throw new Error('8 Arenen mit 8 Elementen erwartet: ' + AO);
  none(AO.filter(k => !/medaille$/.test(F[k].medal || '')), 'ohne Medaille:'); if (TR.length !== 4) throw new Error('Turmrat ≠ 4');
});
t('Jede Figur (außer Spielfigur) hat ein Team aus gültigen Kanon-IDs (1–153) mit Level 2–100 und gültigem Begleiter', () => {
  const e = []; for (const k of ids) { const f = F[k]; if (f.player) continue; if (!f.team || !f.team.length) e.push(k + ':kein Team');
    for (const [s, l] of f.team || []) if (!MON[s] || s > 153 || !(l >= 2 && l <= 100)) e.push(k + ':' + s + '@' + l);
    for (const st in f.teams || {}) for (const [s, l] of f.teams[st]) if (!MON[s] || !(l >= 2 && l <= 100)) e.push(k + ':teams' + st + ':' + s);
    for (const s of f.pool || []) if (!MON[s]) e.push(k + ':pool ' + s); if (f.partner && !MON[f.partner]) e.push(k + ':partner ' + f.partner); }
  none(e);
});
t('Keine Legenden/Mythischen (140–153) in Figuren-Teams', () => none(ids.flatMap(k => (F[k].team || []).filter(([s]) => s >= 140).map(([s]) => k + ':' + s))));
t('Arenaleiter: jede Teamkreatur trägt das Element der Arena', () => none(J('ARENA_ORDER').flatMap(k => F[k].team.filter(([s]) => !MON[s].t.includes(F[k].el)).map(([s]) => k + ':' + MON[s].n))));
t('Turmrat: Teams passen zu den zwei Elementen des Saals', () => { const EL = { brann: ['glut', 'flora'], zaria: ['boe', 'volt'], ondra: ['flut', 'frost'], hesper: ['schatten', 'fels'] };
  none(Object.entries(EL).flatMap(([k, e]) => F[k].team.filter(([s]) => !MON[s].t.some(x => e.includes(x))).map(([s]) => k + ':' + MON[s].n))); });
t('Teams der Arenaleiter steigen in der Arena-Reihenfolge (Höchstlevel)', () => { const L = J('ARENA_ORDER').map(k => Math.max(...F[k].team.map(x => x[1]))); for (let i = 1; i < L.length; i++) if (L[i] <= L[i - 1]) throw new Error(L.join(',')); });
t('Sprüche: jede Figur 3–5 je Situation (Begrüßung, vor Kampf, Sieg, Niederlage, Alltag), kurz (≤ 62 Zeichen)', () => {
  const e = []; for (const k of ids) for (const s of SITS) { const L = (F[k].lines || {})[s] || []; if (L.length < 3 || L.length > 5) e.push(k + '.' + s + ':' + L.length); for (const l of L) if (!l.trim() || l.length > 62) e.push(k + '.' + s + ': „' + l + '“'); }
  none(e);
});
t('Aussehen: jede Figur hat look mit Haut, Haar, Oberteil und gültigem Körperbau', () => { const B = J('Object.keys(FIG_BUILD)'); none(ids.filter(k => { const L = F[k].look; return !L || !L.skin || !L.hair || !L.hairCol || !L.top || !B.includes(L.build); })); });
t('Beziehungen verweisen auf vorhandene Figuren', () => none(ids.flatMap(k => Object.keys(F[k].rel || {}).filter(r => !F[r]).map(r => k + '→' + r))));
// ---- Recht: Markenwörter + Fremdnamen (Wortlisten aus test/qa_a_recht.mjs)
const recht = readFileSync(new URL('./qa_a_recht.mjs', import.meta.url), 'utf8');
const BRAND = new RegExp(recht.match(/const BRAND = \/(.+)\/i;/)[1], 'i');
const KNOWN = [...new Set(recht.match(/const KNOWN = `([^`]+)`/)[1].split(/\s+/).filter(Boolean).map(x => x.toLowerCase()))];
const lev = (a, b) => { const m = [...Array(a.length + 1)].map((_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; };
const allText = ids.flatMap(k => { const f = F[k]; return [f.n, f.role, f.tag, f.traits, f.ort, ...(f.alias || []), ...(f.names || []), ...SITS.flatMap(s => f.lines[s] || []), ...Object.values(f.rel || {})]; }).filter(Boolean)
  .concat(Object.values(J('FIGURES.terms')), Object.values(J('FIG_TERMS')));
t(`Keine Markenwörter in Figuren-Texten und in 08/23/34 (Liste qa_a_recht, ${KNOWN.length} Fremdnamen)`, () => {
  const src = ['08-gfx.js', '23-intro.js', '34-figures.js'].flatMap(f => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8').split('\n').map((l, i) => [f + ':' + (i + 1), l]));
  none(allText.filter(x => BRAND.test(x)).concat(src.filter(([, l]) => BRAND.test(l)).map(([w]) => w)));
});
t('Figurennamen sind keine (fast) gleichen Fremd-Kreaturennamen', () => none(ids.flatMap(k => [F[k].n, ...(F[k].names || [])]).flatMap(n => n.split(/[\s.]+/)).filter(w => w.length >= 4)
  .map(w => w.toLowerCase()).filter(w => KNOWN.includes(w) || (w.length >= 6 && KNOWN.some(x => Math.abs(x.length - w.length) <= 1 && lev(x, w) <= 1)))));
t('Kein Fremd-Jargon in Figuren-Texten (Top Vier, Ass-Trainer, Champion, Orden-Abzeichen)', () => none(allText.filter(x => /Top[- ]Vier|Top-Drei|Ass-Trainer|\bChampion|Elite|Arenaorden/i.test(x))));
t('Eigene Begriffe für B2 (FIGURES.terms) vollständig und nicht aufzählbar', () => { const T = J('FIGURES.terms'); none(['elite', 'eliteOne', 'ace', 'champ', 'champTitle', 'champLong', 'order', 'orderNew'].filter(k => !T[k]));
  if (run("Object.keys(FIGURES).includes('terms')")) throw new Error('terms aufzählbar'); if (T.elite !== 'Turmrat' || T.ace !== 'Veyra-Profi') throw new Error(JSON.stringify(T)); });
t('figTerms ersetzt alte Begriffe', () => { const r = run("figTerms('Besiege die Top Vier und den Champion! Ass-Trainer Bruno wartet.')"); if (/Top|Champion|Ass/.test(r) || !/Turmrat/.test(r)) throw new Error(r); });
// ---- Rivalen
t('Rivalen-Starter (Element-Regel): Rayan nimmt das starke, Mira das schwache Element', () => { const r = J('[1,4,7].map(p=>{const x=rivalStartersFig(p);return[p,x.rayan.starter,x.mira.starter]})');
  if (JSON.stringify(r) !== '[[1,4,7],[4,7,1],[7,1,4]]') throw new Error(JSON.stringify(r)); });
t('Altregel rivalStarters (Migration alter Spielstände) bleibt unverändert', () => { const r = J('[1,4,7].map(p=>{const x=rivalStarters(p);return[p,x.rayan.starter,x.mira.starter]})'); if (JSON.stringify(r) !== '[[1,7,4],[4,1,7],[7,1,4]]') throw new Error(JSON.stringify(r)); });
t('Starterwahl im Labor (caught) setzt Rivalen nach Element-Regel', () => { const r = J("(()=>{G=freshG({});migrateSave(G);G.team.push(mk(1,5));caught(1);return[G.starter,G.rivals.rayan.starter,G.rivals.mira.starter]})()"); if (r.join() !== '1,4,7') throw new Error(r); });
t('rivalTeam: Stufe 0–8 gültig, wächst, Starter-Linie entwickelt sich', () => { const r = J("(()=>{G.rivals={rayan:{starter:4},mira:{starter:7}};return['rayan','mira'].map(w=>[0,4,8].map(s=>rivalTeam(w,s)))})()");
  for (const T of r) { if (T[0].length !== 1 || T[2].length !== 5 || T[2][0][1] <= T[0][0][1]) throw new Error(JSON.stringify(T)); for (const S of T) for (const [s] of S) if (!MON[s]) throw new Error(s); }
  if (r[0][2][0][0] !== 6 || r[1][2][0][0] !== 9) throw new Error('Endstufe: ' + r[0][2][0][0] + '/' + r[1][2][0][0]); });
t('figTeam(id,{lv}) verschiebt Level, Kopie ändert Kanon nicht', () => { const r = J("(()=>{const a=figTeam('kael',{lv:40});a[0][1]=1;return[a,FIGURES.kael.team]})()"); if (Math.max(...r[0].slice(1).map(x => x[1])) !== 40 || r[1][0][1] === 1) throw new Error(JSON.stringify(r)); });
// ---- Namen, NPC, Porträt-Logik
t('figByName: Titel/Aliasse/alte Namen', () => { const r = J("['Arenaleiter Kael','Professor Veyran','Prof. Lindqvist','Ordensrekrut Knut','Eira','Lord Varkon','Händler Borwin','Heilerin Mirael','Rivalin Mira','Rivale Rayan','Turmhüterin Zaria','Kronenhüterin Ardena','Unbekannt'].map(n=>{const f=figByName(n);return f?f.id:null})");
  const e = ['kael', 'veyran', 'veyran', 'lehrling', 'eira', 'varkon', 'borwin', 'mirael', 'mira', 'rayan', 'zaria', 'ardena', null]; if (JSON.stringify(r) !== JSON.stringify(e)) throw new Error(JSON.stringify(r)); });
t('Alle fig-Schlüssel in NPCS (02-world, B2) werden aufgelöst', () => none(J("Object.values(NPCS).flat().filter(n=>n&&n.fig&&!figKey(n.fig)).map(n=>n.fig+'('+(n.name||'')+')')")));
t('figNpc: Trainer mit Team, wechselnde Sprüche mit Namen, Look', () => { const r = J("(()=>{const n=figNpc('neria',{x:1,y:2,flag:'t'});return{t:n.t,team:n.team,pre:n.pre,post:n.post,c:n.c,name:n.name,look:!!figLookOf(n)}})()");
  if (r.t !== 'trainer' || !r.team.length || !/^Arenaleiterin Neria: /.test(r.pre) || !/^Arenaleiterin Neria: /.test(r.post) || !r.look) throw new Error(JSON.stringify(r)); });
t('figNpc: selbst gesetztes pre bleibt erhalten; talk-NPC bekommt Begrüßung/Alltag', () => { const r = J("(()=>{const a=figNpc('kael',{pre:'Eigen'}),b=figNpc('mirael',{t:'talk'});return[a.pre,b.txt[0]]})()"); if (r[0] !== 'Eigen' || !/^Mirael: /.test(r[1])) throw new Error(JSON.stringify(r)); });
t('figLine ersetzt Platzhalter ({name}, {partner}, {mon})', () => { const r = J("(()=>{G.name='Lio';G.team=[mk(7,5)];G.rivals={rayan:{starter:4},mira:{starter:1}};return[figLine('held','kampf',0),figLine('rayan','kampf',1),figLine('veyran','gruss',2)]})()");
  if (r[0] !== 'Los, Knospi! Wir schaffen das!' || r[1] !== 'Mein Plippi ist heute richtig heiß!' || !/Blättchen/.test(r[2])) throw new Error(JSON.stringify(r)); });
t('Ausdruck aus Spruch-Situation und Text', () => { const r = J("[figExprFor('Kael: Spürst du die Hitze? Los geht’s!'),figExprFor('Kael: Willkommen in Flammenkrone!'),figExprFor('Hm … wirklich?'),figExprFor('Na gut.')]"); if (r.join() !== 'entschlossen,freudig,nachdenklich,neutral') throw new Error(r); });
t('Porträt-Bildschlüssel: Ausdruck mit Rückfallkette (ART_SRC[<art>_face_<ausdruck>])', () => { const r = J("(()=>{const w0=window;window={ART_SRC:{kael_face_neutral:'x',kael_face_entschlossen:'y','001':'z'}};try{return[figHasArt('kael'),figFaceKey('kael','stolz'),figFaceKey('kael','ernst'),figHasArt('rayan'),figFaceKey('rayan','freudig')]}finally{window=w0}})()");
  if (JSON.stringify(r) !== '[true,"kael_face_neutral","kael_face_entschlossen",false,null]') throw new Error(JSON.stringify(r)); });
t('heroLook: Held/Heldin aus G.outfit, alte Outfits bleiben gültig', () => { const r = J("[heroLook({body:'held'}).hair,heroLook({body:'heldin',top:'#2f6fb0'}).brimCol,heroLook({hair:'kurz',top:'#e8623a'}).top,heroLook(null).hat]"); if (r.join() !== 'wuschel,#2f6fb0,#e8623a,brille') throw new Error(r); });
t('3D-Outfit aus Figuren-Look (person3d-Felder)', () => { const r = J("figOutfit3d(FIGURES.mira.look)"); if (r.hair !== 'zopf' || r.cap || r.top !== '#2f6fd0') throw new Error(JSON.stringify(r)); });
// ---- Spielstand
t('Migration: alter Spielstand bekommt G.figs + outfit.body (zopf → heldin), idempotent', () => { const r = J("(()=>{const g={map:'route1',team:[{s:1,l:5,xp:125,hp:20,moves:[],known:[]}],box:[],bag:{},flags:{starter:1},dex:{seen:{},caught:{}},outfit:{hair:'zopf',top:'#e8623a'},ver:3};migrateSave(g);const a=JSON.stringify(g);migrateSave(g);return{f:g.figs,b:g.outfit.body,same:a===JSON.stringify(g)}})()");
  if (JSON.stringify(r.f) !== '{"met":{},"bond":{}}' || r.b !== 'heldin' || !r.same) throw new Error(JSON.stringify(r)); });
t('Migration: Spielstand ohne outfit bleibt ohne outfit, kaputtes figs wird repariert', () => { const r = J("(()=>{const g={map:'route1',team:[],box:[],bag:{},flags:{},dex:{seen:{},caught:{}},figs:'x'};migrateSave(g);return[g.outfit===undefined,typeof g.figs.met]})()"); if (r.join() !== 'true,object') throw new Error(r); });
t('figMeet/figMet/figBond schreiben nur G.figs', () => { const r = J("(()=>{G=freshG({});migrateSave(G);figMeet('kael');figMeet('gibtsnicht');figBond('kael',30);figBond('kael',90);return[figMet('kael'),figMet('mira'),G.figs.bond.kael,Object.keys(G.figs.met)]})()"); if (JSON.stringify(r) !== '[true,false,100,["kael"]]') throw new Error(JSON.stringify(r)); });
// ---- Intro-Texte: kurze Sätze, je Kasten ≤ 2 Zeilen (≈ 84 Zeichen bei 560 px), nur eigene Begriffe
t('Intro: alle Sätze ≤ 84 Zeichen, eigene Begriffe (Chronik, Fangkapsel, Kreaturenstation, Lehr-Kristall)', () => {
  const src = readFileSync(new URL('../src/23-intro.js', import.meta.url), 'utf8'), L = [...src.matchAll(/line\('(\w+)','([^']+)'/g)].map(m => m[2]);
  if (L.length < 25) throw new Error('nur ' + L.length + ' Sätze'); none(L.filter(l => l.replace(/\{\w+\}/g, 'Xxxxxxxx').length > 84), 'zu lang:');
  for (const w of ['Chronik', 'Fangkapsel', 'Kreaturenstation', 'Lehr-Kristall']) if (!L.some(l => l.includes(w))) throw new Error('fehlt: ' + w);
  none(L.filter(l => /Pok|Ball\b|Trainer|Top Vier|Champion|Heilzentrum/i.test(l)));
});
console.log(`\nunit_figures: ${ok} ✓, ${bad} ✗`);
process.exit(bad ? 1 : 0);
