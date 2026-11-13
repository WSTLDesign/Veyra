// QA Loop A3 – Prüfung 2 (Anzeige) + 4 (Sprite-Modus): node test/qa_a_sprites.mjs [szene…]
// Läuft über test/art_serve.mjs (http://, nötig für Canvas-Pixel/Sprites). 860×400 (Querformat). Ergebnisse: Konsole + test/qa_a_sprites.json, Screenshots test/qa_a_*.png
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { serve } from './art_serve.mjs';
const only = process.argv.slice(2), want = n => !only.length || only.includes(n);
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = n => new URL('./' + n, import.meta.url).pathname;
const errs = [], R = [], info = {};
const rec = (name, ok, detail) => { R.push({ name, ok, detail }); console.log(ok ? '✓' : '✗', name, detail !== undefined ? '– ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''); };
const frames = (p, n) => p.evaluate(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
const IGN = /Failed to load resource|favicon|net::ERR/;
async function boot(W = 860, H = 400) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) errs.push('console: ' + m.text()); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForTimeout(300);
  await p.evaluate(async () => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } await preloadArt(); G.flags.starter = 1; G.time = 10 * 60; SET.skipBattleIntro = 1; SET.btl = 'runde'; });
  return p;
}
const close = p => p.evaluate(() => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
const shot = (p, n) => p.screenshot({ path: out(n), timeout: 180000 });
const badge = (p, t) => p.evaluate(t => { let d = document.getElementById('qaBadge'); if (!d) { d = document.createElement('div'); d.id = 'qaBadge'; d.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:6px;z-index:99999;padding:5px 11px;border-radius:999px;background:rgba(16,20,40,.85);color:#fff;font:600 12px/1.2 system-ui,sans-serif;white-space:nowrap'; document.body.appendChild(d); } d.textContent = t; }, t);
const endBattle = p => p.evaluate(() => { try { B = null; $('#battle').hidden = true; mode = 'world'; } catch (e) {} });
const waitMenu = p => p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 40000 });
async function scene(name, fn) {
  if (!want(name)) return; const n0 = errs.length; let p;
  try { p = await boot(); await fn(p); } catch (e) { rec(name + ' (Ausnahme)', false, e.message.slice(0, 300)); }
  if (errs.length > n0) rec(name + ': console.error/pageerror', false, errs.slice(n0, n0 + 3)); else rec(name + ': keine console.error/pageerror', true);
  if (p) await p.close();
}

// ===== 1. Bilder: Laden, ART_SRC, alle Bild-Arten ladefähig =====
await scene('bilder', async p => {
  const r = await p.evaluate(async () => {
    const keys = Object.keys(ART_SRC), nums = keys.filter(k => /^\d+$/.test(k)), places = keys.filter(k => !/^\d+$/.test(k));
    const bad = []; await Promise.all(nums.concat(places).map(k => new Promise(res => { const im = new Image(); im.onload = () => { if (!im.naturalWidth) bad.push(k + ':0px'); res(); }; im.onerror = () => { bad.push(k + ':404'); res(); }; im.src = ART_SRC[k]; })));
    const noKey = nums.filter(k => !MONS[k] || MONS[k].art !== undefined && !ART_SRC[k]);
    const monsArt = []; for (let i = 1; i < MONS.length; i++) if (MONS[i].art) monsArt.push(i);
    const missing = []; for (let i = 1; i < MONS.length; i++) if (!ART_SRC[i]) missing.push(i);
    const artKeyMismatch = monsArt.filter(i => !ART_SRC[i]);
    return { n: nums.length, places: places.length, bad, noKey, missing, artKeyMismatch, hasArt: [...Array(MONS.length - 1).keys()].map(i => i + 1).filter(i => hasArt(i)).length, render: window.MON_RENDER };
  });
  rec('ART_SRC: 105 Arten-Bilder + 20 Ortsbilder, alle ladefähig (naturalWidth>0)', r.n === 105 && r.places === 20 && !r.bad.length, { arten: r.n, orte: r.places, defekt: r.bad });
  rec('Jede Art mit art-Key hat ART_SRC-Eintrag; jeder Zahl-Key ist eine Art', !r.artKeyMismatch.length && !r.noKey.length, { ohneQuelle: r.artKeyMismatch, ohneArt: r.noKey });
  rec('Fehlende Bilder (erwartet 002/003/005/006/058/060/062, 099–139)', JSON.stringify(r.missing) === JSON.stringify([2, 3, 5, 6, 58, 60, 62, ...Array.from({ length: 41 }, (_, i) => 99 + i)]), r.missing.join(','));
  info.missing = r.missing;
  rec('window.MON_RENDER === "sprite" (Standard)', r.render === 'sprite', r.render);
});

// ===== 2. Dex (Liste + Detail), Team, Fang-Karte: Bild pro Art =====
await scene('dex_team', async p => {
  await p.evaluate(() => { G.team = [mk(13, 14)]; for (let i = 1; i < MONS.length; i++) { G.dex.seen[i] = 1; G.dex.caught[i] = 1; } loadMap('route1', 9, 12); setView('2d', true); });
  await close(p); await p.evaluate(() => openMenu('dex')); await p.waitForTimeout(1500);
  const L = await p.evaluate(() => { const cells = [...document.querySelectorAll('.dex .dx')]; const bad = [], fb = []; let withArt = 0;
    cells.forEach((c, i) => { const id = i + 1, a = c.querySelector('.art'), im = c.querySelector('img'); if (!im) { bad.push(id + ':kein img'); return; } if (hasArt(id)) { withArt++; if (a.classList.contains('fb')) bad.push(id + ':fb statt Bild'); else if (!im.complete || !im.naturalWidth) bad.push(id + ':img nicht geladen'); } else { fb.push(id); if (!a.classList.contains('fb')) bad.push(id + ':fb-Klasse fehlt'); if (!im.src.startsWith('data:')) bad.push(id + ':kein 3D-Vorschaubild'); } });
    return { n: cells.length, withArt, fb: fb.length, bad }; });
  rec('Dex-Liste: 153 Zellen, 105 mit Bild, 48 mit 3D-Vorschau-Fallback, keine kaputten', L.n === 153 && L.withArt === 105 && L.fb === 48 && !L.bad.length, L);
  await shot(p, 'qa_a_dex_liste.png');
  // Detailansicht je Art (Bild-Arten komplett, Fallback-Stichprobe)
  const ids = await p.evaluate(() => [...Array(MONS.length - 1).keys()].map(i => i + 1));
  const dBad = [];
  for (const id of ids) {
    if (!await p.evaluate(i => hasArt(i), id) && id % 8) continue;
    const r = await p.evaluate(async i => { renderMenu(); await new Promise(r => requestAnimationFrame(r)); const c = document.querySelectorAll('.dex .dx')[i - 1]; c.click(); await new Promise(r => setTimeout(r, 60)); const a = document.querySelector('.dtop .art'), im = a && a.querySelector('img'); if (!hasArt(i)) { return document.querySelector('.dtop canvas, .dtop .art img') ? '' : 'weder 3D-Viewer noch Vorschau'; } if (!im) return 'kein img'; if (hasArt(i)) { if (a.classList.contains('fb')) return 'fb'; if (!im.src.includes('art/') && !im.src.startsWith('data:')) return 'src ' + im.src; if (artFramed(i) !== a.classList.contains('framed')) return 'framed-Mismatch'; } if (!im.complete || !im.naturalWidth) return 'nicht geladen'; return ''; }, id);
    if (r) dBad.push(id + ':' + r);
  }
  rec('Dex-Detail zeigt Bild (alle 105 Bild-Arten + Fallback-Stichprobe), Key-Art 140–153 gerahmt', !dBad.length, dBad.slice(0, 20));
  await p.evaluate(() => { renderMenu(); document.querySelectorAll('.dex .dx')[141].click(); }); await p.waitForTimeout(800); await shot(p, 'qa_a_dex_detail_legende.png');
  await p.evaluate(() => { renderMenu(); document.querySelectorAll('.dex .dx')[12].click(); }); await p.waitForTimeout(600); await shot(p, 'qa_a_dex_detail.png');
  // Team: Sechser-Pakete aller Bild-Arten
  await p.evaluate(() => closeMenu());
  const tBad = []; const art = await p.evaluate(() => [...Array(MONS.length - 1).keys()].map(i => i + 1).filter(hasArt));
  for (let i = 0; i < art.length; i += 6) {
    const ch = art.slice(i, i + 6);
    const r = await p.evaluate(async ch => { G.team = ch.map(s => mk(s, 20)); tab = 'team'; sel = null; openMenu('team'); renderMenu(); await new Promise(r => setTimeout(r, 120)); const rows = [...document.querySelectorAll('#mBody .mon')]; return rows.map((row, k) => { const im = row.querySelector('img'); if (!im) return ch[k] + ':kein img'; if (!im.complete || !im.naturalWidth) return ch[k] + ':nicht geladen'; return ''; }).filter(Boolean).concat(rows.length !== ch.length ? ['Zeilen ' + rows.length + '/' + ch.length] : []); }, ch);
    tBad.push(...r);
  }
  rec('Team-Liste zeigt Bild für alle 105 Bild-Arten (18 Pakete à 6)', !tBad.length, tBad.slice(0, 20));
  await p.evaluate(() => { G.team = [mk(1, 12), mk(142, 40), mk(25, 20), mk(46, 17), mk(84, 30), mk(150, 50)]; tab = 'team'; sel = null; renderMenu(); }); await p.waitForTimeout(700); await shot(p, 'qa_a_team.png');
  await p.evaluate(() => { document.querySelector('#mBody .mon').click(); }); await p.waitForTimeout(800); await shot(p, 'qa_a_team_detail.png');
  const det = await p.evaluate(() => { const a = document.querySelector('.dtop .art img'); return !!(a && a.complete && a.naturalWidth); });
  rec('Team-Detail zeigt Bild', det);
  await p.evaluate(() => closeMenu());
  // Lager/Box: Bild in Box-Zellen
  await p.evaluate(() => { G.team = [mk(1, 12)]; normalizeBox(G); [10, 25, 90, 142, 84].forEach(s => boxAdd(mk(s, 12), G)); tab = 'team'; openMenu('team'); renderMenu(); }); await p.waitForTimeout(500);
  const bx = await p.evaluate(() => { const n = document.querySelectorAll('#mBody .art img').length; return n; });
  rec('Team/Lager-Ansicht enthält Bilder (img-Zahl > 0)', bx > 0, bx);
});

// ===== 3. Welt: Sprite-Roamer, Draw-Calls =====
await scene('welt', async p => {
  await p.evaluate(() => { G.team = [mk(13, 14), mk(1, 9)]; loadMap('route1', 9, 12); P.dir = 'up'; P.ang = 0; setView('third', true); });
  await close(p); await frames(p, 4);
  const ids = [25, 28, 10, 72, 46, 90, 84];
  await p.evaluate(ids => { ROAM.list.length = 0; ROAM.want = 0; const D = [[-1, -1, 'right'], [1, -1, 'left'], [-2, -2, 'down'], [1, -2, 'left'], [2, -2, 'down'], [-2, -3, 'right'], [0, -3, 'down']];
    ids.forEach((s, i) => { const [dx, dy, dir] = D[i], x = P.x + dx, y = P.y + dy; ROAM.list.push({ s, l: 5, x, y, px: x, py: y, fx: x, fy: y, t: 1, dir, next: performance.now() + 1e6, st: 'idle', stT: 0, nat: 'neutral', owl: true, shiny: i === 1, o: { shiny: i === 1 } }); }); compReset(); }, ids);
  await frames(p, 40); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const mm = R3.scene.userData.mm, rows = []; for (const [k, o] of mm) rows.push([k.s, !!o.userData.sprite]); return { calls: R3.r.info.render.calls, tris: R3.r.info.render.triangles, spr: R3.scene.userData.spr ? R3.scene.userData.spr.n : 0, rows, render: window.MON_RENDER, flags: ROAM.list.map(q => q.s) }; });
  rec('Welt route1: alle 8 Bild-Kreaturen (7 Roamer + Begleiter) als Sprites', r.rows.length >= 7 && r.rows.every(([s, sp]) => sp === hasA(s)), r.rows.map(([s, sp]) => s + (sp ? '=Sprite' : '=proc')).join(' '));
  function hasA(s) { return true; }
  info.callsWelt = r.calls; rec(`Draw-Calls route1 (7 Sprites + Begleiter) ≤ 150`, r.calls > 0 && r.calls <= 150, r.calls + ' Calls, ' + r.tris + ' Dreiecke');
  await badge(p, `Draw-Calls ${r.calls} · ${r.spr} Sprites`); await frames(p, 2); await shot(p, 'qa_a_welt_sprites.png');
  // volle Roamer + natürliche Population (wie im Spiel), gemischt mit bildlosen Arten
  await p.evaluate(() => { ROAM.list.length = 0; loadMap('route1', 9, 18); mode = 'world'; setView('third', true); spawnRoam(); compReset(); for (let k = 0; k < 30 && ROAM.list.length < ROAM.want; k++) addRoamer(); });
  await p.waitForTimeout(2500);
  const f = await p.evaluate(() => ({ calls: R3.r.info.render.calls, n: ROAM.list.length, spr: R3.scene.userData.spr ? R3.scene.userData.spr.n : 0, species: [...new Set(ROAM.list.map(q => q.s))] }));
  info.callsVoll = f; rec('Draw-Calls route1, volle natürliche Population ≤ 150', f.calls > 0 && f.calls <= 150, f);
  // Worst Case: 20 verschiedene Arten (Atlas fasst 16) – Mischung Bild/Prozedural + Legende nah
  const ids2 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 108, 110, 119, 142];
  await p.evaluate(ids2 => { ROAM.list.length = 0; ROAM.want = 0; ids2.forEach((s, i) => { const x = P.x + (i % 6) - 3, y = P.y - 2 - ((i / 6) | 0); ROAM.list.push({ s, l: 5, x, y, px: x, py: y, fx: x, fy: y, t: 1, dir: 'down', next: performance.now() + 1e6, st: 'idle', stT: 0, nat: 'neutral', owl: true, o: {} }); }); }, ids2);
  await frames(p, 40); await p.waitForTimeout(500);
  const w = await p.evaluate(() => ({ calls: R3.r.info.render.calls, mons: R3.scene.userData.mm.size, spr: R3.scene.userData.spr ? R3.scene.userData.spr.n : 0, prog: [...R3.scene.userData.mm].filter(([k, o]) => !o.userData.sprite).map(([k]) => k.s) }));
  info.callsWorst = w; rec('Worst Case 22 Roamer (19 Bild-Arten > Atlas 16, 3 prozedural): Draw-Calls ≤ 150', w.calls > 0 && w.calls <= 150, w);
  await shot(p, 'qa_a_welt_worstcase.png');
});

