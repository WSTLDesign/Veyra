// Look L2 (UI-Reduktion & Kampf-Inszenierung) – Screenshots über test/art_serve.mjs
// Aufruf: node build.mjs && node test/look_ui_shots.mjs [tag] [größe…]   (tag = Präfix-Zusatz, z. B. "v1"; Größen: h t p)
// Erzeugt test/look_ui_<szene>_<größe>[_tag].png für welt, dialog, dialog-opts, kampf-start, kampf-attacken, chronik, dex, team, optionen, titel
//  h = 860×400 (Handy quer) · t = 1180×820 (Tablet) · p = 390×844 (Hochformat erlaubt)
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const args = process.argv.slice(2), tag = args[0] && !/^[htp]$/.test(args[0]) ? args.shift() : '', want = args.length ? args : ['h', 't', 'p'];
const ONLY = (process.env.L2_ONLY || '').split(',').filter(Boolean), on = n => !ONLY.length || ONLY.includes(n);
const SIZES = { h: [860, 400], t: [1180, 820], p: [390, 844] };
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = (n, s) => new URL(`./look_ui_${n}_${s}${tag ? '_' + tag : ''}.png`, import.meta.url).pathname, errs = [], info = {};
const frames = (p, n) => p.evaluate(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
async function boot(W, H, title) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.evaluate(() => { SET.res = '720'; SET.portrait = 'allow'; typeof saveSet === 'function' && saveSet(); typeof fsLayout === 'function' && fsLayout(); });
  await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(900);
  if (title) return p;
  await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(async () => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } try { await preloadArt(); } catch (e) { } G.flags.starter = 1; G.time = 10 * 60; SET.skipBattleIntro = 1; });
  return p;
}
const close = p => p.evaluate(() => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
async function world(p) {
  await p.evaluate(() => { G.team = [mk(13, 14), mk(25, 11), mk(7, 9)]; G.bag.kapsel = 5; G.bag.trank = 3; for (const i of [1, 4, 7, 13, 16, 19, 22, 25, 28, 31, 140]) { G.dex.seen[i] = 1; if (i < 30) G.dex.caught[i] = 1; } loadMap('route1', 9, 12); P.dir = 'up'; P.ang = 0; mode = 'world'; setView('third', true); });
  await close(p); await frames(p, 6);
}
for (const s of want) {
  const [W, H] = SIZES[s];
  // Titel
  if (on('titel')) { const p = await boot(W, H, true); await p.waitForTimeout(1200); await frames(p, 4); await p.screenshot({ path: out('titel', s) }); await p.close(); }
  const p = await boot(W, H);
  await world(p);
  if (on('welt')) { await p.evaluate(() => { cur && mapCard(cur); }); await p.waitForTimeout(1700); await frames(p, 4); await p.screenshot({ path: out('welt-banner', s) });
  await p.waitForTimeout(4200); await frames(p, 4); await p.screenshot({ path: out('welt', s) });
  info['hud_' + s] = await p.evaluate(() => { const vis = sel => { const e = document.querySelector(sel); if (!e || e.hidden) return 0; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; return +(+cs.opacity).toFixed(2); }; return { hudP: vis('#hudP'), hq: vis('#hq'), mm: vis('#mmW'), view: vis('#viewBtn'), map: vis('#hudMap') }; });
  await p.evaluate(() => { $('#hudP').click(); }); await p.waitForTimeout(500); await frames(p, 3); await p.screenshot({ path: out('welt-info', s) }); }
  // Dialog (Figur) und Auswahl
  if (on('dialog')) {
  await p.evaluate(() => { mode = 'world'; DLG.pend = { fig: 'kael', t: 'trainer' }; say([figSay('kael', 'gruss', 2)]); });
  await p.waitForTimeout(1500); await p.evaluate(() => { TW && TW.finish && TW.finish(); }); await p.waitForTimeout(500); await p.screenshot({ path: out('dialog', s) });
  await close(p); await p.waitForTimeout(200);
  await p.evaluate(() => { mode = 'world'; ask('Möchtest du deine Kreaturen heilen lassen?', ['Ja, bitte!', 'Nein, danke', 'Was ist eine Kreaturenstation?'], () => { }); });
  await p.waitForTimeout(1300); await p.evaluate(() => { TW && TW.finish && TW.finish(); }); await p.waitForTimeout(500); await p.screenshot({ path: out('dialog-opts', s) });
  await p.evaluate(() => { const b = document.querySelector('#dlgOpts button:nth-child(2)'); b && b.click(); }); await close(p); await p.waitForTimeout(300); }
  // Kampf
  if (on('kampf')) {
  await p.evaluate(() => { mode = 'world'; startBattle({ wild: mk(25, 12) }); });
  await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 40000 }); await p.waitForTimeout(1600); await frames(p, 10);
  await p.screenshot({ path: out('kampf-start', s) });
  info['kampf_' + s] = await p.evaluate(() => ({ cam: typeof CAM !== 'undefined' ? { mode: CAM.mode, focus: CAM.focus } : null, foeBox: (() => { const r = document.querySelector('#bFoeBox').getBoundingClientRect(); return [r.x | 0, r.y | 0, r.width | 0, r.height | 0]; })() }));
  await p.click('#bMenu .big.k1'); await p.waitForTimeout(1500); await frames(p, 8);
  await p.screenshot({ path: out('kampf-attacken', s) });
  await p.click('#bMenu .back'); await p.evaluate(() => { B.fx = { who: 'foe', t: performance.now(), col: '#ffd166' }; }); await frames(p, 2); await p.evaluate(() => camFocus('foe', 6000)); await p.waitForTimeout(1500); await frames(p, 3);
  await p.screenshot({ path: out('kampf-treffer', s) }); info['treffer_' + s] = await p.evaluate(() => CAM.focus);
  await p.evaluate(() => { B = null; $('#battle').hidden = true; mode = 'world'; if (typeof camBattleEnd === 'function') camBattleEnd(); }); }
  // 2D-Kampf (nur auf Wunsch: L2_ONLY=kampf2d) – muss wie bisher aussehen
  if (ONLY.includes('kampf2d')) {
    await p.evaluate(() => { SET.b2d = 'bild'; mode = 'world'; setView('2d', true); startBattle({ wild: mk(28, 12) }); });
    await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 40000 }); await p.waitForTimeout(1200); await frames(p, 6);
    await p.screenshot({ path: out('kampf2d', s) });
    info['kampf2d_' + s] = await p.evaluate(() => ({ b2d: $('#battle').classList.contains('b2d'), dieg: $('#battle').classList.contains('dieg'), cam: CAM.mode }));
    await p.evaluate(() => { B = null; $('#battle').hidden = true; mode = 'world'; setView('third', true); });
  }
  // Menüs
  if (on('menu')) for (const [t, n] of [['quest', 'chronik'], ['dex', 'dex'], ['team', 'team'], ['game', 'optionen']]) {
    await p.evaluate(t => { if (!$('#menu').hidden) { tab = t; sel = null; renderMenu(); } else openMenu(t); }, t); await p.waitForTimeout(1100); await frames(p, 4);
    await p.screenshot({ path: out(n, s) });
  }
  if (on('menu')) { await p.evaluate(() => { rSettings._adv = true; renderMenu(); const d = document.querySelector('details.adv'); d && d.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(700); await frames(p, 3); await p.screenshot({ path: out('optionen-erweitert', s) }); }
  await p.evaluate(() => { if (!$('#menu').hidden) closeMenu(); });
  await p.close();
}
console.log(JSON.stringify(info, null, 1));
console.log(errs.length ? 'Fehler:\n' + errs.join('\n') : 'Keine Seitenfehler.');
await browser.close(); S.close();
