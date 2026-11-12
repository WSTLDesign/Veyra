// Bewegungsdynamik (Agent Bewegungsdynamik, 12.11.) – Abnahme:  node test/bewegung_qa.mjs   (Teil 2 braucht EIN Chromium → Sperre nehmen, s. AGENTS.md)
// (1) Reiten entfernt: kein #rideBtn/.in-ride, Taste R ohne Wirkung, alter Spielstand (flags.ride/rideTip) + Alt-Zustand P.state 'ride' → 'walk'
// (2) Gang ohne Browser (VM + three.js): Fußgleiten (Drehpunkt Ferse/Ballen, < 0,03 Feld/Frame), Knie ≤ 0,6 rad/Frame, Gehen→Rennen ≤ 0,77 rad/Frame,
//     Anhalten ohne Sprung (Ausfallschritt, danach Füße neben der Hüfte), Kurve mit Neigung, Kadenz/Flugphase/Bob/Kopf, Gelände (Knie ≤ 0,6)
// (3) Im Spiel (Route 1, handgetaktete Spielschleife mit gefälschter performance.now): Tempo Gehen/Rennen, Gleiten, Gelenksprünge
// (4) Bildreihen: test/bewegung_run_seite.png, _hinten.png (Rennen 5 F/s), test/bewegung_jog_*.png (2,8), test/bewegung_walk_*.png (1,2)
import { gaitVM } from './bewegung_lib.mjs';
import { boot } from './look_lib.mjs';
import { gaitStage, cycleSheet } from './bewegung_shots.mjs';
import { reporter } from './qa_lc_lib.mjs';
const R = reporter('bewegung_qa.log', 'Bewegungsdynamik – Abnahme');
// ---------------- (2) VM ----------------
const { J } = gaitVM();
const sim = (o) => { const r = J(`SIMG(${o})`); delete r.rec; return r; };
const T = {};
for (const [n, v] of [['gehen', .9], ['gehen2', 1.4], ['laufen', 2.8], ['rennen', 5]]) T[n] = sim(`{v:${v},n:600,skip:150}`);
R.note('Dauerlauf: ' + JSON.stringify(Object.fromEntries(Object.entries(T).map(([k, r]) => [k, { slip: r.slip, knee: r.knee, all: r.all, S: r.S, beta: r.beta, cad: r.cad, air: r.air, bob: r.bob, lean: r.lean }]))));
R.t('Fußgleiten Standfuß < 0,03 Feld/Frame (Gehen 0,9/1,4 · Laufen 2,8 · Rennen 5)', Object.values(T).every(r => r.slip < .03 && r.pen < .02 && r.flo < .02), Object.fromEntries(Object.entries(T).map(([k, r]) => [k, r.slip])));
R.t('Kniewinkel-Änderung ≤ 0,6 rad/Frame, alle Gelenke ≤ 0,77 (Dauerlauf)', Object.values(T).every(r => r.knee <= .6 && r.all <= .77), Object.fromEntries(Object.entries(T).map(([k, r]) => [k, [r.knee, r.all]])));
R.t('Schrittlänge × Frequenz = Tempo (Schritte ≈ 2·Weg/S ± 12 %)', Object.values(T).every(r => Math.abs(r.steps - 2 * r.dist * 450 / 600 / r.S) <= Math.max(2, .12 * r.steps)), Object.fromEntries(Object.entries(T).map(([k, r]) => [k, [r.steps, +(2 * r.dist * .75 / r.S).toFixed(1)]])));
R.t('Kadenz glaubhaft: Rennen ≤ 5,5 Schritte/s (vorher 9,4 bei 7,5 F/s), Gehen 0,9 ≤ 3,5', T.rennen.cad <= 5.5 && T.gehen.cad <= 3.5, { rennen: T.rennen.cad, gehen: T.gehen.cad });
R.t('Gehen ohne Flugphase, Laufen/Rennen mit Flugphase (beide Füße in der Luft 25–70 %)', T.gehen.air === 0 && T.gehen2.air === 0 && T.laufen.air >= .25 && T.rennen.air >= .25 && T.rennen.air <= .7, { gehen: T.gehen.air, laufen: T.laufen.air, rennen: T.rennen.air });
R.t('Vertikaler Bob: Gehen 0,5–4 cm, Rennen 1,5–7 cm (Hüfte, Figur 1,32 hoch; Mensch beim Sprint ≈ 4 % der Größe)', T.gehen.bob >= .005 && T.gehen.bob <= .04 && T.rennen.bob >= .015 && T.rennen.bob <= .07, { gehen: T.gehen.bob, rennen: T.rennen.bob });
R.t('Oberkörper-Vorneigung: Rennen ≥ 0,15 rad, deutlich mehr als Gehen', T.rennen.lean >= .15 && T.rennen.lean > T.gehen.lean + .1, { gehen: T.gehen.lean, rennen: T.rennen.lean });
R.t('Armschwung gegenläufig zum Bein derselben Seite (Korrelation < 0)', Object.values(T).every(r => r.armC < 0), Object.fromEntries(Object.entries(T).map(([k, r]) => [k, r.armC])));
// Übergänge: Stehen → Gehen 1,4 → Rennen 5 (Anlauf wie 17-move) → Bremsen (τ 0,14 s) → Stehen
const P = sim(`{v:t=>t<.5?0:t<1.5?1.4*(t-.5):t<3?1.4:t<4?1.4+3.6*(1-Math.exp(-(t-3)*4.5))/(1-Math.exp(-4.5)):t<6?5:t<7?5*Math.exp(-(t-6)*7):0,n:600,skip:20,rec:1}`);
const win = (a, b) => { let m = 0, k = 0; const rec = J(`SIMG({v:t=>t<.5?0:t<1.5?1.4*(t-.5):t<3?1.4:t<4?1.4+3.6*(1-Math.exp(-(t-3)*4.5))/(1-Math.exp(-4.5)):t<6?5:t<7?5*Math.exp(-(t-6)*7):0,n:${Math.round(b * 60) + 1},skip:${Math.round(a * 60)}})`); return rec; };
const g2r = win(2.9, 4.2), brake = win(5.9, 7.2), stand = win(7.2, 10);
R.note('Übergänge: ' + JSON.stringify({ g2r: [g2r.knee, g2r.all, g2r.slip], bremsen: [brake.knee, brake.all, brake.slip], stand: [stand.knee, stand.all, stand.slip] }));
R.t('Gehen → Rennen weich: alle Gelenke ≤ 0,77 rad/Frame, Knie ≤ 0,6, kein Gleiten', g2r.all <= .77 && g2r.knee <= .6 && g2r.slip < .03, g2r);
R.t('Anhalten aus dem Rennen ohne Sprung: Gelenke ≤ 0,77, Knie ≤ 0,6, kein Gleiten; danach Stand ruhig (≤ 0,45)', brake.all <= .77 && brake.knee <= .6 && brake.slip < .03 && stand.all <= .45, { brake, stand: stand.all });
const stop = J(`(()=>{const f=person3d('#e8623a','#1f8a7a');const B=f.userData.rig.b;let z=0,v=5,hy=[],lean=[],lunge=0;for(let k=0;k<330;k++){if(k>=150)v*=Math.exp(-7/60);if(v<.08)v=0;z-=v/60;f.position.set(0,0,z);const G_=gaitTick(f,1/60,{});
  if(k>=150){hy.push(B[1].position.y);lean.push(G_.lean);for(const l of G_.legs)if(l.on&&k<200)lunge=Math.max(lunge,-(l.p[1]-z));}}
  let dh=0;for(let i=1;i<hy.length;i++)dh=Math.max(dh,Math.abs(hy[i]-hy[i-1]));const L=f.userData.gait.legs;return{dh:+dh.toFixed(4),lean0:+lean[0].toFixed(3),leanEnd:+lean[lean.length-1].toFixed(3),hipMin:+Math.min(...hy).toFixed(3),lunge:+lunge.toFixed(3),end:L.every(l=>l.st==='plant'&&Math.abs(l.p[1]-z)<.07&&Math.abs(Math.abs(l.p[0])-.09)<.04),hipEnd:+hy[hy.length-1].toFixed(3)}})()`);