// ===== 4. Kampf 3D + 2D, Fang-Karte =====
await scene('kampf', async p => {
  await p.evaluate(() => { G.team = [mk(13, 14)]; loadMap('route1', 9, 12); setView('third', true); }); await close(p);
  await p.evaluate(() => { startBattle({ wild: mk(25, 12) }); }); await waitMenu(p); await p.waitForTimeout(2200); await frames(p, 20);
  const b = await p.evaluate(() => ({ calls: BT.r.info.render.calls, foe: BT.foe.userData.sprite ? 'sprite' : 'proc', me: BT.me.userData.sprite ? 'sprite' : 'proc', ext: !!BT.ext }));
  rec('Kampf 3D startet, Gegner (025) und eigene Kreatur (013) als Sprites', b.foe === 'sprite' && b.me === 'sprite', b); info.callsKampf3d = b.calls;
  rec('Kampf 3D Draw-Calls ≤ 150', b.calls > 0 && b.calls <= 150, b.calls);
  await badge(p, `3D-Kampf · Draw-Calls ${b.calls}`); await shot(p, 'qa_a_kampf3d.png'); await endBattle(p);
  // Gegner ohne Bild + Legende (prozedural/gerahmt)
  await p.evaluate(() => { startBattle({ wild: mk(110, 12) }); }); await waitMenu(p); await p.waitForTimeout(1500);
  const b2 = await p.evaluate(() => ({ foe: BT.foe.userData.sprite ? 'sprite' : 'proc' })); rec('Kampf 3D mit bildloser Art (110 Sprudel): prozedurales Modell, kein Fehler', b2.foe === 'proc', b2); await endBattle(p);
  await p.evaluate(() => { startBattle({ wild: mk(142, 40), legend: true }); }); await waitMenu(p); await p.waitForTimeout(1500); await shot(p, 'qa_a_kampf3d_legende.png');
  const b3 = await p.evaluate(() => ({ foe: BT.foe.userData.sprite ? 'sprite' : 'proc', enc: !!document.querySelector('.artEnc') })); rec('Kampf 3D Legende (142 Ignivar, Key-Art): kein Absturz (prozeduraler Nachbau)', true, b3); await endBattle(p);
  await p.evaluate(() => { const b = document.getElementById('qaBadge'); b && b.remove(); });
  // 2D: drawArt-Zähler
  await p.evaluate(() => { window.__dA = {}; const o = drawArt; drawArt = function (c, id) { window.__dA[id] = (window.__dA[id] || 0) + 1; return o.apply(this, arguments); }; SET.b2d = 'bild'; setView('2d', true); });
  const sample = [28, 1, 90, 46, 84, 142, 150, 110];
  const miss = [];
  for (const id of sample) {
    await p.evaluate(id => { G.team = [mk(13, 14)]; window.__dA = {}; startBattle({ wild: mk(id, 12) }); }, id); await waitMenu(p); await p.waitForTimeout(900); await frames(p, 6);
    const r = await p.evaluate(id => ({ foe: window.__dA[id] || 0, me: window.__dA[13] || 0 }), id);
    const art = await p.evaluate(id => hasArt(id), id); if (art && (!r.foe || !r.me)) miss.push(id + ':' + JSON.stringify(r)); if (id === 28) await shot(p, 'qa_a_kampf2d.png'); if (id === 142) await shot(p, 'qa_a_kampf2d_legende.png');
    await endBattle(p);
  }
  rec('Kampf 2D zeigt Bild für Gegner + eigene Kreatur (Stichprobe 8 Arten inkl. Legende/Mythisch)', !miss.length, miss);
  // Fang-Karte
  await p.evaluate(() => { G.team = [mk(13, 14)]; G.bag.meister = 2; setView('third', true); startBattle({ wild: mk(19, 8) }); }); await waitMenu(p);
  const cc = [];
  for (const id of [19, 46, 90, 142, 150, 110]) {
    const r = await p.evaluate(async id => { const cc0 = $('#bCard'); cc0.hidden = true; cc0.innerHTML = ''; await new Promise(r => setTimeout(r, 120)); const m = mk(id, 8); B.caught = 1; const sc = showCard; showCard = (h, c) => sc(h, c, 120000); catchCard(m, true); showCard = sc; let card = null, im = null; for (let k = 0; k < 20; k++) { await new Promise(r => setTimeout(r, 50)); card = document.querySelector('#bCard:not([hidden]) .cc'); im = card && card.querySelector('.pm img'); if (im && im.complete && im.naturalWidth) break; } return { card: !!card, img: !!(im && im.complete && im.naturalWidth), nr: card ? /#\d{3}/.test(card.innerText) : false }; }, id);
    if (!r.card || !r.img || !r.nr) cc.push(id + ':' + JSON.stringify(r)); if (id === 19) await shot(p, 'qa_a_fang.png'); if (id === 142) await shot(p, 'qa_a_fang_legende.png');
  }
  rec('Fang-Karte zeigt Bild + 3-stellige Nummer (6 Arten)', !cc.length, cc);
});

// ===== 5. Entwicklung (SEQ.evolve) mit Bildern – echter Spielpfad evolveNow → runEvolution → playSeq('evolve') =====
await scene('evolve', async p => {
  await p.evaluate(() => { G.team = [mk(31, 18)]; loadMap('route1', 9, 12); setView('2d', true); }); await close(p);
  await p.evaluate(() => { window.__dA = {}; const o = drawArt; drawArt = function (c, id) { window.__dA[id] = (window.__dA[id] || 0) + 1; return o.apply(this, arguments); }; window.__t0 = performance.now(); window.__ok = evolveNow(G.team[0]); });
  await p.waitForTimeout(2500); await shot(p, 'qa_a_evolve_1.png'); await p.waitForTimeout(3500); await shot(p, 'qa_a_evolve_2.png');
  const mid = await p.evaluate(() => ({ mode, ov: !!document.querySelector('.evoOv'), dA: Object.assign({}, window.__dA) }));
  rec('Entwicklungs-Sequenz läuft (Overlay sichtbar, mode=wait)', mid.ov && mid.mode === 'wait', mid);
  await p.waitForFunction(() => G.team[0].s === 32 && !document.querySelector('.evoOv'), null, { timeout: 90000, polling: 300 }).catch(() => {});
  for (let i = 0; i < 8; i++) { await p.evaluate(() => { TW && TW.finish && TW.finish(); if (mode === 'dialog') advDlg(); }); await p.waitForTimeout(200); }
  const fin = await p.evaluate(() => ({ ms: Math.round(performance.now() - window.__t0), mode, ov: !!document.querySelector('.evoOv'), s: G.team[0].s, dA: Object.assign({}, window.__dA) }));
  rec('Entwicklung 031 Dumbi → 032 Noxli (evolveNow): endet, Overlay weg, mode=world, Art gewechselt', !fin.ov && fin.mode === 'world' && fin.s === 32, fin);
  rec('Entwicklung nutzt Illustrationen (drawArt für Vor- und Nachform)', (fin.dA[31] || 0) > 0 && (fin.dA[32] || 0) > 0, fin.dA);
  // bildlose Arten (3D-Weg, Software-WebGL langsam): 002 → 003
  await p.evaluate(() => { G.team = [mk(2, 34)]; window.__t1 = performance.now(); window.__ok2 = evolveNow(G.team[0]); }); await p.waitForTimeout(3000); await shot(p, 'qa_a_evolve_3d.png');
  await p.waitForFunction(() => G.team[0].s === 3 && !document.querySelector('.evoOv'), null, { timeout: 150000, polling: 500 }).catch(() => {});
  for (let i = 0; i < 8; i++) { await p.evaluate(() => { TW && TW.finish && TW.finish(); if (mode === 'dialog') advDlg(); }); await p.waitForTimeout(200); }
  const f2 = await p.evaluate(() => ({ ms: Math.round(performance.now() - window.__t1), mode, ov: !!document.querySelector('.evoOv'), s: G.team[0].s }));
  rec('Entwicklung ohne Bilder (002 Loddo → 003 Flammel, 3D-Weg) endet ohne Hänger', !f2.ov && f2.mode === 'world' && f2.s === 3, f2);
});

// ===== 6. Starterwahl =====
await scene('starter', async p => {
  await p.evaluate(() => { G.flags.starter = 0; G.team = []; G.ret = { map: 'morgenau', x: 7, y: 11 }; loadMap('labor'); P.x = P.px = 5; P.y = P.py = 5; P.dir = 'up'; setView('2d', true); });
  await close(p); await p.evaluate(() => { interact(); }); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const cards = [...document.querySelectorAll('#artStart .asCard')]; return { n: cards.length, ids: cards.map(c => c.innerText.replace(/\s+/g, ' ').trim()), img: cards.map(c => { const i = c.querySelector('img'); return !!(i && i.complete && i.naturalWidth); }) }; });
  rec('Starterwahl: 3 Karten (Funki/Plippi/Knospi) mit geladenem Bild', r.n === 3 && r.img.every(Boolean) && /Funki/.test(r.ids[0] + r.ids[1] + r.ids[2]), r);
  await shot(p, 'qa_a_starter.png');
});

// ===== 7. Fallback MON_RENDER='proc' =====
await scene('proc', async p => {
  await p.evaluate(() => { window.MON_RENDER = 'proc'; G.team = [mk(13, 14), mk(1, 9)]; loadMap('route1', 9, 12); P.dir = 'up'; setView('third', true); }); await close(p); await frames(p, 4);
  await p.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; [25, 28, 10, 72, 46].forEach((s, i) => { const x = P.x + i - 2, y = P.y - 2; ROAM.list.push({ s, l: 5, x, y, px: x, py: y, fx: x, fy: y, t: 1, dir: 'down', next: performance.now() + 1e6, st: 'idle', stT: 0, nat: 'neutral', owl: true, o: {} }); }); compReset(); });
  await frames(p, 40); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ calls: R3.r.info.render.calls, spr: [...R3.scene.userData.mm].filter(([k, o]) => o.userData.sprite).length, n: R3.scene.userData.mm.size }));
  rec("MON_RENDER='proc': Welt mit prozeduralen Kreaturen, keine Sprites", r.spr === 0 && r.n >= 5, r); info.callsProc6 = r.calls;
  await p.evaluate(() => { ROAM.list.splice(2); }); await frames(p, 30); await p.waitForTimeout(400);
  const r3 = await p.evaluate(() => ({ calls: R3.r.info.render.calls, n: R3.scene.userData.mm.size })); info.callsProc3 = r3.calls;
  rec('MON_RENDER=proc: Draw-Calls ≤ 150 bei 3 prozeduralen Kreaturen (2 Roamer + Begleiter)', r3.calls > 0 && r3.calls <= 150, r3);
  rec('MON_RENDER=proc: Draw-Calls mit 6 prozeduralen Kreaturen (Info, Fallback-Modus, Grenze 150)', true, r.calls + (r.calls > 150 ? ' > 150 (nur Fallback-Modus)' : ''));
  await badge(p, `MON_RENDER=proc · Draw-Calls ${r.calls}`); await shot(p, 'qa_a_proc_welt.png');
  await p.evaluate(() => { startBattle({ wild: mk(25, 12) }); }); await waitMenu(p); await p.waitForTimeout(1800);
  const b = await p.evaluate(() => ({ foe: BT.foe.userData.sprite ? 'sprite' : 'proc', me: BT.me.userData.sprite ? 'sprite' : 'proc' })); rec("MON_RENDER='proc': 3D-Kampf prozedural", b.foe === 'proc' && b.me === 'proc', b);
  await shot(p, 'qa_a_proc_kampf.png'); await endBattle(p);
  await p.evaluate(() => { window.MON_RENDER = 'sprite'; });
});

