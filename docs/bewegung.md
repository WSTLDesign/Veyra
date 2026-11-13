# Bewegung: Laufzyklus, versteckte Begegnungen, Feldattacken (Agent „Bewegung“, Opus hoch)

## FIELD_MOVES – endgültige Liste (verbindlich, auch für Agent „Fundstücke“ / Lehrrollen)

Definiert in `src/05-field.js` (`FIELD_MOVES`, vor 47-finds.js geladen). Feldattacken sind **eigene Attacken**; eine Kreatur **beherrscht** sie, wenn
1. **von selbst gelernt:** ihre Art hat einen Lern-Typ und sie hat die Lernstufe `lv` erreicht (17-move.js trägt sie dann in `m.known` ein und zeigt „… hat Rankenschnitt gelernt! (Feldattacke)“), oder
2. **per Lehrrolle:** Item `rolle_<id>` (47-finds.js lehrt sie als Attacke → `m.moves`/`m.known` enthält die ID; Alternative für andere Module: `fieldTeach(mon,id)` → `true`/`false`). Rollen wirken auf jede Art mit passendem Lern-Typ, stufenunabhängig.

| ID | Name im Spiel | Lern-Typen | ab Lv | Zweck in der Welt | Zusatz-Erlaubnis (Orden) |
|---|---|---|---|---|---|
| `rankenschnitt` | Rankenschnitt | flora, boe, glut | 5 | Dornenhecke `D`, umgestürzter Baumstamm/Astwerk `Y` räumen | – |
| `felsschub` | Felsschub | fels, kern | 10 | Geröll `G` zertrümmern, Felsbrocken `U` ein Feld schieben | – |
| `eisbruecke` | Eisbrücke | frost | 12 | offenes Wasser `Q` zu Eis gefrieren | – |
| `leuchtfeuer` | Leuchtfeuer | lumen, glut, volt | 6 | dunkle Höhlen erhellen (`hasField('lumen')`, Funde mit `needLit`) | – |
| `wellenritt` | Wellenritt | flut | 14 | schwimmen (Partner trägt dich) | Flutmedaille (2 Medaillen) |
| `sturmfluegel` | Sturmflügel | boe | 14 | von Kanten gleiten | Frostmedaille (3 Medaillen) |
| `kletterkralle` | Kletterkralle | fels, schatten | 18 | Felswände `X` erklettern | Schattenmedaille (4 Medaillen) |

**Reiten ist entfernt** (Nutzer 12.11., Ziel 8 – siehe Abschnitt „Bewegungsdynamik“ unten).
**Medaillen-Regel:** Medaille UND Kreatur mit Feldattacke im Team („Mit der Flutmedaille darf dein Partner dich übers Wasser tragen – wenn er Wellenritt kann.“). Alte Flags `G.flags.swim/glide/climb` gelten weiter als Medaillen-Erlaubnis; `G.flags.ride`/`rideTip` bleiben in alten Ständen stehen (nicht umbenannt/gelöscht) und werden ignoriert. Keine Datenmigration nötig (`m.known` fehlt = leer).
**Begleiter:** beim Schwimmen/Gleiten ist der Begleiter automatisch die Kreatur, die es kann (`carrierMon()` → `compMon()` in 04-roam.js), danach wieder die Team-Spitze.

### Wo finden Spieler die Arten? (`node tools/balance.mjs`, Abschnitt „Bewegung“)
| Fähigkeit | Starter | früheste wilde Arten |
|---|---|---|
| Rankenschnitt | Funki, Knospi | Flausch, Pusti (Route 1) |
| Felsschub | – | Flausch, Knabbi (Route 1), Knackel, Kiesel (Route 2) |
| Eisbrücke | – | Glazirr (Route 1 nachts), Frosti (Nebelgrotte) |
| Leuchtfeuer | Funki | Blinki (Route 1), Knips (Route 2) |
| Wellenritt | Plippi | Muschel (Route 3), Plippi/Perlo (Windküste) – vor dem 2. Orden |
| Sturmflügel | – | Flausch, Pusti (Route 1) |
| Kletterkralle | – | Knackel, Kiesel (Route 2), Zischi (Route 3) |

