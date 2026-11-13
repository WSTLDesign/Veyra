# Übergänge & Bewegung (Agent „Übergänge & Bewegung“, Opus 5.5 hoch, 12.11.2026)

Nutzer-Feedback 16:53: (1) Gehen/Rennen „noch nicht so gut“, (2) Türen/Gebietswechsel „sehr wackelig“ (erste Höhle erst nach 3–4 Anläufen), (3) Ladebildschirm bei Gebietswechseln, aber **nie** bei Häusern/Innenräumen.

Dateien: `src/17-move.js` (Auslösezonen, Ecken-Gleiten, Anfahren/Bremsen, Totzone), `src/36-input.js` (Kamera zieht beim Laufen nach), `src/55-laden.js` + `src/styles-laden.css` (neu: Ladebildschirm), `test/uebergaenge_qa.mjs` (neu). Keine fremde Datei geändert (alles über Hüllen mit gleicher Signatur: `transit`, `mapCard`, `hyPlaceShow`, `draw3d`, `startBattle`).

## 1. Ursachen der wackeligen Übergänge (3D-Freilauf)
| Ursache | Fundstelle (vorher) | Wirkung |
|---|---|---|
| Tür/Höhleneingang löst nur aus, wenn die **gerundete** Position die Türkachel erreicht (`onStep` bei Wechsel von `Math.round(P.px/py)`) | `17-move.js freeMove` → `03-engine.js onStep` | Figur muss den Kachelmittelpunkt ±0,5 treffen |
| Kollision prüft vier Ecken bei ±0,27; Nachbarkacheln einer Tür sind Hauswand (`h/P/L/M/A`) bzw. Fels `X` | `freeMove` → `free()` | Mehr als **0,23 Feld** seitlich versetzt → die Ecke stößt an die Wand, die Figur bleibt davor stehen („abprallen“, kein Weiterrutschen) |
| Kartenränder: Lücke zwischen Bäumen, Auslösen erst bei `ny < −0,2` (hinter dem Rand) | `edgeOut` | Wer neben der Mitte der 2er-Lücke läuft, hängt an der Baumecke und erreicht den Rand nie |
| Ankunft am Kartenrand genau auf der Randkachel | `03 tryMove` → `loadMap(to, x, h−1)` | Schon 0,2 Feld zurück löst den Rückweg aus (Hin-und-her-Gefahr) |
| Wirksame Stick-Totzone ≈ 35 % statt 20 %: kleines Anfahrtempo (< 0,08) wurde jedes Bild auf 0 gesetzt | `freeMove` (`P.walk=|P.v|>.08 … P.v=0`) | Vorsichtiges Schieben bewegt die Figur gar nicht |

2D (versteckter Modus) ist kachelgenau und war zuverlässig – bleibt unverändert.

## 2. Lösung
- **Auslösezonen statt Einzelkachel** (`PORTAL` in 17-move): je Tür/Ausgang (`E`, `@out`, Ziffern-Tür) eine Zone vor der Öffnung (Tiefe 0,95 Feld ab Türmitte, Breite ±0,76), je Kartenrand mit Verbindung eine Zone je offener Randkachel (Tiefe 0,8). Auslösen beim Hineinlaufen: Stick nach vorn (Wunschtempo ≥ 0,4) und Blick ≤ ≈ 70° zur Öffnung – also auch schräg. Rückkehrpunkt = Feld, von dem aus man hineinging.
- **Ecken-Gleiten**: stößt nur eine Ecke an (Türrahmen, Baumkante, Hausecke), rutscht die Figur seitlich (bis 0,48 Feld, mit Lauftempo) in die Öffnung, statt hängen zu bleiben. Anstoß-Geräusch nur noch, wenn die Figur wirklich steht.
- **Sperre nach Ankunft**: `moveReset` (jede Ankunft) macht alle Zonen „unscharf“; scharf erst, wenn die Figur außerhalb aller Zonen steht und ≥ 0,35 s vergangen sind (spätestens nach 1,5 s). Auch der alte Kartenrand-Auslöser (`edgeOut`) wartet darauf. Zusätzlich gibt der Wechsel (`mode='wait'`) den Stick frei → kein ungewolltes Zurücklaufen.
- **Ankunft außerhalb der Gegenzone**: Türen setzen wie bisher auf das Feld vor der Tür (= 1,0 Feld ab Türmitte, außerhalb der 0,95-Zone); Kartenränder (3D) eine Kachel nach innen (`ldArrive` in 55).
- Gesperrte Ausgänge (Gate-Hinweis) erscheinen einmal je Anlauf, nicht in Dauerschleife.

