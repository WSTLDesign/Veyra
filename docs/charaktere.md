# Charaktere „echt“ und Charakterentwicklung (Agent Charaktere, Opus hoch, 12.11.) – Ziele 5 und 6

Leitdokument: docs/ziele.md (Entscheidung des Nutzers 11:10: realistische Proportionen im Cel-Look, kein Chibi; Charakterentwicklung = Aussehen wächst mit; Qualitätsanspruch 15:17).

## Figurenbaukasten (src/38-models.js)
- **Ein Rig für alle:** `person3d(col,hat,oe)` (Name/Signatur unverändert) baut je Figur EIN `SkinnedMesh` (14 Knochen) + Umriss-Hülle = **2 Draw-Calls**; Geometrie je Aussehen gecacht (`g3('chr|…')`), Skelett je Figur.
- **Proportionen (`CHAR_BUILD`):** Kind 5,3 · klein 4,8 · Jugend 6,2 · Erwachsen 7 · alt 6,6 (Rundrücken) · kräftig 7 Kopfhöhen; Hüftgelenk bei 47 % (Kind) bis 53 % (Erwachsene) der Größe (vorher 33 %). Die Beine sind in Rig-Einheiten für alle gleich (Hüfte 0,431, Oberschenkel 0,185, Unterschenkel 0,18) – der Gang rechnet nur damit; Oberkörper, Kopf, Arme und der Weltmaßstab `k` (SkinnedMesh.scale) kommen aus dem Körperbau. Größen in der Welt: Held 1,32 · Jugend 1,52 · Erwachsene 1,55–1,72 Felder.
- **Kopf und Gesicht als Formen:** Schädel mit schmalerem Kiefer, Kinn, Hinterkopf; Augen (Augapfel, Iris, Pupille, Glanzpunkt, Oberlid mit Schwung, Unterlid), Brauen in Haarfarbe, Nase mit Spitze, Mund, Ohren, Wangen bei Kindern; Sommersprossen, Narbe, Ohrringe, Brille. Augen sind etwas größer als real (freundlich, kindgerecht), aber kein Chibi.
- **Frisuren mit Volumen:** Haarkappe mit Haaransatz je Richtung, Pony-Strähnen, Wuschel-/Wolken-Beulen; Zusatzformen: Stacheln (in Haarfarbe, Akzentfarbe als Strähnen vorn – wirkten vorher wie Hörner), lang, Pferdeschwanz, Zopf, geflochten, Dutt, Wolke; Bärte (Voll-, Kurz-, Kinn-, Schnurrbart).
- **Hände:** Ballen, vier Finger nach unten und leicht nach vorn gekrümmt, Daumen; Handschuhe in eigener Farbe.
- **Kleidung:** Oberteil mit Schulterschräge (Trapez) und rundem Deltamuskel, Brust/Taille/Hüfte, Saum mit Band, Falten-Bänder, Ellbogen- und Knie-Falten; offene Jacke mit Innenteil, Kante und Pattentaschen; Hemd/Weste/Mantel/Kittel geknöpft; Kragen, Fellkragen, Schal; Mantel, Kittel, Umhang mit Innenfutter, Saumband und Schließen; Hose mit Bund, Seitennaht, Cargo-Taschen, Shorts, Rock, Gewand; Schuhe mit Sohle, Kappe, Schaft, Schnürung, hohe Stiefel; Gürtel mit Schnalle; Requisiten (Rucksack mit Schlafrolle, Umhängetasche, Stab mit Kristall, Laterne, Buch).
- **Mantel verdeckt die Oberschenkel nicht mehr:** Oberteile enden am/über dem Hüftgelenk (tiefster Saum 0,430); nur echte lange Mäntel/Kittel reichen weiter und hängen mit gewichteten Hüft-/Oberschenkel-Knochen.
- **Material (MeshToon + toonGrad, Qualitätsanspruch 15:17):** Vertexfarben + Attribut `aKind` je Teil (0 glatt · 1 Haut · 2 Haar/Fell · 3 Leder/Holz · 4 Stoff · 5 Metall/Glas). Ein Oberflächen-Shader (`rigMat`, über `toonFx` mit Rim-Licht) rechnet die Details prozedural: Haut mit weichem Verlauf (Unterseite/Schattenseite wärmer, leicht rosig am Rand), Haar mit Strähnen und hartem Glanzband, Stoff mit Webstruktur/Fadenlauf/leichter Fleckigkeit, Leder mit Narbung, Metall mit Glanzpunkt. **Keine Texturen → keine sichtbaren Pixel aus der Nähe**; feine Muster blenden mit dem Bildschirm-Maßstab aus (`fwidth`, kein Flimmern in der Ferne), sie haften an der Ruhepose (rutschen beim Laufen nicht). Umriss: Dicke wächst mit dem Abstand (nah 28 %, ab 4,5 Feldern voll) → Nahaufnahmen ohne dicke Ränder. Kantenglättung: Renderer mit `antialias:true` (09/10, nicht geändert).
- **Aussehen-Quellen (`charLook`):** NPC-Figur (`oe.look` aus `FIGURES[id].look` über `figOutfit3d`), Spielerfigur (`oe.body` → `heroLook` inkl. Ausrüstungsstufe), alte Outfit-Objekte, Bewohner (`charGeneric`: Körperbau, Haut, Haar, Bart, Kleidung aus einem Hash der Farbe – stabil je Bewohner). Haut- und Haarfarben je Figur stehen in `src/34-figures.js`.

