# Detailing – Innenräume, Höhlen, Kreaturenstation

Agent „Innenräume“ (Opus, hohe Stufe) · 12.11.2026 · Ziele 1–3 aus docs/ziele.md.
Dateien: `src/51-innen.js` (neu), `src/styles-innen.css` (neu), `src/02-world.js` (nur `INNEN_FURN` + `buildInterior`), `test/innen_qa.mjs`, dieses Dokument.
Keine Zeile in `09-three3d.js`, `25-evolve.js`, `26-art.js`, `24-capture.js` geändert – alles über Hüllen/Hooks.

## 1. Prinzip: Kollision = Darstellung
- `INNEN_FURN[k]` (02-world) listet je Raumtyp Möbel als `[x, y, Breite, Tiefe, Kachel, Möbel]`. `buildInterior` setzt die Kachel (B hoch, K/C niedrig, R Pflanze/Säule – alle schon in `SOLID`) und gibt `furn` mit. `51-innen.js` zeichnet jedes Möbel genau auf seine Felder; der Test prüft per Strahl von oben, dass jedes blockierte Feld Möbel trägt und kein freies Feld unter Kopfhöhe etwas hat.
- Bisherige Belegungen bleiben, wo Spiel/Tests sie brauchen: Labortisch Reihe 4 (Starter auf 3/5/7,4, Smoke wählt von 3,5), Theken Reihe 3 in Laden/Station (über die Theke ansprechen), Liga-Gang x = 5, Arena-Säulen. Alle Figuren und das Eingangsfeld (5, h−2) stehen frei (`unit_story` „freie, erreichbare Felder“).
- Spielstände: Keine Schlüssel geändert. Liegt eine gespeicherte Innenposition auf einem neuen Möbelfeld, setzt `loadMap → findWalk` die Figur aufs nächste freie Feld (bestehendes Verhalten).
- 2D (versteckte Option) zeichnet die Möbelfelder mit den vorhandenen Kacheln B/K/C/R.

## 2. Raumtypen (3D, alles prozedural: MeshToon + `toonGrad`, Detailmuster `townMat` Putz/Holz/Stein, keine Assets)
Gemeinsam: Boden (Dielen mit Brettmuster / Fliesen mit Fugen / Steinplatten), Wände mit Holz- bzw. Fliesensockel, Leisten, Putz nach oben dunkler („weiches oberes Abdunkeln“), Decke mit Balken bzw. Lichtpaneelen, Fenster mit Rahmen, Sprossen, Vorhängen und Blumentopf, Bilder (gemalt auf einer Atlas-Leinwand je Raum), Teppiche, Pflanzen, Deckenlampen. Ausgangsreihe = Brüstung mit Durchgang; dahinter ein nicht begehbarer **Vorraum** (Garderobe, Bank, Schirmständer, Pflanze, Außentür mit Tages-/Nachtlicht) – er gibt der Kamera beim Eintreten Platz.

| Typ | Räume | Design |
|---|---|---|
| Wohnhaus | haus_spieler (Mama), haus_nachbar (Oma Elowen), haus_kupfer, haus_sammler, haus_moewe1–3, huette_glut, huette_fluester | Küchenzeile (Herd mit Topf, Spüle, Anrichte mit Brot/Obst, Hängeschränke, Dunstabzug), Bücherregal (Sammler: Figuren-Vitrine), Kleiderschrank (Leuchtturmwärter: Laternen-Modell), Bett mit Decke/Kissen, Kamin mit Feuer (flackerndes Licht), Kerzen und Bild, Ohrensessel mit Stehlampe, Esstisch mit Stühlen, Läufer, Tellern, Blumen bzw. Teekanne (Oma), Kommode mit Lampe/Foto; Farben je Haus (`HSTY`: Wand, Sockel, Boden, Akzent, Teppich, Bildmotive) |
| Labor | labor (Prof. Veyran) | Laborregale (Gläser mit leuchtenden Proben, Bücher, Kristallproben, Globus), Konsole mit drei Wandbildschirmen + Tischmonitoren, Resonator (Glasröhre mit Leuchtflüssigkeit, Ringe, schwebender Kristall), Labortisch mit Mikroskop, Kolben, Kristall-Messplatz, Holo-Projektor und drei Starter-Sockeln mit Element-Leuchtring, Kristall-Analysetisch (Holo-Ringe, Kristall, Messbildschirm), Serverschrank mit LED-Reihen; Fliesenboden, Lichtpaneele |
| Laden | laden_* (Name aus `INTERIORS` auf dem Schild) | Warenregale (Kapseln, Tränke, Schachteln, Preisschilder), Theke mit Kasse, Vitrine mit Kapseln, Beerenkorb, Glocke, Seitenregal, Auslage-Pyramide, Korb; Ladenschild, Kreidetafel „Heute frisch“, Kapsel-Girlande, Pendelleuchten; Akzent je Region |
| Kreaturenstation | heil_* | siehe 4 |
| Arena | arena1 Flora, arena2 Flut, arena3 Frost, arena4 Schatten | Spielfeld mit Linien und Element-Emblem, Bühne mit großem Emblem, Element-Bannern und Feuerschalen, Tribünen (drei Stufen, Sitzkissen, Geländer, Wandbanner), sechs Element-Säulen (Flora: Pflanzen + Samenlicht, Flut: Wasserbecken + Fontäne, Frost: Eiskristalle + Eiszapfen an der Decke, Schatten: Obelisk + Mondkristall + Sternendecke), hohe Fenster mit Lichtbalken, Oberlichter, Hängelampen |
| Liga | liga (Kristallturm) | Goldener Läufer auf Marmor, Kristall-Balustrade, Ränge in den Farben des Turmrats (Morgenrot, Mittag, Abendflut, Mitternacht, Krone), Säulenreihen mit Bannern, Kristall-Kronleuchter, Kristallkrone an der Stirnwand |

