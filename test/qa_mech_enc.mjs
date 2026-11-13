// QA Mechanik – Prüfpunkt 4: versteckte Begegnungen (Gras, Schwimmen, Angeln), Roamer, Wasser-Arten, Smoke „Route 1 & wilde Kreaturen“ 3×.
//   node test/qa_mech_enc.mjs     Bilder: test/qa_mech_enc_*.png
import { start, page, newGame, goMap, reporter, here } from './qa_mech_lib.mjs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_enc.log', 'QA Mechanik Begegnungen');
const env = await start();
const p = await page(env, { flags: { VEYRA_ENC: 1 } });
await newGame(p, { team: [[1, 12], [25, 10]], view: '2d' });
const ev = (f, a) => p.evaluate(f, a);
const grassAt = (map) => ev(m => { loadMap(m, 9, 12); mode = 'world'; for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) if (cur.rows[y][x] === '"' && !blocked(x, y) && cur.rows[y][x + 1] === '"') { P.x = P.px = x; P.y = P.py = y; P.dir = 'right'; return [x, y]; } }, map);
// ---- 1) Raten über 300 Schritte (Hook onStep → moveEncounter, echte Reihenfolge), leicht/normal, je 24 Wiederholungen
await ev(() => { window.QA = { cnt: 0 }; QA.sb = startBattle; QA.setup = () => { startBattle = function (o) { QA.cnt++; QA.last = o; ENC.inB = 0; ENC.pend = null; mode = 'world'; }; }; QA.restore = () => { startBattle = QA.sb; };
  // Loop-C-QA 12.11.: grassAmbush existiert nicht mehr. amb=true lässt ROAM.tiles unverändert (Beweis: kein zweites System feuert, amh bleibt 0); false: ROAM.tiles geleert
  QA.run = (diff, n, run, amb) => { if (typeof B !== 'undefined' && B) { try { endBattle('run'); } catch (e) { } } SET.diff = diff; MV.rw = !!run; QA.setup(); const rt = ROAM.tiles; if (!amb) ROAM.tiles = []; let hits = 0, amh = 0, last = -1, minGap = 99; ENC.steps = 99; ENC.calm = 0; ENC.pend = null; mode = 'world';
    for (let i = 0; i < n; i++) { onStep(); let any = false; if (ENC.pend) { hits++; any = true; clearTimeout(ENC.tm); encFire(); } else if (mode === 'wait') { amh++; any = true; mode = 'world'; }
      if (any) { if (last >= 0) minGap = Math.min(minGap, i - last); last = i; ENC.calm = 0; } } ROAM.tiles = rt; return { hits, amh, minGap }; }; });
