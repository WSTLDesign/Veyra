// Veyra – Build: bündelt src/ zu dist/index.html (eigenständige App/PWA) und dist/artifact.html (claude.ai-Artifact)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, statSync, cpSync, rmSync } from 'fs';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const scripts = readdirSync(new URL('./src', import.meta.url)).filter(f => /^\d\d-.*\.js$/.test(f)).sort().map(f => read('./src/' + f)).join('\n');
// CSS: styles.css + Zusatzblöcke src/styles-*.css (alphabetisch, danach angehängt; z. B. styles-map.css = Große Karte)
const css = [read('./src/styles.css'), ...readdirSync(new URL('./src', import.meta.url)).filter(f => /^styles-[\w-]+\.css$/.test(f)).sort().map(f => `/* ---- ${f} ---- */\n` + read('./src/' + f))].join('\n'), shell = read('./src/shell.html');
const version = JSON.parse(read('./package.json')).version;
// Kreaturen-Illustrationen: public/art/<id>_<name>.png → ART_SRC[id]; App: Pfad art/…, Artifact: data-URI (eine Datei)
const artDir = new URL('./public/art/', import.meta.url);
const artFiles = existsSync(artDir) ? readdirSync(artDir).filter(f => /^[\w-]+\.(png|webp)$/.test(f) && !/_DRAFT\./i.test(f)).sort() : [];
// Hybrid-Himmel (44-sky.js, docs/hybrid-sky.md): sky_/horizon_/bg_battle_*.webp – Artifact bettet nur die _lo-Varianten ein (16-MB-Grenze), App alle; Metadaten sky_meta.json → window.SKY_META
const skyLoOnly = f => /^(sky|horizon|bg_battle)_/.test(f) && !/_lo\.webp$/.test(f);
// Hybrid H2 (45-hybrid.js, docs/hybrid-h2.md): Ortsansichten place_<karte> und Kapitelbilder chapter_<n> sind klein (WebP, weich) → Artifact bettet die volle Fassung ein und spart die _lo-Variante (Laufzeit nimmt dann die volle)
const hyLoSkip = f => /^(place|chapter)_.*_lo\.webp$/.test(f);
const skyMetaJs = () => { const f = new URL('sky_meta.json', artDir); return existsSync(f) ? `<script>window.SKY_META=${JSON.stringify(JSON.parse(readFileSync(f, 'utf8')))};</script>\n` : ''; };
const artMap = (inline) => { const o = {}; for (const f of artFiles) { if (inline && (skyLoOnly(f) || hyLoSkip(f))) continue; const id = /^\d/.test(f) ? +f.split('_')[0] : f.replace(/\.(png|webp)$/,''); o[id] = inline ? 'data:image/' + (f.endsWith('.png') ? 'png' : 'webp') + ';base64,' + readFileSync(new URL(f, artDir)).toString('base64') : 'art/' + f; } return `<script>window.ART_SRC=${JSON.stringify(o)};</script>\n`; };
// GLB-Modelle (Loop A2): public/models/<id>_<name>.glb → MODEL_SRC[id]; App: Pfad models/…, Artifact: data-URI nur bei kleinen Dateien (zusammen ≤ 1,5 MB), sonst Sprite-Fallback
const modelDir = new URL('./public/models/', import.meta.url);
const modelFiles = existsSync(modelDir) ? readdirSync(modelDir).filter(f => /^\d+_[\w-]+\.glb$/.test(f)).sort() : [];
const modelBytes = modelFiles.reduce((a, f) => a + statSync(new URL(f, modelDir)).size, 0);
const modelMap = (inline) => { const o = {}; if (!inline || modelBytes <= 1.5e6) for (const f of modelFiles) o[+f.split('_')[0]] = inline ? 'data:model/gltf-binary;base64,' + readFileSync(new URL(f, modelDir)).toString('base64') : 'models/' + f; return o; };
// three r128 examples/js (GLTFLoader, DRACOLoader, SkeletonUtils, Draco-Decoder): App lokal vendor/, Artifact vom CDN (cdnjs r128/examples, Ausweichpfad jsDelivr)
const vendorJs = (inline) => inline ? ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/'] : ['vendor/'];
// Intro-Film (44-introvideo.js): App bindet public/video/ ein (dist/video), Artifact nur das Poster als data-URI (16-MB-Grenze) → window.INTRO_VIDEO=null
const vidDir = new URL('./public/video/', import.meta.url), vidHas = f => existsSync(new URL(f, vidDir));
const introJs = (inline) => { const P = 'intro_poster.jpg', poster = vidHas(P) ? (inline ? 'data:image/jpeg;base64,' + readFileSync(new URL(P, vidDir)).toString('base64') : 'video/' + P) : null;
  const V = !inline && vidHas('intro_720.mp4') ? { hd: 'video/intro_720.mp4', sd: vidHas('intro_480.mp4') ? 'video/intro_480.mp4' : 'video/intro_720.mp4', poster, type: 'video/mp4' } : null;
  return `<script>window.INTRO_VIDEO=${JSON.stringify(V)};window.INTRO_POSTER=${JSON.stringify(poster)};</script>\n`; };
