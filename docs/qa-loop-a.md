# Veyra – QA Loop A3 (Kreaturen) · Bericht

Agent A3 „QA Loop A“ (Sonnet hoch) · 09.11.2026 · Prüfgegenstand: Ergebnis von A1 (Dex-Kanon) und A2 (Sprites & Modelle), gebaut mit dem Stand inkl. „UI-Vollbild“ (42-fullscreen.js).
Umgebung: Software-WebGL (SwiftShader) unter Last durch parallele Agenten; Kampf-/Smoke-Läufe daher langsam (≈ 2 s je 3D-Bild).

## 1. Ergebnistabelle (1–10)

| # | Prüfung | Note | Befund | Fix / Empfehlung |
|---|---|---|---|---|
| 1 | Kanon-Konsistenz | **9** | 153 Arten, 3-stellige Nummern lückenlos; Namen 001–048 exakt = docs/kreaturen-kanon.md, alle Linien-/Legenden-Namen vorhanden, Typen je Linie wie Kanon, BST je Stufe plausibel (Linien 315/410/530, Zweistufer 305–320/470–485, Legenden exakt 580, Mythische 600, `myth:1`), Lernlisten ≥ 4 Attacken bis L40 (alle), EVO_DEF ↔ MONS.evolutions/ev in beide Richtungen deckungsgleich, Level-Weg für alle Kanon-Linien, Habitat/Region/Zone für alle 153 (Zonen gegen WELT-KANON geprüft), Legenden-Orte laut WELT-KANON. Alte Namen: 3 Treffer außerhalb ID_MAP (Pieplo in NPC-Satz, Astramahr/Aurelion in DESIGN-Texten) → **von mir behoben**. Abzug: nur 62/153 Arten sind in den *heutigen* 15 Karten tatsächlich begegnungs-/erwerbbar (80 nur als Habitat-Metadaten; Legenden-Fundort im Spiel nur 142, 144, 147). | Loop C/D: Karten + `enc`-Tabellen je Region anlegen (Liste in test/qa_a_unreach.json). |
| 2 | Bilder | **8** | 125 Dateien in public/art: keine 0-Byte-/defekten Dateien (PIL `verify`+`load`), alle `NNN_name.webp` ↔ MONS.art ↔ ART_SRC deckungsgleich, 20 Ortsbilder mit map_/region_/stadt_/ort_. 91 Kreaturenbilder 1–139 alle transparent (Rand ≤ 30 % deckend), ≤ 512 px. Anzeige im Spiel: Dex-Liste 153 Zellen (105 Bild / 48 3D-Vorschau), Dex-Detail aller 105 Bild-Arten, Team-Liste (18 Sechserpakete), Team-Detail, Fang-Karte, Kampf 2D, Starterwahl (3 Karten), Entwicklung – alle zeigen das Bild. Fehlend wie erwartet: 002, 003, 005, 006, 058, 060, 062, 099–139 (48). Abzüge: Key-Arts 140–153 sind 512×768 (lange Kante > 512); die Ortsbilder enthalten die „Mooslein“-Figur (siehe Prüfung 7); Fang-Karte schneidet die Füße der Kreatur unten leicht an (qa_a_fang.png). | Key-Art-Limit als „Breite ≤ 512“ definieren oder auf 512×768 → ≤ 512 hoch belassen (dokumentieren). Fang-Karte: Bildfeld `object-fit: contain` + unteres Padding (A2, `mini(...,120)`/.cc .pm). |
| 3 | Save-Migration | **10** | `test/unit_migration.mjs`: 27 Prüfungen grün (VM + echtes Spiel über „Fortsetzen“): alter Spielstand (ver 3, Box als flache Liste, Eier, Dex-Flags, Glanz-Serie, dexNew) → alle IDs laut docs/dex-kanon.md ID_MAP, Dex 41/21 unverändert, keine undefinierten Arten/Attacken, KP gültig, Level/Wesenszug/Anlage/Glanz/Spitzname erhalten, Starter+Rivalen abgeleitet, idempotent, Rundlauf save→load, sehr alter Stand (ver 1) und defekte Einträge crashen nicht. Info: Eier werden zwar umgemappt, aber nicht durch `migrateMon` ergänzt (Eier-Logik existiert noch nicht). | – |
| 4 | Sprite-Modus | **8** | `MON_RENDER==='sprite'`; route1 mit 7 Bild-Kreaturen + Begleiter: **35 Draw-Calls** (alle als Sprite); natürliche Population 32–62; Worst Case 22 Roamer (19 Bild-Arten > Atlas 16, 4 prozedural): **84**; 3D-Kampf **15**; kein console.error/pageerror in allen Szenen; Kampf 3D + 2D, Fang-Karte, `SEQ.evolve` (031→032 mit Bildern, ≈ 11 s; 002→003 ohne Bilder im 3D-Weg endet sauber), Starterwahl 3 Karten; `MON_RENDER='model'` ohne GLB fällt auf Sprites zurück. Fallback `proc` funktioniert, ist aber schwer: **148 Calls bei 3, 240 bei 6 prozeduralen Kreaturen** (Budget 150). Dasselbe gilt in der Welt für die 48 bildlosen Arten: jede prozedurale Kreatur kostet ≈ 35 Calls. | A2: bildlose Arten in der Welt als Sprite aus dem 3D-Vorschaubild (`artFallbackSrc`/monThumb → Atlas) rendern, prozedurales Modell nur in Dex/Kampf (siehe Abschnitt 5). |
| 5 | Balance | **6** | `tools/balance.mjs 1000`: **leicht** Wild 100 % (2,7–2,9 Züge), Arena 94–99 %, Top Vier 83–89 % → frühe Kämpfe klar gewonnen ✓. normal: Wild 99–100 %, Arena 71–79 %, Top Vier 35–40 %. Starter-Linien (1v1 gegen gleichstufige Wilde, 600 Kämpfe): Stufe 1/2 innerhalb ±10 pp; **Stufe 3 leicht: Flammel 69 % / Aquilo 81 % / Blühro 88 %** (Spanne 19 pp, Glut −10,3 pp vom Mittel), normal 50/60/59. Typen (BST-gleich, leicht): Schatten +11 pp, Lumen +11 pp, Frost −9, Glut −7, Volt −7; normal: Kern −15 (n=4), Frost −11. Kein Typ „dominiert“, aber Schatten/Lumen-Linien (Noxli 100 %, Düstro 100 %, Mondoro 99 %, Blinki 99 %) sind klar zu stark, Kristallo 55 %, Loddo 54 %, Blitzmähne 57 % zu schwach. **Fangquote leicht (Standardkapsel, volle KP): 001/004/007 = 20 %, 055 Wurzel/061 Blinki/105 Kitzli = 31 %, 099 Welli 25 %, 102 Dornwelp/139 Sternschnuppi 20 % → unter 35 %**; die 41 normalen Stufe-1-Arten (cr 190) liegen bei 39,7 %. | A1: siehe Abschnitt 5. |
| 6 | Tests | **9** | `node build.mjs && node test/smoke.mjs` → „Keine Fehler.“ (46 Schritte, 2× hintereinander grün). Alle `unit_*.mjs` grün: unit_art 20, unit_battle 33, unit_capture, unit_qa3 36, unit_species 33, unit_migration 27. **Doppelkampf 2v2:** 15/15 Läufe (Standard, Reihenfolge, gleichzeitiger KO, Sieg durch Zustandsschaden, Niederlage zählt nicht) – Sieg wird genau einmal gezählt, Belohnung einmal. Die früher gemeldeten Wackler waren **Testfehler**, kein Zählfehler: (a) „Glanz-Roamer“: `startBattle` ersetzt zu hohe Wild-Level durch ein *neues* Objekt (`wildLv`, Schwierigkeit leicht) → Identitätsprüfung `G.team.includes(__m)` flaky; zusätzlich Wettlauf mit einem Roamer, der selbst einen Kampf startet; (b) „2v2“: schwaches Team (L2–L5) kann legitim verlieren, außerdem wählt der Auto-Zug u. U. eine wirkungslose Kern-Attacke gegen Schatten. Beide Schritte in test/smoke.mjs stabilisiert (siehe Fixes). | Abzug: Smoke braucht unter Last Wiederholungen; `finish(150)`-Schleifen sind zeitabhängig. |
| 7 | Rechtscheck | **6** | Markenwörter (Pokémon, Pikachu, Pokéball, Nintendo, Pokédex …) in src/: **0**, in Dateinamen public/: **0**; 153 Arten/82 Attacken/52 Items/58 Fähigkeiten/29 NPC-Namen/41 Orte gegen 572 Fremdnamen: kein exakter Treffer. **Befunde:** (1) **hoch – Bildmaterial:** `ort_*.webp`, `stadt_*.webp`, `region_frosttundra/lichtlande/schattenmoor.webp` zeigen im unteren Drittel das grüne Blatt-Igel-Wesen mit rosa Blüte („Mooslein“, Shaymin-nah) plus Fuchs und blauen Hasen; sie liegen unverändert in dist/art und in dist/artifact.html (≈ 4,7 MB data-URI), AGENTS verlangt „überdecken“. (2) mittel: Items **Trank / Supertrank / Hypertrank / Beleber / Elixier** entsprechen 1:1 den deutschen Pokémon-Gegenständen. (3) mittel: „Top Vier“, „Ass-Trainer“ (02-world), „Krabbi“ ≈ „Krabby“ (Nutzername, nur melden). (4) niedrig: Orden/Arenaleiter/Champion/Trainer-Jargon, einzelne Attackennamen (Flammenrad, Windstoß, Orkan, Steinwurf, Rankenhieb) identisch mit Pokémon-Attacken, Kapselvarianten spiegeln Pokéball-Varianten. (5) *_DRAFT.png in public/art_ref nicht ins Release-ZIP. **„Heilstation/Heilzentrum“:** in 02-world, 03-engine, 04-roam, 07-settings, 25-evolve **auf „Kreaturenstation“ ersetzt**; offen in gesperrten UI-Dateien: 15-ui.js (3 Stellen). | Dirigent/A2: Ortsbilder aus Build nehmen oder Mooslein wegschneiden; A1: Items umbenennen (nur Anzeigename `n`); UI-Agent: 15-ui.js. |
| 8 | Artifact-Größe | **8** | dist/artifact.html = **14 598 119 B (13,9 MiB / 14,6 MB) < 16 MB**, Reserve nur ≈ 1,4 MB. Davon Bilder (Base64, ×1,333) ≈ 13,3 MB (public/art = 9 980 KB: Kreaturen 1–139 4 869 KB, Key-Art 140–153 1 550 KB, 20 Ortsbilder 3 562 KB), Code+CSS ≈ 0,95 MB. Jedes weitere Bild-Paket (Loop B/C/D) sprengt das Limit. | Vorschlag Abschnitt 6 (Messwerte). |

