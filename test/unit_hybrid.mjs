// Hybrid H2 – Kampf-Panorama, Kreaturen-Licht, Ortsansichten, Kapitel-Standbilder.   node build.mjs && node test/unit_hybrid.mjs
// Ohne Browser: Bilder (Größe/Budget), Build/Artifact, Spielstand-Migration (G.story.pics). Im Browser: Panorama an/aus, Horizont = horizonY, Draw-Calls,
// Licht/Schatten aus dem Bild, Stufe low → _lo, Fallback (Höhle, fehlendes Bild), Ortsansicht-Regeln, Kapitelbild einmalig + überspringbar, keine Seitenfehler.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { loadVeyra } from '../tools/balance.mjs';
import { boot, scene } from './look_lib.mjs';
let ok = 0, bad = 0;
const t = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const ART = new URL('../public/art/', import.meta.url), files = readdirSync(ART);
const MAPS15 = ['morgenau', 'route1', 'kupferhain', 'route2', 'nebelgrotte', 'brisenhafen', 'route3', 'frostheim', 'route4', 'schattmoor', 'siegesstrasse', 'windkueste', 'moewenbucht', 'glutschlucht', 'fluestertal'];
const dims = f => execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nfor f in sys.argv[1:]:print(*Image.open(f).size)', ...f.map(x => new URL(x, ART).pathname)], { encoding: 'utf8' }).trim().split('\n').map(l => l.split(' ').map(Number));

// ---------- ohne Browser ----------
await t('Ortsbilder place_<karte> (+_lo) für alle 15 Außenkarten, ≤ 1024 px, WebP', () => {
  const miss = MAPS15.filter(m => !files.includes(`place_${m}.webp`) || !files.includes(`place_${m}_lo.webp`)); if (miss.length) throw new Error('fehlt: ' + miss.join(','));
  const d = dims(MAPS15.map(m => `place_${m}.webp`)), big = d.filter(([w, h]) => w > 1024 || h > 1024); if (big.length) throw new Error('zu groß ' + JSON.stringify(big)); });
await t('Kapitelbilder chapter_1…10 (+_lo), ≤ 1280 px', () => {
  const n = [...Array(10)].map((_, i) => i + 1), miss = n.filter(i => !files.includes(`chapter_${i}.webp`) || !files.includes(`chapter_${i}_lo.webp`)); if (miss.length) throw new Error('fehlt ' + miss);
  const d = dims(n.map(i => `chapter_${i}.webp`)); if (d.some(([w, h]) => w > 1280 || h > 1280)) throw new Error(JSON.stringify(d)); });
const newBytes = files.filter(f => /^(place|chapter)_/.test(f)).reduce((a, f) => a + statSync(new URL(f, ART)).size, 0);
await t(`Bildbudget neue Bilder ≤ 3 MB (${(newBytes / 1e6).toFixed(2)} MB)`, () => newBytes <= 3e6);
await t('Build: ART_SRC kennt place_/chapter_ (+_lo), Artifact < 15,5 MB bettet die volle Fassung ein (ohne _lo)', () => {
  const h = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'), S = JSON.parse(h.match(/window\.ART_SRC=(\{[^<]*?\});/)[1]);
  if (!S.place_morgenau || !S.chapter_1 || !S.place_morgenau_lo) throw new Error('App ART_SRC');
  const a = readFileSync(new URL('../dist/artifact.html', import.meta.url), 'utf8'), A = JSON.parse(a.match(/window\.ART_SRC=(\{[^<]*?\});/)[1]);
  if (!A.place_morgenau || !A.chapter_1 || A.chapter_1_lo || A.place_morgenau_lo) throw new Error('Artifact-Auswahl'); if (!/^data:image\/webp/.test(A.chapter_1)) throw new Error('kein data-URI');
  const mb = statSync(new URL('../dist/artifact.html', import.meta.url)).size / 1048576; console.log('   Artifact', mb.toFixed(2), 'MiB'); if (mb >= 15.5) throw new Error(mb + ' MiB'); });