### Hindernisse (05-field.js)
- `D` Dornenhecke, **`Y` umgestürzter Baumstamm/Astwerk** (neu) → Rankenschnitt · `G` Geröll, **`U` Felsbrocken** (neu, schiebbar: steht man davor und drückt A, rutscht er ein Feld in Blickrichtung; nicht auf Wände/Türen/Figuren/Fundorte; sonst „Dahinter ist kein Platz – von einer anderen Seite schieben!“) → Felsschub · `Q` → Eisbrücke · Dunkelheit (Höhle) → Leuchtfeuer.
- Kind-Hinweis ohne Attacke: „Hier bräuchte ich Rankenschnitt. Das lernen Kreaturen vom Typ Flora, Böe, Glut ab Level 5 – zum Beispiel Flausch oder Pusti. Oder mit einer Rolle „Rankenschnitt“.“
- Änderungen bleiben über `G.mods` im Spielstand (auch der verschobene Felsbrocken). 2D zeichnet `Y`/`U` als Überlagerung (fieldFx2D), 3D baut Stamm/Fels in fieldDecor (verschmolzen).
- **Neue Sperren** (nur Abzweige mit Funden, per Min-Schnitt bestimmt; Test prüft, dass Ausgänge, Türen und Figuren erreichbar bleiben): route1 (17,1) `Y` · kupferhain (2,1) `Y` · route2 (16,3) `U` (von oben schieben) · route3 (4,15) `G` · frostheim (2,1) `G` · route4 (17,10) `Y` · schattmoor (2,1) `G` · windkueste (17,13) `Y` · siegesstrasse (17,15) `G`, jeweils mit 1–2 Bäumen `T` als Wand. Flüstertal bewusst nicht (Fund-Ecke grenzt an den Story-Ort von Nymera).
- Nebenmission „Wege der Kreaturen“: Text auf Feldattacken umgestellt, Belohnung unverändert (3 Einsätze).

