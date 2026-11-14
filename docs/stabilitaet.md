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

## Runde 2 (13.11. 21:40 begonnen, 14.11. abgeschlossen) – Handy: Lag/fps, Wackeln, „Laden im Dorf“, Modell-Schalter

Agent „Stabilität PC/Handy“ (Opus 5.5 · hoch). Anlass: Spieltest Christoph 13.11. 21:37–21:45 **am iPhone**, Staging (Netlify, geschützter Build), als Home-Bildschirm-Verknüpfung (standalone), neue Modelle an:
„Das Wackeln beim Laufen muss weg. Das Laden anderer Gebiete, obwohl ich in einem Dorf bin, ist nicht notwendig. Aktuell ist das Spiel sehr krass am Laggen und die fps sind sehr niedrig.“
Ein Vorgänger hatte Runde 2 begonnen (Fokus-Drosselung, Deckel, Hausmodelle halten, Schalter in 61); das ist hier geprüft, teils umgebaut und vervollständigt.

### Ursachen (bestätigt / widerlegt)
| Verdacht | Ergebnis |
|---|---|
| **„5 fps ohne Fokus“** (Runde 1 fragte `document.hasFocus()` alle 0,7 s ab) | **bestätigt, Hauptursache Lag + Ruckeln.** Mit iPhone-Emulation (standalone, `hasFocus() = false`) stand der 21:37-Stand dauerhaft auf `blur: true` → 5 Bilder/s, Figur springt je Bild 0,4 Feld (Gehen) bzw. 1 Feld (Rennen). Jetzt drosselt nur noch ein echtes `blur` des obersten Fensters am PC (nicht Touch, nicht standalone, nicht im Rahmen), nach 1,5 s; jede Eingabe hebt es auf. |
| „Pause bei unsichtbar“ | nur bei `document.hidden` (richtig). Zusätzlich abgesichert: iOS meldet die Rückkehr nicht immer → `pageshow`/Fokus/Berührung/1-s-Takt stoßen eine pausierte Schleife wieder an. IntersectionObserver nur im Rahmen (Leitstand). |
| 30-fps-Deckel | Deckel 30 war nicht die Ursache, aber 43 regelte gegen 60 und hielt jedes 33-ms-Bild für „zu langsam“ (Vorgänger behoben). Handy: startet ohne Deckel, geht gleichmäßig auf 30, wenn 60 nicht haltbar. |
| **Halbierung der Zeichenzeit** | bestätigt als Risiko: griff auch am Handy (ab Stufe niedrig, > 60 ms je Bild) und halbierte die fps nochmals. Jetzt **nicht mehr am Handy/Tablet** (Touch); am PC und im Leitstand-Rahmen bleibt sie (Eingaben/Außenseite behalten Luft). |
| **Wachhund-Pendeln** | bestätigt möglich: drei Regler (43 Skala/Stufe, 59 Mindestskala, 61 Wachhund) – jede Skalenänderung = neue Canvas-Größe, jede Stufe = Schatten/Pflanzen neu. Jetzt: 43 darf die Skala nur senken (≥ 0,05), anheben nur der Wachhund (≥ 0,1, frühestens 20 s nach einer Absenkung); nach „hoch → gleich wieder runter“ wartet die nächste Anhebung 30 s, nach zweimal nie mehr. Touch bei „Auto“ höchstens „mittel“ (kein Bloom mit Vollbild-Kopie, Schatten 1024). |
| Modell-Warteschlange im Hauptthread beim Laufen | **bestätigt (Ruckler bei jedem fertigen Modell: Textur-Upload + Shader).** Jetzt lädt die Warteschlange nichts, während die Heldin läuft (+ 0,7 s), außer der Spielfigur; Ladebildschirm/Kartenwechsel laden sofort. |
| **Dreiecke/Draw-Calls** | **bestätigt, zweite Hauptursache.** 21:37-Stand am Handy (mittel, Modelle an): Morgenau 232 k Dreiecke / 100 Draw-Calls je Bild, Route 1 267 k / 113, Kupferhain 267 k / 142 (Ziel Handy ≤ 100 k / ≤ 60). `GFX.mlod` (Runde 5) wirkte nur auf Figuren; der große Posten waren Instanzen (Bäume/Kronen/Büsche/Felsen/Blumen: 55–90 k) und der Schattenpass. |
| Bewegung nicht dt-basiert / Positionssprünge | **widerlegt:** 17-move rechnet mit dt, Heldin läuft exakt geradeaus (Querabweichung 0,0000 Feld), Tempo-Schwankung < 2 %. 17-move.js unverändert. |
| Hüft-Wippen im Gang-Clip | **widerlegt:** Hüft-Translation im GLB 1,8 cm (Gehen) / 3,6 cm (Joggen) / 5 cm (Rennen) – normal. |
| **Kamera-Nachführung** | **bestätigt, Ursache „Wackeln“ (bei ruhiger Bildfolge):** beim Gehen durch Morgenau pumpte die Kamera in Höhe (σ 0,90 Feld) und Abstand (σ 0,29) – Hindernis-Ausweichen (Draufsicht über Häuser/Bäume, Näherrücken) schaltete an jeder Lücke hin und her, Kamera-Tempo schwankte um 55 %. |
| „Laden anderer Gebiete“ | Nachbarkarten-Ortsbilder (45 `hyPlacePreload`) und Haus-Neubau mitten im Dorf: vom Vorgänger behoben. **Neu gefunden:** 26 `preloadArt()` lädt beim Start alle ≈ 105 Kreaturen-Kartenbilder (4 parallel, Dekodieren + Prüfbild) – am Handy über Netlify läuft das weit ins Dorf hinein. Jetzt: während des Laufens kein neues Bild, sonst höchstens 2 parallel. Keine Modelle anderer Gebiete (Log unten). |

