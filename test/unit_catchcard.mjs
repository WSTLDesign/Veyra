// Unit/Browser-Test „Fangkarte-Bild“ (Nutzer-Bug 10.11. 21:43, zweite Meldung): Karte „Neu im Dex“ direkt nach dem Fang zeigt kein Bild.
//   node test/unit_catchcard.mjs            (App-Build dist/index.html über test/art_serve.mjs, Playwright + SwiftShader)
// Ursache + Fix: docs/qa-dex.md. Geprüft wird das SICHTBARE Ergebnis: Bildschirmfoto des Kartenbilds mit und ohne Kreaturen-Ebene (canvas/img ausgeblendet);
// Anteil geänderter Pixel = Anteil, den die Kreatur bedeckt → muss > 15 % sein (leeres Farbfeld ≈ 0 %). Dazu Deckung im Canvas selbst (picCover).
// Fälle: Erstfang Art mit Bild · Glanzform · bildlose Art (frisches 3D-Vorschaubild) · bildlose Art bei verlorenem WebGL-Kontext · Legende (Key-Art) ·
//   Bild verspätet (Platzhalter → Nachfüllen, Karte bleibt danach ≥ 1,5 s offen) · Ergebnis-Karte · Level-up-Karte · Entwicklung (+ „Neu im Dex“) ·
//   Dex-Liste/Detail nach den Fängen · 860×400 (niedriges Querformat) · alle bildlosen Arten liefern ein nicht-leeres Vorschaubild · keine Konsolenfehler.
// Bildschirmfotos: test/catchcard_<fall>.png
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { serve } from './art_serve.mjs';
let ok = 0, bad = 0;
const t = (n, c, info) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, info !== undefined ? '– ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''); } };
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = n => new URL('./' + n, import.meta.url).pathname;
const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver|WebGL|CONTEXT_LOST/i;

