# Große Karte (Agent „Karte“, Opus hoch) – 10.11.2026

Nutzerwunsch 21:46: „Die kleine Map … vergrößern können – nochmal ein Klick drauf, dann eine große Ansicht der Map, wo man gerade ist und was man da alles machen kann.“
Zusatz 21:52: stufenlos zoomen – erst die eigene Region, dann Nachbarregionen und ganz Veyra, inkl. „was noch übrig ist“ (unbesucht grau/vernebelt mit Namen).

## Bedienung
| Aktion | Wirkung |
|---|---|
| Tipp auf die sichtbare Minikarte (`#mmW`, kleines ⤢-Abzeichen) oder Taste **M** | öffnet die große Karte (Ebene „Hier“) |
| X · Escape · M · Tipp außerhalb des Fensters | schließt |
| Umschalter **Hier · ‹Region› · Veyra** | Abkürzung zwischen den drei Ebenen |
| Zusammenschieben (Pinch), Mausrad, Knopf **−** | rauszoomen; unter der Mindestgröße geht es stufenlos zur nächsten Ebene (Karte → Region → Veyra) |
| Auseinanderziehen, Mausrad, Knopf **+** | reinzoomen; Veyra → Region, Region → Karte (wenn die eigene Karte das Bild füllt) |
| Ziehen · Doppeltipp · Knopf ◎ | verschieben · Ansicht zurücksetzen · zu mir |
| Tipp auf ein Symbol / einen Ort | Infokarte (Name, Region, Medaille erhalten/noch offen, Entfernung in Karten, ggf. Schnellreise-Knopf) |
| Vorschlag-Knopf unten | fährt zum Ort und zeigt die Infokarte |
| Tasten im Fenster | +/− zoomen, Pfeile verschieben, 1/2/3 Ebene |

Solange die Karte offen ist: `mode='menu'` (Zeit steht, keine Begegnungen, Schleife im Leerlauf-Takt), die Welt wird **nicht neu gezeichnet** (`draw3d`/`draw`-Hülle in 46), Musik läuft weiter. Öffnet nur aus `mode==='world'` ohne Kampf.

## Ebenen
1. **Hier** – aktuelle Karte als weiche, gerenderte Übersicht in den Theme-Farben (`PAL` + `PALETTE.themeAccent`): Wege/Wasser/Gras als verbundene Rundformen, Bäume mit Licht-Verlauf, Gebäude mit Dachfarbe (`ROOF`), Türen, Brücken, Felskanten, Höhlenwände, Innenräume (Regale, Tische, Theke). Hintergrund = Himmels-/Horizontfarbe der Hybrid-Himmel (`skyFor(region,zeit).stats`), Nacht leicht getönt.
   Marker: Spieler (pulsierend, Blickrichtung `P.ang`), Begleiter (Illustration), Figuren (Sprechen = Sprechblase, Herausforderer = Stern, Händler = Beutel, Kreaturenstation = Herz, Medaillen-Halle = Medaille), Türen mit Namen, Ausgänge mit Pfeil + Zielname (gesperrt: „(zu)“), hohes Gras/Wasser/Gleit-Kante/Kletterwand (größte Bereiche je Art; ausgegraut, solange nicht freigeschaltet), Glitzersachen (`item/scroll/hidden/sparkle`, nur wenn noch nicht gefunden), wilde Kreaturen, Nebenmissionen (`SQ`, Bedingung erfüllt, Ziel auf dieser Karte), aktuelles Ziel (Nadel + Ring; `guidePoint()`; liegt es woanders, an Ausgang/Tür in Zielrichtung).
   Zeile **„Hier kannst du:“** 2–5 kurze Vorschläge aus den Kartendaten (Ziel, Medaille, Figur mit Geschichte, Nebenmission, Gras, Station, Laden, Glitzersachen, Herausforderer, Schwimmen/Gleiten/Klettern, Ausgänge).
   Antippen leerer Flächen erklärt das Gelände (Gras, Wasser, Dornen …).
