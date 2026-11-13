// Terras – Übersichtsbögen der prozeduralen 3D-Kreaturen (Agent Terras, Opus hoch)
// node test/terras_sheet.mjs <ausgabe.png> [ids|w1] [spalten] [zelle] [ansichten]
//   ansichten: 'q' = Dreiviertel (Standard), 'qsf' = Dreiviertel + Seite + Front (je Art eine Zeile)
// Nur unter der Chromium-Sperre starten (AGENTS.md, DETAILING-PHASE).
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync } from 'fs';
export const W1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 22, 23, 25, 26, 31, 32, 33, 34, 37, 38, 52, 53, 57, 58, 59, 60, 61, 62, 72, 73, 75, 76, 90, 91, 112, 113, 114, 115, 116, 117, 122];
const out = process.argv[2] || 'test/terras_sheet.png';
const ids = !process.argv[3] || process.argv[3] === 'w1' ? W1 : process.argv[3].split(',').map(Number);
const cols = +(process.argv[4] || 8), cell = +(process.argv[5] || 220), views = process.argv[6] || 'q';
const S = await serve();
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 640, height: 480 } }); p.setDefaultTimeout(15000);
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.addInitScript(() => { window.VEYRA_DEMO = 1; });
await p.goto(S.url + 'index.html', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.THREE && typeof buildMon3D === 'function' && typeof MONS !== 'undefined', null, { timeout: 15000 });
const res = await p.evaluate(([ids, cols, cell, views]) => {
  try { if (typeof VILL !== 'undefined') VILL.list = []; } catch (e) { }
  const V = views === 'qsf' ? [['Dreiviertel', 0], ['Seite', 1], ['Front', 2]] : [['', 0]];
  const nc = views === 'qsf' ? 3 : cols, rows = views === 'qsf' ? ids.length : Math.ceil(ids.length / cols), lab = 34;
  const big = document.createElement('canvas'); big.width = nc * cell; big.height = rows * (cell + lab); const x = big.getContext('2d');
  x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, big.width, big.height);
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(cell * 2, cell * 2, false); // 2×-Überabtastung wie die Dex-Bilder (Fortsetzung 15:30)
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1; r.setClearColor(0, 0);
  const s = new THREE.Scene(); studio(s); const cam = new THREE.PerspectiveCamera(28, 1, .1, 50);
  const stats = [];
  ids.forEach((id, k) => V.forEach(([vn, vi], j) => {
    if (j === 0) { const g = buildMon3D(id, 1, {}); s.add(g); heroFrame(cam, g); r.info.reset(); r.info.autoReset = false; r.render(s, cam); r.info.autoReset = true; let meshes = 0; g.traverse(o => { if (o.isMesh) meshes++; }); stats.push({ id, n: MONS[id].n, calls: r.info.render.calls, tris: r.info.render.triangles, meshes, terra: !!(typeof TERRA !== 'undefined' && TERRA[id]) }); s.remove(g); }
    // Bild: Porträt-Geometrie (TA_HQ) wie monThumb; Messwerte oben vom Spielmodell
    const tq = typeof TERRA !== 'undefined' && !!TERRA[id]; if (tq) TA_HQ = 1; let m; try { m = buildMon3D(id, 1, {}); } finally { TA_HQ = 0; } const py = (MONS[id].sp[7] || {}).py || 0;
    const yaw = vi === 0 ? -Math.PI / 2 - .95 + (typeof TERRA !== 'undefined' && TERRA[id] ? 0 : py) : vi === 1 ? -Math.PI / 2 : Math.PI;
    m.rotation.y = yaw; s.add(m); heroFrame(cam, m); animMon(m, 0, { still: true, pose: 'hero', lookAt: { x: cam.position.x, z: cam.position.z }, lookK: tq && vi === 0 ? (TERRA[id].pk ?? .25) : undefined }); r.render(s, cam);
    s.remove(m);
    const cx = (views === 'qsf' ? j : k % cols) * cell, cy = (views === 'qsf' ? k : Math.floor(k / cols)) * (cell + lab);
    x.fillStyle = '#ffffff'; x.fillRect(cx + 3, cy + 3, cell - 6, cell + lab - 6);
    x.imageSmoothingQuality = 'high'; x.drawImage(r.domElement, 0, 0, cell * 2, cell * 2, cx, cy, cell, cell);
    x.fillStyle = '#2a2633'; x.font = '600 13px sans-serif'; x.textAlign = 'center';
    const T = typeof TERRA !== 'undefined' && TERRA[id];
    x.fillText('#' + String(id).padStart(3, '0') + ' ' + MONS[id].n + (vn ? ' · ' + vn : ''), cx + cell / 2, cy + cell + 12);
    x.font = '11px sans-serif'; x.fillStyle = '#6a6470'; x.fillText(T ? T.tier : '(alt) ' + bodyOf(MONS[id]), cx + cell / 2, cy + cell + 26);
  }));
  r.dispose();
  return { png: big.toDataURL('image/png'), stats };
}, [ids, cols, cell, views]);
writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
console.log(res.stats.map(s => `${s.id} ${s.n}: calls ${s.calls}, tris ${s.tris}, meshes ${s.meshes}${s.terra ? ' [neu]' : ''}`).join('\n'));
if (errs.length) console.log('FEHLER:', errs.join(' | '));
await b.close(); S.close();