await grassAt('route1');
const stats = {};
for (const [diff, run, amb] of [['leicht', 0, 0], ['normal', 0, 0], ['leicht', 1, 0], ['normal', 1, 0], ['leicht', 0, 1], ['normal', 0, 1]]) {
  const hs = [], ams = []; let mg = 99; for (let k = 0; k < 24; k++) { const r = await ev(([d, n, ru, am]) => QA.run(d, n, ru, am), [diff, 300, run, amb]); hs.push(r.hits + r.amh); ams.push(r.amh); mg = Math.min(mg, r.minGap); }
  const mean = hs.reduce((a, b) => a + b, 0) / hs.length, sd = Math.sqrt(hs.reduce((a, b) => a + (b - mean) ** 2, 0) / hs.length);
  stats[diff + (run ? '_rennen' : '') + (amb ? '_gesamt' : '')] = { rate: +(mean / 3).toFixed(2), ambushAnteil: +(ams.reduce((a, b) => a + b, 0) / ams.length / 3).toFixed(2), sd: +(sd / 3).toFixed(2), min: +(Math.min(...hs) / 3).toFixed(1), max: +(Math.max(...hs) / 3).toFixed(1), minGap: mg };
}
R.note('Raten je 300 Schritte (24 Läufe), % je Schritt: ' + JSON.stringify(stats));
R.t('1 Rate leicht (Gehen) ≈ 5 % ± 2 über 300 Schritte (Mittel 24 Läufe; Soll nach QA-Nachbesserung)', stats.leicht.rate >= 3 && stats.leicht.rate <= 7, stats.leicht);
R.t('1 Rate normal (Gehen) ≈ 7 % ± 2 über 300 Schritte (Mittel 24 Läufe; Soll nach QA-Nachbesserung)', stats.normal.rate >= 5 && stats.normal.rate <= 9, stats.normal);
R.t('1 Rennen erhöht die Rate (leicht/normal)', stats.leicht_rennen.rate > stats.leicht.rate && stats.normal_rennen.rate > stats.normal.rate, stats);
R.t('1 Mindestabstand (nur moveEncounter): nie weniger als 4 Schritte zwischen zwei Begegnungen', stats.leicht.minGap >= 4 && stats.normal.minGap >= 4 && stats.normal_rennen.minGap >= 4, stats);
R.t('1 GESAMT-Rate (ROAM.tiles intakt, einziges Gras-System moveEncounter) leicht ≈ 5 % ± 2, Anteil fremder Auslöser 0', stats.leicht_gesamt.rate >= 3 && stats.leicht_gesamt.rate <= 7 && stats.leicht_gesamt.ambushAnteil === 0, stats.leicht_gesamt);
R.t('1 GESAMT-Rate (ROAM.tiles intakt, einziges Gras-System moveEncounter) normal ≈ 7 % ± 2, Anteil fremder Auslöser 0', stats.normal_gesamt.rate >= 5 && stats.normal_gesamt.rate <= 9 && stats.normal_gesamt.ambushAnteil === 0, stats.normal_gesamt);
R.t('1 Mindestabstand gesamt (ROAM.tiles intakt) ≥ 4 Schritte', stats.leicht_gesamt.minGap >= 4 && stats.normal_gesamt.minGap >= 4, { l: stats.leicht_gesamt.minGap, n: stats.normal_gesamt.minGap });
// Einzelläufe sichtbar machen (eine Stichprobe wie sie ein Tester erlebt)
await p.waitForTimeout(800); await ev(() => { QA.restore(); if (typeof B !== 'undefined' && B) { try { endBattle('run'); } catch (e) { } } mode = 'world'; });
await ev(() => QA.setup()); const samples = []; for (let k = 0; k < 5; k++) samples.push((await ev(([n]) => QA.run('leicht', n, 0, 0), [300])).hits); await ev(() => QA.restore()); R.note('Stichproben leicht (300 Schritte, Anzahl Begegnungen): ' + samples.join(', '));
// ---- 2) Vorwarnung, Dauer, Ton/Vibration, Art aus enc, Tag/Nacht
const w = await ev(async () => { SET.diff = 'leicht'; ENC.steps = 99; ENC.calm = 0; ENC.pend = null; mode = 'world'; const log = { sfx: [], vib: 0, toast: [] }; const s0 = sfx, v0 = vib; sfx = (n) => { log.sfx.push(n); }; vib = () => { log.vib++; };
  const R0 = Math.random; Math.random = () => 0; const t0 = performance.now(); onStep(); Math.random = R0; log.pend = ENC.pend && { kind: ENC.pend.kind, s: ENC.pend.s, l: ENC.pend.l, dur: ENC.pend.dur }; log.mode = mode; log.heldNull = held == null; log.walk = P.walk;
  log.inEnc = cur.enc.day.concat(cur.enc.night).some(e => e[0] === ENC.pend.s); let started = null; const sb = startBattle; startBattle = function (o) { started = performance.now() - t0; QA.last = o; ENC.inB = 0; mode = 'world'; };
  await new Promise(r => setTimeout(r, 1000)); startBattle = sb; sfx = s0; vib = v0; log.fireAt = started && Math.round(started); log.mode2 = mode; return log; });
