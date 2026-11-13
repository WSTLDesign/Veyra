# Welt-Grafik 2 – Schärfe, Farbe, Licht, Gras, Gelände, Qualitätsstufen

Agent „Welt-Grafik“ (Opus 5.5 · hoch), 12./13.11.2026. Anlass: Nutzer-Feedback 22:10 („richtige Richtung, aber zur Anmutung von Pokémon Legends fehlt noch viel – die Grafik, die Auflösung“). Pokémon dient **nur** als Maßstab für Technik und Qualität; Formen, Farben, Orte bleiben eigen.

## Was geändert wurde

### 1. Farbraum und Tonemapping (`src/59-grafik.js`, neu)
- **Bildtransformation „Veyra-Neutral“** statt ACES: Die Welt-Farben sind in sRGB angelegt. Jeder Pixel wird linearisiert, leicht farbkorrigiert (Sättigung 0,95, kühle Schatten / warme Lichter ±3,5 %), mit der Khronos-PBR-Neutral-Kurve sanft getont (Grundfarben bleiben treu, nur Lichter werden gestaucht, kaum Entsättigung) und zurück nach sRGB gewandelt. Umsetzung als `THREE.CustomToneMapping` (ein Chunk-Austausch, keine Zusatz-Pässe, alle Stufen gleich).
- Wirkung: ACES machte die Mitten dunkel und die Lichter grau (weiß ≈ 77 %), dazu ein Pixel-„Matsch“ in dunklen Flächen. Jetzt klare Weißtöne, sattere, aber nicht neonfarbene Flächen, weichere Übergänge.
- **Toon-Pro (`56-toonpro.js`) nutzt dieselbe Kurve** (`uVtm`, automatisch über `toonProSync`): GLB-Figuren/Terras und prozedurale Welt teilen jetzt eine Bildtransformation (vorher: Modelle heller/anders als die Welt). Andere Renderer (Studio-Vorschauen) bleiben unverändert (ACES-Pfad wie bisher).

### 2. Schärfe / Auflösung
- **Dynamische Auflösung mit Untergrenze je Stufe** (hoch 85 %, mittel 75 %, niedrig 70 % statt bis 60 %): Wird es zu langsam, senkt die Automatik zuerst die Stufe (Effekte), erst dann die Schärfe. Das war die Hauptursache für „unscharf/pixelig“ auf Handys.
- Pixelverhältnis-Deckel je Stufe: hoch 2,0 · mittel 1,75 · niedrig 1,5 (PC-Notbremse aus 54 bleibt).
- MSAA 4× (Canvas) bleibt; **anisotrope Filterung** je Stufe 8/4/2; Bodentextur mit Mipmaps.
- Voreinstellungen: „Mittel“ jetzt mit Schatten und Geräteauflösung, „Niedrig“ ohne feste 720 Zeilen (Deckel über das Pixelverhältnis).
- Starke Mobil-GPUs (aktuelle iPhones/iPads, Adreno ≥ 640, Mali-G7x/G6xx, Immortalis, Xclipse) starten in „Auto“ auf **Hoch**; schwache auf Niedrig; Rest Mittel. Danach regelt die Bildrate (43-perf).

### 3. Licht und Schatten
- **Schattenkarte 2048² (hoch) / 1024² (mittel)**, Ausschnitt ±12,5 / ±11 Felder, **in Blickrichtung verschoben** (mehr Auflösung, wo man hinschaut), auf Texel gerastert gegen Flimmern; PCF-Soft.
- Licht-Balance draußen: Sonne ×1,12, Himmelslicht ×0,9 (nach dem Bild-Licht aus 44-sky) → klarere Formen und Schatten.
- Toon-Verlauf der Welt (toonGrad) leicht angehoben (Schattenseite 38 % statt 33 %) – weicher, wie gemalt; Toon-Pro: Wrap 0,4, Stufen 0,40/0,72, Weichheit 0,1.
- **Bloom + Vignette (nur „hoch“)**: Bildkopie → ¼-Auflösung Schwelle/Weichzeichner → additiv zurück (Mischung One/SrcAlpha, damit Vignette im selben Pass). Keine zweite Szenen-Zeichnung. Bei Fehler schaltet er sich selbst ab.

