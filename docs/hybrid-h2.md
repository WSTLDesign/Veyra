# Hybrid H2 – Kampf vor Regions-Panorama, Kreaturen-Licht, Ortsansichten, Kapitel-Standbilder

Agent H2 (Opus hoch) · 10.11.2026 · Modul HYBRID-LOOK Punkte 3, 4, 5, 6 (AGENTS.md). Baut auf H1 auf (`docs/hybrid-sky.md`, `src/44-sky.js`).
Code: `src/45-hybrid.js` (neu), kleine Hooks in `src/10-mon3d.js`, `src/09-three3d.js`, `src/27-story.js`, `src/35-transitions.js`; CSS-Block „HYBRID H2“ am Ende von `src/styles.css`;
Bilder `public/art/place_<karte>.webp`, `public/art/chapter_<n>.webp` (+ `_lo`); Werkzeug `tools/render_assets.mjs place|chapter`, `tools/assets/places.mjs`; Tests `test/unit_hybrid.mjs`, `test/hybrid_shots.mjs`.

## 1. Kampf vor dem gerendertem Regions-Panorama (Punkt 3)

**Variante:** ein Vollbild-Viereck in der Kampfszene `BT.s` (ShaderMaterial, `gl_Position = (x, y, 1, 1)`, `renderOrder −100`, ohne Tiefe) statt CSS-Ebene: kein transparentes Canvas nötig (der Kampf-Renderer ist deckend erzeugt), keine Abstimmung DOM↔WebGL je Frame (kein Flackern), läuft auf jeder Stufe. Es ersetzt die alte Kuppel, Bäume, Hügel und Wolken der Kampfszene → **weniger** Draw-Calls (siehe 5.).

**Abbildung exakt aus der Kamera** (`hyBgCam`, im `onBeforeRender` des Vierecks, also mit der endgültigen Kamera inkl. `camBattleApply`/View-Offset aus 42):
- Horizontpunkt der Szene = Projektion eines Punkts 1000 m voraus auf Augenhöhe → Bildschirm-NDC `(hx, hy)`.
- Bild-NDC = `hImg + (NDC − hScreen) · K / s` mit `K = f_Bild / f_Kamera` (Brennweiten aus FOV 38° des Renders bzw. `projectionMatrix`), `hImg.y = 1 − 2·horizonY` (0,589 → −0,178).
- ⇒ **Horizontlinie des Bildes = Horizont der Szene bei jeder Neigung und jedem FOV** (Auftakt-Totale, „beide“, Attackenwahl, Treffer-Fokus). Maßstab stimmt (Bild verhält sich wie unendlich fern).
- Gierwinkel gedämpft (35 %): das Bild wandert beim Kameraschwenk leicht mit, ohne an den Rand zu laufen. Bezug = Pose „beide“ (`CAMPOSE.both`) auf den Standardplätzen.
- Abdeckung: breiteres Seitenverhältnis (z. B. 860×400) oder Blick nach oben → Bild um den Horizontpunkt vergrößert (`s` ≤ 1,6), darüber Übergang in die Zenitfarbe des Bildes.
- **Kampfkamera:** Pose „beide“ in `35-transitions.js` von `p −0,005, h 0,95` auf `p −0,055, h 1,05` (leichte Untersicht) → Horizont im Hauptzustand bei **0,589** der Bildhöhe = `horizonY` des Bildes (gemessen in `test/unit_hybrid.mjs`). Auftakt-/Nah-Posen unverändert (qa_look_kampf/look_ui_cam).

