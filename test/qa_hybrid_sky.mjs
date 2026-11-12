// QA Hybrid (Sonnet hoch) – Prüfpunkt 2: Himmel/Welt für alle 8 Regionen × Tag/Abend/Nacht, Stufen low/mid/high, Tageszeit-Überblendung, Horizont-Ring.
// Aufruf: node build.mjs && node test/qa_hybrid_sky.mjs [regionen,komma] → test/qa_hybrid_welt_<region>_<zeit>.png (860×484), test/qa_hybrid_blend_*.png, Ergebnis-JSON nach $QA_OUT (Standard: Systemtemp).
// Die Region wird über getMap('route1').region erzwungen (Testeingriff; skyRegion() liest m.region zuerst). Echte Karten der Regionen werden zusätzlich in qa_hybrid_welt_karten geprüft.
import { boot, scene } from './look_lib.mjs';
import { writeFileSync } from 'fs';
const sceneA = async (...a) => { await scene(...a); await a[0].evaluate(() => { try { skyAttach(R3.scene, cur); } catch (e) { } }); };
import { tmpdir } from 'os';
const OUT = process.env.QA_OUT || (tmpdir() + '/qa_hybrid_sky.json');
const REG = ['lichtlande', 'smaragdwald', 'flutkueste', 'glutlande', 'kristallgebirge', 'frosttundra', 'himmelsweiten', 'schattenmoor'];
const only = (process.argv[2] || '').split(',').filter(Boolean);
const TIMES = { tag: 720, abend: 1125, nacht: 1380 };
const R = { welt: [], stufen: [], blend: [], ring: [], errs: [] };
const png = n => new URL(`./qa_hybrid_${n}.png`, import.meta.url).pathname;
const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } });
const { page } = B;
await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; });
const snap = () => page.evaluate(() => {
  const S = R3 && R3.scene, D = SKY3.domes, ia = SKY3.a;
  const cacheStates = [...SKY3.cache.values()].map(e => e.key + ':' + e.state + (e.ck.endsWith('@lo') ? '(lo)' : ''));
  const bl = skyBlend(G.time / 60);
  return { region: SKY3.region, active: skyActive(), on: SKY3.on, fade: +SKY3.fade.toFixed(2), domeA: D[0].visible, domeB: D[1].visible, ring: SKY3.ring.visible, ringTex: !!SKY3.ring.material.uniforms.uTex.value, rays: SKY3.rays.visible,
    sea: SKY3.sea.visible, env: !!(S && S.environment), pm: !!SKY3.pmRT, calls: R3.r.info.render.calls, tex: R3.r.info.memory.textures, cache: cacheStates, bl, time: skyTime(G.time / 60),
    sd: SKY3.sd ? [+SKY3.sd.x.toFixed(3), +SKY3.sd.y.toFixed(3), +SKY3.sd.z.toFixed(3)] : null, sdOn: SKY3.sdOn, fog: S && S.fog ? S.fog.color.getHexString() : null, hemi: R3.hemi.color.getHexString(), sunI: +R3.sun.intensity.toFixed(2), sunCol: R3.sun.color.getHexString(),
    sunPos: [+R3.sun.position.x.toFixed(1), +R3.sun.position.y.toFixed(1), +R3.sun.position.z.toFixed(1)], tgt: [+R3.sun.target.position.x.toFixed(1), +R3.sun.target.position.y.toFixed(1), +R3.sun.target.position.z.toFixed(1)],
    mtnHidden: (S.userData.skyMtn || []).every(o => !o.visible), mtnN: (S.userData.skyMtn || []).length, tier: PERF.tier, shadowMap: !!R3.r.shadowMap.enabled };
});
const shot = async (name, wait = 3000) => { await page.waitForTimeout(wait); const f = png(name); await page.screenshot({ path: f, timeout: 180000 }); return f; };

// ---------- 1) 8 Regionen × 3 Zeiten ----------
for (const reg of REG) {
  if (only.length && !only.includes(reg)) continue;
  for (const tz of Object.keys(TIMES)) {
    await page.evaluate(([r]) => { getMap('route1').region = r; }, [reg]);
    await sceneA(page, 'route1', 9, 12, TIMES[tz]);
    await page.evaluate(() => { P.dir = 'up'; P.ang = YAW[P.dir]; R3.yaw = P.ang; R3.snap = 1; mode = 'wait'; });// Uhr anhalten
    const ok = await page.waitForFunction(() => skyActive(), null, { timeout: 90000 }).then(() => true, () => false);
    await shot(`welt_${reg}_${tz}`, 2500);
    const s = await snap(); s.reg = reg; s.tz = tz; s.skyOk = ok; R.welt.push(s);
    console.log(reg, tz, JSON.stringify({ ok, region: s.region, time: s.time, active: s.active, ring: s.ring, rays: s.rays, sea: s.sea, pm: s.pm, calls: s.calls, tex: s.tex, mtnHidden: s.mtnHidden }));
  }
}

// ---------- 2) Stufen low/mid/high (Lichtlande/Himmelsweiten, Tag + Abend) ----------
for (const reg of ['lichtlande', 'himmelsweiten']) for (const tier of ['low', 'mid', 'high']) {
  await page.evaluate(([r, t]) => { getMap('route1').region = r; SET.gfx = t; perfStart(); PERF.tier = t; w3Quality(); }, [reg, tier]);
  await sceneA(page, 'route1', 9, 12, TIMES.abend);
  await page.evaluate(() => { mode = 'wait'; });
  const ok = await page.waitForFunction(() => skyActive(), null, { timeout: 90000 }).then(() => true, () => false);
  await shot(`stufe_${reg}_${tier}`, 3500);
  const s = await snap(); s.reg = reg; s.want = tier; s.skyOk = ok; R.stufen.push(s);
  console.log('stufe', reg, tier, JSON.stringify({ ok, tier: s.tier, pm: s.pm, env: s.env, rays: s.rays, sea: s.sea, calls: s.calls, cache: s.cache.filter(c => c.includes('sky_')) }));
}
await page.evaluate(() => { SET.gfx = 'high'; perfStart(); PERF.tier = 'high'; w3Quality(); });

