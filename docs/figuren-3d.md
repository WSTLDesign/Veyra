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

## 9. Runde 4 (15.11.) – Heldin: echte Schirmmütze, weiches Haar, Budget ≤ 9 k
Anlass (Kritik R3): Haar wirkte blockig (kantige Klötze), die Kappe sah aus wie ein Stirnband. Maßstab weiterhin nur Technik/Qualität (Pokémon Legends), alle Formen/Logos eigen.
- **Schirmmütze** (`cap4` in fkit.py, Steckbrief `muetze='kappe4'`): runde **Krone** über dem Kopf (Kante `cap_edge(ph)`: vorn tief auf der Stirn, seitlich über den Ohren, hinten im Nacken, Abstand `cap_off` – voller oben/vorn wie strukturierte Vorderbahnen), **eingefasster Rand** (Wulst), **Knopf** oben, **Öffnung hinten** (Bogen) mit **Riegel**, Pferdeschwanz läuft hindurch. **Schirm** D-förmig, 8,6 cm, vorgebogen (Seiten tiefer), 9° geneigt, Dicke per Solidify + gefaste Kante, Unterseite eigene Region `muetze3` (dunkleres Grün). Textur: 5 Bahnen mit Nähten + Steppstichen, Steppnaht über dem Rand, Luftlöcher je Bahn, drei Steppbögen auf dem Schirm, **eigenes Logo „V“ mit Kristall-Funke** (Bezug zum App-Icon) vorn, leicht erhaben (Normalkarte).
- **Haar** (`hair_r4`, Frisur `pferd_kappe4`): Haarschale unter der Krone (seitlich/Nacken sichtbar), **Pony aus 5 eigenen Volumen** (Ansatz dünn unter dem Kronenrand, dann voller Bauch, gerundete Spitze), **Seitensträhnen** vor den Ohren (breite Seite nach vorn, rahmen das Gesicht) und hinter den Ohren, 2 Nackenspitzen, **Pferdeschwanz** (Hauptvolumen ring 10 + 2 Nebenstränge mit getrennten Spitzen, gelbes Haargummi). Strähnen-Querschnitt elliptisch mit 6–10 Ecken (`strand()`), keine Linsenkanten mehr.
- **Glatte Normalen**: Haarschale 50 % Richtung großes Kopf-Ellipsoid, Strähnen 28 % (behalten ihre Rundung), Pferdeschwanz 40 % Richtung seiner Achse, Krone 35 % → ruhige zweistufige Toon-Schattierung, sauberes Glanzband statt Facetten.
- **Haarfarbe**: Verlauf nach Abstand zum Kronenrand – Ansatz dunkler/warm, Spitzen heller (`haar_spitze`), schwache Längsstreifen, AO stärker im Haar (Trennung der Volumen). Licht/Schatten macht weiterhin der Toon-Shader (56, unverändert).
- **Budget** (`gesamt=8900`, `reduce_r4` in figuren.py): verdeckte Flächen weg (Kopfhaut unter Krone/Haar 928, Füße im Stiefel, Haar unter der Krone ≈ 110), hintere Augapfel-Hälfte weg (Augen 504 → 252), dann **gewichtetes Reduzieren** (Decimate mit Gruppe `dez`: Haar, Kappe, Gesicht = 0 → bleiben voll aufgelöst; Körper/Kleidung/Hände tragen die Reduktion, symmetrisch). Ergebnis: **Hauptnetz 8 900 Dreiecke** (Körper 7 604 · Gesicht 1 044 · Augen 252) statt 13 348; LOD1 im GLB 3 802 (zur Laufzeit ersetzt 62-lod es durch 2,8 k). Datei 0,66 MB (R3 0,71).
- **Unverändert kompatibel**: 32 Knochen (gleiche Namen/Lage), Gewichte nach demselben Verfahren (Kappe/Schirm/Riegel → `head`, Haar mit `hair_vorn`/`hair_hinten`-Anteil), alle 7 Clips (Gehen 1,9 / Rennen 5 / idle …), 9 Shape Keys.
- Vergleichsbilder (Vorher R3 aus `test/fixtures/figuren/fig_heldin_r3.glb` neben Nachher R4, gleicher Shader/Licht): `test/figuren/r4_vergleich_studio.webp` (vorne/seitlich/nah/Spielkamera-Winkel), `r4_vergleich_nah.webp` (Kopf vorn/schräg/seitlich/hinten), `r4_vergleich_welt.webp` (echtes Spielbild Morgenau, Ausschnitt), `r4_welt_ganz.webp`. Skript: `node test/figuren/r4_vergleich.mjs [studio|nah|welt|alle]` (Chromium-Sperre!).
- Test `test/figuren2/test_modelle.mjs`: zählt das Schattennetz aus 62-lod (`userData.shadowOnly`) nicht mehr als Hauptnetz mit (vorher 10 Fehlschläge „16 k“ bei allen Figuren durch die Laufzeit-LOD-Netze, nicht durch die Modelle).

