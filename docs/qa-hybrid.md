# Veyra – QA Hybrid (H1 Himmel & Kulissen, H2 Kampf-Panorama / Ortsansichten / Kapitelbilder) · Bericht

Agent „QA Hybrid“ (Sonnet hoch) · 10.11.2026 · Prüfgegenstand: Hybrid H1 (`src/44-sky.js`, `tools/render_assets.mjs`, `docs/hybrid-sky.md`) und Hybrid H2 (`src/45-hybrid.js`, Hooks in `10-mon3d.js`, `14-battle.js`, `20-battleui.js`, `35-transitions.js`, `27-story.js`, `docs/hybrid-h2.md`), Stand `node build.mjs` unverändert. **Am Quellcode wurde nichts geändert**; neu sind nur Prüfskripte `test/qa_hybrid_*.mjs`, Screenshots `test/qa_hybrid_*.png` und dieser Bericht.

Umgebung: Headless-Chromium mit Software-WebGL (SwiftShader), 860×484 (Kampf/Welt) bzw. 1920×1080 nur in den Stufenvergleichen von H1/H2. Absolute FPS sind dort nicht aussagekräftig (≈ 2 fps in der Welt); belastbar sind Draw-Calls, Dreiecke, JS-ms/Frame, Texturzahl und Zustandslogik. Region und Tageszeit werden im Test erzwungen: Region über `getMap('route1').region` plus `skyAttach(R3.scene, cur)`, Uhr über `G.time` (mit `mode='wait'` angehalten); im Kampf wirkt dieselbe Überschreibung. Story-/Ortsbild-Tests brauchen `VEYRA_DEMO=1` und `VEYRA_HY=1` (sonst beendet `hyAuto()` jedes Standbild sofort, `navigator.webdriver`).

## 1. Ergebnistabelle (1–10)

