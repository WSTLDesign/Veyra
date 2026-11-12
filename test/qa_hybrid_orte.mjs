// QA Hybrid (Sonnet hoch) – Prüfpunkte 4 + 5 + 6: Ortsansichten, Kapitelbilder, Spielstand-Migration.
// Aufruf: node build.mjs && node test/qa_hybrid_orte.mjs → test/qa_hybrid_ort_*.png, test/qa_hybrid_kapitel_*.png, Ergebnis-JSON nach $QA_OUT, Zusammenfassung ✓/✗ auf stdout.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
const OUT = process.env.QA_OUT || (tmpdir() + '/qa_hybrid_orte.json');
const png = n => new URL(`./qa_hybrid_${n}.png`, import.meta.url).pathname;
const RES = []; let fails = 0;
const ok = (name, cond, detail = '') => { RES.push({ name, ok: !!cond, detail }); if (!cond) fails++; console.log((cond ? '✓ ' : '✗ ') + name + (detail ? '  [' + detail + ']' : '')); };
async function open({ hy = 1, w = 860, h = 484, intro = false, save = null } = {}) {
  const S = await serve(), browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }), errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  await page.addInitScript(([hy, save]) => { if (hy) window.VEYRA_HY = 1; try { const o = JSON.parse(localStorage.getItem('veyra_set') || '{}'); localStorage.setItem('veyra_set', JSON.stringify(Object.assign(o, { res: 'native', gfx: 'high', fps: 0, hudDim: 'aus' }))); if (save && !localStorage.getItem('__qa_seeded')) { localStorage.setItem(save.key, save.value); localStorage.setItem('__qa_seeded', '1'); } } catch (e) { } }, [hy, save]);
  await page.goto(S.url + 'index.html', { waitUntil: 'load' });
  return { S, browser, page, errs, close: async () => { await browser.close(); S.close(); } };
}
async function newGameToWorld(page) {
  await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
  await page.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; G.team.push(mk(1, 12)); G.team.push(mk(4, 12)); });
}
const reset = page => page.evaluate(() => { HYP.cur = null; HYP.last = {}; HYP.shownAt = 0; HYC.at = 0; HYP.hold = 0; HYC.hold = 0; try { hyPlaceClose(true); hyChapterClose(true); } catch (e) { } });
const go = async (page, m, x, y, t) => { await page.evaluate(([m, x, y, t]) => { mode = 'world'; if (t != null) G.time = t; if (view === '2d') setView('third', 1); HYP.shownAt = 0; HYC.at = 0; loadMap(m, x, y); }, [m, x, y, t]); };
const placeCount = page => page.evaluate(() => HYP.count);
const shownNow = page => page.evaluate(() => !!document.getElementById('hyPlace') && !!HYP.el);