## Charakterentwicklung (src/53-charaktere.js) – Aussehen wächst mit
| Stufe | Name | Auslöser (aus vorhandenem Fortschritt, keine Pflicht-Felder) | sichtbar |
|---|---|---|---|
| 0 | Startkleidung | Spielbeginn, alter Spielstand ohne Medaillen | T-Shirt, Turnschuhe, Schutzbrille (Held) |
| 1 | Abenteuer-Jacke | 1. Medaille | offene Jacke mit Innenteil und Taschen, Medaillen-Plaketten auf der Brust (Farbe je Element) |
| 2 | Expeditions-Ausrüstung | 3 Medaillen oder Eisruinen (`s5_ruinen`) | Rucksack mit Schlafrolle (Heldin + Tasche), hohe Stiefel, Gürtel, Handschuhe, Halstuch (Held) |
| 3 | Medaillen-Umhang | alle 8 Medaillen oder 3. Turmhüter (`top3`) | Umhang mit Goldsaum + Schließen, alle Medaillen am Gürtel |
| 4 | Kronen-Mantel | Kristallkrone (`champion`) | heller Mantel mit Goldsaum, Kristall-Wappen, helle Stiefel/Handschuhe |
- Medaillen: `G.badges` (auch alte Namen über `MEDAL_OLD`) und Medaillen-Flags, ohne Doppelte (`charMedals`). Spielerfarben (Jacke, Haare, Haut) bleiben in jeder Stufe.
- **Wirkt überall:** 3D-Welt und Kampf (Spielfigur über `outfitSync` neu gebaut, sobald sich Stufe/Medaillen ändern: Schlüssel `charKey`), 2D-Figur/Porträt (`drawFigure` mit Plaketten/Wappen), Chronik-Seite „Dein Aussehen“ (Figur, Stufenpunkte, „Als Nächstes: …“, `src/styles-charaktere.css`), Intro = Stufe 0.
- **Hinweis „Neues Aussehen: <Stufe>!“** als Toast, einmal je Stufe. Optionales Feld `G.flags.lookStufe` (höchste gezeigte Stufe) – fehlt es (alter Spielstand), wird es still gesetzt, ohne Hinweis.

## Gang bleibt (docs/bewegung.md „Bewegungsdynamik“)
`gaitTick` rechnet mit `sc = o.scale.x · rig.k`: Füße bleiben in Weltkoordinaten gepflanzt. Wegen der längeren Beine in der Welt liegen die Gangart-Schwellen in Rig-Einheiten bei 1,0–1,6 (Gehen→Laufen) und 2,2–3,5 (Laufen→Rennen), damit Spieltempo 2,8 Laufen und 5 Rennen bleibt. `RIG.SX` 0,09 → 0,062 (Hüftgelenke anatomisch enger). `MOVE_PARAMS` (17-move.js) unverändert.

## Tests und Bilder
- `node test/charaktere_qa.mjs` (VM, ohne Browser): alle 40 Figuren bauen, Calls/Dreiecke, Kopfhöhen je Körperbau (Formel + Geometrie), Beinlänge, Größen, Saum über der Hüfte, Stufen ↔ Fortschritt, alter Stand → 0, Aussehen je Stufe, Plaketten, Neuaufbau-Schlüssel/Cache, 2D-Zeichnen, Gang (Fußgleiten, Gelenke, Gehen→Rennen, Bremsen), Sitzen.
- `node test/charaktere_vorschau.mjs [held,stufen,npc,alle,run,detail]` (Sperre!) → `test/vorschau_charaktere_1..3.png`, `test/charaktere_entwicklung.png` (+ `_2d`), `test/charaktere_nachher.png`, `test/charaktere_run.png`, `test/charaktere_detail.png`.
- `node test/charaktere_welt.mjs` (Sperre!) → `test/vorschau_charaktere_4.png` = `test/charaktere_welt.png` (Morgenau: Held + Veyran + Rayan), `test/charaktere_kampf.png` (Kampf, Held von hinten), Draw-Calls der Dorfszenen.
- `test/charaktere_diag.mjs`: qa_lc_run-Messung mit Qualität „eigene“ (60 fps). Hintergrund: `src/54-beenden.js` („PC-Notbremse“, 15:19) setzt bei Software-GL die Voreinstellung „niedrig“ mit 30 fps → im Test läuft die Hauptschleife jeden 2. Frame leer, `qa_lc_run` misst dann 2,4 statt 5 Felder/s (und Knie 0,63 im Übergangsbereich).
