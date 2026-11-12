#!/usr/bin/env node
// Veyra – Code-Schutz für veröffentlichte Builds (Live und Staging).
// Aufruf: node tools/protect.mjs <build-ordner>
// Ein Web-Spiel muss seinen Code an den Browser schicken; verschlüsseln geht dort nicht.
// Dieses Skript macht ihn unkenntlich:
//  - Hauptskript: alle Kommentare raus, komprimiert, ALLE Namen (auch globale Funktionen/Variablen) verkürzt
//  - CSS- und HTML-Kommentare raus
//  - sw.js minifiziert, keine Source-Maps
// Namen, die aus HTML-Strings heraus aufgerufen werden (z. B. onerror="artImgErr(this)"), werden automatisch erkannt
// und bleiben erhalten. Fehlt ein solcher Name, bricht der Smoke-Test – nicht erst das Kind beim Spielen.
import fs from 'node:fs';
import path from 'node:path';
import { minify } from 'terser';

const dir = path.resolve(process.argv[2] || 'dist');
const idx = path.join(dir, 'index.html');
if (!fs.existsSync(idx)) { console.error('ABBRUCH: index.html fehlt in ' + dir); process.exit(1); }
let html = fs.readFileSync(idx, 'utf8');
const before = html.length;

// 1) Spielcode-Block finden (alle src/*.js gebündelt, bei Staging inkl. Overlay)
const re = /<script>([\s\S]*?)<\/script>/g; let best = null, m;
// Spielcode = Block mit den meisten Funktionen (nicht der größte: im Werkstatt-Build ist der eingebettete Bilderblock größer)
const fnCount = c => (c.match(/\bfunction\b|=>/g) || []).length;
while ((m = re.exec(html))) { const n = fnCount(m[1]); if (!best || n > best.n) best = { n, code: m[1], start: m.index, end: m.index + m[0].length }; }
if (!best || best.code.length < 100000) { console.error('ABBRUCH: Spielcode-Block nicht gefunden'); process.exit(1); }

// 2) Namen schützen, die aus Strings/Attributen aufgerufen werden: on…="name(" oder on…='name('
const reserved = new Set();
for (const r of [/on[a-z]+=\\?["']([A-Za-z_$][\w$]*)\(/g]) for (const x of html.matchAll(r)) reserved.add(x[1]);

const res = await minify(best.code, {
  ecma: 2020, toplevel: true,
  compress: { passes: 2, drop_debugger: true, keep_infinity: true, pure_getters: false, unsafe: false },
  mangle: { toplevel: true, reserved: [...reserved] },
  format: { comments: false, ascii_only: false }
});
if (!res.code) { console.error('ABBRUCH: Minifizierung fehlgeschlagen'); process.exit(1); }
html = html.slice(0, best.start) + '<script>' + res.code + '</script>' + html.slice(best.end);

// 3) Restliche Kommentare: CSS in <style>, HTML <!-- -->
html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => '<style>' + css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n+/g, '\n') + '</style>');
html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
fs.writeFileSync(idx, html);

// 4) Service Worker
const sw = path.join(dir, 'sw.js');
if (fs.existsSync(sw)) { const r = await minify(fs.readFileSync(sw, 'utf8'), { compress: true, mangle: true, format: { comments: false } }); fs.writeFileSync(sw, r.code); }

// 5) Nichts Internes ausliefern
for (const f of ['artifact.html']) fs.rmSync(path.join(dir, f), { force: true });
for (const f of fs.readdirSync(dir, { recursive: true })) if (/\.map$|_DRAFT\./i.test(f)) fs.rmSync(path.join(dir, f), { force: true });

const left = (html.match(/\/\/ =====|AGENTS\.md|PROGRESS\.md|docs\//g) || []).length;
console.log(`Code geschützt: ${dir}/index.html ${(before / 1e6).toFixed(2)} MB → ${(html.length / 1e6).toFixed(2)} MB, geschützte Namen: ${[...reserved].join(', ')}${left ? `, Hinweis: ${left} interne Verweise in Texten übrig` : ''}`);
