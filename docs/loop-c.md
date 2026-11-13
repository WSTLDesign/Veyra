# Loop C – Welt I im Hybrid-Look

Agent „Loop C“ (Opus) · 12.11.2026 · Grundlage: AGENTS.md (HYBRID-LOOK, SPIELSTAND-SICHERHEIT), docs/hybrid-sky.md, docs/hybrid-h2.md, docs/qa-mechanik.md (Gegenprüfung Runde 1).
Neu: `src/49-welt1.js`, `test/unit_loopc.mjs`, `test/loopc_shots.mjs`, `test/loopc_gait_exp.mjs`, dieses Dokument. Hooks/Änderungen: `src/09-three3d.js` (2 Hooks), `src/44-sky.js` (1 Fehlerbehebung), `src/12-intro.js`, `src/14-battle.js`, `src/15-ui.js`, `src/16-expansion.js`, `src/02-world.js`, `src/38-models.js`, `src/styles.css` (Block „LOOP C“), `tools/render_assets.mjs` (Chromium-Schalter), Tests `unit_encounter`, `unit_fieldmoves`, `qa_mech_walk`, Doku `funde.md`, Bilder `public/art/place_*` (12 Karten).

## 1. Umfang: welche Karten sind Welt I?
Kanon-Regionen Lichtlande, Smaragdwald, Flutküste, Glutlande (Aurenstadt gehört zu den Lichtlanden). Es gibt noch keine Kanon-Karten (Aurenstadt, Wurzelheim …); die heutigen Karten sind über `SKY_MAPREG` (44-sky) und `SITES` (27-story) den Regionen zugeordnet:

| Region | Karten | Kanon-Ort laut Story |
|---|---|---|
| Lichtlande | morgenau, route1, route3 „Sonnenhang“, siegesstrasse | Aurenstadt-Start, Finale |
| Smaragdwald | kupferhain, route2, fluestertal | Wurzelheim, Schattenhain (Flüstertal) |
| Flutküste | brisenhafen, windkueste, moewenbucht | Azurhafen, Muschelbucht, Leuchtturmklippen |
| Glutlande | glutschlucht | Emberklamm |
| (Kristallgebirge) | nebelgrotte – nur der Kristall-Einzelpunkt | Altwurzeltempel / Tiefenmine |

**Himmelsweiten** haben keine eigene Karte (Region 5 = Welt II, Loop D; heute Interim auf route3 „Sonnenhang“). Dort stehen in Loop C nur zwei Windmühlen am Horizont als Vorbote. Frostheim, Route 4, Schattmoor bleiben unverändert (Loop D).

## 2. Mechanik (`src/49-welt1.js`)
- **Regions-Look (nur 3D):** Hüllen um `palOf`/`th3`/`leadOf` (Cache je Karte) – Palette, Nebeltönung, Baumart, Leitfarbe je Region (`W1R`). Hook `w1TreeTint` in 09 färbt einen Anteil der runden Baumkronen: Lichtlande 40 % Kirschblüte, Glutlande 60 % Ahorn rot/orange, Flüstertal 32 % Silber-Lavendel. Smaragdwald mischt Nadel- und Laubbäume (`tree:'forest'`).
- **Wahrzeichen/Requisiten:** Tabelle `WELT1[karte].lm` + Bausteine `W1LM`; Hülle um `landmarks3d` – alle Teile gehen in die zusammengeführten Meshes `TOWN`/`GLOW` von 09 (Tag-/Nachtfarbe, Fensterlicht) → **kein zusätzlicher Draw-Call je Objekt**. Automatisch (`w1Auto`): Übergangstore, Leuchtpilze an Waldrändern, Glut-Kristalle an Felsen/Klippen, Bougainvillea an Hausecken, Seesterne/Muscheln am Wasser, Sonnenbanner an öffentlichen Gebäuden. Requisiten stehen nie höher als 0,1 auf begehbaren Feldern (keine Kollision).
- **Übergänge ohne Nähte:** (1) an jedem Kartenausgang ein Torpfosten-Paar außerhalb der Karte, Banner + Lichtkristall in der Farbe der **Zielregion** – man sieht schon vor dem Wechsel, wohin der Weg führt; (2) Himmel: beim Betreten einer Karte werden Skybox (aktuelle Tageszeit) und Kulisse der Nachbarregionen vorgeladen und gehalten (`skyTexture(key,true)`); wechselt die Region, steht das neue Bild sofort (vorher 0,8 s Aufblenden über dem prozeduralen Himmel).
- **Blickrichtung beim Verlassen eines Hauses** (`welt1Face`, Hülle um `warpBack`): Tabelle je Ort, sonst die Richtung mit dem freiesten Blick (Gebäude/Bäume/Wände direkt vor der Kamera vermeiden).
- **Spawn-Korrektur** (`w1SpawnFix`, Hülle um `loadMap` mit fester Position): Erreichbarkeit von Ein-/Ausgängen (Türen, Kartenkanten) nach Spielregeln (Wasser nur mit Schwimmen, Felskanten nur abwärts, Wände nur mit Klettern). Ist das Feld abgeschnitten **und** gibt es keinen Weg hinaus, wird die Figur aufs nächste erreichbare Feld gesetzt. Kein neuer Spielstand-Schlüssel, keine Flag-Umbenennung.
- **Fehlerbehebung 44-sky:** `skyRegion('<id>')` gab für jede String-ID „lichtlande“ zurück (MAPS-Einträge haben kein `.id`). Betraf die Dex-Hinweise der versteckten Wesen (47-finds: alle „in den Lichtlanden“) und das Vorladen. Jetzt echte Region.

