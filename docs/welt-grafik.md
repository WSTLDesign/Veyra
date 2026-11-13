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
