# Veyra – QA Look L3 (Look-Modernisierung) · Bericht

Agent L3 „QA Look-Modernisierung“ (Sonnet hoch) · 10.11.2026 · Prüfgegenstand: Look L1 (Welt-Rendering, Auto-Qualität, `docs/look-welt.md`, `docs/perf-basis.md`) und Look L2 (UI-Reduktion, Kampf-Inszenierung, `docs/look-ui.md`), Stand `node build.mjs` nach allen L3-Eingriffen.
Umgebung: Headless-Chromium mit Software-WebGL (SwiftShader). Absolute FPS sind dort nicht aussagekräftig; belastbar sind Draw-Calls, Dreiecke, JS-ms/Frame, Renderfläche (Mpx) und Zustandslogik. Alle Messskripte liegen in `test/` (Aufrufe im Kopf der Dateien); Screenshots: Welt `test/look_welt_v5_<860|1920>_<karte>_<tag|abend|nacht>.png` (Nachher) gegen `look_welt_v0_*` (Vorher, nur 860 und nur sechs Ansichten) bzw. `v4`; UI `test/look_ui_<szene>_<h|t|p>_l3.png` (Nachher) gegen `test/ui_fs_*.png` (Vorher, Stand UI-Vollbild) bzw. `look_ui_*_final.png`; Kampf `test/look_ui_kampf-*_l3_860.png`.

## 1. Ergebnistabelle (1–10)

