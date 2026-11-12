# Pilot 3D-Modelle – Noa und Funki als gebaute GLB-Modelle

Agent „Pilot 3D-Modelle“ (Opus 5.5 · hoch), 12.11.2026. Grundlage: docs/ziele.md (Entscheidungen 16:55), docs/recherche-3d-qualitaet.md, docs/analyse-3d-ist.md.
Ziel: Figuren und Terras wirken „wie mit einem professionellen 3D-Programm gebaut“. Die neuen Pokémon-Spiele dienen **nur** als Maßstab für Technik und Qualität (weiche Toon-Schattierung, Gesichts-Pseudonormalen, Augen als eigene Netze, Blendshapes). Alle Formen, Farben und Namen sind eigene Entwürfe.
**Status: Vorschau zur Freigabe.** Im Spiel ändert sich nichts, solange der Schalter aus ist (`SET.modelle3d` fehlt bzw. `false` = Standard).

## 1. Werkzeugkette (reproduzierbar, ohne GPU)

```
bash tools/modelle/bauen.sh [noa|funki|alle]
```
1. **Blender 5.3 als Python-Modul** in eigener Umgebung `/home/claude/.venv-blender` (uv, `bpy==5.3.0`, Python 3.13; Installation ≈ 30 s, 920 MB). Wird bei Bedarf vom Skript angelegt.
2. **Bauskripte** (komplett per Code, fester Zufalls-Startwert → gleiches Ergebnis bei jedem Lauf):
   - `tools/modelle/vlib.py` – Baukasten: Skin-Modifier-Grundkörper aus Knotengraph → Quads → Subdivision, Quad-Kugel-Köpfe mit Verformungsfunktionen, Lofts (Strähnen, Büschel, Säume) mit korrekter Wicklung, Ellipsoid-Gesichtsnormalen, UV-Atlas mit Texeldichte-Gewichtung, Cycles-CPU-Backen (Region-ID, Position, AO, Normal), Rig + Kapsel-Gewichte, Posen als Delta-Drehungen (Q = A⁻¹·E·A), Clips, GLB-Export.
   - `noa.py` + `noa_teil2.py`, `funki.py` + `funki_teil2.py` – die Modelle (`--form` = nur Formen + Kontrollbild, ≈ 1 s).
3. **Textur „malen“**: Region-ID-, Positions- und AO-Karte werden gebacken; numpy rechnet je Texel aus der 3D-Position Farbe, Zeichnung und Höhe (Wangenröte, Blatt-Emblem, Nähte, Schnürsenkel, Fellstriche, Stirnflamme …). Daraus 1024² Farbe mit weichem AO und eine Höhenkarte, die Cycles als Bump in eine **Tangenten-Normalkarte** backt (stimmt für jede UV-Lage). Augen/Mund: eigene 512×256-Textur.
4. **Export** GLB (WebP-Texturen, `export_try_sparse_sk=False`, Morph-Normalen aus), danach **Draco** mit gltf-transform 4.5 (npm, außerhalb des Projekts unter `/home/claude/gltf-tools`) → `public/models/pilot/<id>.glb`.
5. Zwischenstände: `tools/modelle/build/*.glb|*.png|*.json` (Kennzahlen je Lauf). Lizenzen: `tools/modelle/LIZENZEN.md` (MakeHuman/MPFB **nicht** verwendet – eigener Grundkörper reichte und ist besser kontrollierbar).

Bauzeit je Modell ≈ 70–80 s (davon AO-Backen ≈ 45–60 s auf 2 Kernen).

## 2. Die Modelle

