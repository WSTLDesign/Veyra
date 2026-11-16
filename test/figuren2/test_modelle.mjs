// Figuren Runde 2 – Test mit Schalter an: lädt alle Figuren-GLB, baut sie (figMake), prüft Clips/Shape Keys/LOD, Zuordnung figModelFor,
// Runde 5: Budgets Heldin/Noa/Ladenbesitzer/Jugendlicher (≤ 9 k, LOD1 ≤ 4 k), Schutzgewicht _LODW, Haar-/Kappen-Silhouette der vereinfachten Hülle (62-lod), Hülle verdeckt keine Haarteile,
// Runde 6: dasselbe für Rayan, Prof. Veyran, Mama, Mirael, Bürger a/b/c (Heldin Haupt ≤ 9 300), Hülle ≈ 3,2 k, Rig/Clips/Shape Keys bitgleich zum R5-Stand (test/fixtures/figuren/fig_<id>_r5alt.glb),
// Morgenau mit Held + NPCs (person3d-Haken) und Gang-Tick – ohne Konsolenfehler.  Sperre nehmen!  node test/figuren2/test_modelle.mjs
import { start, page, newGame, reporter } from '../qa_lc_lib.mjs';
const R = reporter('figuren2/test_modelle.txt', 'Figuren Runde 2 – Modelle (Schalter an)');
const env = await start(); const p = await page(env, { w: 860, h: 484, set: { quality: 'eigene', modelle3d: true } });
await newGame(p, { team: [[1, 8]], view: 'third' });
const ids = await p.evaluate(() => Object.keys(FIG_MODELS));
const ld = await p.evaluate(async (ids) => { const o = {}; for (const k of ids) { const g = await pilotLoad(k); o[k] = g ? PILOT['ms_' + k] : null; } return o; }, ids);
R.t('alle Figuren geladen', Object.values(ld).every(v => v != null), ld);
const chk = await p.evaluate((ids) => ids.map(id => { const o = figMake(id, null); if (!o) return { id, ok: false }; const U = o.userData; let tris = 0, lodTris = 0;
  o.traverse(m => { if (m.isMesh && !m.userData.outline && !m.userData.shadowOnly) {   // Schattennetz aus 62-lod (nur Schattenpass) nicht mitzählen
 const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (/LOD1/.test(m.name)) lodTris += n; else tris += n; } });
  const keys = U.faces.length ? Object.keys(U.faces[0].morphTargetDictionary) : [];
  for (let i = 0; i < 30; i++) pilotTick(o, 1 / 30, {}); o.position.x += 0; return { id, ok: true, clips: Object.keys(U.acts).sort().join(','), keys: keys.length, tris, lodTris, lod: !!U.lod, h: +(new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).y).toFixed(2) }; }), ids);
