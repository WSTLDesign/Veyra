# Veyra – Kreaturenchronik · Projekthandbuch

Stand: 17.11.2026, 18:30 (Europe/Berlin). Vollständige Zusammenfassung von Produktions‑ und Staging‑Chat, geschrieben für die Weiterarbeit in Claude Code. Dieses Dokument ist der Einstieg; Details stehen in den verlinkten Dateien im Repo.

---

## 1. Was Veyra ist

- Eigenes Monster‑Sammel‑RPG „Veyra – Kreaturenchronik, Die Welt der Terras“ von Christoph Wolfsteller, privat, Zielgruppe **ein kleines Kind**. Deutsch, kurze Sätze, leicht, Kämpfe rundenbasiert (eine Aktion je Kreatur nacheinander).
- Läuft als **PWA im Browser** (Handy/Tablet quer, PC), installierbar auf dem Home‑Bildschirm; Capacitor‑Vorbereitung für iOS/Android liegt im Repo.
- **Alle Kreaturen, Namen, Orte, Figuren, Grafiken, Musik sind eigene Entwürfe.** Pokémon/Nintendo und andere Marken dienen ausschließlich als Qualitäts‑ und Technikmaßstab (Lesbarkeit, Lebendigkeit, Spielgefühl). Nichts übernehmen, nachbauen, herunterladen oder „mit anderen Namen“ nachempfinden – das wurde mehrfach angefragt und jedes Mal abgelehnt.
- Qualitätsziel (13.11.): Anmutung so nah wie möglich an Pokémon Legends (90–95 %) bei Figuren, Terras, Welt/Stadt und UI. Art‑Direktion vom 16.11. stuft das als mit der jetzigen Werkzeugkette nicht erreichbar ein (siehe Abschnitt 8).

## 2. Spielinhalt (Stand Produktion)

