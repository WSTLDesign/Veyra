# Terras – tierhafte Kreaturen-Modelle (Agent Terras, Opus hoch, 12.11.2026)

Ziel 4 aus docs/ziele.md: Die Terras sollen **moderner und deutlich tierhafter** wirken („mehr Tiere, weniger Fabelwesen“).
Entscheidung des Nutzers: keine neuen Bilder. Umgebaut werden die prozeduralen 3D-Modelle und alles, was daraus entsteht
(Vorschaubilder `monThumb`, 2D-Zeichnung `drawMon`, Welt-Sprites bildloser Arten, Kampf 3D, drehbare Dex-/Team-Ansicht, Entwicklungs-Sequenz, Starterwahl).
Gemalte Bilder (public/art) bleiben unverändert im Dex/Kampf; das 3D-Modell zeigt dieselbe Art (Farben + Signaturmerkmal).

## 1. Bestandsaufnahme (Vorher, test/terras_vorher.png)

Was die alten Modelle zu „Fabelwesen“ machte – gemeinsame Ursachen:

- **Kugelköpfe**: Schädel = Kugel, Schnauze = kleine aufgesetzte Kugel; Kopf so groß wie der Rumpf (Kindchenschema überall, auch bei Endstufen).
- **Brillen-Augen**: riesige weiße Anime-Augen mit dickem Ring, die wie eine Brille vor dem Kopf sitzen.
- **Röhren-Beine** ohne Gelenkwinkel (gerade Säulen, kein Sprunggelenk, keine Pfoten-Ausrichtung), alle Vierbeiner mit denselben Proportionen.
- **Blob-Rümpfe**: Ei/Kugel statt Brustkorb–Taille–Becken.
- **Falsche Grundformen**: Kiesel/Brummit als Gorilla-Golem, Quallen als Wolke mit Eiszapfen, Wolkengeist als Nacktschnecke, Robben mit „Kochmütze“.
- Leistung: 21–55 Draw-Calls und 19–117 k Dreiecke je Kreatur (jede Kugel ein eigenes Netz mit eigenem Umriss).

| ID | Name | Vorher – was „Fabelwesen“ statt Tier macht |
|---|---|---|
| 001 | Funki | Kugelkopf mit Mini-Schnauze, Röhrenbeine, Schweif als Röhrenkette |
| 002 | Loddo | wie Funki, nur länger; kein Wolfs-/Fuchskörperbau |
| 003 | Flammel | Basaltkristalle wie Zacken, Kopf zu groß für Endstufe |
| 004–006 | Plippi, Wabbel, Aquilo | Kugelrobbe, Krone als Röhre („Kochmütze“), kein Hals |
| 007/008 | Knospi, Rankel | Teddy-Sitzfigur aus Kugeln |
| 009 | Blühro | Kugelbär, Blätter wie Fransen |
| 022/023 | Kiesel, Brummit | menschenähnlicher Fels-Golem (Arme, Fäuste) |
| 025/026 | Pusti, Wirbel | Kugelkopf, Wirbel-Ring als großer Heiligenschein |
| 031–033 | Dumbi, Noxli, Mondoro | Brillen-Augen, Kopf so groß wie Rumpf |
| 034 | Zischi | „Katze“ mit Kugelkopf; Element eher Echse/Salamander |
| 037/038 | Muschel, Perlo | Hund mit Muschelhaufen, Kugelkopf |
| 052/053 | Glibbi, Quallio | Wolke mit Regenbogen und Eiszapfen statt Qualle |
| 057/058 | Knackel, Brocken | Steinbuckel ohne Gürteltier-Bänder, Fuchsschnauze |
| 059/060 | Flausch, Wolkito | Ring-Ohren, Hals zu lang, kein Eulengesicht |
| 061/062 | Blinki, Strahli | schwebende Plüschfigur, Ohren wie Pappe |
| 072/073 | Knips, Blitzmähne | Kugelkopf-Welpe, gleiche Proportionen auf allen Stufen |
| 075/076 | Frosti, Glazirr | Hund mit Eiszacken statt Echse/Drache |
| 090/091 | Moosel, Moosgolem | grüner Kugelbär (Bild zeigt hellbraunen Bären mit Steinplatten) |
| 112/113 | Knabbi, Nagnox | Kugelnager, Kopf größer als Körper |
| 114–117 | Zippi, Voltfink, Huschu, Nachtkauz | Kugelvögel ohne Hals/Gesichtsschleier, Glühbirne als Kopf |
| 122 | Wolkengeist | Schnecken-/Schlauchform |

