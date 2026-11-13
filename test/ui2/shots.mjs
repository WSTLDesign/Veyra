// UI-Design (13.11.) – Vorschauen vorher/nachher. EIN Chromium (Sperre .chromium.lock, s. AGENTS.md).
// Aufruf: node build.mjs && node test/ui2/shots.mjs <vorher|nachher|rN> [g k]   g = 1600×900, k = 844×390 (Handy quer)
// Erzeugt test/ui2/<tag>_<szene>_<größe>.webp für titel, hud, dialog, kampf, attacken, team, dex, menu
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
const args = process.argv.slice(2), TAG = args.shift() || 'nachher', want = args.length ? args : ['g', 'k'];
const ONLY = (process.env.UI_ONLY || '').split(',').filter(Boolean), on = n => !ONLY.length || ONLY.includes(n);
const SIZES = { g: [1600, 900], k: [844, 390] };
const DIR = new URL('./', import.meta.url).pathname, TMP = DIR + '_tmp.png', errs = [];
// eigener Server: UI_DIST=/pfad/zu/dist für Vorher-Bilder gegen einen alten Build
const ROOT = normalize(process.env.UI_DIST || new URL('../../dist/', import.meta.url).pathname).replace(/\/+$/, '') + '/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.css': 'text/css', '.mp4': 'video/mp4' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(ROOT, p)); if (!f.startsWith(ROOT)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const S = { url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() };
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const frames = (p, n) => p.evaluate(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
const shot = async (p, name, s) => { writeFileSync(TMP, await p.screenshot()); execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=82)', TMP, `${DIR}${TAG}_${name}_${s}.webp`]); };
const close = p => p.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
async function boot(W, H, title) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|ReadPixels/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  await p.addInitScript(() => { try { localStorage.setItem('veyra_set', JSON.stringify({ res: '720', gfx: 'low', hudDim: 'aus', ctrl: 'dyn', inHint: 1 })); } catch (e) { } });
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  try { await p.click('#iPrompt', { timeout: 5000 }); } catch (e) { } await p.waitForTimeout(400);
  try { await p.click('#iSkip', { timeout: 5000 }); } catch (e) { } await p.waitForTimeout(900);
  for (let i = 0; i < 6; i++) { if (await p.evaluate(() => { const b = document.getElementById('tNew'); return !!b && b.offsetParent !== null; })) break; try { await p.click('#iSkip', { timeout: 2000 }); } catch (e) { } await p.waitForTimeout(1500); }
  if (title) return p;
  await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(async () => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } try { await preloadArt(); } catch (e) { } G.flags.starter = 1; G.time = 10 * 60; SET.skipBattleIntro = 1;
    G.team = [mk(1, 14), mk(25, 11), mk(7, 9), mk(4, 8)]; G.team[1].hp = Math.round(stat(G.team[1], 'hp') * .45); G.team[3].hp = Math.round(stat(G.team[3], 'hp') * .18); G.bag.kapsel = 5; G.bag.trank = 3;
    for (const i of [1, 4, 7, 13, 16, 19, 22, 25, 28, 31, 59, 61, 112, 140]) { G.dex.seen[i] = 1; if (i < 30) G.dex.caught[i] = 1; } });
  await close(p);
  return p;
}
for (const s of want) {
  const [W, H] = SIZES[s];
  if (on('titel')) { const p = await boot(W, H, true); await p.waitForTimeout(1800); await frames(p, 6); await shot(p, 'titel', s); await p.close(); }
  const p = await boot(W, H);
  await p.evaluate(() => { loadMap('morgenau', 9, 12); P.dir = 'up'; P.ang = 0; mode = 'world'; if (view === '2d') setView('third', true); });
  await close(p); await p.waitForTimeout(2600); await frames(p, 8);
  if (on('hud')) { await p.evaluate(() => { $('#mcName').textContent = cur.name; $('#mcRegion').textContent = regionOf(cur.id)[0]; const c = $('#mapCard'); c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); }); await p.waitForTimeout(800); await frames(p, 4); await shot(p, 'schild', s); await p.waitForTimeout(3600); await frames(p, 6); await shot(p, 'hud', s); }
  if (on('dialog')) {
    await p.evaluate(() => { mode = 'world'; DLG.pend = { fig: 'kael', t: 'trainer' }; say([figSay('kael', 'gruss', 2)]); });
    await p.waitForTimeout(1500); await p.evaluate(() => { TW && TW.finish && TW.finish(); }); await p.waitForTimeout(500); await shot(p, 'dialog', s); await close(p); await p.waitForTimeout(300);
  }
  if (on('kampf')) {
    await p.evaluate(() => { mode = 'world'; startBattle({ wild: mk(59, 6) }); });
    await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 40000 }); await p.waitForTimeout(1600); await frames(p, 10);
    await shot(p, 'kampf', s);
    await p.click('#bMenu .big.k1'); await p.waitForTimeout(1200); await frames(p, 8); await shot(p, 'attacken', s);
    await p.evaluate(() => { try { endBattle('run'); } catch (e) { B = null; $('#battle').hidden = true; } mode = 'world'; }); await p.waitForTimeout(800); await close(p);
  }
  if (on('menu')) for (const [t, n] of [['quest', 'menu'], ['team', 'team'], ['dex', 'dex'], ['bag', 'tasche'], ['game', 'optionen']]) {
    await p.evaluate(t => { if (!$('#menu').hidden) { tab = t; sel = null; renderMenu(); } else openMenu(t); }, t); await p.waitForTimeout(1200); await frames(p, 4); await shot(p, n, s);
  }
  await p.close();
}
console.log(errs.length ? 'Fehler:\n' + [...new Set(errs)].join('\n') : 'Keine Seitenfehler.');
await browser.close(); S.close();