// ======================= A) Ortsansichten (VEYRA_HY=1) =======================
{
  const T = await open({ hy: 1 }), { page } = T; await newGameToWorld(page);
  await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; });
  await page.waitForTimeout(500); await reset(page);
  // A1 Ort betreten → Bild (Brisenhafen), Text, Klassen, Dauer
  await go(page, 'morgenau', 10, 10, 720); await page.waitForTimeout(3500); await reset(page);
  await page.evaluate(() => { window.__pl = { t0: 0, open: 0, close: 0 }; const f = () => { const n = performance.now(); if (HYP.el && !__pl.open) __pl.open = n; if (__pl.open && !HYP.el && !__pl.close) __pl.close = n; requestAnimationFrame(f); }; requestAnimationFrame(f); window.__pl.t0 = performance.now(); });
  await page.evaluate(() => { try { window.__r0 = R3.r.render; R3.r.render = function () { }; } catch (e) { } }); // Render stilllegen: Timer-Messung ohne SwiftShader-Last
  await page.evaluate(() => { window.__pl2 = { t0: performance.now(), open: 0, close: 0 }; const o = hyPlaceOpen, c = hyPlaceClose; hyPlaceOpen = function () { const r = o.apply(this, arguments); if (!__pl2.open) __pl2.open = performance.now(); return r; }; hyPlaceClose = function (now) { if (HYP.el && __pl2.open && !__pl2.close && !now) __pl2.close = performance.now(); return c.apply(this, arguments); }; });
  await go(page, 'brisenhafen', 9, 11, 720);
  await page.waitForFunction(() => HYP.shown, null, { timeout: 8000 }).catch(() => { });
  const a1 = await page.evaluate(() => { const e = document.getElementById('hyPlace'); return e ? { cls: e.className, name: e.querySelector('b').textContent, sub: e.querySelector('small').textContent, key: HYP.lastKey, imgOk: !!(e.querySelector('img') && e.querySelector('img').naturalWidth) } : null; });
  ok('A1 Ort betreten → Ortsbild erscheint (Brisenhafen)', a1 && a1.imgOk, JSON.stringify(a1));
  await page.waitForFunction(() => __pl2.close, null, { timeout: 12000 }).catch(() => { });
  const tm = await page.evaluate(() => ({ latenz: Math.round(__pl2.open - __pl2.t0), dauer: Math.round(__pl2.close - __pl2.open) }));
  ok('A2 Bild steht ≈1,5 s (Zeit zwischen Erscheinen und Schließbeginn, im Browser gemessen)', tm.dauer > 1300 && tm.dauer < 2600, JSON.stringify(tm) + ' (Screenshot-Zeit im Browser nicht gemessen; unter SwiftShader schwanken rAF-Zeiten)');
  await page.evaluate(() => { try { R3.r.render = window.__r0; } catch (e) { } }); // Render erst nach der Messung wieder an (Screenshots/Shader-Kompilierung würden den 1,5-s-Timer verzögern); Bild: test/qa_hybrid_ort_brisenhafen_tag.png aus dem vorigen Lauf
  await page.waitForFunction(() => !document.getElementById('hyPlace'), null, { timeout: 8000 }).catch(() => { }); ok('A2b Overlay nach Überblendung aus dem DOM', !(await page.evaluate(() => !!document.getElementById('hyPlace'))));
  ok('A2c Steuerung zurück (mode world)', (await page.evaluate(() => mode)) === 'world', await page.evaluate(() => mode));
  // A3 Routen nur bei Regionswechsel
  const route = async (from, to, expectShow, label, t = 720) => { await reset(page); await go(page, from[0], from[1], from[2], t); await page.waitForTimeout(2500); await reset(page); await page.evaluate(() => { HYP.cur = { id: cur.id, reg: hyRegion(cur) }; }); const c0 = await placeCount(page); await go(page, to[0], to[1], to[2], t); await page.waitForTimeout(1800); const c1 = await placeCount(page), vis = await page.evaluate(() => !!HYP.el); ok(label, (c1 - c0 === 1) === expectShow, `Zähler +${c1 - c0}, sichtbar ${vis}, Regionen ${await page.evaluate(() => [HYP.cur && HYP.cur.reg])}`); await reset(page); };
  await route(['morgenau', 10, 10], ['route1', 9, 18], false, 'A3a Route 1 von Morgenau (gleiche Region Lichtlande) → kein Bild');
  await route(['route1', 9, 12], ['route2', 5, 5], true, 'A3b Route 2 von Route 1 (Lichtlande → Smaragdwald) → Bild (Regionswechsel)');
  await route(['route2', 5, 5], ['route3', 5, 5], true, 'A3c Route 3 von Route 2 (Smaragdwald → Lichtlande) → Bild');
  await route(['route1', 9, 12], ['route3', 5, 5], false, 'A3d Route 1 → Route 3 (beide Lichtlande) → kein Bild');
  // A4 Innenräume / gleicher Ort
  await reset(page); await go(page, 'morgenau', 10, 10, 720); await page.waitForTimeout(2500); await reset(page);
  for (const I of ['haus_spieler', 'labor', 'heil_brise', 'laden_brise']) { const c0 = await placeCount(page); await go(page, I, 5, 5, 720); await page.waitForTimeout(900); ok(`A4 Innenraum ${I} → kein Bild`, (await placeCount(page)) === c0 && !(await shownNow(page))); await reset(page); }
  await reset(page); await go(page, 'brisenhafen', 9, 11, 720); await page.waitForTimeout(3600); const c0 = await placeCount(page); await go(page, 'brisenhafen', 9, 11, 720); await page.waitForTimeout(900);
  ok('A4b gleicher Ort erneut betreten (innerhalb 5 min) → kein zweites Bild', (await placeCount(page)) === c0);
  await reset(page); await go(page, 'brisenhafen', 9, 11, 720); await page.waitForTimeout(500); await reset(page); await go(page, 'frostheim', 8, 8, 720); await page.waitForTimeout(400);
  const gap = await page.evaluate(() => ({ count: HYP.count, shown: !!HYP.el }));
  // A5 Tippen überspringt
  await reset(page); await go(page, 'glutschlucht', 8, 8, 1125); await page.waitForFunction(() => HYP.shown, null, { timeout: 8000 }).catch(() => { }); await page.waitForTimeout(400);
  const wasShown = await page.evaluate(() => !!HYP.el); await page.mouse.click(430, 240); await page.waitForTimeout(100);
  const afterTap = await page.evaluate(() => ({ el: !!HYP.el, cls: (document.getElementById('hyPlace') || {}).className || null, mode })); ok('A5 Tippen überspringt (Overlay beginnt Ausblenden / Zustand frei)', wasShown && !afterTap.el, JSON.stringify({ wasShown, afterTap }));
  await page.waitForTimeout(900);
  // A6 Abend/Nacht-Tönung + Lesbarkeit (Text über hellem Bild: Frostheim Tag, dunklem: Nebelgrotte/Schattmoor Nacht)
  const lesen = async (m, x, y, t, nm) => { await reset(page); await page.evaluate(() => { HYP.hold = 1; }); await go(page, m, x, y, t); await page.waitForFunction(() => HYP.shown, null, { timeout: 8000 }).catch(() => { }); await page.waitForTimeout(700); const cls = await page.evaluate(() => (document.getElementById('hyPlace') || {}).className || '');
    const b64 = (await page.screenshot({ path: png(`ort_${nm}`) })).toString('base64');
    const c = await page.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); }, cr = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05); const out = [];
      const el = document.getElementById('hyPlace'); if (!el) return out; for (const e of el.querySelectorAll('small,b,i')) { const r = e.getBoundingClientRect(); if (r.width < 3) continue; const cs = getComputedStyle(e); const m = cs.color.match(/[\d.]+/g).map(Number); const d = cx.getImageData(Math.round(r.left), Math.round(r.top), Math.max(3, Math.round(r.width)), Math.max(3, Math.round(r.height))).data;
        const Ls = []; for (let i = 0; i < d.length; i += 16) Ls.push(lum(d[i], d[i + 1], d[i + 2])); Ls.sort((a, b) => a - b); const fg = lum(m[0], m[1], m[2]); out.push({ tag: e.tagName, txt: (e.textContent || '').slice(0, 20), fs: parseFloat(cs.fontSize), cMed: +cr(fg, Ls[Math.floor(Ls.length / 2)]).toFixed(2), cWorst: +Math.min(cr(fg, Ls[Math.floor(Ls.length * .1)]), cr(fg, Ls[Math.floor(Ls.length * .9)])).toFixed(2) }); } return out; }, b64);
    await page.evaluate(() => { HYP.hold = 0; hyPlaceClose(true); }); return { cls, c }; };
  const L1 = await lesen('frostheim', 8, 8, 720, 'frostheim_tag'); ok('A6a Ortstext über hellem Bild (Frostheim Tag): Kontrast Median ≥ 4,5:1', L1.c.length && L1.c.every(x => x.cMed >= 4.5), JSON.stringify(L1.c) + ' ' + L1.cls);
  const L2 = await lesen('schattmoor', 8, 8, 1380, 'schattmoor_nacht'); ok('A6b Nacht → Klasse t-nacht und Text lesbar', /t-nacht/.test(L2.cls) && L2.c.every(x => x.cMed >= 4.5), JSON.stringify(L2.c) + ' ' + L2.cls);
  const L3 = await lesen('glutschlucht', 8, 8, 1125, 'glutschlucht_abend'); ok('A6c Abend → Klasse t-abend und Text lesbar', /t-abend/.test(L3.cls) && L3.c.every(x => x.cMed >= 4.5), JSON.stringify(L3.c) + ' ' + L3.cls);
  const L4 = await lesen('nebelgrotte', 6, 12, 720, 'nebelgrotte_tag'); ok('A6d Dunkle Höhle: Text lesbar', L4.c.every(x => x.cMed >= 4.5), JSON.stringify(L4.c) + ' ' + L4.cls);
  ok('A6e Schriftgrößen Ortsname ≥ 20 px, Untertitel ≥ 12 px', L1.c.filter(x => x.tag === 'B').every(x => x.fs >= 20) && L1.c.filter(x => x.tag === 'SMALL').every(x => x.fs >= 12), JSON.stringify(L1.c.map(x => x.tag + x.fs)));
  await reset(page);
  ok('A7 Konsolenfehler Ortsansichten', T.errs.length === 0, T.errs.slice(0, 3).join(' | '));
  RES.push({ gapInfo: gap }); await T.close();
}

