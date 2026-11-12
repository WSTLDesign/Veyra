# Veyra – Performance-Basismessung (Vorher-Stand)

Agent B3 „QA Loop B“ · 10.11.2026 · Stand: nach Loop B1/B2 und B3-Fixes (Build 0.9.0). Dient als **Vorher-Wert** für das Modul „Look-Modernisierung + Performance“. Messskript: `node test/qa_b_perf.mjs` (Ergebnis `test/qa_b_perf.json`); Messfenster 4 s je Zeile, `SET.fps = 0` (unbegrenzt – der Auslieferungs-Cap von 30 würde die Werte nur nach oben begrenzen).

## 1. Methode und Grenzen

- Headless-Chromium mit **SwiftShader** (Software-WebGL), `deviceScaleFactor 1`. Es gibt keine GPU: **absolute FPS sind nicht auf Handys übertragbar** (die Software-Rasterung braucht ≈ 0,5 s Grundzeit je Frame plus ≈ 0,6 s je Megapixel, siehe 3.). Belastbar sind (a) **Draw-Calls, Dreiecke, Geometrien/Texturen** (`renderer.info`, geräteunabhängig), (b) **JS-Zeit je Frame auf dem Hauptthread** (Umhüllung von `loop` mit `performance.now()`, inkl. `render()`-Aufrufzeit; die eigentliche GPU-Arbeit läuft im GPU-Prozess und fehlt hier), (c) **Canvas-Pixel** je Konfiguration.
- CPU-Drosselung 4× per CDP (`Emulation.setCPUThrottlingRate`) als Näherung an ein schwächeres Handy – sie wirkt nur auf JS, nicht auf die Software-GL.
- Szenen: Route 1, Morgenau, Kupferhain (3. Person, `setView('third')`; Standardansicht des Spiels ist 2D, `G.view||'2d'` – die 3D-Zahlen gelten also, sobald die Ansicht gewechselt wird) und ein Wildkampf in 3D (Flausch Stufe 10, Rundenkampf). Spieler mit 2 Kreaturen im Team, keine Roamer (`ROAM.want=0`) – **Roamer/Dorfbewohner kommen im Spiel zur Last hinzu** (Smoke-Grenze: route1 ≤ 170 Draw-Calls mit vollen Roamern).
- Konfigurationen: **Standard** = Auslieferungswerte (`SET.res '1440'`, `fps 30`, `shadows 1`, Sicht „mittel“); **native** = `SET.res 'native'` (Renderhöhe = CSS-Höhe × DPR, hier DPR 1); **niedrig** = Voreinstellung „niedrig“ (`res 720`, Schatten/Licht/Partikel aus, Sicht „nah“).
- Wichtig: `SET.res` ist die **Renderhöhe in Pixeln, unabhängig von Gerät und CSS-Größe** (`setPixelRatio(min(4, resH()/clientHeight))`, `09-three3d.js:178`, `10-mon3d.js:618`). Bei 860×400 CSS heißt „1440“ also Pixelverhältnis 3,6 und **4,46 Megapixel** – mehr als die physischen Pixel eines typischen Handys (≈ 2,6 Mpx bei 2400×1080).

## 2. Messwerte

### A. 860×400 (Handy quer), CPU 1×

