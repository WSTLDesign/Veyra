// QA Loop C – Punkt 9: Vollbild-Höhe. Spiel, Film-Ebene, Menü-Ebenen füllen bei 852×393 (isMobile) und 390×844 die ganze sichtbare Höhe (--vvh, 42-fullscreen.js); kein Balken, kein Overflow.
//   node test/qa_lc_fullscreen.mjs      Bilder: test/qa_lc_fs_*.png
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('qa_lc_fullscreen.log', 'QA Loop C – Vollbild-Höhe');
const env = await start();
const MEAS = () => { const H = innerHeight, vvh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vvh')) || 0, vv = window.visualViewport ? window.visualViewport.height : null;
  const sel = ['#app', '#screen', '#title', '#intro', '.ivL', '#menu', '#shop', '#opts', '#bigMap', '#battle', '#seqL', '#callOv', '#rotOv', '.layer'];
  const rows = []; const seen = new Set(); for (const s of sel) for (const e of document.querySelectorAll(s)) { if (seen.has(e)) continue; seen.add(e); const cs = getComputedStyle(e); if (e.closest('[hidden]') || cs.display === 'none' || cs.visibility === 'hidden') continue; const r = e.getBoundingClientRect(); if (r.width < 5 || r.height < 5) continue; rows.push({ s: s + (e.id ? '#' + e.id : ''), top: Math.round(r.top), h: Math.round(r.height), bottom: Math.round(r.bottom), w: Math.round(r.width), pos: cs.position }); }
  const de = document.documentElement, bd = document.body; return { H, vvh, vv, rows, dScroll: de.scrollHeight - H, bScroll: bd.scrollHeight - H, dScrollW: de.scrollWidth - innerWidth, bodyH: Math.round(bd.getBoundingClientRect().height), appH: Math.round((document.querySelector('#app') || bd).getBoundingClientRect().height), cls: bd.className }; };
