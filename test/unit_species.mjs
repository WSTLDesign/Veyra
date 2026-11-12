// Unit-Tests Dex-Kanon (Agent A1): node test/unit_species.mjs – prüft alle Arten 001–153 ohne Browser
import { loadVeyra } from '../tools/balance.mjs';
import { readdirSync, statSync, existsSync } from 'fs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const list = (a, m) => { if (a.length) throw new Error((m || '') + a.slice(0, 12).join(' | ') + (a.length > 12 ? ' … (' + a.length + ')' : '')); };
const D = JSON.parse(run(`JSON.stringify({M:MONS.slice(1).map((M,i)=>Object.assign({id:i+1},M,{ls:M.ls,evolutions:(M.evolutions||[]).map(e=>Object.assign({},e,{res:resolveInto(e.into)}))})),
 T:Object.keys(TYPES),MV:Object.keys(MOVES),AB:Object.keys(ABIL),IT:Object.keys(ITEMS),MAP:ID_MAP,maps:Object.keys(MAPS)})`));
const M = D.M, byId = Object.fromEntries(M.map(m => [m.id, m]));
const REG = ['lichtlande', 'smaragdwald', 'flutkueste', 'glutlande', 'kristallgebirge', 'frosttundra', 'himmelsweiten', 'schattenmoor'];
const bst = m => m.b6.reduce((a, b) => a + b, 0);

t('Artenzahl: 153 (≥ 120), lückenlos 001–153', () => { if (M.length !== 153) throw new Error(M.length); list(M.filter((m, i) => !m || m.id !== i + 1).map(m => m && m.id)); });
t('Pflichtfelder je Art vollständig', () => list(M.filter(m => !(typeof m.n === 'string' && m.n && Array.isArray(m.t) && m.b && m.b.length === 4 && m.b6 && m.b6.length === 6 && m.b6.every(v => v > 0) &&
  Array.isArray(m.ls) && m.ab && typeof m.cr === 'number' && m.x > 0 && Array.isArray(m.sp) && m.sp.length >= 7 && Array.isArray(m.shinyCols) && m.d && m.habitat && m.stage >= 1)).map(m => m.id + ' ' + m.n)));
t('Namen eindeutig', () => { const seen = {}; list(M.filter(m => (seen[m.n] = (seen[m.n] || 0) + 1) > 1).map(m => m.n)); });
t('Typen gültig (1–2, aus TYPES, keine Dopplung)', () => list(M.filter(m => !(m.t.length >= 1 && m.t.length <= 2 && m.t.every(x => D.T.includes(x)) && new Set(m.t).size === m.t.length)).map(m => m.id + ' ' + m.t)));
t('Typ „Ursprung“ nur bei Mythischen', () => list(M.filter(m => m.t.includes('ursprung') && !m.myth).map(m => m.n)));
t('b passt zu b6 (KP, Ang, Ver, Ini)', () => list(M.filter(m => !(m.b[0] === m.b6[0] && m.b[1] === m.b6[1] && m.b[2] === m.b6[2] && m.b[3] === m.b6[5])).map(m => m.n)));
t('Lernliste nicht leer, Attacken existieren, Level sortiert, Start-Attacke mit Schaden ≤ L6', () => {
  const MV = run('MOVES'); list(M.filter(m => !(m.ls.length >= 4 && m.ls.every(([l, id]) => D.MV.includes(id) && l >= 1) && m.ls.every((e, i, a) => !i || a[i - 1][0] <= e[0]) && m.ls.some(([l, id]) => l <= 6 && MV[id][2] > 0))).map(m => m.id + ' ' + m.n)); });