**Boden-Patch:** bisheriger Kampfboden (Kreis r 45, Plattformen, Halme, Blüten, Steine, Büsche) bleibt 3D, Farben je Region. Alle Toon-Materialien der Szene bekommen per `onBeforeCompile` dieselbe Bild-Abbildung: nach Nebel/Tonemapping wird **ins Bildpixel dahinter** übergeblendet (`smoothstep(11, 30, Abstand zur Arenamitte)`, Himmelsweiten 9 → 17 = Inselkante zum Wolkenmeer). Dazu ein Grundanteil `hyK0` (Tag 14 %, Abend 20 %, Nacht 30 %) – bindet Farbe/Helligkeit an das Panorama. Weiche Hinterkante ohne Transparenz, ohne zusätzlichen Draw-Call.
- **Bodenfarbe automatisch auf das Bild abgestimmt:** Mittelfarbe des nahen Bodens im Kampfbild (untere Zeilen, 64×36-Probe) → Umkehrung von ACES (three r128, inkl. Belichtung) → geteilt durch die Beleuchtung eines nach oben zeigenden Toon-Bodens (Hemisphäre + Sonne · Toon-Verlauf(N·L), 09 `toonGrad`) = Albedo. Halme/Steine/Plattform behalten das Verhältnis der Regionspalette (`HY_GROUND`). Messung v3 → v4 (Boden im Bild unten, 860×484): z. B. Glutlande Tag 3D (167,131,113) → (125,82,57) bei Bild (110,71,49); Lichtlande Tag (185,204,163) → (173,200,132) bei (162,193,120).
- Himmelsweiten: unten im Bild liegt das Wolkenmeer → Grasinsel mit dem Wiesen-Messwert der Lichtlande zur selben Tageszeit (`HY_GRASS`).
- Regionsboden: Gras (Licht/Smaragd/Himmel), Sand mit Dünengras (Flut), Lava-Kruste ohne Halme mit leicht glühenden Brocken (Glut), Fels-Wiese (Kristall), Schnee ohne Halme (Frost), Moor-Gras (Schatten). Büsche nur Licht-/Smaragdwald.

**Licht aus dem Bild** (`hyBattleFrame`, Hook in `render3DBattle` nach dem Licht, vor `sprTick`): Hemisphäre `envFor.hemiTop/hemiBot`, Sonne/Mond Farbe+Stärke, **Richtung = Bild-Sonne** (Bildraum → Szene um den Bezugs-Gierwinkel gedreht, ≥ 14° wie H1) → Schattenkarte der Sprites; Randlicht in Horizontfarbe (abends warm), Nebel = Horizontfarbe (22–90), Belichtung `1,08 · env.exposure`. Nachts Licht ×1,35/1,6 (Kinder: Kreaturen bleiben lesbar).