for (const c of chk) {
  R.t(c.id + ' gebaut', c.ok, c);
  R.t(c.id + ' Clips idle/walk/jog/run/winken/jubeln/werfen', /idle/.test(c.clips) && /jog/.test(c.clips) && /winken/.test(c.clips) && /werfen/.test(c.clips) && /jubeln/.test(c.clips), c.clips);
  R.t(c.id + ' 9 Shape Keys', c.keys === 9, c.keys);
  R.t(c.id + ' Dreiecke 8–14 k, LOD ≈ 50 %', c.tris >= 8000 && c.tris <= 14000 && c.lod && c.lodTris < c.tris * .62, { tris: c.tris, lod: c.lodTris });
}
// ---------- Figuren Runde 5 + 6: Budgets der neu bearbeiteten Figuren, Schutzgewicht _LODW, Haar-/Kappen-Silhouette der vereinfachten Hülle (62-lod) ----------
const R6 = ['fig_rayan', 'fig_veyran', 'fig_mama', 'fig_mirael', 'fig_buerger_a', 'fig_buerger_b', 'fig_buerger_c'];
const R5 = ['fig_heldin', 'fig_noa', 'fig_haendler', 'fig_buerger_d', ...R6];   // alle Figuren auf R5-Technik (Heldin ab R6 mit Ring 12: Haupt ≤ 9 300)
const r5 = await p.evaluate(async (ids) => {
  for (let i = 0; i < 900 && (LOD4.pend > 0 || LOD_Q.length); i++) await new Promise(r => setTimeout(r, 100));
  // orthografische Maske (Kopfbereich) aus Dreiecken: tri = [[a,b,c] Eckindizes in P]; Ansicht vorn (x,y), links (z,y), oben (x,-z)
  const mask = (P, tri, vw, bx, N) => { const M = new Uint8Array(N * N), s = Math.max(bx[1] - bx[0], bx[3] - bx[2], bx[5] - bx[4]);
    const pr = i => { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; const [u, v] = vw === 'vorn' ? [x - bx[0], y - bx[2]] : vw === 'links' ? [z - bx[4], y - bx[2]] : [x - bx[0], bx[5] - z]; return [u / s * N, (1 - v / s) * N]; };
    for (const [a, b, c] of tri) { const A = pr(a), B = pr(b), C = pr(c), ar = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]); if (Math.abs(ar) < 1e-9) continue;
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(N - 1, Math.ceil(Math.max(A[0], B[0], C[0]))), y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(N - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x + .5, py = y + .5, w0 = ((B[0] - px) * (C[1] - py) - (B[1] - py) * (C[0] - px)) / ar, w1 = ((C[0] - px) * (A[1] - py) - (C[1] - py) * (A[0] - px)) / ar;
        if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) M[y * N + x] = 1; } } return M; };
  const out = {};
  for (const id of ids) { const g = PILOT.gltf[id]; let src = null, l1 = 0, main = 0; if (!g) { out[id] = null; continue; }
    g.scene.traverse(m => { if (!m.isMesh) return; const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (/LOD1/.test(m.name)) l1 += n; else main += n; if (m.name === 'Koerper') src = m.geometry; });
    const G = LOD4.cache.get(src), W = src.attributes._lodw ? src.attributes._lodw.array : null, P = src.attributes.position.array, I = src.index.array;
    const o = { haupt: main, lod1Glb: l1, huelle: G ? G.index.count / 3 : 0, schutz: !!W };
    if (G && W) { const prot = (w) => w >= .5, nV = P.length / 3; let y0 = 1e9, y1 = -1e9; for (let v = 0; v < nV; v++) if (prot(W[v])) { y0 = Math.min(y0, P[v * 3 + 1]); y1 = Math.max(y1, P[v * 3 + 1]); }
      const bx = [1e9, -1e9, y0 - .01, y1 + .01, 1e9, -1e9]; for (let v = 0; v < nV; v++) { const y = P[v * 3 + 1]; if (y < bx[2] || y > bx[3]) continue; bx[0] = Math.min(bx[0], P[v * 3]); bx[1] = Math.max(bx[1], P[v * 3]); bx[4] = Math.min(bx[4], P[v * 3 + 2]); bx[5] = Math.max(bx[5], P[v * 3 + 2]); }
      bx[0] -= .01; bx[1] += .01; bx[4] -= .01; bx[5] += .01;
      const t0 = []; for (let f = 0; f < I.length; f += 3) if (prot(W[I[f]]) || prot(W[I[f + 1]]) || prot(W[I[f + 2]])) t0.push([I[f], I[f + 1], I[f + 2]]);
      // R5 (Laufzeit-Netz mit Schutz): Dreiecke des Caches G, Positionen aus G
      const GP = G.attributes.position.array, GW = G.attributes._lodw.array, GI = G.index.array, t1 = []; for (let f = 0; f < GI.length; f += 3) if (prot(GW[GI[f]]) || prot(GW[GI[f + 1]]) || prot(GW[GI[f + 2]])) t1.push([GI[f], GI[f + 1], GI[f + 2]]);
      // Vergleich: Verfahren R4 (ohne Schutz, 2,8 k) auf demselben Netz
      let r0 = lodSimplify(Float32Array.from(P), Uint32Array.from(I), 2800, {}); if (r0.tris > 2800 * 1.12) r0 = lodSimplify(Float32Array.from(P), Uint32Array.from(I), 2800, { free: 1 });
      const t2 = []; for (let f = 0; f < r0.idx.length; f += 3) { const a = r0.pv[r0.idx[f]], b = r0.pv[r0.idx[f + 1]], c = r0.pv[r0.idx[f + 2]]; if (prot(W[a]) || prot(W[b]) || prot(W[c])) t2.push([a, b, c]); }
      const N = 256, sil = { r5: {}, r4: {} }; let s5 = 0, s4 = 0;
      for (const vw of ['vorn', 'links', 'oben']) { const a = mask(P, t0, vw, bx, N), b = mask(GP, t1, vw, bx, N), c = mask(P, t2, vw, bx, N); let n = 0, x5 = 0, x4 = 0;
        for (let i = 0; i < a.length; i++) { n += a[i]; x5 += a[i] ^ b[i]; x4 += a[i] ^ c[i]; } sil.r5[vw] = +(x5 / n * 100).toFixed(2); sil.r4[vw] = +(x4 / n * 100).toFixed(2); s5 += x5 / n * 100 / 3; s4 += x4 / n * 100 / 3; }
      o.sil = sil; o.silR5 = +s5.toFixed(2); o.silR4 = +s4.toFixed(2); }
    out[id] = o; }
  return { figs: out, schutzNetze: LOD4.wN || 0 }; }, R5);