Licht: Sonne kommt durch das Hauptfenster (Schattenwurf der Möbel, Richtung je Raumtyp), Lichtbalken + Fensterkreuz am Boden + Staub im Licht (nur tagsüber, abends wärmer), Hemisphäre warm; die zwei Punktlichter von 09 sitzen an den beiden Lampen nächst der Figur (Kamin flackert, nachts heller). Fensterglas tagsüber hell, nachts dunkelblau (09-`glowMesh`, `uN`).

## 3. Höhlen
Echte Höhlenkarte ist nur **Nebelgrotte** (`theme:'cave'`). Glutschlucht ist eine offene Schlucht mit Himmel (Loop C, `49-welt1.js`); Frostheim-/Schattmoor-Höhlen gibt es noch nicht. Für künftige Karten (Loop D) liegen vier Stile bereit: `MAPS[id].caveStyle` = `nebel` | `glut` | `frost` | `schatten` (sonst nach Kartenname).
- Facettierte Felsen mit Kanten statt weicher Kugeln, Höhe nach Abstand zum Weg (Rand 1,9–2,8, dahinter bis 3,9, tief drinnen bis zum Deckel), Schichtung in den Vertexfarben, Stalagmiten und Kristalle am Wandfuß.
- Felsdeckel (4,8) mit Tropfsteinen, Kristallspitzen; geschlossene Ränder (kein Blick ins Leere).
- Bodennebel in zwei Lagen (Wolkentextur von 09, driftet), blendet nahe der Kamera aus.
- Pfützen je Stil: Wasser mit Kräuseln und Spiegelglanz (Nebel), Lava mit Kruste und Glut + Lichtquellen (Glut), Eisfläche mit Glanzstreifen (Frost), Tinte mit violettem Schimmer (Schatten). Frost zusätzlich Eiszapfen.
- Ausgang am Kartenrand: Tunnel mit Tageslicht; dort darf die Kamera beim Betreten stehen.
- Licht/Nebel/Hintergrund je Stil; Kristall-/Lavalicht über die Punktlichter von 09.
- Hall: gelegentliche Wassertropfen mit Echo (DelayNode-Rückkopplung + Tiefpass), nur wenn Audio bereits läuft und Effekte an sind.

## 4. Kreaturenstation und Heil-Sequenz
- Raum: Empfangstheke (Leuchtstreifen in Stationsfarbe, Monitor, Glocke, Blumen, Prospekte), Schild „Kreaturenstation“, **Heilgerät** an der Rückwand (Bogen, sechs Kapselplätze mit Leuchtringen und Kristallkernen, Lebenstropfen-Emblem, Leuchtsäulen, zwei Statusbildschirme) mit eigenem Shader: sanftes Atmen im Ruhezustand, während der Heilung leuchten die Plätze nacheinander auf, danach Aufblitzen und Ausklingen. Medizinschränke, Wartebank mit Polstern, Lager-Terminal (Kreaturenbox-Bildschirm, Kapsel-Anschluss), Pflanzen.
- `SEQ.heal` (ersetzt, gleiche Schnittstelle und Klasse `.healOv`): Glaskarte über dem gedimmten 3D-Raum, je Team-Mitglied ein Kapselplatz mit **`cardMini`-Bild** (Canvas in Geräte-Pixeln, Elementfeld – nie gestreckt/pixelig), Name und KP-Leiste, die vom Stand vor dem Gespräch (Schnappschuss in `talk`) auf voll läuft; Töne je Platz, Glanz-Wisch, Text „Alle Kreaturen sind wieder topfit!“. Tippen beschleunigt (`seqClock`), reduzierte Bewegung ohne Animation. Dauer ≈ 1,8–2,6 s.

## 5. Kamera innen
In der innersten Stufe (`Szene.onBeforeRender`, nach 17/36/42; Änderung wird nach dem Bild zurückgenommen): Abstand 2,75 (Arena/Liga 3,2–3,4), Höhe 2,55, Blick 1,5 voraus auf Hüfthöhe → Kopf ≈ Bildmitte. Ist hinter der Figur weniger Platz, wird die Kamera etwas höher und blickt weiter voraus; unter 0,7 Abstand wird die Figur ausgeblendet. Immer: innerhalb Raum + Vorraum, unter der Decke, nicht in hohen Möbeln, nicht in Hängelampen. Wischen (36) dreht weiter um die Figur. `worldPt` nutzt innen die tatsächlich gezeigte Kamera (`R3.shown`). Höhle: gleiche Logik mit begehbaren Feldern + Tunnel als Raum.