### 4. Gelände, Gras, Bäume, Felsen, Wasser (`src/09-three3d.js`)
- **Bodentextur auf der GPU gebacken** (`w3bake`, einmalig, 1024² auf hoch, 512² sonst, kachelbar, Mipmaps): weiche Grasbüschel (zwei Voronoi-Größen), Halmstriche in zwei Maßstäben, großflächige Wolke; Erde mit wenigen kleinen Kieseln und Körnung; Pflaster/Sand wie bisher. Ersetzt die 256²-CPU-Textur mit 4-px-Wertrauschen – das war das sichtbar „pixelige“ Muster am Boden. CPU-Fassung bleibt Rückfall.
- Großflächige Farbvariation des Bodens verstärkt (hell-gelbliche und kühl-dunkle Flecken über ~20 m).
- **Gras dichter**: hohes Gras 10 statt 9 Büschel je Feld, Wiesenbüschel auf 85 % statt 50 % der Felder mit 3 statt 2 Büscheln; Halme direkt vor der Kamera blenden weich aus.
- **Baumkronen neu (`crownGeo`)**: je Baum EINE Instanz aus 9 Laub-Büscheln (Ikosaeder) mit **Kugel-Normalen der Gesamtkrone** (72 %) → eine weiche Licht- und Schattenseite wie gemalt, Büschel-Silhouette; Vertexfarbe = Höhenverlauf (oben warm/hell, unten/innen dunkel als gebackene AO). Detailstufen je Qualitätsstufe (9/6/4 Büschel), Umschalten ohne Neubau. Ferne Bäume immer 4 Büschel.
- **Schatten-Stellvertreter**: Kronen werfen ihren Schatten über eine unsichtbare 3-Büschel-Krone → Schattenpass ⅓ der Dreiecke.
- **Büsche** als eigene Büschel-Form (2 Varianten) statt 4 loser Kugeln.
- **Felsen** (`rockGeo`): Ikosaeder Stufe 2 mit zwei Rauschlagen, abgeflachter Unterseite, weich facettiert, Kontakt-AO in Vertexfarben (gilt auch für Klippen und Wahrzeichen-Sockel aus 49).
- **Wasser**: Wellen-Normale aus zwei driftenden Rauschlagen, Fresnel (Schlick) mit Himmels-Cubemap, Sonnenglitzern, heller Sandgrund im Flachen (Uferübergang), aufgelockerter Schaum, flaches Wasser durchscheinend (α 0,72 → 0,96). Lava unverändert.

### 5. Qualitätsstufen
| | Hoch | Mittel | Niedrig |
|---|---|---|---|
| Schattenkarte / Ausschnitt | 2048² / ±12,5 | 1024² / ±11 | aus (Kontaktschatten) |
| Pixelverhältnis-Deckel / Mindestskala | 2,0 / 85 % | 1,75 / 75 % | 1,5 / 70 % |
| Pflanzen / Partikel / Blätter | 100 % / 100 % / 34 | 78 % / 65 % / 18 | 50 % / 30 % / 0 |
| Kronen (Büschel) | 9 | 6 | 4 |
| Bloom + Vignette | ja | – | – |
| Anisotropie / Bodentextur | 8 / 1024² | 4 / 512² | 2 / 512² |

Optionen › Grafik: „Qualitätsstufe“ (Auto/Niedrig/Mittel/Hoch/Ultra) und „Grafikstufe“. Für Staging-Vergleiche: `?gfx=hoch|mittel|niedrig` erzwingt eine Stufe (nicht gespeichert). Messung: `gfxStats()`.

## Messwerte (SwiftShader-Software-GL, 2 Kerne, 1600×900 – nur relativ vergleichbar)
Siehe `test/welt2/n1_mess.json` (Draw-Calls, Dreiecke inkl. Schatten- und Bloom-Pässe, Bildzeit). Zusammenfassung im Abschlussbericht und unten.

## Vorschauen (`test/welt2/`, 1600×900 WebP) – `node test/welt2/shots.mjs <tag> [hoch,mittel,niedrig] [szenen]` (Chromium-Sperre!)
- `vorher_<szene>_hoch.webp` – Stand zu Beginn (22:15), `vorher16_morgenau_hoch.webp` – Morgenau vom Stand 16:20 (`VEYRA_ROOT=build/plain`, gleicher Blickpunkt)
- `n1_<szene>_<stufe>.webp` – nachher je Stufe; `vergleich_<szene>.webp` vorher|nachher, `stufen_<szene>.webp` Hoch|Mittel|Niedrig
- Zwischenrunden `r1…r4_*` (Tonemapping-Abstimmung, Boden, Kronen, Schatten-Stellvertreter)

