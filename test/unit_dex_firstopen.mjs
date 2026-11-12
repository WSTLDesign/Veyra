// Unit/Browser-Test „Dex beim ersten Öffnen nach einem Fang“ (Nutzer-Bug 10.11. 02:13: weißer Bildschirm). Echter Browserpfad über test/art_serve.mjs (http, nicht file://).
//   node test/unit_dex_firstopen.mjs
// Ursache (Loop B3): beim ersten Öffnen erzeugte rDex für jede gesehene Art OHNE Illustration (48 Arten) synchron ein 3D-Vorschaubild (monThumb → Renderer, ReadPixels, PNG-Kodierung,
//   80–300 ms je Art, auf dem Handy mehr) → Standbild/leere Chronik-Hülle. Fix in src/15-ui.js: Platzhalter (.q.ph) + Bilder je Frame (dexLazy/dexFill); Fehler in Seite/Detail leeren das Blatt nicht mehr.
// Geprüft: (1) Fang echt über Tasche → Dex per Taste + Tab, Liste + Detail, mit Art (59), ohne Art (2), Legende/Key-Art; (2) Blockierzeit des Öffnens (4× CPU) mit 5 bildlosen Arten;
//   (3) alle Zellen bekommen ihr Bild (kein Platzhalter bleibt); (4) Detailseite jeder Art (alle 153) rendert; (5) 2D- und 3D-Ansicht; (6) Fehler in viewer3d/rDex → Rückfall statt leerer Seite; (7) keine console.error/pageerror.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
let ok = 0, bad = 0;
const t = (n, c, info) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, info !== undefined ? '– ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''); } };
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = n => new URL('./' + n, import.meta.url).pathname;
const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver/;

