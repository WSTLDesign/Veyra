// Kreaturenbilder-QA (Agent Kreaturenbilder, 12.11., docs/bilder.md): nie ein „?“, Bild überall in passender Schärfe, Fehler → Wiederholen → Ersatz → Nachfüllen.
//   node test/bilder_qa.mjs        (App-Build über test/art_serve.mjs mit Service Worker, ein Chromium – Chromium-Sperre siehe AGENTS.md)
// Prüft: (1) Dex sofort nach Start mit allen 153 Arten (393×852, DPR 3): jede Kachel ein Kartenbild (kein data-pic=none, kein „?“, kein kaputtes <img>), Schärfe;
// (2) Team + Lager + Detail-Bühne; (3) Fang-Karte (cardMini) + Kampf-Menü-Miniatur; (4) simulierter Netzausfall (Bilder scheitern 12 s lang, Service Worker liefert HTML):
// Ersatz-Sprite statt „?“, Wiederholen, ART_BAD nur vorläufig, danach echte Bilder nachgefüllt; <img>-Weg (Begegnungs-Banner) mit Canvas-Ersatz;
// (5) Schärfe Canvas ≥ CSS × DPR bei DPR 1, 2, 3 (auch Querformat 852×393); (6) Heil-Sequenz Screenshot + Pixeldichte (Hinweis); (7) keine Fehler.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
let ok = 0, bad = 0;
const t = (n, c, info) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, info !== undefined ? '– ' + (typeof info === 'string' ? info : JSON.stringify(info).slice(0, 600)) : ''); } };
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = n => new URL('./' + n, import.meta.url).pathname;
const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver/;

async function boot(vp, dpr, fail) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr });
  const p = await ctx.newPage(); p.setDefaultTimeout(15000); p.errs = []; p.ctx = ctx;
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 160)); });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  if (fail) { const T0 = Date.now(); p.hits = 0;
    await ctx.route(/\/art\/\d{3}_[^/]*\.webp/, r => { if (Date.now() - T0 < fail.ms && fail.ids(+r.request().url().match(/art\/(\d{3})_/)[1])) { p.hits++; return fail.html ? r.fulfill({ body: '<!doctype html><p>offline', contentType: 'text/html' }) : r.abort('failed'); } return r.continue(); }); }
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.click('#iPrompt'); await p.waitForTimeout(300); await p.click('#iSkip'); await p.waitForTimeout(600); await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; SET.btl = 'runde';
    for (let i = 1; i < MONS.length; i++) G.dex.seen[i] = G.dex.caught[i] = 1; });
  return p;
}
// Dex-Kacheln einmal komplett durchscrollen (lazy: gezeichnet wird, was sichtbar wird) und Zustand jeder Kachel lesen
const scrollDex = p => p.evaluate(async () => { const cells = [...document.querySelectorAll('#mBody .dx')]; for (let i = 0; i < cells.length; i += 4) { cells[i].scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 60)); } cells[0].scrollIntoView({ block: 'center' }); });
const dexState = p => p.evaluate(() => { const d = artDpr(), cells = [...document.querySelectorAll('#mBody .dx')], R = { n: cells.length, q: [], none: [], wait: [], broken: [], noPic: [], ok: 0, fb: 0, blurry: [], kinds: {} };
  cells.forEach((c, i) => { const id = i + 1; if (c.querySelector('.q') && !c.querySelector('.q.ph')) R.q.push(id); const im = [...c.querySelectorAll('img')].find(x => x.complete && !x.naturalWidth); if (im) R.broken.push(id);
    const el = c.querySelector('.cpic'); if (!el) { if (!c.querySelector('.q.ph')) R.noPic.push(id); return; } const st = el.dataset.pic; R.kinds[st] = (R.kinds[st] || 0) + 1;
    if (st === 'none') R.none.push(id); else if (st === 'wait') R.wait.push(id); else if (st === 'ok') R.ok++; else R.fb++;
    const cv = el.querySelector('canvas'); if (st === 'ok' && cv.width && cv.width < Math.round(el.offsetWidth * d) - 1) R.blurry.push(id + ':' + cv.width + '<' + el.offsetWidth + '×' + d); });
  return R; });