**Alle Noten < 8 mit Nachbesserung:** 5 (A1) und 7 (A1/A2/Dirigent/UI-Agent) – Anweisungen in Abschnitt 5.

## 2. Eigene Fixes in src/ (und Hilfsdateien)

| Datei | Änderung |
|---|---|
| src/04-roam.js:102 | NPC-Satz „Mein **Pieplo** weckt mich …“ → „Mein **Flausch** weckt mich …“ (alter Artname, Kanon 059) |
| src/04-roam.js:101–102 | „Im Heilzentrum brennt …“ → „In der Kreaturenstation brennt …“; „geh ins Heilzentrum“ → „geh in die Kreaturenstation“ |
| src/02-world.js | 6× `name:'Heilzentrum'` → `'Kreaturenstation'` (INTERIORS heil_*); Seemann Ole: „Das Heilzentrum liegt …“ → „Die Kreaturenstation liegt …“ |
| src/03-engine.js:96 | „Willkommen im Heilzentrum!“ → „Willkommen in der Kreaturenstation!“ |
| src/07-settings.js:51 | „Im Heilzentrum wird automatisch gespeichert.“ → „In der Kreaturenstation …“ |
| src/25-evolve.js:211, 238 | Heil-Overlay „Heilstation · Einen Moment bitte …“ und Dialog „Willkommen in der Heilstation!“ → „Kreaturenstation“ |
| src/10-mon3d.js:741, 743 | DESIGN-Konzepttexte „Astramahr“ → „Mondoro“, „Aurelion“ → „Strahli“ (alte Namen) |
| tools/balance.mjs | VM-Stub `CanvasRenderingContext2D` ergänzt: das neue src/42-fullscreen.js (UI-Vollbild) las `CanvasRenderingContext2D.prototype` beim Laden und brach damit `tools/balance.mjs` und alle VM-Tests (unit_species/battle/qa3/migration) ab. Im Browser unproblematisch. |
| test/smoke.mjs | (a) „Glanz-Roamer“: Identitätsprüfung → „gefangene Glanz-Kreatur Art 59 in Team/Box“, Roamer `nat='shy'`; (b) „Doppelkampf 2v2“: zwei starke Kämpfer (L20) vorn, Roamer geleert, Fehlerausgabe mit Diagnose. |