## 10. Runde 5 (16.11.) – Haar-Volumen, Haarmaske, Schutz-Markierung für 62-lod, weitere Figuren auf R4-Technik, Block-Hände
Agent „Figuren R5“ (Opus 5.5 · hoch). Maßstab weiterhin nur Technik/Qualität (Pokémon Legends), alle Formen/Zeichen eigen. Rig (32 Knochen, Namen und Lage bitgenau gleich), 7 Clips und 9 Shape Keys aller vier Figuren unverändert (geprüft gegen die R4-Stände; Gehen 1,9 / Rennen 5 bleiben).

### Was und warum
1. **Heldin-Haar (Punkt 1).** `strand()` hat neue Parameter: `rnd` (Dicke am Ansatz – R4 0,35 = flach wie ein Paddel), `sexp` (Superellipsen-Querschnitt über `loft(…, sexp)` in vlib.py, voller Bauch ohne Kanten), `bend` (`bend_out`: Spitze nach außen + leicht nach oben), `tp` (Zuspitz-Profil: früher spitz → Büschel statt Lappen). Hintere Seitensträhnen: Tiefe 0,022 → 0,027, Ansatz 0,75, Superellipse 2,6, zusätzlicher Stützpunkt, Spitze 11 mm nach außen; Nackenspitzen: 4 Stützpunkte, Querschnitt 0,029 × 0,025 (R4 0,030 × 0,019), Ring 8 statt 6, Spitze nach außen; vordere Seitensträhnen: etwas tiefer, rahmen weiter das Gesicht, Spitze zuletzt leicht nach außen.
2. **Pferdeschwanz-Schattenseite (Punkt 2).** Zwei Ursachen:
   - **Hauptursache (gefunden in R5): der Pferdeschwanz war nach innen gewickelt** (geschlossene Röhre mit Volumen −1 220 cm³; Wicklung und Normalen beide innen, daher fiel es keiner Normalenprüfung auf). Man sah von hinten die Innenseite der *fernen* Wand – sie ist vom Licht abgewandt → wirkte wie eine fast schwarze Schattenseite – und die BackSide-Umrisshülle lag vor dem Zopf (Hülle an/aus: 16,3 % der Figur verändert). Neu `fix_inside_out()` (fkit.py): jede geschlossene Strähne/Röhre der R5-Figuren mit negativem Volumen wird umgedreht (Log „nach innen gewickelt → umgedreht“). Nur der Pferdeschwanz war betroffen.
   - **Haarmaske im Shader** (`src/56-toonpro.js`, additiv): nur für Haar-Ecken (Figuren `uFig` + Glanz-Maske 0,25–0,45 = Haar/Bart; Haut, Stoff, Terras unverändert) mehr Licht-Umgriff (`uHairWrap` 0,4), weicherer Toon-Übergang (`uHairSoft` 1,8 × Weichheit) und angehobener Schattenton Richtung Eigenfarbe (`uHairSh` 0,6, Sättigung bleibt). Werte per `toonProMat(map,{hairSh,hairSoft,hairWrap})` überschreibbar; ohne `fig` 0 = alter Shader.