R.t('Anhalten mit Ausfallschritt: Bremsfuß setzt ≥ 0,18 vor der Hüfte auf, Hüfte federt ≥ 3 cm ein (ohne Sprung ≤ 0,025/Frame), Oberkörper richtet sich auf, am Ende Grundstellung', stop.lunge >= .18 && stop.hipMin <= stop.hipEnd - .03 && stop.dh <= .025 && stop.leanEnd < stop.lean0 - .15 && stop.end && stop.hipEnd > .41, stop);
const turn = sim(`{v:5,turn:2,roll:()=>.22,n:500,skip:150}`), turnW = sim(`{v:1.4,turn:2.5,roll:()=>.09,n:500,skip:150}`);
R.t('Richtungswechsel mit Kurvenneigung (Figur rollt 0,22 rad, Drehung 2 rad/s): kein Gleiten (< 0,03), Gelenke ≤ 0,77', turn.slip < .03 && turn.all <= .77 && turnW.slip < .03, { rennen: [turn.slip, turn.all], gehen: [turnW.slip, turnW.all] });
const terr = sim(`{v:5,n:600,skip:150,ty:(x,z)=>.12*Math.sin(z*1.7)+.06*Math.sin(x*2.3+z*.9)}`);
R.t('Gelände (Wellen ±0,18): Knie ≤ 0,6 rad/Frame, Gelenke ≤ 0,77, Fuß auf dem Boden (±0,02)', terr.knee <= .6 && terr.all <= .77 && terr.pen < .02 && terr.flo < .02, terr);
const head = J(`(()=>{const f=person3d('#e8623a','#1f8a7a');const B=f.userData.rig.b,q=new THREE.Quaternion(),e=new THREE.Euler();let z=0,p=[],y=[];for(let k=0;k<500;k++){z-=5/60;f.position.set(0,0,z);gaitTick(f,1/60,{});f.updateMatrixWorld(true);if(k>150){B[3].getWorldQuaternion(q);e.setFromQuaternion(q,'YXZ');p.push(e.x);y.push(e.y);}}
  const rg=a=>Math.max(...a)-Math.min(...a);return{pitch:+rg(p).toFixed(3),yaw:+rg(y).toFixed(3)}})()`);
