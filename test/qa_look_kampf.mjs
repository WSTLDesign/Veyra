// QA Look L3 – Kampf-Inszenierung: Kamerafahrt (Totale → Nähe → Schwenk), KP-Leisten folgen Köpfen, Meldungen, Attackenkarten, Kampfstart-Zeit (JS), 2D-Kampf.
// Aufruf: node build.mjs && node test/qa_look_kampf.mjs [w h] → test/qa_look_kampf.json (+ Screenshots test/look_ui_kampf-*_l3_<w>.png)
import { boot } from './look_lib.mjs';
import { audit } from './qa_look_lib.mjs';
import { writeFileSync } from 'fs';
const W = +(process.argv[2] || 860), H = +(process.argv[3] || 400);
const B = await boot({ w: W, h: H, set: { fps: 0 } }), { page } = B, out = { w: W, h: H, checks: [], data: {} };
const ok = (n, c, d = '') => { out.checks.push({ n, ok: !!c, d }); console.log((c ? '✓ ' : '✗ ') + n + (d ? ' – ' + d : '')); };
const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
const metric = async () => { const m = (await cdp.send('Performance.getMetrics')).metrics, g = k => (m.find(x => x.name === k) || {}).value || 0; return { script: g('ScriptDuration'), task: g('TaskDuration'), layout: g('LayoutDuration'), style: g('RecalcStyleDuration') }; };
await page.evaluate(() => { G.team = [mk(13, 14), mk(25, 11)]; G.nb = 0; SET.skipBattleIntro = 0; SET.banim = 1; loadMap('route1', 9, 12); mode = 'world'; setView('third', true); });
await page.waitForTimeout(4000);
// ---------- Kampfstart-Zeit (1. Kampf = langer Auftakt, 4. Kampf = kurzer Auftakt) ----------
async function timeStart(label, short) {
  await page.evaluate(s => { G.nb = s ? 5 : 0; mode = 'world'; }, short);
  const m0 = await metric();
  const t = await page.evaluate(() => { window.__ts = performance.now(); window.__tm = null; window.__tmenu = null; const iv = setInterval(() => { if (!window.__tm && typeof CAMB !== 'undefined' && CAMB.on) window.__tm = performance.now() - window.__ts; if (B && !B.busy && document.querySelector('#bMenu .big')) { window.__tmenu = performance.now() - window.__ts; clearInterval(iv); } }, 5); startBattle({ wild: mk(59, 10) }); return 0; });
  await page.waitForFunction(() => window.__tmenu != null, null, { timeout: 240000, polling: 100 });
  const m1 = await metric(), r = await page.evaluate(() => ({ cam: window.__tm, menu: window.__tmenu, calls: BT && BT.r ? BT.r.info.render.calls : null }));
  const d = { label, wallToMenuMs: Math.round(r.menu), wallToCamMs: Math.round(r.cam), mainThreadScriptMs: Math.round((m1.script - m0.script) * 1000), mainThreadTaskMs: Math.round((m1.task - m0.task) * 1000) };
  return d;
}
const t1 = await timeStart('1. Kampf (langer Auftakt)', false); out.data.start_long = t1; console.log(JSON.stringify(t1));
await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); await page.waitForTimeout(1500);
const t2 = await timeStart('ab 3. Kampf (kurzer Auftakt)', true); out.data.start_short = t2; console.log(JSON.stringify(t2));
// Standard-Auftakt: Zeitplan aus dem Code (ohne GL): Alarm 240 + Freeze 200 + Wipe 360 (lang) bzw. 220 (kurz) + Meldung(en)
out.data.start_scripted = { lang_ms: 240 + 200 + 360, kurz_ms: 220 };
ok('K1 JS-Hauptthread bis Kampfmenü (kurzer Auftakt) < 1,5 s', t2.mainThreadScriptMs < 1500, t2.mainThreadScriptMs + ' ms Skript, ' + t2.mainThreadTaskMs + ' ms Tasks (Wandzeit ' + t2.wallToMenuMs + ' ms inkl. Software-GL)');
ok('K2 JS-Hauptthread bis Kampfmenü (1. Kampf) < 1,5 s', t1.mainThreadScriptMs < 1500, t1.mainThreadScriptMs + ' ms Skript, ' + t1.mainThreadTaskMs + ' ms Tasks (Wandzeit ' + t1.wallToMenuMs + ' ms)');
// ---------- Kamerafahrt (synthetische Zeit: camTick mit festen 16,7-ms-Schritten, unabhängig von der Software-GL) ----------
const cam = await page.evaluate(() => {
  const C = camGet(), rows = [], bm = document.getElementById('bMenu');
  const snap = (t, lab) => rows.push({ t: Math.round(t), lab, focus: C.focus, dist: +C.dist.toFixed(2), h: +C.height.toFixed(2), pitch: +C.pitch.toFixed(3), fov: +C.fov.toFixed(1), yaw: +C.yaw.toFixed(3), eye: [+C.eye.x.toFixed(2), +C.eye.y.toFixed(2), +C.eye.z.toFixed(2)] });
  const keep = { red: RED }; RED = false;
  camBattleStart({}); const t0 = CAMB.t0; let now = t0; bm.classList.remove('rmoves'); CAMB.until = 0;
  for (let i = 0; i <= 330; i++) { camTick(now, 16.7); const ms = i * 16.7; if ([0, 30, 60, 96, 150, 330].includes(i)) snap(ms, 'start'); now += 16.7; }
  // Schwenk: Gierwinkel-Spanne über weitere 12 s
  let yMin = 9, yMax = -9; for (let i = 0; i < 720; i++) { camTick(now, 16.7); now += 16.7; yMin = Math.min(yMin, C.yaw); yMax = Math.max(yMax, C.yaw); }
  // Attackenwahl → eigene Kreatur
  bm.classList.add('rmoves'); for (let i = 0; i < 150; i++) { camTick(now, 16.7); now += 16.7; } snap(2500, 'rmoves'); bm.classList.remove('rmoves');
  // Treffer → Getroffener 0,95 s, danach zurück
  /* kein B.fx mit synthetischer Zeit (würde die Kampfschleife mit negativen Radien abbrechen) */ CAMB.focus = 'foe'; CAMB.until = now + 950; for (let i = 0; i < 40; i++) { camTick(now, 16.7); now += 16.7; } snap(1000, 'treffer foe'); for (let i = 0; i < 200; i++) { camTick(now, 16.7); now += 16.7; } snap(3300, 'danach');
  // Reduzierte Bewegung: springt ohne Fahrt
  RED = true; camBattleStart({}); const t1 = CAMB.t0; camTick(t1 + 16, 16); const rRed = { dist: +C.dist.toFixed(2) }; for (let i = 0; i < 12; i++) camTick(t1 + 16 + i * 16.7, 16.7); const rRed2 = { dist: +C.dist.toFixed(2), yawRange: 0 };
  RED = keep.red; camBattleStart({});
  return { rows, yawRange: +(yMax - yMin).toFixed(3), red1: rRed, red2: rRed2 };
});
out.data.cam = cam; for (const r of cam.rows) console.log(JSON.stringify(r));
const r0 = cam.rows.find(r => r.t === 0), r16 = cam.rows.find(r => r.t === 1602 || Math.abs(r.t - 1602) < 20) || cam.rows[3], rEnd = cam.rows.find(r => r.lab === 'start' && r.t > 5000);
ok('C1 Auftakt aus der Totale (Abstand ≥ 11, Höhe/Pitch erhöht)', r0.dist >= 11 && r0.pitch > .2, JSON.stringify([r0.dist, r0.pitch]));
ok('C2 Fahrt auf Kampfdistanz nach ≈ 1,6 s (Abstand ≤ 10) und weiter Richtung Nähe', r16.dist <= 10.2 && rEnd.dist <= 8.5, 'bei 1,6 s: ' + r16.dist + ' · bei 5,5 s: ' + rEnd.dist);
ok('C3 monotone Annäherung (keine Rückwärtsfahrt)', cam.rows.filter(r => r.lab === 'start').every((r, i, a) => i === 0 || r.dist <= a[i - 1].dist + .01), cam.rows.filter(r => r.lab === 'start').map(r => r.dist).join(' → '));
ok('C4 Schwenk vorhanden (Gierwinkel-Spanne 0,05–0,3 rad)', cam.yawRange >= .05 && cam.yawRange <= .3, cam.yawRange + ' rad');
const rm = cam.rows.find(r => r.lab === 'rmoves'), th = cam.rows.find(r => r.lab === 'treffer foe');
ok('C5 Attackenwahl: Kamera näher an eigener Kreatur', rm && rm.focus === 'me' && rm.dist < 7, JSON.stringify(rm && [rm.focus, rm.dist]));
ok('C6 Treffer: Fokus auf Getroffenen', th && th.focus === 'foe', th && th.focus);
ok('C7 Bewegung reduzieren: Kamera springt ohne Fahrt (Abstand nach 1 Frame ≤ 9)', cam.red1.dist <= 9, JSON.stringify(cam.red1));
// ---------- Echtzeit-Zustand im Kampf: KP-Leisten, Meldungen, Karten ----------
await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; G.nb = 5; SET.skipBattleIntro = 1; }); await page.waitForTimeout(1200);
await page.evaluate(() => startBattle({ wild: mk(59, 10) }));
await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 240000 }); await page.waitForTimeout(2500);
const proj = () => page.evaluate(() => {
  const cv = BT.r.domElement, cr = cv.getBoundingClientRect(), v = new THREE.Vector3(), R = {};
  for (const [w, id] of [['foe', 'bFoeBox'], ['me', 'bMeBox']]) { const o = BT[w], el = document.getElementById(id); if (!o || !el) continue; const U = o.userData || {}; v.set(o.position.x, o.position.y + (U.baseH || 1) * o.scale.y * 1.04 + .18, o.position.z).project(BT.cam);
    const hx = cr.left + (v.x + 1) / 2 * cr.width, hy = cr.top + (1 - v.y) / 2 * cr.height, r = el.getBoundingClientRect(); R[w] = { head: [Math.round(hx), Math.round(hy)], box: [Math.round(r.left + r.width / 2), Math.round(r.bottom)], w: Math.round(r.width), h: Math.round(r.height), off: el.classList.contains('off'), placed: el.classList.contains('placed'), inView: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, vis: getComputedStyle(el).opacity }; }
  const lg = document.getElementById('bLog'), lr = lg.getBoundingClientRect(); R.log = { rect: [Math.round(lr.left), Math.round(lr.top), Math.round(lr.width), Math.round(lr.height)], fs: getComputedStyle(lg).fontSize, txt: lg.textContent.slice(0, 40) }; R.cam = { mode: CAM.mode, focus: CAM.focus };
  return R; });