3. **62-lod ↔ Figuren (Punkt 3).** Schutz-Markierung je Ecke als GLB-Attribut **`_LODW`** (Blender: `BODY.data.attributes['_LODW']`, Export `export_attributes`, übersteht Draco; three liest es als `_lodw`): Haar 1, Schirm-Unterseite 1, Schirm/Knopf/Riegel/Umschlag 0,9, Krone/Mütze 0,8, Haargummi/Bart 0,6, sonst 0. `lodSimplify(P,I,ziel,{w,wK})` multipliziert die Kosten, eine Ecke zu verschieben, mit `1 + wK·w` (wK = 12). Für Körper mit `_lodw` ist das Ziel **3 200 statt 2 800** Dreiecke (Abwägung aus der Messung unten: Haar-/Kappen-Umriss −60 … −73 %, Körper-Umriss wie bisher). Modelle ohne `_LODW` (alle übrigen Figuren, Terras) laufen exakt wie vorher; `?lodschutz=0` schaltet den Schutz zum Vergleich ab, `VSTAB.info().lod.schutz` zählt die geschützten Netze. Änderungen in 62-lod: 1 Zeile Gewicht im Quadrik-Kollaps, Weitergabe an Worker/Rückfall, Ziel je Netz.
4. **Noa, Ladenbesitzer, Jugendlicher (Punkt 4)** auf R4-Technik (`r5=True` im Steckbrief: Haarschale `shell5` + runde Volumen-Strähnen `st5/strand`, Stellvertreter-Normalen wie die Heldin, Haarfarbe Ansatz → Spitze, gewichtetes Reduzieren auf ≤ 9 k, hintere Augapfel-Hälfte weg, Budget `gesamt=8900`):
   - **Noa** (`wuschel5`): Wirbel-Krone aus 7 flach anliegenden Büscheln, schräg gekämmter Pony (6), Seiten (3 je Seite), Nacken in zwei Lagen mit wechselnden Längen, fächerförmig, spitz (kein geschlossener „Helm“); Schutzbrillen-Band liegt jetzt auf dem Haar (Abstand 0,031 statt 0,04).
   - **Ladenbesitzer**: Schirmmütze **`kappe4`** (Krone, Wulst, Knopf, Riegel, gebogener Schirm, 5 Bahnen mit Nähten/Luftlöchern; Öffnung hinten 0,30) in Grün mit **eigenem Zeichen „Laden-Häuschen“** (Dach + Tür + Fenster auf hellem Rund, leicht erhaben, Extra `kappe_laden`); kurzes Haar unter der Kappe (`kurz_kappe5`: Schale, Koteletten, anliegende Strähnen über/hinter dem Ohr, Nacken), **runder Schnurrbart** als Volumen-Strähne.
   - **Jugendlicher** (`fig_buerger_d`, Typ teen – die einzige jugendliche Figur in figuren.py; Rayan ist ein Kind): Mütze **`beanie5`** (runde Krone mit leichtem Hängen nach hinten, dicker abgerundeter Umschlag, Rippenstrick fein/kräftig, Naht hinten) mit **eigenem Etikett „Berg mit Sonne“** am Umschlag (Extra `muetze_etikett`), Haar unter der Mütze (`beanie5_haar`: Pony-Spitzen, Seiten, Nacken).
   - Nebenbei gefunden und behoben (src/57-modelle.js, 1 Zeile): `figModelFor` hat **jede** Bürgerfarbe auf `fig_buerger_a` abgebildet (Produkt im Hash > 2⁵³ → untere Bits weg). Mit `Math.imul` verteilen sich die Bewohner jetzt gleichmäßig auf a/b/c/d (5 000 Farben: 1 248/1 270/1 208/1 274) – erst dadurch ist der Jugendliche im Spiel überhaupt zu sehen.