t('Fähigkeiten gültig (ab, abilities, hiddenAbility)', () => list(M.filter(m => !(D.AB.includes(m.ab) && Array.isArray(m.abilities) && m.abilities.every(a => D.AB.includes(a)) && D.AB.includes(m.hiddenAbility))).map(m => m.n)));
t('Fangquote 1–255, Legenden ≤ 12, Mythische ≤ 8', () => list(M.filter(m => !(m.cr >= 1 && m.cr <= 255 && (!m.legend || m.cr <= 12) && (!m.myth || m.cr <= 8))).map(m => m.n + ':' + m.cr)));
t('Habitat: Region aus WELT-KANON, Orte, Zeit day/night, Methode', () => list(M.filter(m => { const h = m.habitat; return !(REG.includes(h.region) && h.zones.length && h.time.length && h.time.every(x => x === 'day' || x === 'night') && typeof h.method === 'string'); }).map(m => m.n)));
t('Jede Region hat ≥ 6 Arten', () => { const c = {}; M.forEach(m => c[m.habitat.region] = (c[m.habitat.region] || 0) + 1); list(REG.filter(r => (c[r] || 0) < 6).map(r => r + ':' + (c[r] || 0))); });
t('Evolutionsziele existieren (ev + evolutions)', () => list(M.flatMap(m => [...(m.ev ? [m.ev.to] : []).filter(x => !byId[x]).map(x => m.n + '→' + x), ...m.evolutions.filter(e => !e.res).map(e => m.n + '→' + e.into)])));
t('Level-Entwicklung: Ziel ist nächste Stufe, Level 10–45', () => list(M.filter(m => m.ev && !(byId[m.ev.to].stage === m.stage + 1 && m.ev.l >= 10 && m.ev.l <= 45)).map(m => m.n)));
t('Jede mehrstufige Linie ist per Level erreichbar (Kanon-Linien)', () => list(M.filter(m => m.stage > 1 && !M.some(p => p.ev && p.ev.to === m.id) && m.id <= 107).map(m => m.n)));
t('BST-Monotonie je Entwicklung (ev und Sonderwege)', () => list(M.flatMap(m => [...(m.ev ? [m.ev.to] : []), ...m.evolutions.map(e => e.res)].filter(x => x && bst(byId[x]) <= bst(m)).map(x => m.n + '→' + byId[x].n))));
t('BST-Rahmen: Stufe 1 ≤ 340, Legenden 570–590, Mythische 590–610', () => list(M.filter(m => (m.stage === 1 && m.ev && bst(m) > 340) || (m.legend && !m.myth && (bst(m) < 570 || bst(m) > 590)) || (m.myth && (bst(m) < 590 || bst(m) > 610))).map(m => m.n + ':' + bst(m))));
t('Legenden 140–149 legend, Mythische 150–153 myth', () => { list(M.filter(m => (m.id >= 140 && m.id <= 149) !== (!!m.legend && !m.myth)).filter(m => !(m.id >= 150)).map(m => m.n)); list(M.filter(m => (m.id >= 150) !== !!m.myth).map(m => m.n)); });
t('Legenden/Mythische: Signatur-Attacke in der Lernliste (ab L40) und Signatur-Fähigkeit', () => {
  const SIG = { 140: 'sternenregen', 141: 'gezeitenwoge', 142: 'phoenixglut', 143: 'lebensbluete', 144: 'sturmschwinge', 145: 'kristallbrecher', 146: 'polarschein', 147: 'mondschleier', 148: 'waldkrone', 149: 'greifenlicht', 150: 'urlicht', 151: 'urzeitbeben', 152: 'sonnenthron', 153: 'eklipse' };
  const AB = { 140: 'sternenwacht', 141: 'gezeitenwacht', 142: 'glutwiege', 143: 'lebenshauch', 144: 'sturmhueter', 145: 'kristallwall', 146: 'firnkrone', 147: 'sternenschleier', 148: 'waldsaat', 149: 'lichtwind', 150: 'gleichgewicht', 151: 'urwuchs', 152: 'ewigeslicht', 153: 'zwielicht' };
  list(Object.keys(SIG).filter(id => !(byId[id].ls.some(([l, mv]) => mv === SIG[id] && l === 40) && byId[id].ab === AB[id])).map(id => byId[id].n)); });
