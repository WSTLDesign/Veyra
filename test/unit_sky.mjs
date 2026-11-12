// Unit-Tests Hybrid H1 (Himmel & Kulissen): node test/unit_sky.mjs – nach `node build.mjs`
// Prüft: alle Bild-Keys (Region × Tageszeit, _lo), Bildgrößen/Byte-Grenzen, sky_meta.json, Build (SKY_META, Artifact nur _lo, < 16 MB),
// skyFor/envFor/battleBgFor/skyTime/skyRegion (gültige Werte, Fallbacks), Welt: Skybox aktiv, ≤ 6 zusätzliche Draw-Calls, Texturspeicher, 'low' → _lo, fehlende Datei → prozedural.
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { serve } from './art_serve.mjs';
let ok = 0, bad = 0; const fails = [];
const t = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; fails.push(name); console.log('✗', name, '–', e.message); } };
const list = (a, m) => { if (a.length) throw new Error((m || '') + a.slice(0, 12).join(' | ') + (a.length > 12 ? ' … (' + a.length + ')' : '')); };
const R = ['lichtlande', 'smaragdwald', 'flutkueste', 'glutlande', 'kristallgebirge', 'frosttundra', 'himmelsweiten', 'schattenmoor'], TI = ['tag', 'abend', 'nacht'];
const art = new URL('../public/art/', import.meta.url), has = f => existsSync(new URL(f, art)), size = f => statSync(new URL(f, art)).size;
function webpWH(f) { const b = readFileSync(new URL(f, art)); if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(f + ' kein WebP'); const c = b.toString('ascii', 12, 16);
  if (c === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]; if (c === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  if (c === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; throw new Error(f + ' unbekannt ' + c); }
const KEYS = []; for (const r of R) { for (const ti of TI) KEYS.push(['sky_' + r + '_' + ti, 2048, 1024, 350e3], ['bg_battle_' + r + '_' + ti, 1280, 720, 250e3]); KEYS.push(['horizon_' + r, 2048, 512, 350e3]); }
const LO = { sky: [1024, 512], bg: [640, 360], horizon: [1024, 256] };
// ---------- ohne Browser ----------
await t('Alle Bild-Keys vorhanden (8 Regionen × tag/abend/nacht: sky, bg_battle; horizon je Region; jeweils _lo)', () => list(KEYS.flatMap(([k]) => [k + '.webp', k + '_lo.webp']).filter(f => !has(f)), 'fehlt: '));
await t('Bildgrößen: sky 2048×1024, horizon 2048×512, bg_battle 1280×720; _lo halb', () => { const e = []; for (const [k, w, h] of KEYS) { const a = webpWH(k + '.webp'), l = webpWH(k + '_lo.webp'), L = LO[k.split('_')[0]];
  if (a[0] !== w || a[1] !== h) e.push(k + ' ' + a.join('×')); if (l[0] !== L[0] || l[1] !== L[1]) e.push(k + '_lo ' + l.join('×')); } list(e); });
await t('Byte-Grenzen: sky ≤ 350 KB, bg_battle ≤ 250 KB, alle neuen Bilder zusammen ≤ 9 MB', () => { const e = KEYS.filter(([k, , , m]) => size(k + '.webp') > m).map(([k]) => k + ' ' + size(k + '.webp'));
  const tot = KEYS.reduce((a, [k]) => a + size(k + '.webp') + size(k + '_lo.webp'), 0); console.log('   gesamt', (tot / 1e6).toFixed(2), 'MB'); if (tot > 9e6) e.push('gesamt ' + tot); list(e); });
await t('Horizont-Kulissen haben Transparenz (Alpha, VP8X/VP8L)', () => list(R.filter(r => { const b = readFileSync(new URL('horizon_' + r + '.webp', art)), c = b.toString('ascii', 12, 16); return !(c === 'VP8L' || (c === 'VP8X' && (b[20] & 0x10))); }), 'ohne Alpha: '));
const META = JSON.parse(readFileSync(new URL('sky_meta.json', art), 'utf8'));
await t('sky_meta.json: Sonne/Mond, Mittelfarben je Skybox; Kamera/Horizontlinie je Kampfbild; tan-Bereich je Kulisse', () => { const e = [], hx = /^#[0-9a-f]{6}$/;
  for (const r of R) for (const ti of TI) { const s = META.sky['sky_' + r + '_' + ti]; if (!s || !s.sun || typeof s.sun.az !== 'number' || !s.stats || !['top', 'hor', 'below', 'zenith'].every(k => hx.test(s.stats[k]))) e.push('sky ' + r + ' ' + ti); if (ti === 'nacht' && !s.moon) e.push('mond ' + r);
    const b = META.battle['bg_battle_' + r + '_' + ti]; if (!b || !(b.horizonY > .3 && b.horizonY < .9) || !b.fov || !b.cam) e.push('battle ' + r + ' ' + ti); }
  for (const r of R) { const h = META.horizon['horizon_' + r]; if (!h || !h.tan || h.tan[0] >= h.tan[1]) e.push('horizon ' + r); } list(e); });
await t('Build: SKY_META eingebettet, App mit allen Himmels-Keys, Artifact nur _lo und < 16 MB', () => {
  const h = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'), a = readFileSync(new URL('../dist/artifact.html', import.meta.url), 'utf8');
  if (!/window\.SKY_META=\{/.test(h) || !/window\.SKY_META=\{/.test(a)) throw new Error('SKY_META fehlt');
  const S = JSON.parse(h.match(/window\.ART_SRC=(\{[^<]*?\});/)[1]), A = JSON.parse(a.match(/window\.ART_SRC=(\{[^<]*?\});/)[1]);
  list(KEYS.flatMap(([k]) => [k, k + '_lo']).filter(k => !S[k]), 'App fehlt: '); list(Object.keys(A).filter(k => /^(sky|horizon|bg_battle)_/.test(k) && !/_lo$/.test(k)), 'Artifact voll: ');
  list(KEYS.map(([k]) => k + '_lo').filter(k => !A[k]), 'Artifact fehlt: '); const mb = statSync(new URL('../dist/artifact.html', import.meta.url)).size / 1048576; console.log('   Artifact', mb.toFixed(2), 'MiB'); if (mb >= 16) throw new Error(mb.toFixed(2) + ' MiB'); });
// ---------- im Browser ----------
const S = await serve(), browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 860, height: 400 } }), errs = [];
page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await page.addInitScript(() => { try { const o = JSON.parse(localStorage.getItem('veyra_set') || '{}'); localStorage.setItem('veyra_set', JSON.stringify(Object.assign(o, { res: 'native', gfx: 'high', fps: 0, hudDim: 'aus' }))); } catch (e) { } });
await page.goto(S.url + 'index.html', { waitUntil: 'load' });
const ev = (f, a) => page.evaluate(f, a);
await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(300);
await ev(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; SET.skipBattleIntro = 1; ROAM.want = 0; });
await t('skyFor/envFor/battleBgFor: gültige Werte für alle Regionen × Zeiten', async () => list(await ev(([R, TI]) => { const e = [], hx = /^#[0-9a-f]{6}$/, n1 = v => Math.abs(Math.hypot(...v) - 1) < 1e-3;
  for (const r of R) for (const ti of TI) { const s = skyFor(r, ti), v = envFor(r, ti), b = battleBgFor(r, ti);
    if (!s.ok || !s.src || !s.lo || s.key !== 'sky_' + r + '_' + ti || !n1(s.sun.dir)) e.push('skyFor ' + r + ti);
    if (!n1(v.sunDir) || ![v.sunCol, v.hemiTop, v.hemiBot, v.fog, v.horizon, v.top].every(c => hx.test(c)) || !(v.sunI > 0) || !(v.hemiI > 0) || v.night !== (ti === 'nacht' ? 1 : 0)) e.push('envFor ' + r + ti + JSON.stringify(v));
    if (!b.ok || !b.src || !(b.horizonY > .3 && b.horizonY < .9) || !(b.fov > 10) || b.env.region !== r) e.push('battleBgFor ' + r + ti); }
  return e; }, [R, TI])));