| | Noa (Held, Stufe 0 „Startkleidung“) | Funki (001, Glut, Rotfuchs-Welpe) |
|---|---|---|
| Dreiecke | 19,6 k (Kopf 6,1 k · Körper 12,8 k · Augen 0,7 k) | 8,2 k (Kopf 4,5 k · Körper 3,2 k · Augen 0,5 k) |
| Datei (Draco) | 1,14 MB (roh 2,04 MB) | 1,12 MB (roh 1,54 MB) |
| Knochen | 30 (Becken/Wirbel 3, Hals, Kopf, Augen 2, Haar 2, Schulter/Arm/Unterarm/Hand/Finger/Daumen je Seite, Bein 4 je Seite) | 35 (Wirbel 4, Hals 2, Kopf, Augen 2, Ohren 2×2, Schulterblatt/Oberarm/Unterarm/Pfote, Oberschenkel/Schienbein/Mittelfuß/Pfote, Rute 5) |
| Shape Keys | 9: Blinzeln_L/R, Augen_froh, Laecheln, Mund_A, Mund_O, Staunen, Aerger, Traurig | 5: Blinzeln, Augen_froh, Maul_auf, Staunen, Ohren_an |
| Clips | idle (4 s, Atmen, Gewichtsverlagerung, Umschauen), walk (1 s, 0,9 m/Zyklus), run (0,67 s, 1,7 m) – Füße per IK im Bauskript gepflanzt | idle (3 s, Atmen, Ohrzucken, Kopfneigen, Rute), walk (0,8 s, Kreuzgang), run (0,5 s, Galopp), attack, joy, hit |
| Textur | 1024² Farbe+AO, 1024² Normal, 512×256 Augen/Mund | dito |
| Draw-Calls | 4 Netze + 2 Umriss-Hüllen = 6 | 4 + 2 = 6 |

Gesicht: Augäpfel als eigene Netze (Iris/Pupille/gemalte Glanzpunkte + Shader-Glanz, der mit Kamera und Licht wandert), Ober-/Unterlid-Schalen mit Lidlinie und Lidschwung, Brauen als Netz, Mund = Linie + Mundhöhlen-Aufkleber (öffnet per Shape Key, Zähne/Zunge in der Textur), Ellipsoid-Pseudonormalen (72 %) → ruhige Gesichtsschattierung ohne Nasen-/Augenflecken. Haare: Kappe + 34 Flusslinien-Strähnen vom Wirbel aus. Kleidung: Shirt/Hose abgehoben mit Falten (Saum, Knie, Knöchel), Säume/Kragen/Bündchen als eigene Ringe, Cargotaschen, Turnschuhe mit Sohle; Handgelenk-Gerät mit leuchtendem Schirm.
Funki: Vierbeiner mit Schulterblatt, Ellbogen nach hinten, Sprunggelenk, Zehengang; Fell = gezackte Silhouette (Wangen, Halskrause, Ohr-Innenfell, Rute mit gedrehtem Zackenquerschnitt) + Fellstriche in Farbe und Normalkarte; Flammenzungen und Stirnflamme leuchten (Maske a).

## 3. Toon-Pro-Shader (`src/56-toonpro.js`, neu, global)
- Wrap-Licht (w 0,35) → **zwei weiche Stufen** (0,42/0,74, Breite 0,07), Schatten **farbig** (Himmelslicht-Farbe × lila-kühler Ton × leicht gesättigte Grundfarbe statt Schwarz), **Hautstreuung** als warmes Band an der Schattenkante (Maske g), **Randlicht** (Fresnel, lichtseitig betont), Glanz (Haar/Metall/Glas, Maske b), Leuchten (Maske a), Normalkarte über Ableitungen (keine Tangenten nötig), Nebel der Szene.
- **Augen:** eigener Zweig – kaum Schattierung, zwei Glanzpunkte aus der Spiegelrichtung (MatCap-artig).
- **Umriss:** Inverted Hull mit **geglätteten Normalen** (gleiche Position → gemittelte Normale, keine Risse an UV-Nähten), Breite in Pixeln (Bezug 900 Zeilen) × Maske r, Farbe = abgedunkelte Texturfarbe. Varianten `duenn` (1,35 px) und `fast_keine` (0,55 px, heller) – `toonProVariant(obj,'fast_keine')`.
- **sRGB korrekt:** Textur sRGB→linear im Shader, Tonemapping der Szene, Ausgabe sRGB im Shader, wenn der Renderer linear ausgibt (Spiel), sonst über die three-Kodierung. `toonProSync(renderer)` je Bild (Ausgabeart + Auflösung).
- Licht ist „gestellt“ (Xrd-Prinzip): Stärke wird auf eine Referenz normiert (`uRef`), Farbe und Richtung kommen aus den Szenenlichtern → gleicher Look in Welt, Studio und Kampf; dunkle Szenen (Nacht) werden trotzdem dunkler.

