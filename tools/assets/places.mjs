// Hybrid H2 – Ortsansichten: Kamera je Karte für `node tools/render_assets.mjs place` (Ausgabe public/art/place_<karte>.webp + _lo)
// Felder (alle optional, Standard aus der Kartengröße w×h): t = Spielzeit in Minuten (Licht/Himmel), cam = {x,z (Augpunkt in Feldern), y (Höhe), lx,ly,lz (Blickpunkt), fov}, setup = JS-Ausdruck nach dem Laden (z. B. Team-Partner)
// Koordinaten wie 09-three3d.js: Feld (x,y) → Welt (x+.5, 0, y+.5); Blick standardmäßig vom Südrand nach Norden über den Ort zum Horizont.
export const PLACES = {
  morgenau: { t: 15 * 60 + 30, cam: { x: 13, z: 15, y: 5.2, lx: 9, ly: 2.4, lz: -6 } },
  route1: { t: 14 * 60, cam: { x: 10, z: 22.5, y: 3.6, lx: 10, ly: 2.4, lz: -6 } },
  kupferhain: { t: 15 * 60, cam: { x: 10, z: 17, y: 3.6, lx: 10, ly: 2.4, lz: -6 } },
  route2: { t: 14 * 60, cam: { x: 1, z: 12, y: 3.4, lx: 22, ly: 2.2, lz: 2 } },
  // Nachbesserung 1 (QA Loop C W-3): höher/weiter, Blick über die Grotte; Leuchtfeuer-Partner im Team (hasField('lumen')) → beleuchtete Grotte statt dunkler Leere
  nebelgrotte: { t: 12 * 60, cam: { x: 9.5, z: 12.6, y: 7.8, lx: 9.5, ly: -.6, lz: 3.8, fov: 60 }, setup: 'G.team.push(mk(28,20))' },
  brisenhafen: { t: 15 * 60 + 30, cam: { x: 10, z: 17.5, y: 4.4, lx: 10, ly: 2.8, lz: -6 } },
  route3: { t: 14 * 60, cam: { x: 10, z: 17.5, y: 3.6, lx: 10, ly: 2.4, lz: -6 } },
  frostheim: { t: 13 * 60, cam: { x: 10, z: 17, y: 3.6, lx: 10, ly: 2.6, lz: -6 } },
  route4: { t: 17 * 60 + 40, cam: { x: 1, z: 12.5, y: 3.4, lx: 22, ly: 2.2, lz: 3 } },
  schattmoor: { t: 18 * 60 + 45, cam: { x: 10, z: 17, y: 3.6, lx: 10, ly: 2.4, lz: -6 } },
  siegesstrasse: { t: 16 * 60, cam: { x: 10.5, z: 18, y: 3.6, lx: 10.5, ly: 2.8, lz: -6 } },
  windkueste: { t: 15 * 60, cam: { x: 10, z: 28.5, y: 3.8, lx: 10, ly: 2.2, lz: -4 } },
  moewenbucht: { t: 16 * 60, cam: { x: 10, z: -1, y: 3.6, lx: 10, ly: 2.2, lz: 24 } },
  // Nachbesserung 1 (W-2/W-3): Vulkan steht jetzt östlich (Blickachse der Ankunft von Route 3) → Ortsbild vom Westeingang nach Osten
  glutschlucht: { t: 17 * 60 + 50, cam: { x: .5, z: 9.5, y: 4.2, lx: 30, ly: 5.5, lz: 4 } },
  fluestertal: { t: 16 * 60 + 30, cam: { x: 10, z: 20, y: 6.5, lx: 10, ly: 3.4, lz: -6 } }
};