await t('Quelltext-Hooks: 10-mon3d (hyBattleFrame, hySprPost, Dunst-Uniform), 27-story (hyChapterShow), 35 (Kampfkamera-Untersicht)', () => {
  const s10 = readFileSync(new URL('../src/10-mon3d.js', import.meta.url), 'utf8'), s27 = readFileSync(new URL('../src/27-story.js', import.meta.url), 'utf8'), s35 = readFileSync(new URL('../src/35-transitions.js', import.meta.url), 'utf8');
  if (!/hyBattleFrame\(BT,now\)/.test(s10) || !/hySprPost\(S,L,cam\)/.test(s10) || !/uHzK/.test(s10)) throw new Error('10'); if (!/hyChapterShow\(c\.n/.test(s27)) throw new Error('27'); if (!/both: \{[^}]*p:-\.05/.test(s35)) throw new Error('35'); });
{ const { run } = loadVeyra(), J = c => JSON.parse(run(`JSON.stringify((()=>{${c}})())`));
  await t('Migration: alter Spielstand ohne G.story.pics → {} (Default), vorhandene Einträge bleiben', () => {
    const r = J(`let g=freshG({});delete g.story;migrateSave(g);const a=g.story&&g.story.pics;let h=freshG({});h.story={ch:3,help:{},seen:{},mig:1,pics:{2:1,3:1}};migrateSave(h);return{a,b:h.story.pics,ch:h.story.ch};`);
    if (!r.a || Object.keys(r.a).length) throw new Error(JSON.stringify(r.a)); if (!r.b[2] || !r.b[3] || r.ch !== 3) throw new Error(JSON.stringify(r)); });
  await t('Kapitel-Standbild: einmal je Kapitel (G.story.pics), danach sofort weiter (Kapitelkarte)', () => {
    const r = J(`hyAuto=()=>true;G=freshG({});migrateSave(G);let n=0;const a=hyChapterShow(2,{then:()=>n++});const b=hyChapterShow(2,{then:()=>n++});const c=hyChapterShow(2,{force:1,then:()=>n++});return{a,b,c,n,p:G.story.pics};`);
    if (!r.a || r.b || !r.c || r.n !== 3 || !r.p[2]) throw new Error(JSON.stringify(r)); }); }

// ---------- im Browser ----------
const Bt = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0 } }), { page } = Bt;
const fight = async (foe = 25) => { await page.evaluate(f => { SET.skipBattleIntro = 1; startBattle({ wild: mk(f, 10) }); }, foe);
  await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 90000 }); await page.waitForTimeout(2400); };
const end = () => page.evaluate(() => { try { endBattle('run'); } catch (e) { } });
await scene(page, 'route1', 9, 12, 720); await page.waitForTimeout(1500);
await t('Kampfbild der Region beim Betreten der Karte vorgeladen und dekodiert', async () => { await page.waitForFunction(() => { const E = HYI.get(hyBgSrc(battleBgFor(skyRegion(cur), skyTime()))); return E && E.state !== 'load'; }, null, { timeout: 15000 }).catch(() => { }); const r = await page.evaluate(() => { const i = battleBgFor(skyRegion(cur), skyTime()), s = hyBgSrc(i), E = HYI.get(s); return { s, st: E && E.state, cur: cur.id, k: [...HYI.keys()] }; }); if (r.st !== 'ok') throw new Error(JSON.stringify(r)); });
await fight();
const b1 = await page.evaluate(() => ({ on: HYB.on, key: HYB.key, d: HYB.dbg, calls: BT.r.info.render.calls, dome: BT.dome.visible, trees: BT.crown.visible, mesh: HYB.mesh.visible, hz: [...BT.s.userData.spr.mat.uniforms.uHzK.value.toArray()],
  sun: BT.sun.position.clone().sub(BT.sun.target.position).normalize().toArray(), cs: [BT.cs[0].rotation.z, BT.cs[0].material.opacity], focus: CAM.focus }));
