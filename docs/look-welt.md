# Look L1 – Welt-Rendering & Performance

Agent L1 (Opus hoch) · 10.11.2026 · Modul LOOK-MODERNISIERUNG + PERFORMANCE (AGENTS.md). Ziel: flüssiger auf dem Handy, Welt „weicher, echter, weniger pixelig“ – nur Prinzipien (weiche Materialien, realistisches Licht, ruhige Kamera), keine Fremdoptik.

Dateien: `src/09-three3d.js` (Welt), `src/10-mon3d.js` (nur Sprite-Licht/Schatten), `src/07-settings.js` (Auflösung/Defaults), `src/03-engine.js` (Schleifen-Drosselung), `src/43-perf.js` (neu), `src/06-regions.js` (PALETTE-Anhang), Tests `test/look_lib.mjs`, `test/look_welt_shots.mjs`, `test/look_welt_perf.mjs`.

## 1. Performance

### Auflösung (07)
- `resH()` = **min(SET.res, Bildschirmhöhe × DPR)**, DPR-Deckel 2 (1,5 bei schwacher GPU, `PERF.weak`). Vorher war `SET.res` eine feste Renderhöhe (860×400 → 3096×1440 = 4,46 Mpx).
- Neu `SET.res='auto'` (Standard): Gerätehöhe; die **3D-Welt** nutzt `resH3()` = Gerätehöhe × `PERF.scale` (dynamische Auflösung 0,6–1,0). 2D-Karte und Kampf-Leinwand nutzen `resH()` (ohne dynamischen Faktor, sie werden nur bei `applySet` neu angelegt).
- Neu `SET.gfx` `'auto'|'low'|'mid'|'high'` (Standard auto), `SET.quality` Voreinstellung `'auto'` (`PRESET.auto`), `SET.fps` Standard 60, `SET.view` spiegelt `SET.view2d` (L2) – Standard `'third'`.
- Migration (`SET.lookV`): wer die alten Standards nie geändert hat (res 1440, 30 fps, „eigene“), bekommt einmalig Auto/60 fps; bewusst gewählte Werte bleiben gültig und werden nur auf Gerätepixel gekappt.

### Messung & Stufen (43-perf.js)
- Hauptschleife (`loop`, 15-ui.js) wird umhüllt: nur tatsächlich gezeichnete Frames werden gemessen (gleitendes Mittel `PERF.ft` Frame-Abstand, `PERF.js` JS-Zeit).
- Alle 600 ms Bewertung mit Hysterese: zu langsam (> 1,25 × Ziel) → Auflösung −8 % (−15 % bei > 1,8 ×) bis 0,6; danach (4 langsame Fenster) Stufe runter. Schnell (< 1,08 × Ziel) → nach 3 Fenstern +5 % Auflösung; erst bei 100 % und 16 schnellen Fenstern (≈ 10 s) Stufe rauf. 900 ms Einschwingzeit nach jedem Wechsel, Ausreißer > 250 ms (Kartenaufbau) zählen nicht.
- Startstufe: `SET.gfx` oder auto → schwache GPU `low`, Touch `mid`, sonst `high`.

| Stufe | Schatten | Schatten-Update | Partikel | Vegetation | Nebel-Fernweite | fallende Blätter |
|---|---|---|---|---|---|---|
| low | aus (nur Kontaktschatten) | – | 30 % | 45 % | 75 % | 0 |
| mid | 512², PCFSoft | jeder 2. Frame | 60 % | 72 % | 88 % | 16 |
| high | 1024², PCFSoft | jeder Frame | 100 % | 100 % | 100 % | 34 |

- `window.PERF_HUD=1` oder `?perf=1`: Anzeige unten links (FPS, ms, JS, Calls, Dreiecke, Stufe, Canvas-Größe, Auflösungs-%).
- Schleife (03 `loopGate`): verdeckter Tab → kein Frame, Schleife ruht bis `visibilitychange` (Neustart ohne dt-Sprung); `mode` menu/dialog/title/shop → höchstens 30 FPS (`LOOP.idleFps`).
- Kampf mit deckendem Kampfbild (`#battle` undurchsichtig): die Welt wird nicht mitgerendert (`worldCovered()`, 2×/s geprüft; wird `#battle` durchsichtig, rendert die Welt automatisch wieder).