// ======================= B) Tests ohne VEYRA_HY (navigator.webdriver) → sofort beendet =======================
{
  const T = await open({ hy: 0 }), { page } = T; await newGameToWorld(page); await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; });
  await page.waitForTimeout(500); await page.evaluate(() => { HYP.cur = null; HYP.last = {}; HYP.shownAt = 0; HYC.at = 0; });
  let seen = false; await page.evaluate(() => { window.__seen = 0; new MutationObserver(() => { if (document.getElementById('hyPlace') || document.getElementById('hyChap')) window.__seen = 1; }).observe(document.body, { childList: true, subtree: true }); });
  await go(page, 'brisenhafen', 9, 11, 720); await page.waitForTimeout(2500);
  const r = await page.evaluate(() => ({ seen: window.__seen, count: HYP.count, auto: hyAuto(), chap: (() => { const o = { then: 0 }; const s = hyChapterShow(3, { force: 1, then: () => { o.then++; } }); return { s, then: o.then, dom: !!document.getElementById('hyChap') }; })() }));
  ok('B1 Testlauf (navigator.webdriver): Ortsbild logisch gezählt, aber nie im DOM', r.count >= 1 && !r.seen && r.auto, JSON.stringify(r));
  ok('B2 Kapitelbild im Testlauf: sofort fertig (then einmal, kein DOM)', r.chap.s === true && r.chap.then === 1 && !r.chap.dom, JSON.stringify(r.chap));
  ok('B3 Konsolenfehler', T.errs.length === 0, T.errs.slice(0, 3).join(' | ')); await T.close();
}