R.note('Vorwarnung: ' + JSON.stringify(w)); R.t('2 Vorwarnung: Figur bleibt stehen (mode wait), Art aus enc-Liste, Rascheln-Ton + Vibration', w.pend && w.pend.kind === 'grass' && w.mode === 'wait' && w.inEnc && w.sfx.includes('rustle') && w.vib >= 1, w);
R.t('2 Kampf startet nach 0,6–0,9 s (Vorwarnung 0,7 s)', w.fireAt >= 600 && w.fireAt <= 900, w);
// Vorwarnung sichtbar: 2D- und 3D-Bild (Warnung einfrieren)
for (const vw of ['2d', 'third']) {
  await ev(async v => { setView(v, 1); await new Promise(r => setTimeout(r, 600)); loadMap('route1', 9, 12); mode = 'world'; for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) if (cur.rows[y][x] === '"' && cur.rows[y][x + 1] === '"' && !blocked(x, y) && !blocked(x + 1, y)) { P.x = P.px = x; P.y = P.py = y; P.dir = 'right'; P.ang = YAW ? YAW.right : P.ang; y = 99; break; }
    ROAM.list = []; ENC.steps = 99; ENC.calm = 0; ENC.pend = null; const R0 = Math.random; Math.random = () => 0; onStep(); Math.random = R0; clearTimeout(ENC.tm); await new Promise(r => setTimeout(r, 900)); }, vw);
  const st = await ev(() => ({ pend: !!ENC.pend, mode, kind: ENC.pend && ENC.pend.kind }));
  await p.screenshot({ path: here(`qa_mech_enc_warn_${vw === '2d' ? '2d' : '3d'}.png`) }); R.t(`2 Vorwarnung eingefroren (${vw}): Zustand pend/wait`, st.pend && st.mode === 'wait', st);
  await ev(() => { ENC.pend = null; mode = 'world'; ENC.steps = 99; });
}
// ---- 3) Schonzeit 3 s nach Kampf (echter startBattle/endBattle), nicht im Dialog, Mindestabstand 4 Schritte (echte Reihenfolge)
await ev(() => { setView('2d', 1); });
const calm = await ev(async () => { loadMap('route1', 9, 12); mode = 'world'; for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) if (cur.rows[y][x] === '"') { P.x = P.px = x; P.y = P.py = y; y = 99; break; }
  ROAM.list = []; ENC.steps = 99; ENC.calm = 0; ENC.pend = null; const out = {}; const R0 = Math.random; Math.random = () => 0;
  startBattle({ wild: mk(59, 3) }); await new Promise(r => setTimeout(r, 600)); out.battle = !!B; try { endBattle('run'); } catch (e) { out.err = String(e); } await new Promise(r => setTimeout(r, 900)); out.mode = mode;
  QA.setup(); ENC.steps = 99; onStep(); out.afterEnd = !!ENC.pend; out.afterEndAmbush = !ENC.pend && mode === 'wait'; clearTimeout(ENC.tm); ENC.pend = null; mode = 'world'; const c0 = ENC.calm - performance.now(); out.calmLeft = Math.round(c0);
  await new Promise(r => setTimeout(r, Math.max(0, c0) + 150)); ENC.steps = 99; ENC.pend = null; mode = 'world'; const rt0 = ROAM.tiles; ROAM.tiles = []; onStep(); ROAM.tiles = rt0; out.after3s = !!ENC.pend; clearTimeout(ENC.tm); ENC.pend = null; mode = 'world';
  // Dialog
  ENC.steps = 99; ENC.calm = 0; mode = 'dialog'; onStep(); out.dialog = !!ENC.pend; ENC.pend = null; mode = 'menu'; ENC.steps = 99; onStep(); out.menu = !!ENC.pend; ENC.pend = null; mode = 'world';
  // Mindestabstand in echter Schrittfolge
  const rt1 = ROAM.tiles; ROAM.tiles = []; ENC.steps = 99; ENC.calm = 0; onStep(); const a = !!ENC.pend; clearTimeout(ENC.tm); ENC.pend = null; mode = 'world'; const res = []; for (let i = 0; i < 6; i++) { onStep(); res.push(!!ENC.pend); if (ENC.pend) { clearTimeout(ENC.tm); ENC.pend = null; mode = 'world'; break; } } out.first = a; out.seq = res; ROAM.tiles = rt1;
  Math.random = R0; QA.restore(); return out; });
