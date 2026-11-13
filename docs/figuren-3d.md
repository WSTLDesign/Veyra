# Figuren 3D – Runde 2: Figurenbaukasten, Noa Runde 2, NPCs (Agent „Figuren & NPCs“, Opus 5.5 · hoch, 12./13.11.2026)

Grundlage: docs/ziele.md, docs/recherche-3d-qualitaet.md, docs/analyse-3d-ist.md, docs/pilot-3d.md. Maßstab Pokémon Legends (Arceus/Z-A) **nur für Technik und Qualität** (Proportionen stilisiert-realistisch, modellierte Gesichter mit eigenen Augen-Netzen, Strähnen-Haare, Kleidung mit Falten, gebackene Texturen, weiche Toon-Schattierung). Alle Figuren, Farben, Kleidungsstücke sind eigene Entwürfe passend zu `src/34-figures.js`.
**Status: Vorschau.** Ohne Schalter ändert sich nichts (`SET.modelle3d` aus = Standard).

## 1. Werkzeugkette
```
bash tools/modelle/figuren/bauen.sh [alle|noa,veyran,…]     # nimmt je Figur die Blender-Sperre .blender.lock
```
- `tools/modelle/figuren/fkit.py` – Baukasten Teil 1: Körpertypen `TYP` (kind, teen, frau, mann, kraeftig, alt_m, alt_w; Maße als Anteile der Größe), Körper als Skin-Graph mit Händen (4 Finger à 3 Glieder + Daumen) → Subdivision → Rumpf-Ellipsen, Gesäß, Schulterblätter, Trapez, Wade, Knie. Kopf mit Profilfunktionen (Schädel/Wangenknochen/Kieferwinkel/Kinn/flache Gesichtsebene, Nase, Lippen, Augenmulden). Gesichtssystem: Augapfel-Netze (Iris/Pupille/Glanz in eigener Textur), Ober-/Unterlid-Schalen in Mandelform, Lidstrich + Wimpernflügel, Brauen, Mundlinie + Mundhöhlen-Aufkleber. Haarsysteme: `wuschel`, `stachel`, `dutt`, `dutt_lose`, `wolke`, `kurz`, `pferd`, `locken_kurz`, `muetze` (Kappe + linsenförmige Büschel), Bärte (Schale + Schnurrbart). Kleidung: eng anliegend als Formung mit modellierten Falten (T-Shirt, Hemd, Bluse, Pulli, Hose, Cargohose, Socken), lose Teile als eigene Netze (Jacke/Strickjacke/Kittel als Schale mit Dicke, Mantelschoß, Rock, Schürze mit Trägern, Schirmmütze, Beanie, Rucksack, Umhängetasche, Kapuze, Hemdkragen, Ärmelaufschlag), Schuhe (Turnschuh, Halbschuh, Stiefel), Zubehör (Schutzbrille, runde Brille, Handgelenk-Gerät, Cargotaschen, Blüte).
- `fkit2.py` – Teil 2: Ellipsoid-Gesichtsnormalen, Rig **32 Knochen** (Becken/Wirbel/Brust, Hals, Kopf, Augen 2, Haar 2, je Seite Schulter/Oberarm/Unterarm/Hand/Finger 2 Glieder/Daumen, Oberschenkel/Schienbein/Fuß/Zehen), Kapsel-Gewichte (Rock/Mantel/Schürze anteilig an den Oberschenkeln), **9 Shape Keys** (Blinzeln L/R, Augen_froh, Laecheln, Mund_A, Mund_O, Staunen, Aerger, Traurig), UV-Atlas (Gesicht ×2,3 Texeldichte), Cycles-Backen (Region, Position, AO) → Textur 1024² in numpy gemalt (Haut-Verläufe, Wangen, Lippen, Nasen-Schatten, Sommersprossen, Haarsträhnen, Stoffgewebe, Nähte, Knopfleisten, Taschen, Reißverschluss, Embleme, Karo, Strick, Schuhstreifen/Schnürsenkel) + Normalkarte aus Höhenkarte, Augen-/Mundtextur 512×256, **LOD1 = Körper 50 %** (Decimate), Clips, Export.
- `figuren.py` – Steckbriefe `SPECS` (Typ, Farben, Frisur, Bart, Kleidung, Zubehör, Muster) + Zusammenbau, `--form` = Kontrollbilder (Workbench).
- Nachbearbeitung: gltf-transform `webp --quality 80` + `draco` → `public/models/figuren/fig_<id>.glb`. Bauzeit je Figur ≈ 35–60 s (AO 20–40 s).

