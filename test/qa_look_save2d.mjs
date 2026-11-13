// QA Look L3 – Prüfungen 5 + 6 (+ I1): Einstellungs-Migration (alte SET-Werte), Altstände laden, Start immer 3D, 2D-Modus versteckt (HUD ohne Umschalter, Optionen › Erweitert),
// Optionen „Auto“ / „Grafikstufe“ (I1) wirken. Aufruf: node build.mjs && node test/qa_look_save2d.mjs → test/qa_look_save2d.json
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { readFileSync, writeFileSync } from 'fs';
const S = await serve(), br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = { checks: [] }, errs = [];
const ok = (n, c, d = '') => { out.checks.push({ n, ok: !!c, d }); console.log((c ? '✓ ' : '✗ ') + n + (d ? ' – ' + d : '')); };
const fx = n => readFileSync(new URL('./fixtures/' + n, import.meta.url), 'utf8');
async function page(init, w = 860, h = 400) {
  const p = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  if (init) await p.addInitScript(([set, save]) => { try { if (set != null) localStorage.setItem('veyra_set', JSON.stringify(set)); if (save != null) localStorage.setItem('veyra_save_v1', save); } catch (e) { } }, [init.set ?? null, init.save ?? null]);
  await p.goto(S.url + 'index.html', { waitUntil: 'load' }); return p;
}
const getSet = p => p.evaluate(() => ({ res: SET.res, fps: SET.fps, quality: SET.quality, gfx: SET.gfx, view: SET.view, view2d: SET.view2d, lookV: SET.lookV, shadows: SET.shadows, dist: SET.dist }));
// ---------- 5a: Einstellungs-Migration ----------
console.log('5a Einstellungs-Migration');
const cases = [
  ['alte Standards (1440 / 30 fps / eigene / view 2d)', { res: '1440', fps: 30, quality: 'eigene', view: '2d', shadows: 1, light: 1, particles: 1, dist: 'mittel' }, s => s.res === 'auto' && s.fps === 60 && s.quality === 'auto' && s.view === 'third' && s.gfx === 'auto' && s.lookV === 1],
  ['leere Einstellungen (Neuinstallation)', null, s => s.res === 'auto' && s.fps === 60 && s.quality === 'auto' && s.gfx === 'auto' && s.view === 'third'],
  ['bewusst 1080p / 60 fps / hoch bleibt', { res: '1080', fps: 60, quality: 'hoch', view: '2d' }, s => s.res === '1080' && s.fps === 60 && s.quality === 'hoch' && s.view === 'third'],
  ['bewusst nativ / unbegrenzt bleibt', { res: 'native', fps: 0, quality: 'eigene' }, s => s.res === 'native' && s.fps === 0 && s.quality === 'eigene'],
  ['bewusst 720p / 30 fps / niedrig bleibt', { res: '720', fps: 30, quality: 'niedrig', shadows: 0, light: 0, particles: 0, dist: 'nah' }, s => s.res === '720' && s.fps === 30 && s.quality === 'niedrig' && s.shadows === 0 && s.dist === 'nah'],
  ['bewusst 1440 + 60 fps (nur fps geändert) bleibt', { res: '1440', fps: 60, quality: 'eigene' }, s => s.res === '1440' && s.fps === 60],
  ['bewusst 1440 + 30 fps nach der Migration (lookV 1) bleibt', { res: '1440', fps: 30, quality: 'eigene', lookV: 1, gfx: 'auto' }, s => s.res === '1440' && s.fps === 30],
  ['ungültige Auflösung → auto', { res: 'abc', fps: 60, quality: 'hoch' }, s => s.res === 'auto'],
  ['ungültige Grafikstufe → auto', { gfx: 'ultra' }, s => s.gfx === 'auto'],
  ['SET.view2d=1 (bewusst Draufsicht) bleibt', { view2d: 1 }, s => s.view === '2d' && s.view2d === 1]
];
out.migration = [];
for (const [n, set, test] of cases) { const p = await page({ set }); const s = await getSet(p); const r = test(s); out.migration.push({ n, set, result: s, ok: r }); ok('S ' + n, r, JSON.stringify(s)); await p.close(); }
// ---------- 5b: Spielstände aus test/fixtures laden ----------
console.log('5b Altstände');
for (const f of ['old_save_pre_a1.json', 'old_save_4orden.json']) {
  const raw = fx(f), sv = JSON.parse(raw), p = await page({ save: raw, set: { res: '1440', fps: 30, quality: 'eigene', view: '2d' } });
  await p.waitForTimeout(500); const vis = await p.evaluate(() => !$('#tCont').hidden);
  await p.click('#iPrompt').catch(() => { }); await p.waitForTimeout(400); await p.click('#iSkip').catch(() => { }); await p.waitForTimeout(900);
  ok(`F ${f}: Titel zeigt „Fortsetzen“`, vis || await p.evaluate(() => !$('#tCont').hidden));
  await p.click('#tCont'); await p.waitForTimeout(4000);
  const r = await p.evaluate(() => ({ mode, view, map: G.map, team: G.team.length, box: G.box ? G.box.flat().filter(Boolean).length : 0, dexSeen: Object.keys(G.dex.seen).length, name: G.name, sv: G.saveVersion, wr: !!R3 }));
  const n0 = (sv.team || []).length; ok(`F ${f}: lädt, Welt, 3D-Start (view third), Team ${n0} → ${r.team}`, r.mode !== 'title' && r.view === 'third' && r.team >= n0 && r.team > 0, JSON.stringify(r));
  out['fixture_' + f] = r; await p.close();
}
// Spielstand mit G.view '2d' startet trotzdem in 3D
{ const sv = JSON.parse(fx('old_save_pre_a1.json')); sv.view = '2d'; const p = await page({ save: JSON.stringify(sv) }); await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(900); await p.click('#tCont'); await p.waitForTimeout(3500);
  const v = await p.evaluate(() => ({ view, gview: G.view, mode })); ok('F2 Spielstand mit view „2d“ startet in 3D', v.view === 'third', JSON.stringify(v)); await p.close(); }
