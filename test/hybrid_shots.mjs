// Hybrid H2 – Screenshots: Kampf vor Regions-Panorama, Ortsansichten, Kapitel-Standbilder
// Aufruf: node build.mjs && node test/hybrid_shots.mjs <iter> [kampf|ort|kapitel|alle] [voll] [region,region]
// → test/hybrid_h2_<kampf|ort|kapitel>_<region|ort|kapitel>_<zeit>[_<iter>].png in 860×484 (und mit „voll“ 1920×1080)
import { boot, scene } from './look_lib.mjs';
const iter = process.argv[2] || 'x', what = process.argv[3] || 'alle', full = process.argv.includes('voll');
const only = (process.argv.find((a, i) => i > 3 && /^[a-z,]+$/.test(a) && a !== 'voll') || '').split(',').filter(Boolean);
const TIMES = { tag: 720, abend: 1125, nacht: 1380 };
// Region → Karte (Kampf findet am Ort statt); Himmelsweiten/Kristallgebirge ohne eigene Karte → Region erzwingen (HY_REGION)
const KAMPF = [['lichtlande', 'route1', 9, 12, 25], ['flutkueste', 'brisenhafen', 9, 11, 37], ['glutlande', 'glutschlucht', 8, 8, 34], ['frosttundra', 'frostheim', 8, 8, 75],
  ['smaragdwald', 'fluestertal', 10, 10, 96], ['schattenmoor', 'schattmoor', 8, 8, 32], ['himmelsweiten', 'route1', 9, 12, 69], ['kristallgebirge', 'route1', 9, 12, 22]];
const VPS = full ? [[860, 484], [1920, 1080]] : [[860, 484]];
const suf = iter === 'final' ? '' : '_' + iter;
const out = n => new URL(`./${n}${suf}.png`, import.meta.url).pathname;
for (const [w, h] of VPS) {
  const B = await boot({ w, h, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } });
  const { page } = B; const tag = w > 1000 ? '' : '_860';
  await page.evaluate(() => { window.VEYRA_DEMO = 0; });
  if (what === 'kampf' || what === 'alle') for (const [reg, map, x, y, foe] of KAMPF) {
    if (only.length && !only.includes(reg)) continue;
    for (const tz of Object.keys(TIMES)) {
      await scene(page, map, x, y, TIMES[tz]);
      await page.evaluate(r => { window.HY_REGION = ['himmelsweiten', 'kristallgebirge'].includes(r) ? r : null; }, reg);
      await page.waitForTimeout(600);
      await page.evaluate(f => { SET.skipBattleIntro = 1; startBattle({ wild: mk(f, 12) }); }, foe);
      await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 90000 });
      await page.waitForFunction(() => typeof HYB === 'undefined' || HYB.ready || HYB.off, null, { timeout: 30000 }).catch(() => { });
      await page.waitForTimeout(w > 1000 ? 4200 : 2600);
      const info = await page.evaluate(() => ({ calls: BT && BT.r.info.render.calls, tri: BT && BT.r.info.render.triangles, hy: typeof HYB !== 'undefined' ? { on: HYB.on, key: HYB.key, hy: HYB.dbg } : null }));
      const f = out(`hybrid_h2_kampf_${reg}_${tz}${tag}`); await page.screenshot({ path: f, timeout: 180000 }); console.log(f.split('/').pop(), JSON.stringify(info));
      if (process.argv.includes('posen') && tz === 'tag') { // Kamera-Posen: Attackenwahl (eigene Kreatur) und Treffer beim Gegner – Horizont muss mitlaufen
        await page.click('#bMenu .big.k1'); await page.waitForTimeout(2200); const g = out(`hybrid_h2_kampf_${reg}_${tz}_me${tag}`); await page.screenshot({ path: g }); console.log(g.split('/').pop(), JSON.stringify(await page.evaluate(() => HYB.dbg)));
        await page.evaluate(() => camFocus('foe', 6000)); await page.waitForTimeout(2200); const h2 = out(`hybrid_h2_kampf_${reg}_${tz}_foe${tag}`); await page.screenshot({ path: h2 }); console.log(h2.split('/').pop(), JSON.stringify(await page.evaluate(() => HYB.dbg)));
        await page.click('#bMenu .back').catch(() => { }); }
      await page.evaluate(() => { try { endBattle('run'); } catch (e) { } window.HY_REGION = null; });
    }
  }
  if (what === 'ort' || what === 'alle') for (const [map, x, y, tz] of [['brisenhafen', 9, 11, 'tag'], ['glutschlucht', 8, 8, 'abend'], ['frostheim', 8, 8, 'tag'], ['schattmoor', 8, 8, 'nacht'], ['morgenau', 9, 7, 'tag'], ['fluestertal', 10, 10, 'abend']]) {
    if (only.length && !only.includes(map)) continue;
    await page.evaluate(() => { window.VEYRA_HY = 1; HYP.cur = null; HYP.last = {}; HYP.shownAt = 0; HYC.at = 0; HYP.hold = 1; });
    await scene(page, map, x, y, TIMES[tz]);
    await page.waitForFunction(() => HYP.shown, null, { timeout: 20000 }).catch(() => { });
    await page.waitForTimeout(2600);
    const f = out(`hybrid_h2_ort_${map}_${tz}${tag}`); await page.screenshot({ path: f }); console.log(f.split('/').pop(), await page.evaluate(() => typeof HYP !== 'undefined' ? JSON.stringify({ src: HYP.lastKey }) : ''));
    await page.evaluate(() => { if (typeof HYP !== 'undefined') { HYP.hold = 0; hyPlaceClose && hyPlaceClose(); } });
    await page.waitForTimeout(900);
  }
  if (what === 'kapitel' || what === 'alle') for (const n of [1, 3, 5, 8, 9, 10]) {
    if (only.length && !only.includes('k' + n)) continue;
    await page.evaluate(n => { window.VEYRA_HY = 1; HYC.hold = 1; hyChapterShow(n, { force: 1 }); }, n);
    await page.waitForFunction(() => HYC.shown, null, { timeout: 20000 }).catch(() => { });
    await page.waitForTimeout(3000);
    const f = out(`hybrid_h2_kapitel_k${n}_bild${tag}`); await page.screenshot({ path: f }); console.log(f.split('/').pop());
    await page.evaluate(() => { HYC.hold = 0; hyChapterClose(); }); await page.waitForTimeout(800);
  }
  if (B.errs.length) console.log('Fehler:', B.errs.slice(0, 6));
  await B.close();
}
