// QA Loop C – Punkt 7: Laufzyklus „Rennen“ im echten Spiel (Route 1, 3. Person). Die Hauptschleife `loop(t)` wird mit festem dt = 1/60 s von Hand getaktet
// (rAF abgeklemmt, Render währenddessen gesperrt), Messung Gelenksprünge je Frame und Fußgleiten des Standfußes, Screenshot-Reihe über einen Doppelschritt.
//   node test/qa_lc_run.mjs      Bilder: test/qa_lc_run_*.png
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const R = reporter('qa_lc_run.log', 'QA Loop C – Laufzyklus Rennen im Spiel');
const env = await start(); const p = await page(env, { w: 860, h: 484 }); await newGame(p, { view: 'third' });
const ev = (f, a) => p.evaluate(f, a);
await goMap(p, 'route1', 9, 21, 'up'); await p.waitForTimeout(3500);
await ev(() => { window.QR = { T: performance.now(), cnt: 0 }; window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; window.__render = R3.r.render.bind(R3.r); window.__pn = performance.now.bind(performance); performance.now = () => QR.T; R3.r.render = () => { };
  QR.tick = (n) => { for (let i = 0; i < n; i++) { QR.T += 1000 / 60; lastT = QR.T - 1000 / 60; R3.player.updateMatrixWorld(true); loop(QR.T); QR.cnt++; } }; QR.tick(2); });
// längste freie Spur (Spalte) suchen, damit die Figur beim Rennen nicht anstößt
const lane = await ev(() => { let best = null; for (let x = 1; x < cur.w - 1; x++) { let run = 0; for (let y = cur.h - 1; y >= 0; y--) { const t = tileAt(cur, x, y); const free = t && !SOLID.has(t) && t !== '~' && !/[0-9]/.test(t) && !npcAt(x, y) && !roamAt(x, y); if (free) { run++; if (!best || run > best.len) best = { x, y0: y + run - 1, y1: y, len: run }; } else run = 0; } } return best; });
R.note('Spur: ' + JSON.stringify(lane));
await ev(l => { ROAM.list = []; VILL.list = []; window.QL = l; QR.tele = () => { const a = QL.y0 - 0; P.x = P.fx = P.px = QL.x; P.y = P.fy = P.py = a; P.moving = false; }; QR.tele(); P.dir = 'up'; P.ang = 0; R3.snap = 1; QR.tick(2); }, lane);
// Zustand Rennen herstellen
const setup = await ev(() => { G.flags.starter = 1; mode = 'world'; MV.rw = true; STICK.x = 0; STICK.y = -1; const o = {}; QR.tick(50); o.state = P.state; o.run = P.run; o.v = +(P.v || 0).toFixed(2); o.pos = [+P.px.toFixed(2), +P.py.toFixed(2)]; return o; });
R.note('Start: ' + JSON.stringify(setup));
const measure = (flat) => ev((flat) => { if (flat) { window.__ty = terrainY; terrainY = () => 0; } else if (window.__ty) terrainY = window.__ty; const f = R3.player, rig = f.userData.rig, B = rig.b, Gt = f.userData.gait; const snap = () => { const o = []; for (const b of B) o.push(b.rotation.x, b.rotation.y, b.rotation.z, b.position.y); return o; };
  const cls = i => { const b = i >> 2; return [4, 5, 7, 8].includes(b) ? 'bein' : [6, 9].includes(b) ? 'fuss' : b >= 10 ? 'arm' : 'rumpf'; };
  const mx = { bein: 0, fuss: 0, arm: 0, rumpf: 0 }; let mxAll = 0, worst = null; const per = []; let tmp = new THREE.Vector3(), slip = 0, runs = [], dsum = 0, dn = 0, knie = 0;
  STICK.y = 0; QR.tick(40); QR.tele(); P.dir = 'up'; P.ang = 0; QR.tick(30); STICK.y = -1; QR.tick(50); let prev = snap(), lx = P.px, ly = P.py, prevF = [null, null], on = [0, 0];
  for (let k = 0; k < 100; k++) { QR.tick(1); dsum += Math.hypot(P.px - lx, P.py - ly); dn++; lx = P.px; ly = P.py; f.updateMatrixWorld(true); const s = snap(); let fm = 0; for (let i = 0; i < s.length; i++) { const d = Math.abs(s[i] - prev[i]); const c = cls(i); if (i % 4 !== 3) { if (i % 4 === 0 && ((i >> 2) === 5 || (i >> 2) === 8) && d > knie) knie = d; if (d > mx[c]) mx[c] = d; if (d > fm) fm = d; if (d > mxAll) { mxAll = d; worst = [k, 'b' + (i >> 2), 'xyz'[i & 3], +d.toFixed(2)]; } } } per.push(fm); prev = s;
    // Bewegungsdynamik 12.11.: Drehpunkt (Ferse/Ballen) mit DEMSELBEN Punkt im Vorframe vergleichen – der Fuß rollt jetzt über den flachen Fuß ab, der Wechsel des Drehpunkts ist kein Gleiten
    for (let i = 0; i < 2; i++) { const L = Gt.legs && Gt.legs[i]; if (!L) continue; const ft = B[i ? 9 : 6], hl = new THREE.Vector3(0, -RIG.HA, RIG.HEEL).applyMatrix4(ft.matrixWorld), bl = new THREE.Vector3(0, -RIG.HA, -RIG.BALL).applyMatrix4(ft.matrixWorld), j = (L.thc || 0) > 0 ? 0 : 1; tmp.copy(j ? bl : hl);
      if (L.on) { if (prevF[i]) slip = Math.max(slip, Math.hypot(tmp.x - prevF[i][j][0], tmp.z - prevF[i][j][1])); prevF[i] = [[hl.x, hl.z], [bl.x, bl.z]]; on[i]++; } else { if (on[i]) runs.push(on[i]); on[i] = 0; prevF[i] = null; } } }
  const sorted = per.slice().sort((a, b) => b - a); const stance = runs.length ? runs.reduce((a, b) => a + b, 0) / runs.length : 0; const n = x => per.filter(v => v > x).length;
  return { flat, frames: per.length, mx: Object.fromEntries(Object.entries(mx).map(([k, v]) => [k, +v.toFixed(3)])), mxAll: +mxAll.toFixed(3), knie: +knie.toFixed(3), worst, top5: sorted.slice(0, 5).map(v => +v.toFixed(2)), over077: n(.771), over09: n(.9), over10: n(1.0), speed: +(dsum / (dn / 60)).toFixed(2), slip: +slip.toFixed(4), stanceFr: +stance.toFixed(1), runs: runs.length, state: P.state, run: P.run, S: +Gt.S.toFixed(2) }; }, flat);
