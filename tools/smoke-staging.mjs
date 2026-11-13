#!/usr/bin/env node
// Smoke-Test für einen Staging-Build: node tools/smoke-staging.mjs <staging-ordner>
// Prüft: lädt fehlerfrei (Handy quer + Tablet + PC), Badge & Debug-Menü da, Live-Schlüssel unberührt,
// Speichern landet nur unter veyra_stg_*, Debug-Aktionen laufen. Screenshots nach test-out/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const dir = path.resolve(process.argv[2] || 'build/staging');
const outDir = path.resolve('test-out'); fs.mkdirSync(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.txt': 'text/plain' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dir, p); if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const results = []; let failed = 0;
const check = (name, ok, extra = '') => { results.push(`${ok ? '✔' : '✘'} ${name}${extra ? ' – ' + extra : ''}`); if (!ok) failed++; };
const IGNORE = [/GPU stall/i, /WebGL/i, /AudioContext/i, /autoplay/i, /play\(\) request/i, /Fullscreen/i, /404/, /ERR_TUNNEL_CONNECTION_FAILED/, /ERR_NAME_NOT_RESOLVED/];

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
try {
  for (const [label, vp, touch] of [['Handy quer', { width: 844, height: 390 }, true], ['Tablet', { width: 1180, height: 820 }, true], ['PC', { width: 1920, height: 1080 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, serviceWorkers: 'block' });
    // Live-Stand simulieren: der darf durch Staging nie verändert werden
    await ctx.addInitScript(() => { if (!localStorage.getItem('veyra_save_v1')) localStorage.setItem('veyra_save_v1', '{"LIVE":"unberuehrt"}'); });
    const page = await ctx.newPage(); const errs = []; page.setDefaultTimeout(150000);
    page.on('dialog', d => d.accept());
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text()))) errs.push(m.text()); });
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    check(`${label}: Seite lädt ohne Fehler`, errs.length === 0, errs.slice(0, 3).join(' | '));
    check(`${label}: Staging-Badge sichtbar`, await page.locator('#stgBadge').isVisible());
    check(`${label}: Titel markiert`, (await page.title()).startsWith('[STAGING]'));
    await page.screenshot({ path: path.join(outDir, `stg_${label.replace(/\W+/g, '_')}_start.png`) });
    if (label !== 'PC') { await ctx.close(); continue; }

    // Ausführlich am PC: Spiel per Debug-Pfad anlegen, speichern, Speicher prüfen
    const st = await page.evaluate(() => {
      const o = {};
      try { o.env = document.querySelector('meta[name="veyra-env"]').content; } catch (e) {}
      const k = window.__VEYRA_STG.keys(); o.saveKey = k.save; o.setKey = k.set;
      return o;
    });
    check('PC: Spielstand-Schlüssel = veyra_stg_save_v1', st.saveKey === 'veyra_stg_save_v1', String(st.saveKey));
    check('PC: Einstellungs-Schlüssel = veyra_stg_set', st.setKey === 'veyra_stg_set', String(st.setKey));
    await page.locator('#stgBadge').click(); await page.waitForTimeout(300);
    check('PC: Debug-Menü öffnet', await page.locator('#stgPanel').isVisible());
    const disabled = await page.$$eval('#stgPanel button:disabled', b => b.map(x => x.textContent + ' (' + x.title + ')'));
    check('PC: alle Debug-Knöpfe passen zur Spielversion', disabled.length === 0, disabled.join('; '));
    await page.screenshot({ path: path.join(outDir, 'stg_PC_debugmenue.png') });
    // Debug-Pfad wie ein Tester: Schnellstart → Kreatur → Team heilen → Level → Dex → Items
    const btn = async t => { if (!(await page.locator('#stgPanel').isVisible())) await page.locator('#stgBadge').click(); await page.locator('#stgPanel button', { hasText: t }).click({ timeout: 150000 }); await page.waitForTimeout(400); };
    await btn('Neues Testspiel ohne Intro'); await page.waitForTimeout(2500);
    check('PC: Schnellstart erzeugt Spiel', await page.evaluate(() => { const g = window.__VEYRA_STG.game(); return !!g && typeof g.map === 'string'; }));
    const ov = await page.evaluate(() => window.__VEYRA_STG.overlays());
    check('PC: Spiel sichtbar (Intro/Titel geschlossen)', ov.length === 0, ov.join(', '));
    await page.locator('#stgBadge').click(); await page.waitForTimeout(300);
    check('PC: Kreaturenliste gefüllt', (await page.$$eval('#stgMon option', o => o.length)) > 10);
    check('PC: Kartenliste gefüllt', (await page.$$eval('#stgMap option', o => o.length)) > 3);
    await page.selectOption('#stgMon', { index: 0 }); await page.fill('#stgMonLv', '12');
    await btn('Ins Team'); await btn('Team heilen'); await page.fill('#stgLv', '25'); await btn('Level fürs Team setzen');
    await btn('Dex komplett'); await btn('10× alle Items');
    const g = await page.evaluate(() => { const G = window.__VEYRA_STG.game(); return { team: G.team.length, lv: G.team.map(m => m.l), map: G.map }; });
    check('PC: Kreatur im Team, Level gesetzt', g.team >= 1 && g.lv.every(l => l === 25), JSON.stringify(g));
    await btn('Schließen'); await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'stg_PC_testspiel.png') });
    // Welt und Kampf (prüft, dass das verschleierte Spiel auch in 3D-Welt und Kampf läuft)
    await page.selectOption('#stgMap', 'morgenau').catch(() => {}); await btn('Hinreisen'); await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(outDir, 'stg_PC_welt.png') });
    check('PC: Reise in die Welt ohne Fehler', errs.length === 0, errs.slice(0, 2).join(' | '));
    await btn('Wildkampf'); await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(outDir, 'stg_PC_kampf.png') });
    const md = await page.evaluate(() => window.__VEYRA_STG.mode());
    check('PC: Wildkampf startet ohne Fehler', errs.length === 0 && md === 'battle', 'Modus ' + md + (errs.length ? ' | ' + errs.slice(0, 2).join(' | ') : ''));
    const raw = await page.evaluate(() => localStorage.getItem('veyra_stg_save_v1'));
    check('PC: Spielstand unter veyra_stg_save_v1 gespeichert', !!raw && raw.length > 20);
    const keys = await page.evaluate(() => Object.keys(localStorage));
    check('PC: Live-Spielstand unberührt', (await page.evaluate(() => localStorage.getItem('veyra_save_v1'))) === '{"LIVE":"unberuehrt"}');
    const foreign = keys.filter(k => k.startsWith('veyra') && !k.startsWith('veyra_stg') && k !== 'veyra_save_v1');
    check('PC: Staging schreibt nur veyra_stg_*', foreign.length === 0, foreign.join(', ') || keys.join(', '));
    check('PC: keine Laufzeitfehler im Staging-Protokoll', (await page.evaluate(() => (window.VEYRA_STAGING_ERRORS || []).length)) === 0,
      (await page.evaluate(() => (window.VEYRA_STAGING_ERRORS || []).join(' | '))));
    await ctx.close();
  }
  // Dateien
  check('robots.txt sperrt Suchmaschinen', fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8').includes('Disallow: /'));
  const mf = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.webmanifest'), 'utf8'));
  check('Manifest als „Veyra STAGING“', mf.name === 'Veyra STAGING');
  check('Service Worker mit eigenem Cache', /veyra-stg-/.test(fs.readFileSync(path.join(dir, 'sw.js'), 'utf8')));
} finally { await browser.close(); server.close(); }

console.log(results.join('\n')); console.log(failed ? `\n${failed} Prüfung(en) fehlgeschlagen` : '\nAlles grün');
fs.writeFileSync(path.join(outDir, 'smoke-staging.txt'), results.join('\n') + '\n');
process.exit(failed ? 1 : 0);
