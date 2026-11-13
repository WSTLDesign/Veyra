# Veyra – QA Loop B3 (Figuren & Story) · Bericht

Agent B3 „QA Loop B“ (Sonnet hoch) · 10.11.2026 · Prüfgegenstand: Ergebnis von B1 (Figuren, Intro, Porträts) und B2 (Hauptgeschichte, Nebenmissionen, Zielführung), Stand inkl. UI-Vollbild und Loop A.
Umgebung: Headless-Chromium mit Software-WebGL (SwiftShader), `window.VEYRA_DEMO=1` für den echten Introweg (ohne VEYRA_DEMO überspringt `navigator.webdriver` das Intro). Ein Vorgänger-Lauf dieses Agenten hat Teilergebnisse hinterlassen (`test/qa_b_*.mjs/json/png`); sie wurden nicht neu erfunden, sondern gegengeprüft (Plausibilität der JSON-Werte, erneuter Lauf) und ergänzt.

## 1. Ergebnistabelle (1–10)

| # | Prüfung | Note | Kernbefund |
|---|---|---|---|
| 1 | Story per Skript spielbar | **9** | `test/qa_b_story.mjs` 12/12 ✓: Flag-Kette aus neuem Spiel in **40 Schritten** bis Epilog ohne Sackgasse (8 Kapitel + Finale + Epilog, 8 Medaillen, 8 Kristalle, Turmrat, Ardena); je Schritt Karte erreichbar, Ziel begehbar, `questTarget`/`guidePoint` gültig, geführter Weg ohne gesperrte Kante; jedes Gate-Flag hat eine Quelle; nach dem Epilog sind alle Karten erreichbar; **11 Nebenmissionen** annehmbar und abschließbar, jede zahlt Belohnung (Geld/Item), Voraussetzungen früh genug erfüllbar; zweiter Durchlauf aus „fast fertigem“ Altstand (Champion) ebenfalls ohne Sackgasse. Abzug: 7 Sätze > 80 Zeichen (siehe 3) und die Chronik-Ruf-Wortfilter (siehe 4). |
| 2 | Intro im echten Pfad | **9** | `test/qa_b_intro.mjs`: **67 ✓ / 0 ✗** bei 860×400, 1180×820 und 1920×1080 mit `VEYRA_DEMO=1` – Szene 1 (Veyran), „Wer bist du?“ (Held/Heldin, Hautton, Haar, Jacke, Name; Live-Porträts), Rayan & Mira, Starterwahl (3 Karten, ≥ 44 px, im Bild, keine Überlappung mit dem Textkasten), Chronik + Kapseln, Spielstart. Entscheidungen wirken in `G` (Name, Figur, Hautton, Haar, Jacke, Starter Stufe 5 + Dex-Eintrag, Flags `starter/introStarter/s1_rivalen`, 5 Kapseln, 3 Kräutertränke), Speichern → Laden behält sie. „Überspringen“ führt allein bis ins Spiel (1920×1080 getestet). Rivalen-Regel (Rayan stark: Wirkung ≥ 2, Mira schwach: ≤ 0,5) auf Karten und in `G` ✓. Abzug: Starterpanel wirkt bei 1920×1080 klein (siehe 6). |
| 3 | Figuren | **8** | 40 `FIGURES` mit gültigen Teams/Looks (`unit_figures` 32 ✓, `qa_b_figuren` 18 ✓/0 ✗, 257 Weltzeilen geprüft); Dialogporträt überdeckt keinen Text und liegt im Bild (860×400 und 390×844, `qa_b_ui`: alle Prüfungen ✓; nur das HUD-Feld `#hq` wird beim Kapitelkärtchen kurz teilweise überdeckt – tolerierbar); Porträts inkl. `held/heldin` vorhanden: **91** Gesichter, aber **22 Figuren ohne Porträtdatei** (prozeduraler Kopf), davon 8 mit `art`-Schlüssel ohne Datei (rayan, mira, eira, brann, zaria, ondra, hesper, ardena). Kinderton: nichts Hartes (nur „weich“-Hinweise wie „Ich verliere nicht. Nie.“). **7 Sätze > 80 Zeichen.** Figurenkämpfe `leicht` (200 Läufe je Gegner, Team 4 Kreaturen): Kap 2–4 Mittel 98,8/98,7/99,5 % (Ziel ≥ 85 ✓), Kap 5–8 91,5/100/99,3/99,5 % (Ziel ≥ 75 ✓), Finale 79,6 % (Ziel ≥ 65 ✓) – aber **Ardena 45 %, Ondra 60,5 %, Brann 72 %**; Kapitel 1 hat keinen Figurenkampf. |
| 4 | Rechtscheck | **8** | `qa_a_recht.mjs` (um Ortsbilder/DRAFT/Frida-Bruno-Mox&Lox erweitert): Markenwörter in src/ **0**, Dateinamen **0**, Fremdfiguren-Namen (32) in 34-figures/27-story/02-world/23-intro **0**, Heilzentrum/Heilstation im Code 0, DRAFT in dist 0 (Build schließt DRAFT aus), Ortsbilder 16 beschnitten und ohne Fremdfigur. **Harte Treffer 0.** Mittel: Art „Krabbi“ ≈ „Krabby“ (Levenshtein 1, A1) und `docs/figuren.md:7` nennt die Alt-Begriffe in der Tabelle „alt (Pokémon-nah)“. Niedrig: „Top-Drei“ (27-story), „Champion“ ×8, „Jungtrainer“, „Trainer“, „Orden“ im Textfilter-Bereich. |
| 5 | Spielstände | **10** | `qa_b_save.mjs` 19/19 ✓ + `unit_migration` 27 ✓ + `unit_story` 26 ✓: alte Stände (ohne `G.figs/G.story/G.outfit.body`, Orden statt Medaillen, Altstand „Champion“) werden migriert (`migrateFigures`, `migrateStory`), **idempotent** (zweiter Lauf ändert nichts), neuer Stand verliert nach Speichern → Laden nichts (`G.figs`, `G.story`, `G.outfit.body`, `G.rivals`, `G.starter`). |
| 6 | Dex-Bug (weißes Blatt nach Fang) | **8** | Fehler im Headless-Lauf **nicht als Ausnahme/leeres Blatt reproduzierbar**; Ursache per Messung gefunden und behoben (Abschnitt 3): beim ersten Öffnen erzeugte `rDex` für jede bildlose Art synchron ein 3D-Vorschaubild (eigener WebGL-Renderer + Rücklesen) → Hauptthread 0,25 s (1×) bis 6 s (4× CPU), auf dem Handy mit GPU-Stau = weißes Chronikblatt. Fix in `src/15-ui.js`; `test/unit_dex_firstopen.mjs` **29 ✓ / 0 ✗**. Abzug: Ursache auf echtem Gerät nicht bestätigbar. |
| 7 | Tests / Smoke | **9** | `node build.mjs && node test/smoke.mjs` **2× „Keine Fehler.“** (nach Fix); alle 9 `unit_*.mjs` + `unit_dex_firstopen` grün (art 20, battle 33, capture, figures 32, migration 27, qa3 36, species 33, story 26, dex_firstopen 29). Der „Wackler“ „Doppelkampf 2v2“ war **kein Wackler, sondern ein Fehler in `winBattle`** (Doppelaufruf, Abschnitt 4) – vor dem Fix 2/2 Läufe rot, jetzt grün. |
| 8 | Artifact-Größe | **10** | `dist/artifact.html` = **11 489 418 B (11,0 MiB / 11,5 MB) < 16 MB**, Reserve ≈ 4,5 MB; Artifact bootet (three r128 von cdnjs, Bild-Datenuris), Test mit gestubbtem CDN ohne Fehler. |
| 9 | Performance-Basis | **7** | Siehe `docs/perf-basis.md`. Draw-Calls klein (Welt 25–45, Kampf 15), aber **300–360 k Dreiecke je Frame** in der Welt; Standard-Renderhöhe 1440 px unabhängig vom Gerät (Handy 860×400: 4,5 Mpx). Absolute FPS unter SwiftShader nur Richtwert. |