R.t('Kopf stabil beim Rennen: Nick- und Gierwinkel des Kopfes schwanken < 0,12 rad', head.pitch < .12 && head.yaw < .12, head);
const idle = J(`(()=>{const f=person3d('#e8623a','#1f8a7a');const B=f.userData.rig.b;let a=[],kmin=0,kst=-9,hx=[];for(let k=0;k<600;k++){gaitTick(f,1/60,{});if(k>60){a.push(B[2].rotation.x);hx.push(B[1].position.x);kmin=Math.min(kmin,B[5].rotation.x,B[8].rotation.x);kst=Math.max(kst,Math.max(B[5].rotation.x,B[8].rotation.x));}}return{breath:+(Math.max(...a)-Math.min(...a)).toFixed(4),shift:+(Math.max(...hx)-Math.min(...hx)).toFixed(3),kneeStand:+kst.toFixed(2),kneeMin:+kmin.toFixed(2)}})()`);
R.t('Idle: Atmen sichtbar, Gewichtsverlagerung (Hüfte seitlich), Standbein fast gestreckt (≥ −0,3 rad), Spielbein locker (≥ −0,7)', idle.breath > .01 && idle.shift > .01 && idle.kneeStand >= -.3 && idle.kneeMin >= -.7, idle);
// ---------------- (1)+(3)+(4) Browser ----------------
const save = { name: 'Alt', team: [], flags: { starter: 1, ride: 1, rideTip: 1, swim: 0 }, badges: [], map: 'route1', px: 9, py: 18, bag: {} };
const { page, errs, close } = await boot({ w: 860, h: 484 });
const ev = (f, a) => page.evaluate(f, a);
const rideGone = await ev(() => ({ btn: !!document.querySelector('#rideBtn,.in-ride'), fn: ['toggleRide', 'rideOK', 'rideMon', 'canCarry', 'syncRideBtn'].filter(n => typeof window[n] !== 'undefined'), param: 'ride' in MOVE_PARAMS, mount: 'ride' in MOUNT_ST }));
R.t('Reiten entfernt: kein #rideBtn/.in-ride, keine Reit-Funktionen, kein Zustand ride', !rideGone.btn && !rideGone.fn.length && !rideGone.param && !rideGone.mount, rideGone);
await ev(() => { mode = 'world'; setView('third', 1); loadMap('route1', 9, 18); VILL.list = []; ROAM.list = []; });
await page.waitForTimeout(800); await page.keyboard.press('KeyR'); await page.waitForTimeout(400);
const afterR = await ev(() => ({ st: P.state, toast: (document.getElementById('toast') || {}).textContent || '' }));
R.t('Taste R ohne Wirkung (Zustand bleibt walk, kein Reit-Hinweis)', afterR.st === 'walk' && !/reit|steig/i.test(afterR.toast), afterR);
// Alter Spielstand: Reit-Flags gesetzt, laufender Zustand 'ride' (z. B. aus einer alten Sitzung) → lädt, Zustand 'walk', Flags unverändert (nichts umbenannt)
const old = await ev(() => { const g = JSON.parse(JSON.stringify(G)); g.flags.ride = 1; g.flags.rideTip = 1; G = g; P.state = 'ride'; try { if (typeof migrateSave === 'function') migrateSave(G); } catch (e) { return { err: e.message }; } loadMap('route1', 9, 18); mode = 'world'; return { ok: 1 }; });
await page.waitForTimeout(600);
const oldR = await ev(() => ({ st: P.state, ride: G.flags.ride, tip: G.flags.rideTip, mount: !!(COMP && COMP.mount) }));
R.t('Alter Spielstand mit Reit-Flags und Zustand ride lädt als walk (Flags bleiben, kein Träger)', !old.err && oldR.st === 'walk' && oldR.ride === 1 && oldR.tip === 1 && !oldR.mount, { old, oldR });
// (3) Im Spiel: Spielschleife handgetaktet (performance.now gefälscht – Gang-dt ist Wandzeit)
await ev(() => { window.QR = { T: performance.now() }; window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; window.__render = R3.r.render.bind(R3.r); performance.now = () => QR.T; R3.r.render = () => { };
  QR.tick = n => { for (let i = 0; i < n; i++) { QR.T += 1000 / 60; lastT = QR.T - 1000 / 60; R3.player.updateMatrixWorld(true); loop(QR.T); } }; QR.tick(2); });
