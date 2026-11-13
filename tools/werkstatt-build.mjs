#!/usr/bin/env node
// Veyra – Werkstatt-Build für den Staging-Leitstand (Bereich „Werkstatt“).
// Aufruf (nach `node build.mjs`): node tools/werkstatt-build.mjs
// dist/artifact.html (eine Datei, Bilder eingebettet, three.js vom CDN) → vollständiges Dokument
// → Staging-Variante (eigener Spielstand, Debug-Menü) → Code-Schutz → tools/leitstand/spiel/index.html
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'dist/artifact.html');
if (!fs.existsSync(src)) { console.error('ABBRUCH: dist/artifact.html fehlt – zuerst node build.mjs'); process.exit(1); }
const tmp = path.join(root, 'build/werkstatt-src'), out = path.join(root, 'build/werkstatt');
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
let body = fs.readFileSync(src, 'utf8');
// Loader und Draco-Decoder aus eigenen Dateien (spiel/vendor/), denn die Artifact-Sicherheitsregeln blockieren Datei-Abrufe von CDNs
body = body.replace(/window\.VENDOR_JS=\[[^\]]*\];/, 'window.VENDOR_JS=["vendor/"];');
if (!body.includes('window.VENDOR_JS=["vendor/"]')) { console.error('ABBRUCH: VENDOR_JS nicht gefunden'); process.exit(1); }
// 3D-Modelle: GLB werden als Skriptdateien (data-URI) ausgeliefert, weil Artifacts keine .glb-Dateien bereitstellen.
// Alle Bereichs-Ordner unter public/models/ (pilot, figuren, …) → spiel/models/<bereich>/<id>.js, Schlüssel = Modell-ID (Dateiname ohne .glb)
const modRoot = path.join(root, 'public/models');
let modTags = ''; const lazy = {};
for (const area of fs.existsSync(modRoot) ? fs.readdirSync(modRoot).filter(d => fs.statSync(path.join(modRoot, d)).isDirectory()).sort() : []) {
  const modDir = path.join(modRoot, area), modOut = path.join(root, 'tools/leitstand/spiel/models', area); fs.mkdirSync(modOut, { recursive: true });
  for (const f of fs.readdirSync(modDir).filter(x => x.endsWith('.glb')).sort()) {
    const id = f.replace(/\.glb$/, ''), b64 = fs.readFileSync(path.join(modDir, f)).toString('base64');
    fs.writeFileSync(path.join(modOut, id + '.js'), `(window.PILOT_SRC=window.PILOT_SRC||{})[${JSON.stringify(id)}]="data:model/gltf-binary;base64,${b64}";\n`);
    lazy[id] = `models/${area}/${id}.js`;
  }
}
// Stabilität PC (13.11.): Modelle nicht mehr alle im Kopf laden (≈ 26 MB Skript, blockierte den gemeinsamen Hauptthread des Leitstands),
// sondern als Liste – 61-stabil.js lädt das Skript eines Modells erst, wenn es gebraucht wird (Warteschlange, eins nach dem anderen).
modTags = '<script>window.PILOT_LAZY=' + JSON.stringify(lazy) + ';</script>';
fs.writeFileSync(path.join(tmp, 'index.html'),
  '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">' +
  '<style>:root{color-scheme:dark}body{margin:0;background:#0c1519;font:14px system-ui,sans-serif}[hidden]{display:none!important}</style>' + modTags + '</head><body>' + body + '</body></html>');
const note = process.argv[2] || 'Werkstatt';
execFileSync('node', [path.join(root, 'tools/make-staging.mjs'), tmp, out, '--note', note], { stdio: 'inherit' });
execFileSync('node', [path.join(root, 'tools/protect.mjs'), out], { stdio: 'inherit' });
const dest = path.join(root, 'tools/leitstand/spiel'); fs.mkdirSync(dest, { recursive: true });
fs.copyFileSync(path.join(out, 'index.html'), path.join(dest, 'index.html'));
const mb = fs.statSync(path.join(dest, 'index.html')).size / 1e6;
if (mb > 16) { console.error(`ABBRUCH: Werkstatt-Build ${mb.toFixed(1)} MB > 16 MB`); process.exit(1); }
console.log(`Werkstatt-Build fertig: tools/leitstand/spiel/index.html (${mb.toFixed(1)} MB)`);
