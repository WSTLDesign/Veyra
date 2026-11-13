// QA Hybrid (Sonnet hoch) – Prüfpunkt 3: Kampf vor dem Regions-Panorama, 8 Regionen × 3 Zeiten (860×484, Stufe high).
// Aufruf: node build.mjs && node test/qa_hybrid_kampf.mjs [regionen,komma] [zeiten,komma] → test/qa_hybrid_kampf_<region>_<zeit>.png, Ergebnis-JSON nach $QA_OUT.
// Je Kombination: (a) Horizont: synthetische Bildtextur mit roter Linie bei horizonY, alle anderen Objekte aus → Zeile der Linie auf dem Bildschirm gegen den projizierten Szenen-Horizont (Kamera-Punkt 1e5 voraus)
//  in 4 Kamerafahrten (intro/both/me/foe); (b) Boden-Übergang: größter Zeilen-zu-Zeilen-Sprung an Spalten außerhalb der Kreaturen, mit/ohne 3D; (c) Schatten ⟂ Sonne (Versatz der Schattenellipse gegen Licht-Horizontalrichtung)
//  und Sonne im Bild ↔ Licht: Bildschirm-x des projizierten Lichts gegen Bild-Sonne über die Abbildung; (d) Kontrast der Kampf-UI aus dem Bildschirmfoto; (e) Draw-Calls, Konsolenfehler.
import { boot, scene } from './look_lib.mjs';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
const OUT = process.env.QA_OUT || (tmpdir() + '/qa_hybrid_kampf.json');
const REG = ['lichtlande', 'smaragdwald', 'flutkueste', 'glutlande', 'kristallgebirge', 'frosttundra', 'himmelsweiten', 'schattenmoor'];
const regs = (process.argv[2] || '').split(',').filter(Boolean), tms = (process.argv[3] || '').split(',').filter(Boolean);
const TIMES = { tag: 720, abend: 1125, nacht: 1380 };
const png = n => new URL(`./qa_hybrid_${n}.png`, import.meta.url).pathname;
const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } });
const { page } = B; const R = [];
await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; window.VEYRA_DEMO = 0; });
// Bildschirmfoto → Pixel-Auswertung im Browser (Spaltenprofil, Rotlinie, Kontrast)
const analyse = async (b64, cfg) => page.evaluate(async ([b64, cfg]) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const W = img.width, H = img.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const D = cx.getImageData(0, 0, W, H).data, px = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; }, L = (x, y) => { const p = px(x, y); return .2126 * p[0] + .7152 * p[1] + .0722 * p[2]; };
  const out = { W, H };
  if (cfg.line) { // Rotlinie: je Spalte Zeile mit größtem (R − (G+B)/2)
    const res = []; for (const fx of [.03, .08, .5, .92, .97]) { const x = Math.round(fx * (W - 1)); let best = -1, by = -1; for (let y = 0; y < H; y++) { const p = px(x, y), s = p[0] - (p[1] + p[2]) / 2; if (s > best) { best = s; by = y; } } res.push({ fx, y: by, s: Math.round(best) }); } out.line = res; }
  if (cfg.cols) { // größter Helligkeitssprung zwischen benachbarten Zeilen (Spalten außerhalb der Kreaturen), nur im Bereich um/unter dem Horizont
    const y0 = Math.round(cfg.hy * H) - 6; const r = []; for (const fx of cfg.cols) { const x = Math.round(fx * (W - 1)); let mx = 0, my = 0, sum = 0, n = 0; for (let y = Math.max(1, y0); y < H - 1; y++) { const d = Math.abs(L(x, y + 1) - L(x, y)); sum += d; n++; if (d > mx) { mx = d; my = y; } } r.push({ fx, max: +mx.toFixed(1), at: +(my / H).toFixed(3), mean: +(sum / n).toFixed(2) }); } out.cols = r; }
  return out; }, [b64, cfg]);
