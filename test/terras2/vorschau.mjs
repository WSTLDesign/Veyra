// Terra-Serie – Vorschaubilder 1600×900 (WebP) + Messung. NUR unter der Chromium-Sperre:
//   LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/terras2/vorschau.mjs [funki|linie|welt|kampf|anim|nah|alle]
import { start, page, newGame } from '../qa_lc_lib.mjs';
import { writeFileSync } from 'fs';
const OUT = new URL('./', import.meta.url).pathname, W = 1600, H = 900, what = process.argv[2] || 'alle', has = k => what === 'alle' || what.split(',').includes(k);
const LINIEN = { glut: [1, 2, 3], flut: [4, 5, 6], flora: [7, 8, 9] };
const ARTEN = (process.env.ARTEN || '1,2,3,4,5,6,7,8,9,59,61').split(',').map(Number);
// Intro robust wegklicken (langsamer Start bei ausgelasteter CPU)
async function boot(p) { for (let i = 0; i < 60; i++) { for (const sel of ['#iPrompt', '#iSkip']) await p.click(sel, { timeout: 800 }).catch(() => { });
  const gone = await p.evaluate(() => { const s = document.querySelector('#intro'); if (!s || s.hidden) return true; const c = getComputedStyle(s); return c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0; });
  if (gone) return; await p.waitForTimeout(1000); } }
const env = await start(); const res = {};
const toWebp = async (p, src, file, q = .92) => { const d = await p.evaluate(async ([s, q]) => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s; }); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q); }, [src, q]);
  writeFileSync(OUT + file, Buffer.from(d.split(',')[1], 'base64')); console.log('→ test/terras2/' + file); };
