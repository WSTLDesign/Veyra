// Nachbesserung 1 (QA Loop C) – W-1 (Ankunft/HUD-Überdeckung) und W-2 (Wahrzeichen im Startbild): echte Kartenwechsel im 3D-Pfad (tryMove am Rand → transit).
//   node test/nb1_welt.mjs            Bilder: test/nb1_welt_<karte>.png, test/nb1_route1_ankunft.png, test/nb1_glutschlucht_start.png, test/nb1_brisenhafen_start.png
//   NB1_ONLY=route1,glutschlucht      nur diese Zielkarten
// Messung HUD-Überdeckung: Szene nur mit Welt-Requisiten (Stadt-/Leucht-Mesh, Bäume, Felsen, Torpfosten – alles mit Nahbereich-Material bzw. TOWN/GLOW)
// in ein Render-Target mit der Spielkamera (nur Vordergrund: Bildtiefe < 0,85 × Kameraabstand, also klar vor der Figur), Anteil der Pixel innerhalb der HUD-Knöpfe (#stick, #runBtn, #btnB, #btnA, .in-throw, #rideBtn).
import { start, page, newGame, goMap, reporter, here } from './qa_lc_lib.mjs';
const R = reporter('nb1_welt.log', 'Nachbesserung 1 – Ankunft, HUD-Zone, Wahrzeichen');
const ONLY = (process.env.NB1_ONLY || '').split(',').filter(Boolean);
const env = await start(); const p = await page(env); await newGame(p, { view: 'third' });
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1', 'starter', 'firstcatch', 'champion', 'badge_boe', 'badge_glut', 'badge_fels', 'badge_lumen']) G.flags[f] = 1; });
// Messfunktion im Browser: Spielerposition, Kamera, HUD-Überdeckung, Wahrzeichen im Bild
await ev(() => {
  const RAD = { kristallturm: 4, windmuehle: 2.6, vulkan: 9, leuchtturm2: 3.4, leuchtturm: 2.2, segelschiff: 3.3, baumhaus: 3.4, weltenbaum: 3.8, obsidianfeste: 4, grottenkristall: 1.2, turm: 1.3, kran: 3 };
  const H = { kristallturm: 16.5, windmuehle: 6.2, vulkan: 14, leuchtturm2: 8.5, leuchtturm: 6.3, segelschiff: 5.5, baumhaus: 9.5, weltenbaum: 12, obsidianfeste: 10, grottenkristall: 2.4, turm: 7.7, kran: 5 };
  window.NB1 = {
    lms() { const W = typeof WELT1 !== 'undefined' && WELT1[cur.id], L = []; for (const q of (W && W.lm) || []) if (H[q.type]) L.push({ type: q.type, x: q.x, z: q.y, s: q.s || 1 });
      for (const q of (MAPS[cur.id] && MAPS[cur.id].landmarks) || LM_DEF[cur.id] || []) { const t = LM_ALIAS[q.type] || q.type; if (H[t]) L.push({ type: t, x: q.x + .5, z: q.y + .5, s: 1 }); } return L; },
    see() { const cam = R3.activeCam || R3.cam; cam.updateMatrixWorld(true); const out = []; const v = new THREE.Vector3(), far = R3.scene.fog ? R3.scene.fog.far : 60;
      const U = R3.scene.userData, occ = []; R3.scene.traverse(o => { if (o.isMesh && !o.userData.outline && (o === U.town || (o.isInstancedMesh && o.material && o.material.userData && o.material.userData.nf))) occ.push(o); }); const rc = new THREE.Raycaster(), w = new THREE.Vector3(), dir = new THREE.Vector3();
      for (const q of NB1.lms()) { const y0 = (q.x >= 0 && q.z >= 0 && q.x < cur.w && q.z < cur.h) ? terrainY(q.x, q.z) : 0, h = H[q.type] * q.s; let n = 0, ymin = 9, ymax = -9;
        for (let i = 0; i <= 10; i++) { w.set(q.x, y0 + h * (.05 + .9 * i / 10), q.z); v.copy(w).project(cam); if (!(v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1)) continue; dir.copy(w).sub(cam.position); const L = dir.length(); dir.normalize(); rc.set(cam.position, dir); rc.far = Math.max(.1, L - (RAD[q.type] || 2) * q.s);
          if (rc.intersectObjects(occ, false).length) continue; n++; ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y); }
        const dist = Math.hypot(q.x - cam.position.x, q.z - cam.position.z); out.push({ type: q.type, n, frac: n ? +((ymax - ymin) / 2).toFixed(2) : 0, dist: +dist.toFixed(1), fogFar: +far.toFixed(1), vis: n >= 3 && (ymax - ymin) / 2 >= .06 }); }
      return out; },
    hud(all) { const r = R3.r, S = R3.scene, U = S.userData, cv = r.domElement, W = cv.width, Hh = cv.height, rect = cv.getBoundingClientRect(), sx = W / rect.width, sy = Hh / rect.height;
      const els = ['.in-stick', '.in-base', '.in-a', '.in-menu', '.in-run', '.in-ride', '.in-throw', '#stick', '#runBtn', '#btnB', '#btnA', '#rideBtn'].map(s => document.querySelector(s)).filter(e => { if (!e || e.hidden || !e.getClientRects().length) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .05; });
      const boxes = els.map(e => { const b = e.getBoundingClientRect(); return [Math.max(0, (b.left - rect.left) * sx) | 0, Math.max(0, (b.top - rect.top) * sy) | 0, Math.min(W, (b.right - rect.left) * sx) | 0, Math.min(Hh, (b.bottom - rect.top) * sy) | 0, e.id || e.className.split(' ').slice(-2).join('.')]; }).filter(b => b[2] > b[0] && b[3] > b[1]);
      const prop = o => o === U.prop || (U.prop ? all && o === U.town : o === U.town) || o === U.glow || (o.material && o.material.userData && o.material.userData.nf) || (o.userData.outline && o.parent && (o.parent === U.prop || (all || !U.prop) && o.parent === U.town || (o.parent.material && o.parent.material.userData && o.parent.material.userData.nf)));
      const old = []; S.traverse(o => { if (o.isMesh || o.isPoints || o.isSprite || o.isLine) { old.push([o, o.visible]); if (!prop(o) && !(o.isInstancedMesh && o.material && o.material.isMeshToonMaterial && o.material.vertexColors && !o.userData.veg && o.geometry && o.geometry.attributes.color && /tree|trunk|can|rock/.test(Object.keys(W3GEO).find(k => W3GEO[k].attributes && W3GEO[k].attributes.position === o.geometry.attributes.position) || ''))) o.visible = false; } });
      const bg = S.background, fog = S.fog; S.background = null; const rt = new THREE.WebGLRenderTarget(W, Hh); const cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha(); r.setClearColor(0x000000, 0); const cam = R3.activeCam || R3.cam, f0 = cam.far; cam.far = Math.max(.5, R3.cd * .85); cam.updateProjectionMatrix(); r.setRenderTarget(rt); r.clear(); r.render(S, cam); r.setRenderTarget(null); cam.far = f0; cam.updateProjectionMatrix(); r.setClearColor(cc, ca);
      S.background = bg; S.fog = fog; for (const [o, v] of old) o.visible = v; let tot = 0, hit = 0; const per = {};
      for (const [x0, y0, x1, y1, id] of boxes) { const w = x1 - x0, h = y1 - y0, buf = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, x0, Hh - y1, w, h, buf); let c = 0; for (let i = 3; i < buf.length; i += 4) if (buf[i] > 8) c++; per[id] = +(100 * c / (w * h)).toFixed(1); tot += w * h; hit += c; }
      rt.dispose(); return { pct: tot ? +(100 * hit / tot).toFixed(1) : 0, per }; },
    state() { const c = (R3.activeCam || R3.cam).position; return { map: cur.id, pos: [P.x, P.y], dir: P.dir, cd: +R3.cd.toFixed(2), cam: [c.x, c.y, c.z].map(v => +v.toFixed(2)), shiftN: typeof W1EDGE !== 'undefined' ? W1EDGE.n : null, cm: typeof camMode === 'function' ? camMode() : null, nf: W3U.uNF && W3U.uNF.value ? W3U.uNF.value.w : null }; }
  };
});
const edgeStart = (from, to) => ev(([f, t]) => { const S = MAPS[f]; const key = ['n', 's', 'e', 'w'].find(k => S[k] === t); if (!key) return null; const m = getMap(f), dir = { n: 'up', s: 'down', e: 'right', w: 'left' }[key]; let best = null;
  const mid = key === 'n' || key === 's' ? m.w / 2 : m.h / 2; for (let i = 0; i < (key === 'n' || key === 's' ? m.w : m.h); i++) { const x = key === 'e' ? m.w - 1 : key === 'w' ? 0 : i, y = key === 'n' ? 0 : key === 's' ? m.h - 1 : i; const c = tileAt(m, x, y); if (c && !SOLID.has(c) && c !== '~') { if (!best || Math.abs(i - mid) < Math.abs(best.i - mid)) best = { x, y, i }; } }
  return best && { key, dir, x: best.x, y: best.y }; }, [from, to]);
