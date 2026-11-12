# Veyra Kreaturenchronik

Eigenes Monster-Sammel-RPG für Handy und Tablet (Vollbild, Querformat, PWA).

| Branch | Ziel | Inhalt |
|---|---|---|
| `main` | Live-Site | `web/` unverändert |
| `staging` | Staging-Site „veyra-staging“ | `web/` → `tools/make-staging.mjs` → eigener Speicher, Badge, Debug-Menü |

Ablauf: Änderungen → Branch `staging` → automatischer Smoke-Test (GitHub Actions) + Netlify-Staging → Freigabe durch Christoph → Merge nach `main` → live.

Details: [STAGING.md](STAGING.md)

> Hinweis: `web/` ist derzeit der fertige Build 0.9.0 (12.11.2026). Der modulare Quellcode (`src/`, `build.mjs`, Tests, AGENTS.md) wird nachgezogen.
