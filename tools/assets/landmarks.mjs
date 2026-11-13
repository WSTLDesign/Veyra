// Veyra – Offline-Szene: Horizont-Kulissen und Kampf-Panoramen je Region (Hybrid H1). Eigene Entwürfe nach WELT-KANON (AGENTS.md).
// Einheiten ≈ Meter, Kamera am Ursprung; Hauptwahrzeichen bei Azimut −90° (= −z, Blickrichtung „hoch“ im Spiel).
// buildRegion(region, light, kind) → {group}. light: {sunAz,sunEl,sunCol,sunI,hemiTop,hemiBot,hemiI,haze,night}
const T = THREE;
const lin = h => new T.Color(h).convertSRGBToLinear();
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hs = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function vn(x, y, z) { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z); let fx = x - ix, fy = y - iy, fz = z - iz; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t, h = (i, j, k) => hs(ix + i, iy + j, iz + k);
  return L(L(L(h(0, 0, 0), h(1, 0, 0), fx), L(h(0, 1, 0), h(1, 1, 0), fx), fy), L(L(h(0, 0, 1), h(1, 0, 1), fx), L(h(0, 1, 1), h(1, 1, 1), fx), fy), fz); }
const fbm = (x, y, z, o = 4) => { let s = 0, a = .5, t = 0; for (let i = 0; i < o; i++) { s += a * vn(x, y, z); t += a; x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; z = z * 2.03 + 4.1; a *= .5; } return s / t; };
const ridge = (x, y, z, o = 5) => { let s = 0, a = .5, t = 0; for (let i = 0; i < o; i++) { s += a * (1 - Math.abs(vn(x, y, z) * 2 - 1)); t += a; x = x * 2.1 + 3.1; y = y * 2.1 + 1.3; z = z * 2.1 + 7.7; a *= .5; } return s / t; };
const polar = (az, d, y = 0) => { const a = az * Math.PI / 180; return new T.Vector3(Math.cos(a) * d, y, Math.sin(a) * d); };
// Geometrie-Helfer
function displace(g, amp, freq, seed = 0, f = fbm) { g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal, v = new T.Vector3();
  const cache = new Map(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = v.x.toFixed(2) + ',' + v.y.toFixed(2) + ',' + v.z.toFixed(2); let d = cache.get(k); if (d == null) { d = (f(v.x * freq + seed, v.y * freq, v.z * freq + seed * .7) - .5) * amp; cache.set(k, d); }
    p.setXYZ(i, v.x + n.getX(i) * d, v.y + n.getY(i) * d, v.z + n.getZ(i) * d); }
  // Normalen über gemeinsame Positionen glätten
  g.computeVertexNormals(); return smoothN(g); }
function smoothN(g) { const p = g.attributes.position, n = g.attributes.normal, m = new Map(), v = new T.Vector3();
  for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(2) + ',' + p.getY(i).toFixed(2) + ',' + p.getZ(i).toFixed(2); let a = m.get(k); if (!a) m.set(k, a = new T.Vector3()); a.x += n.getX(i); a.y += n.getY(i); a.z += n.getZ(i); }
  for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(2) + ',' + p.getY(i).toFixed(2) + ',' + p.getZ(i).toFixed(2); v.copy(m.get(k)).normalize(); n.setXYZ(i, v.x, v.y, v.z); } return g; }
function paint(g, fn) { const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), v = new T.Vector3(), nn = new T.Vector3(), col = new T.Color();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); fn(v, nn, col); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } g.setAttribute('color', new T.BufferAttribute(c, 3)); return g; }
const M = (o = {}) => new T.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: .92, metalness: 0 }, o));
// Weiche Dunst-/Wolkenbank (Billboard zum Ursprung gedreht, nahtlos in allen Cube-Seiten)
let PUFF = null;
function puffTex() { if (PUFF) return PUFF; const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'), R = rng(7);
  for (let i = 0; i < 70; i++) { const px = 40 + R() * 432, py = 150 + (R() - .5) * 70 - Math.sin((px - 40) / 432 * Math.PI) * 50 * R(), rr = 26 + R() * 70, g = x.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, 'rgba(255,255,255,.30)'); g.addColorStop(.55, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 256); }
  const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(255,255,255,1)'); gr.addColorStop(.8, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.globalCompositeOperation = 'destination-in'; x.fillStyle = gr; x.fillRect(0, 0, 512, 256);
  PUFF = new T.CanvasTexture(c); return PUFF; }
let CUR_L = null;
function mist(G, az, d, w, h, col, op, y = 0) { const L = CUR_L || {}, nt = L.night || 0, mc = lin(col).lerp(lin(L.haze || col), .25).multiplyScalar(1 - .8 * Math.min(1, nt)); const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: puffTex(), color: mc, transparent: true, opacity: op, depthWrite: false, fog: false }));
  const p = polar(az, d, y + h * .32); m.position.copy(p); m.lookAt(0, p.y, 0); m.renderOrder = 2; G.add(m); return m; }
