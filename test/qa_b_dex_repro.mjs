// QA Loop B3 – Dex-Bug-Repro (echter Browserpfad über art_serve, ohne preloadArt-Vorwärmen).   node test/qa_b_dex_repro.mjs [W H]
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const W = +process.argv[2] || 1180, H = +process.argv[3] || 820;
const S = await serve();
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.goto(S.url + 'index.html', { waitUntil: 'load' });
await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForTimeout(300);
await p.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; SET.btl = 'runde'; });
console.log('status', await p.evaluate(() => ({ mode, team: G.team.length, dex: Object.keys(G.dex.caught), art: Object.keys(window.ART_SRC || {}).length })));
const id = 27;
await p.evaluate(id => { startBattle({ wild: mk(id, 3) }); }, id);
await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 60000 }).catch(e => console.log('no menu', e.message));
console.log('imgsLoaded before catch', await p.evaluate(id => ({ ready: artReady(id), cached: !!ART_IMG[id] }), id));
await p.evaluate(id => { const f = B.foe[B.fi]; f.hp = 1; window.__c = tryCatch('kapsel'); }, id);
await p.waitForFunction(() => !B || !!document.querySelector('.cc, .catchCard, #catchCard'), null, { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(500);
console.log('after catch', await p.evaluate(id => ({ mode, B: !!B, caught: G.dex.caught[id], dexNew: G.dexNew, cards: [...document.querySelectorAll('.cc,.catchCard,#catchCard')].length })));
await p.screenshot({ path: new URL('./qa_b_dex_1_fang.png', import.meta.url).pathname });
// Weg des Spielers: Karte wegtippen, Kampf zu Ende, Dex öffnen
for (let i = 0; i < 40; i++) { const st = await p.evaluate(() => ({ B: !!B, mode })); if (!st.B) break; await p.evaluate(() => { try { document.querySelector('.cc,.catchCard,#catchCard')?.click(); document.querySelector('#msg,#bMsg')?.click(); TW && TW.finish && TW.finish(); } catch (e) {} }); await p.waitForTimeout(300); }
console.log('after battle', await p.evaluate(() => ({ mode, B: !!B })));
await p.evaluate(() => { openMenu('dex'); });
for (const t of [50, 300, 1500]) { await p.waitForTimeout(t); console.log('dex t+', t, await p.evaluate(id => { const m = document.querySelector('#menu'); const bd = document.querySelector('#mBody'); const r = bd.getBoundingClientRect(); return { menuHidden: m.hidden, bodyKids: bd.children.length, dx: document.querySelectorAll('#mBody .dx').length, got: document.querySelectorAll('#mBody .dx.got').length, h: Math.round(r.height), imgsOk: [...bd.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth).length + '/' + bd.querySelectorAll('img').length }; }, id)); }
await p.screenshot({ path: new URL('./qa_b_dex_2_liste.png', import.meta.url).pathname });
// Detailseite der gefangenen Art
await p.evaluate(id => { const ds = [...document.querySelectorAll('#mBody .dx')]; ds[id - 1].click(); }, id);
await p.waitForTimeout(600);
console.log('detail', await p.evaluate(() => { const bd = document.querySelector('#mBody'); return { kids: bd.children.length, html: bd.innerHTML.slice(0, 200), h: Math.round(bd.getBoundingClientRect().height) }; }));
await p.screenshot({ path: new URL('./qa_b_dex_3_detail.png', import.meta.url).pathname });
console.log('ERRS', errs.slice(0, 15));
await b.close(); S.close();