Nicht angefasst (gesperrt): 15-ui.js, 20-battleui.js, styles.css, 36-input.js, shell.html.

## 3. Offene Punkte nach Schwere

**Hoch**
1. Ortsbilder (`map_/region_/stadt_/ort_*.webp`) enthalten die Shaymin-nahe Figur „Mooslein“ (Fuchs + Hase daneben) und stecken ungeschnitten in App- und Artifact-Build → vor Nutzung zuschneiden (oberes Bilddrittel, 1024×≈380) oder bis dahin aus `build.mjs` ausnehmen (spart zugleich 4,7 MB im Artifact).
2. Starter-/Seltene-Fangquote leicht unter 35 % (001/004/007 = 20 %; 055/061/105 = 31 %; 099 = 25 %).
3. 80 von 153 Arten sind in keiner bestehenden Karte erwerbbar (Loop C/D), nur Legenden 142/144/147 haben Fundorte.

**Mittel**
4. Fallback `proc` und bildlose Arten sprengen bei > 3 prozeduralen Kreaturen das 150-Call-Budget (148 → 240).
5. Items Trank/Supertrank/Hypertrank/Beleber/Elixier = deutsche Pokémon-Namen; „Top Vier“, „Ass-Trainer“.
6. Balance Stufe 3: Flammel (003) −10 pp; Schatten/Lumen +11 pp, Frost/Glut/Volt −7…−9 pp.
7. 15-ui.js: „Heilzentrum“ (3×) → „Kreaturenstation“ (UI-Agent).
8. Artifact-Reserve nur 1,4 MB.