R.note('Schonzeit/Abstand: ' + JSON.stringify(calm));
R.t('3 Schonzeit: direkt nach dem Kampf keine Begegnung (Rest ≈ 3 s), nach 3 s wieder möglich', calm.battle && calm.mode === 'world' && !calm.afterEnd && calm.calmLeft > 1500 && calm.calmLeft <= 3000 && calm.after3s, calm);
R.t('3 kein zweites Gras-System (grassAmbush entfernt): direkt nach dem Kampf weder Begegnung noch Wartephase', !calm.afterEndAmbush && !calm.afterEnd, calm);
R.t('3 Nicht im Dialog/Menü', !calm.dialog && !calm.menu, calm);
R.t('3 Mindestabstand: nach einer Begegnung erst der 4. Schritt wieder möglich (Folge [f,f,f,t])', calm.first && calm.seq.length === 4 && calm.seq.slice(0, 3).every(x => !x) && calm.seq[3] === true, calm);
// ---- 4) Roamer: sichtbar (Liste + 3D-Meshes) und antippbar (Kapsel-Wurf INP.throwAt → Kampf)
const ro = await ev(async () => { setView('third', 1); await new Promise(r => setTimeout(r, 1500)); loadMap('route1', 9, 20); mode = 'world'; ENC.calm = 0; await new Promise(r => setTimeout(r, 1500)); const n = ROAM.list.length, want = ROAM.want;
  const sc = R3 && R3.scene; let meshes = 0; try { const mm = sc.userData.mm; meshes = mm ? (mm.size || Object.keys(mm).length) : -1; } catch (e) { }
  const r = ROAM.list[0]; if (r) { P.x = P.px = r.x; P.y = P.py = r.y + 3; P.ang = 0; P.dir = 'up'; } G.bag.kapsel = (G.bag.kapsel || 0) + 3; return { n, want, meshes, hasR: !!r }; });
R.note('Roamer: ' + JSON.stringify(ro)); R.t('4 Roamer weiterhin da (ROAM.list > 0, Route 1) und als 3D-Figur in der Szene (scene.userData.mm)', ro.n > 0 && ro.meshes > 0, ro);
await ev(() => { const r = ROAM.list[0]; QA.thrown = r && INP.throwAt(r); }); await p.waitForTimeout(4000);
const th = await ev(() => ({ thrown: QA.thrown, battle: !!B, mode, wild: B && B.foe && B.foe[0] && B.foe[0].s }));
R.t('4 Roamer antippbar/werfbar: Kapsel-Wurf löst den Kampf aus (startWild)', th.thrown && th.battle, th); await ev(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); await p.waitForTimeout(800);
// ---- 5) Schwimmen mit Blasen
await ev(() => { G.badges = ['Floramedaille', 'Wellenorden']; G.flags.swim = 1; G.team = [mk(1, 12), mk(112, 16)]; G.team[1].known = ['wellenritt']; });
const sw = await ev(async () => { setView('third', 1); await new Promise(r => setTimeout(r, 1200)); loadMap('brisenhafen', 5, 5); mode = 'world'; ROAM.list = []; let wp = null; for (let y = 1; y < cur.h - 1 && !wp; y++) for (let x = 1; x < cur.w - 1; x++) if (cur.rows[y][x] === '~' && cur.rows[y][x + 1] === '~' && cur.rows[y + 1][x] === '~') { wp = [x, y]; break; }
  P.x = P.px = wp[0]; P.y = P.py = wp[1]; P.dir = 'right'; P.ang = YAW.right; moveTick(16); const st = P.state; ENC.steps = 99; ENC.calm = 0; ENC.pend = null; const R0 = Math.random; Math.random = () => 0; const log = { sfx: [] }; const s0 = sfx; sfx = (n) => { log.sfx.push(n); }; onStep(); sfx = s0; Math.random = R0;
  log.state = st; log.pend = ENC.pend && { kind: ENC.pend.kind, s: ENC.pend.s, l: ENC.pend.l, dur: ENC.pend.dur }; log.mode = mode; clearTimeout(ENC.tm); await new Promise(r => setTimeout(r, 700)); return log; });
R.note('Schwimmen: ' + JSON.stringify(sw)); await p.screenshot({ path: here('qa_mech_enc_swim_3d.png') });
R.t('5 Schwimmen: Zustand swim, Vorwarnung 0,85 s „Blasen“ (Ton bubble), Figur stoppt', sw.state === 'swim' && sw.pend && sw.pend.kind === 'water' && sw.pend.dur === 850 && sw.sfx.includes('bubble') && sw.mode === 'wait', sw);
await ev(() => { ENC.pend = null; mode = 'world'; });
// Wasser-Arten je Karte mit Wasser: alle Flut, keine Legende, Level plausibel (aus enc der Karte)
const water = await ev(() => { const out = []; for (const id in MAPS) { const m = getMap(id); if (!m.rows.some(r => r.includes('~'))) continue; loadMap(id, 2, 2); const sp = new Map(); let bad = 0; for (let i = 0; i < 300; i++) { const e = waterEnc(null, i % 2 === 0); if (!e) { bad++; continue; } const M = MONS[e[0]]; sp.set(e[0], (sp.get(e[0]) || 0) + 1); if (!M.t.includes('flut') || M.legend) bad++; }
  out.push({ id, n: sp.size, bad, names: [...sp.keys()].map(s => MONS[s].n).join('/'), enc: !!m.enc }); } return out; });