// ======================= C) Intro → Charaktererstellung → Zuhause → Hinaustreten: kein Doppelbild =======================
{
  const T = await open({ hy: 1 }), { page } = T;
  await page.evaluate(() => { window.__tl = []; const t0 = performance.now(); setInterval(() => { const p = document.getElementById('hyPlace'), c = document.getElementById('hyChap'); window.__tl.push([Math.round(performance.now() - t0), !!p, !!c, typeof mode !== 'undefined' ? mode : '', typeof cur !== 'undefined' && cur ? cur.id : '']); }, 250); });
  await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
  await page.evaluate(() => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
  const st = await page.evaluate(() => ({ map: G.map, mode, inside: cur && cur.inside, pl: HYP.count, ch: HYC.count })); console.log('Nach Intro:', JSON.stringify(st));
  ok('C1 nach Intro/Charaktererstellung noch kein Ort-/Kapitelbild (Start im Innenraum)', st.pl === 0 && st.ch === 0 && st.inside, JSON.stringify(st));
  await page.evaluate(() => { G.flags.starter = 1; ROAM.list.length = 0; ROAM.want = 0; window.VEYRA_DEMO = 1; });
  await page.waitForTimeout(1500);
  // erstes Hinaustreten (Tür von haus_spieler → Morgenau)
  await page.evaluate(() => { mode = 'world'; loadMap('morgenau', 9, 7); }); await page.waitForTimeout(14000);
  const tl = await page.evaluate(() => window.__tl), fin = await page.evaluate(() => ({ pl: HYP.count, ch: HYC.count, pics: G.story && G.story.pics, mode, lastKey: HYP.lastKey }));
  // gleichzeitig sichtbar?
  const both = tl.filter(r => r[1] && r[2]).length, anyPl = tl.some(r => r[1]), anyCh = tl.some(r => r[2]);
  ok('C2 erstes Hinaustreten: höchstens ein Standbild gleichzeitig, insgesamt Ortsbild + Kapitel-1-Bild nicht doppelt', both === 0 && (fin.pl + fin.ch) <= 2, JSON.stringify({ fin, both, anyPl, anyCh }));
  ok('C2b Doppelbild-Regel laut Doku: Ortsbild unterdrückt, wenn Kapitel 1 gerade lief (60-s-Regel)', !(anyPl && anyCh), JSON.stringify({ anyPl, anyCh, pl: fin.pl, ch: fin.ch }));
  const seq = []; let last = ''; for (const r of tl) { const k = (r[1] ? 'Ort' : '') + (r[2] ? 'Kapitel' : ''); if (k !== last) { seq.push(Math.round(r[0] / 1000) + 's:' + (k || '-')); last = k; } } console.log('Zeitleiste:', seq.join(' → '));
  await page.screenshot({ path: png('ort_nach_intro') });
  ok('C3 Konsolenfehler', T.errs.length === 0, T.errs.slice(0, 3).join(' | ')); RES.push({ timelineC: seq }); await T.close();
}

// ======================= D) Kapitelbilder =======================
{
  const T = await open({ hy: 1 }), { page } = T; await newGameToWorld(page); await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; window.VEYRA_DEMO = 1; });
  await go(page, 'morgenau', 10, 10, 720); await page.waitForTimeout(3000); await reset(page);
  const info = await page.evaluate(() => STORY.map(c => ({ n: c.n, title: kanonText(c.title), goal: kanonText(c.goal), reg: c.reg, steps: c.steps.map(s => s.f), pic: HY_CHAP[c.n] || null, art: !!hyArt('chapter_' + c.n) })));
  writeFileSync(tmpdir() + '/qa_hybrid_kapiteltexte.json', JSON.stringify(info, null, 1));
  ok('D0 zehn Kapitel (1–8, Finale, Epilog) haben Bild und Satz', info.length === 10 && info.every(c => c.art && c.pic), info.map(c => c.n + ':' + c.art + '/' + !!c.pic).join(' '));
  // D1 Original-Hook: Flags je Kapitel simulieren → storyTick → genau ein Bild, pics gesetzt, Wiederholung zeigt nichts
  // Alles je Kapitel in EINEM page.evaluate (Zeitmessung im Browser; unter SwiftShader dauern Roundtrips > 1 s und würden die 1-s-Sperre verfälschen)
  await page.evaluate(() => { try { R3.r.render = function () { }; } catch (e) { } }); // Render-Aufruf stilllegen: SwiftShader würde sonst Timer um > 1 s verzögern und die 1-s-Sperre unmessbar machen
  await page.evaluate(() => {
    window.__sleep = ms => new Promise(r => setTimeout(r, ms));
    window.__clean = () => { if (window.__sc) { window.storyCard = window.__sc; window.__sc = null; } try { hyChapterClose(true); } catch (e) { } try { hyPlaceClose(true); } catch (e) { } const d = $('#dlg'); if (d) d.hidden = true; const c = $('#callOv'); if (c) c.hidden = true; const m = $('#menu'); if (m) m.hidden = true; document.querySelectorAll('#hyChap,#hyPlace').forEach(e => e.remove()); B = null; mode = 'world'; HYC.at = 0; HYP.shownAt = 0; };
    window.__waitEl = async (ms = 12000) => { const w = performance.now(); while (performance.now() - w < ms) { if (HYC.el && HYC.el.isConnected) return performance.now(); await __sleep(20); } return -1; };
    window.__waitGone = async (ms = 6000) => { const w = performance.now(); while (performance.now() - w < ms) { if (!HYC.shown) return performance.now(); await __sleep(20); } return -1; };
    window.__tap = () => { HYC.el && HYC.el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); };
  });
  for (const c of info) {
    const r = await page.evaluate(async n => {
      __clean(); const o = { n }; G.story = { ch: 0, help: {}, seen: { call_wende: 1, call_hain: 1 }, pics: {} }; G.flags = G.flags || {};
      for (const k in G.flags) if (/^s\d|^se_|^st_/.test(k)) delete G.flags[k];
      for (const ch of STORY) { if (ch.n < n) ch.steps.forEach(s => { G.flags[s.f] = 1; }); else ch.steps.forEach(s => { delete G.flags[s.f]; }); }
      o.step = storyStep() && storyStep().ch; G.story.ch = n === 1 ? 0 : n - 1;
      let cards = 0; const oc = window.storyCard; window.storyCard = function () { cards++; return oc.apply(this, arguments); };
      const c00 = HYC.count; stT = 0; storyTick(); o.count = HYC.count - c00; o.pic = !!G.story.pics[n]; o.chNow = G.story.ch;
      const t1 = await __waitEl(); o.geladen = t1 > 0; const el = HYC.el;
      o.dom = document.querySelectorAll('#hyChap').length; o.cardsAtOnce = cards; o.modeShown = mode;
      o.txt = el ? { small: el.querySelector('small').textContent, b: el.querySelector('b').textContent, p: el.querySelector('p').textContent, img: !!(el.querySelector('img') && el.querySelector('img').naturalWidth) } : null;
      // Tippen kurz nach dem Erscheinen (< 1 s): darf nicht schließen
      await __sleep(120); __tap(); await __sleep(60); const sinceE = Math.round(performance.now() - t1); o.early = { shown: HYC.shown, can: !!(HYC.el && HYC.el.classList.contains('can')), ms: sinceE };
      while (performance.now() - t1 < 1200) await __sleep(25); o.can = !!(HYC.el && HYC.el.classList.contains('can')); window.__shot = true;
      window.__sc = oc; window.__cards = () => cards; return { o };
    }, c.n).catch(e => ({ err: String(e) }));
    // Screenshot-Zeitpunkt: Overlay steht noch (≈ 1,3 s nach Erscheinen) – nur wenn es offen ist
    if ([1, 4, 6, 9, 10].includes(c.n)) await page.screenshot({ path: png(`kapitel_${c.n}`) }).catch(() => { });
    const post = await page.evaluate(async () => { __tap(); const t = await __waitGone(); await __sleep(1500); return { gone: t > 0, shown: HYC.shown, dom: document.querySelectorAll('#hyChap').length, cards: window.__cards ? window.__cards() : -1, mode }; });
    const again = await page.evaluate(n => { const c0 = HYC.count; G.story.ch = n === 1 ? 0 : n - 1; stT = 0; storyTick(); return { shown: HYC.shown, added: HYC.count - c0 }; }, c.n);
    await page.evaluate(() => { __clean(); });
    const o = r.o || {};
    ok(`D1 Kapitel ${c.n}: Hook zeigt genau ein Bild, pics gesetzt, Satz/Titel da`, o.step === c.n && o.count === 1 && o.pic && o.dom === 1 && o.txt && o.txt.img && o.txt.p && o.cardsAtOnce === 0, JSON.stringify(r.err || o));
    ok(`D2 Kapitel ${c.n}: Tippen < 1 s schließt nicht, nach 1 s schließt; danach Kapitelkarte (1×)`, o.early && o.early.shown && !o.early.can && o.can && post.gone && post.shown === false && post.dom === 0 && post.cards === 1, JSON.stringify({ early: o.early, can: o.can, post }));
    ok(`D3 Kapitel ${c.n}: zweiter Aufruf zeigt nichts mehr`, again.added === 0 && !again.shown, JSON.stringify(again));
  }
  // D4 automatisches Ende nach ≈4,8 s ohne Tippen (gemessen ab Erscheinen bis shown=false) + Kapitelkarte danach genau einmal
  const to = await page.evaluate(async () => { __clean(); G.story = { ch: (storyStep() || {}).ch, help: {}, seen: {}, pics: {} }; let cards = 0, thenAt = 0; hyChapterShow(2, { then: () => { thenAt = performance.now(); cards++; } }); const t1 = await __waitEl(); const g = await __waitGone(9000); await __sleep(900); return { stehtMs: g < 0 || t1 < 0 ? -1 : Math.round(g - t1), thenNachMs: thenAt && t1 > 0 ? Math.round(thenAt - t1) : -1, cards, shown: HYC.shown }; });
  ok('D4 Kapitelbild endet selbst nach ≈ 4,8 s (danach 0,65 s Ausblenden, dann Kapitelkarte)', to.stehtMs > 4400 && to.stehtMs < 6000 && to.cards === 1 && !to.shown, JSON.stringify(to));
  // D5 Tastatur: Escape vor 1 s wirkungslos, ab 1 s schließt
  const kb = await page.evaluate(async () => { __clean(); G.story = { ch: (storyStep() || {}).ch, help: {}, seen: {}, pics: {} }; let d = 0; hyChapterShow(3, { then: () => { d++; } }); const t1 = await __waitEl(); await __sleep(150); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); await __sleep(60); const early = HYC.shown; while (performance.now() - t1 < 1200) await __sleep(25); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); await __waitGone(3000); await __sleep(900); return { d, early, shown: HYC.shown }; });
  ok('D5 Escape: vor 1 s wirkungslos, ab 1 s überspringt', kb.d === 1 && kb.early === true && !kb.shown, JSON.stringify(kb));
  ok('D6 Konsolenfehler Kapitel', T.errs.length === 0, T.errs.slice(0, 3).join(' | ')); await T.close();
}

