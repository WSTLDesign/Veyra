// QA Look L3 – UI-Prüfung (Ruhe, Kontrast ≥ 4,5:1, Touch ≥ 48 px, Überlappungen) je Szene und Größe + Screenshots (test/look_ui_<szene>_<größe>_l3.png)
// Aufruf: node build.mjs && node test/qa_look_ui.mjs [h t p] → test/qa_look_ui.json   (L3_ONLY=titel,welt,dialog,kampf,menu)
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { audit } from './qa_look_lib.mjs';
import { writeFileSync } from 'fs';
const args = process.argv.slice(2), want = args.length ? args : ['h', 't', 'p'];
const ONLY = (process.env.L3_ONLY || '').split(',').filter(Boolean), on = n => !ONLY.length || ONLY.includes(n);
const SIZES = { h: [860, 400], t: [1180, 820], p: [390, 844] };
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const png = (n, s) => new URL(`./look_ui_${n}_${s}_l3.png`, import.meta.url).pathname, errs = [], OUT = {};
const frames = (p, n) => p.evaluate(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
async function boot(W, H, title) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.evaluate(() => { SET.portrait = 'allow'; typeof saveSet === 'function' && saveSet(); typeof fsLayout === 'function' && fsLayout(); });
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
const rec = async (p, scene, s, extra) => { const a = await audit(p, { save: png(scene, s), noclip: !!process.env.QA_NOCLIP }); OUT[scene + '_' + s] = Object.assign(a, extra || {}); const f = a.contrast.fail.length, t = a.touch.small.length; console.log(`${scene}_${s}: Touch ${a.touch.n} (klein ${t}) · Kontrast ${a.contrast.n} (min ${a.contrast.min}, Fehler ${f}) · Überlappung ${a.overlap.length} · Überlauf ${a.overflow.length}`); };
for (const s of want) {
  const [W, H] = SIZES[s];
  if (on('titel')) { const p = await boot(W, H, true); await p.waitForTimeout(1500); await frames(p, 4); await rec(p, 'titel', s); await p.close(); }
  const p = await boot(W, H);
  await world(p);
  if (on('welt')) {
    await p.evaluate(() => { cur && mapCard(cur); }); await p.waitForTimeout(1700); await frames(p, 4); await rec(p, 'welt-banner', s);
    await p.waitForTimeout(4200); await frames(p, 4); await rec(p, 'welt', s, { hud: await p.evaluate(() => { const vis = sel => { const e = document.querySelector(sel); if (!e || e.hidden) return 0; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; return +(+cs.opacity).toFixed(2); }; return { hudP: vis('#hudP'), hq: vis('#hq'), mm: vis('#mmW'), view: vis('#viewBtn'), map: vis('#hudMap'), mmBtn: vis('#mmBtn') }; }) });
    await p.evaluate(() => { $('#hudP').click(); }); await p.waitForTimeout(500); await frames(p, 3); await rec(p, 'welt-info', s);
    await p.evaluate(() => { SET.hudDim = 'aus'; document.body.classList.remove('hud-idle'); document.querySelectorAll('.dim').forEach(e => e.classList.remove('dim')); }); await p.waitForTimeout(700); await frames(p, 3); await rec(p, 'welt-aktiv', s);
  }
  if (on('dialog')) {
    await p.evaluate(() => { mode = 'world'; DLG.pend = { fig: 'kael', t: 'trainer' }; say([figSay('kael', 'gruss', 2)]); });
    await p.waitForTimeout(1500); await p.evaluate(() => { TW && TW.finish && TW.finish(); }); await p.waitForTimeout(500); await rec(p, 'dialog', s);
    await close(p); await p.waitForTimeout(200);
    await p.evaluate(() => { mode = 'world'; ask('Möchtest du deine Kreaturen heilen lassen?', ['Ja, bitte!', 'Nein, danke', 'Was ist eine Kreaturenstation?'], () => { }); });
    await p.waitForTimeout(1300); await p.evaluate(() => { TW && TW.finish && TW.finish(); }); await p.waitForTimeout(500); await rec(p, 'dialog-opts', s);
    await p.evaluate(() => { const b = document.querySelector('#dlgOpts button:nth-child(2)'); b && b.click(); }); await close(p); await p.waitForTimeout(300);
  }
  if (on('kampf')) {
    await p.evaluate(() => { mode = 'world'; startBattle({ wild: mk(25, 12) }); });
    await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 60000 }); await p.waitForTimeout(1600); await frames(p, 10);
    await rec(p, 'kampf-start', s);
    await p.click('#bMenu .big.k1'); await p.waitForTimeout(1500); await frames(p, 8); await rec(p, 'kampf-attacken', s);
    await p.click('#bMenu .back'); await p.waitForTimeout(300);
    await p.evaluate(() => { B = null; $('#battle').hidden = true; mode = 'world'; if (typeof camBattleEnd === 'function') camBattleEnd(); });
  }
  if (on('menu')) {
    for (const [t, n] of [['quest', 'chronik'], ['dex', 'dex'], ['team', 'team'], ['game', 'optionen']]) {
      await p.evaluate(t => { if (!$('#menu').hidden) { tab = t; sel = null; renderMenu(); } else openMenu(t); }, t); await p.waitForTimeout(1100); await frames(p, 4); await rec(p, n, s);
    }
    await p.evaluate(() => { rSettings._adv = true; renderMenu(); const d = document.querySelector('details.adv'); d && d.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(700); await frames(p, 3); await rec(p, 'optionen-erweitert', s);
    await p.evaluate(() => { if (!$('#menu').hidden) closeMenu(); });
  }
  await p.close();
}
writeFileSync(new URL('./qa_look_ui.json', import.meta.url), JSON.stringify({ out: OUT, errs }, null, 1));
console.log(errs.length ? 'Fehler:\n' + errs.join('\n') : 'Keine Seitenfehler.');
await browser.close(); S.close();
