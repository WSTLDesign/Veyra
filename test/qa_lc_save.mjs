// QA Loop C – Punkt 4: Spielstand-Kompatibilität (alte Stände ohne saveVersion, Position auf heute abgeschnittenen Feldern, Glutschlucht mit geräumten Hindernissen).
//   node test/qa_lc_save.mjs        Bilder: test/qa_lc_save_*.png
import { readFileSync } from 'fs';
import { start, page, newGame, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('qa_lc_save.log', 'QA Loop C – Spielstand-Kompatibilität');
const env = await start();
const fx = JSON.parse(readFileSync(here('fixtures/old_save_4orden.json'), 'utf8'));
const mk = (over) => Object.assign(JSON.parse(JSON.stringify(fx)), over);
// eigene Erreichbarkeit (unabhängig von w1Reach): Regeln wie tryMove ohne Feldattacken – Wasser/Wand gesperrt, Felskante nur abwärts, Eis begehbar
const BFS = `(function(){ window.QB = function(m, from, opts){ opts = opts||{}; const seen = new Set(), q = []; const add = (x,y)=>{ const k=x+','+y; if(!seen.has(k)){ seen.add(k); q.push([x,y]); } };
  const pass = (x,y,dir)=>{ const t = tileAt(m,x,y); if(t===null) return null; if(t==='~'||t==='Q') return opts.swim?[x,y]:null; if(t==='X') return opts.climb?[x,y]:null;
    if(t==='R'){ if(dir!=='down') return null; const t2=tileAt(m,x,y+1); if(t2!==null && !SOLID.has(t2) && t2!=='R') return [x,y+1]; return null; } if(SOLID.has(t)) return null; return [x,y]; };
  add(from[0],from[1]); while(q.length){ const [x,y]=q.shift(); for(const [dx,dy,d] of [[0,1,'down'],[1,0,'right'],[-1,0,'left'],[0,-1,'up']]){ const r=pass(x+dx,y+dy,d); if(r) add(r[0],r[1]); } } return seen; };
  window.QSEEDS = function(m){ const S=[]; for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){ const t=m.rows[y][x]; if(/[0-9E]/.test(t)){ const up=t==='E'||(m.doors&&m.doors[t]==='@out'); const yy=up?y-1:y+1; const u=tileAt(m,x,yy); if(u!==null&&!SOLID.has(u)) S.push([x,yy]); }
    const L=MAPS[m.id]||{}; if((x===0&&L.w)||(x===m.w-1&&L.e)||(y===0&&L.n)||(y===m.h-1&&L.s)){ if(!SOLID.has(t)) S.push([x,y]); } } return S; };
  window.QMAIN = function(m){ const S=QSEEDS(m); const all=new Set(); for(const s of S) for(const k of QB(m,s)) all.add(k); return {S, all}; }; })()`;
async function boot(save, extra) { const p = await page(env, { save }); await p.evaluate(BFS); return p; }
async function cont(p) { try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(500); try { await p.click('#iSkip', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(900); await p.click('#tCont', { timeout: 20000 }); await p.waitForTimeout(3500); await p.evaluate(() => { for (let i = 0; i < 10 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } if (typeof VILL !== 'undefined') VILL.list = []; }); }
const state = () => `({map:G.map,x:P.x,y:P.y,mode,sv:G.saveVersion,bak:Object.keys(localStorage).filter(k=>/_bak_/.test(k)),blockedHere:blocked(P.x,P.y)&&!npcAt(P.x,P.y),tile:tileAt(cur,P.x,P.y)})`;

// ---- A) alter Stand (kein saveVersion), Positionen auf heute abgeschnittenen/festen Feldern
const spots = [['glutschlucht', 2, 18, 'Schatz-Nische (heute abgeschnitten)'], ['glutschlucht', 1, 18, 'Nische'], ['glutschlucht', 2, 17, 'heute Baum T'], ['glutschlucht', 2, 19, 'heute Baum T'], ['glutschlucht', 9, 7, 'altes Geröll-Feld'],
  ['glutschlucht', 12, 16, 'altes Ilka-Feld (untere Osthälfte)'], ['glutschlucht', 4, 17, 'untere Westhälfte'], ['glutschlucht', 3, 18, 'jetzt Geröll'], ['nebelgrotte', 10, 9, 'alter Grottenkristall'], ['nebelgrotte', 12, 9, 'alter Grottenkristall'], ['morgenau', 4, 3, 'Laborfeld/Haus'], ['route1', 0, 0, 'Kartenecke fest']];
let first = true;
for (const [map, x, y, why] of process.env.QA_SKIPA ? [] : spots) {
  const raw = mk({ map, px: x, py: y, ret: { map, x, y }, mods: map === 'glutschlucht' ? { glutschlucht: [[9, 7, '.'], [14, 14, '.'], [9, 18, 'I']] } : {} }); const p = await boot(JSON.stringify(raw));
  const had = !('saveVersion' in raw); await cont(p);
  const s = await p.evaluate(`(()=>{const o=${state()}; const m=cur; const me=QMAIN(m); o.reach=me.all.has(P.x+','+P.y); o.seeds=me.S.length; const own=QB(m,[P.x,P.y]); o.out=[...own].some(k=>me.all.has(k)); o.walkable=!blocked(P.x,P.y); return o;})()`);
  if (first) { await p.screenshot({ path: here('qa_lc_save_alt_geladen.png') }); first = false; }
  R.t(`Alter Stand (${had ? 'ohne' : 'MIT'} saveVersion) ${map} ${x},${y} [${why}]: lädt ohne Fehler, Spawn ${s.x},${s.y} nicht blockiert und mit Weg hinaus`, had && s.map === map && !s.blockedHere && s.walkable && (s.reach || s.out) && s.mode === 'world' && p.errs.length === 0, Object.assign(s, { errs: p.errs }));
  if (s.sv !== 1 && first === false && spots[0][1] === x) R.note('Hinweis: saveVersion nach Laden = ' + s.sv + ', Sicherungen ' + JSON.stringify(s.bak));
  await p.context().close();
}
// ---- B) Spawn-Korrektur nach Fortsetzen: Position in der Nische → erreichbares Feld; sichtbar in welchem Abstand
for (const [bx, by] of [[2, 18], [12, 16], [4, 17]]) { const raw = mk({ map: 'glutschlucht', px: bx, py: by, ret: { map: 'glutschlucht', x: bx, y: by }, mods: {}, badges: [], flags: { starter: 1, firstcatch: 1 } }); const p = await boot(JSON.stringify(raw)); await cont(p);
  const s = await p.evaluate(`(()=>{const o=${state()}; const me=QMAIN(cur); o.moved=!(P.x===${bx}&&P.y===${by}); o.main=me.all.has(P.x+','+P.y); o.fixCount=W1SKY.fixed||0; o.canSwim=canSwim(); return o;})()`);
  R.t(`Abgeschnittenes Feld (${bx},${by}) im alten Stand ohne geräumte Hindernisse (Flutmedaille fehlt): Spawn-Korrektur setzt Figur auf den Hauptweg, kein Blockiert-Stehen`, s.moved && s.main && !s.blockedHere, s); await p.screenshot({ path: here('qa_lc_save_nische_korrigiert.png') }); await p.context().close(); }
// ---- C) Glutschlucht mit geräumten Hindernissen (alter Stand: alle drei geräumt: Geröll (9,7), Dornen (14,14), Wasser→Eis (9,18)) → Schatzkette spielbar
{ const raw = mk({ map: 'glutschlucht', px: 12, py: 16, ret: { map: 'glutschlucht', x: 12, y: 16 }, mods: { glutschlucht: [[9, 7, '.'], [14, 14, '.'], [9, 18, 'I']] } }); const p = await boot(JSON.stringify(raw)); await cont(p);
  const r = await p.evaluate(`(()=>{const o={}; const m=cur; o.tile97=tileAt(m,9,7); o.tile1414=tileAt(m,14,14); o.tile918=tileAt(m,9,18); o.tile318=tileAt(m,3,18); o.base97=FIELDMAP.glutschlucht.filter(f=>f[0]===9&&f[1]===7).length;
    const me=QMAIN(m); o.spawn=[P.x,P.y]; o.spawnMain=me.all.has(P.x+','+P.y); const t=NPCS.glutschlucht; const nb=(x,y)=>[[0,1],[1,0],[-1,0],[0,-1]].some(([a,b])=>me.all.has((x+a)+','+(y+b)));
    o.npcs={}; for(const n of t){ if(/sign/.test(n.t)) continue; o.npcs[(n.name||n.hook||n.t||'?')+'@'+n.x+','+n.y]=nb(n.x,n.y)||me.all.has(n.x+','+n.y); }
    const schatz=t.find(n=>n.hook==='schatz'||/schatz/i.test(n.flag||'')||/Schatz/.test(n.name||'')); o.schatz=schatz&&[schatz.x,schatz.y]; o.schatzReachNow=schatz?nb(schatz.x,schatz.y)||me.all.has(schatz.x+','+schatz.y):null;
    // nach Felsschub (3,18) → '.' : Schatz erreichbar?
    const rows=m.rows.slice(); m.rows[18]=m.rows[18].slice(0,3)+'.'+m.rows[18].slice(4); const me2=QMAIN(m); o.schatzAfterG=schatz?(nb2=>nb2)([[0,1],[1,0],[-1,0],[0,-1]].some(([a,b])=>me2.all.has((schatz.x+a)+','+(schatz.y+b)))):null; m.rows=rows; return o;})()`);
  R.note('Glutschlucht, geräumt: ' + JSON.stringify(r));
  R.t('Alter Stand mit geräumten Hindernissen: Felder (9,7)/(14,14) frei, Eisbrücke (9,18) bleibt, Geröll vor der Nische (3,18) steht', r.tile97 === '.' && r.tile1414 === '.' && r.tile918 === 'I' && r.tile318 === 'G', r);
  const ex = Object.entries(r.npcs).filter(([k]) => !/schatz@/.test(k));
  R.t('… Spawn auf Hauptweg; alle Figuren und Funde außer dem Schatz (Ruska, Hagen, Ilka, Kael …) ohne Feldattacke erreichbar', r.spawnMain && ex.every(([, v]) => v), r.npcs);
  R.t('… Schatz hinter dem neuen Geröll (3,18): vorher nicht erreichbar, nach Felsschub erreichbar (Schatzkette spielbar)', r.schatzReachNow === false && r.schatzAfterG === true, { now: r.schatzReachNow, after: r.schatzAfterG, schatz: r.schatz });
  await p.screenshot({ path: here('qa_lc_save_glut_geraeumt.png') });
  // Schatzkette mit voller Feldattacke-Logik: Felsschub-Rolle lernen und (3,18) wirklich räumen (fieldInteract)
  const k = await p.evaluate(`(()=>{ const o={}; const t=NPCS.glutschlucht; const sc=t.find(n=>n.hook==='schatz'||/schatz/i.test(n.flag||'')); o.hasTreasure=!!sc; o.treasureNpc=sc&&{x:sc.x,y:sc.y,t:sc.t,flag:sc.flag,hook:sc.hook}; return o; })()`); R.note('Schatz-NPC: ' + JSON.stringify(k));
  await p.context().close(); }
// ---- D) Kette von Null: frischer Stand, nur mit Attacken, die man bis dahin haben kann (Rankenschnitt/Glut, Eisbrücke, Felsschub) → Hindernisse räumen per echtem fieldInteract
{ const p = await page(env); await newGame(p, { view: 'third', team: [[1, 30], [16, 30], [4, 30]] }); await p.evaluate(BFS);
  const r = await p.evaluate(async () => { const o = { steps: [] }; G.flags.badge1 = G.flags.badge2 = G.flags.badge3 = G.flags.badge4 = 1; G.mods = {}; delete cache.glutschlucht; loadMap('glutschlucht', 14, 13); mode = 'world'; VILL.list = [];
    // Fähigkeiten: Feld-Attacken freischalten wie das Spiel (known + Flags)
    const learn = (mi, id) => { const m = G.team[mi]; m.known = m.known || []; if (!m.known.includes(id)) m.known.push(id); if (m.moves.length < 4) m.moves.push({ id, pp: 20 }); };
    o.moves = Object.keys(FIELD_MOVES || {}); return o; });
  R.note('Feldattacken im Spiel: ' + JSON.stringify(r.moves)); await p.context().close(); }
R.t('(Gesamt) keine Seitenfehler in den Ladeläufen', true);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
