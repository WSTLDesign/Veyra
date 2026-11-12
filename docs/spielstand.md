# Spielstand-Sicherheit (src/48-savesafe.js)

Regel aus AGENTS.md („SPIELSTAND-SICHERHEIT“, Nutzer 20:19): **Spielstände müssen jedes Update überleben.** Umgesetzt nach QA Mechanik S1 (11.11.2026).
Modul: `src/48-savesafe.js` + `src/styles-savesafe.css`. Hooks in `src/15-ui.js` (`save`, `loadSave`, `cont`, „Neu starten“). `migrateSave` (21-species.js) wird in 48 umhüllt.
Tests: `node test/unit_savesafe.mjs` (ohne Browser, IndexedDB per Stub) und `node test/qa_savesafe_ui.mjs` (ein Chromium, Bilder `test/savesafe_*.png`).

## Schlüssel

| Ort | Schlüssel | Inhalt |
|---|---|---|
| localStorage | `veyra_save_v1` (`SAVEKEY`) | Spielstand (JSON von `G`) – unverändert wie bisher |
| localStorage | `veyra_set` (`SETKEY`) | Einstellungen – vom Modul nie berührt |
| localStorage | `veyra_save_v1_bak_<tag>` | Sicherungen (Rohstand als JSON-Text, direkt ladbar) |
| localStorage | `veyra_save_v1_bak_list` | Liste der Sicherungen `[{k,t,why,n}]`, höchstens **3** (älteste fällt weg) |
| localStorage | `veyra_save_v1_kaputt` | zuletzt gefundener, nicht lesbarer Rohstand (wird aufgehoben, nie gelöscht) |
| localStorage | `veyra_persist` | Ergebnis von `navigator.storage.persist()` (`1`/`0`) → nur einmal fragen |
| IndexedDB | DB `veyra_save`, Store `kv`, Schlüssel `veyra_save_v1` | Spiegel `{raw, t, v}` des letzten gespeicherten Stands |

Sicherungs-Tags: `<saveVersion>` (vor Migration, z. B. `_bak_0` für alle Stände ohne Version), `<saveVersion>_<appVer>` (vor App-Update bei gleicher Datenversion), `alt` (ein anderes Spiel hat den Stand überschrieben), `gross` (Stand stark geschrumpft), `neustart` (vor „Neu starten“), `vorimport` (vor Laden eines Codes/einer Sicherung).

## Felder im Spielstand
- `G.saveVersion` – Datenversion (`SAVE_VERSION`, aktuell **1**). Fehlt sie ⇒ Altstand (0).
- `G.appVer` – App-Version beim letzten Laden (aus `<meta name="veyra-version">`, package.json).
- `G.gid` – Kennung des Spiels (zufällig, beim neuen Spiel bzw. bei der ersten Migration). Erkennt „anderes Spiel überschreibt“.
- Bestehende Marker bleiben: `G.ver` (Alt-Migration 21-species), `G.dexKanon`. Alte Flags bleiben gültig.

## Ablauf
**Speichern** (`save()` → `saveWrite(s)`):
1. Schreibschutz: nur wenn `G` gültig ist (`map` Text, `team` Liste ≤ 6 mit `s`, `flags` Objekt, `dex` Objekt) – sonst kein Schreiben, Toast „Speichern nicht möglich“.
2. Steht ein anderes Spiel im Speicher (`gid` verschieden, oder ohne `gid` mit mehr Fortschritt) → Sicherung `alt`. Kaputter Altstand → `_kaputt`.
3. Schreiben; bei vollem Speicher werden die ältesten Sicherungen freigegeben.
4. Spiegel in IndexedDB (asynchron, Fehler still), `navigator.storage.persist()` einmalig.

**Laden** (`loadSave()` → `saveRead()`; läuft schon beim Seitenstart aus 15-ui):
1. Gültiger Stand → zurückgeben.
2. Kaputt (JSON-Fehler oder Pflichtfelder fehlen) → Rohstand nach `_kaputt`, jüngste gültige Sicherung zurückschreiben, Hinweis „Sicherung geladen“.
3. Keine Sicherung → `null`, Hinweis „Spielstand kaputt“ mit „Code einfügen“. „Fortsetzen“ startet **nie** stillschweigend ein neues Spiel (`saveMissing()`).

