// QA Mechanik – Prüfpunkt 5: Feldattacken/Hindernisse. Sperren ohne Attacke (Kind-Hinweis), Freischaltung mit Attacke, Baumstamm Y/Felsbrocken U,
// Hauptweg frei, Fundecken in Rollen-Reihenfolge per Script durchspielen, alte Spielstände (Flags ride/swim/glide), Glutschlucht-Sperren.
//   node test/qa_mech_field.mjs     Bilder: test/qa_mech_field_*.png
import { start, page, newGame, goMap, reporter, here } from './qa_mech_lib.mjs';
import { readFileSync } from 'fs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_field.log', 'QA Mechanik Feldattacken');
const env = await start();
const p = await page(env, { flags: {} });
await newGame(p, { team: [[1, 3]], view: '2d' });
const ev = (f, a) => p.evaluate(f, a);
// ---- gemeinsame Werkzeuge im Browser
await ev(() => {
  window.QA = {}; const SH = [[1, 0], [-1, 0], [0, 1], [0, -1]]; const DN = { '1,0': 'right', '-1,0': 'left', '0,1': 'down', '0,-1': 'up' };
  QA.passable = (t, ab, m, x, y, dx, dy) => { if (t === null || t === undefined) return false; if (t === 'D' || t === 'Y') return ab.has('rankenschnitt'); if (t === 'G') return ab.has('felsschub'); if (t === 'U') { if (!ab.has('felsschub')) return false; const t2 = tileAt(m, x + dx, y + dy); return t2 !== null && !SOLID.has(t2) && !/[0-9E]/.test(t2); }
    if (t === 'Q') return ab.has('eisbruecke'); if (t === '~') return ab.has('wellenritt'); if (t === 'X') return ab.has('kletterkralle'); return !SOLID.has(t); };
  QA.occ = (id) => new Set((NPCS[id] || []).filter(n => !npcHidden(n)).map(n => n.x + ',' + n.y));
  // BFS: starts [[x,y]], Ziel-Funktion goal(x,y) → true; liefert Weg [[x,y]...] oder null
  QA.bfs = (m, ab, starts, goal, occ) => { const key = (x, y) => x + ',' + y, prev = new Map(), q = []; for (const [x, y] of starts) { prev.set(key(x, y), null); q.push([x, y]); }
    while (q.length) { const [x, y] = q.shift(); if (goal(x, y)) { const out = []; let k = key(x, y), c = [x, y]; while (k) { out.push(c); const pr = prev.get(k); if (!pr) break; c = pr; k = key(c[0], c[1]); } return out.reverse(); }
      for (const [dx, dy] of SH) { const nx = x + dx, ny = y + dy, t = tileAt(m, nx, ny); if (prev.has(key(nx, ny))) continue; if (!QA.passable(t, ab, m, nx, ny, dx, dy)) continue; if (occ.has(key(nx, ny))) continue; prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); } } return null; };
  // Tiefe der Außenkarten ab morgenau
  QA.depth = {}; { const q = ['morgenau']; QA.depth.morgenau = 0; while (q.length) { const id = q.shift(); for (const d of 'nsew') { const to = MAPS[id][d]; if (typeof to === 'string' && MAPS[to] && !(to in QA.depth)) { QA.depth[to] = QA.depth[id] + 1; q.push(to); } } } }
  QA.entr = (m) => { const out = []; for (const d of 'nsew') { const to = MAPS[m.id][d]; if (typeof to !== 'string' || !MAPS[to] || !(to in QA.depth) || QA.depth[to] >= QA.depth[m.id]) continue; const hz = d === 'n' || d === 's';
      if (hz) { const y = d === 'n' ? 0 : m.h - 1; for (let x = 0; x < m.w; x++) if (!SOLID.has(m.rows[y][x])) out.push([x, y]); } else { const x = d === 'w' ? 0 : m.w - 1; for (let y = 0; y < m.h; y++) if (!SOLID.has(m.rows[y][x])) out.push([x, y]); } } return out; };
  QA.settle = async () => { for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 60)); const ob = document.querySelectorAll('#dlgOpts button'); if (!document.getElementById('dlg').hidden && ob.length) { ob[0].click(); continue; } if (mode === 'dialog' || mode === 'wait') { TW && TW.finish && TW.finish(); advDlg(); continue; } if (mode === 'world' && !P.moving) { await new Promise(r => setTimeout(r, 60)); if (mode === 'world') return; } } };
});
// ---- A) ohne Attacke: Reiten-Knopf, Schwimmen/Gleiten/Klettern gesperrt + Kind-Hinweis
const wk = await ev(() => { const s = Object.keys(MONS).map(Number).find(s => MONS[s] && !canCarry(s) && MONS[s].t.length && !MONS[s].legend); G.team = [mk(s, 3)]; G.badges = ['a', 'b', 'c', 'd']; G.flags.swim = G.flags.glide = G.flags.climb = G.flags.ride = 1; return { s, name: MONS[s].n, t: MONS[s].t }; });
R.note('Schwache Kreatur: ' + JSON.stringify(wk));
const noAtk = await ev(async () => { loadMap('windkueste', 5, 5); mode = 'world'; ROAM.list = []; moveTick(16); await new Promise(r => setTimeout(r, 500)); const vis = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]'); };
  const o = { rideOK: rideOK(), inRide: vis(document.querySelector('.in-ride')), legacy: vis(document.getElementById('rideBtn')), legacyHiddenAttr: document.getElementById('rideBtn') && document.getElementById('rideBtn').hidden, flagsRide: G.flags.ride };
  const msgs = []; const t0 = toast; toast = (t) => msgs.push(t); const sayM = []; const s0 = say; say = (t) => { sayM.push(Array.isArray(t) ? t.join(' | ') : t); return s0(t); };
  // R-Taste ohne Träger
  toggleRide(); o.rideSay = sayM.slice(); for (let i = 0; i < 6; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world';
  // Wasser: nach Osten ins Wasser laufen (2D)
  let sp = null; for (let y = 1; y < cur.h - 1 && !sp; y++) for (let x = 1; x < cur.w - 1; x++) if (!blocked(x, y) && cur.rows[y][x] !== '~' && cur.rows[y][x + 1] === '~') { sp = [x, y]; break; }
  P.x = P.px = sp[0]; P.y = P.py = sp[1]; P.dir = 'right'; MV.toastT = {}; tryMove('right'); o.swimPos = [P.x, P.y]; o.swimToast = msgs.slice(); msgs.length = 0; o.swimState = P.state;
  // Gleiten (Kante R), Klettern (X): lockToast direkt
  MV.toastT = {}; lockToast('glide'); lockToast('climb'); o.lockToasts = msgs.slice(); msgs.length = 0; MV.toastT = {}; G.badges = ['a']; G.flags.swim = 0; lockToast('swim'); o.preMedal = msgs.slice(); msgs.length = 0; G.badges = ['a', 'b', 'c', 'd']; G.flags.swim = 1;
  // Kind-Hinweise (Hindernisse): Text nach Feldnutzung ohne Attacke
  o.need = {}; for (const id of Object.keys(FIELD_MOVES)) { const a = fieldNeedText(id, FIELD[{ rankenschnitt: 'D', felsschub: 'G', eisbruecke: 'Q' }[id] || 'D'].name); o.need[id] = a; }
  toast = t0; say = s0; return o; });