t('Nutzer-Kanon-Namen an ihren Nummern', () => {
  const K = { 1: 'Funki', 2: 'Loddo', 3: 'Flammel', 4: 'Plippi', 5: 'Wabbel', 6: 'Aquilo', 7: 'Knospi', 8: 'Rankel', 9: 'Blühro', 10: 'Krumo', 11: 'Dornox', 12: 'Granthor', 13: 'Aschi', 14: 'Kohlo', 15: 'Brandor', 16: 'Molli', 17: 'Blubbo', 18: 'Strömi',
    19: 'Fipsa', 20: 'Blattin', 21: 'Kronella', 22: 'Kiesel', 23: 'Brummit', 24: 'Basalor', 25: 'Pusti', 26: 'Wirbel', 27: 'Sturmilo', 28: 'Lumli', 29: 'Glimma', 30: 'Solaro', 31: 'Dumbi', 32: 'Noxli', 33: 'Mondoro', 34: 'Zischi', 35: 'Funaro', 36: 'Vulkanjo',
    37: 'Muschel', 38: 'Perlo', 39: 'Korallux', 40: 'Tilli', 41: 'Sonnblatt', 42: 'Floralis', 43: 'Flitzi', 44: 'Federel', 45: 'Himmora', 46: 'Mumpi', 47: 'Nebbel', 48: 'Dämmerin', 49: 'Knister', 51: 'Funkoro', 52: 'Glibbi', 53: 'Quallio', 54: 'Lumedusa',
    55: 'Wurzel', 56: 'Wurzelin', 57: 'Knackel', 58: 'Brocken', 59: 'Flausch', 60: 'Wolkito', 61: 'Blinki', 62: 'Strahli', 63: 'Schumi', 64: 'Düstro', 66: 'Aquakrist', 68: 'Kristallux', 69: 'Federling', 71: 'Auregrif', 72: 'Knips', 73: 'Blitzmähne', 74: 'Blitzahn',
    75: 'Frosti', 76: 'Glazirr', 77: 'Kristallo', 78: 'Plitschi', 80: 'Ozeano', 81: 'Krabbi', 83: 'Krystak', 84: 'Axelli', 86: 'Lumaxel', 87: 'Eulumi', 89: 'Waldorakel', 108: 'Glimmo', 109: 'Feuerblatt', 110: 'Sprudel',
    140: 'Lunaris', 141: 'Thalor', 142: 'Ignivar', 143: 'Sylvaris', 144: 'Aetherion', 145: 'Crystalon', 147: 'Noctyra', 148: 'Floravon', 149: 'Aureon', 150: 'Auralis', 151: 'Terravon', 152: 'Solaryx', 153: 'Umbryx' };
  list(Object.entries(K).filter(([id, n]) => byId[id].n !== n).map(([id, n]) => id + ':' + byId[id].n + '≠' + n)); });
t('Gesperrte/entfallene Namen kommen nicht vor (Sylvarok, Aurelion, Solaryn, Kristallin, zweites „Wirbel“, Mooslein)', () => list(M.filter(m => ['Sylvarok', 'Aurelion', 'Solaryn', 'Kristallin', 'Mooslein'].includes(m.n) || (m.n === 'Wirbel' && m.id !== 26)).map(m => m.n)));
// Bilder: jede Art mit art-Key hat eine nicht-leere Datei, jede Zahl-Datei gehört zu genau der Art mit diesem Key
const ART = new URL('../public/art/', import.meta.url);
t('Bild vorhanden wo erwartet (art-Key → public/art/<key>.webp, nicht leer)', () => list(M.filter(m => m.art && !(existsSync(new URL(m.art + '.webp', ART)) && statSync(new URL(m.art + '.webp', ART)).size > 1000)).map(m => m.n)));
t('Alle Zahl-Bilder in public/art passen zu Kanon-ID und art-Key', () => { const fs = readdirSync(ART).filter(f => /^\d/.test(f)); list(fs.filter(f => { const id = +f.split('_')[0], m = byId[id]; return !m || m.art + '.webp' !== f; })); if (fs.length < 100) throw new Error('nur ' + fs.length); });
t('Kanon-Bildliste: 001–098 (ohne 002/003/005/006/058/060/062) + 140–153 haben Bilder', () => {
  const need = []; for (let i = 1; i <= 98; i++) if (![2, 3, 5, 6, 58, 60, 62].includes(i)) need.push(i); for (let i = 140; i <= 153; i++) need.push(i);
  list(need.filter(i => !byId[i].art).map(i => byId[i].n)); });
