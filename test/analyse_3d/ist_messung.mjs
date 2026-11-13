// Analyse „3D Ist-Stand“ (12.11.): misst Figuren/Kreaturen im laufenden Spiel und rendert Bildbelege 1600×900 als WebP.
// Nur unter der Chromium-Sperre starten:
//   LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/analyse_3d/ist_messung.mjs
// Ergebnis: test/analyse_3d/*.webp + test/analyse_3d/ist_messung.json
import { page as mkPage, newGame } from '../qa_lc_lib.mjs';
import { chromium } from 'playwright';
import { serve } from '../art_serve.mjs';
import { existsSync } from 'fs';
// wie qa_lc_lib.start, aber mit vorhandenem Headless-Shell, falls die Playwright-Version einen anderen Build erwartet
export async function start() {
  const S = await serve(); const alt = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
  const browser = await chromium.launch({ executablePath: existsSync(chromium.executablePath()) ? undefined : alt, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=1024'] });
  return { S, browser, close: async () => { await browser.close(); S.close(); } };
}
import { figStage, FIG_CODE } from '../charaktere_lib.mjs';
import { writeFileSync } from 'fs';
const OUT = new URL('./', import.meta.url).pathname;
const W = 1600, H = 900;
const env = await start(); const p = await mkPage(env, { w: W, h: H, set: { quality: 'eigene' } });
await newGame(p, { team: [[1, 12]], view: 'third' });
const res = { zeit: new Date().toISOString() };
// WebP aus PNG/DataURL (im Browser umrechnen)
const toWebp = async (src, file, q = .9) => { const d = await p.evaluate(async ([s, q]) => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s; }); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q); }, [src, q]);
  writeFileSync(OUT + file, Buffer.from(d.split(',')[1], 'base64')); };
const shotPage = async file => { const b = await p.screenshot(); await toWebp('data:image/png;base64,' + b.toString('base64'), file); };

// ---------- 1. Renderer-Einstellungen im Spiel ----------
res.renderer = await p.evaluate(() => { const r = R3.r, gl = r.getContext(), a = gl.getContextAttributes(), sz = new THREE.Vector2(); r.getDrawingBufferSize(sz);
  let sun = null; R3.scene.traverse(o => { if (o.isDirectionalLight && o.castShadow && !sun) sun = o; });
  return { pixelRatio: r.getPixelRatio(), buffer: [sz.x, sz.y], css: [innerWidth, innerHeight], antialias: a.antialias, samples: gl.getParameter(gl.SAMPLES), toneMapping: r.toneMapping, expo: +r.toneMappingExposure.toFixed(2), shadowType: r.shadowMap.type, shadowOn: r.shadowMap.enabled,
    shadowMap: sun ? [sun.shadow.mapSize.x, sun.shadow.mapSize.y] : null, physLights: r.physicallyCorrectLights, outputEnc: r.outputEncoding, SET: { quality: SET.quality, res: SET.res, gfx: SET.gfx, shadows: SET.shadows, fps: SET.fps }, PRESET_niedrig: PRESET.niedrig, PRESET_hoch: PRESET.hoch, PERFweak: typeof PERF === 'object' ? !!PERF.weak : null,
    MON_RENDER: window.MON_RENDER, models: Object.keys(window.MODEL_SRC || {}) }; });