await t('Fallbacks: unbekannte Region → lichtlande, unbekannte Karte → lichtlande, fehlendes Bild → ok=false', async () => { const r = await ev(() => { const k = 'sky_frosttundra_tag', a = ART_SRC[k], b = ART_SRC[k + '_lo']; delete ART_SRC[k]; delete ART_SRC[k + '_lo'];
  const o = { a: skyFor('gibtsnicht', 'tag').region, b: skyRegion('karte_xyz'), c: skyRegion({ id: 'neu', theme: 'snow' }), d: skyFor('frosttundra', 'tag').ok, e: battleBgFor('nix', 'nix').key, f: envFor('x', 'y').region, g: skyRegion({ id: 'z', region: 'glutlande' }) }; ART_SRC[k] = a; ART_SRC[k + '_lo'] = b; return o; });
  if (r.a !== 'lichtlande' || r.b !== 'lichtlande' || r.c !== 'frosttundra' || r.d !== false || r.e !== 'bg_battle_lichtlande_tag' || r.f !== 'lichtlande' || r.g !== 'glutlande') throw new Error(JSON.stringify(r)); });
await t('skyTime: 12 h tag, 18:45 abend, 23 h nacht, 6:15 abend (Morgen), Übergang 17:20 gemischt', async () => { const r = await ev(() => [skyTime(12), skyTime(18.75), skyTime(23), skyTime(6.25), skyBlend(17.33).k > 0 && skyBlend(17.33).k < 1].join()); if (r !== 'tag,abend,nacht,abend,true') throw new Error(r); });
const world = async (m, x, y, time) => { await ev(([m, x, y, tm]) => { mode = 'world'; G.time = tm; if (view === '2d') setView('third', 1); loadMap(m, x, y); }, [m, x, y, time]); await page.waitForFunction(() => typeof skyActive === 'function' && skyActive(), null, { timeout: 60000 }).catch(() => { }); await page.waitForTimeout(1500); };
await world('route1', 9, 12, 720);
await t('Welt route1 Mittag: Skybox aktiv, prozeduraler Himmel aus, Kulisse + Licht aus dem Bild', async () => { const r = await ev(() => ({ a: skyActive(), d: R3.dome.visible, ring: SKY3.ring.visible, reg: SKY3.region, sd: SKY3.sdOn, fog: '#' + R3.scene.fog.color.getHexString(), env: !!R3.scene.environment }));
  if (!r.a || r.d || !r.ring || r.reg !== 'lichtlande' || !r.sd) throw new Error(JSON.stringify(r)); });
