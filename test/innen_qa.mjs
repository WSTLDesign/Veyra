// Detailing Innenräume & Höhlen (Agent Innenräume) – QA: jeder Raumtyp + Höhle (auch Höhlen-Stile), Kollision = Darstellung, Draw-Calls/Dreiecke/Texturen,
// Kamera (Kopf nicht im unteren Drittel, kein Durchblick), GPU-Freigabe beim Raumwechsel, Heil-Sequenz. Screenshots test/innen_<raum>.png (860×484).
// Aufruf (unter der Chromium-Sperre): node build.mjs && node test/innen_qa.mjs
import { start, page, newGame, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('innen_qa.log', 'Innenräume & Höhlen – QA');
const env = await start(); const p = await page(env, { w: 860, h: 484 }); await newGame(p, { view: 'third', team: [[1, 14], [4, 12], [7, 12], [16, 10]] });
await p.evaluate(() => { window.VEYRA_DEMO = 1; G.flags.call_first = 1; });
const ev = (f, a) => p.evaluate(f, a);
const go = (id, x, y, d = 'up', hour = 12) => ev(([id, x, y, d, hour]) => { G.ret = { map: 'kupferhain', x: 5, y: 10 }; G.time = hour * 60; loadMap(id, x, y); P.dir = d; P.ang = YAW[d]; mode = 'world'; VILL.list = []; ROAM.list = []; ROAM.want = 0; R3.snap = 1;
  for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world'; for (const s of ['#stCard', '#callOv', '#dlg']) { const e = document.querySelector(s); if (e) e.hidden = true; } }, [id, x, y, d, hour]);
const shot = n => p.screenshot({ path: here(`innen_${n}.png`) });
const meas = () => ev(() => { const i = R3.r.info, v = new THREE.Vector3(); R3.player.getWorldPosition(v); v.y += 1.5; const pv = R3.player.visible; v.project(R3.shown); const U = R3.scene.userData.inn || {}, c = R3.shown.position;
  return { calls: i.render.calls, tris: i.render.triangles, geo: i.memory.geometries, tex: i.memory.textures, head: (1 - v.y) / 2, pv, cam: [c.x, c.y, c.z], kind: U.kind, HC: U.HC || U.LID, b: U.bounds || null }; });

// 1) Räume: Ansichten, Messwerte, Kamera
const ROOMS = [['haus_spieler', 'haus'], ['haus_nachbar', 'oma'], ['huette_glut', 'glut'], ['huette_fluester', 'kraeuter'], ['haus_moewe3', 'leuchtturm'], ['labor', 'labor'], ['laden_kupfer', 'laden'], ['laden_brise', 'hafenmarkt'], ['heil_kupfer', 'station'], ['heil_frost', 'station_frost'],
  ['arena1', 'arena_flora'], ['arena2', 'arena_flut'], ['arena3', 'arena_frost'], ['arena4', 'arena_schatten'], ['liga', 'liga']];
const camBad = [], perf = [];
for (const [id, tag] of ROOMS) {
  const big = /arena|liga/.test(id), H = id === 'liga' ? 17 : big ? 13 : 9;
  await go(id, 5, H - 2, 'up'); await p.waitForTimeout(1600); const m = await meas(); perf.push([id, m.calls, m.tris]); await shot(tag);
  // Kamera an mehreren Stellen/Richtungen
  const spots = big ? [[5, H - 2, 'up'], [3, 5, 'left'], [7, 4, 'right'], [5, 3, 'down']] : [[5, 7, 'up'], [5, 2, 'down'], [3, 4, 'left'], [8, 3, 'right'], [2, 2, 'up'], [8, 6, 'down']];
  for (const [x, y, d] of spots) { const ok = await ev(([x, y]) => !blocked(x, y) || (P.x === x && P.y === y), [x, y]); if (!ok) continue; await go(id, x, y, d); await p.waitForTimeout(700); const q = await meas();
    const [x0, z0, x1, z1] = q.b, inB = q.cam[0] > x0 + .05 && q.cam[0] < x1 - .05 && q.cam[2] > z0 + .05 && q.cam[2] < z1 - .05 && q.cam[1] < q.HC - .05;
    if (!inB || (q.pv && q.head > 2 / 3)) camBad.push(`${id} ${x},${y} ${d}: head=${q.head.toFixed(2)} vis=${q.pv} cam=${q.cam.map(n => n.toFixed(2))}`); }
}
R.note('Räume: ' + perf.map(([id, c, t]) => `${id} ${c} Calls/${(t / 1000).toFixed(0)}k`).join(' · '));
R.t('Innenräume ≤ 60 Draw-Calls und ≤ 120 k Dreiecke', perf.every(([, c, t]) => c <= 60 && t <= 120000), perf.filter(([, c, t]) => c > 60 || t > 120000));
R.t('Kamera innen: in den Wänden, unter der Decke, Kopf nicht im unteren Drittel', camBad.length === 0, camBad);

// 2) Kollision = Darstellung: blockierte Möbelfelder tragen Möbel, freie Felder sind (unter Kopfhöhe) frei
const col = await ev(() => { const out = { bad: [], n: 0 }, rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0);
  for (const id of ['haus_spieler', 'labor', 'laden_kupfer', 'heil_kupfer', 'arena1', 'liga']) { G.ret = { map: 'kupferhain', x: 5, y: 10 }; loadMap(id); R3.mapId = null; draw3d(); const S = R3.scene, fm = S.children.find(o => o.name === 'innFurn'); if (!fm) { out.bad.push(id + ': kein Möbel-Mesh'); continue; }
    const m = cur, HC = S.userData.inn.HC; for (let y = 1; y < m.h - 1; y++)for (let x = 1; x < m.w - 1; x++) { const t = m.rows[y][x], hit = [], low = []; for (const [a, b] of [[.5, .5], [.3, .3], [.7, .7], [.3, .7], [.7, .3]]) { rc.set(new THREE.Vector3(x + a, HC - .05, y + b), dn); rc.far = HC; const hs = rc.intersectObject(fm, false); hit.push(hs.length ? hs[0].point.y : 0); low.push(hs.find(h => h.point.y > .12 && h.point.y < 1.8)); }
      const solid = 'BCKR'.includes(t), top = Math.max(...hit); out.n++;
      if (solid && top < .25) out.bad.push(`${id} ${x},${y} ${t}: kein Möbel`); if (!solid && t === 'o' && low[0]) out.bad.push(`${id} ${x},${y} frei, aber Möbel ${low[0].point.y.toFixed(2)}`); } }
  return out; });
R.t(`Kollision = Darstellung (${col.n} Felder in 6 Räumen geprüft)`, col.bad.length === 0, col.bad.slice(0, 12));
const furnFree = await ev(() => { const bad = []; for (const id in INTERIORS) { const m = getMap(id); for (const n of NPCS[id] || []) { if (n.t === 'starter') continue; if (m.rows[n.y][n.x] !== 'o') bad.push(id + ' ' + n.x + ',' + n.y); } if (m.rows[m.h - 2][5] !== 'o') bad.push(id + ' Eingang'); } return bad; });
R.t('Figuren und Eingangsfeld stehen frei', furnFree.length === 0, furnFree);

// 3) Höhle (Nebelgrotte) + Stile für spätere Höhlenkarten (Glut, Frost, Schatten) als Testkarten
await go('nebelgrotte', 9, 12, 'up'); await p.waitForTimeout(1600); let cv = await meas(); await shot('nebelgrotte'); const caves = [['nebelgrotte', cv.calls, cv.tris, cv.head, cv.pv]];
await go('nebelgrotte', 8, 9, 'left'); await p.waitForTimeout(900); cv = await meas(); await shot('nebelgrotte_mitte'); caves.push(['nebelgrotte Mitte', cv.calls, cv.tris, cv.head, cv.pv]);
await go('nebelgrotte', 15, 3, 'up', 23); await p.waitForTimeout(900); cv = await meas(); caves.push(['nebelgrotte Nord/Nacht', cv.calls, cv.tris, cv.head, cv.pv]);
for (const st of ['glut', 'frost', 'schatten']) { await ev(st => { const id = 'innen_test_' + st; MAPS[id] = Object.assign({}, MAPS.nebelgrotte, { name: 'Testhöhle ' + st, caveStyle: st, enc: null }); NPCS[id] = []; delete cache[id]; delete scenes[id]; }, st);
  await go('innen_test_' + st, 8, 9, 'left'); await p.waitForTimeout(1300); cv = await meas(); await shot('hoehle_' + st); caves.push(['Stil ' + st, cv.calls, cv.tris, cv.head, cv.pv]); }
R.note('Höhlen: ' + caves.map(([n, c, t, h]) => `${n} ${c} Calls/${(t / 1000).toFixed(0)}k Kopf ${h.toFixed(2)}`).join(' · '));
R.t('Höhlen ≤ 60 Draw-Calls und ≤ 200 k Dreiecke', caves.every(([, c, t]) => c <= 60 && t <= 200000), caves);
R.t('Höhlen-Kamera: Kopf nicht im unteren Drittel', caves.every(([, , , h, v]) => !v || h <= 2 / 3), caves.map(q => q[0] + ':' + q[3].toFixed(2)));
const lidOk = await ev(() => { const U = R3.scene.userData.inn; return !!U && R3.shown.position.y < U.LID - .3; });
R.t('Höhlen-Kamera bleibt unter dem Felsdeckel', lidOk);

// 4) GPU-Speicher: Räume mehrfach durchlaufen → kein Wachstum
const seq = [];
for (let r = 0; r < 4; r++) { for (const [id, x, y] of [['haus_spieler', 5, 7], ['labor', 5, 7], ['heil_kupfer', 5, 7], ['nebelgrotte', 9, 12], ['kupferhain', 5, 10]]) { await go(id, x, y); await p.waitForTimeout(500); }
  seq.push(await ev(() => ({ g: R3.r.info.memory.geometries, t: R3.r.info.memory.textures }))); }
R.note('Speicher je Runde (Geometrien/Texturen): ' + seq.map(s => s.g + '/' + s.t).join(' → '));
R.t('kein Wachstum von renderer.info.memory nach Runde 1 (±3)', seq.slice(1).every(s => s.g <= seq[1].g + 3 && s.t <= seq[1].t + 3), seq);
const rel = await ev(() => { const S = scenes.labor, U = S && S.userData.inn; return U ? { rel: !!U.released, tex: U.tex.length } : null; });
R.t('Raum-Texturen/Geometrien werden beim Verlassen freigegeben', rel && rel.rel, rel);

// 5) Heil-Sequenz: scharfe Kreaturenbilder, Licht am Heilgerät, Ende sauber
await go('heil_kupfer', 5, 4, 'up', 15); await p.waitForTimeout(1200);
await ev(() => { G.team.forEach((m, i) => m.hp = Math.max(1, Math.round(stat(m, 'hp') * [.1, .5, .3, .8][i % 4]))); talk(NPCS.heil_kupfer[0]); });
await p.waitForTimeout(200); await p.click('#dlgOpts button');
let mid = null; for (let i = 0; i < 40; i++) { await p.waitForTimeout(100); mid = await ev(() => { const o = document.querySelector('.healOv.inn'); if (!o) return null; const pics = [...o.querySelectorAll('.hoPic canvas, .hoPic img')];
  return { lit: o.querySelectorAll('.hoSlot.lit').length, n: o.querySelectorAll('.hoSlot').length, pics: pics.map(e => e.tagName === 'CANVAS' ? { w: e.width, cw: e.getBoundingClientRect().width, ok: e.closest('.cpic') ? e.closest('.cpic').dataset.pic : '?' } : { w: e.naturalWidth, cw: e.getBoundingClientRect().width, ok: 'img' }), uLit: (R3.scene.userData.inn.heal || {}).material ? R3.scene.userData.inn.heal.material.uniforms.uLit.value : -1 }; });
  if (mid && mid.lit >= 2) break; }
await shot('heilsequenz');
R.t('Heil-Sequenz zeigt jedes Team-Mitglied im Kapselplatz', mid && mid.n === 4, mid);
R.t('Kreaturenbilder scharf (Bildpunkte ≥ Anzeigegröße, Bild geladen)', mid && mid.pics.length === 4 && mid.pics.every(q => q.w >= q.cw - 1 && q.ok !== 'none'), mid && mid.pics);
R.t('Heilgerät im Raum leuchtet synchron (Kapselplätze)', mid && mid.uLit >= 1, mid && mid.uLit);
for (let i = 0; i < 60 && await ev(() => !!document.querySelector('.healOv') || mode === 'wait'); i++) await p.waitForTimeout(100);
await ev(() => { for (let i = 0; i < 5 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
R.t('Heil-Sequenz endet: Team geheilt, Modus Welt, Overlay weg', await ev(() => G.team.every(m => m.hp === stat(m, 'hp')) && mode === 'world' && !document.querySelector('.healOv')));
await go('heil_kupfer', 5, 4, 'up', 21); await p.waitForTimeout(900); await shot('station_nacht'); await go('haus_spieler', 5, 6, 'up', 21); await p.waitForTimeout(900); await shot('haus_nacht');

// 6) 2D-Ansicht der Innenräume läuft weiter
const d2 = await ev(() => { try { loadMap('haus_spieler', 5, 7); setView('2d', true); draw(); setView('third', true); return true; } catch (e) { return e.message; } });
R.t('2D-Ansicht eines Innenraums zeichnet fehlerfrei', d2 === true, d2);
R.t('keine Seitenfehler', p.errs.length === 0, p.errs.slice(0, 6));
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
