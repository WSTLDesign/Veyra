// Loop C – Screenshots Welt I (ein Chromium, 860×484): node test/loopc_shots.mjs <tag> [karte,karte] [tag,abend,nacht]
// → test/loopc_<tag>_<karte>_<zeit>.png. Startpunkt = Kartenspawn (WELT1.spawn bzw. Eingang), Blick wie beim Betreten.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const iter = process.argv[2] || 'x';
const only = (process.argv[3] || '').split(',').filter(Boolean);
const times = (process.argv[4] || 'tag').split(',');
const TIMES = { tag: 720, abend: 1125, nacht: 1380 };
const MAPS1 = ['morgenau', 'route1', 'kupferhain', 'route2', 'nebelgrotte', 'brisenhafen', 'windkueste', 'moewenbucht', 'route3', 'glutschlucht', 'fluestertal', 'siegesstrasse'];
const SP0 = { morgenau: [4, 5, 'down'], route1: [9, 20, 'up'], kupferhain: [9, 14, 'up'], route2: [1, 5, 'right'], nebelgrotte: [9, 12, 'up'], brisenhafen: [1, 5, 'right'], windkueste: [1, 5, 'right'], moewenbucht: [9, 1, 'down'], route3: [9, 15, 'up'], glutschlucht: [1, 7, 'right'], fluestertal: [1, 12, 'right'], siegesstrasse: [9, 15, 'up'] };
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 860, height: 484 }, deviceScaleFactor: 1 }); const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await page.addInitScript(() => { try { const o = JSON.parse(localStorage.getItem('veyra_set') || '{}'); localStorage.setItem('veyra_set', JSON.stringify(Object.assign(o, { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' }))); } catch (e) { } });
await page.goto(S.url + 'index.html', { waitUntil: 'load' });
await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
await page.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; G.team.push(mk(1, 12)); G.team.push(mk(4, 12)); });
const out = [];
for (const m of MAPS1) {
  if (only.length && !only.includes(m)) continue;
  for (const tz of times) {
    if (m === 'nebelgrotte' && tz !== 'tag') continue;
    const info0 = await page.evaluate(([m, t, s0]) => {
      if (typeof B !== 'undefined' && B) { try { endBattle('run'); } catch (e) { } }
      mode = 'world'; G.time = t; if (view === '2d') setView('third', 1);
      // Ankunft wie im Spiel: Eingangsfeld + Blickrichtung; nach Loop C korrigiert welt1Face() die Blickrichtung (Morgenau-Spawn)
      loadMap(m, s0[0], s0[1]); P.dir = s0[2]; if (typeof welt1Face === 'function') welt1Face(s0[2]);
      P.ang = YAW[P.dir]; if (R3) { R3.yaw = P.ang; R3.snap = 1; } if (window.INP && INP.camReset) INP.camReset();
      return { x: P.x, y: P.y, dir: P.dir };
    }, [m, TIMES[tz], SP0[m]]);
    await page.waitForFunction(() => typeof skyActive !== 'function' || skyActive() || (cur && (cur.inside || cur.theme === 'cave')), null, { timeout: 60000 }).catch(() => { });
    await page.waitForTimeout(4000);
    const info = await page.evaluate(() => ({ calls: R3 && R3.r.info.render.calls, tris: R3 && R3.r.info.render.triangles, reg: typeof SKY3 !== 'undefined' && SKY3.region }));
    const f = new URL(`./loopc_${iter}_${m}_${tz}.png`, import.meta.url).pathname; await page.screenshot({ path: f, timeout: 180000 });
    out.push(f.split('/').pop() + ' ' + JSON.stringify(Object.assign(info0, info))); console.log(out[out.length - 1]);
  }
}
if (errs.length) console.log('Fehler:', errs.slice(0, 8)); else console.log('Keine Konsolenfehler.');
await browser.close(); S.close();
