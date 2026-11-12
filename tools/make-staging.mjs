#!/usr/bin/env node
// Veyra – Staging-Build aus einem fertigen Web-Build erzeugen.
// Aufruf: node tools/make-staging.mjs <web-build-ordner> <ziel-ordner> [--note "Text"]
// Funktioniert mit jedem dist-/veyra-web-Stand: kopiert alles und ändert nur, was Staging von Live trennt.
// Bricht ab (Exit 1), wenn ein erwarteter Speicher-Schlüssel nicht genau einmal gefunden wird –
// lieber kein Staging als eines, das den echten Spielstand überschreibt.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [src, out, ...rest] = process.argv.slice(2);
if (!src || !out) { console.error('Aufruf: node tools/make-staging.mjs <web-build> <ziel> [--note "Text"]'); process.exit(2); }
const note = rest[0] === '--note' ? rest[1] || '' : '';
const fail = m => { console.error('ABBRUCH: ' + m); process.exit(1); };

// 1) Kopieren
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });

// 2) Version und Zeitstempel
const idxPath = path.join(out, 'index.html');
if (!fs.existsSync(idxPath)) fail('index.html fehlt im Build');
let html = fs.readFileSync(idxPath, 'utf8');
const version = (html.match(/name="veyra-version" content="([^"]+)"/) || [])[1] || '0.0.0';
const built = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' });
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);

// 3) Speicher trennen: jeder Schlüssel muss genau einmal vorkommen
const KEYS = [
  ["'veyra_save_v1'", "'veyra_stg_save_v1'"], // Spielstand (localStorage, inkl. _bak_/_kaputt-Ableitungen)
  ["'veyra_set'", "'veyra_stg_set'"],         // Einstellungen
  ["'veyra_save'", "'veyra_stg_save'"],       // IndexedDB-Spiegel
  ["'veyra_persist'", "'veyra_stg_persist'"], // storage.persist-Merker
  ["'veyra-spielstand-'", "'veyra-STAGING-spielstand-'"] // Dateiname beim Export
];
const report = [];
for (const [a, b] of KEYS) {
  const n = html.split(a).length - 1;
  if (n !== 1) fail(`Schlüssel ${a} kommt ${n}× vor (erwartet 1×) – Spielversion hat sich geändert, make-staging.mjs anpassen`);
  html = html.replace(a, b); report.push(`${a} → ${b}`);
}
// Sicherheitsnetz: kein alter Schlüssel darf übrig sein
const left = html.match(/['"]veyra_(?!stg_)[a-z0-9_]+['"]/g);
if (left) fail('Unbekannte Live-Schlüssel gefunden: ' + [...new Set(left)].join(', '));

// 4) Kennzeichnung, Overlay, noindex
const overlay = fs.readFileSync(path.join(here, 'staging-overlay.js'), 'utf8');
const info = { version, built, stamp, note, prefix: 'veyra_stg', db: 'veyra_stg_save' };
html = html.replace(/<head>/i, '<head><meta name="robots" content="noindex,nofollow"><meta name="veyra-env" content="staging">');
html = html.replace(/(<meta name="theme-color" content=")[^"]*/i, '$1#ff8a00');
html = html.replace(/<\/body>/i, `<script>window.VEYRA_STAGING=${JSON.stringify(info)};</script>\n<script>\n${overlay}\n</script>\n</body>`);
if (!html.includes('window.VEYRA_STAGING=')) fail('Overlay konnte nicht eingefügt werden (kein </body>)');
fs.writeFileSync(idxPath, html);

// 5) Service Worker: eigene Cache-Namen + Build-Stempel, damit jede Staging-Version sicher neu lädt
const swPath = path.join(out, 'sw.js');
if (fs.existsSync(swPath)) {
  let sw = fs.readFileSync(swPath, 'utf8');
  const c1 = sw.match(/const CACHE = '([^']+)'/), c2 = sw.match(/const VCACHE = '([^']+)'/);
  if (!c1 || !c2) fail('Cache-Namen im sw.js nicht gefunden');
  sw = sw.replace(c1[0], `const CACHE = 'veyra-stg-${version}-${stamp}'`).replace(c2[0], `const VCACHE = 'veyra-stg-video-1'`);
  // Aufräumen nur innerhalb der Staging-Caches (eigener Origin, aber sicher ist sicher)
  sw = sw.replace("ks.filter(k => k !== CACHE && k !== VCACHE)", "ks.filter(k => k.startsWith('veyra-stg-') && k !== CACHE && k !== VCACHE)");
  fs.writeFileSync(swPath, sw); report.push('sw.js: Cache veyra-stg-' + version + '-' + stamp);
}

// 6) Manifest: eigener Name, eigene App-ID → am Handy als zweite App neben Live installierbar
const mfPath = path.join(out, 'manifest.webmanifest');
if (fs.existsSync(mfPath)) {
  const mf = JSON.parse(fs.readFileSync(mfPath, 'utf8'));
  mf.name = 'Veyra STAGING'; mf.short_name = 'Veyra STG'; mf.id = './?env=staging'; mf.theme_color = '#ff8a00';
  fs.writeFileSync(mfPath, JSON.stringify(mf, null, 2));
}

// 7) Netlify: nie indexieren, index.html und sw.js nie cachen (sonst sieht man alte Stände)
fs.writeFileSync(path.join(out, '_headers'), [
  '/*', '  X-Robots-Tag: noindex, nofollow', '',
  '/index.html', '  Cache-Control: no-cache', '',
  '/', '  Cache-Control: no-cache', '',
  '/sw.js', '  Cache-Control: no-cache', '',
  '/manifest.webmanifest', '  Cache-Control: no-cache', ''
].join('\n'));
fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(out, 'staging.json'), JSON.stringify({ env: 'staging', ...info, keys: report }, null, 2));

console.log(`Staging-Build fertig: ${out}\n  Version ${version}, Build ${built}${note ? ' – ' + note : ''}\n  ` + report.join('\n  '));