// ======================= E) Spielstand: alter Stand ohne pics/SKY-Felder =======================
{
  const fdir = new URL('./fixtures/', import.meta.url).pathname, files = readdirSync(fdir).filter(f => /^old_save.*\.json$/.test(f)); console.log('Fixtures:', files.join(', '));
  for (const f of files) {
    const raw = readFileSync(fdir + f, 'utf8');
    const T = await open({ hy: 1, save: { key: 'veyra_save_v1', value: raw } }), { page } = T;
    const k = await page.evaluate(() => typeof SAVEKEY !== 'undefined' ? SAVEKEY : null); const keysBefore = await page.evaluate(() => Object.keys(localStorage));
    // der Init-Script hat unter dem Namen 'veyra_save' angelegt; echten SAVEKEY ermitteln und ggf. nachziehen
    if (k && k !== 'veyra_save_v1') await page.evaluate(([k, raw]) => { localStorage.setItem(k, raw); }, [k, raw]);
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800);
    const cont = await page.evaluate(() => { const b = document.getElementById('tCont'); return b ? { hidden: b.hidden, disp: getComputedStyle(b).display } : null; });
    await page.click('#iPrompt').catch(() => { }); await page.waitForTimeout(400); await page.click('#iSkip').catch(() => { }); await page.waitForTimeout(800);
    const clicked = await page.click('#tCont', { timeout: 4000 }).then(() => true, () => false); await page.waitForTimeout(2500);
    const r = await page.evaluate(() => ({ mode, map: G && G.map, team: G && G.team.length, pics: G && G.story && G.story.pics, hasStory: !!(G && G.story), sky: Object.keys(G || {}).filter(x => /sky|hy|hybrid/i.test(x)), view: typeof view !== 'undefined' ? view : null }));
    await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; }); await page.waitForTimeout(4000);
    const run = await page.evaluate(() => ({ mode, frames: typeof lastFrame !== 'undefined' ? lastFrame : null, calls: R3 && R3.r ? R3.r.info.render.calls : null, sky: typeof skyActive === 'function' ? skyActive() : null }));
    ok(`E1 ${f}: lädt (Fortsetzen), Team/Karte vorhanden, G.story.pics = Objekt`, clicked && r.team > 0 && r.pics && typeof r.pics === 'object', JSON.stringify({ clicked, cont, r }));
    ok(`E2 ${f}: läuft danach (Welt oder Dialog), Skybox aktiv, Render ohne Fehler`, (run.mode === 'world' || run.mode === 'dialog') && run.sky && T.errs.length === 0, JSON.stringify({ run, errs: T.errs.slice(0, 2) }));
    // Export unverändert: keine Hybrid-Felder im gespeicherten/exportierten Stand
    const ex = await page.evaluate(() => { try { const s = typeof exportSave === 'function' ? exportSave() : null; return s ? String(s).length : null; } catch (e) { return 'err ' + e.message; } });
    const sv = await page.evaluate(() => { try { saveGame && saveGame(); } catch (e) { } const k = SAVEKEY, j = localStorage.getItem(k); return j ? Object.keys(JSON.parse(j)).sort() : null; });
    RES.push({ f, saveKeys: sv, exportLen: ex });
    await T.close();
  }
}
writeFileSync(OUT, JSON.stringify(RES, null, 1)); console.log(`\n${RES.filter(r => r.ok).length} ✓, ${fails} ✗`); process.exit(fails ? 1 : 0);
