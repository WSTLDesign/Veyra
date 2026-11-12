// Welt-Grafik (Agent „Welt-Grafik“): Vorschaubilder 1600×900 WebP je Szene und Qualitätsstufe + Messwerte.
// node test/welt2/shots.mjs <tag> [stufen=hoch] [szenen=alle]   (Chromium-Sperre nehmen!)
//  tag: vorher | nachher | r1 … → test/welt2/<tag>_<szene>_<stufe>.webp, Messwerte test/welt2/<tag>_mess.json
//  stufen: Komma-Liste aus hoch,mittel,niedrig · szenen: Komma-Liste aus den Schlüsseln von SC
import { chromium } from 'playwright';
import { serve as serveDist } from '../art_serve.mjs';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { execFileSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
const tag = process.argv[2] || 'x', tiers = (process.argv[3] || 'hoch').split(','), only = process.argv[4] ? process.argv[4].split(',') : null;
const W = 1600, H = 900, dir = new URL('./', import.meta.url).pathname;
// Szene: Karte, x, y, Blickrichtung, Uhrzeit (Minuten), Kamera-Gier relativ (Rad), optional Kamera-Abstand
const SC = {
  morgenau: ['morgenau', 9, 3, 'down', 700],
  route1: ['route1', 9, 15, 'up', 690],
  hoehle: ['nebelgrotte', 6, 12, 'up', 720],
  ufer: ['brisenhafen', 9, 11, 'down', 760],
  abend: ['route1', 9, 15, 'up', 1125],
};
const TIER = { hoch: { quality: 'hoch', gfx: 'high', res: 'native', fps: 0, shadows: 1, particles: 1, light: 1 }, mittel: { quality: 'mittel', gfx: 'mid', res: 'native', fps: 0, shadows: 1, particles: 1, light: 1 }, niedrig: { quality: 'niedrig', gfx: 'low', res: 'native', fps: 0, shadows: 0, particles: 1, light: 1 } };
// VEYRA_ROOT=<ordner> (z. B. build/plain = älterer Stand ohne Welt-Grafik 2) → diesen Ordner ausliefern, fehlende Dateien aus dist/
const ROOT = process.env.VEYRA_ROOT ? new URL('../../' + process.env.VEYRA_ROOT.replace(/\/?$/, '/'), import.meta.url).pathname : null, DIST = new URL('../../dist/', import.meta.url).pathname;
const serveRoot = () => new Promise(res => { const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary' };
  const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; for (const base of [ROOT, DIST]) { const f = normalize(join(base, p)); if (!f.startsWith(base)) continue; try { const b = await readFile(f); rs.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream' }); return rs.end(b); } catch (e) { } } rs.writeHead(404); rs.end(); });
  srv.listen(0, '127.0.0.1', () => res({ url: 'http://127.0.0.1:' + srv.address().port + '/', close: () => srv.close() })); });
const S = ROOT ? await serveRoot() : await serveDist(), mess = {};
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const t of tiers) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  await page.addInitScript(s => { try { localStorage.setItem('veyra_set', JSON.stringify(Object.assign({ hudDim: 'aus', fs: 0 }, s))); } catch (e) { } }, Object.assign({ gfxForce: 1 }, TIER[t]));
  await page.goto(S.url + 'index.html', { waitUntil: 'load' });
  try { await page.click('#iPrompt', { timeout: 4000 }); } catch (e) { }
  await page.waitForTimeout(400); try { await page.click('#iSkip', { timeout: 4000 }); } catch (e) { }
  await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForFunction(() => typeof G !== 'undefined' && G, null, { timeout: 30000 }); await page.waitForTimeout(600);
  await page.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; if (!G.team.length) G.team.push(mk(1, 12)); });
  // Stufe hart setzen (Test: nicht automatisch regeln)
  await page.evaluate(([g, sh]) => { try { Object.assign(SET, { res: 'native', shadows: sh, light: 1, particles: 1, fps: 0 }); try { applySet(); } catch (e) { } SET.gfx = g; if (typeof gfxForce === 'function') gfxForce(g); else if (typeof perfSet === 'function') { PERF.tier = g === 'high' ? 'mid' : 'high'; perfSet(g); } PERF.scale = 1; if (R3 && R3.fit) R3.fit(); } catch (e) { console.error(e.message); } }, [TIER[t].gfx, TIER[t].shadows]);
  await page.addStyleTag({ content: 'body *{visibility:hidden!important}#world3d{visibility:visible!important}#perfHud{display:none!important}' });
  for (const [k, [m, x, y, d, tm]] of Object.entries(SC)) {
    if (only && !only.includes(k)) continue;
    await page.evaluate(([m, x, y, d, tm]) => { mode = 'world'; G.time = tm; if (view === '2d') setView('third', 1); loadMap(m, x, y); P.dir = d; P.ang = YAW[d]; if (R3) { R3.yaw = P.ang; R3.snap = 1; } if (window.INP && INP.camReset) INP.camReset(); ROAM.list.forEach(r => r.t = 1); }, [m, x, y, d, tm]);
    await page.waitForTimeout(7000);
    // Messung: Draw-Calls, Dreiecke, Bildzeit (gerenderte Bilder über 4 s)
    const me = await page.evaluate(async () => { const r = R3.r, i = r.info.render; const f0 = PERF.frames, t0 = performance.now(); await new Promise(res => setTimeout(res, 4000)); const fr = PERF.frames - f0, ms = (performance.now() - t0) / Math.max(1, fr);
      const cv = r.domElement, st = typeof gfxStats === 'function' ? gfxStats() : null; return { calls: st ? st.calls : i.calls, tris: st ? st.tris : i.triangles, ms: +ms.toFixed(1), px: cv.width + '×' + cv.height, tier: PERF.tier, shadow: R3.sun.castShadow ? R3.sun.shadow.mapSize.x : 0 }; });
    mess[t + '_' + k] = me;
    const png = dir + `${tag}_${k}_${t}.png`, webp = png.replace(/\.png$/, '.webp');
    await page.screenshot({ path: png, timeout: 180000 });
    execFileSync('convert', [png, '-quality', '88', webp]); unlinkSync(png);
    console.log(webp.split('/').pop(), JSON.stringify(me));
  }
  if (errs.length) { console.log('Fehler:', errs.slice(0, 8)); mess['err_' + t] = errs.slice(0, 8); }
  await page.close();
}
writeFileSync(dir + `${tag}_mess.json`, JSON.stringify(mess, null, 1));
await browser.close(); S.close();
