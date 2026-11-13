# Stabilität PC – Einfrieren in der Werkstatt, Stufenwahl, Wachhund, Beenden

Agent „Stabilität PC“ (Opus 5.5 · hoch), 13.11.2026. Anlass: Live-Test 10:45 auf Christophs Laptop (HP 250 G10, Intel Iris Xe, Chrome, ≈ 1536×695 CSS-px):
Leitstand → Werkstatt → „Spiel hier starten“ (Neue 3D-Modelle an) → der ganze Tab fror ein (Leitstand 1,3–1,5 Bilder/s über 50 s), Strg+Q und „Spiel beenden“ wirkungslos, nur Tab schließen half.

## Ursachen

| Vermutung | Ergebnis |
|---|---|
| `GFX.strong` in 59 zählt `Intel(R) Iris/Arc` (und NVIDIA/Radeon pauschal) als stark → Stufe **hoch** (Schatten 2048², DPR 2, Bloom mit Bildkopie, Mindestskala 0,85) auf integrierter Grafik | **bestätigt** (Regex in 59; im Test mit Iris-Xe-Namen startete der alte Stand auf `high`) |
| Automatik regelt nicht herunter | **bestätigt, schlimmer als vermutet:** `perfFrame` (43) verwirft jedes Bild mit Abstand > 250 ms (`dt>250 → return`). Bei 700 ms je Bild misst die Regelung also **nichts**; auch der Wächter aus 54 (`PERF.ft > 120`) sieht nur den alten Mittelwert. Dazu: Skala nie unter die Mindestskala, Kampf und Menüs ungeregelt, bei fester Auflösung (`SET.res ≠ auto`) gar keine Skala. |
| Modelle laden auf dem Hauptthread | **teilweise bestätigt:** Draco dekodiert schon im Worker (r128-DRACOLoader, bis 4 Worker). Aber: alle Ladevorgänge starten gleichzeitig (09 lädt 4 Häuser per `Promise.all`, 58 alle Arten des Gebiets, 57 Figuren), jede Fertigmeldung baut Szenen neu (09 verwirft bei den Häusern die ganze Kartenszene) und erzeugt neue Shader. **Werkstatt:** alle 28 Modelle steckten als `<script src>` (≈ 26 MB Base64) im `<head>` und wurden vor dem Spielstart synchron geladen und geparst. |
| Iframe teilt den Prozess mit dem Leitstand | **bestätigt, nicht änderbar:** gleiche Herkunft ⇒ gleicher Prozess und gleicher Hauptthread; jede lange Aufgabe des Spiels friert den Leitstand ein, und eine überlastete GPU bremst das Zeichnen des ganzen Tabs. Abhilfe nur: das Spiel darf den Thread nie lange belegen (Wachhund, Warteschlange). Alternative: „In eigenem Tab öffnen“ (eigener Prozess). |
| Beenden nicht möglich | **bestätigt:** Tasten mit Fokus im Leitstand erreichten das Spiel nie; „Spiel beenden“ setzte nur `src=about:blank` (ohne Speichern, ohne WebGL-Freigabe); Dauerschleifen (`10-mon3d` Ansicht, 35 Kamera, 36 Eingabe, Overlay-fps) liefen nach `quitGame` weiter. |

## Regeln (src/61-stabil.js)

1. **GPU-Klasse → Startstufe (nur bei „Auto“)**: dediziert (GeForce RTX/GTX, Quadro, Radeon RX/Pro, Arc A/B, Apple M) → hoch · Iris Xe, Arc integriert, Radeon(TM) Graphics/680M, GeForce MX → mittel · UHD/HD, Vega, ältere Iris/Iris Plus, Software → niedrig · Handy/Tablet: wie bisher (59). `GFX.strong` gilt am PC nur noch für dediziert.
   PC-Bilddeckel 60, integriert/unbekannt 30 (wenn Qualität „Auto“; `?fps=60` übersteuert); DPR-Deckel integriert 1,25.
   Werkstatt (Iframe oder `?ws=1`) am PC: Start höchstens „mittel“; der Wachhund darf nach 10 s stabil bis zur Klassenstufe anheben.