Gesamtnote B: **8,7**. Alle Noten ≥ 7; Nachbesserungen unten.

## 2. Befunde im Detail

### 2.1 Story (Prüfung 1)
- Kette: 40 Schritte, Kapitelreihenfolge stimmt, jedes Kapitelende (`end`) ist ein Schritt desselben Kapitels. Kein Schritt ohne erreichbares Ziel; keine Karte ohne Rückweg nach dem Epilog.
- Sperrtexte (`gate.m`) nennen keine Alt-Wörter (Orden, Dämmerorden, Top Vier, Champion).
- Nebenmissionen: alle 11 mit Geber/Fundstück erreichbar. `sq_funkel` und `sq_faehrten` haben je 3 Fundstücke auf 3 Karten (Fundort-Flags `sq_fs1–3`, `sq_fa1–3`) – alle begehbar.

### 2.2 Intro (Prüfung 2)
- Zwei Pfade getestet: voller Pfad (Szenen 1–5 mit Tippen) bei 860×400 und 1180×820, „Überspringen“ bei 1920×1080 (landet direkt bei „Wer bist du?“, danach Auswahl, Starter, Spielstart). Ohne VEYRA_DEMO ist der Kurzpfad für Tests aktiv (`SEQ_AUTO`), das wurde im Smoke („Intro-Kurzpfad (webdriver): Standardwerte, Start zuhause“) separat bestätigt.
- Screenshots: `test/qa_b_intro_<größe>_*.png`.

