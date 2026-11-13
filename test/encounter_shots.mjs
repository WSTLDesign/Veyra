// Bewegung – Sichtprüfung im Spiel:  node test/encounter_shots.mjs
// test/encounter_rustle.png (Gras raschelt vor der versteckten Begegnung), test/walk_ingame.png (Laufen in der Welt),
// Messung im echten Spiel: Standfuß-Gleiten je Frame (Spielfigur, Gehen + Rennen), Draw-Calls der Figur.
import { boot, scene } from './look_lib.mjs';
const { page, errs, close } = await boot({ w: 860, h: 484 });
await scene(page, 'route1', 9, 12, 12 * 60); await page.waitForTimeout(1200);
// 1) Laufen im Spiel + Gleit-Messung aus den Knochen (je Frame)
const meas = await page.evaluate(() => {
  // Deterministisch: Spielschritte von Hand (freeMove 1/60 s + draw3d), Rendern dabei ausgesetzt; Messung nach jedem Frame aus den Knochen
  const tmp = new THREE.Vector3(), r0 = R3.r.render, res = {}; R3.r.render = () => {}; let pn = 0; const pnow = performance.now.bind(performance); performance.now = () => pnow() + pn;
  try { for (const [lab, run, sy, sx] of [['gehen', false, -.55, 0], ['laufen', false, -1, 0], ['rennen', true, -1, 0], ['kurve', true, -1, .5]]) {
    if (typeof B !== 'undefined' && B) { try { endBattle('run'); } catch (e) { } } mode = 'world'; loadMap('route1', 9, 20); ROAM.list = []; ROAM.want = 0; ENC.calm = 1e15; P.ang = 0; P.v = 0; P.run = run; STICK.x = sx; STICK.y = sy; let prev = [null, null], max = 0, n = 0;
    for (let k = 0; k < 150; k++) { pn += 1000 / 60; freeMove(1000 / 60); if (mode !== 'world') break; draw3d(); const o = R3.player, G_ = o.userData.gait; o.updateMatrixWorld(true); const B = o.userData.rig.b;
      for (let i = 0; i < 2; i++) { const L = G_.legs[i]; tmp.set(0, -RIG.HA, (L.thc || 0) > 0 ? RIG.HEEL : -RIG.BALL).applyMatrix4(B[i ? 9 : 6].matrixWorld);
        if (L.on && k > 30 && G_.mode === 'ground' && G_.gb >= 1 && !MV.hop3) { if (prev[i]) { const d = Math.hypot(tmp.x - prev[i][0], tmp.z - prev[i][1]); if (d > max) max = d; n++; } prev[i] = [tmp.x, tmp.z]; } else prev[i] = null; } }
    res[lab] = { maxSlip: +max.toFixed(4), frames: n, v: +(R3.player.userData.gait.v).toFixed(2) }; STICK.x = 0; STICK.y = 0; P.run = false; }
  } finally { R3.r.render = r0; performance.now = pnow; }
  let meshes = 0; R3.player.traverse(q => { if (q.isMesh) meshes++; }); res.playerMeshes = meshes; ENC.calm = 0; loadMap('route1', 9, 12); return res;
});
console.log('Im Spiel:', JSON.stringify(meas));
await page.evaluate(() => { P.run = false; STICK.y = -1; }); await page.waitForTimeout(900);
await page.screenshot({ path: 'test/walk_ingame.png' }); await page.evaluate(() => { STICK.y = 0; });
// 2) Rascheln vor der Begegnung
await page.waitForTimeout(600);
await page.evaluate(() => { if (typeof B !== 'undefined' && B) { try { endBattle('run'); } catch (e) { } } mode = 'world'; ENC.calm = 1e15; });
await page.evaluate(() => { const g = (x, y) => cur.rows[y] && cur.rows[y][x] === '"' && !blocked(x, y); for (let y = 6; y < cur.h - 1; y++)for (let x = 7; x < cur.w - 6; x++)if (g(x, y) && g(x, y - 1) && g(x, y - 2) && g(x - 1, y - 1) && g(x + 1, y - 1) && !roamAt(x, y - 1)) { loadMap('route1', x, y); P.dir = 'up'; P.ang = 0; ROAM.list = []; ROAM.want = 0; ROAM.map = cur.id; return; } });
await page.waitForTimeout(1800);
await page.evaluate(() => { ENC.steps = 99; ENC.calm = 0; encWarn('grass', [61, 3]); clearTimeout(ENC.tm); ENC.pend.t0 = performance.now(); });
await page.waitForTimeout(420); await page.screenshot({ path: 'test/encounter_rustle.png' });
const st = await page.evaluate(() => { const p = ENC.pend && { ...ENC.pend }; encFire(); return { pend: p, mode }; });
console.log('Rascheln → Kampf:', JSON.stringify(st));
console.log(errs.length ? errs.join('\n') : 'keine Seitenfehler'); await close();