// ---------- 2. Zahlen je Objekt (Szene durchlaufen + Teile vor dem Verschmelzen zählen) ----------
await p.evaluate(() => {
  window.AN = {};
  // Teile zählen: rigMerge (Figuren) und taMergeSkin (Terras) mitschneiden, Caches leeren
  const typ = g => { const t = g.type || 'BufferGeometry', q = g.parameters || {}; return t === 'SphereGeometry' ? `Kugel ${q.widthSegments}×${q.heightSegments}` : t === 'TorusGeometry' ? `Torus ${q.radialSegments}×${q.tubularSegments}` : t === 'CylinderGeometry' ? `Zylinder ${q.radialSegments}` : t === 'BufferGeometry' ? 'eigene Form (Röhre/Loft/Kappe)' : t; };
  AN.rec = null;
  const rm = rigMerge; rigMerge = function (parts) { if (AN.rec) { AN.rec.n += parts.length; parts.forEach(p => { const k = typ(p[0]); AN.rec.h[k] = (AN.rec.h[k] || 0) + 1; }); } return rm.apply(this, arguments); };
  const tm = taMergeSkin; taMergeSkin = function (list, ol) { if (AN.rec && !ol) { AN.rec.n += list.length; list.forEach(p => { const k = typ(p[0]); AN.rec.h[k] = (AN.rec.h[k] || 0) + 1; }); } return tm.apply(this, arguments); };
  AN.clear = () => { for (const k in W3GEO) if (k.startsWith('chr|')) delete W3GEO[k]; for (const k in G3) if (/^T\d|^TL|^taE/.test(k)) delete G3[k]; };
  AN.inspect = (o) => { o.updateMatrixWorld(true); const r = { meshes: 0, skinned: 0, bones: 0, tris: 0, olTris: 0, mats: {}, shaderMods: 0, tex: [], morph: 0, outline: 0, sprite: !!o.userData.sprite, terra: !!o.userData.terra, rig: !!o.userData.rig };
    const seenT = new Set(), bonesSeen = new Set();
    o.traverse(q => { if (!q.isMesh && !q.isPoints && !q.isSprite) return; if (q.visible === false) return; const g = q.geometry, n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
      const ms = Array.isArray(q.material) ? q.material : [q.material]; const isOl = !!(q.userData.outline === 1 || q.userData.ol === 1 || q.userData.ol === true || ms.some(m => m.side === THREE.BackSide && (m.isMeshBasicMaterial || m.isShaderMaterial)));
      r.meshes++; if (isOl) { r.outline++; r.olTris += n; } else r.tris += n; if (q.isSkinnedMesh) { r.skinned++; q.skeleton.bones.forEach(b => bonesSeen.add(b)); } if (g.morphAttributes && g.morphAttributes.position) r.morph += g.morphAttributes.position.length;
      ms.forEach(m => { r.mats[m.type] = (r.mats[m.type] || 0) + 1; if (m.onBeforeCompile && m.onBeforeCompile.toString().length > 30) r.shaderMods++;
        ['map', 'gradientMap', 'normalMap', 'bumpMap', 'emissiveMap', 'alphaMap', 'roughnessMap', 'matcap'].forEach(k => { const t = m[k]; if (t && !seenT.has(t)) { seenT.add(t); const im = t.image; r.tex.push(k + ':' + (im ? (im.width || '?') + '×' + (im.height || '?') : '?')); } }); }); });
    r.bones = bonesSeen.size; r.tris = Math.round(r.tris); r.olTris = Math.round(r.olTris); return r; };
  AN.measure = (code, label) => { AN.clear(); AN.rec = { n: 0, h: {} }; const o = (0, eval)(code); const parts = AN.rec; AN.rec = null; const r = AN.inspect(o); r.parts = parts.n; r.partTypes = parts.h; r.label = label; const b = new THREE.Box3().setFromObject(o); r.h = +(b.max.y - b.min.y).toFixed(3); return r; };
});
const items = [
  ['held', FIG_CODE('held'), 'Held (Spielerfigur, Stufe 0)'],
  ['veyran', FIG_CODE('veyran'), 'Prof. Veyran (NPC)'],
  ['funki', 'buildMon3D(1,1,{})', '001 Funki (Glut-Starter, Terra)'],
  ['plippi', 'buildMon3D(4,1,{})', '004 Plippi (Flut-Starter, Terra)'],
  ['knospi', 'buildMon3D(7,1,{})', '007 Knospi (Flora-Starter, Terra)'],
  ['funki_hq', '(()=>{TA_HQ=1;try{return buildMon3D(1,1,{})}finally{TA_HQ=0}})()', '001 Funki Porträt-Qualität (TA_HQ)'],
];
res.objekte = {};
for (const [k, code, label] of items) res.objekte[k] = await p.evaluate(([c, l]) => AN.measure(c, l), [code, label]);
// Darstellungsart je Starter in Welt und Kampf
res.darstellung = await p.evaluate(() => [1, 4, 7].map(id => ({ id, name: MONS[id].n || MONS[id].name, terra: !!terraOf(id), hasArt: typeof hasArt === 'function' ? hasArt(id) : null, spriteOK: spriteOK(id), monRender: monRender(id), kampf: monRender(id) === 'sprite' ? 'Billboard (gemaltes Bild)' : '3D' })));
// Animation: Knochen/Transform? (Figur: Skelett; Terra: Skelett; Gesicht über Augen-Textur)
res.gesicht = await p.evaluate(() => { const o = buildMon3D(1, 1, {}); const U = o.userData, F = U.face; return { kreaturAugen: F ? { sty: F.sty, tex: F.eM.map && F.eM.map.image ? F.eM.map.image.width + '×' + F.eM.map.image.height : null, mat: F.eM.type } : null, kiefer: !!(U.jaw || U.mouth), ausdruecke: 'setFace(U,es,ms) tauscht Augen-Textur' }; });
console.log(JSON.stringify(res.objekte, null, 1));