5. **Hände (Punkt 5).** Für R5-Figuren statt 4 Finger à 3 Glieder ein **Fingerblock** im Skin-Graph (4 Knoten, flache Ellipsen-Querschnitte, leicht gekrümmt, abgerundetes Ende) + Daumen; Finger nur angedeutet (3 weiche Trennlinien in Farbe + Normalkarte, Knöchel leicht rosig). Die Knochen bleiben, wo sie waren (Fingerspitzen werden weiter nach der alten Formel berechnet, nur nicht mehr gebaut). Hände sind beim Reduzieren jetzt geschützt (vorher trugen sie die Reduktion → kantig) und brauchen trotzdem weniger Dreiecke als die alten Finger.

### Messwerte
Dreiecke aus den geladenen GLBs (three, nach Draco; Blender-Werte in `tools/modelle/build/figuren/<id>.json`), „Hülle“ = leichtes Netz aus 62-lod (= LOD1, Umrisshülle des Hauptnetzes und Schattennetz):

| Figur | Hauptnetz R4 → R5 | GLB-LOD1 R4 → R5 | Hülle/LOD1/Schatten zur Laufzeit R4 → R5 | Datei R4 → R5 |
|---|---|---|---|---|
| Heldin | 8 900 → **8 897** | 3 802 → **3 799** | 2 799 → **3 199** (mit Schutz) | 658 → 651 KB |
| Noa | 13 319 → **8 898** | 5 871 → **3 800** | 2 800 → **3 200** (mit Schutz) | 678 → 644 KB |
| Ladenbesitzer | 13 268 → **8 900** | 5 820 → **3 802** | 2 800 → **3 200** (mit Schutz) | 675 → 637 KB |
| Jugendlicher | 13 294 → **8 897** | 5 845 → **3 799** | 2 800 → **3 199** (mit Schutz) | 681 → 641 KB |

Je Bild nah (Hauptnetz + Hülle + Schatten): Heldin 14,5 k → 15,3 k (+0,8 k), Noa/Ladenbesitzer/Jugendlicher 18,9 k → 15,3 k (−3,6 k je Figur). Fern (LOD1 + Hülle): +0,8 k je R5-Figur.

**Silhouette der vereinfachten Hülle** (Test `test_modelle.mjs`: orthografische Masken der Haar-/Kappen-Dreiecke vorn/seitlich/oben, 256², Ø Anteil XOR zum Original; „R4-Verfahren“ = 2,8 k ohne Schutz auf demselben Netz):

| Figur | R4-Verfahren | R5 (Schutz, 3,2 k) | vorn / seitlich / oben (R5) |
|---|---|---|---|
| Heldin | 2,80 % | **0,88 %** | 1,03 / 1,16 / 0,45 |
| Noa | 4,32 % | **1,34 %** | 1,13 / 1,65 / 1,26 |
| Ladenbesitzer | 4,50 % | **1,31 %** | 1,89 / 1,51 / 0,53 (Schirm von oben: 2,89 → 0,53) |
| Jugendlicher | 3,33 % | **1,09 %** | 0,88 / 1,56 / 0,83 |

Ganzkörper-Umriss (512², offline mit derselben Maske): Heldin vorn/seitlich 1,66/1,91 % → 2,15/1,48 %, Noa 1,91/1,98 → 2,92/2,25, Ladenbesitzer 0,96/1,17 → 0,88/0,95, Jugendlicher 1,69/1,76 → 1,68/1,57 – der Körper gibt etwas ab (v. a. Noa, viel geschütztes Haar), dafür sind Strähnen und Schirm vollständig. Bild `r5_lod_huelle.webp`: Kopf seitlich „Hülle schneidet ab“ 2,68 % → 1,48 %, vorn 3,08 % → 0,78 %. Hülle an/aus (Bildanteil verändert, hinten/seitlich/schräg): Heldin R4 16,3/5,3/6,1 % → R5 1,7/2,3/1,5 %.