## 2. Baukasten (src/52-terras.js)

**Technik**
- **Ein gehäuteter Körper je Kreatur**: Alle Teile werden zu *einem* `SkinnedMesh` verschmolzen; die bisherigen Gelenk-Gruppen sind die Knochen.
  Glieder und Schwänze sind *ein* durchgehender Loft über mehrere Knochen mit weich verblendeten Gewichten an Knie/Ellbogen/Sprunggelenk → keine Nähte, echte Gelenke.
  Ergebnis: 3–7 Draw-Calls je Kreatur (Körper, Leuchtteile, Umriss, Augen, ggf. Flamme/Flügelhaut) statt 21–55.
- **Lofts** (`taLoft`): elliptische Querschnitte entlang einer Kurve – Brustkorb → Taille → Becken, Hals, Schädel → Stopp → Schnauze → Nase.
  Fellzeichnung als Vertex-Farbe nach Lage (`mk`: Maske, Schnauze, Blesse, Kinn, Bauch, Latz, Kehle, Socken/Strümpfe, Schwanzspitze, Ohrspitzen, Ohr-Innenseite).
- **Material**: `taMat` = Cel 2-stufig (`monGrad`) + Rim-Licht + Glanzpunkt wie bisher, zusätzlich Knochen und prozedurales Oberflächenmuster im Shader
  (`p(1)` Schuppen für Echsen/Salamander/Fisch/Biberkelle, `p(2)` Panzerbänder für Gürteltiere). Umriss `taOl` mit Knochen.
- **Augen** im Tierstil: neue Augen-Texturen `ani` (Iris füllt das Auge, runde Pupille) und `slit` (Schlitzpupille für Katzen/Echsen); flach in den Kopf gesetzt,
  Ausdruck über Lider (freudig, wütend, müde, verletzt, zu) wie bisher. Kiefer ist beweglich (Maul öffnet sich bei Angriff und Freude, Zunge sichtbar).

**Körpertypen** (`TA_BODY`), alle mit Parametern Rumpflänge/-tiefe/-breite, Taille/Becken/Brust, Halslänge/-winkel, Schädel, Beinlängen vorn/hinten, Beinstärke, Pfote, Stand:

| Typ | Stand / Gang | Kopf (`TA_H`) | Ohren | Schwanz |
|---|---|---|---|---|
| canine (Fuchs, Wolf, Husky) | Zehengänger, Sprunggelenk hoch | lange Schnauze | tall | brush |
| feline (Katze, Schneeleopard) | Zehengänger, kurze Schnauze, breite Wangen | Schlitzpupille | cat | long |
| ursine (Bär) | Sohlengänger, Schulterbuckel | runde Schnauze | round | stub |
| mustelid (Otter) | Sohlengänger, niedrig, langer Rumpf | Otter, Schnurrhaare | small | otter |
| rodent (Biber, Ratte) | Sohlengänger, Nagezähne | rodent | mouse | flat / whip |
| lagomorph (Hase, Kaninchen) | Hopser, Hinterlauf gefaltet | lago | long / lop | puff |
| armadillo (Gürteltier) | Sohlengänger, Bänderpanzer | Röhrenschnauze | tallRound | taper |
| reptile / amphibian (Leguan, Gleitechse, Salamander) | Spreizgang, Rumpfschlängeln | flach, Brauenwulst | – | lizard |
| tortoise (Schildkröte) | gespreizte Säulenbeine | Hornschnabel | – | stub |
| seal (Robbe) | robbt (Wellen + Flossen) | seal | small | Schwanzflossen |
| owl / bird (Eule, Singvogel) | Gehen bzw. Hüpfen, Flügelschlag | Gesichtsschleier / Schnabel | – | Fächer, Gabel |
| jelly (Qualle) | Glocke pulsiert, Arme/Tentakel wehen | – | – | – |
| ribbon (Riemenfisch) | Bandkörper wellt, schwebt | Fischkopf mit Strahlenkrone | – | Flossensaum |

**Entwicklungsstufen** (`TA_STG`): klein/niedlich (Kopf ×1,4, Beine ×0,74, Rumpf ×0,82, Augen ×1,2) → mittel → majestätisch (Kopf ×0,94, Beine ×1,1, Masse ×1,12).

