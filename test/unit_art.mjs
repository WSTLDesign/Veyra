// Unit-Tests Loop A2 (Sprites & Modelle): node test/unit_art.mjs – nach `node build.mjs`
// Prüft: Bilddateien (Kanon-Nummern, kein 404), hasArt nur für Arten, ART_FACE vollständig, gerahmte Key-Art, Freistellung,
// MON_RENDER-Fallback model → sprite → proc, Sprite-Ebene (1 InstancedMesh), getModelOverride mit Test-GLB (test/fixtures/cube.glb), Draw-Calls Welt, Starterwahl, SEQ.hatch
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { serve } from './art_serve.mjs';
let ok = 0, bad = 0; const fails = [];
const t = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; fails.push(name); console.log('✗', name, '–', e.message); } };
const list = (a, m) => { if (a.length) throw new Error((m || '') + a.slice(0, 12).join(' | ') + (a.length > 12 ? ' … (' + a.length + ')' : '')); };
const artDir = new URL('../public/art/', import.meta.url), files = readdirSync(artDir).filter(f => /\.(webp|png)$/.test(f));
const monFiles = files.filter(f => /^\d/.test(f)), ids = monFiles.map(f => +f.split('_')[0]);
// ---------- ohne Browser ----------
await t('Bilddateien der Arten: 3-stellige Kanon-Nummer, 001–153, keine Dopplung', () => { list(monFiles.filter(f => !/^\d{3}_[a-z0-9]+\.webp$/.test(f)), 'Name: '); list(ids.filter(i => i < 1 || i > 153), 'Bereich: '); list(ids.filter((v, i) => ids.indexOf(v) !== i), 'doppelt: '); });
await t('Build: ART_SRC-Pfade existieren in dist/art (kein Bild-404), Nicht-Arten-Keys bleiben Orte', () => {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'), m = html.match(/window\.ART_SRC=(\{[^<]*?\});/); if (!m) throw new Error('ART_SRC fehlt');
  const S = JSON.parse(m[1]); list(Object.values(S).filter(p => !existsSync(new URL('../dist/' + p, import.meta.url))), '404: '); if (Object.keys(S).length !== files.length) throw new Error(Object.keys(S).length + ' ≠ ' + files.length);
  list(Object.keys(S).filter(k => !/^\d+$/.test(k) && !/^(map|region|stadt|ort|sky|horizon|bg_battle|place|chapter)_/.test(k) && !/_face_[a-z]+$/.test(k)), 'unbekannter Key: '); });
await t('Build: Loader lokal in dist/vendor (three r128 examples/js) + MODEL_SRC/VENDOR_JS gesetzt', () => {
  for (const f of ['loaders/GLTFLoader.js', 'loaders/DRACOLoader.js', 'utils/SkeletonUtils.js', 'libs/draco/gltf/draco_decoder.wasm', 'libs/draco/gltf/draco_wasm_wrapper.js']) if (!existsSync(new URL('../dist/vendor/' + f, import.meta.url))) throw new Error('fehlt ' + f);
  const h = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'), a = readFileSync(new URL('../dist/artifact.html', import.meta.url), 'utf8');
  if (!/window\.MODEL_SRC=\{.*?\};window\.VENDOR_JS=\["vendor\/"\]/.test(h)) throw new Error('App: MODEL_SRC/VENDOR_JS'); if (!/VENDOR_JS=\["https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/examples\/js\/"/.test(a)) throw new Error('Artifact: CDN-Pfad'); });
await t('Quelltext: keine alten Bild-Schlüssel (Umschlüsselung in 37 entfernt)', () => { const s = readFileSync(new URL('../src/37-species-data.js', import.meta.url), 'utf8'); if (/function kanonArtKeys|rekey\(ART_DESIGN\)/.test(s)) throw new Error('Shim noch aktiv'); });
// ---------- im Browser ----------
const S = await serve(), browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 860, height: 400 } }), errs = [], nf = [];
page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('response', r => { if (r.status() >= 400) nf.push(r.status() + ' ' + r.url()); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(S.url + 'index.html', { waitUntil: 'load' });
const ev = (f, a) => page.evaluate(f, a);
await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
await ev(async () => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } await preloadArt(); G.flags.starter = 1; });
await t('hasArt: alle Bild-Arten ja, Orte/Regionen und bildlose Arten nein', async () => { const r = await ev(ids => ({ miss: ids.filter(i => !hasArt(i)), extra: ['ort_daemmerbruch', 'map_veyra', 'region_glutlande', 'stadt_eiswacht', 2, 3, 99, 139, 0, -1, 154].filter(k => hasArt(k)) }), ids); list(r.miss, 'fehlt: '); list(r.extra, 'falsch: '); });
await t('Alle Kreaturenbilder laden (naturalWidth > 0), kein 404 im Netz', async () => { const r = await ev(ids => ids.filter(i => !artReady(i)), ids); list(r, 'nicht geladen: '); list(nf, ''); });
await t('ART_FACE vollständig (−1/0/1) für alle Bild-Arten', async () => { const r = await ev(ids => ids.filter(i => ![-1, 0, 1].includes(ART_FACE[i])), ids); list(r, 'ohne Blickrichtung: '); });
await t('Glanzform: Farbton-Drehung je Bild-Art ≠ 0', async () => list(await ev(ids => ids.filter(i => !artHue(i)), ids)));
await t('Key-Art gerahmt = Legenden/Mythische (deckendes Bild), sonst freigestellt', async () => { const r = await ev(ids => ids.filter(i => artFramed(i) !== !!(MONS[i].legend || MONS[i].myth)), ids); list(r); });
await t('Freistellung: Boden-Platte entfernt, Ausschnitt kleiner als das Bild, gerahmte → false', async () => { const r = await ev(() => { const c = artCut(13), im = ART_IMG[13]; const x = c.getContext('2d').getImageData(0, c.height - 3, c.width, 3).data; let light = 0; for (let i = 0; i < x.length; i += 4) if (x[i + 3] > 200 && Math.min(x[i], x[i + 1], x[i + 2]) > 200) light++; return { h: c.height, H: im.naturalHeight, light, leg: artCut(140) }; }); if (!(r.h < r.H) || r.light > 40 || r.leg !== false) throw new Error(JSON.stringify(r)); });
await t('dexNr 3-stellig', async () => { const r = await ev(() => [dexNr(1), dexNr(42), dexNr(140)].join()); if (r !== '#001,#042,#140') throw new Error(r); });
await t('MON_RENDER-Fallback: sprite → Bild-Art sprite, bildlos/Legende proc; proc → proc; model ohne GLB → sprite', async () => {
  const r = await ev(() => { const o = {}; window.MON_RENDER = 'sprite'; o.s = [monRender(13), monRender(2), monRender(140), monRender(61)].join(); window.MON_RENDER = 'proc'; o.p = [monRender(13), monRender(2)].join(); window.MON_RENDER = 'model'; o.m = [monRender(13), monRender(2)].join(); window.MON_RENDER = 'sprite'; return o; });
  if (r.s !== 'sprite,proc,proc,sprite' || r.p !== 'proc,proc' || r.m !== 'sprite,proc') throw new Error(JSON.stringify(r)); });