### Geometrie & Draw-Calls (09)
- Instanzen in **räumlichen Paketen** (Raster ≈ halbe Kartengröße) mit eigener Hüllkugel → Frustum-Culling für Kamera **und Schattenpass** (vorher `frustumCulled=false` für alles). Gilt für Bäume, Stämme, Kronen, Gras, Blumen; ferne Ringbäume als ein Mesh ohne Schattenwurf.
- LOD Bäume: Kartenbäume 5 verformte Kronenkugeln (120 Dreiecke), Horizontbäume 2 Kugeln (56 Dreiecke); keine Umriss-Hülle mehr an Vegetation (halbierte Kronen-Dreiecke, weniger Comic).
- Kugel-Wolken entfallen (Wolken im Himmel-Shader), Berge 352 → 120, Hügel 270 → 120, Blumen 158 → ≈ 70, Stamm 160 → ≈ 100 Dreiecke; Außenfläche 85² → 60² Segmente, zum Kartenrand verdichtet.
- Gras/Blumen in zufälliger Reihenfolge → `count` je Stufe dünnt gleichmäßig aus.
- Keine Allokationen je Frame in `draw3d`/`atmo3d`/`blobSync` (Vektoren/Farben wiederverwendet, Lichtsuche ohne Hilfs-Arrays, `outfitSync` nur 2×/s, konstante Tabellen).

## 2. Look

- **Licht:** eine Sonne mit weichem Schatten (PCFSoft, eine Shadow-Map, Schattenkamera folgt der Figur, auf Texel gerastert gegen Flimmern), Hemisphärenlicht schwächer (Schatten sichtbar), Mittagssonne ≈ 57° statt 71° (plastischere Schatten), Belichtung 1,02 (vorher 1,3 – ausgewaschen). Weicher 5-Stufen-Verlauf `toonGrad()` mit linearer Filterung (vorher 3 harte Stufen).
- **Licht-Sets:** `setLightSet(name, ms)` blendet zu `PALETTE.light[name]` und zurück (`null`), Start immer beim gerade sichtbaren Licht. Randlicht und Belichtung der Tageszeit kommen aus `explore/dusk/night`. Neu in PALETTE (06): `morning`, `forest`, `cave`, `interior`, `PALETTE.mat` (Materialgrundfarben).
- **Boden:** statt hochskalierter 2D-Pixelkacheln eine **Material-Mischung im Shader** (MeshLambert + onBeforeCompile): Typkarte je Kachel (Erde/Weg, Pflaster, Sand/Ufer, Waldboden/hohes Gras, Holzsteg, Eis) bilinear + Rauschverzerrung = organische Kanten; kachelbare Detailmuster (Gras, Erde mit Kieseln, Pflaster als Voronoi-Steine mit Fugen, Sand mit Rippeln, Fels mit Rissen, Schnee, Planken), großflächige Farbvariation, Relief-Eindruck zur Sonne, Kontaktschatten unter Bäumen/Felsen/Wänden/Gebäuden. Innenräume, Deck, Metall, Marmor behalten die gemalte Kacheltextur.
- **Materialien:** Gebäude mit Weltprojektions-Muster je Fläche (`aMat`: 1 Putz, 2 Dachschindeln, 3 Holz, 4 Stein), Felsen/Klippen Steinmuster, Stämme Rinde, Kronen Blattwerk; Toon mit weichem Verlauf statt MeshStandard (Entscheidung nach Messung: Standard kostet je Pixel deutlich mehr, der weiche Toon-Verlauf + Detailmuster wirkt ähnlich „echt“).
- **Wasser/Glas:** Himmels-Cubemap (CubeCamera 6 × 64 px, nur bei Tageszeit-/Wetteränderung neu) spiegelt sich in Wasser (Wellen-Normalen, Fresnel) und Fenstern (Fresnel + Glanzpunkt am Tag, nachts warmes Licht).
- **Himmel:** Verlauf + prozedurale Wolkendecke (driftet, von der Sonne angestrahlt, Abdeckung nach Wetter, verdeckt Sterne/Sonne), Sonnenscheibe mit zweistufigem Glow, Sterne/Mond nachts, Distanznebel = Horizontfarbe (atmosphärische Perspektive), Fernweite 44 statt 26.
- **Umgebung:** Wind in Gras/Kronen (bestehend), fallende Blätter/Blüten/Asche/Irrlichter als EIN InstancedMesh (Menge je Stufe, nicht bei Niederschlag), Glühwürmchen/Pollen (bestehend, Menge je Stufe).
- **Kreaturen-Sprites (10):** Tönung nach Licht (nachts dunkler, lesbar), Randlicht-Hauch auf der Lichtseite (Alpha-Kante im Atlas, Richtung = Sonne im Bildschirm), **Schattenwurf** über eigenes Tiefenmaterial (Billboard im Schattenpass zur Lichtquelle gedreht, Alpha-Test) – sie „stehen“ in der Welt.
- **Kamera:** kritisch gedämpfte Glättung (`sdamp`) für Blickrichtung, Position, Blickpunkt, Schulterseite, Abstand – weiches Anfahren/Auslaufen, kein Ruck bei Richtungswechseln; tiefer (1,85 statt 2,3) und flacher (Blickpunkt 1,12 statt 0,9) = leichte Heldenperspektive mit mehr Himmel/Horizont.