**Tests angepasst:** `test/stabil_qa.mjs` – die R4-Prüfung „leichtes Netz“ erwartete den alten Spielfigur-Körper (> 10 k) und 2,4–3,1 k; jetzt Hauptnetz > 2 × leichtes Netz und 2,4–3,3 k (R5: Körper 7,6 k, geschützte Hülle 3,2 k). Alle übrigen stabil_qa-Prüfungen (Handy-Budget ≤ 100 k / ≤ 60 Calls mit Umrissen, Häuser, Vorkompilieren …) liefen schon im ersten Lauf unverändert grün.

### Bilder (test/figuren/, `node test/figuren/r5_vergleich.mjs [studio|nah|heldin|huelle|welt|alle]`, Chromium-Sperre)
R4-Stände: `test/fixtures/figuren/fig_{heldin,noa,haendler,buerger_d}_r4.glb`; R4-Zeilen werden mit dem Shader-Stand R4 (ohne Haarmaske) gerendert.
| Datei | Inhalt |
|---|---|
| r5_vergleich_studio.webp | alle 4 Figuren ganz, R4 oben / R5 unten, Umrisshülle an |
| r5_vergleich_nah.webp | Heldin seitlich, Heldin hinten (Pferdeschwanz), Hand, Köpfe Noa/Ladenbesitzer/Jugendlicher |
| r5_heldin_studio.webp | Heldin vorne/seitlich/hinten/Spielkamera |
| r5_lod_huelle.webp | vereinfachte Hülle der Heldin (Drahtgitter vorn/seitlich/hinten) + Umriss-Vergleich (blau = Hülle schneidet ab, rot = steht über) |
| r5_vergleich_welt.webp, r5_welt_ganz.webp | echtes Spielbild Morgenau (Spielkamera, Umrisshülle an): Heldin, Ladenbesitzer, Jugendlicher |
| r5_vergleich.json | Dreiecke, Hüllen-Werte, Laden, Fehler |

### Offen / ehrlich
- Strähnen zeigen aus nächster Nähe noch Facetten (Ring 8); der Toon-Shader glättet viel, aber Nahaufnahmen im Dialog würden von Ring 10–12 an Pony/Seitensträhnen profitieren (+≈ 400 Dreiecke).
- Noa: Krone oben noch etwas massig, das Schutzbrillen-Band liegt hinten knapp über dem Haar. Ladenbesitzer: Haarspitzen unter der Kappe wirken von hinten wie ein kleiner Kranz. Jugendlicher: Naht des Umschlags hinten sichtbar.
- Fingerblock: in Faust-/Wurfposen biegt sich der Block als Ganzes (keine einzelnen Finger) – stilistisch gewollt, aber weniger ausdrucksstark als echte Finger. Die Hände sind in 62-lod nicht geschützt (LOD1 aus der Ferne ok).
- Haarmaske wirkt auf alle Figuren mit Haar-/Bart-Maske, auch auf die noch nicht überarbeiteten (gewollt, dort aber nicht einzeln geprüft).
- Übrige Figuren (Rayan, Prof. Veyran, Mama, Mirael, Bürger a–c) sind noch Stand R2 (13,3 k, ohne `_LODW`). Durch die korrigierte Bürger-Verteilung erscheinen jetzt auch Bürger b/c/d im Spiel (gleiche Dreiecke je Figur wie a, aber bis zu 3 GLBs mehr zu laden/vorzukompilieren).
- Weltvergleich: der Himmel unterscheidet sich zwischen den beiden Aufnahmen (Himmelsbild lädt nach), unabhängig von den Figuren.

