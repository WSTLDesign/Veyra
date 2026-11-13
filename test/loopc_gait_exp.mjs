// Loop C – Rennen-Feinschliff: Parameterstudie GAIT_RUN (ein Chromium). node test/loopc_gait_exp.mjs '[{"bs":.07,"ea":0,"hd":0}, ...]'
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const sets = JSON.parse(process.argv[2] || '[{"bs":0.07,"ea":0,"hd":0}]');
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await page.goto(S.url + 'index.html', { waitUntil: 'load' });
await page.waitForFunction(() => typeof gaitTick === 'function' && typeof person3d === 'function' && window.THREE);
for (const ps of sets) {
  const r = await page.evaluate(ps => {
    Object.assign(GAIT_RUN, ps); terrainY = () => 0;
    const f = person3d('#e8623a', '#1f8a7a'); const B = () => f.userData.rig.b; let X = 0;
    const step = (v) => { X += -v / 60; f.position.set(X, 0, 0); f.rotation.y = Math.PI / 2; f.updateMatrixWorld(true); return gaitTick(f, 1 / 60); };
    const snap = () => { const o = []; for (const b of B()) { o.push(b.rotation.x, b.rotation.y, b.rotation.z, b.position.y); } return o; };
    const prof = t => t < .5 ? 0 : t < 1.5 ? 1.8 * (t - .5) : t < 3 ? 1.8 : t < 3.6 ? 1.8 + (7.5 - 1.8) * (t - 3) / .6 : t < 6 ? 7.5 : t < 6.4 ? 7.5 * (1 - (t - 6) / .4) : 0;
    let prev = null; const rows = []; const top = []; const cls = { bein: 0, fuss: 0, arm: 0, rumpf: 0 }; const cOf = b => [4, 5, 7, 8].includes(b) ? 'bein' : [6, 9].includes(b) ? 'fuss' : b >= 10 ? 'arm' : 'rumpf';
    for (let k = 0; k < 600; k++) { const t = k / 60; const g = step(prof(t)); const s = snap(); if (prev) { let m = 0, mi = -1; for (let i = 0; i < s.length; i++) { const d = Math.abs(s[i] - prev[i]); if (d > m) { m = d; mi = i; } } rows.push({ t, d: m }); if (t >= 3.7 && t < 6) for (let i = 0; i < s.length; i++) { const c = cOf(i >> 2); cls[c] = Math.max(cls[c], Math.abs(s[i] - prev[i])); }
      if (t > 3.7 && t < 6 && m > .5) top.push([+t.toFixed(3), 'b' + (mi >> 2) + 'xyzp'[mi & 3], +m.toFixed(2), g.legs.map(L => L.st + (L.st === 'swing' ? (L.s || 0).toFixed(2) + (L.set ? 'S' : '') : (L.thc || 0).toFixed(2)))]); } prev = s; }
    window.__top = top.slice(0, 14);
    const win = (a, b) => rows.filter(r => r.t >= a && r.t < b).reduce((m, r) => Math.max(m, r.d), 0);
    const tr = { stehen: win(0, .5), anlauf: win(.5, 1.5), gehen: win(1.5, 3), g2r: win(3, 3.7), rennen: win(3.7, 6), bremsen: win(6, 6.5), stand: win(6.5, 10) };
    // Gleiten Standfuß + Standphasen-Frames + Fersenhub beim Rennen
    const slip = {}; let stanceFr = 0, stanceN = 0;
    for (const [n, v] of [['gehen', 1.8], ['laufen', 3.75], ['rennen', 7.5]]) { const g0 = person3d('#e8623a', '#1f8a7a'); let x = 0, prv = [null, null], mx = 0; const Bq = g0.userData.rig.b, tmp = new THREE.Vector3(); let on = [0, 0], runs = [];
      for (let k = 0; k < 500; k++) { x += -v / 60; g0.position.set(x, 0, 0); g0.rotation.y = Math.PI / 2; const g = gaitTick(g0, 1 / 60); g0.updateMatrixWorld(true);
        for (let i = 0; i < 2; i++) { const L = g.legs[i], ft = Bq[i ? 9 : 6]; tmp.set(0, -RIG.HA, (L.thc || 0) > 0 ? RIG.HEEL : -RIG.BALL).applyMatrix4(ft.matrixWorld);
          if (L.on && k > 100) { if (prv[i]) mx = Math.max(mx, Math.hypot(tmp.x - prv[i][0], tmp.z - prv[i][1])); prv[i] = [tmp.x, tmp.z]; on[i]++; } else { if (on[i] && k > 100) runs.push(on[i]); on[i] = 0; prv[i] = null; } } }
      slip[n] = +mx.toFixed(4); if (n === 'rennen') { stanceFr = runs.reduce((a, b) => a + b, 0) / Math.max(1, runs.length); stanceN = runs.length; } }
    // Gehen-Knie (Standbein-Max) bei 1,8
    const g1 = person3d('#e8623a', '#1f8a7a'); let x1 = 0, kmax = -9, kmin = 9; const B1 = g1.userData.rig.b; for (let k = 0; k < 400; k++) { x1 += -1.8 / 60; g1.position.set(x1, 0, 0); g1.rotation.y = Math.PI / 2; gaitTick(g1, 1 / 60); if (k > 150) { kmax = Math.max(kmax, B1[5].rotation.x, B1[8].rotation.x); kmin = Math.min(kmin, B1[5].rotation.x, B1[8].rotation.x); } }
    const fx = v => +v.toFixed(3); for (const k in tr) tr[k] = fx(tr[k]);
    return { ps, tr, slip, stanceFr: fx(stanceFr), stanceN, kneeWalk: [fx(kmin), fx(kmax)], top: window.__top, cls: Object.fromEntries(Object.entries(cls).map(([k, v]) => [k, fx(v)])) };
  }, ps);
  console.log(JSON.stringify(r));
}
await browser.close(); S.close();