2. **Wachhund** (äußerste Hülle um `loop`, misst die Kosten jedes gezeichneten Bildes = Beginn bis zum nächsten rAF, unabhängig vom fps-Deckel, ohne 250-ms-Grenze, auch im Kampf und bei fester Auflösung; Stufenwechsel zählen 3 Bilder nicht):
   Ø > 45 ms über 1,5 s → eine Stufe runter (hoch → mittel → niedrig), danach Renderskala in 0,15-Schritten bis 0,5 (auch unter die Mindestskala; bei fester Auflösung über `resH3`).
   Ø > 100 ms oder zwei Einzelbilder > 250 ms in 4 s → **Notbremse**: niedrig, Skala 0,5, Bloom und Sonnenschatten aus, 30 fps.
   Hoch erst nach 10 s stabil (gilt auch für die 43-Automatik über `perfSet`); nach einer Notbremse oder 3 Absenkungen keine Stufe mehr hoch.
   Erwartbar lange Bilder (Kartenwechsel, Kampfstart, Ansichtswechsel, fertiges Modell) zählen 2–4 Bilder lang nicht als Ausreißer.
   (Abweichung vom Auftrag: ein einzelnes Bild > 250 ms löst die Notbremse nicht aus, erst zwei in 4 s – ein Shader-Kompilieren beim ersten Auftauchen eines Modells soll nicht dauerhaft auf „niedrig“ stellen.)
3. **Modell-Warteschlange** `window.VMODEL_QUEUE`: `modelLoaders()` liefert jetzt einen Lader, dessen `load` in die Warteschlange einreiht (API unverändert für 38/57/58/09). Ein Modell nach dem anderen, danach 100 ms Pause + Leerlauf-Rückruf; Reihenfolge Spielfigur → Häuser → Figuren → Terras → alter Pilot. Draco: 1 Worker. Pausiert, solange das Spiel unsichtbar ist.
   Werkstatt-Build: statt 28 Skript-Tags nur `window.PILOT_LAZY` (Liste); das Skript eines Modells wird beim ersten Laden eingefügt, die data-URI danach freigegeben. Nebenwirkung: die Haus-Modelle aus 09 (`models/welt/*.glb`) laden jetzt auch in der Werkstatt (vorher fehlten sie dort).
4. **Beenden jederzeit**: `postMessage({veyra:'stop'})` → speichern, `__quit`, Ton aus (AudioContext schließen, Medien pausieren), alle Renderer `dispose` + alle WebGL-Kontexte `loseContext` (Kontexte werden ab dem Laden über `getContext` gesammelt), `requestAnimationFrame` wirkungslos, alle Intervalle gelöscht, Antwort `{veyra:'stopped', saved, lost, gl}`.
   `{veyra:'key'}` vom Leitstand: Strg+Q → `quitGame()`, Esc → Tastendruck im Spiel (Chronik → „Speichern & schließen“), Antwort `{veyra:'ack'}`. `quitGame` (Strg+Q, Chronik-Knopf) hält zusätzlich alle Schleifen an und meldet `{veyra:'quit'}` an den Leitstand.
   Unsichtbar (visibilitychange) → Pause (wie bisher, 43); außerhalb des Bildes (IntersectionObserver im Spiel, z. B. Leitstand-Ansicht gewechselt) → Pause; Fenster ohne Fokus → 5 Bilder/s.
   `10-mon3d.js` Drehansicht: Schleife endet, sobald die Ansicht nicht mehr im Dokument ist (startet beim nächsten `viewer3d` neu).
