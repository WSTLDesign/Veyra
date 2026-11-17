# Veyra in Claude Code – Einrichtung der zwei Sitzungen

Stand 17.11.2026. Voraussetzung: Claude Code installiert, GitHub-Zugriff auf `WSTLDesign/Veyra`, Node 22, Git. Blender/Playwright nur nötig, wenn Modellbau bzw. Tests lokal laufen sollen (sonst laufen sie in der Cloud-Sitzung von Claude Code).

## Einmalig: zwei Arbeitsordner (Git-Worktrees), damit beide Sitzungen parallel laufen

```bash
git clone git@github.com:WSTLDesign/Veyra.git veyra-staging
cd veyra-staging && git checkout staging && npm install
git worktree add ../veyra-produktion main
cd ../veyra-produktion && npm install
```

Beide Ordner enthalten `CLAUDE.md` (sobald sie auf dem jeweiligen Branch liegt) – Claude Code lädt sie automatisch.

## Sitzung 1: „Veyra Staging“

```bash
cd veyra-staging && claude
```

Startsatz (einfügen):

> Du bist der Dirigent der Staging-Sitzung von Veyra (Branch `staging`). Lies zuerst `docs/handbuch.md`, dann die letzten 60 Zeilen von `docs/projektgedaechtnis.md`, `AGENTS.md` und `docs/art-direktion.md`. Nenne bei jedem Schritt Modell und Stufe. Starte dann die nächsten Schritte aus Handbuch Abschnitt 10, beginnend mit Stabilität (Draw-Calls in den Qualitätsregler, stabil_qa 62 ✓), parallel Terras-Serie Maßnahme 1+2 (Kampf mit gemalten Bildfiguren + Kampf-Kamera). Subagenten mit dem Modell aus der Zuweisung in `CLAUDE.md`. Committe und pushe nur auf `staging`. Nach jeder Runde: Tests, Netlify-Staging-Zip für mich, Projektgedächtnis ergänzen.

## Sitzung 2: „Veyra Produktion“

```bash
cd veyra-produktion && claude
```

Startsatz (einfügen):

> Du bist die Produktions-Sitzung von Veyra (Branch `main`, Live-Site https://veyra-terras-k7q3.netlify.app). Lies `docs/handbuch.md` Abschnitte 3, 6 und 7 (falls auf `main` noch nicht vorhanden: `git show origin/staging:docs/handbuch.md`). Du machst keine Feature-Arbeit. Deine Aufgaben: auf mein ausdrückliches Okay den genannten `staging`-Commit nach `main` mergen, `node build.mjs && node test/smoke.mjs` („Keine Fehler.“) und `node tools/smoke-live.mjs dist` ausführen, pushen, den Netlify-Deploy prüfen und mir den Link melden; außerdem Fragen zum Live-Spiel beantworten und Live-Fehler an die Staging-Sitzung weitergeben (ins `docs/projektgedaechtnis.md` auf `staging` eintragen). Nenne bei jedem Schritt Modell und Stufe.

## Was aus der claude.ai-Sitzung nicht mitkommt
- Der **Leitstand** (Claude-Artifact mit Agentenübersicht, Werkstatt, Shots, Modell-Zuweisung) lässt sich nur aus claude.ai-Sitzungen veröffentlichen. In Claude Code ersetzt `docs/projektgedaechtnis.md` + `PROGRESS.md` die Agentenübersicht; die Modell-Zuweisung steht in `CLAUDE.md` und wird dort geändert.
- Geplante Aufgaben (z. B. Neustart Mittwoch 02:00) gelten nur für die claude.ai-Sitzung „Staging-System Aufbau“.
- Das Claude-Projekt „App Entwicklung Veyra“ bleibt als Dokumentablage (claude/handbuch.md, claude/projektgedaechtnis.md); die Wahrheit liegt im Repo.

## Empfehlung zur Modellwahl in Claude Code
Dirigent (Hauptsitzung): Fable 5.1 oder Opus 5.5, mittlere Stufe. Subagenten über das Task-Tool mit `model` laut Zuweisung (opus/sonnet/haiku) und `effort` (high/max/medium).