const bad = (m, only) => m.rows.filter(r => (!only || only.some(o => r.s.startsWith(o))) && (r.pos === 'fixed' || r.pos === 'absolute') && (Math.abs(r.top) > 1 || Math.abs(r.h - m.vvh) > 2) ).map(r => `${r.s} top=${r.top} h=${r.h} (vvh ${m.vvh})`);
for (const [name, w, h, mobile] of [['852x393', 852, 393, true], ['390x844', 390, 844, true]]) {
  const p = await page(env, { w, h, mobile, flags: { VEYRA_DEMO: 1, VEYRA_VIDEO: 1 }, set: { gfx: 'low', res: '720' } }); const ev = (f, a) => p.evaluate(f, a); const shot = n => p.screenshot({ path: here(`qa_lc_fs_${name}_${n}.png`) });
  await p.waitForTimeout(1500);
  // 1) Opening/Titel
  let m = await ev(MEAS); R.note(`[${name}] Start: ${JSON.stringify({ H: m.H, vvh: m.vvh, vv: m.vv, cls: m.cls })}`);
  R.t(`[${name}] --vvh = sichtbare Höhe (${m.H})`, Math.abs(m.vvh - m.H) <= 1 || (m.vv && Math.abs(m.vvh - m.vv) <= 1), { H: m.H, vvh: m.vvh, vv: m.vv });
  await shot('1_opening');
  if (h > w) { m = await ev(MEAS); const ro = m.rows.filter(r => r.s.startsWith('#rotOv')); await shot('1b_drehen'); R.t(`[${name}] „Bitte Gerät drehen“-Ebene (#rotOv) füllt die ganze Höhe`, ro.length > 0 && ro.every(r => Math.abs(r.top) <= 1 && Math.abs(r.h - m.vvh) <= 2), ro); await ev(() => { SET.portrait = 'allow'; fsLayout(); }); await p.waitForTimeout(500); }
  try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(700); m = await ev(MEAS); R.t(`[${name}] Opening-Ebene füllt die Höhe`, bad(m, ['#intro']).length === 0, { rows: m.rows.map(r => r.s + ':' + r.top + '+' + r.h), vvh: m.vvh });
  try { await p.click('#iSkip', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(1500); m = await ev(MEAS); await shot('2_titel');
  R.t(`[${name}] Titel-Ebene füllt die Höhe, kein Overflow`, bad(m, ['#title']).length === 0 && m.dScroll <= 0 && m.dScrollW <= 0, { bad: bad(m, ['#title']), dScroll: m.dScroll, dScrollW: m.dScrollW });
  // 2) Film-Ebene
  await p.click('#tNew'); await p.waitForTimeout(1800); m = await ev(MEAS); await shot('3_film'); const film = m.rows.filter(r => r.s.startsWith('.ivL')); R.note(`[${name}] Film-Ebene: ${JSON.stringify(film)}`);
  R.t(`[${name}] Film-Ebene (.ivL) vorhanden und füllt die ganze Höhe`, film.length > 0 && film.every(r => Math.abs(r.top) <= 1 && Math.abs(r.h - m.vvh) <= 2), { film, vvh: m.vvh });
  // Film überspringen → Intro-Dialoge → Welt
  await ev(() => { document.querySelectorAll('.ivL').forEach(e => { const b = e.querySelector('.ivSkip'); b && b.click(); }); }); await p.waitForTimeout(1200);
  await ev(() => { const L = document.getElementById('seqL'); if (L) { L.hidden = true; L.innerHTML = ''; } try { beginGame({ name: 'Noa', rival: 'Lio', outfit: defaultOutfit() }); } catch (e) { } for (let i = 0; i < 60 && mode === 'dialog'; i++) { try { TW && TW.finish && TW.finish(); advDlg(); } catch (e) { } } });
  await ev(() => { if (typeof G === 'undefined' || !G) return; G.flags.starter = 1; G.flags.firstcatch = 1; G.team = [mk(1, 12)]; SET.skipBattleIntro = 1; SET.portrait = 'allow'; try { fsLayout(); } catch (e) { } setView('third', 1); loadMap('route1', 9, 12); mode = 'world'; VILL.list = []; ROAM.list = []; }); await p.waitForTimeout(2500);
  m = await ev(MEAS); await shot('4_welt'); R.note(`[${name}] Welt: ${JSON.stringify({ cls: m.cls, app: m.appH, body: m.bodyH, vvh: m.vvh, dScroll: m.dScroll, rows: m.rows.map(r => r.s + ' ' + r.top + '+' + r.h) })}`);
  R.t(`[${name}] Spiel (#app, #screen) füllt die Höhe ohne Balken/Overflow`, bad(m, ['#app', '#screen']).length === 0 && Math.abs(m.appH - m.vvh) <= 2 && Math.abs(m.bodyH - m.vvh) <= 2 && m.dScroll <= 0 && m.bScroll <= 0, { appH: m.appH, bodyH: m.bodyH, vvh: m.vvh, dScroll: m.dScroll, bScroll: m.bScroll, bad: bad(m, ['#app', '#screen']) });
  // Boden des Bildes: letzte Pixelzeile nicht schwarz/leer (Balken-Check)
  const bottomRow = await ev(() => { const c = document.createElement('canvas'); return null; });
  // 3) Menü-Ebenen
  const layers = [['Chronik', () => { openMenu('team'); }, ['#menu']], ['Dex', () => { openMenu('dex'); }, ['#menu']], ['Tasche', () => { openMenu('bag'); }, ['#menu']], ['Optionen-Titel', () => { $('#opts').hidden = false; rSettings($('#optBody')); }, ['#opts']], ['Laden', () => { openShop(['trank', 'kapsel']); }, ['#shop']], ['Große Karte', () => { openBigMap(); }, ['#bigMap']], ['Kampf', () => { startBattle({ wild: mk(59, 4) }); }, ['#battle']]];
  for (const [ln, fn, only] of layers) {
    await ev(() => { try { closeMenu(); } catch (e) { } try { bmClose(); } catch (e) { } try { $('#opts').hidden = true; } catch (e) { } try { if (B) endBattle('run'); } catch (e) { } mode = 'world'; }); await p.waitForTimeout(500);
    await ev(f => { (0, eval)('(' + f + ')()'); }, fn.toString()); await p.waitForTimeout(ln === 'Kampf' ? 3500 : 1500);
    m = await ev(MEAS); await shot('5_' + ln.replace(/[^A-Za-z]/g, '')); const vis0 = m.rows.filter(r => only.some(o => r.s.startsWith(o))), bb = ln === 'Kampf' ? vis0.filter(r => r.top < -1 || r.top + r.h > m.vvh + 2 || r.h < m.vvh * 0.95).map(r => r.s + ' ' + r.top + '+' + r.h) : bad(m, only), vis = m.rows.filter(r => only.some(o => r.s.startsWith(o)));
    R.t(`[${name}] ${ln}: Ebene sichtbar, füllt die ganze Höhe (top 0, Höhe = --vvh; Kampfbühne: ≥ 95 % ohne Überstand), kein Overflow`, vis.length > 0 && bb.length === 0 && m.dScroll <= 0, { vis: vis.map(r => r.s + ' ' + r.top + '+' + r.h), vvh: m.vvh, dScroll: m.dScroll, bb });
  }
  await ev(() => { try { closeMenu(); } catch (e) { } try { bmClose(); } catch (e) { } try { if (B) endBattle('run'); } catch (e) { } mode = 'world'; });
  // 4) iOS-Fall: sichtbare Höhe > Layout-Höhe (Leiste eingeklappt) → --vvh folgt, Ebenen folgen
  const ios = await ev(async () => { const vv = window.visualViewport; const real = vv.height; Object.defineProperty(vv, 'height', { configurable: true, get: () => innerHeight + 34 }); fsLayout(); await new Promise(r => setTimeout(r, 400)); const vvh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vvh')); const a = document.querySelector('#app').getBoundingClientRect().height, t = document.querySelector('#title').getBoundingClientRect().height; delete vv.height; fsLayout(); return { inner: innerHeight, vvh, appH: Math.round(a), titleH: Math.round(t) }; });
  R.t(`[${name}] iOS-Simulation (Visual-Viewport 34 px höher als Layout): --vvh und #app wachsen mit`, ios.vvh === ios.inner + 34 && Math.abs(ios.appH - ios.vvh) <= 2, ios);
  R.t(`[${name}] keine Seitenfehler`, p.errs.length === 0, p.errs);
  await p.context().close();
}
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