**Animation** (`taGait`, aus `animMon`): Vierbeiner gehen im Viertakt (versetzte Beine HL–VL–HR–VR), rennen im Trab (diagonale Paare);
Vorderbeine beugen das Handgelenk im Schwung, Hinterbeine Knie und Sprunggelenk, Pfoten bleiben waagerecht. Hasen hoppeln, Echsen spreizen und schlängeln,
Robben robben, Vögel hüpfen/watscheln und schlagen mit den Flügeln, Quallen pulsieren, Riemenfische wellen. Schlafen/Ohnmacht/Verstecken = Hinlegen mit
eingefalteten Beinen (kein Einsinken in den Boden), Grasen senkt den Hals-Knochen (Kopf bleibt am Hals).

## 3. Arten – Tierbasis (Welt I + Starter-Linien)

Stufe: 1 = klein/niedlich, 2 = mittel, 3 = majestätisch. Farben = Haupt / Zweit / Signatur. „Bild“ = gemaltes Bild vorhanden (bleibt im Dex/Kampf).

| ID | Name | Tierbasis | Silhouette | Signaturmerkmal | Farben | Stufe |
|---|---|---|---|---|---|---|
| 001 | Funki (Bild) | Rotfuchs · Welpe | großer Kopf, Riesenohren, buschige Rute | Flammen-Schweifspitze, Stirnflamme | Glutorange / Creme / Flammengelb | 1 |
| 002 | Loddo | Rotfuchs · Jungtier | gestreckt, dunkle Läufe | Flammen-Halskrause | Orange / Creme / Gelb | 2 |
| 003 | Flammel | Mähnenwolf | sehr lange schwarze Läufe, Nackenmähne | Flammenmähne, Basaltplatten mit Glutfugen | Rotorange / Creme / Lavagelb | 3 |
| 004 | Plippi (Bild) | Seehund · Heuler | liegende Robbe, runder Kopf | Wasserkrone mit Blasen, Tupfen | Himmelblau / Weiß / Hellblau | 1 |
| 005 | Wabbel | Seehund · Jungtier | länger, kräftiger | Wasserkrone (7 Zacken) | Blau / Weiß / Hellblau | 2 |
| 006 | Aquilo | Seeleopard | lang, massig, großer Kopf | leuchtende Tupfen, Krone | Nachtblau / Eisweiß / Leuchtcyan | 3 |
| 007 | Knospi (Bild) | Braunbär · Junges | rund, kurze Beine | Blätterhaube mit Knospe, Blätterkragen | Braun / Creme / Rosa | 1 |
| 008 | Rankel (Bild) | Braunbär · Jungbär | kräftig, Laubfell | Knospe fast offen, Blätterfell | Moosgrün / Creme / Rosa | 2 |
| 009 | Blühro (Bild) | Grizzly | Schulterbuckel, breite Brust | Lilienblüte, Blättermähne, Blüten | Moosgrün / Creme / Blütenrosa | 3 |
| 022 | Kiesel (Bild) | Landschildkröte · Schlüpfling | Steinkuppel auf Stummelbeinen | Bernsteinkristall auf dem Panzer, Moos | Steingrau / Sand / Bernstein | 1 |
| 023 | Brummit (Bild) | Riesenschildkröte | hohe Kuppel, Säulenbeine | Bernstein-Kristallgruppe, Moospolster | Steingrau / Sand / Bernstein | 2 |
| 025 | Pusti (Bild) | Polarfuchs · Welpe | rund, buschige Rute | Windwirbel an der Rute | Eisblau / Weiß | 1 |
| 026 | Wirbel (Bild) | Polarfuchs | schlank, Halskrause | Wolkenkragen, Windwirbel | Eisblau / Weiß | 2 |
| 031 | Dumbi (Bild) | Hauskatze · Kätzchen | großer Kopf, Ringelschwanz | Mondsichel auf der Stirn, Sternflecken | Nachtviolett / Lavendel / Sternlicht | 1 |
| 032 | Noxli (Bild) | Katze (schlank) | lange Läufe, Halskrause | Mondsichel, Sternflecken | Nachtviolett / Lavendel / Sternlicht | 2 |
| 033 | Mondoro (Bild) | Schneeleopard | lang, dicker Schwanz | Sternenkranz, Kristallkragen | Nachtviolett / Lavendel / Gold | 3 |
| 034 | Zischi (Bild) | Feuersalamander | flach, Spreizbeine, langer Schwanz | glühende Lavaflecken, Flammenspitze | Basaltschwarz / Glutorange / Lavagelb | 1 |
| 037 | Muschel (Bild) | Seeotter · Welpe | niedrig, langer Rumpf, Ruderschwanz | Jakobsmuschel auf dem Kopf | Meerblau / Korallrosa / Perlgelb | 1 |
| 038 | Perlo (Bild) | Seeotter | kräftiger | Muschel, Korallenäste, Perle | Meerblau / Korallrosa / Perlgelb | 2 |
| 052 | Glibbi (Bild) | Ohrenqualle | flache Glocke, kurze Arme | vier Ringe in der Glocke | Hellblau / Weiß / Lila | 1 |
| 053 | Quallio (Bild) | Kompassqualle | größere Glocke, lange Tentakel | Lichtring über der Glocke | Hellblau / Weiß / Gold | 2 |
| 057 | Knackel (Bild) | Neunbinden-Gürteltier | Bänderpanzer, Röhrenschnauze, große Ohren | Kieselplatten mit Moos | Sand / Steingrau / Moosgrün | 1 |
| 058 | Brocken | Riesengürteltier | massig, Grabkrallen | Hornstummel, mehr Bänder | Sand / Steingrau / Moos | 2 |
| 059 | Flausch (Bild) | Schneeeule · Küken | Federkugel, offene Flügel | zwei Wirbel-Federkränze, V-Stirnmal | Cremeweiß / Minz / Himmelblau | 1 |
| 060 | Wolkito | Schneeeule | breite Schwingen | Wirbelkronen | Creme / Minz / Blau | 2 |
| 061 | Blinki (Bild) | Widderkaninchen + Glühwürmchen-Merkmale | sitzend, Schlappohren | Leuchtfühler, Flügelchen, leuchtende Blume (Schwanz) | Creme-Gelb / Lavendel / Leuchtgelb | 1 |
| 062 | Strahli | Feldhase (Leuchtform) | lange Löffel, lange Läufe | Lichtkranz, größere Flügel | Gold-Creme / Lavendel / Licht | 2 |
| 072 | Knips (Bild) | Husky · Welpe | Blesse, weiße Socken | gelbe Blitzstreifen, gelbe Ohr-/Rutenspitze | Schiefer / Weiß / Gelb | 1 |
| 073 | Blitzmähne (Bild) | Wolf | lange Läufe, Mähne | Blitzmähne | Schiefer / Weiß / Gelb | 2 |
| 075 | Frosti (Bild) | Leguan · Jungtier | flach, Spreizgang, Brauenwulst | Eiskristall-Rückenkamm, Eiskrone | Eisblau / Weiß / Cyan | 1 |
| 076 | Glazirr (Bild) | Flugdrache (Gleitechse) | Flughäute an den Flanken | Eiskamm, eisblaue Flughaut | Eisblau / Weiß / Cyan | 2 |
| 090 | Moosel (Bild) | Braunbär · Junges (Felsbär) | stämmig, kurze Beine | Steinplatten, Moos, Blüte | Hellbraun / Creme / Moosgrün | 1 |
| 091 | Moosgolem (Bild) | Braunbär (Felsbär) | kräftig | Steinplatten, blaue Kristalle | Hellbraun / Creme / Kristallblau | 2 |
| 112 | Knabbi | Biber | rundlich, Kellenschwanz | Nagezähne, geschuppte Kelle | Nussbraun / Creme | 1 |
| 113 | Nagnox | Wanderratte | schlank, langer nackter Schwanz | Schlüsselbart am Schwanzende | Nussbraun / Creme / Gold | 2 |
| 114 | Zippi | Kohlmeise · Nestling | runder Singvogel | Glühbirnen-Kamm, schwarze Kappe | Olivgrün / Anthrazit / Glühweiß | 1 |
| 115 | Voltfink | Rauchschwalbe | waagerecht, Gabelschwanz, lange Schwingen | Glühbirnen-Kamm, gelbe Kehle | Anthrazit / Gelb / Glühweiß | 2 |
| 116 | Huschu | Steinkauz | klein, rund, Gesichtsschleier | Uhr-Punkte um die Augen | Dämmerviolett / Flieder / Gelb | 1 |
| 117 | Nachtkauz | Uhu | groß, Federohren | Federohren, Uhr-Gesicht | Dämmerviolett / Flieder / Gelb | 2 |
| 122 | Wolkengeist | Riemenfisch | langer Bandkörper, schwebt | Strahlenkrone, Wolkenbäusche, Lichtkranz | Wolkenweiß / Gold / Himmelblau | 2 |