**Niedrig**
9. Key-Art 512×768 > „≤ 512 px“; Fang-Karte schneidet Füße an.
10. Eier werden nicht durch `migrateMon` ergänzt (Eier-System fehlt noch).
11. Krabbi ≈ Krabby (Nutzername verbindlich – nur beobachten); Attackennamen/Kapselvarianten Pokémon-nah.
12. Async-Ketten in 14-battle.js ohne `if(!B)return` nach `await` (PAGEERROR „reading 'mine' of null“, nur bei erzwungenem Kampfende durch Tests).
13. Spielfalle: Kern-Attacken (Kratzer/Rempler) wirken gegen Schatten nicht („keine Wirkung“) – Starter-Linien lernen früh typgleiche Attacken, daher nur theoretisch; im Auto-Test führt das zu Endlosschleifen.

## 4. Nachbesserungsanweisungen (Noten < 8)

### A1 (Dex-Kanon & Daten) – Balance (Note 6)
- **Fangquote:** `cr` von 001 Funki, 004 Plippi, 007 Knospi von 45 auf **190** (ergibt 39,7 % leicht, volle KP, Standardkapsel); 055 Wurzel, 061 Blinki, 105 Kitzli von 150 auf **190** (31 % → 39,7 %); 099 Welli von 120 auf **190**. (Gilt: `p = max(a/255·1,6; (0,2+0,9·(1−HP/Max))·min(1,cr/30))`; cr 175 ist die Untergrenze für ≥ 35 %.) 102 Dornwelp (Ordens-Event, cr 90) und 139 Sternschnuppi (selten, cr 30) dürfen bewusst darunter bleiben.
- **Flammel (003)** BST 530 umverteilen: `b6 [87,97,83,86,78,99]` → `[87,104,77,92,71,99]` (Ang +7, SpA +6, Ver −6, SpV −7); b entsprechend `[87,104,77,99]`. **Blühro (009)**: `[101,84,115,66,93,71]` → `[101,84,108,66,93,78]`. Ziel: Spanne der drei Starter-Endstufen ≤ 10 pp (leicht: 69/81/88 → ≈ 77/81/84).
- **Schatten/Lumen dämpfen:** 032 Noxli, 064 Düstro, 033 Mondoro, 061 Blinki, 029 Glimma je −6 BST-neutral von SpA nach KP/Init (z. B. Noxli SpA −6, KP +6), Ziel: Typ-Mittel Schatten/Lumen ≤ +7 pp.
- **Schwache Arten anheben:** 077 Kristallo, 073 Blitzmähne, 002 Loddo, 076 Glazirr, 011 Dornox, 113 Nagnox je Ang/SpA +6, KP/Ver −3 je (BST-neutral); Ziel ≥ 62 % leicht gegen BST-gleiche Wilde.
- **Items umbenennen** (nur Anzeigename `n` in 01-data.js, Schlüssel bleiben): Trank → „Kräutertrank“, Supertrank → „Starker Kräutertrank“, Hypertrank → „Quellessenz“, Beleber → „Lebensfunke“, Elixier → „Wesensessenz“ (Texte in 03-engine.js:92 und 16-expansion.js:156–157 mitziehen).
- Prüfen danach: `node test/qa_a_balance.mjs 600`, `node test/unit_species.mjs`, `node tools/balance.mjs 1000`.

