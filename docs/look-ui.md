# Look L2 – UI-Reduktion & Kampf-Inszenierung (10.11.2026)

Grundlage: AGENTS.md › LOOK-MODERNISIERUNG + PERFORMANCE (3), LAYOUT-ENTSCHEIDUNG, docs/ui-vollbild.md. Nur Prinzipien (wenig UI, ruhige Typografie, Infos bei Bedarf, Kamera statt Menüwände) – keine Fremdoptik.

## Gestaltungsregeln (Block „LOOK L2“ am Ende von `src/styles.css`)
- **Glas ohne Rahmen:** `--l2-glass` (.66) / `--l2-glass-hi` (.82) / `--l2-glass-lo` (.5), `--l2-blur` (18 px, Sättigung 1,35), weicher Schatten `--l2-sh`, oben eine 1-px-Lichtkante `--l2-hl`, großer Radius (`--l2-r` = 1,6 u, Knöpfe als Pille). Keine Linien/Rahmen.
- **Typografie:** Nunito Sans 400 (Meta, Beschreibungen) / 600 (Labels, Dialog, Knöpfe) / 700 (Namen auf Karten); Fredoka nur für Titel (Logo, Seitentitel, Gebietsbanner, Missionstitel, Dex-Detail). Kategorien als Versal-Zeilen mit Sperrung (`#mBody h3`).
- **Bewegung:** Ein-/Ausblenden 200–300 ms (`--l2-t` 240 ms, `--l2-ease`), Drücken 0,95. `body.red` und `prefers-reduced-motion` schalten Logo-Licht, Chevron-Puls, Karten-Einflug und Übergänge ab; die Kampfkamera springt dann ohne Fahrt und ohne Schwenk.
- **Kind/Lesbarkeit:** Touch-Ziele ≥ 48 px (Uhr-Pille und Kopfknöpfe mit unsichtbarem Trefferrand), Text dunkel (#16202c) auf Glas ≥ 82 % Deckkraft bzw. weiß auf Signaturfarbe (4,9:1); Typ immer Farbe + Symbol (Typ-Plakette in den KP-Leisten, Symbol in den Attackenkarten), KP-Balken zusätzlich mit Zahl (eigene Kreatur), Farbschwäche-Modus bleibt.

## Erkunden – fast leeres Bild
| Element | Verhalten |
|---|---|
| Gebietsname | nur noch als Banner `#mapCard` beim Wechsel (SEQ.areaBanner), danach weg; `#hudMap` im HUD ausgeblendet |
| Uhr/Wetter `#hudP` | kleine Glas-Pille oben links, blendet 3 s nach Erscheinen/Gebiets-/Wetterwechsel auf 25 % (`.dim`); Tipp = Uhr wieder hell + Ziel-Zeile 6 s |
| Ziel `#hq` | dezente Zeile unter der Uhr; erscheint 6 s, wenn sich das Missionsziel ändert (beim Spielstart 7 s), sonst verborgen; Tipp öffnet wie bisher die Detailkarte `#hqCard` |
| Minikarte `#mmW` | verborgen; Kompass-Knopf `#mmBtn` oben rechts: Tippen = 6 s zeigen (erneut tippen = weg), Halten = solange gehalten; wird nur gezeichnet, wenn sichtbar. In der Chronik bleibt die Karten-Seite |
| Ansicht `#viewBtn` | aus dem HUD entfernt (Element bleibt für `setView`, `hidden`) |
| Steuerung | Daumenbogen 86 % Deckkraft, nach 4 s ohne Eingabe `SET.hudDim` (40/65 %); Geister-Stick 42 %, beim Abblenden 0 |

## Dialog
Schlankes Glas-Band unten (max. 820 px), Text Nunito 600 rechts neben dem größeren, oben überlappenden Porträt (6,4 u; behebt „erste Buchstaben unter dem Porträt“), Name als kleiner Tab, Weiter-Chevron pulsiert (aus während des Tippens). Auswahl im Querformat als Kartenstapel rechts über dem Band (erste Option in Signaturfarbe), im Hochformat wie bisher im Band.

## Kampf (rundenbasiert, 3D)
- **Kamera:** `CAM.mode='battle'` ab `startBattleNow` (14), Regie in `src/35-transitions.js`: Auftakt aus der Totale (Abstand 12,5, erhöht) in 1,6 s auf die Kampfdistanz (leichte Untersicht, beide Kreaturen im Bild, langsamer Schwenk ±0,07 rad). Hochformat: Kamera etwas mehr hinter der eigenen Kreatur und höher (Tiefe statt Breite), Szene 64 % statt 56 %. Attackenwahl (`#bMenu.rmoves`) → Kamera schwenkt zur eigenen Kreatur; Treffer (`B.fx`) → 0,95 s zum Getroffenen; Fangkapsel → 2,2 s zum Gegner. Kein Szenenwechsel, nur CAM-Werte.
- **KP-Leisten** `#bFoeBox`/`#bMeBox`: schlank (Name, Lv, Typ-Plakette, 6-px-Balken, eigene KP-Zahl, EP-Linie, Zustände) und **über den Köpfen**: Projektion der Kopfhöhe in Bildschirmkoordinaten nach jedem Kampf-Frame (`battleHudPlace`), weich nachgeführt, an Ränder und unter die Meldungszeile geklemmt, Überlappung wird aufgelöst; Kreatur außerhalb des Bildes (z. B. bei Fokus auf den Gegner) → Leiste ausgeblendet. Einblenden gestaffelt nach 0,7 s.
- **Meldungen** `#bLog`: dezente Glas-Zeile oben mittig statt Kasten.
- **Befehle** `#bMenu.rmain`: klein im Daumenbogen unten rechts – Kampf (Signaturfarbe) in der Ecke, Tasche links, Team darüber, Rückzug diagonal, Resonanz-Ring oben. Untertitel nur noch als `aria-label`. „Flucht“ heißt jetzt **Rückzug** (bei Herausforderungen deaktiviert).
- **Attacken** 2×2 Glas-Karten mit Element-Tönung + Symbol, AP/Wirkung als Chips; „Zurück“ als kleine Pille.
- **2D-Modus:** `#battle.b2d` (gemalte Bühne) behält das bisherige Layout (Panels links, Dock rechts); alle L2-Kampfregeln greifen nur bei `#battle:not(.b2d)` bzw. `.dieg`.

## Menüs
Chronik-Hülle „Glas“ ohne Gerätekanten (Scharnier/Edelstein aus), Seite als helles Glas, Kopf mit Fredoka-Titel und ruhigem „Zuklappen“. Inhalte als Karten (Missionen, Tasche, Optionen-Zeilen, Team, Dex) mit 12 px Abstand; Dex-Karten mit großem Bild (6,6 u), Titel/Meta-Hierarchie; `dexLazy`/`dexFill` unverändert. Optionen: neuer, eingeklappter Abschnitt **„Erweitert“** (`<details class="adv">`) mit *Ansicht* (3D · Ego · Draufsicht) und *Kampfbild in der Draufsicht*.

## 2D-Modus versteckt
`start()` (15) startet immer in 3D (`'third'`, oder `'ego'`, falls gespeichert); Draufsicht nur, wenn `SET.view2d=1` (Optionen › Erweitert › Ansicht › Draufsicht). `setView('2d',true)` funktioniert unverändert (Smoke).

## Titel
Ruhiger Nachthimmel-Verlauf mit weichem Lichtschein, Logo „VEYRA“ in Fredoka 600 mit langsam wanderndem Lichtband (aus bei reduzierter Bewegung), die drei Starter-Illustrationen (001/004/007) schweben über dem Logo, Glas-Knöpfe (Fortsetzen in Signaturfarbe), dezente Fußzeile „Beim ersten Tippen geht es ins Vollbild“ (sonst „Am schönsten im Querformat“).

## CAM-Schnittstelle (L2 setzt, L1 wendet an)
`CAM` ist das globale Objekt aus 36-input.js (`window.CAM`, Felder mode/target/dist/height/yaw/pitch/fov/roll/lookAt). L2 schreibt nur im Kampf:

| Feld | Bedeutung im Kampf (Koordinaten der Kampfszene `BT.s`) |
|---|---|
| `mode` | `'battle'` von `startBattleNow` bis `endBattle` (Sicherung: verschwindet `B` ohne endBattle, setzt 35 automatisch `'explore'` zurück); Erkundungswerte dist/height/pitch/fov/yaw werden davor gesichert und danach wiederhergestellt |
| `target` | Bodenpunkt auf der Achse eigene Kreatur → Gegner |
| `height` | Höhe des Blickpunkts über `target` (m) |
| `dist` | Abstand Auge ↔ Blickpunkt (im Hochformat automatisch größer) |
| `yaw` | Blickrichtung, Konvention wie 36: vorwärts = (−sin yaw, −cos yaw) |
| `pitch` | Höhenwinkel des Auges über dem Blickpunkt in rad (< 0 = Untersicht) |
| `fov` | vertikales FOV in Grad für 16:9 (Fallback in 42 vergrößert es für schmale Szenen) |
| `focus` | `'both'` · `'me'` · `'foe'` (Info, z. B. für Licht/Unschärfe) |
| `lookAt`, `eye` | fertig berechnet: `lookAt = target + (0,height,0)`, `eye = lookAt + (sin yaw·cos pitch, sin pitch, cos yaw·cos pitch)·dist` |
| `battleApplied` | **von L1 zu setzen**, sobald `render3DBattle` (10-mon3d) CAM selbst anwendet – dann schaltet sich der L2-Fallback ab |

**Fallback (bis L1 übernimmt):** `src/42-fullscreen.js` – `camBattleApply(cam)` setzt Position/Blick/FOV der Kampfkamera vor `sprTick` (Billboard-Sortierung) und im Render-Hook von `BT.r`; danach `battleHudPlace(cam, canvas)` für die KP-Leisten. Die eigene Kamerafahrt in `render3DBattle` (Sway/Lunge/Fokus) wird dabei überschrieben. Erkundung bleibt unberührt (36-Shim liest weiter `CAM.yaw/pitch`, solange `mode==='explore'`).

**Für einen echten Kampf in der Welt-Szene** (R8, Ausblick L1): dieselben CAM-Felder gelten dann in Weltkoordinaten (R3.scene); L2 braucht dazu nur `BT.me/BT.foe`-Ersatz (Positionen der beiden Kampf-Objekte) – `camPts()` in 35 ist die einzige Stelle.

## Dateien
`src/35-transitions.js` (neu: Kamera-Regie, CAM-Posen, KP-Projektion) · `src/42-fullscreen.js` (CAM-Fallback, sprTick-Hook) · `src/14-battle.js` (camBattleStart/End in startBattleNow/endBattle) · `src/20-battleui.js` (Rückzug, aria-Labels) · `src/15-ui.js` (HUD bei Bedarf, Minikarten-Knopf, 3D-Start, Optionen › Erweitert, Titel-Illustrationen) · `src/shell.html` (`#mmBtn`, `#hudP` als Knopf, `#viewBtn hidden`, Titel-Fußzeile) · `src/styles.css` (Block „LOOK L2“) · `test/look_ui_shots.mjs` (Screenshots) · `test/look_ui_cam.mjs` (Kamera-Prüfung).

## Prüfung
`node test/look_ui_cam.mjs` – Kamera-Ereignisse im Browser (9 Prüfungen): Start in 3D, `CAM.mode` battle/explore, Attackenwahl → `me`, Zurück → `both`, Treffer → `foe`, KP-Leisten platziert, nach `endBattle` keine Kampf-Klassen, keine Seitenfehler.

## Screenshots
`node build.mjs && node test/look_ui_shots.mjs [tag] [h|t|p…]` (optional `L2_ONLY=titel,welt,dialog,kampf,menu`) → `test/look_ui_<szene>_<größe>[_tag].png`; h = 860×400, t = 1180×820, p = 390×844 (Hochformat erlaubt). Vorher: `test/ui_fs_*.png`.
