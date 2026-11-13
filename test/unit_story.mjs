// Agent B2 – Hauptgeschichte & Nebenmissionen ohne Browser prüfen.   node test/unit_story.mjs
// 1) Struktur: 8 Kapitel + Finale + Epilog, je Kapitel 3–6 Flags, jeder Auslöser-Ort in MAPS/INTERIORS, jeder Auslöser-NPC existiert und hat einen Hook
// 2) Flag-Kette ohne Sackgasse: neues Spiel → jeder Schritt ist sichtbar, erreichbar (Kartengraph mit Sperren) und setzt sein Flag
// 3) Zielführung: questTarget/guidePoint für jeden Schritt · 4) Nebenmissionen (11) durchspielbar · 5) Altstand-Migration (Orden → Medaillen, kein Rückfall)
// 6) Texte: keine Markenwörter (Liste aus test/qa_a_recht.mjs), kein „Top Vier“/„Ass-Trainer“, höchstens 2 Zeilen je Kasten
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync } from 'fs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = (code) => JSON.parse(run(`JSON.stringify((()=>{${code}})())`));

// Markenwörter wie in qa_a_recht.mjs (dort ist die Liste gepflegt)
const rechtSrc = readFileSync(new URL('./qa_a_recht.mjs', import.meta.url), 'utf8');
const BRAND = new RegExp(rechtSrc.match(/const BRAND = \/(.+)\/i;/)[1], 'i');

// ---- Test-Umgebung: Dialoge sofort durch, Fragen → erste Antwort, Trainerkampf → Sieg
run(`globalThis.__lines=[];globalThis.__battles=[];
say=function(l,cb){kanonLines([].concat(l).map(String)).forEach(x=>__lines.push(rivalize(x)));cb&&cb();};
ask=function(q,o,cb){__lines.push(rivalize(kanonText(String(q))));cb&&cb(0);};
chronikCall=function(n,l){[].concat(l).forEach(x=>__lines.push(kanonText(String(x))));return Promise.resolve(true);};
startBattle=function(o){if(!o||!o.trainer)return;const t=o.trainer;__battles.push(t.flag);const team=t.team;if(!Array.isArray(team)||!team.length||team.some(x=>!MONS[x[0]]))throw new Error('Team ungültig: '+t.name);
 G.flags[t.flag]=1;if(!G.defeatedTrainers.includes(t.flag))G.defeatedTrainers.push(t.flag);if(t.leader&&!G.badges.includes(t.leader))G.badges.push(t.leader);if(t.gift)addItem(t.gift[0],t.gift[1]);};
toast=function(){};sfx=function(){};vib=function(){};
globalThis.__new=function(){G=freshG({name:'Noa',rival:'Lio'});migrateSave(G);G.time=12*60;G.team=[];G.money=3000;return G;};
// Kartengraph mit Sperren (Kartenränder MAPS[x].gate, Türen frei)
globalThis.__reach=function(to){const seen={morgenau:1},q=['morgenau'];while(q.length){const c=q.shift();if(c===to)return true;
  const m=MAPS[c];const L=[];if(m){for(const d of 'nsew'){if(!m[d])continue;const g=m.gate&&m.gate[d];if(g&&!G.flags[g.f])continue;L.push(m[d]);}for(const k in m.doors||{})if(m.doors[k]!=='@out')L.push(m.doors[k]);}
  else{const p=Object.keys(MAPS).find(p=>Object.values(MAPS[p].doors||{}).includes(c));if(p)L.push(p);}
  for(const n of L)if(!seen[n]){seen[n]=1;q.push(n);}}return false;};
// Begehbarkeit: NPC steht auf freiem Feld, ein Nachbarfeld ist vom Karteneingang aus erreichbar
globalThis.__tileOK=function(map,n){const m=getMap(map);const at=(x,y)=>tileAt(m,x,y);const t0=at(n.x,n.y);if(t0===null)return 'außerhalb';if(SOLID.has(t0)||/[0-9E]/.test(t0))return 'Feld '+t0;
  const occ=new Set((NPCS[map]||[]).filter(o=>o!==n&&!npcHidden(o)).map(o=>o.x+','+o.y));
  const free=(x,y)=>{const c=at(x,y);return c!==null&&!SOLID.has(c)&&!occ.has(x+','+y)&&!(x===n.x&&y===n.y);};
  const st=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=at(x,y);if((y===0||x===0||y===m.h-1||x===m.w-1||c==='E')&&free(x,y))st.push([x,y]);if(/[0-9]/.test(c)){for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]])if(free(x+dx,y+dy))st.push([x+dx,y+dy]);}}
  const S=new Set(st.map(p=>p+''));const q=st.slice();while(q.length){const[x,y]=q.shift();for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const a=x+dx,b=y+dy,k=a+','+b;if(!S.has(k)&&free(a,b)){S.add(k);q.push([a,b]);}}}
  return [[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>S.has((n.x+dx)+','+(n.y+dy)))?'':'kein erreichbares Nachbarfeld';};
// Einen Schritt „spielen“: Auslöser ansprechen bzw. Bedingung herstellen
globalThis.__play=function(s){const T=stepTarget(s);if(!T)return 'kein Ziel';if(!MAPS[T.map]&&!INTERIORS[T.map])return 'Karte fehlt: '+T.map;if(!__reach(T.map))return 'nicht erreichbar: '+T.map;
  G.map=T.map;cur=getMap(T.map);P.dir='up';
  if(s.f==='firstcatch'){if(!(MAPS[T.map].enc&&MAPS[T.map].enc.day.length))return 'keine wilden Kreaturen';G.flags.firstcatch=1;caught(59);G.team.push(mk(59,5));return '';}
  if(s.f==='starter'){const n=NPCS.labor.find(n=>n.t==='starter'&&n.mon===1);talk(n);return '';}
  if(s.fn==='liga'){for(const n of NPCS.liga.filter(n=>/^top/.test(n.flag))){if(npcHidden(n))continue;talk(n);}return '';}
  const n=npcBy(s.by);if(!n)return 'NPC fehlt';if(npcHidden(n))return 'NPC unsichtbar ('+(n.hook||n.flag)+')';if(n.hook&&!HOOKS[n.hook])return 'Hook fehlt: '+n.hook;
  const w=__tileOK(T.map,n);if(w)return 'Feld: '+w;talk(n);return '';};
globalThis.__chain=function(max){const log=[];for(let i=0;i<max;i++){const s=storyStep();if(!s)return{done:true,log};const before=s.f;const e=__play(s);
  let gp=null;try{loadMap(stepTarget(s).map==='labor'?'morgenau':'route1');gp=guidePoint();}catch(x){return{err:'guidePoint: '+x.message,step:before,log};}
  if(e)return{err:e,step:before,log};if(!G.flags[before])return{err:'Flag nicht gesetzt (Sackgasse)',step:before,log};log.push(before);
  if(G.team.length<2)G.team.push(mk(4,30));G.team.forEach(m=>{if(m.l<30){m.l=30;}});}
 return{err:'zu viele Schritte',log};};`);

