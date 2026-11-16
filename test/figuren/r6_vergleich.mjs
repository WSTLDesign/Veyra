// Figuren Runde 6 – Vergleichsbilder: Vorher R5-Stand (test/fixtures/figuren/fig_<id>_r5alt.glb) neben Nachher R6 (public/models/figuren/fig_<id>.glb),
// gleicher Shader/Licht (beide Zeilen mit Haarmaske), Umrisshülle an (Hülle = leichtes Netz aus src/62-lod.js). Figuren: Heldin (Ring 12), Rayan, Prof. Veyran, Mama, Mirael, Bürger a, b, c.
// NUR unter der Chromium-Sperre:  LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/figuren/r6_vergleich.mjs [studio|nah|welt|alle]
// (vorher: node build.mjs, damit dist/ die neuen GLB enthält)
// Ausgabe: test/figuren/r6_vergleich_studio.webp (alle 8 Figuren ganz, Dreiviertel) · r6_vergleich_nah.webp (Köpfe vorn/schräg + von hinten, je 4 Figuren pro Block) ·
//          r6_vergleich_welt.webp (echtes Spielbild Morgenau, Spielkamera, alle 8 Figuren) · r6_vergleich.json (Dreiecke, Hüllen, Fehler)
import { start, page, newGame } from '../qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const OUT = new URL('./', import.meta.url).pathname, W = 1600, what = process.argv[2] || 'alle', has = k => what === 'alle' || what.split(',').includes(k);
const FIGS = [['fig_heldin', 'Heldin', 5.75], ['fig_rayan', 'Rayan', 5.75], ['fig_veyran', 'Prof. Veyran', 6.9], ['fig_mama', 'Mama', 7.0], ['fig_mirael', 'Mirael', 7.0], ['fig_buerger_a', 'Bürgerin a', 7.0], ['fig_buerger_b', 'Bürgerin b', 6.8], ['fig_buerger_c', 'Bürger c', 7.3]];
const env = await start(); const res = {};
const toWebp = async (p, src, file, q = .92) => { const d = await p.evaluate(async ([s, q]) => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s; }); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q); }, [src, q]);
  writeFileSync(OUT + file, Buffer.from(d.split(',')[1], 'base64')); console.log('→ test/figuren/' + file); };
