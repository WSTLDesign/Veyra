// QA Loop B3 – Nebenprüfung: baut alle 153 Arten (3D) und sammelt console.warn('Merkmal', …) aus 10-mon3d.js (FEAT[f] in try/catch).   node test/qa_b_merkmale.mjs
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
const S = await serve(); const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 860, height: 400 } }); const warns = [], errs = [];
page.on('console', m => { if (m.type() === 'warning' && /Merkmal/.test(m.text())) warns.push(m.text().slice(0, 200)); if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(S.url + 'index.html', { waitUntil: 'load' });
await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(700); await page.click('#tNew'); await page.waitForTimeout(300);
const r = await page.evaluate(() => { const bad = []; for (let id = 1; id < MONS.length; id++) { window.__cur = id; const w = console.warn; console.warn = function (...a) { bad.push(id + ':' + String(a[1]) + ':' + (a[2] && a[2].message)); }; try { buildMon3D(id, 1); } catch (e) { bad.push(id + ':THROW:' + e.message); } console.warn = w; } return bad; });
console.log('Arten mit Merkmal-Warnungen/Fehlern: ' + r.length); r.slice(0, 30).forEach(x => console.log('  ' + x)); console.log('Seitenfehler: ' + errs.length);
await browser.close(); S.close();