**Start** (`saveBoot()`, asynchron): gültiger Stand → Spiegel anlegen/auffrischen. localStorage leer oder kaputt → Stand aus IndexedDB zurückholen, „Fortsetzen“ einblenden, Hinweis „Spielstand gerettet“.

**Migration** (`migrateSave` umhüllt, läuft in `start()`):
1. Vorher: ist `saveVersion < SAVE_VERSION` oder hat sich `appVer` geändert und hat der Stand Fortschritt → Sicherung des Rohstands (`_bak_<version>`), nie mit kleinerem/ungültigem Stand eine vorhandene Sicherung überschreiben.
2. Umbenennungen (`MOVE_RENAME`, z. B. `flammenrad` → `glutwirbel`: Team, Box, Eier, Tasche `rolle_…`, Flag `sc_…`, `foundItems`).
3. Die bisherigen Migrationen (21-species, 27-story, Figuren …).
4. Danach `saveVersion`, `appVer`, `gid` setzen.

**Neu starten** (`saveWipe()`): alter Stand → `_bak_neustart`, Spielstand und IndexedDB-Spiegel löschen (sonst käme er beim nächsten Start zurück).

## Optionen › Erweitert
- **Spielstand sichern:** „Code zeigen“ (markierbares Textfeld), „Kopieren“ (Zwischenablage, Rückfall Markieren + `execCommand`), „Als Datei“ (`veyra-spielstand-JJJJ-MM-TT.json`; im Artifact sind Downloads gesperrt → Hinweis, Code nehmen).
- **Spielstand laden:** Code einfügen oder Datei wählen → „Prüfen“ → Abfrage als Seiten-UI („Gefunden: Noa · 4 Kreaturen · 1 Medaille · 21 im Dex … Es wird vorher gesichert.“ – „Ja, laden“ / „Abbrechen“). Im Kampf gesperrt.
- **Sicherungen auf diesem Gerät:** bis zu 3 Einträge mit Datum und Grund, „Laden“ mit derselben Abfrage.
- **Spielstand dauerhaft behalten:** Homescreen-Tipp; zeigt, wenn das Gerät dauerhaften Speicher gewährt hat.

Code-Format: `VEYRA1.` + Base64(deflate-raw(JSON)) (≈ 1,1 k Zeichen für 5 kB Spielstand); ohne `CompressionStream` `VEYRA0.` + Base64(JSON). Import nimmt beide Codes und reines JSON; Leerzeichen/Umbrüche im Code sind egal. Prüfung: Format, JSON, Pflichtfelder; Meldungen kurz und kindgerecht.

## Wiederherstellung (Anleitung)
1. Spiel öffnen. Ist der Stand kaputt oder weg, holt das Spiel ihn selbst aus einer Sicherung bzw. aus IndexedDB und meldet es.
2. Sonst: Optionen › Erweitert › „Sicherungen auf diesem Gerät“ → „Laden“.
3. Neues Gerät oder alles gelöscht: Optionen › Erweitert › „Spielstand laden“ → Code einfügen oder Datei wählen.
4. Entwickler: Rohstände liegen in localStorage unter `veyra_save_v1_bak_*` bzw. `veyra_save_v1_kaputt` (DevTools › Application) und in IndexedDB `veyra_save`.

## Für künftige Datenänderungen
- Jede Änderung an MONS/Items/Karten/Flags/Attacken-IDs: Migration in `migrateSave`/`migrateKanon` (oder `MOVE_RENAME` für reine Umbenennungen) **und** `SAVE_VERSION` um 1 erhöhen → automatische Sicherung `_bak_<alt>` vor der Migration.
- Test in `test/unit_migration.mjs` bzw. `test/unit_savesafe.mjs` ergänzen. Service-Worker-Updates berühren localStorage/IndexedDB nie.
