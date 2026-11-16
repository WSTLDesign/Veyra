// Art-Direktion Durchgang 1 – Aufnahmen aller Hauptmotive je Stufe (nur Sichtprüfung, ändert nichts am Spiel).
// NUR unter der Chromium-Sperre (AGENTS.md):
//   LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/artdir/shots.mjs <handy|hoch> [motiv,…]
// handy = iPhone-Emulation 844×390 @ DPR 2, Touch, „Apple GPU“, ohne gfx-Parameter (Spiel wählt selbst: Touch + Auto → „mittel“ + Handy-Budget)
// hoch  = 1280×720 @ DPR 1, Maus, dedizierte GPU vorgetäuscht, ?gfx=hoch
// Beide: ?modelle3d=1. SwiftShader ist sehr langsam → Wachhund/Auto-Auflösung werden eingefroren (sonst zeigt jedes Bild die Notbremse statt der Stufe).
// Ausgabe: test/artdir/<stufe>_<motiv>.webp (≤ 300 KB), Serien (Angriff/Fang) + Messwerte im Zwischenordner ($AD_TMP, Standard /tmp/artdir).
import { chromium, devices } from 'playwright';
import { serve } from '../art_serve.mjs';
import { writeFileSync, mkdirSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
const STUFE = process.argv[2] || 'handy', WANT = (process.argv[3] || '').split(',').filter(Boolean), on = m => !WANT.length || WANT.includes(m);
const OUT = new URL('./', import.meta.url).pathname, TMP = (process.env.AD_TMP || '/tmp/artdir') + '/'; mkdirSync(TMP, { recursive: true });
const HANDY = STUFE === 'handy', META = { stufe: STUFE, zeit: new Date().toISOString(), shots: {} }, T0 = Date.now(), log = s => console.log(`[${STUFE} ${((Date.now() - T0) / 1000).toFixed(0)}s] ${s}`);
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=1536'] });
const ctx = await browser.newContext(HANDY ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 15 Pro Max'].userAgent }
  : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await ctx.addInitScript(([handy]) => {
  const GPU = handy ? ['Apple GPU', 'Apple Inc.'] : ['ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Google Inc. (NVIDIA)'];
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const gp = C.prototype.getParameter; C.prototype.getParameter = function (p) { if (p === 0x9246) return GPU[0]; if (p === 0x9245) return GPU[1]; return gp.call(this, p); }; }
  if (handy) { try { Object.defineProperty(navigator, 'standalone', { get: () => true }); } catch (e) { }
    const mm = window.matchMedia.bind(window), fake = q => ({ matches: true, media: q, onchange: null, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { }, dispatchEvent() { return false; } });
    window.matchMedia = q => /display-mode:\s*standalone|pointer:\s*coarse|hover:\s*none/.test(q) ? fake(q) : mm(q); }
  window.VEYRA_DEMO = 1;   // echtes Intro mit Charaktererstellung statt Automatik (Playwright = webdriver)
  // Zeitlupe für Angriff/Fang: Spielzeit = k × Echtzeit (performance.now, Date.now, rAF-Zeitstempel, Timer); __setK(1) = normal
  { const rp = performance.now.bind(performance), d0 = Date.now() - rp(); let base = 0, vb = 0, k = 1; const v = () => vb + (rp() - base) * k;
    window.__setK = n => { const t = rp(); vb = v(); base = t; k = n; }; performance.now = v; Date.now = () => Math.round(d0 + v());
    const raf = window.requestAnimationFrame.bind(window), sT = window.setTimeout.bind(window), sI = window.setInterval.bind(window);
    window.requestAnimationFrame = cb => raf(() => cb(v())); window.setTimeout = (f, ms, ...a) => sT(f, (ms || 0) / k, ...a); window.setInterval = (f, ms, ...a) => sI(f, (ms || 0) / k, ...a); }
  // Wachhund + Auto-Auflösung einfrieren, sobald die Spielskripte geladen sind (Stufe = Wahl des Spiels beim Start)
  document.addEventListener('DOMContentLoaded', () => { try { window.stabMeasure = function () { }; window.perfFrame = function () { }; } catch (e) { } });
}, [HANDY]);
const p = await ctx.newPage(); p.setDefaultTimeout(240000); const errs = [];
p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|ReadPixels|favicon/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
const ev = (f, a) => p.evaluate(f, a), wait = ms => p.waitForTimeout(ms);
const frames = n => ev(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); setTimeout(r, 90000); }), n);
const stat = () => ev(() => { try { return { tier: PERF.tier, scale: PERF.scale, gpu: STAB.cls, tris: GFX.stat.tris, calls: GFX.stat.calls, bud: GFX.bud && GFX.bud.lvl, px: R3 && R3.r ? R3.r.domElement.width + '×' + R3.r.domElement.height : '-' }; } catch (e) { return { err: e.message }; } });
// Bildschirmfoto → WebP ≤ 300 KB (Qualität absteigend, notfalls verkleinert)
async function snap(name, dir = OUT, max = 300000) {
  const png = TMP + '_snap.png'; writeFileSync(png, await p.screenshot()); const file = dir + STUFE + '_' + name + '.webp';
  execFileSync('python3', ['-c', `import sys,os
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB');out=sys.argv[2];mx=int(sys.argv[3])
for w in (im.width,1600,1400,1200):
  j=im if w>=im.width else im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
  for q in (84,78,72,66,60,54):
    j.save(out,'WEBP',quality=q,method=6)
    if os.path.getsize(out)<=mx: sys.exit(0)`, png, file, String(max)]);
  META.shots[name] = Object.assign({ kb: Math.round(statSync(file).size / 1024) }, await stat()); log('→ ' + file.replace(OUT, 'test/artdir/') + ' ' + JSON.stringify(META.shots[name]));
}
const closeDlg = () => ev(() => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
const modelsIdle = async (cap = 300000) => { const t = Date.now(); while (Date.now() - t < cap) { const n = await ev(() => { try { return VMODEL_QUEUE.q.length + (VMODEL_QUEUE.busy ? 1 : 0) + (typeof LOD4 === 'object' ? LOD4.pend : 0); } catch (e) { return 0; } }); if (!n) return (Date.now() - t) / 1000; await wait(800); } return 'timeout'; };
const go = async (id, x, y, dir = 'up', hour = 10.5, keepVill = true) => { await ev(([id, x, y, d, h, kv]) => { G.time = h * 60; loadMap(id, x, y); P.dir = d; P.ang = YAW[d]; if (!kv && typeof VILL !== 'undefined') VILL.list = []; mode = 'world'; R3.snap = 1; }, [id, x, y, dir, hour, keepVill]);
  await closeDlg(); await frames(2); log(id + ' Modelle ' + await modelsIdle()); await closeDlg(); await ev(() => { mode = 'world'; R3.snap = 1; }); await frames(3); await wait(1500); await frames(2); };
// Nahaufnahme über die Kamerafahrt-Schnittstelle des Spiels (CAM.mode 'cinematic', 09) – HUD dafür ausgeblendet
const cine = (on, o) => ev(([on, o]) => { if (!document.getElementById('adCss')) { const st = document.createElement('style'); st.id = 'adCss'; st.textContent = 'body.adCine :is(#hudP,#hudOv,#hq,#pad,#mmW,#vTeam,#fsBtn,#viewBtn,#mmBtn,#mapCard,#toast,#hudBadges,.in-root,.in-aim){visibility:hidden!important}'; document.head.appendChild(st); }
  document.body.classList.toggle('adCine', !!on); if (!on) { CAM.mode = 'explore'; return; }
  const pp = R3.player.position; Object.assign(CAM, { mode: 'cinematic', target: { x: pp.x + o.tx, y: pp.y + o.ty, z: pp.z + o.tz }, lookAt: { x: pp.x + o.lx, y: pp.y + o.ly, z: pp.z + o.lz }, yaw: o.yaw, dist: o.dist, height: o.h, fov: o.fov || 40, snap: true }); }, [on, o || {}]);

// ---------- Start: Titel → Neues Spiel → echtes Intro (Charaktererstellung, Starterwahl) ----------
await p.goto(S.url + 'index.html?modelle3d=1' + (HANDY ? '' : '&gfx=hoch'), { waitUntil: 'load', timeout: 240000 });
META.start = await ev(() => ({ tier: PERF.tier, base: STAB.base, cls: STAB.cls, gpu: STAB.gpu, touch: PERF.touch, cap: STAB.cap, m3d: typeof pilotOn === 'function' && pilotOn() })); log('Start ' + JSON.stringify(META.start));
try { await p.click('#iPrompt', { timeout: 8000 }); } catch (e) { } await wait(1200);
for (let i = 0; i < 8; i++) { if (await ev(() => { const b = document.getElementById('tNew'); return !!b && b.offsetParent !== null; })) break; try { await p.click('#iSkip', { timeout: 2500 }); } catch (e) { } await wait(1500); }
await wait(2500); if (on('titel')) await snap('titel');
await p.click('#tNew'); await wait(1500);
const skipTo = async (sel, cap = 60) => { for (let i = 0; i < cap; i++) { if (await ev(s => { const e = document.querySelector(s); return !!e && !e.hidden; }, sel)) return true; await ev(() => { const s = document.querySelector('.sqSkip'); if (s && !s.hidden) s.click(); }); await wait(700); } return false; };
await skipTo('.ccPanel'); await p.click('.fgBody button[data-b="heldin"]'); await wait(1600); if (on('erstellung')) await snap('erstellung');
await p.click('.ccGo'); await wait(800); await skipTo('.fgPick'); await wait(2500); if (on('starterwahl')) await snap('starterwahl');
await p.click('.asCard[data-s="1"]'); await wait(600); await p.click('.fgGo'); await wait(1000);
for (let i = 0; i < 60 && await ev(() => mode !== 'dialog' && !(G && R3 && R3.mapId)); i++) { await ev(() => { const s = document.querySelector('.sqSkip'); if (s && !s.hidden) s.click(); const sq = document.querySelector('.sqStage'); if (sq) sq.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }); await wait(900); }
log('Spielstart ' + JSON.stringify(await ev(() => ({ map: cur && cur.id, mode, body: G.outfit && G.outfit.body })))); log('Modelle ' + await modelsIdle());
await ev(() => { window.VEYRA_DEMO = 0; });   // ab hier keine Story-Einschübe (Automatik wie in allen Tests)
if (await ev(() => mode === 'dialog')) { await ev(() => TW && TW.finish && TW.finish()); await frames(3); await wait(1200); if (on('dialog_mama')) await snap('dialog_mama'); }
await closeDlg();
await ev(() => { G.flags.firstcatch = 1; G.flags.call_first = 1; G.team = [mk(1, 12), mk(4, 10), mk(7, 9), mk(59, 6)]; G.team[1].hp = Math.round(stat(G.team[1], 'hp') * .45); G.team[3].hp = Math.round(stat(G.team[3], 'hp') * .2); G.bag.kapsel = 5; G.bag.trank = 3;
  for (const i of [1, 4, 7, 59, 61, 112]) { G.dex.seen[i] = 1; G.dex.caught[i] = 1; } for (const i of [2, 5, 8, 13, 16, 25]) G.dex.seen[i] = 1; });

// ---------- Welt außen ----------
if (on('morgenau_weit')) { await go('morgenau', 17, 6, 'left'); await snap('morgenau_weit'); }
if (on('morgenau_nah')) { await go('morgenau', 13, 7, 'right', 10.5);
  await cine(true, { tx: .9, ty: 0, tz: 0, lx: .9, ly: 1.05, lz: 0, yaw: Math.PI * .5 + .55, dist: 3.0, h: 1.25, fov: 38 }); await frames(4); await wait(1500); await snap('morgenau_nah');
  await cine(true, { tx: 0, ty: 0, tz: 0, lx: 0, ly: 1.0, lz: 0, yaw: Math.PI * .5 + .35, dist: 1.55, h: 1.1, fov: 34 }); await frames(4); await wait(1200); await snap('heldin_nah'); await cine(false); }
if (on('dialog')) { await go('morgenau', 13, 7, 'right'); await ev(() => talk(NPCS.morgenau[0])); await wait(1500); await ev(() => TW && TW.finish && TW.finish()); await frames(3); await wait(800); await snap('dialog'); await closeDlg(); }
if (on('laden_route1')) { await go('morgenau', 9, 2, 'up');
  await ev(() => { LOD4.holdMax = 120000; transit(() => loadMap('route1', 9, 20), 'route1'); }); for (let i = 0; i < 40 && !(await ev(() => LADEN.active)); i++) await wait(250); await wait(900); await snap('ladebild');
  for (let i = 0; i < 300 && await ev(() => LADEN.active); i++) await wait(500); }
if (on('route1')) { await go('route1', 9, 19, 'up', 10.5); await ev(() => { ROAM && (ROAM.want = 6); }); await wait(4000); await frames(4); await snap('route1'); }
if (on('kupferhain')) { await go('kupferhain', 9, 14, 'up'); await snap('kupferhain'); }

// ---------- Innenräume + Heilstation ----------
for (const [id, nm] of [['haus_spieler', 'innen_haus'], ['laden_kupfer', 'innen_laden'], ['labor', 'innen_labor']]) if (on(nm)) { await ev(() => { G.ret = { map: 'kupferhain', x: 5, y: 10 }; }); await go(id, 5, 7, 'up', 11); await snap(nm); }
if (on('heilstation')) { await ev(() => { G.ret = { map: 'kupferhain', x: 5, y: 10 }; }); await go('heil_kupfer', 5, 4, 'up', 15); await snap('heilstation');
  await ev(() => { talk(NPCS.heil_kupfer[0]); }); await wait(400); try { await p.click('#dlgOpts button', { timeout: 20000 }); } catch (e) { }
  for (let i = 0; i < 60 && !(await ev(() => document.querySelectorAll('.healOv .hoSlot.lit').length >= 2)); i++) await wait(150); await snap('heilsequenz');
  for (let i = 0; i < 80 && await ev(() => !!document.querySelector('.healOv') || mode === 'wait'); i++) await wait(250); await closeDlg(); }

// ---------- Wildkampf: Aufstellung, Angriff, Fang ----------
if (on('kampf')) { await go('route1', 9, 15, 'up', 10.5, false);
  await ev(() => { G.team[0] = mk(1, 8); mode = 'world'; startBattle({ wild: mk(59, 7) }); });
  await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 300000, polling: 500 }); await wait(2500); await frames(4); await snap('kampf_aufstellung');
  await p.click('#bMenu .big.k1'); await wait(1500); await frames(3); await snap('kampf_attacken');
  // Angriff (Glut-Attacke) in Zeitlupe ×0,06: Serie bis das Menü zurück ist; Spielzeit je Bild im Protokoll
  const zl = async (name, n, done) => { for (let i = 0; i < n; i++) { log(name + '_' + i + ' Spielzeit ' + await ev(() => Math.round(performance.now()))); await snap(name + '_' + i, TMP, 400000); if (await ev(done)) return i; } return n; };
  const mi = await ev(() => Math.max(0, G.team[B.mi].moves.findIndex(m => MOVES[m.id] && MOVES[m.id][1] === 'glut')));
  await ev(i => { __setK(.06); turn({ k: 'move', i }); }, mi); await zl('angriff', 24, () => !B || (!B.busy && !!document.querySelector('#bMenu .big'))); await ev(() => __setK(1));
  await p.waitForFunction(() => !B || (!B.busy && document.querySelector('#bMenu .big')), null, { timeout: 300000, polling: 500 }).catch(() => { });
  if (await ev(() => !B)) { await closeDlg(); await ev(() => { mode = 'world'; startBattle({ wild: mk(59, 7) }); }); await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 300000, polling: 500 }); await wait(1500); }
  await ev(() => { const f = B.foe[B.fi]; f.hp = Math.max(1, Math.round(stat(f, 'hp') * .15)); __setK(.06); turn({ k: 'ball', item: 'kapsel' }); });
  await zl('fang', 30, () => !!document.querySelector('#bCard:not([hidden])') || !B); await ev(() => __setK(1));
  if (await ev(() => !!document.querySelector('#bCard:not([hidden])'))) { await snap('fangkarte'); try { await p.click('#bCard', { timeout: 5000 }); } catch (e) { } }
  for (let i = 0; i < 120 && await ev(() => !!B); i++) await wait(500);   // Fang-Ablauf selbst beenden lassen (vorzeitiges endBattle → Seitenfehler „B.cap“)
  await ev(() => { if (B) { try { endBattle('run'); } catch (e) { } } mode = 'world'; }); await wait(1500); await closeDlg(); }

// ---------- Menüs ----------
if (on('menues')) { await go('morgenau', 9, 12, 'up');
  for (const [t, n] of [['quest', 'chronik'], ['team', 'team'], ['dex', 'dex'], ['bag', 'tasche'], ['game', 'optionen']]) { await ev(t => { if (!$('#menu').hidden) { tab = t; sel = null; renderMenu(); } else openMenu(t); }, t); await wait(1500); await frames(2); await snap('menu_' + n); }
  await ev(() => closeMenu()); }
META.fehler = [...new Set(errs)]; writeFileSync(TMP + STUFE + '_meta.json', JSON.stringify(META, null, 1)); log('fertig, Seitenfehler: ' + META.fehler.length);
await browser.close(); S.close();