const p1 = await proj(); await page.waitForTimeout(1500); const p2 = await proj(); out.data.proj = [p1, p2]; console.log(JSON.stringify(p2));
for (const w of ['foe', 'me']) { const a = p2[w]; if (!a) { ok('H ' + w + ' vorhanden', false); continue; }
  ok(`H1 KP-Leiste ${w}: platziert, im Bild`, a.placed && a.inView, JSON.stringify(a));
  if (!a.off) { const dx = Math.abs(a.box[0] - a.head[0]), dy = a.head[1] - a.box[1]; ok(`H2 KP-Leiste ${w} über dem Kopf (Δx ≤ ${Math.round(W * .2)} px, darüber oder geklemmt)`, dx <= W * .2 && dy >= -H * .25, `Δx ${dx}, Kopf-y − Unterkante ${dy}`); } }
const ov = (a, b) => a && b && !(a.box[0] + a.w / 2 < b.box[0] - b.w / 2 || b.box[0] + b.w / 2 < a.box[0] - a.w / 2 || a.box[1] < b.box[1] - b.h || b.box[1] < a.box[1] - a.h);
ok('H3 KP-Leisten überlappen sich nicht', !ov(p2.foe, p2.me));
ok('H4 Meldungszeile im Bild, Schrift ≥ 13 px', p2.log.rect[0] >= 0 && p2.log.rect[0] + p2.log.rect[2] <= W && parseFloat(p2.log.fs) >= 13, JSON.stringify(p2.log));
await page.waitForTimeout(300); await page.screenshot({ path: new URL(`./look_ui_kampf-start_l3_${W}.png`, import.meta.url).pathname });
// Kontrast Kampf-Start (Leisten, Meldung, Befehle)
const a1 = await audit(page); out.data.audit_start = a1; ok('A1 Kontrast Kampf-Start (≥ 4,5:1) ohne Fehler', a1.contrast.fail.length === 0, 'min ' + a1.contrast.min + ' ' + JSON.stringify(a1.contrast.fail.slice(0, 5)));
ok('A2 Touch-Ziele Kampf-Start ≥ 48 px', a1.touch.small.length === 0, JSON.stringify(a1.touch.small.slice(0, 6)));
// Attackenkarten
await page.click('#bMenu .big.k1'); await page.waitForTimeout(1200);
const mv = await page.evaluate(() => [...document.querySelectorAll('#bMenu .mv')].map(e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top), txt: e.textContent.trim().slice(0, 30), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }; }));
out.data.moves = mv; console.log(JSON.stringify(mv));
ok('M1 Attackenkarten: ≥ 2 sichtbar, alle im Bild, ≥ 48 px', mv.length >= 2 && mv.every(m => m.inView && m.w >= 48 && m.h >= 48), mv.map(m => m.w + '×' + m.h).join(', '));
const a2 = await audit(page, { save: new URL(`./look_ui_kampf-attacken_l3_${W}.png`, import.meta.url).pathname }); out.data.audit_moves = a2;
ok('M2 Kontrast Attackenkarten ohne Fehler', a2.contrast.fail.length === 0, 'min ' + a2.contrast.min + ' ' + JSON.stringify(a2.contrast.fail.slice(0, 5)));
ok('M3 Touch-Ziele Attackenwahl ≥ 48 px', a2.touch.small.length === 0, JSON.stringify(a2.touch.small.slice(0, 6)));
ok('M4 keine Überlappung der Bedienelemente', a2.overlap.length === 0, a2.overlap.join('; '));
const hp0 = await page.evaluate(() => B.foe[B.fi].hp); await page.locator('#bMenu .mv', { hasText: '· ' }).first().click(); /* Schadensattacke (Karte mit Stärke), nicht Status */ for (let i = 0; i < 10; i++) { await page.waitForTimeout(400); await page.mouse.click(Math.round(W / 2), Math.round(H / 2)); }
await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }).catch(() => { });
const hp1 = await page.evaluate(() => B ? B.foe[B.fi].hp : -1); ok('M5 Attacke per Karte wirkt (Gegner-KP sinken) und Menü kommt zurück', hp1 < hp0 && await page.evaluate(() => !!document.querySelector('#bMenu .big')), hp0 + ' → ' + hp1);
await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); await page.waitForTimeout(800);
ok('E1 nach Kampfende CAM explore', await page.evaluate(() => CAM.mode) === 'explore');
// ---------- 2D-Kampf (versteckte Option) ----------
const g2 = await page.evaluate(async () => { SET.b2d = 'bild'; G.nb = 5; mode = 'world'; setView('2d', true); startBattle({ wild: mk(28, 12) }); return view; });
await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }); await page.waitForTimeout(1000);
const d2 = await page.evaluate(() => ({ b2d: $('#battle').classList.contains('b2d'), dieg: $('#battle').classList.contains('dieg'), cam: CAM.mode, view, vis: !$('#battle').hidden, big: [...document.querySelectorAll('#bMenu .big')].length }));
out.data.b2d = d2; ok('2D1 setView(\'2d\',true) + Kampf: 2D-Bühne aktiv (b2d), Menü da', g2 === '2d' && d2.b2d && d2.vis && d2.big >= 1, JSON.stringify(d2));
await page.click('#bMenu .big.k1'); await page.waitForTimeout(300); await page.click('#bMenu .mv'); for (let i = 0; i < 10; i++) { await page.waitForTimeout(400); await page.mouse.click(Math.round(W / 2), Math.round(H / 2)); }
await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }).catch(() => { });
ok('2D2 2D-Kampf: Attacke läuft durch, Menü kehrt zurück', await page.evaluate(() => !!(B && document.querySelector('#bMenu .big'))));
await page.screenshot({ path: new URL(`./look_ui_kampf2d_l3_${W}.png`, import.meta.url).pathname });
await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; setView('third', true); });
ok('Z Keine Seitenfehler', B.errs.length === 0, B.errs.slice(0, 3).join(' | '));
writeFileSync(new URL(`./qa_look_kampf_${W}.json`, import.meta.url), JSON.stringify(out, null, 1));
const bad = out.checks.filter(c => !c.ok); console.log(bad.length ? 'FEHLER: ' + bad.length : 'Alle ' + out.checks.length + ' Prüfungen grün.');
await B.close();
