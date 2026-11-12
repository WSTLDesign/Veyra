# Veyra Kreaturenchronik

Eigenes Monster-Sammel-RPG: 30 eigene Kreaturen, 10 Energien, 4 Arenen, Liga, drei Legenden, Tag/Nacht, Echtzeit- oder Rundenkampf, Feldfähigkeiten („Wege der Kreaturen"), 2D-Draufsicht sowie 3D in 3. Person und Ego-Perspektive.

## Projektstruktur

```
src/            Quellcode – wird in Nummernreihenfolge gebündelt
  shell.html    Markup (ohne Dokument-Skelett)
  styles.css    Styles (Tokens oben in :root)
  01-data.js    Kreaturen, Energien, Attacken, Fähigkeiten, Items
  02-world.js   Karten, Innenräume, NPCs, Missionen
  03-engine.js  Karten laden, Bewegung, Interaktion, Dialoge
  04-roam.js    Sichtbare wilde Kreaturen, Begleiter, Stadtbewohner
  05-field.js   Signatur-Mechanik: Hindernisse per Kreatur räumen
  06-regions.js Leit-/Akzentfarbe je Region, Titelkarte
  07-settings.js Einstellungen (Grafik, Sound, Steuerung, Barrierefreiheit)
  08-gfx.js     2D-Renderer (Kacheln, Licht, Partikel)
  09-three3d.js 3D-Welt, Kamera, freies Laufen
  10-mon3d.js   Prozedurale 3D-Kreaturen, Animation, 3D-Kampfszene
  11-fx.js      Übergänge, Schreibmaschinentext, Sound, Musik, Haptik
  12-intro.js   2D-Fallback-Intro
  13-intro3d.js Kino-Intro: Kampf der Legenden
  14-battle.js  Kampfsystem (Runden + Echtzeit), Fangen, Erfahrung
  15-ui.js      Menüs, Laden, Steuerung, Speichern, HUD, Hauptschleife
public/         Statische Dateien (three.js, Manifest, Service Worker, Icons)
tools/icons.mjs Erzeugt App-Icons aus dem 3D-Modell von Solaryn
test/smoke.mjs  Headless-Test: spielt 22 Kernpfade durch und meldet Konsolenfehler
build.mjs       Bündelt alles nach dist/
dist/           Build-Ausgabe (App + Artifact) – nicht von Hand bearbeiten
```

## Befehle

```bash
npm install            # einmalig (Playwright + Capacitor)
npm run build          # dist/index.html (App/PWA) und dist/artifact.html (claude.ai)
npm test               # Headless-Smoke-Test gegen dist/index.html
npm run icons          # Icons neu erzeugen (nach Änderungen an Solaryn)
npm run serve          # lokal testen: http://localhost:4173
```

## Als App (Capacitor)

```bash
npm run build
npm run cap:init       # einmalig; appId in capacitor.config.json anpassen
npm run cap:android    # Android Studio öffnet sich → Run
npm run cap:ios        # Xcode öffnet sich (nur macOS) → Run
npm run cap:sync       # nach jeder Änderung
```

Voraussetzungen: Node 18+, für Android Android Studio, für iOS Xcode. Der Spielstand liegt in `localStorage` der WebView und bleibt bei App-Updates erhalten.

## Als PWA

`dist/` auf einen beliebigen HTTPS-Host legen. Auf dem Handy „Zum Home-Bildschirm hinzufügen" – läuft danach offline (Service Worker cached die App-Shell).

## Hinweise

- Alle Kreaturen, Namen, Orte und Grafiken sind eigene Entwürfe und werden prozedural aus Grundformen erzeugt.
- `dist/artifact.html` ist ohne `<!doctype>`/`<head>` gebaut, weil claude.ai das Skelett selbst liefert; `dist/index.html` ist das vollständige Dokument für App und Web.
- Version in `package.json` pflegen – sie steuert den Cache-Namen des Service Workers.

## Branches und Staging

- `staging`: alle Änderungen der Agenten; Netlify-Staging-Site, Leitstand und automatische Tests.
- `main`: nur freigegebene Stände (Live). Freigabe im Staging-Leitstand, dann Merge `staging` → `main`.
- Details: [STAGING.md](STAGING.md), Melderegeln: AGENTS.md (STAGING-LEITSTAND).
