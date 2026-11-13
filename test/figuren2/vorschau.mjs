// Figuren Runde 2 – Vorschaubilder 1600×900 (WebP): Noa Pilot vs. Runde 2, Ausdrücke, Gang/Renn-Reihe, Gesten, NPC-Aufstellung, NPC alt vs. neu, Spielbild Morgenau.
// NUR unter der Chromium-Sperre:  LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/figuren2/vorschau.mjs [noa|npc|welt|alle|dev]
import { start, page, newGame } from '../qa_lc_lib.mjs';
import { FIG_CODE } from '../charaktere_lib.mjs';
import { writeFileSync } from 'fs';
const OUT = new URL('./', import.meta.url).pathname, W = 1600, H = 900, what = process.argv[2] || 'alle', has = k => what === 'alle' || what.split(',').includes(k);
const env = await start(); const res = {};
const toWebp = async (p, src, file, q = .92) => { const d = await p.evaluate(async ([s, q]) => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s; }); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q); }, [src, q]);
  writeFileSync(OUT + file, Buffer.from(d.split(',')[1], 'base64')); console.log('→ test/figuren2/' + file); };
const NPCS_ = ['fig_veyran', 'fig_rayan', 'fig_mama', 'fig_mirael', 'fig_haendler', 'fig_buerger_a', 'fig_buerger_b', 'fig_buerger_c', 'fig_buerger_d'];
const NAMES = { fig_noa: 'Noa', fig_veyran: 'Prof. Veyran', fig_rayan: 'Rayan', fig_mama: 'Mama', fig_mirael: 'Mirael (Station)', fig_haendler: 'Ladenbesitzer', fig_buerger_a: 'Bewohnerin', fig_buerger_b: 'Bewohnerin (älter)', fig_buerger_c: 'Bewohner', fig_buerger_d: 'Jugendlicher' };
async function studio(p) {
  await p.evaluate(([W, H]) => {
    mode = 'wait'; if (typeof VILL !== 'undefined') VILL.list = []; window.__ty = terrainY; terrainY = () => 0; PILOT.lodD = 1e9;
    const rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(W, H); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.02;
    rr.shadowMap.enabled = true; rr.shadowMap.type = THREE.PCFSoftShadowMap; Object.assign(rr.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(rr.domElement);
    const S = new THREE.Scene(); const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#b9d8f2'); gr.addColorStop(.62, '#e9f1f6'); gr.addColorStop(1, '#f4ead8'); x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
    S.background = new THREE.CanvasTexture(c);
    const hemi = new THREE.HemisphereLight('#eef6ff', '#d9c6a6', .78); S.add(hemi);
    const sun = new THREE.DirectionalLight('#fff0d8', .92); sun.position.set(2.2, 5, 3.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.radius = 4; Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 4, bottom: -4 }); S.add(sun, sun.target);
    const g = document.createElement('canvas'); g.width = g.height = 256; const y = g.getContext('2d'); const rg = y.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, '#e8e2d2'); rg.addColorStop(1, '#d3dcc4'); y.fillStyle = rg; y.fillRect(0, 0, 256, 256);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(g) })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
    const cam = new THREE.PerspectiveCamera(28, W / H, .02, 80);
    window.STU = { rr, S, sun, hemi, cam, ground, objs: [] };
    STU.clear = () => { STU.objs.forEach(o => S.remove(o)); STU.objs = []; };
    STU.add = (o, x = 0, z = 0, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry + Math.PI; o.traverse(q => { if (q.isMesh && !q.userData.outline) q.castShadow = true; }); S.add(o); STU.objs.push(o); o.updateMatrixWorld(true); return o; };
    STU.off = (fn) => { const s = SET.modelle3d; SET.modelle3d = false; try { return fn(); } finally { SET.modelle3d = s; } };
    STU.old = (code) => { const f = STU.off(() => (0, eval)(code)); if (f.userData.rig && typeof gaitTick === 'function') { f.userData.gait = null; for (let k = 0; k < 3; k++)gaitTick(f, 1 / 60); } return f; };
    STU.tick = (o, sec, opt) => { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) { if (o.userData.pilot) pilotTick(o, 1 / 60, opt || {}); else if (o.userData.rig) gaitTick(o, 1 / 60, opt || {}); } o.updateMatrixWorld(true); };
    STU.fig = (id) => figMake(id, null);
    STU.shot = (pos, at, fov = 28, w = W, h = H) => { rr.setSize(w, h); cam.aspect = w / h; cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(...pos); cam.lookAt(...at); cam.updateMatrixWorld();
      if (typeof toonProSync === 'function') toonProSync(rr); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
  }, [W, H]);
}
async function sheet(p, cells, file, { cols, cw, ch, title = '', sub = '' }) {
  const d = await p.evaluate(async ([cells, cols, cw, ch, title, sub, W, H]) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, H);
    const top = title ? 52 : 0; const ox = (W - cols * cw) / 2;
    for (let i = 0; i < cells.length; i++) { const c = cells[i], x = ox + (i % cols) * cw, y = top + Math.floor(i / cols) * ch; const im = new Image(); await new Promise(r => { im.onload = r; im.src = c.img; });
      g.drawImage(im, x, y, cw, ch); if (c.label) { g.font = '600 18px system-ui,sans-serif'; const tw = g.measureText(c.label).width; g.fillStyle = 'rgba(20,28,44,.62)'; g.beginPath(); g.roundRect ? g.roundRect(x + 10, y + 10, tw + 20, 30, 10) : g.rect(x + 10, y + 10, tw + 20, 30); g.fill(); g.fillStyle = '#fff'; g.fillText(c.label, x + 20, y + 31); }
      if (i % cols) { g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x - 1, y, 2, ch); } }
    if (title) { g.fillStyle = '#1f2a40'; g.font = '700 24px system-ui,sans-serif'; g.fillText(title, 20, 34); const tw0 = g.measureText(title).width; if (sub) { g.fillStyle = '#5a6478'; g.font = '15px system-ui,sans-serif'; g.fillText(sub, 20 + tw0 + 18, 34); } }
    return cv.toDataURL('image/png'); }, [cells, cols, cw, ch, title, sub, W, H]);
  await toWebp(p, d, file);
}
const P = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } });
await newGame(P, { team: [[1, 12]], view: 'third' });
const ld = await P.evaluate(async (ids) => { const out = {}; for (const k of ids) { const g = await pilotLoad(k); out[k] = g ? PILOT['ms_' + k] : 'FEHLT'; } return out; }, ['noa', 'fig_noa', ...NPCS_]);
console.log('Laden', JSON.stringify(ld)); res.laden = ld;
await studio(P);
if (has('dev')) {   // schneller Arbeitsbogen: Noa vorn/schräg/Gesicht + Idle-Pose
  const d = await P.evaluate((id) => { const out = []; STU.clear(); const o = STU.fig(id); STU.add(o, 0, 0, 0); STU.tick(o, 1.3); const h = o.userData.char.H;
    out.push({ img: STU.shot([0, h * .6, h * 3.1], [0, h * .52, 0], 26, 400, 900), label: 'vorn' }); out.push({ img: STU.shot([h * 2.0, h * .7, h * 2.4], [0, h * .52, 0], 26, 400, 900), label: 'schräg' });
    out.push({ img: STU.shot([h * 3.1, h * .6, 0], [0, h * .52, 0], 26, 400, 900), label: 'seite' }); out.push({ img: STU.shot([.1 * h, h * .93, h * .5], [0, h * .9, 0], 26, 400, 900), label: 'Gesicht' }); return out; }, process.argv[3] || 'fig_noa');
  await sheet(P, d, 'dev.webp', { cols: 4, cw: 400, ch: 900 });
}
if (has('noa')) {
  const pair = async (view) => P.evaluate(([view, FIGC]) => { const imgs = []; for (const k of ['pilot', 'neu']) { STU.clear(); const o = k === 'pilot' ? pilotMake('noa', 1.32) : STU.fig('fig_noa'); STU.add(o, 0, 0, 0); STU.tick(o, 1.3);
    const V = { vorn: [[0, .8, 4.3], [0, .68, 0], 26], schraeg: [[2.5, 1.0, 3.5], [0, .68, 0], 26], gesicht: [[.16, 1.2, .78], [0, 1.16, 0], 26] }[view]; imgs.push(STU.shot(V[0], V[1], V[2], 800, 900)); } return imgs; }, [view, FIG_CODE('held')]);
  for (const v of ['vorn', 'schraeg', 'gesicht']) { const [a, b] = await pair(v); await sheet(P, [{ img: a, label: 'Pilot (12.11. nachmittags)' }, { img: b, label: 'Runde 2 (Figurenbaukasten)' }], `noa_pilot_runde2_${v}.webp`, { cols: 2, cw: 800, ch: 900 }); }
  const ex = await P.evaluate(() => { STU.clear(); const o = STU.fig('fig_noa'); STU.add(o, 0, 0, 0); const out = [];
    for (const [n, e] of [['neutral', 'neutral'], ['Lächeln', 'laecheln'], ['Freude', 'freudig'], ['Staunen', 'staunen'], ['Blinzeln', 'blinzeln'], ['Ärger', 'aerger'], ['traurig', 'traurig'], ['Sprechen A', 'sprA']]) {
      if (e === 'sprA') { PILOT_EXPR.sprA = { Mund_A: .9 }; } pilotExpr(o, e); o.userData.blink.next = 1e12; o.userData.eye.next = 1e12; o.userData.eye.tx = o.userData.eye.ty = 0; STU.tick(o, .8); out.push({ img: STU.shot([.08, 1.18, .58], [0, 1.155, 0], 24, 400, 424), label: n }); } return out; });
  await sheet(P, ex, 'noa_ausdruecke.webp', { cols: 4, cw: 400, ch: 424, title: 'Noa – Ausdrücke (Shape Keys, Laufzeit-Mischung)', sub: 'Augen/Lider, Brauen, Mund als eigene Netze' });
  const gait = await P.evaluate(() => { const out = []; for (const [clip, lab] of [['walk', 'Gehen'], ['jog', 'Laufen 2,8 Felder/s'], ['run', 'Rennen 5 Felder/s']]) { STU.clear(); const o = STU.fig('fig_noa'); STU.add(o, 0, 0, Math.PI / 2); const U = o.userData;
      for (const n in U.acts) U.acts[n].setEffectiveWeight(n === clip ? 1 : 0); const d = U.acts[clip].getClip().duration;
      for (let i = 0; i < 8; i++) { U.acts[clip].setEffectiveTimeScale(0); U.acts[clip].time = d * i / 8; U.mixer.update(0); o.updateMatrixWorld(true); out.push({ img: STU.shot([0, .72, 4.0], [0, .64, 0], 22, 200, 282), label: i ? '' : lab }); } } return out; });
  await sheet(P, gait, 'noa_gang_reihe.webp', { cols: 8, cw: 200, ch: 282, title: 'Noa – Gehen, Laufen, Rennen (je 8 Bilder eines Doppelschritts)', sub: 'Füße gepflanzt (IK), Arme gegengleich, Körperneigung je Tempo' });
  const ges = await P.evaluate(() => { const out = []; for (const [clip, lab] of [['winken', 'Winken'], ['jubeln', 'Jubeln'], ['werfen', 'Werfen']]) { STU.clear(); const o = STU.fig('fig_noa'); STU.add(o, 0, 0, -.35); const U = o.userData; STU.tick(o, .3);
      const a = U.acts[clip], d = a.getClip().duration; for (const n in U.acts) U.acts[n].setEffectiveWeight(0); a.reset(); a.play(); a.setEffectiveWeight(1);
      for (const f of [.3, .5, .7]) { a.time = d * f; a.setEffectiveTimeScale(0); U.mixer.update(0); pilotExpr(o, clip === 'werfen' ? 'entschlossen' : 'freudig'); for (let i = 0; i < 30; i++) pilotFace(U, 1 / 60); o.updateMatrixWorld(true); out.push({ img: STU.shot([.4, .9, 3.3], [0, .75, 0], 26, 300, 424), label: f === .3 ? lab : '' }); } } return out; });
  await sheet(P, ges.slice(0, 9).concat([]), 'noa_gesten.webp', { cols: 5, cw: 320, ch: 424, title: 'Noa – Gesten (Einmal-Clips)', sub: 'winken · jubeln · werfen (Fangkapsel)' });
}
if (has('npc')) {
  const line = await P.evaluate((ids) => { STU.clear(); const n = ids.length; const out = []; ids.forEach((id, i) => { const o = STU.fig(id); const x = (i - (n - 1) / 2) * .62; STU.add(o, x, -Math.abs(i - (n - 1) / 2) * .06, -x * .12); STU.tick(o, .7 + i * .37); });
    STU.sun.shadow.camera.updateProjectionMatrix(); return STU.shot([0, 1.25, 8.2], [0, .82, 0], 28, 1600, 900); }, ['fig_noa', ...NPCS_]);
  await sheet(P, [{ img: line, label: 'Runde 2: Noa + alle neuen NPCs (Figurenbaukasten, gleiche Kamera)' }], (has('r2') ? 'r3_aufstellung.webp' : 'npc_aufstellung.webp'), { cols: 1, cw: 1600, ch: 900 });
  const labs = await P.evaluate((ids) => ids.map(id => id), ['fig_noa', ...NPCS_]);
  // Nahbögen: je Figur Ganzkörper + Gesicht
  const close = await P.evaluate((ids) => { const out = []; for (const id of ids) { STU.clear(); const o = STU.fig(id); STU.add(o, 0, 0, -.3); STU.tick(o, 1.1); const h = o.userData.char.H;
      out.push({ img: STU.shot([h * .55, h * .6, h * 2.9], [0, h * .5, 0], 26, 320, 450), id }); out.push({ img: STU.shot([h * .08, h * .92, h * .55], [0, h * .895, 0], 24, 320, 450), id: '' }); } return out; }, NPCS_.slice(0, 5));
  await sheet(P, close.map(c => ({ img: c.img, label: c.id ? ({ fig_veyran: 'Prof. Veyran', fig_rayan: 'Rayan', fig_mama: 'Mama', fig_mirael: 'Mirael', fig_haendler: 'Ladenbesitzer' })[c.id] : '' })), 'npc_nah_1.webp', { cols: 5, cw: 320, ch: 450 });
  const close2 = await P.evaluate((ids) => { const out = []; for (const id of ids) { STU.clear(); const o = STU.fig(id); STU.add(o, 0, 0, -.3); STU.tick(o, 1.1); const h = o.userData.char.H;
      out.push({ img: STU.shot([h * .55, h * .6, h * 2.9], [0, h * .5, 0], 26, 400, 450), id }); out.push({ img: STU.shot([h * .08, h * .92, h * .55], [0, h * .895, 0], 24, 400, 450), id: '' }); } return out; }, NPCS_.slice(5));
  await sheet(P, close2.map(c => ({ img: c.img, label: c.id ? ({ fig_buerger_a: 'Bewohnerin', fig_buerger_b: 'Bewohnerin (älter)', fig_buerger_c: 'Bewohner', fig_buerger_d: 'Jugendlicher' })[c.id] : '' })), 'npc_nah_2.webp', { cols: 4, cw: 400, ch: 450 });
  // alt vs. neu: Prof. Veyran, Mama, Bewohner (Farbe → Variante)
  const an = await P.evaluate(() => { const out = []; const old = { fig_veyran: "(()=>{const L=FIGURES['veyran'].look,oe=figOutfit3d(L);return person3d(oe.top,oe.capCol,oe);})()", fig_mama: "(()=>{const L=FIGURES['mama'].look,oe=figOutfit3d(L);return person3d(oe.top,oe.capCol,oe);})()", fig_haendler: "person3d('#6aa0e0',shade('#6aa0e0',.62))" };
    for (const id of ['fig_veyran', 'fig_mama', 'fig_haendler']) for (const k of ['alt', 'neu']) { STU.clear(); const o = k === 'alt' ? STU.old(old[id]) : STU.fig(id); STU.add(o, 0, 0, -.35); STU.tick(o, 1.0);
      out.push({ img: STU.shot([.8, 1.0, 4.6], [0, .8, 0], 24, 266, 450), label: k === 'alt' ? 'bisher' : 'neu' }); }
    for (const id of ['fig_veyran', 'fig_mama', 'fig_haendler']) for (const k of ['alt', 'neu']) { STU.clear(); const o = k === 'alt' ? STU.old(old[id]) : STU.fig(id); STU.add(o, 0, 0, -.3); STU.tick(o, 1.0); const h = (o.userData.char && o.userData.char.H) || 1.6;
      out.push({ img: STU.shot([h * .09, h * .92, h * .6], [0, h * .895, 0], 24, 266, 450), label: '' }); } return out; });
  await sheet(P, an, 'npc_alt_neu.webp', { cols: 6, cw: 266, ch: 450, title: 'NPCs bisher vs. neu', sub: 'Prof. Veyran · Mama · Ladenbesitzer (Laden-NPC t:shop)' });
}
await P.evaluate(() => { try { STU.rr.domElement.remove(); STU.rr.dispose(); terrainY = window.__ty; mode = 'world'; } catch (e) { } });
res.fehlerStudio = P.errs; await P.ctx.close();
if (has('welt')) {
  const p = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } }); await newGame(p, { team: [[1, 12]], view: 'third' });
  await p.evaluate(async (ids) => { for (const k of ids) await pilotLoad(k); R3.ofk = null; }, ['fig_noa', ...NPCS_]);
  const pos = await p.evaluate(() => { mode = 'world'; loadMap('morgenau', 5, 5); const M = cur; const ok = (x, y) => x > 1 && y > 1 && x < M.w - 2 && y < M.h - 2 && !blocked(x, y); let best = null, bs = -1;
    for (let y = 7; y < M.h - 3; y++)for (let x = 4; x < M.w - 4; x++) { let n = 0; for (let dy = -6; dy <= 1; dy++)for (let dx = -3; dx <= 3; dx++)if (ok(x + dx, y + dy)) n++; if (n > bs) { bs = n; best = [x, y]; } } return best; });
  await p.evaluate(([x, y]) => { const id = cur.id || 'morgenau'; NPCS[id] = NPCS[id] || []; NPCS[id].push({ x: x - 1, y: y - 3, c: '#e8e8e8', t: 'talk', fig: 'veyran', d: 'down', txt: ['Hallo!'] }, { x: x + 1, y: y - 3, c: '#c8463a', t: 'talk', fig: 'rayan', d: 'down', txt: ['Na?'] },
    { x: x - 2, y: y - 4, c: '#c9a77c', t: 'talk', fig: 'mama', d: 'down', txt: ['Hallo!'] }, { x: x + 2, y: y - 4, c: '#7a9a5a', t: 'talk', d: 'down', txt: ['Hallo!'] }, { x: x, y: y - 5, c: '#6aa0e0', t: 'talk', d: 'down', txt: ['Hallo!'] });
    VILL.list = []; G.time = 10.5 * 60; mode = 'world'; loadMap('route1', 9, 12); R3.mapId = null; loadMap(id, x, y); P.dir = 'up'; P.ang = 0; setView('third', true); }, pos);
  p.setDefaultTimeout(180000); await p.waitForTimeout(6000); await p.evaluate(() => { document.querySelectorAll('.toast,#toast').forEach(e => e.remove()); });
  const b = await p.screenshot({ timeout: 180000 }); await toWebp(p, 'data:image/png;base64,' + b.toString('base64'), (has('r2') ? 'r3_morgenau.webp' : 'welt_morgenau.webp'));
  const r = await p.evaluate(() => { const S = R3.scene, r = R3.r; r.info.autoReset = false; r.info.reset(); r.render(S, R3.activeCam || R3.cam); const info = { calls: r.info.render.calls, tris: r.info.render.triangles }; r.info.autoReset = true;
    let fig = 0; S.traverse(o => { if (o.userData && o.userData.pilot) fig++; }); info.modelle = fig; info.held = !!R3.player.userData.pilot;
    const a = R3.player.getWorldPosition(new THREE.Vector3()); const cam = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, .05, 300); cam.position.set(a.x + 1.4, a.y + 1.5, a.z + 1.2); cam.lookAt(a.x, a.y + .8, a.z - 2.4); cam.updateMatrixWorld();
    if (typeof toonProSync === 'function') toonProSync(r); r.render(S, cam); return { info, img: r.domElement.toDataURL('image/png') }; });
  await toWebp(p, r.img, (has('r2') ? 'r3_morgenau_nah.webp' : 'welt_morgenau_nah.webp')); res.welt = r.info; res.fehlerWelt = p.errs; console.log('Welt', JSON.stringify(r.info));
  await p.ctx.close();
}
writeFileSync(OUT + 'vorschau_' + what.replace(/,/g, '_') + '.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res));
await env.close();