## 4. Messwerte (test/terras_qa.mjs → test/terras_qa.txt)

| Größe | Vorher (40 Arten) | Nachher |
|---|---|---|
| Draw-Calls je Kreatur | 21–55 | 3–7 (Körper, Leuchtteile, Umriss, Augen, ggf. Flamme/Flügelhaut) |
| Modell-Dreiecke je Kreatur | ≈ 10–60 k | 1,9–5,9 k (Mittel ≈ 4,1 k) |
| gerendert inkl. Umriss-Hülle | 19–117 k | 2,7–10,4 k |
| Knochen | – | 9–37 (Knochen-Textur, mobil unkritisch) |

Grenze ≤ 12 Draw-Calls / ≤ 6000 Dreiecke gilt je Modell (die Umriss-Hülle zeichnet dieselben Dreiecke ein zweites Mal und wird getrennt gemeldet).
Prüfungen: alle 153 Arten bauen fehlerfrei, keine NaN, Füße auf y = 0 und Höhe = sp[4], animMon 3 s in allen Zuständen, Pfoten nicht im Boden, Vorschaubilder gefüllt.
Übrige (alte) Arten zum Vergleich: Ø 32 Calls, Ø 53 k Dreiecke.

**Vorschaubilder** (`monThumb`, Dex/Team/Fang-Karte für Arten ohne gemaltes Bild, 2D-Kampf): 512 px bei DPR ≥ 1,5 (sonst 384 px), Dreiviertel-Heldenpose,
weicher Kontaktschatten wie auf den gemalten Karten; Welt-Sprites nutzen das Rohbild ohne Schatten (`THUMB[id].raw`).
Welt-I-Arten ohne gemaltes Bild (betrifft das): 002, 003, 005, 006, 058, 060, 062, 112–117, 122.