const lane = await ev(() => { let best = null; for (let x = 1; x < cur.w - 1; x++) { let run = 0; for (let y = cur.h - 1; y >= 0; y--) { const t = tileAt(cur, x, y); const free = t && !SOLID.has(t) && t !== '~' && !/[0-9R]/.test(t) && !npcAt(x, y) && !roamAt(x, y); if (free) { run++; if (!best || run > best.len) best = { x, y0: y + run - 1, len: run }; } else run = 0; } } return best; });
const game = await ev(l => { const out = {}; for (const [n, rw] of [['gehen', false], ['rennen', true]]) { ROAM.list = []; VILL.list = []; STICK.y = 0; QR.tick(30); P.x = P.fx = P.px = l.x; P.y = P.fy = P.py = l.y0; P.moving = false; P.dir = 'up'; P.ang = 0; R3.snap = 1; QR.tick(3); MV.rw = rw; STICK.x = 0; STICK.y = -1; QR.tick(45);
    const f = R3.player, B = f.userData.rig.b, G_ = f.userData.gait, hl = new THREE.Vector3(), bl = new THREE.Vector3(); let prev = [null, null], slip = 0, knee = 0, all = 0, pv = null, d = 0, lx = P.px, ly = P.py;
    for (let k = 0; k < 60; k++) { QR.tick(1); d += Math.hypot(P.px - lx, P.py - ly); lx = P.px; ly = P.py; f.updateMatrixWorld(true); const c = B.map(b => [b.rotation.x, b.rotation.y, b.rotation.z]);
      if (pv) for (let b = 1; b < c.length; b++)for (let a = 0; a < 3; a++) { const dd = Math.abs(c[b][a] - pv[b][a]); if ((b === 5 || b === 8) && a === 0) knee = Math.max(knee, dd); all = Math.max(all, dd); } pv = c;
      for (let i = 0; i < 2; i++) { const L = G_.legs[i], ft = B[i ? 9 : 6]; hl.set(0, -RIG.HA, RIG.HEEL).applyMatrix4(ft.matrixWorld); bl.set(0, -RIG.HA, -RIG.BALL).applyMatrix4(ft.matrixWorld); const j = (L.thc || 0) > 0 ? 0 : 1, pt = j ? bl : hl;
        if (L.on) { if (prev[i]) slip = Math.max(slip, Math.hypot(pt.x - prev[i][j][0], pt.z - prev[i][j][1])); prev[i] = [[hl.x, hl.z], [bl.x, bl.z]]; } else prev[i] = null; } }
    out[n] = { v: +(d / (60 / 60)).toFixed(2), state: P.state, slip: +slip.toFixed(4), knee: +knee.toFixed(3), all: +all.toFixed(3), S: +G_.S.toFixed(2) }; } STICK.y = 0; return out; }, lane);
R.note('Im Spiel (Route 1): ' + JSON.stringify(game));
R.t('Im Spiel: Gehen-Taste ≈ 2,8 F/s, Rennen ≈ 5 F/s (Zustand run)', Math.abs(game.gehen.v - 2.8) < .35 && Math.abs(game.rennen.v - 5) < .5 && game.rennen.state === 'run', game);
R.t('Im Spiel (Gelände Route 1): Gleiten < 0,03, Knie ≤ 0,6, Gelenke ≤ 0,77 rad/Frame', ['gehen', 'rennen'].every(k => game[k].slip < .03 && game[k].knee <= .6 && game[k].all <= .77), game);
await ev(() => { window.requestAnimationFrame = window.__raf; R3.r.render = window.__render; });
// (4) Bildreihen
await gaitStage(page);
await cycleSheet(page, 5, 'run', 'Rennen 5 F/s'); await cycleSheet(page, 2.8, 'jog', 'Laufen 2,8'); await cycleSheet(page, 1.2, 'walk', 'Gehen 1,2');
R.note('Bilder: test/bewegung_run_seite.png, test/bewegung_run_hinten.png, test/bewegung_jog_*.png, test/bewegung_walk_*.png');
R.t('keine Seitenfehler', errs.length === 0, errs);
await close();
console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