### Änderungen
- **src/61-stabil.js:** Halbierung nicht am Handy · Touch-Startstufe ≤ mittel, Deckel „mittel“ (außer Optionen/`?gfx`) · Pendel-Sperren (Skala, Stufe) · `stabKick` (Schleife neu anstoßen) · Warteschlange hält während des Laufens (`vmqMoving`) · Kreaturenbilder-Drossel (`artPump`-Hülle) · ferne Figuren (gaitTick) und Terras/Modelle (animModel) ab 5/6 Feldern mit 15 Hz · `stabInfo()` liefert Dreiecke/Draw-Calls/Modelle · Badge/Schalter aus 61 entfernt (jetzt im Overlay).
- **src/59-grafik.js – Budget durchsetzen:** `GFX.budget` Handy 100 k / 60 Calls, PC integriert 150 k / 110, dediziert 250 k / 150 (je Bild inkl. Schattenpass). Regelstufe `GFX.bud.lvl` 0–5 (strenger sofort: 4 von 6 Bildern drüber, weit drüber 2–3 Stufen; lockerer nur beim Kartenwechsel, eine Stufe unter der zuletzt nötigen). Stufen senken Modell-Anzahl/-Entfernungen, Schattenwurf, Umriss (ab 3 keine Figuren-/Terra-Umrisse, ab 4 keiner an der Heldin), Laub-/Gras-Dichte, Laub-Schatten.
  **Instanz-Ausdünnung** `gfxCullTick`: alle Instanz-Meshes aus 09 (`userData.n0`, ohne eigene Instanz-Attribute) werden je 0,4 Feld/6°/0,5 s nach vorn umsortiert – hinter der Kamera (4 Felder Rand) und jenseits der Budget-Entfernung (Handy 40→10, PC 60→16 Felder) fallen weg, leere Meshes werden nicht gezeichnet. Nur Matrizen, kein Neubau.
  **Schatten:** am Handy werfen nur Heldin + die 2 nächsten Figuren (bis 4,5 Felder; Stufe 4: 1, Stufe 5: nur die Heldin) Sonnenschatten, Welt-Meshes nicht (am PC erst ab Stufe 3). Handy-Tabelle `GFX.mlodT`: Umriss nur bis 2,2 Felder, LOD1 ab 2,8, höchstens 6 Modelle (mittel). Heldin zählt nicht zum Modell-Kontingent.
