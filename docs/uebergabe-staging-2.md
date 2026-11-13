# Übergabe an die neue Staging-Sitzung (vorbereitet 13.11.2026, 11:20)

Diese Datei ist der Startauftrag für einen NEUEN Chat im Projekt „App Entwicklung Veyra“. Der alte Chat („Staging-System Aufbau“) wird beendet, sobald der Stabilitäts-Fix fertig und vom Nutzer am PC getestet ist. Den letzten Stand trägt der alte Dirigent unten in Abschnitt 6 ein.

## 1. Zuerst lesen (in dieser Reihenfolge)
1. `claude/projektgedaechtnis.md` (Projekt) – alle Entscheidungen, Zugänge, Stand je Agent.
2. `claude/ziele.md` – Ziele und Entscheidungen des Nutzers.
3. Im Repo: `AGENTS.md` (Regeln, Sperren, Melde-Protokoll Leitstand), `PROGRESS.md`, `docs/*.md` je Bereich (figuren-3d, terras-3d, welt-grafik, ui-design, stabilitaet, uebergaenge, recherche-3d-qualitaet).

## 2. Umgebung einrichten (neuer Container ist leer)
- Repo anhängen und klonen: `WSTLDesign/veyra` (Zugriff „push“), Branch **staging**: `git clone https://github.com/WSTLDesign/veyra /home/claude/veyra && cd /home/claude/veyra && git checkout staging`. Volle Historie ist nicht nötig; vor dem Push `git fetch origin staging`.
- `npm install` (Playwright ist auf 1.63.0 gepinnt, passend zum vorinstallierten Chromium; NICHT `playwright install`).
- Blender (nur für Modellbau nötig): `uv venv /home/claude/.venv-blender --python 3.13 && uv pip install --python /home/claude/.venv-blender/bin/python bpy` (≈ 1 GB, läuft ohne GPU; Versionen siehe docs/pilot-3d.md). Draco: `mkdir -p /home/claude/gltf-tools && cd /home/claude/gltf-tools && npm i @gltf-transform/cli`.
- Prüfen: `node build.mjs && node test/smoke.mjs` → „Keine Fehler.“; `node test/uebergaenge_qa.mjs` → alles ✓.
- Der Nutzer-PC (HP 250 G10, Intel Iris Xe, Chrome) ist über die Desktop-App erreichbar; Chrome-Erweiterung für Live-Tests vorhanden.

## 3. Arbeitsweise (Kurzfassung, Details in AGENTS.md)
- Dirigent koordiniert, prüft Bilder selbst, committet/pusht (Branch staging), pflegt Leitstand und Projektgedächtnis. Bei jedem Schritt Modell + Stufe nennen.
- Bau-Agenten: Opus 5.5 hoch; Tests/Regression: Sonnet 5.5 hoch. Empfehlung: höchstens ZWEI Opus-Agenten gleichzeitig (Nutzungslimit 5 h; der Nutzer sagt „Stopp“ bei ~85–95 % und nennt die Rücksetzzeit → alles stoppen, sichern, Neustart einplanen).
- Sperren: `.chromium.lock` (ein Browser), `.blender.lock`. Agenten committen nicht.
- Vorschau vor Einbau; neue Modelle hinter `SET.modelle3d` / `?modelle3d=1`.
- Agenten des alten Chats können NICHT fortgesetzt werden – neue Agenten starten und sie zuerst ihre Doku (docs/<bereich>.md) und PROGRESS.md lesen lassen.

## 4. Leitstand und Werkstatt bedienen
- URL: https://claude.ai/artifact/JXDZfPmFX3wRZA4QXPk7m4 – aus einem neuen Chat zuerst `Artifact read` (url), dann veröffentlichen mit `url` + `file_path: tools/leitstand/leitstand.html` (+ `files`). Bereits veröffentlichte Dateien (shots/*, spiel/**) bleiben erhalten, nur Geändertes mitschicken.
- Werkstatt-Build: `node build.mjs && node tools/werkstatt-build.mjs "<Kurztext>"` → `tools/leitstand/spiel/index.html` + `spiel/models/<bereich>/<id>.js`; dazu `spiel/vendor/**` aus `public/vendor/`.
- Datenbank (ArtifactData, gleiche URL): agents, log, pipeline, tests, freigabe/aktuell, vorschau, shots, live, feedback – Felder siehe AGENTS.md „STAGING-LEITSTAND“. Feedback/Vorschau-Entscheidungen des Nutzers regelmäßig lesen (`list` feedback, vorschau).

## 5. Nächste Schritte (Reihenfolge)
1. Stabilität PC abnehmen (falls noch offen): Werkstatt am Nutzer-PC starten, 60 s spielen, beenden – flüssig, kein Einfrieren; dann neue Modelle im Staging standardmäßig an.
2. Figuren: Heldin-Modell (der Nutzer spielt die Heldin!), Gesichter Runde 3, Gang-Clips für Gehen 1,9 / Rennen 5.
3. Terras: Runde 4 (Proportionen wie die gemalten Bilder), Flausch.
4. Welt: Innenräume (Runde 6), restliche Gebäude/Wahrzeichen.
5. UI Runde 2: App-Icon (Marken-„V“), Titel/Startablauf am Handy, Chronik/Tasche/Fangkarte.
6. Art-Direktor-Runde (Noten je Bereich) und Test-Team (Durchspielen) – noch nie gelaufen.
7. Klären mit dem Nutzer: Wie kommt der Stand auf Netlify (Produktions-Chat oder Repo-Anbindung)? Netlify-Staging-Site verbinden. Umriss dünn/fast keiner. Kampfarena für alle?

## 6. Letzter Stand bei Übergabe (vom alten Dirigenten auszufüllen)
- Datum/Uhrzeit:
- Letzter Commit auf `staging`:
- Laufende/abgebrochene Runden je Agent:
- Werkstatt-Build-Stand:
- Offene Nutzerfragen:

## 7. Startsatz für den neuen Chat (vom Nutzer einzufügen)
> Dies ist die neue Staging-Sitzung für Veyra. Lies zuerst im Projekt `claude/uebergabe-staging-2.md` und `claude/projektgedaechtnis.md`, richte die Umgebung wie dort beschrieben ein und mach als Dirigent mit den nächsten Schritten weiter. Nenne bei jedem Schritt Modell und Stufe.
