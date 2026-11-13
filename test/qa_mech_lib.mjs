// QA Mechanik – gemeinsame Hilfen (Boot über den echten Titel-Pfad, http über art_serve.mjs).
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync, appendFileSync } from 'fs';
export const here = n => n.startsWith('/') ? n : new URL('./' + n, import.meta.url).pathname;
export const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver|ReadPixels/;
export async function start(opts = {}) {
  const S = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=1024', ...(opts.args || [])] });
  return { S, browser, close: async () => { await browser.close(); S.close(); } };
}
// Neue Seite; flags: window-Flags vor dem Laden (VEYRA_DEMO, VEYRA_ENC, VEYRA_OPEN, VEYRA_HY, VEYRA_VIDEO, VEYRA_OPEN_T)
export async function page(env, { w = 860, h = 484, url = 'index.html', flags = {}, dpr = 1 } = {}) {
  const p = await env.browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  p.setDefaultTimeout(15000); p.setDefaultNavigationTimeout(180000); p.errs = [];
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 200)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.addInitScript(f => { for (const k in f) window[k] = f[k]; }, flags);
  await p.goto(env.S.url + url, { waitUntil: 'load' });
  return p;
}
// Titel überspringen → Neues Spiel (Webdriver-Pfad: Film übersprungen) → Intro-Dialoge durchtippen → Spielstand setzen
export async function newGame(p, { team = [[1, 8]], view = '2d', setup = '' } = {}) {
  try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(500);
  try { await p.click('#iSkip', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(900);
  await p.click('#tNew'); await p.waitForTimeout(400);
  await p.evaluate(([team, view, setup]) => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; G.flags.firstcatch = 1; SET.skipBattleIntro = 1; SET.btl = 'runde';
    G.team = team.map(([s, l]) => mk(s, l)); if (setup) (0, eval)(setup); setView && setView(view); mode = 'world'; }, [team, view, setup]);
  await p.waitForTimeout(view === '2d' ? 200 : 1200);
}
export const goMap = (p, map, x, y, dir = 'up') => p.evaluate(([m, x, y, d]) => { if (typeof bmClose === 'function' && BM && BM.open) bmClose(); loadMap(m, x, y); P.dir = d; for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world'; }, [map, x, y, dir]);
export function reporter(file, title) {
  const R = { ok: 0, bad: 0, rows: [] };
  R.t = (n, c, info) => { const ok = !!c; ok ? R.ok++ : R.bad++; R.rows.push({ n, ok, info }); console.log((ok ? '✓ ' : '✗ ') + n + (ok || info === undefined ? '' : ' → ' + (typeof info === 'string' ? info : JSON.stringify(info)).slice(0, 400)));
    try { appendFileSync(here(file), (ok ? '✓ ' : '✗ ') + n + (info !== undefined && !ok ? ' → ' + (typeof info === 'string' ? info : JSON.stringify(info)).slice(0, 300) : '') + '\n'); } catch (e) { } };
  R.note = s => { console.log('  ' + s); try { appendFileSync(here(file), '  ' + s + '\n'); } catch (e) { } };
  try { writeFileSync(here(file), '# ' + title + '\n'); } catch (e) { }
  return R;
}
