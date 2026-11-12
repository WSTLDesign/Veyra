// Bewegung – Bildfolgen des Laufzyklus:  node test/walk_shots.mjs
// test/walk_cycle_0..7.png (8 Phasen eines Doppelschritts, 860×484, links seitlich, rechts schräg) · test/walk_run_sheet.png (Kontaktbogen)
// Eigene Prüfszene (eigener Renderer über dem Spiel): Schachbrettboden, Figur aus person3d (38-models.js), feste Zeitschritte 1/60 s.
import { boot } from './look_lib.mjs';
const { page, errs, close } = await boot({ w: 860, h: 484 });
await page.evaluate(() => {
  mode = 'wait'; terrainY = () => 0;
  const W = 860, H = 484, rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(W, H); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.05;
  rr.shadowMap.enabled = true; Object.assign(rr.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(rr.domElement);
  const S = new THREE.Scene(); S.background = new THREE.Color('#e4edf4'); S.add(new THREE.HemisphereLight('#ffffff', '#b8c4a8', .75));
  const sun = new THREE.DirectionalLight('#fff4e0', .9); sun.position.set(3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); S.add(sun, sun.target);
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < 8; i++)for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#cfd9c4' : '#b7c6aa'; x.fillRect(i * 16, j * 16, 16, 16); }
  const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(50, 50); tx.magFilter = THREE.NearestFilter;
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshToonMaterial({ map: tx, gradientMap: toonGrad() })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; S.add(gr);
  const f = person3d('#e8623a', '#1f8a7a'); f.traverse(q => { if (q.isMesh && !q.userData.outline) q.castShadow = true; }); S.add(f);
  const camS = new THREE.PerspectiveCamera(30, (W / 2) / H, .05, 60), camO = new THREE.PerspectiveCamera(30, (W / 2) / H, .05, 60);
  window.WS = { rr, S, f, camS, camO, x: 0, z: 0, yaw: Math.PI / 2, v: 0 };// läuft nach −x (Blick nach links), Seitenkamera von +z
  WS.step = (v, dt) => { WS.v = v; WS.x += -Math.sin(WS.yaw) * v * dt; WS.z += -Math.cos(WS.yaw) * v * dt; f.position.set(WS.x, 0, WS.z); f.rotation.y = WS.yaw; gaitTick(f, dt); };
  WS.run = (v, sec) => { for (let k = 0; k < sec * 60; k++)WS.step(typeof v === 'function' ? v(k / 60) : v, 1 / 60); };
  WS.toPhase = (v, ph) => { const G_ = f.userData.gait; let guard = 0; const d = p => ((ph - p) % 1 + 1) % 1; while (d(G_.ph) > v / 60 / G_.S * 1.05 && guard++ < 400) WS.step(v, 1 / 60); const rest = d(G_.ph) * G_.S; if (rest > 1e-5) WS.step(v, rest / v); };
  WS.render = (dist) => { const p = f.position, hy = .62; dist = dist || 4.2; rr.setScissorTest(true);
    camS.position.set(p.x, hy + .1, p.z + dist); camS.lookAt(p.x, hy, p.z); rr.setViewport(0, 0, W / 2, H); rr.setScissor(0, 0, W / 2, H); rr.render(S, camS);
    camO.position.set(p.x - dist * .62, hy + 1.35, p.z + dist * .74); camO.lookAt(p.x, hy - .05, p.z); rr.setViewport(W / 2, 0, W / 2, H); rr.setScissor(W / 2, 0, W / 2, H); rr.render(S, camO); rr.setScissorTest(false); };
});
// 8 Phasen bei Gehgeschwindigkeit (Stick halb, 1,8 Felder/s)
const V = +(process.env.WALK_V || 1.8);
await page.evaluate(v => { WS.run(t => Math.min(v, t * 3), 2.5); }, V);
for (let i = 0; i < 8; i++) {
  await page.evaluate(([v, i]) => { WS.toPhase(v, i / 8); WS.render(); }, [V, i]);
  await page.screenshot({ path: `test/walk_cycle_${i}.png`, clip: { x: 0, y: 0, width: 860, height: 484 } });
}
// Kontaktbogen: Zeilen Gehen / Laufen / Rennen / Anlaufen+Bremsen / Idle, je 8 Bilder (Seitenansicht)
const sheet = await page.evaluate(() => {
  const rows = [['Gehen 1,2', 1.2], ['Gehen 1,8', 1.8], ['Laufen 3,75 (Stick voll)', 3.75], ['Rennen 7,5', 7.5], ['Anlaufen → Bremsen', 'acc'], ['Idle (Atmen, Gewicht)', 0]];
  const cw = 210, ch = 250, sh = document.createElement('canvas'); sh.width = cw * 8 + 150; sh.height = ch * rows.length; const g = sh.getContext('2d'); g.fillStyle = '#f6f8fa'; g.fillRect(0, 0, sh.width, sh.height);
  const { rr, S, f, camS } = WS; rr.setSize(cw, ch); camS.aspect = cw / ch; camS.updateProjectionMatrix();
  rows.forEach(([lab, v], r) => {
    WS.x = 0; WS.z = 0; f.userData.gait = null; WS.run(0, .3);
    if (typeof v === 'number' && v > 0) WS.run(t => Math.min(v, t * 4), 2.5);
    g.fillStyle = '#26304a'; g.font = '600 16px sans-serif'; g.fillText(lab, 8, r * ch + ch / 2);
    for (let i = 0; i < 8; i++) {
      if (v === 'acc') WS.run(t => i < 4 ? Math.min(3.75, (i * .18 + t) * 6) : Math.max(0, 3.75 - ((i - 4) * .18 + t) * 8), .18);
      else if (v === 0) WS.run(0, .55); else WS.toPhase(v, i / 8);
      const p = f.position; camS.position.set(p.x, .72, p.z + 3.6); camS.lookAt(p.x, .62, p.z); rr.setViewport(0, 0, cw, ch); rr.render(S, camS);
      g.drawImage(rr.domElement, 150 + i * cw, r * ch); g.strokeStyle = '#c9d2dc'; g.strokeRect(150 + i * cw + .5, r * ch + .5, cw - 1, ch - 1);
    }
  });
  return sh.toDataURL('image/png');
});
const { writeFileSync } = await import('fs'); writeFileSync('test/walk_run_sheet.png', Buffer.from(sheet.split(',')[1], 'base64'));
console.log(errs.length ? errs.join('\n') : 'ok'); await close();
