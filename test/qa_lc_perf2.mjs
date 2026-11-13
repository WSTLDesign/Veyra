// QA Loop C – Punkt 8 (Vertiefung): Woher kommen die Draw-Calls der Route 3? Und wachsen Geometrien/Texturen beim Kartenwechsel (Leck)?
import { start, page, newGame, reporter } from './qa_lc_lib.mjs';
const R = reporter('qa_lc_perf2.log', 'QA Loop C – Draw-Call-Herkunft Route 3 und Kartenwechsel-Leck');
const env = await start(); const p = await page(env, { w: 860, h: 484 }); await newGame(p, { view: 'third' }); const ev = (f, a) => p.evaluate(f, a);
const go = (id, x, y) => ev(([id, x, y]) => { for (const f of ['badge1', 'badge2', 'badge3', 'badge4', 'grunt1']) G.flags[f] = 1; G.time = 12 * 60; loadMap(id, x, y); P.dir = 'up'; P.ang = 0; mode = 'world'; VILL.list = []; ROAM.list = []; ROAM.want = 0; R3.snap = 1; }, [id, x, y]);
const SRC = () => { const cam = R3.cam; cam.updateMatrixWorld(true); const fr = new THREE.Frustum(); fr.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)); const by = {}; let tot = 0;
  R3.scene.traverse(o => { if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return; let v = true; for (let q = o; q; q = q.parent) if (q.visible === false) { v = false; break; } if (!v) return;
    if (o.frustumCulled !== false && o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const s = o.geometry.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(s)) return; }
    const mats = Array.isArray(o.material) ? o.material : [o.material]; const par = (o.parent && (o.parent.name || o.parent.type)) || '?'; const key = (o.name || o.type) + ' | ' + (o.isSkinnedMesh ? 'skinned' : o.isInstancedMesh ? 'inst' : o.type) + ' | par=' + par; by[key] = (by[key] || 0) + mats.length; tot += mats.length; });
  return { tot, top: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 14) }; };
for (const [id, x, y] of [['route1', 10, 11], ['route3', 10, 8], ['siegesstrasse', 11, 8]]) { await go(id, x, y); await p.waitForTimeout(3500); const r = await ev(SRC); const calls = await ev(() => R3.r.info.render.calls); R.note(`${id}: render.calls=${calls}, sichtbare Meshes im Frustum=${r.tot}`); for (const [k, n] of r.top) R.note('    ' + n + ' × ' + k); }
// Leck: Karte 8× hin und her
const seq = []; for (let i = 0; i < 6; i++) { for (const [id, x, y] of [['morgenau', 9, 7], ['route1', 10, 11], ['route3', 10, 8]]) { await go(id, x, y); await p.waitForTimeout(1800); } const m = await ev(() => ({ geos: R3.r.info.memory.geometries, tex: R3.r.info.memory.textures, kids: R3.scene.children.length, progs: R3.r.info.programs ? R3.r.info.programs.length : null })); seq.push(m); R.note(`Runde ${i + 1}: ` + JSON.stringify(m)); }
R.t('Geometrien wachsen nach Runde 2 nicht mehr (kein unbegrenztes Wachstum)', seq[5].geos <= seq[2].geos + 5, seq.map(s => s.geos));
// Nachbesserung 1: Himmels-Cache (44-sky skyGC, 3-s-Takt) pendelt je nach Timing um ±6 Texturen → Vergleich der Höchstwerte Runde 4–6 gegen Runde 1–3 statt Einzelwert Runde 6 gegen Runde 3
R.t('Texturen wachsen nach Runde 2 nicht mehr (Höchstwert Runde 4–6 ≤ Höchstwert Runde 1–3 + 3)', Math.max(...seq.slice(3).map(s => s.tex)) <= Math.max(...seq.slice(0, 3).map(s => s.tex)) + 3, seq.map(s => s.tex));
R.t('keine Seitenfehler', p.errs.length === 0, p.errs); await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`);