| Szene | Konfiguration | Canvas | Mpx | Draw-Calls | Dreiecke | Geom./Tex. | JS/Frame ms (Mittel / p95) | davon `render()` ms | SwiftShader: FPS (Frame ms) | n Frames | Heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Route 1 (3D-Welt) | Standard (res 1440, Schatten) | 3096×1440 | 4,46 | 30 | 356.504 | 32/8 | 2,0 / 2,0 | 0,9 | < 0,3 (nicht messbar) | 1 | 24 |
| Route 1 (3D-Welt) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 30 | 356.504 | 32/8 | 3,5 / 4,9 | 2,7 | 1,44 (693) | 6 | 26 |
| Route 1 (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 26 | 356.424 | 32/8 | 2,0 / 3,8 | 1,3 | 0,87 (1.150) | 4 | 18 |
| Morgenau (3D-Welt) | Standard (res 1440, Schatten) | 3096×1440 | 4,46 | 43 | 309.312 | 43/9 | 1,6 / 1,6 | 1,0 | < 0,3 (nicht messbar) | 1 | 18 |
| Morgenau (3D-Welt) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 43 | 309.312 | 43/9 | 2,2 / 3,6 | 1,5 | 1,48 (677) | 6 | 19 |
| Morgenau (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 39 | 309.232 | 43/9 | 1,9 / 3,7 | 1,5 | 0,85 (1.178) | 4 | 18 |
| Kupferhain (3D-Welt) | Standard (res 1440, Schatten) | 3096×1440 | 4,46 | 45 | 314.148 | 56/10 | 2,5 / 2,7 | 1,5 | 0,29 (3.500) | 2 | 22 |
| Kupferhain (3D-Welt) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 40 | 310.652 | 56/10 | 2,7 / 4,2 | 2,0 | 1,67 (600) | 7 | 23 |
| Kupferhain (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 40 | 312.488 | 56/10 | 2,0 / 2,7 | 0,9 | 1,04 (958) | 5 | 21 |
| Kampf 3D (Wildkampf) | Standard (res 1440, Schatten) | 2580×1200 | 3,10 | 15 | 37.188 | 14/5 | 2,9 / 2,9 | 1,0 | < 0,3 (nicht messbar) | 1 | 21 |
| Kampf 3D (Wildkampf) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 15 | 37.188 | 14/5 | 4,4 / 6,5 | 1,6 | 1,30 (767) | 6 | 22 |
| Kampf 3D (Wildkampf) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 15 | 37.188 | 14/5 | 4,8 / 6,9 | 2,0 | 0,74 (1.350) | 3 | 22 |

### B. 860×400, CPU 4× gedrosselt (Näherung an ein schwächeres Handy)

| Szene | Konfiguration | Canvas | Mpx | Draw-Calls | Dreiecke | Geom./Tex. | JS/Frame ms (Mittel / p95) | davon `render()` ms | SwiftShader: FPS (Frame ms) | n Frames | Heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Route 1 (3D-Welt) | Standard (res 1440, Schatten) | 3096×1440 | 4,46 | 30 | 356.504 | 31/7 | 14,8 / 14,8 | 7,3 | < 0,3 (nicht messbar) | 1 | 25 |
| Route 1 (3D-Welt) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 30 | 356.504 | 31/7 | 10,8 / 14,8 | 7,9 | 0,86 (1.161) | 4 | 27 |
| Route 1 (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 26 | 356.424 | 31/7 | 7,7 / 12,1 | 4,2 | 0,54 (1.867) | 3 | 19 |
| Morgenau (3D-Welt) | Standard (res 1440, Schatten) | 3096×1440 | 4,46 | 43 | 309.312 | 42/8 | 6,5 / 6,5 | 6,1 | < 0,3 (nicht messbar) | 1 | 19 |
| Morgenau (3D-Welt) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 43 | 309.312 | 42/8 | 8,0 / 9,3 | 5,6 | 0,89 (1.122) | 4 | 20 |
| Morgenau (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 39 | 309.232 | 42/8 | 11,9 / 19,8 | 8,9 | 0,57 (1.767) | 3 | 19 |
| Kupferhain (3D-Welt) | Standard (res 1440, Schatten) | 3096×1440 | 4,46 | 41 | 310.764 | 55/9 | 9,4 / 9,4 | 7,0 | < 0,3 (nicht messbar) | 1 | 23 |
| Kupferhain (3D-Welt) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 41 | 310.764 | 55/9 | 7,1 / 13,4 | 3,6 | 1,06 (946) | 5 | 24 |
| Kupferhain (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 37 | 310.684 | 55/9 | 6,5 / 8,6 | 4,2 | 0,70 (1.425) | 3 | 25 |
| Kampf 3D (Wildkampf) | Standard (res 1440, Schatten) | 2580×1200 | 3,10 | 15 | 37.188 | 14/5 | 12,6 / 12,6 | 3,6 | < 0,3 (nicht messbar) | 1 | 23 |
| Kampf 3D (Wildkampf) | native (Höhe = CSS-Höhe) | 860×400 | 0,34 | 15 | 37.188 | 14/5 | 10,7 / 16,9 | 2,7 | 0,75 (1.328) | 4 | 24 |
| Kampf 3D (Wildkampf) | niedrig (720, ohne Schatten/Licht/Partikel) | 1548×720 | 1,11 | 15 | 37.188 | 14/5 | 11,4 / 13,6 | 2,3 | 0,45 (2.233) | 2 | 23 |

### C. 1920×1080 (Desktop), CPU 1×

| Szene | Konfiguration | Canvas | Mpx | Draw-Calls | Dreiecke | Geom./Tex. | JS/Frame ms (Mittel / p95) | davon `render()` ms | SwiftShader: FPS (Frame ms) | n Frames | Heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Route 1 (3D-Welt) | Standard (res 1440, Schatten) | 2560×1440 | 3,69 | 29 | 356.392 | 31/7 | 2,5 / 2,7 | 1,4 | 0,27 (3.700) | 2 | 30 |
| Route 1 (3D-Welt) | native (Höhe = CSS-Höhe) | 1920×1080 | 2,07 | 29 | 356.392 | 32/8 | 5,3 / 6,4 | 3,9 | 0,46 (2.183) | 2 | 31 |
| Route 1 (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1280×720 | 0,92 | 25 | 356.312 | 32/8 | 1,7 / 2,4 | 0,9 | 0,95 (1.050) | 4 | 24 |
| Morgenau (3D-Welt) | Standard (res 1440, Schatten) | 2560×1440 | 3,69 | 43 | 309.312 | 43/9 | 4,0 / 4,6 | 3,0 | 0,26 (3.833) | 2 | 25 |
| Morgenau (3D-Welt) | native (Höhe = CSS-Höhe) | 1920×1080 | 2,07 | 43 | 309.312 | 43/9 | 2,2 / 2,8 | 1,8 | 0,38 (2.600) | 2 | 25 |
| Morgenau (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1280×720 | 0,92 | 39 | 309.232 | 43/9 | 1,8 / 2,3 | 1,1 | 0,96 (1.044) | 4 | 26 |
| Kupferhain (3D-Welt) | Standard (res 1440, Schatten) | 2560×1440 | 3,69 | 38 | 308.960 | 56/10 | 4,9 / 5,1 | 2,5 | 0,33 (3.033) | 2 | 22 |
| Kupferhain (3D-Welt) | native (Höhe = CSS-Höhe) | 1920×1080 | 2,07 | 41 | 310.764 | 56/10 | 2,4 / 3,3 | 1,9 | 0,51 (1.958) | 3 | 22 |
| Kupferhain (3D-Welt) | niedrig (720, ohne Schatten/Licht/Partikel) | 1280×720 | 0,92 | 37 | 310.684 | 56/10 | 2,2 / 3,8 | 1,3 | 1,19 (838) | 5 | 21 |
| Kampf 3D (Wildkampf) | Standard (res 1440, Schatten) | 2560×1440 | 3,69 | 15 | 37.188 | 14/5 | 2,8 / 2,8 | 1,1 | < 0,3 (nicht messbar) | 1 | 22 |
| Kampf 3D (Wildkampf) | native (Höhe = CSS-Höhe) | 1920×1080 | 2,07 | 15 | 37.188 | 14/5 | 3,4 / 4,3 | 1,4 | 0,36 (2.767) | 2 | 22 |
| Kampf 3D (Wildkampf) | niedrig (720, ohne Schatten/Licht/Partikel) | 1280×720 | 0,92 | 15 | 37.188 | 14/5 | 6,1 / 9,8 | 2,4 | 0,81 (1.239) | 4 | 22 |

## 3. Auswertung

**Zusammenfassung (Vorher-Stand):**

| Größe | Welt 3D | Kampf 3D |
|---|---|---|
| Draw-Calls | 25–45 (ohne Roamer) | 15 |
| Dreiecke je Frame | 309 000 – 357 000 | 37 000 |
| Geometrien / Texturen | 31–56 / 7–10 | 14 / 5 |
| JS-Zeit je Frame, CPU 1× | 1,6 – 5,3 ms (p95 bis 6,4) | 2,8 – 6,1 ms (p95 bis 9,8) |
| JS-Zeit je Frame, CPU 4× | 6,5 – 14,8 ms (p95 bis 19,8) | 10,7 – 12,6 ms (p95 bis 16,9) |
| `render()`-Aufruf (CPU-Seite) | 0,9 – 3,9 ms (4×: 3,6 – 9) | 1,0 – 2,4 ms (4×: 2,3 – 3,6) |
| JS-Heap | 18 – 31 MB | 21 – 24 MB |

1. **JS-Zeit ist unkritisch**: unter 6,5 ms bei 1×, bei 4× gedrosselter CPU 6–15 ms (p95 bis ≈ 20 ms) – innerhalb des 33-ms-Budgets für 30 FPS, aber an der 16-ms-Grenze für 60 FPS. Der Kampf kostet mit 3D-Bühne + 2D-Overlays mehr JS-Zeit als die Welt (4× CPU: 10,7–12,6 ms).
2. **Draw-Calls sind niedrig, Dreiecke hoch**: 25–45 Calls, aber **309–357 k Dreiecke je Frame** in der Welt (≈ 8–10 × der Kampf). Das ist das große Hebelthema für schwache Handys (Geometrie zusammenfassen/LOD, Dreiecke je Kachel prüfen). Die Dreiecksanzahl ändert sich durch die Qualitätsstufe fast nicht (niedrig: nur 4 Calls weniger, 356 424 statt 356 504 Dreiecke), d. h. „niedrig“ spart in erster Linie Pixel und Schatten, nicht Geometrie.
3. **Renderhöhe**: Standard rendert bei 860×400 mit **4,46 Mpx**, bei 1920×1080 mit 3,69 Mpx (2560×1440) – beides mehr Pixel als das Zielgerät darstellt. Eine Kappung auf Gerätepixel (`min(res, clientHeight × devicePixelRatio)`) in `resH()` (`src/07-settings.js:8`) senkt die Last ohne sichtbaren Verlust (auf diesem Rechner 4,46 → 0,34 Mpx bei DPR 1; auf einem DPR-2,6-Handy 4,46 → ≈ 2,3 Mpx).
4. **Grobes SwiftShader-Modell** (Anpassung an route1 native und niedrig): Frame-ms ≈ 500 + 600 × Mpx. Es trifft die gemessenen Werte (Kupferhain Standard 3,5 s gegen 3,2 s gerechnet; 1920×1080 native 2,2 s gegen 1,7 s). Nützlich nur, um nach Änderungen Ursache und Wirkung zu trennen: sinkt die Grundzeit (Dreiecke/Schatten) oder die Pixelzeit?
5. **Vergleich nach dem Umbau**: gleiche Szenen, gleiches Skript, gleiche Zeilen. Maßstab = Draw-Calls, Dreiecke, JS-ms (4×) und die Frame-ms-Anpassung; echte FPS bitte zusätzlich auf einem Handy messen (Remote-Debugging, Chrome-Task-Manager).

**Vorschlag für Zielwerte des Moduls:** Welt-Dreiecke ≤ 200 k, Draw-Calls ≤ 60 (ohne Roamer) bzw. ≤ 170 (volle Roamer, wie Smoke), JS/Frame bei 4× CPU ≤ 10 ms im Mittel, Standard-Renderhöhe auf Gerätepixel gekappt.

## 4. Auslieferungs-Einstellungen (zum Nachschlagen)
`SET`-Standard: `res '1440'`, `fps 30`, `shadows 1`, `light 1`, `particles 1`, `dist 'mittel'`; Voreinstellungen `niedrig` (720/30/aus), `mittel` (1080/30, ohne Schatten), `hoch` (1080/60, Schatten), `ultra` (1440/60, Sicht weit) in `src/07-settings.js:3–4`. Ansicht standardmäßig 2D.

## 5. Reproduktion
```
node build.mjs && node test/qa_b_perf.mjs          # ≈ 10 min, schreibt test/qa_b_perf.json
node test/qa_b_perf.mjs 8000                       # längeres Messfenster (ms)
```