## 3. Ladebildschirm – Regel
**Ladebildschirm, wenn Start UND Ziel Außenkarten (`MAPS`) sind und sich unterscheiden** (Route ↔ Stadt, Höhle/Sondergebiet wie Nebelgrotte, Wechsel zwischen großen Außenkarten).
**Nie**, wenn Start oder Ziel ein Innenraum ist: `INTERIORS[id]` bzw. Karte mit `inside` / `theme:'inside'` (Häuser, Läden, Labor, Kreaturenstation, Arenen, Liga) – dort bleibt die kurze Tür-Blende (`SEQ.doorFade`, 0,3 s). Funktion: `ldNeeds(from,to)` in `src/55-laden.js`. Schnellreise/Fähre behalten ihre eigenen Sequenzen; direkte `loadMap`-Aufrufe (Story, Fortsetzen) zeigen keinen.

Ablauf (`ldRun`): Eingabe sperren (`mode='wait'`, Stick/Taste frei) → weiche Abblende 240 ms → Ladebildschirm (Ortsbild `ort_/stadt_/place_<karte>` als Hintergrund mit langsamer Kamerafahrt, Region + Gebietsname in Display-Schrift mit Signatur-Linie, laufende Pfotenspur, Fortschrittsleiste, kurzer Tipp) → `fn()` (Karte laden, 30 %) → Bild 1: `draw3d` baut die Szene (`build3d`, Geometrie/Texturen/Himmel, 70 %) → Bild 2: erstes Rendern (Shader/Texturen hochladen, 90 %) → Ortsbild dekodiert → mindestens 650 ms voll sichtbar, sonst so kurz wie nötig → weiche Aufblende 320 ms → Eingabe frei → Gebietsschild (`mapCard`, verzögert). Während der Bildschirm deckt, zeichnet die Hauptschleife die Welt nicht (spart Rechenzeit fürs Aufbauen). Das 1,5-s-Ortsstandbild aus 45-hybrid entfällt bei diesen Wechseln (das Bild steckt im Ladebildschirm).
Optik: Tokens aus `styles.css` (`--sig-line`, `--font-display`, `--ease-*`, `--r-pill`), Vollbild, Safe Areas, Hoch- und Querformat, nur transform/opacity animiert (läuft auch während des Aufbaus), reduzierte Bewegung: ohne Animation, 350 ms. Neuer Übergang während des Ladens beendet den alten sofort (ausstehendes Laden wird noch ausgeführt). Test-Hook `window.LADEN` (`log[{from,to,shown,ms}]`), Zeiten in `window.LD_MS`.

## 4. Gehen & Rennen
- Tempo-Konstanten `WALK_SPEED=2.8`, `RUN_SPEED=5` (17-move). **Rennen 5 statt 7,5 ist Standard**: bei 0,37 Beinlänge ergibt 7,5 Felder/s 9,4 Schritte/s („Zappeln“), 5 ergibt 4,9 Schritte/s mit Flugphase – deutlich schneller als Gehen (×1,8), für ein Kind noch steuerbar (Bremsweg 0,75 Feld). Änderbar an einer Stelle.
- Anfahren/Bremsen mit begrenzter Beschleunigung (`MOVE_ACC`: 8 bzw. 9 F/s² anfahren, 20 bremsen): kein Ruck beim Losgehen, Ausfallschritt beim Anhalten bleibt (Gang in 38-models richtet sich nach dem tatsächlichen Weg → kein Fußrutschen).
- Totzone: Figur startet ab der Stick-Totzone (20 % Auslenkung, ≈ 11 px) statt erst ab ≈ 35 %.
- Wände: schräg gegen eine Wand gleitet die Figur entlang (Tempo = Tangentialanteil, kein Zittern); frontal sinkt das Lauftempo auf das tatsächlich Gelaufene (kein „Rennen auf der Stelle“, Lean/Gang passen).
- Kamera (36-input `CAMF`): läuft die Figur grob nach vorn (< 40° zur Kamera), zieht die Kamera mit 0,7/s gemächlich hinter sie; seitliches Laufen bleibt seitlich (kein Kreisen). Wischen/Doppeltipp unverändert.

