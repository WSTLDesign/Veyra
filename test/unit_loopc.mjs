// Loop C – Welt I im Hybrid-Look: Zusicherungen.   node build.mjs && node test/unit_loopc.mjs
// Ohne Browser: Opening ≤ 5 s, grassAmbush entfernt, Ortsbilder neu (keine Platzhalter), Artifact < 16 MB, Glutschlucht-Sperren.
// Im Browser (genau ein Chromium): Spawn frei + Spawn-Korrektur, Morgenau-Blickrichtung, Landmarken/Übergangstore je Ort, Höhlenkristall,
// Draw-Calls, Himmel-Vorladen der Nachbarregion, Dex-Hinweis, Figuren der Glutschlucht ohne Feldattacke erreichbar, keine Seitenfehler.
import { readFileSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
let ok = 0, bad = 0;
const t = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const src = f => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8');
const ART = new URL('../public/art/', import.meta.url);
const WELT1 = ['morgenau', 'route1', 'kupferhain', 'route2', 'nebelgrotte', 'brisenhafen', 'windkueste', 'moewenbucht', 'route3', 'glutschlucht', 'fluestertal', 'siegesstrasse'];
// SHA-256 (16 Zeichen) der Platzhalter-Ortsbilder vor Loop C (Hybrid H2, 10.11.) – keines davon darf für eine Welt-I-Karte übrig sein
const OLD = { brisenhafen: '053bafa35090bca4', fluestertal: '04ffee18842ebbfd', glutschlucht: '0095ea2c09f33945', kupferhain: 'a1d6d6268791991a', moewenbucht: '248cee01a154f781', morgenau: 'cfae0c5b2b9140c0',
  nebelgrotte: '357509b9d1113f84', route1: '9b5e265533f5708e', route2: '8e8e50a68a3ff17f', route3: '28f293ef18dfbf63', siegesstrasse: 'f3e8c67a7ee8af06', windkueste: '4047b1d4fabd1749' };

// ---------- ohne Browser ----------
await t('Opening ≤ 5 s: OP.DUR + Blende (endIntro 650 ms) ≤ 5,0 s, Überspringen weiter ab 1 s', () => {
  const s = src('12-intro.js'), dur = +s.match(/const OP=\{DUR:([\d.]+)/)[1], skip = +s.match(/SKIP:([\d.]+)/)[1], fade = +s.match(/classList\.remove\('out'\);\}\},(\d+)\)/)[1] / 1000;
  console.log('   Dauer', dur, '+', fade, '=', (dur + fade).toFixed(2), 's'); return dur + fade <= 5.0 && skip === 1; });
await t('grassAmbush (toter Code, QA B2) ist aus src/ entfernt', () => { const hit = readdirSync(new URL('../src/', import.meta.url)).filter(f => f.endsWith('.js') && /function grassAmbush|grassAmbush\(/.test(src(f))); if (hit.length) throw new Error(hit.join()); });
await t('Ortsbilder der Welt-I-Karten neu gerendert (keine Platzhalter-Prüfsumme, Bild nicht leer, ≤ 120 KB, _lo vorhanden)', () => {
  const bad_ = []; for (const m of WELT1) { const f = new URL(`place_${m}.webp`, ART), b = readFileSync(f), h = createHash('sha256').update(b).digest('hex').slice(0, 16);
    if (h === OLD[m]) bad_.push(m + ': Platzhalter'); if (b.length > 120e3 || b.length < 6e3) bad_.push(m + ': Größe ' + b.length); statSync(new URL(`place_${m}_lo.webp`, ART)); }
  const sd = execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image, ImageStat\nfor f in sys.argv[1:]:\n s=ImageStat.Stat(Image.open(f).convert("L"));print(round(s.stddev[0],1))', ...WELT1.map(m => new URL(`place_${m}.webp`, ART).pathname)], { encoding: 'utf8' }).trim().split('\n').map(Number);
  sd.forEach((v, i) => { if (v < 12) bad_.push(WELT1[i] + ': kontrastlos ' + v); }); console.log('   Kontrast (Std.-Abw.)', sd.join(' ')); if (bad_.length) throw new Error(bad_.join('; ')); });
await t('dist/artifact.html < 16 MB (Ortsbilder voll eingebettet, Himmel/Kampf nur _lo)', () => { const n = statSync(new URL('../dist/artifact.html', import.meta.url)).size; console.log('   Artifact', n, 'B =', (n / 1e6).toFixed(2), 'MB'); return n < 16e6; });
await t('Glutschlucht: Sperren nur noch am Schatzweg (Dornen 14,14 · Wasser 9,18 · Geröll 3,18), nicht mehr 9,7', () => { const s = src('16-expansion.js'), m = s.match(/FIELDMAP\.glutschlucht=(\[[^;]*\]);/)[1]; return !/\[9,7,'G'\]/.test(m) && /\[14,14,'D'\]/.test(m) && /\[9,18,'Q'\]/.test(m) && /\[3,18,'G'\]/.test(m); });
// Bewegungsdynamik 12.11.: GAIT_RUN/GAIT_X ersetzt durch einen Gangparameter-Satz GAIT (Gehen/Laufen/Rennen, Hüft-Ratengrenze, Schwungbein-Ratengrenze, Geländeglättung)
await t('Rennen: Gangparameter GAIT gesetzt (Hüft-Ratengrenze, Schwungbein-Ratengrenze, Geländeglättung), Schwellen in qa_mech_walk begründet', () => { const s = src('38-models.js'), q = readFileSync(new URL('./qa_mech_walk.mjs', import.meta.url), 'utf8'); return /const GAIT=\{[^}]*hup:[^}]*rate:[^}]*tau:/.test(s) && /Rennen\/Bremsen\/Übergang < 0,9/.test(q) && /Max ≥ −0,30/.test(q); });