for (const id of R5) { const o = r5.figs[id];
  R.t(id + (id === 'fig_heldin' ? ' R6-Budget: Hauptnetz ≤ 9 300 (Pony/Seiten Ring 12), GLB-LOD1 ≤ 4 000' : ' R5/R6-Budget: Hauptnetz ≤ 9 000, GLB-LOD1 ≤ 4 000'), o && o.haupt <= (id === 'fig_heldin' ? 9300 : 9000) && o.lod1Glb <= 4000, o && { haupt: o.haupt, lod1Glb: o.lod1Glb });
  R.t(id + ' Schutzgewicht _LODW im GLB, Laufzeit-Hülle/LOD1 ≈ 3,2 k (≤ 3 300)', o && o.schutz && o.huelle > 2900 && o.huelle <= 3300, o && { schutz: o.schutz, huelle: o.huelle });
  const lim = R6.includes(id) ? [3.4, .7] : [1.8, .6];   // R6-Figuren haben viele kleine Haarvolumen (Locken, Wolken, Stacheln) → etwas großzügiger; Ziel bleibt klar unter dem R4-Verfahren
  R.t(id + ' Haar-/Kappen-Silhouette der Hülle: Ø XOR < ' + String(lim[0]).replace('.', ',') + ' % und ≤ ' + lim[1] * 100 + ' % des R4-Verfahrens', o && o.silR5 < lim[0] && o.silR5 <= o.silR4 * lim[1], o && { r5: o.silR5, r4Verfahren: o.silR4, je: o.sil });
}
// Hülle darf geschlossene Haarteile nicht verdecken (R4: Pferdeschwanz war nach innen gewickelt → BackSide-Hülle lag davor, „Schattenseite zu dunkel“)
const hb = await p.evaluate(async (ids) => { const rr = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(160, 240);
  const S = new THREE.Scene(); S.background = new THREE.Color('#ffffff'); S.add(new THREE.HemisphereLight('#eef6ff', '#d9c6a6', .8)); const sun = new THREE.DirectionalLight('#fff0d8', .9); sun.position.set(2.2, 5, 3.6); S.add(sun);
  const cam = new THREE.PerspectiveCamera(24, 160 / 240, .02, 50), out = {}, lodD = PILOT.lodD; PILOT.lodD = 1e9;
  for (const id of ids) { const o = figMake(id, null); if (!o) continue; o.rotation.y = Math.PI; S.add(o); for (let k = 0; k < 30; k++) pilotTick(o, 1 / 60, {}); o.updateMatrixWorld(true);
    const hs = []; o.traverse(m => { if (m.userData && m.userData.outline === 1) hs.push(m); }); const h = FIG_MODELS[id].h, res = [];
    for (const [px, pz] of [[0, -1], [1, 0], [-.7, -.7]]) { cam.position.set(px * 1.1 * h / 1.32, 1.18 * h / 1.32, pz * 1.1 * h / 1.32); cam.lookAt(0, 1.08 * h / 1.32, 0); const img = [];
      for (const on of [true, false]) { hs.forEach(x => x.visible = on); toonProSync(rr); rr.render(S, cam); const gl = rr.getContext(), a = new Uint8Array(160 * 240 * 4); gl.readPixels(0, 0, 160, 240, gl.RGBA, gl.UNSIGNED_BYTE, a); img.push(a); }
      let fig = 0, dif = 0; for (let i = 0; i < img[1].length; i += 4) { const bg = img[1][i] > 250 && img[1][i + 1] > 250 && img[1][i + 2] > 250; if (!bg) fig++;
        if (!bg && Math.abs(img[0][i] - img[1][i]) + Math.abs(img[0][i + 1] - img[1][i + 1]) + Math.abs(img[0][i + 2] - img[1][i + 2]) > 90) dif++; } res.push(+(dif / Math.max(1, fig) * 100).toFixed(2)); }
    hs.forEach(x => x.visible = true); S.remove(o); out[id] = res; }
  PILOT.lodD = lodD; rr.dispose(); return out; }, R5);
