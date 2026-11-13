// Fundstücke (47-finds.js) – Lehrrollen, versteckte Wesen, Glitzer, Flags, Platzierung, Migration.   node test/unit_finds.mjs
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync } from 'fs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = c => JSON.parse(run(`JSON.stringify(${c})`));
// Dialoge/Kampf im VM abfangen
run(`globalThis.__say=[];say=function(l,cb){__say.push([].concat(l).join(' | '));cb&&cb();};globalThis.__bt=[];startBattle=function(o){__bt.push(o);};toast=function(x){__say.push('toast:'+x);};
 globalThis.newG=function(){G=freshG({});migrateSave(G);G.flags.starter=1;G.playtime=0;G.money=1000;G.team=[mk(4,3),mk(1,3)];return G;};`);
const FINDS = J(`(()=>{const o=[];for(const id in NPCS)for(const n of NPCS[id])if(n.f)o.push(Object.assign({map:id},n));return o;})()`);
const by = k => FINDS.filter(n => n.f === k);

t('Hook in 03-engine: Zeile für t:item erweitert um FINDS', () => /case 'item':[^\n]*FINDS\[n\.f\]\|\|FINDS\[n\.t\]\)\)return pickFind\(n\)/.test(readFileSync(new URL('../src/03-engine.js', import.meta.url), 'utf8')));
t('Fund-Arten auf t:item + f umgestellt (scroll/hidden/sparkle)', () => by('scroll').length >= 13 && by('hidden').length >= 12 && by('sparkle').length >= 4 && FINDS.every(n => n.t === 'item'));
t('Flags eindeutig und mit Präfix it_/sc_/hd_', () => { const F = FINDS.map(n => n.flag); if (new Set(F).size !== F.length) throw new Error('doppelt'); return FINDS.every(n => n.f === 'scroll' ? /^sc_/.test(n.flag) : n.f === 'hidden' ? /^hd_/.test(n.flag) : /^it_/.test(n.flag)); });
t('20 % der bisherigen Fundstücke sind Glitzer (it_r1, it_wk2, it_mb1, it_gs1)', () => ['it_r1', 'it_wk2', 'it_mb1', 'it_gs1'].every(f => by('sparkle').some(n => n.flag === f)));
// ---- Platzierung: begehbares Feld, frei, erreichbar (Feld-Hindernisse gelten als lösbar – nur nicht mit der eigenen Rolle)
const PL = J(`(()=>{G=freshG({});const o=[];
 for(const id in NPCS)for(const n of NPCS[id])if(n.f){const m=getMap(id),tt=tileAt(m,n.x,n.y);const own=n.f==='scroll'&&ITEMS[n.item]&&ITEMS[n.item].mv;
  const wall=c=>c===null||(SOLID.has(c)&&!(FIELD[c]&&FIELD[c].move!==own))||c==='~';const door=c=>/[0-9E]/.test(c||'');
  const others=NPCS[id].filter(q=>q!==n&&q.x===n.x&&q.y===n.y).length;
  const occ=new Set(NPCS[id].filter(q=>q.t!=='item').map(q=>q.x+','+q.y));const seen=new Set(),q=[],need=new Set();
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=m.rows[y][x];if((x===0||y===0||x===m.w-1||y===m.h-1||door(c))&&(!wall(c)||door(c))){q.push([x,y]);seen.add(x+','+y);}}
  while(q.length){const[a,b]=q.shift();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=a+dx,y=b+dy,k=x+','+y;if(seen.has(k))continue;const c=tileAt(m,x,y);if(wall(c)&&!door(c))continue;if(occ.has(k))continue;if(x===n.x&&y===n.y)continue;seen.add(k);q.push([x,y]);}}
  const reach=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((n.x+dx)+','+(n.y+dy)));o.push({map:id,flag:n.flag,tt,free:!(tt===null||SOLID.has(tt)||door(tt)||FIELD[tt]),others,reach});}return o;})()`);