### 2.3 Figuren und Kämpfe (Prüfung 3)
Figurenkämpfe (`tools/balance.mjs`-Harness, Stufe/Team nach Kapitel, 200 Läufe, `leicht`, Team 4 Kreaturen; `lag` = Team eine Stufe zurück):

| Kap | Gegner (n) | Mittel | schwächster | Ziel | ok |
|---|---|---|---|---|---|
| 2 | 2 | 98,8 % | Arenaleiter Lior 97,5 % | ≥ 85 | ✓ |
| 3 | 3 | 98,7 % | Arenaleiterin Neria 96,5 % | ≥ 85 | ✓ |
| 4 | 3 | 99,5 % | Seraphine 99 % | ≥ 85 | ✓ |
| 5 | 1 | 91,5 % | Arenaleiterin Eira 91,5 % | ≥ 75 | ✓ |
| 6 | 2 | 100 % | Ordensrekruten 100 % | ≥ 75 | ✓ |
| 7 | 2 | 99,3 % | Arenaleiter Torvik 99 % | ≥ 75 | ✓ |
| 8 | 2 | 99,5 % | Späher Kaine 99 % | ≥ 75 | ✓ |
| Finale | 8 | 79,6 % | **Ardena 45 %** | ≥ 65 | ✓ im Mittel |

Finale im Einzelnen: Solan 96,5, Seraphine 100, Brann 72, Zaria 87, Ondra **60,5**, Varkon 99, Hesper 76,5, Ardena **45**. Der Simulator nutzt ein 4er-Team; ein echtes Team hat bis zu 6 Kreaturen, die Lage ist also eher besser als gemessen. Für ein siebenjähriges Kind (leicht) sind 45 % beim Endkampf vertretbar, aber Ardena und Ondra liegen deutlich unter allen anderen – siehe Nachbesserung B1.

### 2.4 Rechtscheck (Prüfung 4)
Siehe Tabelle; Bild-Sichtprüfung der Ortsbilder auf Kontaktbogen `test/qa_b_ortsbilder.png`. `public/art_ref/*_DRAFT.png` (2 Dateien) bleiben intern und dürfen nicht ins Release-ZIP.

## 3. Dex-Bug: Ursache und Fix (Prüfung 6)

**Symptom:** Nach einem Fang zeigt das Dex beim ersten Öffnen nur ein weißes Blatt.

**Untersucht** (Skripte `test/qa_b_dex_repro.mjs`, `qa_b_dex_repro2.mjs`, `qa_b_dex_all.mjs`): echter Fangweg (Tasche → Fangkapsel), 2D und 3D, Arten mit/ohne Illustration und Legenden, Seiten- und Artifact-Build, gedrosselte CPU, verzögerte Bilder, alle 153 Detailseiten. **Kein Skriptfehler und kein leeres DOM** – der Inhalt ist nach 30 ms vorhanden (153 Zellen).

**Ursache (gemessen):** `rDex` (`src/15-ui.js`) rief für jede gesehene Art `mini(i,56,…)` auf. Für die 48 Arten **ohne Illustration** liefert `artFallbackSrc → monThumb → monPortrait` (10-mon3d.js) ein 3D-Vorschaubild: eigener `WebGLRenderer` mit `preserveDrawingBuffer`, Rendern, Rücklesen, PNG-`toDataURL` – **synchron im Öffnen-Klick**. Das blockierte den Hauptthread beim ersten Öffnen (Cache `THUMB` noch leer) für ≈ 0,25 s je Art; bei 9 bildlosen Arten und 4× CPU-Drosselung ≈ 1–6 s. Auf einem Handy (GPU-Rücklesestau, dazu weitere WebGL-Kontexte: Welt, Kampf, Vorschau) steht dann die Chronik-Hülle ohne Inhalt – weißes Blatt. Beim zweiten Öffnen sind die Vorschauen im Cache, deshalb „nur beim ersten Mal“. Zusätzlich blieb das Blatt leer, wenn `rDex`/Detailseite eine Ausnahme warf.
Auf diesem Rechner nicht auf einem echten Handy bestätigt – die Ursache ist die einzige in der Kette, die das Muster (nur erstes Öffnen, nur nach Fang einer bildlosen Art, abhängig von Gerät) vollständig erklärt.

