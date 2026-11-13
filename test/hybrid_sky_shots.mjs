// Hybrid H1 – Screenshots Himmel & Kulissen (Methode wie test/look_welt_shots.mjs): node test/hybrid_sky_shots.mjs <iter> [voll] [karte,karte]
// → test/hybrid_sky_<iter>_<breite>_<karte>_<zeit>.png (860×400; mit „voll“ zusätzlich 1920×1080). Vergleich: test/look_welt_v6_*.png, public/art_ref/intro_stills/.
import { boot, scene } from './look_lib.mjs';
const iter = process.argv[2] || 'x', full = process.argv[3] === 'voll', only = (process.argv[4] || process.argv[3] || '').split(',').filter(s => /^[a-z0-9]+$/.test(s) && s !== 'voll');
const SC = [['route1', 9, 12], ['morgenau', 9, 7], ['nebelgrotte', 6, 12], ['brisenhafen', 9, 11, 'down'], ['fluestertal', 10, 10]];
const TIMES = { tag: 720, abend: 1125, nacht: 1380 };
const VPS = full ? [[860, 400], [1920, 1080]] : [[860, 400]];
for (const [w, h] of VPS) {
  const B = await boot({ w, h, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } });
  const { page } = B;
  for (const [m, x, y, dir] of SC) {
    if (only.length && !only.includes(m)) continue;
    for (const tz of Object.keys(TIMES)) {
      if (m === 'nebelgrotte' && tz !== 'tag') continue;
      await scene(page, m, x, y, TIMES[tz]);
      await page.evaluate(d => { P.dir = d || 'up'; P.ang = YAW[P.dir]; if (R3) { R3.yaw = P.ang; R3.snap = 1; } if (window.INP && INP.camReset) INP.camReset(); ROAM.list.forEach(r => r.t = 1); }, dir);
      await page.waitForFunction(() => typeof skyActive !== 'function' || skyActive() || (cur && (cur.inside || cur.theme === 'cave')), null, { timeout: 60000 }).catch(() => { });
      await page.waitForTimeout(w > 1000 ? 9000 : 4500);
      const info = await page.evaluate(() => ({ calls: R3 && R3.r.info.render.calls, sky: typeof skyActive === 'function' && skyActive(), reg: typeof SKY3 !== 'undefined' && SKY3.region }));
      const f = new URL(`./hybrid_sky_${iter}_${w}_${m}_${tz}.png`, import.meta.url).pathname; await page.screenshot({ path: f, timeout: 180000 }); console.log(f.split('/').pop(), JSON.stringify(info));
    }
  }
  if (B.errs.length) console.log('Fehler:', B.errs.slice(0, 6));
  await B.close();
}