- **src/09-three3d.js (nur Kamera):** Ausweich-Ziele (Abstand, Höhe, Seitversatz) 1,1 s (seitlich 2 s) halten statt pumpen, weicher nachführen (Höhe 0,6 s, Abstand raus 0,75 s, Seite 0,9 s, max. 0,7 Feld); schnelles Heranrücken nur an Wänden/Häusern oder > 0,5 Feld; Schulterseite wechselt erst nach 0,8 s; Rollen aus der Drehrate (dt-basiert, schwächer).
- **tools/staging-overlay.js:** Abschnitt **Grafik** im Debug-Menü: Schalter **Neue 3D-Modelle** und **Qualität** (Auto/Hoch/Mittel/Niedrig), gespeichert in `SET` → Staging-Speicher `veyra_stg_set` (bleibt in der Home-Bildschirm-App), Neustart; Infozeile GPU/Klasse/Stufe/fps/Deckel/Skala/Dreiecke/Draw-Calls. Badge: **„– 30 fps · mittel · 92 k“** (gezeichnete Spielbilder aus `VSTAB.info()`, nicht Bildschirm-Takte). Eigene rAF-Zählung nur noch als Rückfall.
- **Tests:** `test/stabil2_handy.mjs` (neu: Mobil-Emulation, mess/wackel/laden/profil), `test/stabil_wackel.mjs` (neu: Messreihe Wackeln), `test/stabil_qa.mjs` (Handy-Fälle ergänzt, Staging-Schalter).
- Nicht angefasst: 17-move (nicht nötig), 58, 51, 60, Leitstand, GLBs.

### Messwerte
Alle Werte SwiftShader (Software-GL, 2 Kerne) – absolute fps/ms sind **nicht** aussagekräftig, Dreiecke/Draw-Calls/Bildfolge/Kamera schon.
„vorher“ = Stand 21:37 (Commit cde9ab6, den Christoph getestet hat), „nachher“ = dieser Stand. Werkzeug `node test/stabil2_handy.mjs <tag> [dist]` (TEIL=mess|wackel|laden|profil, DEV=iphone14|iphone15pm|laptop, STUFE), Ergebnisse `test/stabil2/handy_<tag>.json`.

**Handy** – iPhone 15 Pro Max quer (932×430, DPR 3, Touch, „Apple GPU“, standalone, `hasFocus() = false`, Modelle über gespeicherten Schalter), Stufe „mittel“ festgehalten, CPU-Drosselung ×4 (CDP), 6 s Laufen. Dreiecke/Draw-Calls je Bild inkl. Schattenpass; „JS“ = Spielschleife je Bild (inkl. Abgabe an WebGL), in Klammern ohne `render()`.

| Szene | vorher: Dreiecke / Calls / JS | nachher (Laufen) | nachher (Abnahme, stehend, stabil_qa) | Budget-Stufe |
|---|---|---|---|---|
| Morgenau | 231,7 k / 100 / 61,6 ms (12,3) – **5 Bilder/s gedrosselt** | 102,8 k (max 111) / 53 / 17,6 ms (9,5) ¹ | **93,5 k / 52** | 5 |
| Route 1 | 267,1 k / 113 / 19,9 ms (7,0) – 5 Bilder/s | 104,6 k / 58 / 23,1 ms (13,7) ¹ | **94,4 k / 56** | 5 |
| Kupferhain | 267,0 k / 142 / 27,4 ms (15,0) – 5 Bilder/s | **95,1 k / 55** / 23,4 ms (14,3) | **91,1 k / 51** | 4 |
| Morgenau, iPhone 14 (844×390) | – | 102,8 k / 53 / 21,3 ms ¹ | **93,5 k / 52** | 5 |

¹ gemessen vor der letzten Verschärfung von Stufe 5 (Begleiter-Schatten aus, Ausdünnung 10 statt 12 Felder); danach die Abnahme-Werte (≤ 100 k / ≤ 60 ✓).
Aufschlüsselung Morgenau vorher: Instanzen 76 k (Bäume/Kronen/Büsche/Felsen), Figuren 30 k, Heldin 13 k + Hülle 12 k + Schatten 12 k, Welt-/Haus-Umrisse 26 k, Terra 8 k + Hülle 8 k. Nachher: Instanzen 37 k, Heldin 13 k + Schatten 12 k (Hülle ab Stufe 4 aus), Terra 8 k, Welt 19 k.