## Offen / auf echtem Gerät prüfen
- Bildrate und Wärme auf Handy/Tablet je Stufe (Software-GL misst nur relativ); ob „Auto“ starke GPUs korrekt erkennt (`GFX.gpu`).
- Bloom per Bildkopie (`copyFramebufferToTexture`) auf iOS-Safari/Android-Chrome mit MSAA – schaltet sich bei Fehler ab, sichtbar prüfen.
- GPU-Backen der Bodentextur bei Kontextverlust (WebGL context lost) – Textur würde schwarz; Rückfall CPU wäre nur beim Neustart aktiv.
- Hoch liegt auf Route 1 bei ≈ 255–265 k Dreiecken inkl. Schattenpass (Budget 250 k gilt für Mittelklasse = Stufe Mittel).
- Höhlen-Look (Wände, Kristalle) gehört zu 51-innen; hier nur Licht/Tonemapping/Fels-Form.
- Nicht umgesetzt: Blender-GLB-Vegetation (prozedurale Kronen erreichen die Wirkung günstiger), Höhennebel, echte LOD je Entfernung für Gras.

## Runde 2 (13.11., 01:00–04:30)
- **Farbvariation:** Boden mit großflächigem Farbton-Wechsel (gelblich-trocken ↔ kühl-blaugrün, ~60 m) und Kräuterflecken; Gras-Instanzen nach großem Rauschen trockener oder kühler; jede Baumkrone mit eigener Farbton-/Sättigungs-/Helligkeitsstreuung; **Blumenwiesen** (zusammenhängende Flecken in einer Blütenfarbe).
- **Luftperspektive** (`59-grafik.js`, Nebel-Chunks global ersetzt): Weitsicht-Dunst zusätzlich zum linearen Nebel, Bodendunst in der Ferne (Welthöhe im Vertex-Shader), Blaustich mit der Entfernung.
- **Wege:** breiterer, verrauschter Übergang Weg ↔ Gras, Kiesel praktisch entfernt (nur feine Körnung).
- **Höhlen (`51-innen.js`, jetzt mitbetreut):** Fels `iRock` als Ikosaeder Stufe 1 mit zwei Rauschlagen, Schichtung, abgeflachter Kuppe und ⅔ glatten Normalen statt Kristall-Facetten; Leucht-Teile (Kristalle, Laternen) bekommen Facetten-Schattierung + Randlicht im Glüh-Shader (09). Innenraum-API unverändert.
- **Palmen:** gebogene, gezackte Wedel mit Mittelrippe und Farbverlauf (`frondGeo`) statt flacher Kugeln.
- **Budget Hoch ≤ 250 k:** Krone 7 Büschel, Schatten-Stellvertreter 2, ferne Bäume 2 Büschel, Pflanzendichte Hoch 90 % → Route 1 ≈ 243 k (vorher 262 k).
- Vorschauen: `test/welt2/r2_<szene>_<stufe>.webp`, Vergleiche `r2_vergleich_<szene>.webp`, `r2_stufen_route1.webp`; Messwerte `test/welt2/r2_mess.json`.

