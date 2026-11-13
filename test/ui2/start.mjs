// UI-Design Runde 2 – Startablauf am echten dist/index.html wie auf dem iPhone (Touch, mobil, standalone simuliert). EIN Chromium (Sperre).
// node build.mjs && node test/ui2/start.mjs  → test/ui2/r2_start_<größe>.webp (Bildreihe) + Einzelbilder r2_start_<größe>_<n>.webp
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { writeFileSync } from 'fs';
import { extname, join, normalize } from 'path';
import { execFileSync } from 'child_process';
const ROOT = normalize(new URL('../../dist/', import.meta.url).pathname).replace(/\/+$/, '') + '/', DIR = new URL('./', import.meta.url).pathname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.css': 'text/css', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(ROOT, p)); if (!f.startsWith(ROOT)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const errs = [], info = {};
const SIZES = { i14: [844, 390], i15pm: [932, 430] };
for (const [tag, [W, H]] of Object.entries(SIZES)) {
  const frames = [];
  const shot = async (p, label) => { const f = `${DIR}r2_start_${tag}_${frames.length + 1}.webp`; writeFileSync(DIR + '_tmp.png', await p.screenshot());
    execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=82)', DIR + '_tmp.png', f]); frames.push([f, label]); };
  for (const save of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|ReadPixels/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
    // standalone-PWA simulieren (navigator.standalone + display-mode), Opening echt abspielen mit festen Zeitpunkten
    await p.addInitScript(sv => { try { Object.defineProperty(navigator, 'standalone', { get: () => true }); const mm = matchMedia; window.matchMedia = q => /display-mode:\s*(standalone|fullscreen)/.test(q) ? { matches: true, media: q, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } } : mm.call(window, q);
      window.VEYRA_OPEN = 1; if (sv) localStorage.setItem('veyra_save_probe', '1'); } catch (e) { } }, save);
    if (save) { // echten Spielstand anlegen: einmal starten, speichern, neu laden
      await p.goto(URL0 + 'index.html', { waitUntil: 'load' });
      await p.evaluate(() => { G = freshG({}); G.map = 'morgenau'; G.team = [mk(1, 8)]; G.flags.starter = 1; save(); }); await p.reload({ waitUntil: 'load' });
    } else await p.goto(URL0 + 'index.html', { waitUntil: 'load' });
    await p.waitForTimeout(900);
    if (!save) await shot(p, 'App-Start: Startbildschirm');
    info[tag + (save ? '_save' : '')] = await p.evaluate(() => ({ intro: !$('#intro').hidden, prompt: !!$('#iPrompt') && !$('#iPrompt').hidden, logo: !!document.querySelector('#iPrompt .vtLogo'), poster: window.INTRO_POSTER, video: !!window.INTRO_VIDEO }));
    try { await p.tap('#iPrompt', { timeout: 4000 }); } catch (e) { try { await p.click('#iPrompt', { timeout: 3000 }); } catch (x) { } }
    if (!save) { await p.evaluate(() => { window.VEYRA_OPEN_T = 1.6; }); await p.waitForTimeout(700); await shot(p, 'Opening (1,6 s)');
      await p.evaluate(() => { window.VEYRA_OPEN_T = 4.1; }); await p.waitForTimeout(900); await shot(p, 'Opening-Endbild'); await p.evaluate(() => { window.VEYRA_OPEN_T = null; }); }
    for (let i = 0; i < 10; i++) { if (await p.evaluate(() => !$('#title').hidden && $('#intro').hidden)) break; try { await p.click('#iSkip', { timeout: 1200 }); } catch (e) { } await p.waitForTimeout(700); }
    await p.waitForTimeout(1600); await shot(p, save ? 'Titel mit Spielstand (Fortsetzen)' : 'Titel (neu)');
    info[tag + (save ? '_save' : '') + '_title'] = await p.evaluate(() => ({ vtBg: !!document.querySelector('#title .vtBg'), poster: $('#title').classList.contains('poster'), cont: !$('#tCont').hidden, contPri: $('#tCont').classList.contains('pri') }));
    await ctx.close();
  }
  // Film-Startbild (intro_poster.jpg, Teil des Films) als letztes Bild der Reihe
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[3:];W,H=int(sys.argv[1]),int(sys.argv[2]);n=len(fs)//2;s=.42
c=Image.new('RGB',(int(W*s)*n+12*(n+1),int(H*s)+60),'#f4f1ea');d=ImageDraw.Draw(c)
for i in range(n):
  im=Image.open(fs[2*i]).convert('RGB').resize((int(W*s),int(H*s)));x=12+i*(int(W*s)+12);c.paste(im,(x,12));d.text((x,int(H*s)+22),str(i+1)+'. '+fs[2*i+1],fill='#1b2333')
c.save(sys.argv[2+0] if False else '${DIR}r2_start_${tag}.webp',quality=85)
`, String(W), String(H), ...frames.flat()]);
}
console.log(JSON.stringify(info));
console.log(errs.length ? 'Fehler:\n' + [...new Set(errs)].join('\n') : 'Keine Seitenfehler.');
await browser.close(); srv.close();