await t('Draw-Calls: Himmel/Kulisse/Wolkenmeer/Strahlen ≤ 6 zusätzlich (gegen prozeduralen Himmel)', async () => { const r = await ev(async () => { const fr = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
  const calls = async () => { await fr(); await fr(); R3.r.info.autoReset = true; draw3d(); return R3.r.info.render.calls; };
  const on = await calls(); const keep = window.ART_SRC; window.ART_SRC = Object.fromEntries(Object.entries(keep).filter(([k]) => !/^(sky|horizon)_/.test(k))); SKY3.cache.clear(); SKY3.region = null; R3.mapId = null; const off = await calls(); window.ART_SRC = keep; SKY3.cache.clear(); SKY3.region = null; R3.mapId = null; await calls(); return { on, off }; });
  console.log('   Calls mit', r.on, 'ohne', r.off); if (r.on - r.off > 6) throw new Error(JSON.stringify(r)); });
await t('Texturspeicher: nach Tag→Abend→Nacht höchstens 3 Himmels-Texturen + 1 Kulisse im Cache', async () => { const r = await ev(async () => { const w = ms => new Promise(res => setTimeout(res, ms)); for (const h of [12, 17.3, 19, 20, 22, 23.5]) { G.time = h * 60; for (let i = 0; i < 4; i++) { draw3d(); await w(400); } }
  await w(3200); for (let i = 0; i < 3; i++) { draw3d(); await w(100); } SKY3.gcT = 9; draw3d(); return [...SKY3.cache.values()].filter(e => e.tex).map(e => e.key); });
  const sky = r.filter(k => /^sky_/.test(k)); if (sky.length > 3 || r.length > 4) throw new Error(r.join()); });
await t("Stufe 'low' lädt _lo-Varianten (1024×512)", async () => { const r = await ev(async () => { perfSet('low'); G.time = 720; for (let i = 0; i < 30; i++) { draw3d(); await new Promise(res => setTimeout(res, 150)); const E = SKY3.cache.get('sky_lichtlande_tag@lo'); if (E && E.tex) break; } const E = SKY3.cache.get('sky_lichtlande_tag@lo'); const w = E && E.tex && E.tex.image.naturalWidth; perfSet('high'); return w; });
  if (r !== 1024) throw new Error(String(r)); });
await t('Fehlende Datei: Karte ohne Skybox-Bild → prozeduraler Himmel sichtbar, keine Fehler', async () => { const r = await ev(async () => { const keep = window.ART_SRC; window.ART_SRC = Object.fromEntries(Object.entries(keep).filter(([k]) => !/^sky_flutkueste/.test(k))); SKY3.cache.clear();
  mode = 'world'; G.time = 720; loadMap('brisenhafen', 9, 11); for (let i = 0; i < 6; i++) { draw3d(); await new Promise(res => setTimeout(res, 120)); } const o = { a: skyActive(), d: R3.dome.visible, reg: SKY3.region }; window.ART_SRC = keep; SKY3.cache.clear(); SKY3.region = null; R3.mapId = null; return o; });
  if (r.a || !r.d || r.reg !== 'flutkueste') throw new Error(JSON.stringify(r)); });
await t('Keine Seitenfehler', () => list(errs));
await browser.close(); S.close();
console.log(`\n${ok} ✓ / ${bad} ✗` + (fails.length ? ' – ' + fails.join(' | ') : ''));
process.exit(bad ? 1 : 0);