### A2 (Sprites & Modelle) – Recht/Performance (Notizen aus Prüfung 4/7/8)
- **Ortsbilder:** in `build.mjs`-Vorbereitung entfernen oder zuschneiden, bis ein Verwendungsort sie zeigt; dort Bildausschnitt oberes Drittel (ohne Mooslein, Fuchs, Hase).
- **Bildlose Arten in der Welt** (48 Arten, 31 % des Dex): prozedurales Modell einmalig in ein Canvas rendern (`artFallbackSrc`/`monThumb`, bereits für Dex vorhanden) und als Sprite in den Atlas legen → je Kreatur 0 statt ≈ 35 Draw-Calls (Ziel `proc`-Fallback ≤ 150 auch bei 6 Kreaturen).
- **Fang-Karte:** Füße abgeschnitten – `.cc .pm` Bildfeld 120 px mit `object-fit: contain` und 8 px unterem Rand.
- Vorschlag Atlas: 16 Zellen reichen (Worst Case 17 Sprites ok), keine Änderung nötig.

### UI-Agent / Dirigent
- 15-ui.js: „Heilzentrum“/„Heilzentren“ (Zeilen ≈ 317, 319, 417) → „Kreaturenstation“.
- Dirigent: „Top Vier“, „Ass-Trainer“ (02-world.js) durch eigene Begriffe ersetzen (Story-Agent B2); *_DRAFT.png nicht ins ZIP.

## 5. Tests und Werkzeuge (neu, alle in test/)

