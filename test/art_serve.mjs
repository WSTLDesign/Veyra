// Kleiner statischer Server für Bild-/Sprite-Tests (Loop A2): dist/ unter /, test/fixtures/ unter /fixtures/.
// Nötig, weil Bilder über file:// Canvas „verunreinigen“ (getImageData/WebGL gesperrt) – dann fällt das Spiel korrekt auf prozedurale Modelle zurück.
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
const root = fileURLToPath(new URL('../dist/', import.meta.url)), fx = fileURLToPath(new URL('./fixtures/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.css': 'text/css' };
export function serve(port = 0) {
  return new Promise(res => {
    const srv = createServer(async (rq, rs) => {
      let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
      const base = p.startsWith('/fixtures/') ? fx : root; if (p.startsWith('/fixtures/')) p = p.slice(9); if (p.endsWith('/')) p += 'index.html';
      const f = normalize(join(base, p)); if (!f.startsWith(base)) { rs.writeHead(403); return rs.end(); }
      try { const b = await readFile(f); rs.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); rs.end(b); } catch (e) { rs.writeHead(404); rs.end('404'); }
    });
    srv.listen(port, '127.0.0.1', () => res({ url: 'http://127.0.0.1:' + srv.address().port + '/', close: () => srv.close() }));
  });
}