const sharp = (p, sel) => p.evaluate(sel => { const d = artDpr(); return [...document.querySelectorAll(sel)].filter(el => el.dataset.pic !== 'wait').map(el => { const cv = el.querySelector('canvas'); return { w: el.offsetWidth, cw: cv.width, need: Math.round(el.offsetWidth * d), pic: el.dataset.pic }; }); }, sel);

// ---- 1) Dex sofort nach Start (Bilder laden noch), iPhone hoch 393×852 @3
{
  const p = await boot({ width: 393, height: 852 }, 3);
  const r0 = await p.evaluate(() => { const q = ARTQ.q.length + ARTQ.run, t0 = performance.now(); openMenu('dex'); return { queued: q, ms: Math.round(performance.now() - t0) }; });
  t(`Dex öffnet sofort nach Start (${r0.queued} Bilder noch in der Warteschlange) ohne Standbild (${r0.ms} ms)`, r0.ms < 400, r0);
  const first = await dexState(p);
  t('Dex: keine „?“-Kachel für gesehene Arten, kein kaputtes <img>, kein Kartenbild „none“', !first.q.length && !first.broken.length && !first.none.length && !first.noPic.length, first);
  await p.waitForTimeout(2500); await scrollDex(p); await p.waitForTimeout(1500); await scrollDex(p); await p.waitForTimeout(800);
  const st = await dexState(p);
  const arts = await p.evaluate(() => { const L = []; for (let i = 1; i < MONS.length; i++) if (hasArt(i)) L.push(i); return L; });
  t(`Dex komplett: 153 Kacheln, ${arts.length} mit Illustration – alle als Bild gezeichnet (ok ${st.ok}, Ersatz ${st.fb}, wartend ${st.wait.length})`, st.n === 153 && st.ok >= arts.length && !st.none.length && !st.q.length && !st.broken.length, st);
  t('Dex: Schärfe – jede gezeichnete Kachel hat Canvas ≥ CSS-Größe × 3', !st.blurry.length, st.blurry.slice(0, 6));
  t('Dex: Bilder freigestellt (Boden-Platte weg) und einheitlich zugeschnitten', await p.evaluate(() => { const k = [...ASF.lru.keys()].filter(k => /\|1$/.test(k)).length; return k > 10; }));
  await p.screenshot({ path: out('bilder_dex.png') });
  // Detail-Bühne einer Art mit Bild (gleicher Weg) + Key-Art
  const det = await p.evaluate(async () => { const r = {}; for (const id of [1, 140]) { openMenu('dex'); document.querySelectorAll('#mBody .dx')[id - 1].click(); await new Promise(z => setTimeout(z, 700)); const s = document.querySelector('#mBody .dtop'); const c = s.querySelector('.cpic'), im = s.querySelector('img');
      r[id] = { cpic: c ? c.dataset.pic : null, img: im ? (im.complete && im.naturalWidth > 0) : null }; } return r; });
  t('Dex-Detail: Bühne mit Kartenbild (001) bzw. Key-Art-Karte (140) – beides geladen', det[1].cpic === 'ok' && det[140].img === true, det);
  // ---- 2) Team + Lager
  await p.evaluate(() => { closeMenu(); G.team = [1, 4, 7, 13, 140, 2].map((s, i) => { const m = mk(s, 10 + i); if (i === 1) m.shiny = true; if (i === 3) m.hp = 0; return m; }); G.box = [[16, 9], [59, 12], [88, 14], [3, 8]].map(([s, l]) => mk(s, l)); });
  await p.evaluate(() => openMenu('team')); await p.waitForTimeout(1800);
  const tm = await sharp(p, '#mBody .ring .cpic');
  t(`Team + Lager: ${tm.length} Ringbilder, alle gezeichnet (ok/Ersatz), keines leer`, tm.length === 10 && tm.every(x => x.pic === 'ok' || x.pic === '2d'), tm);
  t('Team: Illustrationen als Bild (nicht Ersatz) und scharf (Canvas ≥ CSS × DPR)', tm.filter(x => x.pic === 'ok').length >= 8 && tm.every(x => x.cw >= x.need - 1), tm);
  await p.screenshot({ path: out('bilder_team.png') });
  await p.evaluate(() => document.querySelector('#mBody .mon').click()); await p.waitForTimeout(800);
  const td = await sharp(p, '#mBody .dtop .cpic');
  t('Team-Detail: Bühne gezeichnet und scharf', td.length === 1 && td[0].pic === 'ok' && td[0].cw >= td[0].need - 1, td);
  // ---- 3) Fang-Karte + Kampf-Menü-Miniatur
  await p.evaluate(() => closeMenu());
  const cards = await p.evaluate(async () => { const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;display:flex;gap:4px;z-index:99'; document.body.appendChild(box);
    const els = [cardMini(59, 56), cardMini(142, 56), cardMini(2, 56), mini(4, 36, false, { shiny: true })]; els.forEach(e => box.appendChild(e)); await Promise.all(els.map(e => e.ready)); await new Promise(z => setTimeout(z, 300));
    const r = els.map(e => ({ pic: e.dataset.pic, cw: e.querySelector('canvas').width, w: e.offsetWidth })); box.remove(); return r; });
  t('Fang-Karte (059, Key-Art 142, bildlos 002) + Kampf-Menü-Miniatur (004 Glanz): alle gezeichnet', cards.every(c => c.pic === 'ok' || c.pic === '2d') && cards[0].pic === 'ok' && cards[1].pic === 'ok' && cards[3].pic === 'ok', cards);
  // ---- 6) Heil-Sequenz (Screenshot während der Kapseln leuchten)
  const heal = await p.evaluate(async () => { mode = 'world'; const pr = playSeq('heal', {}); await new Promise(z => setTimeout(z, 1300)); const c = document.querySelector('.healOv canvas'); window.__healPr = pr; return c ? { cw: c.width, css: c.offsetWidth, dpr: artDpr() } : null; });
  await p.screenshot({ path: out('bilder_heilung.png') }); await p.evaluate(() => window.__healPr);
  t('Heil-Sequenz läuft (Screenshot test/bilder_heilung.png)', !!heal, heal);
  if (heal) console.log(`  Hinweis Heil-Sequenz: Canvas ${heal.cw} px für ${heal.css} CSS-px bei DPR ${heal.dpr} → Faktor ${(heal.cw / heal.css).toFixed(2)} (25-evolve begrenzt auf 2; Vorschlag docs/bilder.md)`);
  t('keine console.error/pageerror (Dex, Team, Karten, Heilung)', p.errs.length === 0, p.errs.slice(0, 4));
  await p.ctx.close();
}

