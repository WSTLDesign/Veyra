// Charaktere – gemeinsame Bühne für Figurenbögen (ein Chromium; Sperre nimmt der Aufrufer).
//   figStage(page,{W,H,pr,neutral}) baut eine Bühne (Licht wie im Spiel, Supersampling pr×, neutraler Hintergrund); figShots(page,code,views) rendert 1–n Ansichten;
//   grid(page,cells,{cols,cw,ch,title,file}) setzt Bilder zu einem Bogen zusammen (Breite = cols·cw, z. B. 1600 px).
//   list/code: JS-Ausdruck, der eine Figur (Group aus person3d) liefert, z. B. FIG_CODE('mama').
import { writeFileSync } from 'fs';
import { here } from './qa_lc_lib.mjs';
export async function figStage(page, { W = 400, H = 560, pr = 2, neutral = true } = {}) {
  await page.evaluate(([W, H, pr, neutral]) => {
    mode = 'wait'; if (typeof VILL !== 'undefined') VILL.list = []; window.__tyGame = terrainY; terrainY = () => 0;
    const rr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(pr); rr.setSize(W, H); rr.toneMapping = THREE.ACESFilmicToneMapping; rr.toneMappingExposure = 1.05;
    rr.shadowMap.enabled = true; rr.shadowMap.type = THREE.PCFSoftShadowMap; rr.info.autoReset = false; Object.assign(rr.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(rr.domElement);
    const S = new THREE.Scene(); S.background = new THREE.Color(neutral ? '#e6e8eb' : '#e3ebf2'); S.add(new THREE.HemisphereLight('#ffffff', '#b8bcc4', .8));
    const sun = new THREE.DirectionalLight('#fff4e0', .85); sun.position.set(3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); S.add(sun, sun.target);
    let grMat;
    if (neutral) grMat = new THREE.MeshToonMaterial({ color: '#d9dce0', gradientMap: toonGrad() });
    else { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < 8; i++)for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#d5dece' : '#c2cfb6'; x.fillRect(i * 16, j * 16, 16, 16); }
      const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(50, 50); grMat = new THREE.MeshToonMaterial({ map: tx, gradientMap: toonGrad() }); }
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), grMat); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; S.add(gr);
    const cam = new THREE.PerspectiveCamera(24, W / H, .05, 80);
    window.CS = { rr, S, sun, cam, W, H, gr };
    CS.put = (f) => { if (CS.f) CS.S.remove(CS.f); CS.f = f; f.position.set(0, 0, 0); f.rotation.y = 0; f.traverse(q => { if (q.isMesh && !q.userData.outline) q.castShadow = true; }); S.add(f); if (f.userData.rig && typeof gaitTick === 'function') { f.userData.gait = null; for (let k = 0; k < 3; k++)gaitTick(f, 1 / 60); } f.updateMatrixWorld(true); return f; };
    // Ansicht: 'vorn' | 'schraeg' | 'seite' | 'hinten' | 'nah' (Kopf) | 'brust' (Oberkörper) – Höhe der Figur bestimmt den Ausschnitt
    CS.shot = (view, hFig) => { const h = hFig || 1.4, a = { vorn: 0, schraeg: -.65, seite: -Math.PI / 2, hinten: Math.PI, nah: -.35, brust: -.4 }[view] ?? 0, near = view === 'nah', mid = view === 'brust',
      d = near ? 1.15 : mid ? 2.2 : 4.1 * Math.max(1, h / 1.45), ty = near ? h * .9 : mid ? h * .72 : h * .5;
      cam.position.set(Math.sin(a) * -d, ty + (near ? .02 : mid ? .08 : .25), Math.cos(a) * -d); cam.lookAt(0, ty, 0); cam.updateMatrixWorld();
      sun.position.set(-2.5, 6, -4); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld(); rr.render(S, cam); return rr.domElement.toDataURL('image/png'); };
    // Draw-Calls/Dreiecke einer Figur (ohne Boden, ohne Schatten-Pass)
    CS.cost = (f) => { const S2 = new THREE.Scene(); S2.add(new THREE.HemisphereLight('#fff', '#888', 1)); f.position.set(0, 0, 0); S2.add(f); f.updateMatrixWorld(true); const sm = rr.shadowMap.enabled; rr.shadowMap.enabled = false; rr.info.reset(); cam.position.set(0, .8, -4); cam.lookAt(0, .7, 0); rr.render(S2, cam); const r = { calls: rr.info.render.calls, tris: rr.info.render.triangles }; rr.shadowMap.enabled = sm; S2.remove(f); return r; };
  }, [W, H, pr, neutral]);
}
export async function figShots(page, code, views) {
  return page.evaluate(([code, views]) => { const f = CS.put((0, eval)(code)); const b = new THREE.Box3().setFromObject(f), h = b.max.y - b.min.y; const imgs = views.map(v => CS.shot(v, h)); const cost = CS.cost(f); CS.S.add(f); return { imgs, h: +h.toFixed(3), cost, heads: f.userData.char ? +f.userData.char.heads.toFixed(2) : null }; }, [code, views]);
}
// Bogen: cells [{img, label, sub}] im Raster cols × rows, Zelle cw × ch (Bild wird eingepasst, Mitte)
export async function grid(page, cells, { cols, cw, ch, title = '', file }) {
  const data = await page.evaluate(async ([cells, cols, cw, ch, title]) => {
    const top = title ? 40 : 6, lab = 22, sub = 20, rows = Math.ceil(cells.length / cols), cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = top + rows * (ch + lab + sub); const g = cv.getContext('2d');
    g.fillStyle = '#f4f5f7'; g.fillRect(0, 0, cv.width, cv.height); if (title) { g.fillStyle = '#26304a'; g.font = '700 22px sans-serif'; g.fillText(title, 12, 28); }
    for (let i = 0; i < cells.length; i++) { const c = cells[i], x = (i % cols) * cw, y = top + Math.floor(i / cols) * (ch + lab + sub);
      if (c.img) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = c.img; }); const s = Math.min(cw / im.width, ch / im.height), w = im.width * s, h = im.height * s; g.imageSmoothingQuality = 'high'; g.drawImage(im, x + (cw - w) / 2, y + lab + (ch - h) / 2, w, h); }
      g.fillStyle = '#26304a'; g.font = '700 16px sans-serif'; g.fillText(c.label || '', x + 8, y + 16); if (c.sub) { g.fillStyle = '#5a6478'; g.font = '13px sans-serif'; g.fillText(c.sub, x + 8, y + lab + ch + 14); }
      g.strokeStyle = '#d8dee8'; g.strokeRect(x + .5, y + .5, cw - 1, ch + lab + sub - 1); }
    return cv.toDataURL('image/png'); }, [cells, cols, cw, ch, title]);
  writeFileSync(here(file), Buffer.from(data.split(',')[1], 'base64'));
}
// Kompatibel zu älteren Skripten: figSheet(page,list,file,{views,title}) – je Figur alle Ansichten in einer Reihe
export async function figSheet(page, list, file, { views = ['vorn', 'schraeg', 'seite'], title = '', cw = 200, ch = 280 } = {}) {
  const cells = [], out = [];
  for (const it of list) { const r = await figShots(page, it.code, views); out.push({ label: it.label, h: r.h, heads: r.heads, ...r.cost }); r.imgs.forEach((img, i) => cells.push({ img, label: i ? '' : it.label, sub: i ? '' : `Höhe ${r.h} · ${r.heads} Kopfh. · ${r.cost.calls} Calls · ${(r.cost.tris / 1000).toFixed(1)} k Dr.` })); }
  await grid(page, cells, { cols: list.length * views.length, cw, ch, title, file }); return out;
}
// Figur nach Kanon-ID (Held = Spielerfigur aus G.outfit, wie 09 outfitSync)
export const FIG_CODE = id => id === 'held' || id === 'heldin'
  ? `(()=>{const o=Object.assign(defaultOutfit(),G.outfit||{},{body:'${id}'});return person3d(o.top,o.capCol,o);})()`
  : `(()=>{const L=FIGURES['${id}'].look,oe=figOutfit3d(L);return person3d(oe.top,oe.capCol,oe);})()`;
// Fortschritt je Ausrüstungsstufe (wie im Spiel gespeichert: G.badges = Namen, Flags)
export const STAGE_SET = [
  `G.badges=[];G.flags={starter:1};`,
  `G.badges=['Floramedaille'];G.flags={starter:1,badge1:1};`,
  `G.badges=['Floramedaille','Flutmedaille','Böenmedaille'];G.flags={starter:1,badge1:1,badge2:1,badge_boe:1};`,
  `G.badges=MEDALS.map(m=>m[0]);G.flags=Object.assign({starter:1,top1:1,top2:1,top3:1},Object.fromEntries(MEDALS.map(m=>[m[1],1])));`,
  `G.badges=MEDALS.map(m=>m[0]);G.flags=Object.assign({starter:1,top1:1,top2:1,top3:1,top4:1,champion:1},Object.fromEntries(MEDALS.map(m=>[m[1],1])));`];