async function boot(vp, view) {
  const p = await browser.newPage({ viewport: vp }); p.errs = [];
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 160)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(v => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; SET.btl = 'runde'; G.team.push(mk(1, 8)); G.bag.kapsel = 9; if (v !== '2d') setView(v); }, view);
  await p.waitForTimeout(view === '2d' ? 200 : 1500);
  return p;
}
// Fang über die echte Oberfläche (Tasche → Fangkapsel), Karte wegtippen, bis die Welt wieder da ist
async function catchReal(p, id) {
  await p.evaluate(id => startBattle({ wild: mk(id, 3) }), id);
  await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 });
  await p.evaluate(() => { B.foe[B.fi].hp = 1; });
  await p.evaluate(() => { [...document.querySelectorAll('#bMenu button')].find(x => /Tasche/i.test(x.textContent)).click(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { [...document.querySelectorAll('#bMenu button')].find(x => /Fangkapsel/i.test(x.textContent)).click(); });
  await p.waitForFunction(() => document.querySelector('#bCard .cc'), null, { timeout: 150000 });
  for (let i = 0; i < 40 && await p.evaluate(() => !!B); i++) { await p.evaluate(() => { document.querySelector('#bCard') && document.querySelector('#bCard').click(); TW && TW.finish && TW.finish(); }); await p.waitForTimeout(350); }
  await p.waitForTimeout(500);
  return p.evaluate(id => !!G.dex.caught[id] && !B && mode === 'world', id);
}
const dexState = p => p.evaluate(() => { const bd = document.querySelector('#mBody'), r = bd.getBoundingClientRect(), got = [...bd.querySelectorAll('.dx.got')];
  const cx = r.left + r.width / 2, cy = r.top + Math.min(r.height, 200) / 2, top = document.elementFromPoint(cx, cy);
  return { menu: !document.querySelector('#menu').hidden, kids: bd.children.length, cells: bd.querySelectorAll('.dx').length, got: got.length, ph: bd.querySelectorAll('.ph').length, text: bd.textContent.trim().length,
    pics: got.filter(c => { const e = c.querySelector('img,canvas'); return e && e.getBoundingClientRect().height > 8; }).length, onTop: !!(top && top.closest('#menu')), h: Math.round(r.height) }; });
async function openDexUI(p) { await p.evaluate(() => pressB()); await p.waitForTimeout(700); await p.click('#tabs button[data-t="dex"]'); }

for (const [vp, view, tag] of [[{ width: 860, height: 400 }, '2d', '860×400 2D-Welt'], [{ width: 1180, height: 820 }, 'third', '1180×820 3D-Welt']]) {
  const p = await boot(vp, view);
  // ---- 1) Fang Art mit Bild (59) und Art ohne Bild (2) → erstes Öffnen
  for (const [id, label] of [[59, 'mit Illustration (059)'], [2, 'ohne Illustration (002, 3D-Vorschau)']]) {
    const caught = await catchReal(p, id); t(`[${tag}] Fang ${label}: im Dex eingetragen, Welt wieder aktiv`, caught);
    await openDexUI(p);
    let st; for (let i = 0; i < 40; i++) { st = await dexState(p); if (st.menu && st.pics >= st.got && !st.ph) break; await p.waitForTimeout(250); }
    t(`[${tag}] Dex ${label}: Liste sichtbar (153 Zellen, Text vorhanden, Inhalt liegt oben, kein weißes Blatt)`, st.menu && st.cells === 153 && st.text > 50 && st.onTop && st.h > 100, st);
    t(`[${tag}] Dex ${label}: jede gefangene Art zeigt ein Bild (kein Platzhalter bleibt)`, st.got >= 1 && st.pics === st.got && st.ph === 0, st);
    await p.screenshot({ path: out(`unit_dex_firstopen_${vp.width}_${id}_liste.png`) });
    await p.evaluate(id => { document.querySelectorAll('#mBody .dx')[id - 1].click(); }, id); await p.waitForTimeout(700);
    const dt = await p.evaluate(() => { const bd = document.querySelector('#mBody'); return { dtop: !!bd.querySelector('.dtop'), pic: !!bd.querySelector('.dtop img,.dtop canvas'), back: !!bd.querySelector('.back'), text: bd.textContent.length }; });
    t(`[${tag}] Dex-Detail ${label}: Bild, Name/Beschreibung und „Zurück“ vorhanden`, dt.dtop && dt.pic && dt.back && dt.text > 20, dt);
    await p.screenshot({ path: out(`unit_dex_firstopen_${vp.width}_${id}_detail.png`) });
    await p.evaluate(() => { document.querySelector('#mBody .back').click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => closeMenu()); await p.waitForTimeout(600);
  }
  t(`[${tag}] keine console.error/pageerror (Fang → Dex → Detail)`, p.errs.length === 0, p.errs.slice(0, 4));
  await p.close();
}

// ---- 2) Blockierzeit beim ersten Öffnen mit vielen bildlosen Arten (4× CPU, frische Seite = leerer Vorschau-Cache), Bilder kommen danach alle an
{
  const p = await boot({ width: 860, height: 400 }, '2d'); const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const ids = [62, 99, 108, 120, 139, 2, 3, 5, 6]; // alle ohne Bild
  const noArt = await p.evaluate(ids => ids.filter(i => !hasArt(i)), ids);
  const r = await p.evaluate(ids => { G.dex.seen = {}; G.dex.caught = {}; ids.forEach(i => { G.dex.seen[i] = G.dex.caught[i] = 1; }); const n0 = Object.keys(THUMB).length, t0 = performance.now(); openMenu('dex'); return { ms: Math.round(performance.now() - t0), made: Object.keys(THUMB).length - n0 }; }, ids);
  t(`4× CPU: Öffnen mit ${noArt.length} bildlosen Arten blockiert < 250 ms (vorher ≈ 0,3 s je Art) und erzeugt dabei keine 3D-Vorschaubilder`, noArt.length === ids.length && r.ms < 250 && r.made === 0, r);
  let st; for (let i = 0; i < 80; i++) { st = await dexState(p); if (!st.ph) break; await p.waitForTimeout(250); }
  t('… danach ersetzt jeder Platzhalter sein Bild (alle 9 Zellen mit Bild)', st.ph === 0 && st.pics === ids.length, st);
  t('Schließen/Wechseln der Seite während des Nachladens bricht sauber ab (kein Fehler)', await (async () => { await p.evaluate(() => { G.dex.seen = {}; G.dex.caught = {}; [62, 99, 108, 120].forEach(i => { G.dex.seen[i] = G.dex.caught[i] = 1; }); renderMenu(); tab = 'quest'; renderMenu(); closeMenu(); }); await p.waitForTimeout(1500); return p.errs.length === 0; })(), p.errs);
  await p.close();
}

// ---- 3) Detailseite aller 153 Arten (je als gefangen) rendert Bild + Text; Liste mit allen gesehen/gefangen
{
  const p = await boot({ width: 1180, height: 820 }, '2d');
  const r = await p.evaluate(async () => {
    const bad = []; for (let i = 1; i < MONS.length; i++) { try { G.dex.seen = {}; G.dex.caught = {}; G.dex.seen[i] = G.dex.caught[i] = 1; openMenu('dex'); const bd = document.querySelector('#mBody'); bd.querySelectorAll('.dx')[i - 1].click(); if (!bd.querySelector('.dtop') || !bd.querySelector('.dtop img,.dtop canvas') || !bd.querySelector('.back')) bad.push(i + ':leer'); } catch (e) { bad.push(i + ':' + e.message); } }
    G.dex.seen = {}; G.dex.caught = {}; for (let i = 1; i < MONS.length; i++) G.dex.seen[i] = G.dex.caught[i] = 1; openMenu('dex'); const bd = document.querySelector('#mBody');
    return { bad, cells: bd.querySelectorAll('.dx.got').length, ph: bd.querySelectorAll('.ph').length }; });
  t('Detailseite aller 153 Arten rendert (Bild + „Zurück“)', r.bad.length === 0, r.bad.slice(0, 8));
  t('Liste mit allen 153 gefangen: alle Zellen da, bildlose zunächst als Platzhalter', r.cells === 153 && r.ph > 0 && r.ph <= 60, r);
  let st; for (let i = 0; i < 400; i++) { st = await dexState(p); if (!st.ph) break; await p.waitForTimeout(250); }
  t('… und am Ende hat jede der 153 Zellen ein Bild', st.ph === 0 && st.pics === 153, st);
  t('keine console.error/pageerror (153 Details + Vollliste)', p.errs.length === 0, p.errs.slice(0, 4));
  await p.close();
}

// ---- 4) Fehler dürfen das Blatt nicht leeren
{
  const p = await boot({ width: 860, height: 400 }, '2d');
  await p.evaluate(() => { G.dex.seen = { 2: 1 }; G.dex.caught = { 2: 1 }; window.__v3 = viewer3d; viewer3d = function () { throw new Error('Testfehler viewer3d'); }; openMenu('dex'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelectorAll('#mBody .dx')[1].click(); }); await p.waitForTimeout(500);
  const a = await dexState(p);
  t('Fehler beim Öffnen der Detailseite → Liste bleibt/kommt zurück (Blatt nicht leer)', a.menu && a.cells === 153 && a.text > 50, a);
  await p.evaluate(() => { viewer3d = window.__v3; window.__rd = rDex; rDex = function () { throw new Error('Testfehler rDex'); }; renderMenu(); });
  const b = await p.evaluate(() => ({ kids: document.querySelector('#mBody').children.length, text: document.querySelector('#mBody').textContent.trim().length, tabs: document.querySelectorAll('#tabs button').length }));
  t('Fehler in einer Chronik-Seite → Hinweistext statt leerem Blatt, Tabs bleiben bedienbar', b.kids > 0 && b.text > 10 && b.tabs >= 7, b);
  await p.evaluate(() => { rDex = window.__rd; document.querySelector('#tabs button[data-t="team"]').click(); }); await p.waitForTimeout(300);
  t('… und eine andere Seite lässt sich danach öffnen', await p.evaluate(() => document.querySelector('#mBody').dataset.t === 'team' && document.querySelector('#mBody').children.length > 0));
  t('erwartete Fehlerausgaben: nur die beiden Testfehler', p.errs.length >= 1 && p.errs.every(e => /Testfehler|Dex-Detail|Chronik-Seite/.test(e)), p.errs);
  await p.close();
}
await browser.close(); S.close();
console.log(`\nunit_dex_firstopen: ${ok} ✓, ${bad} ✗`); process.exit(bad ? 1 : 0);