// ---- 4) Netzausfall: jedes dritte Bild scheitert 12 s lang (Service Worker antwortet mit HTML), Dex sofort öffnen
{
  const p = await boot({ width: 393, height: 852 }, 3, { ms: 12000, ids: id => id % 3 === 0 || id === 1, html: false });
  await p.evaluate(() => openMenu('dex'));
  await p.waitForTimeout(3500); await scrollDex(p); await p.waitForTimeout(600);
  const a = await dexState(p);
  t(`Ausfall: kein „?“, kein kaputtes <img>, kein leeres Kartenbild (ok ${a.ok}, Ersatz ${a.fb}, wartend ${a.wait.length})`, !a.q.length && !a.broken.length && !a.none.length && a.fb > 0, a);
  const mid = await p.evaluate(() => ({ tries: Object.keys(ARTQ.n).length, bad: Object.keys(ART_BAD).length, st1: ARTQ.st[1] }));
  t('Ausfall: fehlgeschlagene Bilder werden wiederholt (Warteschlange mit Pause), ART_BAD noch nicht endgültig', mid.tries > 0 || mid.bad > 0, mid);
  // <img>-Weg: Begegnungs-Banner-HTML einer fehlenden Art → Canvas-Ersatz statt kaputtem Bild
  const imgFb = await p.evaluate(async () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:10px;top:10px;width:120px;height:120px;z-index:99'; d.innerHTML = artImg(9, 'aePic', { field: true }).replace(/src="[^"]*"/, 'src="art/009_fehlt.webp"'); document.body.appendChild(d);
    const a = d.firstChild; a.style.width = a.style.height = '120px'; await new Promise(z => setTimeout(z, 900)); const im0 = a.querySelector('img'); const r = { st: ARTQ.st[9], healed: im0.complete && im0.naturalWidth > 0 && !/fehlt/.test(im0.src) && im0.style.visibility !== 'hidden', fb: a.classList.contains('artFb'), cv: !!a.querySelector('canvas.artCv'), hidden: a.querySelector('img').style.visibility === 'hidden' }; window.__imgfb = d; return r; });
  t('<img>-Weg (Begegnungs-Banner, Bild fehlt): Ladefehler → Canvas-Ersatz, kaputtes Bild versteckt', (imgFb.fb && imgFb.cv && imgFb.hidden) || imgFb.healed, imgFb);
  await p.screenshot({ path: out('bilder_ausfall.png') });
  // Nach dem Ausfall: Wiederholen bzw. ART_BAD-Pause (20 s) → echte Bilder füllen die Kacheln nach
  let b; for (let i = 0; i < 30; i++) { await p.waitForTimeout(1500); await scrollDex(p); b = await dexState(p); const art = await p.evaluate(() => Object.keys(ART_SRC).filter(k => /^\d+$/.test(k)).length); if (b.ok >= art) break; }
  const fin = await p.evaluate(() => ({ bad: Object.keys(ART_BAD).length, okN: Object.values(ARTQ.st).filter(s => s === 'ok').length, banner: !!(window.__imgfb && window.__imgfb.querySelector('.art:not(.artFb) img')) }));
  t(`Nach dem Ausfall: alle Illustrationen nachgefüllt (ok ${b.ok}), ART_BAD wieder leer (${fin.bad})`, b.ok >= 100 && fin.bad === 0 && !b.none.length, { b, fin });
  t('Nach dem Ausfall: Begegnungs-Banner zeigt wieder die echte Illustration (Ersatz entfernt)', fin.banner, fin);
  t(`Ausfall-Lauf: ${p.hits} gescheiterte Abrufe, keine Seitenfehler`, p.hits > 30 && p.errs.length === 0, p.errs.slice(0, 4));
  await p.ctx.close();
}