t('Alle Funde auf freiem, begehbarem Feld', () => { const b = PL.filter(p => !p.free || p.others); if (b.length) throw new Error(JSON.stringify(b)); });
t('Alle Funde erreichbar (ggf. hinter Feld-Hindernis, nie hinter dem der eigenen Rolle)', () => { const b = PL.filter(p => !p.reach); if (b.length) throw new Error(JSON.stringify(b)); });
// Kein Fund versperrt einen Weg (verstecktes Wesen kehrt wieder → darf nie in einem Durchgang stehen): Erreichbares mit/ohne Fund-Feld gleich
const CUT = J(`(()=>{G=freshG({});const o=[];
 for(const id in NPCS){const L=NPCS[id].filter(n=>n.f);if(!L.length)continue;const m=getMap(id);const door=c=>/[0-9E]/.test(c||'');const wall=c=>c===null||(SOLID.has(c)&&!FIELD[c])||c==='~';
  const block=new Set(NPCS[id].filter(q=>q.t!=='item').map(q=>q.x+','+q.y));
  const bfs=extra=>{const seen=new Set(),q=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=m.rows[y][x],k=x+','+y;if((x===0||y===0||x===m.w-1||y===m.h-1||door(c))&&(!wall(c)||door(c))&&!block.has(k)&&!extra.has(k)){q.push([x,y]);seen.add(k);}}
   while(q.length){const[a,b]=q.shift();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=a+dx,y=b+dy,k=x+','+y;if(seen.has(k)||block.has(k)||extra.has(k))continue;const c=tileAt(m,x,y);if(wall(c)&&!door(c))continue;seen.add(k);q.push([x,y]);}}return seen;};
  const all=bfs(new Set());for(const n of L){const k=n.x+','+n.y,s=bfs(new Set([k]));const lost=[...all].filter(c=>c!==k&&!s.has(c));if(lost.length)o.push({map:id,flag:n.flag,lost:lost.slice(0,4)});}}return o;})()`);