await t('monObj: Sprite-Gruppe bzw. prozedural; alle Sprites einer Szene in EINEM InstancedMesh', async () => {
  const r = await ev(() => { const s = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 2, .1, 50); cam.position.set(0, 2, 6); cam.lookAt(0, .5, 0); cam.updateMatrixWorld();
    const L = [13, 25, 28, 46, 72, 90, 84].map((id, i) => { const o = monObj(id, 1, { shiny: i === 2 }, s); o.position.set(i - 3, 0, 0); s.add(o); return o; }), p = monObj(2, 1, {}, s);
    const t0 = performance.now(); for (let k = 0; k < 3; k++) { L.forEach(o => animMon(o, t0 + 500 + k * 16, { cam, pxw: .01 })); sprTick(s, cam, t0 + 500 + k * 16); }
    const lay = s.userData.spr, inst = []; s.traverse(o => { if (o.isInstancedMesh) inst.push(o); });
    return { spr: L.every(o => o.userData.sprite), proc: !!p.userData.body, n: lay.n, cnt: lay.mesh.count, inst: inst.length, spark: !!(lay.spark && lay.spark.visible), fk: L.map(o => o.userData.vis.fk) }; });
  if (!r.spr || !r.proc || r.n !== 7 || r.cnt !== 7 || r.inst !== 1 || !r.spark) throw new Error(JSON.stringify(r)); });
await t('Sprite-Blickrichtung: spiegelt zum Ziel (ART_FACE), frontal nie', async () => {
  const r = await ev(() => { const s = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 2, .1, 50); cam.position.set(0, 2, 6); cam.lookAt(0, .5, 0); cam.updateMatrixWorld();
    const a = monObj(13, 1, {}, s), f = monObj(7, 1, {}, s); [a, f].forEach(o => s.add(o)); const go = (o, x) => { for (let k = 0; k < 30; k++) animMon(o, 1000 + k * 30, { cam, lookAt: { x, z: 0 } }); return Math.sign(o.userData.vis.fk); };
    return [go(a, 5), go(a, -5), go(f, -5)].join(); });
  if (r !== '1,-1,1') throw new Error(r); });