**Tageszeit/Region:** `skyTime()` (dominantes Bild zur Spielzeit), `skyRegion(cur)`; Test-Hook `window.HY_REGION`. Je Kampf einmal entschieden (bis 0,9 s nach Beginn, danach kein Wechsel mitten im Kampf).
**Fallback:** Innenraum, Höhle (`theme cave`), fehlendes Bild (`ok=false`), nicht ladbar (file://, verunreinigt) → bisheriger Kampfhintergrund (Kuppel, Bäume, Thema aus 10) vollständig wiederhergestellt.
**Vorladen:** beim Kartenwechsel (`loadMap`-Hülle) und bei `startBattle` (während Bemerken-Icon/Wischblende): `Image.decode()` → keine synchrone Dekodierung im Frame; existiert die Kampfszene schon, wird die Textur sofort per `renderer.initTexture` hochgeladen. Höchstens 2 Kampftexturen im Speicher (je 3,7 MB GPU, `low` 0,9 MB). Übergang (35) nutzt das Panorama ab dem ersten Kampfbild.

## 2. Kreaturen-Render-Behandlung (Punkt 5)
- Hook `hySprPost(S, L, cam)` am Ende der Licht-Rechnung in `sprTick` (10): Tönung je Tageszeit (nachts kühler, abends wärmer), Randlicht abends ×1,7 und Richtung Sonnenfarbe (warme Kante), nachts bläulich. Gilt im Kampf (Licht des Kampfbildes) und in der Welt (Licht der H1-Skybox, Stärke 70 %).
- Neu im Sprite-Shader: `uHzC/uHzK` – Entfernungs-Dunst in Horizontfarbe (nur Kampf: hintere Kreatur 16–22 % je nach Tageszeit, vordere klar; Welt 0, dort wirkt der normale Nebel).
- Bodenschatten Kampf: Ellipse in Richtung weg von der Bild-Sonne, gestreckt/versetzt nach `1/tan(Sonnenhöhe)`, Deckkraft nach Sonnenhöhe (nachts weicher). Welt: Hook `hyBlob` in `blobSync` (09) – gleiche Regel für die Kontaktschatten mit `SKY3.sd`.
- Keine neuen Bildquellen; Sprites/Illustrationen unverändert.

## 3. Ortsansichten (Punkt 4)
- `loadMap`-Hülle → `hyMapEntered(id)`: Standbild **beim Betreten eines Ortes**: jede Außenkarte außer Routen (`route*`, Windküsten-Pfad), Routen nur bei **Regionswechsel**; nicht bei Innenräumen, nicht bei Rückkehr in denselben Ort, derselbe Ort frühestens nach 5 min wieder, mindestens 20 s zwischen zwei Ortsbildern, nicht innerhalb 60 s nach einem Kapitelbild, nie über Titel/Intro/Intro-Film. Erster Start: Intro → Charaktererstellung → Zuhause (Innenraum) → erstes Hinaustreten = **ein** Ortsbild (oder gar keins, wenn das Kapitel-1-Bild gerade lief).
- Bild: `ort_<karte>` / `stadt_<karte>` aus `ART_SRC`, sonst `place_<karte>` (offline gerendert). Die vorhandenen `ort_*/stadt_*/region_*`-Bilder passen zu keiner heutigen Karten-ID (Loop C/D legen Karten mit diesen Namen an → greifen dann automatisch); `region_*` wird wegen des „Mooslein“-Hinweises (AGENTS.md) nicht als Ladebild benutzt.
- Ablauf: 0,28 s Einblenden, Ken-Burns 1,045 → 1, Ortsname (Display-Schrift) + Untertitel „Region · Beiname“, Signatur-Linie; nach **1,5 s** 0,7 s Überblendung in die Echtzeitszene. Tippen überspringt. Gebietsbanner wird während des Bildes unterdrückt. Steuerung ruht (`mode 'wait'`, danach zurück).
- Tageszeit: Bild ist bei Nachmittagslicht gerendert; abends wärmer getönt, nachts dunkel/kühl (CSS-Filter + Verlauf).
- Bild wird nur gezeigt, wenn es ≤ 0,7 s nach dem Betreten dekodiert ist (Nachbarorte werden vorgeladen) → kein spätes Aufploppen.
- Tests: `navigator.webdriver`/`VEYRA_DEMO` → sofort beendet (kein DOM), `window.VEYRA_HY=1` erzwingt die Anzeige.

**Render-Pipeline** `node build.mjs && node tools/render_assets.mjs place [--map a,b] [--ss 2] [--preview]`: lädt `dist/index.html` über den H1-Server, Stufe high, Auflösung nativ, 2048×1152, je Karte Spielzeit + Filmkamera aus `tools/assets/places.mjs` (CAM `cinematic`, Spielfigur unter der Kamera, Wesen frei), wartet auf die H1-Skybox, Bildschirmfoto nur des Welt-Canvas (UI ausgeblendet), PIL Lanczos → 1024×576 + sanfte Vignette, WebP q72 (`_lo` 512×288 q66). ≈ 2,5 min je Karte (SwiftShader).

## 4. Kapitel-Standbilder (Punkt 6)
- Hook in `storyTick` (27): beim Kapitelwechsel (`G.story.ch` ≠ aktuelles Kapitel) `hyChapterShow(n, {then: storyCard})` – Standbild, danach die bisherige Kapitel-Karte. Einmal je Kapitel: `G.story.pics[n] = 1` (Default `{}` in `migrateStory`, alte Stände unverändert).
- Bild: `chapter_<n>` (1–8, 9 Finale, 10 Epilog), Kapitelnummer + Region, Titel (`kanonText`), ein kurzer Satz (`HY_CHAP`). Überspringbar ab 1 s (Tippen, Enter/Leertaste/Escape), sonst 4,8 s. Steuerung ruht.
- Zuordnung (Stimmung): 1 Aufbruch mit goldenem Hirsch im Sonnenlicht (f_09) · 2 Blattbär in Blumen (f_06) · 3 Fuchs in der Brandung (f_05) · 4 Brücke über den Wolken (f_08) · 5 weißer Hirsch im Eisnebel (f_16) · 6 zwei Freunde vor der Glut-Schlucht (f_11) · 7 Kristall-Land von oben (f_04) · 8 Kristall-Licht über dunklem Meer (f_19) · 9 Wächter um den Kristall (f_20) · 10 Morgen im grünen Tal (f_18). Kriterium Drachen (präzisiert nach QA N2): **kanonische Veyra-Drachen sind erlaubt** – Kapitel 9 (Wächter um den Kristall) und 10 (Morgen im Tal) zeigen Kristall-/Glut-/Eisdrachen der eigenen Veyra-Linien (Crystalon, Glut-/Eislinie, Nutzermaterial). Ausgeschlossen bleiben nur Drachenbilder, deren Silhouette/Farbschema an fremde Marken-Designs erinnert. Nicht verwendet: f_10/f_17 (Drachen in fremd wirkender Gestaltung, nicht kanonisch), f_13/f_14/f_15 (Figuren mit Schwert), f_21/f_22 (Logo im Bild).
- `node tools/render_assets.mjs chapter`: Still `f_<i>` liegt im Intro-Film bei `t = 2 + 4·(i−1)` s → ffmpeg holt ±0,6 s mit 30 Bildern/s, das ähnlichste Bild (MSE 1,4–3,3 gegen das Still) in **720p** (gleiches Nutzermaterial, schärfer als die 480er-Stills); ohne ffmpeg/Video das Still selbst. WebP q70 1280×720 (`_lo` 640×360 q62).

## 5. Messwerte
| | vorher | nachher |
|---|---|---|
| Draw-Calls Kampf route1 (860×484, high) | 15 | **11** (Panorama +1, Kuppel/Bäume/Kronen/Hügel/Wolken −5 inkl. Schattenpass) |
| Draw-Calls Kampf brisenhafen | 13 | 10–11 |
| Dreiecke Kampf route1 | 37,2 k | 10,5 k |

**Bilder (neu, WebP):**

| Art | Anzahl | Größe | voll gesamt | je Bild | _lo gesamt |
|---|---|---|---|---|---|
| Ortsansicht `place_<karte>` | 15 | 1024×576 q72 (_lo 512×288 q66) | 500 KB | 12–41 KB | 166 KB |
| Kapitel `chapter_<n>` | 10 | 1280×720 q70 (_lo 640×360 q62) | 261 KB | 12–44 KB | 104 KB |
| **gesamt** | 50 Dateien | | **0,76 MB** | | **0,27 MB** → zusammen **1,03 MB** (Budget 3 MB) |

**Artifact:** volle `place_/chapter_`-Fassungen eingebettet, ihre `_lo` nicht (build.mjs `hyLoSkip`); Kampf-/Himmelsbilder weiter nur `_lo` (H1) → `dist/artifact.html` **13 749 246 B = 13,11 MiB** (vorher 12,70 MB; Grenze 15,5 MB).

## 6. Schnittstellen
| Name | Zweck |
|---|---|
| `hyBattleFrame(BT, now)` | aus `render3DBattle` (10): Panorama an/aus, Licht/Schatten/Nebel aus dem Bild |
| `hySprPost(S, L, cam)` | aus `sprTick` (10): Tönung/Randlicht/Dunst je Szene |
| `hyBlob(d, s, bm)` | aus `blobSync` (09): Kontaktschatten-Ellipse nach Bild-Sonne |
| `hyChapterShow(n, {then, force})` → bool | aus `storyTick` (27); `true` = Bild gezeigt (oder im Testlauf übersprungen) |
| `hyPlaceShow/hyPlaceClose`, `hyChapterClose` | Overlays schließen (z. B. Menüs, Tests) |
| `hyBattlePrep()` | Kampfbild der aktuellen Karte vorladen (Kartenwechsel, `startBattle`) |
| `HYB` / `HYP` / `HYC` | Zustand (Panorama, Ortsansicht, Kapitel); `HYB.off = true` schaltet das Panorama ab; `HYB.dbg` Horizont/Maßstab |
| `window.HY_REGION`, `window.VEYRA_HY` | Test-Hooks (Region erzwingen, Standbilder in Tests zeigen) |

44-sky.js blieb unverändert (Schnittstelle reichte).

## 6b. Nachbesserung nach QA Hybrid (Opus mittel)
- **M2 Himmelsweiten-Keil:** Ursache war **ein Stein** (10 `rockM`, Radius 4,5–14) direkt vor der Kampfkamera, der die Ecke unten rechts als große helle (Tag) bzw. violette (Nacht) Fläche füllte – nicht die Weg-Ebene. `hyRockCam`: Stein-Instanzen näher als 2,4 m + 2,2·Größe an der Kamera (xz) werden je Frame (nur bei Änderung) auf Größe 0 gesetzt; ohne Panorama Ausgangsmatrizen zurück. Zusätzlich: Plattform-Normalen (Lathe-Profil außen→innen → Normalen nach unten, Oberseite bekam nur Hemisphären-Bodenlicht) zeigen mit Panorama nach oben (`hyPlatN`, ohne Panorama Originalzustand); Himmelsweiten-Plattform = Gras-Albedo × 1,05; nachts Insel → Wolkenmeer weicher (Überblendung 7,5–19 statt 9–17).
- **M3 Kontrast:** „Lv“ (`.ibox .n small`) und `#bMeNum` 12 px/700, Farbe #2c3646 + heller Textschatten, KP-Kästen deckender (Glas 0,8) → nachts ≥ 4,5:1 in allen 8 Regionen.
- **N1:** Region · Beiname im Orts-/Kapitelbild `clamp(14px,2vh,16px)`.
- **N3 Reihenfolge:** steht beim Betreten ein neues Kapitelbild an (`storyStep().ch ≠ G.story.ch`, Bild vorhanden, nicht `SEQ_AUTO`), entfällt das Ortsbild (`hyChapterDue` in `hyPlaceBusy`) → Kapitel 1 kommt allein. Sicherheitsnetz: `hyChapterShow` wartet, solange ein Ortsbild steht, bis ≥ 3 s nach dessen Start und ≥ 0,6 s nach dessen Ende (`HYC.pend`).
- **N4:** `skyTex` (44) dekodiert nach `onload` (`img.decode`) und lädt die Textur im Leerlauf per `R3.r.initTexture` hoch, bevor der Eintrag `ok` wird – kein Upload mehr im ersten Render-Frame.
- **N5 Escape:** Kapitel- und Ortsbild hängen ihre Tasten als `window`-Capture-Listener ein (vor 15-ui `pressA/pressB` auf `document`) und rufen `stopImmediatePropagation` für Enter/Leertaste/Escape/E/X/M → kein Menü/Dialog-Schritt darunter. 15-ui unverändert.
- **N6 Welt abends/nachts:** Hülle um `skyFrame` → `hyWorldGrade`: Hemisphären-Boden abends 30 %/nachts 28 % Richtung Horizont-/Bodenfarbe aus `envFor`, Himmel 15/14 %, Grünanteil der Hemisphäre um 10/14 %, der Sonne um 5/8 % gedämpft (Gewicht nach Überblendung, nicht bei Lichtset/Graustufe/innen).

## 7. Offen
- Ortsansichten zeigen die heutigen (Platzhalter-)Karten; mit Loop C/D (Aurenstadt, Wurzelheim …) neu rendern (`place --map …`) oder die vorhandenen `ort_*/stadt_*` greifen über gleichnamige Karten-IDs.
- Die Kreaturen-Plätze/Kamera der Kampfszene bleiben die von 10/35; ein echter Kampf in der Weltszene (L2-Offen) würde die Abbildung unverändert übernehmen (gleiche Mathematik, andere Kamera).
- Handy-Messung (Füllrate des Vollbild-Vierecks ist gering: 1 Texturzugriff je Pixel).

## 8. Geänderte Dateien
- neu: `src/45-hybrid.js`, `tools/assets/places.mjs`, `test/unit_hybrid.mjs`, `test/hybrid_shots.mjs`, `docs/hybrid-h2.md`, Bilder `public/art/place_*`, `chapter_*`.
- Hooks: `src/10-mon3d.js` (Aufruf `hyBattleFrame` vor `sprTick` in `render3DBattle`; `hySprPost` in `sprTick`; Sprite-Shader-Uniforms `uHzC/uHzK`), `src/09-three3d.js` (1 Aufruf `hyBlob` in `blobSync`), `src/27-story.js` (Kapitel-Hook in `storyTick`, Default `S.pics` in `migrateStory`), `src/35-transitions.js` (Pose `both`), `src/styles.css` (Block „HYBRID H2“), `build.mjs` (`hyLoSkip`), `tools/render_assets.mjs` (Modi `place`, `chapter`).
- Fremde Datei (wie H1): `test/unit_art.mjs` Z. 17 – Liste erlaubter Nicht-Arten-Keys um `place|chapter` ergänzt (sonst meldet unit_art die neuen Bild-Keys als „unbekannt“).
