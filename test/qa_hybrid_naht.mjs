// QA Hybrid (Sonnet hoch) – Nachprüfung eines Naht-Ausreißers (Himmelsweiten, Blick 240°): Bild + Spaltenprofil, damit sichtbar ist, ob der Spaltensprung eine Naht oder eine Insel-Kante ist.
// Aufruf: node build.mjs && node test/qa_hybrid_naht.mjs → test/qa_hybrid_naht_himmelsweiten_240.png
import { boot, scene } from './look_lib.mjs';
const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } }), { page } = B;
await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; getMap('route1').region = 'himmelsweiten'; });
await scene(page, 'route1', 9, 12, 720); await page.evaluate(() => { skyAttach(R3.scene, cur); mode = 'wait'; });
await page.waitForFunction(() => skyActive(), null, { timeout: 90000 }).catch(() => { });
for (const a of [210, 240, 270]) {
  await page.evaluate(a => { const r = a * Math.PI / 180; P.ang = r; R3.yaw = r; R3.snap = 1; }, a); await page.waitForTimeout(2000);
  await page.screenshot({ path: new URL(`./qa_hybrid_naht_himmelsweiten_${a}.png`, import.meta.url).pathname, timeout: 180000 });
  const yaw = await page.evaluate(() => +R3.yaw.toFixed(2)); console.log('Blick', a, 'yaw', yaw);
}
await B.close();
