# Veyra – Projektgedächtnis (Staging)

Stand: 13.11.2026, 10:55 · gepflegt vom Dirigenten · Quelle: Chat „Staging-System Aufbau“ (12.–13.11.)
Zweck: Alles Wichtige aus den Chats an einem Ort, damit bei einer Komprimierung des Chats nichts verloren geht. Neue Entscheidungen und Ergebnisse werden hier ergänzt, nie gelöscht.

---

## 1. Überblick und Zugänge

- **Spiel:** „Veyra – Kreaturenchronik, Die Welt der Terras“, eigenes Monster-Sammel-RPG für ein kleines Kind, Deutsch, Vollbild 16:9 quer auf Handy/Tablet, später App/PWA.
- **Repo:** GitHub `WSTLDesign/veyra` (privat). Branch `staging` = alle Agenten-Arbeit, Branch `main` = nur freigegebene Stände (Live).
- **Staging-Leitstand (Tool des Nutzers):** https://claude.ai/artifact/JXDZfPmFX3wRZA4QXPk7m4 – Bereiche „Leitstand“ (Agenten, Strecke, Tests, Freigabe, Feedback, Protokoll) und „Werkstatt“ (Werkstatt-Build spielen, Vorschauen freigeben/ablehnen, Bilder). Datenbank-Sammlungen: agents, log, pipeline, tests, freigabe, vorschau, shots, live, feedback.
- **Alte Werkstatt (nicht mehr beschreiben):** https://claude.ai/artifact/WdJ6RxXjSbrj2N92xU8F37 – Daten wurden in den Leitstand übernommen.
- **Geprüftes Spiel (Produktion):** Artifact https://claude.ai/artifact/Lrpv1XYiorMys1CKhopBKc und veyra-web.zip für Netlify (Produktions-Chat).
- **Projekt-Dokumente:** claude/ziele.md (Ziele/Entscheidungen), claude/uebergabe-staging.md (Übergabe 16:10), staging/STAGING.md + staging/tools/* (Staging-Werkzeuge), dieses Gedächtnis.
- **Im Repo:** AGENTS.md (Regeln, Melde-Protokoll Leitstand), docs/ziele.md, docs/*.md je Agent, PROGRESS.md.

## 2. Entscheidungen des Nutzers (chronologisch)

- 12.11. ~15:20 – Staging = Werkstatt-Build mit eigenem Spielstand; Produktion nur nach Tages-Okay. Dirigent entscheidet im Staging selbst anhand von ziele.md, fragt bei Unklarheit.
- 12.11. 15:28 – Quellcode und Spiel aus Downloads übernehmen (veyra-web.zip, veyra-app.zip Stand 16:05).
- 12.11. 16:05 – **Quellcode privat und unverschlüsselt** im Repo; **veröffentlichtes Spiel verschleiern** (tools/protect.mjs). Kein Login vor Staging/Live gewünscht.
- 12.11. 16:16 – Staging-Tool bauen, angelehnt an die Werkstatt.
- 12.11. 16:20 – Werkstatt NICHT als Link, sondern im selben Tool umschaltbar (Tabs „Leitstand“ / „Werkstatt“).
- 12.11. 16:50 – Figuren und Terras sollen deutlich „echter“ wirken; Team zur Recherche (Maßstab: neue Pokémon-Spiele).
- 12.11. 16:53 – **Ladebildschirm nur bei Wechsel in neue Gebiete**, NIE bei Häusern/Innenräumen. Gehen/Rennen verbessern; Türen/Höhleneingänge müssen beim ersten Anlauf auslösen.
- 12.11. 16:55 – **Look-Ziel: wie die neuen Pokémon-Spiele** (hochwertig stilisiert, nicht fotorealistisch); Pokémon NUR Technik-/Qualitätsmaßstab, Designs bleiben eigen. **Echte 3D-Modelle (GLB, per Blender-Skript) erlaubt.**
- 12.11. 16:55 – Rennen 5 statt 7,5 Felder/s (vom Dirigenten gesetzt, jederzeit umkehrbar).
- 12.11. 17:01 – Pause bis 19:30; 22:57 – Pause bis 00:30 (Nutzungslimit 78 %, parallel Website-Aufgabe).
- 12.11. 22:58 – Ziel bis 13.11. 7–8 Uhr: ~90 % Anmutung von Pokémon Legends.
- 13.11. 03:18 – Ziel **90–95 % Legends-Anmutung** bei Charakteren, Terras, UI-Design, Stadt und Welt; Team ruhig arbeiten lassen.
- 13.11. 03:19 – Pause bis 05:30 (Limit 95 %); Limit erneut ~07:40 erreicht, Fortsetzung 10:38.
- 13.11. 10:40 – Prüfen, ob Staging auf dem PC flüssig läuft und sich jederzeit beenden lässt.
- 13.11. 10:51 – Frage Modellwahl: Empfehlung Dirigent Opus 5.5, Bau-Agenten Opus 5.5 hoch, Tests Sonnet 5.5 hoch; größter Hebel fürs Limit = weniger parallele Opus-Agenten.
- Offen (Nutzer): Umriss „dünn“ oder „fast keiner“ (Vorschau in Werkstatt); neue Kampfarena nur mit Modellen oder für alle; Reduzierung auf 2 parallele Agenten?

## 3. Arbeitsregeln

- Bei jedem Schritt Modell und Stufe nennen. Tokenoptimiert beim Dirigenten; Agenten dürfen ausführlich arbeiten (Max-Plan).
- Nutzungslimit 5 h: bei ~85–95 % alles stoppen, Stand sichern, Neustart zur Rücksetzzeit einplanen (Uhrzeit nennt der Nutzer).
- Vorschau vor Einbau: Sichtbares erst als Vorschau in der Werkstatt; neue Modelle im Spiel nur hinter Schalter `SET.modelle3d` / `?modelle3d=1` (im Werkstatt-Build standardmäßig an).
- Container: 2 Kerne/8 GB → Sperren `.chromium.lock` (immer nur EIN Browser) und `.blender.lock`.
- Jede Änderung: `node build.mjs && node test/smoke.mjs` („Keine Fehler.“); Übergänge: `node test/uebergaenge_qa.mjs`.
- Spielstände bleiben kompatibel. Keine Fremdbegriffe/-designs. Runway/Meshy nicht nutzen.
- Agenten committen nicht; der Dirigent prüft (Bilder ansehen), committet, pusht (Branch staging) und meldet im Leitstand.

---

## 4. Agenten und Bereiche

### 4.1 Dirigent / Orchestrator
- Modell: Opus 5.5 (diese Sitzung; früher Fable 5.1 mittel geplant).
- Aufgaben: Agenten starten/fortsetzen/stoppen, Ergebnisse prüfen, Repo, Leitstand, Werkstatt-Build, Berichte an Christoph.
- Werkstatt-Build: `node build.mjs && node tools/werkstatt-build.mjs "<Text>"` → tools/leitstand/spiel/index.html; Modelle als data-URI-Skripte `spiel/models/<bereich>/<id>.js` (Artifacts liefern keine .glb), Loader/Draco als `spiel/vendor/**`. Veröffentlichen: Artifact publish file_path tools/leitstand/leitstand.html mit files.
- Bekannte Plattform-Eigenheiten: Artifact-Snapshots haben kein `ref` (Freigabe-Fehler 22:10 behoben → `db.doc('vorschau/'+id)`); iPhone erlaubt im Iframe kein echtes Vollbild (Seiten-Vollbild gebaut); CDN-Abrufe im Artifact blockiert.

### 4.2 Staging-Infrastruktur (fertig)
- tools/make-staging.mjs (eigene Speicherschlüssel `veyra_stg_*`, eigener SW-Cache, Manifest „Veyra STAGING“, Badge + Debug-Menü, noindex), tools/protect.mjs (Verschleierung), tools/smoke-staging.mjs, tools/smoke-live.mjs, tools/werkstatt-build.mjs, netlify.toml (main → Live, staging → Staging).
- Debug-Menü (orange Plakette / Strg+Shift+D): Schnellstart ohne Intro, Team heilen/Level, Kreatur ins Team, Wildkampf, Dex komplett, Reisen, Items, Tag/Nacht, Spielstand kopieren/einfügen/löschen, Fehlerprotokoll.
- Tests: Live 9/9, Staging 28/28 (12.11.). Playwright fest auf 1.63.0 (Chromium 1243).
- Offen: Netlify-Site „veyra-staging“ mit dem Repo verbinden.

### 4.3 Übergänge & Bewegung (fertig, 12.11. ~21:30)
- Ursache wackelige Übergänge: Auslösen nur auf exakter Türkachel, Kollision an Kanten neben Öffnungen, Kartenränder unerreichbar, Totzone > 33 %.
- Lösung: Auslösezonen, Rutschen in Öffnungen, Sperre nach Ankunft; Ladebildschirm src/55-laden.js nur zwischen Außenkarten; Rennen 5 F/s, Gehen 2,8; sanftes Anfahren.
- Test: 28/28 beim ersten Anlauf (vorher 16/28), uebergaenge_qa 97/0. Doku docs/uebergaenge.md.
- Offen: Ladezeit am echten Handy, Kamera-Nachführung mit dem Kind testen.

### 4.4 Recherche 3D-Qualität (fertig)
- docs/recherche-3d-qualitaet.md: Vorbild = stilisiertes PBR, keine harte Cel-Optik. Zielwerte: Figur 6–12 k Dreiecke, Terra 4–10 k, 1024er-Texturen, weicher Toon-Shader mit Randlicht, dünner Umriss, MSAA. Blender als Python-Modul läuft ohne GPU.

### 4.5 Analyse 3D Ist-Stand (fertig)
- docs/analyse-3d-ist.md: alte Figuren aus 93–119 Einzelkugeln, keine Texturen; Terras im Kampf flaches Bild, in der Welt grobes Modell. Blender-Probe erfolgreich (Testkopf lädt im Spiel).

### 4.6 Pilot 3D-Modelle (fertig, abgelöst)
- Noa + Funki als GLB, Werkzeugkette tools/modelle/ (Blender in /home/claude/.venv-blender, gltf-transform in /home/claude/gltf-tools), Shader src/56-toonpro.js, Anbindung src/57-modelle.js. Doku docs/pilot-3d.md.

### 4.7 Figuren & NPCs (läuft, Runde 3)
- Baukasten tools/modelle/figuren/ (7 Körpertypen, Gesichtssystem, 9 Frisuren, Kleidung mit Falten, 32 Knochen), 10 Figuren in public/models/figuren/ (Noa, Rayan, Veyran, Mama, Mirael, Händler, 4 Bewohner), ~13,4 k Dreiecke, ~0,7 MB.
- Runde 2 (06:25, ~70 %): größere Augen, weichere Kopfform, Haar ohne Flecken, lockere Pose, Shader-Option `fig`.
- Runde 3 (läuft): jüngere Gesichtsproportionen, größere Augen, eine kräftige Lidlinie, Haar als Volumen-Büschel, entspannte Hände, Morgenau-Bild mit allen NPCs.
- Doku docs/figuren-3d.md, Test test/figuren2/test_modelle.mjs.

### 4.8 Terras-Serie (läuft, Runde 4)
- 12 Modelle public/models/terras/: t001–t009 (Glut/Flut/Flora-Linien), t059 Flausch, t061 Blinki, t112 Knabbi; Vorlagen Vierbeiner, Zweibeiner, Wassertier, Vogel, Schwebend; Clips idle/walk/run/attack/hit/faint/joy/catch.
- src/58-terramodelle.js: Kampf zeigt Modell statt Bild; neue Kampfarena (weiches Gras, runde Steine, Kampfkreis) nur mit Schalter.
- Runde 3 (~77 %; Flut/Blinki/Funki 80–85 %, Flausch 60 %), Test 29/29.
- Erkenntnis 10:45: die eigenen gemalten Bilder wirken „Legends-hafter“ als die Modelle (großer Kopf, große Augen, kurze Schnauze) → Runde 4 gleicht Modelle an die Bilder an; Flausch-Federn als Geometrie.
- Doku docs/terras-3d.md.

### 4.9 Welt-Grafik (läuft, Runde 5)
- src/59-grafik.js (Farbkurve „Veyra-Neutral“, Qualitätsstufen hoch/mittel/niedrig, Schatten, Bloom), src/09-three3d.js (Bodentextur, Kronen, Gras, Wasser, Gebäudetexturen), src/51-innen.js (Höhlenfels).
- Runde 1–4: ~70 → 75–80 → 80 → 82–85 %. Runde 4: Haus/Station als GLB (tools/modelle/welt/, public/models/welt/).
- Runde 5 (läuft): Labor, Laden, echte Fensteröffnungen, ggf. Arena/Türme – NUR noch 09-three3d.js und tools/modelle/welt (59/43 gehören jetzt „Stabilität PC“).
- Doku docs/welt-grafik.md.

### 4.10 UI-Design (fertig Runde 1, 07:35)
- src/styles-ui2.css (Designsystem „Morgenglas“), src/styles-schrift.css (Fredoka/Nunito lokal, OFL), src/60-uidesign.js (eigene SVG-Symbole, Titel mit Wortmarke „VEYRA – Kreaturenchronik“, HUD mit Uhr, Team-Kurzanzeige, runde Minikarte).
- ~80 % Titel/Kampf/Dialog, ~75 % Chronik/Team/Dex. Offen: Chronik auf großen Bildschirmen, Taschen-Symbole, Detailseiten, Fangkarte, Intro.
- Doku docs/ui-design.md.

### 4.11 Stabilität PC (läuft, gestartet 10:55)
- Befund Live-Test 10:45 (Chrome, HP 250 G10, Intel Iris Xe): Werkstatt-Spiel friert Tab ein (Außenseite 1,3 B/s), Beenden nicht bedienbar, nur Tab schließen half.
- Ursache (vermutet): GFX.strong-Regex zählt „Intel(R) Iris“ als stark → Stufe hoch + 26 Modelle gleichzeitig.
- Auftrag: integrierte GPUs → mittel/niedrig, 30 B/s; Wachhund senkt Stufe/Auflösung; Modelle nacheinander bei Bedarf; Beenden per postMessage + Strg+Q von außen; Pausieren im Hintergrund; Qualitätsschalter im Leitstand; Test test/stabil_qa.mjs. Doku docs/stabilitaet.md.
- Bis zum Fix: Werkstatt-Spiel nicht auf dem PC starten.

### 4.12 Geplant
- Art-Direktor & QA (Opus hoch: Bilder benoten, < 8 → Nachbesserung; Sonnet hoch: Regression).
- Test-Team (Sonnet hoch): Durchspielen, Fang, Schwierigkeit, Einstellungen.
- Welt Loop D: Kanon-Städte, Himmelsweiten, Frostheim, Schattmoor.

---

## 5. Stand Legends-Anmutung (Schätzungen der Agenten, 13.11. ~10:45)
| Bereich | Stand |
|---|---|
| Welt & Stadt | ~82–85 % (mit Modellen) |
| Terras | ~77 % (Spitze 80–85 %, Flausch 60 %) |
| Figuren & NPCs | ~70 % (Gesichter = größte Lücke) |
| UI | ~75–80 % |
| Gesamt (Dirigent) | ~75–80 % |

## 6. Offene Punkte / Feedback des Nutzers
- Vorschauen in der Werkstatt freigeben/ablehnen (18 offen, inkl. Umriss-Frage).
- PC-Stabilität (läuft).
- 48 Terra-Arten ohne gemaltes Bild (002, 003, 005, 006, 058, 060, 062, 099–139) – Nutzer soll fehlende erneut senden.
- Messungen auf echtem Handy/Tablet: Bildrate je Stufe, Ladezeiten, Bloom.
- Netlify-Staging verbinden; Produktion nur nach Tages-Okay.

## 7. Nachträge
- 13.11. 10:55 – Dirigent läuft ab jetzt auf Fable 5.2 (vom Nutzer umgestellt). Neue Sitzung + Übergabe geplant nach Stabilitäts-Fix (Übergabe-Datei claude/uebergabe-staging-2.md noch anlegen).
- 13.11. 11:03 – Handy-Test des Nutzers (iPhone, als App installierter Netlify-Build, Video): „sieht nicht nach Triple-A aus“. Befunde des Dirigenten: (a) Der Netlify-Build enthält neue Welt-Grafik und neues UI, aber der Schalter `modelle3d` ist dort AUS → alte Figuren; (b) der Nutzer spielt die HELDIN (Mädchen, Kappe, Pferdeschwanz) – sie hatte noch kein neues Modell; (c) App-Icon im Repo = angeschnittenes Küken, Nutzer will Marken-Icon (früher schwarzes „V“); (d) Titel wirkte „alt“ – Startablauf/PWA-Cache prüfen; (e) Gehen zu schnell.
- Maßnahmen 11:15: WALK_SPEED 2,8 → 1,9 (Rennen 5; uebergaenge_qa angepasst); SW-Cache-Name mit Build-Stempel (build.mjs); Aufträge: Figuren → Heldin-Modell + Gang-Clips; UI Runde 2 → App-Icon, Titel/Startablauf; Welt Runde 6 → Innenräume (keine dicken schwarzen Umrisse, Materialien, Licht).
- Offen an Nutzer: Wer/was lädt auf die Netlify-Site hoch (Produktions-Chat oder Repo-Anbindung)? Hinweis: Das Netlify-Abzeichen „Powered by Netlify“ verdeckt unten rechts den Aktionsknopf.