**Laptop** (Iris-Xe-Kennung, 1536×695 @ 1,25, mittel, CPU ×4): Morgenau 137,8 k (max 149) / 65, Route 1 134,6 k / 73, Kupferhain 136,3 k / 71 – Budget 150 k / 110 ✓. Vorher (Messung des Vorgängers 13.11. 22:00, mittel): Morgenau 169 k / 76, Route 1 183 k / 78; Welt-Agent (hoch): Morgenau 239 k / 98, Kupferhain 327 k / 141.

**Bildfolge am Handy:** vorher 200 ms je Bild (5 fps, Fokus-Drossel), nachher 33,3 ms (Deckel 30) bzw. 16,7 ms (60) – ohne Drosselung, ohne Pause, auch bei `hasFocus() = false` + `blur`.

**Wackeln** (`test/stabil_wackel.mjs`: simulierter 60-Hz-Takt, Deckel 30, längste gerade Strecke, 3 s Gehen bei voller Geschwindigkeit; Felder bzw. Pixel):

| Morgenau, Gehen | vorher (21:37) | Zwischenstand Vorgänger (ohne Fokus-Drossel) | nachher |
|---|---|---|---|
| Bildabstand | 200 ms | 33,3 ms | 33,3 ms |
| Figur springt auf dem Bildschirm (senkrecht, px je Bild ggü. Nachbarbildern) | **12,95 px** | 0,09 | 0,02 |
| Heldin quer zur Geraden / Tempo-Schwankung | 0 / 0,3 % | 0 / 0,1 % | 0 / 0,1 % |
| Kamera-Höhe σ | 0,38 | **0,90** | **0,16** |
| Kamera-Abstand σ | 0,15 | 0,29 | 0,10 |
| Kamera-Tempo-Schwankung | 125 % | 56 % | **7 %** |
| Rollwinkel max | 6,1° | 0,05° | 0° |

Route 1 Gehen: Kamera-Höhe σ 0,83 → 0,09, Abstand σ 0,64 → 0,20, Kamera-Tempo-Schwankung 47 % → 28 % (vorher bei 5 fps: Figur-Sprung 14,7 px). Rennen Morgenau: Höhe σ 0,07 → 0,04, Abstand σ 0,48 → 0,01, Kamera-Tempo 47 % → 4 %.

**Laden in Morgenau** (60 s: 20 s stehen, 25 s im Kreis laufen, 15 s stehen; alle Netz-Abrufe ab Ankunft):
- vorher: alle 105 Kreaturen-Kartenbilder bis **43,5 s** nach der Ankunft, **`place_route1.webp` (Nachbarort) nach 6,2 s**, `haus.glb` nach 58 s (→ Neubau der Dorfszene), Figur `fig_buerger_a` wartete 42 s in der Warteschlange.
- nachher: nur, was das Dorf braucht – `fig_buerger_a`, `fig_mama` (Dorfbewohner), `t001`/`t004` (eigenes Team), Himmel/Horizont/Kampfhintergrund der Lichtlande (`_lo`), Weltkarte; Kreaturenbilder fertig nach 16,8 s (im Stehen), **während des Laufens kein einziger Abruf** (`t004` erst nach dem Stehenbleiben, 50 s). Keine Nachbarorte, kein Kartenwechsel, kein Neubau. Hausmodelle warten bis zum nächsten Kartenwechsel (verdeckt vom Lade-/Türbild).

**CPU-Profil** (Morgenau laufen, CPU ×4): 93 % „(program)“ = Grafik/Software-GL; eigene JS-Funktionen je < 0,3 % (Eingabe-Takt, HUD, draw3d). Die Spiel-Logik ist nicht der Engpass, das Zeichnen ist es → Budget war der richtige Hebel.

**Tests (14.11., Endstand):** `node build.mjs` ✓ · `stabil_qa` 44 ✓ / 0 ✗ (neu: Handy 844×390 + 932×430, Budget Morgenau/Route 1/Kupferhain, Wackeln, Staging-Schalter + Badge) · `smoke` „Keine Fehler.“ · `uebergaenge_qa` 97 ✓ / 0 ✗.