## 11. Runde 6 (16.11.) – die übrigen 7 Figuren auf R5-Stand, Heldin Ring 12
Agent „Figuren R6“ (Sonnet 5.5 · hoch). Rezept aus R5 unverändert angewendet: Steckbrief-Schalter `r5=True` (+ neu `r6=True`), Haar als Schale (`dome5`/`shell5`) + runde Volumen-Strähnen (`strand`/`st5` mit `rnd`/`sexp`/`bend`/`tp`), geglättete Stellvertreter-Normalen, `fix_inside_out`, Fingerblock-Hände, gewichtetes Reduzieren auf `gesamt = 8 900`, Schutzgewicht `_LODW`. Jede Figur behält Frisur-Art und Kleidung (kein Redesign). Keine der sieben trägt Kappe/Mütze → kein Logo nötig (das „V“ der Heldin kommt nirgends vor). Rig (32 Knochen), 7 Clips und 9 Shape Keys sind bitgleich zu den bisherigen GLB (Gehen 1,9 / Rennen 5 bleiben).

### Was je Figur (alle in `tools/modelle/figuren/fkit.py`, Steckbriefe in `figuren.py`)
| Figur | Frisur R5-Technik | Hinweise |
|---|---|---|
| Rayan (Kind) | `stachel5`: Schale, 12 kräftige, spitz zulaufende Stacheln nach hinten/oben (rund, `tp` 1,25), 9 anliegende Strähnen seitlich/hinten, 3 in die Stirn | rote Spitzen weiter über `haar_hi` (Abstand zum Kopf), Haaransatz-Verlauf dunkel statt heller (`haar_spitze`) |
| Prof. Veyran | `wolke5`: dünne Schale (hohe Stirn bleibt), 17 dicke weiße Wolken-Büschel in zwei Lagen (Ring 10, `puff` 0,3), 7 Wisps vom Scheitel | Vollbart-Schale + runder Schnurrbart (R5-Pfad) unverändert, Bart `_LODW` 0,6 |
| Mama | `dutt5_lose`: Schale, 14 glatt zurückgestrichene Strähnen vom Scheitel, **Dutt als eingerollte Spirale** (dicke Strähne + Mittelstück, `bun5`), 2 lose Strähnen vor den Ohren | Dutt-Normalen kugelig (`D.PONY_R`, neu) |
| Mirael | `dutt5`: wie Mama ohne lose Strähnen, Blüte bleibt (`blume`, `_LODW` 0,6) | Sommersprossen, Kittel, Kreuz-Blatt unverändert |
| Bürgerin a | `pferd5`: Schale, anliegende Strähnen, Pony seitlich gekämmt (5), **hoher Pferdeschwanz** mit Haargummi (`ponytail5`, wie Heldin R4: Hauptvolumen + 2 Nebenstränge, `fix_inside_out`) | Haargummi jetzt Region `blume` (rostrot, `_LODW` 0,6) statt `knopf` |
| Bürgerin b | `locken5`: Schale + 37 kurze eingerollte Haken-Strähnen (Ring 8, 6 Stützpunkte) statt 26 Kugeln | dichter besetzt, Silhouette bleibt „lockig“ |
| Bürger c | `kurz5`: Schale, 8 Strähnen vom Seitenscheitel zur Seite, 11 anliegend rund um den Kopf, Spitzen leicht nach außen | Kurzbart-Schale + runder Schnurrbart (R5) |

Weitere Änderungen
- **Hände leicht geschützt** (`r6=True`): `_LODW` 0,4 für Hand-Ecken (Arm-Koordinate hinter dem Handgelenk), damit der Fingerblock beim Vereinfachen (62-lod) seine Form behält. Gilt für die 7 Figuren; Heldin/Noa/Ladenbesitzer/Jugendlicher bleiben bei R5 (Heldin: „sonst nichts anfassen“). Gesamt-`_LODW`: Haar 1, Schirm-Unterseite 1, Schirm/Knopf/Umschlag 0,9, Krone/Mütze 0,8, Haargummi/Bart/Blüte 0,6, Hände 0,4.
- **Heldin**: Pony (5 Strähnen) und vordere Seitensträhnen (2) Ring 8 → 12; Rest unverändert. +392 Dreiecke → Steckbrief `gesamt=9290`, `lod=.48` (GLB-LOD1 3 835 ≤ 4 000). Der Mehrbedarf des geschützten Haars kommt fast vollständig aus dem Budget zurück (ungeschützter Körper nur −43 Dreiecke).
- `D.PONY_R` (fkit.py/fkit2.py): Radius, in dem Haar-Normalen zur Pferdeschwanz-/Dutt-Achse zeigen; Standard `0,045·H/1,45` = bisheriges Verhalten (Heldin bitgleich).
- Alte Stände: `test/fixtures/figuren/fig_<id>_r5alt.glb` (Heldin R5; die übrigen sieben sind der Stand R2 – R5 hatte sie nicht angefasst).

