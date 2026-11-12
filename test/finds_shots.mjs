// Fundstücke – Screenshots 860×484: test/finds_rolle.png (Rolle in der Welt), finds_rolle_lernen.png (Tasche → Lernen),
// finds_versteckt.png (raschelnder Busch + „Da bewegt sich etwas!“), finds_glitzer.png (Spitzenstern + Fundtext).   node build.mjs && node test/finds_shots.mjs
import { boot, scene } from './look_lib.mjs';
const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } });
const { page } = B; const out = n => new URL(`./finds_${n}.png`, import.meta.url).pathname;
const face = d => page.evaluate(d => { P.dir = d; P.ang = YAW[d]; if (R3) { R3.yaw = P.ang; R3.snap = 1; } if (window.INP && INP.camReset) INP.camReset(); ROAM.list.length = 0; }, d);
const talkTo = () => page.evaluate(() => { interact(); for (let i = 0; i < 3; i++) if (TW && TW.finish) TW.finish(); });
let ok = 0, bad = 0; const check = (n, c, i) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, i ?? ''); } };
// Je Fund: aus 2 Feldern Abstand (Blick nach oben) „_welt“, dann davorstellen, aufheben; Fund für das Bild kurz wieder einblenden
const shot = async (map, x, y, flag, name, pre, ox = 1) => {
  await scene(page, map, x + ox, y + 2, 720); await face('up'); await page.waitForTimeout(4500);
  await page.screenshot({ path: out(name + '_welt'), timeout: 240000 });
  await scene(page, map, x, y + 1, 720); await face('up'); if (pre) await page.evaluate(pre); await page.waitForTimeout(2500);
  await talkTo(); await page.waitForTimeout(500);
  const txt = await page.evaluate(() => $('#dlgText').textContent);
  await page.evaluate(([f, x, y, ox]) => { G.flags.__fd = G.flags[f]; G.flags[f] = 0; P.x = P.px = P.fx = x + ox; P.y = P.py = P.fy = y + 2; P.dir = 'up'; if (R3) R3.snap = 1; }, [flag, x, y, ox]); await page.waitForTimeout(1500);
  await page.screenshot({ path: out(name), timeout: 240000 });
  await page.evaluate(f => { G.flags[f] = G.flags.__fd; delete G.flags.__fd; }, flag);
  return txt;
};
// 1) Rolle (Route 1, Rankenschnitt)
let txt = await shot('route1', 1, 11, 'sc_rankenschnitt', 'rolle');
check('Rolle: Fundtext', /Lehrrolle/.test(txt), txt);
await page.evaluate(() => { for (let i = 0; i < 8 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
check('Rolle in der Tasche', await page.evaluate(() => G.bag.rolle_rankenschnitt === 1));
await page.evaluate(() => { try { openMenu('bag'); } catch (e) { console.error(e); } });
await page.waitForTimeout(400);
check('Rubrik „Rollen“', await page.evaluate(() => [...document.querySelectorAll('#mBody h3')].some(h => h.textContent === 'Rollen')));
await page.evaluate(() => { G.team.push(mk(7, 3)); chooseScroll('rolle_rankenschnitt'); }); await page.waitForTimeout(500);
await page.screenshot({ path: out('rolle_lernen'), timeout: 240000 });
check('Lern-Auswahl: Knospi kann es lernen', await page.evaluate(() => !!document.querySelector('#mBody .mon.fd-ok')));
await page.evaluate(() => { try { closeMenu(); } catch (e) { } mode = 'world'; });
// 2) Verstecktes Wesen (Glutschlucht, Glimmo)
await page.evaluate(() => { window.__bt = null; const sb = startBattle; startBattle = o => { window.__bt = o; startBattle = sb; }; });
txt = await shot('glutschlucht', 18, 15, 'hd_glutschlucht2', 'versteckt', null, -1);
check('Versteckt: „Da bewegt sich etwas!“', /Da bewegt sich etwas/.test(txt), txt);
await page.evaluate(() => { for (let i = 0; i < 8 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
check('Versteckt: Kampf mit Glimmo (108)', await page.evaluate(() => !!window.__bt && window.__bt.wild.s === 108));
await page.evaluate(() => { mode = 'world'; });
// 3) Glitzer (Route 4)
txt = await shot('route4', 1, 3, 'it_sx_r4', 'glitzer');
check('Glitzer: „Es glitzert!“', /Es glitzert/.test(txt), txt);
check('Keine Seitenfehler', !B.errs.length, B.errs.slice(0, 4).join(' | '));
await B.close();
console.log(`\n${ok} ✓ / ${bad} ✗`); process.exit(bad ? 1 : 0);
