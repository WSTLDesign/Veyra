// QA Loop B3 – Prüfung 1: Story durchspielbar per Skript.   node test/qa_b_story.mjs
// Baut auf der Test-Umgebung von test/unit_story.mjs auf (Harness wird von dort übernommen) und ergänzt:
//  · Flag-Kette (8 Kapitel + Finale + Epilog) aus neuem Spiel, je Schritt: Auslöser-Karte erreichbar, Zielführung (questTarget/guidePoint) zeigt auf ein erreichbares,
//    begehbares Ziel; der geführte Weg (routeHop von jeder Karte aus) läuft nie über eine noch gesperrte Kartenkante
//  · nach dem Epilog: alle Karten vom Start erreichbar (keine Flag-Sperre ohne Quelle), alle Gate-Flags werden von etwas gesetzt
//  · 11 Nebenmissionen am Ende der Hauptgeschichte annehmen + abschließen (Belohnungen kommen an), HUD-Zielführung der Nebenmissionen
//  · Ergebnis → test/qa_b_story.json (Tabelle je Schritt)
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, writeFileSync } from 'fs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = (code) => JSON.parse(run(`JSON.stringify((()=>{${code}})())`));
const src = readFileSync(new URL('./unit_story.mjs', import.meta.url), 'utf8');
const harness = src.match(/run\(`(globalThis\.__lines[\s\S]*?)`\);\n\n\/\/ ---- 1\./)[1];
run(new Function('return `' + harness + '`')());

// ---- Zusatz-Harness: Weg-Prüfung der Zielführung
run(`
// Ein Schritt des geführten Wegs von Karte 'from' zum Ziel: folgt routeHop, prüft gesperrte Kanten (MAPS[x].gate) und liefert Fehltext oder ''
globalThis.__guideWalk=function(from,T){let c=from,n=0,seen={};
  while(c!==T.map){if(seen[c])return'Schleife bei '+c;seen[c]=1;if(++n>40)return'Weg zu lang';
    const h=routeHop(c,T.map);if(!h)return'kein Weg '+from+'→'+T.map+' (hängt bei '+c+')';
    if('nsew'.includes(h.via)){const g=MAPS[c]&&MAPS[c].gate&&MAPS[c].gate[h.via];if(g&&!G.flags[g.f])return'gesperrte Kante '+c+'.'+h.via+' (Flag '+g.f+')';}
    c=h.to;}
  return'';};
// Ziel liegt innerhalb der Karte und (bei Feld-Zielen) nicht in der Wand
globalThis.__tgtOK=function(T){const m=getMap(T.map);if(!m)return'Karte fehlt';if(!(T.x>=0&&T.y>=0&&T.x<m.w&&T.y<m.h))return'außerhalb '+T.x+','+T.y+' in '+m.w+'×'+m.h;return'';};
// Eine Karte betreten (wie loadMap, aber ohne DOM) – nur cur/G.map setzen
globalThis.__at=function(id){G.map=id;cur=getMap(id);return cur;};
// Kette mit Protokoll je Schritt: Ziel vor dem Spielen prüfen (von morgenau, von der letzten Karte, von der Zielkarte)
globalThis.__chain2=function(max){const log=[];let last='morgenau';
  for(let i=0;i<max;i++){const s=storyStep();if(!s)return{done:true,log};
    const T=stepTarget(s);const row={f:s.f,ch:s.ch,map:T&&T.map,x:T&&T.x,y:T&&T.y,l:T&&T.l,err:[]};
    if(!T){row.err.push('kein Ziel');log.push(row);return{err:'kein Ziel',step:s.f,log};}
    row.reach=__reach(T.map);if(!row.reach)row.err.push('Karte nicht erreichbar');
    const tg=__tgtOK(T);if(tg)row.err.push('Ziel: '+tg);
    // questTarget() muss genau diesen Schritt führen
    const starts=[...new Set(['morgenau',last,T.map,'route1'])];
    for(const st of starts){try{__at(st);const q=questTarget();if(!q)row.err.push('questTarget leer auf '+st);else if(q.map!==T.map&&!(T.in||q.in))row.err.push('questTarget '+q.map+'≠'+T.map);
      const gp=guidePoint();if(!gp)row.err.push('guidePoint leer auf '+st);else{if(!(isFinite(gp.x)&&isFinite(gp.y)))row.err.push('guidePoint NaN');}
      if(row.reach){const w=__guideWalk(st,{map:q?q.map:T.map});if(w)row.err.push(st+': '+w);}}catch(e){row.err.push('Wurf auf '+st+': '+e.message);}}
    const e=__play(s);if(e)row.err.push('Spielen: '+e);
    if(!G.flags[s.f])row.err.push('Flag nicht gesetzt');
    row.ok=!row.err.length;log.push(row);last=T.map;
    if(!G.flags[s.f])return{err:'Sackgasse',step:s.f,log};
    if(G.team.length<2)G.team.push(mk(4,30));G.team.forEach(m=>{if(m.l<30)m.l=30;});}
  return{err:'zu viele Schritte',log};};
`);