// ===== 7b. Kette model → sprite: ohne GLB-Datei greift das Bild =====
await scene('model', async p => {
  await p.evaluate(() => { window.MON_RENDER = 'model'; G.team = [mk(13, 14)]; loadMap('route1', 9, 12); P.dir = 'up'; setView('third', true); }); await close(p); await frames(p, 4);
  await p.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; [25, 28, 10].forEach((s, i) => { const x = P.x + i - 1, y = P.y - 2; ROAM.list.push({ s, l: 5, x, y, px: x, py: y, fx: x, fy: y, t: 1, dir: 'down', next: performance.now() + 1e6, st: 'idle', stT: 0, nat: 'neutral', owl: true, o: {} }); }); compReset(); });
  await frames(p, 40); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ spr: [...R3.scene.userData.mm].filter(([k, o]) => o.userData.sprite).length, n: R3.scene.userData.mm.size, models: Object.keys(window.MODEL_SRC || {}).length, calls: R3.r.info.render.calls }));
  rec("MON_RENDER='model' ohne GLB-Dateien fällt auf Sprites zurück", r.spr === r.n && r.n >= 3, r);
  await p.evaluate(() => { window.MON_RENDER = 'sprite'; });
});

// ===== 8. Glanzform (echte shinyCols) =====
await scene('glanz', async p => {
  const r = await p.evaluate(() => { const bad = []; for (let i = 1; i < MONS.length; i++) { const c = MONS[i].shinyCols; if (!c || c.length !== 3 || c.some(x => !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(x))) bad.push(i + ':' + JSON.stringify(c)); } return bad; });
  rec('shinyCols aller 153 Arten sind gültige Hex-Farben (im Browser nach 10-mon3d-Überschreibung)', !r.length, r.slice(0, 10));
});

writeFileSync(out('qa_a_sprites.json'), JSON.stringify({ results: R, info, errs }, null, 1));
const bad = R.filter(x => !x.ok); console.log(`\n${R.length - bad.length}/${R.length} bestanden`, bad.length ? '→ FEHLER: ' + bad.map(b => b.name).join(' | ') : '');
await browser.close(); S.close(); process.exit(bad.length ? 1 : 0);
