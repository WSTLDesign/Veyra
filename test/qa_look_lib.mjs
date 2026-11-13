// QA Look L3 – gemeinsame Messhilfe: Kontrast (aus dem gerenderten Bild), Touch-Ziele (inkl. unsichtbarem Trefferrand via elementFromPoint), Überlappungen, Textüberlauf.
// audit(page) → { touch:{n,small:[…]}, contrast:{n,fail:[…],min}, overlap:[…], overflow:[…] }
import { writeFileSync } from 'fs';
export async function audit(page, opt = {}) {
  const png = await page.screenshot({ timeout: 180000 });
  if (opt.save) writeFileSync(opt.save, png);
  const b64 = png.toString('base64');
  return await page.evaluate(async ([b64, opt]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const dpr = img.width / innerWidth, cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
    // Sichtbarer Ausschnitt: Rechteck geschnitten mit allen scrollenden/abschneidenden Vorfahren (Nachbesserung: Text, der im Scrollbereich halb verdeckt ist, wird nicht als Kontrastfehler gezählt)
    const clipR = e => { const r = e.getBoundingClientRect(); let L = r.left, T = r.top, R = r.right, B = r.bottom; if (opt.noclip) return { left: L, top: T, right: R, bottom: B, width: r.width, height: r.height }; let n = e.parentElement; while (n && n !== document.documentElement) { const cs = getComputedStyle(n); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const q = n.getBoundingClientRect(); L = Math.max(L, q.left); T = Math.max(T, q.top); R = Math.min(R, q.right); B = Math.min(B, q.bottom); } n = n.parentElement; } return { left: L, top: T, right: R, bottom: B, width: Math.max(0, R - L), height: Math.max(0, B - T) }; };
    const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; let n = e; while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .15) return null; if (n.hidden) return null; n = n.parentElement; } if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return null; return r; };
    // verdeckt: kein Eckpunkt/Mittelpunkt liefert das Element selbst, ein Kind oder einen Vorfahren (z. B. HUD unter dem Menü)
    const covered = e => { const r = e.getBoundingClientRect(), pts = [[.5, .5], [.2, .5], [.8, .5], [.5, .2], [.5, .8]]; for (const [u, v] of pts) { const h = document.elementFromPoint(r.left + r.width * u, r.top + r.height * v); if (h && (h === e || e.contains(h) || h.contains(e))) return false; } return true; };
    const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const cr = (a, b) => { const l1 = Math.max(a, b), l2 = Math.min(a, b); return (l1 + .05) / (l2 + .05); };
    const name = e => (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
    const res = { touch: { n: 0, small: [] }, contrast: { n: 0, fail: [], min: 99 }, overlap: [], overflow: [] };
    // Touch-Ziele
    const inter = [...document.querySelectorAll('button,a[href],input,select,summary,[role=button],[role=switch],.seg button,#mmBtn,#hudP,.cap,.ibox')].filter(e => vis(e) && !covered(e));
    const seen = new Set(), hits = [];
    for (const e of inter) {
      const r = e.getBoundingClientRect(), c = [r.left + r.width / 2, r.top + r.height / 2];
      if (e.matches('.ibox') && !e.matches('button')) continue;
      // effektive Trefferfläche: Raster um die Mitte, Punkte, an denen elementFromPoint das Element (oder Kind) liefert
      let x0 = c[0], x1 = c[0], y0 = c[1], y1 = c[1];
      const inE = (x, y) => { const h = document.elementFromPoint(x, y); return !!h && (e === h || e.contains(h)); };
      { const q = clipR(e); if (q.width * q.height < .6 * r.width * r.height) { res.touch.clipped = (res.touch.clipped || 0) + 1; continue; } }
      if (!inE(c[0], c[1])) { hits.push({ n: name(e), w: 0, h: 0, covered: true, txt: (e.textContent || '').trim().slice(0, 18) }); continue; }
      for (let d = 0; d <= 40; d += 2) { if (inE(c[0] - d, c[1])) x0 = c[0] - d; else break; }
      for (let d = 0; d <= 40; d += 2) { if (inE(c[0] + d, c[1])) x1 = c[0] + d; else break; }
      for (let d = 0; d <= 40; d += 2) { if (inE(c[0], c[1] - d)) y0 = c[1] - d; else break; }
      for (let d = 0; d <= 40; d += 2) { if (inE(c[0], c[1] + d)) y1 = c[1] + d; else break; }
      const w = Math.max(r.width, x1 - x0), h = Math.max(r.height, y1 - y0), k = name(e);
      res.touch.n++;
      if (Math.min(w, h) < (opt.minTouch || 48) - .5) { const key = k + Math.round(w) + 'x' + Math.round(h); if (!seen.has(key)) { seen.add(key); res.touch.small.push({ n: k, w: Math.round(w), h: Math.round(h), txt: (e.textContent || '').trim().slice(0, 18) }); } }
    }
    res.touch.covered = hits.length;
    // Kontrast: Vordergrund aus Computed Style, Hintergrund = Median der gerenderten Pixel im Textrechteck
    const textEls = [...document.querySelectorAll('body *')].filter(e => { if (['SCRIPT', 'STYLE', 'CANVAS', 'SVG', 'PATH'].includes(e.tagName.toUpperCase())) return false; const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0); return own && vis(e) && !covered(e); });
    const done = new Set();
    for (const e of textEls) {
      const r0 = vis(e), cs = getComputedStyle(e), fs = parseFloat(cs.fontSize); if (fs < 8) continue;
      const r = clipR(e); if (r.width * r.height < .6 * r0.width * r0.height) { res.contrast.clipped = (res.contrast.clipped || 0) + 1; continue; }
      const m = cs.color.match(/[\d.]+/g).map(Number); let op = 1, n = e; while (n && n !== document.body) { op *= +getComputedStyle(n).opacity; n = n.parentElement; }
      const x = Math.max(0, Math.round(r.left * dpr)), y = Math.max(0, Math.round(r.top * dpr)), w = Math.min(cv.width - x, Math.round(r.width * dpr)), h = Math.min(cv.height - y, Math.round(r.height * dpr)); if (w < 3 || h < 3) continue;
      const d = cx.getImageData(x, y, w, h).data, L = [], px = [];
      const step = Math.max(1, Math.floor(d.length / 4 / 600));
      for (let i = 0; i < d.length; i += 4 * step) { px.push([d[i], d[i + 1], d[i + 2]]); L.push(lum(d[i], d[i + 1], d[i + 2])); }
      const idx = L.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]), med = px[idx[Math.floor(idx.length / 2)][1]];
      const a = (m[3] == null ? 1 : m[3]) * op, fg = [0, 1, 2].map(i => m[i] * a + med[i] * (1 - a)), c = cr(lum(...fg), lum(...med));
      const key = name(e) + '|' + Math.round(c * 10); if (done.has(key)) continue; done.add(key);
      res.contrast.n++; const large = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700), lim = large ? 3 : 4.5;
      if (c < res.contrast.min) res.contrast.min = +c.toFixed(2);
      if (c < lim) res.contrast.fail.push({ n: name(e), c: +c.toFixed(2), fs: Math.round(fs), txt: (e.textContent || '').trim().slice(0, 24) });
    }
    // Überlappung interaktiver Elemente (nicht Eltern/Kind, nur sichtbare Kopf-/Steuer-/Kartenelemente)
    const L = inter.filter(e => !e.closest('details>div,.seg') || true).map(e => [e, vis(e) && clipR(e)]).filter(a => a[1] && a[1].width > 2 && a[1].height > 2 && a[1].width < innerWidth * .9);
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const [A, a] = L[i], [Bn, b] = L[j]; if (A.contains(Bn) || Bn.contains(A)) continue;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 4 && oy > 4 && ox * oy > .15 * Math.min(a.width * a.height, b.width * b.height)) res.overlap.push(name(A) + ' × ' + name(Bn) + ' (' + Math.round(ox) + '×' + Math.round(oy) + ')');
    }
    // Textüberlauf: Element läuft rechts/unten aus dem Bild oder scrollWidth > clientWidth bei Text in Buttons/Labels
    for (const e of textEls) { const r = e.getBoundingClientRect(); if (r.right > innerWidth + 2 || r.left < -2) res.overflow.push(name(e) + ' ' + Math.round(r.left) + '…' + Math.round(r.right) + ' "' + (e.textContent || '').trim().slice(0, 16) + '"'); else if (e.scrollWidth > e.clientWidth + 3 && getComputedStyle(e).overflow !== 'visible' && getComputedStyle(e).textOverflow !== 'ellipsis') res.overflow.push(name(e) + ' scrollW ' + e.scrollWidth + ' > ' + e.clientWidth); }
    res.overlap = [...new Set(res.overlap)].slice(0, 12); res.overflow = [...new Set(res.overflow)].slice(0, 10);
    return res;
  }, [b64, opt]);
}
