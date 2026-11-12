// QA Phase 2 – gemeinsame Hilfen (beginGame statt Intro; webdriver-Schalter optional)
import { chromium } from 'playwright';
export async function boot({ W = { width: 420, height: 860 }, webdriver, start = true } = {}) {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: W, deviceScaleFactor: 1 });
  const errs = [], fails = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /THREE/.test(m.text()))) errs.push(m.type() + ': ' + m.text()); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  if (webdriver !== undefined) await p.addInitScript(v => Object.defineProperty(navigator, 'webdriver', { get: () => v }), webdriver);
  await p.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
  const ev = c => p.evaluate(c), Wt = ms => p.waitForTimeout(ms);
  const ok = (name, cond, info) => { console.log((cond ? '✓ ' : '✗ ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!cond) fails.push(name); return !!cond; };
  const closeDlg = async () => { for (let i = 0; i < 8 && await ev("mode==='dialog'"); i++) { await ev('TW&&TW.finish&&TW.finish();advDlg()'); await Wt(60); } };
  if (start) {
    await p.click('#iPrompt'); await Wt(400); await p.click('#iSkip'); await Wt(900);
    await ev("beginGame({},true)"); await Wt(300); await closeDlg();
    await ev("document.querySelectorAll('#intro,#title').forEach(e=>e.hidden=true);mode='world';G.team=[mk(4,12)];G.flags.starter=1;VILL.list=[];SET.btl='runde';SET.res='720'"); await Wt(200); await closeDlg();
  }
  return { b, p, errs, fails, ev, Wt, ok, closeDlg };
}
export const done = async (t) => { console.log('\n' + (t.errs.length || t.fails.length ? ['Fehler:', ...t.errs, ...t.fails.map(f => 'FAIL ' + f)].join('\n') : 'Keine Fehler.')); await t.b.close(); };
