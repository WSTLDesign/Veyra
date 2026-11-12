// Bewegungsdynamik – Bildreihen des Laufzyklus (ein Chromium, eigene Bühne mit Schachbrett-Boden, Spielerfigur mit Outfit, Licht wie im Spiel)
//   node test/bewegung_shots.mjs [v=5] [name=run]   → test/bewegung_<name>_seite.png, _hinten.png (je 8 Bilder über einen Doppelschritt)
// Gang-dt ist Wandzeit → hier fester Takt 1/60 s direkt über gaitTick (keine Spielschleife nötig).
import { boot } from './look_lib.mjs';
import { writeFileSync } from 'fs';
import { here } from './qa_lc_lib.mjs';
export async function gaitStage(page) {
  await page.evaluate(() => {
    mode = 'wait'; VILL.list = []; window.__tyGame = terrainY; terrainY = () => 0; // Bühne ist eben (sonst stünden die Füße auf dem Gelände der geladenen Karte)
    const W = 860, H = 484, rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(W, H); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.05;
    rr.shadowMap.enabled = true; Object.assign(rr.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(rr.domElement);
    const S = new THREE.Scene(); S.background = new THREE.Color('#dfe9f1'); S.add(new THREE.HemisphereLight('#ffffff', '#b8c4a8', .8));
    const sun = new THREE.DirectionalLight('#fff4e0', .85); sun.position.set(3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); S.add(sun, sun.target);
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < 8; i++)for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#cfd9c4' : '#b7c6aa'; x.fillRect(i * 16, j * 16, 16, 16); }
    const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(100, 100); tx.magFilter = THREE.NearestFilter;
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshToonMaterial({ map: tx, gradientMap: toonGrad() })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; S.add(gr);
    const o = G && G.outfit && typeof defaultOutfit === 'function' ? Object.assign(defaultOutfit(), G.outfit) : null;
    const f = o ? person3d(o.top, o.capCol, o) : person3d('#e8623a', '#1f8a7a'); f.traverse(q => { if (q.isMesh && !q.userData.outline) q.castShadow = true; }); S.add(f);
    const cam = new THREE.PerspectiveCamera(30, (W / 2) / H, .05, 80);
    window.WS = { rr, S, f, sun, cam, x: 0, z: 0, yaw: 0, v: 0, W, H };
    WS.step = (v, dt, opt) => { WS.v = v; WS.x += -Math.sin(WS.yaw) * v * dt; WS.z += -Math.cos(WS.yaw) * v * dt; f.position.set(WS.x, 0, WS.z); f.rotation.y = WS.yaw; const g = gaitTick(f, dt, opt); f.updateMatrixWorld(true); return g; };
    WS.run = (v, sec) => { for (let k = 0; k < sec * 60; k++)WS.step(typeof v === 'function' ? v(k / 60) : v, 1 / 60); };
    // Kamera: 'seite' = rechts neben der Figur auf Hüfthöhe, 'hinten' = schräg hinten oben (wie die Spielkamera, 35° seitlich)
    WS.shot = (kind, half) => { const p = f.position, fw = [-Math.sin(WS.yaw), -Math.cos(WS.yaw)], rt = [Math.cos(WS.yaw), -Math.sin(WS.yaw)];
      if (kind === 'seite') { cam.position.set(p.x + rt[0] * 4.4, .62, p.z + rt[1] * 4.4); cam.lookAt(p.x, .6, p.z); }
      else { const a = .6, d = 3.6; cam.position.set(p.x - fw[0] * d * Math.cos(a) + rt[0] * d * Math.sin(a), 1.9, p.z - fw[1] * d * Math.cos(a) + rt[1] * d * Math.sin(a)); cam.lookAt(p.x, .55, p.z); }
      sun.position.set(p.x + 3, 6, p.z + 4); sun.target.position.set(p.x, 0, p.z); sun.target.updateMatrixWorld();
      rr.setScissorTest(true); const x0 = half ? W / 2 : 0; rr.setViewport(x0, 0, W / 2, H); rr.setScissor(x0, 0, W / 2, H); rr.render(S, cam); rr.setScissorTest(false); };
  });
}
// 8 Bilder über einen Doppelschritt (gleichmäßig in der Gangphase), Kontaktbogen 8 × 1 je Ansicht
export async function cycleSheet(page, v, name, label) {
  await page.evaluate(v => { WS.f.userData.gait = null; WS.x = WS.z = 0; WS.run(t => Math.min(v, t * 4), 2.5); WS.run(v, 1); }, v);
  for (const kind of ['seite', 'hinten']) {
    const shots = await page.evaluate(([v, kind]) => { const out = [], G_ = WS.f.userData.gait, ph0 = G_.ph; let n = 0, acc = 0;
      // Phase φ wächst je Frame um v/60/S – Bilder bei φ0 + i/8 (nächster Frame)
      for (let i = 0; i < 8; i++) { const want = i / 8; let guard = 0; while (guard++ < 200) { const d = ((G_.ph - ph0) % 1 + 1) % 1; if (d >= want - 1e-6 && (i > 0 || guard > 1)) break; WS.step(v, 1 / 60); }
        WS.shot(kind, 0); out.push(WS.rr.domElement.toDataURL('image/png')); }
      return out; }, [v, kind]);
    const sheet = await page.evaluate(async ([arr, label, kind]) => { const cw = 215, ch = 280, cv = document.createElement('canvas'); cv.width = cw * 8; cv.height = ch; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < arr.length; i++) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = arr[i]; }); g.drawImage(im, 90, 95, 250, 300, i * cw, 20, cw, 258); g.fillStyle = '#26304a'; g.font = '700 14px sans-serif'; g.fillText(label + ' ' + kind + ' ' + (i + 1) + '/8', i * cw + 6, 16); }
      return cv.toDataURL('image/png'); }, [shots, label, kind]);
    writeFileSync(here(`bewegung_${name}_${kind}.png`), Buffer.from(sheet.split(',')[1], 'base64'));
  }
}
if (process.argv[1] && process.argv[1].endsWith('bewegung_shots.mjs')) {
  const v = +(process.argv[2] || 5), name = process.argv[3] || 'run';
  const { page, errs, close } = await boot({ w: 860, h: 484 });
  await gaitStage(page); await cycleSheet(page, v, name, v + ' F/s');
  await close(); console.log(errs.length ? errs.join('\n') : 'ok');
}
