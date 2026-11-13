# Lizenzen – Pilot 3D-Modelle (tools/modelle, public/models/pilot)

| Bestandteil | Herkunft | Lizenz / Folge für das Spiel |
|---|---|---|
| `noa.glb`, `funki.glb` (Formen, Rig, Animationen, Texturen) | vollständig per Skript erzeugt (`noa.py`, `noa_teil2.py`, `funki.py`, `funki_teil2.py`, `vlib.py`), eigene Entwürfe nach den Veyra-Vorgaben (src/34-figures.js, docs/terras.md) | Eigentum des Projekts, keine fremden Rechte |
| Blender 5.3 (`bpy` von PyPI) | Werkzeug, läuft nur beim Bauen | GPL – betrifft nur das Werkzeug; erzeugte Dateien gehören dem Ersteller, keine Pflichten fürs Spiel |
| gltf-transform 4.5 (npm, außerhalb des Projekts installiert) | Werkzeug (Draco-Kompression) | MIT – keine Pflichten für die Ausgabe |
| Draco-Decoder | liegt bereits in `public/vendor/libs/draco` (three r128) | Apache 2.0 (unverändert, wie bisher) |
| MakeHuman/MPFB | **nicht verwendet.** Der Körper von Noa ist ein eigener Skin-Modifier-Grundkörper (Knotengraph → Quads → Subdivision). Falls MPFB später als Anatomie-Basis dient: nur Kern-Assets (CC0 1.0), keine Community-Assets (teils CC-BY), hier eintragen. | – |

Keine Designs, Formen, Farben oder Namen aus Pokémon/Nintendo oder anderen Marken; Pokémon diente nur als Technik-/Qualitätsmaßstab (weiche Toon-Schattierung, Gesichts-Pseudonormalen, Augen als eigene Netze, Blendshapes).
