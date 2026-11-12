# Veyra – Ist-Analyse vor dem Redesign (Schritt 0)

Stand 2026-11-09, Build vor Token-Umstellung. Screenshots: `test/redesign/before_<zustand>_<p|l>.png` (p = 390×844, l = 860×400, Pixelratio 1, Fonts geblockt → Fallback-Schriften), erzeugt mit `node test/redesign/shots.mjs before`.
Kriterien R1–R11 siehe AGENTS.md („Senior-UI-Redesign“). Skala 1–10; „–“ = im Zustand nicht sichtbar, fließt nicht in den Schnitt ein.

R1 Figuren · R2 Farbdramaturgie/Signaturfarbe · R3 Licht-Sets · R4 Atmosphäre/Rim/Schatten · R5 Glanz/Spiegelung · R6 Wahrzeichen/Vertikalität · R7 Tore/Hologramm/Banner · R8 Kampf in der Welt · R9 Effekte · R10 Kamera · R11 Rhythmus Weite/Nähe

| Zustand | Fmt | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | R11 | Ø | Konkrete Mängel |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Titel | p | 4 | 4 | 3 | 3 | 3 | 2 | – | – | 3 | 3 | 4 | 3,2 | Dunkelblaue Fläche ohne Welt/Wahrzeichen, Legenden klein ganz oben; Logo Orange-Gold (≈ Glut-Farbe); Hilfezeile 9 px, gesperrt, Kontrast < 3:1; Buttons dunkel-auf-dunkel ohne Primär-Hierarchie |
| Titel | l | 4 | 4 | 3 | 3 | 3 | 2 | – | – | 3 | 3 | 4 | 3,2 | wie p; Komposition mittig gequetscht, keine Key-Art, keine Figur von hinten |
| Intro (Mentor) | p | 6 | 5 | 6 | 5 | 4 | – | – | – | 4 | 6 | 6 | 5,3 | Spot-Licht wirkt gut; Mentor-Augen hinter Brille = Punkte, keine Lidlinie/Glanz; Namens-Tab Türkis ≠ Markenfarbe; Dialogbox ohne Glas, Weiter-Hinweis kaum sichtbar |
| Intro (Mentor) | l | 6 | 5 | 6 | 5 | 4 | – | – | – | 4 | 6 | 6 | 5,3 | Dialog über Figur gelegt, Figur ohne Abstand nach unten; Letterbox fehlt im Quer |
| Charaktererstellung | p | 5 | 5 | 5 | 4 | 4 | – | – | – | – | 5 | 5 | 4,7 | Figur Chibi mit Punktaugen (R1), Kleidung ohne Signatur-Akzent; Sheet scrollt, Labels 11 px grau; Auswahlring orange ≈ Oberteil-Swatch Orange (Verwechslung) |
| Charaktererstellung | l | 5 | 5 | 5 | 4 | 4 | – | – | – | – | 5 | 5 | 4,7 | Sheet rechts abgeschnitten (Mütze/Mützenfarbe unterhalb), kein „Los“-Button sichtbar ohne Scrollen |
| Welt 3D Tag | p | 4 | 4 | 5 | 5 | 3 | 4 | 3 | – | – | 5 | 4 | 4,1 | **Spielfeld nur ≈ 200 px hoch, 60 % des Bildschirms leeres Grau mit Steuerkreuz**; HUD-Chips abgeschnitten („Morge…“, „0/4 Or…“); Gras/Häuser voll gesättigt → Kreaturen heben sich nicht ab; kein Sonnen-Glow, kein Distanznebel |
| Welt 3D Tag | l | 4 | 4 | 5 | 5 | 3 | 4 | 3 | – | – | 5 | 5 | 4,2 | Vollbild gut; Steuerkreuz 50 % weiß deckt Szene ab; NPCs Punktaugen; keine Wegweiser/Banner im Ort |
| Welt 3D Nacht | p | 4 | 3 | 2 | 4 | 3 | 4 | 3 | – | – | 5 | 4 | 3,6 | **Nacht kaum dunkler als Tag** (R3 verlangt fast schwarz + Neon); nur eine Laterne; Fenster nicht leuchtend in Signaturfarbe |
| Welt 3D Nacht | l | 4 | 3 | 3 | 4 | 4 | 4 | 3 | – | – | 5 | 5 | 3,9 | Fenster-Glühen sichtbar, aber Himmel dunkelblau statt schwarz; kein Neon-Akzent |
| Heilstation innen | p | 3 | 4 | 4 | 3 | 3 | 2 | – | – | – | 4 | 3 | 3,3 | Leerer beiger Raum, Theke füllt Bild, Pflegerin halb verdeckt; kein Rot-Akzent (R2), keine Heil-Maschine/Kapselregal; flaches Licht, keine Bodenspiegelung |
| Heilstation innen | l | 3 | 4 | 4 | 3 | 3 | 2 | – | – | – | 4 | 3 | 3,3 | wie p; Kamera zu nah an der Theke |
| Welt 2D | p | 3 | 4 | 4 | 3 | 2 | 3 | 5 | – | – | 4 | 4 | 3,6 | Spielfeld klein (s. o.); Gebietsbanner klein links, ohne Display-Wirkung; Gras-Grün dominiert (keine Entsättigung) |
| Welt 2D | l | 3 | 4 | 4 | 3 | 2 | 3 | 5 | – | – | 5 | 4 | 3,7 | Steuerkreuz verdeckt Weg links; Banner + Missionskarte stapeln sich oben links |
| Dialog mit Portrait | p | 4 | 5 | – | 4 | 3 | – | – | – | – | 4 | 4 | 4,0 | Box weiß ohne Namens-Tab/Portrait im Bild (NPC-Name fehlt), Weiter-Chevron winzig orange; Box überdeckt Spielfeld komplett im Hochformat |
| Dialog mit Portrait | l | 4 | 5 | – | 4 | 3 | – | – | – | – | 4 | 4 | 4,0 | Box mittig unten, kollidiert mit Steuerkreuz und Chronik-Knopf |
| Gebietsbanner | p | – | 4 | – | – | – | – | 4 | – | 3 | – | 5 | 4,0 | Banner wenige px groß, Region in 8-px-Versalien; Tipp-Toast überlagert gleichzeitig; keine Signaturlinie, kein Slide |
| Gebietsbanner | l | – | 4 | – | – | – | – | 4 | – | 3 | – | 5 | 4,0 | wie p; konkurriert mit Missionskarte |
| Chronik Karte | p | – | 5 | – | 4 | 3 | – | – | – | – | – | 5 | 4,3 | Holzgehäuse schwer/braun statt Glas-Gerät; Karte ohne Legende/Zonenfarben; Aktiv-Tab dunkel statt Signatur |
| Chronik Karte | l | – | 5 | – | 4 | 3 | – | – | – | – | – | 4 | 4,0 | Karte nur ≈ 30 % der Breite, viel leerer Rahmen |
| Chronik Team | p | 5 | 5 | – | 4 | 3 | – | – | – | – | – | 5 | 4,4 | Kreaturen in Ringen sehr klein (≈ 40 px); KP-Text ohne Balken; „SPITZE“-Label 8 px |
| Chronik Team | l | 5 | 5 | – | 4 | 3 | – | – | – | – | – | 5 | 4,4 | wie p; Kreaturenbox-Leerzustand unten abgeschnitten |
| Chronik Dex | p | 4 | 4 | – | 3 | 3 | – | – | – | – | – | 5 | 3,8 | Ungesehene Arten = schwarze Silhouetten auf Weiß, wirkt düster; Nummern-Labels 9 px; Fortschrittsring orange |
| Chronik Dex | l | 4 | 4 | – | 3 | 3 | – | – | – | – | – | 5 | 3,8 | 6 Spalten, Kreaturen winzig |
| Chronik Optionen | p | – | 5 | – | – | – | – | – | – | – | – | 5 | 5,0 | Segment-Schalter gut lesbar; Aktiv = Schwarz, Toggle = Türkis, Primär = Orange → drei Akzentfarben |
| Chronik Optionen | l | – | 5 | – | – | – | – | – | – | – | – | 5 | 5,0 | wie p |
| Kampf Befehle | p | 4 | 4 | 4 | 4 | 3 | – | – | 3 | 3 | 4 | 4 | 3,7 | **Eigene Arena-Karte statt Welt** (R8); KP-Boxen als weiße Karten statt diegetisch; „Kampf“-Karte Orange = Glut-Farbe; Resonanz-Knopf grau & winzig; untere 40 % leer |
| Kampf Befehle | l | 4 | 4 | 4 | 4 | 3 | – | – | 3 | 3 | 4 | 4 | 3,7 | Szene links klein, Gegner ≈ 30 px; Befehle gut im Daumenbogen |
| Kampf Attacken | p | – | 5 | – | – | 3 | – | – | 3 | – | 4 | 4 | 3,8 | Element-Farbe nur als Randstreifen + Icon, Effektivität „?“ kryptisch für Kinder; Kern-Grau kaum von deaktiviert unterscheidbar |
| Kampf Attacken | l | – | 5 | – | – | 3 | – | – | 3 | – | 4 | 4 | 3,8 | wie p |
| Fang-Karte | p | 6 | 5 | – | 4 | 4 | – | – | – | 4 | 5 | 6 | 5,0 | Karte klar; Kreatur nur 25 % der Kartenfläche, Hintergrund flach grau; „Neu im Dex“-Band Orange; kein Glanz/Lichtkern-Bezug zur Kapsel |
| Fang-Karte | l | 6 | 5 | – | 4 | 4 | – | – | – | 4 | 5 | 6 | 5,0 | Karte passt knapp, Hinweis „Tippen“ unten am Rand |

