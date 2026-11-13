// QA Loop C – Punkt 3: Regionswechsel (Himmel-Vorladen/Aufblenden, Torpfosten, Kamera nach Hausverlassen in Morgenau).
//   node test/qa_lc_regions.mjs      Bilder: test/qa_lc_reg_*.png
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('qa_lc_regions.log', 'QA Loop C – Regionswechsel');
const env = await start(); const p = await page(env); await newGame(p, { view: 'third' });
const ev = (f, a) => p.evaluate(f, a); const shot = n => p.screenshot({ path: here('qa_lc_reg_' + n + '.png') });
const TR = [['route2', 'brisenhafen'], ['route3', 'glutschlucht'], ['morgenau', 'route1'], ['route1', 'kupferhain'], ['route3', 'brisenhafen']];
for (const [from, to] of TR) {
  // Startfeld am Ausgang suchen
  const st = await ev(([f, t]) => { const S = MAPS[f]; const key = ['n', 's', 'e', 'w'].find(k => S[k] === t); if (!key) return null; const m = getMap(f), dir = { n: 'up', s: 'down', e: 'right', w: 'left' }[key]; let best = null;
    const mid = key === 'n' || key === 's' ? m.w / 2 : m.h / 2;
    for (let i = 0; i < (key === 'n' || key === 's' ? m.w : m.h); i++) { const x = key === 'e' ? m.w - 1 : key === 'w' ? 0 : i, y = key === 'n' ? 0 : key === 's' ? m.h - 1 : i; const c = tileAt(m, x, y); if (c && !SOLID.has(c) && c !== '~') { if (!best || Math.abs(i - mid) < Math.abs(best.i - mid)) best = { x, y, i }; } }
    return best && { key, dir, x: best.x, y: best.y }; }, [from, to]);
  if (!st) { R.t(`${from} → ${to}: Ausgang vorhanden`, false, 'kein Link'); continue; }
  await ev(() => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1', 'starter']) G.flags[f] = 1; }); // Sperren der Story nicht Gegenstand
  await goMap(p, from, st.x, st.y, st.dir); await p.waitForTimeout(2500);
  await ev(() => { R3.snap = 1; }); await p.waitForTimeout(1200);
  await shot(`${from}_vor_${to}`);
  // Himmel vor dem Wechsel: Region, Vorladen der Nachbarregion
  const pre = await ev(([t]) => { const own = skyRegion(cur), nb = skyRegion(t); const keys = []; try { keys.push(skyFor(nb, skyTime()).key); const hz = horizonFor(nb); if (hz && hz.ok) keys.push(hz.key); } catch (e) { } const st = keys.map(k => { const E = skyTex(k); return E.state; }); return { own, nb, keys, st, pins: W1SKY.pins.length, cross: own !== nb }; }, [to]);
  // Frame-Logger (jeder Frame): Region, fade, mode, map
  await ev(() => { window.__L = []; const t0 = performance.now(); const f = () => { try { __L.push([Math.round(performance.now() - t0), G.map, SKY3.region, +SKY3.fade.toFixed(2), mode, typeof skyActive === 'function' ? skyActive() : null]); } catch (e) { } if (__L.length < 400) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await ev(([d]) => { tryMove(d); }, [st.dir]);
  await p.waitForFunction(([t]) => G.map === t && mode === 'world', [to], { timeout: 14000, polling: 100 }).catch(() => { });
  await p.waitForTimeout(150); await shot(`${from}_nach_${to}_0`); await p.waitForTimeout(900); await shot(`${from}_nach_${to}_1`); await p.waitForTimeout(2500); await shot(`${from}_nach_${to}_2`);
  const L = await ev(() => window.__L);
  const arrive = L.findIndex(r => r[1] !== L[0][1]); const after = L.slice(arrive);
  const first = after[0], minFade = Math.min(...after.filter(r => r[4] === 'world' || r[4] === 'wait').map(r => r[3]));
  R.note(`${from}→${to}: vor=${JSON.stringify(pre)} erster Frame nach Wechsel=${JSON.stringify(first)} (t ms, map, region, fade, mode, skyActive); min fade nach Ankunft=${minFade}; Frames n=${after.length}`);
  R.t(`${from} → ${to}: Nachbar-Himmel vorgeladen (state ok) vor dem Wechsel` + (pre.cross ? '' : ' [gleiche Region]'), !pre.cross || pre.st.every(s => s === 'ok'), pre);
  R.t(`${from} → ${to}: Region wechselt (${pre.own} → ${pre.nb}) und das neue Himmelsbild steht ab dem ersten Frame (fade = 1, kein Aufblenden)`, !pre.cross || (after.length && after[0][2] === pre.nb && after[0][3] >= 0.99), { first, minFade });
}
// ---- Haus verlassen in Morgenau: Blickrichtung, Kameraabstand zur Hauswand
await ev(() => { G.flags.badge2 = 1; });
// Echter Pfad: Spieler läuft in haus_spieler nach unten (P.ang = π) aus der Tür → transit(warpBack) (03-engine.js:69/71); Gegenprobe mit frischem P.ang (undefined)
const camRun = (angInit) => ev(async (angInit) => { G.ret = { map: 'morgenau', x: 4, y: 5 }; loadMap('haus_spieler'); mode = 'world'; await new Promise(r => setTimeout(r, 800)); if (angInit === 'undef') delete P.ang; else P.ang = angInit; P.dir = 'down';
  transit(warpBack, 'morgenau'); await new Promise(r => setTimeout(r, 1200)); const o = { map: G.map, ang0: P.ang, dir0: P.dir }; mode = 'world'; await new Promise(r => setTimeout(r, 3500));
  const c = R3.cam.position; Object.assign(o, { dir: P.dir, ang: P.ang == null ? null : +P.ang.toFixed(2), yaw: +R3.yaw.toFixed(2), cd: +R3.cd.toFixed(2), cam: [c.x, c.y, c.z].map(v => +v.toFixed(2)), player: [P.x, P.y] });
  const B = W1_BUILD; let md = 99, where = null; for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) { if (B.includes(cur.rows[y][x])) { const dx = Math.max(x - c.x, 0, c.x - (x + 1)), dz = Math.max(y - c.z, 0, c.z - (y + 1)), d = Math.hypot(dx, dz); if (d < md) { md = d; where = [x, y]; } } }
  o.wallDist = +md.toFixed(2); o.wallTile = where; return o; }, angInit);
const cam = await camRun(Math.PI); R.note('Morgenau, Hausverlassen mit P.ang = π (zu Fuß aus der Tür): ' + JSON.stringify(cam)); await shot('morgenau_hausverlassen_ang_pi');
const cam2 = await camRun('undef'); R.note('Morgenau, Hausverlassen mit frischem P.ang (undefined): ' + JSON.stringify(cam2)); await shot('morgenau_hausverlassen_ang_undef');
R.t('Morgenau: Blick nach Verlassen des Hauses nach rechts (Dorfstraße) – im echten 3D-Pfad (P.ang = π beim Hinausgehen)', cam.dir === 'right' && Math.abs(cam.yaw + Math.PI / 2) < .3, cam);
R.t('Morgenau: Blick nach rechts auch bei frischem P.ang (Kontrolle)', cam2.dir === 'right', cam2);
R.t('Morgenau: Kamera steht ≥ 0,4 Felder von der Hauswand entfernt (keine Wand im Bild)', cam.wallDist >= 0.4, cam);
R.t('Morgenau: Kameraabstand zum Spieler ≥ 2,0 (Figur nicht zu nah/verdeckt)', cam.cd >= 2.0, cam);
R.t('keine Seitenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