## Laufzyklus (38-models.js, Aufruf in 09-three3d.js) – Stand 10.11., Boden-Gang am 12.11. neu gebaut (s. „Bewegungsdynamik“)
- **Rig:** `person3d()` (gleicher Name/Signatur) baut jetzt EIN `SkinnedMesh` mit 14 Knochen (Hüfte, Brust, Kopf, je Bein Ober-/Unterschenkel/Fuß, je Arm Ober-/Unterarm) + Umriss-Hülle (Skinning) = **2 Draw-Calls statt 4** (2 Beine + Körper + Umriss), Schattenpass 1 statt 3. Gleiche Silhouette/Farben, Outfit-Felder (`oe`: Haut, Hose, Haar lang/zopf/dutt/wuschel, Mütze) bleiben; neu sichtbar: Arme mit Ärmel, Ellbogen, Unterarm, Hand. Geometrie je Outfit gecacht, Skelett je Figur. Rückfall auf das alte Modell ohne `THREE.SkinnedMesh`. `userData.legs` = Oberschenkel-Knochen (Kompatibilität).
- **Gang (`gaitTick(o,dt,opt)`):** Phase wächst mit dem tatsächlich gelaufenen Weg (`Δφ = Weg / Schrittlänge`) → Schrittlänge × Frequenz = Verschiebung. Standfuß wird beim Aufsetzen in Weltkoordinaten **gepflanzt** und bleibt stehen (Ferse setzt mit Spitze hoch auf → Fuß flach → Ferse hebt, Ballen bleibt stehen → Abstoß); Schwungfuß fliegt zum vorhergesagten Aufsetzpunkt (Hubbogen, Zehen erst unten, dann hoch). 2-Knochen-IK je Bein (Knie-Knick nach vorn, Bein-Rollwinkel), Hüfte senkt sich, wenn der vordere Fuß sonst nicht reicht; Standfuß behält seine Gierrichtung.
- **Parameter:** Stand-Anteil 0,60 (Gehen) → 0,32 (Laufen) → 0,25 (Sprint, Flugphase); Schrittlänge `min(0,36 + 0,27 v − 0,011 v², 2·e_max/β)` (0,50 bei 0,9 · 0,52 bei 1,8 · 1,22 bei 3,75 · 1,60 bei 7,5 Feldern/s); Hüft-Bob (Gehen hoch in Standmitte, Rennen tief), Seitschwung, Becken-Drehung ±0,12–0,17 rad mit Schulter-Gegendrehung ×1,6, Kopf hält die Blickrichtung; Armschwung gegengleich (Amplitude 0,62 → 1,0 rad), Ellbogen 0,32 → 1,45 rad (≈ 90° beim Rennen); Lean 0,05 → 0,2 rad + Sprint + Beschleunigung (Anlaufen vor, Bremsen zurück); Übergänge über Gewichte mit τ = 0,18 s; Stehenbleiben = Ausgleichsschritt zur Grundstellung; Idle: Atmen (Brust/Arme), Gewichtsverlagerung (Hüfte seitlich + Beckenkippung, Füße bleiben), langsames Umschauen.
- **Posen:** `sit` (Schwimmen/Gleiten auf dem Partner; beim Gleiten Arme ausgebreitet), `climb`, `air` (Kantensprung), weich überblendet; Rückkehr auf den Boden 0,22 s. `gaitModeP()` (17-move.js) wählt sie aus `P.state`.
- **Ego-Sicht:** Kamera-Bob und Seitschwung an die Gangphase gekoppelt (hoch in der Standmitte, einmal je Doppelschritt seitlich).
- **NPC/Rivalen/Bewohner:** gleicher `person3d` → gleiches Rig; Bewohner laufen mit `gaitTick` (Geschwindigkeit aus der Positionsänderung), stehende Figuren atmen (nur bis 16 Felder Abstand).
- **Wurf:** `figAnim(o,'wurf')` (Aufruf existierte schon in 36-input.js) – rechter Arm holt aus und wirft.

### Messwerte
| | Gleiten Standfuß max je Frame (Ziel < 0,02) |
|---|---|
| unit_walk (Knochen, 60 fps): Gehen 0,9 / 1,8 · Laufen 3,75 · Rennen 7,5 | 0,0010 / 0,0021 · 0,0031 · 0,0054 |
| unit_walk: Anlaufen/Abbremsen + Kurve 1,2 rad/s | 0,0073 |
| im Spiel (test/encounter_shots.mjs, freeMove + draw3d, 60 fps): gehen / laufen / rennen / Kurve | 0,0030 / 0,0038 / 0,0032 / 0,0050 |
Bildfolgen: `test/walk_cycle_0..7.png` (8 Phasen bei 1,8 Feldern/s, links seitlich, rechts schräg), `test/walk_run_sheet.png` (Gehen 1,2/1,8, Laufen 3,75, Rennen 7,5, Anlaufen→Bremsen, Idle), `test/walk_ingame.png`.