**Durchschnitt je Kriterium (über alle bewerteten Bilder):** R1 4,4 · R2 4,5 · R3 4,3 · R4 3,8 · R5 3,2 · R6 3,0 · R7 3,9 · R8 3,0 · R9 3,4 · R10 4,6 · R11 4,7.

## Top-10-Mängel (priorisiert)
1. **Hochformat-Layout Welt:** Spielfeld ≈ 24 % der Höhe, darunter leeres Grau + Steuerkreuz. Ziel: Welt vollflächig, Steuerung als schwebende Glas-Elemente unten (wie Querformat). → Agent C (+E).
2. **Keine Signaturfarbe; Markenorange = Glut-Element.** Kampf-Knopf, Fortschritt, Auswahlringe, Logo sehen aus wie Feuer-Typ. Dazu drei konkurrierende Akzente (Orange, Türkis, Schwarz). → Tokens (erledigt in Schritt 0), C räumt Restfarben auf.
3. **Kampf in eigener Arena-Karte** statt in der Welt, KP-Boxen nicht diegetisch. → D (Szene/Kamera) + C (HUD).
4. **Nacht nicht dunkel, kein Neon;** Tag ohne Sonnenscheibe/Glow/Distanznebel → `PALETTE.light.night/explore`. → A.
5. **Umgebung voll gesättigt** (Gras, Dächer, 2D-Kacheln) → Kreaturen/Figuren gehen unter. Umgebungsfarben auf `--env-*`. → A.
6. **Figuren mit Punktaugen, Chibi-Proportionen,** keine Lidlinie/Glanz, Kleidung ohne Signatur-Akzent. → B.
7. **HUD-Chips abgeschnitten** im Hochformat („Morge…“, „0/4 Or…“), zu viele Chips oben. → C (Gebiet + Uhr/Wetter links, runde Minikarte rechts, Rest in Chronik).
8. **Gebietsbanner zu klein und überlagert** (Tipp-Toast, Missionskarte); kein Display-Schriftzug, keine Signaturlinie. → C (Banner), D (Timing).
9. **Heilstation innen leer und flach** (kein Rot-Akzent, keine Maschine, kein Glanzboden), Kamera zu nah. → A (Innenraum-Look), D (Kamera innen).
10. **Kleine Typo/kindgerechte Lesbarkeit:** viele Labels 8–10 px Versal-gesperrt mit Grau < 4,5:1 (Titel-Fußzeile, Dex-Nummern, Team-„SPITZE“, Banner-Region); „?“ als Effektivität. → C (Typo-Skala `--fs-*`, min. 12 px, Kontrast).

Weitere: Titel ohne Key-Art (D); Chronik-Hüllen Holz/Leder wirken schwer – Standard sollte Glas-Gerät sein (C); Dex-Silhouetten schwarz → `--env-slate`-Silhouetten mit Fragezeichen (C); Steuerkreuz 50 % weiß deckt Szene (E: dynamischer Stick, Glas).