## Runde 3 (13.11., bis 04:45)
- **Gebäude/Wahrzeichen:** Detailtextur auf der GPU gebacken (1024²/512²: Putz mit Kellenstrichen, gerundete Schindeln mit Schattenkante, Bretter mit Maserung, Quader mit Fase), Kontakt-AO an Gebäudefüßen (Wände/Sockel unten dunkler), Umriss dünner und weicher (0,011 statt 0,018, Farbe #4a4048).
- **Höhlenwände (51-innen):** Felswände in 2–5 gerundeten, versetzten Schichtbänken statt eines gestreckten Blocks; Feuchtglanz als kühles Randlicht.
- **Höhennebel:** Bodendunst in der Ferne aus Runde 2 (Welthöhe im Nebel-Shader); kein zusätzlicher Pass.
- Bilder `test/welt2/r3_*.webp`, Vergleiche `r3_vergleich_*.webp`.

## Runde 4 (13.11., 02:15–04:45) – modellierte Hausschalen (Blender)
- **Baukasten** `tools/modelle/welt/gebaeude.py` (Blender 5.3 als Python-Modul, eigenständig, vlib.py unverändert): `haus` (Satteldach) und `station` (Tonnendach). Teile: Wandkörper mit gerundeten Kanten, Sockel mit Abdeckung, Fachwerk (Eckpfosten, Rähm, Brüstungsriegel, Giebelständer, Streben, Riegel), Giebeldreiecke, Ziegelschornstein mit Kragen/Kappe, Dachschrägen mit Traufe (.3) und Ortgang (.2), Ziegelreihen als Stufen, First, Windbretter, Dachrinne; Station: Pilaster, Gesims, Tonnendach mit Rippen, Rinnen. 2,2 k / 1,2 k Dreiecke. AO 1024² in Cycles gebacken (Boden als Verdecker), Vertexfarben = Teilfarbe, zwei Objekte „Wand“/„Dach“. Bau: `LOCK=…/.blender.lock … /home/claude/.venv-blender/bin/python tools/modelle/welt/gebaeude.py alle` (≈ 65 s). Ausgabe `public/models/welt/haus.glb` (0,36 MB), `station.glb` (0,17 MB).
- **Einbau** (09-three3d.js, `w3HausFor/w3HausLoad/w3HausBuild`): nur mit `SET.modelle3d` / `?modelle3d=1` (gleicher Schalter wie Figuren/Terras), früh vorgeladen. Häuser `h`, Labor `L`, Station `P` (Tiefe ≥ 2) werden als Instanzen auf die Kachelfläche skaliert (Breite/4, Tiefe/3), Wandfarbe/Dachfarbe je Haus als Instanzfarbe, Detailmuster der Stadt (aMat aus der Teilfarbe) + AO-Textur, dünner Umriss. Fenster, Türen, Laternen, Schilder, Kuppel/Antenne (Labor) baut 09 weiter → **Türposition und Kollision unverändert**. Ohne Schalter oder bei Ladefehler: Kasten-Häuser mit Runde-3-Texturen; ist ein Ort vor dem Laden gebaut, wird er danach einmal neu aufgebaut.
- Offen: Fensterlaibungen als echte Öffnungen (Fenster sitzen weiter als Rahmen auf der Wand), Laden `M`/Arena `A`/Wahrzeichen-Türme noch prozedural; Labor nutzt das Satteldach-Modell (1,5× breit gestreckt).

## Runde 5 (13.11., 05:30–08:00)
- **Budget mit 3D-Modell-Schalter** (`59-grafik.js`, `GFX.mlod`): je Bild werden Figuren-/Terra-Modelle (57/58, erkannt an `userData.pilot`/`lod0`/`lod1`) nach Kameraabstand gedrosselt und nach dem Zeichnen zurückgesetzt – Hoch: Figuren-LOD1 (57) ab 5, Schattenwurf bis 4,5, Umriss bis 7, sichtbar bis 24 Felder · Mittel 4/3,5/5/18 · Niedrig 3/0/4/14. Spielfigur nie ausgeblendet; die LOD-Stufen von 57/58 bleiben aktiv. Messung: `node test/welt2/_budget.mjs <karte> <x> <y> <richtung>` (`NOLOD=1` = ohne Drosselung).
- **Eigene Modelle** (`gebaeude.py`): `labor` (Nennmaß 6×3: flaches Dach mit Attika, Glas-Lichtband, Sternwarten-Kuppel mit Spalt, Antenne mit Schüssel, Solarfelder, Metallgesims, Lisenen; 1,6 k Dreiecke) und `laden` (4×3: Gesims, Eckpfosten, Flachdach mit drei Sheds und Oberlichtern; 0,6 k). 09 ordnet zu: h→haus, L→labor, P→station, M→laden; prozedurale Dachteile/Kuppel/Antenne/Sheddach entfallen bei Modell, Markise/Schaufenster/Schilder bleiben.
- **Fenster**: jede Fensteröffnung bekommt eine Laibung (Sturz, seitliche Leibungen, 13 cm tief) mit dunklem Grund – die Scheibe sitzt sichtbar zurückgesetzt (gilt für Modell- und Kasten-Häuser, ohne Zusatz-Draw-Call). Echte Wandöffnungen im Modell sind nicht möglich, weil Fensterplätze je Haus von 09 gewürfelt werden.
- Übergangstest zusätzlich mit `?modelle3d=1`: `node test/welt2/_ueb_m3.mjs` (Kopie von test/uebergaenge_qa.mjs mit Schalter, Ausgabe test/welt2/_ueb_m3.log).