// ---- 1. Struktur
const S = J(`return{ch:STORY.map(c=>({n:c.n,reg:c.reg,k:c.steps.length,fl:c.steps.map(s=>s.f),fin:!!c.finale,ep:!!c.epilog,goal:kanonText(c.goal),end:c.end})),steps:STEPS.length,q:QUESTS.length}`);
t('8 Kapitel (je Region eines) + Finale + Epilog', () => { const regs = S.ch.filter(c => !c.fin && !c.ep).map(c => c.reg); if (regs.length !== 8) throw new Error(regs.join(',')); const need = ['Lichtlande', 'Smaragdwald', 'Flutküste', 'Glutlande', 'Kristallgebirge', 'Frosttundra', 'Himmelsweiten', 'Schattenmoor']; const miss = need.filter(r => !regs.includes(r)); if (miss.length) throw new Error('fehlt ' + miss); if (!S.ch.some(c => c.fin) || !S.ch.some(c => c.ep)) throw new Error('Finale/Epilog'); });
t('Jedes Kapitel: 3–6 Missions-Flags, Ziel in einem Satz', () => { const b = S.ch.filter(c => !c.ep && (c.k < 3 || c.k > 6)); if (b.length) throw new Error(b.map(c => c.n + ':' + c.k)); const g = S.ch.filter(c => !/^[^.!?]+[.!?]$/.test(c.goal)); if (g.length) throw new Error(g.map(c => c.goal).join(' | ')); });
t('Flags eindeutig, QUESTS = Schritte', () => { const all = S.ch.flatMap(c => c.fl); if (new Set(all).size !== all.length) throw new Error('doppelt'); if (S.q !== S.steps) throw new Error(S.q + '≠' + S.steps); });
const N = J(`const out=[];for(const id in NPCS)for(const n of NPCS[id]){if(n.hook||n.sOn||n.sOff||n.fig)out.push({id,x:n.x,y:n.y,hook:n.hook||null,flag:n.flag||null,t:n.t,name:n.name||'',hasHook:!n.hook||!!HOOKS[n.hook],map:!!(MAPS[id]||INTERIORS[id])});}return out;`);
t('Jeder Auslöser-Ort existiert in MAPS/INTERIORS und jeder Hook ist definiert (' + N.length + ' Figuren)', () => { const b = N.filter(n => !n.map || !n.hasHook); if (b.length) throw new Error(JSON.stringify(b)); });
t('Jeder Schritt hat einen Auslöser (NPC oder Ort) auf einer bestehenden Karte', () => { const b = J(`return STEPS.filter(s=>{if(s.fn==='liga')return!NPCS.liga;if(s.at)return!MAPS[s.at[0]];if(s.by.at)return!INTERIORS[s.by.map]&&!MAPS[s.by.map];const n=npcBy(s.by);return!n||!(MAPS[s.by.map]||INTERIORS[s.by.map]);}).map(s=>s.f)`); if (b.length) throw new Error(b.join(',')); });
t('Story- und Missions-Figuren stehen auf freien, erreichbaren Feldern', () => { const b = J(`G=__new();Object.assign(G.flags,{starter:1});const out=[];for(const id in NPCS)for(const n of NPCS[id]){if(!(n.sOn||n.fig)||id==='liga')continue;const w=__tileOK(id,n);if(w)out.push(id+' '+n.x+','+n.y+' '+(n.hook||n.flag)+': '+w);}return out;`); if (b.length) throw new Error(b.join(' | ')); });
t('Keine zwei Figuren auf demselben Feld', () => { const b = J(`const out=[];for(const id in NPCS){const m={};for(const n of NPCS[id]){const k=n.x+','+n.y;if(m[k])out.push(id+' '+k+' '+(m[k].hook||m[k].flag||m[k].t)+'/'+(n.hook||n.flag||n.t));m[k]=n;}}return out;`); if (b.length) throw new Error(b.join(' | ')); });