const meas = await measure(false); const flat = await measure(true);
await ev(() => { terrainY = window.__ty; });
R.note('FLACH (terrainY = 0): ' + JSON.stringify(flat));
R.note('Rennen im Gelände (Route 1, 100 Frames à 1/60 s nach 50 Frames Anlauf): ' + JSON.stringify(meas));
R.t('Spieler rennt wirklich (P.run, Geschwindigkeit > 3 Felder/s)', meas.run && meas.speed > 3, meas);
R.t('Gelenksprung auf ebenem Boden (terrainY = 0): ≤ 0,85 rad/Frame (Loop-C-Messwert 0,771 reproduziert, Messrauschen ±0,04)', flat.mxAll <= 0.85, { mxAll: flat.mxAll, top5: flat.top5 });
R.t('Gelenksprung im Gelände (echtes terrainY, Route 1): Maximum ≤ 0,9 rad/Frame (Schwelle Loop C für Rennen)', meas.mxAll <= 0.9, { mx: meas.mx, worst: meas.worst, over09: meas.over09, over10: meas.over10, top5: meas.top5 });
R.t('Nachbesserung 1: Kniewinkel-Änderung ≤ 0,6 rad/Frame (eben und Gelände)', meas.knie <= 0.6 && flat.knie <= 0.6, { gelaende: meas.knie, eben: flat.knie });
R.t('Nachbesserung 1: ebener Boden ≤ 0,77 rad/Frame (Loop-C-Vorgabe Rennen)', flat.mxAll <= 0.77, { mxAll: flat.mxAll });
R.t('Fußgleiten Standfuß ≤ 0,02 Felder/Frame', meas.slip <= 0.02, { slip: meas.slip });
R.t('Standphase ≥ 3 Frames im Mittel', meas.stanceFr >= 3, { stance: meas.stanceFr });
// ---- Screenshot-Reihe: 8 Bilder im Abstand von 2 Frames (ein Doppelschritt), Spielkamera hinter der Figur und Seitenansicht (Figur 90° gedreht)
await ev(() => { STICK.y = 0; QR.tick(40); QR.tele(); P.dir = 'up'; P.ang = 0; QR.tick(30); STICK.y = -1; QR.tick(55); });
const files = []; for (let i = 0; i < 8; i++) {
  for (const side of [0, 1]) {
    await ev((side) => { R3.r.render = window.__render; QR.tick(1); if (side) { R3.player.rotation.y += Math.PI / 2; R3.player.updateMatrixWorld(true); R3.r.render(R3.scene, R3.activeCam || R3.cam); } R3.r.render = () => { }; }, side);
    const box = await ev(() => { const v = new THREE.Vector3(R3.player.position.x, R3.player.position.y + .5, R3.player.position.z).project(R3.activeCam || R3.cam); const c = R3.r.domElement.getBoundingClientRect(); return { x: (v.x * .5 + .5) * c.width + c.left, y: (-v.y * .5 + .5) * c.height + c.top }; });
    const b = await p.screenshot({ clip: { x: Math.max(0, box.x - 110), y: Math.max(0, box.y - 130), width: 220, height: 230 } }); files.push(b.toString('base64')); if (side) await ev(() => { QR.tick(1); }); }
  await ev(() => { QR.tick(1); }); }
const sheet = await ev(async arr => { const cv = document.createElement('canvas'); cv.width = 220 * 8; cv.height = 230 * 2; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < arr.length; i++) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + arr[i]; }); const c = Math.floor(i / 2), rw = i % 2; g.drawImage(im, c * 220, rw * 230); g.fillStyle = '#26304a'; g.font = '700 14px sans-serif'; g.fillText(`Bild ${c + 1} ${rw ? 'Seite' : 'hinten'}`, c * 220 + 6, rw * 230 + 16); } return cv.toDataURL('image/png'); }, files);
writeFileSync(here('qa_lc_run_reihe.png'), Buffer.from(sheet.split(',')[1], 'base64'));
R.t('keine Seitenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