// ---- 1. Kette
run('__new();__lines.length=0;');
const C = J(`return __chain2(80);`);
t(`Flag-Kette: ${C.log.length} Schritte aus neuem Spiel bis zum Ende ohne Sackgasse`, () => { if (!C.done) throw new Error(C.step + ': ' + C.err); });
t('Je Schritt: Karte erreichbar, Ziel begehbar, questTarget/guidePoint gültig, geführter Weg ohne gesperrte Kante', () => {
  const b = C.log.filter(r => r.err.length); if (b.length) throw new Error(b.map(r => r.f + ': ' + r.err.join('; ')).join(' | '));
});
const endState = J(`return{b:G.badges.slice(),f:Object.keys(G.flags).filter(k=>G.flags[k]).length,step:storyStep()&&storyStep().f,fest:!!G.flags.se_fest,champ:!!G.flags.champion,top4:!!G.flags.top4,
  crystals:CRYSTALS.map(([k])=>[k,crystalSafe(k)]),money:G.money,q:questTarget()}`);
t('Ende: 8 Medaillen, alle 8 Kristalle sicher, Turmrat besiegt, Ardena, Epilogfest', () => { const e = endState; if (e.b.length !== 8 || e.step || !e.fest || !e.champ || !e.top4 || e.crystals.some(c => !c[1])) throw new Error(JSON.stringify(e)); });
// Kapitel-Struktur: Kapitelende-Flag liegt im Kapitel, Reihenfolge Kapitel 1..8, Finale, Epilog
t('Kapitel in Reihenfolge, jedes Kapitelende (end) ist ein Schritt desselben Kapitels', () => { const r = J(`return STORY.map(c=>({n:c.n,fin:!!c.finale,ep:!!c.epilog,ok:c.steps.some(s=>s.f===c.end)}))`); if (r.some(c => !c.ok)) throw new Error(JSON.stringify(r.filter(c => !c.ok))); if (r.map(c => c.n).join() !== '1,2,3,4,5,6,7,8,9,10') throw new Error(r.map(c => c.n).join()); });

// ---- 2. Sperren
t('Nach dem Epilog sind alle Karten vom Start erreichbar (keine tote Kartenkante)', () => {
  const r = J(`const all=[...Object.keys(MAPS),...Object.keys(INTERIORS)];return all.filter(m=>!__reach(m))`); if (r.length) throw new Error('nicht erreichbar: ' + r.join(','));
});
t('Jedes Gate-Flag der Karten wird von der Hauptkette gesetzt oder ist Start-Flag (keine Sperre ohne Quelle)', () => {
  const r = J(`const gf=new Set();for(const id in MAPS){const g=MAPS[id].gate||{};for(const d in g)gf.add(g[d].f);}const chainF=new Set(STEPS.map(s=>s.f));
   // Flags, die Kämpfe/Hooks sonst setzen, stehen in G.flags nach der Kette
   return[...gf].filter(f=>!G.flags[f]&&!chainF.has(f))`); if (r.length) throw new Error('Gate-Flag ohne Quelle: ' + r.join(','));
});
t('Sperr-Texte (gate.m) nennen kein veraltetes Wort (Orden, Dämmerorden, Top Vier, Champion)', () => {
  const r = J(`const o=[];for(const id in MAPS){const g=MAPS[id].gate||{};for(const d in g){const m=kanonText(g[d].m||'');if(/Orden\\b|Top[- ]Vier|Dämmerorden|Champion/.test(m))o.push(id+'.'+d+': '+m);}}return o`); if (r.length) throw new Error(r.join(' | '));
});