function mistRing(G, R, n, d0, d1, w, h, col, op, y = 0, az0 = -180, az1 = 180) { for (let i = 0; i < n; i++) { const az = az0 + (az1 - az0) * (i + R() * .8) / n; mist(G, az, d0 + (d1 - d0) * R(), w * (.7 + R() * .6), h * (.7 + R() * .6), col, op * (.7 + R() * .5), y); } }
// Berg (Kegel mit Grat-Rauschen), Farbe nach Höhe: Fuß → Fels → Schnee
function mountain(G, at, rad, hgt, o = {}) { const seg = o.seg || 64, g0 = new T.ConeGeometry(rad, hgt, seg, 24, true); g0.translate(0, hgt / 2, 0);
  const g = g0.toNonIndexed(), p = g.attributes.position, v = new T.Vector3(), sd = o.seed || 1, sharp = o.sharp ?? 1;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const h = v.y / hgt, ang = Math.atan2(v.z, v.x), rr = Math.hypot(v.x, v.z);
    const n = ridge(Math.cos(ang) * 2.2 + sd, h * 3.1 * sharp, Math.sin(ang) * 2.2 - sd, 5), n2 = fbm(v.x / rad * 3 + sd, v.y / hgt * 4, v.z / rad * 3, 4);
    const k = 1 + (n - .5) * .55 * (o.rough ?? 1) + (n2 - .5) * .35; v.x *= k; v.z *= k; v.y = Math.max(0, v.y + (n - .55) * hgt * .16 * (o.rough ?? 1) * (1 - Math.pow(1 - h, 3)));
    if (o.crater && h > .92) { v.y -= (h - .92) * hgt * 1.2; }
    p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); smoothN(g);
  const cA = lin(o.base || '#6f7a68'), cB = lin(o.rock || '#8a8790'), cS = lin(o.snow || '#f4f7fb'), snowL = o.snowLine ?? .62;
  paint(g, (v, n, c) => { const h = v.y / hgt, nz = fbm(v.x * .01 + sd, v.y * .02, v.z * .01, 3); c.copy(cA).lerp(cB, Math.min(1, Math.max(0, h * 1.6 + (nz - .5)))); const sn = (h - snowL + (nz - .5) * .25 + (n.y - .55) * .25) * 7; if (snowL < 1) c.lerp(cS, Math.min(1, Math.max(0, sn))); });
  const m = new T.Mesh(g, M(o.mat || {})); m.position.copy(at); G.add(m); return m; }
function ridgeRing(G, R, n, d0, d1, h0, h1, o) { for (let i = 0; i < n; i++) { const az = -180 + 360 * (i + R() * .6) / n; if (o.skip && o.skip(az)) continue; const d = d0 + (d1 - d0) * R(), h = h0 + (h1 - h0) * R(); mountain(G, polar(az, d, -h * .05), Math.min(h * (1.3 + R() * 1.1), d * .3), h, Object.assign({ seed: i * 3.7 + 1, seg: 40 }, o)); } }
function hill(G, at, rx, ry, rz, col, seed = 1, col2) { const g = displace(new T.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), .18, 2.2, seed); g.scale(rx, ry, rz);
  const a = lin(col), b = lin(col2 || col); paint(g, (v, n, c) => { c.copy(a).lerp(b, fbm(v.x * .01 + seed, v.y * .02, v.z * .01, 3)); }); const m = new T.Mesh(g, M()); m.position.copy(at); G.add(m); return m; }
// Bäume als InstancedMesh (Kugelkrone oder Kegel)
function trees(G, list, kind, colA, colB, trunk = '#5a4636') { if (!list.length) return; const crown = kind === 'pine' ? new T.ConeGeometry(1, 2.6, 9, 3).translate(0, 1.6, 0) : displace(new T.IcosahedronGeometry(1, 2), .3, 1.5, 3).translate(0, 1.5, 0);
  const im = new T.InstancedMesh(crown, new T.MeshStandardMaterial({ roughness: .95 }), list.length), d = new T.Object3D(), ca = lin(colA), cb = lin(colB), c = new T.Color();
  list.forEach(([x, y, z, s], i) => { d.position.set(x, y, z); d.scale.set(s, s * (kind === 'pine' ? 1.2 : .9), s); d.rotation.y = i; d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, c.copy(ca).lerp(cb, hs(i, 3, 7))); });
  G.add(im); return im; }
function treeField(R, n, d0, d1, s0, s1, az0 = -180, az1 = 180, yf) { const L = []; for (let i = 0; i < n; i++) { const az = az0 + (az1 - az0) * R(), d = d0 + (d1 - d0) * Math.sqrt(R()), p = polar(az, d); L.push([p.x, yf ? yf(p.x, p.z) : 0, p.z, s0 + (s1 - s0) * R()]); } return L; }
function prism(G, at, r, h, col, o = {}) { const g = new T.CylinderGeometry(r * (o.top ?? .7), r, h, o.sides || 6, 1); g.translate(0, h / 2, 0); const tip = new T.ConeGeometry(r * (o.top ?? .7), h * (o.tip ?? .28), o.sides || 6); tip.translate(0, h + h * (o.tip ?? .28) / 2, 0);
  const mat = new T.MeshStandardMaterial({ color: lin(col), roughness: o.rough ?? .35, metalness: o.metal ?? 0, emissive: lin(o.em || '#000000'), emissiveIntensity: o.emI ?? 1, flatShading: true, transparent: !!o.op, opacity: o.op || 1 });
  const grp = new T.Group(); grp.add(new T.Mesh(g, mat), new T.Mesh(tip, mat)); grp.position.copy(at); if (o.tilt) { grp.rotation.z = o.tilt[0]; grp.rotation.x = o.tilt[1]; } if (o.ry) grp.rotation.y = o.ry; G.add(grp); return grp; }