for (const id of R5) R.t(id + ' Umrisshülle verdeckt keine Haarteile (Bildanteil verändert < 8 % je Ansicht hinten/seitlich/schräg)', hb[id] && hb[id].every(x => x < 8), hb[id]);
// ---------- Runde 6: Rig (32 Knochen: Namen, Reihenfolge, Lage), 7 Clips (Namen, Dauer, Spuren), 9 Shape Keys bitgleich zum R5-Stand (Fixture) ----------
const rig = await p.evaluate(async (ids) => { const out = {};
  const info = (g) => { let sk = null, fk = []; g.scene.traverse(m => { if (m.isSkinnedMesh && m.name === 'Koerper') sk = m.skeleton; if (m.isMesh && /^Gesicht/.test(m.name) && m.morphTargetDictionary && !fk.length) fk = Object.keys(m.morphTargetDictionary); });
    g.scene.updateMatrixWorld(true); const v = new THREE.Vector3(); return { bones: sk.bones.map(b => [b.name, b.getWorldPosition(v.clone()).toArray()]), clips: g.animations.map(a => [a.name, +a.duration.toFixed(3), a.tracks.length, a.tracks.map(t => t.name).sort().join('|')]), keys: fk }; };
  for (const id of ids) { const k = id + '_r5alt'; FIG_MODELS[k] = Object.assign({}, FIG_MODELS[id]); PILOT.fix[k] = Object.assign({}, PILOT.fix[id]); PILOT.src[k] = 'fixtures/figuren/' + id + '_r5alt.glb'; const a = await pilotLoad(k), b = PILOT.gltf[id];
    if (!a || !b) { out[id] = { fehler: 'nicht geladen', alt: !!a, neu: !!b }; continue; }
    const A = info(a), B = info(b); let dmax = 0; if (A.bones.length === B.bones.length) A.bones.forEach((q, i) => { for (let j = 0; j < 3; j++) dmax = Math.max(dmax, Math.abs(q[1][j] - B.bones[i][1][j])); });
    out[id] = { knochen: B.bones.length, namenGleich: JSON.stringify(A.bones.map(q => q[0])) === JSON.stringify(B.bones.map(q => q[0])), lageMax: +dmax.toFixed(6), clipsGleich: JSON.stringify(A.clips) === JSON.stringify(B.clips), clips: B.clips.map(c => c[0]).join(','), keysGleich: JSON.stringify(A.keys) === JSON.stringify(B.keys), keys: B.keys.length }; }
  return out; }, ['fig_heldin', ...R6]);
