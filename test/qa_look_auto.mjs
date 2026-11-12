// QA Look L3 – Auto-Qualität (43-perf.js): künstlich lange/kurze Frames in perfFrame() einspeisen und Stufe, Auflösung und Hysterese prüfen.
// Aufruf: node build.mjs && node test/qa_look_auto.mjs  → test/qa_look_auto.json
// Methode: Die echte Schleife wird angehalten (requestAnimationFrame = Stub), perfFrame(t, js) bekommt synthetische Zeitstempel. Das 900-ms-Einschwingfenster
// in perfFrame läuft in echter Zeit – daher je Takt (100 ms real) ein 600-ms-Fenster synthetisch einspeisen.
import { boot } from './look_lib.mjs';
import { writeFileSync } from 'fs';
const B = await boot({ w: 860, h: 400, set: { res: 'auto', gfx: 'auto', fps: 60 } }), { page } = B;
const out = { checks: [], traces: {} };
const ok = (n, c, d = '') => { out.checks.push({ n, ok: !!c, d }); console.log((c ? '✓ ' : '✗ ') + n + (d ? ' – ' + d : '')); };
await page.evaluate(() => { setView('third', 1); });
await page.waitForTimeout(3000);
// Hauptschleife stoppen, damit nur synthetische Frames zählen
await page.evaluate(() => { window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; });
await page.waitForTimeout(1500);
const reset = (cfg) => page.evaluate(cfg => { Object.assign(SET, cfg, { fps: 60 }); perfStart(); PERF.weak = false; PERF.tier = SET.gfx !== 'auto' ? SET.gfx : 'high'; PERF.scale = 1; PERF.slow = PERF.fast = 0; PERF.changed = 0; PERF.last = 0; PERF.win.n = PERF.win.sum = PERF.win.js = 0; PERF.win.t0 = 0; PERF.ft = 16.7; R3 && R3.fit && R3.fit(); window.__T = 1e6; return { tier: PERF.tier, scale: PERF.scale }; }, cfg);
// Phase: n Takte à 100 ms real; je Takt 600 ms synthetisch (Frame-Abstand dt)
const phase = (ticks, dt, js = 3) => page.evaluate(async ([ticks, dt, js]) => {
  const tr = []; const per = Math.round(600 / dt);
  for (let i = 0; i < ticks; i++) { for (let k = 0; k < per; k++) { window.__T += dt; perfFrame(window.__T, js); } const cv = R3 && R3.r ? R3.r.domElement : null; tr.push([PERF.tier, +PERF.scale.toFixed(2), cv ? cv.height : 0]); await new Promise(r => setTimeout(r, 100)); }
  return tr;
}, [ticks, dt, js]);
const uniq = tr => { const o = []; let last = ''; for (const [t, s, h] of tr) { const k = t + '|' + s + '|' + h; if (k !== last) { o.push({ tier: t, scale: s, canvasH: h }); last = k; } } return o; };
const changes = tr => { let n = 0; for (let i = 1; i < tr.length; i++) if (tr[i][0] !== tr[i - 1][0] || tr[i][1] !== tr[i - 1][1]) n++; return n; };

// A: res auto + gfx auto – langsam (40 ms = 25 fps) → Auflösung sinkt bis 0,6, danach Stufe high→mid→low; schnell (10 ms) → Auflösung steigt, danach Stufe low→mid→high
console.log('A: auto/auto');
const a0 = await reset({ res: 'auto', gfx: 'auto' }); const H0 = await page.evaluate(() => R3.r.domElement.height);
const aSlow = await phase(160, 40); const aEnd = aSlow[aSlow.length - 1];
out.traces.A_slow = uniq(aSlow);
ok('A1 Start: Stufe high, Maßstab 1', a0.tier === 'high' && a0.scale === 1, JSON.stringify(a0) + ' Canvas ' + H0 + ' px hoch');
const firstDown = aSlow.findIndex(x => x[1] < 1), tierDown = aSlow.findIndex(x => x[0] !== 'high');
ok('A2 lange Frames: Auflösung sinkt zuerst (bis ≥ 0,6)', firstDown >= 0 && aSlow.some(x => x[1] <= .62), 'erster Abfall bei Takt ' + firstDown + ', Minimum ' + Math.min(...aSlow.map(x => x[1])));
ok('A3 Canvas-Höhe sinkt mit dem Maßstab', aSlow.some(x => x[2] > 0 && x[2] <= Math.round(H0 * .65)), 'Canvas-Höhe min ' + Math.min(...aSlow.map(x => x[2])) + ' von ' + H0);
ok('A4 danach fällt die Stufe (high → mid → low)', tierDown > firstDown && aEnd[0] === 'low', 'Stufenwechsel ab Takt ' + tierDown + ', Ende ' + aEnd[0]);
const aFast = await phase(300, 10); out.traces.A_fast = uniq(aFast); const fEnd = aFast[aFast.length - 1];
ok('A5 kurze Frames: Auflösung steigt wieder auf 1,0', fEnd[1] === 1 && fEnd[2] === H0, 'Ende Maßstab ' + fEnd[1] + ', Canvas ' + fEnd[2] + ' (Start ' + H0 + ')');
ok('A6 danach steigt die Stufe (low → mid → high)', fEnd[0] === 'high', 'Ende Stufe ' + fEnd[0]);
const upScale = aFast.findIndex(x => x[1] === 1), upTier = aFast.findIndex(x => x[0] !== 'low');
ok('A7 Reihenfolge beim Erholen: erst Auflösung, dann Stufe', upScale >= 0 && upTier > upScale, 'Auflösung 1,0 ab Takt ' + upScale + ', Stufenwechsel ab Takt ' + upTier);
// Stufe wird an die Welt weitergegeben (Schatten)
const sh = await page.evaluate(() => ({ tier: PERF.tier, shadow: perfTier().shadow, sunShadow: R3 && R3.sun ? !!R3.sun.castShadow : null }));
out.traces.A_shadow_high = sh;