R.note('Wasser-Arten je Karte: ' + JSON.stringify(water)); R.t('5 Wasser-Arten: alle Flut-Typ, keine Legende, auf jeder Karte mit Wasser mindestens eine Art', water.length > 0 && water.every(q => q.bad === 0 && q.n > 0), water.filter(q => q.bad || !q.n));
// ---- 6) Angeln: A vor Wasser → Es zappelt → tippen → Kampf; zu spät; zu früh
await ev(() => { setView('2d', 1); });
const fish = async (mode_) => ev(async mm => { loadMap('brisenhafen', 5, 5); mode = 'world'; ROAM.list = []; let sp = null; for (let y = 1; y < cur.h - 1 && !sp; y++) for (let x = 1; x < cur.w - 1; x++) if (cur.rows[y][x] === '.' && cur.rows[y][x + 1] === '~') { sp = [x, y]; break; }
    P.x = P.px = sp[0]; P.y = P.py = sp[1]; P.dir = 'right'; MV.ride = false; moveTick(16); const msgs = []; const t0_ = toast; toast = (t) => { msgs.push(t); }; const out = { spot: sp, state: P.state }; QA.sb2 = startBattle; let battle = null; startBattle = function (o) { battle = o; ENC.inB = 0; mode = 'world'; };
    interact(); out.cast = !!ENC.fish; out.mode = mode; const t0 = performance.now();
    while (ENC.fish && ENC.fish.ph === 'wait' && performance.now() - t0 < 5000) await new Promise(r => setTimeout(r, 30)); out.biteAt = Math.round(performance.now() - t0); out.ph = ENC.fish && ENC.fish.ph;
    if (mm === 'early') { await new Promise(r => setTimeout(r, 0)); }
    return { out, msgs, restore: 0 }; }, mode_);
// frühes Tippen: sofort nach dem Auswerfen (innerhalb 350 ms) wird ignoriert → danach "zu früh" erst nach 350 ms
const f1 = await ev(async () => { loadMap('windkueste', 5, 5); mode = 'world'; ROAM.list = []; let sp = null; for (let y = 1; y < cur.h - 1 && !sp; y++) for (let x = 1; x < cur.w - 2; x++) if (!blocked(x, y) && cur.rows[y][x] !== '~' && cur.rows[y][x + 1] === '~' && !npcAt(x + 1, y)) { sp = [x, y]; break; }
  window.FSP = sp; P.x = P.px = sp[0]; P.y = P.py = sp[1]; P.dir = 'right'; MV.ride = false; ENC.calm = 0; window.MSG = []; const tt = toast; toast = (t) => { MSG.push(t); }; window.BTL = null; window.SB0 = startBattle; startBattle = function (o) { BTL = o; ENC.inB = 0; mode = 'world'; };
  interact(); const o = { cast: !!ENC.fish, mode, spot: sp, msgs: MSG.slice() }; window.TT = tt; return o; });