await t('Kampf route1 Tag: Panorama aktiv (bg_battle_lichtlande_tag), alte Kuppel/Bäume aus', () => { if (!b1.on || b1.key !== 'bg_battle_lichtlande_tag' || b1.dome || b1.trees || !b1.mesh) throw new Error(JSON.stringify(b1)); });
await t(`Horizont der Szene = horizonY des Bildes (Pose „beide“: ${b1.d.hyTop} ≈ 0,589)`, () => b1.focus === 'both' && Math.abs(b1.d.hyTop - .589) < .03);
await t('Licht aus dem Bild: Sonnenrichtung (≥ 14°) und gedrehter Bodenschatten', () => b1.sun[1] >= .23 && Math.abs(b1.cs[0]) > .01 && b1.cs[1] > .6);
await t('Dunst der hinteren Kreatur im Kampf aktiv (uHzK.z > 0)', () => b1.hz[2] > 0 && b1.hz[1] > b1.hz[0]);
// Attackenwahl: Kamera neigt sich, Bild läuft mit (Horizont weiter oben, Abbildung neu)
await page.click('#bMenu .big.k1'); await page.waitForTimeout(2200);
const b2 = await page.evaluate(() => HYB.dbg); await page.click('#bMenu .back');
await t(`Pose „eigene Kreatur“: Horizont folgt der Kamera (${b2.hyTop} < ${b1.d.hyTop})`, () => b2.hyTop < b1.d.hyTop - .1);
const callsOn = b1.calls; await end(); await page.waitForTimeout(400);
await page.evaluate(() => { HYB.off = true; }); await fight(); const callsOff = await page.evaluate(() => ({ c: BT.r.info.render.calls, dome: BT.dome.visible, on: HYB.on })); await end(); await page.evaluate(() => { HYB.off = false; });
await t(`Draw-Calls Kampf mit Panorama ${callsOn} ≤ ohne ${callsOff.c} (≤ 150)`, () => callsOn <= callsOff.c && callsOn <= 150 && callsOff.dome && !callsOff.on);
// Abend/Nacht: Regionsbild der Tageszeit, Schatten heller bei Mondlicht
await scene(page, 'route1', 9, 12, 1380); await page.waitForTimeout(800); await fight();
const bn = await page.evaluate(() => ({ key: HYB.key, op: BT.cs[0].material.opacity, g: [...BT.s.userData.spr.mat.uniforms.uTint.value.toArray()] })); await end();
await t('Nacht: bg_battle_lichtlande_nacht, Bodenschatten weicher, Tönung kühl (b > r)', () => bn.key === 'bg_battle_lichtlande_nacht' && bn.op < b1.cs[1] && bn.g[2] > bn.g[0]);
// Höhle → bisheriger Hintergrund
await scene(page, 'nebelgrotte', 6, 12, 720); await page.waitForTimeout(800); await fight();
const bc = await page.evaluate(() => ({ on: HYB.on, dome: BT.dome.visible })); await end();
await t('Höhle (nebelgrotte): kein Panorama, bisheriger Hintergrund', () => !bc.on && bc.dome);
// Fehlendes Bild → Fallback ohne Fehler
await scene(page, 'brisenhafen', 9, 11, 720); await page.waitForTimeout(800);
await page.evaluate(() => { window._art = Object.assign({}, ART_SRC); for (const k in ART_SRC) if (/^bg_battle_flutkueste/.test(k)) delete ART_SRC[k]; });
await fight(37); const bm = await page.evaluate(() => ({ on: HYB.on, dome: BT.dome.visible })); await end(); await page.evaluate(() => { Object.assign(ART_SRC, window._art); });
await t('Bild fehlt (ok=false) → bisheriger Hintergrund', () => !bm.on && bm.dome);
// Stufe low → _lo-Bild
await page.evaluate(() => perfSet('low')); await scene(page, 'route1', 9, 12, 720); await page.waitForTimeout(1200); await fight();
const bl = await page.evaluate(() => ({ on: HYB.on, src: HYB.cur && HYB.cur.src, calls: BT.r.info.render.calls })); await end(); await page.evaluate(() => perfSet('high'));
await t('Stufe low: Panorama aus der _lo-Variante, läuft', () => bl.on && /_lo\.webp/.test(bl.src) && bl.calls <= 150);
// Welt-Kreaturen: Tönung nach Bild-Licht, kein Kampf-Dunst
await scene(page, 'route1', 9, 12, 1125); await page.waitForTimeout(3500);
const w = await page.evaluate(() => { const L = R3.scene.userData.spr; return L ? { hz: L.mat.uniforms.uHzK.value.z, rim: L.mat.uniforms.uRim.value.toArray() } : null; });
await t('Welt (Abend): Sprites ohne Kampf-Dunst, warmes Randlicht (r ≥ b)', () => w && w.hz === 0 && w.rim[0] >= w.rim[2]);
// ---------- Ortsansichten (Tests: sofort beendet; VEYRA_HY=1 erzwingt die Anzeige) ----------
const pl = await page.evaluate(async () => { const W = ms => new Promise(r => setTimeout(r, ms)), R = {}, until = async (f, ms = 8000) => { const t0 = performance.now(); while (!f() && performance.now() - t0 < ms) await W(40); return f(); }, D = () => document.getElementById('hyPlace'); HYP.cur = null; HYP.last = {}; HYP.shownAt = 0; HYC.at = 0;
  loadMap('route1', 9, 12); R.auto = { key: HYP.lastKey, dom: !!document.getElementById('hyPlace') };
  window.VEYRA_HY = 1; HYP.shownAt = 0; HYP.lastKey = null; loadMap('morgenau', 9, 7); await until(() => D() && mode === 'wait'); R.town = { key: HYP.lastKey, dom: !!document.getElementById('hyPlace'), mode };
  document.getElementById('hyPlace') && document.getElementById('hyPlace').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await until(() => !D()); R.skip = { dom: !!document.getElementById('hyPlace'), mode };
  HYP.shownAt = 0; HYP.lastKey = null; loadMap('haus_spieler'); R.inside = HYP.lastKey; loadMap('morgenau', 9, 7); R.back = HYP.lastKey;
  HYP.shownAt = 0; HYP.lastKey = null; loadMap('route1', 9, 12); R.route = HYP.lastKey;
  HYP.shownAt = 0; HYP.lastKey = null; delete HYP.last.morgenau; loadMap('morgenau', 9, 7); await until(() => D()); await W(300); const t1 = performance.now(); await until(() => !D()); R.dur = Math.round(performance.now() - t1); R.auto2 = { dom: !!document.getElementById('hyPlace'), mode };
  window.VEYRA_HY = 0; return R; });