// ---------- im Browser ----------
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 860, height: 484 } }); const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await page.addInitScript(() => { localStorage.setItem('veyra_set', JSON.stringify({ res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' })); });
await page.goto(S.url + 'index.html', { waitUntil: 'load' });
await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
await page.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; G.team = [mk(1, 12)]; mode = 'world'; if (view === '2d') setView('third', 1); });
const ev = (f, a) => page.evaluate(f, a);

await t('Spawn frei: Ankunftsfelder (Kartenkanten, Türen/Ausgänge) aller Welt-I-Karten begehbar und nicht abgeschnitten', async () => {
  const r = await ev(W => { const bad = []; for (const id of W) { if (id === 'nebelgrotte') continue; const m = getMap(id); cur = m; const seeds = w1Seeds(m), main = w1Reach(m, seeds);
    for (const [x, y] of seeds) { if (SOLID.has(m.rows[y][x])) bad.push(id + ' fest ' + x + ',' + y); if (!main.has(x + ',' + y)) bad.push(id + ' ab ' + x + ',' + y); }
    loadMap(id, seeds[0][0], seeds[0][1]); if (blocked(P.x, P.y) && !npcAt(P.x, P.y)) bad.push(id + ' spawn blockiert'); } return bad; }, WELT1);
  if (r.length) throw new Error(r.slice(0, 6).join('; ')); });
await t('Spawn-Korrektur beim Laden: Feld in Wand → frei; abgeschnittene Schatz-Nische der Glutschlucht → erreichbares Feld; normales Feld bleibt', async () => {
  const r = await ev(() => { const o = {}; loadMap('route1', 0, 0); o.wall = [P.x, P.y, tileAt(cur, P.x, P.y)]; loadMap('morgenau', 4, 5); o.keep = [P.x, P.y];
    G.mods.glutschlucht = []; delete cache.glutschlucht; loadMap('glutschlucht', 2, 18); const m = cur, main = w1Reach(m, w1Seeds(m)); o.pocket = [P.x, P.y, main.has(P.x + ',' + P.y)]; return o; });
  if (/[TRX~]/.test(r.wall[2]) || r.keep.join() !== '4,5' || !r.pocket[2]) throw new Error(JSON.stringify(r)); console.log('   ', JSON.stringify(r)); });
await t('Morgenau-Spawn: Verlassen des Elternhauses blickt die Dorfstraße entlang (rechts), nicht aufs Labordach', async () => {
  const r = await ev(() => { G.ret = { map: 'morgenau', x: 4, y: 5 }; warpBack(); return [cur.id, P.x, P.y, P.dir]; }); if (r.join() !== 'morgenau,4,5,right') throw new Error(r.join()); });
await t('Glutschlucht: Ruska, Hagen, Ilka und alle Figuren ohne Feldattacke erreichbar; Schatz bleibt hinter Dornen/Wasser/Geröll', async () => {
  const r = await ev(() => { G.mods.glutschlucht = []; delete cache.glutschlucht; const m = getMap('glutschlucht'); cur = m; const main = w1Reach(m, w1Seeds(m)), miss = [];
    for (const n of NPCS.glutschlucht) { if (/item|hidden|scroll|sparkle|sign/.test(n.t) || n.hook === 'schatz') continue; const nb = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([a, b]) => main.has((n.x + a) + ',' + (n.y + b))); if (!nb) miss.push((n.name || n.hook) + '@' + n.x + ',' + n.y); }
    const treasure = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([a, b]) => main.has((2 + a) + ',' + (18 + b))); return { miss, treasure }; });
  if (r.miss.length || r.treasure) throw new Error(JSON.stringify(r)); });
// Szenen bauen: Landmarken + Übergangstore + Draw-Calls (je Karte einmal rendern)
const scenesR = [];
for (const id of WELT1) {
  await ev(id => { mode = 'world'; G.time = 12 * 60; const m = getMap(id), sd = w1Seeds(m); loadMap(id, sd[0][0], sd[0][1]); P.dir = 'up'; if (R3) { R3.yaw = 0; R3.snap = 1; } }, id);
  await page.waitForTimeout(1600);
  scenesR.push(await ev(id => { const S = R3.scene, W = WELT1[id], m = cur, L = S.userData.w1 || [], exits = 'nsew'.split('').filter(d => m.links[d] && MAPS[m.links[d]]).length;
    return { id, w1: L, want: (W.lm || []).map(q => q.type), gates: L.filter(t => t === 'torpfosten').length, exits, calls: R3.r.info.render.calls, crys: (S.userData.crys || []).map(q => Math.floor(q[0]) + ',' + Math.floor(q[2] - .5)) }; }, id));
}
await t('Landmarken je Ort: alle geplanten Wahrzeichen der Welt-I-Karten stehen in der Szene (≥ 1 je Karte)', () => { const miss = scenesR.filter(s => !s.want.length || s.want.some(w => !s.w1.includes(w))).map(s => s.id + ':' + s.want.filter(w => !s.w1.includes(w))); if (miss.length) throw new Error(miss.join(' ')); console.log('   ' + scenesR.map(s => s.id + ' ' + s.w1.length).join(' · ')); });
await t('Übergänge: an jedem Kartenausgang ein Torpfosten-Paar in der Farbe der Zielregion', () => { const b = scenesR.filter(s => s.id !== 'nebelgrotte' && s.gates !== 2 * s.exits).map(s => s.id + ' ' + s.gates + '/' + 2 * s.exits); if (b.length) throw new Error(b.join(' ')); });
await t('Nebelgrotte: Kristall im Eingangsblick hinter dem Chronik-Knopf entfernt (10,9 · 12,9), Grottenkristall links sichtbar', () => { const s = scenesR.find(s => s.id === 'nebelgrotte'); return !s.crys.includes('10,9') && !s.crys.includes('12,9') && s.w1.includes('grottenkristall'); });
await t('Draw-Calls Welt-I ≤ 150 (high, 860×484, mit Kreaturen)', () => { const mx = Math.max(...scenesR.map(s => s.calls)); console.log('   max', mx, '·', scenesR.map(s => s.id + ' ' + s.calls).join(' ')); return mx <= 150; });
await t('Himmel ohne Naht: Nachbarregion wird vorgeladen (route2 → Flutküste), Regionswechsel ohne prozedurales Aufblenden', async () => {
  const r = await ev(async () => { G.time = 12 * 60; const sd = w1Seeds(getMap('route2')); loadMap('route2', sd[0][0], sd[0][1]); await new Promise(r => setTimeout(r, 2500)); const pins = W1SKY.pins.slice();
    const k = pins.find(p => /^sky_flutkueste_/.test(p)); let st = null; for (let i = 0; i < 60 && k; i++) { const E = [...SKY3.cache.values()].find(E => E.key === k); st = E && E.state; if (st === 'ok') break; await new Promise(r => setTimeout(r, 100)); }
    loadMap('brisenhafen', 0, 5); await new Promise(r => setTimeout(r, 700)); return { pins, st, reg: SKY3.region, fade: SKY3.fade }; });
  console.log('   ', JSON.stringify(r)); if (!r.pins.some(p => /^sky_flutkueste_/.test(p)) || r.st !== 'ok' || r.reg !== 'flutkueste' || r.fade < 1) throw new Error(JSON.stringify(r)); });
await t('Dex: ungesehene Arten mit Versteck-Hinweis (Gras-Liste, verstecktes Wesen, Entwicklung) – kurz, Tipp zeigt ihn', async () => {
  const r = await ev(() => { G.dex = { seen: {}, caught: {} }; const enc = MAPS.route1.enc.day[0][0], hid = Object.keys(FIND_HINTS)[0] | 0; const a = dexHint(enc), b = dexHint(hid);
    const el = document.createElement('div'); document.body.appendChild(el); rDex(el); const n = el.querySelectorAll('.dx.none.hint').length, tot = el.querySelectorAll('.dx').length; const first = el.querySelector('.dx.none.hint'); let tst = '';
    const old = toast; toast = s => { tst = s; }; first && first.click(); toast = old; el.remove(); const lens = []; for (let i = 1; i < MONS.length; i++) { const h = dexHint(i); if (h) lens.push(h.length); } return { a, b, n, tot, tst, maxLen: Math.max(...lens) }; });
  console.log('   ', JSON.stringify(r)); if (!/^Lebt im hohen Gras: Route 1/.test(r.a) || !/versteckt/.test(r.b) || r.n < r.tot * .3 || !/^Hinweis: /.test(r.tst) || r.maxLen > 60) throw new Error(JSON.stringify(r)); });
await t('Keine Seitenfehler', () => { if (errs.length) throw new Error(errs.slice(0, 4).join(' | ')); });
await browser.close(); S.close();
console.log(`\n${ok} ✓ / ${bad} ✗`); process.exit(bad ? 1 : 0);