async function arrive(from, to) { const st = await edgeStart(from, to); if (!st) return null; await goMap(p, from, st.x, st.y, st.dir); await p.waitForTimeout(1500);
  await ev(([d]) => { tryMove(d); }, [st.dir]); await p.waitForFunction(([t]) => G.map === t && mode === 'world', [to], { timeout: 14000, polling: 100 }).catch(() => { });
  await ev(() => { VILL.list = []; ROAM.list = []; ROAM.want = 0; }); await p.waitForTimeout(2600); return st; }
// Ankünfte: primär = erste Ankunft in Story-Richtung (Startbild der Karte); sekundär = Rückweg
const PRIM = [['morgenau', 'route1'], ['route1', 'kupferhain'], ['kupferhain', 'route2'], ['route2', 'brisenhafen'], ['brisenhafen', 'windkueste'], ['windkueste', 'moewenbucht'], ['brisenhafen', 'route3'], ['route3', 'glutschlucht'], ['schattmoor', 'fluestertal'], ['schattmoor', 'siegesstrasse']];
const SEC = [['kupferhain', 'route1'], ['route1', 'morgenau'], ['glutschlucht', 'route3'], ['route3', 'brisenhafen'], ['route2', 'kupferhain'], ['moewenbucht', 'windkueste']];
const res = [];
const measure = async (label, prim, shotName) => { const s = await ev(() => NB1.state()), h = await ev(() => NB1.hud()), h2 = await ev(() => NB1.hud(true)), see = await ev(() => NB1.see()); const vis = see.filter(q => q.vis);
  const o = { label, prim, ...s, hud: h.pct, hudPer: h.per, hudAll: h2.pct, lm: vis.map(q => `${q.type}(${q.frac},${q.dist})`), lmAll: see }; res.push(o); R.note(JSON.stringify(o).slice(0, 700));
  if (shotName) await p.screenshot({ path: here(shotName) }); return o; };
