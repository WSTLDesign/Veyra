// Stabilität R4 – Sichtprüfung: Heldin + Terra nah/mittel, Umriss aus leichtem Netz (lod=1) gegen Original (?lod=0). EIN Chromium (Sperre .chromium.lock).
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { writeFileSync } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
const ROOT = fileURLToPath(new URL('../', import.meta.url)), DIST = join(ROOT, 'dist/');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.css': 'text/css', '.jpg': 'image/jpeg' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(DIST, p));
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const shots = {};
for (const lod of ['1', '0']) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 480 } }); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(URL0 + 'index.html?modelle3d=1&lod=' + lod, { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(1000);
  await p.evaluate(() => { const i = document.getElementById('intro'); if (i) i.hidden = true; beginGame({}); });
  await p.waitForFunction(() => { if (typeof TW === 'object' && TW && TW.finish) TW.finish(); if (mode === 'dialog') advDlg(); return !!G && !!R3; }, null, { timeout: 90000, polling: 250 });
  await p.evaluate(() => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.team = [mk(1, 12)]; setView('third'); loadMap('morgenau', 9, 8); mode = 'world'; });
  await p.waitForFunction(() => R3.player && R3.player.userData.pilot && (typeof tmReady !== 'function' || tmReady(1)), null, { timeout: 400000, polling: 1000 });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => { STAB.stopped = 0; const out = {}; const pl = R3.player, pp = pl.position.clone(); LOOP.paused = true;
    // Terra neben die Heldin
    const t = buildTerra(1, .62, {}); t.position.set(pp.x + .9, pp.y, pp.z); t.rotation.y = -.6; R3.scene.add(t);
    const cam = new THREE.PerspectiveCamera(40, 640 / 480, .05, 100), cv = document.createElement('canvas'); cv.width = 640; cv.height = 480; const x = cv.getContext('2d');
    for (const [k, d, h] of [['nah', 2.4, .75], ['mittel', 4.5, .8], ['fern', 7, .9]]) { cam.position.set(pp.x + .45, pp.y + h + .1, pp.z + d); cam.lookAt(pp.x + .45, pp.y + h - .1, pp.z);
      if (typeof toonProSync === 'function') toonProSync(R3.r); R3.r.render(R3.scene, cam); x.drawImage(R3.r.domElement, 0, 0, 640, 480); out[k] = cv.toDataURL('image/png'); }
    R3.scene.remove(t); return out; });
  for (const k in r) { writeFileSync(join(ROOT, `test/stabil4/bild_${k}_lod${lod}.png`), Buffer.from(r[k].split(',')[1], 'base64')); }
  console.log('lod=' + lod + ' fertig'); await ctx.close(); }
await browser.close(); srv.close();