### Für die Figuren-/Terras-Agenten (GLB)
Gemessen je Bild (Handy, mittel): Heldin 13,3 k (Körper 11,8 k + Gesicht) **+ 11,8 k Umrisshülle + 11,8 k im Schattenpass** = 37 k für eine Figur; jede Stadt-Figur 11,8 k (LOD1 ≈ 5,9 k); Terra t001 8,5 k + 7,8 k Hülle.
Das Budget hält damit nur, weil ab Regelstufe 3–4 die Umrisse wegfallen und höchstens 2 Figuren Schatten werfen. Für mehr Spielraum (Umriss am Handy behalten):
- **Figuren:** LOD1 ≈ 2,5–3 k (statt 50 % ≈ 5,9 k), zusätzlich LOD2 ≈ 1 k für > 8 Felder; Umrisshülle aus LOD1 (eigenes Netz ≈ 3 k statt Kopie des 11,8-k-Körpers); eigenes Schatten-Netz ≈ 2–3 k (nur castShadow), damit der Schattenpass nicht den vollen Körper zeichnet.
- **Terras:** LOD1 ≈ 2 k, Umrisshülle aus LOD1, Schatten-Netz ≈ 1,5 k.
- Clips: unverändert ok (Hüfte 1,8–5 cm); 7 Clips im Mixer sind für ferne Figuren durch die 15-Hz-Drossel tragbar.

### Offen / Grenzen (ehrlich)
- Kein echtes iPhone/Iris Xe im Container: alles mit Emulation + SwiftShader. Echte fps am Gerät sind nicht belegt – Dreiecke/Calls/Bildfolge/Kamera schon.
- Dass iOS-Standalone `hasFocus()` = false liefert, ist eine Annahme (Auftrag/Vorgänger); die Änderung ist in beiden Fällen richtig (Drossel nur noch über echtes `blur` am PC).
- Morgenau und Route 1 halten das Handy-Budget nur auf Regelstufe 5 (keine Umrisse, nur die Heldin wirft Schatten, Instanzen bis 10 Felder) – sichtbar weniger Details. Abhilfe: leichtere GLB-LODs (oben).
- Ausdünnung nach Entfernung: am Rand (10–13 Felder) können Bäume/Büsche beim Laufen auftauchen (im Nebel gedämpft); hinter der Kamera unsichtbar.
- Kamera Route 1 beim Gehen: Abstand schwankt noch etwas (σ 0,2 Feld, Tempo 28 %); der Faktor `INP.camF` in 36-input (Auszieh-Prüfung je Bild, nicht dt-basiert) ist nicht meine Datei und unverändert.
- Figuren-/Terra-Modelle tauschen erst, wenn die Heldin stehen bleibt → beim Ankommen und sofort Losrennen kurz die prozedurale Figur. Hausmodelle im ersten Ort erst nach dem ersten Kartenwechsel (Regel des Vorgängers).
- `test/stabil2_mess.mjs` (Vorgänger, 640×360) bleibt als PC-Messung; die Handy-Messung ist `test/stabil2_handy.mjs`.

### Am Handy prüfen (Christoph)
1. Staging neu laden (Plakette → „Auf neue Version prüfen“). Plakette zeigt jetzt **„– 30 fps · mittel · 92 k“** (gezeichnete Bilder/s · Stufe · Dreiecke je Bild). Erwartung am iPhone: 30–60 fps, Stufe mittel, Dreiecke ≤ 100 k.
2. Plakette antippen → **Grafik → „Neue 3D-Modelle“** einschalten (lädt neu, bleibt in der Home-Bildschirm-App gespeichert – kein `?modelle3d=1` mehr nötig). Infozeile darunter: GPU, Stufe, fps, Deckel, Skala, Dreiecke, Draw-Calls.
3. Morgenau: 1 Minute geradeaus gehen und rennen, an den Häusern entlang → Kamera ruhig (kein Auf-/Abpumpen, kein seitliches Schwanken), Figur gleitet gleichmäßig.
4. Morgenau: keine Pop-ins/Ruckler, während man läuft (Figuren-Modelle tauschen nur, wenn man kurz stehen bleibt); kein Ladebildschirm/Neuaufbau im Dorf.
5. Nach Route 1 und Kupferhain wechseln (Ladebildschirm), dort wieder laufen. App in den Hintergrund und zurück → Spiel läuft sofort weiter (keine 5 fps, kein Standbild).
6. Falls es noch ruckelt: Grafik → Qualität „Niedrig“ probieren und melden, was die Plakette dabei zeigt (fps/Stufe/k).