function box(G, at, sx, sy, sz, col, o = {}) { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz).translate(0, sy / 2, 0), new T.MeshStandardMaterial({ color: lin(col), roughness: .85, emissive: lin(o.em || '#000000'), emissiveIntensity: o.emI ?? 1 })); m.position.copy(at); if (o.ry != null) m.rotation.y = o.ry; G.add(m); return m; }
function ribbon(G, at, w, h, col, op = .9) { // Wasserfall: senkrechtes Band mit Verlauf
  const c = document.createElement('canvas'); c.width = 32; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.75, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 256);
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(200,220,235,.25)'; x.fillRect(Math.random() * 32, 0, 1 + Math.random() * 2, 256); }
  const m = new T.Mesh(new T.PlaneGeometry(w, h).translate(0, -h / 2, 0), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), color: lin(col), transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide })); m.position.copy(at); m.lookAt(0, at.y, 0); G.add(m); return m; }
function lights(G, L) { // Sonne + Himmel/Boden
  const a = (L.sunAz ?? 140) * Math.PI / 180, e = (L.sunEl ?? 35) * Math.PI / 180, s = new T.DirectionalLight(lin(L.sunCol || '#fff1dc'), L.sunI ?? 2.4); s.position.set(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)).multiplyScalar(1000); G.add(s);
  G.add(new T.HemisphereLight(lin(L.hemiTop || '#bcd0ec'), lin(L.hemiBot || '#7a7a6a'), L.hemiI ?? 1.1)); }
// Boden für Kampf-Panoramen: große Ebene mit Detailtextur + Farbrauschen
function ground(G, o, R) { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = o.a; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const r = R(); x.fillStyle = r < .45 ? o.b : r < .8 ? o.c : o.d || o.a; x.globalAlpha = .18 + R() * .35; const s = 1 + R() * (o.blot || 5); x.fillRect(R() * 512, R() * 512, s, s * (o.stretch || 1)); }
  x.globalAlpha = 1; const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(900, 900); t.anisotropy = 16; t.encoding = T.sRGBEncoding;
  const g = new T.PlaneGeometry(40000, 40000, 160, 160); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const X = p.getX(i), Z = p.getZ(i), d = Math.hypot(X, Z); p.setY(i, (fbm(X * .002, 0, Z * .002, 4) - .5) * (o.relief ?? 18) * Math.min(1, d / 60) - (o.sink ? Math.max(0, d - o.sink) * (o.sinkK || .03) : 0)); }
  g.computeVertexNormals(); const ca = lin(o.tintA || '#ffffff'), cb = lin(o.tintB || '#ffffff'); paint(g, (v, n, cc) => cc.copy(ca).lerp(cb, fbm(v.x * .004, 3, v.z * .004, 4)));
  const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: t, vertexColors: true, roughness: 1 })); m.position.y = o.y || 0; G.add(m); return m; }
