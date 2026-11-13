# Kreaturenbilder – nie ein „?“, überall gleiche Qualität (Ziel 9 und 3)

Agent Kreaturenbilder, Opus hoch, 12.11.2026. Test: `node test/bilder_qa.mjs` (ein Chromium, Sperre siehe AGENTS.md).

## Ursachen des Fragezeichens
1. **Ein einziger Ladefehler war endgültig.** `artLoad` (26-art) startete beim Start alle 105 Bilder gleichzeitig. Ein `onerror`
   (Netz kurz weg, App aus dem Hintergrund zurück, iOS-Speicherdruck beim Dekodieren) setzte `ART_BAD[id]=1` für immer.
   Danach: Welt-Sprites und Kampf zeigten Ersatzmodelle, die Fang-Karte das 3D-Vorschaubild – bis zum Neustart.
2. **Dex/Team zeigten ein `<img>` ohne Fehlerbehandlung.** Scheitert das Bild, zeigt Safari auf dem iPhone sein Symbol für ein
   kaputtes Bild: das **„?“**. Reproduziert in Playwright: Netzausfall von 30 s → alle 105 Dex-Kacheln kaputt, 105 × ART_BAD.
3. **Der Service Worker macht aus einem Netzfehler HTML.** `public/sw.js` antwortet bei einem gescheiterten Abruf mit
   `index.html` (`.catch(() => caches.match('./index.html'))`), auch für Bilder. Das Bild lässt sich dann nicht dekodieren.
   Die Bilder werden außerdem nicht vorab gecacht: offline fehlt jedes Bild, das noch nie geladen wurde.
4. Speicher (Verstärker auf iOS): 105 dekodierte Bilder auf einmal, Glanz- und Freistell-Canvas in voller Größe ohne
   Obergrenze, `<img>` mit `will-change` je Dex-Kachel. Safari begrenzt den Canvas-Speicher insgesamt und verwirft
   Dekodierungen bei Speicherdruck.

## Lösung
- **Laden (26-art.js):** Warteschlange mit höchstens 4 gleichzeitigen Abrufen. Sichtbare Bilder kommen zuerst
  (`artLoad(id,true)`). Dekodieren per `img.decode()`; scheitert das, entscheidet eine Probezeichnung.
  3 Wiederholungen nach 0,6 s, 1,8 s und 5 s, ab der 2. Wiederholung mit Cache-Umgehung. `ART_BAD` wird erst nach dem
  endgültigen Fehler gesetzt und nach 20 s wieder freigegeben, ebenso bei `online` oder bei der Rückkehr in die App.
  Ereignisse `artstate` und `artretry`. Neu: `artState(id)` und `artGoodSrc(id)`.
- **Zentrales Kartenbild (24-capture.js `cardPic`):** `mini()` leitet jetzt alle Arten hierher. Das betrifft Dex,
  Team-Ring, Lager, Kampf-Menüs, Fang-Karte und Detail-Bühne (`artStage`). Das Canvas hat die echte CSS-Größe × DPR (bis 3)
  und folgt Größenänderungen (ResizeObserver, Drehen des Geräts). Die Illustration ist **freigestellt**: Boden-Platte weg,
  auf den Inhalt zugeschnitten, wie bei den 3D-Sprites. Darunter liegt ein einheitlicher Kontaktschatten.
  Ist kein Bild da, zeichnet die Karte zuerst das Vorschaubild, dann `drawMon2D`, zuletzt eine Silhouette in Elementfarbe.
  Ein „?“ gibt es nicht mehr. Kommt das Bild später, wird es automatisch nachgefüllt.
- **Qualität (50-artsafe.js `artPicSrc`):** Die Quelle wird in Stufen halbiert, bis zur nächsten Stufe ≥ Zielgröße
  (48…1024 px). Danach skaliert der Browser mit `imageSmoothingQuality:'high'`. Vorher wurde 512 px in einem Schritt auf
  60 px verkleinert, das ergab Treppen. `drawArt` (Kampf 2D, Entwicklung, Karte) nutzt denselben Weg.
  `drawMonArt` zeichnet freigestellt (Faktor 0,86).
- **Speicher (50-artsafe.js):** verkleinerte Bilder in einem Speicher, der die ältesten zuerst verwirft (Handy 28 MB,
  sonst 64 MB). Glanz-Canvas ≤ 4, Freistellungen ≤ 18. Dex-Kacheln werden erst gezeichnet, wenn sie sichtbar sind
  (IntersectionObserver), und weit außerhalb wieder freigegeben. Beim Neuaufbau und Schließen der Chronik werden die
  Canvas sofort freigegeben (Breite 0). Im Hintergrund oder bei `pagehide` wird alles freigegeben. Scheitert das
  Anlegen eines Canvas, wird freigegeben und noch einmal versucht.
- **`<img>`-Wege** (Begegnungs-Banner, Starterwahl, Schlüpfen, Key-Art-Karten): `onerror` blendet das kaputte Bild aus und
  legt ein Canvas als Ersatz darüber. Lädt das Bild wieder, kehrt die echte Illustration zurück.
- Dex öffnet mit Platzhaltern und zeichnet je Frame höchstens ~8 ms. Messung: Öffnen 41 ms, obwohl noch Bilder laden.

## Messwerte (test/bilder_qa.mjs)
- Dex 393×852 @3 sofort nach Start: 153 Kacheln, alle mit Bild, Canvas = CSS × 3.
- Netzausfall 12 s (jedes dritte Bild): Ersatz-Sprites statt „?“, danach alle 153 Kacheln mit echtem Bild,
  `ART_BAD` wieder leer.
- Schärfe bei DPR 1, 2 und 3 (852×393 und 393×852): Canvas ≥ CSS × DPR.
- Screenshots: `test/bilder_dex.png`, `test/bilder_team.png`, `test/bilder_heilung.png`, `test/bilder_ausfall.png`.

## Heil-Sequenz (SEQ.heal, 25-evolve.js – nicht meine Datei)
Die Sequenz zeichnet keine Kreaturenbilder, nur die Heilerin, den Brunnen und die Kapseln, alles als Vektor. Sie begrenzt
die Pixeldichte auf 2. Auf dem iPhone (DPR 3) ist sie deshalb etwas weich. Nötige Änderung in `src/25-evolve.js`, Zeile
`SEQ.heal=…`: `dpr=Math.min(2,devicePixelRatio||1)` → `dpr=typeof artHealDpr==='function'?artHealDpr():Math.min(3,devicePixelRatio||1)`.
Sollen dort Teambilder erscheinen, gibt `cardPic(id,size,{field:true})` das gleiche Kartenbild wie Dex und Team.

## Empfehlung Service Worker (public/sw.js – nicht meine Datei)
- Bei Bildanfragen (`request.destination==='image'`) im `catch` `Response.error()` liefern statt `index.html`.
- `art/0*.webp` nach der Installation im Leerlauf in den Cache legen, damit alle Kreaturenbilder offline verfügbar sind.

## Auf dem echten iPhone prüfen
- PWA: Dex direkt nach dem Start öffnen. Flugmodus an, App neu öffnen, Dex öffnen: Ersatz-Sprites statt „?“.
  Flugmodus aus: Bilder füllen sich innerhalb von ~20 s nach.
- Artifact (14 MB, data-URI): Dex mehrmals öffnen und schließen, Team ↔ Dex wechseln, App in den Hintergrund und zurück.
  Es darf kein leeres und kein graues Feld bleiben.
- Schärfe der Dex- und Team-Bilder im Hoch- und Querformat, Glanzform-Funkeln, Key-Art-Karten (Legenden).