// ---------- 3) Tageszeit-Überblendung ohne Sprung: Frames im Abstand von 2 Spielminuten über die vier Übergangsfenster ----------
const diffImgs = async (a, b) => page.evaluate(async ([a, b]) => { const L = async s => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement('canvas'); c.width = 215; c.height = 121; const x = c.getContext('2d'); x.drawImage(i, 0, 0, 215, 121); return x.getImageData(0, 0, 215, 121).data; }; const A = await L(a), Bd = await L(b); let s = 0, mx = 0; for (let i = 0; i < A.length; i += 4) { const d = (Math.abs(A[i] - Bd[i]) + Math.abs(A[i + 1] - Bd[i + 1]) + Math.abs(A[i + 2] - Bd[i + 2])) / 3; s += d; if (d > mx) mx = d; } return { mean: +(s / (A.length / 4)).toFixed(3), max: +mx.toFixed(0) }; }, [a, b]);
const WIN = { 'nacht>abend 4:45-5:45': [270, 360], 'abend>tag 6:45-8:00': [400, 495], 'tag>abend 16:45-18:00': [1000, 1090], 'abend>nacht 19:30-20:45': [1160, 1255] };
await page.evaluate(() => { getMap('route1').region = 'lichtlande'; });
await sceneA(page, 'route1', 9, 12, 270); await page.evaluate(() => { mode = 'wait'; P.dir = 'up'; R3.yaw = P.ang = YAW.up; R3.snap = 1; });
await page.waitForFunction(() => skyActive(), null, { timeout: 90000 }).catch(() => { });
for (const [nm, [t0, t1]] of Object.entries(WIN)) {
  let prev = null, rows = [];
  for (let t = t0; t <= t1; t += 5) {
    await page.evaluate(t => { G.time = t; }, t); await page.waitForTimeout(1800);
    const b64 = (await page.screenshot({ timeout: 180000 })).toString('base64'), url = 'data:image/png;base64,' + b64;
    if (prev) { const d = await diffImgs(prev, url); const e = await page.evaluate(() => ({ k: +skyBlend(G.time / 60).k.toFixed(2), a: skyBlend(G.time / 60).a, b: skyBlend(G.time / 60).b, yawA: +SKY3.domes[0].material.uniforms.uYaw.value.toFixed(2), op: +SKY3.domes[1].material.uniforms.uOp.value.toFixed(2) })); rows.push({ t, ...d, ...e }); }
    prev = url;
    if (t === t0 || t === t1 || t === Math.round((t0 + t1) / 10) * 5) await page.screenshot({ path: png(`blend_${nm.split(' ')[0].replace('>', '_')}_${Math.floor(t / 60)}h${String(t % 60).padStart(2, '0')}`), timeout: 180000 });
  }
  R.blend.push({ win: nm, rows }); const means = rows.map(r => r.mean), med = [...means].sort((a, b) => a - b)[Math.floor(means.length / 2)];
  console.log('blend', nm, 'Schritte', rows.length, 'mean-diff med', med.toFixed(2), 'max', Math.max(...means).toFixed(2), 'maxpx', Math.max(...rows.map(r => r.max)));
}
// Kurz vor/nach exakten Planknoten (±1 min): 8:00, 16:45, 18:00, 19:30, 20:45, 4:45, 5:45, 6:45
for (const k of [285, 345, 405, 480, 1005, 1080, 1170, 1245]) {
  const a = await (async () => { await page.evaluate(t => { G.time = t; }, k - 1); await page.waitForTimeout(1800); return 'data:image/png;base64,' + (await page.screenshot({ timeout: 180000 })).toString('base64'); })();
  const b = await (async () => { await page.evaluate(t => { G.time = t; }, k + 1); await page.waitForTimeout(1800); return 'data:image/png;base64,' + (await page.screenshot({ timeout: 180000 })).toString('base64'); })();
  const d = await diffImgs(a, b); R.blend.push({ knoten: k, ...d }); console.log('knoten', Math.floor(k / 60) + ':' + String(k % 60).padStart(2, '0'), '±1min', JSON.stringify(d));
}

// ---------- 4) Horizont-Ring & Himmel: Blickrichtungen (Naht/Lücken), Lichtlande + Flutküste Tag ----------
for (const reg of ['flutkueste', 'schattenmoor']) {
  await page.evaluate(r => { getMap('route1').region = r; }, reg); await sceneA(page, 'route1', 9, 12, 720); await page.evaluate(() => { mode = 'wait'; });
  await page.waitForFunction(() => skyActive(), null, { timeout: 90000 }).catch(() => { });
  for (const deg of [0, 90, 180, 270]) {
    await page.evaluate(d => { R3.yaw = d * Math.PI / 180; R3.snap = 1; }, deg); await shot(`ring_${reg}_${deg}`, 2500);
    const ph = await page.evaluate(() => ({ yaw: R3.yaw, ring: SKY3.ring.visible, ringYaw: SKY3.ringYaw })); R.ring.push({ reg, deg, ...ph });
  }
}
R.errs = B.errs; console.log('Konsolenfehler:', B.errs.length, B.errs.slice(0, 5));
writeFileSync(OUT, JSON.stringify(R, null, 1)); await B.close();
