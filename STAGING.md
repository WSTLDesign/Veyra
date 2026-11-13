# Veyra – Staging-System

Stand: 12.11.2026 · Spielversion 0.9.0 · gebaut mit Fable 5.1 (mittel)

## Leitstand
Der **Staging-Leitstand** (https://claude.ai/artifact/JXDZfPmFX3wRZA4QXPk7m4) vereint Agentenübersicht, die Strecke Quellcode → Build → Code-Schutz → Tests → Staging → Live, Testergebnisse, die Freigabe für Live und Feedback. Der Bereich „Werkstatt“ liegt in derselben Seite: Werkstatt-Build zum Spielen, Vorschauen zur Freigabe, Bilder der Agenten. Wie gemeldet wird, steht in AGENTS.md (Abschnitt STAGING-LEITSTAND).

## Code-Schutz
`tools/protect.mjs` wird auf jeden veröffentlichten Build angewendet (Live, Staging, Werkstatt). Es entfernt alle Kommentare, verkürzt alle Namen und liefert keine Source-Maps und keine artifact.html aus. Das Repo bleibt privat und unverschlüsselt (Entscheidung des Nutzers, 12.11.).

## Zweck
Staging ist die Testumgebung zwischen Agenten-Arbeit und Live-Version. Neue Stände laufen **zuerst auf Staging**.
Christoph prüft dort auf dem Handy oder Tablet. Erst nach seinem OK geht derselbe Stand live.

```
Agenten-Loop → Build (veyra-web) → make-staging → Smoke-Test grün? → Staging-Site → Freigabe durch Christoph → Live-Site
```

## Was Staging von Live trennt
| Bereich | Live | Staging |
|---|---|---|
| Adresse | bisherige Netlify-Site | eigene Netlify-Site „veyra-staging“ (eigener Origin) |
| Spielstand | `veyra_save_v1` | `veyra_stg_save_v1` (+ `_bak_`, `_kaputt`) |
| Einstellungen | `veyra_set` | `veyra_stg_set` |
| IndexedDB-Spiegel | `veyra_save` | `veyra_stg_save` |
| Service-Worker-Cache | `veyra-<version>` | `veyra-stg-<version>-<buildstempel>` (jeder Build lädt sicher neu) |
| App-Name / Farbe | Veyra / dunkel | „Veyra STAGING“ / Orange – am Handy als zweite App installierbar |
| Suchmaschinen | – | `noindex`, `robots.txt`, Netlify-`_headers` (index/sw nie gecacht) |

Staging-Tests können den echten Spielstand dadurch nicht anfassen, auch nicht auf demselben Gerät.

## Staging-Badge und Debug-Menü
Das orange Badge oben in der Mitte zeigt Version, FPS und Fehlerzahl. Tippen öffnet das Menü, am PC auch **Strg+Shift+D**.
- **Schnellstart:** neues Testspiel ohne Intro
- **Team:** heilen, Level fürs ganze Team setzen
- **Kreaturen:** jede Art mit Wunsch-Level ins Team, Wildkampf gegen jede Art, Dex komplett
- **Welt:** zu jeder Karte reisen, 10× alle Items, Tag/Nacht wechseln
- **Spielstand:** kopieren und einfügen (auch Live-Stand nach Staging übernehmen), Staging-Stand löschen
- **Fehlerprotokoll:** JavaScript-Fehler seit dem Laden; „Auf neue Version prüfen“ holt den neuesten Build

Fehlt in einer späteren Spielversion eine Funktion, wird der passende Knopf ausgegraut. Das Spiel selbst bricht dadurch nicht.
Das Menü existiert **nur** im Staging-Build. Die Live-Version enthält keinen Debug-Code.

## Werkzeuge (`tools/`)
- `make-staging.mjs <web-build> <ziel> [--note "Text"]` macht aus jedem fertigen Web-Build die Staging-Variante.
  Er **bricht ab**, wenn ein Speicher-Schlüssel nicht genau einmal vorkommt oder ein unbekannter Live-Schlüssel übrig bleibt.
- `smoke-staging.mjs <staging-ordner>` startet einen Headless-Test in drei Größen: Handy quer 844×390, Tablet 1180×820, PC 1920×1080.
  Geprüft werden Laden ohne Fehler, Badge, getrennte Schlüssel, ein unberührter Live-Spielstand und alle Debug-Aktionen. Screenshots landen in `test-out/`.
- Ohne grünen Smoke-Test wird nicht auf Staging deployt.

## Ablauf heute (ohne GitHub)
1. Build erzeugen: `node tools/make-staging.mjs <veyra-web> build/staging --note "Loop X"`
2. `node tools/smoke-staging.mjs build/staging` muss „Alles grün“ melden.
3. `veyra-staging.zip` an Christoph geben. Er zieht den entpackten Ordner auf die Netlify-Site **veyra-staging** (Deploys → Drag & Drop).
4. Christoph testet und gibt frei. Danach `veyra-web.zip` mit **demselben** Spielstand auf die Live-Site.

## Ziel-Ablauf (mit GitHub, sobald das Repo steht)
- Branch `staging` → Netlify-Site „veyra-staging“ deployt automatisch. Branch `main` → Live-Site.
- Eine GitHub Action baut, führt `make-staging` und den Smoke-Test aus und deployt nur bei Grün.
- Freigabe für Live = Merge `staging` → `main`.
- `make-staging.mjs` wandert dann als Schritt `npm run build:staging` in `build.mjs`.

## Offene Punkte
- **Quellcode sichern:** `veyra-app.zip` mit `src/`, Tests, AGENTS.md und PROGRESS.md existiert nur im Container des Chats „Pokémon-Klon Palkia Dialga“.
  Der Staging-Build stammt aus `veyra-web.zip` (fertiges Spiel, Version 0.9.0, 12.11. 12:46).
- GitHub-Repo `veyra` anlegen und den Connector freigeben.