// Migration
t('ID_MAP: alte IDs 1–41 → existierende Kanon-IDs, eindeutig', () => { const v = Object.values(D.MAP); if (Object.keys(D.MAP).length !== 41 || new Set(v).size !== 41) throw new Error('nicht eindeutig'); list(v.filter(x => !byId[x]).map(String)); });
t('migrateSave: alter Spielstand → Kanon (Team, Box, Dex, Glanz-Serie), idempotent', () => {
  const r = JSON.parse(run(`(()=>{const g={map:'route1',team:[{s:10,l:12,xp:1728,hp:20,moves:[],known:[]},{s:41,l:40,xp:64000,hp:90,moves:[],known:[]}],box:[{s:28,l:45,xp:91125,hp:100,moves:[],known:[]}],bag:{},flags:{starter:1},
   dex:{seen:{1:1,10:1,41:1,28:1},caught:{10:1,41:1}},shinyChain:{s:31,n:4}};migrateSave(g);const a=JSON.stringify(g);migrateSave(g);return JSON.stringify({t:g.team.map(m=>m.s),b:boxAll(g).map(m=>m.s),seen:Object.keys(g.dex.seen).map(Number).sort((a,b)=>a-b),caught:Object.keys(g.dex.caught).map(Number).sort((a,b)=>a-b),sc:g.shinyChain.s,same:a===JSON.stringify(g),k:g.dexKanon,riv:g.rivals})})()`));
  if (r.t.join() !== '59,33' || r.b.join() !== '142' || r.seen.join() !== '1,33,59,142' || r.caught.join() !== '33,59' || r.sc !== 25 || !r.same || r.k !== 1) throw new Error(JSON.stringify(r)); });
t('Neuer Spielstand wird nicht umgemappt (freshG trägt dexKanon)', () => { const r = JSON.parse(run(`(()=>{const g=freshG({});g.team.push(mk(10,5));migrateSave(g);return JSON.stringify([g.team[0].s,g.dexKanon])})()`)); if (r[0] !== 10 || r[1] !== 1) throw new Error(JSON.stringify(r)); });
t('Rivalen: Spieler wählt, Rayan & Mira nehmen die anderen beiden (Rayan bevorzugt Glut, Mira Flut)', () => {
  const r = JSON.parse(run(`JSON.stringify([1,4,7].map(p=>{const x=rivalStarters(p);return[p,x.rayan.starter,x.mira.starter]}))`));
  if (JSON.stringify(r) !== '[[1,7,4],[4,1,7],[7,1,4]]') throw new Error(JSON.stringify(r)); });
t('Begegnungen (MAPS.enc) und Trainer-Teams nutzen nur existierende Arten', () => { const bad = JSON.parse(run(`JSON.stringify((()=>{const o=[];for(const id in MAPS){const e=MAPS[id].enc;if(e)for(const k in e)for(const r of e[k])if(!MONS[r[0]])o.push(id+':'+r[0]);}
  for(const id in NPCS)for(const n of NPCS[id]){if(n.team)for(const[s]of n.team)if(!MONS[s])o.push(id+':'+n.name+':'+s);if(n.mon&&!MONS[n.mon])o.push(id+':'+n.mon);}return o;})())`)); list(bad); });
