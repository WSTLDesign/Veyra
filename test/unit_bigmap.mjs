// Große Karte (src/46-bigmap.js, docs/bigmap.md): Öffnen/Schließen, Spieler, Ziel, „Hier kannst du“, Zoom-Kette Karte → Region → Veyra,
// Pinch/Ziehen/Doppeltipp, Legende, Infokarte, Schnellreise, Pause, Touch-Ziele ≥ 48 px, keine Konsolenfehler + Screenshots (1920×1080 und 860×484).
// Aufruf: node build.mjs && node test/unit_bigmap.mjs   (NOSHOTS=1 → ohne Screenshots)
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [], res = [], shots = !process.env.NOSHOTS;
const rec = (n, ok, info) => { res.push({ n, ok: !!ok, info }); console.log((ok ? '✓ ' : '✗ ') + n + (ok || info === undefined ? '' : ' → ' + JSON.stringify(info))); };
const out = n => new URL('./' + n + '.png', import.meta.url).pathname;
async function boot(W, H) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); p.setDefaultTimeout(120000); p.setDefaultNavigationTimeout(180000);
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  await p.evaluate(() => { SET.res = '720'; typeof saveSet === 'function' && saveSet(); typeof fsLayout === 'function' && fsLayout(); });
  try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(400); try { await p.click('#iSkip', { timeout: 3000 }); } catch (e) { } await p.waitForTimeout(900);
  await tap(p, '#tNew'); await p.waitForTimeout(300);
  await p.evaluate(async () => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } try { await preloadArt(); } catch (e) { }
    G.flags.starter = 1; G.flags.firstcatch = 1; G.time = 10 * 60; G.team = [mk(1, 14), mk(25, 11)]; G.team[0].hp = 5; G.badges = ['Floramedaille']; G.flags.badge1 = 1;
    for (const id of ['morgenau', 'route1', 'kupferhain', 'route2', 'brisenhafen', 'heil_brise']) G.visited[id] = 1; });
  return p;
}
const go = (p, map, x, y) => p.evaluate(([m, x, y]) => { if (typeof bmClose === 'function') bmClose(); loadMap(m, x, y); P.dir = 'up'; P.ang = .5; for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world'; }, [map, x, y]);
const tap = async (p, sel) => { const b = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel); if (b) await p.mouse.click(b[0], b[1]); };
const settle = p => p.waitForFunction(() => !BM.anim && performance.now() > BM.lock, null, { timeout: 60000 }).then(() => p.waitForTimeout(250));
const SPOT = { kupferhain: [8, 6], route1: [9, 12], windkueste: [9, 10], labor: [5, 6], nebelgrotte: [9, 7], brisenhafen: [8, 6] };

// ---------- 1920×1080: Funktion ----------
let p = await boot(1920, 1080);
await go(p, 'kupferhain', 8, 6); await p.waitForTimeout(500);
await p.evaluate(() => mmShow(true)); await p.waitForTimeout(350);
{ const b = await p.evaluate(() => { const r = $('#mmW').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); await p.mouse.click(b[0], b[1]); } await p.waitForTimeout(900); await settle(p);
let st = await p.evaluate(() => ({ open: BM.open, vis: !document.getElementById('bigMap').hidden, mode, lvl: BM.lvl }));
rec('Tipp auf die Minikarte öffnet die große Karte (Ebene „Hier“, Spiel pausiert)', st.open && st.vis && st.mode === 'menu' && st.lvl === 'here', st);
st = await p.evaluate(() => { const me = BM.L.here.poi.find(q => q.kind === 'me'), h = BM.hits.find(q => q.p.kind === 'me'), r = document.querySelector('.bmStage').getBoundingClientRect();
  return { me: me && [me.x, me.y], P: [P.px, P.py], hit: h && [h.x | 0, h.y | 0], inside: !!h && h.x > 0 && h.y > 0 && h.x < r.width && h.y < r.height }; });
rec('Spielerposition markiert (Marker auf P.px/P.py, sichtbar)', st.me && st.me[0] === st.P[0] && st.me[1] === st.P[1] && st.inside, st);
st = await p.evaluate(() => ({ goal: !!BM.L.here.poi.find(q => q.goal), hit: !!BM.hits.find(q => q.p.goal), card: !document.querySelector('.bmGoal').hidden && document.querySelector('.bmGoal').textContent }));
rec('Missionsziel hervorgehoben (Ziel-Marker + Zielkarte)', st.goal && st.hit && st.card, st);
st = await p.evaluate(() => [...document.querySelectorAll('.bmChip')].map(b => b.textContent.trim()));
rec('„Hier kannst du“ hat 2–5 nicht leere Vorschläge', st.length >= 2 && st.length <= 5 && st.every(t => t.length > 3), st);
st = await p.evaluate(() => { const k = new Set(BM.L.here.poi.map(q => q.kind)); return [...k]; });
rec('Karte zeigt Türen/Ausgänge, Kreaturenstation, Händler, Figuren', ['exit', 'heal', 'shop', 'talk'].every(k => st.includes(k)), st);
st = await p.evaluate(() => { const T = [...document.querySelectorAll('#bigMap button')].filter(b => b.offsetParent && !b.hidden).map(b => { const r = b.getBoundingClientRect(); return { c: b.className || b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; });
  return { n: T.length, small: T.filter(t => t.w < 48 || t.h < 48) }; });
rec('Touch-Ziele ≥ 48 px (alle sichtbaren Knöpfe)', st.n >= 8 && !st.small.length, st);
// Tipp auf Kreaturenstation → Infokarte
st = await p.evaluate(() => { const h = BM.hits.find(q => q.p.kind === 'heal'); return h && [h.x, h.y]; });
{ const r = await p.evaluate(() => { const b = document.querySelector('.bmStage').getBoundingClientRect(); return [b.x, b.y]; }); await p.mouse.click(r[0] + st[0], r[1] + st[1]); await p.waitForTimeout(400); }
st = await p.evaluate(() => { const c = document.querySelector('.bmCard'); return !c.hidden && c.textContent; });
rec('Tipp auf Marker zeigt Infokarte', st && /Kreaturenstation/.test(st), st);
// Pause: Zeit steht
st = await p.evaluate(() => G.time); await p.waitForTimeout(1500); st = [st, await p.evaluate(() => G.time)];
rec('Spielzeit steht, solange die Karte offen ist', st[0] === st[1], st);
// Legende
await tap(p, '.bmLegBtn'); await p.waitForTimeout(200);
st = await p.evaluate(() => ({ open: !document.querySelector('.bmLeg').hidden, n: document.querySelectorAll('.bmLeg span').length }));
await tap(p, '.bmLegBtn'); await p.waitForTimeout(150); const leg2 = await p.evaluate(() => document.querySelector('.bmLeg').hidden);
rec('Legende einklappbar', st.open && st.n >= 8 && leg2, st);
if (shots) { await p.screenshot({ path: out('bigmap_hier_kupferhain') }); }
// Zoom-Kette per Mausrad: Hier → Region → Veyra
const stage = await p.evaluate(() => { const b = document.querySelector('.bmStage').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; });
await p.mouse.move(stage[0], stage[1]);
for (let i = 0; i < 12 && (await p.evaluate(() => BM.lvl)) === 'here'; i++) { await p.mouse.wheel(0, 160); await p.waitForTimeout(260); } await p.waitForTimeout(300); await settle(p);
const l1 = await p.evaluate(() => BM.lvl);
for (let i = 0; i < 12 && (await p.evaluate(() => BM.lvl)) !== 'world'; i++) { await p.mouse.wheel(0, 260); await p.waitForTimeout(90); if (i % 4 === 3) { await p.waitForTimeout(350); await settle(p); } }
await p.waitForTimeout(400); await settle(p);
const l2 = await p.evaluate(() => ({ lvl: BM.lvl, name: document.querySelector('.bmName').textContent, places: BM.L.world.poi.filter(q => q.kind === 'place').length, img: BM.L.world.img }));
rec('Rauszoomen: Karte → Region → Veyra (stufenlos)', l1 === 'region' && l2.lvl === 'world' && l2.name === 'Veyra', { l1, l2 });
rec('Weltkarte zeigt alle Orte (Bild map_veyra)', l2.places >= 15 && l2.img, l2);
st = await p.evaluate(() => { const L = BM.L.world.poi, me = L.find(q => q.kind === 'me'), un = L.filter(q => q.kind === 'place' && !q.vis).length, vi = L.filter(q => q.kind === 'place' && q.vis).length; return { me: me && me.map, un, vi }; });
rec('Weltkarte: „Du bist hier“, besuchte farbig / unbesuchte grau', st.me === 'kupferhain' && st.un > 0 && st.vi >= 4, st);
if (shots) await p.screenshot({ path: out('bigmap_veyra') });
// Reinzoomen per Knopf: Veyra → Region → Hier
for (let i = 0; i < 8 && (await p.evaluate(() => BM.lvl)) !== 'here'; i++) { await tap(p, '.bmIn'); await p.waitForTimeout(350); await settle(p); }
st = await p.evaluate(() => BM.lvl); rec('Reinzoomen (+): Veyra → Region → Hier', st === 'here', st);
// Region: Orte, Medaillen-Hallen, Stationen, Nebenmissionen, Entfernung
await tap(p, '.bmSeg button[data-l=region]'); await p.waitForTimeout(500); await settle(p);
st = await p.evaluate(() => { const L = BM.L.region.poi, k = {}; L.forEach(q => k[q.kind] = (k[q.kind] || 0) + 1); return { k, name: document.querySelector('.bmName').textContent, maps: L.filter(q => q.kind === 'name').length }; });
rec('Region: alle Karten als Atlas, Medaillen-Hallen, Stationen, Händler, Nebenmissionen, Turmrat', st.maps >= 15 && (st.k.medal || 0) + (st.k.medal0 || 0) >= 8 && (st.k.heal || 0) + (st.k.fast || 0) >= 4 && st.k.shop >= 3 && st.k.quest >= 1 && st.k.crown === 1 && st.name === 'Smaragdwald', st);
st = await p.evaluate(() => { const q = BM.L.region.poi.find(x => x.kind === 'medal0' && x.map === 'route3'); const o = bmInfo(q); return o && [o.t, ...o.lines].join(' | '); });
rec('Tipp auf Ort: Name, Region, Medaille offen/erhalten, Entfernung in Karten', st && /Route 3/.test(st) && /Lichtlande/.test(st) && /noch offen/.test(st) && /Karten entfernt/.test(st), st);
if (shots) await p.screenshot({ path: out('bigmap_region_smaragdwald') });
// Pinch (zwei Finger) auf „Hier“ zusammenschieben → Region
await tap(p, '.bmSeg button[data-l=here]'); await p.waitForTimeout(500); await settle(p);
st = await p.evaluate(async () => { const s = document.querySelector('.bmStage'), r = s.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2, ev = (t, id, x, y) => s.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }));
  ev('pointerdown', 1, cx - 200, cy); ev('pointerdown', 2, cx + 200, cy); for (let k = 1; k <= 10; k++) { const d = 200 - k * 17; ev('pointermove', 1, cx - d, cy); ev('pointermove', 2, cx + d, cy); await new Promise(r => setTimeout(r, 16)); }
  ev('pointerup', 1, cx - 30, cy); ev('pointerup', 2, cx + 30, cy); await new Promise(r => setTimeout(r, 700)); return BM.lvl; });