// ---- 2./3. Flag-Kette neues Spiel
const C = J(`__new();__lines.length=0;return __chain(80);`);
t('Neues Spiel: alle ' + S.steps + ' Schritte nacheinander erreichbar, keine Sackgasse', () => { if (!C.done) throw new Error((C.step || '') + ': ' + C.err + ' (nach ' + C.log.length + ')'); const miss = J(`return STEPS.filter(s=>!G.flags[s.f]).map(s=>s.f)`); if (miss.length) throw new Error('offen ' + miss); });
t('Hauptgeschichte am Ende: 8/8 Medaillen, alle Kristalle sicher, Epilog fertig', () => { const r = J(`return{b:G.badges.length,c:CRYSTALS.every(([k])=>crystalSafe(k)),e:!!G.flags.se_fest,q:storyStep()}`); if (r.b !== 8 || !r.c || !r.e || r.q) throw new Error(JSON.stringify(r)); });
t('Palastwache verschwindet erst nach dem Auralis-Moment', () => { const r = J(`const g=NPCS.siegesstrasse.find(n=>n.hook==='wache');const F=G.flags;const a=F.sf_auralis;F.sf_auralis=0;F.champion=0;F.top1=0;const h1=npcHidden(g);F.sf_auralis=1;const h2=npcHidden(g);F.champion=1;F.top1=1;F.sf_auralis=a;return[h1,h2]`); if (r[0] !== 0 || r[1] !== 1) throw new Error(JSON.stringify(r)); });
t('Zielführung: für jeden Schritt Ziel + Leitpunkt (kein Wurf)', () => { const b = J(`const out=[];__new();for(const s of STEPS){try{const T=stepTarget(s);if(!T||!(MAPS[T.map]||INTERIORS[T.map]))out.push(s.f+':kein Ziel');for(const m of ['morgenau','route3','liga']){loadMap(m);G.flags={};for(const x of STEPS){if(x===s)break;G.flags[x.f]=1;}G.flags.starter=1;questTarget();guidePoint();}}catch(e){out.push(s.f+':'+e.message);}}return out;`); if (b.length) throw new Error(b.join(', ')); });

