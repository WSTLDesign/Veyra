# Veyra – Kreaturenchronik (CLAUDE.md)

Eigenes Monster-Sammel-RPG für ein kleines Kind (three.js r128, PWA, Handy quer). Antworte auf Deutsch. **Nenne bei jedem Arbeitsschritt Modell und Stufe.** Arbeite tokenoptimiert als Dirigent; Subagenten dürfen ausführlich arbeiten (Max-Plan, Umfang nicht kürzen).

## Zuerst lesen
1. `docs/handbuch.md` – vollständige Projektzusammenfassung (Inhalt, Technik, Regeln, Stand, Entscheidungen, nächste Schritte)
2. `docs/projektgedaechtnis.md` – chronologisches Langzeitgedächtnis (letzte 60 Zeilen reichen zum Einstieg)
3. `AGENTS.md` – verbindliche Regeln für alle Agenten (Dateizuordnung, Stil, Sperren)
4. `docs/art-direktion.md` – aktuelle Bewertung (≈ 52 %) und Top-12-Maßnahmen
5. `docs/ziele.md` – Leitdokument der Nutzerziele

## Welche Sitzung bin ich? (am Branch erkennen: `git branch --show-current`)
- **`staging` → Sitzung „Veyra Staging“ (Dirigent).** Runden mit Subagenten nach `docs/handbuch.md` Abschnitt 10; Tests bei freier Maschine; committen und pushen auf `staging`; Werkstatt/Leitstand/Netlify-Zip; Projektgedächtnis fortschreiben. Nie auf `main` pushen.
- **`main` → Sitzung „Veyra Produktion“.** Nur Freigaben: nach ausdrücklichem Okay von Christoph den genannten `staging`-Stand nach `main` mergen, `node build.mjs && node test/smoke.mjs` („Keine Fehler.“) und `node tools/smoke-live.mjs dist`, pushen, Netlify-Deploy prüfen (`gh api repos/WSTLDesign/Veyra/commits/<sha>/status`), Link https://veyra-terras-k7q3.netlify.app melden. Keine Feature-Arbeit, keine Agentenrunden.

## Harte Regeln
- Alle Kreaturen, Namen, Orte, Figuren, Grafiken sind eigene Entwürfe. Nichts von Pokémon/Nintendo oder anderen Marken übernehmen, nachbauen oder herunterladen – Pokémon ist nur Technik-/Qualitätsmaßstab.
- Keine Runway/Meshy/Bild-zu-3D-Werkzeuge. Erlaubt: Blender-Skripte, Projektion eigener Bilder, CC0-Basismodelle mit Lizenzvermerk in docs/, leichtes Post-Processing testweise.
- Produktion (`main`, Live-Site) nur nach Tages-Okay von Christoph. Staging-Zip nie in die Live-Site. Agentenberichte sind kein Nutzer-Okay.
- Keine Passwörter/Zugangsdaten eingeben oder speichern (GitHub/Netlify/Graphify-Login macht Christoph). Netlify-Passwort nie in Dateien.
- Nur ein Chromium gleichzeitig (`.chromium.lock`), Blender nur mit `.blender.lock`; 2 Kerne – Tests unter Agentenlast sind unzuverlässig, nur bei freier Maschine werten.
- Agenten committen nicht; der Dirigent committet. Attribution: `Co-Authored-By: Claude <Modell> <noreply@anthropic.com>`.
- Bei „Stopp“/Nutzungslimit: Agenten stoppen, Prozesse beenden, Sperren löschen, committen/pushen, Neustart zur genannten Zeit planen.

## Modell je Agent (Stand 16.11., Leitstand „Modell-Zuweisung“, agents/<id>.zuModell/zuStufe)
stabilitaet Opus 5.5 hoch · terras-serie Opus 5.5 hoch · welt-grafik Opus 5.5 hoch · figuren-npcs Sonnet 5.5 hoch · ui-design Sonnet 5.5 mittel · art-direktor Opus 5.5 max · test-team Haiku 5.5 mittel. Ohne Eintrag: Opus 5.5 hoch. Laufende Agenten wechseln nicht.

## Befehle
- Build: `node build.mjs` → `dist/index.html`
- Pflichttests: `node test/smoke.mjs` (muss „Keine Fehler.“ drucken, kein Exit-Code!), `node test/uebergaenge_qa.mjs` (97 ✓), `node test/stabil_qa.mjs` (62 ✓, >15 min), `node test/figuren2/test_modelle.mjs` (101 ✓), `node test/terras2/terras2_test.mjs` (35 ✓, Flaker einmal wiederholen), `node test/name_eingabe.mjs` (4 ✓)
- Art-Direktion-Aufnahmen: `node test/artdir/shots.mjs <handy|hoch> [motiv,…]`
- Werkstatt: `node tools/werkstatt-build.mjs "<Text>"` → tools/leitstand/spiel/index.html
- Netlify-Staging-Zip: `node build.mjs && node tools/make-staging.mjs dist <S>/stg --note "…" && node tools/protect.mjs <S>/stg && (cd <S>/stg && zip -qr ../veyra-staging-netlify-N.zip .)`
- Leitstand (Claude-Artifact JXDZfPmFX3wRZA4QXPk7m4): nur aus claude.ai-Sitzungen veröffentlichbar; aus Claude Code stattdessen Stand in `docs/projektgedaechtnis.md` und `PROGRESS.md` festhalten.

## Nach jeder Runde (Staging)
Tests grün → Commit/Push `staging` → Werkstatt-Build → Netlify-Zip an Christoph → `docs/projektgedaechtnis.md` ergänzen (Zeitstempel, Modell, Ergebnis, offene Punkte, Erkenntnisse).