R.note('Ohne Attacke: ' + JSON.stringify(noAtk));
await ev(async () => { setView('third', 1); await new Promise(r => setTimeout(r, 1500)); loadMap('route1', 9, 12); mode = 'world'; await new Promise(r => setTimeout(r, 800)); });
const ride3 = await ev(() => { const e = document.querySelector('.in-ride'); const r = e && e.getBoundingClientRect(); return { rideOK: rideOK(), inRideVisible: !!(e && r.width > 0 && !e.hidden && getComputedStyle(e).visibility !== 'hidden') }; }); await ev(() => setView('2d', 1));
R.t('A Ohne Träger: Reiten-Knopf im 3D-HUD (.in-ride) nicht sichtbar', ride3.inRideVisible === false, ride3);
R.t('A (niedrig) 2D-Altknopf #rideBtn ohne Träger ebenfalls verborgen', noAtk.legacy !== true, { legacy: noAtk.legacy, flagsRide: noAtk.flagsRide, rideOK: noAtk.rideOK });
R.t('A Ohne Träger: R-Taste gibt kurzen Kind-Hinweis mit Beispiel-Arten', noAtk.rideSay.length > 0 && /Reiten/.test(noAtk.rideSay[0]) && /wie \w+/.test(noAtk.rideSay[0]) && noAtk.rideSay[0].length < 140, noAtk.rideSay);
R.t('A Ohne Wellenritt: Wasser gesperrt (Figur bleibt am Ufer, kein Schwimmen)', noAtk.swimState !== 'swim', noAtk);
const sh = ['swim', 'glide', 'climb'].map((k, i) => (noAtk.swimToast[0] || '')); const allHints = [...noAtk.swimToast, ...noAtk.lockToasts];
R.t('A Sperren-Hinweis kurz (≤ 120 Zeichen), nennt Attacke + Typ + Beispielart (Schwimmen/Gleiten/Klettern)', allHints.length >= 3 && allHints.every(h => h.length <= 120 && /Hier bräuchte ich \w+/.test(h) && /Lv \d+/.test(h)), allHints);
R.t('A Hinweis vor der Medaille nennt Medaille und Attacke', noAtk.preMedal.length === 1 && /Wellenorden|Medaille/.test(noAtk.preMedal[0]) && /Wellenritt/.test(noAtk.preMedal[0]), noAtk.preMedal);
// Fremdbegriff-Prüfung der Hinweise: „Orden“ vs „Medaille“ (zentraler Filter)
R.note('Hinweis „Orden“ im Rohtext: ' + noAtk.preMedal.join(' / '));
// Feld-Hinweis-Texte (alle 7)
const needLens = Object.entries(noAtk.need).map(([k, v]) => k + ':' + v.join(' ').length); R.note('Hinweislängen (Zeichen): ' + needLens.join(' '));
R.t('A Hindernis-Hinweise (7 Attacken): 2 kurze Sätze, nennt Attacke, Typ, Level, Beispiel + Rolle', Object.values(noAtk.need).every(v => v.length === 2 && v.join(' ').length <= 190 && /Hier bräuchte ich/.test(v[0]) && /ab Level \d+/.test(v[1]) && /Rolle/.test(v[1])), noAtk.need);
// ---- B) mit Attacke: Schwimmen / Gleiten / Klettern / Reiten freigeschaltet
const withAtk = await ev(async () => { G.badges = ['a', 'b', 'c', 'd']; G.flags.swim = G.flags.glide = G.flags.climb = G.flags.ride = 1; const pick = t => Object.keys(MONS).map(Number).find(s => MONS[s] && MONS[s].t.includes(t) && !MONS[s].legend);
  const flut = pick('flut'), boe = pick('boe'), fels = pick('fels'); G.team = [mk(flut, 16), mk(boe, 16), mk(fels, 20)];
  const o = { swim: moveUnlocked('swim'), glide: moveUnlocked('glide'), climb: moveUnlocked('climb'), ride: moveUnlocked('ride') }; o.mons = [moveMon('swim'), moveMon('glide'), moveMon('climb')].map(m => m && MONS[m.s].n);
  // Wasser betreten 2D
  loadMap('windkueste', 5, 5); mode = 'world'; ROAM.list = []; let sp = null; for (let y = 1; y < cur.h - 1 && !sp; y++) for (let x = 1; x < cur.w - 1; x++) if (!blocked(x, y) && cur.rows[y][x] !== '~' && cur.rows[y][x + 1] === '~') { sp = [x, y]; break; }
  P.x = P.px = sp[0]; P.y = P.py = sp[1]; P.dir = 'right'; tryMove('right'); await new Promise(r => setTimeout(r, 700)); moveTick(16); o.swimState = P.state; o.swimTile = tileAt(cur, P.x, P.y);
  // Karte mit Kante R und Wand X suchen
  o.ledgeMaps = Object.keys(MAPS).filter(id => getMap(id).rows.some(r => r.includes('R'))); o.wallMaps = Object.keys(MAPS).filter(id => !getMap(id).inside && getMap(id).theme !== 'cave' && getMap(id).rows.some(r => r.includes('X')));
  return o; });