## Versteckte Begegnungen (17-move.js, Hook `moveEncounter` aus 03-engine onStep)
- **Hohes Gras (`"` und `:`):** zusätzlich zu den sichtbaren Kreaturen (04-roam bleibt unverändert). **Einziges Gras-System** (QA Mechanik B1, 11.11.): der frühere Schritt-Hook `grassAmbush` (14-battle.js) ist entfernt; `grassAmbush(x,y)` bleibt nur für direkte Aufrufe und hält `encReady()` ein (Schonzeit + Abstand). Chance je Schritt 6 % (leicht, `DF().enc` 0,6) bis 9 % (normal); Rennen ×1,25; mind. 4 Schritte Abstand; 3 s Schonzeit nach jedem Kampf (`startBattle` merkt sich den Kampf); nur bei `mode==='world'` (nie in Dialog/Menü/Gleitflug). Gemessen (leicht, 20 000 Schritte): 5,2 % effektiv.
- **Vorwarnung 0,7 s:** Figur bleibt stehen (`mode='wait'`), Gras vor ihr wackelt (pulsierender Gras-Druckpunkt im Shader), grüne Puffs + Staub, prozedurales Rascheln (`sfx('rustle')`, 11-fx.js), Vibration; dann Kampf. 2D: schwankende Halme + Puffs.
- **Arten:** `cur.enc.day/night`; seltene Arten bevorzugt (Gewicht je Art √Einträge × 1,7 bei Fangrate ≤ 60, × 1,3 bei ≤ 120).
- **Schwimmen:** 5–7 % je Schwimmschritt, Vorwarnung 0,85 s (Blubberblasen, Ringe, `sfx('bubble')`), Arten `cur.enc.water` → Flut-Arten der Karte → Flut-Arten aller Routen (Level nach Orden).
- **Angeln:** A vor offenem Wasser (`~`, nicht beim Schwimmen; Figuren/Felder haben Vorrang) → „Du wirfst die Angel aus …“, 1–3 s warten (Schwimmer-Ringe) → „Es zappelt! Schnell tippen!“ (Spritzer, Ton, Vibration) → Tippen/Taste innerhalb 1,4 s = Kampf mit Art aus `cur.enc.fish` (sonst wie Schwimmen); zu spät „Weg war's.“, zu früh „Zu früh gezogen …“. Eine Angel-Funktion gab es vorher nicht – sie braucht kein Item.
- **Tests/Demo:** bei `navigator.webdriver===true` oder `VEYRA_DEMO` sind die zufälligen Gras-/Schwimm-Begegnungen aus (planbare Abläufe), `window.VEYRA_ENC=1` schaltet sie ein. Angeln bleibt.
- Prof-Text „Schwäche wilde Kreaturen im hohen Gras …“ passt wieder.

## Tests
- `node test/unit_walk.mjs` (17): Rig, Gleiten je Tempo/Kurve (Spieltempi 0,9/1,4/2,8/5), Schrittzahl = 2·Weg/Schrittlänge, Knie, Arme, Lean, Übergänge, Idle, Ausgleichsschritt, Sitz-Pose, Wurf (echtes three.js in der VM).
- `node test/unit_encounter.mjs` (15): Raten, Vorwarnung, Abstand, Schonzeit, Dialog, seltene Arten, Nacht, Schwimmen, Angeln (Treffer/zu spät/zu früh, Angel-Liste).
- `node test/unit_fieldmoves.mjs` (13): Reiten entfernt, Schwimmen/Gleiten/Klettern mit Orden + Attacke, Migration alter Flags, Lernen, Baumstamm, Felsbrocken, Leuchtfeuer, Erreichbarkeit aller Ausgänge/Türen/Figuren, Lern-Art vor jeder Sperre, früh fangbare Arten.
- Bilder: `node test/walk_shots.mjs`, `node test/encounter_shots.mjs` (`test/encounter_rustle.png`, `test/walk_ingame.png`, Gleit-Messung im Spiel).
- `test/smoke.mjs` Schritt „Schwimmen & Rückkehr (2D)“: gibt dem Team jetzt eine Kreatur mit Wellenritt (Plippi Lv 16) und nimmt sie danach wieder heraus – die alte Regel „jeder Partner schwimmt“ gilt laut Nutzerwunsch nicht mehr.

## Bewegungsdynamik (Agent Bewegungsdynamik, Opus hoch, 12.11.) – Ziele 7 und 8

