// Look L1 – Screenshots Welt-Rendering: node test/look_welt_shots.mjs <tag> [voll]
// tag = Iterationsname (v0, v1 …) → test/look_welt_<tag>_<breite>_<karte>_<zeit>.png; „voll“ = zusätzlich 1920×1080 und alle Zeiten.
import { boot, scene } from './look_lib.mjs';
const tag = process.argv[2] || 'x', full = process.argv[3] === 'voll';
const SC = [['route1', 9, 12], ['morgenau', 9, 7], ['nebelgrotte', 6, 12], ['brisenhafen', 9, 11, 'down'], ['fluestertal', 10, 10]];
const TIMES = { tag: 720, abend: 1125, nacht: 1380 };
const VPS = full ? [[860, 400], [1920, 1080]] : [[860, 400]];
for (const [w, h] of VPS) {
  const B = await boot({ w, h, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } });
  const { page } = B;
  for (const [m, x, y, dir] of SC) {
    if (!full && m === 'fluestertal') continue;
    const times = full || m === 'route1' ? Object.keys(TIMES) : ['tag'];
    for (const tz of times) {
      if (m === 'nebelgrotte' && tz !== 'tag') continue;
      await scene(page, m, x, y, TIMES[tz]);
      await page.evaluate(d => { P.dir = d || 'up'; P.ang = YAW[P.dir]; if (R3) { R3.yaw = P.ang; R3.snap = 1; } if (window.INP && INP.camReset) INP.camReset(); ROAM.list.forEach(r => r.t = 1); }, dir);
      await page.waitForTimeout(w > 1000 ? 9000 : 4500);
      const f = new URL(`./look_welt_${tag}_${w}_${m}_${tz}.png`, import.meta.url).pathname; await page.screenshot({ path: f, timeout: 180000 }); console.log(f.split('/').pop());
    }
  }
  if (B.errs.length) console.log('Fehler:', B.errs.slice(0, 6));
  await B.close();
}