| # | Prüfpunkt | Note | Kernbefund |
|---|---|---|---|
| 1 | Funktion / Tests | **9** | Build + `smoke.mjs` „Keine Fehler.“; alle `unit_*` grün (art 20, battle 33, capture 93, dex_firstopen 29, figures 32, **hybrid 29**, introvideo 40, migration 27, qa3 36, **sky 15**, species 33, story 26); `qa_look_kampf` 26/26, `look_ui_cam` 9/9, `qa_a_recht` 0 harte Treffer. Neue QA-Skripte: Kampf 24 Kombinationen ohne Konsolenfehler, Welt 24 Kombinationen, Orte/Kapitel 64 ✓ / 1 ✗ (nur 11-px-Label, siehe N1), Abläufe 12/12, file:// 3/3, low 4/4, Leistung 24 Messreihen. Keine Seitenfehler in einem einzigen Lauf. |
| 2 | Himmel / Welt | **9** | 8 Regionen × Tag/Abend/Nacht = 24/24: Skybox aktiv, Ring und Kuppel sichtbar, Berge aus dem Proz.-Himmel verborgen, Draw-Calls 48–52. Stufen: low = nur `_lo`, **kein PMREM** (frische Sitzung: `SKY3.pm`/`pmRT` leer, `scene.environment` leer), keine Strahlen, kein Dunstteppich; mid/high = PMREM + Strahlen + Teppich. Überblendung der vier Übergangsfenster ohne Sprung (mittlere Bilddifferenz je 5 Spielminuten 3,7–6,6, größter Schritt 10,4 < 2 × Median; ±1 min um die acht Planknoten nur 1,4–2,5). Equirect-Rand: Differenz Spalte 0 gegen Spalte W−1 nur 1,4–3,4 von 255 (unsichtbar), in 12 Blickrichtungen kein ortsfester Spaltensprung. Kleinigkeiten: abends/nachts bleibt der Vordergrund in den Welt-Aufnahmen kräftig tagesgrün gegen violetten Himmel (N6). |
| 3 | Kampf | **8** | **Horizont** in 3 Posen (plus Intro): max. Abweichung 0,5–0,9 px in 24/24 Kombinationen (ein Ausreißer 25 px Schattenmoor/Abend/foe ist ein Messartefakt: Rotlinie nur noch 124 > Schwelle 100, von Sprite verdeckt). **Bodenübergang** weich, Bild-Sonne und Szenen-Licht stimmen (Schatten zeigt von der Bild-Sonne weg, Achse längs Sonne = 1, Deckkraft 0,87 am Tag). Höhle/Innenraum: altes Hintergrund-Set komplett (Kuppel an, Panorama aus, Nebel 18–55, Belichtung 1,1), auch **nach** einem Panorama-Kampf; Flucht, Fang, Sieg, Doppelkampf 2v2 enden sauber, höchstens 2 Kampftexturen (Tag/Abend/Nacht-Wechsel), **Calls 9–11 (Grenze 150)**, Dreiecke 4,5–10,5 k. Mängel: M2 (Himmelsweiten: Weg-Ebene als heller/violetter Keil unten rechts, Boden gegen Wolkenmeer), M3 (Nacht-Kontrast der 11-px-„Lv“-Beschriftung 3,66–4,3:1 in 7 von 8 Regionen). |
| 4 | Ortsansichten | **7** | Logik tadellos: Ortsbild beim Betreten (Brisenhafen, 153 ms), steht **1500 ms** (im Browser gemessen), danach Ausblenden und aus dem DOM; Route nur bei Regionswechsel (Route 1 → Route 3 gleiche Region: kein Bild; Route 1 → Route 2: Bild), Innenräume nie, gleicher Ort innerhalb 5 min nie zweimal, Tippen überspringt, Steuerung kommt zurück, Text bei Tag/Abend/Nacht/Höhle lesbar, Region · Beiname korrekt. Bildqualität: 15 Ortsbilder sind überwiegend gleichförmige Platzhalter-Karten (grüne Wiese mit Bäumen, ähnliche Häuserkacheln), mehrere stark verdunstet (`test/qa_hybrid_ortsbilder.png`) – das räumt die Doku selbst ein („Platzhalter-Karten“, `docs/hybrid-h2.md`). Mängel M1, N1. |
| 5 | Kapitelbilder | **9** | Alle 10 Kapitel (1–8, Finale, Epilog): genau **ein** Bild je Kapitel über den Original-Hook `storyTick`, `G.story.pics[n]=1`, Kapitelnummer · Region, Titel (`kanonText`) und Satz da, Steuerung ruht (`mode 'wait'`), Tippen nach 120 ms wirkungslos, `can` nach 1 s, Tippen schließt, danach die Kapitelkarte **genau 1×**, zweiter Aufruf zeigt nichts; Auto-Ende **4,8 s** (4796–4808 ms); Escape erst ab 1 s. Bilder stammen aus dem Intro-Film des Nutzers (Kontaktbogen `test/qa_hybrid_kapitelbilder.png`). Mängel nur N2, N3. |
| 6 | Spielstand / Migration / Export | **9** | `old_save_4orden.json` und `old_save_pre_a1.json` laden (Fortsetzen), Team/Karte/Story unverändert, `G.story.pics` = `{}`, danach Welt mit aktiver Skybox ohne Fehler; **keine SKY-/Hybrid-Felder im Spielstand** (Laufzeitzustand nur in `SKY3`/`HYB`/`HYP`/`HYC`); `unit_migration` 27 ✓, `unit_story` 26 ✓. Einen Export gibt es im Modul nicht (n. a.). |
| 7 | Performance | **9** | Siehe Abschnitt 3: JS/Frame Welt +0 bis +1,0 ms (route1/high 2,34 → 3,36 ms, brisenhafen/low 2,72 → 3,45 ms, übrige im Rauschen), Kampf **gleich** (1,9–2,0 ms) bei Calls 15 → 11 und Dreiecken 37,2 k → 10,5 k; 4× CPU: kein Rückschritt. GPU-Speicher stabil: nach 24 Region/Zeit-Wechseln 41–46 GL-Texturen (Cache ≤ 7), Heap 39–42 MB flach; Kampf 8 Regionen: `HYB.texs` 2, GL-Texturen konstant 9. Einzel-Frames mit Textur-Upload sind unter SwiftShader nicht von dessen Dauerlast (jeder Frame 350–650 ms) zu trennen → N4. |
| 8 | Größe | **10** | `dist/artifact.html` 13 749 246 B = **13,11 MiB** (< 15,5 MB); H1 (Himmel 48 + Kulissen 16 + Kampfbilder 48 Dateien) **2,58 MiB** (≤ 9 MB); H2 Orte 30 + Kapitel 20 Dateien **0,98 MiB** (≤ 3 MB, mit Kampfbildern 3,57 MiB). |
| 9 | Recht / Kanon | **9** | `qa_a_recht`: harte Treffer 0; keine Fremdmarken in `44-sky.js`, `45-hybrid.js`, `tools/`, Docs und Tests; Kapitelbilder = eigenes Nutzermaterial, Orte/Himmel eigene Offline-Renderings, keine Fremdfigur im Bild. Kleine Unstimmigkeit zwischen Kriterium und Bild in N2. |
| 10 | Code-Qualität | **9** | Globale Namen konsequent mit Präfix (`sky*`/`SKY*`/`HSKY_*`/`HRING_*`, `hy*`/`HY_*`/`HYB`/`HYP`/`HYC`/`HYI`, nur `_hyV` mit Unterstrich), `smoke` grün; keine neuen Bibliotheken (nur three r128); low **ohne** PMREM (L1); `file://`-Rückfall funktioniert: Bild „verunreinigt“ → Skybox `bad`, prozeduraler Himmel (Kuppel an), Kampf mit altem Hintergrund, keine Seitenfehler (G1–G3, Chromium **ohne** `--allow-file-access-from-files`). Hinweise N3/N4. |

