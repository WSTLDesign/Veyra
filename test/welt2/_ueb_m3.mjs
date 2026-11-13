// Übergänge & Bewegung (Agent Übergänge & Bewegung, 12.11.) – Abnahme. EIN Chromium (Sperre .chromium.lock, s. AGENTS.md), SwiftShader, 860×484 quer.
//   node build.mjs && node test/uebergaenge_qa.mjs
//   Vorher-Messung gegen einen alten Build:  UE_DIST=/pfad/zu/dist UE_VORHER=1 node test/uebergaenge_qa.mjs   (nur Messwerte, keine Abnahme)
// (1) Jeder Ein-/Ausgang der ersten Abschnitte (Morgenau ↔ Haus, Labor, Route 1, Kupferhain, Kreaturenstation, Route 2 ↔ Nebelgrotte) wird per simuliertem
//     Joystick (Maus-Zeiger auf der linken Hälfte) aus zwei Richtungen mit seitlichem Versatz angelaufen → Erwartung: Auslösen beim ERSTEN Anlauf,
//     Ladebildschirm genau bei Gebietswechseln (nie bei Innenräumen), kein Zurückspringen, Ankunft außerhalb der Gegenzone. Dazu 2D-Modus (Taste gehalten).
// (2) Spielstand nach den Wechseln (save → localStorage → loadSave) korrekt, keine Konsolenfehler.
// (3) Messwerte Gehen/Rennen: Tempo, Anfahren, Bremsweg, Drehen, Kamerafolge, Totzone, Wand-Gleiten, Ecke.
// Bilder: test/uebergaenge/<vorher|nachher>_*.webp · Messwerte: test/uebergaenge/messwerte_<vorher|nachher>.json · Log: test/uebergaenge_qa.log
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const VORHER = !!process.env.UE_VORHER, TAG = VORHER ? 'vorher' : 'nachher';
const ROOT = normalize(process.env.UE_DIST || fileURLToPath(new URL('../../dist/', import.meta.url))).replace(/\/+$/, '') + '/';
const OUT = fileURLToPath(new URL('./_ueb_m3_out/', import.meta.url)), LOG = fileURLToPath(new URL('./_ueb_m3.log', import.meta.url)), TMP = OUT + '_tmp.png';
mkdirSync(OUT, { recursive: true }); writeFileSync(LOG, `Übergänge & Bewegung – ${TAG} – ${new Date().toISOString()}\n`);
const log = s => { console.log(s); appendFileSync(LOG, s + '\n'); };
let pass = 0, fail = 0; const t = (name, ok, info) => { ok ? pass++ : fail++; log(`${ok ? '✓' : '✗'} ${name}${info !== undefined ? '  ' + JSON.stringify(info) : ''}`); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.css': 'text/css', '.mp4': 'video/mp4' };
const srv = createServer(async (rq, rs) => { let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(ROOT, p)); if (!f.startsWith(ROOT)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL0 = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 860, height: 484 }, deviceScaleFactor: 1 }); const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|favicon|ReadPixels/.test(m.text())) errs.push(m.text().slice(0, 240)); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await page.addInitScript(() => { try { localStorage.setItem('veyra_set', JSON.stringify({ res: '720', gfx: 'low', fps: 0, hudDim: 'aus', modelle3d: true, ctrl: 'dyn', inV: 1, inHint: 1 })); } catch (e) { } });
await page.goto(URL0 + 'index.html?modelle3d=1', { waitUntil: 'load' });
try { await page.click('#iPrompt', { timeout: 5000 }); } catch (e) { } await page.waitForTimeout(500);
try { await page.click('#iSkip', { timeout: 5000 }); } catch (e) { } await page.waitForTimeout(900);
for (let i = 0; i < 6; i++) { if (await page.evaluate(() => { const b = document.getElementById('tNew'); return !!b && b.offsetParent !== null; })) break; try { await page.click('#iSkip', { timeout: 2000 }); } catch (e) { } await page.waitForTimeout(1500); }
await page.click('#tNew', { timeout: 60000 }); await page.waitForTimeout(400);
const ev = (f, a) => page.evaluate(f, a);
const shot = async name => { const b = await page.screenshot(); writeFileSync(TMP, b); execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=80)', TMP, OUT + TAG + '_' + name + '.webp']); };
// ---------- Hilfen im Spiel ----------
await ev(() => {
  for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); }
  G.flags.starter = 1; G.flags.firstcatch = 1; SET.skipBattleIntro = 1; G.team = [mk(1, 12)]; G.bag.kapsel = 5;
  for (const id in NPCS) for (const n of NPCS[id]) if (n.t === 'trainer' && n.flag) G.flags[n.flag] = 1;
  addRoamer = function () { }; ROAM.list = []; ROAM.want = 0; spawnVill = function () { VILL.list = []; VILL.map = cur && cur.id; }; VILL.list = [];
  const U = window.UE = { bumps: 0, ld: 0, fade: 0, rec: null, auto: true };
  // Fester Takt (SwiftShader schafft nur wenige Bilder/s; dt wäre auf 120 ms gedeckelt): Bewegung läuft in 1/60-s-Schritten über UE.step, echte Zeiger-Eingaben steuern den Stick
  U.sim = true; U.simT = 0; const _fmU = freeMove; freeMove = function () { if (U.sim && !U.simCall) return; return _fmU.apply(this, arguments); };
  U.step = n => { for (let i = 0; i < n; i++) { if (mode !== 'world') break; U.simCall = 1; try { freeMove(1000 / 60); moveTick(1000 / 60); } finally { U.simCall = 0; } U.simT += 1000 / 60;
    if (U.rec) U.rec.push({ t: U.simT, x: P.px, y: P.py, a: P.ang ?? 0, v: P.v || 0, c: (window.CAM || {}).yaw ?? 0, m: cur.id }); } return U.simT; };
  const _sfx = sfx; sfx = function (k) { if (k === 'bump') U.bumps++; return _sfx.apply(this, arguments); };
  // Dialoge (Story-Hinweise beim Betreten) automatisch weiterklicken
  setInterval(() => { if (!U.auto || mode !== 'dialog') return; try { const o = document.querySelector('#dlgOpts button'); if (o) { o.click(); return; } TW && TW.finish && TW.finish(); advDlg(); } catch (e) { } }, 120);
  const f = () => { requestAnimationFrame(f); const l = document.getElementById('ldOv'); if (l && !l.hidden && l.classList.contains('on')) U.ldOn = 1; const fd = document.getElementById('fade'); if (fd && fd.classList.contains('on')) U.fdOn = 1;
    if (U.rec && cur && !U.sim) U.rec.push({ t: performance.now(), x: P.px, y: P.py, a: P.ang ?? 0, v: P.v || 0, c: (window.CAM || {}).yaw ?? 0, m: cur.id }); };
  requestAnimationFrame(f);
  U.inside = id => !!INTERIORS[id] || !MAPS[id];
  // Öffnungen einer Karte (unabhängig vom Spielcode berechnet): Türen/E mit Zugangsfeld, Kartenränder als zusammenhängende Lücken
  U.portals = () => { const m = cur, L = [], ok = (x, y) => { const t = tileAt(m, x, y); return t !== null && !SOLID.has(t) && t !== 'E' && !m.doors[t]; };
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = m.rows[y][x]; if (t !== 'E' && !m.doors[t]) continue; for (const [dx, dy] of Object.values(DIRV)) if (ok(x + dx, y + dy)) L.push({ k: 'door', to: t === 'E' || m.doors[t] === '@out' ? (G.ret && G.ret.map) : m.doors[t], x, y, nx: -dx, ny: -dy, w: 1 }); }
    const lk = m.links || {}; for (const [key, nx, ny] of [['n', 0, -1], ['s', 0, 1], ['w', -1, 0], ['e', 1, 0]]) { if (!lk[key]) continue; const n = key === 'n' || key === 's' ? m.w : m.h; let run = [];
      const flush = () => { if (run.length) { const c = run.reduce((a, b) => a + b, 0) / run.length, horiz = key === 'n' || key === 's'; L.push({ k: 'edge', key, to: lk[key], x: horiz ? c : key === 'w' ? 0 : m.w - 1, y: horiz ? (key === 'n' ? 0 : m.h - 1) : c, nx, ny, w: run.length }); } run = []; };
      for (let i = 0; i < n; i++) { const x = key === 'w' ? 0 : key === 'e' ? m.w - 1 : i, y = key === 'n' ? 0 : key === 's' ? m.h - 1 : i, tt = tileAt(m, x, y); if (tt !== null && !SOLID.has(tt)) run.push(i); else flush(); } flush(); }
    return L; };
  U.inZone = (px, py) => U.portals().some(q => { const rx = px - q.x, ry = py - q.y, al = -(rx * q.nx + ry * q.ny), la = Math.abs(rx * q.ny - ry * q.nx); return al >= -.6 && al <= .95 && la <= (q.w - 1) / 2 + .76; });
  // Anlauf planen: Treffpunkt an der Öffnung mit seitlichem Versatz e, Richtung um th gegen die Achse gedreht, Start L Felder davor (Weg frei)
  U.plan = (q, e, th) => { const lx = -q.ny, ly = q.nx, face = q.k === 'door' ? -.5 : .5, hx = q.x + q.nx * face + lx * e, hy = q.y + q.ny * face + ly * e;
    for (const tt of [th, th * .6, th * 1.8, 0, -th * .6]) for (const L of [3.2, 2.6, 2, 1.5, 1.2]) { const c = Math.cos(tt), s = Math.sin(tt), dx = q.nx * c + lx * s, dy = q.ny * c + ly * s, sx = hx - dx * L, sy = hy - dy * L;
      let okp = true; for (let k = 0; k <= L - .7; k += .2) { const px = sx + dx * k, py = sy + dy * k; for (const [ox, oy] of (k <= L - 1.3 ? [[0, 0], [-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]] : [[0, 0]])) { const t = tileAt(cur, Math.round(px + ox), Math.round(py + oy)); const tx = Math.round(px + ox), ty = Math.round(py + oy); if (t === null || SOLID.has(t) || t === 'E' || cur.doors[t] || npcAt(tx, ty)) { okp = false; break; } } if (!okp) break; }
      if (okp) return { sx, sy, ang: Math.atan2(-dx, -dy), th: tt, L }; } return null; };
});
// Spielfigur auf einer Karte an eine (gebrochene) Stelle setzen, Blick + Kamera ausrichten
async function place(map, x, y, ang, ret) {
  await ev(([m, x, y, r]) => { if (r) G.ret = r; mode = 'world'; if (view === '2d') setView('third', 1); loadMap(m, Math.round(x), Math.round(y)); }, [map, x, y, ret]);
  await page.waitForTimeout(350);
  await ev(([x, y, a]) => { P.px = x; P.py = y; P.x = P.fx = Math.round(x); P.y = P.fy = Math.round(y); G.px = P.x; G.py = P.y; P.ang = a; P.v = 0; P.tv = 0; P.walk = false;
    if (typeof dirFromAng === 'function') dirFromAng(); if (R3) { R3.yaw = a; R3.snap = 1; } if (INP && INP.camReset) INP.camReset(); if (typeof compReset === 'function') compReset(); mode = 'world'; }, [x, y, ang]);
  await page.waitForTimeout(550);
}
const SX = 215, SY = 330;
const sim = ms => ev(n => UE.step(n), Math.round(ms * 60 / 1000));
async function stickDown(dx, dy) { await page.mouse.move(SX, SY); await page.mouse.down(); for (let i = 1; i <= 4; i++) await page.mouse.move(SX + dx * i / 4, SY + dy * i / 4); }
const stickUp = () => page.mouse.up();
const waitWorld = async (ms = 5000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const ok = await ev(() => mode === 'world' && !(window.LADEN && LADEN.active)); if (ok) return true; await page.waitForTimeout(60); } return false; };
const R = { anlauf: [], d2: [], bewegung: {}, laden: [] };
// ---------- (1) Anläufe 3D ----------
// Szenarien: [Startkarte, Rückkehr-Info (Innenräume), Filter Öffnung, Name]
const NUR_B = !!process.env.UE_NUR_BEWEGUNG; // nur Messwerte Bewegung
const SC = NUR_B ? [] : [
  ['morgenau', null, q => q.k === 'door' && q.to === 'haus_spieler', 'Morgenau → Haus'],
  ['haus_spieler', { map: 'morgenau', x: 4, y: 5 }, q => q.k === 'door', 'Haus → Morgenau'],
  ['morgenau', null, q => q.k === 'door' && q.to === 'labor', 'Morgenau → Labor'],
  ['labor', { map: 'morgenau', x: 7, y: 11 }, q => q.k === 'door', 'Labor → Morgenau'],
  ['morgenau', null, q => q.k === 'edge' && q.to === 'route1', 'Morgenau → Route 1'],
  ['route1', null, q => q.k === 'edge' && q.to === 'morgenau', 'Route 1 → Morgenau'],
  ['route1', null, q => q.k === 'edge' && q.to === 'kupferhain', 'Route 1 → Kupferhain'],
  ['kupferhain', null, q => q.k === 'edge' && q.to === 'route1', 'Kupferhain → Route 1'],
  ['kupferhain', null, q => q.k === 'door' && q.to === 'heil_kupfer', 'Kupferhain → Kreaturenstation'],
  ['heil_kupfer', { map: 'kupferhain', x: 4, y: 10 }, q => q.k === 'door', 'Kreaturenstation → Kupferhain'],
  ['kupferhain', null, q => q.k === 'edge' && q.to === 'route2', 'Kupferhain → Route 2'],
  ['route2', null, q => q.k === 'door' && q.to === 'nebelgrotte', 'Route 2 → Nebelgrotte (erste Höhle)'],
  ['nebelgrotte', { map: 'route2', x: 10, y: 3 }, q => q.k === 'door', 'Nebelgrotte → Route 2'],
  ['route2', null, q => q.k === 'edge' && q.to === 'kupferhain', 'Route 2 → Kupferhain'],
];
let shotsDone = {};
for (const [map, ret, flt, name] of SC) {
  await ev(([m, r]) => { if (r) G.ret = r; mode = 'world'; loadMap(m, 5, 5); }, [map, ret]); await page.waitForTimeout(200);
  const q = await ev(f => UE.portals().find(eval(f)) || null, flt.toString());
  if (!q) { t(`${name}: Öffnung gefunden`, false); continue; }
  const E = q.k === 'edge' ? (q.w > 1 ? (q.w - 1) / 2 + .3 : .36) : .36;
  // zwei Richtungen: von links mit Versatz links, von rechts mit Versatz rechts (± 25°); die zweite rennt
  for (const [side, run] of [[-1, false], [1, true]]) {
    await ev(([m, r]) => { if (r) G.ret = r; mode = 'world'; if (cur.id !== m) loadMap(m, 5, 5); }, [map, ret]); await page.waitForTimeout(150);
    const pl = await ev(([q, e, th]) => UE.plan(q, e, th), [q, side * E, -side * .44]);
    if (!pl) { t(`${name} (${side < 0 ? 'links' : 'rechts'}): Anlauf planbar`, false); continue; }
    await place(map, pl.sx, pl.sy, pl.ang, ret);
    await ev(() => { UE.ldOn = 0; UE.fdOn = 0; UE.t0 = performance.now(); UE.from = cur.id; UE.bumps = 0; });
    await stickDown(0, run ? -64 : -48);
    let trig = null; const t0 = Date.now();
    const s0 = await ev(() => UE.simT); for (let k = 0; k < 40; k++) { const tt = await sim(120); const s = await ev(() => ({ id: cur.id, w: mode })); if (s.w !== 'world' || s.id !== map) { for (let j = 0; j < 100 && await ev(() => cur.id) === map; j++) await page.waitForTimeout(50); if (await ev(() => cur.id) !== map) trig = Math.round(tt - s0); break; } }
    // Bild: Ladebildschirm während des Ladens
    if (trig !== null && !VORHER && !shotsDone[q.to] && ['route1', 'nebelgrotte'].includes(q.to)) { await page.waitForTimeout(220); await shot('laden_' + q.to); shotsDone[q.to] = 1; }
    if (trig === null && !shotsDone['stuck_' + map] && map === 'route2') { await shot('route2_haengt'); shotsDone['stuck_' + map] = 1; }
    await stickUp();
    const back = await waitWorld(); await page.waitForTimeout(900);
    const a = await ev(() => ({ id: cur.id, x: P.x, y: P.y, px: +P.px.toFixed(2), py: +P.py.toFixed(2), ld: UE.ldOn, fd: UE.fdOn, bumps: UE.bumps, inZ: UE.inZone(P.px, P.py), ret: G.ret, mode, log: window.LADEN ? LADEN.log.slice(-1)[0] : null }));
    if (trig !== null && !shotsDone['ank_' + q.to] && q.to === 'kupferhain') { await shot('ankunft_kupferhain'); shotsDone['ank_' + q.to] = 1; }
    const expLd = !(await ev(([f, to]) => UE.inside(f) || UE.inside(to), [map, q.to]));
    const rec = { name, side: side < 0 ? 'links' : 'rechts', run, plan: { th: +pl.th.toFixed(2), L: pl.L, e: side * E }, ok: trig !== null && a.id === q.to, ms: trig, arrive: a, expLd };
    R.anlauf.push(rec);
    if (VORHER) log(`${rec.ok ? '✓' : '✗'} [vorher] ${name} (${rec.side}${run ? ', rennen' : ''}): ${rec.ok ? 'ausgelöst nach ' + trig + ' ms' : 'NICHT ausgelöst (Anstöße ' + a.bumps + ')'}`);
    else {
      t(`${name} (${rec.side}, Versatz ${(side * E).toFixed(2)}, ${run ? 'rennen' : 'gehen'}): löst beim ersten Anlauf aus`, rec.ok, rec.ok ? { ms: trig, bumps: a.bumps } : { bumps: a.bumps, start: [+pl.sx.toFixed(2), +pl.sy.toFixed(2), +pl.ang.toFixed(2)], ende: [a.px, a.py], ziel: [q.x, q.y] });
      if (rec.ok) {
        t(`${name} (${rec.side}): Ladebildschirm ${expLd ? 'ja' : 'nein'} (Innenraum = nur Blende)`, !!a.ld === expLd && (expLd || a.fd), { ld: a.ld, fade: a.fd, log: a.log });
        t(`${name} (${rec.side}): Ankunft stabil, außerhalb der Gegenzone, Eingabe frei`, back && a.id === q.to && !a.inZ && a.mode === 'world', { x: a.px, y: a.py, inZ: a.inZ });
        if (a.log && expLd) R.laden.push({ to: q.to, ms: a.log.ms, shown: a.log.shown });
      }
    }
    // zurück in die Ausgangslage
    await ev(() => { if (window.LADEN && LADEN.active && typeof ldAbort === 'function') ldAbort(); mode = 'world'; });
  }
}
// Rückkehrpunkt nach Haus: Feld vor der Tür
if (!VORHER) {
  await place('morgenau', 4, 7, 0); await stickDown(0, -48);
  for (let i = 0; i < 40 && await ev(() => cur.id) === 'morgenau'; i++) { await sim(120); await page.waitForTimeout(30); } await stickUp(); await waitWorld();
  const r = await ev(() => G.ret); t('Rückkehrpunkt nach dem Hausbesuch = Feld vor der Tür (morgenau 4,5)', r && r.map === 'morgenau' && r.x === 4 && r.y === 5, r);
  // Kein Hin-und-her: Stick über den Wechsel hinweg gedrückt halten (Morgenau → Route 1) → bleibt auf Route 1, läuft nicht zurück
  await ev(() => { mode = 'world'; loadMap('morgenau', 9, 3); }); await page.waitForTimeout(300);
  { const pl = await ev(() => { const q = UE.portals().find(q => q.k === 'edge' && q.to === 'route1'); return UE.plan(q, 0, 0); });
    await place('morgenau', pl.sx, pl.sy, pl.ang); await stickDown(0, -48);
    for (let i = 0; i < 40 && await ev(() => cur.id) === 'morgenau'; i++) { await sim(120); await page.waitForTimeout(30); }
    await waitWorld(); await page.waitForTimeout(300); await sim(1500); const s2 = await ev(() => ({ id: cur.id, y: +P.py.toFixed(2), h: cur.h })); await stickUp();
    t('Stick über den Wechsel gehalten: kein Hin-und-her (bleibt auf Route 1, Ankunft eine Kachel innen)', s2.id === 'route1' && s2.y <= s2.h - 2 + .05, s2); }
}
// ---------- (1b) 2D-Modus (versteckte Option): Taste gehalten ----------
for (const [map, ret, x, y, dir, to, name] of NUR_B ? [] : [['morgenau', null, 4, 6, 'up', 'haus_spieler', '2D Morgenau → Haus'], ['haus_spieler', { map: 'morgenau', x: 4, y: 5 }, 5, 6, 'down', 'morgenau', '2D Haus → Morgenau'],
  ['morgenau', null, 9, 2, 'up', 'route1', '2D Morgenau → Route 1'], ['route2', null, 10, 4, 'up', 'nebelgrotte', '2D Route 2 → Nebelgrotte']]) {
  await ev(([m, r, x, y, d]) => { if (r) G.ret = r; mode = 'world'; setView('2d', 1); loadMap(m, x, y); P.dir = d; UE.ldOn = 0; UE.fdOn = 0; }, [map, ret, x, y, dir]); await page.waitForTimeout(300);
  const key = { up: 'ArrowUp', down: 'ArrowDown' }[dir]; await page.keyboard.down(key); let ok = false;
  for (let i = 0; i < 200; i++) { if (await ev(() => cur.id) === to) { ok = true; break; } await page.waitForTimeout(40); } await page.keyboard.up(key); await waitWorld(); await page.waitForTimeout(300);
  const a = await ev(() => ({ id: cur.id, ld: UE.ldOn, fd: UE.fdOn })); const expLd = !(await ev(([f, to]) => UE.inside(f) || UE.inside(to), [map, to]));
  R.d2.push({ name, ok, ld: a.ld, expLd });
  if (VORHER) log(`${ok ? '✓' : '✗'} [vorher] ${name}`); else t(`${name}: löst aus, Ladebildschirm ${expLd ? 'ja' : 'nein'}`, ok && a.id === to && !!a.ld === expLd, a);
}
await ev(() => { setView('third', 1); });
// ---------- (2) Spielstand ----------
if (!VORHER) {
  await ev(() => { G.ret = { map: 'route2', x: 10, y: 3 }; loadMap('nebelgrotte'); mode = 'world'; }); await page.waitForTimeout(300);
  const sv = await ev(() => { save(); const raw = JSON.parse(localStorage.getItem(SAVEKEY)); const okL = !!loadSave(); return { map: raw.map, px: raw.px, py: raw.py, ret: raw.ret, team: raw.team.length, okL, keys: Object.keys(raw).length }; });
  t('Spielstand nach den Wechseln: Karte/Position/Rückkehrpunkt gespeichert und ladbar (keine neuen Pflichtfelder)', sv.okL && sv.map === 'nebelgrotte' && sv.ret && sv.ret.map === 'route2' && sv.team === 1, sv);
}
// ---------- (3) Messwerte Gehen/Rennen ----------
const recRun = async (ms) => { await ev(() => { UE.rec = []; }); await page.waitForTimeout(ms); return ev(() => { const r = UE.rec; UE.rec = null; return r; }); };
const spd = (r, a, b) => { const s = r.filter(p => p.t >= a && p.t <= b); if (s.length < 2) return 0; let d = 0; for (let i = 1; i < s.length; i++) d += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y); return d / ((s[s.length - 1].t - s[0].t) / 1000); };
async function line(run) {
  await place('route1', 11, 19, 0); await ev(() => { UE.rec = []; });
  await stickDown(0, run ? -64 : -48); const tDown = await ev(() => UE.simT); await sim(2300); const tUp = await ev(() => UE.simT); await stickUp(); await sim(1100);
  const r = await ev(() => { const r = UE.rec; UE.rec = null; return r; });
  const vmax = spd(r, tUp - 900, tUp - 50); let t90 = null; for (let i = 1; i < r.length; i++) { if (r[i].t < tDown) continue; if (Math.abs(r[i].v) >= .9 * vmax) { t90 = r[i].t - tDown; break; } }
  const after = r.filter(p => p.t >= tUp); let bd = 0, bt = 0; for (let i = 1; i < after.length; i++) { const d = Math.hypot(after[i].x - after[i - 1].x, after[i].y - after[i - 1].y); if (d > 1e-4) { bd += d; bt = after[i].t - tUp; } }
  // Ruck beim Anfahren: größte Beschleunigungsänderung in den ersten 0,3 s (Felder/s³)
  let jerk = 0; const st = r.filter(p => p.t >= tDown && p.t <= tDown + 300); for (let i = 2; i < st.length; i++) { const a1 = (st[i].v - st[i - 1].v) / ((st[i].t - st[i - 1].t) / 1000), a0 = (st[i - 1].v - st[i - 2].v) / ((st[i - 1].t - st[i - 2].t) / 1000); jerk = Math.max(jerk, Math.abs(a1 - a0) / ((st[i].t - st[i - 1].t) / 1000)); }
  const fps = r.length > 2 ? +((r.length - 1) / ((r[r.length - 1].t - r[0].t) / 1000)).toFixed(1) : 0;
  return { fps, tempo: +vmax.toFixed(2), anfahren90ms: t90 && Math.round(t90), bremsweg: +bd.toFixed(2), bremszeitMs: Math.round(bt), amaxStart: +Math.max(...st.slice(1).map((p, i) => (p.v - st[i].v) / ((p.t - st[i].t) / 1000))).toFixed(1) };
}
R.bewegung.gehen = await line(false); R.bewegung.rennen = await line(true);
// Drehen: aus dem Stand Stick nach rechts (90°) bzw. nach unten (180°)
for (const [nm, dx, dy, tgt] of [['dreh90', 48, 0, -Math.PI / 2], ['dreh180', 0, 48, Math.PI]]) {
  await place('route1', 11, 15, 0); await ev(() => { UE.rec = []; }); await stickDown(dx, dy); const t0 = await ev(() => UE.simT); await sim(1300); await stickUp(); await sim(300);
  const r = await ev(() => { const r = UE.rec; UE.rec = null; return r; }); const w = a => { a %= 2 * Math.PI; if (a > Math.PI) a -= 2 * Math.PI; if (a < -Math.PI) a += 2 * Math.PI; return a; };
  let tt = null; for (const p of r) if (p.t >= t0 && Math.abs(w(p.a - tgt)) < .1) { tt = p.t - t0; break; }
  const camEnd = r.length ? +Math.abs(w(r[r.length - 1].c - r[r.length - 1].a)).toFixed(2) : null;
  R.bewegung[nm] = { zeitMs: tt && Math.round(tt), kameraFigurWinkelEnde: camEnd };
}
// Kamerafolge: 2 s Laufen mit 25° schräg gehaltenem Stick – wie stark zieht die Kamera mit, Kurvenradius
{ await place('route1', 11, 19, 0); await ev(() => { UE.rec = []; UE.sim = false; }); await stickDown(Math.sin(.44) * 48, -Math.cos(.44) * 48); await page.waitForTimeout(6000); await stickUp(); await page.waitForTimeout(200); await ev(() => { UE.sim = true; });
  const r = await ev(() => { const r = UE.rec; UE.rec = null; return r; }); const c0 = r[0].c, c1 = r[r.length - 1].c; R.bewegung.kamerafolge25 = { kameraDrehungRad: +Math.abs(c1 - c0).toFixed(2), figurDrehungRad: +Math.abs(r[r.length - 1].a - r[0].a).toFixed(2) }; }
