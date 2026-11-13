# Analyse 3D Ist-Stand – Figuren und Kreaturen (Team „3D Ist-Stand“, Opus hoch, 12.11.2026)

Auftrag: ehrliche Bestandsaufnahme, warum Figuren und Kreaturen nicht „echt“ (wie mit einem professionellen 3D-Programm gebaut) wirken, plus Machbarkeitsprobe Blender im Container.
Maßstab: moderne Pokémon-Spiele, **nur Technik/Qualität**, keine Designs. Kein Code in `src/` geändert.

Skripte (alle unter der Chromium-Sperre, ein Chromium):
- `node test/analyse_3d/ist_messung.mjs` → Zahlen `test/analyse_3d/ist_messung.json` + Bilder (Spiel 1600 × 900, Qualität „eigene“ = hoch, native Auflösung, Pixelverhältnis 1).
- `<venv>/bin/python test/analyse_3d/blender_kopf.py test/analyse_3d` → Testkopf als GLB (Blender 5.3 als Python-Modul).
- `node test/analyse_3d/glb_probe.mjs` → Testkopf in three.js r128 mit dem Projekt-GLTFLoader/DRACOLoader, `glb_probe.json` + Bilder.

Hinweis Umgebung: Playwright 1.65 erwartet Chromium-Build 1254, im Container liegt 1243. Die beiden Analyse-Skripte nehmen dann `/opt/pw-browsers/chromium_headless_shell-1243/…` (`executablePath`). Die übrigen Tests über `qa_lc_lib.start()` starten derzeit **nicht** (gleicher Fehler) – betrifft auch `node test/smoke.mjs`, falls es Playwright direkt startet.

## 1. Zahlen Ist-Stand (gemessen, nicht geschätzt)

Gemessen durch Durchlaufen der fertigen Objekte im Spiel (`AN.inspect`) und Mitschneiden der Bauteile vor dem Verschmelzen (`rigMerge` / `taMergeSkin`).

| Objekt | Netze (davon Umriss) | Dreiecke Modell | Dreiecke Umriss | Bauteile vor dem Verschmelzen | Materialien | Texturen | Skelett | Gesicht | Morph-Ziele |
|---|---|---|---|---|---|---|---|---|---|
| Held (Stufe 0) | 2 (1) | 3 158 | 1 129 | **93** (47 Röhren/Kappen, 36 Kugeln 4×2 … 14×11, 6 Tori, 4 Zylinder) | 1× MeshToon (Vertexfarben + eigener Oberflächen-Shader), 1× MeshBasic Rückseite | nur Toon-Verlauf 5×1 | 14 Knochen, SkinnedMesh | Augen = 7 Kugeln/Tori je Seite (Augapfel 8×5, Iris 8×4, Pupille 5×3, Glanz 4×3, Lid Torus 3×9), Nase 2 Kugeln, Mund Torus 3×7 | 0 |
| Prof. Veyran (NPC) | 2 (1) | 4 379 | 1 496 | **119** | wie Held | nur Verlauf 5×1 | 14 | wie Held | 0 |
| 001 Funki (Glut) | 5 (1) | 3 826 | 2 374 | 44 (20 Lofts, 23 Kugeln 7×5 / 5×3, 1 Extrusion) | 2× MeshToon (Cel 2-stufig + Rim + Muster), 2× Shader, 1× MeshBasic (Augen) | Augen-Textur 128×128 (Canvas), Verlauf 2×1 | 26 Knochen | Augen = flache Kugel mit 128-px-Canvas-Textur, Ausdruck per Texturtausch | 0 |
| 004 Plippi (Flut) | 4 (1) | 3 684 | 2 832 | 39 | wie Funki | 128×128 | 10 | wie Funki | 0 |
| 007 Knospi (Flora) | 4 (1) | 3 488 | 2 828 | 64 | wie Funki | 128×128 | 23 | wie Funki | 0 |
| 001 Funki Porträt (`TA_HQ`) | 5 (1) | 11 040 | 7 542 | 44 | wie oben | 128×128 | 26 | – | 0 |
| **Blender-Testkopf (Probe)** | 7 Primitive (+5 Umriss) | **22 332** | gleiche Netze | 1 Netz, Subdivision | 7 (Toon im Spiel) | Auge 256×256 | – (möglich) | modellierte Augenhöhlen, Lider, Nase, Mundfurche | **2** (Lächeln, Augen zu) |