Gesamtnote **8,8** (Mittel der zehn Noten 88/10). Nur Prüfpunkt 4 liegt unter 8; Punkt 3 liegt genau bei 8 mit zwei mittleren Mängeln.

## 2. Mängelliste

Priorität: hoch = vor Release, mittel = bald, niedrig = bei Gelegenheit. Zeilen beziehen sich auf den geprüften Stand.

**Hoch: keine.**

### Mittel
| ID | Datei:Zeile | Befund | Reproduktion | Fix-Vorschlag |
|---|---|---|---|---|
| M1 | `public/art/place_*.webp` (Quelle `tools/assets/places.mjs`, `node tools/render_assets.mjs place`) | Ortsbilder (Prüfpunkt 4, Note 7) zeigen die heutigen Platzhalter-Karten: 15 Bilder wirken gleichförmig (Wiese + Baumreihe + gleiche Häuserkacheln), Himmelsdunst entsättigt viele. Unterschied zwischen Ort und Route ist kaum erkennbar. | `test/qa_hybrid_ortsbilder.png`; Ort betreten mit `VEYRA_HY=1` (`node test/qa_hybrid_orte.mjs`). | Nach Loop C/D neu rendern (`--map …`), je Ort eine Filmkamera mit eigenem Wahrzeichen im Vordergrund; Dunst für Orte reduzieren. |
| M2 | `src/45-hybrid.js:132` (`bt.pm.color.copy(rel(T[1]))`, `HY_GROUND.himmelsweiten` Z. 21, `HY_GRASS` Z. 126) | Kampf Himmelsweiten: die Weg-Ebene unten rechts erscheint als großer **heller grauer (Tag) bzw. violettblauer (Nacht) Keil** (ca. 7 % der Bildfläche). Nachts liegt ein grau-türkiser Grasboden mit Spitzen vor einem Bild-Wolkenmeer (harte Kante statt Übergang). | `node test/qa_hybrid_kampf.mjs himmelsweiten` → `test/qa_hybrid_kampf_himmelsweiten_{tag,nacht}_ohneui.png` (unten rechts), `…_nacht_nurbild.png` zeigt das Wolkenmeer darunter. | Für `himmelsweiten` `bt.pm` nicht über `rel(T[1])` (Kanalverhältnis) einfärben, sondern = Gras-Albedo ×1,05; nachts die ersten 8 % unter dem Horizont in Wolken-Weiß/Blau überblenden (`hyFade`). |
| M3 | `src/styles.css:884` (`#battle.dieg:not(.b2d) .ibox .n small`, 11 px, `--l2-ink2`), `:890` (`#bMeNum`) | Nachts unterschreitet die „Lv“-Beschriftung der KP-Kästen 4,5:1: 3,66–4,26:1 in 7 von 8 Regionen (lichtlande 3,98, smaragdwald 3,66, flutkueste 3,77, glutlande 3,96, kristallgebirge 4,13, himmelsweiten 3,72, schattenmoor 3,66; frosttundra 4,68 ok); Tag/Abend ≥ 4,8. | `node test/qa_hybrid_kampf.mjs` → `contrast.fail` je Nacht-Eintrag; Screenshot `…_nacht.png`. | `small` auf 12 px / 700 und `--l2-ink2` dunkler (≈ #3d4757) oder `--l2-glass` nachts deckender; gleiche Maßnahme für `#bMeNum`. |

### Niedrig
| ID | Datei:Zeile | Befund | Reproduktion | Fix-Vorschlag |
|---|---|---|---|---|
| N1 | `src/styles.css:1145` (`.hyPlT small`, `clamp(11px,1.6vh,14px)`) | Region · Beiname im Ortsbild ist bei 484 px Höhe nur 11 px (unter 750 px Höhe immer < 12 px), Großbuchstaben mit 0,14 em Sperrung auf Verlauf. | `A6e` in `test/qa_hybrid_orte.mjs` (gemessen `SMALL11`). | `clamp(12px,1.8vh,14px)`. |
| N2 | `docs/hybrid-h2.md:49` (Kriterium) gegen `public/art/chapter_9.webp`, `chapter_10.webp` | Die Doku schließt f_10/f_17 aus, „Drachen – zu nah an fremden Designs“, doch Kapitel 9 (Wächter um den Kristall) und 10 (Morgen im Tal) zeigen Drachenwesen (Kristall-/Glut-/Eisdrache). Sie entsprechen dem Veyra-Kanon (Crystalon, Eis-/Glutlinien) und sind Nutzermaterial, widersprechen aber dem eigenen Ausschlusskriterium. | `test/qa_hybrid_kapitelbilder.png`, Zeilen 3 und 4. | Kriterium in der Doku präzisieren („kanonische Veyra-Drachen sind erlaubt“) oder im Bild mit den Kanon-Entwürfen vergleichen. |
| N3 | `src/45-hybrid.js:186` (nur `HYC.at` sperrt das Ortsbild), `src/27-story.js:446` (`storyTick` kennt `HYP.shownAt` nicht) | Reihenfolge Ortsbild → Kapitel 1 ist nicht abgesichert: Die 60-s-Sperre gilt nur „Kapitelbild vor Ortsbild“. Beim ersten Hinaustreten (Haus → Morgenau) lief in meinen Läufen je nur eines der beiden Bilder, aber je nach Takt von `storyTick` (600 ms) sind zwei Standbilder in kurzer Folge möglich. Nie gleichzeitig (`both=0`). | `node test/qa_hybrid_orte.mjs` Block C (Zeitleiste „8s:Kapitel“ bzw. „10s:Ort“). | In `hyChapterShow` ein erstes Kapitelbild verschieben, solange `HYP.shown` oder `now−HYP.shownAt < 3 s`; oder Ortsbild für Morgenau nach Intro unterdrücken (`G.story.pics[1]` fehlt). |
| N4 | `src/44-sky.js:54` (`new THREE.Texture(im)` in `onload`), `src/45-hybrid.js:50` | Das erste Hochladen von 2048×1024-Himmel und 2048×512-Kulisse passiert erst im ersten Render nach dem Laden. Gemessen (SwiftShader): Kartenwechsel/Kampfstart-Frames mit Upload 330–500 ms über Grundlinie, JS-seitig ≤ 9 ms (jsMax 5,2–9,2). Handy-Messung steht aus (Doku „Offen“). | `QA_OUT=… node test/qa_hybrid_perf.mjs` (Abschnitt LT/MEM). | `renderer.initTexture(tex)` im Leerlauf direkt nach `onload` (vor dem Einblenden); bei Stufe low nur `_lo`. |
| N5 | `src/45-hybrid.js:228` (document-`keydown`) gegen `src/15-ui.js:148` (`pressB`) | Escape wird vom Kapitelbild **und** vom allgemeinen Tastenhandler verarbeitet. Bei `mode 'wait'` (Welt) folgenlos; liegt das Kapitelbild über einem Dialog (`HYC.pm==='dialog'`), könnte `pressB` ihn mitschließen. Nicht reproduziert. | Code-Lesung. | `pressB` bei `HYC.shown` (und `HYP.shown`) sofort verlassen oder in `HYC.key` `e.stopImmediatePropagation()` setzen. |
| N6 | `src/44-sky.js` (`envFor`), Welt-Licht | Abends/nachts bleibt die Vordergrund-Vegetation (Gras, Bäume) sehr kräftig grün gegenüber dem violett/blauen Himmel (`test/qa_hybrid_welt_uebersicht_abend.png`, `…_nacht.png`). Eigene Beobachtung, keine Regression. | Screenshot-Übersichten. | Hemisphären-Bodenfarbe abends 15–25 % Richtung Horizontfarbe; Saturation der Grasfarbe nachts ×0,8. |

## 3. Messdaten

**Kampf (860×484, high; `qa_hybrid_kampf.mjs`):** Calls Lichtlande/Smaragdwald 11, Flutküste/Kristallgebirge/Himmelsweiten/Schattenmoor 10, Glutlande/Frosttundra 9; Dreiecke 10 486 / 7 406 / 4 538. Horizont-Abweichung in `intro`, `both`, `me`, `foe`: 0,8 / 0,5 / 0,5 / 0,9 px (alle 24 Kombinationen identisch). Kontrast Tag/Abend (außer „Kampf“-Taste weiß auf Pink 5,59:1) ≥ 4,8:1, Nacht 3,66–4,68:1.

**Welt/Kampf Hybrid an gegen aus (selbes Build, `qa_hybrid_perf.mjs`, Mittel JS ms/Frame, 1× CPU):**

| Szene | Stufe | aus | an | Calls aus → an | Dreiecke aus → an |
|---|---|---|---|---|---|
| route1 | low | 2,53 | 2,58 | 46 → 46 | 125,7 k → 120,3 k |
| route1 | high | 2,34 | 3,36 | 48 → 49 | 143,7 k → 138,3 k |
| brisenhafen | low | 2,72 | 3,45 | 71 → 71 | 150,4 k → 146,8 k |
| brisenhafen | high | 3,11 | 3,14 | 72 → 73 | 152,5 k → 149,0 k |
| Kampf | low | 1,92 | 1,96 | 15 → 11 | 37,2 k → 10,5 k |
| Kampf | high | 2,00 | 1,89 | 15 → 11 | 37,2 k → 10,5 k |

Vorher-Werte der Look-QA (`test/qa_look_perf.json`, route1 auto/hoch JS 1,79/2,58 ms, Calls 38/39) liegen im selben Bereich (Hybrid nur +1 Draw-Call). 4× CPU: Welt 9,4–11,6 ms (p95 bis 20,8), Kampf 6,3–7,5 ms; ohne Hybrid 9,4–11,6 bzw. 6,7–7,5 → kein Rückschritt.

**GPU-Speicher (24 Region × Zeit, `memory`):** GL-Texturen 41–46, Cache 2–7, kein Anstieg über die Reihe; Kampf 8 Regionen `HYB.texs` 2, GL-Texturen 9 konstant. Alle Cache-Einträge `pin=0` danach.

**Long Tasks:** Unter SwiftShader ist jeder Welt-Frame ein Long Task (350–650 ms), Kampf-Frames 100–170 ms; deshalb wurde die **Differenz** zur Grundlinie bewertet (N4). Kein Frame > 1,1 s, kein Long Task im Leerlauf.

## 4. Prüfskripte und Belege

| Skript | Inhalt |
|---|---|
| `test/qa_hybrid_kampf.mjs` | 8 Regionen × 3 Zeiten: Horizont (Rotlinien-Textur, Projektion), Boden, Schatten, Licht, Kontrast, Calls; je `_ohneui.png`, `_nurbild.png`. |
| `test/qa_hybrid_sky.mjs` | 24 Weltaufnahmen, Stufen low/mid/high, Überblendfenster und Planknoten, Ring in 4 Richtungen. |
| `test/qa_hybrid_low.mjs` | Frische Sitzung Stufe low (kein PMREM, `_lo`), Naht in 12 Blickrichtungen (HUD-Spalten ausgenommen). |
| `test/qa_hybrid_naht.mjs` | Bilder zum Ausreißer „Test N1“ (Himmelsweiten 210°/240°/270°): der Ausreißer (Spaltensprung 26 × Median bei 240°) ist die Kante der schwebenden Insel, keine Naht. |
| `test/qa_hybrid_orte.mjs` | Ortsansichten A, Testlauf B, Intro-Ablauf C, Kapitelbilder D1–D5 (Zeitmessung im Browser, Render stillgelegt), alte Saves E. |
| `test/qa_hybrid_flow.mjs` | Höhle/Innenraum, Flucht, Fang, Sieg, 2v2, Zeit-/Texturwechsel. |
| `test/qa_hybrid_file.mjs` | `dist/index.html` per `file://` ohne Server. |
| `test/qa_hybrid_perf.mjs` | A/B Hybrid, 1×/4× CPU, Long Tasks, GPU-Speicher. |

Screenshots: `test/qa_hybrid_welt_<region>_<zeit>.png`, `qa_hybrid_welt_uebersicht_{tag,abend,nacht}.png`, `qa_hybrid_kampf_<region>_<zeit>{,_ohneui,_nurbild}.png`, `qa_hybrid_kampf_uebersicht_*.png`, `qa_hybrid_stufe_*.png`, `qa_hybrid_blend_*.png`, `qa_hybrid_naht_*.png`, `qa_hybrid_ort_*.png`, `qa_hybrid_ortsbilder.png`, `qa_hybrid_kapitel_*.png`, `qa_hybrid_kapitelbilder.png`, `qa_hybrid_flow_*.png`.

## 5. Einschränkungen

- Software-WebGL: Frame-Zeit und Upload-Spitzen von echten GPUs/Handys nicht ermittelt (siehe N4, Doku „Offen“).
- Region/Zeit sind im Test erzwungen; die Welt-Aufnahmen aller Regionen nutzen dieselbe Karte (`route1`) mit überschriebener Region, nicht die echten Karten.
- In den Welt-Aufnahmen steht die HUD-Uhr still (Test hält `mode='wait'`), die Beschriftung im Bild ist deshalb kein Beleg für die Szenenzeit.
- Der Yaw-Sweep von `qa_hybrid_sky.mjs` (Ring) wirkt nicht (R3.yaw bleibt 0); die Nahtprüfung in der Welt liegt deshalb in `qa_hybrid_low.mjs` (setzt `P.ang`).
- `qa_hybrid_low.mjs`, Test „N1“ (nicht die Mängel-ID) meldet für Himmelsweiten einen Ausreißer (Insel-Kante, siehe `qa_hybrid_naht.mjs`); kein Produktfehler.
- `qa_hybrid_orte.mjs` A6e bleibt absichtlich rot (N1).