const body = (threeSrc, inlineArt) => shell.replace('</title>', `</title>\n<meta name="veyra-version" content="${version}">`) + `<style>\n${css}</style>\n<script src="${threeSrc}"></script>\n` + artMap(inlineArt) + skyMetaJs() + introJs(inlineArt) + `<script>window.MODEL_SRC=${JSON.stringify(modelMap(inlineArt))};window.VENDOR_JS=${JSON.stringify(vendorJs(inlineArt))};</script>\n` + `<script>\n${scripts}\n</script>\n`;
mkdirSync(new URL('./dist/icons', import.meta.url), { recursive: true });
// 1) Artifact: ohne Dokument-Skelett (liefert claude.ai), three.js vom CDN
writeFileSync(new URL('./dist/artifact.html', import.meta.url), body('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', true));
// 2) Eigenständige App: vollständiges Dokument, lokale Bibliothek, Manifest, Service Worker
const app = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0c1519">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>:root{color-scheme:dark;box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body('three.min.js', false)}<script>if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>
</body>
</html>
`;
writeFileSync(new URL('./dist/index.html', import.meta.url), app);
for (const f of ['three.min.js', 'manifest.webmanifest']) copyFileSync(new URL('./public/' + f, import.meta.url), new URL('./dist/' + f, import.meta.url));
writeFileSync(new URL('./dist/sw.js', import.meta.url), read('./public/sw.js').replace('__VERSION__', version).replace('__ART__', JSON.stringify(artFiles.filter(f => /^\d/.test(f)).map(f => './art/' + f))));
mkdirSync(new URL('./dist/art', import.meta.url), { recursive: true });
for (const f of artFiles) copyFileSync(new URL(f, artDir), new URL('./dist/art/' + f, import.meta.url));
for (const d of ['models', 'vendor', 'video']) { const src = new URL('./public/' + d, import.meta.url), dst = new URL('./dist/' + d, import.meta.url); rmSync(dst, { recursive: true, force: true }); if (existsSync(src)) cpSync(src, dst, { recursive: true }); }
for (const f of readdirSync(new URL('./public/icons', import.meta.url))) copyFileSync(new URL('./public/icons/' + f, import.meta.url), new URL('./dist/icons/' + f, import.meta.url));
// Entwürfe (*_DRAFT.*, nur intern in public/art_ref) dürfen nie im Release landen
const drafts = readdirSync(new URL('./dist', import.meta.url), { recursive: true }).filter(f => /_DRAFT\./i.test(String(f)));
if (drafts.length) { console.error('FEHLER: Entwurfsbilder in dist/: ' + drafts.join(', ')); process.exit(1); }
console.log(`Veyra ${version} gebaut: dist/index.html (App), dist/artifact.html (Artifact)` + (modelFiles.length ? ` · ${modelFiles.length} GLB-Modell(e)` : ''));