// Neues Spiel startet immer 3D
{ const p = await page({ set: { view: '2d' } }); await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(900); await p.click('#tNew'); await p.waitForTimeout(500);
  await p.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } }); await p.waitForTimeout(2500);
  const v = await p.evaluate(() => ({ view, mode })); ok('F3 Neues Spiel (Altwert view „2d“) startet in 3D', v.view === 'third', JSON.stringify(v));
  // ---------- 6: 2D-Modus versteckt ----------
  console.log('6 2D-Modus versteckt');
  await p.evaluate(() => { G.flags.starter = 1; G.team = [mk(13, 14)]; loadMap('route1', 9, 12); mode = 'world'; setView('third', true); }); await p.waitForTimeout(6000);
  const hud = await p.evaluate(() => { const e = document.querySelector('#viewBtn'); const cs = e ? getComputedStyle(e) : null; const r = e ? e.getBoundingClientRect() : null; return { exists: !!e, hidden: e ? e.hidden : null, display: cs && cs.display, w: r && r.width, h: r && r.height, hudBtns: [...document.querySelectorAll('#hud button, #hud [role=button], .hud button')].filter(b => { const c = getComputedStyle(b); return c.display !== 'none' && c.visibility !== 'hidden' && b.getBoundingClientRect().width > 0; }).map(b => (b.id || b.className) + ':' + (b.textContent || '').trim().slice(0, 8)) }; });
  ok('H1 HUD ohne Umschalt-Button (#viewBtn unsichtbar)', hud.hidden === true || hud.display === 'none' || !hud.w, JSON.stringify(hud));
  ok('H2 Mehrere 2D/3D-Texte im sichtbaren HUD? kein Treffer „2D“/„3D“', !hud.hudBtns.some(t => /2D|3D|Ansicht/.test(t)), hud.hudBtns.join(', '));
  // Optionen › Erweitert
  await p.evaluate(() => openMenu('game')); await p.waitForTimeout(1200);
  const adv = await p.evaluate(() => { const d = document.querySelector('details.adv'); if (!d) return { has: false }; const sm = d.querySelector('summary'); const btns = [...d.querySelectorAll('.seg button')].map(b => b.textContent); return { has: true, open: d.open, summary: sm && sm.textContent.trim(), btns }; });
  ok('H3 Optionen › Erweitert vorhanden, eingeklappt', adv.has && !adv.open && /Erweitert/.test(adv.summary), JSON.stringify(adv));
  await p.evaluate(() => { const d = document.querySelector('details.adv'); d.open = true; d.dispatchEvent(new Event('toggle')); }); await p.waitForTimeout(300);
  const btns = await p.evaluate(() => [...document.querySelectorAll('details.adv .seg button')].map(b => b.textContent));
  ok('H4 Erweitert › Ansicht: 3D · Ego · Draufsicht', btns.includes('3D') && btns.includes('Ego') && btns.includes('Draufsicht'), btns.join(' | '));
  // Draufsicht an → 2D
  await p.evaluate(() => { [...document.querySelectorAll('details.adv .seg button')].find(b => b.textContent === 'Draufsicht').click(); }); await p.waitForTimeout(1500);
  let w2 = await p.evaluate(() => ({ view, v2: SET.view2d, saved: JSON.parse(localStorage.getItem('veyra_set')).view2d }));
  ok('H5 Umschalten auf Draufsicht funktioniert (view „2d“, gespeichert)', w2.view === '2d' && w2.v2 === 1 && w2.saved === 1, JSON.stringify(w2));
  // 2D-Kamera/Zeichnung läuft: Canvas #cv sichtbar
  const cvVis = await p.evaluate(() => { const c = document.getElementById('world'); const r = c.getBoundingClientRect(); return { w: r.width, h: r.height, disp: getComputedStyle(c).display, hidden: c.hidden }; });
  ok('H6 2D-Ansicht zeichnet (#world sichtbar)', cvVis.w > 100 && cvVis.disp !== 'none' && !cvVis.hidden, JSON.stringify(cvVis));
  await p.evaluate(() => { [...document.querySelectorAll('details.adv .seg button')].find(b => b.textContent === '3D').click(); }); await p.waitForTimeout(2500);
  w2 = await p.evaluate(() => ({ view, v2: SET.view2d })); ok('H7 zurück auf 3D', w2.view === 'third' && w2.v2 === 0, JSON.stringify(w2));
  // Neustart: Draufsicht aus → 3D; mit Draufsicht an → 2D (bewusste Wahl bleibt)
  // ---------- I1: Auto-Optionen ----------
  console.log('I1 Optionen Auto / Grafikstufe');
  const rows = await p.evaluate(() => [...document.querySelectorAll('#optBody .orow, #mBody .orow')].map(r => ({ l: r.querySelector('b').textContent, b: [...r.querySelectorAll('.seg button')].map(x => x.textContent + (x.classList.contains('on') ? '*' : '')) })).filter(r => /Qualit|Aufl|Grafik|Bildrate/.test(r.l)));
  out.optionRows = rows; console.log(JSON.stringify(rows));
  const q = rows.find(r => /Qualitätsstufe/.test(r.l)), rs = rows.find(r => /Auflösung/.test(r.l)), gs = rows.find(r => /Grafikstufe/.test(r.l));
  ok('I1a „Qualitätsstufe“ hat Auto', q && q.b.some(x => /^Auto/.test(x)), JSON.stringify(q)); ok('I1b „Auflösung“ hat Auto', rs && rs.b.some(x => /^Auto/.test(x)), JSON.stringify(rs)); ok('I1c Zeile „Grafikstufe“ mit Auto/Niedrig/Mittel/Hoch', gs && ['Auto', 'Niedrig', 'Mittel', 'Hoch'].every(t => gs.b.some(x => x.startsWith(t))), JSON.stringify(gs));
  const clickSeg = (label, text) => p.evaluate(([l, t]) => { const r = [...document.querySelectorAll('.orow')].find(r => r.querySelector('b').textContent === l); [...r.querySelectorAll('.seg button')].find(b => b.textContent === t).click(); }, [label, text]);
  await clickSeg('Grafikstufe', 'Niedrig'); await p.waitForTimeout(400);
  let s = await p.evaluate(() => ({ gfx: SET.gfx, tier: PERF.tier, q: SET.quality, saved: JSON.parse(localStorage.getItem('veyra_set')).gfx, sh: R3 && R3.sun ? R3.sun.castShadow : null }));
  ok('I1d Grafikstufe „Niedrig“: SET.gfx low, PERF.tier low, gespeichert', s.gfx === 'low' && s.tier === 'low' && s.saved === 'low', JSON.stringify(s));
  await clickSeg('Grafikstufe', 'Hoch'); await p.waitForTimeout(400); s = await p.evaluate(() => ({ gfx: SET.gfx, tier: PERF.tier, sh: perfTier().shadow })); ok('I1e Grafikstufe „Hoch“: Stufe high, Schatten 1024', s.gfx === 'high' && s.tier === 'high' && s.sh === 1024, JSON.stringify(s));
  await clickSeg('Auflösung', '720p'); await p.waitForTimeout(400); s = await p.evaluate(() => ({ res: SET.res, q: SET.quality, h: R3.r.domElement.height })); ok('I1f Auflösung 720p → „Eigene“ Qualität, Canvas ≤ 720', s.res === '720' && s.q === 'eigene' && s.h <= 720, JSON.stringify(s));
  await clickSeg('Auflösung', 'Auto'); await p.waitForTimeout(400); s = await p.evaluate(() => ({ res: SET.res, scale: PERF.scale })); ok('I1g Auflösung Auto setzt SET.res auto', s.res === 'auto', JSON.stringify(s));
  await clickSeg('Qualitätsstufe', 'Hoch'); await p.waitForTimeout(300); await clickSeg('Qualitätsstufe', 'Auto'); await p.waitForTimeout(500);
  s = await p.evaluate(() => ({ q: SET.quality, res: SET.res, gfx: SET.gfx, fps: SET.fps, tier: PERF.tier })); ok('I1h Qualitätsstufe Auto setzt PRESET.auto (res auto, gfx auto, 60 fps)', s.q === 'auto' && s.res === 'auto' && s.gfx === 'auto' && s.fps === 60, JSON.stringify(s));
  await p.close(); }
ok('Z keine Seitenfehler', errs.length === 0, errs.slice(0, 3).join(' | '));
writeFileSync(new URL('./qa_look_save2d.json', import.meta.url), JSON.stringify(out, null, 1));
const bad = out.checks.filter(c => !c.ok); console.log(bad.length ? 'FEHLER: ' + bad.length : 'Alle ' + out.checks.length + ' Prüfungen grün.');
await br.close(); S.close();
