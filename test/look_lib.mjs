// Look L1 – gemeinsame Test-Hilfen (Start bis Welt, Szenen laden). Nutzt test/art_serve.mjs.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
export async function boot({ w = 860, h = 400, cpu = 1, set = {} } = {}) {
  const S = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  await page.addInitScript(s => { try { const o = JSON.parse(localStorage.getItem('veyra_set') || '{}'); localStorage.setItem('veyra_set', JSON.stringify(Object.assign(o, s))); } catch (e) { } }, set);
  await page.goto(S.url + 'index.html', { waitUntil: 'load' });
  await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
  await page.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; G.team.push(mk(1, 12)); G.team.push(mk(4, 12)); });
  if (cpu > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  return { S, browser, page, errs, close: async () => { await browser.close(); S.close(); } };
}
export async function scene(page, map, x, y, time) {
  await page.evaluate(([m, x, y, t]) => { if (typeof B !== 'undefined' && B) { try { endBattle('run'); } catch (e) { } } mode = 'world'; if (t != null) G.time = t; if (view === '2d') setView('third', 1); loadMap(m, x, y); }, [map, x, y, time]);
}
