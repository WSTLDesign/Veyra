// QA Hybrid (Sonnet hoch) – Prüfpunkt 2 (Naht am Equirect-Rand in der Welt) + 10 (Stufe low ohne PMREM, _lo-Bilder), frische Sitzungen.
// Aufruf: node build.mjs && node test/qa_hybrid_low.mjs → ✓/✗ auf stdout, Screenshots test/qa_hybrid_naht_<region>_<winkel>.png
import { boot, scene } from './look_lib.mjs';
const png = n => new URL(`./qa_hybrid_${n}.png`, import.meta.url).pathname;
let fails = 0; const ok = (n, c, d = '') => { if (!c) fails++; console.log((c ? '✓ ' : '✗ ') + n + (d ? '  [' + d + ']' : '')); };
// ---------- A) Stufe low, frisch: kein PMREM, _lo-Texturen, keine Strahlen ----------
{
  const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'low', fps: 0, hudDim: 'aus' } }), { page } = B;
  await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; window.VEYRA_DEMO = 0; });
  await scene(page, 'route1', 9, 12, 720); await page.waitForFunction(() => skyActive(), null, { timeout: 90000 }).catch(() => { }); await page.waitForTimeout(4000);
  const s = await page.evaluate(() => ({ tier: PERF.tier, active: skyActive(), pm: !!SKY3.pm, pmRT: !!SKY3.pmRT, env: !!R3.scene.environment, cache: [...SKY3.cache.values()].map(e => e.key + ':' + e.state + (e.ck.endsWith('@lo') ? '(lo)' : '(voll)')), rays: SKY3.rays.visible, sea: SKY3.sea.visible, calls: R3.r.info.render.calls, tex: R3.r.info.memory.textures }));
  ok('L1 Stufe low (frisch): Skybox aktiv, kein PMREMGenerator, keine Umgebungskarte', s.tier === 'low' && s.active && !s.pm && !s.pmRT && !s.env, JSON.stringify(s));
  ok('L2 Stufe low: nur _lo-Texturen, keine Sonnenstrahlen, kein Dunstteppich (normale Karte)', s.cache.length > 0 && s.cache.every(c => c.includes('(lo)')) && !s.rays && !s.sea, JSON.stringify(s.cache));
  await page.evaluate(() => { startBattle({ wild: mk(25, 8) }); }); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }); await page.waitForTimeout(2000);
  const b = await page.evaluate(() => ({ on: HYB.on, src: HYB.cur && HYB.cur.src, calls: BT.r.info.render.calls }));
  ok('L3 Stufe low: Kampfbild _lo', b.on && /_lo\.webp/.test(b.src || ''), JSON.stringify(b)); await page.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; });
  ok('L4 low: keine Konsolenfehler', B.errs.length === 0, B.errs.slice(0, 3).join(' | ')); await B.close();
}
// ---------- B) Naht: 12 Blickrichtungen, Spalten-Sprünge im Himmelsbereich (HUD-Spalten links 110 px / rechts 130 px ausgenommen: Uhr, Karte, Vollbild) ----------
{
  const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } }), { page } = B;
  await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; });
  const seam = async b64 => page.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const W = img.width, H = img.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const y1 = Math.round(H * .26), D = x.getImageData(0, 0, W, y1).data; const col = new Float32Array(W); for (let c = 111; c < W - 130; c++) { let s = 0; for (let r = 0; r < y1; r++) { const i = (r * W + c) * 4, j = (r * W + c - 1) * 4; s += (Math.abs(D[i] - D[j]) + Math.abs(D[i + 1] - D[j + 1]) + Math.abs(D[i + 2] - D[j + 2])) / 3; } col[c] = s / y1; }
    const sorted = [...col].slice(111, W - 130).sort((a, b) => a - b), med = sorted[sorted.length >> 1], mx = Math.max(...col.slice(111, W - 130)), at = col.indexOf(mx); return { med: +med.toFixed(3), max: +mx.toFixed(2), at, ratio: +(mx / Math.max(.05, med)).toFixed(1) }; }, b64);
  for (const reg of ['lichtlande', 'flutkueste', 'himmelsweiten']) {
    await page.evaluate(r => { getMap('route1').region = r; }, reg); await scene(page, 'route1', 9, 12, 720); await page.evaluate(() => { skyAttach(R3.scene, cur); mode = 'wait'; });
    await page.waitForFunction(() => skyActive(), null, { timeout: 90000 }).catch(() => { });
    const res = [];
    for (let a = 0; a < 360; a += 30) {
      await page.evaluate(a => { const r = a * Math.PI / 180; P.ang = r; R3.yaw = r; R3.snap = 1; if (window.INP && INP.camReset) INP.camReset(); }, a); await page.waitForTimeout(1600);
      const png64 = (await page.screenshot({ path: a % 90 === 0 ? png(`naht_${reg}_${a}`) : undefined, timeout: 180000 })).toString('base64'); const r = await seam(png64), yaw = await page.evaluate(() => +R3.yaw.toFixed(2)); res.push({ a, yaw, ...r });
    }
    const worst = res.reduce((m, r) => r.ratio > m.ratio ? r : m, res[0]); console.log(reg, 'Spalten-Sprünge im Himmel (Verhältnis max/Median):', res.map(r => r.a + '°:' + r.ratio).join(' '));
    ok(`N1 ${reg}: keine senkrechte Naht im Himmel in 12 Blickrichtungen (Spaltensprung ≤ 12× Median)`, worst.ratio <= 12 && new Set(res.map(r => r.yaw)).size > 6, JSON.stringify({ worst, yaws: res.map(r => r.yaw).join(',') }));
  }
  ok('N2 keine Konsolenfehler', B.errs.length === 0, B.errs.slice(0, 3).join(' | ')); await B.close();
}
console.log(`\nFails: ${fails}`); process.exit(fails ? 1 : 0);
