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
2. **Wachhund** (äußerste Hülle um `loop`, misst jedes gezeichnete Bild, ohne 250-ms-Grenze, auch im Kampf und bei fester Auflösung):
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
MESSWERTE

## Auf dem echten PC prüfen
- Werkstatt → „Spiel hier starten“ (Neue 3D-Modelle an, Qualität Auto): Badge soll „30 fps · mittel“ zeigen; Leitstand bleibt bedienbar; nach 1–2 Minuten in Morgenau/Route 1 ohne Ruckeln? Wenn die Stufe auf „niedrig“ fällt, ist das gewollt.
- „Spiel beenden“, „Vollbild verlassen“, Strg+Q (Fokus im Leitstand oder im Spiel) → Rahmen weg in < 1 s, Lüfter beruhigt sich.
- Qualität „Hoch“ wählen → darf ruckeln, muss sich aber binnen weniger Sekunden selbst herunterregeln (Badge).
- Lässt sich der Tab trotzdem einmal schlecht bedienen: „In eigenem Tab öffnen“ (läuft in eigenem Prozess).