// Totzone: kleinste Auslenkung (px bei Stick-Radius 54), ab der die Figur losläuft
{ let dz = null; for (const px of [6, 8, 10, 12, 14, 18]) { await place('route1', 11, 15, 0); await stickDown(0, -px); await sim(600); const mv = await ev(() => Math.abs(P.py - 15)); await stickUp(); if (mv > .05) { dz = px; break; } } R.bewegung.totzonePx = dz; }
// Wand: schräg (45°) gegen die linke Kartenwand (Bäume x=0) – Gleiten entlang, kein Zittern
{ await place('route1', 1.6, 16, Math.atan2(1, 1)); await ev(() => { UE.rec = []; UE.bumps = 0; }); await stickDown(0, -48); await sim(1600); await stickUp(); await sim(200);
  const r = await ev(() => { const r = UE.rec; UE.rec = null; return { r, b: UE.bumps }; }); const s = r.r.filter((p, i) => i > 10); let flips = 0, lastS = 0;
  for (let i = 1; i < s.length; i++) { const d = s[i].x - s[i - 1].x; if (Math.abs(d) < 1e-3) continue; const sg = Math.sign(d); if (lastS && sg !== lastS) flips++; lastS = sg; }
  R.bewegung.wand45 = { gleitweg: +(r.r[0].y - r.r[r.r.length - 1].y).toFixed(2), xMin: +Math.min(...r.r.map(p => p.x)).toFixed(2), zitternWechsel: flips, anstoss: r.b }; }
