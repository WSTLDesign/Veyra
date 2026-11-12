// Erzeugt test/fixtures/cube.glb: winziges glTF-2.0-Binärmodell (Würfel 1×2×1, Material, Animationen „Idle“ und „Walk“) für den GLB-Pfad-Test (38-models.js)
import { writeFileSync } from 'fs';
const P = [], N = [], I = [];
const faces = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, -1], [1, 0, 0]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
for (const [n, u, v] of faces) { const o = P.length / 3; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(...[0, 1, 2].map(k => (n[k] + a * u[k] + b * v[k]) * .5 * (k === 1 ? 2 : 1) + (k === 1 ? 1 : 0))); N.push(...n); } I.push(o, o + 1, o + 2, o, o + 2, o + 3); }
const f32 = a => Buffer.from(new Float32Array(a).buffer), u16 = a => { const b = Buffer.from(new Uint16Array(a).buffer); return b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - b.length % 4)]) : b; };
const T = [0, .5, 1], R = [0, 0, 0, 1, 0, .0998, 0, .995, 0, 0, 0, 1], W = [0, 0, 0, 0, .1, 0, 0, 0, 0];
const parts = [f32(P), f32(N), u16(I), f32(T), f32(R), f32(W)];
let off = 0; const views = parts.map(b => { const v = { buffer: 0, byteOffset: off, byteLength: b.length }; off += b.length; return v; });
const mn = [0, 1, 2].map(k => Math.min(...P.filter((_, i) => i % 3 === k))), mx = [0, 1, 2].map(k => Math.max(...P.filter((_, i) => i % 3 === k)));
const json = { asset: { version: '2.0', generator: 'veyra-test' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'Koerper' }], meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
  materials: [{ name: 'Fell', pbrMetallicRoughness: { baseColorFactor: [1, .55, .2, 1], metallicFactor: 0, roughnessFactor: 1 } }],
  accessors: [{ bufferView: 0, componentType: 5126, count: P.length / 3, type: 'VEC3', min: mn, max: mx }, { bufferView: 1, componentType: 5126, count: N.length / 3, type: 'VEC3' }, { bufferView: 2, componentType: 5123, count: I.length, type: 'SCALAR' },
    { bufferView: 3, componentType: 5126, count: 3, type: 'SCALAR', min: [0], max: [1] }, { bufferView: 4, componentType: 5126, count: 3, type: 'VEC4' }, { bufferView: 5, componentType: 5126, count: 3, type: 'VEC3' }],
  bufferViews: views, buffers: [{ byteLength: off }],
  animations: [{ name: 'Idle', samplers: [{ input: 3, output: 4, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 0, path: 'rotation' } }] },
    { name: 'Walk', samplers: [{ input: 3, output: 5, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }] }] };
let js = Buffer.from(JSON.stringify(json)); if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - js.length % 4, 0x20)]);
const bin = Buffer.concat(parts), hdr = Buffer.alloc(12), ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
const total = 12 + 8 + js.length + 8 + bin.length; hdr.writeUInt32LE(0x46546C67, 0); hdr.writeUInt32LE(2, 4); hdr.writeUInt32LE(total, 8);
writeFileSync(new URL('./cube.glb', import.meta.url), Buffer.concat([hdr, ch(js.length, 0x4E4F534A), js, ch(bin.length, 0x004E4942), bin]));
console.log('cube.glb', total, 'Bytes');