Szene (Route 1, Held + Begleiter, 1600 × 900): 66–70 Draw-Calls, ≈ 191–195 k Dreiecke inkl. Schattenpass.

**Renderer im Spiel** (gemessen): `antialias:true` (4× MSAA), Pixelverhältnis 1 bei 900 Zeilen, ACES-Tonemapping (Belichtung 1,02), PCFSoft-Schatten 1024², keine physikalischen Lichter, kein sRGB-Ausgang (`outputEncoding` Linear). Software-GL wird als schwach erkannt (`PERF.weak`) → Voreinstellung „niedrig“ = 720 Zeilen, **ohne Schatten**, 30 fps (`src/54-beenden.js:27`, `src/07-settings.js:3`). Am Handy mit schwacher GPU sieht der Nutzer also eher die „niedrig“-Variante.

**Darstellungsart der Starter** (gemessen, `MON_RENDER='sprite'`):

| Kreatur | Welt (Begleiter) | Kampf | Dex/Team-3D |
|---|---|---|---|
| 001 Funki, 004 Plippi, 007 Knospi | **prozedurales 3D-Modell** (Terra) | **2D-Billboard des gemalten Bildes** (0 eigene Netze, Atlas) | prozedural (TA_HQ) |

→ Dieselbe Kreatur sieht in Welt und Kampf **grundverschieden** aus: im Kampf als hochwertiges gemaltes Bild, in der Welt als grobes Prozedural-Modell (Belege `kampf_funki.webp` vs. `welt_funki_nah.webp`). Fundstellen: `src/10-mon3d.js:725` (Welt: Terra → `proc`), `:670` (Kampf: `monObj` → `sprite`), `:914` (Standard `sprite`). In `public/models/` liegt kein Modell (`MODEL_SRC` leer).

## 2. Bildbelege (test/analyse_3d/, 1600 × 900, WebP)

| Datei | Inhalt |
|---|---|
| `held_vorn.webp`, `held_schraeg.webp` | Held ganz, Studio mit Spiel-Licht |
| `held_gesicht.webp` | Held Gesicht nah |
| `held_gesicht_gitter.webp` | gleiches Bild als Drahtgitter – zeigt die Bauweise aus Einzelkörpern |
| `npc_veyran.webp`, `npc_veyran_gesicht.webp` | Nebenfigur Prof. Veyran ganz und nah |
| `kreatur_funki_studio.webp`, `kreatur_plippi_studio.webp`, `kreatur_knospi_studio.webp` | Spielmodelle der Starter, Studio |
| `welt_funki.webp`, `welt_plippi.webp`, `welt_knospi.webp` | Spielansicht Route 1 mit Begleiter (wie der Spieler es sieht) |
| `welt_funki_nah.webp`, `welt_plippi_nah.webp`, `welt_knospi_nah.webp` | Nahaufnahme des Begleiters in der Welt (Spielszene, eigene Kamera) |
| `kampf_funki.webp`, `kampf_plippi.webp`, `kampf_knospi.webp` | Kampf (Gegner von vorn, eigene Kreatur von hinten) – Billboards |
| `blender_workbench.png` | Blender-Kontrollbild (Workbench) des Testkopfs |
| `blender_kopf_toon.webp`, `blender_kopf_seite.webp` | Testkopf in three.js r128, Toon + Umriss, Spiel-Licht |
| `blender_kopf_morph.webp` | Testkopf mit Morph-Zielen „Lächeln“ + „Augen zu“ |
| `blender_kopf_standard.webp` | Testkopf mit Original-glTF-Material (MeshStandard) zum Vergleich |

## 3. Hauptgründe, warum es nicht „echt“ wirkt (mit Fundstellen)