async function boot(vp) {
  const p = await (await browser.newContext({ viewport: vp, serviceWorkers: 'block' })).newPage(); p.errs = []; // SW-Abrufe umgehen page.route → für das verzögerte Bild blockieren
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 160)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; SET.btl = 'runde'; G.team.push(mk(1, 8)); G.bag.kapsel = 20;
    loadMap('route1', 5, 5); ROAM.list.length = 0; ROAM.want = 0;
    // Karte für Bildschirmfotos offen halten (SwiftShader-Fotos dauern Sekunden); Fang immer erfolgreich (Fangquote ist nicht Gegenstand dieses Tests)
    window.__freeze = 1; const sc = showCard; showCard = function (h, c, m, f) { return sc(h, c, window.__freeze ? 600000 : m, f); };
    calcCatch = () => ({ p: 1, a: 255, bonus: 1, shakes: 3, crit: false, ok: true }); });
  await p.waitForTimeout(1200);
  return p;
}
// SwiftShader: Fotos während laufender 3D-Szene dauern > 30 s → für Fotos die rAF-Schleifen anhalten (Rückrufe werden danach nachgeholt)
const pause = p => p.evaluate(() => { if (window.__oraf) return; window.__q = []; window.__oraf = requestAnimationFrame; window.requestAnimationFrame = f => { window.__q.push(f); return 0; }; });
const resume = p => p.evaluate(() => { if (!window.__oraf) return; const o = window.__oraf; window.requestAnimationFrame = o; window.__oraf = null; const q = window.__q; window.__q = []; q.forEach(f => o(f)); });
// Pixelanteil der Kreatur: Foto der Fläche mit und ohne canvas/img darin, Anteil deutlich geänderter Pixel
async function picShare(p, sel, shot) {
  const r = await p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }, sel);
  if (!r || r.w < 8 || r.h < 8) return { share: 0, r };
  const clip = { x: Math.max(0, Math.floor(r.x)), y: Math.max(0, Math.floor(r.y)), width: Math.floor(r.w), height: Math.floor(r.h) };
  await pause(p); const a = await p.screenshot({ clip, timeout: 120000 });
  await p.evaluate(sel => document.querySelectorAll(sel + ' img,' + sel + ' canvas,' + sel + ':is(img,canvas)').forEach(x => { x.dataset.vis = x.style.visibility; x.style.visibility = 'hidden'; }), sel);
  const b = await p.screenshot({ clip, timeout: 120000 });
  await p.evaluate(sel => document.querySelectorAll(sel + ' img,' + sel + ' canvas,' + sel + ':is(img,canvas)').forEach(x => { x.style.visibility = x.dataset.vis || ''; }), sel); await resume(p);
  if (shot) writeFileSync(out(shot), a);
  const share = await p.evaluate(async ([A, Bb]) => {
    const ld = async s => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const d1 = await ld(A), d2 = await ld(Bb); let n = 0; for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]) > 48) n++; return n / (d1.length / 4);
  }, [a.toString('base64'), b.toString('base64')]);
  return { share: +share.toFixed(3), w: clip.width, h: clip.height };
}
const cardShot = async (p, n) => { await pause(p); await p.screenshot({ timeout: 120000, path: out(`catchcard_${n}.png`), clip: await p.evaluate(() => { const b = document.querySelector('#bCard .flip,#bCard .rc,#bCard .lvc').getBoundingClientRect(); return { x: Math.max(0, b.x - 16), y: Math.max(0, b.y - 16), width: b.width + 32, height: b.height + 40 }; }) }); await resume(p); };
// Wilder Kampf → Tasche → Fangkapsel (echte Oberfläche) → Karte steht
async function catchTo(p, id, o = {}) {
  await p.evaluate(([id, o]) => { const bc = document.querySelector('#bCard'); bc.innerHTML = ''; bc.className = ''; const m = mk(id, 3); m.shiny = !!o.shiny; if (o.fresh) { delete THUMB[id]; delete ART_FB[id]; delete THUMB_BAD[id]; } if (o.lose) { monThumb(5); TR.r.forceContextLoss(); }
    // „verspätet“: Bild-Objekt ohne Quelle (lädt noch) – Freigabe setzt die echte Quelle (wie ein langsamer Abruf, aber deterministisch)
    if (o.slow) { delete ART_SHC[id]; delete ART_CUT[id]; const im = new Image(); ART_IMG[id] = im; window.__cardT = 0; const mo = new MutationObserver(() => { if (!window.__cardT && document.querySelector('#bCard .cpic')) { window.__cardT = performance.now(); mo.disconnect(); } }); mo.observe(document.querySelector('#bCard'), { childList: true, subtree: true }); window.__rel = () => { im.onload = () => { (ART_WAIT[id] || []).forEach(f => f()); delete ART_WAIT[id]; }; im.src = ART_SRC[id]; }; } startBattle({ wild: m }); }, [id, o]);
  await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 });
  await p.evaluate(() => { B.foe[B.fi].hp = 1; [...document.querySelectorAll('#bMenu button')].find(x => /Tasche/i.test(x.textContent)).click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { [...document.querySelectorAll('#bMenu button')].find(x => /Fangkapsel/i.test(x.textContent)).click(); });
  if (o.pause) await pause(p); // ab dem Wurf ohne 3D-Last (Zeitmessung): Fang-Sequenz läuft über setInterval weiter
  await p.waitForFunction(() => document.querySelector('#bCard .cc .pm'), null, { timeout: 150000, polling: 50 });
}
async function closeCard(p) {
  for (let i = 0; i < 40 && await p.evaluate(() => !!B); i++) { await p.evaluate(() => { const b = document.querySelector('#battle'); if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); TW && TW.finish && TW.finish(); }); await p.waitForTimeout(300); }
  await p.waitForTimeout(300);
}
const picInfo = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const cv = e.querySelector('canvas'); return { cls: e.className, pic: e.dataset.pic, cover: cv && typeof picCover === 'function' ? +picCover(cv).toFixed(3) : null, w: e.offsetWidth, h: e.offsetHeight }; }, sel);