## 3. Schnittstellen für L2 (und andere)

| Schnittstelle | Datei | Bedeutung |
|---|---|---|
| `SET.res='auto'`, `SET.quality='auto'`, `SET.gfx` | 07 | **L2 bitte in rSettings (15-ui) ergänzen:** Auflösung „Auto“ (`['auto','Auto']` vorn), Qualitätsstufe „Auto“ (`['auto','Auto']`, setzt `PRESET.auto`), optional Zeile „Grafikstufe“ `seg('gfx',[['auto','Auto'],['low','Niedrig'],['mid','Mittel'],['high','Hoch']])`; nach Änderung `saveSet()` + `perfStart();w3Quality()` (bzw. Neustart). `PRESET.*` enthalten jetzt `gfx`. |
| `SET.view2d` / `SET.view` | 07, 15 | L2s `SET.view2d=1` ist maßgeblich (Draufsicht); `SET.view` spiegelt es beim Laden ('third'/'2d'). |
| `resH()` / `resH3()` | 07 | Renderhöhe gekappt / 3D-Welt mit dynamischem Faktor. Andere Renderer (BT, Viewer) nutzen `resH()` und sind damit automatisch gekappt. |
| `PERF`, `perfTier()`, `perfSet(t)`, `window.PERF_HUD` | 43 | Stufe/Messwerte lesen; `perfTier().part` für eigene Partikelmengen (z. B. Kampf-Effekte). |
| `LOOP.idleFps`, `loopIdle()` | 03 | Gedrosselte Modi: menu, dialog, title, shop. Neue Vollbild-Overlays bitte über einen dieser Modi laufen lassen. |
| `setLightSet(name, ms)` | 09 | z. B. `setLightSet('special',300)` bei Resonanz in der Welt, `setLightSet(null)` zurück. Wirkt auf die Welt-Szene (draußen). |
| `CAM` | 09 | `mode 'explore'`: Verfolgerkamera (09) + Wischen (36). `'dialog'`/`'cinematic'` (oder jeder Modus mit `CAM.world=true`): 09 fährt gedämpft zu `target + (sin yaw·dist, height, cos yaw·dist)`, Blick auf `lookAt`, `fov`, `roll`; `CAM.smooth` (s, Standard 0,35), `CAM.snap=true` springt. `'battle'` ohne `world` gehört der Kampfszene BT (35/42-Fallback) – L1 setzt `battleApplied` nicht, der 42-Fallback bleibt aktiv. Im Erkundungsmodus spiegelt 09 `target/dist/height/fov/lookAt` jedes Frame in CAM. |
| `R3.activeCam`, `R3.camC`, `R3.shown` | 09 | gerade benutzte Kamera / CAM-Kamera / Kopie der tatsächlich gezeigten Kamera (nach allen Render-Hooks) – für Projektionen (KP-Leisten über Köpfen in der Welt). |
| `worldCovered()` | 09 | true, solange `#battle` die Welt deckend überlagert (Welt wird dann nicht gerendert). |
| `addDetail(mat,kind,scale)`, `W3T`, `groundMat` | 09 | Detailmuster für eigene Toon-Materialien (`'rock'|'bark'|'leaf'|'town'`). |
| `toonGrad()` | 09 | jetzt weicher 5-Stufen-Verlauf (wirkt auch auf die Kampfarena in 10). |

