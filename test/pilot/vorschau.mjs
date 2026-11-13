// Pilot 3D-Modelle – Vorschaubilder 1600×900 (WebP) alt vs. neu, Ausdrücke, Umriss-Varianten, Gang-Reihe, Welt/Kampf + Messung.
// NUR unter der Chromium-Sperre:  LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/pilot/vorschau.mjs [noa|funki|welt|mess|alle]
import { start, page, newGame } from '../qa_lc_lib.mjs';
import { FIG_CODE } from '../charaktere_lib.mjs';
import { writeFileSync } from 'fs';
const OUT = new URL('./', import.meta.url).pathname, W = 1600, H = 900, what = process.argv[2] || 'alle', has = k => what === 'alle' || what.split(',').includes(k);
const env = await start(); const res = {};
const toWebp = async (p, src, file, q = .92) => { const d = await p.evaluate(async ([s, q]) => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s; }); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q); }, [src, q]);
  writeFileSync(OUT + file, Buffer.from(d.split(',')[1], 'base64')); console.log('→ test/pilot/' + file); };
// Studio im Spiel-Kontext: eigener Renderer wie im Spiel (ACES, lineare Ausgabe), freundliches Licht, Himmelverlauf, weicher Boden
async function studio(p) {
  await p.evaluate(([W, H]) => {
    mode = 'wait'; if (typeof VILL !== 'undefined') VILL.list = []; window.__ty = terrainY; terrainY = () => 0;
    const rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(W, H); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.02;
    rr.shadowMap.enabled = true; rr.shadowMap.type = THREE.PCFSoftShadowMap; Object.assign(rr.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(rr.domElement);
    const S = new THREE.Scene(); const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#b9d8f2'); gr.addColorStop(.62, '#e9f1f6'); gr.addColorStop(1, '#f4ead8'); x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
    S.background = new THREE.CanvasTexture(c);
    const hemi = new THREE.HemisphereLight('#eef6ff', '#d9c6a6', .78); S.add(hemi);
    const sun = new THREE.DirectionalLight('#fff0d8', .92); sun.position.set(2.2, 5, 3.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.radius = 4; Object.assign(sun.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5 }); S.add(sun, sun.target);
    const g = document.createElement('canvas'); g.width = g.height = 256; const y = g.getContext('2d'); const rg = y.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, '#e8e2d2'); rg.addColorStop(1, '#d3dcc4'); y.fillStyle = rg; y.fillRect(0, 0, 256, 256);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(g) })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
    const cam = new THREE.PerspectiveCamera(28, W / H, .02, 60);
    window.STU = { rr, S, sun, hemi, cam, ground, objs: [] };
    STU.clear = () => { STU.objs.forEach(o => S.remove(o)); STU.objs = []; };
    STU.add = (o, x = 0, z = 0, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry + Math.PI; // Spielobjekte schauen nach −Z → zur Kamera drehen
      o.traverse(q => { if (q.isMesh && !q.userData.outline) q.castShadow = true; }); S.add(o); STU.objs.push(o); o.updateMatrixWorld(true); return o; };
    STU.off = (fn) => { const s = SET.modelle3d; SET.modelle3d = false; try { return fn(); } finally { SET.modelle3d = s; } };
    STU.old = () => { const f = STU.off(() => (0, eval)(FIGC)); if (f.userData.rig && typeof gaitTick === 'function') { f.userData.gait = null; for (let k = 0; k < 3; k++)gaitTick(f, 1 / 60); } return f; };
    STU.tick = (o, sec, opt) => { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) { if (o.userData.pilot) pilotTick(o, 1 / 60, opt || {}); else if (o.userData.rig) gaitTick(o, 1 / 60, opt || {}); } o.updateMatrixWorld(true); };
    STU.shot = (pos, at, fov = 28, w = W, h = H) => { rr.setSize(w, h); cam.aspect = w / h; cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(...pos); cam.lookAt(...at); cam.updateMatrixWorld();
      if (typeof toonProSync === 'function') toonProSync(rr); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
  }, [W, H]);
}
// Bogen aus Einzelbildern (Canvas im Browser) mit Beschriftung
async function sheet(p, cells, file, { cols, cw, ch, title = '', sub = '' }) {
  const d = await p.evaluate(async ([cells, cols, cw, ch, title, sub, W, H]) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, H);
    const top = title ? 52 : 0; const rows = Math.ceil(cells.length / cols); const ox = (W - cols * cw) / 2;
    for (let i = 0; i < cells.length; i++) { const c = cells[i], x = ox + (i % cols) * cw, y = top + Math.floor(i / cols) * ch; const im = new Image(); await new Promise(r => { im.onload = r; im.src = c.img; });
      g.drawImage(im, x, y, cw, ch); if (c.label) { g.font = '600 19px system-ui,sans-serif'; const tw = g.measureText(c.label).width; g.fillStyle = 'rgba(20,28,44,.62)'; g.beginPath(); g.roundRect ? g.roundRect(x + 12, y + 12, tw + 22, 32, 10) : g.rect(x + 12, y + 12, tw + 22, 32); g.fill(); g.fillStyle = '#fff'; g.fillText(c.label, x + 23, y + 34); }
      if (i % cols) { g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x - 1, y, 2, ch); } }
    if (title) { g.fillStyle = '#1f2a40'; g.font = '700 24px system-ui,sans-serif'; g.fillText(title, 20, 34); const tw0 = g.measureText(title).width; if (sub) { g.fillStyle = '#5a6478'; g.font = '15px system-ui,sans-serif'; g.fillText(sub, 20 + tw0 + 18, 34); } }
    return cv.toDataURL('image/png'); }, [cells, cols, cw, ch, title, sub, W, H]);
  await toWebp(p, d, file);
}
const P = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } });
await newGame(P, { team: [[1, 12]], view: 'third' });
await P.evaluate(code => { window.FIGC = code; }, FIG_CODE('held'));
const ld = await P.evaluate(async () => { const t = performance.now(); const a = await pilotLoad('noa'); const t1 = performance.now(); const b = await pilotLoad('funki'); return { noa: !!a, funki: !!b, msNoa: PILOT.ms_noa, msFunki: PILOT.ms_funki }; });
console.log('Laden', ld); res.laden = ld;
await studio(P);
if (what === 'dbg') {
  const d = await P.evaluate(() => { STU.clear(); const o = pilotMake('noa', 1.32); STU.add(o, 0, 0, 0); STU.tick(o, .5);
    const img = STU.shot([0, 1.2, .8], [0, 1.18, 0], 26, 400, 400); const gl = STU.rr.getContext(); const px = new Uint8Array(4); gl.readPixels(200, 200, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let info = []; o.traverse(m => { if (m.isMesh && !m.userData.outline) { const u = m.material.uniforms; info.push([m.name, !!u.map.value, u.map.value && u.map.value.image && u.map.value.image.width, u.uSrgb.value, u.uHasMask.value, m.material.type]); } });
    const b = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .2), new THREE.MeshBasicMaterial({ color: '#ff0000' })); STU.add(b, 0, 0, 0); b.position.y = 1.18; b.position.z = .2; const img2 = STU.shot([0, 1.2, .8], [0, 1.18, 0], 26, 400, 400); gl.readPixels(200, 200, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const px2 = Array.from(px);
    return { info, px2, img }; });
  const d2 = await P.evaluate(() => { const g = PILOT.gltf.noa; let tex = null; g.scene.traverse(m => { if (m.isMesh && /Koerper/.test(m.name)) tex = m.material.uniforms ? m.material.uniforms.map.value : m.material.map; });
    const im = tex.image; const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 64, 64); const D = x.getImageData(0, 0, 64, 64).data; const s = []; for (let i = 0; i < 6; i++) { const k = ((20 + i * 7) * 64 + 10 + i * 8) * 4; s.push([D[k], D[k + 1], D[k + 2]]); }
    STU.clear(); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); STU.add(pl, 0, 0, 0); pl.position.y = 1.18; const img = STU.shot([0, 1.18, 1.2], [0, 1.18, 0], 50, 400, 400);
    return { s, imgType: im.constructor.name, img, bg: STU.S.background.image.constructor.name }; });
  console.log(JSON.stringify({ s: d2.s, t: d2.imgType, bg: d2.bg })); await toWebp(P, d2.img, 'dbg2.webp');
  console.log(JSON.stringify({ info: d.info, px2: d.px2 })); await toWebp(P, d.img, 'dbg.webp');
}
if (has('noa')) {
  // (a) alt vs. neu: vorn, schräg, Gesicht
  const pair = async (view) => P.evaluate((view) => { const imgs = []; for (const k of ['alt', 'neu']) { STU.clear(); const o = k === 'alt' ? STU.old() : pilotMake('noa', 1.32); STU.add(o, 0, 0, 0); if (k === 'neu') STU.tick(o, 1.3); else STU.tick(o, .2);
    const V = { vorn: [[0, .78, 4.3], [0, .68, 0], 26], schraeg: [[2.5, 1.0, 3.5], [0, .68, 0], 26], gesicht: [[.16, 1.2, .78], [0, 1.18, 0], 26] }[view]; imgs.push(STU.shot(V[0], V[1], V[2], 800, 900)); } return imgs; }, view);
  for (const v of ['vorn', 'schraeg', 'gesicht']) { const [a, b] = await pair(v); await sheet(P, [{ img: a, label: 'bisher (prozedural)' }, { img: b, label: 'neu (Blender-GLB + Toon-Pro)' }], `noa_alt_neu_${v}.webp`, { cols: 2, cw: 800, ch: 900 }); }
  // (b) Ausdrücke
  const ex = await P.evaluate(() => { STU.clear(); const o = pilotMake('noa', 1.32); STU.add(o, 0, 0, 0); const out = [];
    for (const [n, e] of [['neutral', 'neutral'], ['Lächeln', 'laecheln'], ['Staunen', 'staunen'], ['Blinzeln', 'blinzeln']]) { pilotExpr(o, e); o.userData.blink.next = 1e12; STU.tick(o, .8); out.push({ img: STU.shot([.1, 1.19, .62], [0, 1.175, 0], 24, 800, 424), label: n }); } return out; });
  await sheet(P, ex, 'noa_ausdruecke.webp', { cols: 2, cw: 800, ch: 424, title: 'Noa – Ausdrücke (Shape Keys)', sub: 'neutral · Lächeln · Staunen · Blinzeln' });
  // (e) Gang-Reihe: 8 Bilder Gehen + 8 Bilder Rennen (Seitenansicht, Clip-Zeit gesetzt)
  const gait = await P.evaluate(() => { const out = []; for (const clip of ['walk', 'run']) { STU.clear(); const o = pilotMake('noa', 1.32); STU.add(o, 0, 0, Math.PI / 2); const U = o.userData;
      for (const n in U.acts) U.acts[n].setEffectiveWeight(n === clip ? 1 : 0); const d = U.acts[clip].getClip().duration;
      for (let i = 0; i < 8; i++) { U.acts[clip].time = d * i / 8; U.mixer.update(0); o.updateMatrixWorld(true); out.push({ img: STU.shot([0, .72, 4.2], [0, .66, 0], 22, 200, 424), label: i ? '' : (clip === 'walk' ? 'Gehen' : 'Rennen') }); } } return out; });
  await sheet(P, gait, 'noa_gang_reihe.webp', { cols: 8, cw: 200, ch: 424, title: 'Noa – Gehen und Rennen (je 8 Bilder eines Zyklus)', sub: 'Füße stehen fest (IK im Bauskript), Arme gegengleich' });
}
if (has('funki')) {
  const pf = await P.evaluate(() => { const imgs = []; for (const k of ['alt', 'neu']) { STU.clear(); const o = k === 'alt' ? STU.off(() => buildTerra(1, .55, {})) : pilotMake('funki', .55); STU.add(o, 0, 0, k === 'alt' ? Math.PI * 0 : 0); if (o.userData.pilot) STU.tick(o, 1.1); imgs.push(STU.shot([1.15, .55, 1.55], [0, .27, 0], 26, 800, 900)); } return imgs; });
  await sheet(P, [{ img: pf[0], label: 'bisher (prozedural)' }, { img: pf[1], label: 'neu (Blender-GLB + Toon-Pro)' }], 'funki_alt_neu_studio.webp', { cols: 2, cw: 800, ch: 900 });
  // Kampf-Pose (Angriff) neu, mit warmem Kampflicht
  const kp = await P.evaluate(() => { STU.clear(); STU.sun.color.set('#ffd9b0'); const o = pilotMake('funki', .55); STU.add(o, 0, 0, -.5); const U = o.userData; for (const n in U.acts) U.acts[n].setEffectiveWeight(0);
    const a = U.acts.attack; a.reset(); a.setEffectiveWeight(1); a.play(); a.time = a.getClip().duration * .5; U.mixer.update(0); pilotExpr(o, 'maul'); for (let i = 0; i < 40; i++) pilotFace(U, 1 / 60); o.updateMatrixWorld(true);
    const img = STU.shot([.9, .42, 1.55], [-.05, .3, 0], 28, 800, 900); const b = STU.objs[0]; STU.clear(); const old = STU.off(() => buildTerra(1, .55, {})); STU.add(old, 0, 0, -.5); old.userData.act = { atk: performance.now() - 180 }; try { animMon(old, performance.now(), {}); } catch (e) { } const img0 = STU.shot([.9, .42, 1.55], [-.05, .3, 0], 28, 800, 900); STU.sun.color.set('#fff0d8'); return [img0, img]; });
  await sheet(P, [{ img: kp[0], label: 'bisher' }, { img: kp[1], label: 'neu – Angriff (Clip „attack“)' }], 'funki_kampfpose.webp', { cols: 2, cw: 800, ch: 900 });
  // (d) Umriss dünn vs. fast keine (Noa + Funki)
  const ol = await P.evaluate(() => { const out = []; for (const v of ['duenn', 'fast_keine']) { STU.clear(); const a = pilotMake('noa', 1.32, { outline: v }), b = pilotMake('funki', .55, { outline: v }); STU.add(a, -.28, 0, .25); STU.add(b, .42, .25, -.35); STU.tick(a, 1); STU.tick(b, 1.2);
      out.push({ img: STU.shot([.15, .92, 2.75], [.08, .62, 0], 28, 800, 900), label: v === 'duenn' ? 'Umriss „dünn“' : 'Umriss „fast keine“' }); } return out; });
  await sheet(P, ol, 'umriss_duenn_fastkeine.webp', { cols: 2, cw: 800, ch: 900 });
}
await P.evaluate(() => { try { STU.rr.domElement.remove(); STU.rr.dispose(); terrainY = window.__ty; mode = 'world'; } catch (e) { } });
// Welt: echtes Spielbild mit Schalter aus (bisher) und an (neu) – Held + Begleiter Funki, Route 1
res.fehlerStudio = P.errs; await P.ctx.close();
if (has('welt') || has('mess')) {
  const fps = async (p) => p.evaluate(async () => { let n = 0; const t0 = performance.now(); await new Promise(r => { const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); }); return +(n / ((performance.now() - t0) / 1000)).toFixed(1); });
  const shotWorld = async (on) => { const p = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: on } }); await newGame(p, { team: [[1, 12]], view: 'third' });
    if (on) await p.evaluate(async () => { await pilotLoad('noa'); await pilotLoad('funki'); R3.ofk = null; });
    await p.evaluate(() => { mode = 'world'; loadMap('route1', 9, 12); setView('third', true); VILL && (VILL.list = []); ROAM && (ROAM.want = 0, ROAM.list = []); P.dir = 'down'; P.ang = Math.PI; G.time = 11 * 60; });
    await p.waitForTimeout(2500); await p.evaluate(() => { STICK.y = 1; }); await p.waitForTimeout(900); await p.evaluate(() => { STICK.y = 0; }); await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelectorAll('.toast,#toast').forEach(e => e.style.visibility = 'hidden'));
    // Nahaufnahme aus Spielkamera-Richtung (Held + Begleiter)
    const r = await p.evaluate(() => { const S = R3.scene, pl = R3.player, mm = S.userData.mm, co = mm && COMP && mm.get(COMP); const r = R3.r; r.info.autoReset = false; r.info.reset(); r.render(S, R3.activeCam || R3.cam);
      const info = { calls: r.info.render.calls, tris: r.info.render.triangles, pilotHeld: !!pl.userData.pilot, pilotFunki: !!(co && co.userData.pilot) }; r.info.autoReset = true;
      const a = pl.getWorldPosition(new THREE.Vector3()), b = co ? co.getWorldPosition(new THREE.Vector3()) : a.clone(), c = a.clone().add(b).multiplyScalar(.5), gc = R3.activeCam || R3.cam;
      const dir = gc.position.clone().sub(c); dir.y = 0; dir.normalize(); dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), 2.5); const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .05, 300); cam.position.copy(c).addScaledVector(dir, 3.2); cam.position.y = c.y + 1.15; cam.lookAt(c.x, c.y + .45, c.z); cam.updateMatrixWorld();
      if (typeof toonProSync === 'function') toonProSync(r); r.render(S, cam); return { info, img: r.domElement.toDataURL('image/png') }; });
    const shot = 'data:image/png;base64,' + (await p.screenshot()).toString('base64');
    return { p, r, shot }; };
  const A = await shotWorld(false); A.fps = await fps(A.p); res.fehlerAlt = A.p.errs; await A.p.ctx.close();
  const B = await shotWorld(true); B.fps = await fps(B.p);
  res.fps = { alt: A.fps, neu: B.fps, hinweis: 'SwiftShader (Software-GL, 2 Kerne) – nur relativ vergleichbar' };
  res.welt = { alt: A.r.info, neu: B.r.info };
  await sheet(B.p, [{ img: A.r.img, label: 'bisher' }, { img: B.r.img, label: 'neu (Schalter modelle3d an)' }], 'funki_noa_welt_alt_neu.webp', { cols: 2, cw: 800, ch: 900 });
  await toWebp(B.p, B.shot, 'welt_spielbild_neu.webp');
  res.fehlerNeu = B.p.errs;
  res.ladeMs = await B.p.evaluate(() => ({ noa: PILOT.ms_noa, funki: PILOT.ms_funki }));
}
writeFileSync(OUT + 'vorschau_' + what + '.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res));
await env.close();