// Morgenau-Spielstart: aus dem Elternhaus (echter Pfad transit(warpBack))
if (!ONLY.length || ONLY.includes('morgenau')) { await ev(async () => { G.ret = { map: 'morgenau', x: 4, y: 5 }; loadMap('haus_spieler'); mode = 'world'; await new Promise(r => setTimeout(r, 600)); P.ang = Math.PI; P.dir = 'down'; transit(warpBack, 'morgenau'); });
  await p.waitForFunction(() => G.map === 'morgenau' && mode === 'world', null, { timeout: 14000, polling: 100 }).catch(() => { }); await ev(() => { VILL.list = []; ROAM.list = []; }); await p.waitForTimeout(2800);
  await measure('morgenau ← Elternhaus (Spielstart)', true, 'nb1_welt_morgenau.png'); }
for (const [f, t] of PRIM) { if (ONLY.length && !ONLY.includes(t)) continue; const st = await arrive(f, t); if (!st) { R.t(`${f} → ${t}: Ausgang vorhanden`, false); continue; }
  await measure(`${t} ← ${f}`, true, t === 'route1' ? 'nb1_route1_ankunft.png' : t === 'glutschlucht' ? 'nb1_glutschlucht_start.png' : t === 'brisenhafen' ? 'nb1_brisenhafen_start.png' : `nb1_welt_${t}.png`); }
if (!ONLY.length || ONLY.includes('nebelgrotte')) { await ev(async () => { G.ret = { map: 'route2', x: 10, y: 3 }; loadMap('nebelgrotte'); P.dir = 'up'; P.ang = 0; mode = 'world'; VILL.list = []; ROAM.list = []; }); await p.waitForTimeout(400); await ev(() => { R3.snap = 1; }); await p.waitForTimeout(2800); await measure('nebelgrotte ← Eingang', true, 'nb1_welt_nebelgrotte.png'); }
for (const [f, t] of SEC) { if (ONLY.length && !ONLY.includes(t)) continue; const st = await arrive(f, t); if (!st) continue; await measure(`${t} ← ${f} (Rückweg)`, false, `nb1_welt_${t}_von_${f}.png`); }
// Repro aus der QA: loadMap('route1',10,11) Blick nach Norden
if (!ONLY.length || ONLY.includes('route1')) { await goMap(p, 'route1', 10, 11, 'up'); await ev(() => { R3.snap = 1; }); await p.waitForTimeout(2600); await measure('route1 (10,11) Repro QA', false, 'nb1_welt_route1_repro.png'); }
// Auswertung
for (const o of res) {
  if (o.label.includes('←') && !o.label.includes('Elternhaus') && !o.label.includes('Eingang')) { const m = await ev(([id]) => { const m = getMap(id); return { w: m.w, h: m.h }; }, [o.map]); const dEdge = Math.min(o.pos[0], o.pos[1], m.w - 1 - o.pos[0], m.h - 1 - o.pos[1]);
    R.t(`${o.label}: Ankunft nicht zwischen den Torpfosten (≥ 2 Felder vom Rand, sofern frei)`, dEdge >= 2, { pos: o.pos, dEdge }); }
  R.t(`${o.label}: HUD-Knöpfe höchstens 3 % von Vordergrund-Requisiten/Pfosten/Laub/Felsen überdeckt (Gebäude zählen nicht)`, o.hud <= 3, { hud: o.hud, per: o.hudPer, mitGebaeuden: o.hudAll });
  if (o.prim) R.t(`${o.label}: mindestens ein Wahrzeichen im Startbild`, o.lm.length > 0, { lm: o.lm, alle: o.lmAll.map(q => `${q.type}:${q.n}/${q.frac}/${q.dist}`) }); }
R.t('keine Seitenfehler', p.errs.length === 0, p.errs);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