**Aufnahmen**: test/terras_vorher.png, test/terras_nachher.png, test/terras_starter_glut|flut|flora.png (3 Ansichten), test/terras_funki_linie.png (vorher/nachher),
test/terras_kampf.png (Loddo gegen Brocken, 3D-Kampf), test/terras_welt.png (Route 1 mit Begleiter Flammel). Skripte: test/terras_sheet.mjs, terras_starter.mjs, terras_funki.mjs, terras_shots.mjs.

## 5. Offen (spätere Wellen)

Alle übrigen Arten (113) laufen weiter über den alten Baukasten in 10-mon3d.js.
Bekannte Grenzen der ersten Welle: Silhouetten sind bewusst sparsam (Lofts mit 6–18 Segmenten) und wirken aus der Nähe leicht facettiert; Knospi/Rankel stehen auf vier Beinen statt zu sitzen (Bild: sitzend); Eulen-Flügel und Quallen-Tentakel sind noch schlicht. Für eine neue Art genügt ein Eintrag in `TERRA`
(Tierbasis `b`, Zeichnung `mk`, Merkmale `f`, ggf. `q`/`k`/`tl`-Maße) – kein neuer Code nötig, solange der Körpertyp existiert.

## 6. Fortsetzung 15:30 (Agent Terras, Opus hoch)

**Zustand nach dem Abbruch (12:52):** Code vollständig, kein halbfertiger Stand in 52-terras.js/10-mon3d.js. Build, Smoke („Keine Fehler.“) und terras_qa grün;
19/21 unit_* grün. Rot: `unit_catchcard` – Entwicklung 061 Blinki (Bild) → 062 Strahli (ohne Bild): die neue Form war im Entwicklungsbild nur ≈ 40 % so groß
(Anteil 0,118 < 0,15) – das war der offene „Bild-Zuschnitt der Entwicklungs-Ansicht“; `unit_introvideo` (Rückkehr in die Welt nach dem Film, nicht Terras-Thema).

**Entwicklungs-Ansicht:** Hülle um `SEQ.evolve` (Ende von 52-terras.js). Nur während der Sequenz zeichnet `drawArt` bildlose Arten als Modell-Porträt (monThumb)
in denselben 440-px-Rahmen wie gemalte Bilder; danach ist `drawArt` wieder das Original aus 26-art.js (Datei unverändert).