R.note('Angeln auswerfen: ' + JSON.stringify(f1)); R.t('6 A vor Wasser: Angel ausgeworfen („Du wirfst die Angel aus …“), Figur wartet (mode wait)', f1.cast && f1.mode === 'wait' && f1.msgs.some(m => /Angel aus/.test(m)), f1);
// zu früh tippen (> 350 ms, vor dem Biss ist unwahrscheinlich: Biss erst ≥ 1 s)
await p.waitForTimeout(400); await ev(() => { window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
const f2 = await ev(() => ({ fish: !!ENC.fish, mode, msgs: MSG.slice() })); R.t('6 Zu früh getippt (nach 0,4 s, vor dem Biss): „Zu früh gezogen …“, Angel eingeholt, kein Kampf', !f2.fish && f2.mode === 'world' && f2.msgs.some(m => /Zu früh/.test(m)) && !(await ev(() => BTL)), f2);
// Treffer
await ev(() => { MSG.length = 0; ENC.steps = 99; interact(); }); const t0 = Date.now(); await p.waitForFunction(() => ENC.fish && ENC.fish.ph === 'bite', null, { timeout: 6000 }); const biteMs = Date.now() - t0;
const g1 = await ev(() => ({ msgs: MSG.slice(), ph: ENC.fish.ph })); await p.waitForTimeout(200); await ev(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true })); });
const g2 = await ev(() => { const o = { btl: BTL && BTL.wild && { s: BTL.wild.s, l: BTL.wild.l, name: MONS[BTL.wild.s].n, flut: MONS[BTL.wild.s].t.includes('flut') }, msgs: MSG.slice(), fish: !!ENC.fish }; BTL = null; return o; });
R.note(`Angeln Treffer: Biss nach ${biteMs} ms (1000–3000 erwartet) ${JSON.stringify({ g1, g2 })}`);
R.t('6 Biss nach 1–3 s mit „Es zappelt! Schnell tippen!“', biteMs >= 900 && biteMs <= 3300 && g1.msgs.some(m => /Es zappelt/.test(m)), { biteMs, g1 });
R.t('6 Tippen (Taste) beim Biss → Kampf mit Wasser-Art (Flut) der Karte Windküste', g2.btl && g2.btl.flut && g2.msgs.some(m => /hängt an der Angel/.test(m)) && !g2.fish, g2);
// zu spät
await ev(() => { MSG.length = 0; interact(); }); await p.waitForFunction(() => ENC.fish && ENC.fish.ph === 'bite', null, { timeout: 6000 }); await p.waitForTimeout(1700);
const g3 = await ev(() => ({ fish: !!ENC.fish, mode, msgs: MSG.slice(), btl: !!BTL })); R.t('6 Zu spät (> 1,4 s): „Weg war\'s.“, kein Kampf, Steuerung zurück', !g3.fish && g3.mode === 'world' && g3.msgs.some(m => /Weg war/.test(m)) && !g3.btl, g3);
await ev(() => { toast = TT; startBattle = SB0; });
// Angeln darf nicht vor NPC/Land/Schwimmen: vor Land kein Wurf
const g4 = await ev(() => { P.dir = 'left'; P.x = P.px = FSP[0]; P.y = P.py = FSP[1]; interact(); const r = !!ENC.fish; ENC.fish = null; mode = 'world'; return r; }); R.t('6 Kein Angeln vor Land (nur offenes Wasser ~)', g4 === false, g4);
const errsA = p.errs.slice(); R.t('Keine Konsolenfehler im Lauf (Block 1–6)', errsA.length === 0, errsA);
await p.close();
// ---- 7) Smoke-Schritt „Route 1 & wilde Kreaturen“ 2× (420×860, frische Seite wie smoke.mjs)
for (let k = 1; k <= 2; k++) {
  const q = await env.browser.newPage({ viewport: { width: 420, height: 860 } }); const errs = []; q.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); q.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await q.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await q.goto(env.S.url.replace(/\/$/, '') + '/index.html', { waitUntil: 'load' });
  await q.click('#iPrompt'); await q.waitForTimeout(1200); await q.click('#iSkip'); await q.waitForTimeout(900); await q.click('#tNew'); await q.waitForTimeout(400); await q.evaluate('advDlg()'); await q.waitForTimeout(200);
  await q.evaluate("G.ret={map:'morgenau',x:7,y:11};loadMap('labor');P.dir='up'"); await q.waitForTimeout(300); await q.evaluate("P.x=P.px=3;P.y=P.py=5;P.dir='up';interact()"); await q.waitForTimeout(200); await q.click('#dlgOpts button'); await q.waitForTimeout(200); await q.evaluate('advDlg();advDlg()');
  await q.evaluate("transit(()=>loadMap('route1',9,20),'route1')"); await q.waitForTimeout(600); const n = await q.evaluate('ROAM.list.length');
  R.t(`7 Smoke-Schritt „Route 1 & wilde Kreaturen“ Lauf ${k}/2: Roamer ${n}, keine Fehler`, n > 0 && errs.length === 0, { n, errs }); await q.close();
}
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
