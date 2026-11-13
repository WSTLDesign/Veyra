// Erzeugt App-Icons aus dem 3D-Modell der Veyra-Legende Solaryn (Kopf-Nahaufnahme, nach Design-Recherche: nur Kreaturkopf, kein Text)
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
await page.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
const render = async (size, pad) => page.evaluate(([size, pad]) => {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(size, size, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2; r.setClearColor(0, 0);
  const s = new THREE.Scene(); studio(s); const m = buildMon3D(28, 1); m.rotation.y = -Math.PI / 2 - .55; s.add(m); m.updateMatrixWorld(true);
  const hb = new THREE.Box3().setFromObject(m.userData.head), hp = hb.getCenter(new THREE.Vector3()), hs = hb.getSize(new THREE.Vector3()).length();
  const cam = new THREE.PerspectiveCamera(30, 1, .05, 50); const d = hs * 1.55 * (1 + pad); cam.position.set(hp.x + d * .3, hp.y + d * .2, hp.z + d * .95); cam.lookAt(hp.x, hp.y - hs * .05, hp.z); r.render(s, cam);
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const g = x.createRadialGradient(size * .5, size * .42, size * .05, size * .5, size * .5, size * .75); g.addColorStop(0, '#ffd27a'); g.addColorStop(.55, '#f08a3c'); g.addColorStop(1, '#8a3a1a'); x.fillStyle = g; x.fillRect(0, 0, size, size);
  const gl = x.createRadialGradient(size * .5, size * .55, size * .1, size * .5, size * .55, size * .45); gl.addColorStop(0, 'rgba(255,245,200,.55)'); gl.addColorStop(1, 'rgba(255,245,200,0)'); x.fillStyle = gl; x.fillRect(0, 0, size, size);
  x.drawImage(r.domElement, 0, 0); r.dispose(); return c.toDataURL('image/png').split(',')[1];
}, [size, pad]);
const out = (name, b64) => writeFileSync(new URL('../public/icons/' + name, import.meta.url), Buffer.from(b64, 'base64'));
out('icon-512.png', await render(512, 0)); out('icon-192.png', await render(192, 0)); out('apple-touch-icon.png', await render(180, 0)); out('icon-maskable-512.png', await render(512, .45));
await browser.close(); console.log('Icons erzeugt.');