5. **Leitstand** (`tools/leitstand/leitstand.html`, Werkstatt): „Spiel beenden“ und „Vollbild verlassen“ schicken `stop`, warten höchstens 300 ms auf `stopped`, entfernen dann den Rahmen. Strg+Q und Esc mit Fokus im Leitstand werden ans Spiel weitergeleitet; kommt auf Strg+Q binnen 300 ms keine Antwort, wird der Rahmen sofort entfernt. Meldet das Spiel `quit`, verschwindet der Rahmen nach 0,9 s. Neuer Schalter **Qualität** (Auto/Hoch/Mittel/Niedrig → `?gfx=…`, gemerkt), Start nach dem Laden mit Fokus im Spiel.
6. **Staging-Badge**: zeigt „– <fps> fps · <Stufe>“ (gezeichnete Spielbilder, nicht rAF), „Pause“ wenn pausiert, „(Notbremse)“ nach Notbremse.

## Messwerte (SwiftShader, 2 Kerne, 1536×695 @ DPR 1,25, Renderer-Name auf Iris Xe gesetzt – nur relativ)
Test `node test/stabil_qa.mjs` (Ergebnis `test/stabil_qa.json`, Log `test/stabil_qa.log`). Vorher = gleicher Quellstand ohne `61-stabil.js`, alter Werkstatt-Build (28 Skript-Tags), gleicher Leitstand.
SwiftShader braucht für EIN Bild der 3D-Welt selbst auf „niedrig“/50 % ≈ 1–2 s → „längste Aufgabe < 300 ms“ ist hier nicht erreichbar; geprüft werden Hauptthread-Anteil, rAF-Folge der Außenseite und Beenden.

| | vorher | nachher |
|---|---|---|
| Startstufe bei „Iris Xe“ | hoch (`GFX.strong`), 60 fps, kein Deckel | mittel, 30 fps, DPR 1,25 |
| Morgenau nach dem Laden: Abstand der Bilder (rAF Ø) | 6000 ms | 23–44 ms (Endlauf 27 ms) |
| Morgenau: längste Aufgabe / Zeitgeber-Verzug | 5926 ms / 11,3 s | 1,3–3,3 s / 1,3–3,3 s (einzelne Spielbilder) |
| Morgenau: Hauptthread belegt | ≈ 100 % (Stufe bleibt „hoch“) | 30–63 % (Stufe → niedrig, Skala 0,5, Halbzeit-Budget) |
| Route 1: rAF Ø / längste Aufgabe | 7900 ms / 7883 ms | 25–27 ms / 1,7 s |
| Laden Morgenau: längste Aufgabe | 10,3 s | 4,3 s (Szenenaufbau; Modelle einzeln 0,1–4,7 s) |
| Leitstand mit Spiel im Rahmen, 20 s: rAF Ø Außenseite | 3717 ms (≈ 0,3 Bilder/s), Verzug 7,9 s | während des Ladens 40–64 ms (Verzug bis 4,3 s beim Kartenaufbau); eingeschwungen 27 ms, 98 % < 50 ms, Verzug max. 0,66 s |
| „Spiel beenden“ bis Rahmen weg | 342 s (Klick wartete auf das eingefrorene Spiel) | 0,9–1,5 s (ein laufendes SwiftShader-Bild muss fertig werden), Außenseite danach 16,7 ms |
| Strg+Q mit Fokus im Leitstand | wirkungslos | 0,9 s, gespeichert |
| nach `stop`: Bilder / WebGL / Ton | – | 0 Bilder nach 50 ms, 2/2 Kontexte verloren, AudioContext geschlossen, Seite ruhig (rAF 16,7 ms, keine Long Tasks) |

Hinweis: Long Tasks des Spiels im Rahmen werden der Außenseite nicht zugeordnet; dort zählt die rAF-Folge.
Der Leitstand-Test nutzt den Werkstatt-Build ohne Code-Schutz (protect.mjs kürzt alle globalen Namen) und lädt three.js lokal statt vom CDN; sonst identisch.
Zusätzlich gefunden und behoben: Im Leitstand lag die Bild-Lupe `#lb` trotz `hidden` über der Seite (`#lb{display:grid}` schlägt `[hidden]`), lokal waren dadurch keine Klicks möglich → `#lb[hidden]{display:none}`.
Hauptthread-Budget (neu, Regel 2b): Ist die Stufe schon „niedrig“ und kostet ein Bild trotzdem > 30 ms (JS + Warten auf GPU/Compositor, gemessen bis zum nächsten rAF), zeichnet das Spiel höchstens die Hälfte der Zeit – der Rest bleibt für Eingaben und den Leitstand. Auf einer echten GPU greift das nur im Notfall.