**Fix (minimal-invasiv, nur `src/15-ui.js`):**
- `rDex` (Zeile 118–129): Zellen bildloser Arten, deren Vorschau noch nicht im Cache ist, bekommen zunächst einen Farb-Platzhalter (`.q.ph` mit Typfarbe); `dexFill` (Zeile 132) ersetzt sie **eine pro Frame** durch `mini()`. Das Öffnen blockiert nicht mehr (gemessen: ≈ 20 ms bei 1×, vorher ≥ 250 ms schon bei einer bildlosen Art; 54–100 ms bei 4× CPU, vorher 333 ms – 1 s). Abbruch sauber, wenn die Seite gewechselt/geschlossen wird (`el.isConnected`, `el.dataset.t`).
- `dexLazy` (Zeile 131): nur ohne Bild, THREE vorhanden und `THUMB[i]` leer → sonst unverändert synchron (Arten mit Illustration unverändert).
- Detail-Klick (Zeile 126): Ausnahme → `console.error`, Liste bleibt/kommt zurück (kein leeres Blatt).
- `renderMenu` (Zeile 32): Ausnahme in einer Chronik-Seite → Hinweistext „Hier hakt es gerade“ statt leerem Blatt; Tabs bleiben bedienbar.

**Test:** `test/unit_dex_firstopen.mjs` – 29 Prüfungen, grün: echter Fang (Art mit und ohne Illustration) → Dex-Liste (Zellen, Text, Inhalt liegt oben, Bilder), Detail, bei 860×400 (2D) und 1180×820 (3D); 4× CPU mit 9 bildlosen Arten (Öffnen < 250 ms, danach alle Bilder), Seitenwechsel während des Nachladens, Detail aller 153 Arten, Vollliste, Fehlerinjektion.

## 4. Doppelkampf-2v2: Ursache und Fix (Prüfung 7)

**Symptom:** Smoke-Schritt „Doppelkampf 2v2 (Runde)“: `Sieg nicht gezählt` (`G.flags.tr_smoke2` leer, `defeatedTrainers` leer). Von Loop A als „Wackler“ geführt; hier **2 von 2 Läufen rot**, isoliert (`test/qa_b_winbattle.mjs`) und mit Zähler im Smoke grün.

**Befund** (`test/qa_b_smoke2v2.mjs`, Smoke-Kopie – in der Nachbesserung gelöscht – bis zu dem Schritt mit Protokoll):
- `winBattle` setzt Flag und `defeatedTrainers` **als erste Anweisung**; `G` wird danach **nicht** ersetzt (`G#1` durchgehend).
- Im Vorschritt „Kampfkern: Zustand & Weltwetter“ laufen **zwei `runRound`-Ketten gleichzeitig** (der Test-Autoturn ruft `turn()` programmatisch, solange `#bMenu` Kinder hat; `runRound` setzt in „runde“ kein `B.busy`). Beide landen in `checkFaint` → **`winBattle` läuft zweimal** für denselben Wildkampf.
- Die erste Kette ruft `endBattle('win')`, `B` wird `null`, der Test geht zum nächsten Schritt und startet den Doppelkampf. Die zweite Kette hängt noch in `await resultCard()` und ruft danach `endBattle('win')` auf den **neuen** Kampf: Protokoll `end:win Btr=Zwillinge Pia & Pit foes=1,1` (Gegner noch am Leben, Trainerflag nie gesetzt).
- Mit Zähler/Instrumentierung verschiebt sich das Timing → grün; deshalb der „Wackler“-Eindruck.

**Auswirkung im echten Spiel:** Doppel-Auslösung führt zu doppelter `addFriend`-Bindung/Ergebniskarte, und ein später fertiger Alt-Aufruf kann den nächsten Kampf ohne Sieg beenden. Die Oberfläche blendet das Menü während einer Runde aus, das Risiko ist daher klein, aber nicht null (schnelles Doppeltippen, Mehrfach-Auslöser).