| # | Prüfung | Note | Kernbefund |
|---|---|---|---|
| 1 | Look Welt (5 Karten × Tag/Abend/Nacht × 860×400 / 1920×1080) | **8** | Gegenüber v0 deutlich ruhiger und plastischer (eine Sonne mit weichen Schatten, Shader-Boden statt Kachelraster, Himmel/Wolken, Abendrot und Nachtblau lesbar). Mängel: Leuchtturm-Strahl in Brisenhafen (Abend/Nacht, 860) erscheint als harte graue Kegelplatte oben links; Nebelgrotte sehr dunkel, Kristall verschwindet unter dem Chronik-Knopf; Flüstertal fast einfarbig violett; Kamera am Spawn in Morgenau (9,7 „up“) wird von einem Haus hinter dem Spieler auf 0,3 gezogen (Kopf füllt das Bild). Wand-Anschnitt in Brisenhafen mit I2 behoben (siehe 3.2). |
| 2 | Look UI (9 Szenen × 860×400 / 1180×820 / 390×844) | **6** | Ruhe und Hierarchie gut: Welt fast leer, Dialog-Band, Karten statt Listen, Kampfmenü mit einer Hauptaktion, nichts läuft aus dem Bild (Überlauf 0 in allen 42 Aufnahmen), Seitenfehler 0. Aber: **Kontrast** der Menü-Tableiste (Karte/Team/Tasche/Box/Optionen, 9–12 px) nur ≈ 1,4–2,2:1 (Glas über Welt), Optionen-Zeilen „muted“ und Segment-Knöpfe teils < 3:1; im Ruhezustand sind Steuerknöpfe/Uhr absichtlich auf 25 % gedimmt (aktiv ≥ 3,3:1, Text ≥ 4,5:1 außer Uhr im Hochformat 1,5:1). **Touch**: 28–34 Ziele pro Größe unter 48 px (Segment-Knöpfe 28 px hoch, Schalter 32, „Zuklappen“ 44, HUD-Pille 40, Karte/Vollbild 46, Dex-Seitenknopf 36 px breit). Hochformat: Welt nur im oberen Bildstreifen (390×~400), Bedienfläche darunter fast unsichtbar. |
| 3 | Kampf-Inszenierung | **8** | `test/qa_look_kampf.mjs` 24 von 26 Prüfungen ✓: Fahrt aus der Totale (Abstand 12,3 → 9,5 → 8,2 → 8,0, monoton), Schwenk 0,14 rad, Attackenwahl → eigene Kreatur (5,8), Treffer → Getroffener 0,95 s, Bewegung reduzieren springt ohne Fahrt; KP-Leisten sitzen 2–3 px neben dem Kopf-Mittelpunkt und überlappen nicht; Attackenkarten 194×61 px, Kontrast ≥ 5,3:1; Kampfstart JS-Hauptthread **26 ms** (kurzer Auftakt) / **285 ms** (1. Kampf) ≪ 1,5 s; 2D-Kampf via `setView('2d',true)` läuft (`#battle.b2d`). Offen: Meldungszeile 12,6 px (< 13), „Kampf“-Knopf weiß auf Rosa 4,26:1. |
| 4 | Performance | **8** | Dreiecke Route 1 356 k → 108–122 k (Auto/Hoch), Brisenhafen 150 k, Kampf 37 k → 18 k; Renderfläche 860×400: 4,46 → 0,34 Mpx, 1920×1080: 3,69 → 2,07 Mpx; Draw-Calls 30 → 38 (Route 1) bis 71 (Brisenhafen); JS/Frame 1×: 1,5–4,7 ms, 4×: 5–13 ms (p95 bis 26 ms). Auto-Qualität in 16/16 Prüfungen ✓ (Hysterese, Reihenfolge, feste Optionen). Gefunden und behoben: im Kampf fiel `PERF.scale` auf 0,6, obwohl der Kampf-Canvas den Maßstab ignoriert (Welt wäre danach unscharf gestartet). Offen: echtes Handy. |
| 5 | Spielstand / Einstellungen | **9** | `test/qa_look_save2d.mjs` 32/32 ✓: alte Standards (1440 / 30 fps / „eigene“ / `view 2d`) → `auto` / 60 fps / `auto`; bewusste Werte (1080p, nativ, 720p/30 fps/niedrig, 1440 + 60 fps) bleiben; ungültige Auflösung/Grafikstufe → `auto`; `old_save_pre_a1.json` und `old_save_4orden.json` laden, Team/Box/Dex unverändert; `unit_migration` 27 ✓. Ein Fehler gefunden und behoben (`07-settings.js`, ausgeschluckte Zeile, 3.3). |
| 6 | 2D-Modus versteckt | **9** | Kein 2D/3D-Knopf im HUD (`#viewBtn` unsichtbar), kein „2D“/„3D“ im sichtbaren HUD, Start immer 3D (auch bei altem `view "2d"`); Optionen › Erweitert (eingeklappt) bietet Ansicht 3D / Ego / Draufsicht / Illustration / 3D-Arena, Umschalten funktioniert und wird gespeichert, 2D-Welt zeichnet (`#world` 860×400), 2D-Kampf läuft. |
| 7 | Recht | **9** | `qa_a_recht.mjs`: harte Treffer (Marken/Fremdnamen) **0**; keine Markenwörter in neuen/geänderten Dateien (`test/qa_look_*.mjs`, `src/15-ui.js`, `09-three3d.js`, `43-perf.js`, `07-settings.js` geprüft); Titelbild = eigene Starter-Illustrationen 001/004/007, App-Icons unverändert (`dist/icons`), keine `*_DRAFT`-Dateien in `dist/`. Die niedrigen Altbefunde (Arenaleiter, „Orden“, Attackennamen) bleiben wie in `qa-loop-a.md`/`qa-loop-b.md`. |
| 8 | Tests | **9** | Build + `smoke.mjs` **2× „Keine Fehler.“**; alle `unit_*` grün (art 20, battle 33, capture, dex_firstopen 29, figures 32, migration 27, qa3 36, species 33, story 26); `look_ui_cam` 9 ✓; `qa_b_intro` 67 ✓/0 ✗; `b1_shots` 11 ✓; `qa_b_figuren` 18 ✓; `qa_look_auto` 16 ✓; `qa_look_save2d` 32 ✓. `dist/artifact.html` = 11 620 759 B (11,1 MiB) < 16 MB. |

Gesamtnote L3: **8,3** (Mittel der acht Noten 8,25). Nur Prüfung 2 liegt unter 8 – Nachbesserungsliste siehe 2.

## 2. Nachbesserungsliste für L1 / L2

Priorität A = vor Release, B = bald, C = bei Gelegenheit. „Zeile“ bezieht sich auf den Stand nach L3.