### Messwerte (aus den geladenen GLB, three nach Draco; „Hülle“ = leichtes Netz aus 62-lod = LOD1/Umriss/Schatten)
| Figur | Hauptnetz vorher → nachher | GLB-LOD1 vorher → nachher | Hülle vorher → nachher | Datei vorher → nachher |
|---|---|---|---|---|
| Heldin | 8 897 → **9 289** | 3 799 → **3 835** | 3 199 → **3 200** | 651 → 668 KB |
| Rayan | 13 320 → **8 899** | 5 871 → **3 799** | 2 799 → **3 199** | 708 → 640 KB |
| Prof. Veyran | 13 319 → **8 899** | 5 871 → **3 800** | 2 799 → **3 200** | 733 → 699 KB |
| Mama | 13 320 → **8 897** | 5 872 → **3 800** | 2 800 → **3 200** | 679 → 642 KB |
| Mirael | 13 320 → **8 899** | 5 872 → **3 799** | 2 799 → **3 199** | 720 → 692 KB |
| Bürgerin a | 13 320 → **8 899** | 5 872 → **3 800** | 2 799 → **3 200** | 704 → 682 KB |
| Bürgerin b | 13 319 → **8 899** | 5 870 → **3 800** | 2 800 → **3 200** | 736 → 716 KB |
| Bürger c | 13 320 → **8 900** | 5 872 → **3 802** | 2 800 → **3 200** | 689 → 621 KB |

Je Bild nah (Hauptnetz + Hülle + Schatten): −3,6 k je alter Figur (R2 → R6: 13,3 k + 2,8 k + 2,8 k → 8,9 k + 3,2 k + 3,2 k), Heldin +0,4 k. Fern (LOD1 + Hülle): −2,1 k je alter Figur (5,9 + 2,8 → 3,8 + 3,2), Heldin +0,04 k.

Silhouette der vereinfachten Hülle (Test: Haar-/Bart-Dreiecke, orthografisch vorn/seitlich/oben, Ø XOR in %, R6-Hülle mit Schutz gegen „R4-Verfahren“ = 2,8 k ohne Schutz auf demselben Netz):
Heldin 1,26 / 3,65 · Rayan 2,13 / 4,96 · Veyran 2,08 / 3,63 · Mama 1,27 / 3,78 · Mirael 1,51 / 3,61 · Bürgerin a 1,67 / 4,23 · Bürgerin b 3,23 / 4,71 · Bürger c 2,59 / 4,76 (R5-Figuren: Noa 1,15 · Ladenbesitzer 1,31 · Jugendlicher 0,78). Die R6-Figuren mit vielen kleinen Haarvolumen (Locken, Wolken, Stacheln, Bart) liegen etwas über den R5-Figuren, bleiben aber bei 34–69 % des R4-Verfahrens.