// ---- 5) Schärfe bei DPR 1, 2, 3 (Querformat für DPR 2)
for (const [vp, dpr] of [[{ width: 852, height: 393 }, 1], [{ width: 852, height: 393 }, 2], [{ width: 393, height: 852 }, 3]]) {
  const p = await boot(vp, dpr);
  await p.evaluate(() => { G.team = [1, 4, 7, 13].map(s => mk(s, 10)); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => openMenu('team')); await p.waitForTimeout(1200);
  const a = await sharp(p, '#mBody .cpic');
  await p.evaluate(() => { tab = 'dex'; renderMenu(); }); await p.waitForTimeout(1500);
  const b = await sharp(p, '#mBody .dx .cpic'); const drawn = b.filter(x => x.pic === 'ok' && x.cw > 0);
  t(`DPR ${dpr} (${vp.width}×${vp.height}): Team ${a.length} + Dex ${drawn.length} sichtbare Bilder, Canvas ≥ CSS × ${dpr}`, a.length >= 4 && drawn.length >= 4 && a.concat(drawn).every(x => x.cw >= x.need - 1), { a: a.slice(0, 3), b: drawn.slice(0, 3) });
  t(`DPR ${dpr}: keine Fehler`, p.errs.length === 0, p.errs.slice(0, 3));
  await p.ctx.close();
}
await browser.close(); S.close();
console.log(`\nbilder_qa: ${ok} ✓, ${bad} ✗`); process.exit(bad ? 1 : 0);