t('Intro-Legenden-Trio = Ignivar/Thalor/Aetherion; Starter 1/4/7 im Labor', () => { const r = JSON.parse(run(`JSON.stringify([NPCS.labor.filter(n=>n.t==='starter').map(n=>n.mon),[MONS[142].n,MONS[141].n,MONS[144].n]])`)); if (r[0].join() !== '1,4,7' || r[1].join() !== 'Ignivar,Thalor,Aetherion') throw new Error(JSON.stringify(r)); });
// Signatur-Fähigkeiten wirken (Kampfkern)
run(`SET.diff='normal';G=freshG({});G.time=12*60;cur={id:'route1',theme:'meadow'};
globalThis.fx=function(s,l,ab){const m=mk(s,l);m.iv={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};m.ev={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};m.nature='ausgeglichen';m.ability=ab||MONS[s].ab;m.status=null;m.conf=0;m.heldItem=null;m.hp=stat(m,'hp');return m;};
globalThis.bb=function(me,foe){G.team=[me];const b={tr:null,foe:[foe],fi:0,mi:0,part:new Set([0]),double:false,foes:[foe],mine:[0],stm:new Map(),dead:new Set(),res:{me:0,foe:0},resOn:{},weather:null,wxT:Infinity,field:null,rt:false,sim:true};defineSt(b);B=b;return b;};`);
t('Gleichgewicht: Auralis trifft immer die Schwäche (Urlicht ×2 gegen Funki)', () => { const r = JSON.parse(run(`JSON.stringify((()=>{const a=fx(150,50),d=fx(1,50);bb(a,[d][0]);return calcDamage(a,d,'urlicht',{B,crit:false,rnd:1}).eff})())`)); if (r !== 2) throw new Error(r); });
t('Glutwiege: Ignivar steht einmal pro Kampf wieder auf', () => { const r = JSON.parse(run(`JSON.stringify((()=>{const a=fx(1,50),d=fx(142,50);bb(a,d);const x=dealDamage(B,d,99999,a);const h1=d.hp;const y=dealDamage(B,d,99999,a);return[h1>0,!!x.note,d.hp]})())`)); if (!r[0] || !r[1] || r[2] !== 0) throw new Error(JSON.stringify(r)); });
t('Wetter beim Eintritt: Thalor Regen, Aetherion Gewitter, Glacira Schnee; Floravon Blütenwiese 8 Runden', () => { const r = JSON.parse(run(`JSON.stringify([141,144,146,148].map(s=>{const a=fx(s,50);bb(a,fx(1,50));onEnter(B,a);return B.weather||(B.field&&B.field.k+B.field.turns)}))`)); if (r.join() !== 'regen,gewitter,schnee,bluete8') throw new Error(r); });
t('Kristallwall −20 %, Ewiges Licht halbiert Schatten, Zwielicht neutralisiert', () => { const r = JSON.parse(run(`JSON.stringify((()=>{const a=fx(33,50),d=fx(145,50),o=()=>({B,crit:false,rnd:1});bb(d,a);const w=calcDamage(a,d,'nachtbiss',o()).dmg;d.ability='felspanzer';const n=calcDamage(a,d,'nachtbiss',o()).dmg;
  const s=fx(152,50);bb(s,a);const e1=calcDamage(a,s,'nachtbiss',o()).dmg;s.ability='sonnenruf';const e0=calcDamage(a,s,'nachtbiss',o()).dmg;const u=fx(153,50),l=fx(29,50);bb(u,l);const z=calcDamage(u,l,'nachtbiss',o()).eff;return[w/n,e1/e0,z]})())`));
  if (Math.abs(r[0] - .8) > .05 || Math.abs(r[1] - .5) > .06 || r[2] !== 1) throw new Error(JSON.stringify(r)); });
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
if (bad) { console.log('FEHLER'); process.exit(1); } else console.log('Alle Arten-Tests grün.');