## 5. Messwerte (test/uebergaenge_qa.mjs, 860×484, fester 1/60-s-Takt über echte Zeiger-Eingaben)
| | vorher | nachher |
|---|---|---|
| Anläufe beim ersten Versuch (14 Übergänge × 2 Richtungen, Versatz 0,36 an Türen, 0,8–1,3 an Rändern) | **16/28** (alle Kartenränder mit Versatz scheitern; Türen nur dank genau geplanter Linie) | **28/28** |
| Ladebildschirm bei Gebietswechsel / bei Innenraum | – / – | ja (11/11) / nie (12 Innenraum-Wechsel: Blende) |
| 2D-Modus (Taste gehalten): Haus, Rand, Höhle | 4/4 | 4/4, Ladebildschirm nur bei Rand/Höhle |
| Gehen / Rennen (Felder/s) | 2,76 / 5,0 | 2,76 / 5,0 |
| Anfahren: Start-Beschleunigung Gehen / Rennen (F/s²) | 14,9 / 21,2 (Ruck) | 8 / 9 |
| Zeit bis 90 % Tempo Gehen / Rennen | 0,37 / 0,50 s | 0,43 / 0,63 s |
| Bremsweg Gehen / Rennen | 0,34 / 0,62 Feld | 0,34 / 0,75 Feld |
| Drehen 90° / 180° aus dem Stand | 0,28 / 0,52 s | unverändert |
| Kamera beim Laufen mit 25° schrägem Stick | dreht nicht mit | zieht nach (0,56 rad in 6 s) |
| Wirksame Totzone | > 18 px (> 33 %) | 12 px (22 %) |
| Baumkante mit 0,38 Versatz | hängt fest | rutscht vorbei (1,3 s) |
| Wand schräg 45°: Gleitweg in 1,6 s / Zittern / Anstoß-Geräusche | 3,02 Feld / 0 / 2 | 2,92 Feld / 0 / 0 |
Ladezeiten unter SwiftShader (≈ 2 Bilder/s im Container) sind nicht aussagekräftig (gemessen 2,8–4,4 s gesamt); der Bildschirm ist mindestens 0,65 s voll sichtbar, auf dem Gerät gesamt ≈ 1,2 s.

Bilder: `test/uebergaenge/nachher_laden_route1.webp`, `nachher_laden_nebelgrotte.webp`, `nachher_ankunft_kupferhain.webp`, `nachher_rennen.webp`; vorher: `vorher_ankunft_kupferhain.webp`, `vorher_route2_haengt.webp (Figur hängt an der Kante der Kartenrand-Lücke)`. Messwerte: `test/uebergaenge/messwerte_nachher.json`, `messwerte_vorher_bewegung.json`.

## 6. Tests
`node build.mjs && node test/uebergaenge_qa.mjs` (Chromium-Sperre!, ≈ 18 min) → `test/uebergaenge_qa.log`. Vorher-Vergleich gegen einen alten Build: `UE_DIST=<dist> UE_VORHER=1 node test/uebergaenge_qa.mjs` (`UE_NUR_BEWEGUNG=1` nur Messwerte).

## 7. Offen
- `test/bewegung_qa.mjs` (anderes Team) meldet im Spiel-Teil halbes Tempo: Der Container startet mit der Software-Renderer-Voreinstellung `SET.fps=30`, die handgetaktete Schleife setzt `lastFrame` nicht → jedes zweite Bild wird übersprungen (unabhängig von dieser Änderung; mit `SET.fps=0` stimmt das Tempo). Der VM-Gelände-Fall (pen 0,025) betrifft 38-models.
- Ladezeit auf echtem Handy messen (Aufbau Route/Stadt); bei Bedarf `build3d` in mehr Häppchen teilen (Aufbau steckt in 09/51, hier nur über `draw3d` aufgerufen).
- Tasten (PC): Pfeil runter dreht weiterhin um 180° und läuft (Steuerkreuz-Logik aus 15-ui unverändert).
- Kamera-Nachführung (`CAMF`) mit dem Kind ausprobieren; 0 setzt das alte Verhalten.
