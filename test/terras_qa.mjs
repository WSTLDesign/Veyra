// Terras – QA der Kreaturen-Modelle (Agent Terras, Opus hoch). Nur unter der Chromium-Sperre starten:
//   LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/terras_qa.mjs
// Prüft: alle Arten bauen fehlerfrei · Welt-I-Arten (TERRA) ≤ 12 Draw-Calls und ≤ 6000 Modell-Dreiecke (ohne Umriss-Hülle; gerendert inkl. Umriss wird mitgemeldet) · keine NaN-Positionen ·
// Füße auf y = 0, Höhe passend zu MONS[i].sp[4] · animMon 3 s (Gehen, Rennen, Angriff, Treffer, Ohnmacht, Schlaf, Grasen, Heldenpose) ohne Fehler,
// Pfoten nicht im Boden · Vorschaubilder (monThumb) gefüllt. Ergebnis zusätzlich in test/terras_qa.txt.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync } from 'fs';
const S = await serve();
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 640, height: 480 } }); p.setDefaultTimeout(15000);
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.addInitScript(() => { window.VEYRA_DEMO = 1; });
await p.goto(S.url + 'index.html', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.THREE && typeof buildTerra === 'function' && typeof MONS !== 'undefined', null, { timeout: 15000 });
const R = await p.evaluate(() => {
  try { if (typeof VILL !== 'undefined') VILL.list = []; } catch (e) { }
  const out = { build: [], terra: [], anim: [], thumb: [], nan: [], box: [], feet: [], other: [] };
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: false }); r.setSize(256, 256, false);
  const s = new THREE.Scene(); studio(s); const cam = new THREE.PerspectiveCamera(28, 1, .1, 50);
  const fin = o => { let ok = true; o.traverse(q => { if (!ok) return; const e = q.matrixWorld.elements; for (const v of e) if (!Number.isFinite(v)) { ok = false; return; } if (q.isMesh) { const a = q.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) if (!Number.isFinite(a[i])) { ok = false; return; } } }); return ok; };
  for (let id = 1; id < MONS.length; id++) {
    if (!MONS[id]) continue; let m;
    try { m = buildMon3D(id, 1, {}); } catch (e) { out.build.push(id + ' ' + MONS[id].n + ': ' + e.message); continue; }
    const T = typeof terraOf === 'function' && terraOf(id);
    m.rotation.y = -2.5; s.add(m); heroFrame(cam, m); r.info.autoReset = false; r.info.reset(); r.render(s, cam); const calls = r.info.render.calls, rtris = r.info.render.triangles; r.info.autoReset = true; let tris = 0; m.traverse(o => { if (o.isMesh && !o.userData.ol) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); if (m.userData.fx && m.userData.fx.spark) tris += 0;
    m.updateMatrixWorld(true); if (!fin(m)) out.nan.push(id);
    if (!T) { out.other.push([id, calls, rtris]); s.remove(m); continue; }
    const U = m.userData, sc = MONS[id].sp[4], bx = new THREE.Box3(); m.traverse(o => { if (o.isMesh && !o.userData.ol && !(o.material && o.material.transparent)) { o.geometry.boundingBox || o.geometry.computeBoundingBox(); bx.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
    const sz = bx.getSize(new THREE.Vector3()), hov = (U.hover || 0) * m.scale.x;
    out.terra.push({ id, n: MONS[id].n, tier: T.tier, calls, tris, rtris, bones: U.bones, h: +sz.y.toFixed(3), sp: sc, minY: +bx.min.y.toFixed(3) });
    if (Math.abs(bx.min.y - hov) > .03 * sc || sz.y > sc * 1.08 || sz.y < sc * .3 || Math.max(sz.x, sz.z) > sc * 2.3) out.box.push(id + ' ' + MONS[id].n + ' minY ' + bx.min.y.toFixed(3) + ' Höhe ' + sz.y.toFixed(3) + '/' + sc + ' Länge ' + Math.max(sz.x, sz.z).toFixed(3));
    // 3 s Animation in allen Zuständen
    try {
      const A = U.act, t0 = performance.now(), st = [{ moving: true }, { moving: true, speed: 1.8 }, { pose: 'graze' }, { pose: 'sleep' }, { pose: 'hero' }, { pose: 'hide' }, {}];
      let low = 0;
      for (let k = 0; k <= 180; k++) {
        const t = t0 + k * 16.7, ph = Math.floor(k / 26);
        if (k === 60) A.atk = performance.now(); if (k === 100) A.hit = performance.now(); if (k === 150) A.ko = performance.now() - 800;
        animMon(m, t, Object.assign({ lookAt: { x: 2, z: 1 } }, st[ph % st.length]));
        if (ph < 2 && U.legs && U.gait !== 'jelly' && U.gait !== 'ribbon') { m.updateMatrixWorld(true); U.legs.forEach(L => { const g = L.g ? L.g[L.g.length - 1] : L.l || L.u; if (!g) return; const v = new THREE.Vector3(); g.getWorldPosition(v); low = Math.min(low, v.y); }); }
      }
      A.ko = 0; m.updateMatrixWorld(true); if (!fin(m)) out.nan.push(id + ' (Animation)');
      if (low < -.06 * sc) out.feet.push(id + ' ' + MONS[id].n + ' Pfote ' + low.toFixed(3));
    } catch (e) { out.anim.push(id + ' ' + MONS[id].n + ': ' + e.message); }
    s.remove(m);
    try { delete THUMB[id]; const th = monThumb(id); if (!th || thumbCover(th.img) < .03) out.thumb.push(id + ' ' + MONS[id].n); } catch (e) { out.thumb.push(id + ': ' + e.message); }
  }
  r.dispose(); return out;
});
const lines = []; let bad = 0; const t = (n, ok, info) => { if (!ok) bad++; lines.push((ok ? '✓ ' : '✗ ') + n + (info ? ' → ' + info : '')); };
t('Alle Arten bauen ohne Fehler', !R.build.length, R.build.join(' | '));
t('Welt-I-Arten neu aufgebaut (TERRA): ' + R.terra.length + ' Arten', R.terra.length >= 40);
const overC = R.terra.filter(x => x.calls > 12), overT = R.terra.filter(x => x.tris > 6000);
t('Draw-Calls je Welt-I-Kreatur ≤ 12 (max ' + Math.max(...R.terra.map(x => x.calls)) + ')', !overC.length, overC.map(x => x.id + ':' + x.calls).join(' '));
t('Modell-Dreiecke je Welt-I-Kreatur ≤ 6000 (max ' + Math.max(...R.terra.map(x => x.tris)) + ', Mittel ' + Math.round(R.terra.reduce((a, x) => a + x.tris, 0) / R.terra.length) + '; gerendert inkl. Umriss max ' + Math.max(...R.terra.map(x => x.rtris)) + ')', !overT.length, overT.map(x => x.id + ':' + x.tris).join(' '));
t('Keine NaN-Positionen', !R.nan.length, R.nan.join(' '));
t('Bounding-Box: Füße auf y = 0, Höhe passend zu sp[4]', !R.box.length, R.box.join(' | '));
t('animMon 3 s (Gehen/Rennen/Angriff/Treffer/Ohnmacht/Schlaf/Grasen/Held/Verstecken) ohne Fehler', !R.anim.length, R.anim.join(' | '));
t('Pfoten bleiben beim Gehen/Rennen über dem Boden', !R.feet.length, R.feet.join(' | '));
t('Vorschaubilder (monThumb) erzeugt und gefüllt', !R.thumb.length, R.thumb.join(' | '));
t('Keine Seitenfehler', !errs.length, errs.slice(0, 5).join(' | '));
lines.push('', 'Messwerte Welt I (Draw-Calls gerendert; Dreiecke Modell / gerendert inkl. Umriss):', ...R.terra.map(x => `  #${String(x.id).padStart(3, '0')} ${x.n.padEnd(12)} ${x.tier.padEnd(32)} Calls ${String(x.calls).padStart(2)} · Dreiecke ${String(x.tris).padStart(5)} / ${String(x.rtris).padStart(5)} · Knochen ${x.bones} · Höhe ${x.h}/${x.sp}`));
const oc = R.other.map(x => x[1]), ot = R.other.map(x => x[2]);
lines.push('', `Übrige Arten (noch nicht umgebaut, ${R.other.length}, gerendert): Calls Mittel ${Math.round(oc.reduce((a, b) => a + b, 0) / oc.length)} (max ${Math.max(...oc)}), Dreiecke Mittel ${Math.round(ot.reduce((a, b) => a + b, 0) / ot.length)} (max ${Math.max(...ot)})`);
lines.push('', bad ? bad + ' Prüfung(en) fehlgeschlagen.' : 'Alle Prüfungen bestanden.');
console.log(lines.join('\n')); writeFileSync(new URL('./terras_qa.txt', import.meta.url), lines.join('\n') + '\n');
await b.close(); S.close(); process.exit(bad ? 1 : 0);
