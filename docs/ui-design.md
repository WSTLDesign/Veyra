# UI-Design 2 „Morgenglas“ (Agent UI-Design, Opus 5.5 · hoch, 13.11.2026)

Ziel des Nutzers (03:18): 90–95 % der Anmutung moderner Pokémon-Spiele **als Qualitätsmaßstab** (Klarheit, Ruhe, Typografie, Glas-Panels, dezente Animation) – ohne Layouts, Icons, Logos, Schriften oder Begriffe zu übernehmen. Veyras Oberfläche bleibt eigen und kindgerecht.

## Dateien
| Datei | Inhalt |
|---|---|
| `src/styles-schrift.css` | Schriften **lokal eingebettet** (WOFF2 als data-URI, Teilmenge Latin inkl. ä ö ü ß): Fredoka (Display, 300–700) und Nunito (UI, 200–1000). Kein Abruf von Google Fonts mehr (Link aus `shell.html` entfernt). |
| `src/styles-ui2.css` | Designsystem + alle Komponenten-Überschreibungen (lädt als letztes Stylesheet, `body`-Präfix für Vorrang). |
| `src/60-uidesign.js` | Eigene SVG-Symbole `UI_ICON`, Titelbild + Wortmarke, Uhr-Symbol, Team-Kurzanzeige `#vTeam`, dauerhafte Minikarte, Kartenfarbe im Team. Nur Anhängen/Umhüllen: `BICON`/`APPICON` werden neu befüllt, `updClock`, `mmShow`, `card` umhüllt – Namen/Signaturen unverändert. |
| `test/ui2/shots.mjs` | Vorschauen vorher/nachher (1600×900 `g`, 844×390 `k`), `UI_DIST=<alter dist>` für Vorher-Bilder. |

## Tokens (`:root` in styles-ui2.css)
- **Schrift:** `--font-display` Fredoka (Namen, Titel, Knöpfe, Wortmarke) · `--font-ui` Nunito (Fließtext, Zahlen tabellarisch). Gewichte: Display 600, UI 700/800 für Kleinschrift.
- **Tinte:** `--v-ink #1b2333`, `--v-ink-2 #4a5468`, `--v-ink-3 #7b8497` (Kontrast auf Milchglas ≥ 4,5:1 für ink/ink-2).
- **Flächen:** warmes Milchglas `--v-glass` (.80), `--v-glass-hi` (.93), `--v-glass-lo` (.58), Unschärfe `--v-blur` 20 px + Sättigung 1,45, Lichtkante `--v-hl`, Haarlinie `--v-hair`.
- **Schatten:** `--v-sh-1/2/3` (weich, zweistufig). **Radien:** `--v-r-s/--v-r/--v-r-l` relativ zu `--u` (skaliert mit Bildschirmhöhe).
- **Bewegung:** `--v-ease` (aus), `--v-spring` (Antippen 95 %), Einblenden 240 ms (`vIn`, `vPop`). `prefers-reduced-motion` und `body.red` schalten alle Animationen ab.
- **Farbe:** Veyra-Fuchsie (`--sig`) nur für die Hauptaktion (A-Taste, „Kampf“) und Fortschritt; Primärknöpfe in Menüs/Titel sind Tinte. Element-Farben nur an Kreaturen/Attacken. KP-Verläufe `--v-hp-hi/mid/lo`.

## Komponenten
- **HUD:** Ortsschild oben links (Regionspunkt in Regionsfarbe, Ortsname in Fredoka, darunter Sonne/Mond-Symbol + Uhrzeit + Wetter); Team-Kurzanzeige darunter (bis 6 Bilder mit KP-Ring, Tipp öffnet Team); runde Minikarte oben rechts dauerhaft mit Nordmarke; Missionszeile wie bisher bei Bedarf. Ruhezustand: 60–80 % Deckkraft.
- **Steuerung:** Stick und Kontextknöpfe als helles, stark transparentes Glas; A-Taste als einziger Farbakzent.
- **Gebietsschild:** Glasschild oben mittig, Region in Kapitälchen zwischen zwei Linien (Regionsfarbe), Ortsname groß, Raute als Abschluss.
- **Dialog:** breites Glasband unten, Porträt rund mit weißem Rand, Sprecher-Schild in Tinte mit Farbpunkt, Weiter-Hinweis als runder Knopf mit Pfeil (sanftes Wippen), Antworten als Karten (erste = Tinte).
- **Kampf:** Statuskarten mit Typ-Symbol (rund), Name (Fredoka), Level-Pille, KP-Balken mit Zehntel-Teilung, Verlauf je Stufe und weißem Nachlauf (Schaden „läuft nach“), XP-Linie. Befehle: Team · Tasche · Rückzug als gleich breite Karten, darunter breite Hauptkarte „Kampf“; Resonanz links daneben. Attacken 2×2 mit Typ-Streifen, Typ-Symbol im Farbkreis, Name groß, AP- und Wirkungs-Chips.
- **Chronik/Team/Dex/Tasche/Optionen:** Milchglas-Gerät, Navigation mit eigenen Symbolen und Tinten-Markierung, weiße Karten mit Haarlinie; Team-Karten mit Farbkopf der Kreatur und gemaltem Bild; Dex-Karten mit Papierverlauf.
- **Titel:** Himmel (sky_lichtlande_abend) und zwei Horizont-Schichten (Lichtlande, Smaragdwald) aus der Spielwelt mit sehr langsamer Drift, Lichtpunkte, eigene Wortmarke „VEYRA“ (SVG: gerundete Buchstaben mit Kontur, warmer Verlauf, Kristallfunke, „KREATURENCHRONIK“), Glas-Knöpfe; keine Kreaturen im Titelbild (Nutzerwunsch 10.11.).

## Lizenzen
- Fredoka – Copyright 2016 The Fredoka Project Authors, SIL Open Font License 1.1.
- Nunito – Copyright 2014 The Nunito Project Authors, SIL Open Font License 1.1.
- Bezug: npm-Pakete `@fontsource-variable/fredoka` / `@fontsource-variable/nunito` 5.3.0 (Teilmenge `latin`, wght-Achse). Eingebettet als data-URI; die OFL erlaubt Einbettung und Weitergabe mit der Software.

## Prüfen
`node build.mjs && node test/ui2/shots.mjs nachher` (unter Chromium-Sperre) → `test/ui2/nachher_<szene>_<g|k>.webp`.