// UI-Kontrast: Texte in #battle gegen Median/10-%-Quantil der Pixel im Textrechteck (aus Bildschirmfoto)
const uiContrast = async b64 => page.evaluate(async b64 => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const dpr = img.width / innerWidth, cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); }, cr = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  const root = document.getElementById('battle'); if (!root || root.hidden) return { n: 0, fail: [], min: null };
  const els = [...root.querySelectorAll('*')].filter(e => { if (!['SCRIPT', 'STYLE', 'CANVAS', 'SVG', 'PATH'].includes(e.tagName.toUpperCase()) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0)) { const r = e.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return false; let n = e; while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .05) return false; n = n.parentElement; } return true; } return false; });
  const res = { n: 0, fail: [], min: 99, minP10: 99, items: [] };
  for (const e of els) { const cs = getComputedStyle(e), fs = parseFloat(cs.fontSize); if (fs < 8) continue; const r = e.getBoundingClientRect(); if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) continue;
    const m = cs.color.match(/[\d.]+/g).map(Number); let op = 1, n = e; while (n && n !== document.body) { op *= +getComputedStyle(n).opacity; n = n.parentElement; }
    const x = Math.max(0, Math.round(r.left * dpr)), y = Math.max(0, Math.round(r.top * dpr)), w = Math.min(cv.width - x, Math.round(r.width * dpr)), h = Math.min(cv.height - y, Math.round(r.height * dpr)); if (w < 3 || h < 3) continue;
    const d = cx.getImageData(x, y, w, h).data, ls = [], pxs = []; const st = Math.max(1, Math.floor(d.length / 4 / 800)); for (let i = 0; i < d.length; i += 4 * st) { pxs.push([d[i], d[i + 1], d[i + 2]]); ls.push(lum(d[i], d[i + 1], d[i + 2])); }
    const a = (m[3] == null ? 1 : m[3]) * op, order = ls.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]), bgOf = f => pxs[order[Math.min(order.length - 1, Math.floor(order.length * f))][1]];
    const med = bgOf(.5), fgOf = bg => [0, 1, 2].map(i => m[i] * a + bg[i] * (1 - a)), cMed = cr(lum(...fgOf(med)), lum(...med));
    // ungünstigste 10 % Hintergrund (nächst der Vordergrund-Helligkeit): Kontrast gegen Hintergrund-Quantile 10/90 % → kleinerer Wert
    const c10 = Math.min(...[.1, .9].map(f => { const b = bgOf(f); return cr(lum(...fgOf(b)), lum(...b)); }));
    const large = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700), lim = large ? 3 : 4.5; res.n++; res.min = Math.min(res.min, cMed); res.minP10 = Math.min(res.minP10, c10);
    const nm = (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
    res.items.push({ n: nm, c: +cMed.toFixed(2), c10: +c10.toFixed(2), fs: Math.round(fs), txt: (e.textContent || '').trim().slice(0, 16) }); if (cMed < lim) res.fail.push({ n: nm, c: +cMed.toFixed(2), fs: Math.round(fs), txt: (e.textContent || '').trim().slice(0, 20) }); }
  res.min = +res.min.toFixed(2); res.minP10 = +res.minP10.toFixed(2); return res; }, b64);

