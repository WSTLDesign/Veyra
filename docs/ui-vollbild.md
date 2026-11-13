# UI-Vollbild 16:9 (Agent UI-Vollbild, 09.11.2026)

Grundlage: AGENTS.md › LAYOUT-ENTSCHEIDUNG. Keine Handheld-Rahmen mehr – die Spielfläche ist der ganze Bildschirm, alles andere liegt als Overlay darüber.

## Layout-Raster (Querformat, Standard)
| Zone | Inhalt | Position |
|---|---|---|
| oben links | Glas-Panel Gebiet + Uhr/Wetter (`.hudP` mit `#hudMap`, `#hudClock`), darunter Missionszeile `#hq` | `--gx-l`, `--gy-t` |
| oben mittig | Gebietsbanner `#mapCard` (Display-Schrift + `--sig`-Linie, Slide/Fade), Toast darunter | zentriert, max. 40vw |
| oben rechts | Ansicht `#viewBtn`, Vollbild `#fsBtn`, runde Minikarte `#mmW` | `--gx-r` |
| unten links | Stick: dynamisch (`SET.ctrl='dyn'`, erscheint unter dem Daumen in der linken Hälfte, Geister-Ring zeigt die Stelle) · Steuerkreuz `#dpad` (`'kreuz'`) · fester Joystick `#stick` (`'stick'`) | |
| unten rechts | Daumenbogen um A: A (Interagieren), Fang (nur 3D-Stick), Rennen, Reiten, Chronik | `.in-cluster` (36) bzw. `#pad .ab` (15) |
| unten | Dialog als Glas-Band (`#dlg`, max. 900 px zentriert, Portrait links, Namens-Tab, Weiter-Chevron); Steuerung blendet währenddessen aus, Tippen ins Bild blättert weiter | |

Kampf (rundenbasiert): Szene vollflächig; KP-Panels oben links (Gegner) und unten links (eigene); `#bDock` unten rechts = Kampftext `#bLog` + `#bMenu` (Befehlskarten im Daumenbogen, Attacken 2×2 mit Element-Farbe + Symbol, Listen 2-spaltig). 3D-Kampf: Kamera-Bildausschnitt leicht nach links/oben verschoben (`setViewOffset`), damit die Kreaturen zwischen Panels und Dock stehen. 2D-Kampf: gemalte Bühne 240×150 unverzerrt (Höhe 86 %, leicht links), Himmel/Boden/Seiten werden fortgesetzt.

Chronik/Dex/Team/Box/Tasche/Optionen: Vollbild-Glas-Panel (Hülle „Glas“ = neuer Standard, die vier alten Hüllen bleiben wählbar), Navigation links (bei Höhe < 540 px als 2×4-App-Raster), Inhalt rechts, „Zuklappen“ oben rechts. Laden und Titel-Einstellungen als Glas-Panel.

## Modi & Breakpoints
- `body.lay-land`: Breite ≥ Höhe·1,05 (Standard). `body.lay-tab` zusätzlich ab 900×600 (Tablet).
- `body.lay-port`: Hochformat erlaubt (Einstellung) oder ohne Touch (Desktop-Fenster): Welt oben 60 %, Steuerung unten 40 %; Kampf: Szene 56 %, Dock darunter.
- `body.lay-rot`: Hochformat + Touch + nicht erlaubt → Overlay `#rotOv` „Bitte Gerät drehen“ (CSS-Dreh-Animation, reduced-motion statisch); `mode` 'world' → 'wait' gesichert und beim Drehen zurück; Knopf „Hochkant weiterspielen“ setzt `SET.portrait='allow'`.
- Größen: `--u: clamp(12px, 1vh + .6vw, 15px)` – Tablet bekommt keine größere UI, sondern mehr Welt. Touch-Ziele ≥ 48 px (Kopfknöpfe 40 px sichtbar + 4 px unsichtbarer Trefferrand).
- Kamera: Welt-FOV je Seitenverhältnis (breiter als 16:9 → halbe Zusatzbreite als mehr Welt, Rest leichter vertikaler Zuschnitt; < 1,2 → moderat größeres vertikales FOV, Exponent 0,3 – mehr wäre teurer für Software-Rendering); 3D-Kampf-FOV wächst auf Tablets/Hochformat, damit beide Kreaturen sichtbar bleiben.
- 2D-Welt: außerhalb kleiner Karten PALETTE-Umgebungsfarbe (Park/Holz/Höhle/Schnee, nachts abgedunkelt) statt Schwarz.

## Optionen (Chronik › Optionen)
- Bildschirm: Vollbild (`SET.fs`, beim ersten Tippen anfordern + „Jetzt Vollbild“), Hochformat erlauben (`SET.portrait` 'drehen'|'allow'), Tasten abblenden (`SET.hudDim` 'stark' 40 % | 'mittel' 65 % | 'aus', nach 4 s ohne Eingabe in der Welt).
- Steuerung: Stick / Steuerkreuz / Joystick (`SET.ctrl` 'dyn'|'kreuz'|'stick', Alias 'dpad' → 'kreuz'), Größe (`SET.stick`), Kamera-Empfindlichkeit (`SET.inSens` 50–150 %), Kamera umkehren (`SET.camInv`).
- Fullscreen-API mit `catch`, danach `screen.orientation.lock('landscape')` mit `catch`; iOS ohne API: einmaliger Hinweis „Zum Home-Bildschirm“ (`SET.iosHint`). Unter `navigator.webdriver` wird kein Vollbild angefordert.

## Dateien
`src/42-fullscreen.js` (neu: Layout-Modus, Drehhinweis/Pause, Vollbild, HUD-Abblenden, FOV-Hooks R3/BT, Kampf-Canvas-Abbildung, 2D-Letterbox) · `src/styles.css` (Block „VOLLBILD 16:9“ am Ende, alter Querformat-Block entfernt) · `src/shell.html` (HUD-Panel, `#bDock`, `#rotOv`, `#fsHint`) · `src/15-ui.js` (Uhr+Wetter, Glas-Hülle, Optionen, Vollbild-Knopf, Dialog-Tippen) · `src/36-input.js` (geprüft/vollendet: Daumenbogen, Geister-Stick, A-Puls bei NPC in Reichweite, Optionen nach 15 verlegt) · `src/07-settings.js` (Defaults angehängt).

## Offene Punkte
- 2D-Welt zeigt fest 11 Kacheln Höhe (`VH` ist Konstante in 03-engine.js) – auf Tablets daher größere Kacheln statt mehr Welt; Änderung bräuchte 03/08.
- Kampf-Effekte im 3D-Overlay (`#bcv`, 240×150-Koordinaten) werden auf breiten Bildschirmen leicht horizontal gedehnt (Partikel/Popups, keine Kreaturen).
- Titelbild (Kreaturen-Canvas, Hilfezeile) nur angepasst, nicht neu gestaltet (Key-Art-Aufgabe E4).
- Software-WebGL in der Testumgebung: Screenshots mit `SET.res='720'`; CSS-Übergänge laufen dort sehr langsam (Abblenden wirkt in Bildern teils „halb“).