### Tests / Bilder
- `test/figuren2/test_modelle.mjs` (jetzt 101 Prüfungen): für alle elf R5/R6-Figuren Budget (Haupt ≤ 9 000, Heldin ≤ 9 300; GLB-LOD1 ≤ 4 000), `_LODW` im GLB, Hülle 2 900 … 3 300, Silhouette (R5-Figuren < 1,8 %/≤ 60 %, R6-Figuren < 3,4 %/≤ 70 % des R4-Verfahrens – Grenze für die R6-Figuren bewusst großzügiger, siehe oben), Hülle verdeckt keine Haarteile; neu **Rig/Clips/Shape Keys gegen die Fixtures** (`_r5alt`: 32 Knochen gleiche Namen/Reihenfolge/Lage, 7 Clips gleiche Namen/Dauer/Spuren, 9 Keys gleiche Namen).
- Bilder `test/figuren/r6_vergleich_{studio,nah,welt}.webp` (Vorher oben grau / Nachher grün; `node test/figuren/r6_vergleich.mjs [studio|nah|welt|alle]`, Chromium-Sperre, vorher `node build.mjs`): studio = 8 Figuren ganz; nah = Köpfe vorn/schräg + von hinten; welt = echtes Spielbild Morgenau (Spielkamera, Umrisshülle an). Messwerte in `r6_vergleich.json`.

### Offen / ehrlich
- Aus Nahaufnahme sind Strähnen/Büschel noch leicht facettiert (Ring 8–10); Wolken (Veyran) und Locken (Bürgerin b) wirken eher „Pappmaché“ als weich – mehr Ringe kosten das geschützte Haar-Budget der Hülle (Locken mit 5 statt 6 Stützpunkten: Hülle schien durch, Haken knickt).
- Alter Mangel, nicht Teil von R6: Ärmel von Mirael/Bürgerin a/Veyran zeigen dunkle AO-Flecken, Veyrans Mantelsaum wirkt nach dem Reduzieren etwas fleckig (Kittel/Mantel-Schale trägt jetzt die Reduktion).
- Rayan: Stacheln sind nach hinten/oben gerichtet, von vorn lesen sie sich als rote „Krone“ (wie R2), nicht als einzelne Zacken.
- Mama/Mirael: Dutt als Spirale wirkt von hinten schön rund, von der Seite etwas hoch; Mirael-Blüte sitzt knapp neben dem Dutt.
- Im Weltbild (`r6_vergleich_welt.webp`) verdeckt die Kamera Mirael und Bürger c hinter den vorderen NPCs; Ansicht aller Figuren in `studio`/`nah`.
- Hände (Fingerblock) in Faust-/Wurfposen weiterhin als Block; `_LODW` 0,4 für Hände nur bei den 7 Figuren der Runde.

**Abschluss-Tests Runde 6 (16.11.):** build ok · smoke „Keine Fehler.“ (2. Lauf, 1. Lauf Timeouts unter Last) · test_modelle 101 ✓ · uebergaenge_qa 97 ✓ · name_eingabe 4 ✓ · terras2 35 ✓ (3. Lauf; 2 Läufe mit je 1 flackernden Kampf-Fenster) · **stabil_qa 60 ✓ / 2 ✗** (zweiter Lauf; erster 58/4).
Offen/Ursache stabil_qa: „M 932×430 Budget Handy Morgenau“ und „R4 Budget Morgenau hält MIT sichtbaren Umrissen“ – 93 458 Dreiecke (≤ 100 k ok), aber **61 Draw-Calls (> 60)**, deterministisch bei 932×430. A/B mit den alten `_r5alt`-Modellen in dist/: 62 ✓ (89 465 Dreiecke, 59 Calls, Stufe 5). Ursache: Die neuen Figuren sind leichter („vorher“ 80 144 statt 102 223 Dreiecke), der Qualitätsregler (dreiecksgesteuert) bleibt deshalb auf Stufe 6 statt 5, und Stufe 6 kostet 61 statt 59 Calls. Kein Modell-Defekt (gleiche Mesh-/Material-Struktur, 4 Meshes, 2 Materialien); die Draw-Call-Grenze wird im Regler nicht berücksichtigt. Schwellen unverändert. Vorschlag: Regler um Call-Budget ergänzen (src/, nicht Figuren-Aufgabe).