// B: Hysterese – Regelkreis: Frame-Zeit hängt vom Auflösungs-Maßstab ab (dt = 30 ms · Maßstab², Ziel 16,7 ms) → muss sich einpendeln, nicht flattern
console.log('B: Hysterese');
await reset({ res: 'auto', gfx: 'auto' });
const loop = async n => { const tr = []; for (let i = 0; i < n; i++) { const sc = await page.evaluate(() => PERF.scale); const t = await phase(1, Math.max(6, Math.round(30 * sc * sc))); tr.push(t[0]); } return tr; };
const bTr = await loop(120); out.traces.B = uniq(bTr);
const late = bTr.slice(60); ok('B1 Regelkreis pendelt sich ein: ≤ 8 Wechsel insgesamt, keine in den letzten 60 Takten', changes(bTr) <= 8 && changes(late) === 0, 'Wechsel ' + changes(bTr) + ', Ende ' + JSON.stringify(bTr[bTr.length - 1]) + ' · Verlauf ' + JSON.stringify(out.traces.B.map(x => x.scale)));
// Dauerhaft knapp über Ziel (22 ms ≈ 1,32 × Ziel): sinkt nur schrittweise, nie sprunghaft unter 0,6
await reset({ res: 'auto', gfx: 'auto' });
const cTr = await phase(60, 22); const minC = Math.min(...cTr.map(x => x[1]));
ok('B2 knapp zu langsam (22 ms): Maßstab fällt schrittweise, nie unter 0,6', minC >= .6 && minC < 1, 'Minimum ' + minC);
ok('B3 im Bereich 1,08–1,25 × Ziel (18–20 ms) bleibt alles stehen', await (async () => { await reset({ res: 'auto', gfx: 'auto' }); const t = await phase(40, 19); return changes(t) === 0; })());

// C: feste Optionen werden respektiert
console.log('C: feste Optionen');
await reset({ res: 'auto', gfx: 'mid' }); const cc = await phase(80, 40);
ok('C1 gfx fest „mid“: Stufe bleibt, Auflösung regelt', cc.every(x => x[0] === 'mid') && cc[cc.length - 1][1] <= .62, 'Ende ' + JSON.stringify(cc[cc.length - 1]));
await reset({ res: 'native', gfx: 'auto' }); const cn = await phase(100, 40);
ok('C2 res fest „native“: Maßstab bleibt 1, Stufe regelt', cn.every(x => x[1] === 1) && cn[cn.length - 1][0] !== 'high', 'Ende ' + JSON.stringify(cn[cn.length - 1]));
await reset({ res: '1080', gfx: 'high' }); const cf = await phase(60, 40);
ok('C3 alles fest: keine Änderung', changes(cf) === 0, 'Wechsel ' + changes(cf));

// D: schwache GPU startet auf low / Maßstab 0,8 (perfStart)
const w = await page.evaluate(() => { const w0 = PERF.weak; PERF.weak = true; SET.gfx = 'auto'; perfStart(); const r = { tier: PERF.tier, scale: PERF.scale }; PERF.weak = w0; return r; });
ok('D1 schwache GPU: Start low, Maßstab 0,8', w.tier === 'low' && w.scale === .8, JSON.stringify(w));
const t = await page.evaluate(() => { const w0 = PERF.weak, t0 = PERF.touch; PERF.weak = false; PERF.touch = true; SET.gfx = 'auto'; perfStart(); const r = PERF.tier; PERF.weak = w0; PERF.touch = t0; return r; });
ok('D2 Touch-Gerät: Start mid', t === 'mid', t);
await page.evaluate(() => { window.requestAnimationFrame = window.__raf; });
ok('E1 keine Seitenfehler', B.errs.length === 0, B.errs.slice(0, 3).join(' | '));
writeFileSync(new URL('./qa_look_auto.json', import.meta.url), JSON.stringify(out, null, 1));
const bad = out.checks.filter(c => !c.ok); console.log(bad.length ? 'FEHLER: ' + bad.length : 'Alle ' + out.checks.length + ' Prüfungen grün.');
await B.close();