- **Kreaturen („Terras“):** ~150 Arten in 10 Energien (Kern, Glut, Flut, Flora, Volt, Fels, Frost, Böe, Schatten, Lumen). Starter: Funki (Glut, #001), Plippi (Flut, #004), Knospi (Flora, #007). Fähigkeiten (auch versteckte), Wesenszüge, Anlage‑/Trainings‑Werte, Geschlecht, Freundschaft, Glanzform (1:400, ✦), getragene Items, 3 Legenden (Solaryn tags, Nocturyx nachts, Tempestar nach Champion) und Mythen. Entwicklungen per Level (meist 16/18 → 36/38), Kristalle (Licht‑, Dunkel‑, Donner‑, Frost‑, Blattstein), Freundschaft, Ort, Tageszeit, Attacke, Tausch, Spezialtraining. Gemalte Kreaturenbilder in public/art (48 Arten ohne Bild, Liste in docs/bilder.md). Kanon: docs/kreaturen-kanon.md, docs/dex-kanon.md.
- **Welt:** 16 Karten – Morgenau (Start, Labor Prof. Lindqvist/Veyran), Route 1, Kupferhain (Arena 1 Wilma/Blütenorden, Flora), Route 2, Nebelgrotte, Brisenhafen (Arena 2 Marlene/Wellenorden, Flut), Route 3, Frostheim (Arena 3 Eira/Gletscherorden), Route 4, Schattmoor (Arena 4 Corvin/Mondorden, Schatten), Siegesstraße, Liga (Top‑Drei Ronja/Bodo/Selene, Champion Kael) plus Windküste, Möwenbucht, Glutschlucht, Flüstertal. Innenräume (Häuser, Labor, Läden, Heilstationen, Arenen, Höhlen). Große Karte, Fundstücke, „Wege der Kreaturen“ (Dornen/Geröll/Eisbrücke/Höhle erhellen), sichtbare wilde Kreaturen, Begleiter, Bewohner mit Tagesablauf, Angeln, Schwimmen, Tag/Nacht (24 min), Wetter.
- **Story:** Dämmerorden (Meister Vargo), 9 Hauptmissionen, viele Nebenmissionen. Rivalen Rayan (Glut, rot, vorlaut, lernt Teamgeist) und Mira/Mirael (Flut, blau, clever, wird Verbündete). Referenzen public/art_ref/. Details docs/story.md.
- **Kampf:** rundenbasiert (Echtzeit‑Leisten als Option), 6 Werte, phys/spez, Prioritäten, Typentabelle, Status, Fähigkeiten, Items, Signatur „Resonanz“, 6 Kapselarten (Kristall‑Fangkapsel), Ergebnis‑ und Fangkarte, Hit‑Stop/Shake/Schadenszahlen.
- **UI:** Designsystem „Morgenglas“ (hell, Orange #ff7a3d, Türkis), Chronik‑Menü (Dex, Team, Tasche, Karte, Missionen, Optionen), HUD, Sprechblasen mit Porträt, Steuerkreuz/Joystick, Tastatur (WASD/Pfeile, E/Enter, Esc, Shift = Rennen, R entfernt). Gehen 1,9 / Rennen 5 Felder/s. Ladebildschirm nur bei Gebietswechsel, nie bei Innenräumen.
- **Darstellung:** three.js r128, Cel‑Shading (MeshToonMaterial + toonGrad, 56‑toonpro), Hybrid (gemalte Himmel/Kulissen + 3D), 3. Person/Ego (2D versteckt). Seit 12.11. echte GLB‑Modelle (per Blender‑Skript gebaut) für Figuren (public/models/figuren, 11 Figuren) und Terras (public/models/terras, 12 Arten); im Staging hinter Schalter `?modelle3d=1`, in Produktion noch aus.
- **Technik/Komfort:** PWA (Service Worker mit Build‑Stempel), Spielstand‑Sicherheitsnetz (localStorage `veyra_save_v1`, Backups, IndexedDB‑Spiegel, Export/Import), Optionen (Qualität, Auflösung, fps, Barrierefreiheit, Textgeschwindigkeit …), generative Musik/SFX, Intro‑Video (public/video, überspringbar nach 15–20 s), Stabilitätssystem (61‑stabil: Regelstufen, Wachhund, Notbremse; 59‑grafik: Handy‑Budget ≤ 100 k Dreiecke / ≤ 60 Draw‑Calls; 62‑lod: Laufzeit‑LOD, Shader‑Vorkompilierung).

## 3. Repo und Technik

- **GitHub:** `WSTLDesign/Veyra` (privat halten!). Branch **`main` = Produktion**, Branch **`staging` = Staging**. Lokaler Arbeitsordner im Container: `/home/claude/veyra`.
- **Netlify (Team „Veyra“, Free, Konto Christoph):** Live‑Site `veyra-terras-k7q3` → https://veyra-terras-k7q3.netlify.app, baut automatisch aus `main` (`npm run build:live`, publish `dist`). Staging‑Site „veyra-staging“: Branch‑Kontext in netlify.toml vorbereitet; bislang wird die Staging‑Zip manuell per Drag & Drop hochgeladen (Anbindung an Branch `staging` offen). **Die Staging‑Zip darf nie in die Live‑Site.**
- **Build:** `node build.mjs` → `dist/index.html` (eine Datei, Module aus `src/` nummeriert zusammengefügt, globaler Scope, kein Bundler) + `dist/artifact.html`. `src/shell.html`, `src/styles*.css`. Node 22.
- **Code‑Schutz:** `tools/protect.mjs <ordner>` entfernt Kommentare, verkürzt Namen, keine Source‑Maps – auf jeden veröffentlichten Build (Live, Staging, Werkstatt).
- **Staging‑Werkzeuge:** `tools/make-staging.mjs <web-build> <ziel> --note "…"` (eigene Speicherschlüssel `veyra_stg_*`, orangenes Badge, Debug‑Menü Strg+Shift+D, noindex), `tools/smoke-staging.mjs`, `tools/smoke-live.mjs`, `tools/werkstatt-build.mjs "<Text>"` (→ tools/leitstand/spiel/index.html mit GLBs als data‑URI‑Skripten), `tools/staging-overlay.js`.
- **Netlify‑Zip‑Rezept:** `node build.mjs && node tools/make-staging.mjs dist <S>/stg --note "…" && node tools/protect.mjs <S>/stg && (cd <S>/stg && zip -qr ../veyra-staging-netlify-N.zip .)` (≈ 49 MB). Zuletzt Zip 6 (Stand 07c2ddc).
- **Pflichttests (alle müssen grün sein, Playwright 1.63, Chromium `--use-gl=swiftshader`):**
  - `node test/smoke.mjs` → druckt wörtlich „Keine Fehler.“ (kein Exit‑Code bei Fehlern!)
  - `node test/uebergaenge_qa.mjs` → 97 ✓
  - `node test/stabil_qa.mjs` → 62 ✓ (> 15 min)
  - `node test/figuren2/test_modelle.mjs` → 101 ✓
  - `node test/terras2/terras2_test.mjs` → 35 ✓ (ein 1,5‑s‑Kampf‑Zeitfenster flackert gelegentlich → einmal wiederholen)
  - `node test/name_eingabe.mjs` → 4 ✓
  - Art‑Direktion‑Aufnahmen: `node test/artdir/shots.mjs <handy|hoch> [motiv,…]`
- **Container‑Regeln:** 2 Kerne/8 GB. Nur EIN Chromium gleichzeitig (Sperre `.chromium.lock`), Blender nur mit `.blender.lock`. Tests unter Agentenlast (Last > 4) liefern Scheinfehler (Timeouts) – nur bei freier Maschine werten. Blender kann im Container keine Workbench‑Bilder rendern (EGL) → Sichtprüfung nur im Browser. Parallel laufende Agenten bauen `dist/` neu → Aufnahmen können gemischte Stände zeigen.
- **Modellbau:** `tools/modelle/figuren/{figuren.py,fkit.py,fkit2.py}`, `tools/modelle/terras/`, `tools/modelle/vlib.py`; Blender als Python‑Modul im Container. GLB‑Attribut `_LODW` (Schutzgewicht je Ecke für den Laufzeit‑Vereinfacher). Budgets: Figur Haupt ≤ 9 000 (Heldin ≤ 9 300), GLB‑LOD1 ≤ 4 000, Laufzeit‑Hülle ≈ 3 200; Rig 32 Knochen, 7 Clips, 9 Shape Keys unverändert lassen.
- **Commits:** Attribution `Co-Authored-By: Claude <Modell> <noreply@anthropic.com>` + `Claude-Session: <URL>`. `__pycache__` ist ignoriert. Nie committen: Netlify‑Passwort, Zugangsdaten.

## 4. Arbeitsweise und Regeln (vom Nutzer festgelegt)

- Rollen: **Dirigent** (Orchestrator, Fable 5.1 mittel, tokenoptimiert) steuert **Agenten je Thema** (Subagenten, dürfen ausführlich arbeiten, Umfang nicht kürzen; Max‑Plan). **Bei jedem Arbeitsschritt Modell und Stufe nennen.**
- **Modell‑Zuweisung je Agent** liest der Dirigent vor jedem Start aus dem Leitstand (agents/<id>.zuModell/zuStufe). Stand 16.11.: Stabilität/Terras/Welt Opus 5.5 hoch, Figuren Sonnet 5.5 hoch (R6), UI Sonnet 5.5 mittel, Art‑Direktor Opus 5.5 max, Test‑Team Haiku 5.5 mittel. Ohne Eintrag: Opus 5.5 hoch.
- Jeder Agent bearbeitet nur seine Dateien (AGENTS.md), committet nicht (der Dirigent committet), hält Sperren ein, liefert Abschlussbericht mit Messwerten, Tests, Selbsteinschätzung und offenen Punkten. Agentenberichte sind **kein** Nutzer‑Okay.
- Nach jeder Runde: Tests bei freier Maschine → Commit/Push `staging` → Werkstatt‑Build → Leitstand veröffentlichen → Netlify‑Zip an Christoph → Leitstand‑DB (agents/<id>, log/lNN) → docs/projektgedaechtnis.md ergänzen und ins Claude‑Projekt laden (`claude/projektgedaechtnis.md`).
- Abnahme nach Art‑Direktion: nach jeder Maßnahme Aufnahmen mit `test/artdir/shots.mjs` durch den Art‑Direktor (Opus 5.5 hoch), Regression durch Test‑Team.
- **Produktion nur nach Tages‑Okay des Nutzers** (Merge/Push `staging` → `main`). Sichtbare Neuerungen zuerst als Vorschau in der Werkstatt.
- Nutzungslimit: bei „Stopp“ alle Agenten stoppen (TaskStop), Prozesse beenden, Sperren löschen, committen/pushen, Neustart zur genannten Zeit planen, Leitstand aktualisieren.
- Sicherheit: Dirigent gibt keine Passwörter/Zugangsdaten ein (GitHub/Netlify/Graphify‑Anmeldung macht Christoph selbst). Nutzer‑E‑Mail privat. Runway/Meshy und Bild‑zu‑3D‑Werkzeuge nicht nutzen.
- Projektgedächtnis: docs/projektgedaechtnis.md (chronologisch, mit Zeitstempeln, Erkenntnissen und Nutzerentscheidungen) ist das Langzeitgedächtnis; AGENTS.md die Regeln; PROGRESS.md der Verlauf seit Projektstart.

## 5. Staging‑System

- **Leitstand** (Claude‑Artifact https://claude.ai/artifact/JXDZfPmFX3wRZA4QXPk7m4, Datei tools/leitstand/leitstand.html, Version 16): Agentenübersicht mit Fortschritt, Modell‑Zuweisung, Strecke Quellcode → Build → Schutz → Tests → Staging → Live, Protokoll, Tests, Freigabe, Feedback, Shots, Werkstatt (spielbarer Build mit `?modelle3d=1&ws=1`, Vorschauen zur Freigabe). Datenbank (ArtifactData): agents, log (bis l61), pipeline, tests, freigabe, shots, live, vorschau, feedback. Veröffentlichen: `url` + `file_path` + `root tools/leitstand` + `files {"spiel/index.html": …, geänderte spiel/models/**}`.
- **Staging‑Build** = Werkstatt + Netlify‑Staging‑Zip (getrennte Spielstände, Badge, Debug‑Menü). Christoph testet am Handy als Home‑Bildschirm‑App.
- **Agenten (Leitstand‑IDs):** stabilitaet, figuren-npcs, terras-serie, welt-grafik, ui-design, art-direktor, test-team; abgeschlossen: staging, uebergaenge, innen, bewegung, kreaturenbilder, recherche-3d, analyse-3d, pilot-3d, charaktere, terras, materialien, loop-d (geplant).
- **Runden bisher (Staging, 12.–16.11.):** Übergänge & Bewegung ✓, Innenräume ✓, Bewegung ✓, Kreaturenbilder ✓, Recherche/Analyse/Pilot 3D ✓, Terras‑Serie R1–R5, Figuren R1–R6, Welt‑Grafik R1–R6, UI R1–R2, Stabilität R1–R4, Art‑Direktion D1. Alle Berichte in docs/*.md.

## 6. Produktion

- Live: https://veyra-terras-k7q3.netlify.app – öffentlich, kein Passwort (Passwortschutz bei Netlify kostenpflichtig; nichts Kostenpflichtiges aktiviert). Letzter Live‑Stand: `main@4bf5954` = Staging 86bebf3 (13.11. abends): Heldin‑Modell‑Vorbereitung, Terras R4, Stabilität R1, Welt R5/R6 WIP, UI R2 „Morgenglas“. 3D‑Modelle in Produktion **aus** (Schalter‑Standard im Code).
- Ablauf: Christophs Okay → Dirigent merged `staging` → `main` (oder legt freigegebenen Stand ab) → `git push origin main` → Netlify baut (Status per `gh api repos/WSTLDesign/Veyra/commits/<sha>/status`) → Link melden. Spielstände bleiben erhalten (Schlüssel unverändert). App am Handy einmal neu laden (Cache‑Stempel).
- Vor Live: `node test/smoke.mjs` grün, `tools/smoke-live.mjs dist` grün. Repo auf privat gestellt? (Empfehlung offen seit 13.11.)
- Älteres Produktions‑Artifact (Spiel als Artefakt): https://claude.ai/artifact/Lrpv1XYiorMys1CKhopBKc (seit GitHub/Netlify nachrangig).

## 7. Aktueller Stand (17.11.)

- `staging` HEAD: aef904a (Übergabe + Gedächtnis) über 9a56060 (Figuren R6), 4297dfc (Art‑Direktion D1), 07c2ddc (Figuren R5), 37b3d5b (Stabilität R4), d3103a4 (Namenseingabe), 037d704 (Stabilität R3).
- Offen/kritisch: **stabil_qa 60/62** nach Figuren R6 – 61 Draw‑Calls bei 932×430 Morgenau, weil der Qualitätsregler (59‑grafik) nur Dreiecke, nicht Draw‑Calls kennt und wegen leichterer Modelle Stufe 6 wählt. Erster Auftrag an Stabilität.
- Werkstatt/Leitstand = Spielstand 07c2ddc (ohne R6). Netlify‑Zip 6 = 07c2ddc. Nach dem Stabilitäts‑Fix: Werkstatt neu, Zip 7.
- Sonnet hat in R6 die Silhouettengrenze im Figurentest gelockert (3,4 % statt 1,8 %) – noch nicht abgenommen.
- Nutzer‑Rückmeldungen ausstehend: Handy‑Test Zip 5/6 (Häuser sichtbar? Lag? Umrisse?), Icon schwarzes oder helles V, E6 Titelbild mit Heldin/Partner, „Mittwoch 2 Uhr“ = 02:00 oder 14:00 (Neustart als 02:00 geplant), Graphify‑Login (Repo noch nicht freigegeben).

## 8. Art‑Direktion Durchgang 1 (16.11., Opus 5.5 max) – docs/art-direktion.md

| Bereich | Note | % | Hauptmängel |
|---|---|---|---|
| Terras | 4 | 42 | Modell ≠ gemaltes Bild, Fell wie Papierzacken, kaum Ausdruck |
| Kampf | 4 | 42 | eigene Kreatur nur von hinten, Angriff = flache Scheibe, kein Jubel |
| Figuren | 5,5 | 55 | müder Blick, steife A‑Pose, Klotzhände, Sprecher nicht im Bild |
| Welt außen | 6 | 60 | Bonbon‑Bäume, Kastenhäuser, Kamera in Gassen |
| Innenräume | 6 | 58 | Material‑Einerlei, Labor steril |
| UI | 7 | 72 | Starterwahl‑Knopf über Gesicht, zu textlastig |
| Übergänge | 6,5 | 64 | Ortsbild unscharf |
| Kohärenz | 4,5 | 45 | Figuren in 4 Stilen |
| **Gesamt** | **5** | **≈ 52 (hoch 55)** | |

Decke: heutige Werkzeugkette ≈ 70–72 %, mit Strukturwechseln ≈ 80 %; 85–90 % nur mit professionellen Modellen/Animation (6–10 Wochen). Top‑12‑Maßnahmen (Nutzen/Aufwand): 1 Kampf mit gemalten Bildfiguren, 2 Kampf‑Kamera/Bildaufbau, 3 Kamera Welt & Dialog, 4 einheitlicher Toon‑Look, 5 Ortsbilder/Kulissen schärfen, 6 Element‑Effekte & Fang‑Jubel, 7 Partner zeigt Gesicht, 8 Intro/Erstellung/Starterwahl mit 3D‑Figuren, 9 Welt‑Licht (AO, Kontaktschatten), 10 Figuren‑Gesichter/Haltung/Hände, 11 UI für Kinder, 12 Terras‑Modelle an Vorlage (Projektion). Steckbriefe mit Abnahme‑Kriterien im Dokument.

## 9. Nutzer‑Entscheidungen (chronologisch, alle gültig)

- 09.11.: Eigenes Spiel statt Pokémon‑Nachbau; Modell/Stufe immer nennen; Loops mit QA‑Noten 1–10, < 8 Nachbesserung.
- 12.11. 11:10: Terras ohne neue Bilder, 3D tierhafter; Charaktere realistische Proportionen im Cel‑Look; Charakterentwicklung = Aussehen wächst mit; Reiten entfernt.
- 12.11. 15:17–15:20: Staging/Produktion getrennt; Dirigent entscheidet im Staging selbst; Vollpreis‑Qualität; Terras in der Welt 3D, **im Kampf das gemalte Bild**.
- 12.11. 16:55: Look‑Ziel wie neue Pokémon‑Spiele (nur Technik); echte GLB‑Modelle per Blender‑Skript erlaubt; CC0‑Basismodelle mit Lizenzvermerk.
- 13.11.: Ziel 90–95 % Pokémon‑Legends‑Anmutung; Gehen 1,9 / Rennen 5; Ladebildschirm nur bei Gebietswechsel; Staging‑Zip für Netlify‑Staging‑Site; Quellcode privat, veröffentlichtes Spiel verschleiert; Leitstand + Werkstatt in einem Tool.
- 14./15.11.: Häuser müssen sichtbar sein; kein Lag; Terra darf nicht vor dem Kampf umfallen; Tasten im Namensfeld tippbar.
- 16.11. 12:58: Modell‑Zuweisung je Agent im Leitstand (siehe Abschnitt 4).
- 16.11. 17:15 (nach Art‑Direktion): **E1 ja** – Terras im Kampf als lebendige gemalte Bildfiguren, bis ein Modell die Bildprobe besteht; **E2** Umriss dünn und farbig, keiner an Bäumen/Häusern; **E3 ja** – erste Version = polierte erste Spielstunde (Titel → Morgenau → Route 1 → Kupferhain mit Kampf, Fang, Station); **E4** erlaubt: Projektion eigener Bilder auf Modelle, freie CC0‑Basismodelle/Bewegungsdaten (Lizenz in docs/), leichtes Post‑Processing am Handy testweise (AGENTS.md‑Regel anpassen); **nicht erlaubt:** Bild‑zu‑3D‑Werkzeuge. E6 offen.
- 17.11. 18:00: Weiterarbeit in **Claude Code**, zwei Sitzungen (Staging, Produktion).

## 10. Nächste Schritte (Reihenfolge)

1. **Stabilität** (Opus 5.5 hoch): Draw‑Calls in den Qualitätsregler; stabil_qa 62 ✓; Werkstatt + Zip 7.
2. **Terras‑Serie** (Opus 5.5 hoch): Maßnahme 1 + 2 – Kampf mit gemalten Bildfiguren (atmen, hüpfen, Treffer), Kampf‑Kamera/Bildaufbau; Partner zeigt Gesicht (7).
3. **Welt‑Grafik** (Opus 5.5 hoch): Maßnahme 3 Kamera Welt & Dialog (Sprecher im Bild), 4 einheitlicher Toon‑Look nach E2, 9 Welt‑Licht; Post‑Processing‑Test mit Handy‑Messung.
4. **UI/Figuren**: Maßnahme 8 (Intro/Erstellung/Starterwahl mit 3D‑Heldin), 10 (Gesichter, Haltung, Hände), 11 (UI für Kinder), 6 (Effekte & Fang‑Jubel).
5. Nach jeder Maßnahme: Art‑Direktor‑Abnahme, Test‑Team‑Regression, Zip an Christoph; Produktion nur nach seinem Okay.
6. Infrastruktur: Netlify‑Staging an Branch `staging` koppeln; Graphify‑Repo freigeben; Repo privat.

## 11. Claude Code – zwei Sitzungen

Siehe `CLAUDE.md` (wird automatisch geladen) und `docs/claude-code-start.md` (Startsätze). Beide Sitzungen arbeiten im selben Repo in getrennten Ordnern/Branches:

- **Sitzung „Veyra Staging“**: Branch `staging`, Rolle Dirigent, alles aus Abschnitten 4–5 und 10. Agenten per Claude‑Code‑Subagenten (Task‑Tool) mit dem Modell aus der Zuweisung.
- **Sitzung „Veyra Produktion“**: Branch `main`, nur Freigaben: Staging‑Stand übernehmen, Live‑Tests, Push, Netlify‑Deploy prüfen, Link melden, Rückfragen zum Live‑Spiel. Keine Feature‑Arbeit.