## Auf dem echten PC prüfen
- Werkstatt → „Spiel hier starten“ (Neue 3D-Modelle an, Qualität Auto): Badge soll „30 fps · mittel“ zeigen; Leitstand bleibt bedienbar; nach 1–2 Minuten in Morgenau/Route 1 ohne Ruckeln? Wenn die Stufe auf „niedrig“ fällt, ist das gewollt.
- „Spiel beenden“, „Vollbild verlassen“, Strg+Q (Fokus im Leitstand oder im Spiel) → Rahmen weg in < 1 s, Lüfter beruhigt sich.
- Qualität „Hoch“ wählen → darf ruckeln, muss sich aber binnen weniger Sekunden selbst herunterregeln (Badge).
- Lässt sich der Tab trotzdem einmal schlecht bedienen: „In eigenem Tab öffnen“ (läuft in eigenem Prozess).

## Testergebnis (13.11., 21:10)
`stabil_qa` 25 ✓ / 0 ✗ · `smoke` „Keine Fehler.“ · `uebergaenge_qa` 97 ✓ / 0 ✗ (28/28). Während der Läufe arbeitete parallel Blender (Figuren-Agent) → SwiftShader-Werte schwanken stark; Grenzen deshalb auf Hauptthread-Anteil/rAF-Folge statt Einzelwerte.
Bilder: `test/stabil_vorher_route1.png`, `test/stabil_leitstand.png`, `test/stabil_nach_stop.png`.

## Runde 2 (13.11., 21:40–) – Ruckeln, Wackeln, „Laden anderer Gebiete“ (Nutzer am iPhone, Home-Bildschirm-Verknüpfung)