### Reiten entfernt (Ziel 8)
- **17-move.js:** `MOVE_PARAMS.ride`, `MV.ride`, `MOUNT_ST.ride`, `canCarry`, `rideMon`, `rideOK`, `toggleRide`, `syncRideBtn`, Taste R, `#rideBtn`-Listener, Reit-Tipp (`F.rideTip`), automatisches `F.ride=1`, Reit-Zweige in `carrierMon`/`moveMon`/`moveUnlocked`/`landState`/`setMoveState`/`encChance` (×0,5), Staub-Effekt, 2D-Reit-Wippen und 3D-Sitzhöhe beim Reiten entfernt. `MOUNT_ST={swim,glide}` – Schwimmen/Gleiten/Klettern unverändert.
- **Alte Stände:** `moveResolve`/`moveReset` setzen einen unbekannten Zustand (z. B. `P.state==='ride'`) auf `'walk'`; `G.flags.ride`/`rideTip` bleiben unangetastet und wirken nicht mehr. Keine Migration nötig (P wird nicht gespeichert).
- **Weitere Stellen (nur Reit-Zeilen):** `src/36-input.js` (Knopf `.in-ride`, CSS, `bind`, `syncBtns`), `src/15-ui.js` (`rideTick` + Aufruf), `src/styles.css` (`#rideBtn`-Regeln, Kommentar), `src/shell.html` (Knopf `#rideBtn`), `src/04-roam.js` (Kommentar `compMon`), `tools/balance.mjs` (Zeile „Huckepack/Reiten“). In 05-field.js und 27-story.js gab es keine Reit-Stellen.
- **Tests angepasst:** `test/smoke.mjs` Schritt „Reiten umschalten“ → „Reiten entfernt (Knopf, Taste R, Zustand)“ (weiter 22 Schritte), `test/unit_fieldmoves.mjs` (Reit-Tests → „Reiten entfernt“, Migration ohne `rideOK`), `test/unit_encounter.mjs` (Alt-Zustand ride = Gehen), `test/qa_mech_walk.mjs` (Pose „sitzen“ statt „reiten“).