// Ecke: geradeaus nach oben mit 0,38 Versatz an einer Baumkante vorbei (route1 Baum 4,4) – Ecken-Gleiten statt Hängenbleiben
{ await place('route1', 4.62, 6.4, 0); await ev(() => { UE.bumps = 0; }); await stickDown(0, -48); let ok = false;
  const st0 = await ev(() => UE.simT); for (let k = 0; k < 25; k++) { await sim(100); if (await ev(() => P.py < 3.6)) { ok = true; break; } } const msE = Math.round(await ev(() => UE.simT) - st0); await stickUp();
  R.bewegung.ecke = { vorbei: ok, ms: ok ? msE : null, x: await ev(() => +P.px.toFixed(2)), anstoss: await ev(() => UE.bumps) }; }
// Bewegungsserie (Rennen) als Bild
if (!VORHER) { await place('route1', 11, 19, 0); await stickDown(0, -64); await sim(900); await page.waitForTimeout(400); await shot('rennen'); await stickUp(); }
log('Messwerte: ' + JSON.stringify(R.bewegung));
if (!VORHER) {
  const B = R.bewegung;
  t('Gehen ≈ 2,8 Felder/s, Rennen ≈ 5 Felder/s (gut unterscheidbar)', Math.abs(B.gehen.tempo - 2.8) < .35 && Math.abs(B.rennen.tempo - 5) < .45, [B.gehen.tempo, B.rennen.tempo]);
  t('Sanftes Anfahren (Start-Beschleunigung ≤ 10 F/s²) und kontrollierbarer Bremsweg (Rennen ≤ 1,1 Feld)', B.gehen.amaxStart <= 10.5 && B.rennen.amaxStart <= 10.5 && B.rennen.bremsweg <= 1.1, { gehen: B.gehen, rennen: B.rennen });
  t('Wand schräg: gleitet entlang (≥ 1 Feld), kein Zittern (≤ 2 Richtungswechsel)', B.wand45.gleitweg >= 1 && B.wand45.zitternWechsel <= 2, B.wand45);
  t('Baumkante mit 0,38 Versatz: Figur rutscht vorbei statt hängenzubleiben', B.ecke.vorbei, B.ecke);
  t('Laden: Ladebildschirm voll sichtbar ≥ 0,6 s (Gesamtdauer unter SwiftShader nur Info)', R.laden.length > 0 && R.laden.every(l => l.ms - l.shown >= 600 + 300), R.laden);
  t('Keine Konsolenfehler', errs.length === 0, errs.slice(0, 5));
} else log('Konsolenfehler: ' + JSON.stringify(errs.slice(0, 5)));
const okA = R.anlauf.filter(a => a.ok).length; log(`Anläufe beim ersten Versuch: ${okA}/${R.anlauf.length}`);
writeFileSync(OUT + 'messwerte_' + TAG + (NUR_B ? '_bewegung' : '') + '.json', JSON.stringify(R, null, 1));
try { (await import('fs')).unlinkSync(TMP); } catch (e) { }
await browser.close(); srv.close();
log(VORHER ? 'Vorher-Messung fertig.' : `${pass} ✓ / ${fail} ✗`);
process.exit(VORHER || !fail ? 0 : 1);