await t('GLB: Test-Würfel lädt (lokale Loader), Toon-Material + Umriss, Zielhöhe, Bodenkontakt, Animationen Idle/Walk', async () => {
  const r = await ev(async () => { MODEL.src[13] = '/fixtures/cube.glb'; const first = getModelOverride(13, { h: 1.5 }); await loadModel(13); const o = getModelOverride(13, { h: 1.5 }); if (!o) return { first, o: null, st: MODEL.st[13] };
    o.updateMatrixWorld(true); const b = new THREE.Box3(); o.traverse(m => { if (m.isMesh && !m.userData.ol) { m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)); } });
    let toon = 0, ol = 0; o.traverse(m => { if (m.isMesh && m.material.isMeshToonMaterial) toon++; if (m.userData.ol) ol++; });
    const U = o.userData; animModel(o, 1000, { moving: true }); animModel(o, 1100, { moving: true }); U.act.hit = performance.now(); animModel(o, 1200, {});
    return { first, model: !!U.model, toon, ol, h: +(b.max.y - b.min.y).toFixed(3), y0: +b.min.y.toFixed(3), clips: Object.keys(U.clips).join(), cur: U.cur, loader: !!THREE.GLTFLoader, draco: !!THREE.DRACOLoader }; });
  if (r.first !== null || !r.model || r.toon < 1 || r.ol < 1 || Math.abs(r.h - 1.5) > .02 || Math.abs(r.y0) > .02 || !/idle/.test(r.clips) || !/walk/.test(r.clips) || !r.loader || !r.draco) throw new Error(JSON.stringify(r)); });
await t('MON_RENDER=model: GLB hat Vorrang; fehlerhaftes GLB → Sprite; getModelOverride ohne Modell → null', async () => {
  const r = await ev(async () => { window.MON_RENDER = 'model'; MODEL.src[14] = '/fixtures/fehlt.glb'; await loadModel(14); const s = new THREE.Scene(), o = monObj(13, 1, {}, s), o2 = monObj(14, 1, {}, s);
    const res = { a: monRender(13), b: monRender(14), c: !!o.userData.model, d: !!o2.userData.sprite, e: getModelOverride(25), f: MODEL.st[14] }; window.MON_RENDER = 'sprite'; delete MODEL.src[13]; delete MODEL.src[14]; return res; });
  if (r.a !== 'model' || r.b !== 'sprite' || !r.c || !r.d || r.e !== null || r.f !== 'err') throw new Error(JSON.stringify(r)); });
await t('3D-Welt route1: 7 Sprite-Kreaturen nah + Begleiter, Draw-Calls ≤ 150', async () => {
  await ev(() => { G.team = [mk(13, 14)]; G.time = 600; loadMap('route1', 9, 12); P.dir = 'up'; P.ang = 0; setView('third', true); });
  await ev(() => new Promise(r => { let k = 0; const f = () => ++k >= 3 ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }));
  await ev(() => { ROAM.list.length = 0; ROAM.want = 0; [[25, -2, -2], [28, 2, -2], [10, -1, -3], [72, 1, -3], [46, 3, -3], [90, -3, -3], [84, 0, -4]].forEach(([s, dx, dy]) => { const x = P.x + dx, y = P.y + dy; ROAM.list.push({ s, l: 5, x, y, px: x, py: y, fx: x, fy: y, t: 1, dir: 'down', next: performance.now() + 1e6, st: 'idle', stT: 0, nat: 'neutral', owl: true, o: {} }); }); compReset(); });
  await ev(() => new Promise(r => { let k = 0; const f = () => ++k >= 6 ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }));
  const r = await ev(() => ({ calls: R3.r.info.render.calls, n: R3.scene.userData.spr.n })); console.log('   Draw-Calls', r.calls, '· Sprites', r.n); if (!(r.calls > 0 && r.calls <= 150 && r.n >= 8)) throw new Error(JSON.stringify(r));
  await ev(() => setView('2d', true)); });
await t('Starterwahl: drei Karten mit Bild über dem Dialog, Dialog bleibt bedienbar', async () => {
  const r = await ev(() => { G.flags.starter = 0; G.team = []; G.ret = { map: 'morgenau', x: 7, y: 11 }; loadMap('labor'); P.x = P.px = 3; P.y = P.py = 5; P.dir = 'up'; mode = 'world'; interact(); const ov = document.querySelector('#artStart');
    return { cards: ov ? ov.querySelectorAll('.asCard img').length : 0, on: ov && ov.querySelector('.asCard.on b').textContent, opts: document.querySelectorAll('#dlgOpts button').length }; });
  if (r.cards !== 3 || r.on !== MONS_N(1) || r.opts !== 2) throw new Error(JSON.stringify(r));
  await page.click('#dlgOpts button'); await page.waitForTimeout(1500); const n = await ev(() => ({ t: G.team.length, ov: !!document.querySelector('#artStart') })); if (n.t !== 1 || n.ov) throw new Error(JSON.stringify(n)); });
function MONS_N(i) { return ({ 1: 'Funki' })[i]; }
await t('SEQ.hatch vorhanden und läuft durch (Bild der Art)', async () => { const r = await ev(async () => { SET.banim = 0; const res = await playSeq('hatch', { mon: mk(84, 1) }); SET.banim = 1; return { ok: res && res.ok, left: !!document.querySelector('.hatchOv:not(.out)'), mode }; }); if (!r.ok || r.left) throw new Error(JSON.stringify(r)); });
await t('Keine Konsolen-/Seitenfehler', () => list(errs.filter(e => !/GPU stall|GL Driver|status of 404/.test(e))));
await browser.close(); S.close();
console.log(`\n${ok} ✓  ${bad} ✗` + (bad ? '  – ' + fails.join(' · ') : ''));
process.exit(bad ? 1 : 0);