### Gang und Lauf neu (Ziel 7) – `src/38-models.js` gaitTick (Boden), `src/17-move.js`
**Warum es „unreal“ aussah:** Die Figur hat nur 0,37 Beinlänge (Hüfte 0,43 bei 1,32 Größe). Gehen-Taste 3,75 und Rennen 7,5 Felder/s ließen sich mit stehendem Fuß nur mit 6 bzw. 9,4 Schritten/s darstellen (Mensch: 2–3, Sprint 4,5) – das Bein „zappelte“, die Standphase dauerte 3 Frames; dazu drehte das Becken falsch herum (Hüfte des vorderen Beins zurück) und die Schultern damit mit statt gegen das Bein.
- **Tempo (17-move):** Gehen-Taste/voller Stick **2,8** (= 2D-Takt 360 ms, lockerer Trab), Rennen **5** (≈ 3,8 Körperlängen/s, flottes Rennen), Anlauf `accel` 4,5, Bremsen τ ≈ 0,14 s (vorher 0,1 s). Halber Stick gibt echtes Gehen (≤ 1,45). `AGENTS.md` nennt noch „Laufen ≈ 3,75“ – Dirigent bitte nachziehen.
- **Gangarten über das Tempo weich überblendet** (`rw` Gehen→Laufen 1,45–2,3, `sp` Laufen→Rennen 3,2–5,2, τ 0,2 s): Doppelschritt Gehen 0,32+0,24 v (≤ 0,6), Laufen 0,40+0,32 v (2,8 → 1,30, 5 → 2,0); Stand-Anteil Gehen 0,6, Laufen = Kontaktweg/S (0,26 bzw. 0,22) → **Flugphase**.
- **Fußkontakt:** Standfuß in der Welt gepflanzt; Fuß rollt Ferse → flach → Ballen ab (Fersenaufsatz + Abdruck addieren sich stetig); reicht das Bein nicht, hebt die Ferse (Ballen bleibt stehen); nur ein hinterer Fuß darf vorzeitig abheben.
- **Schwungbein:** Hermite-Bahn im Körperrahmen vom Abhebe- zum Aufsetzpunkt: zuerst weiter nach hinten/oben (Anfersen), dann Kniehub nach vorn, kurz vor dem Aufsetzen leichtes Zurückziehen; Fußhub 0,045 (Gehen) bis 0,15 (Rennen); Spitze hoch vor dem Fersenaufsatz (Gehen) bzw. Mittelfuß (Laufen); Boden unter dem Schwungfuß weich vom Abhebe- zum vorausberechneten Aufsetzpunkt (Gelände); Ratengrenze 21 rad/s im frühen Schwung (Abstoß-Streckung weich), Mindesttempo beim Bremsen (kein hängender Fuß).
- **Hüfte:** Gehen höchster Punkt in der Standmitte, Laufen tiefster (Einfedern) + Flug; Hüfte nie höher, als die Standbeine reichen (inkl. Seitschwung/Kippung/Drehung des Beckens), senkt sich schon vor dem Aufsetzen (Laufen: Knie beim Aufsetzen ≈ 25° gebeugt → weiche Landung); Ratengrenze 0,012 hoch / 0,028 runter je Frame; Gelände vorausschauend geglättet (τ 35 ms, halber Blick 0,35 voraus).
- **Oberkörper:** Becken dreht **mit** dem vorderen Bein (±0,11–0,13), Schultern gegen (×1,7), Becken senkt sich auf der Schwungseite, Seitschwung über das Standbein; Vorneigung ab den Knöcheln (Becken 40 %, Wirbelsäule 75 %): Gehen 0,035, Laufen 0,11, Rennen ≈ 0,24 rad, Anlaufen +, Bremsen − (richtet sich auf); Kopf gleicht Neigung/Drehung/Kippung aus und schaut 0,12 × Drehrate in die Kurve.
- **Arme:** gegengleich zum Bein derselben Seite (vorn, wenn das Bein hinten abdrückt), Amplitude 0,14–0,42 (Gehen) → 0,5–0,92 (Laufen/Rennen), Ellbogen 0,22 → 1,2–1,5 rad, vorn stärker gebeugt und leicht zur Körpermitte.
- **Anhalten:** Bremsfuß setzt weiter vorn auf (Ausfallschritt), Hüfte federt ein, Oberkörper richtet sich auf, dann Ausgleichsschritte in die Grundstellung; ein Fuß, der beim Bremsen früh aufsetzt, hebt erst nach der nächsten Standphase wieder ab. **Idle:** Atmen, Gewichtsverlagerung (Standbein gestreckt, Spielbein locker), Umschauen.
- **Kurven:** 17-move `P.lean` = Tempo × Drehrate × 0,028 (≤ 0,22 rad) jetzt auch beim Gehen; gaitTick rechnet die Rollneigung der Figur (`o.rotation.z`) in die Bein-IK ein → Füße bleiben am Boden.
- **Parameter:** `GAIT` in 38-models.js (ersetzt `GAIT_RUN`, `GAIT_X`, `GAIT_SOFT`, `gaitSoft`). Alte Experiment-Skripte `test/loopc_gait_exp.mjs` und `test/qa_gp1_gait.mjs` setzen noch die alten Objekte und sind damit überholt.
- **Figuren aus GLB?** Nein – Spieler/NPC sind das prozedurale 14-Knochen-Rig (`person3d`); Hüfte, Knie, Fuß, Schulter, Ellbogen, Wirbelsäule, Kopf werden direkt angesteuert. GLB gibt es nur für Kreaturen (`MON_RENDER='model'`, nicht Standard).

### Messwerte vorher → nachher (60 fps)
| | vorher | nachher |
|---|---|---|
| Rennen im Spiel: Tempo · Schritte/s · Standphase | 7,5 · 9,4 · 3,1 Frames | 5,0 · 4,9 · 5,1 Frames |
| Gehen-Taste: Tempo · Schritte/s | 3,75 · 6,1 | 2,8 · 4,4 |
| Gelenksprung Rennen im Spiel eben / Gelände (`qa_lc_run`) | 0,65 / 0,72 (QA-Erstmessung 0,80 / 1,06) | 0,44 / 0,50 |
| Knie je Frame eben / Gelände | 0,49 / 0,54 | 0,44 / 0,50 |
| Gehen→Rennen · Bremsen (`qa_mech_walk`, Spieltempi) | 0,84 · 0,63 | 0,51 · 0,46 |
| Fußgleiten Standfuß (Drehpunkt) | 0,008 | 0,0013 |
| Becken-/Schulterdrehung | Becken gegen das vordere Bein (falsch) | Becken mit, Schultern gegen |
| Kopf-Nicken/-Gieren beim Rennen | – | 0,005 / 0,017 rad |