// ---------- 3. Studio-Bilder Figuren (Spiel-Licht, pr 1 wie im Spiel bei 900 Zeilen) ----------
await figStage(p, { W, H, pr: 1, neutral: true });
const studio = async (code, view, file, opt = {}) => { const d = await p.evaluate(([code, view, opt]) => { const f = CS.put((0, eval)(code)); const b = new THREE.Box3().setFromObject(f), h = b.max.y - b.min.y;
    if (opt.wire) f.traverse(q => { if (q.isMesh && q.userData.outline !== 1) { q.material = q.material.clone(); q.material.wireframe = true; } if (q.userData && q.userData.outline === 1) q.visible = false; });
    // eigene Kameras für 16:9
    const cam = CS.cam; cam.aspect = CS.W / CS.H; cam.fov = 24; cam.updateProjectionMatrix();
    const a = { vorn: 0, schraeg: -.65, nah: -.3, seite: -Math.PI / 2 }[view] ?? 0, near = view === 'nah', d = near ? (opt.d || .95) : h * 2.2, ty = near ? h * .9 : h * .52;
    cam.position.set(Math.sin(a) * -d, ty + (near ? .01 : .15), Math.cos(a) * -d); cam.lookAt(0, ty, 0); cam.updateMatrixWorld();
    CS.sun.position.set(-2.5, 6, -4); CS.rr.render(CS.S, cam); return CS.rr.domElement.toDataURL('image/png'); }, [code, view, opt]); await toWebp(d, file); };
await studio(FIG_CODE('held'), 'vorn', 'held_vorn.webp');
await studio(FIG_CODE('held'), 'schraeg', 'held_schraeg.webp');
await studio(FIG_CODE('held'), 'nah', 'held_gesicht.webp', { d: .62 });
await studio(FIG_CODE('held'), 'nah', 'held_gesicht_gitter.webp', { d: .62, wire: 1 });
await studio(FIG_CODE('veyran'), 'schraeg', 'npc_veyran.webp');
await studio(FIG_CODE('veyran'), 'nah', 'npc_veyran_gesicht.webp', { d: .7 });
// Kreaturen im Studio (Spielmodell, wie in Welt/Kampf)
for (const [id, n] of [[1, 'funki'], [4, 'plippi'], [7, 'knospi']]) {
  const d = await p.evaluate(([id]) => { const f = CS.put(buildMon3D(id, .55, {})); const b = new THREE.Box3().setFromObject(f), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), m = Math.max(s.y, s.x * .6, s.z * .6);
    const cam = CS.cam; cam.aspect = CS.W / CS.H; cam.fov = 24; cam.updateProjectionMatrix(); const a = -.75, dd = m * 3.4; cam.position.set(Math.sin(a) * -dd + c.x, c.y + m * .35, Math.cos(a) * -dd + c.z); cam.lookAt(c.x, c.y, c.z); cam.updateMatrixWorld();
    CS.rr.render(CS.S, cam); return CS.rr.domElement.toDataURL('image/png'); }, [id]); await toWebp(d, `kreatur_${n}_studio.webp`);
}
await p.evaluate(() => { CS.rr.domElement.remove(); CS.rr.dispose(); terrainY = window.__tyGame; mode = 'world'; });