1. **Figuren sind Collagen aus 93–119 Einzelkörpern statt einer durchgehenden Fläche.** Jedes Teil (Augapfel, Iris, Pupille, Lid, Braue, Nase, Wange, Mund, Ohr, Taschen, Knöpfe …) ist eine eigene verformte Kugel, Röhre oder ein Torus; `rigMerge` hängt sie nur aneinander (`toNonIndexed`, keine gemeinsame Topologie) – `src/38-models.js:78`. Folge: sichtbare Stoßkanten, Teile schweben oder stecken ineinander (Hosenbund sticht durchs Hemd, Wangen als lose Flecken, Nase als aufgesetzter Klotz) – `held_schraeg.webp`, `held_gesicht.webp`.
2. **Sehr geringe Unterteilung der Grundformen → Facetten.** Kopf = Kugel 14×11 (`src/38-models.js:116` `chBlob`, Aufruf Kopf), Augen 8×5/8×4/5×3 (`:147–153`), Mund Torus 3×7 (`:159`), Kreaturen-Ellipsoide 10×7 bzw. 7×5 und 5×3 (`src/52-terras.js:12–14`). Iris und Pupille sind sichtbar 8-eckig, Kreaturen-Schwänze/Beine eckig (`kreatur_funki_studio.webp`). Die feine Variante (`TA_HQ`) gibt es nur für Porträtbilder (`src/52-terras.js:10–11`).
3. **Gesichter sind aufgeklebt, nicht modelliert.** Keine Augenhöhle, kein Brauenbogen, kein Nasenrücken, keine Lippen/Mundwinkel in der Kopfform; Augen sitzen als Kugelstapel auf der Oberfläche (`src/38-models.js:145–160`). Kreaturen-Augen sind flache Kugeln mit 128-px-Canvas-Textur (`src/10-mon3d.js:418` `eyeTex`), Ausdruck nur durch Texturtausch (`:443` `setFace`) – kein Lidschluss, keine Wangen-/Mundbewegung, **keine Morph-Ziele, keine Gesichtsknochen** (Skelett Figur 14 Knochen ohne Kopfdetail, `src/38-models.js:356`).
4. **Haare ohne Strähnen-Volumen.** Haar = eine Kappe über dem Schädel mit Wellen-Rand (`src/38-models.js:162–175` `cap`, `HS`), Strähnen nur als Shader-Streifen (`CHAR_GLSL_SURF`, `:333`). Wirkt wie ein Helm mit Rillen (`held_gesicht.webp`); echte Spiele modellieren Haarbüschel als eigene, geschwungene Volumen mit klaren Silhouetten.
5. **Umriss-Hülle zu grob und mit Lücken.** Der Umriss nutzt eine gröbere Ersatzgeometrie (`tubeO`, `chBlob(…,10,7)` statt 14×11; `src/38-models.js:127` und Kopf-Aufruf) und eine feste Normalen-Verschiebung (`rigOl`, `:354`). Folge: Umriss steht vom Körper ab, springt an Ecken, fehlt an Gesichtsteilen (Augen-Teile ohne Umriss) – sichtbar am Kinn/Ohr in `held_gesicht.webp`.
6. **Keine Normal Maps, keine Texturen, keine handgemalten Farbverläufe.** Alles läuft über Vertexfarben + prozedurales Rauschen im Shader (`src/38-models.js:327–348`). Das gibt Stoffstruktur, aber keine gezielten Details (Nähte, Fellbüschel, Lidfalte, Lippenfarbe, gemalte Schatten-/Lichtkante). Moderne Toon-Spiele nutzen pro Figur eine handgemalte Grundfarb-Textur (+ oft Schatten-Farbtextur/„Shade Map“) statt Vertexfarben.
7. **Kreaturen: Lofts mit unstetiger Fellzeichnung.** Farbmasken je Vertex (`mk`, `src/52-terras.js` `taLoft`/`taHead`) erzeugen bei 7×5-Unterteilung fleckige, verlaufende Übergänge statt klarer Zeichnungskanten (Gesicht/Bauch bei Funki und Knospi, `welt_knospi_nah.webp`). Kopf, Hals und Rumpf sind getrennte Lofts mit sichtbaren Nähten.
8. **Gelenkverformung nur grob.** Es gibt Skinning (Figuren 14, Kreaturen 10–26 Knochen), aber mit 2 Einflüssen je Ecke und ohne Korrektur-Formen; Schultern/Hüften knicken (Oberteil-Trapez + Kugel-Deltamuskel, `src/38-models.js` Kleidung). Finger/Gesicht haben keine Knochen.
9. **Stilbruch Welt ↔ Kampf.** Kampf zeigt das gemalte Bild als Billboard, die Welt das Prozedural-Modell (siehe Tabelle oben) – der Unterschied macht die 3D-Modelle zusätzlich „billig“.
10. **Licht/Bild:** Cel-Verlauf Figuren 5-stufig weich (`src/09-three3d.js:35` `toonGrad`), Kreaturen 2-stufig hart (`src/10-mon3d.js:28` `monGrad`) → zwei verschiedene Licht-Looks nebeneinander. Kein sRGB-Ausgang (Farben wirken flacher/dunkler in Halbtönen). Auf schwachen Geräten 720 Zeilen ohne Schatten (`src/54-beenden.js:27`). Kantenglättung ist an (MSAA 4×) – sie ist **nicht** der Hauptgrund.