## 3. Änderungen je Ort
| Ort | Region | Änderungen |
|---|---|---|
| Morgenau | Lichtlande | **Spawn-Fix:** aus dem Elternhaus (4,5) Blick nach rechts die Dorfstraße entlang statt aufs Labordach; Kristallturm von Aurenstadt im Nordosten, zwei große Kirschblütenbäume, Kirschblüten in den Baumkronen, goldene Leitfarbe, Übergangstor nach Route 1 |
| Route 1 | Lichtlande | Kristallturm (Blickachse nach Norden), Kirschblütenbäume links/rechts, Blütenkronen, Tore nach Morgenau/Kupferhain (Smaragd-Grün) |
| Route 3 „Sonnenhang“ | Lichtlande | Kristallturm im Nordwesten, zwei Windmühlen im Nordosten (Vorbote Himmelsweiten), Kirschblüten, Tore Frostheim (eisblau) / Brisenhafen (türkis) / Glutschlucht (glutrot) |
| Siegesstraße | Lichtlande | großer Kristallturm hinter der Liga, Sonnenbanner vor Liga und Kreaturenstation, Kirschblütenbäume |
| Kupferhain | Smaragdwald | Wald-Look (Nadel + Laub, sattes Grün, goldener Dunst), zwei Baumhäuser (Gruß aus Wurzelheim), Leuchtpilze an den Waldrändern |
| Route 2 | Smaragdwald | Nadel/Laub-Mischwald, Baumhaus im Norden, Leuchtpilze am Teich, Tor nach Brisenhafen in Flutküsten-Türkis |
| Flüstertal | Smaragdwald | **Bäume neu:** keine violetten Kugelkronen mehr – Kronen tief petrol-grün, ein Drittel silber-lavendel; **Gras** salbeigrün statt kräftigem Goldgras; Boden moosgrau; Mondsteine mit leuchtenden Runen am Rand, viele Leuchtpilze |
| Brisenhafen | Flutküste | Segelschiff (Fähre) draußen auf See, zwei Ruderboote im Hafenbecken, Bougainvillea an den Hausecken, Seesterne/Muscheln am Ufer, türkise Leitfarbe |
| Windküsten-Pfad | Flutküste | Leuchtturm der Leuchtturmklippen in der Ferne (Süden), Ruderboot, Muscheln, Tore |
| Möwenbucht | Flutküste | Segelschiff am Steg (Dreiviertelansicht, gewölbte Segel), Ruderboote, Bougainvillea, Seesterne |
| Glutschlucht | Glutlande | Vulkan mit Lavaströmen und Kraterglut im Norden, Obsidian-Festung (Flammenkrone) als Silhouette, rote Ahornbäume, Glut-Kristalle an Felsen und Klippen, Feuerschalen an der Hütte (Fackellicht), **Sperren** nur noch am Schatzweg (s. 4) |
| Nebelgrotte | (Kristallgebirge) | Kristall (10,9)/(12,9), der im Eingangsblick hinter Reiten/Chronik lag, entfernt; großer Grottenkristall links vom Weg (5,8) gut sichtbar |

