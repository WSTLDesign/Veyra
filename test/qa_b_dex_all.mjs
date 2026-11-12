// QA Loop B3 – Dex-Bug: jede Art einzeln als einziger Fang → Dex-Liste + Detailseite rendern, Fehler sammeln.   node test/qa_b_dex_all.mjs
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const S = await serve();
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1180, height: 820 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); });
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.goto(S.url + 'index.html', { waitUntil: 'load' });
await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForTimeout(300);
await p.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; });
const res = await p.evaluate(async () => {
  const out = [];
  for (let i = 1; i < MONS.length; i++) {
    const r = { id: i, art: hasArt(i) };
    try {
      G.dex.caught = {}; G.dex.seen = {}; G.dex.caught[i] = G.dex.seen[i] = 1; tab = 'dex'; mode = 'menu'; openMenu('dex');
      const bd = document.querySelector('#mBody'); r.list = bd.querySelectorAll('.dx').length; r.imgs = bd.querySelectorAll('.dx.got img, .dx.got canvas').length;
      const cell = bd.querySelectorAll('.dx')[i - 1]; cell.click();
      r.detail = !!bd.querySelector('.dtop'); r.dimg = bd.querySelectorAll('.dtop img, .dtop canvas').length;
    } catch (e) { r.err = e.message + ' @' + (e.stack || '').split('\n')[1]; }
    out.push(r);
  }
  return out;
});
const bad = res.filter(r => r.err || !r.detail || !r.imgs || r.list !== 153 || !r.dimg);
console.log('Arten', res.length, 'auffällig', bad.length); console.log(JSON.stringify(bad.slice(0, 40)));
console.log('ERRS', [...new Set(errs)].slice(0, 20));
await b.close(); S.close();