| Datei | Zweck |
|---|---|
| test/qa_a_kanon.mjs | Prüfung 1 (VM): Nummern, Namen gegen kreaturen-kanon.md, Typen, BST, Lernlisten, Evolutionen beidseitig, Habitate/Zonen/Legenden-Orte, Erreichbarkeit, alte Namen in src → test/qa_a_kanon.json, qa_a_unreach.json |
| test/qa_a_images.py | Prüfung 2: PIL-Prüfung aller Bilder → test/qa_a_images.json (`python3 -I test/qa_a_images.py`) |
| test/unit_migration.mjs | Prüfung 3: Altstand ver 3 (Fixture test/fixtures/old_save_pre_a1.json) VM + Browser, 27 Prüfungen |
| test/qa_a_sprites.mjs | Prüfung 2+4 im Browser (http-Server art_serve): Bilder, Dex/Team/Fang/Kampf/Starter/Entwicklung, Draw-Calls, Fallbacks → qa_a_sprites.json + Screenshots |
| test/qa_a_balance.mjs | Prüfung 5: Starter-Linien, Typ-Dominanz (BST-Band ±25), Legenden, Fangquoten → qa_a_balance.json |
| test/qa_a_double.mjs | Prüfung 6: Doppelkampf 2v2, Sieg-/Niederlage-Zählung (`TURNS=700 node test/qa_a_double.mjs 3`) |
| test/qa_a_recht.mjs | Prüfung 7: Markenwörter, Fremdnamen (572), Begriffe, Jargon → qa_a_recht.json |

Ablauf Gesamt-QA: `node build.mjs && node test/smoke.mjs && for f in test/unit_*.mjs; do node $f; done && node test/qa_a_kanon.mjs && python3 -I test/qa_a_images.py && node test/qa_a_balance.mjs 600 && node test/qa_a_recht.mjs && node test/qa_a_sprites.mjs && node test/qa_a_double.mjs 3`.

## 6. Artifact-Größe – Vorschlag (nur Zahlen, nichts geändert)

Messung per PIL-Neukodierung (WebP, method 6), Größen in KB (Base64 im Artifact ×1,333):

| Gruppe | Ist | Vorschlag | Neu | Ersparnis | im Artifact |
|---|---|---|---|---|---|
| 91 Kreaturenbilder 001–139 (≤ 512 px) | 4 869 | q82 → **q70** | 4 084 | −785 | −1,05 MB |
| 14 Key-Arts 140–153 (512×768) | 1 550 | q ≈ 82 → **q70** (≤ 800 px bleibt 512×768) | 1 026 | −524 | −0,70 MB |
| 20 Ortsbilder (1024×≈576, 900×507) | 3 562 | **≤ 800 px, q70** | 2 126 | −1 436 | −1,91 MB |
| Ortsbilder alternativ | 3 562 | ≤ 640 px, q65 | 1 436 | −2 126 | −2,83 MB |
| Ortsbilder **ganz aus dem Artifact**, bis sie genutzt werden (zugleich Rechtspunkt 1) | 3 562 | – | 0 | −3 562 | −4,75 MB |

Ergebnis: alle drei Maßnahmen zusammen ≈ −3,7 MB → **≈ 10,9 MB**; mit Ortsbildern draußen + q70 für Kreaturen/Key-Art ≈ **8,1 MB**. Sichtprüfung der q70-Fassung vor Übernahme nötig (Cel-Shading-Flächen sind unkritisch, feine Goldkanten der Key-Arts prüfen). Die Artifact-Variante lädt Bilder als data-URI; Kreaturen 001–098 sollten für Loop B/C zusätzlich lazy per `Image()` aus Atlas-Dateien kommen, falls das Limit weiter knapp bleibt.

## 7. Screenshots (860×400, test/)

Welt: qa_a_welt_sprites.png (35 Calls), qa_a_welt_worstcase.png (22 Roamer) · Kampf: qa_a_kampf3d.png, qa_a_kampf3d_legende.png, qa_a_kampf2d.png, qa_a_kampf2d_legende.png · Fang: qa_a_fang.png, qa_a_fang_legende.png · Entwicklung: qa_a_evolve_1.png, qa_a_evolve_2.png (Bilder), qa_a_evolve_3d.png (bildlos) · Starterwahl: qa_a_starter.png · Dex: qa_a_dex_liste.png, qa_a_dex_detail.png, qa_a_dex_detail_legende.png · Team: qa_a_team.png, qa_a_team_detail.png · Fallback proc: qa_a_proc_welt.png, qa_a_proc_kampf.png · Migration: qa_a_migration_dex.png, qa_a_migration_team.png.