t('Kein Fund versperrt einen Durchgang', () => { if (CUT.length) throw new Error(JSON.stringify(CUT)); });
// ---- Feld-Rollen in Spielreihenfolge
const ORDER = ['morgenau', 'route1', 'kupferhain', 'route2', 'nebelgrotte', 'brisenhafen', 'windkueste', 'moewenbucht', 'route3', 'frostheim', 'glutschlucht', 'route4', 'schattmoor', 'fluestertal', 'siegesstrasse'];
const at = mv => { const n = by('scroll').find(n => n.item === 'rolle_' + mv); if (!n) throw new Error('fehlt: ' + mv); return ORDER.indexOf(n.map); };
t('Rankenschnitt auf Route 1', () => at('rankenschnitt') <= ORDER.indexOf('route1'));
t('Felsschub spätestens Route 2', () => at('felsschub') <= ORDER.indexOf('route2'));
t('Leuchtfeuer vor der Nebelgrotte', () => at('leuchtfeuer') < ORDER.indexOf('nebelgrotte'));
t('Wellenritt vor der ersten Wasserroute (Windküste/Route 3)', () => at('wellenritt') < ORDER.indexOf('windkueste'));
t('Eisbrücke vor Frostheim', () => at('eisbruecke') < ORDER.indexOf('frostheim'));
t('Sturmflügel spätestens Frostheim (vor Kristallgebirge/Himmelsweiten)', () => at('sturmfluegel') <= ORDER.indexOf('frostheim'));
t('Kletterkralle vor der Glutschlucht (Felswände)', () => at('kletterkralle') < ORDER.indexOf('glutschlucht'));
t('6 Kampf-Rollen verteilt (je eigene Karte)', () => { const b = by('scroll').filter(n => !J(`ITEMS['${n.item}'].field`)); return b.length === 6 && new Set(b.map(n => n.map)).size === 6; });
t('Feld-Attacken: 7 Namen (FIELD_MOVES oder Rückfall), alle als Attacke vorhanden', () => { const F = J(`fieldMoves()`); const names = Object.values(F).map(f => f.n); return ['Rankenschnitt', 'Felsschub', 'Eisbrücke', 'Leuchtfeuer', 'Wellenritt', 'Sturmflügel', 'Kletterkralle'].every(x => names.includes(x)) && J(`Object.keys(fieldMoves()).every(id=>!!MOVES[id]&&MOVES[id].length>=9)`); });
// ---- Lernen
t('Rolle aufheben: in der Tasche, Flag gesetzt', () => { const r = J(`(()=>{newG();__say=[];const n=NPCS.brisenhafen.find(n=>n.flag==='sc_wellenritt');talk(n);return{bag:G.bag.rolle_wellenritt,f:G.flags.sc_wellenritt,hid:npcHidden(n),say:__say[0]}})()`); return r.bag === 1 && r.f === 1 && r.hid === 1 && /Lehrrolle/.test(r.say); });
t('Rolle lernen: Plippi (Flut) ok, Funki (Glut) passt nicht', () => J(`[canLearnScroll('rolle_wellenritt',G.team[0]),canLearnScroll('rolle_wellenritt',G.team[1])]`).join() === 'ok,nein');
t('Feld-Rolle lernen: kein Kampfplatz, beherrscht (fieldKnows), verbraucht sich nicht', () => { const r = J(`(()=>{const m=G.team[0];const mv0=JSON.stringify(m.moves);const s=teachScroll('rolle_wellenritt',m);return{s,known:m.known.includes('wellenritt'),same:JSON.stringify(m.moves)===mv0,knows:typeof fieldKnows!=='function'||fieldKnows(m,'wellenritt'),bag:G.bag.rolle_wellenritt,again:canLearnScroll('rolle_wellenritt',m)}})()`); return r.known && r.same && r.knows && r.bag === 1 && r.again === 'kennt' && /kann jetzt Wellenritt/.test(r.s); });
t('Kampf-Rolle mit freiem Platz', () => { const r = J(`(()=>{const m=mk(4,12);m.moves=m.moves.slice(0,2);const s=teachScroll('rolle_wellen',m);return{s,has:m.moves.some(x=>x.id==='wellen'),len:m.moves.length}})()`); return r.has && r.len === 3; });
t('Kampf-Rolle bei 4 Attacken: gewählter Platz wird ersetzt, alte bleibt erlernt', () => { const r = J(`(()=>{const m=mk(4,30);while(m.moves.length<4)m.moves.push({id:'haerten',pp:30});const old=m.moves[1].id;const no=teachScroll('rolle_nachtbiss',m);const s=teachScroll('rolle_nachtbiss',m,1);return{no,s,now:m.moves[1].id,len:m.moves.length,old,known:m.known.includes(old),bag:G.bag.rolle_nachtbiss|0}})()`); return r.no === '' && r.now === 'nachtbiss' && r.len === 4 && r.known && /vergisst/.test(r.s); });
t('Feld-Attacken im Team-Fenster darstellbar (MOVES-Eintrag vorhanden)', () => J(`Object.keys(FIELD_MOVES).every(id=>Array.isArray(MOVES[id])&&TYPES[MOVES[id][1]])`));
t('Kampf-Rolle: Typ oder Lernliste der Art', () => J(`[canLearnScroll('rolle_glutwirbel',mk(1,10)),canLearnScroll('rolle_glutwirbel',mk(4,10)),canLearnScroll('rolle_nachtbiss',mk(4,10))]`).join() === 'ok,nein,ok');
// ---- Verstecktes Wesen
const ENC = J(`(()=>{const s=new Set();for(const id in MAPS){const e=MAPS[id].enc;if(e)[...(e.day||[]),...(e.night||[])].forEach(x=>s.add(x[0]));}return[...s]})()`);
t('Versteckte Arten stehen auf keiner cur.enc-Liste, keine Legenden', () => by('hidden').every(n => !ENC.includes(n.mon) && !J(`!!MONS[${n.mon}].legend`)));
t('Versteckte Arten: pro Region 1–2', () => { const R = J(`(()=>{const o={};for(const k in FIND_HINTS){const r=FIND_HINTS[k].region;o[r]=(o[r]||0)+1;}return o})()`); return Object.values(R).every(v => v >= 1 && v <= 2) && Object.keys(R).length >= 6; });
t('Fund → „Da bewegt sich etwas!“ → Kampf mit der seltenen Art', () => { const r = J(`(()=>{newG();__say=[];__bt=[];const n=NPCS.route1.find(n=>n.flag==='hd_route1');talk(n);return{say:__say[0],bt:__bt.length,s:__bt[0]&&__bt[0].wild.s,mon:n.mon,f:G.flags.hd_route1,hid:npcHidden(n)}})()`); return /Da bewegt sich etwas/.test(r.say) && r.bt === 1 && r.s === r.mon && r.f === 1 && r.hid === 1; });
t('Ohne gefangene Art: nach 1 Spieltag wieder da', () => { const r = J(`(()=>{const n=NPCS.route1.find(n=>n.flag==='hd_route1');G.playtime=1000;const a=findsTick();G.playtime=1440;const b=findsTick();return{a,b,f:!!G.flags.hd_route1,hid:npcHidden(n)}})()`); return r.a === 0 && r.b === 1 && !r.f && r.hid === 0; });
t('Gefangen: bleibt weg', () => { const r = J(`(()=>{const n=NPCS.route1.find(n=>n.flag==='hd_route1');talk(n);caught(n.mon);G.playtime+=5000;findsTick();return npcHidden(n)})()`); return r === 1; });
t('Müde Kreaturen: kein Kampf, Fund bleibt', () => { const r = J(`(()=>{newG();G.team.forEach(m=>m.hp=0);__bt=[];const n=NPCS.route2.find(n=>n.flag==='hd_route2');talk(n);return{bt:__bt.length,f:!!G.flags.hd_route2}})()`); return r.bt === 0 && !r.f; });
t('Dex-Hinweis: FIND_HINTS „Irgendwo … versteckt.“', () => J(`Object.values(FIND_HINTS).every(h=>/^Irgendwo .+ versteckt\\.$/.test(h.text))`));
// ---- Glitzer
t('Glitzer würfelt alle Ergebnisse (Kapsel/Trank/Beere/Münzen)', () => { const r = J(`(()=>{const seq=v=>{let i=0;return()=>v[Math.min(i++,v.length-1)]};return[0,.35,.6,.75,.95].map(x=>rollSparkle(seq([x,0,0])))})()`); return r[0].item === 'kapsel' && r[1].item === 'trank' && r[2].item === 'supertr' && r[3].item === 'honigtau' && r[4].money >= 100 && r[4].money <= 300; });
t('Glitzer aufheben: Inhalt in Tasche/Geld, Flag gesetzt', () => { const r = J(`(()=>{newG();const n=NPCS.route1.find(n=>n.flag==='it_r1');const k0=G.bag.kapsel|0,m0=G.money;pickFind(n,()=>0);const a=(G.bag.kapsel|0)-k0;delete G.flags.it_r1;pickFind(n,()=>.99);return{a,money:G.money-m0,f:G.flags.it_r1,hid:npcHidden(n)}})()`); return r.a === 1 && r.money >= 100 && r.f === 1 && r.hid === 1; });
t('Gegenstand (t:item) wie bisher', () => { const r = J(`(()=>{newG();__say=[];const n=NPCS.kupferhain.find(n=>n.flag==='it_kh1');talk(n);return{b:G.bag.balsamkapsel,s:__say[0]}})()`); return r.b === 1 && /gefunden/.test(r.s); });
// ---- Migration
t('Alter Spielstand: Rollen = Menge 0 (nicht in der Tasche), alte Funde bleiben weg', () => { const r = J(`(()=>{const old={map:'route1',bag:{kapsel:3},money:100,flags:{starter:1,it_r1:1,it_gs1:1},team:[{s:4,l:9,xp:729,hp:20,moves:[{id:'rempler',pp:35}],known:['rempler']}],box:[],dex:{seen:{4:1},caught:{4:1}},time:600,badges:[]};
 migrateSave(old);G=old;const ks=Object.keys(ITEMS).filter(k=>G.bag[k]>0);return{ks,sc:Object.keys(ITEMS).filter(k=>ITEMS[k].k==='scroll').some(k=>G.bag[k]>0),
  r1:npcHidden(NPCS.route1.find(n=>n.flag==='it_r1')),gs:npcHidden(NPCS.glutschlucht.find(n=>n.flag==='it_gs1')),fi:G.foundItems.includes('it_r1'),learn:canLearnScroll('rolle_wellenritt',G.team[0])}})()`); return !r.sc && r.ks.join() === 'kapsel' && r.r1 === 1 && r.gs === 1 && r.fi && r.learn === 'ok'; });
console.log(`\n${ok} ✓ / ${bad} ✗`);
process.exit(bad ? 1 : 0);