// ---- 4. Nebenmissionen
const SQ = J(`return SQ2.map(q=>q.f)`);
t('10–12 neue Nebenmissionen (' + SQ.length + ')', () => { if (SQ.length < 10 || SQ.length > 12) throw new Error(SQ.length); });
const SQR = J(`__new();Object.assign(G.flags,{starter:1,firstcatch:1,s2_kristall:1,s8_kaine:1});G.team=[mk(5,20),mk(31,20),mk(2,20)];G.bag={sonnbeere:1};G.dex.caught={4:1,5:1,6:1,16:1};
 const giver={sq_korb:['haus_spieler','mama'],sq_funkel:['labor','tarek'],sq_experiment:['labor','tarek'],sq_faehrten:['kupferhain','elara'],sq_blumen:['kupferhain','wilma'],sq_laterne:['brisenhafen','borwin'],
  sq_knoten:['brisenhafen','marlene'],sq_fieber:['frostheim','mirael'],sq_ofen:['huette_glut','asta'],sq_sterne:['schattmoor','corvin'],sq_signal:['schattmoor','kaine4']};
 const fin={sq_korb:['haus_nachbar','elowen']};const res={};
 for(const f of SQ2.map(q=>q.f)){const[g,h]=giver[f]||[];const n=g&&NPCS[g].find(n=>n.hook===h);if(!n){res[f]='Geber fehlt';continue;}
  for(let k=0;k<6&&!G.flags[f];k++){talk(n);
   for(const id in NPCS)for(const o of NPCS[id])if(o.t==='item'&&o.hook&&o.sOn===f+'_on'&&!npcHidden(o)){const w=__tileOK(id,o);if(w){res[f]='Fundstück '+id+': '+w;}talk(o);}
   if(fin[f]){const e=NPCS[fin[f][0]].find(n=>n.hook===fin[f][1]);talk(e);}}
  if(!res[f])res[f]=G.flags[f]?'':'nicht abschließbar';}
 return res;`);
t('Alle Nebenmissionen annehmen und abschließen', () => { const b = Object.entries(SQR).filter(([, v]) => v); if (b.length) throw new Error(JSON.stringify(b)); });
t('Nebenmissionen: Ziele für jede Phase gültig', () => { const b = J(`const out=[];__new();Object.assign(G.flags,{starter:1});for(const q of SQ2){for(const st of [0,1]){if(st)G.flags[q.f+'_on']=1;const T=q.t();if(!T||!(MAPS[T.map]||INTERIORS[T.map]))out.push(q.f+st);}}return out;`); if (b.length) throw new Error(b.join(',')); });

// ---- 5. Altstand
const M = J(`G={map:'schattmoor',team:[mk(1,30),mk(4,30)],box:[],bag:{},money:100,flags:{starter:1,firstcatch:1,badge1:1,grunt1:1,badge2:1,tr_lio:1,badge3:1,boss1:1,badge4:1},badges:['Blütenorden','Wellenorden','Gletscherorden','Mondorden'],dex:{seen:{},caught:{}},time:600,ver:4,dexKanon:1};
 migrateSave(G);const a=JSON.stringify(G.flags)+JSON.stringify(G.badges);migrateSave(G);const idem=a===JSON.stringify(G.flags)+JSON.stringify(G.badges);
 const r={badges:G.badges.slice(),first:storyStep().f,idem,story:typeof G.story};const c=__chain(80);r.done=c.done;r.err=c.err;r.step=c.step;r.n=G.badges.length;return r;`);
t('Altstand (4 Orden): Orden → Medaillen umbenannt', () => { if (JSON.stringify(M.badges) !== JSON.stringify(['Floramedaille', 'Flutmedaille', 'Frostmedaille', 'Schattenmedaille'])) throw new Error(JSON.stringify(M.badges)); });
t('Altstand: erledigte Kapitel abgeleitet, weiter geht es bei neuen Inhalten (Böenmedaille)', () => { if (M.first !== 'badge_boe') throw new Error(M.first); if (M.story !== 'object') throw new Error('G.story'); });
t('Altstand: Migration idempotent und Kette bis zum Epilog ohne Sackgasse', () => { if (!M.idem) throw new Error('nicht idempotent'); if (!M.done) throw new Error(M.step + ': ' + M.err); if (M.n !== 8) throw new Error('Medaillen ' + M.n); });
const M2 = J(`G={map:'liga',team:[mk(1,50)],box:[],bag:{},money:1,flags:{starter:1,firstcatch:1,badge1:1,grunt1:1,badge2:1,tr_lio:1,badge3:1,boss1:1,badge4:1,top1:1,top2:1,top3:1,champion:1},badges:['Blütenorden','Wellenorden','Gletscherorden','Mondorden'],dex:{seen:{},caught:{}},time:600,ver:4,dexKanon:1};
 migrateSave(G);const r={first:storyStep()&&storyStep().f,wache:npcHidden(NPCS.siegesstrasse.find(n=>n.hook==='wache'))};const c=__chain(80);r.done=c.done;r.err=c.err;r.step=c.step;return r;`);