## 4. QA-Restliste
- **B2 `grassAmbush`** (toter Code) aus `14-battle.js` entfernt; `unit_encounter` prüft jetzt das Fehlen. Hinweis: die alten QA-Skripte `qa_enc_r1.mjs`, `qa_mech_enc.mjs` (Teil „alter Hinterhalt“), `qa_p3_a.mjs` rufen `grassAmbush` noch direkt auf und sind in diesem Teil überholt.
- **O1 Opening:** `OP.DUR` 5,2 → 4,3 s, plus 0,65 s Blende = **4,95 s** (vorher 5,9 s); Überspringen weiter ab 1 s; Strahlen-Ausblendung an die neue Dauer gekoppelt.
- **L1b Rennen** (`38-models.js`, `GAIT_RUN`): Hüfte beim Rennen 0,06 tiefer (federnde Standphase, mehr Reichweite → kein Fersen-Hochreißen), Hüft-Ratengrenze 0,008/Frame, Armschwung −25 %, Ratengrenze für den Schwungfuß 26 rad/s (nur in der Luft → Standfuß bleibt exakt). Messung `test/loopc_gait_exp.mjs` (60 fps, Knochen max. je Frame):

| | vorher | nachher |
|---|---|---|
| Rennen 7,5 Felder/s | 1,083 | **0,771** |
| Gehen → Rennen | 0,979 | 0,840 |
| Bremsen | 0,921 | 0,693 |
| Gehen / Anlauf / Stand | 0,350 / 0,402 / 0,353 | unverändert |
| Gleiten Standfuß (Rennen) | 0,0054 | 0,0080 (Grenze 0,02) |

  **Schwellen `qa_mech_walk`:** (1) Standbein-Knie ≥ −0,30 statt −0,25: Standbein folgt exakt der IK mit Hüft-Bob, Beugung in der Standmitte ≈ 15° (−0,26 rad) = Abfederung wie beim Menschen (15–20°). (2) Übergänge nach Tempo getrennt: Gehen/Anlauf/Stand < 0,45 rad/Frame; Rennen/Bremsen/Übergang < 0,9: bei 7,5 Feldern/s und 0,37 Beinlänge (≈ 4,7 Doppelschritte/s, Standphase ≈ 3 Frames) überstreicht allein der Standoberschenkel ≈ v/(L·60) ≈ 0,38 rad je Frame, das Knie federt in derselben Zeit ein und aus – ohne Gleiten physikalisch nicht unter ≈ 0,7.
- **Glutschlucht-Sperren** (`16-expansion.js`): vorher sperrte Geröll (9,7) den ganzen Ostteil mit Ruska, Hagen und (hinter Dornen) Ilka. Jetzt: Ostteil frei; Ilka steht bei (13,13) (02-world); die drei Hindernisse bilden eine Kette **nur zum Schatz**: Dornen (14,14) → Wasser (9,18) → Geröll (3,18) vor einer Nische aus Ahornbäumen (Felskante (1,19) erlaubt nur den Sprung hinaus). Texte: Hagen „Meine Esse ist heiß. Mein Team auch!“, Hitzeprobe „Sie wohnt im Osten der Schlucht.“ `unit_fieldmoves` prüft jetzt auch die Glutschlucht (Ausnahme entfernt). Alte Stände: `G.mods` bleibt gültig; wer schon alle drei Hindernisse geräumt hatte, aber den Schatz nicht hat, braucht einmal Felsschub für die neue Nische.
- **Dex-Hinweis** (`15-ui.js` `dexHint`, CSS-Block „LOOP C“): ungesehene Felder mit Hinweis tragen einen kleinen Signatur-Punkt; Tippen zeigt „Hinweis: Lebt im hohen Gras: Route 1.“ / „Kommt nachts heraus: …“ / „Beißt beim Angeln an: …“ / „Irgendwo im Smaragdwald versteckt.“ / „Entwickelt sich aus …“ / „Eine Legende. Folge der Geschichte!“ (höchstens 45 Zeichen). 127 von 153 Feldern haben einen Hinweis.

## 5. Spielstand-Sicherheit
- Keine neuen/umbenannten Schlüssel oder Flags (Flags `tr_ilka`, `tr_hagen`, `sq_schatz`, `it_gs*` unverändert); `G.mods` wird weiter angewandt.
- Spawn-Korrektur beim Laden (siehe 2.), geprüft in `unit_loopc` (Wandfeld → frei, Schatz-Nische → erreichbares Feld, normales Feld bleibt).

