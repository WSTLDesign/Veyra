// Figuren Runde 2 – Test mit Schalter an: lädt alle Figuren-GLB, baut sie (figMake), prüft Clips/Shape Keys/LOD, Zuordnung figModelFor,
// Morgenau mit Held + NPCs (person3d-Haken) und Gang-Tick – ohne Konsolenfehler.  Sperre nehmen!  node test/figuren2/test_modelle.mjs
import { start, page, newGame, reporter } from '../qa_lc_lib.mjs';
const R = reporter('figuren2/test_modelle.txt', 'Figuren Runde 2 – Modelle (Schalter an)');
const env = await start(); const p = await page(env, { w: 860, h: 484, set: { quality: 'eigene', modelle3d: true } });
await newGame(p, { team: [[1, 8]], view: 'third' });
const ids = await p.evaluate(() => Object.keys(FIG_MODELS));
const ld = await p.evaluate(async (ids) => { const o = {}; for (const k of ids) { const g = await pilotLoad(k); o[k] = g ? PILOT['ms_' + k] : null; } return o; }, ids);
R.t('alle Figuren geladen', Object.values(ld).every(v => v != null), ld);
const chk = await p.evaluate((ids) => ids.map(id => { const o = figMake(id, null); if (!o) return { id, ok: false }; const U = o.userData; let tris = 0, lodTris = 0;
  o.traverse(m => { if (m.isMesh && !m.userData.outline) { const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (/LOD1/.test(m.name)) lodTris += n; else tris += n; } });
  const keys = U.faces.length ? Object.keys(U.faces[0].morphTargetDictionary) : [];
  for (let i = 0; i < 30; i++) pilotTick(o, 1 / 30, {}); o.position.x += 0; return { id, ok: true, clips: Object.keys(U.acts).sort().join(','), keys: keys.length, tris, lodTris, lod: !!U.lod, h: +(new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).y).toFixed(2) }; }), ids);
for (const c of chk) {
  R.t(c.id + ' gebaut', c.ok, c);
  R.t(c.id + ' Clips idle/walk/jog/run/winken/jubeln/werfen', /idle/.test(c.clips) && /jog/.test(c.clips) && /winken/.test(c.clips) && /werfen/.test(c.clips) && /jubeln/.test(c.clips), c.clips);
  R.t(c.id + ' 9 Shape Keys', c.keys === 9, c.keys);
  R.t(c.id + ' Dreiecke 8–14 k, LOD ≈ 50 %', c.tris >= 8000 && c.tris <= 14000 && c.lod && c.lodTris < c.tris * .62, { tris: c.tris, lod: c.lodTris });
}
const map = await p.evaluate(() => ({ held: figModelFor('#000', '#000', { body: 'held' }), heldin: figModelFor('#000', '#000', { body: 'heldin' }), veyran: figModelFor('#fff', '#fff', { look: FIGURES.veyran.look }),
  mirael: figModelFor('#fff', '#fff', { look: FIGURES.mirael.look }), shop: figModelFor('#6aa0e0', '#333'), buerger: figModelFor('#7a9a5a', '#333'), tarek: figModelFor('#fff', '#fff', { look: FIGURES.tarek.look }) }));
R.t('Zuordnung Typ → Modell', map.held === 'fig_noa' && map.heldin === null && map.veyran === 'fig_veyran' && map.mirael === 'fig_mirael' && map.shop === 'fig_haendler' && /fig_buerger_/.test(map.buerger) && map.tarek === null, map);
// Gang: Tempo 2,8 und 5 Felder/s → Gewichte jog bzw. run, Phase läuft
const gait = await p.evaluate(() => { const o = figMake('fig_noa', null), U = o.userData, out = {}; for (const v of [0, 1, 2.8, 5]) { for (let i = 0; i < 90; i++) { o.position.x += v / 60; pilotTick(o, 1 / 60, {}); } out[v] = Object.fromEntries(Object.entries(U.w).map(([k, x]) => [k, +x.toFixed(2)])); } return out; });
R.t('Gang: 2,8 → Laufen (jog), 5 → Rennen (run)', gait['2.8'].jog > .7 && gait['5'].run > .7 && gait['0'].idle > .9, gait);
// Morgenau mit Figuren-NPCs (person3d-Haken)
await p.evaluate(() => { NPCS.morgenau.push({ x: 9, y: 9, c: '#e8e8e8', t: 'talk', fig: 'veyran', txt: ['Hallo!'] }, { x: 10, y: 9, c: '#6aa0e0', t: 'talk', txt: ['Hallo!'] }); R3.ofk = null; mode = 'world'; loadMap('morgenau', 8, 10); });
await p.waitForTimeout(3000);
const sc = await p.evaluate(() => { let n = 0; R3.scene.traverse(o => { if (o.userData && o.userData.pilot) n++; }); return { modelle: n, held: !!R3.player.userData.pilot, calls: R3.r.info.render.calls }; });
R.t('Morgenau: Held + NPCs als Modelle', sc.held && sc.modelle >= 3, sc);
await p.evaluate(() => { STICK.y = 1; }); await p.waitForTimeout(1200); await p.evaluate(() => { STICK.y = 0; }); await p.waitForTimeout(600);
R.t('keine Konsolenfehler', p.errs.length === 0, p.errs.slice(0, 5));
console.log(R.bad ? `${R.bad} Fehler.` : 'Keine Fehler.'); await env.close(); process.exit(R.bad ? 1 : 0);