## 4. Messwerte vorher/nachher

Methode wie docs/perf-basis.md (Headless-Chromium + SwiftShader, DPR 1, Messfenster je Zeile, keine Roamer; absolute FPS nicht auf Handys übertragbar – belastbar sind Draw-Calls, Dreiecke, Pixel, JS-Zeit). Skript `node test/look_welt_perf.mjs [ms]` → `test/look_welt_perf.json`.

### 4a. Direkter Vergleich alt/neu (gleicher Stand aller anderen Dateien, nur L1-Änderungen zurückgedreht)
Skript `scratchpad/L1/cpu.mjs` (Viewport 640×300, res native, Schatten an, Stufe high, 15 s je Zeile, Median über alle gezeichneten Frames):

| Szene | CPU | Draw-Calls alt → neu | Dreiecke alt → neu | JS/Frame Median alt → neu | render() Median alt → neu | Frames in 15 s (SwiftShader) alt → neu |
|---|---|---|---|---|---|---|
| Route 1 | 1× | 30 → 39 | 356.504 → 122.438 (−66 %) | 2,6 → 2,3 ms | 1,6 → 1,6 ms | 12 → 25 |
| Morgenau | 1× | 30 → 44 | 300.434 → 94.976 (−68 %) | 2,5 → 2,1 ms | 1,9 → 1,4 ms | 18 → 36 |
| Route 1 | 4× | 30 → 40 | 356.504 → 122.440 | 12,9 → 8,5 ms (Mittel 31,6 → 8,9) | 9,7 → 4,8 ms | 5 → 23 |
| Morgenau | 4× | 30 → 38 | 300.434 → 91.368 | 6,7 → 6,9 ms (Mittel 8,9 → 7,3) | 4,4 → 4,5 ms | 13 → 26 |

Deutung: Dreiecke −66 bis −68 %, die Software-Rasterung schafft doppelt so viele Bilder (Grundzeit je Frame halbiert, siehe SwiftShader-Modell in perf-basis.md); die JS-Zeit bleibt trotz mehr Draw-Calls (Pakete für Culling) gleich oder sinkt (keine Allokationen je Frame, Culling im Schattenpass). Ziel JS ≤ 4 ms bei 1× erreicht; 4× liegt bei 7–9 ms (< 16 ms für 60 FPS). Dazu kommt auf echten Geräten die Pixel-Ersparnis: Standard rendert jetzt Gerätepixel (860×400 DPR 1: 4,46 → 0,34 Mpx; Handy DPR 3: Deckel 2 → statt 4,46 Mpx etwa 1,4 Mpx) und Auto regelt bis 0,6× herunter.

### 4b. Messreihe nach perf-basis-Methode
`node test/look_welt_perf.mjs 6000` (Fenster 6 s, keine Roamer). Konfigurationen: **auto** = Auslieferung (res/gfx auto; SwiftShader gilt als schwache GPU → Stufe low), **hoch** = gfx high + Gerätepixel, **niedrig** = gfx low + Gerätepixel. Hinweis: Die dynamische Auflösung ignoriert Frames > 250 ms (Kartenaufbau-Schutz) und greift unter SwiftShader daher nicht – auf Geräten regelt sie ab 1,25 × Zielzeit.

**Zusammenfassung vorher (perf-basis.md) → nachher:**

| Größe | Welt 3D vorher | Welt 3D nachher | Kampf 3D vorher | Kampf 3D nachher |
|---|---|---|---|---|
| Dreiecke je Frame | 309 000 – 357 000 | 104 000 – 122 000 | 37 000 | 37 000 |
| Draw-Calls (ohne Roamer) | 25 – 45 | 38 – 58 | 15 | 15 |
| Canvas 860×400 Standard | 3096×1440 (4,46 Mpx) | 860×400 (0,34 Mpx) | 2580×1200 (3,10 Mpx) | 860×400 (0,34 Mpx) |
| JS/Frame 1× (Mittel) | 1,6 – 5,3 ms | 1,5 – 3,5 ms | 2,8 – 6,1 ms | 1,5 – 2,2 ms |
| JS/Frame 4× (Mittel) | 6,5 – 14,8 ms | 5,6 – 10,5 ms | 10,7 – 12,6 ms | 5,4 – 6,1 ms |
| SwiftShader FPS 860×400 (gleiche Pixel, „native“) | 1,44 – 1,67 | 1,8 – 2,7 | 1,30 | 4,8 – 5,2 |