const p = await boot({ width: 390, height: 844 });
// ---- 1) Fänge: Karte „Neu im Dex“
for (const [id, label, o, shot] of [[61, 'Erstfang Art mit Bild (061)', {}, 'erstfang'], [25, 'Glanzform (025 ✦)', { shiny: 1 }, 'glanz'], [112, 'bildlose Art (112, frisches 3D-Vorschaubild)', { fresh: 1 }, 'bildlos'],
  [108, 'bildlose Art bei verlorenem WebGL-Kontext (108)', { fresh: 1, lose: 1 }, 'kontextverlust'], [140, 'Legende mit Key-Art (140)', {}, 'legende']]) {
  await catchTo(p, id, o);
  await p.waitForFunction(() => { const e = document.querySelector('#bCard .cpic'); return e && e.dataset.pic && e.dataset.pic !== 'wait'; }, null, { timeout: 20000 }).catch(() => { });
  await p.waitForFunction(() => { const f = document.querySelector('#bCard .flip'); return f && f.getAnimations().every(a => a.playState === 'finished'); }, null, { timeout: 30000 }).catch(() => { }); await p.waitForTimeout(200); // Wende-Animation fertig
  const nw = await p.evaluate(() => !!document.querySelector('#bCard .ribbon'));
  const inf = await picInfo(p, '#bCard .pm .cpic'), px = await picShare(p, '#bCard .pm .cpic');
  t(`Karte ${label}: „Neu im Dex“, Bild als fester Canvas ${inf && inf.w}×${inf && inf.h} px gezeichnet (Deckung ${inf && inf.cover})`, nw && inf && inf.pic === 'ok' && inf.w >= 100 && inf.cover > .15, inf);
  t(`Karte ${label}: sichtbarer Kreaturen-Anteil im Bildbereich > 15 % (Foto-Vergleich)`, px.share > .15, px);
  if (o.lose) t('… verlorener Kontext: kein leeres Vorschaubild im Cache, Renderer neu angelegt', await p.evaluate(id => !!THUMB[id] && thumbCover(THUMB[id].img) > .05 && !trLost(), id));
  await cardShot(p, shot); await closeCard(p);
  t(`… ${label}: im Dex eingetragen, Welt wieder aktiv`, await p.evaluate(id => !!G.dex.caught[id] && !B && mode === 'world', id));
}
// ---- 2) Bild verspätet (langsames Netz/Vorladen noch nicht fertig): Platzhalter → Nachfüllen; Karte schließt frühestens 1,5 s nach dem Bild
{
  await catchTo(p, 76, { slow: 1 });
  const w0 = await picInfo(p, '#bCard .pm .cpic');
  t('verspätetes Bild (076): Karte zeigt statt leerem Feld einen Platzhalter (bzw. nach 2,6 s den 2D-Rückfall), kein Fehler', w0 && (w0.pic === 'wait' && /wait/.test(w0.cls) || w0.pic === '2d' && w0.cover > .15), w0);
  await p.waitForTimeout(1300); await pause(p); await p.screenshot({ timeout: 120000, path: out('catchcard_verspaetet_platzhalter.png'), clip: await p.evaluate(() => { const b = document.querySelector('#bCard .flip').getBoundingClientRect(); return { x: b.x - 16, y: b.y - 16, width: b.width + 32, height: b.height + 40 }; }) }); await resume(p);
  await p.evaluate(() => window.__rel());
  await p.waitForFunction(() => { const e = document.querySelector('#bCard .cpic'); return e && e.dataset.pic === 'ok'; }, null, { timeout: 20000 }).catch(() => { });
  await p.waitForTimeout(600);
  const inf = await picInfo(p, '#bCard .pm .cpic'), px = await picShare(p, '#bCard .pm .cpic');
  t('… nach dem Laden: Bild nachgefüllt (Einblendung), Deckung > 15 %', inf && inf.pic === 'ok' && /\bin\b/.test(inf.cls) && inf.cover > .15 && px.share > .15, { inf, px });
  await cardShot(p, 'verspaetet'); await closeCard(p);
  // Zeitverlauf mit echter Schließzeit (3,4 s), isoliert außerhalb des Kampfs und ohne rAF-Last (SwiftShader verzögert im Kampf Timer um Sekunden):
  // Illustration kommt erst 3,0 s nach dem Erscheinen der Karte (2D-Rückfall ab 2,6 s) → Karte muss danach noch ≥ 1,5 s offen bleiben (vorher: zu bei 3,4 s)
  await pause(p);
  const L = await p.evaluate(() => new Promise(res => { const id = 59; delete ART_SHC[id]; delete ART_CUT[id]; const im = new Image(); ART_IMG[id] = im; window.__freeze = 0;
    $('#battle').hidden = false; const T = performance.now(), L = {};
    const pr = showCard('<div class="cc"><div class="flip"><div class="back"></div><div class="front"><i class="pm"></i><h2>Test</h2></div></div></div>', 'catch', 3400, c => { const pic = cardMini(id, 120, { field: true }); c.querySelector('.pm').appendChild(pic); L.pic0 = pic.dataset.pic; return pic.ready; });
    setTimeout(() => { im.onload = () => { (ART_WAIT[id] || []).forEach(f => f()); delete ART_WAIT[id]; }; im.src = ART_SRC[id]; L.rel = Math.round(performance.now() - T); }, 3000);
    const iv = setInterval(() => { const e = document.querySelector('#bCard .cpic'), n = Math.round(performance.now() - T); if (e && e.dataset.pic === '2d' && L.fb == null) L.fb = n; if (e && e.dataset.pic === 'ok' && L.fill == null) L.fill = n; }, 30);
    pr.then(() => { L.close = Math.round(performance.now() - T); clearInterval(iv); $('#battle').hidden = true; res(L); }); }));
  t(`Zeitverlauf: Platzhalter → 2D-Rückfall (${L.fb} ms) → Bild (${L.fill} ms) → Karte schließt erst ${L.close} ms (≥ 1,5 s nach dem Bild; vorher fest 3,4 s)`, L.pic0 === 'wait' && L.fb >= 2500 && L.fill >= 3000 && L.close - L.fill >= 1500, L);
  await resume(p); await p.evaluate(() => { window.__freeze = 1; });
}
// ---- 3) Ergebnis-Karte (Sieg) und Level-up-Karte
{
  await p.evaluate(() => { const m = mk(120, 3); delete THUMB[120]; delete ART_FB[120]; startBattle({ wild: m }); });
  await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 });
  await p.evaluate(() => { B.xl = new Map(G.team.slice(0, 3).map(m => [m, { l0: m.l, xp0: m.xp, g: 12 }])); delete THUMB[G.team[0].s]; window.__rc = resultCard(); });
  await p.waitForFunction(() => document.querySelectorAll('#bCard .rrow .cpic').length > 0 && [...document.querySelectorAll('#bCard .rrow .cpic')].every(e => e.dataset.pic !== 'wait'), null, { timeout: 20000 }).catch(() => { });
  await p.waitForTimeout(900);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#bCard .rrow .cpic')].map(e => ({ pic: e.dataset.pic, cover: +picCover(e.querySelector('canvas')).toFixed(3), w: e.getBoundingClientRect().width })));
  const px = await picShare(p, '#bCard .rrow .cpic');
  t(`Ergebnis-Karte: ${rows.length} Zeilen, jedes 44-px-Bild gezeichnet (Deckung > 15 %), Foto-Anteil erste Zeile ${px.share}`, rows.length >= 3 && rows.every(r => r.pic === 'ok' && r.cover > .15 && r.w === 44) && px.share > .15, { rows, px });
  await cardShot(p, 'ergebnis');
  await p.evaluate(() => { document.querySelector('#battle').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }); await p.waitForFunction(() => document.querySelector('#bCard').hidden, null, { timeout: 20000 }).catch(() => { }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('#bCard').innerHTML = ''; window.__lv = playSeq('levelUp', { mon: G.team[1] }); });
  await p.waitForFunction(() => { const e = document.querySelector('#bCard .lvc .cpic'); return e && e.dataset.pic !== 'wait'; }, null, { timeout: 20000 }).catch(() => { });
  await p.waitForTimeout(500);
  const lv = await picInfo(p, '#bCard .lvc .cpic'), lpx = await picShare(p, '#bCard .lvc .cpic');
  t('Level-up-Karte: Bild gezeichnet (56 px, Deckung > 15 %, Foto-Anteil > 15 %)', lv && lv.pic === 'ok' && lv.w === 56 && lv.cover > .15 && lpx.share > .15, { lv, lpx, st: await p.evaluate(() => ({ bc: document.querySelector('#bCard').hidden, bt: document.querySelector('#battle').hidden, B: !!B })) });
  await cardShot(p, 'levelup');
  await p.evaluate(() => { document.querySelector('#battle').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); endBattle('run'); }); await p.waitForTimeout(800);
}
// ---- 4) Entwicklung 061 → 062 (bildlos, neu im Dex): Bild der neuen Form steht beim „Glückwunsch“
{
  const r = await p.evaluate(() => new Promise(res => { const m = G.team.find(x => x.s === 61); delete THUMB[62]; delete ART_FB[62]; let snap = null;
    const iv = setInterval(() => { const ov = document.querySelector('.evoOv'), tx = ov && ov.querySelector('.evoTx p'); if (!snap && tx && /Glückwunsch/.test(tx.textContent)) { const cv = ov.querySelector('canvas.evoBg'), W = cv.width, H = cv.height, x = cv.getContext('2d');
        const d = x.getImageData(Math.round(W * .3), Math.round(H * .14), Math.round(W * .4), Math.round(H * .44)).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 300) n++;
        snap = { share: +(n / (d.length / 4)).toFixed(3), hint: ov.querySelector('.evoTx small').textContent, png: cv.toDataURL('image/png') }; } }, 60);
    evolve(m, () => { clearInterval(iv); res({ snap, s: m.s, dexNew: !!(G.dexNew && G.dexNew[62]), caught: !!G.dex.caught[62] }); }, { into: 62, method: 'item', noCancel: true });
    const tap = setInterval(() => { const ov = document.querySelector('.evoOv'); if (ov) ov.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); if (!ov && m.s === 62) clearInterval(tap); }, 400); }));
  if (r.snap) writeFileSync(out('catchcard_entwicklung.png'), Buffer.from(r.snap.png.split(',')[1], 'base64'));
  t(`Entwicklung 061 → 062: neue Form beim „Glückwunsch“ sichtbar (heller Kreaturen-Anteil Mitte ${r.snap && r.snap.share} > 15 %), Hinweis „${r.snap && r.snap.hint}“`, r.snap && r.snap.share > .15 && /Neu/.test(r.snap.hint), r.snap && { share: r.snap.share, hint: r.snap.hint });
  t('… Entwicklung trägt 062 als neu in den Dex ein (dexNew)', r.s === 62 && r.dexNew && r.caught, r);
  await p.evaluate(() => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } }); await p.waitForTimeout(500);
}
// ---- 5) Dex nach den Fängen: Liste + Detail jeder neuen Art mit Bild
{
  await p.evaluate(() => { mode = 'world'; openMenu('dex'); });
  let st; for (let i = 0; i < 40; i++) { st = await p.evaluate(() => { const got = [...document.querySelectorAll('#mBody .dx.got')]; return { got: got.length, ph: document.querySelectorAll('#mBody .ph').length, pics: got.filter(c => { const e = c.querySelector('img,canvas'); return e && e.getBoundingClientRect().height > 8 && (e.tagName === 'CANVAS' || (e.complete && e.naturalWidth > 0)); }).length }; }); if (!st.ph && st.pics === st.got) break; await p.waitForTimeout(250); }
  t(`Dex-Liste: alle ${st.got} gefangenen Arten mit geladenem Bild (kein Platzhalter bleibt)`, st.got >= 7 && st.pics === st.got && !st.ph, st);
  await pause(p); await p.screenshot({ path: out('catchcard_dex.png'), timeout: 120000 }); await resume(p);
  const det = [];
  for (const id of [61, 25, 112, 108, 140, 76, 62]) {
    await p.evaluate(id => { renderMenu(); document.querySelectorAll('#mBody .dx')[id - 1].click(); }, id); await p.waitForTimeout(700);
    const px = await picShare(p, '#mBody .dtop > :first-child', id === 108 ? 'catchcard_dex_detail.png' : null);
    det.push([id, px.share]);
  }
  t('Dex-Detail jeder neuen Art zeigt ihr Bild (Foto-Vergleich Bildbühne > 15 %)', det.every(([, s]) => s > .15), det);
  await p.evaluate(() => closeMenu()); await p.waitForTimeout(400);
}
// ---- 6) Alle bildlosen Arten liefern ein nicht-leeres Vorschaubild (Deckungsprüfung verwirft keine echte Art)
{
  const r = await p.evaluate(() => { const no = []; let n = 0; for (let i = 1; i < MONS.length; i++) { if (hasArt(i)) continue; n++; delete THUMB[i]; delete THUMB_BAD[i]; const T = monThumb(i); if (!T || thumbCover(T.img) < .02) no.push(i); } return { n, no }; });
  t(`alle ${r.n} bildlosen Arten: Vorschaubild vorhanden und nicht leer`, r.no.length === 0 && r.n > 20, r);
}
t('keine console.error/pageerror (Fänge, Karten, Entwicklung, Dex)', p.errs.length === 0, p.errs.slice(0, 5));
await p.close();
// ---- 7) Niedriges Querformat 860×400: Bild passt in die kleinere Karte (100 px), überdeckt den Namen nicht
{
  const q = await boot({ width: 860, height: 400 });
  await catchTo(q, 59); await q.waitForFunction(() => { const f = document.querySelector('#bCard .flip'); return f && f.getAnimations().every(a => a.playState === 'finished'); }, null, { timeout: 30000 }).catch(() => { }); await q.waitForTimeout(200);
  const g = await q.evaluate(() => { const pic = document.querySelector('#bCard .pm .cpic').getBoundingClientRect(), h2 = document.querySelector('#bCard .front h2').getBoundingClientRect(), fr = document.querySelector('#bCard .front').getBoundingClientRect();
    return { w: document.querySelector('#bCard .pm .cpic').offsetWidth, bottom: Math.round(pic.bottom), h2top: Math.round(h2.top), inside: pic.left >= fr.left && pic.right <= fr.right && pic.top >= fr.top }; });
  const px = await picShare(q, '#bCard .pm .cpic');
  t(`860×400: Bild ${g.w} px (folgt der Höhe des Bildfelds) in der Karte, endet über dem Namen, Kreaturen-Anteil ${px.share} > 15 %`, g.w >= 64 && g.w <= 120 && g.inside && g.bottom <= g.h2top && px.share > .15, { g, px });
  await cardShot(q, 'quer'); await closeCard(q);
  t('860×400: keine Konsolenfehler', q.errs.length === 0, q.errs.slice(0, 4));
  await q.close();
}
await browser.close(); S.close();
console.log(`\nunit_catchcard: ${ok} ✓, ${bad} ✗`); process.exit(bad ? 1 : 0);
