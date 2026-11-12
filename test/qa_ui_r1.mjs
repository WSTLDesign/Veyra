// QA Gegenprüfung R1 – Punkt 6/K1: „Zurück“-Höhe (Tasche/Team/Rollen/Box/Dex) und Karten-Schriften (Große Karte, alle Ebenen) per DOM-Messung.
//   node test/qa_ui_r1.mjs
import { start, page, newGame, reporter } from './qa_mech_lib.mjs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_ui_r1.log', 'QA R1 UI-Messung');
const env = await start(); const p = await page(env, { w: 860, h: 484 }); await newGame(p, { team: [[1, 12], [25, 10]], view: '2d' });
const ev = (f, a) => p.evaluate(f, a);
// 1) „Zurück“-Knöpfe
const backs = await ev(async () => { const out = {}; const meas = () => [...document.querySelectorAll('#menu button, .back')].filter(b => b.offsetParent && (b.classList.contains('back') || /^\s*(←\s*)?Zurück\s*$/.test(b.textContent))).map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height * 10) / 10]; });
  const W = ms => new Promise(r => setTimeout(r, ms)); G.bag.trank = G.bag.trank || 3; G.bag.rolle_rankenschnitt = 1;
  mode = 'world'; openMenu('bag'); await W(600); out.bag = meas();
  const k = Object.keys(G.bag).find(k => ITEMS[k] && ITEMS[k].k === 'heal' && G.bag[k] > 0); if (k) { chooseFor(k); await W(400); out.bagChoose = meas(); } closeMenu(); await W(300);
  openMenu('bag'); await W(500); const lr = [...document.querySelectorAll('#menu button')].find(b => /Lernen/.test(b.textContent) && b.offsetParent); if (lr) { lr.click(); await W(500); out.rolleLernen = meas(); } closeMenu(); await W(300);
  openMenu('team'); await W(400); out.team = meas(); sel = { i: 0, box: false, slot: null }; rDetail(document.getElementById('mBody')); await W(500); out.teamDetail = meas(); out.teamActs = [...document.querySelectorAll('#mBody .acts button')].map(b => [b.textContent, Math.round(b.getBoundingClientRect().height * 10) / 10]); sel = null; closeMenu(); await W(300);
  openMenu('box'); await W(400); out.box = meas(); closeMenu(); await W(300); openMenu('dex'); await W(500); const d0 = document.querySelector('#mBody .dexcell, #mBody .dx, #mBody [data-d]'); if (d0) { d0.click(); await W(400); } out.dex = meas(); closeMenu(); await W(200); mode = 'world'; return out; });
R.note('Zurück-Messung (Breite×Höhe px): ' + JSON.stringify(backs));
const flat = Object.entries(backs).filter(([k]) => k !== 'teamActs').flatMap(([k, v]) => v.map(x => [k, ...x]));
R.t('6 „Zurück“-Knöpfe gemessen in Tasche (Auswahl, Rolle lernen) und Team-Detail', backs.bagChoose.length && backs.rolleLernen.length && backs.teamDetail.length, backs);
R.t('6 alle „Zurück“-Knöpfe ≥ 48 px hoch', flat.length > 0 && flat.every(x => x[2] >= 48), flat.filter(x => x[2] < 48));
const css = await ev(() => [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter(r => r.selectorText && /(^|[ ,])\.back\b/.test(r.selectorText) && r.style.minHeight).map(r => r.selectorText + ' {min-height:' + r.style.minHeight + '}'));
R.note('CSS .back min-height: ' + JSON.stringify(css));
// 2) Karten-Schriften
const fonts = {};
for (const vp of [[860, 484], [860, 400], [390, 844]]) { await p.setViewportSize({ width: vp[0], height: vp[1] }); await p.waitForTimeout(500);
  for (const lvl of ['here', 'region', 'world']) { const f = await ev(async ([lvl]) => { const W = ms => new Promise(r => setTimeout(r, ms)); if (BM.open) bmClose(); mode = 'world'; openBigMap(); await W(700); bmSetLevel(lvl); await W(900);
      const els = [...document.getElementById('bigMap').querySelectorAll('*')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
      const res = []; for (const e of els) { const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0); if (!own) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; res.push([parseFloat(cs.fontSize), (e.className && e.className.baseVal === undefined ? e.className : e.tagName).toString().slice(0, 24), e.textContent.trim().slice(0, 16)]); }
      bmClose(); await W(300); res.sort((a, b) => a[0] - b[0]); return { n: res.length, min: res[0], low: res.filter(x => x[0] < 12).slice(0, 6) }; }, [lvl]);
    fonts[vp.join('x') + '/' + lvl] = f; } }
await p.setViewportSize({ width: 860, height: 484 });
R.note('Karten-Schriften (min px, Anzahl Texte): ' + JSON.stringify(Object.fromEntries(Object.entries(fonts).map(([k, v]) => [k, [v.n, v.min && v.min[0], v.min && v.min[1] + ':' + v.min[2]]]))));
const small = Object.entries(fonts).filter(([k, v]) => v.low.length);
R.t('K1 alle gemessenen Kartentexte ≥ 12 px (3 Ebenen × 3 Fenster)', Object.values(fonts).every(v => v.n > 3) && small.length === 0, small.map(([k, v]) => [k, v.low]));
R.t('keine Konsolenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