### Zwingend (Note < 8: Prüfung 2 Look UI)
| Pr. | Datei:Zeile | Befund | Vorschlag |
|---|---|---|---|
| A | `src/styles.css:711–713` (`body.lay-land #menu #tabs`, Beschriftung `font-size:calc(var(--u) * .8)`), `:946` | Tab-Beschriftungen Karte/Team/Tasche/Box/Optionen/Medaillen: 9–12 px, gemessen 1,4–2,2:1; die Leiste hat kein eigenes Hintergrund-Glas, Text liegt auf der unscharfen Welt (`look_ui_chronik_h_l3.png`). | Leiste mit `background:var(--pane-hi)` (wie `#bLog`, `:736`) hinterlegen, Beschriftung `color:var(--l2-ink)`, ≥ 11 px; aktive Marke bleibt Rosa. Erwartung ≥ 4,5:1. |
| A | `src/styles.css:281` (`.seg button`, Padding 6px 12px, 13 px) | Segment-Knöpfe in Optionen sind ≈ 28 px hoch (6–7 je Ansicht), nicht gleichwertig zu den 48-px-Zielen. | `min-height:44px` (Querformat 40 px mit 8 px Abstand reicht als Kompromiss) oder die Zeile als volle Karte tippbar machen; `.tog` (`:283`) auf 52×44 Trefferfläche (Pseudo-Element). |
| A | `src/styles.css:1020`, `#mBody .muted` | `.muted`-Texte der Optionen („Schaltet Kamera-Wackeln …“), Tab „Automatisch“ (3,9:1), „Neu starten“ (3,9:1): knapp bis deutlich unter 4,5:1; einzelne Messungen < 2:1 sind teils durch Scroll-Clipping verfälscht (Zeilen außerhalb der Karte). | `--l2-ink2` abdunkeln (≈ #4a5568 statt aktuellem Grau), Pill-Rot `.pill.danger` auf dunkleren Ton; nach der Änderung `node test/qa_look_ui.mjs` wiederholen. |
| B | `src/styles.css:817/659/825`, `.hud #hudClock` (`:820`) | Ruhezustand: Uhr + Knöpfe bei 25 % Deckkraft (Kontrast 1,2–2,2:1). Das ist beabsichtigt, aber die Uhr bleibt im Hochformat auch aktiv bei 1,5:1 (weiß auf heller Pille). | Uhr nicht auf `.25`, sondern `.55`; im Hochformat Pille mit dunklerem Glas oder Text `--l2-ink`. Die Steuerknöpfe (Reiten/Rennen/Fang/Chronik) im Ruhezustand auf ≥ `.45` (blasse Beschriftung ist sonst für Kinder nicht lesbar). |
| B | `src/styles.css:826` (`#mmBtn`), `:654` (`#fsBtn`), `.hudP` (Höhe 40), `#mClose` (`src/shell.html:23`, 44 px) | Haupt-Bedienelemente im HUD 40–46 px. | Auf 48 px anheben (Icon bleibt gleich groß, Padding wächst); `#mClose` `min-height:48px`. |
| B | `src/styles.css` Hochformat (`body.lay-port`, `#screen`) | Hochformat (390×844, nur mit „Hochformat zulassen“): 3D-Fläche nur ≈ 390×400, darunter eine fast leere graue Fläche mit blassen Knöpfen (`look_ui_welt_p_l3.png`). | Welt im Hochformat auf ≥ 70 % der Höhe ziehen und die Knöpfe über der Welt (Glas) statt auf Grau platzieren, oder Hochformat weiter als „Querformat empfohlen“ behandeln. |
| C | Dex-Raster `dex_p` (`.dx.none` und Seitenknöpfe) | Im Hochformat überlappen die Seitenknöpfe die Karten (3 Überlappungen, Knopf 36×48). | Pager-Knöpfe 48×48 mit Abstand zum Raster; „???“-Karten `small` auf `--ink-2`. |

### Weitere Befunde (Note ≥ 8, trotzdem empfohlen)
| Pr. | Datei:Zeile | Befund | Vorschlag |
|---|---|---|---|
| A | `src/09-three3d.js:603` (Kegel `ConeGeometry(1.4,14,16,1,true)`, additiv), `:676` (Deckkraft `Math.max(night,gray*.6)*.16`) | Leuchtturm-Strahl wirkt in Brisenhafen (860, Abend/Nacht) wie eine harte graue Platte oben links, weil der Kegel nahe an der Kamera abgeschnitten wird (`look_welt_v5_860_brisenhafen_nacht.png`). | Kegel-Material mit Verlauf entlang der Länge (Alpha 0 an Basis und Spitze, `vertexColors` oder Alphakarte), `depthWrite:false`, Strahl ab Kameraabstand < 8 ausblenden (`opacity *= smoothstep(4,10,distCam)`). |
| B | `src/09-three3d.js` (Spawn-Kamera, `camB1`, Fall `'R'` Felsen) | Morgenau (9,7 „up“): Kamera wird durch das Haus hinter dem Spieler auf Abstand 0,3 gezogen, der Spieler füllt das Bild (`look_welt_v5_1920_morgenau_*`). `camB1` kennt `'R'` (Felsen) nicht. | Beim Kartenstart `R3.snap` mit Mindestabstand 2,2 (wie I2) setzen; `camB1` für `'R'` Art 2 (weich) liefern. |
| B | `src/06-regions.js` (Nebelgrotte-Licht), Kristall-Prop | Nebelgrotte Tag: Gesamthelligkeit sehr niedrig, Kristall (rechts) liegt hinter dem Chronik-Knopf. | Höhle: Umgebungslicht +20 %, Kristall-Emission; Steuerknöpfe sind ohnehin dimmbar. |
| B | `src/06-regions.js` (Flüstertal, PALETTE) | Fast einfarbig Violett/Blau; Pflanzen und Boden kaum unterscheidbar. | Zwei Akzentfarben (warmes Gras am Pfad, Gold an Blüten), Boden aufhellen. |
| B | `src/styles.css:737` (`body.lay-land #bLog`, `font-size:calc(var(--u)*1.15)`) | Kampf-Meldungszeile 12,6 px bei 860×400 (Ziel ≥ 13). | `max(13px, calc(var(--u)*1.15))`; für Kinder besser 14 px. |
| B | `src/styles.css` Kampf-Hauptknopf (`.big.k1`/„Kampf“) | Weiß auf Rosa-Verlauf 4,26:1 (< 4,5). | Helles Verlaufsende des Hauptknopfs um ≈ 8 % abdunkeln (Ziel ≥ 4,6:1). |
| C | `src/10-mon3d.js:677`, `src/08-gfx.js:422` | `createRadialGradient(tx,ty,0,tx,ty,42*k+8)`: ist `k < -0,19` (Fx-Zeit in der Zukunft, z. B. nach Uhrensprung), wirft Canvas „r1 < 0“ und die Kampfschleife bricht ab. Im Normalbetrieb nicht erreichbar (fand sich im Test mit synthetischer Zeit). | `k=Math.max(0,k)` einsetzen. |
| C | `src/43-perf.js` | Im Kampf wird nicht geregelt (L3-Fix, siehe 3.3); ein dauerhaft langsamer Kampf senkt die Stufe daher erst nach der Rückkehr in die Welt. | Bei Bedarf Kampf mit eigener Stufe (`BT.gfx`) regeln. |

## 3. Befunde im Detail

### 3.1 Look Welt (Prüfung 1)
- Vorher/Nachher: `look_welt_v0_*` (860) gegen `look_welt_v5_*` (860 und 1920) für Route 1, Morgenau, Brisenhafen, Nebelgrotte (nur Tag), Flüstertal × Tag/Abend/Nacht, 26 Aufnahmen.
- Route 1 und Morgenau wirken am besten (Tageszeiten klar unterscheidbar, Laternenlicht in der Nacht, Schatten ruhig). Brisenhafen: Wasser/Palmen/Pflaster gut, Strahl-Artefakt (A, oben). Nebelgrotte: stimmungsvoll, aber dunkel. Flüstertal: Farbigkeit zu einheitlich.
- Spielfigur und Begleiter stehen in allen Ansichten im Bild; HUD in Ruhe fast leer (wie L2 vorsieht).

### 3.2 I2 Kamerakollision (eigener Eingriff)
- Ausgangslage: `camBlock`/`camB1` (09-three3d.js:617/618) tastete nur entlang der Kamerastrecke ab; seitlich neben der Strecke liegende Wände füllten trotzdem das Bild (Wandstück in `look_welt_v4_1920_brisenhafen_tag.png`).
- Umsetzung `src/09-three3d.js:718–724` (und Nutzung in 727): (1) seitlicher Schub `spT`: harte Wände (Art 1) innerhalb 1,3 auf einer Seite und freie Gegenseite → Kamera weicht bis 1,0 aus, geglättet über `R3.sp` (`sdamp`); (2) zwei Kanten-Sonden (±0,85 rad, Länge 2,0) kürzen `lim` in 0,2-Schritten bis min 2,2 (nur außerhalb von Innenräumen). Schalter über vorhandene Kameralogik, keine neue Schnittstelle.
- Messung Brisenhafen (9,11 „down“): Kameraabstand 3,6 → 2,2, Wandanteil im Bild ≈ 35 % → ≈ 12 % (`test/look_welt_v5_1920_brisenhafen_tag.png`).

### 3.3 I1 Optionen und sonstige Fixes (eigene Eingriffe)
- **I1** `src/15-ui.js:386` (onclick), `:404–406`: „Auto“ für Qualitätsstufe und Auflösung, neue Zeile **Grafikstufe** (`SET.gfx` auto/low/mid/high, Text „Auto passt Schatten, Pflanzen und Effekte an dein Gerät an. Niedrig schont den Akku.“); nach Änderung von `quality`/`res`/`gfx` wird `perfStart();w3Quality();` aufgerufen. Geprüft in `qa_look_save2d.mjs` I1a–h (8 ✓): Auto-Knöpfe markiert, Grafikstufe „Niedrig“ → `PERF.tier low` und Schatten aus, „Hoch“ → Schatten 1024, Auflösung 720p → Qualität „eigene“, Qualität „Auto“ → `res auto`/`gfx auto`/60 fps.
- **Fix 07-settings** `src/07-settings.js:74`: die Zeile `if(!['720','1080','1440','native','auto'].includes(String(SET.res)))SET.res='auto';` stand hinter einem `//`-Kommentar derselben Zeile und wurde nie ausgeführt; ungültige Auflösungen blieben erhalten. Zeile abgetrennt.
- **Fix 43-perf** `src/43-perf.js:23`: `perfFrame` wertet im Kampf (`mode==='battle'`) nicht aus. Vorher sank `PERF.scale` im Kampf bis 0,6 (`qa_look_perf.json`, Szene kampf3d/auto: Maßstab 0,6/0,7), obwohl der Kampf-Canvas den Maßstab nicht nutzt; die Welt wäre unscharf gestartet. Nachher: Maßstab im Kampf unverändert (4×-Drossel, 15 s: 0,8 → 0,8).

### 3.4 Performance (Prüfung 4) – Tabelle vorher → nachher
Methode wie `docs/perf-basis.md` (Chromium + SwiftShader, CPU 1× / 4×); „vorher“ = Standardkonfiguration aus `perf-basis.md`, „nachher“ = Auto (Stufe low unter SwiftShader, da `PERF.weak`) bzw. Hoch (`test/qa_look_perf.mjs` → `test/qa_look_perf.json`).

| Szene (860×400, CPU 1×) | Mpx vorher → nachher | Draw-Calls | Dreiecke | JS/Frame ms (Mittel / p95) |
|---|---|---|---|---|
| Route 1 | 4,46 → 0,34 | 30 → 38 / 39 (Auto / Hoch) | 356 504 → 107 818 / 122 438 | 2,0 / 2,0 → 1,8 / 3,9 (Auto), 2,6 / 6,3 (Hoch) |
| Morgenau | 4,46 → 0,34 | 43 → 57 / 58 | 309 312 → 111 814 / 118 214 | 1,6 / 1,6 → 2,2 / 3,5 (Auto), 2,7 / 7,6 (Hoch) |
| Brisenhafen (Stadt) | – | – → 71 / 71 | – → 150 374 / 152 520 | – → 1,9 / 3,2 (Auto), 2,8 / 4,7 (Hoch) |
| Kampf 3D | 3,10 → 0,34 | 15 → 13 | 37 188 → 18 084 | 2,9 / 2,9 → 2,0 / 3,7 (Auto), 1,7 / 2,8 (Hoch) |

| Szene (CPU 4×) | 860×400 JS ms (Mittel / p95), Auto / Hoch | 1920×1080 JS ms (Mittel / p95), Auto / Hoch |
|---|---|---|
| Route 1 | 9,4 / 25,7 · 7,7 / 11,9 | 8,3 / 15,3 · 12,1 / 22,9 |
| Morgenau | 10,5 / 17,0 · 9,5 / 13,6 | 9,4 / 13,9 · 6,5 / 7,4 |
| Brisenhafen | 10,5 / 17,6 · 8,6 / 12,6 | 13,5 / 19,7 · 8,3 / 13,8 |
| Kampf 3D | 5,9 / 12,5 · 5,4 / 11,9 | 9,6 / 21,9 · 5,0 / 7,9 |

Bewertung: Dreiecke −66 bis −70 % (Ziel ≤ 150 k erreicht, Brisenhafen 150 k knapp), Renderfläche im Handy-Querformat −92 %, Draw-Calls bleiben ≪ 150. Die 4×-Werte (8–13 ms Mittel, p95 bis 26 ms) liegen in der Nähe des 16,7-ms-Budgets; deshalb ist die Auto-Regelung wichtig. Auf einem echten schwachen Handy nicht gemessen.

**Auto-Qualität** (`test/qa_look_auto.mjs`, synthetische Frame-Zeiten in `perfFrame`, 16 ✓):
- 40-ms-Frames (25 fps): Auflösung fällt zuerst schrittweise bis 0,6 (Canvas 400 → 240 px), erst danach Stufe high → mid → low (ab Takt 28).
- 10-ms-Frames: erst Auflösung zurück auf 1,0 (Takt 73), danach Stufe low → mid → high (ab Takt 96).
- Hysterese: Regelkreis (Frame-Zeit ∝ Maßstab²) pendelt sich in 4 Wechseln ein, keine Wechsel in den letzten 60 Takten; 22 ms (1,32 × Ziel) senkt schrittweise, nie unter 0,6; 18–20 ms (1,08–1,25 × Ziel) bleibt stehen.
- Feste Optionen respektiert (`gfx mid`: Stufe bleibt, `res native`: Maßstab 1, alles fest: 0 Wechsel); schwache GPU startet low/0,8, Touch-Gerät mid.

### 3.5 Kampf (Prüfung 3)
- Kamerafahrt in synthetischer Zeit (`camTick` mit festen 16,7 ms, unabhängig von der Software-GL): Totale (Abstand 12,3, Höhe 1,29, Pitch 0,29) → 8,0 nach 2,5 s; Schwenk (Gierwinkel) 0,14 rad über 12 s; Attackenwahl `rmoves` → Fokus „me“, Abstand 5,8; Treffer → Fokus „foe“ 0,95 s, danach Rückkehr; reduzierte Bewegung: Abstand nach einem Frame 8,0 (Sprung ohne Fahrt).
- KP-Leisten: Gegner Δx 2 px / me Δx 3 px zum projizierten Kopf, Unterkante 4 px über dem Kopf (Gegner), keine Überlappung, beide `placed`.
- Meldungen/Karten: Karten 4 sichtbar, 194×61 px, alle im Bild; Kontrast ≥ 5,3:1; Touch ≥ 48 px; Attacke per Karte senkt Gegner-KP (31 → 21), Menü kehrt zurück.
- Kampfstart (CDP-Performance-Metriken, `ScriptDuration`): 26 ms (ab 3. Kampf, kurzer Auftakt) und 285 ms (1. Kampf, langer Auftakt) JS-Zeit bis zum Menü. Gesamt-Wandzeit unter SwiftShader 2,4 s / 5,1 s, davon fast alles Software-GL; geplanter Auftakt im Code 220 ms (kurz) bzw. 800 ms (lang).
- 2D-Kampf (`setView('2d',true)`): `#battle.b2d`, Menü da, Attacke läuft durch, keine Seitenfehler.
- Hinweis zur Testmethode: Eine frühere Testfassung setzte `B.fx.t` auf synthetische Zukunftszeit; das ergab negative Radien im Kampf-Effekt (siehe C-Punkt in 2) und tote Kampfschleife – kein Spielfehler, Test angepasst.

### 3.6 UI-Audit (Prüfung 2) – Messwerte
`test/qa_look_ui.mjs` (Auswertung in `test/qa_look_lib.mjs`): Kontrast aus Computed-Style-Vordergrund gegen Median der gerenderten Pixel im Textrechteck (Ziel 4,5:1, große Schrift 3:1), Touch-Fläche über `elementFromPoint`-Raster (Ziel 48 px), Überlappungen interaktiver Elemente, Textüberlauf; verdeckte Elemente (HUD unter Menü) ausgefiltert.

| Größe | Touch-Ziele | davon < 48 px | Texte | Kontrast-Fehler | Überlappungen | Überlauf |
|---|---|---|---|---|---|---|
| 860×400 | 123 | 28 | 153 | 52 | 1 | 0 |
| 1180×820 | 150 | 34 | 172 | 58 | 1 | 0 |
| 390×844 | 132 | 34 | 144 | 35 | 6 | 0 |

(Zählung über 14/14/14 Aufnahmen inkl. Welt-Zuständen Banner, Ruhe, Info, Aktiv; viele Fehler wiederholen sich je Szene, z. B. die Tableiste in vier Menüs.) Einzelwerte je Szene: `test/qa_look_ui.json`.
- Ruhe: Welt im Ruhezustand zeigt nur HUD-Pille, Karte und Vollbild (25 % Deckkraft) plus die gedimmten Steuerknöpfe; aktiv (860×400, 1180×820) alle Texte ≥ 4,5:1 (kleinster Wert 3,3:1 bei großer Schrift „A“), im Hochformat nur die Uhr darunter (1,5:1). Dialog 9,0:1, Dialog-Optionen 4,3:1 („Ja, bitte!“ weiß auf Rosa, knapp).
- Hierarchie: je Szene genau ein Hauptknopf in Rosa (Kampf, Ja, bitte!, A); Menüs mit großer Überschrift, Karten, Versalzeilen-Kategorien.
- Kinder-Lesbarkeit: Fließtext 12–16 px, aber viele Meta-Texte 9–11 px (Chips, Tabs, „#009 ???“); empfohlen Mindestgröße 12 px.
- Überlappungen: Optionen › Erweitert (`#mClose` × `.pill`, `.tog.on`) bei kleiner Höhe, Dex-Hochformat (3), Optionen-Erweitert-Hochformat (3).

### 3.7 Spielstand, 2D, Recht, Tests
Siehe Tabelle; ergänzend `old_save_*`-Fixtures: „Fortsetzen“ sichtbar, Spiel lädt in 3D (`third`), Team 4 → 4, Box/Dex unverändert. Rechtscheck: `qa_a_recht.mjs` „Harte Treffer 0“; neue Dateien enthalten keine Fremdmarken. Build: Index 1,24 MB, Artifact 11,6 MB.

## 4. Eigene Fixes (Übersicht)
| Kürzel | Datei:Zeile | Änderung |
|---|---|---|
| I1 | `src/15-ui.js:386, 404–406` | Optionen: Auto für Qualitätsstufe/Auflösung, neue Zeile Grafikstufe, `perfStart();w3Quality();` nach Änderung |
| I2 | `src/09-three3d.js:718–724, 727` | Kamera: seitlicher Schub von Wänden + Kanten-Sonden gegen angeschnittene Wände |
| – | `src/07-settings.js:74` | ausgeschluckte Auflösungs-Prüfung wiederhergestellt |
| – | `src/43-perf.js:23` | keine Auto-Regelung im Kampf |
| – | `test/qa_look_*.mjs` (neu) | `qa_look_lib` (Audit), `qa_look_ui`, `qa_look_kampf`, `qa_look_perf`, `qa_look_auto`, `qa_look_save2d` |

## 5. Offene Punkte
- Messung auf echtem Handy (iOS/Android) fehlt; SwiftShader liefert nur Zustandslogik und relative Last.
- Die Pixel-Kontrastmessung nimmt den Median hinter dem Textrechteck; über stark wechselndem Hintergrund (Welt hinter Glas) streuen die Werte, Tableiste/Optionen sind aber im Screenshot sichtbar blass.
- Kampf wird nicht automatisch heruntergeregelt (siehe C-Punkt).
- Auto-Quality-Hysterese nur mit synthetischen Zeiten geprüft, nicht über längere echte Sitzungen.
- Aufnahmen Nebelgrotte Abend/Nacht fehlen in der Vorher-Reihe (v0 hat nur Tag).