**Fix (1 Zeile, `src/14-battle.js:144`):** `async function winBattle(){if(!B||B.won)return;B.won=1;…` – ein Kampf kann nur einmal gewonnen werden. Danach: Smoke 2× „Keine Fehler.“; Protokoll zeigt je Kampf genau ein `end:win` mit Flag; `qa_b_winbattle.mjs` (Re-Entranz-Test mit zwei gleichzeitigen `checkFaint`) zeigt „winBattle wirksam ×1 (Guard B.won greift)“ – der zweite Aufruf wird protokolliert (`win-skip`) und kehrt sofort zurück; je Kampf genau ein `end:win`.
Empfehlung (nicht umgesetzt, Spielregel-Eingriff): `runRound` zusätzlich gegen gleichzeitige Läufe absichern (z. B. `B.round`-Sperre in `turn`).

## 5. Eigene Änderungen in src/ (alle minimal-invasiv)

| Datei | Änderung | Grund |
|---|---|---|
| `src/15-ui.js` Zeilen 32, 118–132 | Dex: Platzhalter + zeitversetzte Vorschaubilder (`dexLazy`, `dexFill`), Fehlerschutz im Detail-Klick und in `renderMenu` | Dex-Bug (Abschnitt 3) |
| `src/14-battle.js:144` | `winBattle` nur einmal je Kampf (`B.won`) | Doppelkampf-Fehler (Abschnitt 4) |
| `src/styles.css` ≈ Z. 786–793 | („QA B3“-Blöcke, vom Vorgänger-Lauf): `.ccPanel .ccAct` klebt unten im scrollenden Panel, `@media` Querformat ≤ 430 px für „Wer bist du?“ | „Los geht’s!“ bleibt bei 860×400 sichtbar |
| `test/qa_a_recht.mjs` | um Ortsbilder/DRAFT/Frida-Bruno-Mox&Lox-Abschnitte erweitert | Prüfung 4 |

Neue Tests/Hilfsdateien (alle in `test/`): `unit_dex_firstopen.mjs`, `qa_b_story.mjs`, `qa_b_intro.mjs`, `qa_b_figuren.mjs`, `qa_b_kaempfe.mjs`, `qa_b_ui.mjs`, `qa_b_save.mjs`, `qa_b_winbattle.mjs`, `qa_b_smoke2v2.mjs` (Diagnosekopie, inzwischen gelöscht), `qa_b_perf.mjs`, `qa_b_merkmale.mjs`, `qa_b_dex_*.mjs`, `qa_b_burn.mjs` (Last-Erzeuger), JSON/PNG-Ergebnisse `qa_b_*.json/png`.

## 6. Nachbesserungsliste

### B1 (Figuren/Intro/Porträts)
1. **Starterpanel bei Großbildschirmen** (`src/23-intro.js` + `src/styles.css`, Klassen `.fgPick`/Startkarten): bei 1920×1080 sind die Karten nur ≈ 105 × 165 px (knapp 10 % der Bildbreite, oben mittig) und wirken verloren neben den großen Figuren → mit `clamp()`/`vmin` skalieren (Test `qa_b_intro.mjs` 1920×1080, Screenshot `qa_b_intro_1920x1080_4_starter.png`).
2. **22 Figuren ohne Porträtdatei** (prozeduraler Kopf): vorrangig die 8 mit `art`-Schlüssel (rayan, mira, eira, brann, zaria, ondra, hesper, ardena) in `src/34-figures.js` und `public/art/` – Rayan/Mira und Ardena sind die sichtbarsten.
3. **Endkampf-Balance** (`src/34-figures.js`, `rivalTeam`/Teams der Figuren): Ardena 45 %, Ondra 60,5 %, Brann 72 %, Hesper 76,5 % gegen Solan/Seraphine/Varkon ≈ 96–100 %. Für „leicht“ Ardena auf ≈ 60 %, Ondra auf ≈ 70 % anheben (Stufe −1 oder schwächere Wertung des letzten Mitglieds); danach `node test/qa_b_kaempfe.mjs 200`.
4. Weich-Sätze nur zur Kenntnis: „Ich verliere nicht. Nie.“ (Seraphine, `kampf`) ist in Ordnung, ggf. „… nicht so schnell.“