// Bogen: Zeilen (je eigene Spalten/Etiketten) – Vorher grau, Nachher grün
async function sheet(p, rows, file, { cw, ch, title, sub, W: SW = W }) {
  const d = await p.evaluate(async ([rows, cw, ch, title, sub, W]) => {
    const top = 54, H = top + rows.length * ch, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows.length; r++) { const ox = Math.round((W - rows[r].imgs.length * cw) / 2);
      for (let i = 0; i < rows[r].imgs.length; i++) { const x = ox + i * cw, y = top + r * ch; const im = new Image(); await new Promise(z => { im.onload = z; im.src = rows[r].imgs[i]; }); g.drawImage(im, x, y, cw, ch);
        if (i) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x - 1, y, 2, ch); }
        const lab = (i === 0 ? rows[r].label + ' · ' : '') + (rows[r].cols[i] || ''); g.font = '600 15px system-ui,sans-serif'; const tw = g.measureText(lab).width; g.fillStyle = rows[r].neu ? 'rgba(30,110,60,.78)' : 'rgba(20,28,44,.62)';
        g.beginPath(); g.roundRect ? g.roundRect(x + 8, y + 8, tw + 18, 25, 9) : g.rect(x + 8, y + 8, tw + 18, 25); g.fill(); g.fillStyle = '#fff'; g.fillText(lab, x + 17, y + 25); }
      g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(0, top + (r + 1) * ch - (rows[r].neu ? 1 : 0), W, rows[r].neu ? 3 : 1); }
    g.fillStyle = '#1f2a40'; g.font = '700 23px system-ui,sans-serif'; g.fillText(title, 18, 34); const tw0 = g.measureText(title).width; g.fillStyle = '#5a6478'; g.font = '15px system-ui,sans-serif'; g.fillText(sub, 18 + tw0 + 16, 34);
    return cv.toDataURL('image/png'); }, [rows, cw, ch, title, sub, SW]);
  await toWebp(p, d, file);
}
// R5-Stände als eigene Modell-Schlüssel <id>_r5alt; warten, bis die leichten LOD-Netze (62-lod) fertig sind
async function setupAlt(p) {
  return p.evaluate(async (ids) => { const o = {};
    for (const id of ids) { const k = id + '_r5alt'; FIG_MODELS[k] = Object.assign({}, FIG_MODELS[id]); PILOT.fix[k] = Object.assign({}, PILOT.fix[id]); PILOT.src[k] = 'fixtures/figuren/' + id + '_r5alt.glb';
      const a = await pilotLoad(k), b = await pilotLoad(id); o[id] = { alt: !!a, neu: !!b }; }
    for (let i = 0; i < 900 && (LOD4.pend > 0 || LOD_Q.length); i++) await new Promise(r => setTimeout(r, 100));
    return { laden: o, lodPend: LOD4.pend }; }, FIGS.map(f => f[0]));
}
// Dreiecke je Figur: Hauptnetz (ohne Hülle/Schatten), GLB-LOD1, leichtes Netz (Hülle/LOD1/Schatten zur Laufzeit), Schutzgewicht vorhanden?
const tri = (p) => p.evaluate((ids) => Object.fromEntries(ids.flatMap(id => [id + '_r5alt', id]).map(id => { const g = PILOT.gltf[id]; let t = 0, l = 0, hu = 0, w = false, wn = 0;
  g.scene.traverse(m => { if (!m.isMesh) return; const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (/LOD1/.test(m.name)) l += n; else t += n;
    if (m.name === 'Koerper') { const G = LOD4.cache.get(m.geometry); hu = G ? G.index.count / 3 : 0; w = !!m.geometry.attributes._lodw; if (w) for (const v of m.geometry.attributes._lodw.array) if (v > 0) wn++; } });
  return [id, { haupt: t, lod1Glb: l, huelle: hu, schutz: w, geschuetzteEcken: wn }]; })), FIGS.map(f => f[0]));
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
    STU.fig = (id) => { const o = figMake(id, null); STU.add(o, 0); STU.tick(o, 1.3); const U = o.userData; U.blink.next = 1e12; U.eye.next = 1e12; U.eye.tx = U.eye.ty = 0; pilotExpr(o, 'laecheln'); STU.tick(o, .6); return o; };
    STU.bone = (o, nm) => { const k = nm.replace(/[\[\]\.:\/]/g, ''); let b = null; o.traverse(q => { if (q.isBone && !b && q.name === k) b = q; }); return b ? b.getWorldPosition(new THREE.Vector3()).toArray() : [0, 1, 0]; };   // three entfernt „.“ aus Knochennamen
    STU.shot = (pos, at, fov = 28, w = W, h = H) => { rr.setSize(w, h); cam.aspect = w / h; cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(...pos); cam.lookAt(...at); cam.updateMatrixWorld();
      if (typeof toonProSync === 'function') toonProSync(rr); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
  }, [W, 900]);
}
const P = await page(env, { w: W, h: 900, set: { quality: 'eigene', modelle3d: true } });
await newGame(P, { team: [[1, 12]], view: 'third' }); P.setDefaultTimeout(300000);
res.laden = await setupAlt(P); console.log('Laden', JSON.stringify(res.laden));
res.dreiecke = await tri(P); console.log('Dreiecke', JSON.stringify(res.dreiecke));
await studio(P);
const ROWS = [['_r5alt', 'Vorher R5-Stand', 0], ['', 'Nachher R6', 1]];
if (has('studio')) {   // alle 8 Figuren ganz, Dreiviertel-Ansicht (Hülle an)
  const rows = []; for (const [suf, label, neu] of ROWS) rows.push({ label, neu, cols: FIGS.map(f => f[1]), imgs: await P.evaluate(([ids, suf]) => ids.map(id => { STU.clear(); STU.fig(id + suf); const hh = FIG_MODELS[id].h;
    return STU.shot([1.45 * hh, .66 * hh, 3.3 * hh], [0, .53 * hh, 0], 25, 200, 420); }), [FIGS.map(f => f[0]), suf]) });
  await sheet(P, rows, 'r6_vergleich_studio.webp', { cw: 200, ch: 420, title: 'Figuren – Runde 5 vs. Runde 6', sub: 'Haar als runde Volumen-Strähnen, geglättete Normalen, Block-Hände, Budget ≤ 9 k (Heldin: Pony/Seiten Ring 12)' });
}
if (has('nah')) {   // Köpfe: Dreiviertel von vorn + von hinten, je 4 Figuren pro Block
  const rows = [];
  for (const grp of [FIGS.slice(0, 4), FIGS.slice(4)]) for (const [view, vl] of [['vorn', 'vorn/schräg'], ['hinten', 'von hinten']]) for (const [suf, label, neu] of ROWS)
    rows.push({ label: label + ' ' + vl, neu, cols: grp.map(f => f[1]), imgs: await P.evaluate(([grp, suf, view]) => grp.map(([id, , heads]) => { STU.clear(); const o = STU.fig(id + suf); const hh = FIG_MODELS[id].h, s = hh / heads / (1.32 / 5.75);
      const ec = STU.bone(o, 'eye.L'), c = [0, ec[1] + .015 * s, 0];
      return view === 'vorn' ? STU.shot([.40 * s, c[1] + .05 * s, .62 * s], c, 27, 400, 300) : STU.shot([-.36 * s, c[1] + .1 * s, -.66 * s], [0, c[1] - .02 * s, 0], 27, 400, 300); }), [grp, suf, view]) });
  await sheet(P, rows, 'r6_vergleich_nah.webp', { cw: 400, ch: 300, title: 'Köpfe nah – R5-Stand vs. R6', sub: 'Strähnen rund (Superellipse, Spitzen nach außen), ruhige Normalen, Dutt/Pferdeschwanz/Locken/Stacheln/Wolkenhaar' });
}
await P.evaluate(() => { try { STU.rr.domElement.remove(); STU.rr.dispose(); terrainY = window.__ty; mode = 'world'; } catch (e) { } });
res.fehlerStudio = P.errs; await P.ctx.close();
if (has('welt')) {   // echtes Spielbild (Spielkamera third): Heldin + 7 NPCs in einer Reihe vor ihr – einmal alle R5-Stand, einmal alle R6; Umrisshülle an
  const p = await page(env, { w: W, h: 900, set: { quality: 'eigene', modelle3d: true } }); await newGame(p, { team: [[1, 12]], view: 'third' }); p.setDefaultTimeout(300000);
  await setupAlt(p);
  res.weltSetup = await p.evaluate(() => { G.outfit = Object.assign(G.outfit || {}, { body: 'heldin' }); VILL.list = []; G.time = 10.5 * 60; mode = 'world'; loadMap('morgenau', 5, 5);
    const M = cur, ok = (x, y) => x > 1 && y > 1 && x < M.w - 2 && y < M.h - 2 && !blocked(x, y); let best = null, bs = -1;
    const T = [[-2, -2], [-1, -2], [1, -2], [2, -2], [-2, -4], [0, -4], [2, -4]]; for (let y = 8; y < M.h - 3; y++)for (let x = 5; x < M.w - 5; x++) { if (!ok(x, y) || !ok(x, y - 1) || !ok(x, y - 2) || !ok(x, y - 3) || T.some(([dx, dy]) => !ok(x + dx, y + dy))) continue; let n = 0; for (let dy = -5; dy <= 1; dy++)for (let dx = -4; dx <= 4; dx++)if (ok(x + dx, y + dy)) n++; if (n > bs) { bs = n; best = [x, y]; } }   // vordere Reihe (4) und hintere Reihe (3) müssen frei sein, Heldin steht davor
    const col = {}; for (const want of ['fig_buerger_a', 'fig_buerger_b', 'fig_buerger_c']) for (let i = 0; i < 6000 && !col[want]; i++) { const c = '#' + (0x404040 + i * 2654435 % 0xbfbfbf).toString(16).padStart(6, '0'); if (figModelFor(c, '#333') === want) col[want] = c; }
    NPCS.morgenau = (NPCS.morgenau || []).filter(n => !n._r6 && Math.hypot(n.x - best[0], n.y - best[1]) > 7);   // freie Sicht: übrige Bewohner in der Nähe weg
    const L = [{ fig: 'rayan' }, { fig: 'mama' }, { c: col.fig_buerger_a }, { c: col.fig_buerger_b }, { fig: 'mirael' }, { fig: 'veyran' }, { c: col.fig_buerger_c }];   // vorn: Rayan, Mama, a, b · hinten: Mirael, Veyran, c
    L.forEach((e, i) => NPCS.morgenau.push(Object.assign({ x: best[0] + T[i][0], y: best[1] + T[i][1], c: e.c || '#e8e8e8', t: 'talk', txt: ['Hallo!'], _r6: 1 }, e.fig ? { fig: e.fig } : {})));
    G.weather = Object.assign(G.weather || {}, { morgenau: 'klar' }); if (typeof setWeatherVisual === 'function') setWeatherVisual('klar');
    loadMap('route1', 9, 12); R3.mapId = null; loadMap('morgenau', best[0], best[1]); P.dir = 'up'; P.ang = 0; setView('third', true); R3.ofk = null; return { best, col }; });
  await p.waitForTimeout(6000);
  const shots = [];
  for (const [suf, label] of ROWS) {
    await p.evaluate((suf) => { PILOT._g6 = PILOT._g6 || {}; for (const id of ['fig_heldin', 'fig_rayan', 'fig_veyran', 'fig_mama', 'fig_mirael', 'fig_buerger_a', 'fig_buerger_b', 'fig_buerger_c']) { PILOT._g6[id] = PILOT._g6[id] || PILOT.gltf[id]; PILOT.gltf[id] = suf ? PILOT.gltf[id + suf] : PILOT._g6[id]; }
      G.time = 10.5 * 60; VILL.list = []; R3.ofk = null; P.dir = 'up'; P.ang = 0; R3.mapId = null; loadMap('morgenau', P.x, P.y); VILL.list = []; }, suf);
    await p.waitForTimeout(5000); await p.evaluate(() => { document.querySelectorAll('.toast,#toast').forEach(e => e.remove()); });
    const r = await p.evaluate(() => { const r = R3.r, S = R3.scene, cam = R3.activeCam || R3.cam; r.render(S, cam); const full = r.domElement.toDataURL('image/png');
      const a = R3.player.getWorldPosition(new THREE.Vector3()), v = a.clone().add(new THREE.Vector3(0, .95, -3)).project(cam); let n = 0, ol = 0; S.traverse(o => { if (o.userData && o.userData.pilot) n++; if (o.userData && o.userData.outline === 1 && o.visible) ol++; });
      return { full, cx: (v.x * .5 + .5), cy: (-v.y * .5 + .5), held: !!R3.player.userData.pilot, modelle: n, umrisse: ol, w: r.domElement.width, h: r.domElement.height }; });
    shots.push({ ...r, label });
  }
  const d = await p.evaluate(async ([shots, W]) => { const cw = 460, ch = 259, cv = document.createElement('canvas'); cv.width = W; cv.height = 54 + 450; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, 54 + 450);
    for (let i = 0; i < shots.length; i++) { const s = shots[i], im = new Image(); await new Promise(z => { im.onload = z; im.src = s.full; }); const sw = Math.min(im.width, cw), sh = Math.min(im.height, ch), sx = Math.max(0, Math.min(im.width - sw, s.cx * im.width - sw / 2)), sy = Math.max(0, Math.min(im.height - sh, s.cy * im.height - sh / 2));
      g.imageSmoothingQuality = 'high'; g.drawImage(im, sx, sy, sw, sh, i * 800, 54, 800, 450); g.font = '600 16px system-ui,sans-serif'; const lab = s.label + ' · echte Spielkamera, Umrisshülle an (Ausschnitt ≈ 1,7×)'; const tw = g.measureText(lab).width;
      g.fillStyle = i ? 'rgba(30,110,60,.78)' : 'rgba(20,28,44,.62)'; g.beginPath(); g.roundRect(i * 800 + 8, 62, tw + 18, 26, 9); g.fill(); g.fillStyle = '#fff'; g.fillText(lab, i * 800 + 17, 80); }
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(799, 54, 2, 450); g.fillStyle = '#1f2a40'; g.font = '700 23px system-ui,sans-serif'; g.fillText('Im Spiel (Morgenau): Heldin (vorn), Rayan, Mama, Bürgerin a/b · dahinter Mirael, Prof. Veyran, Bürger c – R5-Stand vs. R6', 18, 34);
    return cv.toDataURL('image/png'); }, [shots, W]);
  await toWebp(p, d, 'r6_vergleich_welt.webp');
  res.welt = shots.map(s => ({ label: s.label, held: s.held, modelle: s.modelle, umrisse: s.umrisse, aufloesung: [s.w, s.h] })); res.fehlerWelt = p.errs; await p.ctx.close();
}
writeFileSync(OUT + 'r6_vergleich.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res).slice(0, 3000));
await env.close();