Kampf: die Welt wird unter dem deckenden Kampfbild nicht mehr mitgerendert → Software-Rasterung ≈ 4× schneller, JS halbiert.

| Viewport | CPU | Szene | Konfig | Canvas | Draw-Calls | Dreiecke | JS/Frame ms (Mittel/p95) | render() ms | SwiftShader FPS (Frame ms) | Stufe |
|---|---|---|---|---|---|---|---|---|---|---|
| 860×400 | 1× | route1 | auto | 860×400 | 38 | 107.818 | 1,98 / 4 | 1,26 | 2,7 (369,8) | low |
| 860×400 | 1× | route1 | hoch | 860×400 | 39 | 122.438 | 3,03 / 6,3 | 1,95 | 1,82 (550) | high |
| 860×400 | 1× | route1 | niedrig | 860×400 | 38 | 107.818 | 1,92 / 4,1 | 0,84 | 2,72 (367,7) | low |
| 860×400 | 1× | morgenau | auto | 860×400 | 57 | 111.814 | 2,26 / 5 | 1,7 | 2,05 (487,5) | low |
| 860×400 | 1× | morgenau | hoch | 860×400 | 58 | 118.214 | 3,48 / 6,5 | 2,1 | 1,49 (670,8) | high |
| 860×400 | 1× | morgenau | niedrig | 860×400 | 57 | 111.814 | 1,55 / 2,3 | 0,98 | 2,02 (494,4) | low |
| 860×400 | 1× | kupferhain | auto | 860×400 | 49 | 105.960 | 1,94 / 3,6 | 0,94 | 2,4 (416,6) | low |
| 860×400 | 1× | kupferhain | hoch | 860×400 | 50 | 111.648 | 2,45 / 5,2 | 1,51 | 1,85 (540,9) | high |
| 860×400 | 1× | kupferhain | niedrig | 860×400 | 52 | 107.764 | 2,05 / 3,5 | 0,86 | 2,38 (420,2) | low |
| 860×400 | 1× | kampf3d | auto | 860×400 | 15 | 37.188 | 2,12 / 5,5 | 1,08 | 5,17 (193,5) | low (BT) |
| 860×400 | 1× | kampf3d | hoch | 860×400 | 15 | 37.188 | 1,56 / 3,2 | 0,79 | 4,81 (207,7) | high (BT) |
| 860×400 | 1× | kampf3d | niedrig | 860×400 | 15 | 37.188 | 1,5 / 2,5 | 0,68 | 5,01 (199,4) | low (BT) |
| 860×400 | 4× | route1 | auto | 860×400 | 38 | 107.818 | 10,33 / 27,5 | 6,47 | 1,72 (581,6) | low |
| 860×400 | 4× | route1 | hoch | 860×400 | 39 | 122.438 | 9,26 / 18,1 | 5,9 | 1,17 (858,3) | high |
| 860×400 | 4× | route1 | niedrig | 860×400 | 38 | 107.818 | 5,56 / 9,3 | 2,76 | 1,73 (576,6) | low |
| 860×400 | 4× | morgenau | auto | 860×400 | 57 | 111.814 | 8,59 / 15,6 | 5,67 | 1,33 (750) | low |
| 860×400 | 4× | morgenau | hoch | 860×400 | 58 | 118.214 | 6,86 / 12,7 | 4,36 | 1,04 (961,1) | high |
| 860×400 | 4× | morgenau | niedrig | 860×400 | 57 | 111.814 | 8,11 / 12,9 | 5,09 | 1,36 (733,3) | low |
| 860×400 | 4× | kupferhain | auto | 860×400 | 55 | 109.568 | 7,69 / 14,1 | 4,43 | 1,57 (637) | low |
| 860×400 | 4× | kupferhain | hoch | 860×400 | 56 | 115.256 | 10,54 / 16,6 | 7,24 | 1,2 (835,7) | high |
| 860×400 | 4× | kupferhain | niedrig | 860×400 | 55 | 109.568 | 7,9 / 10,7 | 4,32 | 1,57 (637) | low |
| 860×400 | 4× | kampf3d | auto | 860×400 | 15 | 37.188 | 6,13 / 11,2 | 3,28 | 3,31 (301,7) | low (BT) |
| 860×400 | 4× | kampf3d | hoch | 860×400 | 15 | 37.188 | 5,37 / 10,2 | 2,56 | 3,43 (291,7) | high (BT) |
| 860×400 | 4× | kampf3d | niedrig | 860×400 | 15 | 37.188 | 5,46 / 9,3 | 2,4 | 3,5 (285,7) | low (BT) |
| 1920×1080 | 1× | route1 | auto | 1920×1080 | 38 | 107.818 | 2,04 / 2,6 | 1,14 | 0,72 (1395,8) | low |
| 1920×1080 | 1× | route1 | hoch | 1920×1080 | 39 | 122.438 | 1,98 / 2,4 | 1,4 | 0,53 (1888,8) | high |
| 1920×1080 | 1× | route1 | niedrig | 1920×1080 | 38 | 107.818 | 1,88 / 2,4 | 1,16 | 0,71 (1400) | low |
| 1920×1080 | 1× | morgenau | auto | 1920×1080 | 57 | 111.814 | 2,6 / 4,9 | 2 | 0,49 (2024,9) | low |
| 1920×1080 | 1× | morgenau | hoch | 1920×1080 | 58 | 118.214 | 1,7 / 2 | 1,27 | 0,41 (2424,8) | high |
| 1920×1080 | 1× | morgenau | niedrig | 1920×1080 | 57 | 111.814 | 2,63 / 4 | 1,73 | 0,5 (2016,6) | low |
| 1920×1080 | 1× | kupferhain | auto | 1920×1080 | 48 | 105.512 | 1,65 / 2,6 | 0,87 | 0,62 (1605,5) | low |
| 1920×1080 | 1× | kupferhain | hoch | 1920×1080 | 52 | 113.004 | 2,7 / 3,9 | 1,9 | 0,47 (2116,6) | high |
| 1920×1080 | 1× | kupferhain | niedrig | 1920×1080 | 46 | 103.820 | 1,8 / 2,5 | 1 | 0,63 (1588,8) | low |
| 1920×1080 | 1× | kampf3d | auto | 1920×1080 | 15 | 37.188 | 1,74 / 3,3 | 0,93 | 1,35 (741,6) | low (BT) |
| 1920×1080 | 1× | kampf3d | hoch | 1920×1080 | 15 | 37.188 | 1,94 / 5,6 | 1,09 | 1,42 (704,1) | high (BT) |
| 1920×1080 | 1× | kampf3d | niedrig | 1920×1080 | 15 | 37.188 | 2,21 / 4,5 | 1,07 | 1,4 (716,6) | low (BT) |