await t('Ortsansicht im Testlauf sofort beendet (kein Overlay), Schlüssel gesetzt', () => pl.auto.key === 'place_route1' && !pl.auto.dom);
await t('Ort betreten (VEYRA_HY): Standbild place_morgenau, Steuerung ruht (mode wait)', () => { if (!(pl.town.key === 'place_morgenau' && pl.town.dom && pl.town.mode === 'wait')) throw new Error(JSON.stringify(pl)); });
await t('Tippen überspringt, Spielsteuerung zurück (mode world)', () => !pl.skip.dom && pl.skip.mode === 'world');
await t('Innenraum und Rückkehr in denselben Ort: kein Standbild', () => pl.inside === null && pl.back === null);
await t('Route derselben Region: kein Standbild', () => pl.route === null);
await t(`Standbild endet von selbst (≈ 1,5 s + Blende; gemessen ${pl.dur} ms)`, () => !pl.auto2.dom && pl.auto2.mode === 'world' && pl.dur < 4000);
// ---------- Kapitel-Standbild ----------
const ch = await page.evaluate(async () => { const W = ms => new Promise(r => setTimeout(r, ms)), R = {}; G.story.pics = {}; window.VEYRA_HY = 1; mode = 'world'; let n = 0;
  const until = async (f, ms = 8000) => { const t0 = performance.now(); while (!f() && performance.now() - t0 < ms) await W(40); return f(); }; R.a = hyChapterShow(3, { then: () => n++ }); await until(() => document.getElementById('hyChap')); await W(60); const el = document.getElementById('hyChap'); R.dom = !!el; R.txt = el && el.textContent; R.mode = mode;
  el && el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await W(200); R.early = !!document.getElementById('hyChap');
  await W(1000); const e2 = document.getElementById('hyChap'); e2 && e2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await until(() => !document.getElementById('hyChap')); R.closed = !document.getElementById('hyChap'); R.n = n; R.mode2 = mode;
  R.again = hyChapterShow(3, {}); window.VEYRA_HY = 0; R.auto = hyChapterShow(4, { then: () => n++ }); R.autoDom = !!document.getElementById('hyChap'); R.n2 = n; return R; });
await t('Kapitelbild: Nummer, Titel, Satz; Steuerung ruht', () => { if (!(ch.a && ch.dom && ch.mode === 'wait')) throw new Error(JSON.stringify(ch)); return ch.a && ch.dom && /Kapitel 3/.test(ch.txt) && /Wellen der Freundschaft/.test(ch.txt) && /Freunde/.test(ch.txt) && ch.mode === 'wait'; });
await t('Kapitelbild: erst nach 1 s überspringbar, danach Kapitelkarte (Rückruf) und mode world', () => ch.early && ch.closed && ch.n === 1 && ch.mode2 === 'world');
await t('Kapitelbild nicht erneut; im Testlauf sofort beendet', () => ch.again === false && ch.auto === true && !ch.autoDom && ch.n2 === 2);
await t('Keine Seitenfehler', () => { if (Bt.errs.length) throw new Error(Bt.errs.slice(0, 3).join(' | ')); });
await Bt.close();
console.log(`\nHybrid H2: ${ok} ✓, ${bad} ✗`); process.exit(bad ? 1 : 0);
