// Figuren Runde 5 – Vergleichsbilder: Vorher R4 (test/fixtures/figuren/fig_<id>_r4.glb) neben Nachher R5 (public/models/figuren/fig_<id>.glb),
// gleicher Shader/Licht, Umrisshülle an (Hülle = leichtes Netz aus src/62-lod.js).
// NUR unter der Chromium-Sperre:  LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/figuren/r5_vergleich.mjs [studio|nah|heldin|huelle|welt|alle]
// Ausgabe: test/figuren/r5_vergleich_studio.webp (alle 4 Figuren ganz) · r5_vergleich_nah.webp (Köpfe, Pferdeschwanz-Schattenseite, Hand) ·
//          r5_heldin_studio.webp (Heldin vorne/seitlich/hinten/Spielkamera) · r5_lod_huelle.webp (vereinfachte Hülle der Heldin vorher/nachher) ·
//          r5_vergleich_welt.webp (echtes Spielbild Morgenau, Heldin + Ladenbesitzer + Jugendlicher, Umrisshülle an) · r5_vergleich.json (Messwerte)
import { start, page, newGame } from '../qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const OUT = new URL('./', import.meta.url).pathname, W = 1600, H = 900, what = process.argv[2] || 'alle', has = k => what === 'alle' || what.split(',').includes(k);
const FIGS = [['fig_heldin', 'Heldin'], ['fig_noa', 'Noa'], ['fig_haendler', 'Ladenbesitzer'], ['fig_buerger_d', 'Jugendlicher']];
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
      const lab = (i === 0 ? rows[r].label + ' · ' : '') + (cols[i] || ''); g.font = '600 15px system-ui,sans-serif'; const tw = g.measureText(lab).width; g.fillStyle = r ? 'rgba(30,110,60,.78)' : 'rgba(20,28,44,.62)';
      g.beginPath(); g.roundRect ? g.roundRect(x + 8, y + 8, tw + 18, 25, 9) : g.rect(x + 8, y + 8, tw + 18, 25); g.fill(); g.fillStyle = '#fff'; g.fillText(lab, x + 17, y + 25); }
    g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(0, top + ch - 1, W, 3);
    g.fillStyle = '#1f2a40'; g.font = '700 23px system-ui,sans-serif'; g.fillText(title, 18, 34); const tw0 = g.measureText(title).width; g.fillStyle = '#5a6478'; g.font = '15px system-ui,sans-serif'; g.fillText(sub, 18 + tw0 + 16, 34);
    return cv.toDataURL('image/png'); }, [rows, cw, ch, title, sub, cols, W, H]);
  await toWebp(p, d, file);
}
async function setupR4(p) {   // R4-Stände als eigene Modell-Schlüssel <id>_r4; warten, bis die leichten LOD-Netze (62-lod) fertig sind
  return p.evaluate(async (ids) => { const o = {};
    for (const id of ids) { const k = id + '_r4'; FIG_MODELS[k] = Object.assign({}, FIG_MODELS[id]); PILOT.fix[k] = Object.assign({}, PILOT.fix[id]); PILOT.src[k] = 'fixtures/figuren/' + id + '_r4.glb';
      const a = await pilotLoad(k), b = await pilotLoad(id); o[id] = { r4: !!a, r5: !!b }; }
    for (let i = 0; i < 600 && (LOD4.pend > 0 || LOD_Q.length); i++) await new Promise(r => setTimeout(r, 100));
    return { laden: o, lodPend: LOD4.pend, lodMs: LOD4.ms.slice(-8) }; }, FIGS.map(f => f[0]));
}
// Dreiecke je Figur: Hauptnetz (ohne Hülle/Schatten), GLB-LOD1, leichtes Netz (Hülle/LOD1/Schatten zur Laufzeit), Schutzgewicht vorhanden?
const tri = (p) => p.evaluate((ids) => Object.fromEntries(ids.flatMap(id => [id + '_r4', id]).map(id => { const g = PILOT.gltf[id]; let t = 0, l = 0, hu = 0, w = false;
  g.scene.traverse(m => { if (!m.isMesh) return; const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (/LOD1/.test(m.name)) l += n; else t += n;
    if (m.name === 'Koerper') { const G = LOD4.cache.get(m.geometry); hu = G ? G.index.count / 3 : 0; w = !!m.geometry.attributes._lodw; } });
  return [id, { haupt: t, lod1Glb: l, huelle: hu, schutz: w }]; })), FIGS.map(f => f[0]));
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
    STU.add = (o, ry = 0) => { o.position.set(0, 0, 0); o.rotation.y = ry + Math.PI; S.add(o); STU.objs.push(o); o.updateMatrixWorld(true); return o; };
    STU.tick = (o, sec) => { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) pilotTick(o, 1 / 60, {}); o.updateMatrixWorld(true); };
    // R4-Zeilen mit dem Shader-Stand R4 (ohne Haarmaske), R5-Zeilen mit Haarmaske – damit der Vergleich auch die Shader-Änderung zeigt
    STU.r4shader = (o, on) => o.traverse(m => { const u = m.material && m.material.uniforms; if (u && u.uHairSh) { u.uHairSh.value = on ? 0 : .6; u.uHairSoft.value = on ? 0 : 1.8; u.uHairWrap.value = on ? 0 : .4; } });
    STU.fig = (id) => { const o = figMake(id, null); STU.add(o, 0); STU.tick(o, 1.3); const U = o.userData; U.blink.next = 1e12; U.eye.next = 1e12; U.eye.tx = U.eye.ty = 0; pilotExpr(o, 'laecheln'); STU.tick(o, .6); STU.r4shader(o, /_r4$/.test(id)); return o; };
    // Kopf-/Handposition (Weltkoordinaten) aus dem Skelett
    STU.bone = (o, nm) => { const k = nm.replace(/[\[\]\.:\/]/g, ''); let b = null; o.traverse(q => { if (q.isBone && !b && q.name === k) b = q; }); return b ? b.getWorldPosition(new THREE.Vector3()).toArray() : [0, 1, 0]; };   // three entfernt „.“ aus Knochennamen
    STU.shot = (pos, at, fov = 28, w = W, h = H) => { rr.setSize(w, h); cam.aspect = w / h; cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(...pos); cam.lookAt(...at); cam.updateMatrixWorld();
      if (typeof toonProSync === 'function') toonProSync(rr); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
    STU.rel = (c, d, at) => [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
  }, [W, H]);
}
const P = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } });
await newGame(P, { team: [[1, 12]], view: 'third' }); P.setDefaultTimeout(240000);
res.laden = await setupR4(P); console.log('Laden', JSON.stringify(res.laden));
res.dreiecke = await tri(P); console.log('Dreiecke', JSON.stringify(res.dreiecke));
await studio(P);
const ROWS = [['_r4', 'Vorher R4'], ['', 'Nachher R5']];
if (has('studio')) {   // alle 4 Figuren ganz, Dreiviertel-Ansicht (Hülle an)
  const rows = []; for (const [suf, label] of ROWS) rows.push({ label, imgs: await P.evaluate(([ids, suf]) => ids.map(id => { STU.clear(); const o = STU.fig(id + suf); const hh = FIG_MODELS[id].h;
    return STU.shot([1.7 * hh, .62 * hh, 3.3 * hh], [0, .55 * hh, 0], 25, 400, 423); }), [FIGS.map(f => f[0]), suf]) });
  await sheet(P, rows, 'r5_vergleich_studio.webp', { cw: 400, ch: 423, cols: FIGS.map(f => f[1]), title: 'Figuren – Runde 4 vs. Runde 5', sub: 'Volumen-Strähnen + geglättete Normalen, Kappe „kappe4“/Mütze mit eigenem Zeichen, Block-Hände, Haarmaske im Shader' });
}
if (has('nah')) {   // Köpfe + Pferdeschwanz-Schattenseite + Hand
  const rows = []; for (const [suf, label] of ROWS) rows.push({ label, imgs: await P.evaluate((suf) => { const out = [];
    let o; STU.clear(); o = STU.fig('fig_heldin' + suf); let hd = STU.bone(o, 'head'); const hc = [0, hd[1] + .1, 0];
    out.push(STU.shot([.72, hc[1] + .02, -.04], hc, 26, 266, 423));                 // Heldin seitlich
    out.push(STU.shot([-.42, hc[1] + .1, -.62], STU.rel(hc, [0, -.05, 0]), 26, 266, 423));   // hinten, Pferdeschwanz (Schattenseite: Sonne vorn rechts)
    const h1 = STU.bone(o, 'hand.R'), h2 = STU.bone(o, 'finger2.R'), hm = [(h1[0] + h2[0]) / 2, (h1[1] + h2[1]) / 2, (h1[2] + h2[2]) / 2];
    out.push(STU.shot(STU.rel(hm, [-.3, .04, .1]), STU.rel(hm, [0, -.01, 0]), 28, 266, 423));   // Hand (rechts, von außen)
    for (const id of ['fig_noa', 'fig_haendler', 'fig_buerger_d']) { STU.clear(); o = STU.fig(id + suf); hd = STU.bone(o, 'head'); const c = [0, hd[1] + .09 * FIG_MODELS[id].h / 1.32, 0];
      out.push(STU.shot([.45 * FIG_MODELS[id].h / 1.32, c[1] + .06, .58 * FIG_MODELS[id].h / 1.32], c, 27, 266, 423)); }
    return out; }, suf) });
  await sheet(P, rows, 'r5_vergleich_nah.webp', { cw: 266, ch: 423, cols: ['Heldin seitlich', 'Heldin hinten', 'Hand', 'Noa', 'Ladenbesitzer', 'Jugendlicher'], title: 'Nah – R4 vs. R5', sub: 'runde Seiten-/Nackensträhnen, Pferdeschwanz-Schatten heller, eigene Zeichen, gerundete Hände' });
}
if (has('heldin')) {
  const rows = []; for (const [suf, label] of ROWS) rows.push({ label, imgs: await P.evaluate((id) => { STU.clear(); STU.fig(id); return [
    STU.shot([0, .78, 4.3], [0, .68, 0], 25, 400, 423), STU.shot([4.3, .78, .25], [0, .68, 0], 25, 400, 423),
    STU.shot([-1.4, 1.0, -3.9], [0, .7, 0], 25, 400, 423), STU.shot([.9, 2.3 * .5, -3.6 * .5], [0, .78, 0], 46, 400, 423)]; }, 'fig_heldin' + suf) });
  await sheet(P, rows, 'r5_heldin_studio.webp', { cw: 400, ch: 423, cols: ['vorne', 'seitlich', 'hinten', 'Spielkamera-Winkel (hinten oben)'], title: 'Heldin – Runde 4 vs. Runde 5', sub: 'gleicher Shader/Licht, Umrisshülle an' });
}
if (has('huelle')) {   // vereinfachte Hülle (= LOD1/Umriss/Schatten) der Heldin: R4 ohne Schutz 2,8 k vs. R5 mit Schutzgewicht 3,2 k
  const rows = []; res.huelle = {};
  for (const [suf, label] of ROWS) { const r = await P.evaluate(([id, W, H]) => {
      const g = PILOT.gltf[id]; let src = null; g.scene.traverse(m => { if (m.name === 'Koerper' && m.isMesh) src = m.geometry; }); const G = LOD4.cache.get(src);
      const S = new THREE.Scene(); S.background = new THREE.Color('#f4f6f8'); S.add(new THREE.HemisphereLight('#ffffff', '#b8c0c8', .7)); const dl = new THREE.DirectionalLight('#ffffff', .6); dl.position.set(1, 2, 2); S.add(dl);
      const mat = new THREE.MeshPhongMaterial({ color: '#d8c8b8', flatShading: true, shininess: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const wire = new THREE.LineBasicMaterial({ color: '#2a3a5a', transparent: true, opacity: .55 });
      const mk = (geo) => { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', geo.attributes.position); gg.setIndex(geo.index); const m = new THREE.Mesh(gg, mat); m.add(new THREE.LineSegments(new THREE.WireframeGeometry(gg), wire)); return m; };
      const L = mk(G); S.add(L); const box = new THREE.Box3().setFromBufferAttribute(src.attributes.position); const top = box.max.y, hc = new THREE.Vector3(0, top - .14, 0);
      const cam = new THREE.PerspectiveCamera(24, 1, .01, 20); const rr = STU.rr; const shots = [];
      const shot = (pos, w, h) => { rr.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); cam.position.copy(hc).add(new THREE.Vector3(...pos)); cam.lookAt(hc); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
      shots.push(shot([0, .05, .9], 320, 423), shot([.9, .03, 0], 320, 423), shot([-.35, .2, -.85], 320, 423));
      // Silhouetten-Vergleich: Original und Hülle je einzeln als Maske → beide = grau, nur Original (Hülle schneidet ab) = blau, nur Hülle (steht über) = rot
      S.remove(L); S.background = new THREE.Color('#ffffff'); const bm = new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.DoubleSide });
      const o0 = new THREE.Mesh(src, bm), o1 = new THREE.Mesh(G, bm); const px = { w: 320, h: 423 }, cnt = {};
      for (const [vw, pos] of [['seitlich', [.9, .03, 0]], ['vorn', [0, .05, .9]]]) { S.add(o0); const a = shot(pos, px.w, px.h); S.remove(o0); S.add(o1); const b = shot(pos, px.w, px.h); S.remove(o1); shots.push([a, b]); }
      return { shots, tris: G.index.count / 3, schutz: !!src.attributes._lodw }; }, ['fig_heldin' + suf, W, H]);
    for (let i = 0; i < r.shots.length; i++) if (Array.isArray(r.shots[i])) { const q = await P.evaluate(async ([a, b]) => { const ld = s => new Promise(z => { const im = new Image(); im.onload = () => z(im); im.src = s; });
        const A = await ld(a), B = await ld(b), c = document.createElement('canvas'); c.width = A.width; c.height = A.height; const g = c.getContext('2d'); g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, c.width, c.height); g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, c.width, c.height);
        const o = g.createImageData(c.width, c.height); let n0 = 0, cut = 0, over = 0;
        for (let k = 0; k < da.data.length; k += 4) { const ia = da.data[k] < 128, ib = db.data[k] < 128; const col = ia && ib ? [150, 158, 172] : ia ? [30, 90, 230] : ib ? [230, 40, 50] : [255, 255, 255]; if (ia) n0++; if (ia && !ib) cut++; if (ib && !ia) over++; o.data.set([...col, 255], k); }
        g.putImageData(o, 0, 0); return { img: c.toDataURL('image/png'), cut: +(cut / n0 * 100).toFixed(2), over: +(over / n0 * 100).toFixed(2) }; }, r.shots[i]);
      r.shots[i] = q.img; (r.sil = r.sil || []).push({ abgeschnitten: q.cut, uebersteht: q.over }); }
    res.huelle[label] = { tris: r.tris, schutz: r.schutz, silhouetteKopf_prozent: r.sil }; rows.push({ label: label + ' (' + (r.tris / 1000).toFixed(1).replace('.', ',') + ' k' + (r.schutz ? ', Schutz' : '') + ')', imgs: r.shots }); }
  await sheet(P, rows, 'r5_lod_huelle.webp', { cw: 320, ch: 423, cols: ['Hülle vorn', 'seitlich', 'hinten', 'Umriss seitl.: blau = fehlt, rot = steht über', 'Umriss vorn'], title: 'Heldin – vereinfachte Hülle (LOD1/Umriss/Schatten)', sub: 'R4: 2,8 k ohne Schutz · R5: Schutzgewicht _LODW (Haar/Kappe), 3,2 k' });
}
await P.evaluate(() => { try { STU.rr.domElement.remove(); STU.rr.dispose(); terrainY = window.__ty; mode = 'world'; } catch (e) { } });
res.fehlerStudio = P.errs; await P.ctx.close();
if (has('welt')) {   // echtes Spielbild, Spielkamera (third): Heldin + Ladenbesitzer + Jugendlicher vor ihr – einmal alle R4, einmal alle R5; Umrisshülle an
  const p = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } }); await newGame(p, { team: [[1, 12]], view: 'third' }); p.setDefaultTimeout(240000);
  await setupR4(p);
  res.weltSetup = await p.evaluate(() => { G.outfit = Object.assign(G.outfit || {}, { body: 'heldin' }); VILL.list = []; G.time = 10.5 * 60; mode = 'world'; loadMap('morgenau', 5, 5);
    const M = cur, ok = (x, y) => x > 1 && y > 1 && x < M.w - 2 && y < M.h - 2 && !blocked(x, y); let best = null, bs = -1;
    for (let y = 7; y < M.h - 3; y++)for (let x = 4; x < M.w - 4; x++) { let n = 0; for (let dy = -6; dy <= 3; dy++)for (let dx = -3; dx <= 3; dx++)if (ok(x + dx, y + dy)) n++; if (n > bs) { bs = n; best = [x, y]; } }
    let cD = null; for (let i = 0; i < 4000 && !cD; i++) { const c = '#' + (0x404040 + i * 2654435 % 0xbfbfbf).toString(16).padStart(6, '0'); if (figModelFor(c, '#333') === 'fig_buerger_d') cD = c; }
    NPCS.morgenau = (NPCS.morgenau || []).filter(n => !n._r5 && Math.hypot(n.x - best[0], n.y - best[1]) > 5);   // freie Sicht: übrige Bewohner in der Nähe weg
    NPCS.morgenau.push({ x: best[0] - 1, y: best[1] - 2, c: '#6aa0e0', t: 'talk', txt: ['Hallo!'], _r5: 1 }, { x: best[0] + 1, y: best[1] - 2, c: cD, t: 'talk', txt: ['Hallo!'], _r5: 1 });
    G.weather = Object.assign(G.weather || {}, { morgenau: 'klar' }); if (typeof setWeatherVisual === 'function') setWeatherVisual('klar');
    loadMap('route1', 9, 12); R3.mapId = null; loadMap('morgenau', best[0], best[1]); P.dir = 'up'; P.ang = 0; setView('third', true); R3.ofk = null; return { best, cD }; });
  await p.waitForTimeout(5000);
  const shots = [];
  for (const [suf, label] of ROWS) {
    await p.evaluate((suf) => { PILOT._g5 = PILOT._g5 || {}; for (const id of ['fig_heldin', 'fig_noa', 'fig_haendler', 'fig_buerger_d']) { PILOT._g5[id] = PILOT._g5[id] || PILOT.gltf[id]; PILOT.gltf[id] = suf ? PILOT.gltf[id + suf] : PILOT._g5[id]; }
      G.time = 10.5 * 60; VILL.list = []; R3.ofk = null; P.dir = 'up'; P.ang = 0; R3.mapId = null; loadMap('morgenau', P.x, P.y); VILL.list = []; }, suf);
    await p.waitForTimeout(4500); await p.evaluate((r4) => { document.querySelectorAll('.toast,#toast').forEach(e => e.remove());   // R4: Shader ohne Haarmaske
      R3.scene.traverse(m => { const u = m.material && m.material.uniforms; if (u && u.uHairSh && u.uFig && u.uFig.value) { u.uHairSh.value = r4 ? 0 : .6; u.uHairSoft.value = r4 ? 0 : 1.8; u.uHairWrap.value = r4 ? 0 : .4; } }); }, !!suf);
    const r = await p.evaluate(() => { const r = R3.r, S = R3.scene, cam = R3.activeCam || R3.cam; r.render(S, cam); const full = r.domElement.toDataURL('image/png');
      const a = R3.player.getWorldPosition(new THREE.Vector3()), v = a.clone().add(new THREE.Vector3(0, .9, -.8)).project(cam); let n = 0, ol = 0; S.traverse(o => { if (o.userData && o.userData.pilot) n++; if (o.userData && o.userData.outline === 1 && o.visible) ol++; });
      return { full, cx: (v.x * .5 + .5), cy: (-v.y * .5 + .5), held: !!R3.player.userData.pilot, modelle: n, umrisse: ol }; });
    shots.push({ ...r, label });
  }
  const d = await p.evaluate(async ([shots, W, H]) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < shots.length; i++) { const s = shots[i], im = new Image(); await new Promise(z => { im.onload = z; im.src = s.full; }); const cw = 400, ch = 423, sx = Math.max(0, Math.min(im.width - cw, s.cx * im.width - cw / 2)), sy = Math.max(0, Math.min(im.height - ch, s.cy * im.height - ch / 2));
      g.imageSmoothingQuality = 'high'; g.drawImage(im, sx, sy, cw, ch, i * 800, 54, 800, 846); g.font = '600 16px system-ui,sans-serif'; const lab = s.label + ' · echte Spielkamera, Umrisshülle an (Ausschnitt 2×)'; const tw = g.measureText(lab).width;
      g.fillStyle = i ? 'rgba(30,110,60,.78)' : 'rgba(20,28,44,.62)'; g.beginPath(); g.roundRect(i * 800 + 8, 62, tw + 18, 26, 9); g.fill(); g.fillStyle = '#fff'; g.fillText(lab, i * 800 + 17, 80); }
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(799, 54, 2, 846); g.fillStyle = '#1f2a40'; g.font = '700 23px system-ui,sans-serif'; g.fillText('Im Spiel (Morgenau): Heldin, Ladenbesitzer, Jugendlicher – R4 vs. R5', 18, 34);
    return cv.toDataURL('image/png'); }, [shots, W, H]);
  await toWebp(p, d, 'r5_vergleich_welt.webp'); await toWebp(p, shots[1].full, 'r5_welt_ganz.webp', .9);
  res.welt = shots.map(s => ({ label: s.label, held: s.held, modelle: s.modelle, umrisse: s.umrisse })); res.fehlerWelt = p.errs; await p.ctx.close();
}
writeFileSync(OUT + 'r5_vergleich.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res).slice(0, 3000));
await env.close();