rec('Pinch (zusammenschieben) auf „Hier“ wechselt zur Region', st === 'region', st);
// Ziehen + Doppeltipp setzt zurück
await settle(p);
st = await p.evaluate(async () => { const s = document.querySelector('.bmStage'), r = s.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2, ev = (t, x, y) => s.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: true }));
  const v0 = Object.assign({}, BM.v); ev('pointerdown', cx, cy); for (let k = 1; k <= 6; k++) { ev('pointermove', cx + k * 25, cy + k * 10); } ev('pointerup', cx + 150, cy + 60); const moved = Math.hypot(BM.v.x - v0.x, BM.v.y - v0.y);
  ev('pointerdown', cx, cy); ev('pointerup', cx, cy); ev('pointerdown', cx + 3, cy); ev('pointerup', cx + 3, cy); await new Promise(r => setTimeout(r, 400)); for (let i = 0; i < 100 && BM.anim; i++) await new Promise(r => setTimeout(r, 50));
  const d = bmDefault('region'); return { moved: Math.round(moved), back: Math.abs(BM.v.x - d.x) < 2 && Math.abs(BM.v.s - d.s) < .01 }; });
rec('Ziehen verschiebt, Doppeltipp setzt zurück', st.moved > 100 && st.back, st);
// Schnellreise mit Bestätigung (Veyra → Ort mit Herz → Karte → Knopf)
await tap(p, '.bmSeg button[data-l=world]'); await p.waitForTimeout(500); await settle(p);
st = await p.evaluate(() => { const q = BM.L.world.poi.find(x => x.kind === 'place' && x.fast); if (!q) return null; const o = bmInfo(q); bmCard(o, 300, 300); return { to: q.map, btn: !!document.querySelector('.bmCard .bmGo') }; });
rec('Schnellreise-Ziel mit Bestätigungsknopf', st && st.btn && st.to === 'brisenhafen', st);
if (st && st.btn) { await tap(p, '.bmCard .bmGo'); await p.waitForFunction(() => cur.id === 'brisenhafen' && mode === 'world', null, { timeout: 20000 }).catch(() => { }); }
st = await p.evaluate(() => ({ map: cur.id, open: BM.open, mode }));
rec('Schnellreise ausgeführt, Karte geschlossen', st.map === 'brisenhafen' && !st.open && st.mode === 'world', st);
// Taste M öffnet, Escape schließt, M schließt
await p.keyboard.press('KeyM'); await p.waitForTimeout(500); const om = await p.evaluate(() => BM.open && mode === 'menu');
await p.keyboard.press('Escape'); await p.waitForTimeout(400); const ce = await p.evaluate(() => !BM.open && mode === 'world' && $('#menu').hidden);
await p.keyboard.press('KeyM'); await p.waitForTimeout(400); await p.keyboard.press('KeyM'); await p.waitForTimeout(400); const cm = await p.evaluate(() => !BM.open && mode === 'world');
rec('Taste M öffnet, Escape schließt (ohne Chronik zu öffnen), M schließt', om && ce && cm, { om, ce, cm });
// Tipp außerhalb + X schließt
await p.evaluate(() => openBigMap()); await p.waitForTimeout(500); await p.mouse.click(4, 540); await p.waitForTimeout(400); const oo = await p.evaluate(() => !BM.open);
await p.evaluate(() => openBigMap()); await p.waitForTimeout(500); await settle(p); await tap(p, '.bmX'); await p.waitForFunction(() => !BM.open, null, { timeout: 8000 }).catch(() => { }); const ox = await p.evaluate(() => !BM.open && mode === 'world');
rec('Tipp außerhalb und X schließen', oo && ox, { oo, ox });
// Kein Öffnen im Kampf/Dialog
st = await p.evaluate(() => { mode = 'dialog'; const a = openBigMap(); mode = 'world'; return a; }); rec('Öffnet nicht im Dialog', st === false, st);
// Screenshots weiterer Karten (1920)
if (shots) for (const m of ['route1', 'windkueste', 'labor', 'nebelgrotte']) { await go(p, m, ...SPOT[m]); await p.waitForTimeout(500); await p.evaluate(() => openBigMap()); await p.waitForTimeout(700); await settle(p); await p.screenshot({ path: out('bigmap_hier_' + m) }); }
await p.close();
// ---------- 860×484 ----------
p = await boot(860, 484);
for (const m of ['kupferhain', 'route1', 'labor']) { await go(p, m, ...SPOT[m]); await p.waitForTimeout(500); await p.evaluate(() => openBigMap()); await p.waitForTimeout(700); await settle(p);
  if (m === 'kupferhain') { st = await p.evaluate(() => { const T = [...document.querySelectorAll('#bigMap button')].filter(b => b.offsetParent && !b.hidden).map(b => { const r = b.getBoundingClientRect(); return [b.className || b.textContent.trim(), Math.round(r.width), Math.round(r.height)]; }); return T.filter(t => t[1] < 48 || t[2] < 48); });
    rec('860×484: Touch-Ziele ≥ 48 px', !st.length, st); }
  if (shots) await p.screenshot({ path: out('bigmap_hier_' + m + '_860') }); }
await p.evaluate(() => bmSetLevel('region')); await p.waitForTimeout(600); await settle(p); if (shots) await p.screenshot({ path: out('bigmap_region_860') });
await p.evaluate(() => bmSetLevel('world')); await p.waitForTimeout(600); await settle(p); if (shots) await p.screenshot({ path: out('bigmap_veyra_860') });
await p.close();
rec('Keine Konsolen-/Seitenfehler', !errs.length, errs);
await browser.close(); S.close();
const bad = res.filter(r => !r.ok);
console.log(`\n${res.length - bad.length}/${res.length} grün` + (bad.length ? ' · FEHLER: ' + bad.map(b => b.n).join('; ') : ''));
process.exit(bad.length ? 1 : 0);