t('Altstand Champion: Palast offen, neue Medaillen nachholbar, Epilog erreichbar', () => { if (M2.wache !== 1) throw new Error('Wache steht'); if (!M2.done) throw new Error(M2.step + ': ' + M2.err); });

// ---- 6. Texte
const L = J(`return __lines.slice()`).concat(J(`const o=[];const add=x=>{if(typeof x==='string')kanonLines(x).forEach(y=>o.push(rivalize(y)));else if(Array.isArray(x))x.forEach(add);};
 for(const id in NPCS)for(const n of NPCS[id]){add(n.txt);add(n.pre);add(n.post);add(n.name);}STEPS.forEach(s=>{add(s.t);add(s.d);add(s.l);});STORY.forEach(c=>{add(c.title);add(c.goal);});
 SQ2.forEach(q=>{add(q.title);add(q.d);});Object.values(STORY_HELP).forEach(add);STORY_CALLS.forEach(c=>add(c.lines));for(const id in MAPS)for(const d in MAPS[id].gate||{})add(MAPS[id].gate[d].m);return o;`));
t('Texte gesammelt (' + L.length + ' Kästen)', () => { if (L.length < 300) throw new Error(L.length); });
t('Keine Markenwörter in Story-Texten', () => { const b = L.filter(x => BRAND.test(x)); if (b.length) throw new Error(b.slice(0, 3).join(' | ')); });
t('Keine Fremdbegriffe „Top Vier“, „Top-Drei“, „Ass-Trainer“, „Dämmerorden“, „Lindqvist“ im Spieltext', () => { const b = L.filter(x => /Top[- ]Vier|Top-Drei|Ass-Trainer|Dämmerorden|Lindqvist/.test(x)); if (b.length) throw new Error(b.slice(0, 3).join(' | ')); });
t('Keine offenen Platzhalter ({@…}, {T:…}, {mon:…})', () => { const b = L.filter(x => /\{(in)?@|\{T:|\{mon:/.test(x)); if (b.length) throw new Error(b.slice(0, 3).join(' | ')); });
t('Kurze Kästen: höchstens 2 Zeilen (≤ 110 Zeichen inkl. Name)', () => { const b = L.filter(x => x.length > 110); if (b.length) throw new Error(b.length + ': ' + b.slice(0, 3).join(' | ')); });
t('Kindgerecht: keine Wörter wie sterben/tot/töten/Blut/Angriff auf Menschen', () => { const b = L.filter(x => /\b(stirbt|sterben|gestorben|tot|töten|tötet|Blut|vernichten|zerstören)\b/i.test(x)); if (b.length) throw new Error(b.slice(0, 3).join(' | ')); });
t('Lernliste: Hilfetexte nennen die Taste/den Knopf', () => { const h = J(`return Object.values(STORY_HELP)`); if (h.length < 8 || !h.some(x => /tippe auf A/i.test(x)) || !h.some(x => /Tasche/.test(x)) || !h.some(x => /Chronik/.test(x))) throw new Error(h.length); });
t('Text-Filter: Medaille grammatisch, Orden → Medaillen, Lindqvist → Veyran', () => { const r = J(`return[kanonText('Du erhältst den Floramedaille!'),kanonText('Ab 3 Orden.'),kanonText('Prof. Lindqvist: Hallo'),kanonText('Der Dämmerorden!')]`); if (r[0] !== 'Du erhältst die Floramedaille!' || r[1] !== 'Ab 3 Medaillen.' || !/^Professor Veyran/.test(r[2]) || r[3] !== 'Der Schattenorden!') throw new Error(JSON.stringify(r)); });

console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