2. **Region** – Atlas aller 15 Außenkarten, angeordnet nach `MAPS` n/s/o/w (+ Höhlen über Tür), mit Wegen dazwischen. Rahmen: Region der aktuellen Karte (`skyRegion`) als zusammenhängende Gruppe + direkte Nachbarn. Besuchte Karten farbig (Rahmen in Regionsfarbe), unbesuchte grau/vernebelt mit Namen „· ?“. Marker: Medaillen-Hallen (alle 8, auch noch nicht erschienene Leiter; Namen aus `FIGURES[...].ort`, z. B. „Sturm-Arena“, „Garten-Tempel“), Turmrat + Kronenhüterin Ardena (`T_('elite')`, `T_('champTitle')`), Kreaturenstationen, Schnellreise-Punkte, Händler/Läden, offene Nebenmissionen, Ziel, „Du bist hier“.
3. **Veyra** – Weltbild `public/art/map_veyra.webp` (vorhanden, kein neues Bild) mit Orten (`BM_WPOS`), eigenen Regionsschildern über den gemalten (inkl. Element-Symbol; „Schattenmoor“ statt des gemalten Altnamens, „Frosttundra“ ergänzt), weichem Nebel über Regionen ohne besuchte Karte, Medaillen/Herz/Turmrat-Symbolen je Ort, Ziel, „Du bist hier“. Ohne Bild: schematische Regionskarte. Schnellreise: wenn `canFastTravel()` (erste Medaille), Tipp auf Ort mit Herz → Infokarte mit Knopf „Schnellreise nach …“ (= Bestätigung) → `playSeq('fastTravel', …)` wie in der Chronik.

## Technik
- Dateien: `src/46-bigmap.js`, `src/styles-map.css`; Build hängt `src/styles-*.css` alphabetisch an `styles.css` an (`build.mjs`, eine Zeile).
- Hook: in 46 selbst – `click` auf `#mmW` (nur wenn `.show`) → `openBigMap()`; Taste M über einen `keydown`-Capture-Handler auf `window` (vor den Spiel-Handlern; M öffnete vorher die Chronik). **15-ui.js unverändert.**
- Globale API: `openBigMap(lvl?)`, `closeBigMap()`/`bmClose()`, `bmSetLevel('here'|'region'|'world')`, Zustand `BM` (`open, lvl, v{s,x,y}, L[ebene].poi, hits`).
- Leistung: Grundbild je Ebene einmal in Canvas 2D (Auflösung gedeckelt 2600/3600 px), Zoom/Ziehen nur per CSS-Transform; die Marker-Ebene (Bildschirmgröße) wird je Frame neu gezeichnet (Pulse), bei reduzierter Bewegung nur bei Änderung. Keine 3D-Aufrufe, keine Bibliothek, kein neues Bild. Weltbild wird 5 s nach Start vorab dekodiert.
- Lesbarkeit/Kind: Touch-Ziele ≥ 48 px (Umschalter, X, Zoom, Legende, Vorschläge, Zielkarte, Schnellreise), Treffer-Radius der Marker ≥ 24 px, dunkle Schrift auf Glas ≥ 88 %, Typ/Art immer Farbe + Symbol, Legende einklappbar.

## Prüfung
`node build.mjs && node test/unit_bigmap.mjs` (24 Prüfungen; `NOSHOTS=1` ohne Bilder) → Screenshots `test/bigmap_hier_<karte>.png` (kupferhain, route1, windkueste, labor, nebelgrotte; 1920×1080), `test/bigmap_hier_<karte>_860.png` (860×484), `test/bigmap_region_smaragdwald.png`, `test/bigmap_region_860.png`, `test/bigmap_veyra.png`, `test/bigmap_veyra_860.png`.

## Offen / Ideen
- Kartenlage im Weltbild (`BM_WPOS`) ist von Hand gesetzt; neue Karten brauchen dort einen Eintrag (sonst nur in Region/Hier).
- Himmelsweiten hat noch keine Karte → nur Schild + Nebel.
- Chronik-Kartenseite (15-ui) könnte einen Knopf „Große Karte“ bekommen (braucht 15-ui).
