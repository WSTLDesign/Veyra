// Veyra – Offline-Render-Pipeline (Hybrid H1): Skyboxen, Horizont-Kulissen, Kampfhintergründe je Region × Tageszeit.
// Aufruf:  node tools/render_assets.mjs [sky|horizon|battle|all] [--region r1,r2] [--time tag,abend] [--ss 2] [--preview]
//          node tools/render_assets.mjs place [--map morgenau,route1] [--ss 2] [--preview]   (Hybrid H2: Ortsansichten aus der Spielkarte, braucht dist/ → vorher node build.mjs)
//          node tools/render_assets.mjs chapter   (Hybrid H2: Kapitel-Standbilder aus den Intro-Stills → public/art/chapter_<n>.webp, 1280×720 q70 + _lo 640×360)
//   --preview: kleine Vorschau (ohne Supersampling) nach $VEYRA_PREVIEW (Standard: Systemtemp/veyra_preview), schreibt nichts nach public/.
// Ablauf: headless Chromium (SwiftShader) öffnet tools/assets/scene.html (three.js r128 aus public/), rendert streifenweise in ein
// Render-Target in ss-facher Auflösung, Python/PIL skaliert (Lanczos) auf Zielgröße, kodiert WebP (q75, Größenobergrenze) + _lo-Variante
// und misst Mittelfarben (Himmel oben/Horizont/unten) → public/art/sky_meta.json (Sonnenrichtung/-farbe, Umgebungsfarben, Kampf-Kamera).
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { extname, join, normalize } from 'path';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
const ROOT = fileURLToPath(new URL('..', import.meta.url)), ART = join(ROOT, 'public/art');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const what = args[0] && !args[0].startsWith('--') ? args[0] : 'all', PREVIEW = !!opt('preview'), SS = +(opt('ss') || (PREVIEW ? 1 : 2));
const PREV = process.env.VEYRA_PREVIEW || join(tmpdir(), 'veyra_preview'), TMP = join(tmpdir(), 'veyra_render');
export const REGIONS = ['lichtlande', 'smaragdwald', 'flutkueste', 'glutlande', 'kristallgebirge', 'frosttundra', 'himmelsweiten', 'schattenmoor'];
export const TIMES = ['tag', 'abend', 'nacht'];
const REG = (opt('region') && opt('region') !== true ? opt('region').split(',') : REGIONS), TIM = (opt('time') && opt('time') !== true ? opt('time').split(',') : TIMES);
// Zielgrößen (siehe docs/hybrid-sky.md)
const OUT = { place: { w: 1024, h: 576, q: 72, max: 120e3, lo: [512, 288, 66] }, sky: { w: 2048, h: 1024, q: 75, max: 350e3, lo: [1024, 512, 70] }, horizon: { w: 2048, h: 512, q: 80, max: 220e3, lo: [1024, 256, 75] }, battle: { w: 1280, h: 720, q: 75, max: 250e3, lo: [640, 360, 70] } };
// ---------- Himmels-Parameter: Grundwerte je Tageszeit (Farben aus den Intro-Stills abgeleitet: Zenit graublau, Horizont warmes Creme, Wolken creme mit lavendelgrauen Schatten) ----------
const BASE = {
  tag: { topFade: .8, sunAz: -30, sunEl: 40, sunI: 1, sunSize: .026, zen: '#5a84c4', mid: '#90aed6', hor: '#e9ddcc', below: '#d9d2cc', haze: '#eee4d8', sunCol: '#fff0d8', glowCol: '#ffdcae', glowI: .8,
    cloudLit: '#fffaf2', cloudShd: '#b2b4ca', seaLit: '#fffaf2', seaShd: '#a9abc0', cov: .58, cloudAmt: 1, cumAmt: .9, cumH: .34, cirrus: .3, seaAmt: .92, seaCov: .4, seaY: -.012, hazeAmt: .55, hazeK: 20, rays: .32, moonEl: -40, expo: 1 },
  abend: { sunAz: -70, sunEl: 6.5, sunI: 1.1, sunSize: .032, zen: '#3c4c86', mid: '#9a87aa', hor: '#f5b07e', below: '#b88a8a', haze: '#f2bf98', sunCol: '#ffb46c', glowCol: '#ff9a5a', glowI: 1.15,
    cloudLit: '#ffcf9c', cloudShd: '#806f94', seaLit: '#ffd6ac', seaShd: '#86769c', cov: .58, cloudAmt: 1, cumAmt: .9, cumH: .34, cirrus: .28, seaAmt: .92, seaCov: .4, seaY: -.012, hazeAmt: .6, hazeK: 18, rays: .6, moonEl: -30, expo: 1 },
  nacht: { sunAz: 60, sunEl: -30, sunI: 0, sunSize: .01, moonAz: -112, moonEl: 15, moonI: 1, moonCol: '#e6ecff', zen: '#050a1c', mid: '#0d1838', hor: '#25345c', below: '#1a2240', haze: '#2a3a64', glowCol: '#4a5c9a', glowI: 0,
    cloudLit: '#3e4c7c', cloudShd: '#10162e', seaLit: '#56689a', seaShd: '#161e3c', cov: .64, cloudAmt: .6, cumAmt: .55, cumH: .2, cirrus: .3, seaAmt: .9, seaCov: .42, seaY: -.012, hazeAmt: .45, hazeK: 22, rays: 0, stars: 1, milky: .8, expo: 1 }
};
// Regions-Abweichungen (eigene Licht-Dramaturgie je Region, WELT-KANON); Mond: moonPhase 0 = voll, 1 = Sichel
const REGP = {
  lichtlande: { tag: { glowCol: '#ffd496', hor: '#efdcc0', rays: .45, haze: '#f2e4cc' }, abend: { hor: '#f8bc7e', glowCol: '#ffaa5a' }, nacht: { moonPhase: .15 } },
  smaragdwald: { tag: { zen: '#5a88b8', mid: '#94b4c8', hor: '#dfe2c8', haze: '#dfe4cc', below: '#c8d0b8', cloudShd: '#9aa8b0', seaShd: '#9ca8a8', glowCol: '#fbe2a0', cumAmt: 1, cumH: .26 },
    abend: { hor: '#f2c07e', haze: '#ecc898', mid: '#94929a', glowCol: '#ffb25a' }, nacht: { zen: '#04101a', mid: '#0a1e2c', hor: '#1d3a48', haze: '#21404c', cloudLit: '#4a6a7a', seaLit: '#5e8090', moonPhase: .5 } },
  flutkueste: { tag: { zen: '#3a7fd2', mid: '#7fb4e0', hor: '#d4eaf0', haze: '#e0eef2', below: '#5d9fc0', cov: .6, cumAmt: .7, cumH: .16, seaAmt: .35, seaCov: .55, rays: .25, glowCol: '#fff0c8' },
    abend: { zen: '#3a4a90', mid: '#b48aac', hor: '#ffae8e', haze: '#f8bca6', below: '#6a6a90', glowCol: '#ff8e7a', seaAmt: .4 }, nacht: { below: '#0e1a30', seaAmt: .3, moonPhase: 0 } },
  glutlande: { tag: { zen: '#6a5a86', mid: '#b48c96', hor: '#f0b088', haze: '#e0a688', below: '#8a5a54', sunCol: '#ffe0b4', glowCol: '#ffb070', cloudLit: '#ffe0c8', cloudShd: '#86687a', seaLit: '#f6d6c0', seaShd: '#7a5e6a', cov: .5, cirrus: .2, accAz: -90, accCol: '#ff5a1a', accI: .25, rays: .4 },
    abend: { zen: '#3a2450', mid: '#a0507a', hor: '#ff8a4a', haze: '#e88a60', cloudLit: '#ffb07a', cloudShd: '#5a3a5a', seaLit: '#ffb48a', seaShd: '#5e3a56', accAz: -90, accCol: '#ff4a10', accI: .45 },
    nacht: { zen: '#0c0510', mid: '#22101e', hor: '#4a1c22', haze: '#5a2226', below: '#2a1014', cloudLit: '#6a3a40', cloudShd: '#1a0c12', seaLit: '#8a4a44', seaShd: '#2a1418', accAz: -90, accCol: '#ff4a10', accI: .9, stars: .55, milky: .3, moonPhase: .35 } },
  kristallgebirge: { tag: { zen: '#3f74c6', mid: '#86ace0', hor: '#dde8f4', haze: '#e6eef8', below: '#c8d4e2', cloudShd: '#9eaac4', seaShd: '#a2aec6', cov: .57, cumAmt: .65, glowCol: '#fff0d2' },
    abend: { zen: '#34447e', mid: '#9a90b8', hor: '#f6bc98', haze: '#f2c8b0', glowCol: '#ffa070' }, nacht: { aurora: .4, aurA: '#3affb0', aurB: '#7a5cff', moonPhase: .6 } },
  frosttundra: { tag: { zen: '#7096c4', mid: '#a4bcda', hor: '#eaf0f6', haze: '#f0f4f8', below: '#dce6ee', cloudLit: '#ffffff', cloudShd: '#b0bcd0', seaLit: '#ffffff', seaShd: '#b4c0d2', sunCol: '#fff6e8', glowCol: '#fff0e0', glowI: .6, cov: .5, rays: .2 },
    abend: { zen: '#4a5a96', mid: '#c4a0c0', hor: '#f8c2b4', haze: '#f4d0c8', glowCol: '#ffa8a0', cloudLit: '#ffd8d0', cloudShd: '#8a84a8' }, nacht: { zen: '#03081a', mid: '#0a1a34', hor: '#1c3454', haze: '#203a5a', aurora: 1.1, aurA: '#2affa0', aurB: '#8a4cff', moonI: .7, moonPhase: .8, milky: .5 } },
  himmelsweiten: { tag: { zen: '#4a7ec8', mid: '#8ab0dc', hor: '#f0ebe0', haze: '#f6f0e6', seaAmt: 1, seaCov: .34, seaY: -.006, cumAmt: 1, cumH: .3, rays: .5, cov: .56 },
    abend: { seaAmt: 1, seaY: -.006, cumAmt: 1, cumH: .3, rays: .75 }, nacht: { seaAmt: 1, seaY: -.006, seaLit: '#8a9cd0', moonPhase: 0 } },
  schattenmoor: { tag: { zen: '#5f5f98', mid: '#9890b8', hor: '#d8c6d4', haze: '#d4c4d6', below: '#9a8aa8', sunCol: '#fff0e6', glowCol: '#f0c8d8', glowI: .6, cloudLit: '#f4ecf4', cloudShd: '#8a84a4', seaLit: '#e8dcec', seaShd: '#8a80a4', cov: .44, sunEl: 26, hazeAmt: .75, rays: .3 },
    abend: { zen: '#241a48', mid: '#7a4a8a', hor: '#e07a8a', haze: '#c47a9a', cloudLit: '#f0a0b0', cloudShd: '#4a3060', seaLit: '#d898b0', seaShd: '#4a3462', hazeAmt: .7 },
    nacht: { zen: '#060312', mid: '#140a2a', hor: '#2e1c48', haze: '#34224e', cloudLit: '#5a4a86', cloudShd: '#140c26', seaLit: '#6a5a98', seaShd: '#1a1230', moonPhase: 1, moonCol: '#f2e8ff', glowCol: '#6a4aa8', stars: 1.2, milky: 1 } }
};
export function skyParams(region, time) { return Object.assign({ seed: 1 + REGIONS.indexOf(region) * 3.1 + TIMES.indexOf(time) * .7 }, BASE[time], (REGP[region] || {})[time] || {}); }
// Licht der 3D-Kulissen: Horizont neutral (Laufzeit tönt nach Tageszeit), Kampf passend zur Tageszeit
const HAZE_H = '#c6d0dc';
function horizonLight(region) { return { sunAz: 110, sunEl: 34, sunCol: '#fff4e4', sunI: 2.3, hemiTop: '#c8d6ea', hemiBot: '#8a8a7a', hemiI: 1.15, haze: region === 'schattenmoor' ? '#b8b0c8' : region === 'glutlande' ? '#c8b0a8' : HAZE_H, fogD: .00046, night: 0 }; }
const GROUND = {
  lichtlande: { a: '#6a9450', b: '#84a85a', c: '#4f7a3c', d: '#e8c0cc', tintA: '#e8ece0', tintB: '#c8d4b0' },
  smaragdwald: { a: '#4a7e3c', b: '#5e9244', c: '#335e30', d: '#b8a258', tintA: '#e4ead8', tintB: '#b4c8a0' },
  flutkueste: { a: '#c8b48a', b: '#d6c49c', c: '#ae9a70', d: '#e6dcc6', tintA: '#dcd6c8', tintB: '#c8bca4', relief: 4, sink: 70, stretch: .4 },
  glutlande: { a: '#4a3a36', b: '#5c4842', c: '#2e2422', d: '#c8542a', tintA: '#ffffff', tintB: '#8a6a60' },
  kristallgebirge: { a: '#6e7e62', b: '#88947a', c: '#56604e', d: '#e0e8f0', tintA: '#e8ece8', tintB: '#cdd6de' },
  frosttundra: { a: '#dfe8ee', b: '#eef3f7', c: '#bccce0', d: '#a0bcd6', tintA: '#eef2f6', tintB: '#d0dce8', relief: 8, sink: 160 },
  himmelsweiten: { a: '#5e9442', b: '#7aac52', c: '#467c38', d: '#e8deaa', tintA: '#e8ece0', tintB: '#c4d8b0', sink: 70, sinkK: .9 },
  schattenmoor: { a: '#3e3a4c', b: '#4e4a5e', c: '#2a2836', d: '#7a5aa8', tintA: '#ffffff', tintB: '#8a84a0' }
};
function battleLight(region, time) { const P = skyParams(region, time), night = time === 'nacht';
  const sunAz = night ? P.moonAz : P.sunAz, sunEl = night ? P.moonEl : Math.max(P.sunEl, 4);
  return { sunAz, sunEl, sunCol: night ? '#9aaae0' : P.sunCol, sunI: night ? .5 : time === 'abend' ? 2.2 : 2.6, hemiTop: night ? '#30406a' : P.mid, hemiBot: night ? '#141a2a' : time === 'abend' ? '#6a5050' : '#7a7a62', hemiI: night ? .5 : 1.05,
    haze: P.haze, fogD: night ? .0009 : .00075, night: night ? 1 : time === 'abend' ? .35 : 0, ground: GROUND[region] }; }
