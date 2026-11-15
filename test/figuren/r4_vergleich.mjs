// Figuren Runde 4 – Vergleichsbilder Heldin: Vorher R3 (test/fixtures/figuren/fig_heldin_r3.glb) neben Nachher R4 (public/models/figuren/fig_heldin.glb).
// NUR unter der Chromium-Sperre:  LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/figuren/r4_vergleich.mjs [studio|nah|welt|alle]
// Ausgabe: test/figuren/r4_vergleich_studio.webp (vorne/seitlich ganz, Nah, Spielkamera-Winkel) · r4_vergleich_nah.webp (Kopf vorn/schräg/seitlich/hinten) · r4_vergleich_welt.webp (echtes Spielbild Morgenau)
import { start, page, newGame } from '../qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const OUT = new URL('./', import.meta.url).pathname, W = 1600, H = 900, what = process.argv[2] || 'alle', has = k => what === 'alle' || what.split(',').includes(k);
const env = await start(); const res = {};
const toWebp = async (p, src, file, q = .92) => { const d = await p.evaluate(async ([s, q]) => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s; }); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q); }, [src, q]);
  writeFileSync(OUT + file, Buffer.from(d.split(',')[1], 'base64')); console.log('→ test/figuren/' + file); };
// Bogen: Zeilen (Vorher/Nachher) × Spalten, Zeilen-Etikett links oben, Spalten-Etikett oben
async function sheet(p, rows, file, { cw, ch, title, sub, cols }) {
  const d = await p.evaluate(async ([rows, cw, ch, title, sub, cols, W, H]) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, H);
    const top = 54, ox = Math.round((W - cols.length * cw) / 2);
    for (let r = 0; r < rows.length; r++) for (let i = 0; i < rows[r].imgs.length; i++) { const x = ox + i * cw, y = top + r * ch; const im = new Image(); await new Promise(z => { im.onload = z; im.src = rows[r].imgs[i]; }); g.drawImage(im, x, y, cw, ch);
      if (i) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x - 1, y, 2, ch); }
      const lab = (i === 0 ? rows[r].label + ' · ' : '') + (cols[i] || ''); g.font = '600 16px system-ui,sans-serif'; const tw = g.measureText(lab).width; g.fillStyle = r ? 'rgba(30,110,60,.78)' : 'rgba(20,28,44,.62)';
      g.beginPath(); g.roundRect ? g.roundRect(x + 8, y + 8, tw + 18, 26, 9) : g.rect(x + 8, y + 8, tw + 18, 26); g.fill(); g.fillStyle = '#fff'; g.fillText(lab, x + 17, y + 26); }
    g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(0, top + ch - 1, W, 3);
    g.fillStyle = '#1f2a40'; g.font = '700 23px system-ui,sans-serif'; g.fillText(title, 18, 34); const tw0 = g.measureText(title).width; g.fillStyle = '#5a6478'; g.font = '15px system-ui,sans-serif'; g.fillText(sub, 18 + tw0 + 16, 34);
    return cv.toDataURL('image/png'); }, [rows, cw, ch, title, sub, cols, W, H]);
  await toWebp(p, d, file);
}
async function setupR3(p) {   // R3-Stand als eigener Modell-Schlüssel
  return p.evaluate(async () => { FIG_MODELS.fig_heldin_r3 = Object.assign({}, FIG_MODELS.fig_heldin); PILOT.fix.fig_heldin_r3 = Object.assign({}, PILOT.fix.fig_heldin); PILOT.src.fig_heldin_r3 = 'fixtures/figuren/fig_heldin_r3.glb';
    const a = await pilotLoad('fig_heldin_r3'), b = await pilotLoad('fig_heldin'); return { r3: !!a, r4: !!b, ms: [PILOT.ms_fig_heldin_r3, PILOT.ms_fig_heldin] }; });
}
async function studio(p) {
  await p.evaluate(([W, H]) => {
    mode = 'wait'; if (typeof VILL !== 'undefined') VILL.list = []; window.__ty = terrainY; terrainY = () => 0; PILOT.lodD = 1e9;
    const rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(W, H); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.02;
    rr.shadowMap.enabled = true; rr.shadowMap.type = THREE.PCFSoftShadowMap; Object.assign(rr.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(rr.domElement);
    const S = new THREE.Scene(); const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#b9d8f2'); gr.addColorStop(.62, '#e9f1f6'); gr.addColorStop(1, '#f4ead8'); x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
    S.background = new THREE.CanvasTexture(c); S.add(new THREE.HemisphereLight('#eef6ff', '#d9c6a6', .78));
    const sun = new THREE.DirectionalLight('#fff0d8', .92); sun.position.set(2.2, 5, 3.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.radius = 4; Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 3, bottom: -3 }); S.add(sun, sun.target);
    const g = document.createElement('canvas'); g.width = g.height = 256; const y = g.getContext('2d'); const rg = y.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, '#e8e2d2'); rg.addColorStop(1, '#d3dcc4'); y.fillStyle = rg; y.fillRect(0, 0, 256, 256);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(g) })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
    const cam = new THREE.PerspectiveCamera(28, W / H, .02, 80);
    window.STU = { rr, S, sun, cam, objs: [] };
    STU.clear = () => { STU.objs.forEach(o => S.remove(o)); STU.objs = []; };
    STU.add = (o, ry = 0) => { o.position.set(0, 0, 0); o.rotation.y = ry + Math.PI; o.traverse(q => { if (q.isMesh && !q.userData.outline) q.castShadow = true; }); S.add(o); STU.objs.push(o); o.updateMatrixWorld(true); return o; };
    STU.tick = (o, sec) => { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) pilotTick(o, 1 / 60, {}); o.updateMatrixWorld(true); };
    STU.fig = (id) => { const o = figMake(id, null); STU.add(o, 0); STU.tick(o, 1.3); const U = o.userData; U.blink.next = 1e12; U.eye.next = 1e12; U.eye.tx = U.eye.ty = 0; pilotExpr(o, 'laecheln'); STU.tick(o, .6); return o; };
    STU.shot = (pos, at, fov = 28, w = W, h = H) => { rr.setSize(w, h); cam.aspect = w / h; cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(...pos); cam.lookAt(...at); cam.updateMatrixWorld();
      if (typeof toonProSync === 'function') toonProSync(rr); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
  }, [W, H]);
}
const P = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } });
await newGame(P, { team: [[1, 12]], view: 'third' });
res.laden = await setupR3(P); console.log('Laden', JSON.stringify(res.laden));
res.dreiecke = await P.evaluate(() => Object.fromEntries(['fig_heldin_r3', 'fig_heldin'].map(id => { const o = figMake(id, null); let t = 0, l = 0; o.traverse(m => { if (m.isMesh && !m.userData.outline) { const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (/LOD1/.test(m.name)) l += n; else t += n; } }); return [id, { haupt: t, lod1: l }]; })));
console.log('Dreiecke', JSON.stringify(res.dreiecke));
await studio(P);
const ROWS = [['fig_heldin_r3', 'Vorher R3'], ['fig_heldin', 'Nachher R4']];
if (has('studio')) {
  const rows = []; for (const [id, label] of ROWS) rows.push({ label, imgs: await P.evaluate((id) => { STU.clear(); STU.fig(id); return [
    STU.shot([0, .78, 4.3], [0, .68, 0], 25, 400, 423), STU.shot([4.3, .78, .25], [0, .68, 0], 25, 400, 423),
    STU.shot([.36, 1.2, .72], [0, 1.13, 0], 25, 400, 423), STU.shot([.9, 2.3 * .5, -3.6 * .5], [0, .78, 0], 46, 400, 423)]; }, id) });
  await sheet(P, rows, 'r4_vergleich_studio.webp', { cw: 400, ch: 423, cols: ['vorne', 'seitlich', 'nah', 'Spielkamera-Winkel (hinten oben)'], title: 'Heldin – Runde 3 vs. Runde 4', sub: 'Schirmmütze mit Krone + Schirm, weiche Haar-Volumen, gleicher Shader/Licht' });
}
if (has('nah')) {
  const rows = []; for (const [id, label] of ROWS) rows.push({ label, imgs: await P.evaluate((id) => { STU.clear(); STU.fig(id); return [
    STU.shot([0, 1.17, .66], [0, 1.13, 0], 26, 400, 423), STU.shot([.5, 1.24, .46], [0, 1.13, 0], 26, 400, 423),
    STU.shot([.7, 1.16, -.02], [0, 1.12, 0], 26, 400, 423), STU.shot([-.36, 1.36, -.62], [0, 1.1, 0], 26, 400, 423)]; }, id) });
  await sheet(P, rows, 'r4_vergleich_nah.webp', { cw: 400, ch: 423, cols: ['Kopf vorn', 'schräg oben', 'seitlich', 'hinten (Öffnung + Pferdeschwanz)'], title: 'Heldin Kopf – Runde 3 vs. Runde 4', sub: 'Logo „V“ mit Kristall-Funke · Pony/Seitensträhnen als eigene Volumen' });
}
await P.evaluate(() => { try { STU.rr.domElement.remove(); STU.rr.dispose(); terrainY = window.__ty; mode = 'world'; } catch (e) { } });
res.fehlerStudio = P.errs; await P.ctx.close();
if (has('welt')) {   // echtes Spielbild, Spielkamera (third), Heldin als Spielerfigur – einmal mit R3-, einmal mit R4-Modell
  const p = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } }); await newGame(p, { team: [[1, 12]], view: 'third' }); p.setDefaultTimeout(180000);
  await setupR3(p);
  await p.evaluate(() => { G.outfit = Object.assign(G.outfit || {}, { body: 'heldin' }); VILL.list = []; G.time = 10.5 * 60; mode = 'world'; loadMap('morgenau', 9, 9); P.dir = 'up'; P.ang = 0; setView('third', true); R3.ofk = null; });
  await p.waitForTimeout(5000);
  const shots = [];
  for (const [id, label] of ROWS) {
    await p.evaluate((id) => { PILOT._g4 = PILOT._g4 || PILOT.gltf.fig_heldin; PILOT.gltf.fig_heldin = id === 'fig_heldin_r3' ? PILOT.gltf.fig_heldin_r3 : PILOT._g4; R3.ofk = null; P.dir = 'up'; P.ang = 0; }, id);
    await p.waitForTimeout(3500); await p.evaluate(() => { document.querySelectorAll('.toast,#toast').forEach(e => e.remove()); });
    const r = await p.evaluate(() => { const r = R3.r, S = R3.scene, cam = R3.activeCam || R3.cam; r.render(S, cam); const full = r.domElement.toDataURL('image/png');
      const a = R3.player.getWorldPosition(new THREE.Vector3()), v = a.clone().add(new THREE.Vector3(0, .7, 0)).project(cam); return { full, cx: (v.x * .5 + .5), cy: (-v.y * .5 + .5), held: !!R3.player.userData.pilot }; });
    shots.push({ ...r, label });
  }
  // je Modell: Spielbild-Ausschnitt um die Figur (800×846, 2× vergrößert aus der echten Spielkamera)
  const d = await p.evaluate(async ([shots, W, H]) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < shots.length; i++) { const s = shots[i], im = new Image(); await new Promise(z => { im.onload = z; im.src = s.full; }); const cw = 400, ch = 423, sx = s.cx * im.width - cw / 2, sy = s.cy * im.height - ch / 2;
      g.imageSmoothingQuality = 'high'; g.drawImage(im, sx, sy, cw, ch, i * 800, 54, 800, 846); g.font = '600 16px system-ui,sans-serif'; const lab = s.label + ' · echte Spielkamera (Ausschnitt 2×)'; const tw = g.measureText(lab).width;
      g.fillStyle = i ? 'rgba(30,110,60,.78)' : 'rgba(20,28,44,.62)'; g.beginPath(); g.roundRect(i * 800 + 8, 62, tw + 18, 26, 9); g.fill(); g.fillStyle = '#fff'; g.fillText(lab, i * 800 + 17, 80); }
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(799, 54, 2, 846); g.fillStyle = '#1f2a40'; g.font = '700 23px system-ui,sans-serif'; g.fillText('Heldin im Spiel (Morgenau, Spielkamera) – R3 vs. R4', 18, 34);
    return cv.toDataURL('image/png'); }, [shots, W, H]);
  await toWebp(p, d, 'r4_vergleich_welt.webp'); await toWebp(p, shots[1].full, 'r4_welt_ganz.webp', .9);
  res.welt = shots.map(s => ({ label: s.label, held: s.held })); res.fehlerWelt = p.errs; await p.ctx.close();
}
writeFileSync(OUT + 'r4_vergleich.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res));
await env.close();
