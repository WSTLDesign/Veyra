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
const body = fs.readFileSync(src, 'utf8');
fs.writeFileSync(path.join(tmp, 'index.html'),
  '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">' +
  '<style>:root{color-scheme:dark}body{margin:0;background:#0c1519;font:14px system-ui,sans-serif}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>');
const note = process.argv[2] || 'Werkstatt';
execFileSync('node', [path.join(root, 'tools/make-staging.mjs'), tmp, out, '--note', note], { stdio: 'inherit' });
execFileSync('node', [path.join(root, 'tools/protect.mjs'), out], { stdio: 'inherit' });
const dest = path.join(root, 'tools/leitstand/spiel'); fs.mkdirSync(dest, { recursive: true });
fs.copyFileSync(path.join(out, 'index.html'), path.join(dest, 'index.html'));
const mb = fs.statSync(path.join(dest, 'index.html')).size / 1e6;
if (mb > 16) { console.error(`ABBRUCH: Werkstatt-Build ${mb.toFixed(1)} MB > 16 MB`); process.exit(1); }
console.log(`Werkstatt-Build fertig: tools/leitstand/spiel/index.html (${mb.toFixed(1)} MB)`);