## 4. Anbindung im Spiel (`src/57-modelle.js`, neu) – nur mit Schalter
- `SET.modelle3d=true` (oder `?modelle3d=1`) lädt `models/pilot/noa.glb` und `funki.glb` über den vorhandenen Loader aus 38-models (GLTFLoader + Draco). Schlägt das Laden fehl → Warnung, **bisheriges Prozedural** bleibt.
- Haken (greifen nur bei Schalter an **und** geladenem Modell): `person3d` (nur Spielerfigur `body:'held'`), `buildTerra` (nur Art 1, Höhe = Höhe des alten Modells), `gaitTick`/`figAnim` (Pilot-Figur: Mixer statt Prozedural-Gang), `animModel` (Pilot-Terra: idle/walk/run + attack/hit/joy bei Treffer/Angriff/Hüpfen, Ausdruck „freudig“).
- Tempo → Clip: Geschwindigkeit aus der Weltposition, Gewichte idle/walk/run weich, Abspieltempo = Tempo/Schrittlänge (kein Gleiten). Blinzeln zur Laufzeit (2–6 s, 150 ms, manchmal doppelt), Ausdrücke `pilotExpr(o,'laecheln'|'staunen'|…)`.
- **Fremde Dateien nicht geändert.** Bewegung/Übergänge (17, 04, 36, 35, 55) unberührt. build.mjs kopiert `public/models/pilot/` automatisch nach `dist/models/pilot/` (Unterordner → nicht in `MODEL_SRC`, Artifact unverändert).

## 5. Vorschauen (test/pilot/, 1600×900 WebP) – `node test/pilot/vorschau.mjs [noa|funki|welt|alle]` (Sperre!)
| Datei | Inhalt |
|---|---|
| `noa_alt_neu_vorn.webp` | Noa bisher vs. neu, von vorn, Studio-Licht |
| `noa_alt_neu_schraeg.webp` | Dreiviertelansicht |
| `noa_alt_neu_gesicht.webp` | Gesicht nah |
| `noa_ausdruecke.webp` | neutral · Lächeln · Staunen · Blinzeln (Shape Keys) |
| `noa_gang_reihe.webp` | je 8 Bilder Gehen und Rennen (Seitenansicht) |
| `funki_alt_neu_studio.webp` | Funki bisher vs. neu, Studio |
| `funki_kampfpose.webp` | bisher vs. neu im Angriffs-Clip, warmes Kampflicht |
| `umriss_duenn_fastkeine.webp` | Noa + Funki mit Umriss „dünn“ vs. „fast keine“ |
| `funki_noa_welt_alt_neu.webp` | echtes Spielbild Route 1, Schalter aus vs. an (Held + Begleiter) |
| `welt_spielbild_neu.webp` | Spielansicht mit Schalter an (HUD wie im Spiel) |