### Ursachen
| Befund | Bewertung |
|---|---|
| **5-fps-Drosselung „ohne Fokus“** aus Runde 1 fragte `document.hasFocus()` alle 0,7 s ab. In iOS-Standalone (Home-Bildschirm) und in Iframes meldet das „kein Fokus“, obwohl gespielt wird → Spiel lief mit **5 Bildern/s**, der Wachhund maß in diesem Zustand nicht. Erklärt „sehr krass am laggen“ und das ruckartige „Wackeln“ (große Bewegungssprünge je Bild). | **Hauptursache, behoben**: nur noch ein echtes `blur`-Ereignis des obersten Fensters am PC (nicht Touch, nicht Standalone, nicht Iframe) drosselt, nach 1,5 s; jede Eingabe hebt es auf. |
| IntersectionObserver auf `<html>` als Oberfenster | riskant in iOS-Standalone (Fläche 0 → „außerhalb“ → Pause) → nur noch im Iframe (Leitstand). |
| **30-fps-Deckel** für integrierte Grafik + 43-perf regelte gegen SET.fps = 60 → hielt jedes 33-ms-Bild für „zu langsam“ und senkte Auflösung/Stufe grundlos (Canvas-Größenwechsel = Ruckler) | behoben: 43 regelt gegen den tatsächlichen Deckel; Deckel startet bei 60 und geht nur auf gleichmäßige 30, wenn 60 nicht gehalten wird (Ø > 21 ms), zurück nach 10 s < 12 ms. |
| Renderskala pendelte (43 hoch/runter, jede Änderung = neue Canvas-Größe) | 8 s Sperre nach jeder Absenkung. |
| Halbzeit-Budget griff schon ab 30 ms Bildkosten | nur noch ab 60 ms auf „niedrig“ (echter Notfall). |
| **Wackeln**: draw3d (Kamera-Feder, Gangphase, Drehung) rechnete mit `performance.now()`-Abständen, die Bewegung (17) mit rAF-Abständen → bei schwankender JS-Zeit laufen Figur und Kamera auseinander, die Gang-Mischung (57 pilotTick: Tempo = Weg/Zeit) springt | draw3d bekommt jetzt genau den Zeitschritt der Bewegung (Hülle in 61, kein Eingriff in 09/17). |
| Ferne NPC-Skelette jedes Bild | ab 5 Feldern 20 Hz, ab 10 Feldern 10 Hz (Zeitschritt aufsummiert). |
| **„Laden anderer Gebiete“**: (a) 45-hybrid dekodierte beim Betreten jedes Orts die Ortsbilder aller Nachbarkarten (`hyPlacePreload`); (b) fertig geladene Hausmodelle lassen 09 die **ganze Kartenszene neu bauen** – mitten im Dorf sichtbar als „Neuladen“ | (a) abgeschaltet (Ladebildschirm lädt sein Bild selbst); (b) Hausmodelle warten, wenn schon eine Szene läuft, bis zum nächsten Kartenwechsel/Tür (verdeckt). Modelle anderer Gebiete lädt die Warteschlange nicht (nur Team + Arten der aktuellen Karte + Figuren der Szene). |
| Handy-Startstufe: iOS meldet nur „Apple GPU“ → 59 wertete das als stark → **hoch** (Bloom mit Bildkopie, Schatten 2048) | mit neuen Modellen startet Touch höchstens auf **mittel**; Wachhund darf nach 10 s stabil höher. |
| Budget: Welt-Umrisse, Laub, Modelle | 59: Welt-Umrisshüllen auf „niedrig“ und am Handy unter „hoch“ aus (≈ 25 k Dreiecke); Modelle nach Entfernung zur Spielfigur sortiert: höchstens 14/10/6 (Handy 8/6/4), Schattenwurf nur die nächsten 3/2/0 (Handy 2/1/0), Umriss nur nah, LOD1 früher; Laub/Gras am Handy 70/55/35 %. |
| Modell-Schalter nur über `?modelle3d=1` (geht in Home-Bildschirm-Verknüpfungen verloren) | Staging-Menü (orange Plakette) → „Grafik“ → **Neue 3D-Modelle** (in SET gespeichert, Neustart), mit Infozeile GPU/Stufe/fps/Deckel/Skala. |

### Messwerte (SwiftShader 640×360, CPU ×4, Iris-Xe-Kennung; `node test/stabil2_mess.mjs <tag> [dist]`, Ergebnis `test/stabil2/mess_<tag>.json`)
SwiftShader schafft hier ≈ 1 Bild/s – Bildfolge/Wackeln sind damit **nicht** aussagekräftig messbar (Wackel-Werte vorher wie nachher < 1 px). Aussagekräftig: Dreiecke/Draw-Calls und JS-Zeit.

| Szene (Stufe) | vorher | nachher |
|---|---|---|
| Morgenau, mittel → niedrig: Dreiecke / Calls / JS Ø | 169 k / 76 / 27 ms | 127 k / 53 / 15 ms |
| Route 1, mittel → niedrig | 183 k / 78 / 25 ms | 177 k / 76 / 23 ms (Laub dominiert; am Handy −35–65 %) |
| Posten Morgenau (vorher) | Laub-Instanzen 61 k, Figuren 30 k, Spielfigur 13 k + Umriss 12 k, Welt-Umrisse 26 k, Terra 8 k | Welt-Umrisse 0, Figuren 7 k (Budget) |

### Für die Modell-Agenten
Die Spielfigur kostet 13 k Dreiecke + 12 k Umrisshülle, jede Figur ≈ 7 k (LOD1 ≈ 50 %), Terras 8–14 k. Fürs Handy-Budget (≤ 80–100 k) wäre eine leichtere LOD1 je Figur/Terra (≈ 2–3 k) und eine Umrisshülle nur auf LOD0 sinnvoll.

### Am Handy prüfen
Staging-Plakette antippen → „Grafik“: Infozeile zeigt fps/Stufe/Deckel. Laufen in Morgenau: gleichmäßig, Kamera ruhig; Häuser „springen“ nicht mehr mitten im Spiel um.