### Tests
- `node test/bewegung_qa.mjs` (Sperre!, ≈ 3 min, 21 Prüfungen): Reiten weg (Knopf, Funktionen, Taste R, alter Stand mit Reit-Flags + Zustand ride → walk), Gleiten < 0,03, Knie ≤ 0,6, Gelenke ≤ 0,77, Kadenz, Flugphase, Bob, Lean, Armschwung, Gehen→Rennen, Bremsen, Ausfallschritt, Kurve mit Neigung, Gelände (Wellen ±0,18), Kopf, Idle, im Spiel (Route 1, gefälschte `performance.now`). Bilder: `test/bewegung_run_seite.png`, `test/bewegung_run_hinten.png` (Rennen 5, je 8 Bilder über einen Doppelschritt), `test/bewegung_jog_*.png` (2,8), `test/bewegung_walk_*.png` (1,2). Log `test/bewegung_qa.log`.
- `node test/bewegung_shots.mjs [v] [name]` – nur Bildreihen; `test/bewegung_lib.mjs` – Gang-Simulation ohne Browser (`SIMG`).
- Angepasst (begründet in den Dateien): `unit_walk` (Spieltempi 0,9/1,4/2,8/5; Gleiten am Drehpunkt; Abheben Laufen/Rennen ≤ 0,4), `qa_mech_walk` (Gehen 1,4, Profil bis 5, Gleiten am Drehpunkt), `qa_lc_run` (Gleiten am Drehpunkt), `unit_loopc` (prüft `GAIT` statt `GAIT_RUN`).
- **Offen:** Die Figur bleibt eine Kurzbein-Figur (Hüfte bei 33 % der Größe); noch glaubhafter würde es mit längeren Beinen/sichtbaren Oberschenkeln (Ziel 5 „Charaktere echt“, Mantel verdeckt die Hüfte). Sehr hartes Bremsen (5 → 0 linear in 0,5 s) erzeugt beim Aufsetzen einen Fußsprung bis 0,88 rad/Frame (Spiel bremst weicher: 0,46).

## Übergänge & Bewegung (Agent Übergänge & Bewegung, Opus 5.5 hoch, 12.11. abends) – Details: docs/uebergaenge.md
- **Rennen 5 Felder/s ist Standard** (offene Entscheidung „5 statt 7,5“ umgesetzt): Konstanten `WALK_SPEED=2.8`, `RUN_SPEED=5` oben in 17-move.js – ein Wert zum Ändern.
- Anfahren/Bremsen mit begrenzter Beschleunigung (`MOVE_ACC`): Start-Ruck 14,9/21,2 → 8/9 F/s², Bremsweg Rennen 0,62 → 0,75 Feld (weich, mit Ausfallschritt).
- Wirksame Stick-Totzone > 33 % → 22 % (kleines Anfahrtempo wurde vorher jedes Bild auf 0 gesetzt).
- Ecken-Gleiten an Tür-/Baumkanten, Wand-Gleiten ohne Zittern, Anstoß-Geräusch nur beim echten Stehenbleiben; frontal an der Wand sinkt das Tempo auf das tatsächlich Gelaufene (Gang/Neigung passen).
- Kamera zieht beim Laufen mit dem Stick gemächlich hinter die Figur (36-input `CAMF`, nur bei < 40° Abweichung).
- Tür-/Rand-Auslösezonen (`PORTAL`, `portalTick`, Sperre nach Ankunft `portalArm`) – Test `node test/uebergaenge_qa.mjs`.