## 2. Modelle (public/models/figuren/)
| Modell | Figur / Zuordnung | Typ, Spielhöhe | Inhalt |
|---|---|---|---|
| fig_noa | Held (G.outfit.body 'held') | kind, 1,32 | grünes T-Shirt mit Blatt, Cargohose, Turnschuhe, Schutzbrille, Gerät |
| fig_rayan | FIGURES.rayan | kind, 1,32 | schwarze Stacheln mit roten Spitzen, Zip-Jacke (Flamme auf dem Rücken), Stiefel |
| fig_veyran | FIGURES.veyran (prof/professor) | alt_m, 1,55 | Wolkenhaar, Vollbart, runde Brille, Hemd, grüner Forschermantel mit Goldsaum |
| fig_mama | FIGURES.mama | frau, 1,58 | Dutt mit Strähnen, Bluse, Karo-Schürze, Rock |
| fig_mirael | FIGURES.mirael (jede Kreaturenstation, t:'nurse') | frau, 1,58 | Dutt + Blüte, Sommersprossen, Heilerkittel mit Kreuz-Blatt-Zeichen, Rock |
| fig_haendler | Laden (02-world t:'shop', Farbe #6aa0e0) | kraeftig, 1,70 | Schnurrbart, gekrempeltes Hemd, Schürze, Schirmmütze |
| fig_buerger_a…d | alle Bewohner/Wanderer ohne eigene Figur (stabil aus der Farbe gehasht) | frau 1,58 · alt_w 1,47 · mann 1,68 · teen 1,52 | Jacke+Jeans+Pferdeschwanz · Strickjacke+Rock+Brille · Hemd+Bart+Tasche · Pulli+Beanie+Rucksack |

Je Modell: 13,5 k Dreiecke (Körper 11,8 k · Gesicht 1,2 k · Augen 0,5 k), LOD1 Körper ≈ 5,9 k, 32 Knochen, 9 Shape Keys, 7 Clips, 2 Texturen 1024² + 1 × 512×256, Datei ≈ 0,8–0,9 MB (Draco + WebP 80). Draw-Calls je Figur: Körper + Gesicht (2 Materialien) + Augen + 2 Umriss-Hüllen = 6.

## 3. Animation
- Clips je Figur (30 fps): `idle` (4 s: Atmen, Kontrapost, Umschauen, Arme natürlich angewinkelt, Finger locker), `walk` (1 s), `jog` (0,7 s), `run` (0,57 s), `winken` (1,8 s), `jubeln` (1,4 s, Sprung), `werfen` (1,2 s, Ausholen/Schritt/Wurf). Füße per IK gepflanzt.
- Tempo (Felder/s, Noa 1,32 Felder groß, Doppelschritt 1,05 / 2,05 / 3,0 m im Modell): Gehen bis ≈ 1 Feld/s, **Spiel-Gehen 2,8 → Clip „jog“** (lockeres Laufen, Kadenz ≈ 2,9 Schritte/s), **Rennen 5 → Clip „run“** (Kadenz ≈ 3,5 Schritte/s, Flugphase). Gemeinsame Gangphase für walk/jog/run (Clip-Zeit gesetzt) → kein Gleiten beim Überblenden.
- Laufzeit (57-modelle): Blinzeln (2–6 s, manchmal doppelt), Blicksprünge der Augen (1–3,5 s), NPC dreht Kopf/Hals zum Spieler (< 3,2 Felder), im Dialog Mundbewegung A/O solange der Text tippt, Ausdruck aus dem Dialogtext (`figExprFor`), beim Ansprechen einmal `winken`; `figAnim(o,'wurf'|'jubel'|'wink')` → Clips; LOD ab 9 Feldern.

## 4. Anbindung (`src/57-modelle.js`, nur mit Schalter)
`person3d`-Haken → `figModelFor(col,hat,oe)`: Spielerfigur 'held' → fig_noa; Figuren-NPC über `oe.look` → FIGURES-Id → Tabelle `FIG_BY_ID`; ohne `oe`: Laden-Farbe → fig_haendler, sonst Bewohner-Variante. Andere benannte Figuren und 'heldin' bleiben prozedural. Modell noch nicht geladen → Prozedural, Laden startet, danach `figSwapScene()` tauscht NPCs der aktuellen Szene aus (Held über `R3.ofk=null`). Ladefehler → Warnung, Prozedural bleibt. `window.PILOT_SRC[id]` (Werkstatt) wird beim Laden bevorzugt.
**tools/werkstatt-build.mjs** (angepasst): sammelt jetzt **alle Ordner unter public/models/** (pilot, figuren, terras …) als `spiel/models/<bereich>/<id>.js` (Schlüssel = Dateiname ohne .glb).

## 5. Vorschauen (test/figuren2/, 1600×900 WebP) – `node test/figuren2/vorschau.mjs [noa|npc|welt|alle]` (Chromium-Sperre!)
| Datei | Inhalt |
|---|---|
| noa_pilot_runde2_vorn / _schraeg / _gesicht | Pilot vs. Runde 2 |
| noa_ausdruecke | 8 Ausdrücke (Shape Keys) |
| noa_gang_reihe | Gehen / Laufen 2,8 / Rennen 5 – je 8 Bilder |
| noa_gesten | winken · jubeln · werfen |
| npc_aufstellung | Noa + 9 NPCs nebeneinander |
| npc_nah_1, npc_nah_2 | je NPC Ganzkörper + Gesicht |
| npc_alt_neu | Prof. Veyran, Mama, Ladenbesitzer bisher vs. neu |
| welt_morgenau, welt_morgenau_nah | echtes Spielbild Morgenau, Schalter an |

Test: `node test/figuren2/test_modelle.mjs` (Schalter an; Laden aller Figuren, Clips, Keys, Budget, LOD, Zuordnung, Gang-Tempo, Morgenau, keine Konsolenfehler).

## 6. Offen / Wünsche
- Shader-Wünsche an Welt-Grafik (56-toonpro): siehe Bericht – Haar-Glanzband anisotrop statt Punktglanz, Augen-Glanz etwas kleiner, Umriss im Gesicht (Maske r) dünner, Rim auf Haut schwächer.
- Dateigröße 0,8–0,9 MB je Figur (Ziel 0,4): Morph-Ziele + LOD + 1024er-Normalkarte; nächster Schritt Normalkarte 512, LOD ohne Farbmasken.
- Weitere benannte Figuren (Mira, Tarek, Arenaleiter …) und 'heldin' per Steckbrief ergänzen (je ≈ 1 h).

## 7. Runde 2 (13.11., 03:00–08:00) – Gesicht, Haar, Haltung, Shader
- **Augen:** Augapfel 12 % größer, Iris 50–55 % (Farbverlauf dunkel oben → hell unten, Pupille, kleinere Glanzpunkte), obere Lidkante zweireihig dunkel + kräftiger Lidstrich, Wimpernflügel jetzt am **äußeren** Augenwinkel (Rahmen-Achse war gespiegelt → Lidschwung saß innen, wirkte „verrutscht“), Lidschatten gemalt; Blinzeln mit weniger Lid-Überlappung.
- **Kopf:** breiter (hw/hh 0,8 Kind), vollere Wangen, rundere Kinn-/Kieferpartie, Nase nur noch kleine Form + Schattenandeutung; dünnerer Umriss im Gesicht (Maske r 0,42).
- **Haar:** breitere Büschel, Haarkappe vorn ohne Zacken, Textur ohne Rauschflecken (weicher Verlauf, schwache AO), **anisotropes Glanzband im Shader**.
- **Haltung:** Ruhepose mit Gewicht auf einem Bein (Becken gekippt, ein Knie locker), Arme leicht vom Körper und angewinkelt, Finger entspannt.
- **Kragen:** Stoffdicke läuft am Halsausschnitt weich aus (keine Treppe), Bündchen höher.
- **Datei:** Normalkarte 512² (gltf-transform resize), WebP 80 → 0,70–0,76 MB je Figur (vorher 0,76–0,83).
- **LOD:** LOD1 ohne Umriss-Hülle und ohne Schattenwurf; Gesicht/Augen ohne Umriss und Schatten (−1–2 Calls je Figur).
- **Shader `src/56-toonpro.js` (additiv, API unverändert):** neue Option `toonProMat(map,{fig:1})` → Uniform `uFig` (Standard 0 = unverändert für Terras): Haar-Maske (Glanz 0,25–0,45) bekommt ein weiches anisotropes Glanzband statt Punktglanz, Randlicht auf Haut (Maske g) −65 %.
- Bilder: `test/figuren2/r2_noa_gesicht_vorher_nachher.webp`, `r2_aufstellung.webp`, `r2_morgenau.webp`, `r2_morgenau_nah.webp`.

## 8. Runde 3 (13.11.) – Heldin, Gehtempo 1,9, Gesichtsproportionen
- **Heldin** `fig_heldin` (Spielerfigur 'heldin', wie FIGURES.heldin): helle Schirmkappe mit grünem Schirm + Blatt, Pferdeschwanz als Volumen mit gelbem Haargummi, grünes T-Shirt, braune Shorts, lange dunkle Socken, Stiefel, Umhängetasche mit Sonne, Handgelenk-Gerät; alle Clips; `figModelFor` 'heldin' → fig_heldin, Vorladen je nach `G.outfit.body`.
- **Gehen 1,9 Felder/s** (17-move WALK_SPEED): Kind-Clip `walk` = zügiges Gehen, Doppelschritt 1,6 m in 0,77 s → 1,9 Felder/s bei Abspieltempo 1 (gemeinsame Gangphase, kein Rutschen); 5 → `run`.
- Gesicht: Augen ≈ 1,5× Fläche, tiefer und weiter auseinander, kürzere Stirn (Pony tiefer), kleineres Kinn, schmaleres Untergesicht; obere Lidlinie als eine dicke Form, außen auslaufend, keine Einzelwimpern; Iris mit hellem unterem Bogen, ein großer + ein kleiner Glanzpunkt; Brauen schmaler und näher. Haar als dickere, runde Volumen-Büschel, Textur glatt hell→dunkel. Hände: Finger enger, kürzer, leicht gekrümmt, Daumen anliegend.
- Bilder: `test/figuren2/r3_heldin.webp`, `r3_noa_gesicht_r2_r3.webp`, `r3_aufstellung.webp`, `welt_morgenau.webp` (Heldin im Spiel).