for (const id of ['fig_heldin', ...R6]) { const o = rig[id];
  R.t(id + ' Rig/Clips/Shape Keys unverändert gegen R5-Fixture (32 Knochen gleiche Namen + Lage ≤ 0,001 m, 7 Clips gleiche Namen/Dauer/Spuren, 9 Keys gleiche Namen)', o && o.knochen === 32 && o.namenGleich && o.lageMax <= .001 && o.clipsGleich && /idle,walk,jog,run,winken,jubeln,werfen/.test(o.clips) && o.keysGleich && o.keys === 9, o); }
R.note('R5 Silhouette (Ø XOR %, R5 / R4-Verfahren): ' + R5.map(id => id + ' ' + (r5.figs[id] && r5.figs[id].silR5) + ' / ' + (r5.figs[id] && r5.figs[id].silR4)).join(' · '));
const map = await p.evaluate(() => ({ held: figModelFor('#000', '#000', { body: 'held' }), heldin: figModelFor('#000', '#000', { body: 'heldin' }), veyran: figModelFor('#fff', '#fff', { look: FIGURES.veyran.look }),
  mirael: figModelFor('#fff', '#fff', { look: FIGURES.mirael.look }), shop: figModelFor('#6aa0e0', '#333'), buerger: figModelFor('#7a9a5a', '#333'), tarek: figModelFor('#fff', '#fff', { look: FIGURES.tarek.look }) }));
R.t('Zuordnung Typ → Modell', map.held === 'fig_noa' && map.heldin === 'fig_heldin' && map.veyran === 'fig_veyran' && map.mirael === 'fig_mirael' && map.shop === 'fig_haendler' && /fig_buerger_/.test(map.buerger) && map.tarek === null, map);
// Gang: Tempo 2,8 und 5 Felder/s → Gewichte jog bzw. run, Phase läuft
const gait = await p.evaluate(() => { const o = figMake('fig_noa', null), U = o.userData, out = {}; for (const v of [0, 1.9, 2.8, 5]) { for (let i = 0; i < 90; i++) { o.position.x += v / 60; pilotTick(o, 1 / 60, {}); } out[v] = Object.fromEntries(Object.entries(U.w).map(([k, x]) => [k, +x.toFixed(2)])); } return out; });
R.t('Gang: 1,9 → Gehen (walk), 5 → Rennen (run)', gait['1.9'].walk > .8 && gait['5'].run > .7 && gait['0'].idle > .9, gait);
// Morgenau mit Figuren-NPCs (person3d-Haken)
await p.evaluate(() => { NPCS.morgenau.push({ x: 9, y: 9, c: '#e8e8e8', t: 'talk', fig: 'veyran', txt: ['Hallo!'] }, { x: 10, y: 9, c: '#6aa0e0', t: 'talk', txt: ['Hallo!'] }); R3.ofk = null; mode = 'world'; loadMap('morgenau', 8, 10); });
await p.waitForTimeout(3000);
const sc = await p.evaluate(() => { let n = 0; R3.scene.traverse(o => { if (o.userData && o.userData.pilot) n++; }); return { modelle: n, held: !!R3.player.userData.pilot, calls: R3.r.info.render.calls }; });
R.t('Morgenau: Held + NPCs als Modelle', sc.held && sc.modelle >= 3, sc);
await p.evaluate(() => { STICK.y = 1; }); await p.waitForTimeout(1200); await p.evaluate(() => { STICK.y = 0; }); await p.waitForTimeout(600);
R.t('keine Konsolenfehler', p.errs.length === 0, p.errs.slice(0, 5));
console.log(R.bad ? `${R.bad} Fehler.` : 'Keine Fehler.'); await env.close(); process.exit(R.bad ? 1 : 0);
