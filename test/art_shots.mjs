// Screenshots Loop A2 (Sprites & Modelle): node test/art_shots.mjs [name…]
// Erzeugt je Motiv 390x844 (test/art_<name>.png) und 860x400 (test/art_<name>_860.png):
// sprites (3D-Welt, ≥ 5 Sprite-Kreaturen + Begleiter, Draw-Calls eingeblendet) · battle3d · battle2d · dex (Liste | Detail | Legende gerahmt) · catch (Fang-Karte) · starter (Starterwahl)
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const only = process.argv.slice(2), want = n => !only.length || only.includes(n);
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = n => new URL('./' + n, import.meta.url).pathname, errs = [], info = {};
const frames = (p, n) => p.evaluate(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
async function boot(W, H) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(async () => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } await preloadArt(); G.flags.starter = 1; G.time = 10 * 60; SET.skipBattleIntro = 1; });
  return p;
}
const close = p => p.evaluate(() => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
// Overlay mit Messwerten (oben mittig, gut lesbar)
const badge = (p, t) => p.evaluate(t => { let d = document.getElementById('artBadge'); if (!d) { d = document.createElement('div'); d.id = 'artBadge'; d.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:8px;z-index:99999;padding:6px 12px;border-radius:999px;background:rgba(16,20,40,.82);color:#fff;font:600 13px/1.2 system-ui,sans-serif;white-space:nowrap'; document.body.appendChild(d); } d.textContent = t; }, t);
const scenes = {
  async sprites(p, tag) {
    await p.evaluate(() => { G.team = [mk(13, 14), mk(1, 9)]; loadMap('route1', 9, 12); P.dir = 'up'; P.ang = 0; setView('third', true); });
    await close(p); await frames(p, 4);
    await p.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; const L = [[25, -1, -1, 'right'], [28, 1, -1, 'left'], [10, -2, -2, 'down'], [72, 1, -2, 'left'], [46, 2, -2, 'down'], [90, -2, -3, 'right'], [84, 0, -3, 'down']];
      L.forEach(([s, dx, dy, dir], i) => { const x = P.x + dx, y = P.y + dy; ROAM.list.push({ s, l: 5, x, y, px: x, py: y, fx: x, fy: y, t: 1, dir, next: performance.now() + 1e6, st: 'idle', stT: 0, nat: 'neutral', owl: true, shiny: i === 1, o: { shiny: i === 1 } }); }); compReset(); });
    await frames(p, 40); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ calls: R3.r.info.render.calls, spr: R3.scene.userData.spr ? R3.scene.userData.spr.n : 0, mons: R3.scene.userData.mm.size }));
    info['sprites_' + tag] = r; await badge(p, `Draw-Calls ${r.calls} · ${r.spr} Sprites (inkl. Begleiter) · 1 Atlas`); await frames(p, 2);
  },
  async battle3d(p) {
    await p.evaluate(() => { G.team = [mk(13, 14)]; loadMap('route1', 9, 12); setView('third', true); });
    await close(p); await p.evaluate(() => { startBattle({ wild: mk(25, 12) }); });
    await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 30000 }); await p.waitForTimeout(2400); await frames(p, 20);
    info.battle3d = await p.evaluate(() => ({ calls: BT.r.info.render.calls, foe: BT.foe.userData.sprite ? 'sprite' : 'proc', me: BT.me.userData.sprite ? 'sprite' : 'proc' }));
  },
  async battle2d(p) {
    await p.evaluate(() => { G.team = [mk(13, 14)]; SET.b2d = 'bild'; loadMap('route1', 9, 12); setView('2d', true); });
    await close(p); await p.evaluate(() => { startBattle({ wild: mk(28, 12) }); });
    await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 30000 }); await p.waitForTimeout(2400); await frames(p, 10);
  },
  async catch(p) {
    await p.evaluate(() => { G.team = [mk(13, 14)]; G.bag.meister = 2; loadMap('route1', 9, 12); setView('third', true); });
    await close(p); await p.evaluate(() => { startBattle({ wild: mk(19, 8) }); });
    await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 30000 });
    // Fang-Karte direkt zeigen (der volle 3D-Fangablauf ist unter Software-WebGL sehr langsam; er läuft im Smoke-Test)
    await p.evaluate(() => { const m = B.foe[0], sc = showCard; B.caught = 1; showCard = (h, c) => sc(h, c, 120000); catchCard(m, true); showCard = sc; });
    await p.waitForFunction(() => !!document.querySelector('#bCard:not([hidden]) .cc'), null, { timeout: 20000, polling: 50 });
    await p.waitForTimeout(1300);
  },
  async starter(p) {
    await p.evaluate(() => { G.flags.starter = 0; G.team = []; G.ret = { map: 'morgenau', x: 7, y: 11 }; loadMap('labor'); P.x = P.px = 5; P.y = P.py = 5; P.dir = 'up'; setView('2d', true); });
    await close(p); await p.evaluate(() => { interact(); }); await p.waitForTimeout(900);
  },
  async dex(p, tag) {
    await p.evaluate(() => { G.team = [mk(13, 14)]; for (let i = 1; i < MONS.length; i++) { G.dex.seen[i] = 1; if (i % 3 || MONS[i].legend || MONS[i].myth) G.dex.caught[i] = 1; } loadMap('route1', 9, 12); setView('2d', true); });
    await close(p); const shots = [];
    await p.evaluate(() => { openMenu('dex'); }); await p.waitForTimeout(700);
    await p.evaluate(() => { const g = document.querySelectorAll('.dex .dx'); g[135] && g[135].scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(500); shots.push(await p.screenshot());
    await p.evaluate(() => { document.querySelectorAll('.dex .dx')[12].click(); }); await p.waitForTimeout(800); shots.push(await p.screenshot());
    await p.evaluate(() => { renderMenu(); }); await p.waitForTimeout(300); await p.evaluate(() => { document.querySelectorAll('.dex .dx')[139].click(); }); await p.waitForTimeout(900); shots.push(await p.screenshot());
    return shots;
  }
};
async function stitch(bufs, W, H, vertical, file) {
  const p = await browser.newPage({ viewport: vertical ? { width: W, height: H * bufs.length + 8 * (bufs.length - 1) } : { width: W * bufs.length + 8 * (bufs.length - 1), height: H } });
  await p.setContent(`<body style="margin:0;background:#20263a;display:flex;gap:8px;flex-direction:${vertical ? 'column' : 'row'}">${bufs.map(b => `<img src="data:image/png;base64,${b.toString('base64')}" style="display:block">`).join('')}</body>`);
  await p.waitForTimeout(200); await p.screenshot({ path: out(file), fullPage: true }); await p.close();
}
for (const name of Object.keys(scenes)) {
  if (!want(name)) continue;
  for (const [W, H, tag] of [[390, 844, ''], [860, 400, '_860']]) {
    let p; try {
      p = await boot(W, H); const r = await scenes[name](p, tag || '_390');
      if (Array.isArray(r)) await stitch(r, W, H, W > H, 'art_' + name + tag + '.png'); else await p.screenshot({ path: out('art_' + name + tag + '.png') });
      console.log('✓', 'art_' + name + tag + '.png');
    } catch (e) { errs.push(name + tag + ': ' + e.message); console.log('✗', name + tag, e.message); }
    if (p) await p.close();
  }
}
console.log(JSON.stringify(info));
console.log(errs.length ? errs.join('\n') : 'Keine Fehler.');
await browser.close(); S.close();
