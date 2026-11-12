// Blender-Probe Teil 2: lädt test/analyse_3d/testkopf(.glb|_draco.glb) mit three.js r128 + vorhandenem GLTFLoader/DRACOLoader (dist/vendor),
// stellt auf Toon (MeshToonMaterial + 3-stufiger Verlauf wie toonGrad) + Umriss-Hülle um, misst Ladezeit/Dreiecke/Draw-Calls und rendert 1600×900.
// Nur unter der Chromium-Sperre starten (siehe AGENTS.md). Ergebnis: blender_kopf_*.webp + glb_probe.json
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import { join, normalize, extname } from 'path';
const HERE = new URL('./', import.meta.url).pathname, DIST = new URL('../../dist/', import.meta.url).pathname;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary' };
const PAGE = `<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#e6e8eb}</style>
<script src="/three.min.js"></script><script src="/vendor/loaders/GLTFLoader.js"></script><script src="/vendor/loaders/DRACOLoader.js"></script><body></body>`;
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p === '/probe.html') { rs.writeHead(200, { 'content-type': 'text/html' }); return rs.end(PAGE); }
  const base = p.startsWith('/a/') ? HERE : DIST; if (p.startsWith('/a/')) p = p.slice(2); const f = normalize(join(base, p)); if (!f.startsWith(base)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = `http://127.0.0.1:${srv.address().port}/`;
const alt = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: existsSync(chromium.executablePath()) ? undefined : alt, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const p = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(URL0 + 'probe.html');
const res = await p.evaluate(async () => {
  const out = { three: THREE.REVISION };
  const draco = new THREE.DRACOLoader(); draco.setDecoderPath('/vendor/libs/draco/gltf/'); const L = new THREE.GLTFLoader(); L.setDRACOLoader(draco);
  const load = async f => { const t0 = performance.now(); const buf = await (await fetch('/a/' + f, { cache: 'no-store' })).arrayBuffer(); const t1 = performance.now(); const g = await new Promise((ok, no) => L.parse(buf, '/a/', ok, no)); const t2 = performance.now(); return { g, bytes: buf.byteLength, fetchMs: +(t1 - t0).toFixed(1), parseMs: +(t2 - t1).toFixed(1) }; };
  // je Datei 3 Läufe (der erste Draco-Lauf lädt zusätzlich den WASM-Decoder)
  for (const f of ['testkopf.glb', 'testkopf_draco.glb']) { const runs = []; let g; for (let i = 0; i < 3; i++) { const r = await load(f); g = r.g; runs.push(r.parseMs); out[f] = { bytes: r.bytes, fetchMs: r.fetchMs }; } out[f].parseMs = runs; out[f].scene = g.scene; }
  // Szene wie im Spiel: Hemisphäre + Sonne mit Schatten, ACES, 3-stufiger Toon-Verlauf
  const rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(1600, 900); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.05; rr.shadowMap.enabled = true; rr.shadowMap.type = THREE.PCFSoftShadowMap; rr.outputEncoding = THREE.sRGBEncoding; document.body.appendChild(rr.domElement);
  const S = new THREE.Scene(); S.background = new THREE.Color('#e6e8eb'); S.add(new THREE.HemisphereLight('#ffffff', '#b8bcc4', .8)); const sun = new THREE.DirectionalLight('#fff4e0', .85); sun.position.set(-2.5, 4, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); S.add(sun);
  const grad = new THREE.DataTexture(new Uint8Array([84, 84, 84, 255, 118, 118, 118, 255, 178, 178, 178, 255, 232, 232, 232, 255, 255, 255, 255, 255]), 5, 1, THREE.RGBAFormat); grad.minFilter = grad.magFilter = THREE.LinearFilter; grad.needsUpdate = true;
  const root = out['testkopf_draco.glb'].scene; delete out['testkopf.glb'].scene; delete out['testkopf_draco.glb'].scene;
  const std = root.clone(true); // Original-Material (MeshStandard aus glTF) zum Vergleich
  const toon = (o) => { const ol = []; o.traverse(q => { if (!q.isMesh) return; const m0 = q.material; const m = new THREE.MeshToonMaterial({ color: m0.color, map: m0.map || null, gradientMap: grad, morphTargets: !!q.morphTargetInfluences, morphNormals: !!q.morphTargetInfluences }); q.material = m; q.castShadow = q.receiveShadow = true;
      if (!/Glanz|Auge|Mund/.test(m0.name)) { const om = new THREE.MeshBasicMaterial({ color: '#2b3040', side: THREE.BackSide, morphTargets: !!q.morphTargetInfluences });
        om.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <morphtarget_vertex>', '#include <morphtarget_vertex>\ntransformed += normalize(normal) * 0.012;'); }; om.customProgramCacheKey = () => 'olp';
        const s = new THREE.Mesh(q.geometry, om); s.morphTargetInfluences = q.morphTargetInfluences; s.morphTargetDictionary = q.morphTargetDictionary; ol.push([q, s]); } });
    ol.forEach(([q, s]) => q.add(s)); return o; };
  toon(root); S.add(root);
  const cam = new THREE.PerspectiveCamera(24, 16 / 9, .05, 50);
  const shot = (obj, a, d, morph) => { obj.traverse(q => { if (q.morphTargetInfluences && q.morphTargetDictionary) { const D = q.morphTargetDictionary; for (const k in D) q.morphTargetInfluences[D[k]] = (morph && morph[k]) || 0; } });
    cam.position.set(Math.sin(a) * d, .1, Math.cos(a) * d); cam.lookAt(0, .02, 0); rr.info.autoReset = false; rr.info.reset(); rr.render(S, cam); const info = { calls: rr.info.render.calls, tris: rr.info.render.triangles }; return { img: rr.domElement.toDataURL('image/webp', .9), info }; };
  // glTF schaut nach +Z (Blender −Y vorn → glTF +Z), Kamera daher auf +Z
  const imgs = {}; let r;
  r = shot(root, .45, 6.2); imgs.toon = r.img; out.renderToon = r.info;
  r = shot(root, 0, 4.4, { Laecheln: 1, Augen_zu: 1 }); imgs.morph = r.img;
  r = shot(root, -1.2, 6.2, { Laecheln: .6 }); imgs.seite = r.img;
  S.remove(root); std.traverse(q => { if (q.isMesh) q.castShadow = true; }); S.add(std); r = shot(std, .45, 6.2); imgs.standard = r.img; out.renderStandard = r.info;
  let tris = 0, prims = 0, morphs = 0; std.traverse(q => { if (q.isMesh) { prims++; tris += q.geometry.index.count / 3; morphs = Math.max(morphs, (q.geometry.morphAttributes.position || []).length); } }); out.modell = { primitive: prims, tris, morphZiele: morphs };
  out.imgs = imgs; return out; });
for (const [k, d] of Object.entries(res.imgs)) writeFileSync(HERE + `blender_kopf_${k}.webp`, Buffer.from(d.split(',')[1], 'base64'));
delete res.imgs; res.fehler = errs; writeFileSync(HERE + 'glb_probe.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
await browser.close(); srv.close();