### B2 (Story/Texte)
1. **Sätze > 80 Zeichen kürzen** (Kasten wird zwar von `kanonLines` geteilt, aber Vorgabe verfehlt):
   - `src/02-world.js` ≈ Z. 200, Seemann Ole (`windkueste`): „Wenn du dort heilen willst: Die Kreaturenstation liegt gleich links vom Dorfplatz.“
   - `src/27-story.js` ≈ Z. 336ff, Beschreibungen `d:` von `sq_funkel`, `sq_faehrten`, `sq_knoten`, `sq_fieber`, `sq_sterne`, `sq_signal` (Länge ohne Präfix etwa 90–110 Zeichen; Messwert inkl. Präfix 107–115).
2. **Wortwahl**: „Top-Drei“ (`27-story.js` Z. 1) → „Turmrat“/„die drei Türme“; „Champion“ (`02-world`, `03-engine`, `14-battle`, `15-ui` ×4, `16-expansion` – intern/Flag-Namen bleiben, aber sichtbare Texte → „Kronenhüter/in“); „Jungtrainer“, „Trainer“ (15-ui, 16-expansion, 27-story) → „Wanderer/Reisende“.
3. **Chronik-Ruf-Text** „Prof. Lindqvist“ wird nur vom Filter (`kanonText`) zu „Veyran“ – im Quelltext direkt ändern (Filter fällt nie ins Leere).
4. `docs/figuren.md:7` Tabelle „alt (Pokémon-nah)“ – Begriffe aus dem Kapitel entfernen oder umformulieren, falls das Dokument weitergegeben wird.

### Übrige (A/Dirigent)
- `src/15-ui.js:354` `rBox`: Platzhaltertext „Kommt in Phase 5“ (Kreaturenbox) – sichtbar, falls die Box-Seite leer ist.
- `src/10-mon3d.js:370` (`FEAT[f](X)` in `try/catch`, nur `console.warn('Merkmal', …)`): **27 Arten verlieren still ein 3D-Merkmal**, weil die Merkmals-Funktion einen Körperteil voraussetzt, den das Grundmodell der Art nicht hat (`X.U.serp` bzw. `X.segTop` fehlen). Betroffen (`test/qa_b_merkmale.mjs`): `tree` ×8 (024, 041, 042, 068, 080, 095, 134, 151), `whirl` ×5 (025, 026, 027, 110, 111), `iceSpines` ×4 (075, 076, 077, 146), `batWings` ×4 (036, 077, 135, 136), `lavaBlobs` ×3 (034, 035, 036), `cloudMane` ×2 (027, 140; `X.segTop is not a function`), `ribbonTail` ×1 (139). Nur Optik der prozeduralen 3D-Modelle (ohne Absturz, Smoke grün) – bei A2/Look-Modernisierung beheben (Merkmal an den vorhandenen Körperbau anpassen oder `sp` der Art ändern).
- Art „Krabbi“ ≈ „Krabby“ (A1) umbenennen.
- Performance: siehe `docs/perf-basis.md` (Renderhöhe auf Gerätepixel kappen, Dreiecke senken).

## 7. Offene Punkte
- Dex-Ursache nicht auf echtem Handy bestätigt; falls der Fehler trotz Fix auftritt: Konsole (Fehler) und Gerät/Browser erfragen, dann `qa_b_dex_repro2.mjs` mit `VIEW`/`PAGE`/`WAIT` anpassen.
- `runRound` ist weiterhin nicht gegen gleichzeitige Aufrufe gesperrt (siehe 4).
- Performance nur unter Software-GL gemessen – echte Gerätewerte stehen aus.
- „Doppelkampf 2v2“: Diagnosekopie `qa_b_smoke2v2.mjs` wurde in der Loop-B-Nachbesserung gelöscht (Fix in `winBattle` ist im Smoke selbst abgedeckt).

## 8. Befehle
```
node build.mjs && node test/smoke.mjs                 # 2× "Keine Fehler."
for f in test/unit_*.mjs; do node $f; done            # alle grün
node test/unit_dex_firstopen.mjs                      # 29 ✓
node test/qa_b_story.mjs ; node test/qa_b_save.mjs    # 12/12 · 19/19
node test/qa_b_intro.mjs                              # 67 ✓ (setzt VEYRA_DEMO selbst)
node test/qa_b_kaempfe.mjs 200 && node test/qa_b_figuren.mjs
node test/qa_b_winbattle.mjs 4                        # Doppelaufruf-Analyse
node test/qa_b_perf.mjs                               # → test/qa_b_perf.json, docs/perf-basis.md
```