// ---------- Server + Browser ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
function serve() { return new Promise(res => { const s = createServer(async (rq, rs) => { const p = normalize(join(ROOT, decodeURIComponent(new URL(rq.url, 'http://x').pathname))); if (!p.startsWith(ROOT)) { rs.writeHead(403); return rs.end(); }
  try { const b = await readFile(p); rs.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end(); } }); s.listen(0, '127.0.0.1', () => res({ url: 'http://127.0.0.1:' + s.address().port + '/', close: () => s.close() })); }); }
// ---------- Python/PIL: Skalieren, WebP, Messen ----------
const PY = String.raw`
import sys,json,os,numpy as np
from PIL import Image,ImageFilter
a=json.loads(sys.argv[1]);W,H=a['W'],a['H']
px=np.fromfile(a['raw'],dtype=np.uint8).reshape(H,W,4)[::-1]
im=Image.fromarray(np.ascontiguousarray(px),'RGBA')
rgba=a['alpha']
def rs(img,w,h):
  if rgba: return img.convert('RGBa').resize((w,h),Image.LANCZOS).convert('RGBA')
  return img.convert('RGB').resize((w,h),Image.LANCZOS)
def post(img):
  if a['kind']=='place':
    # filmische Vignette (sanft) – Ortsansicht als Standbild
    w,h=img.size;yy,xx=np.mgrid[0:h,0:w];d=np.sqrt(((xx-w/2)/(w/2))**2+((yy-h*.45)/(h*.62))**2);v=np.clip(1-.16*np.clip(d-.55,0,1)**1.4,0,1)[:,:,None]
    img=Image.fromarray(np.clip(np.asarray(img.convert('RGB')).astype(np.float32)*v,0,255).astype(np.uint8),'RGB')
  if a['kind']=='battle':
    # Tiefenwirkung: Vordergrund (unteres Drittel) weich, Horizont scharf
    bl=img.filter(ImageFilter.GaussianBlur(a['W']/a['ow']*1.6)); m=np.zeros((img.height,img.width),np.uint8); hy=int(a.get('hy',.6)*img.height)
    for y in range(img.height): m[y,:]=int(255*min(1,max(0,(y-hy-img.height*.08)/(img.height*.32))))
    img=Image.composite(bl,img,Image.fromarray(m,'L'))
  return img
def save(img,path,q,mx):
  while True:
    img.save(path,'WEBP',quality=q,method=6,exact=False) if rgba else img.save(path,'WEBP',quality=q,method=6)
    s=os.path.getsize(path)
    if s<=mx or q<=50: return s,q
    q-=4
out={}
base=post(rs(im,a['ow'],a['oh']))
out['size'],out['q']=save(base,a['out'],a['q'],a['max'])
if a.get('lo'):
  lw,lh,lq=a['lo'];lo=base.resize((lw,lh),Image.LANCZOS) if not rgba else base.convert('RGBa').resize((lw,lh),Image.LANCZOS).convert('RGBA')
  out['loSize'],out['loQ']=save(lo,a['loOut'],lq,a['max'])
if a['kind']=='sky':
  f=np.asarray(base.convert('RGB')).astype(np.float64)/255.;h=f.shape[0];lat=(0.5-(np.arange(h)+.5)/h)*180.;w=np.cos(np.radians(lat))
  def mean(l0,l1):
    m=(lat>=l0)&(lat<l1);ww=w[m][:,None];v=(f[m].mean(1)*ww).sum(0)/ww.sum();return '#%02x%02x%02x'%tuple(int(round(x*255)) for x in v)
  out['stats']={'top':mean(25,91),'zenith':mean(60,91),'hor':mean(0,8),'below':mean(-25,0)}
if a.get('png'): base.save(a['png'])
print(json.dumps(out))
`;
function encode(o) { return JSON.parse(execFileSync('python3', ['-c', PY, JSON.stringify(o)], { encoding: 'utf8', maxBuffer: 1 << 24 }).trim().split('\n').pop()); }
async function shoot(page, job, name) {
  const t0 = Date.now(), { n, info } = await page.evaluate(j => R.setup(j), job); const parts = [];
  for (let i = 0; i < n; i++) parts.push(Buffer.from(await page.evaluate(i => R.strip(i), i), 'base64'));
  const raw = join(TMP, name + '.raw'); await writeFile(raw, Buffer.concat(parts)); return { raw, info, ms: Date.now() - t0 };
}
// ---------- Hybrid H2: Ortsansichten aus der echten Spielkarte (dist/index.html, Stufe high, Skybox/Dunst/Licht von H1), ss-fach gerendert ----------
async function places() {
  const { PLACES } = await import('./assets/places.mjs'), only = opt('map') && opt('map') !== true ? opt('map').split(',') : Object.keys(PLACES);
  if (!existsSync(join(ROOT, 'dist/index.html'))) throw new Error('dist/index.html fehlt – vorher node build.mjs');
  await mkdir(TMP, { recursive: true }); if (PREVIEW) await mkdir(PREV, { recursive: true });
  const o = OUT.place, sc = PREVIEW ? 1 : SS, W = o.w * sc, H = o.h * sc, S = await serve();
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--disable-gpu-watchdog', '--disable-features=GpuWatchdog'] });
  const page = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }), errs = []; page.on('pageerror', e => errs.push(e.message)); page.setDefaultTimeout(0);
  await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await page.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
  await page.addInitScript(() => { localStorage.setItem('veyra_set', JSON.stringify({ res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' })); });
  await page.goto(S.url + 'dist/index.html', { waitUntil: 'load' });
  await page.click('#iPrompt'); await page.waitForTimeout(400); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(400);
  await page.evaluate(() => { for (let i = 0; i < 30 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } G.flags.starter = 1; G.team.push(mk(1, 12));
    const st = document.createElement('style'); st.textContent = 'body.hyRender *{visibility:hidden!important;animation:none!important}body.hyRender #world3d{visibility:visible!important}'; document.head.appendChild(st); document.body.classList.add('hyRender'); });
  const report = [];
  for (const id of only) { const P = PLACES[id]; if (!P) { console.error('unbekannte Karte', id); continue; } const t0 = Date.now();
    await page.evaluate(([id, P]) => { if (typeof B !== 'undefined' && B) try { endBattle('run'); } catch (e) { }
      const m = getMap(id), c = Object.assign({ x: m.w / 2, z: m.h + 1.5, y: 3.6, lx: m.w / 2, ly: 2.4, lz: -6, fov: 55 }, P.cam || {});
      mode = 'world'; G.time = P.t ?? 15 * 60; const dz = c.lz - c.z, dx = c.lx - c.x, l = Math.hypot(dx, dz) || 1;
      loadMap(id, Math.max(0, Math.min(m.w - 1, Math.round(c.x))), Math.max(0, Math.min(m.h - 1, Math.round(c.z))));/* Spielfigur unter der Kamera (nicht im Bild) */ P.dir = Math.abs(dz) > Math.abs(dx) ? (dz < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right');
      if (typeof hyPlaceClose === 'function') hyPlaceClose(true); ROAM.list.forEach(r => r.t = 1); if (P.setup) (0, eval)(P.setup);
      CAM.mode = 'cinematic'; CAM.target = { x: c.x + .5, y: 0, z: c.z + .5 }; CAM.yaw = 0; CAM.dist = .001; CAM.height = c.y; CAM.lookAt = { x: c.lx + .5, y: c.ly, z: c.lz + .5 }; CAM.fov = c.fov; CAM.snap = true; }, [id, P]);
    await page.waitForFunction(() => typeof skyActive !== 'function' || skyActive() || (cur && (cur.inside || cur.theme === 'cave')), null, { timeout: 90000 }).catch(() => { });
    await page.waitForTimeout(PREVIEW ? 5000 : 9000); await page.evaluate(() => { CAM.snap = true; }); await page.waitForTimeout(1500);
    const png = join(TMP, 'place_' + id + '.png'); await page.locator('#world3d').screenshot({ path: png, timeout: 300000 });
    const raw = join(TMP, 'place_' + id + '.rgba'); execFileSync('python3', ['-c', 'import sys,numpy as np;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGBA");np.asarray(im)[::-1].tofile(sys.argv[2]);print(im.size)', png, raw]);
    const sz = execFileSync('python3', ['-c', 'from PIL import Image;import sys;print(*Image.open(sys.argv[1]).size)', png], { encoding: 'utf8' }).trim().split(' ').map(Number);
    const key = 'place_' + id, enc = encode({ raw, W: sz[0], H: sz[1], kind: 'place', alpha: false, ow: PREVIEW ? sz[0] / 2 | 0 : o.w, oh: PREVIEW ? sz[1] / 2 | 0 : o.h, q: o.q, max: o.max,
      out: PREVIEW ? join(PREV, key + '.webp') : join(ART, key + '.webp'), lo: PREVIEW ? null : o.lo, loOut: join(ART, key + '_lo.webp'), png: PREVIEW ? join(PREV, key + '.png') : null });
    report.push([key, ((Date.now() - t0) / 1000).toFixed(1) + ' s', enc.size, enc.q, enc.loSize || '']); console.log(key, enc.size + ' B q' + enc.q, enc.loSize ? 'lo ' + enc.loSize + ' B' : '');
    if (errs.length) console.error('Seitenfehler:', errs.splice(0)); }
  await br.close(); S.close(); console.table(report);
}
// ---------- Hybrid H2: Kapitel-Standbilder ----------
// Zuordnung Kapitel → Intro-Still (Stimmung): 1 Aufbruch mit Hirsch im Sonnenlicht, 2 Blattbär in Blumen, 3 Fuchs in der Brandung, 4 Brücke über den Wolken,
// 5 weißer Hirsch im Eisnebel, 6 zwei Freunde vor der Glut-Schlucht, 7 Kristall-Landschaft von oben, 8 Kristall-Licht über dunklem Meer, 9 alle Wächter um den Kristall, 10 Morgen im grünen Tal.
// Still f_<i> liegt im Intro-Film bei t = 2 + 4·(i−1) s; mit ffmpeg wird dieses Bild in 720p geholt (gleiches Nutzermaterial, schärfer), geprüft gegen das Still (MSE), sonst das Still selbst.
export const CHAPTER_STILLS = { 1: 9, 2: 6, 3: 5, 4: 8, 5: 16, 6: 11, 7: 4, 8: 19, 9: 20, 10: 18 };
async function chapters() { await mkdir(TMP, { recursive: true }); const vid = join(ROOT, 'public/video/intro_720.mp4'), report = [];
  let ff = false; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); ff = existsSync(vid); } catch (e) { }
  for (const [n, i] of Object.entries(CHAPTER_STILLS)) { const still = join(ROOT, 'public/art_ref/intro_stills', 'f_' + String(i).padStart(2, '0') + '.png'), fr = join(TMP, 'chapter_' + n + '.png');
    // ±0,6 s um die Still-Zeit mit 30 Bildern/s holen, das ähnlichste Bild gewinnt
    let src = still; if (ff) { try { const dir = join(TMP, 'ch' + n); await mkdir(dir, { recursive: true }); execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(Math.max(0, 2 + 4 * (i - 1) - .6)), '-t', '1.2', '-i', vid, '-vf', 'fps=30', join(dir, 'h_%03d.png')]);
      execFileSync('python3', ['-c', 'import sys,glob,shutil,numpy as np\nfrom PIL import Image\ns=np.asarray(Image.open(sys.argv[1]).convert("RGB").resize((160,90)),np.float32)\nb=min(glob.glob(sys.argv[2]+"/h_*.png"),key=lambda f:((np.asarray(Image.open(f).convert("RGB").resize((160,90)),np.float32)-s)**2).mean())\nshutil.copy(b,sys.argv[3])', still, dir, fr]); src = fr; } catch (e) { src = still; } }
    const r = JSON.parse(execFileSync('python3', ['-c', String.raw`
import sys,json,os,numpy as np
from PIL import Image
st,src,out,lo=sys.argv[1:5]
a=Image.open(st).convert('RGB');b=Image.open(src).convert('RGB')
m=float(((np.asarray(a.resize((160,90)),np.float32)-np.asarray(b.resize((160,90)),np.float32))**2).mean())
if m>40: b=a
w,h=b.size;k=min(1,1280/w);b=b.resize((round(w*k),round(h*k)),Image.LANCZOS) if k<1 else b
b.save(out,'WEBP',quality=70,method=6);b.resize((b.width//2,b.height//2),Image.LANCZOS).save(lo,'WEBP',quality=62,method=6)
print(json.dumps({'mse':round(m,1),'w':b.width,'h':b.height,'size':os.path.getsize(out),'lo':os.path.getsize(lo),'video':src!=st and m<=40}))`, still, src, join(ART, 'chapter_' + n + '.webp'), join(ART, 'chapter_' + n + '_lo.webp')], { encoding: 'utf8' }).trim().split('\n').pop());
    report.push(['chapter_' + n, 'f_' + i, r.video ? '720p-Film' : 'Still', r.w + '×' + r.h, r.size, r.lo, r.mse]); }
  console.table(report); }
async function main() {
  if (what === 'place') return places();
  if (what === 'chapter') return chapters();
  await mkdir(TMP, { recursive: true }); if (PREVIEW) await mkdir(PREV, { recursive: true });
  const S = await serve(), br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--disable-gpu-watchdog', '--disable-features=GpuWatchdog'] });
  const page = await br.newPage({ viewport: { width: 256, height: 256 } }); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.setDefaultTimeout(0); await page.goto(S.url + 'tools/assets/scene.html'); await page.waitForFunction(() => window.READY === true);
  const metaP = join(ART, 'sky_meta.json'); const meta = existsSync(metaP) ? JSON.parse(readFileSync(metaP, 'utf8')) : {}; meta.version = 1; meta.convention = 'equirect three.js: u=atan(z,x)/2π+.5, v=asin(y)/π+.5; Azimut a° → (cos a, 0, sin a); Hauptwahrzeichen bei −90° (−z)';
  meta.sky = meta.sky || {}; meta.horizon = meta.horizon || {}; meta.battle = meta.battle || {};
  const sc = PREVIEW ? .5 : SS, report = [];
  const run = async (kind, key, job, extra = {}) => { const o = OUT[kind], W = Math.round(o.w * sc), H = Math.round(o.h * sc); job.W = W; job.H = H; job.strip = job.strip || (kind === 'sky' ? 48 : 128);
    const shot = await shoot(page, job, key); if (errs.length) { console.error('Seitenfehler:', errs.splice(0)); }
    const enc = encode(Object.assign({ raw: shot.raw, W, H, kind, alpha: kind === 'horizon', ow: PREVIEW ? W : o.w, oh: PREVIEW ? H : o.h, q: o.q, max: o.max,
      out: PREVIEW ? join(PREV, key + '.webp') : join(ART, key + '.webp'), lo: PREVIEW ? null : o.lo, loOut: join(ART, key + '_lo.webp'), png: PREVIEW ? join(PREV, key + '.png') : null, hy: shot.info && shot.info.horizonY }, extra));
    report.push([key, (shot.ms / 1000).toFixed(1) + ' s', enc.size, enc.q, enc.loSize || '']); console.log(key, (shot.ms / 1000).toFixed(1) + ' s', enc.size + ' B q' + enc.q, enc.loSize ? 'lo ' + enc.loSize + ' B' : '');
    return { shot, enc }; };
  for (const region of REG) {
    if (what === 'sky' || what === 'all') for (const time of TIM) { const P = skyParams(region, time), key = `sky_${region}_${time}`; const { enc } = await run('sky', key, { kind: 'sky', params: P });
      if (!PREVIEW) meta.sky[key] = { w: OUT.sky.w, h: OUT.sky.h, lo: key + '_lo', bytes: enc.size, sun: { az: P.sunAz, el: P.sunEl, col: P.sunCol || '#000000', i: P.sunI || 0 }, moon: P.moonI ? { az: P.moonAz, el: P.moonEl, col: P.moonCol, i: P.moonI, phase: P.moonPhase || 0 } : null, haze: P.haze, stats: enc.stats }; }
    if (what === 'horizon' || what === 'all') { const key = `horizon_${region}`, L = horizonLight(region), t0 = -.05, t1 = .45; const { enc } = await run('horizon', key, { kind: 'horizon', region, light: L, t0, t1, cube: PREVIEW ? 1024 : 2048, camH: 6 });
      if (!PREVIEW) meta.horizon[key] = { w: OUT.horizon.w, h: OUT.horizon.h, lo: key + '_lo', bytes: enc.size, tan: [t0, t1], haze: L.haze, landmarkAz: -90 }; }
    if (what === 'battle' || what === 'all') for (const time of TIM) { const key = `bg_battle_${region}_${time}`, P = skyParams(region, time), L = battleLight(region, time), cam = { fov: 38, h: 1.7, az: -90, pitch: 3.5 };
      const { shot, enc } = await run('battle', key, { kind: 'battle', region, time, params: P, light: L, cam });
      if (!PREVIEW) meta.battle[key] = Object.assign({ w: OUT.battle.w, h: OUT.battle.h, lo: key + '_lo', bytes: enc.size, cam, sky: `sky_${region}_${time}` }, shot.info); }
  }
  if (!PREVIEW) await writeFile(metaP, JSON.stringify(meta, null, 1));
  await br.close(); S.close();
  console.table(report);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) main().catch(e => { console.error(e); process.exit(1); });
