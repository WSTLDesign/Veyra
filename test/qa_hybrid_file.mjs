// QA Hybrid (Sonnet hoch) – Prüfpunkt 10: file://-Rückfall (dist/index.html ohne Server, ohne --allow-file-access-from-files): Skybox/Kampfbild „verunreinigt“ → bisheriger Hintergrund.
// Aufruf: node build.mjs && node test/qa_hybrid_file.mjs → ✓/✗ auf stdout, Screenshot test/qa_hybrid_flow_file_kampf.png
import { chromium } from 'playwright';
const png = n => new URL(`./qa_hybrid_flow_${n}.png`, import.meta.url).pathname;
let fails = 0; const ok = (n, c, d = '') => { if (!c) fails++; console.log((c ? '✓ ' : '✗ ') + n + (d ? '  [' + d + ']' : '')); };
// ======================= file:// (dist/index.html) – Rückfall ohne Bilder-Textur =======================
{
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const pg = await browser.newPage({ viewport: { width: 860, height: 484 }, deviceScaleFactor: 1 }); const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|net::ERR/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await pg.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await pg.addInitScript(() => { try { localStorage.setItem('veyra_set', JSON.stringify({ res: 'native', gfx: 'high', fps: 0 })); } catch (e) { } });
  await pg.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
  await pg.click('#iPrompt'); await pg.waitForTimeout(400); await pg.click('#iSkip'); await pg.waitForTimeout(800); await pg.click('#tNew'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; G.team.push(mk(1, 12)); ROAM.list.length = 0; ROAM.want = 0; setView('third', 1); });
  await pg.evaluate(() => { mode = 'world'; G.time = 720; loadMap('route1', 9, 12); }); await pg.waitForTimeout(9000);
  const w = await pg.evaluate(() => ({ sky: skyActive(), on: SKY3.on, states: [...SKY3.cache.values()].map(e => e.key + ':' + e.state), dome: R3.dome.visible, calls: R3.r.info.render.calls }));
  ok('G1 file://: Welt läuft, Skybox fällt auf prozeduralen Himmel zurück (Bild verunreinigt)', !w.sky && w.dome === true, JSON.stringify(w));
  await pg.evaluate(() => { startBattle({ wild: mk(25, 12) }); }); await pg.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }); await pg.waitForTimeout(2500);
  const b = await pg.evaluate(() => ({ on: HYB.on, cur: !!HYB.cur, dome: BT.dome.visible, bad: [...HYB.texs.values()].map(t => !!t.bad), calls: BT.r.info.render.calls }));
  ok('G2 file://: Kampf mit altem Hintergrund (Panorama aus, Kuppel an)', !b.on && b.dome === true, JSON.stringify(b)); await pg.screenshot({ path: png('file_kampf') });
  await pg.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; HYP.shownAt = 0; loadMap('brisenhafen', 9, 11); }); await pg.waitForTimeout(3000);
  ok('G3 file://: keine Seitenfehler (Welt, Kampf, Ortswechsel)', errs.length === 0, errs.slice(0, 4).join(' | ')); await browser.close();
}
console.log(`\nFails: ${fails}`); process.exit(fails ? 1 : 0);