function water(G, col, y = 0, R = 30000) { const g = new T.CircleGeometry(R, 96); g.rotateX(-Math.PI / 2); const m = new T.Mesh(g, new T.MeshStandardMaterial({ color: lin(col), roughness: .25, metalness: .05 })); m.position.y = y; G.add(m); return m; }
// ---------- Regionen ----------
const REG = {
  lichtlande(G, R, L, K) { const night = L.night || 0;
    ridgeRing(G, R, 26, 2600, 3600, 220, 480, { base: '#8a9a8a', rock: '#9aa2b4', snow: '#e6eaf2', snowLine: .8, rough: .7 });
    for (let i = 0; i < 22; i++) { const az = -180 + i * 16.4 + R() * 8, d = 1100 + R() * 700; hill(G, polar(az, d, -10), 110 + R() * 120, 30 + R() * 50, 90 + R() * 90, '#6f8f5a', i, '#8fa26a'); }
    trees(G, treeField(R, 520, 900, 1700, 7, 14, -180, 180, () => 6), 'round', '#e8b4c4', '#d892aa');
    // Kristall-Kathedrale mit Sonnenhalo
    const c = polar(-90, 1400); const base = new T.Mesh(new T.CylinderGeometry(92, 110, 46, 40), new T.MeshStandardMaterial({ color: lin('#ece4d4'), roughness: .7 })); base.position.set(c.x, 23, c.z); G.add(base);
    hill(G, polar(-90, 1400, -20), 260, 70, 200, '#86a864', 5, '#a3b46c');
    const gold = '#f2d68a', white = '#f6f1e6', em = night ? '#ffcf6a' : '#6a4a10';
    prism(G, polar(-90, 1400, 44), 32, 260, white, { em, emI: night ? .9 : .25, rough: .3, metal: .2, sides: 8, tip: .35 });
    for (let k = 0; k < 6; k++) { const a = -90 + (k - 2.5) * 13, p = polar(-90 + (k - 2.5) * 6.5, 1400 + (k % 2 ? 30 : -24), 44); prism(G, p, 15 + R() * 8, 120 + R() * 80, k % 2 ? gold : white, { em, emI: night ? .7 : .2, rough: .3, metal: .25, sides: 6 }); }
    for (let k = 0; k < 14; k++) { const p = polar(-90 + (R() - .5) * 13, 1380 + (R() - .5) * 120, 40); prism(G, p, 3 + R() * 4, 30 + R() * 50, R() < .5 ? '#bfe4ff' : gold, { em: '#5a8ac0', emI: .35 + night, rough: .2, tilt: [(R() - .5) * .5, (R() - .5) * .4] }); }
    const halo = new T.Mesh(new T.TorusGeometry(96, 7, 12, 96), new T.MeshBasicMaterial({ color: lin('#ffe6a0').multiplyScalar(1.4), fog: true })); const hp = polar(-90, 1440, 255); halo.position.copy(hp); halo.lookAt(0, hp.y, 0); G.add(halo);
    // Tafelberg mit Wasserfällen
    const t = polar(-62, 1700); mountain(G, new T.Vector3(t.x, 0, t.z), 260, 210, { base: '#7f9a6a', rock: '#b8ad9a', snowLine: 1.2, rough: .4, sharp: .3, seed: 9 });
    for (let k = 0; k < 3; k++) ribbon(G, polar(-64 + k * 2, 1460, 190), 10 + k * 3, 170, '#ffffff', .85);
    mistRing(G, R, 46, 600, 1500, 520, 120, '#f6efe6', .65, -4);
  },
  smaragdwald(G, R, L) { const night = L.night || 0;
    ridgeRing(G, R, 24, 2300, 3400, 260, 520, { base: '#4f6a58', rock: '#7c8c8a', snowLine: 1.2, rough: .8 });
    for (let i = 0; i < 26; i++) { const az = -180 + i * 13.8 + R() * 6, d = 1000 + R() * 800; hill(G, polar(az, d, -12), 110 + R() * 130, 40 + R() * 60, 100 + R() * 90, '#46683e', i + 30, '#5e7e48'); }
    trees(G, treeField(R, 900, 800, 1800, 8, 16, -180, 180, () => 10), 'pine', '#36583a', '#4a6e42');
    trees(G, treeField(R, 500, 800, 1700, 10, 20, -180, 180, () => 14), 'round', '#467040', '#6e8e48');
    // Weltenbaum mit Baumhaus-Dorf
    const c = polar(-90, 1500), tr = new T.CylinderGeometry(24, 46, 250, 28, 24, true); tr.translate(0, 125, 0); const tg = displace(tr, 14, .03, 4); paint(tg, (v, n, cc) => cc.copy(lin('#6a4a34')).lerp(lin('#8a6a4c'), fbm(v.x * .05, v.y * .02, v.z * .05, 3)));
    const trunk = new T.Mesh(tg, M()); trunk.position.set(c.x, 0, c.z); G.add(trunk);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, rt = new T.CylinderGeometry(3, 12, 70, 10); rt.translate(0, 35, 0); const m = new T.Mesh(rt, new T.MeshStandardMaterial({ color: lin('#6a4a34'), roughness: .95 })); m.position.set(c.x + Math.cos(a) * 30, -4, c.z + Math.sin(a) * 30); m.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); G.add(m); }
    for (let k = 0; k < 34; k++) { const a = R() * Math.PI * 2, rr = Math.pow(R(), .6) * 230, y = 220 + R() * 110 - rr * .28, s = 52 + R() * 50; const g = displace(new T.IcosahedronGeometry(s, 3), s * .32, .045, k); paint(g, (v, n, cc) => cc.copy(lin('#2f6a34')).lerp(lin('#8ab84a'), Math.max(0, n.y * .6 + (fbm(v.x * .03, v.y * .03, v.z * .03, 3) - .3)))); const m = new T.Mesh(g, M()); m.position.set(c.x + Math.cos(a) * rr, y, c.z + Math.sin(a) * rr * .8); G.add(m); }
    for (let k = 0; k < 9; k++) { const y = 70 + k * 18, a = R() * Math.PI * 2; const d = new T.Mesh(new T.CylinderGeometry(22, 22, 3, 24), new T.MeshStandardMaterial({ color: lin('#9a7a54'), roughness: .9, emissive: lin('#ffb24a'), emissiveIntensity: night ? .5 : .02 })); d.position.set(c.x + Math.cos(a) * 26, y, c.z + Math.sin(a) * 26); G.add(d); }
    mistRing(G, R, 50, 500, 1500, 480, 110, '#e8efe4', .7, -2);
  },
  flutkueste(G, R, L, K) { const night = L.night || 0;
    if (K === 'battle') water(G, '#3f8fb0', -1);
    ridgeRing(G, R, 16, 2400, 3400, 160, 360, { base: '#7a8f74', rock: '#a8a49a', snowLine: 1.2, rough: .7, skip: az => az < 10 || az > 200 });
    // Klippen + Leuchtturm
    const c = polar(-90, 820); for (let k = 0; k < 7; k++) { const p = polar(-104 + k * 4.5, 820 + (R() - .5) * 60); mountain(G, new T.Vector3(p.x, -6, p.z), 110 + R() * 50, 48 + R() * 22, { base: '#9a968c', rock: '#b8b2a4', snowLine: 1.2, rough: .5, sharp: .25, seed: k + 40, mat: { roughness: .9 } }); }
    hill(G, polar(-90, 820, 40), 90, 26, 70, '#7faa5e', 2, '#9cbc6a');
    const lp = polar(-90, 820, 60); const tw = new T.CylinderGeometry(5.2, 7.4, 52, 24, 12); tw.translate(0, 26, 0); paint(tw, (v, n, cc) => cc.copy(Math.floor(v.y / 8.7) % 2 ? lin('#d8443a') : lin('#f6f2ea')));
    const tm = new T.Mesh(tw, M({ roughness: .6 })); tm.position.copy(lp); G.add(tm);
    const lan = new T.Mesh(new T.CylinderGeometry(5.6, 5.6, 7, 16), new T.MeshStandardMaterial({ color: lin('#fff2c0'), emissive: lin('#ffd36a'), emissiveIntensity: .6 + night * 2.2 })); lan.position.set(lp.x, lp.y + 55, lp.z); G.add(lan);
    const cap = new T.Mesh(new T.ConeGeometry(7, 8, 16), new T.MeshStandardMaterial({ color: lin('#c0392b'), roughness: .6 })); cap.position.set(lp.x, lp.y + 62.5, lp.z); G.add(cap);
    // Hafenstadt: weiße Häuser mit blauen Kuppeln
    for (let k = 0; k < 64; k++) { const p = polar(-122 + R() * 18, 940 + R() * 140, 0), h = 8 + R() * 14, y = Math.max(0, 30 - Math.abs(p.length() - 1000) * .3) + R() * 6; box(G, new T.Vector3(p.x, y, p.z), 9 + R() * 8, h, 9 + R() * 8, R() < .8 ? '#f4efe6' : '#e8d2b4', { ry: R() * 3, em: '#ffc36a', emI: night * .35 });
      if (R() < .45) { const d = new T.Mesh(new T.SphereGeometry(5 + R() * 3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: lin('#2f6fd0'), roughness: .5 })); d.position.set(p.x, y + h, p.z); G.add(d); } }
    // Segelschiff (Rumpf als halbe gestreckte Kugel, Mast, zwei Segel)
    { const s = polar(-70, 640, 0), sh = new T.Group(); const hl = new T.Mesh(new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new T.MeshStandardMaterial({ color: lin('#7a4a2e'), roughness: .8 })); hl.scale.set(18, 6, 5); hl.position.y = 4; sh.add(hl);
      const ms = new T.Mesh(new T.CylinderGeometry(.6, .8, 30, 8).translate(0, 15, 0), new T.MeshStandardMaterial({ color: lin('#5a3a24') })); ms.position.y = 3; sh.add(ms);
      for (const [x, w, h] of [[-1, 15, 20], [7, 10, 14]]) { const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute([0, 6, 0, 0, 6 + h, 0, w, 6, 0], 3)); sg.computeVertexNormals(); const sl = new T.Mesh(sg, new T.MeshStandardMaterial({ color: lin('#fbf7ee'), roughness: .9, side: T.DoubleSide })); sl.position.x = x; sh.add(sl); }
      sh.position.copy(s); sh.lookAt(0, 0, 0); sh.rotateY(Math.PI / 2 + .5); G.add(sh); }
    // Inseln mit Palmen
    for (let k = 0; k < 5; k++) { const p = polar(10 + k * 22 + R() * 10, 1100 + R() * 700); hill(G, new T.Vector3(p.x, -4, p.z), 80 + R() * 90, 18 + R() * 20, 70 + R() * 60, '#d9c79a', k + 60, '#7faa5e'); trees(G, treeField(R, 14, 0, 50, 5, 8, -180, 180).map(q => [q[0] + p.x, 14, q[2] + p.z, q[3]]), 'round', '#4a8a3a', '#6aa848'); }
    mistRing(G, R, 26, 900, 2200, 600, 90, '#f2f6f8', .5, -6);
  },
  glutlande(G, R, L) { const night = L.night || 0;
    ridgeRing(G, R, 26, 2400, 3400, 240, 480, { base: '#4a3e3e', rock: '#5e5250', snowLine: 1.2, rough: 1 });
    for (let i = 0; i < 18; i++) { const az = -180 + i * 20 + R() * 10, d = 1000 + R() * 700; mountain(G, polar(az, d, -8), 130 + R() * 100, 45 + R() * 55, { base: '#4a3e3c', rock: '#34302e', snowLine: 1.2, rough: 1.2, seed: i + 70, seg: 32 }); }
    trees(G, treeField(R, 260, 800, 1500, 8, 14, -180, 180, () => 4), 'round', '#9a4a36', '#b8603e');
    // Vulkan mit Krater, Lavaströmen und Rauchfahne
    const v = polar(-90, 2300), H = 600; const vm = mountain(G, new T.Vector3(v.x, -10, v.z), 620, H, { base: '#4a3634', rock: '#3a2c2c', snowLine: 1.3, rough: .8, sharp: .6, crater: 1, seed: 5, seg: 128, hs: 48 });
    { const g = vm.geometry, p = g.attributes.position, cc = g.attributes.color, w = new T.Vector3(); const em = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { w.fromBufferAttribute(p, i); const a = Math.atan2(w.z, w.x), h = w.y / H, riv = Math.max(0, 1 - Math.abs(Math.sin(a * 4 + fbm(h * 2.2, Math.cos(a), Math.sin(a), 3) * 2.4)) * 7) * (h > .2 ? 1 : h * 5) + (h > .9 ? 1 : 0); const k = Math.min(1, riv); em[i * 3] = k * 1; em[i * 3 + 1] = k * .32; em[i * 3 + 2] = k * .05; }
      g.setAttribute('aEm', new T.BufferAttribute(em, 3)); vm.material.onBeforeCompile = s => { s.vertexShader = 'attribute vec3 aEm;varying vec3 vEm;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvEm=aEm;'); s.fragmentShader = 'varying vec3 vEm;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vEm*' + (1.6 + night * 2.4).toFixed(2) + ';'); }; }
    const glow = new T.Mesh(new T.CircleGeometry(70, 32), new T.MeshBasicMaterial({ color: lin('#ff8a2a').multiplyScalar(2) })); glow.rotation.x = -Math.PI / 2; glow.position.set(v.x, H - 40, v.z); G.add(glow);
    for (let k = 0; k < 9; k++) mist(G, -90 + k * 1.1 + (R() - .5) * 1.2, 2300 - k * 10, 260 + k * 60, 140 + k * 30, k < 2 ? '#8a6a62' : '#7a6e72', .55 - k * .03, H - 30 + k * 60);
    // Obsidian-Festung
    for (let k = 0; k < 11; k++) { const p = polar(-112 + k * 1.6, 1150 + (R() - .5) * 40, 20); prism(G, p, 12 + R() * 8, 26 + R() * 44, '#2a2026', { em: '#ff4a1a', emI: .15 + night * .8, rough: .25, sides: 4, tip: .45, metal: .3 }); }
    box(G, polar(-104, 1150, 20), 120, 22, 30, '#2e2428', { ry: -.3 });
    hill(G, polar(-104, 1150, -10), 150, 36, 110, '#3a2e2e', 9, '#4a3a36');
    mistRing(G, R, 40, 600, 1600, 520, 120, '#c9a49a', .5, -4);
  },
  kristallgebirge(G, R, L) { const night = L.night || 0;
    ridgeRing(G, R, 22, 2400, 3400, 280, 560, { base: '#6a7a8a', rock: '#7d8aa0', snow: '#f4f8fc', snowLine: .45, rough: 1.1, sharp: 1.4 });
    for (let i = 0; i < 14; i++) { const az = -180 + i * 25.7 + R() * 10, d = 1300 + R() * 700; mountain(G, polar(az, d, -20), 200 + R() * 150, 150 + R() * 180, { base: '#5d7066', rock: '#8a92a0', snowLine: .5, rough: 1.2, sharp: 1.5, seed: i + 90, seg: 48 }); }
    const c = polar(-90, 2000); mountain(G, new T.Vector3(c.x, -20, c.z), 640, 540, { base: '#5a6c66', rock: '#7d8798', snowLine: .42, rough: 1.2, sharp: 1.6, seed: 3, seg: 96 });
    trees(G, treeField(R, 420, 700, 1300, 8, 15, -180, 180, () => 4), 'pine', '#2f4a44', '#4a6a5a');
    const cry = (p, s) => { for (let k = 0; k < 9; k++) { const q = p.clone().add(new T.Vector3((R() - .5) * 60 * s, 0, (R() - .5) * 60 * s)); prism(G, q, (6 + R() * 8) * s, (50 + R() * 120) * s, R() < .5 ? '#8fd8ff' : '#4fa8f0', { em: '#3aa8ff', emI: .35 + night * 1.2, rough: .15, metal: .1, tilt: [(R() - .5) * .7, (R() - .5) * .6], sides: 6, tip: .35, op: .92 }); } };
    cry(polar(-48, 900, 0), .75); cry(polar(-100, 1600, 110), 1.7); cry(polar(-84, 1750, 200), 1.9); cry(polar(-30, 1200, 30), 1.2);
    // Bergstadt aus weißem Stein
    for (let k = 0; k < 46; k++) { const p = polar(-114 + R() * 12, 1200 + R() * 90), y = 40 + (p.length() - 1200) * .6 + R() * 10; box(G, new T.Vector3(p.x, y, p.z), 8 + R() * 8, 8 + R() * 16, 8 + R() * 8, '#eef0f2', { ry: R() * 3, em: '#ffd28a', emI: night * .4 });
      if (R() < .6) { const rf = new T.Mesh(new T.ConeGeometry(7, 9, 4), new T.MeshStandardMaterial({ color: lin('#3c6ab0'), roughness: .6 })); rf.position.set(p.x, y + 14 + R() * 4, p.z); rf.rotation.y = R(); G.add(rf); } }
    hill(G, polar(-114, 1230, -30), 170, 70, 120, '#6a7a6a', 4, '#8a9a8a');
    mistRing(G, R, 44, 600, 1700, 560, 130, '#f2f5f8', .6, 10);
  },
  frosttundra(G, R, L) { const night = L.night || 0;
    if (G.userData.kind === 'battle') water(G, '#4f7f9a', -2);
    ridgeRing(G, R, 18, 2600, 3600, 220, 520, { base: '#c8d6e2', rock: '#a8b8c8', snow: '#f6f9fc', snowLine: .25, rough: .8, skip: az => az > 0 && az < 80 });
    for (let k = 0; k < 40; k++) { const p = polar(-180 + R() * 360, 700 + R() * 1600), r = 50 + R() * 140; const g = displace(new T.CylinderGeometry(r * .9, r * 1.15, 6 + R() * 10, 28, 3), 8, .03, k); paint(g, (v, n, cc) => cc.copy(n.y > .5 ? lin('#f2f6fa') : lin('#b8d4e2'))); const m = new T.Mesh(g, M({ roughness: .4 })); m.position.set(p.x, -4, p.z); G.add(m); }
    for (let k = 0; k < 12; k++) { const p = polar(-180 + R() * 360, 600 + R() * 1200); mountain(G, new T.Vector3(p.x, -6, p.z), 30 + R() * 50, 50 + R() * 90, { base: '#bfe4f4', rock: '#e4f4fc', snow: '#ffffff', snowLine: .6, rough: 1.4, sharp: 2, seed: k + 120, seg: 12, mat: { flatShading: true, roughness: .3 } }); }
    // Gletscherplateau mit riesigem Eiskristall
    const c = polar(-90, 1600); mountain(G, new T.Vector3(c.x, -10, c.z), 420, 120, { base: '#dfeaf2', rock: '#f2f7fb', snowLine: .2, rough: .4, sharp: .2, seed: 7, seg: 64 });
    prism(G, polar(-90, 1600, 100), 34, 300, '#bfeaff', { em: '#6ad0ff', emI: .45 + night * 1.4, rough: .1, metal: .05, sides: 6, tip: .32, op: .9 });
    for (let k = 0; k < 10; k++) prism(G, polar(-90 + (R() - .5) * 6, 1600 + (R() - .5) * 90, 100), 8 + R() * 12, 60 + R() * 140, '#d6f2ff', { em: '#6ad0ff', emI: .3 + night, rough: .1, tilt: [(R() - .5) * .8, (R() - .5) * .6], op: .9 });
    mistRing(G, R, 40, 500, 1800, 560, 100, '#f4f8fb', .55, -4);
  },
  himmelsweiten(G, R, L) { const night = L.night || 0;
    const isl = (p, s, o = {}) => { const g = displace(new T.ConeGeometry(70 * s, 120 * s, 40, 12).rotateX(Math.PI).translate(0, -60 * s, 0), 18 * s, .025 / s, p.x); paint(g, (v, n, cc) => cc.copy(lin('#7a6a5e')).lerp(lin('#a89888'), fbm(v.x * .03, v.y * .05, v.z * .03, 3)));
      const m = new T.Mesh(g, M()); m.position.copy(p); G.add(m); const top = displace(new T.SphereGeometry(72 * s, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), 6 * s, .04 / s, p.z); top.scale(1, .28, 1); paint(top, (v, n, cc) => cc.copy(lin('#6aa84a')).lerp(lin('#9cc85a'), fbm(v.x * .05, 0, v.z * .05, 3)));
      const tm = new T.Mesh(top, M()); tm.position.copy(p); G.add(tm); trees(G, treeField(R, Math.round(18 * s), 0, 50 * s, 5 * s, 9 * s).map(q => [q[0] + p.x, p.y + 4 * s, q[2] + p.z, q[3]]), 'round', '#3f7a3a', '#6aa04a');
      if (o.fall) ribbon(G, new T.Vector3(p.x, p.y - 2, p.z).add(new T.Vector3(-p.x, 0, -p.z).normalize().multiplyScalar(62 * s)), 7 * s, 160 * s, '#ffffff', .8);
      if (o.temple) { const tc = new T.Vector3(p.x, p.y + 8 * s, p.z); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box(G, tc.clone().add(new T.Vector3(Math.cos(a) * 16 * s, 0, Math.sin(a) * 16 * s)), 2.6 * s, 22 * s, 2.6 * s, '#f4f0e6'); }
        const dm = new T.Mesh(new T.SphereGeometry(18 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: lin('#4fb0c8'), roughness: .4, emissive: lin('#4fd8ff'), emissiveIntensity: night * .6 })); dm.position.set(tc.x, tc.y + 22 * s, tc.z); G.add(dm); }
      if (o.mill) { const mp = new T.Vector3(p.x + 20 * s, p.y + 8 * s, p.z); box(G, mp, 9 * s, 26 * s, 9 * s, '#e8dcc8'); const bl = new T.Mesh(new T.BoxGeometry(2 * s, 40 * s, .8 * s), new T.MeshStandardMaterial({ color: lin('#8a6a4a') })); bl.position.set(mp.x, mp.y + 24 * s, mp.z); bl.lookAt(0, mp.y + 24 * s, 0); bl.rotateZ(.6); G.add(bl); const b2 = bl.clone(); b2.rotateZ(Math.PI / 2); G.add(b2); }
      return m; };
    isl(polar(-90, 1300, 230), 1.8, { temple: 1, fall: 1 }); isl(polar(-66, 1000, 150), 1.1, { mill: 1, fall: 1 }); isl(polar(-118, 1600, 330), 1.3, { fall: 1 });
    for (let k = 0; k < 9; k++) isl(polar(-180 + R() * 360, 1100 + R() * 1200, 80 + R() * 300), .8 + R() * 1.1, { fall: R() < .5, mill: R() < .3, temple: R() < .2 });
    // Brücke zwischen den Inseln (Bogen)
    const a = polar(-90, 1300, 232), b = polar(-66, 1000, 152); for (let k = 0; k <= 24; k++) { const t = k / 24, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * 18; box(G, p, 8, 2.2, 8, '#c8b89a', { ry: Math.atan2(b.x - a.x, b.z - a.z) }); }
    mistRing(G, R, 70, 350, 2400, 700, 150, '#ffffff', .8, -30); mistRing(G, R, 40, 300, 900, 380, 90, '#f8f4ee', .7, -10);
  },
  schattenmoor(G, R, L) { const night = L.night || 0;
    ridgeRing(G, R, 22, 2000, 3200, 200, 420, { base: '#2e2a40', rock: '#4a4460', snowLine: 1.2, rough: .9 });
    for (let i = 0; i < 20; i++) { const az = -180 + i * 18 + R() * 8, d = 1000 + R() * 800; hill(G, polar(az, d, -10), 110 + R() * 120, 26 + R() * 40, 100 + R() * 90, '#3a3a4a', i + 140, '#4a4660'); }
    // violette Leuchtbäume
    const tl = treeField(R, 380, 700, 1600, 9, 16, -180, 180, () => 6); trees(G, tl, 'round', '#5a3a8a', '#8a62b8');
    // Mondsichel-Portal + Ruinen + Kristallsäulen
    const c = polar(-90, 950, 0); const pt = new T.Mesh(new T.TorusGeometry(95, 9, 16, 96, Math.PI * 1.55), new T.MeshStandardMaterial({ color: lin('#e6dcff'), emissive: lin('#b88aff'), emissiveIntensity: .6 + night * 1.6, roughness: .3, metalness: .2 }));
    pt.position.set(c.x, 110, c.z); pt.lookAt(0, 110, 0); pt.rotateZ(1.25); G.add(pt);
    for (let k = 0; k < 16; k++) { const p = polar(-90 + (R() - .5) * 20, 950 + (R() - .5) * 140, 0); const h = 14 + R() * 46; const col = new T.Mesh(new T.CylinderGeometry(4, 4.6, h, 12).translate(0, h / 2, 0), new T.MeshStandardMaterial({ color: lin('#8a86a0'), roughness: .9 })); col.position.copy(p); col.rotation.z = (R() - .5) * .25; G.add(col); }
    for (let k = 0; k < 3; k++) { const p = polar(-100 + k * 10, 1050, 0); for (const s of [-1, 1]) box(G, p.clone().add(new T.Vector3(s * 14, 0, 0)), 6, 40, 6, '#7a7690'); box(G, p.clone().add(new T.Vector3(0, 40, 0)), 36, 6, 7, '#7a7690'); }
    for (let k = 0; k < 12; k++) prism(G, polar(-90 + (R() - .5) * 70, 450 + R() * 500, 0), 5 + R() * 6, 30 + R() * 70, '#9a6ae0', { em: '#9a5aff', emI: .5 + night * 1.4, rough: .2, tilt: [(R() - .5) * .5, (R() - .5) * .5], op: .92 });
    mistRing(G, R, 64, 500, 1800, 520, 110, '#c4bad4', .6, -4);
  }
};
export function buildRegion(region, L, kind) { CUR_L = L; const G = new T.Group(); G.userData.kind = kind; const R = rng(1000 + [...region].reduce((a, c) => a + c.charCodeAt(0), 0)); lights(G, L);
  if (kind === 'battle' && L.ground) ground(G, L.ground, R);
  (REG[region] || REG.lichtlande)(G, R, L, kind); return { group: G }; }
export const REGIONS = Object.keys(REG);