## 6. Leistung und Speicher
- Raum: Hülle 1 Call, Möbel 1 + Umriss 1 + Schatten 1, Leuchtteile 1, Atlas beleuchtet/unbeleuchtet 2, Lichtbalken 1, Staub 1, Heilgerät 1.
- Je Raum eine Atlas-Leinwand 1024×512; eigene Geometrien/Texturen/Materialien werden beim Szenenwechsel freigegeben (`dispose`) und beim Wiederbetreten automatisch neu hochgeladen (Szene bleibt im Cache von 09). Der gemalte 09-Innenboden wird beim Aufbau sofort freigegeben.
- Messwerte: siehe Abschnitt 8.

## 7. Hooks / Berührungspunkte
| Stelle | Art |
|---|---|
| `build3d` | Hülle (51): entfernt 09-Innenkästen (`wallI/shelf/counter/box/plant`) und den gemalten Boden, baut Raum bzw. ergänzt die Höhle; ersetzt in Höhlen die weichen Wandfelsen |
| `Szene.onBeforeRender` | Accessor um die von 09 gesetzte Funktion (09 kopiert danach in `R3.shown`) |
| `draw3d` | Hülle: Kamera-Rücksetzung, GPU-Freigabe, Tropf-Hall |
| `worldPt`, `talk`, `SEQ.heal` | Neudefinition/Hülle mit gleicher Signatur |
Keine Aufrufzeile in fremden Dateien nötig.

## 8. Tests und Messwerte
`node build.mjs && node test/innen_qa.mjs` (unter der Chromium-Sperre) → `test/innen_qa.log`, Screenshots `test/innen_<raum>.png`.
**15 ✓ / 0 ✗** (860×484, SwiftShader, Stufe high, ohne Roamer):

| Ort | Draw-Calls | Dreiecke | Kopf (Anteil von oben) |
|---|---|---|---|
| Wohnhäuser (5 Varianten) | 16 | 40–42 k | 0,5–0,6 |
| Labor | 25 | 44 k | ≈ 0,5 |
| Laden / Hafenmarkt | 17 | 84 k | ≈ 0,5 |
| Kreaturenstation (Kupferhain, Frostheim) | 18 | 31 k | ≈ 0,5 |
| Arena Flora / Flut / Frost / Schatten | 18 | 53 / 31 / 30 / 31 k | ≈ 0,5 |
| Liga | 23 | 49 k | ≈ 0,5 |
| Nebelgrotte (Eingang, Mitte, Nord nachts) | 27 / 24 / 24 | 40 / 40 / 38 k | 0,53 |
| Höhlen-Stile Glut / Frost / Schatten (Testkarten) | 19 | 33–34 k | 0,53 |

- Kamera an 6 Stellen × 4 Richtungen je Raum: immer in Raum/Vorraum, unter der Decke, Kopf nie im unteren Drittel.
- Kollision = Darstellung: 486 Felder in 6 Räumen (Strahl von der Decke): jedes Möbelfeld trägt Möbel, kein freies Feld hat etwas unter 1,8 m.
- Speicher: 4 Runden Haus → Labor → Station → Grotte → Kupferhain: Geometrien/Texturen 131/57 → 146/62 → 146/62 → 146/62 (nach dem ersten Besuch aller Räume kein Wachstum); Raum-Ressourcen beim Verlassen freigegeben.
- Heil-Sequenz: 4 Kapselplätze, Bilder als Canvas in Geräte-Pixeln (68 px = 68 px Anzeige, `data-pic=ok`), Heilgerät-Plätze leuchten synchron, Ende: Team voll, Modus Welt.
- Außerdem grün: `node build.mjs && node test/smoke.mjs` „Keine Fehler.“, `unit_loopc` 17/0, `qa_lc_perf2` 3/0, `unit_story` 26/0. `dist/artifact.html` 14,19 MB.
- Screenshots: `test/innen_{haus,haus_nacht,oma,glut,kraeuter,leuchtturm,labor,laden,hafenmarkt,station,station_frost,station_nacht,heilsequenz,arena_flora,arena_flut,arena_frost,arena_schatten,liga,nebelgrotte,nebelgrotte_mitte,hoehle_glut,hoehle_frost,hoehle_schatten}.png`.

## 9. Offen
- Höhlen-Stile Glut/Frost/Schatten sind nur über Testkarten sichtbar, bis Loop D echte Höhlenkarten anlegt (`caveStyle` setzen).
- Kristalle/Fackeln auf begehbarem Höhlenboden stammen weiter aus 09 (nur umgefärbt je Stil).
- Echte Handy-Messung (Füllrate der Lichtbalken/Nebellagen) steht aus; bei Bedarf Lichtbalken auf Stufe `low` abschalten.
- Vorraum hinter der Brüstung ist reine Ansicht; wer den Ausgang (Feld E) betritt, verlässt den Raum wie bisher.
