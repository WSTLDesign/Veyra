// Gegenprüfung Runde 1 – Punkt 7: Bildreihe Rennen/Gehen von der Seite (eigene Kamera neben der Figur), handgetaktete Spielschleife wie qa_lc_run
//   node test/qa_gp1_runshots.mjs   Bild: test/qa_gp1_run_reihe.png
import { start, page, newGame, goMap, here } from './qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const env = await start(); const p = await page(env, { w: 860, h: 484 }); await newGame(p, { view: 'third' }); const ev = (f, a) => p.evaluate(f, a);
await goMap(p, 'route1', 10, 21, 'up'); await p.waitForTimeout(3500);
await ev(() => { window.QR = { T: performance.now() }; window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; window.__render = R3.r.render.bind(R3.r); window.__pn = performance.now.bind(performance); performance.now = () => QR.T; R3.r.render = () => { };
  QR.tick = n => { for (let i = 0; i < n; i++) { QR.T += 1000 / 60; lastT = QR.T - 1000 / 60; R3.player.updateMatrixWorld(true); loop(QR.T); } }; QR.tick(2); ROAM.list = []; VILL.list = []; G.flags.starter = 1; mode = 'world'; });
const files = [];
for (const [label, stickY, rw] of [['Gehen', -.45, false], ['Rennen', -1, true]]) {
  await ev(([sy, rw]) => { STICK.y = 0; QR.tick(30); P.x = P.fx = P.px = 10; P.y = P.fy = P.py = 21; P.moving = false; P.dir = 'up'; P.ang = 0; QR.tick(3); MV.rw = rw; STICK.x = 0; STICK.y = sy; QR.tick(60); }, [stickY, rw]);
  for (let i = 0; i < 8; i++) {
    await ev(() => { QR.tick(2); const pl = R3.player; pl.updateMatrixWorld(true); const cam = new THREE.PerspectiveCamera(32, 220 / 230, .1, 80); const q = pl.position; cam.position.set(q.x + 7.5, q.y + 1.1, q.z); cam.lookAt(q.x, q.y + .95, q.z); cam.updateMatrixWorld(true); window.__sc = cam; });
    await ev(() => { R3.r.render = window.__render; R3.r.setScissorTest(false); R3.r.render(R3.scene, window.__sc); R3.r.render = () => { }; });
    const b = await p.screenshot({ clip: { x: 320, y: 120, width: 220, height: 245 } }); files.push(b.toString('base64')); }
  await ev(() => { STICK.y = 0; }); }
const sheet = await ev(async arr => { const cv = document.createElement('canvas'); cv.width = 220 * 8; cv.height = 245 * 2; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < arr.length; i++) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + arr[i]; }); g.drawImage(im, (i % 8) * 220, Math.floor(i / 8) * 245); g.fillStyle = '#26304a'; g.font = '700 14px sans-serif'; g.fillText((i < 8 ? 'Gehen ' : 'Rennen ') + (i % 8 + 1), (i % 8) * 220 + 6, Math.floor(i / 8) * 245 + 16); } return cv.toDataURL('image/png'); }, files);
writeFileSync(here('qa_gp1_run_reihe.png'), Buffer.from(sheet.split(',')[1], 'base64')); console.log('errs', p.errs); await env.close();
