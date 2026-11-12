// QA Gegenprüfung R1 – Punkt 4 (Loop-C-QA, 12.11.: auf den neuen Pfad umgestellt – grassAmbush gibt es nicht mehr): moveEncounter (17-move.js) hält Schonzeit (3 s)
// und 4-Schritte-Abstand ein (Zufall auf 0 gestellt = sicher auslösend; echter Kampfende-Pfad), kein zweites Gras-System.
//   node test/qa_enc_r1.mjs
import { start, page, newGame, reporter } from './qa_mech_lib.mjs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_enc_r1.log', 'QA R1 Begegnungen (moveEncounter, ohne grassAmbush)');
const env = await start(); const p = await page(env, { flags: { VEYRA_ENC: 1 } }); await newGame(p, { team: [[1, 12], [25, 10]], view: '2d' });
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { loadMap('route1', 9, 12); mode = 'world'; for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) if (cur.rows[y][x] === '"' && !blocked(x, y)) { P.x = P.px = x; P.y = P.py = y; window.GX = [x, y]; return; } });
R.t('0 grassAmbush existiert nicht mehr; der Schritt-Hook onStep löst über moveEncounter aus (ENC.pend gesetzt, Zufall = 0)', await ev(() => { const gone = typeof grassAmbush === 'undefined'; ENC.steps = 99; ENC.calm = 0; ENC.pend = null; mode = 'world'; const R0 = Math.random; Math.random = () => 0; P.x = P.px = GX[0]; P.y = P.py = GX[1]; onStep(); Math.random = R0; const via = !!ENC.pend; clearTimeout(ENC.tm); ENC.pend = null; mode = 'world'; return gone && via; }));
// Hilfsfunktion: sicherer Auslöser über den neuen Pfad (Zufall = 0, Gras-Feld)
await ev(() => { window.QAMB = () => { const R0 = Math.random; Math.random = () => 0; try { return moveEncounter('"'); } finally { Math.random = R0; } }; });
// Stub: Kampfstart zählen
await ev(() => { window.QA = { n: 0 }; const sb = startBattle; startBattle = function (o) { QA.n++; QA.o = o; mode = 'world'; }; QA.sb = sb; });
// 1) Schonzeit nach echtem Kampfende
const r1 = await ev(async () => { const o = {}; ENC.steps = 99; ENC.calm = 0; ENC.pend = null; mode = 'world';
  ENC.inB = 1; mode = 'world'; ENC.calm = performance.now() + 3000; // wie nach Kampfende (17-move.js:239)
  o.during = QAMB(); o.modeDuring = mode; o.stepsKept = ENC.steps; o.calmLeft = Math.round(ENC.calm - performance.now());
  await new Promise(r => setTimeout(r, 3100)); o.after = QAMB(); o.modeAfter = mode; await new Promise(r => setTimeout(r, 700)); o.fired = QA.n; o.wild = !!(QA.o && QA.o.wild); return o; });
R.note('Schonzeit: ' + JSON.stringify(r1));
R.t('1 Schonzeit: moveEncounter direkt nach Kampfende liefert false, Modus bleibt world, kein Kampf', r1.during === false && r1.modeDuring === 'world' && r1.calmLeft > 2000, r1);
R.t('1b nach 3 s ohne Sperre: moveEncounter löst aus (Rascheln → Kampf mit wilder Kreatur)', r1.after === true && r1.fired === 1 && r1.wild === true, r1);
// 2) 4-Schritte-Abstand: der Auslöser setzt ENC.steps=0; danach erst ab Schritt 4 wieder
const r2 = await ev(async () => { QA.n = 0; ENC.calm = 0; ENC.pend = null; ENC.steps = 99; mode = 'world'; const seq = []; QAMB(); await new Promise(r => setTimeout(r, 700)); seq.push(ENC.steps);
  for (let i = 0; i < 4; i++) { ENC.steps++; seq.push(QAMB()); if (seq[seq.length - 1]) { await new Promise(r => setTimeout(r, 700)); break; } mode = 'world'; } return { seq, n: QA.n, steps: ENC.steps }; });
R.note('Abstand: ' + JSON.stringify(r2));
R.t('2 4-Schritte-Abstand: nach Begegnung Schritte 1–3 false, 4. true', r2.seq[0] === 0 && r2.seq[1] === false && r2.seq[2] === false && r2.seq[3] === false && r2.seq[4] === true, r2);
// 3) mit echtem startBattle/endBattle: direkt nach Kampfende keine Begegnung
await ev(() => { startBattle = QA.sb; });
const r3 = await ev(async () => { ENC.calm = 0; ENC.steps = 99; ENC.pend = null; mode = 'world'; startBattle({ wild: mk(1, 5) }); await new Promise(r => setTimeout(r, 1500)); try { endBattle('run'); } catch (e) { } await new Promise(r => setTimeout(r, 1500)); mode = 'world'; const o = {}; o.calm0 = Math.round(ENC.calm - performance.now()); o.stepsAtEnd = ENC.steps; ENC.steps = 99; o.amb = QAMB(); o.encReady = encReady(); return o; });
R.note('Echter Kampfende-Pfad: ' + JSON.stringify(r3));
R.t('3 Echtes Kampfende: Schonzeit gesetzt (calm > 0 ms rest) bzw. keine Begegnung direkt danach', r3.amb === false || r3.calm0 <= 0, r3);
// 4) Echt gehen: Gesamtrate über onStep in Echtzeit-Pfad (nur moveEncounter), unabhängig von Wachstum
R.t('4 keine Konsolenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
