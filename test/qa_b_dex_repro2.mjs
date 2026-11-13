// QA Loop B3 – Dex-Bug-Repro 2: realer Spielerweg (Kampf → Fang über Tasche/Kapsel → Karte weg → Menü per Taste → Tab „Dex“ klicken), mehrere Viewports.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const S = await serve();
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [W, H, sp] of (process.env.VPS ? JSON.parse(process.env.VPS) : [[860, 400, 2], [390, 844, 59]])) {
  const p = await b.newPage({ viewport: { width: W, height: H } }); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.route(/cdnjs\.cloudflare\.com.*three/, r => r.fulfill({ path: new URL('../dist/three.min.js', import.meta.url).pathname, contentType: 'text/javascript' }));
  await p.addInitScript(() => { window.__gl = { n: 0, lost: 0 }; const gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { const c = gc.call(this, t, ...a); if (c && /webgl/.test(t) && !this.__t) { this.__t = 1; window.__gl.n++; this.addEventListener('webglcontextlost', () => { window.__gl.lost++; }); } return c; }; });
  await p.goto(S.url + (process.env.PAGE || 'index.html'), { waitUntil: 'load' });
  await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; SET.btl = 'runde'; G.team.push(mk(1, 8)); G.bag.kapsel = 9; G.bag.ultra = 3; });
  if (process.env.VIEW) await p.evaluate(v => { setView(v); }, process.env.VIEW); await p.waitForTimeout(1500);
  if (process.env.DEMO) await p.evaluate(() => { window.VEYRA_DEMO = 1; });
  await p.evaluate(id => startBattle({ wild: mk(id, 3) }), sp);
  await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 90000 });
  await p.evaluate(() => { B.foe[B.fi].hp = 1; });
  // Kapsel über echte UI: Tasche → Kapsel
  const btns = await p.evaluate(() => [...document.querySelectorAll('#bMenu button')].map(x => x.textContent.trim().slice(0, 20)));
  console.log(W + 'x' + H, 'menu', btns);
  await p.evaluate(() => { const t = [...document.querySelectorAll('#bMenu button')].find(x => /Tasche|Beutel|Item/i.test(x.textContent)); t && t.click(); });
  await p.waitForTimeout(600);
  const items = await p.evaluate(() => [...document.querySelectorAll('#bMenu button')].map(x => x.textContent.trim().slice(0, 30)));
  console.log('items', items);
  await p.evaluate(() => { const t = [...document.querySelectorAll('#bMenu button')].find(x => /Kapsel/i.test(x.textContent)); t && t.click(); });
  await p.waitForFunction(() => document.querySelector('#bCard .cc'), null, { timeout: 120000 }).catch(() => console.log('keine Fangkarte'));
  console.log('card', await p.evaluate(() => ({ mode, caught: Object.keys(G.dex.caught), card: !!document.querySelector('#bCard .cc'), cardHidden: document.querySelector('#bCard').hidden })));
  await p.waitForTimeout(1200); await p.screenshot({ path: new URL(`./qa_b_dex2_${W}_card.png`, import.meta.url).pathname });
  for (let i = 0; i < 40; i++) { if (!(await p.evaluate(() => !!B))) break; await p.evaluate(() => { document.querySelector('#bCard')?.click(); TW && TW.finish && TW.finish(); }); await p.waitForTimeout(400); }
  await p.waitForTimeout(800);
  console.log('after', await p.evaluate(() => ({ mode, B: !!B, bcardHidden: document.querySelector('#bCard').hidden, battleHidden: document.querySelector('#battle').hidden })));
  await p.waitForTimeout(+process.env.WAIT || 0);
  console.log('world-state', await p.evaluate(() => ({ mode, call: !document.querySelector('#callOv').hidden, callHtml: document.querySelector('#callOv').innerHTML.length, dlg: !document.querySelector('#dlg').hidden, flags: G.flags.call_first })));
  await p.screenshot({ path: new URL(`./qa_b_dex2_${W}_world.png`, import.meta.url).pathname });
  if (process.env.DEMO) { await p.evaluate(() => { const o = document.querySelector('.clOk'); o && o.click(); }); for (let i = 0; i < 30; i++) { const m = await p.evaluate(() => mode); if (m === 'world') break; await p.evaluate(() => { TW && TW.finish && TW.finish(); advDlg(); }); await p.waitForTimeout(250); } console.log('nach Ruf', await p.evaluate(() => ({ mode, call: !document.querySelector('#callOv').hidden, dlg: !document.querySelector('#dlg').hidden }))); }
  await p.evaluate(() => pressB()); await p.waitForTimeout(700);
  console.log('menu-open', await p.evaluate(() => ({ mode, menuHidden: document.querySelector('#menu').hidden })));
  await p.click('#tabs button[data-t="dex"]');
  for (const t of [30, 200, 800, 2500]) { await p.waitForTimeout(t); await p.screenshot({ path: new URL(`./qa_b_dex2_${W}_dex_${t}.png`, import.meta.url).pathname }); console.log('t', t, await p.evaluate(() => { const bd = document.querySelector('#mBody'), cs = getComputedStyle(bd), m = getComputedStyle(document.querySelector('#menu')); return { kids: bd.children.length, op: cs.opacity, vis: cs.visibility, mop: m.opacity, h: Math.round(bd.getBoundingClientRect().height), dx: bd.querySelectorAll('.dx').length }; })); }
  console.log('GL', await p.evaluate(() => window.__gl));
  console.log('ERRS', [...new Set(errs)].slice(0, 6)); await p.close();
}
await b.close(); S.close();