## 4. Machbarkeitsprobe Blender im Container – Ergebnis: **JA**

| Prüfpunkt | Ergebnis |
|---|---|
| Blender als Python-Modul | `bpy 5.3.0` (cp313, manylinux, 427 MB) über PyPI, Installation mit `uv` in ein venv in **33 s**, Import 1,5 s. Python 3.13 passt. Kein `--break-system-packages` nötig. |
| Blender-Linux-Build | `download.blender.org` und Spiegel vom Proxy gesperrt (403/keine Verbindung) – nicht nötig, `bpy` reicht. |
| Draco im Blender-Exporter | **fehlt** im PyPI-Paket (`libbf_intern_draco_bridge.so` nicht enthalten, Export läuft dann still ohne Draco). Lösung: `@gltf-transform/cli` (npm, erreichbar) → `gltf-transform draco in.glb out.glb` (0,8 s). |
| Rendern in Blender | Workbench headless funktioniert (EGL-Warnungen, Bild 800² in ≈ 1–2 s). |
| Testfigur | eigener stilisierter Kopf, komplett per Skript (`test/analyse_3d/blender_kopf.py`): Quad-Kugel mit Subdivision, Augenhöhlen/Brauenwulst/Wangen/Nase/Mundfurche als weiche Verformungen, Augäpfel mit 256-px-Textur (Iris/Pupille), Glanzpunkte, Oberlider (Solidify + Subdivision), Brauen (Bevel + Subdivision), Ohren, Haarkappe + 25 Haarsträhnen aus Bézier-Kurven mit Verjüngung, Mund; zu einem Netz gefügt; Morph-Ziele „Laecheln“, „Augen_zu“. Bauzeit 0,4 s, Export 0,1–0,3 s. |
| GLB ohne Draco | **1 137 152 B** (1,14 MB), 7 Primitive, **22 332 Dreiecke**, 2 Morph-Ziele |
| GLB mit Draco (gltf-transform) | **821 096 B** (0,82 MB, −28 %). Wenig Gewinn, weil die Morph-Ziele (dicht, unkomprimiert) den Großteil ausmachen. Ohne Morph-Ziele wäre Draco deutlich wirksamer (typisch −80 %). |
| Laden in three.js r128 (Projekt-Loader `dist/vendor`) | funktioniert, **0 Fehler**. Parse-Zeit (SwiftShader-PC, 3 Läufe): ohne Draco 12 / 5,6 / 5,3 ms; mit Draco 54,5 (inkl. erstmaligem WASM-Decoder) / 13,7 / 9,2 ms. Abruf lokal ≈ 10 ms. |
| Toon-Umstellung | Materialien → `MeshToonMaterial` mit 3-/5-stufigem Verlauf, Umriss-Hülle (Rückseite, Normalen-Versatz nach den Morphs), Schatten – 17 Draw-Calls, Morph-Ziele wirken (Bild `blender_kopf_morph.webp`). |
| Stolperstein r128 | Blender exportiert für Primitive ohne Formänderung „leere“ Sparse-Accessoren; der r128-GLTFLoader liefert dafür `null` und bricht ab (`updateMorphTargets … reading 'name'`). Lösung: Export mit `export_try_sparse_sk=False` (im Skript gesetzt). |
| Umriss-Shader | bei `MeshBasicMaterial` gibt es `objectNormal` nicht → `normal` verwenden (im Probe-Skript gelöst). |