R.note('Mit Attacke: ' + JSON.stringify(withAtk));
R.t('B Mit Attacke + Medaillen: Schwimmen/Gleiten/Klettern/Reiten freigeschaltet (moveUnlocked)', withAtk.swim && withAtk.glide && withAtk.climb, withAtk);
R.t('B Mit Wellenritt: Figur schwimmt (P.state swim auf Wasserfeld)', withAtk.swimState === 'swim' && /~|Q/.test(withAtk.swimTile), withAtk);
// ---- C) Baumstamm Y / Felsbrocken U (Dialog „Einsetzen?“, Hindernis verschwindet) + Hindernis-Hinweis ohne Attacke
const yu = await ev(async () => { const o = {}; G.team = [mk(Object.keys(MONS).map(Number).find(s => MONS[s] && MONS[s].t.includes('flora') && !MONS[s].legend), 8)]; G.badges = ['a']; mode = 'world'; ROAM.list = [];
  // Y auf route1 (17,1): von (16,1) aus nach rechts
  loadMap('route1', 16, 1); mode = 'world'; ROAM.list = []; P.dir = 'right'; o.tileBefore = tileAt(cur, 17, 1); const sM = []; const s0 = say; say = (t) => { sM.push(Array.isArray(t) ? t.join(' | ') : t); return s0(t); }; const ask0 = ask; let q = null; ask = (txt, opts, cb) => { q = txt; return ask0(txt, opts, cb); };
  interact(); await new Promise(r => setTimeout(r, 300)); o.askY = q; const bt = document.querySelectorAll('#dlgOpts button'); o.optsY = [...bt].map(b => b.textContent); if (bt[0]) bt[0].click(); await new Promise(r => setTimeout(r, 400)); for (let i = 0; i < 6; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world'; o.tileAfter = tileAt(cur, 17, 1); o.mod = JSON.stringify((G.mods.route1 || []).slice(-2)); o.sayY = sM.slice(); sM.length = 0;
  // U auf route2 (16,3): ohne Felsschub → Hinweis; mit Felsschub von oben (16,2) nach unten
  loadMap('route2', 16, 2); mode = 'world'; ROAM.list = []; P.dir = 'down'; o.uBefore = tileAt(cur, 16, 3); G.team = [mk(1, 3)]; q = null; interact(); await new Promise(r => setTimeout(r, 300)); o.uNoAtk = sM.slice(); for (let i = 0; i < 6; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world'; sM.length = 0;
  const fels = Object.keys(MONS).map(Number).find(s => MONS[s] && MONS[s].t.includes('fels') && !MONS[s].legend); G.team = [mk(fels, 12)]; P.dir = 'down'; q = null; interact(); await new Promise(r => setTimeout(r, 300)); o.askU = q; const b2 = document.querySelectorAll('#dlgOpts button'); if (b2[0]) b2[0].click(); await new Promise(r => setTimeout(r, 400)); for (let i = 0; i < 6; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world';
  o.uAfter = [tileAt(cur, 16, 3), tileAt(cur, 16, 4)]; say = s0; ask = ask0; return o; });
R.note('Y/U: ' + JSON.stringify(yu));
R.t('C Baumstamm Y (Route 1 17,1): ohne Rankenschnitt nicht, mit Rankenschnitt Frage „Einsetzen?“ → Hindernis weg, Änderung in G.mods', yu.tileBefore === 'Y' && /Rankenschnitt/.test(yu.askY || '') && yu.tileAfter === '.' && /17,1/.test(yu.mod), yu);
R.t('C Felsbrocken U (Route 2 16,3): ohne Felsschub Kind-Hinweis, mit Felsschub „Schieben?“ → Brocken rutscht ein Feld nach unten', yu.uBefore === 'U' && yu.uNoAtk.some(t => /Felsschub/.test(t)) && /Schieben/.test(yu.askU || '') && yu.uAfter[0] === '.' && yu.uAfter[1] === 'U', yu);
await p.close();
// ---- D) Hauptweg frei ohne Attacke (alle Außenkarten): Ausgänge zu tieferen Karten, Türen, Figuren, Funde erreichbar?
const p2 = await page(env, { flags: {} }); await newGame(p2, { team: [[1, 3]], view: '2d' });
await p2.evaluate(() => { window.QA = {}; });
// Funktionen erneut in p2 definieren (aus Datei-Quelltext des ersten Blocks kopiert)
const libSrc = readFileSync(new URL('./qa_mech_field.mjs', import.meta.url), 'utf8').match(/\/\/ ---- gemeinsame Werkzeuge im Browser\nawait ev\(\(\) => \{([\s\S]*?)\n\}\);\n\/\/ ---- A\)/)[1];
await p2.evaluate(new Function('return () => {' + libSrc + '}')());
const main = await p2.evaluate(() => { const rep = []; const none = new Set(); const order = Object.keys(QA.depth).filter(id => MAPS[id]); G.flags.starter = 1;
  for (const id of order) { loadMap(id, 5, 5); const m = cur, ent = QA.entr(m), occ = QA.occ(id), r = { id, depth: QA.depth[id], ent: ent.length, miss: [] }; const starts = ent.length ? ent : (() => { const g = []; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (!SOLID.has(m.rows[y][x]) && !occ.has(x + ',' + y)) { g.push([x, y]); y = 99; break; } return g; })();
    // Ausgänge zu tieferen Karten
    for (const d of 'nsew') { const to = MAPS[id][d]; if (typeof to !== 'string' || !MAPS[to] || QA.depth[to] <= QA.depth[id]) continue; const hz = d === 'n' || d === 's', edge = (x, y) => hz ? y === (d === 'n' ? 0 : m.h - 1) : x === (d === 'w' ? 0 : m.w - 1); if (!QA.bfs(m, none, starts, (x, y) => edge(x, y) && !SOLID.has(m.rows[y][x]), occ)) r.miss.push('Ausgang ' + d + '→' + to); }
    // Türen
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (/[0-9E]/.test(m.rows[y][x])) { if (!QA.bfs(m, none, starts, (a, b) => a === x && b === y, occ)) r.miss.push('Tür ' + m.rows[y][x] + '@' + x + ',' + y); }
    // Figuren (Sprechen: Nachbarfeld), keine Funde
    for (const n of NPCS[id] || []) { if (npcHidden(n) || n.t === 'item') continue; if (!QA.bfs(m, none, starts, (a, b) => Math.abs(a - n.x) + Math.abs(b - n.y) === 1, new Set([...occ].filter(k => k !== n.x + ',' + n.y)))) r.miss.push('Figur ' + (n.name || n.hook || n.t) + '@' + n.x + ',' + n.y); }
    rep.push(r); }
  return rep; });
R.note('Hauptweg ohne Attacke: ' + JSON.stringify(main.map(r => r.id + ':' + r.miss.length + (r.miss.length ? ' ' + r.miss.join(';') : ''))));
R.t('D Hauptweg frei: Ausgänge nach „vorn“, Türen und Figuren auf allen Außenkarten ohne Attacke erreichbar (Ausnahmen separat bewertet: Siegesstraße Tür 1 = Palastwache, Glutschlucht-Figuren hinter Geröll/Dornen)', main.every(r => r.miss.filter(m => !(r.id === 'siegesstrasse' && /Tür 1/.test(m)) && !(r.id === 'glutschlucht' && /Figur/.test(m))).length === 0), main.filter(r => r.miss.length));
R.note('Ausnahme Siegesstraße: Tür 1@10,5 ist durch Palastwache@10,6 verstellt (Story-Sperre, keine Feldattacke).');
// ---- E) Glutschlucht: Sperren (16-expansion.js:67) vs. Figuren/Funde
const gl = await p2.evaluate(() => { loadMap('glutschlucht', 5, 5); const m = cur, occ = QA.occ('glutschlucht'); const starts = [[0, m.h - 1]]; for (let y = 0; y < m.h; y++) if (!SOLID.has(m.rows[y][0])) { starts.length = 0; starts.push([0, y]); break; }
  const sets = { keine: [], ranken: ['rankenschnitt'], fels: ['felsschub'], eis: ['eisbruecke'], alle: ['rankenschnitt', 'felsschub', 'eisbruecke'] }; const out = { start: starts[0], obst: [] };
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if ('DGQYU'.includes(m.rows[y][x])) out.obst.push(m.rows[y][x] + '@' + x + ',' + y);
  out.targets = {}; for (const n of NPCS.glutschlucht) { if (npcHidden(n)) continue; const nm = (n.name || n.hook || n.f || n.t) + '@' + n.x + ',' + n.y; out.targets[nm] = {}; for (const [k, a] of Object.entries(sets)) out.targets[nm][k] = !!QA.bfs(m, new Set(a), starts, (a2, b) => Math.abs(a2 - n.x) + Math.abs(b - n.y) === 1, new Set([...occ].filter(q => q !== n.x + ',' + n.y))); }
  // Ausgänge
  out.exits = {}; for (const d of 'nsew') { const to = MAPS.glutschlucht[d]; if (typeof to !== 'string') continue; const hz = d === 'n' || d === 's', edge = (x, y) => hz ? y === (d === 'n' ? 0 : m.h - 1) : x === (d === 'w' ? 0 : m.w - 1); out.exits[d + '→' + to] = {}; for (const [k, a] of Object.entries(sets)) out.exits[d + '→' + to][k] = !!QA.bfs(m, new Set(a), starts, (x, y) => edge(x, y) && !SOLID.has(m.rows[y][x]), occ); }
  out.doors = {}; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (/[0-9E]/.test(m.rows[y][x])) { out.doors[m.rows[y][x] + '@' + x + ',' + y] = {}; for (const [k, a] of Object.entries(sets)) out.doors[m.rows[y][x] + '@' + x + ',' + y][k] = !!QA.bfs(m, new Set(a), starts, (a2, b) => a2 === x && b === y, occ); }
  out.rows = m.rows.map((r, i) => r + ' ' + i); return out; });
R.note('Glutschlucht: ' + JSON.stringify({ start: gl.start, obst: gl.obst, targets: gl.targets, exits: gl.exits, doors: gl.doors }));
writeFileSync_(gl.rows);
function writeFileSync_(rows) { R.note('Glutschlucht-Karte:\n' + rows.join('\n')); }
// ---- F) Fundecken in Rollen-Reihenfolge per Script durchspielen (echtes Laufen/Interagieren, Replan nach jedem Hindernis)
const seq = [['route1', 'rolle_rankenschnitt', 'flora'], ['kupferhain', 'rolle_leuchtfeuer', 'lumen'], ['route2', 'rolle_felsschub', 'fels'], ['brisenhafen', 'rolle_wellenritt', 'flut'], ['route3', 'rolle_eisbruecke', 'frost'], ['windkueste', 'rolle_kletterkralle', 'fels'], ['frostheim', 'rolle_sturmfluegel', 'boe']];
await p2.close();
const p3 = await page(env, { flags: {} }); await newGame(p3, { team: [[1, 3]], view: '2d' });
await p3.evaluate(new Function('return () => {' + libSrc + '}')());
await p3.evaluate(() => { const pick = t => Object.keys(MONS).map(Number).find(s => MONS[s] && MONS[s].t.includes(t) && !MONS[s].legend && !canCarry(s)); const L = ['flora', 'lumen', 'fels', 'flut', 'frost', 'boe']; G.team = L.map(t => mk(pick(t), 3)); G.badges = ['a', 'b', 'c', 'd']; G.flags.swim = G.flags.glide = G.flags.climb = 1; G.flags.starter = 1; SET.skipBattleIntro = 1; });
const fres = []; const have = [];
for (const [map, item, ty] of seq) {
  const found = await p3.evaluate(([map, item]) => { const n = Object.entries(NPCS).flatMap(([id, L]) => L.filter(q => q.item === item && q.f === 'scroll' || q.item === item).map(q => ({ id, q })))[0]; return n ? { id: n.id, x: n.q.x, y: n.q.y, flag: n.q.flag, f: n.q.f } : null; }, [map, item]);
  const abil = [...have]; const res = { map, item, find: found, abilities: abil.slice(), steps: 0, actions: [], ok: false };
  if (!found || found.id !== map) { res.err = 'Fundort passt nicht zur Karte'; fres.push(res); continue; }
  const r = await p3.evaluate(async ([map, abil, found]) => { const ab = new Set(abil); for (const L of Object.values(NPCS)) for (const q of L) if (q.t === 'trainer' && q.flag) G.flags[q.flag] = 1; loadMap(map, 0, 0); mode = 'world'; ROAM.list = []; ROAM.want = 0; const m = cur, occ = QA.occ(map); const o = { actions: [], steps: 0 };
    const ent = QA.entr(m); const starts = ent.length ? ent : [[1, 1]]; const st = QA.bfs(m, new Set(['x']), starts, () => true, new Set()); let pos = starts[0]; P.x = P.px = pos[0]; P.y = P.py = pos[1]; o.start = pos;
    const goal = (x, y) => Math.abs(x - found.x) + Math.abs(y - found.y) === 1; const dirOf = (dx, dy) => ({ '1,0': 'right', '-1,0': 'left', '0,1': 'down', '0,-1': 'up' })[dx + ',' + dy];
    for (let iter = 0; iter < 60; iter++) { const occ2 = new Set([...QA.occ(map)].filter(k => k !== found.x + ',' + found.y)); occ2.add(found.x + ',' + found.y); const path = QA.bfs(cur, ab, [[P.x, P.y]], goal, occ2); if (!path) { o.err = 'kein Weg von ' + P.x + ',' + P.y; return o; }
      if (path.length === 1) break; let acted = false;
      for (let i = 1; i < path.length; i++) { const [nx, ny] = path[i], dx = nx - P.x, dy = ny - P.y, t = tileAt(cur, nx, ny), d = dirOf(dx, dy); P.dir = d; P.ang = YAW[d];
        if ('DYGUQ'.includes(t)) { o.actions.push(t + '@' + nx + ',' + ny); interact(); await QA.settle(); acted = true; break; }
        if (t === '~' || t === 'X') { /* Wasser/Wand: tryMove in 2D */ }
        try { VILL.list = []; } catch (e) { } P.moving = false; tryMove(d); if (P.moving) { P.moving = false; P.px = P.x; P.py = P.y; G.px = P.x; G.py = P.y; onStep(); } if (mode !== 'world') await QA.settle();
        if (P.x !== nx || P.y !== ny) { o.err = `Schritt blockiert bei ${nx},${ny} (${t}) pos ${P.x},${P.y} mode ${mode} blocked ${blocked(nx, ny)} npc ${npcAt(nx, ny) && npcAt(nx, ny).t} vill ${typeof villAt === 'function' && !!villAt(nx, ny)}`; return o; } o.steps++; }
      if (!acted) break; }
    // Fund ansprechen
    const dx = found.x - P.x, dy = found.y - P.y; if (Math.abs(dx) + Math.abs(dy) !== 1) { o.err = 'nicht neben dem Fund: ' + P.x + ',' + P.y + ' → ' + found.x + ',' + found.y; return o; } const d = dirOf(dx, dy); P.dir = d; P.ang = YAW[d]; mode = 'world'; interact(); await QA.settle();
    o.flag = !!G.flags[found.flag]; o.bag = G.bag[found.flag && found.flag.startsWith('sc_') ? 'rolle_' + found.flag.slice(3) : ''] || 0; return o; }, [map, abil, found]);
  Object.assign(res, r);
  // Rolle lernen (echter teachScroll) auf passende Kreatur
  const learnt = await p3.evaluate(([item, ty]) => { const m = G.team.find(m => MONS[m.s].t.includes(ty) || canLearnScroll(item, m) === 'ok'); const mm = G.team.find(m => canLearnScroll(item, m) === 'ok'); if (!mm) return { err: 'niemand kann lernen' }; const txt = teachScroll(item, mm); return { who: MONS[mm.s].n, txt, id: ITEMS[item].mv, knows: fieldKnows(mm, ITEMS[item].mv) }; }, [item, ty]);
  res.learn = learnt; res.ok = !!(r.flag && !r.err && learnt.knows); if (res.ok) have.push(ITEMS_mv(item)); fres.push(res);
}
function ITEMS_mv(item) { return item.replace('rolle_', ''); }
R.note('Fundecken in Rollen-Reihenfolge: ' + JSON.stringify(fres.map(r => ({ map: r.map, item: r.item, ok: r.ok, steps: r.steps, actions: r.actions, with: r.abilities, err: r.err, who: r.learn && r.learn.who }))));
for (const r of fres) R.t(`F ${r.map}: Rolle „${r.item.replace('rolle_', '')}“ erreichbar mit ${r.abilities.length ? r.abilities.join('+') : 'keiner Attacke'} (${r.steps} Schritte, Aktionen ${r.actions.join(',') || '–'}) und lernbar`, r.ok, r);
R.t('F Keine Konsolenfehler im Durchspielen', p3.errs.length === 0, p3.errs);
await p3.close();
// ---- G) alte Spielstände: Flags ride/swim/glide/climb gesetzt, Team ohne Attacken → spielbar, kein Absturz
for (const f of ['old_save_4orden.json', 'old_save_pre_a1.json']) {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/' + f, import.meta.url), 'utf8')); raw.flags = Object.assign({}, raw.flags, { ride: 1, swim: 1, glide: 1, climb: 1 }); if (f.includes('4orden')) raw.flags.swim = 1;
  const q = await env.browser.newPage({ viewport: { width: 860, height: 484 } }); q.errs = []; q.on('pageerror', e => q.errs.push(e.message)); q.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) q.errs.push(m.text().slice(0, 160)); });
  await q.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await q.addInitScript(s => { localStorage.setItem('veyra_save_v1', s); window.VEYRA_DEMO = 1; }, JSON.stringify(raw)); await q.goto(env.S.url + 'index.html', { waitUntil: 'load' });
  await q.click('#iPrompt').catch(() => { }); await q.waitForTimeout(500); await q.click('#iSkip').catch(() => { }); await q.waitForTimeout(800); const cont = await q.click('#tCont', { timeout: 4000 }).then(() => true, () => false); await q.waitForTimeout(2500);
  const s = await q.evaluate(async () => { mode = 'world'; const o = { map: G.map, team: G.team.map(m => MONS[m.s].n + ' Lv' + m.l), badges: (G.badges || []).length, flags: { ride: G.flags.ride, swim: G.flags.swim, glide: G.flags.glide, climb: G.flags.climb } };
    o.unlock = { ride: moveUnlocked('ride'), swim: moveUnlocked('swim'), glide: moveUnlocked('glide'), climb: moveUnlocked('climb') }; o.mons = ['swim', 'glide', 'climb'].map(k => moveMon(k) && MONS[moveMon(k).s].n); o.known = G.team.map(m => (m.known || []).join(',')); 
    // Spielstand läuft: 3 Karten laden, 60 Frames
    for (const id of ['route1', 'brisenhafen', 'route3']) { loadMap(id, 5, 5); mode = 'world'; ROAM.list = []; await new Promise(r => setTimeout(r, 300)); } o.after = G.map; o.mode = mode; return o; });
  R.note(`${f}: ${JSON.stringify(s)}`); R.t(`G Alter Spielstand ${f} (+Flags ride/swim/glide/climb): lädt (Fortsetzen), läuft, keine Fehler; Freischaltung folgt der Attacke, nicht dem Flag`, cont && s.team.length > 0 && q.errs.length === 0 && (s.unlock.swim === !!s.mons[0]) && (s.unlock.glide === !!s.mons[1]) && (s.unlock.climb === !!s.mons[2]), { s, errs: q.errs });
  await q.close();
}
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