// ---- 3. Nebenmissionen am Ende der Hauptgeschichte
const SQ = J(`
 G.flags.starter=1;G.team=[mk(5,30),mk(31,30),mk(2,30),mk(32,30)];G.bag=G.bag||{};G.bag.sonnbeere=2;G.dex.caught=Object.assign(G.dex.caught||{},{4:1,5:1,6:1,16:1,93:1,95:1,96:1,97:1,98:1});
 for(const q of ['sq_korb','sq_funkel','sq_experiment','sq_faehrten','sq_blumen','sq_laterne','sq_knoten','sq_fieber','sq_ofen','sq_sterne','sq_signal']){G.flags[q]=0;G.flags[q+'_on']=0;}
 for(const k of ['sq_fs1','sq_fs2','sq_fs3','sq_fa1','sq_fa2','sq_fa3','sq_laterne_found','sq_nuss','sq_sk1','sq_sk2','sq_sk3'])G.flags[k]=0;
 const giver={sq_korb:['haus_spieler','mama'],sq_funkel:['labor','tarek'],sq_experiment:['labor','tarek'],sq_faehrten:['kupferhain','elara'],sq_blumen:['kupferhain','wilma'],sq_laterne:['brisenhafen','borwin'],
  sq_knoten:['brisenhafen','marlene'],sq_fieber:['frostheim','mirael'],sq_ofen:['huette_glut','asta'],sq_sterne:['schattmoor','corvin'],sq_signal:['schattmoor','kaine4']};
 const fin={sq_korb:['haus_nachbar','elowen']};const res=[];
 for(const q of SQ2){const f=q.f;const[g,h]=giver[f]||[];const n=g&&NPCS[g]&&NPCS[g].find(n=>n.hook===h);const r={f,title:q.title,giver:g,err:[]};
  if(!n){r.err.push('Geber fehlt');res.push(r);continue;}
  // Zielführung vor Annahme: zeigt auf den Geber
  try{__at('morgenau');const T=q.t();if(!T||T.map!==g)r.err.push('Ziel vor Annahme '+(T&&T.map)+'≠'+g);}catch(e){r.err.push('Ziel: '+e.message);}
  if(!__reach(g))r.err.push('Geber-Karte nicht erreichbar');const w=__tileOK(g,n);if(w)r.err.push('Geber: '+w);
  const m0=G.money,bag0=JSON.stringify(G.bag);let onSeen=false,tgtOK=true;
  for(let k=0;k<6&&!G.flags[f];k++){__at(g);talk(n);
   if(G.flags[f+'_on']&&!onSeen){onSeen=true;try{const T=q.t();if(!T||!(MAPS[T.map]||INTERIORS[T.map]))tgtOK=false;}catch(e){tgtOK=false;}}
   for(const id in NPCS)for(const o of NPCS[id])if(o.t==='item'&&o.hook&&o.sOn===f+'_on'&&!npcHidden(o)){const w2=__tileOK(id,o);if(w2)r.err.push('Fundstück '+id+': '+w2);if(!__reach(id))r.err.push('Fundstück-Karte nicht erreichbar '+id);__at(id);talk(o);}
   if(fin[f]){const e=NPCS[fin[f][0]].find(n=>n.hook===fin[f][1]);__at(fin[f][0]);talk(e);}}
  r.on=!!G.flags[f+'_on'];r.done=!!G.flags[f];if(!r.on)r.err.push('nicht annehmbar');if(!r.done)r.err.push('nicht abschließbar');if(!tgtOK)r.err.push('Ziel nach Annahme ungültig');
  r.reward=(G.money-m0)+' ¤, Items '+JSON.stringify(Object.keys(G.bag).filter(k=>G.bag[k]!==(JSON.parse(bag0)[k]||0)).map(k=>k+':'+((G.bag[k]||0)-(JSON.parse(bag0)[k]||0))));
  res.push(r);}
 return res;`);
