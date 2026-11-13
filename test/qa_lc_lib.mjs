// QA Loop C – gemeinsame Hilfen (ein Chromium, 860×484 SwiftShader; three.js lokal aus dist/three.min.js über art_serve).
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { appendFileSync, writeFileSync } from 'fs';
export const here = n => n.startsWith('/') ? n : new URL('./' + n, import.meta.url).pathname;
export const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver|ReadPixels/;
export async function start(extra = []) {
  const S = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=1024', ...extra] });
  return { S, browser, close: async () => { await browser.close(); S.close(); } };
}
// Seite mit Einstellungen (high, native Auflösung) und optionalem vorbereitetem Spielstand (localStorage) – Aufruf: page(env,{w,h,flags,save,mobile})
export async function page(env, { w = 860, h = 484, flags = {}, save = null, saveKey = 'veyra_save_v1', set = {}, mobile = false, dpr = 1, cpu = 1 } = {}) {
  const ctx = await env.browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage(); p.setDefaultTimeout(15000); p.setDefaultNavigationTimeout(180000); p.errs = [];
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 200)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  await p.addInitScript(([f, s, sv, sk]) => { for (const k in f) window[k] = f[k]; try { if (!localStorage.getItem('veyra_set')) localStorage.setItem('veyra_set', JSON.stringify(Object.assign({ res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' }, s))); if (sv && !sessionStorage.getItem('qa_saved')) { localStorage.setItem(sk, typeof sv === 'string' ? sv : JSON.stringify(sv)); sessionStorage.setItem('qa_saved', '1'); } } catch (e) { } }, [flags, set, save, saveKey]);
  await p.goto(env.S.url + 'index.html', { waitUntil: 'load' });
  if (cpu > 1) { const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: cpu }); p.cdp = c; }
  p.ctx = ctx; return p;
}
// Titel überspringen → Neues Spiel → Intro-Dialoge → Spielstand setzen
export async function newGame(p, { team = [[1, 12]], view = 'third', setup = '' } = {}) {
  try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(500);
  try { await p.click('#iSkip', { timeout: 4000 }); } catch (e) { } await p.waitForTimeout(900);
  await p.click('#tNew'); await p.waitForTimeout(400);
  await p.evaluate(([team, view, setup]) => { for (let i = 0; i < 40 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; G.flags.firstcatch = 1; SET.skipBattleIntro = 1; SET.btl = 'runde';
    G.team = team.map(([s, l]) => mk(s, l)); if (setup) (0, eval)(setup); setView(view, 1); mode = 'world'; VILL && (VILL.list = []); }, [team, view, setup]);
  await p.waitForTimeout(1500);
}
export const goMap = (p, map, x, y, dir = 'up', hour = 12) => p.evaluate(([m, x, y, d, h]) => { if (typeof bmClose === 'function' && BM && BM.open) bmClose(); G.time = h * 60; loadMap(m, x, y); P.dir = d; if (typeof VILL !== 'undefined') VILL.list = []; for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world'; }, [map, x, y, dir, hour]);
// Bericht: schreibt Zeilen in test/<file> und stdout
export function reporter(file, title) {
  const R = { ok: 0, bad: 0 }; try { writeFileSync(here(file), '# ' + title + '\n'); } catch (e) { }
  R.t = (n, c, info) => { const ok = !!c; ok ? R.ok++ : R.bad++; const line = (ok ? '✓ ' : '✗ ') + n + (info !== undefined ? ' → ' + (typeof info === 'string' ? info : JSON.stringify(info)).slice(0, 500) : ''); console.log(line); try { appendFileSync(here(file), line + '\n'); } catch (e) { } };
  R.note = s => { console.log('  ' + s); try { appendFileSync(here(file), '  ' + s + '\n'); } catch (e) { } };
  return R;
}
