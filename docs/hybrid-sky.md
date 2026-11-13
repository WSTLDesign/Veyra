# Hybrid H1 – Offline-Himmel, Horizont-Kulissen, Kampfhintergründe

Agent H1 (Opus hoch) · 10.11.2026 · Modul HYBRID-LOOK (AGENTS.md). Ziel-Optik = Intro-Video (`public/art_ref/intro_stills/f_*.png`): graublauer Zenit, warmer cremefarbener Horizont, weiche Haufenwolken mit Lichtkante, Wolkenmeer, Sonnen-Glow und Volumenlicht, atmosphärische Perspektive. Alles eigene Entwürfe; Standbilder dienten nur als Farbquelle (Zeilenmittel der Stills → Grundfarben in `tools/render_assets.mjs`, `BASE`).

## 1. Pipeline (offline)

```
node tools/render_assets.mjs [sky|horizon|battle|all] [--region r1,r2] [--time tag,abend,nacht] [--ss 2] [--preview]
```

- Headless Chromium + SwiftShader öffnet `tools/assets/scene.html` (three.js r128 aus `public/three.min.js`, Module `tools/assets/sky_glsl.mjs`, `tools/assets/landmarks.mjs`) über einen lokalen Server (kein file:// → kein „verunreinigtes“ WebGL).
- **Skybox:** Vollbild-Shader in Equirect-Koordinaten (Konvention three.js/PMREM: `u = atan(z,x)/2π + .5`, `v = asin(y)/π + .5`, Azimut a° → `(cos a, 0, sin a)`), streifenweise (48 Zeilen) in ein Render-Target mit **2× Supersampling** (4096×2048), Lanczos auf 2048×1024. Bausteine: dreistufiger Verlauf, Mie-artige Streuung zur Sonne, Bausch-Wolkenfeld (Zellen mit runden, weich vereinigten Bäuschen, Lichtkante = Ableitung zur Sonne, Silberrand), Kumulus-Türme am Horizont (Hüllkurve aus 14 Hügeln, Bausch-Rand, nahtlos modulo Zellen), Zirren, Wolkenmeer unter dem Horizont (Billow + Bäusche, angestrahlte Kuppen), Dunstband, Sonnenscheibe + Korona, Volumenlicht (14 Schritte Wolken-Abschattung zur Sonne + Winkel-Streifen), Sterne (2 Lagen + Milchstraße), Mond mit Kratern/Phase, Polarlicht (Frosttundra, schwach im Kristallgebirge), Regions-Glut (Vulkan). Weiche Schulter + sRGB + Dither gegen Stufen.
- **Horizont-Kulisse:** 3D-Szene je Region (`landmarks.mjs`: Berge mit Grat-Rauschen und Schneegrenze, Hügel, Baum-Instanzen, Wahrzeichen, Dunstbänke als zum Ursprung gedrehte weiche Billboards, lineare Distanz-Haze 0–4200 m), CubeCamera 2048² (sRGB, ACES), Zylinder-Abwicklung 4096×1024 → 2048×512, **transparent** (entmultipliziert, Unterkante weich). Neutrales Licht; Tönung nach Tageszeit erst zur Laufzeit.
- **Kampfhintergrund:** dieselbe 3D-Szene + Himmels-Kuppel mit Skybox-Shader + Bodenebene (Regionsfarben) aus Kamera h 1,7 m, Blick Azimut −90° (Wahrzeichen), Neigung +3,5°, FOV 38° vertikal; 2560×1440 → 1280×720; Tiefenwirkung: Vordergrund weichgezeichnet (PIL).
- Python/PIL: Skalieren, WebP (Skybox/Kampf q75, Kulisse q80; automatisch −4 bis zur Größengrenze), `_lo`-Variante, Mittelfarben der Skybox (flächengewichtet: oben ≥ 25°, Zenit ≥ 60°, Horizont 0–8°, unten −25–0°) → `public/art/sky_meta.json`.
- `--preview` rendert halbe Größe ohne SS nach `$VEYRA_PREVIEW` (Standard Systemtemp `veyra_preview`), schreibt nichts nach `public/`.
- Renderzeit (2 CPU-Kerne, SwiftShader): Skybox 20–75 s, Kulisse 3–4 s, Kampfbild 15–95 s; alles ≈ 30–45 min.

Regionen × Tageszeit: `lichtlande, smaragdwald, flutkueste, glutlande, kristallgebirge, frosttundra, himmelsweiten, schattenmoor` × `tag, abend, nacht`. Parameter: `BASE[time]` + `REGP[region][time]` in `tools/render_assets.mjs` (Farben sRGB, Sonne `sunAz/sunEl`, Mond `moonAz/moonEl/moonPhase` 0 = voll … 1 = Sichel, Wolken `cov/cumAmt/cumH/cirrus`, Wolkenmeer `seaAmt/seaCov/seaY`, `rays`, `stars`, `aurora`, `accAz/accCol/accI`).

## 2. Dateien, Keys, Größen

Keys = Dateiname ohne Endung = `window.ART_SRC[key]` (App: `art/<key>.webp`, Artifact: data-URI).

| Key | Größe | _lo | Inhalt |
|---|---|---|---|
| `sky_<region>_<zeit>` | 2048×1024 | 1024×512 | Equirect-Skybox (24 Stück) |
| `horizon_<region>` | 2048×512, RGBA | 1024×256 | 360°-Kulisse, vertikal `tan(Höhe)` von −0,05 bis 0,45, Wahrzeichen bei Azimut −90° (8 Stück) |
| `bg_battle_<region>_<zeit>` | 1280×720 | 640×360 | Kampf-Panorama, Horizontlinie bei `horizonY` (24 Stück) |
| `sky_meta.json` | – | – | Sonne/Mond (Azimut, Höhe, Farbe, Stärke, Phase), Dunstfarbe, Mittelfarben je Skybox; Kamera/Horizont/Sonne im Bild je Kampfbild; tan-Bereich je Kulisse → `window.SKY_META` (build.mjs) |

Größen-Tabelle mit Messwerten: Abschnitt 6.

**Artifact:** build.mjs bettet nur die `_lo`-Varianten ein (`skyLoOnly`), die App alle. Die Laufzeit nimmt automatisch `_lo`, wenn die volle Datei fehlt (und auf Stufe `low` immer).

## 3. Laufzeit (src/44-sky.js, Einbau in 09-three3d.js)

- **Skybox:** zwei Kuppeln (Kugel r 70, `gl_Position.xyww` = immer ganz hinten, jede Geometrie verdeckt sie), Kuppel A deckend, B blendet nach Plan über (Opacity). Jede Kuppel dreht ihr Bild so, dass die Bild-Sonne (nachts der Mond) im Azimut der Spiel-Sonne steht (09: `ang = π(h−6)/12`) – Wolken/Sonne wandern langsam mit dem Tag. Der prozedurale Himmel (09) bleibt Fallback: sichtbar, solange kein Bild geladen ist (oder nicht geladen werden kann: fehlende Datei, file://-Verunreinigung), danach 0,8 s Einblendung.
- **Plan** (`SKY_PLAN`): 0–4:45 nacht · 4:45–5:45 nacht→abend · 5:45–6:45 abend (Morgen, nach Osten gedreht) · 6:45–8:00 abend→tag · 8:00–16:45 tag · 16:45–18:00 tag→abend · 18:00–19:30 abend · 19:30–20:45 abend→nacht · danach nacht.
- **Licht aus dem Bild:** Hemisphäre oben/unten aus den Mittelfarben (Toon-Materialien), Sonnen-/Mondfarbe und -stärke, **Schattenrichtung = Bild-Sonne** (gedreht, A/B gemischt; `SKY3.sd`, 09 nutzt sie für Schattenkamera und Boden-Relief), Nebel/Hintergrund = Horizont-Mittelfarbe (atmosphärische Perspektive passt zum Bild), Wetter graut Himmel und Licht weiter ab, Gewitter-Blitz. Mit aktivem `setLightSet` (Kampf/Spezial) nur 30 % Einfluss. **PMREM** (`PMREMGenerator.fromEquirectangular`) des dominanten Bildes → `scene.environment` für Standard-Materialien (nur mid/high, nur bei Bildwechsel). Die Spiegel-Cubemap von 09 (`w3Env`, Wasser/Fenster) zeigt die Skybox statt des prozeduralen Himmels (gedrosselt nachgezogen).
- **Horizont-Kulisse:** Zylinder um die Kamera (xyww, hinter aller Geometrie), Abbildung `tan(Höhe)` wie im Render, Tönung Tag neutral / Abend warm / Nacht dunkelblau + Nebelanteil 20–42 % (+ Unterkante in Nebelfarbe). Drehung je Karte (`SKY_MAPREG[id][1]` Grad oder `MAPS[id].skyYaw`). Die prozeduralen Fernberge von 09 (Material `userData.mtn`) werden ausgeblendet, solange die Kulisse sichtbar ist.
- **Wolkenmeer/Dunstteppich:** eine Ebene mit driftender Weltkoordinaten-Wolkentextur (09 `w3texCloud`), beleuchtet aus Sonnenrichtung und Himmelsfarben; normale Karten: Rahmen-Geometrie außerhalb der Karte (y 0,62, Strand 0,9, ab 1,5 Felder außerhalb eingeblendet, ab 70 m ausgeblendet); schwebende Karten (`MAPS[id].float`, Thema `sky/cloud/float` oder Region Himmelsweiten): volle Ebene bei y −7. Auf Stufe `low` nur bei schwebenden Karten.
- **Sonnenstrahlen:** 12 lange additive Fächer-Quads in der Bildschirm-Ebene um die Sonne (ein Mesh, `setDrawRange`), high 12 / mid 7 / low 0, nur Sonne über dem Horizont, abends stärker.
- **Region:** `MAPS[id].region` → `SKY_MAPREG` (bestehende Karten) → Thema (`SKY_THEMEREG`) → `lichtlande`.
- **Speicher:** Textur-Cache nur für aktuelles A/B, das nächste Bild im Plan (≤ 1 Spielstunde vorher) und die Kulisse; alles andere nach 3 s freigegeben. Keine Mipmaps (8 MB je 2048er-Skybox, 2 MB je _lo). Stufe `low` → `_lo` (1024×512), keine PMREM, keine Strahlen, kein Dunstteppich.
- **Draw-Calls:** +Kuppel A, (+Kuppel B nur während Überblendung), +Kulisse, +Wolkenmeer, +Strahlen; prozeduraler Himmel und Fernberge entfallen → gemessen netto 0 bis +2 (Abschnitt 6, Prüfung in `test/unit_sky.mjs`: ≤ 6).

Hooks in 09 (nur Himmel/Licht/Horizont): `skyAttach(scene,map)` nach dem Szenenaufbau, `skyFrame(scene,O,ctx)` direkt nach dem Anwenden des Lichts, Schatten-/Relief-Richtung `SKY3.sd` wenn `SKY3.sdOn`, `R3.dome.visible … && !skyActive()`, `skyCam(rc)` vor `render()`.

## 4. Schnittstelle für H2 (Kampf, 10-mon3d/14-battle)

| Funktion | Rückgabe |
|---|---|
| `skyRegion(map\|id)` | Regions-Key (Fallback `'lichtlande'`) |
| `skyTime(h?)` | `'tag'\|'abend'\|'nacht'` (dominantes Bild zur Stunde, Standard `G.time/60`); `skyBlend(h)` → `{a,b,k}` |
| `skyFor(region,time)` (Objekt gecacht – nur lesen) | `{key, region, time, src, lo, w, h, sun{az,el,dir[3],col,i}, moon{…,phase}\|null, haze, stats{top,zenith,hor,below}, ok}` |
| `envFor(region,time)` | `{region, time, night, sunDir[3] (Bildraum), sunAz, sunEl, sunCol, sunI, hemiTop, hemiBot, hemiI, fog, horizon, top, zenith, haze, exposure}` – Farben `#rrggbb` |
| `battleBgFor(region,time)` | `{key, src, lo, w:1280, h:720, horizonY (≈ 0,589), fov:38, sunScreen[x,y] (Bildanteile; Tag liegt die Sonne außerhalb des Bildes, Abend ≈ [0,80; 0,41], Nacht Mond ≈ [0,18; 0,18]), cam{fov,h,az,pitch}, env:envFor(), ok}` |
| `horizonFor(region)` | `{key, src, lo, tan[2], haze, ok}` |
| `skyTexture(key, pin?)` | `Promise<THREE.Texture\|null>` aus dem gemeinsamen Cache (pin schützt vor Freigabe), `skyTextureRelease(key)` |
| `skyActive()`, `SKY3` | Skybox in der Welt sichtbar / Zustand (Region, Überblendung, `sd` Sonnenrichtung) |

Empfehlung H2: Kampf-Bild als Hintergrund-Ebene (oder `scene.background`), 3D-Boden-Patch davor mit derselben Kamera-Geometrie: vertikales FOV 38°, Neigung +3,5° → Horizont bei `horizonY` (0,589 von oben). Kreaturen-Licht: `env.sunCol/sunDir` (Bildraum: Kamera blickt nach Azimut −90°, also −z; Sonne z. B. Tag Azimut −30° rechts vorn, Abend −70° im Bild, Nacht Mond −112° links), Hemisphäre `hemiTop/hemiBot`, Nebel `env.fog`. Fehlt ein Bild (`ok=false`), bisherigen Kampfhintergrund behalten.

## 5. Tests
- `node test/unit_sky.mjs` – Keys, Bildgrößen, Byte-Grenzen, Alpha der Kulissen, Metadaten, Build/Artifact, skyFor/envFor/battleBgFor/skyTime/skyRegion, Welt (Skybox aktiv, Calls, Cache, `low` → `_lo`, fehlende Datei → prozedural).
- `node test/hybrid_sky_shots.mjs <iter> [voll] [karten]` → `test/hybrid_sky_<iter>_<breite>_<karte>_<zeit>.png` (route1, morgenau, nebelgrotte, brisenhafen, fluestertal; tag/abend/nacht; 860×400, „voll“ + 1920×1080).

## 6. Messwerte (Stand Iteration v3)

**Bildgrößen** (WebP, `public/art/`):

| Art | Anzahl | Größe | voll gesamt | voll je Bild | _lo gesamt |
|---|---|---|---|---|---|
| Skybox `sky_*` | 24 | 2048×1024 (q75) | 919 KB | 21–52 KB (Grenze 350 KB) | 340 KB |
| Kulisse `horizon_*` | 8 | 2048×512 RGBA (q80) | 686 KB | 56–119 KB | 241 KB |
| Kampf `bg_battle_*` | 24 | 1280×720 (q75) | 376 KB | 9–22 KB (Grenze 250 KB) | 148 KB |
| `sky_meta.json` | 1 | – | 19 KB | – | – |
| **gesamt** | 112 Bilder | | **1,98 MB** | | **0,73 MB** → zusammen **2,71 MB** (Budget 9 MB) |

Wahl: volle Auflösung (2048er-Skybox) für **alle 8 Regionen × 3 Tageszeiten** – die weichen Verläufe/Wolken komprimieren so gut, dass weder 1536er-Skyboxen noch weniger Abend/Nacht-Varianten nötig waren. **Artifact:** nur `_lo` (0,73 MB roh ≈ 0,98 MB Base64) → `dist/artifact.html` 12,70 MB (11,63 MB vorher; Grenze 16 MB).

**Draw-Calls / JS** (860×400, Stufe high, SwiftShader, ohne Roamer; „ohne“ = prozeduraler Himmel):

| Szene | Calls mit | ohne | Δ | JS/Frame mit / ohne (ms) | Dreiecke Δ |
|---|---|---|---|---|---|
| route1 12:00 | 49 | 48 | +1 | 2,98 / 2,81 | −5,4 k |
| route1 17:20 (Überblendung, Kuppel B an) | 50 | 48 | +2 | 3,73 / 2,98 | −3,2 k |
| route1 18:45 | 49 | 48 | +1 | 2,65 / 1,96 | −5,4 k |
| brisenhafen 12:00 | 70 | 69 | +1 | 3,33 / 3,18 | −3,5 k |
| fluestertal 23:00 | 60 | 60 | 0 | 2,66 / 3,19 | −5,0 k |
| morgenau 12:00 | 56 | 55 | +1 | 3,07 / 2,24 | −5,8 k |

Zusätzlich gezeichnet: Kuppel A, Kulisse, Dunstteppich, Strahlen (+ Kuppel B in der Überblendung); entfallen: prozeduraler Himmel, prozedurale Fernberge (09). GPU-Speicher: 8 MB je volle Skybox (keine Mipmaps), höchstens 3 gleichzeitig (A, B, vorgeladen) + Kulisse 4 MB; `low` 2 MB je Skybox. PMREM einmal je Bildwechsel (mid/high).

Screenshots: `test/hybrid_sky_v0…v3_<860|1920>_<karte>_<zeit>.png` (v0 erster Einbau, v1 alle Regionen gerendert, v2 Mond/Schiff/Kristalle/Dunst nachts/Himmelsweiten-Kante/Zirren, v3 weniger Wolken im Zenit, Licht ≥ 14°, Nebel 80 %), Vergleich mit den Intro-Stills `test/hybrid_sky_vergleich.png` (links Still, rechts Spiel/Kampfbild).

## 7. Offen
- Kulissen-Wahrzeichen sind einfache Grundkörper (Kegel, Prismen, Kugelkronen) – lesbar und atmosphärisch, aber weit von der Detailtiefe des Videos; nächste Stufe: mehr Modell-Details oder Nutzer-Bildquellen.
- Kampfbilder: Boden ist eine einfache Textur-Ebene (wird von H2 durch den 3D-Boden-Patch verdeckt); Himmelsweiten ohne Boden (Wolkenmeer bis zum Bildrand).
- 360°-Kulisse in 2048 px: horizontal ≈ 5,7 px/° → bei 1920×1080 weich; bei Bedarf 4096er-Band oder halber Umfang mit Wiederholung.
- Ortsansichten/Ladebilder (HYBRID-LOOK Punkt 4) und Kapitel-Standbilder (Punkt 6) nicht Teil von H1.
- Messung auf echtem Handy (Füllrate von Ring/Dunstteppich/Strahlen) steht aus.

## 8. Berührte fremde Datei
- `test/unit_art.mjs` Z. 17: Liste erlaubter Nicht-Arten-Keys um `sky|horizon|bg_battle` ergänzt (ein Regex-Ausdruck; vorgegeben waren die Dateinamen in `public/art/` und `ART_SRC` als Schnittstelle – ohne die Ergänzung meldet unit_art die neuen Orte-Keys als „unbekannt“).