## 6. Ortsbilder
`node build.mjs && node tools/render_assets.mjs place --map morgenau,route1,kupferhain,route2,nebelgrotte,brisenhafen,windkueste,moewenbucht,route3,glutschlucht,fluestertal,siegesstrasse` (Kameras unverändert aus `tools/assets/places.mjs`, 2×-Supersampling). Frostheim, Route 4, Schattmoor behalten ihr Bild (Welt II). Größen siehe 7.

## 7. Tests und Messwerte (Ergebnis)
- `node build.mjs && node test/smoke.mjs` → **„Keine Fehler.“** (zweimal, zuletzt nach dem 44-sky-Fix).
- `test/unit_loopc.mjs` **17 ✓ / 0 ✗** (Opening 4,95 s, grassAmbush weg, 12 Ortsbilder neu, Artifact < 16 MB, Glutschlucht-Sperren, GAIT_RUN, Spawn frei, Spawn-Korrektur, Morgenau-Blick, Glutschlucht-Figuren erreichbar, Landmarken je Ort, Torpfosten je Ausgang, Nebelgrotten-Kristall, Draw-Calls, Himmel-Vorladen, Dex-Hinweis, keine Seitenfehler).
- Alle übrigen `unit_*` grün: art 20, battle 33, bigmap 24, capture, catchcard 29, dex_firstopen 29, encounter 18, fieldmoves 14, figures 32, finds 35, hybrid 29, introvideo 40, migration 27, opening 24, qa3 36, savesafe 15, sky 15, species 33, story 26, walk 17. `qa_mech_walk` **10 ✓ / 0 ✗** (vorher 8/10).
- Draw-Calls (860×484, high, mit Kreaturen, Spielerblick): Morgenau 46→50, Route 1 47→50, Kupferhain 58→65, Route 2 56→66, Brisenhafen 68, Windküste 67→70, Möwenbucht 64, Route 3 88→91, Glutschlucht 59→58, Flüstertal 65→68, Siegesstraße 82, Nebelgrotte 73 – alle ≤ 150. Dreiecke +2…+20 k.
- Ortsbilder: 12 × `place_<karte>.webp` 13,6–43,2 KB (zusammen 449 KB; `_lo` 4,6–14,6 KB). **`dist/artifact.html` = 14 000 991 B (14,0 MB)**, vorher 13,93 MB; Grenze 16 MB.
- Screenshots: `test/loopc_v0_*` (vorher), `test/loopc_v2_*` (Zwischenstand), `test/loopc_final_<karte>_tag.png` (12 Karten), `…_abend.png` (Morgenau, Route 1, Brisenhafen, Glutschlucht), `…_nacht.png` (Morgenau, Kupferhain, Glutschlucht, Flüstertal).

## 8. Offen
- Kanon-Karten (Aurenstadt, Wurzelheim, Azurhafen, Flammenkrone …) gibt es weiterhin nicht – Loop C hat die heutigen Karten im Look den Regionen zugeordnet; sobald Karten mit den IDs `stadt_*`/`ort_*` entstehen, greifen die vorhandenen Ortsbilder automatisch.
- Himmelsweiten ohne eigene Karte (Loop D); Frostheim, Route 4, Schattmoor, Ortsbilder dort unverändert.
- Vulkan/Festung/Kristallturm sind Grundkörper (lesbar, aber schlicht); Kirschblüten-Anteil und Requisiten-Dichte nach Handy-Test ggf. nachregeln.
- Morgenau: Der neue Blick nach rechts zeigt die Dorfstraße; die Kamera steht dabei nah an der Hauswand (Kamera-Kollision 09) – auf dem Gerät prüfen.
- QA-Skripte `qa_enc_r1.mjs`, `qa_mech_enc.mjs` (Teil „alter Hinterhalt“), `qa_p3_a.mjs` nutzen das entfernte `grassAmbush` (überholt).
- Requisiten ohne Kollision (Bougainvillea ragt ≈ 0,25 Feld auf den Weg vor Hausecken).
- Torpfosten-Banner seit dem Render zur Karte gedreht (Banner ist beidseitig gleich gefärbt, Ortsbilder dadurch unverändert gültig).