const hideUI = on => page.evaluate(on => { let st = document.getElementById('qaHide'); if (on && !st) { st = document.createElement('style'); st.id = 'qaHide'; st.textContent = '#battle .ibox,#battle #bDock,#battle #bCard,#battle #lockOn,#battle #wxChip,#hud,.hud{visibility:hidden !important}'; document.head.appendChild(st); } if (!on && st) st.remove(); }, on);
const waitMenu = () => page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 });
const bt0 = () => page.evaluate(() => ({ on: HYB.on, key: HYB.key, ready: HYB.ready, cur: HYB.cur ? [HYB.cur.reg, HYB.cur.time, HYB.cur.src] : null, calls: BT.r.info.render.calls, tri: BT.r.info.render.triangles, tex: BT.r.info.memory.textures, geo: BT.r.info.memory.geometries, cv: [BT.r.domElement.width, BT.r.domElement.height], domeVis: BT.dome.visible, dbg: HYB.dbg }));
// Pose festhalten (camWant überschreiben) und warten bis die Kamera konvergiert ist
const pose = async (name) => { await page.evaluate(n => { if (!window.__camWant0) window.__camWant0 = camWant; camWant = n ? () => CAMPOSE[n] : window.__camWant0; if (n) { CAMB.until = 0; } }, name); await page.waitForTimeout(3200); };
// Horizont-Messung: synthetische Textur mit Linie bei horizonY, alles andere aus
const horizon = async (poseName) => {
  await pose(poseName);
  const info = await page.evaluate(() => {
    const bt = BT, U = HYB.U; if (!window.__hyOrig) window.__hyOrig = { tex: HYB.cur.tex, vis: bt.s.children.map(c => c.visible) };
    const cv = document.createElement('canvas'); cv.width = 1280; cv.height = 720; const x = cv.getContext('2d'); x.fillStyle = '#202020'; x.fillRect(0, 0, 1280, 720); const hy = HYB.cur.info.horizonY * 720; x.fillStyle = '#ff0000'; x.fillRect(0, Math.round(hy) - 1, 1280, 3);
    const t = new THREE.CanvasTexture(cv); t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; HYB.cur.tex = t; window.__hyT = t;
    bt.s.children.forEach(c => { if (c !== HYB.mesh) c.visible = false; }); window.__hyHide = 1;
    return { horizonY: HYB.cur.info.horizonY };
  });
  await page.waitForTimeout(1500);
  const proj = await page.evaluate(() => { const cam = BT.cam, e = cam.matrixWorld.elements; let fx = -e[8], fz = -e[10]; const l = Math.hypot(fx, fz); fx /= l; fz /= l; const v = new THREE.Vector3(cam.position.x + fx * 1e5, cam.position.y, cam.position.z + fz * 1e5).project(cam); const H = BT.r.domElement.clientHeight; return { ndcY: v.y, rowTop: (1 - v.y) / 2, pitchDeg: +(Math.asin(-e[9]) * 180 / Math.PI).toFixed(2), fov: cam.fov, s: HYB.dbg && HYB.dbg.s, camY: cam.position.y }; });
  await hideUI(true); const b64 = (await page.screenshot({ timeout: 180000 })).toString('base64'); const a = await analyse(b64, { line: 1 }); await hideUI(false);
  await page.evaluate(() => { HYB.cur.tex = window.__hyOrig.tex; BT.s.children.forEach((c, i) => { c.visible = window.__hyOrig.vis[i]; }); window.__hyOrig = null; if (window.__hyT) window.__hyT.dispose(); });
  const strong = a.line.filter(l => l.s > 100), rows = a.line.map(l => l.y / a.H), dev = strong.map(l => l.y / a.H - proj.rowTop);
  return { pose: poseName, projRow: +proj.rowTop.toFixed(4), screenRows: rows.map(r => +r.toFixed(4)), devPx: dev.map(d => +(d * a.H).toFixed(1)), maxDevPx: dev.length ? +Math.max(...dev.map(d => Math.abs(d * a.H))).toFixed(1) : null, nStrong: strong.length, pitch: proj.pitchDeg, fov: proj.fov, s: proj.s, redStrength: a.line.map(l => l.s) };
};
const runCombo = async (reg, tz, map, mx, my) => {
  const e0 = B.errs.length, row = { reg, tz, map };
  await page.evaluate(([r, m]) => { window.HY_REGION = null; if (r) getMap(m).region = r; }, [map === 'route1' ? reg : null, map]);
  await scene(page, map, mx, my, TIMES[tz]); await page.evaluate(() => { window.VEYRA_DEMO = 0; mode = 'wait'; }); await page.waitForTimeout(700);
  await page.evaluate(() => { SET.skipBattleIntro = 1; SET.btl = 'runde'; mode = 'world'; startBattle({ wild: mk(25, 12) }); });
  await waitMenu(); await page.waitForFunction(() => HYB.ready || HYB.off || HYB.decided, null, { timeout: 30000 }).catch(() => { });
  await pose(null); await page.waitForTimeout(600);
  row.info = await bt0(); row.t0 = Date.now();
  // Screenshot im Normalzustand + Kontrast
  const f = png(`kampf_${reg}_${tz}`); const buf = await page.screenshot({ path: f, timeout: 180000 }); const b64 = buf.toString('base64');
  row.contrast = await uiContrast(b64);
  // Boden-Übergang: Spalten außerhalb der Kreaturen (links/rechts außen)
  const hy = row.info.dbg ? row.info.dbg.hyTop : .589; await hideUI(true); { const b3 = (await page.screenshot({ path: png(`kampf_${reg}_${tz}_ohneui`), timeout: 180000 })).toString('base64'); row.cols3d = (await analyse(b3, { cols: [.03, .06, .94, .97], hy: .589 })).cols; } await hideUI(false);
  // Schatten / Sonne
  row.light = await page.evaluate(() => {
    const bt = BT, cam = bt.cam; if (!HYB.cur) return null; const I = HYB.cur.info, E = I.env, sp = bt.sun.position, tg = bt.sun.target.position, lx = sp.x - tg.x, lz = sp.z - tg.z, ll = Math.hypot(lx, lz) || 1, ly = sp.y - tg.y;
    const out = { lightDirH: [+(lx / ll).toFixed(3), +(lz / ll).toFixed(3)], elevDeg: +(Math.atan2(ly, ll) * 180 / Math.PI).toFixed(1), sunI: +bt.sun.intensity.toFixed(2), hemiI: +bt.hemi.intensity.toFixed(2), night: E.night };
    out.shadows = [[bt.foe, bt.cs[0]], [bt.me, bt.cs[1]]].map(([o, c]) => { const dx = c.position.x - o.position.x, dz = c.position.z - o.position.z, dot = (dx * lx + dz * lz) / ll, ax = Math.cos(c.rotation.z), az = -Math.sin(c.rotation.z), axDot = Math.abs(ax * lx + az * lz) / ll; return { offs: [+dx.toFixed(3), +dz.toFixed(3)], dotSun: +dot.toFixed(3), axisAlongSun: +axDot.toFixed(2), vis: c.visible, op: +c.material.opacity.toFixed(2) }; });
    // Sonne im Bild ↔ Licht: Bildschirm-Position des Lichts (Richtung 1e4 weit) und der Bild-Sonne (über Abbildung hyA/hyB)
    const A = HYB.U.hyA.value, Bv = HYB.U.hyB.value, ss = I.sunScreen, q = [ss[0] * 2 - 1, 1 - 2 * ss[1]], n = [A.z + (q[0] - Bv.x) * Bv.z / A.x, A.w + (q[1] - Bv.y) * Bv.z / A.y];
    const c0 = cam.position, lv = new THREE.Vector3(c0.x + lx / ll * 1e4 * Math.cos(Math.atan2(ly, ll)), c0.y + 1e4 * Math.sin(Math.atan2(ly, ll)), c0.z + lz / ll * 1e4 * Math.cos(Math.atan2(ly, ll))).project(cam);
    out.sunImg = { ss, ndc: n.map(v => +v.toFixed(3)) }; out.sunLight = { ndc: [+lv.x.toFixed(3), +lv.y.toFixed(3)], behind: lv.z > 1 }; out.dxNdc = +(lv.x - n[0]).toFixed(3); out.dxPx = +((lv.x - n[0]) * BT.r.domElement.clientWidth / 2).toFixed(0);
    return out; });
  // Horizont in 4 Kamerafahrten; danach zurück
  row.horizon = []; for (const p of ['intro', 'both', 'me', 'foe']) row.horizon.push(await horizon(p));
  await pose(null);
  // Boden-Übergang ohne 3D-Objekte (nur Bild) zum Vergleich
  await page.evaluate(() => { window.__vis = BT.s.children.map(c => c.visible); BT.s.children.forEach(c => { if (c !== HYB.mesh) c.visible = false; }); }); await page.waitForTimeout(1500);
  await hideUI(true); { const bb = (await page.screenshot({ path: png(`kampf_${reg}_${tz}_nurbild`), timeout: 180000 })).toString('base64'); row.cols2d = (await analyse(bb, { cols: [.03, .06, .94, .97], hy: .589 })).cols; } await hideUI(false);
  await page.evaluate(() => { BT.s.children.forEach((c, i) => { c.visible = window.__vis[i]; }); });
  row.errs = B.errs.slice(e0); row.ms = Date.now() - row.t0; R.push(row);
  const hz = row.horizon.map(h => h.pose + ':' + h.maxDevPx + 'px').join(' ');
  console.log(reg, tz, 'on', row.info.on, 'key', row.info.key, 'calls', row.info.calls, 'tri', row.info.tri, 'kontrast min', row.contrast.min, 'p10', row.contrast.minP10, 'fail', row.contrast.fail.length, '| Horizont', hz, '| Schatten dot', row.light && row.light.shadows.map(s => s.dotSun + '/' + s.axisAlongSun).join(','), 'dxPx', row.light && row.light.dxPx, 'Fehler', row.errs.length);
  await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); await page.waitForTimeout(500);
};
for (const reg of REG) { if (regs.length && !regs.includes(reg)) continue; for (const tz of Object.keys(TIMES)) { if (tms.length && !tms.includes(tz)) continue; try { await runCombo(reg, tz, 'route1', 9, 12); } catch (e) { console.log('FEHLER', reg, tz, e.message.slice(0, 200)); R.push({ reg, tz, error: e.message.slice(0, 200) }); try { await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); } catch (e2) { } } } }
writeFileSync(OUT, JSON.stringify(R, null, 1)); console.log('Konsolenfehler gesamt:', B.errs.length, B.errs.slice(0, 5)); await B.close();
