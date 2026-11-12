#!/usr/bin/env node
// Smoke-Test für den verschleierten Live-Build: node tools/smoke-live.mjs [dist]
// Ohne Debug-Schnittstelle (Live hat keine): lädt in drei Größen, tippt „Tippe, um zu beginnen“, prüft auf Laufzeitfehler.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const dir = path.resolve(process.argv[2] || 'dist');
const outDir = path.resolve('test-out'); fs.mkdirSync(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dir, p); if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const IGNORE = [/GPU stall/i, /WebGL/i, /AudioContext/i, /autoplay/i, /play\(\) request/i, /Fullscreen/i, /404/, /ERR_TUNNEL_CONNECTION_FAILED/, /ERR_NAME_NOT_RESOLVED/];
const out = []; let failed = 0; const check = (n, ok, x = '') => { out.push(`${ok ? '✔' : '✘'} ${n}${x ? ' – ' + x : ''}`); if (!ok) failed++; };

const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
check('Live: keine Kommentare/Interna im Code', !/\/\/ =====|AGENTS\.md|PROGRESS\.md/.test(html));
check('Live: kein Staging-/Debug-Code', !/VEYRA_STAGING|__VEYRA_STG|stgPanel/.test(html));
check('Live: keine artifact.html / Source-Maps', !fs.existsSync(path.join(dir, 'artifact.html')) && !fs.readdirSync(dir, { recursive: true }).some(f => /\.map$/.test(f)));

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
try {
  for (const [label, vp, touch] of [['Handy quer', { width: 844, height: 390 }, true], ['Tablet', { width: 1180, height: 820 }, true], ['PC', { width: 1920, height: 1080 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, serviceWorkers: 'block' });
    const page = await ctx.newPage(); page.setDefaultTimeout(150000); const errs = [];
    page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.dismiss());
    page.on('console', m => { if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text()))) errs.push(m.text()); });
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    check(`${label}: lädt ohne Fehler`, errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.mouse.click(vp.width / 2, vp.height / 2); await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(outDir, `live_${label.replace(/\W+/g, '_')}.png`) });
    check(`${label}: Start-Tipp ohne Fehler`, errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }
console.log(out.join('\n')); console.log(failed ? `\n${failed} Prüfung(en) fehlgeschlagen` : '\nAlles grün');
process.exit(failed ? 1 : 0);
