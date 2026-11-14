// Stabilität R2 – Messreihe „Wackeln beim Laufen“ (im Spiel ausgeführt, über page.evaluate(WACKEL, [deckel, zusatzMs, breite, höhe])).
// Simuliert ein 60-Hz-Handy: Zeitstempel alle 16,67 ms (±0,3 ms), das Spiel entscheidet selbst (Deckel/Wachhund), ob es zeichnet. Die Welt ist dabei
// ausgeblendet (Kamera-/Bewegungslogik hängt nur an Kacheln/Gelände, nicht an Meshes), damit SwiftShader nicht bremst. Längste gerade freie Strecke der Karte,
// je 3 s Gehen (1,3 s Rennen, damit der Kartenrand nicht erreicht wird) bei voller Geschwindigkeit: Heldin/Kamera quer zur Geraden (Felder), Kamera-Höhe/-Abstand/-Seitversatz (Streuung), Tempo-Gleichmäßigkeit.
export const WACKEL = async ([cap, cost, DEVW, DEVH]) => {
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 300));
    // Welt ausblenden (Spielfigur bleibt)
    const hid = []; for (const o of R3.scene.children) if (o.visible && o !== R3.player && !o.isLight) { o.visible = false; hid.push(o); }
    const keep = R3.scene.onBeforeRender; const rec = []; let on = false;
    R3.scene.onBeforeRender = (rr, sc, c) => { keep && keep(rr, sc, c); if (on && c && c.isPerspectiveCamera) { const up = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quaternion), fw = new THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion);
      const sp = R3.player.position.clone().add(new THREE.Vector3(0, .9, 0)).project(c); rec.push([T, P.px, P.py, c.position.x, c.position.y, c.position.z, Math.atan2(up.x * fw.z - up.z * fw.x, up.y), sp.x, sp.y, R3.side || 0, R3.cd || 0, R3.sp || 0, P.v || 0]); } };
    // längste gerade freie Strecke der Karte suchen (Zeile oder Spalte) und an ihren Anfang stellen
    const ok = (x, y) => { const t = tileAt(cur, x, y); return t !== null && !SOLID.has(t) && !blocked(x, y) && !cur.doors[t] && t !== 'E' && t !== 'R' && x > 0 && y > 0 && x < cur.w - 1 && y < cur.h - 1 && (typeof pass3 !== 'function' || pass3(x, y)); };
    let best = null; for (let y = 1; y < cur.h - 1; y++) { let r = 0; for (let x = 1; x < cur.w; x++) { if (ok(x, y)) r++; else { if (!best || r > best.n) best = { n: r, x: x - 1, y, dir: 'left' }; r = 0; } } }
    for (let x = 1; x < cur.w - 1; x++) { let r = 0; for (let y = 1; y < cur.h; y++) { if (ok(x, y)) r++; else { if (!best || r > best.n) best = { n: r, x, y: y - 1, dir: 'up' }; r = 0; } } }
    const dir = best.dir; P.x = P.fx = best.x; P.y = P.fy = best.y; P.px = best.x; P.py = best.y; G.px = best.x; G.py = best.y; P.moving = false;
    STAB.work = 0; STAB.spikes.length = 0; STAB.emerg = 0; STAB.cap = cap === 60 ? 0 : 30; STAB.cap0 = STAB.cap; STAB.grace = 0; STAB.win.n = STAB.win.sum = 0; STAB.win.t0 = 0; STAB.lr = 0; SET.fps = 60;
    P.dir = dir; P.ang = YAW[dir]; R3.yaw = P.ang; R3.snap = 1; try { const C = typeof CAM === 'object' ? CAM : null; if (C) C.yaw = P.ang; } catch (e) { }
    let T = performance.now(); const step = async (n, extra) => { for (let i = 0; i < n; i++) { T += 16.667 + (Math.random() - .5) * .6; STAB.lt = -1; loop(T); if (extra) { const e = performance.now() + extra; while (performance.now() < e) { } } if (i % 30 === 0) await new Promise(r => setTimeout(r, 0)); } };
    STAB.inLoop = 0; await step(30);
    const out = {};
    for (const [st, run] of [['gehen', false], ['rennen', true]]) {
      P.state = run ? 'run' : 'walk'; P.run = run; STICK.x = 0; STICK.y = -1; await step(40); rec.length = 0; on = true; await step(run ? 80 : 180, cost); on = false; STICK.y = 0; await step(40);
      // Auswertung: nur Bilder mit voller Geschwindigkeit
      const R = rec.filter(r => Math.abs(r[12]) > (run ? 4.5 : 1.7)); const n = R.length; if (n < 10) { out[st] = { n, roh: rec.length, mode, vmax: Math.max(0, ...rec.map(r => Math.abs(r[12]))), stab: stabInfo().log.slice(-4), lade: typeof LADEN === 'object' ? LADEN.active : null }; continue; }
      const fit = (ix, iy) => { // Gerade durch die Punkte (Hauptachse), Abweichung senkrecht dazu
        const mx = R.reduce((a, r) => a + r[ix], 0) / n, my = R.reduce((a, r) => a + r[iy], 0) / n; let sxx = 0, sxy = 0, syy = 0; for (const r of R) { const dx = r[ix] - mx, dy = r[iy] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
        const a = .5 * Math.atan2(2 * sxy, sxx - syy), nx = -Math.sin(a), ny = Math.cos(a); const d = R.map(r => (r[ix] - mx) * nx + (r[iy] - my) * ny); return { rms: Math.sqrt(d.reduce((s, v) => s + v * v, 0) / n), max: Math.max(...d.map(Math.abs)) }; };
      const hs = fit(1, 2), cs = fit(3, 5);
      // Gleichmäßigkeit: Weg je Bild / Zeit je Bild (Variationskoeffizient), Kamera ebenso; Kamera-Höhe, Rollwinkel, Bildschirmposition der Figur
      const v = [], cv = [], jy = [], jx = []; for (let i = 1; i < n; i++) { const dt = (R[i][0] - R[i - 1][0]) / 1000; v.push(Math.hypot(R[i][1] - R[i - 1][1], R[i][2] - R[i - 1][2]) / dt); cv.push(Math.hypot(R[i][3] - R[i - 1][3], R[i][5] - R[i - 1][5]) / dt); }
      for (let i = 1; i < n - 1; i++) { jx.push(Math.abs(R[i][7] - (R[i - 1][7] + R[i + 1][7]) / 2)); jy.push(Math.abs(R[i][8] - (R[i - 1][8] + R[i + 1][8]) / 2)); }
      const m = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const q = m(a); return Math.sqrt(m(a.map(x => (x - q) ** 2))); }, iv = []; for (let i = 1; i < n; i++) iv.push(R[i][0] - R[i - 1][0]);
      let flips = 0; for (let i = 1; i < n; i++) if (R[i][9] !== R[i - 1][9]) flips++;
      out[st] = { strecke: best.n + ' Felder ' + dir, deckel: stabCap(), n, bilderAbstand: +m(iv).toFixed(1), abstandSd: +sd(iv).toFixed(1), heldinQuer: +hs.rms.toFixed(4), heldinQuerMax: +hs.max.toFixed(4), kameraQuer: +cs.rms.toFixed(4), kameraQuerMax: +cs.max.toFixed(4),
        kameraHoeheSd: +sd(R.map(r => r[4])).toFixed(4), rollMaxGrad: +(Math.max(...R.map(r => Math.abs(r[6]))) * 57.3).toFixed(2), tempoCV: +(sd(v) / m(v)).toFixed(3), kameraTempoCV: +(sd(cv) / m(cv)).toFixed(3),
        figurRuckelPx: +(m(jx) * DEVW / 2).toFixed(2), figurRuckelPxY: +(m(jy) * DEVH / 2).toFixed(2), schulterWechsel: flips, kamAbstandSd: +sd(R.map(r => r[10])).toFixed(3), seitSd: +sd(R.map(r => r[11])).toFixed(3) };
    }
    for (const o of hid) o.visible = true; R3.scene.onBeforeRender = keep; window.requestAnimationFrame = raf; raf(loop); return out;
  };