Bewertung des Probe-Kopfs: Die **Technik-Kette steht** (Skript → Subdivision-Netz → GLB → Draco → r128 → Toon + Umriss + Morphs). Das Aussehen des Testkopfs ist bewusst eine 1-Stunden-Skizze (Mundfurche wirkt im Toon-Licht schief, Haarkappe/Strähnen noch kantig, Pony z. T. durchdringend); für echte Figuren braucht es pro Figur sorgfältig gesetzte Formen, Textur statt modellierter Mundfurche und abgestimmte Normalen (z. B. Gesichtsnormalen zum Kopf-Mittelpunkt ausrichten, damit Toon-Schatten im Gesicht ruhig bleiben).

### MakeHuman / MPFB
- `git clone https://github.com/makehumancommunity/mpfb2` **erreichbar** (Commit 6ff1eb3, 24.10.2026; MPFB 2.0.18, Blender ≥ 4.2). `api.github.com`/`gh` für fremde Repos gesperrt, `static.makehumancommunity.org` (Asset-Packs: Haut, Kleidung, Haare) **nicht erreichbar**. PyPI: kein `mpfb`; `makehuman` 1.3.2 ist ein altes, unbeschriebenes Paket (nicht verwenden).
- Lizenz: Code GPLv3 (`LICENSE.CODE.md`), **Assets CC0 1.0** (Grundnetz `base.obj` 19 158 Ecken / 18 486 Flächen, 1 477 Targets, Rigs, Posen, Ausdrücke; `LICENSE.ASSETS.md`), Ausgabe laut `LICENSE.md` Abschnitt D frei (CC0-Assets + eigene Eingabe, keine GPL-Pflicht für exportierte Modelle).
- Nichts ins Projekt übernommen. Eignung: realistische Proportionen und sauberes Grundnetz mit Gesichts-Topologie und Rig; für einen stilisierten Pokémon-ähnlichen Look müsste das Netz stark verformt und vereinfacht werden (≈ 37 k Dreiecke → Ziel 8–15 k). Möglich als Basis für Erwachsene/NPC-Körper, weniger für Kinder-Helden.

## 5. Einschätzung: was prozedural noch geht, was echte Modelle braucht

**Prozedural noch sinnvoll (Verbesserung im bestehenden Code möglich):**
- Unterteilung anheben (Kopf, Augen, Lofts) und Umriss aus derselben Geometrie – beseitigt Facetten und Umriss-Lücken, kostet ≈ 2× Dreiecke.
- Einheitlicher Cel-Verlauf für Figuren und Kreaturen, sRGB-Ausgang.
- Stilbruch Welt/Kampf beenden (überall dasselbe 3D-Modell oder überall Bild).
- Bauten, Gelände, Requisiten, einfache Kreaturen (Quallen, Bänder, Kristalle) bleiben prozedural gut.

**Braucht echte (per Skript gebaute) Modelle:**
- Gesichter mit modellierter Form, Lidern, Mund und **Morph-Zielen** für Ausdrücke – prozedural als Kugelstapel nicht erreichbar.
- Figuren-Körper mit durchgehender Topologie, sauberen Gelenk-Loops (Schulter, Ellbogen, Hüfte, Knie) und 4 Einflüssen je Ecke.
- Haare als geformte Büschel mit klarer Silhouette.
- Kreaturen-Köpfe und Fellzeichnung mit Textur (UV) statt Vertexmasken.

**Empfehlung:** Blender (`bpy` 5.3 im venv) + `gltf-transform` als Bauweg festlegen: je Figur/Kreatur ein Python-Bauskript (eigene Designs), Ziel 8–15 k Dreiecke (Figur) / 3–8 k (Kreatur), 1 Textur 512–1024 px, Rig + Morph-Ziele, Export ohne Sparse-Morphs, Draco per gltf-transform (Morphs sparsam halten), Einbau über den vorhandenen Pfad in `src/38-models.js` (`MON_RENDER='model'`, `MODEL_FIX`). Zuerst Pilot: Held-Kopf + Funki, Vergleich gegen `held_gesicht.webp` / `kampf_funki.webp`.