async function studio(p) {
  await p.evaluate(([W, H]) => {
    mode = 'wait'; if (typeof VILL !== 'undefined') VILL.list = []; window.__ty = terrainY; terrainY = () => 0;
    const rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(W, H); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.02;
    rr.shadowMap.enabled = true; rr.shadowMap.type = THREE.PCFSoftShadowMap; Object.assign(rr.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(rr.domElement);
    const S = new THREE.Scene(); const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#b9d8f2'); gr.addColorStop(.62, '#e9f1f6'); gr.addColorStop(1, '#f4ead8'); x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
    S.background = new THREE.CanvasTexture(c);
    const hemi = new THREE.HemisphereLight('#eef6ff', '#d9c6a6', .78); S.add(hemi);
    const sun = new THREE.DirectionalLight('#fff0d8', .92); sun.position.set(2.2, 5, 3.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.radius = 4; Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); S.add(sun, sun.target);
    const rim = new THREE.DirectionalLight('#dff0ff', .4); rim.position.set(-3, 3, -4); S.add(rim);
    const g = document.createElement('canvas'); g.width = g.height = 256; const y = g.getContext('2d'); const rg = y.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, '#e8e2d2'); rg.addColorStop(1, '#d3dcc4'); y.fillStyle = rg; y.fillRect(0, 0, 256, 256);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(g) })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
    const cam = new THREE.PerspectiveCamera(28, W / H, .02, 80);
    window.STU = { rr, S, sun, hemi, cam, ground, objs: [] };
    STU.clear = () => { STU.objs.forEach(o => S.remove(o)); STU.objs = []; };
    STU.add = (o, x = 0, z = 0, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry + Math.PI; o.traverse(q => { if (q.isMesh && !q.userData.outline) q.castShadow = true; }); S.add(o); STU.objs.push(o); o.updateMatrixWorld(true); return o; };
    STU.off = (fn) => { const s = SET.modelle3d; SET.modelle3d = false; try { return fn(); } finally { SET.modelle3d = s; } };
    STU.terra = (id, h) => { const o = tmMake(id, h, {}); return o; };
    STU.tick = (o, sec, st) => { const n = Math.max(1, Math.round(sec * 60)); let t = performance.now(); for (let i = 0; i < n; i++) { t += 1000 / 60; if (o.userData.tm) tmAnim(o, t, st || { moving: false }); else if (o.userData.pilot) pilotTick(o, 1 / 60, {}); } o.updateMatrixWorld(true); };
    STU.clip = (o, n, f) => { const U = o.userData; for (const k in U.acts) U.acts[k].setEffectiveWeight(0); const a = U.acts[n]; a.reset(); a.setEffectiveWeight(1); a.play(); a.time = a.getClip().duration * f; U.mixer.update(0); o.updateMatrixWorld(true); };
    STU.expr = (o, e) => { const U = o.userData; U.fe = e; U.blink.next = 1e15; for (let i = 0; i < 40; i++) tmFace(U, 1 / 60); };
    STU.shot = (pos, at, fov = 28, w = W, h = H) => { rr.setSize(w, h); cam.aspect = w / h; cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(...pos); cam.lookAt(...at); cam.updateMatrixWorld();
      if (typeof toonProSync === 'function') toonProSync(rr); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
  }, [W, H]);
}
async function sheet(p, cells, file, { cols, cw, ch, title = '', sub = '' }) {
  const d = await p.evaluate(async ([cells, cols, cw, ch, title, sub, W, H]) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#eef1f4'; g.fillRect(0, 0, W, H);
    const top = title ? 52 : 0; const ox = (W - cols * cw) / 2;
    for (let i = 0; i < cells.length; i++) { const c = cells[i], x = ox + (i % cols) * cw, y = top + Math.floor(i / cols) * ch; const im = new Image(); await new Promise(r => { im.onload = r; im.src = c.img; });
      g.drawImage(im, x, y, cw, ch); if (c.label) { g.font = '600 19px system-ui,sans-serif'; const tw = g.measureText(c.label).width; g.fillStyle = 'rgba(20,28,44,.62)'; g.beginPath(); g.roundRect(x + 12, y + 12, tw + 22, 32, 10); g.fill(); g.fillStyle = '#fff'; g.fillText(c.label, x + 23, y + 34); }
      if (i % cols) { g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x - 1, y, 2, ch); } }
    if (title) { g.fillStyle = '#1f2a40'; g.font = '700 24px system-ui,sans-serif'; g.fillText(title, 20, 34); const tw0 = g.measureText(title).width; if (sub) { g.fillStyle = '#5a6478'; g.font = '15px system-ui,sans-serif'; g.fillText(sub, 20 + tw0 + 18, 34); } }
    return cv.toDataURL('image/png'); }, [cells, cols, cw, ch, title, sub, W, H]);
  await toWebp(p, d, file);
}
const P = await page(env, { w: W, h: H, set: { quality: 'eigene', modelle3d: true } });
await boot(P);
await newGame(P, { team: [[1, 12]], view: 'third' });
const ld = await P.evaluate(async (ids) => { const out = {}; for (const i of ids) { const g = await tmLoad(i); out[i] = g ? TMOD.ms[TMOD.ids[i]] : 'FEHLT'; } if (typeof pilotLoad === 'function') { PILOT.wait.funki = null; PILOT.st.funki = null; await pilotLoad('funki'); } return out; }, ARTEN);
console.log('Laden ms', JSON.stringify(ld)); res.laden = ld;
await studio(P);
if (has('funki')) {
  const pf = await P.evaluate(() => { const imgs = []; for (const k of ['pilot', 'neu']) { STU.clear(); const o = k === 'pilot' ? pilotMake('funki', .55) : STU.terra(1, .55); STU.add(o, 0, 0, 0); STU.tick(o, 1.1);
      imgs.push(STU.shot([1.15, .55, 1.55], [0, .27, 0], 26, 800, 900)); } return imgs; });
  await sheet(P, [{ img: pf[0], label: 'Pilot (Runde 1)' }, { img: pf[1], label: 'Runde 2 (Terra-Baukasten)' }], 'funki_pilot_vs_runde2.webp', { cols: 2, cw: 800, ch: 900 });
}
if (has('funki') || has('gesicht')) {
  const ex = await P.evaluate(() => { STU.clear(); const o = STU.terra(1, .55); STU.add(o, 0, 0, -.35); STU.tick(o, .3); const out = [];
    for (const [n, e] of [['neutral', 'neutral'], ['freudig', 'freudig'], ['wütend', 'wuetend'], ['staunen', 'staunen']]) { STU.clip(o, 'idle', .02); STU.expr(o, e); out.push({ img: STU.shot([.42, .42, .78], [0, .36, 0], 24, 800, 424), label: n }); } return out; });
  await sheet(P, ex, 'funki_mimik.webp', { cols: 2, cw: 800, ch: 424, title: 'Funki Runde 2 – Mimik (Shape Keys)', sub: 'neutral · freudig · wütend · staunen' });
}
if (has('linie')) {
  const H0 = { 1: .6, 2: .85, 3: 1.15, 4: .55, 5: .75, 6: 1.0, 7: .68, 8: .92, 9: 1.15 };
  for (const [nm, ids] of Object.entries(LINIEN)) {
    if (!ids.every(i => ld[i] !== 'FEHLT')) continue;
    const img = await P.evaluate(([ids, H0]) => { STU.clear(); let x = -1.45; const os = ids.map((i, k) => { const o = STU.terra(i, H0[i]); STU.add(o, x + k * 1.45, 0, -.55); STU.tick(o, .9 + k * .3); return o; });
      return STU.shot([1.9, 1.05, 4.1], [.25, .45, 0], 36); }, [ids, H0]);
    await sheet(P, [{ img, label: 'Starter-Linie ' + nm + ': ' + ids.map(i => String(i).padStart(3, '0')).join(' → ') }], 'linie_' + nm + '.webp', { cols: 1, cw: 1600, ch: 900 });
  }
}
if (has('anim')) {
  const cells = await P.evaluate(() => { const out = []; STU.clear(); const o = STU.terra(1, .55); STU.add(o, 0, 0, -.6);
    for (const [n, fs, e] of [['idle', [.1, .45, .8], 'neutral'], ['attack', [.25, .5, .7], 'wuetend'], ['joy', [.15, .35, .55], 'freudig']]) for (const f of fs) { STU.clip(o, n, f); STU.expr(o, e); out.push({ img: STU.shot([1.3, .5, 1.6], [0, .3, 0], 26, 533, 282), label: f === fs[0] ? n : '' }); }
    return out; });
  await sheet(P, cells, 'anim_funki_idle_attack_joy.webp', { cols: 3, cw: 533, ch: 282, title: 'Funki – idle · attack · joy (je 3 Bilder)', sub: 'Clips aus dem Baukasten, Mimik per Shape Keys' });
}
if (has('nah')) {
  const n = await P.evaluate(() => { STU.clear(); const out = []; const o = STU.terra(1, .55); STU.add(o, 0, 0, -.35); STU.tick(o, .3); STU.clip(o, 'idle', .02); out.push(STU.shot([.5, .36, .62], [0, .3, -.05], 30, 800, 900));
    STU.clear(); const ids = [4, 6, 3].filter(i => tmReady(i)); const q = STU.terra(6, .8); STU.add(q, 0, 0, -.35); STU.tick(q, .3); STU.clip(q, 'idle', .02); out.push(STU.shot([.55, .62, 1.05], [0, .5, -.1], 30, 800, 900)); return out; });
  await sheet(P, [{ img: n[0], label: 'Fell (Funki): Striche, Büschel, Normalkarte' }, { img: n[1], label: 'Haut + Kristallkrone (Aquilo) nah' }], 'nah_fell_schuppen.webp', { cols: 2, cw: 800, ch: 900 });
}
await P.evaluate(() => { try { STU.rr.domElement.remove(); STU.rr.dispose(); terrainY = window.__ty; mode = 'world'; } catch (e) { } });
res.fehlerStudio = P.errs;
// Welt: wild im Gras (Route 1), Spielkamera; Kampf: echter 3D-Kampf mit Modell
if (has('welt') || has('kampf')) {
  for (const [nm, ids] of Object.entries(LINIEN)) {
    const id = ids[0];
    if (has('welt')) {
      const img = await P.evaluate(async (id) => { mode = 'world'; loadMap('route1', 9, 15); setView('third', true); VILL && (VILL.list = []); G.time = 11 * 60; P.dir = 'up'; P.ang = 0;
        ROAM.list = []; ROAM.want = 0; await tmLoad(id); const r = ({s:id,l:5,x:9,y:12,px:9,py:12,fx:9,fy:12,t:1,dir:'down',next:performance.now()+99999,st:'idle',stT:0,nat:monNature(id),owl:nightOwl(id),shiny:false,o:{shiny:false},g:null}); ROAM.list.push(r);
        
        await new Promise(res => setTimeout(res, 2500)); const S = R3.scene, mm = S.userData.mm, o = mm && mm.get(r); const rr = R3.r;
        const a = o ? o.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(9.5, 0, 12.5); const ry = o ? o.rotation.y : 0, fx = -Math.sin(ry), fz = -Math.cos(ry), h = o ? o.userData.baseH || .6 : .6; const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .05, 300); cam.position.set(a.x + fx * h * 3.2 - fz * h * 1.6, a.y + h * 1.1, a.z + fz * h * 3.2 + fx * h * 1.6); cam.lookAt(a.x, a.y + h * .45, a.z); cam.updateMatrixWorld();
        if (typeof toonProSync === 'function') toonProSync(rr); rr.render(S, cam); return { img: rr.domElement.toDataURL('image/png'), tm: !!(o && o.userData.tm) }; }, id);
      console.log('Welt', nm, img.tm); await toWebp(P, img.img, 'welt_' + nm + '.webp');
    }
    if (has('kampf')) {
      const ok = await P.evaluate(async (id) => { const foe = { 1: 4, 4: 7, 7: 1 }[id]; G.team = [mk(id, 12)]; await tmLoad(id); await tmLoad(foe); G.time = 11 * 60; loadMap('route1', 9, 12); SET.btl = 'runde'; startBattle({ wild: mk(foe, 6) }); return true; }, id);
      await P.waitForFunction(() => typeof BT !== 'undefined' && BT && BT.foe && BT.me, null, { timeout: 15000 }).catch(() => { }); await P.waitForTimeout(2500);
      await P.evaluate(() => { if (B) { B.lunge = { who: 'me', t: performance.now() - 300 }; BT.me && (BT.me.userData.act.atk = performance.now() - 200); } });
      await P.waitForTimeout(400);
      const info = await P.evaluate(() => ({ me: !!(BT && BT.me && BT.me.userData.tm), foe: !!(BT && BT.foe && BT.foe.userData.tm), sprite: !!(BT && BT.foe && BT.foe.userData.sprite) }));
      console.log('Kampf', nm, JSON.stringify(info)); res['kampf_' + nm] = info;
      const shot = 'data:image/png;base64,' + (await P.screenshot()).toString('base64'); await toWebp(P, shot, 'kampf_' + nm + '.webp');
      await P.evaluate(() => { try { if (B) endBattle('run'); } catch (e) { } mode = 'world'; });
      await P.waitForTimeout(800);
    }
  }
}
res.fehler = P.errs;
writeFileSync(OUT + 'vorschau_' + what.replace(/,/g, '_') + '.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res));
await env.close();
