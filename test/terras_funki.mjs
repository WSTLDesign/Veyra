// Terras – Vergleichsbogen Funki-Linie (001–003), Fortsetzung 15:30: gemaltes Bild (Maßstab) · vorher (Stand 12:35, Datei test/terras_funki_vorher.png)
// · nachher (Dex-/Team-Bild aus dem Modell in Kartenqualität: TA_HQ-Geometrie, 2×-Überabtastung, Kontaktschatten). → test/terras_funki_linie.png
// Nur unter der Chromium-Sperre starten.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync, readFileSync, existsSync } from 'fs';
const prevF = new URL('./terras_funki_vorher.png', import.meta.url);
const prev = existsSync(prevF) ? 'data:image/png;base64,' + readFileSync(prevF).toString('base64') : null;
const S = await serve();
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 }); p.setDefaultTimeout(15000);
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.addInitScript(() => { window.VEYRA_DEMO = 1; });
await p.goto(S.url + 'index.html', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.THREE && typeof buildTerra === 'function', null, { timeout: 15000 });
const png = await p.evaluate(async prev => {
  try { VILL.list = []; } catch (e) { }
  const ids = [1, 2, 3], C = 360, L = 150, rows = prev ? 3 : 2, big = document.createElement('canvas'); big.width = L + C * 3; big.height = 60 + C * rows + 40; const x = big.getContext('2d');
  x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, big.width, big.height); x.font = '700 22px sans-serif'; x.fillStyle = '#2a2633'; x.textAlign = 'center';
  ids.forEach((id, i) => x.fillText('#' + String(id).padStart(3, '0') + ' ' + MONS[id].n, L + C * i + C / 2, 38));
  const card = (cx, cy) => { x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(cx + 8, cy + 8, C - 16, C - 16, 18); x.fill(); };
  const put = (img, cx, cy, sx, sy, sw, sh) => { card(cx, cy); const s = C - 36; sw = sw || img.width; sh = sh || img.height; const k = Math.min(s / sw, s / sh); x.drawImage(img, sx || 0, sy || 0, sw, sh, cx + (C - sw * k) / 2, cy + (C - sh * k) / 2, sw * k, sh * k); };
  const lab = (a, c, r) => { x.textAlign = 'left'; x.font = '700 18px sans-serif'; x.fillStyle = '#2a2633'; x.fillText(a, 14, 60 + C * r + C / 2 - 6); x.font = '13px sans-serif'; x.fillStyle = '#6a6470'; c.split('\n').forEach((t, j) => x.fillText(t, 14, 60 + C * r + C / 2 + 14 + j * 16)); };
  const load = async src => { const im = new Image(); im.src = src; await im.decode().catch(() => { }); return im.width ? im : null; };
  let r = 0;
  // Zeile 1: gemaltes Bild (nur Funki hat eins)
  lab('Gemalt', 'Maßstab\n(Nutzerbild)', r);
  for (let i = 0; i < 3; i++) { const id = ids[i]; if (window.ART_SRC && ART_SRC[id]) { const im = await load(ART_SRC[id]); if (im) put(im, L + C * i, 50 + C * r); } else { card(L + C * i, 50 + C * r); x.textAlign = 'center'; x.font = '15px sans-serif'; x.fillStyle = '#9a94a0'; x.fillText('kein gemaltes Bild', L + C * i + C / 2, 50 + C * r + C / 2); } }
  r++;
  if (prev) { const im = await load(prev); lab('Vorher', 'Modell-Bild\nStand 12:35', r); if (im) ids.forEach((id, i) => put(im, L + C * i, 50 + C * r, 150 + 340 * i + 10, 390 + 10, 320, 320)); r++; }
  lab('Nachher', 'Modell-Bild\nKartenqualität', r);
  ids.forEach((id, i) => { delete THUMB[id]; const T = monThumb(id); if (T) put(T.img, L + C * i, 50 + C * r); });
  x.font = '13px sans-serif'; x.fillStyle = '#6a6470'; x.textAlign = 'center';
  x.fillText('Funki-Linie: Rotfuchs-Welpe → Rotfuchs-Jungtier → Mähnenwolf · Dex-/Team-Bild ' + (devicePixelRatio >= 1.5 ? 512 : 384) + ' px, feine Geometrie, 2×-Überabtastung, warmes Licht, Kontaktschatten', big.width / 2, big.height - 14);
  return big.toDataURL('image/png');
}, prev);
writeFileSync(new URL('./terras_funki_linie.png', import.meta.url), Buffer.from(png.split(',')[1], 'base64'));
console.log(errs.length ? 'FEHLER: ' + errs.join(' | ') : 'ok');
await b.close(); S.close();