## 6. Messung (SwiftShader-PC, 2 Kerne – Bildrate nur relativ)
| Größe | Wert |
|---|---|
| Ladezeit (Abruf + Draco + WebP-Dekodierung, lokal) | Noa 0,7–1,1 s · Funki 0,7–1,0 s (Draco-Decoder beim ersten Mal inklusive) |
| Testszene Route 1, Held + Begleiter, 1600×900, Qualität „eigene“ | bisher 71 Draw-Calls / 0,20 Mio. Dreiecke → mit Pilot 76 Calls / 0,26 Mio. (inkl. Umriss-Hüllen und Schattenpass) |
| Bildrate (SwiftShader-Software-GL, 2 Kerne) | 0,8 → 0,7–0,8 Bilder/s – auf dieser Software-GPU kein messbarer Unterschied; echte Handy-Messung steht aus |
| Fehler in der Konsole (Studio, Welt aus/an) | 0 / 0 / 0 |
| Smoke-Test (Schalter aus) | `node build.mjs && node test/smoke.mjs` → „Keine Fehler.“ |
| Kennzahlen je Bau | `tools/modelle/build/noa.json`, `funki.json`; Vorschau-Messung `test/pilot/messung.json` |

## 7. Offene Punkte
- **Proportionen/Gesicht Noa:** Hinterkopf/Schädel noch etwas eiförmig, Hals wirkt lang; Hände ohne Fingerknochen-Animation (Finger-Knochen gemeinsam). Kopfform am besten mit Nutzer-Feedback feinjustieren (Werte in `head_shape`).
- **Dreiecke Noa 19,6 k** (Ziel 8–15 k; Schädel unter dem Haar bleibt jetzt erhalten, sonst Lücken): Hauptposten Haarsträhnen 3,2 k, Säume/Taschen 3,2 k, Körper 3,6 k. LOD1 (Decimate 50 %) per Skript ist der nächste Schritt; Funki 8,2 k liegt knapp über 8 k.
- **Tempo im Spiel:** `MOVE_PARAMS` Gehen 2,8 Felder/s ist für eine 1,32 hohe Figur sehr schnell → die Pilot-Figur nutzt ab ≈ 1,3 Feldern/s schon den Renn-Clip. Abstimmen mit Agent „Übergänge & Bewegung“.
- Kampf zeigt weiter das gemalte Bild (bewusste Entscheidung 15:17); Funki-GLB erscheint in Welt/Begleiter. Fangkapsel-/Wink-/Jubel-Clips für Noa fehlen noch (figAnim „jubel“ setzt nur den Ausdruck).
- Kontaktschatten/Schattenwurf: Modelle werfen Schatten; Selbstschatten macht der Shader. Kein LOD, keine Distanz-Abschaltung der Normalkarte.
- Artifact-Variante lädt keine Pilot-Modelle (Dateien zu groß für Inline) → dort immer Prozedural.

## 8. Vorschlag für die Serie
- **Wiederverwendbar ohne Änderung:** `vlib.py` (alles), Augen-/Lid-/Mund-System (als Funktion herauslösen), Toon-Pro-Shader, 57-Anbindung (Tabelle `PILOT.src/fix` → je Art/Figur ein Eintrag), Vorschau-Skript.
- **Rig-Vorlagen:** Figur (30 Knochen, Clips idle/walk/run gelten für alle Menschen gleicher Bauart – Clips einmal bauen, per Name binden) und Vierbeiner (35 Knochen, Kreuzgang/Galopp/attack/joy/hit über IK-Funktionen, nur Gelenkpositionen je Art). Weitere Vorlagen: Vogel, Fisch/Schlange, Kugel/Schwebend, Zweibeiner-Terra.
- **Je Modell neu:** Steckbrief (Maße, Knotengraph, Kopfform, Anhänge, Farben/Zeichnung in numpy) – geschätzt **2–4 Std. Agentenzeit je Terra** gleicher Vorlage (davon ½ Std. Bildprüfung), **4–6 Std. je Figur** (Kleidung/Haare individuell), Bauzeit je Lauf 1–2 min.
- Reihenfolge: Starter-Linien (002/003, 004–009) → Rivalen/Professor → Welt-I-Arten nach Körperbau gebündelt; jede Welle mit Vergleichsbogen und Freigabe.