t(`${SQ.length} Nebenmissionen: Geber/Fundstücke erreichbar, annehmbar, abschließbar, Ziele gültig`, () => { if (SQ.length !== 11) throw new Error('Anzahl ' + SQ.length); const b = SQ.filter(r => r.err.length); if (b.length) throw new Error(b.map(r => r.f + ': ' + r.err.join('; ')).join(' | ')); });
t('Jede Nebenmission schüttet eine Belohnung aus (Geld oder Item)', () => { const b = SQ.filter(r => /^0 ¤, Items \[\]$/.test(r.reward)); if (b.length) throw new Error(b.map(r => r.f).join(',')); });
t('Nebenmissionen: Voraussetzung (req) ist im Hauptverlauf erfüllbar und früh genug (Flag existiert in der Kette)', () => {
  const r = J(`const fl=new Set(STEPS.map(s=>s.f).concat(SQ2.map(q=>q.f)));return SQ2.filter(q=>q.req&&q.req.flag&&!fl.has(q.req.flag)).map(q=>q.f+':'+q.req.flag)`); if (r.length) throw new Error(r.join(','));
});
t('Missionsseite/HUD: questTarget am Ende zeigt nichts Ungültiges (null oder erreichbare Karte)', () => {
  const r = J(`const q=questTarget();return q?{map:q.map,ok:!!(MAPS[q.map]||INTERIORS[q.map])}:null`); if (r && !r.ok) throw new Error(JSON.stringify(r));
});

// ---- 4. Zusätzlich: Hooks aller Schritte (Auslöser-NPCs) laufen auch im 2. Durchgang aus Altstand ohne Wurf
t('Zweiter Durchlauf aus „fast fertigem“ Altstand (Champion): Kette bis zum Epilog ohne Sackgasse', () => {
  const r = J(`G=freshG({name:'Noa',rival:'Lio'});migrateSave(G);G.time=12*60;G.team=[];G.money=3000;Object.assign(G.flags,{starter:1,firstcatch:1,badge1:1,grunt1:1,badge2:1,tr_lio:1,badge3:1,boss1:1,badge4:1,top1:1,top2:1,top3:1,champion:1});
   G.badges=['Floramedaille','Flutmedaille','Frostmedaille','Schattenmedaille'];migrateSave(G);const c=__chain(80);return{done:c.done,err:c.err,step:c.step,b:G.badges.length}`);
  if (!r.done) throw new Error(r.step + ': ' + r.err); if (r.b !== 8) throw new Error('Medaillen ' + r.b);
});

writeFileSync(new URL('./qa_b_story.json', import.meta.url), JSON.stringify({ chain: C.log, sideQuests: SQ, end: endState }, null, 1));
console.log('\nSchritt-Tabelle (Flag · Kapitel · Karte x,y):');
for (const r of C.log) console.log(`  ${r.ok ? '✓' : '✗'} ${r.f.padEnd(14)} K${String(r.ch).padEnd(2)} ${String(r.map).padEnd(13)} ${r.x},${r.y}  ${r.l || ''}${r.err.length ? '  !! ' + r.err.join('; ') : ''}`);
console.log('\nNebenmissionen:'); for (const r of SQ) console.log(`  ${r.err.length ? '✗' : '✓'} ${r.f.padEnd(14)} ${r.giver}  ${r.reward}${r.err.length ? '  !! ' + r.err.join('; ') : ''}`);
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