**Funki-Linie / Kartenqualität der Modell-Bilder** (Nutzer-Feedback „Loddo und Flammel nicht gleiche Qualität“):
- Porträt-Geometrie `TA_HQ` (52-terras.js): beim Rendern von Dex-/Team-/Fang-Bildern Lofts mit 1,8× Umfangs- und 2× Längssegmenten, feinere Kugeln/Augen →
  keine Facetten mehr. Nur für das einmalige Bild; das Spielmodell bleibt ≤ 6 k Dreiecke (eigene Cache-Schlüssel `TLh`/`Th…`).
- `monPortrait` (10-mon3d.js): 2×-Überabtastung (1024² → 512² weich verkleinert) → saubere Kanten auch ohne MSAA; weiter 512 px bei DPR ≥ 1,5.
- Licht: celMat färbte die Schattenseite kalt (`vec3(.84,.84,.97)`) → Creme/Weiß wirkte lila-grau. Terras nutzen jetzt einen warmen Schattenton (`.98,.86,.83`).
  Fell-Glanz von 0,16 auf 0,06 (kein Plastik-Look); Echsen/Schildkröten/Quallen behalten 0,4.
- Haltung: in der Heldenpose Kopf leicht gesenkt statt gehoben (vorher sah man die Kinn-Unterseite) und nur zu 25 % zur Kamera gedreht (`lookK`, je Art `pk`,
  Flammel 0) → echte Dreiviertel-Ansicht mit Fuchsschnauze statt frontalem „Kugelgesicht“; Maul in der Heldenpose leicht offen.
- Loddo/Flammel: Flammen-Halskrause rund um den Hals (vorher flügelartig nach oben/hinten), buschigere Rute, Schwanzspitze Gelborange statt Cremering,
  Flammel-Kopf ×1,12. `heroFrame` berücksichtigt bei langen Terras die Tiefe (Wolkengeist ragte rechts aus dem Bild).
- Vergleich: test/terras_funki_linie.png (gemalt · Stand 12:35 · nachher), Vorher-Datei test/terras_funki_vorher.png.

**Arten ohne gemaltes Bild (Welt I):** 002, 003, 005, 006, 058, 060, 062, 112–117, 122 (15 Arten). Alle geprüft (Raster test/terras_nachher.png): gleiche Bildsprache
wie die übrigen Modell-Bilder; gegenüber gemalten Karten bleibt ein Abstand (siehe Offen).

**Welt als 3D-Modell (Nutzer 15:17):** `syncW3 → kindOf` (10-mon3d.js): Terras (TERRA-Arten) laufen als Begleiter und wilde Kreaturen immer als 3D-Modell
(3–7 Calls, ab 4,5 Feldern ohne Umriss), kein Billboard mehr. Kampf unverändert: gemaltes Bild, wo vorhanden, sonst Tiermodell.
Übrige 113 Arten (alter Baukasten): weiterhin Billboard (Bild oder prozedurales Porträt) – Umschaltung erst, wenn sie im neuen Baukasten stehen
(sonst bis 55 Calls je Kreatur). Legenden-Nester in 09-three3d.js (Zeile ≈ 581, `n.t==='legend'`) nutzen noch Sprite/alt – betrifft keine Terra.

**Aufnahmen / Vorschau:** test/vorschau_terras_1.png (Funki-Linie) · _2 (40 Arten) · _3/_4/_5 (Starter-Linien, 3 Ansichten) · _6 (Welt, Begleiter als Modell)
· _7 (Kampf mit gemaltem Bild: Flammel gegen Knackel) · _8 (Kampf mit zwei Modellen: Loddo gegen Brocken). Skripte: terras_funki.mjs, terras_sheet.mjs
(jetzt TA_HQ + 2×, Messwerte weiter vom Spielmodell), terras_starter.mjs, terras_shots.mjs.

**Offen (spätere Wellen):** Ein prozedurales Modell erreicht die gemalten Karten nicht ganz (Mimik, Fellfluff, dynamische Pose) – beste Lösung für 002/003/005/006
bleiben gemalte Bilder vom Nutzer (Feedback-Eintrag des Orchestrators 15:30). Fell-/Schuppen-Detail im Shader (Strähnen, ≥ 512-px-Detailtextur) noch nicht;
Brillen-artige Frontalansichten bei Robben/Bären/Ottern (lookK) feinjustieren; Quallio-Lichtring wird im Porträt oben angeschnitten; Kampf-Modelle ohne
eigene Überabtastung (Kanten im Software-Renderer etwas stufig). Dex-3D-Ansicht nutzt bewusst das Spielmodell (≤ 6 k), nicht TA_HQ.