## 5. Screenshots
`node build.mjs && node test/look_welt_shots.mjs <tag> [voll]` → `test/look_welt_<tag>_<breite>_<karte>_<zeit>.png` (860×400, mit „voll“ auch 1920×1080; Tag/Abend/Nacht; route1, morgenau, nebelgrotte, brisenhafen, fluestertal). Vorher: `look_welt_v0_*`, Iterationen `v1`–`v3`, Endstand `v4`.

## 6. Offen
- Echte Handy-Messung (Remote-Debugging) steht aus; SwiftShader misst nur CPU-Seite und Verhältnisse.
- Kampfszene BT (10-mon3d `render3DBattle`) wendet CAM nicht selbst an – der L2-Weg in 42 (`camBattleApply` + `battleHudPlace`) bleibt die gültige Lösung; `CAM.battleApplied` wird von L1 bewusst **nicht** gesetzt (Datei-Grenze: L1 darf in 10 nur Sprite-Licht/Schatten; eine Doppel-Implementierung brächte keinen Vorteil). Wer render3DBattle später auf CAM umstellt, setzt dort `CAM.battleApplied=true`.
- Weltkampf in R3.scene (R8): 09 kann CAM bereits in Weltkoordinaten anwenden (`CAM.world=true`), es fehlen nur die Kampf-Objekte in der Weltszene (35 `camPts()`).
- Innenräume/Deck/Metall/Marmor nutzen weiter die gemalte Kacheltextur (jetzt Lambert statt Standard).