// ---------- 4. Welt: Begleiter + Nahaufnahme aus Spielkamera-Richtung ----------
res.welt = {};
for (const [id, n] of [[1, 'funki'], [4, 'plippi'], [7, 'knospi']]) {
  await p.evaluate(([id]) => { G.team = [mk(id, 12)]; mode = 'world'; loadMap('route1', 9, 12); setView('third', true); VILL && (VILL.list = []); ROAM && (ROAM.want = 0, ROAM.list = []); P.dir = 'down'; P.ang = Math.PI; G.time = 11 * 60; }, [id]);
  await p.waitForTimeout(2500); await p.evaluate(() => { P.run = false; STICK.y = 1; }); await p.waitForTimeout(700); await p.evaluate(() => { STICK.y = 0; }); await p.waitForTimeout(2200);
  await p.evaluate(() => document.querySelectorAll('.toast,#toast').forEach(e => e.style.visibility = 'hidden'));
  await shotPage(`welt_${n}.webp`);
  const r = await p.evaluate(() => { const S = R3.scene, mm = S.userData.mm, o = mm && COMP && mm.get(COMP); if (!o) return { fehlt: 1 }; const info = AN.inspect(o);
    const r = R3.r; r.info.autoReset = false; r.info.reset(); r.render(S, R3.activeCam || R3.cam); const calls = r.info.render.calls, tris = r.info.render.triangles; r.info.autoReset = true;
    // Nahaufnahme
    const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), m = Math.max(s.y, s.x * .6, s.z * .6), gc = (R3.activeCam || R3.cam);
    const dir = gc.position.clone().sub(c); dir.y = 0; dir.normalize(); const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .02, 200); cam.position.copy(c).addScaledVector(dir, m * 2.6); cam.position.y = c.y + m * .45; cam.lookAt(c); cam.updateMatrixWorld();
    r.render(S, cam); const img = r.domElement.toDataURL('image/png'); return { info, szeneCalls: calls, szeneTris: tris, img }; });
  if (r.img) { await toWebp(r.img, `welt_${n}_nah.webp`); delete r.img; }
  res.welt[n] = r;
}
// ---------- 5. Kampf: drei Paarungen (Gegner von vorn, eigene Kreatur von hinten) ----------
res.kampf = {};
for (const [me, foe, n] of [[7, 1, 'funki'], [1, 4, 'plippi'], [4, 7, 'knospi']]) {
  await p.evaluate(([me]) => { G.team = [mk(me, 14)]; mode = 'world'; loadMap('route1', 9, 12); VILL && (VILL.list = []); ROAM && (ROAM.want = 0, ROAM.list = []); G.time = 11 * 60; }, [me]);
  await p.waitForTimeout(1500);
  await p.evaluate(([foe]) => { SET.skipBattleIntro = 1; SET.btl = 'runde'; startBattle({ wild: mk(foe, 12) }); }, [foe]);
  await p.waitForTimeout(5500);
  await p.evaluate(() => document.querySelectorAll('.toast,#toast').forEach(e => e.style.visibility = 'hidden'));
  await shotPage(`kampf_${n}.webp`);
  res.kampf[n] = await p.evaluate(() => { const f = BT && BT.foe, m = BT && BT.me; return { mode, gegner: f ? AN.inspect(f) : null, eigen: m ? AN.inspect(m) : null, bufferPx: BT ? [BT.r.domElement.width, BT.r.domElement.height] : null, pr: BT ? BT.r.getPixelRatio() : null }; });
  await p.evaluate(() => { try { endBattle && endBattle(); } catch (e) { } mode = 'world'; });
  await p.waitForTimeout(800);
}
res.fehler = p.errs.slice(0, 20);
writeFileSync(OUT + 'ist_messung.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify({ renderer: res.renderer, darstellung: res.darstellung, welt: res.welt, kampf: res.kampf, fehler: res.fehler }, null, 1));
await env.close();
