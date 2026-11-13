# Terras als gebaute 3D-Modelle – Serie (Agent „Terras-Serie“, Opus 5.5 · hoch, 12./13.11.2026)

Ziel (Nutzer 22:10): Terras sollen beim freien Herumlaufen, Begegnen und Fangen die **Anmutung moderner Pokémon-Spiele (Legends)** erreichen –
Auflösung, saubere Formen, glaubwürdige, lebendige Tiere. Pokémon ist nur Maßstab für Technik/Qualität; alle Arten bleiben eigene Entwürfe
(Vorlage: gemalte Bilder in public/art und docs/terras.md). **Status: Vorschau.** Alles hängt am Schalter `SET.modelle3d` / `?modelle3d=1` (Standard aus).

## 1. Werkzeugkette
```
bash tools/modelle/terras/bauen.sh [001 002 … | alle]     # nimmt die Blender-Sperre .blender.lock
```
- `tools/modelle/terras/tbau.py` – **Terra-Baukasten** auf Basis von `tools/modelle/vlib.py` (vlib unverändert, nur genutzt):
  - Material-Arten je Region (`treg(name, farbe, art)`): **fell** (Fellstriche entlang der Knochenrichtung, Büschel-Klumpen, feine Haare → Farbe + Höhe → Normalkarte),
    **schuppe** (Zellrauschen, Kantenhöhe), **haut** (feines Rauschen), **feder** (überlappende Zellen entlang der Flussrichtung), **horn**, **kristall**,
    **blatt** (Adern), **bluete**, **glut** (Leuchten, Maske a = 1). Masken (Umriss, Hautstreuung, Glanz, Leuchten) als Vertexfarbe für 56-toonpro.
  - **Kopf** `kopf()` (Schnauze, Stirnabsatz, Augenmulden, Backen), **Augen-/Lid-/Mund-System** `augen()` + `maul()` als Funktion:
    eigene Augäpfel mit gemalter Iris (rund/Schlitz), 3 Glanzpunkten + Shader-Glanz, Ober-/Unterlid-Schalen mit Lidlinie, Mund-Aufkleber.
    Augen, Lider und Mund liegen in **einem kleinen Gesichtsnetz** (≈ 1,3 k Dreiecke) – nur dieses trägt Shape Keys
    (Blinzeln, Augen_froh, Augen_wach, Augen_muede, Maul_auf, Maul_weit, Staunen) → Datei −35 % gegenüber Shape Keys auf dem ganzen Kopf.
  - **Volumetrische Ohren** `ohr()` (Sichel-Querschnitt: Rand dick, Innenseite hohl, Innenfell; `rund=1` für Bärenohren) – behebt die „von der Seite dünnen“ Pilot-Ohren.
  - **Fellkanten-Silhouette** `bueschel()` (tropfenförmige Klumpen statt Stacheln), `blatt()`, `flamme()`; **Glieder/Rumpf** `glied()` als Lofts mit elliptischen Querschnitten.
  - **Rig-Vorlagen mit gemeinsamem Clip-Satz** (idle mit Atmen/Umschauen/Ohrzucken/Schwanz · walk · run · attack · hit · faint · joy · catch):
    `rig_vierbeiner/clips_vierbeiner` (Zehen- oder Sohlengänger, Kreuzgang/Galopp per IK), `rig_zweibeiner/clips_zweibeiner` (aufrechter Gang, Armschwung),
    `rig_wasser/clips_wasser` (Robben an Land + Clip **swim**). Vogel/Schwebend: siehe Offen.
  - Effekt-Knochen ohne Gewichte (`C.FX`, z. B. `fx_flamme`, `fx_kragen`, `fx_krone`) als Ankerpunkte für Leuchten im Spiel.
  - **LOD 50 %** (Kopf + Körper als `*_LOD1`-Netze im selben GLB, mehrstufiges Decimate), Kopf/Körper-Budget per `head_max`/`body_max`.
  - Ablauf `standard_ablauf()`: Normalen → Gewichte → Shape Keys → Masken → UV-Atlas → Backen (Region, Position, AO) → Malen → Normal-Bake → Materialien → LOD → Clips → GLB + `build/<id>.json`.
- Arten: `canide.py` (001–003), `robbe.py` (004–006), `baer.py` (007–009). `--form` = schnelles Kontrollbild ohne Backen.
- Ausgabe: `public/models/terras/t<NNN>.glb` (Draco, WebP-Texturen 1024² Farbe + 1024² Normal, Augen 512×256).

## 2. Gebaute Arten (13.11.)
| Modell | Art | Vorlage | Dreiecke (LOD1) | Datei |
|---|---|---|---|---|
| t001 | Funki (Runde 2) | Vierbeiner klein | 8,1 k (3,4 k) | 1,05 MB |
| t002 | Loddo | Vierbeiner mittel, Flammenkragen | 8,1 k (3,4 k) | 1,02 MB |
| t003 | Flammel | Vierbeiner, Flammenmähne, Basaltplatten mit Glutfuge | 8,1 k (3,4 k) | 0,99 MB |
| t004 | Plippi | Wassertier | 8,3 k (3,5 k) | 0,61 MB |
| t005 | Wabbel | Wassertier + Rückenflosse | 8,7 k (3,7 k) | 0,63 MB |
| t006 | Aquilo | Wassertier, Leucht-Tupfen | 8,8 k (3,8 k) | 0,62 MB |
| t007 | Knospi | Zweibeiner (Bild: aufrecht/sitzend) | 8,4 k (3,6 k) | 0,88 MB |
| t008 | Rankel | Zweibeiner, Laubfell | 8,4 k (3,6 k) | 0,88 MB |
| t009 | Blühro | Vierbeiner Sohlengänger, Lilie, Blättermähne, Ranken | 9,4 k (4,1 k) | 0,93 MB |
Budget-Ziel 4–8 k (Endstufen bis 10 k): Grundstufen liegen knapp darüber (Gesichtsnetz 1,3 k) – nächste Runde: Lider 12→9 Segmente.

**Funki Runde 2 – behobene Schwächen:** Ohren volumetrisch (Rand ≈ 4× so dick, hohl, Innenfell); Flammenrute als Flammenball mit Kern, 10 Zungen,
Leuchten im Shader (Maske a, `glow` je Modell) **plus** flackerndes additives Leuchten am Effekt-Knochen; Stirnflamme als erhabene Leuchtform;
größerer Kopf/Augen nach dem gemalten Bild; Fell-Silhouette aus weichen Klumpen; Rumpf als glatter Loft statt Skin-Kanten; Mimik über das Gesichtsnetz.

## 3. Anbindung (`src/58-terramodelle.js`, neu) – nur mit Schalter
- `tmLoad(id)` lädt `models/terras/t<NNN>.glb` bzw. `window.PILOT_SRC['t<NNN>']` (Werkstatt-Build, data-URI). Fehler → Warnung, **Rückfall Bild/Prozedural**.
- **Welt:** Hook `buildTerra` (gleiche Höhe wie das bisherige Modell). **Kampf:** Hook `monRender` → für geladene Terra-Modelle 'proc'
  → `monObj → buildMon3D → buildTerra` liefert das Modell statt des flachen Bildes (10-mon3d.js:670 bleibt unverändert). Dex/Team-Karten, Porträts (`TA_HQ`)
  und die Heldenpose der 3D-Ansicht bleiben beim gemalten Bild bzw. bisherigen Modell.
- Animation (`animModel`-Hook → `tmAnim`): Tempo aus der Weltbewegung → idle/walk/run weich gewichtet, Abspieltempo = Tempo/Schrittlänge;
  Kampf-Ereignisse `act.atk/hit/hop/catch/ko` → Clips attack/hit/joy/catch/faint; Posen sleep (faint gehalten, Augen zu), hide, graze/sniff (Hals runter);
  Blick zum Spieler (Kopf + Hals), **Feder-Nachschwingen** von Rute und Ohren bei Drehungen, Ohren angelegt bei verletzt/müde; Mimik weich überblendet + Blinzeln (2–6 s);
  Fangen: weißer Blitz (uFlash) + Schrumpfen, Befreien = Ploppen; Leuchten flackert, nachts heller. LOD ab 7 Weltmaß.
- Pilot-Funki (57) ist abgelöst: `PILOT.wait.funki` wird auf „serie“ gesetzt → `models/pilot/funki.glb` wird nicht mehr geladen. Noa (Pilot) unverändert.
- Vorladen: Team + Arten des Gebiets nach jedem `loadMap`. Nach dem Laden werden vorhandene Welt-/Kampf-Objekte der Art neu gebaut.
- Kampf-Renderer: vor dem Kampfbild `toonProSync(BT.r)` (Umrissbreite passend zur Kampf-Leinwand), danach zurück auf den Welt-Renderer.

## 4. Werkstatt-Build
`tools/werkstatt-build.mjs` sammelt bereits **alle Unterordner** von `public/models/` (Änderung des Figuren-Agenten, identisch mit dem geplanten Mechanismus)
→ `spiel/models/terras/t<NNN>.js` mit `window.PILOT_SRC['t<NNN>']`. Von mir keine weitere Änderung nötig.

## 5. Vorschauen und Tests
Bilder (test/terras2/, 1600×900): funki_pilot_vs_runde2 · funki_mimik · linie_glut|flut|flora · welt_glut|flut|flora (wild im Gras, Route 1) ·
kampf_glut|flut|flora (echter 3D-Kampf, beide Seiten Modell) · anim_funki_idle_attack_joy · nah_fell_schuppen.
Ergebnis 13.11. 02:05: terras2_test 20/20 (9 Modelle Welt + Kampf) bzw. 11/11 inkl. Schalter-aus/Konsole; Smoke „Keine Fehler.“
- `node test/terras2/vorschau.mjs [funki|gesicht|linie|anim|nah|welt|kampf|alle]` (Chromium-Sperre!) → `test/terras2/*.webp` (1600×900).
- `node test/terras2/terras2_test.mjs` → Welt + Kampf je Modell, Pilot nicht doppelt geladen, Schalter aus = nichts geladen, keine Konsolenfehler.

## 6. Shader-Wünsche an 56-toonpro.js (nicht selbst umgesetzt)
1. Leuchten pro Texel statt pro Ecke (Emissive-Maske aus einem Texturkanal, z. B. Alpha der Normalkarte) – Flammenverlauf/Glutfugen ohne Extra-Geometrie.
2. Fell-Randlicht („Fuzz“): Rim mit Rauschmaske aus der Höhenkarte, damit Fellkanten im Gegenlicht ausfransen.
3. Durchlicht für dünne Teile (Ohren, Flossen, Blätter) über Maske g (Hautstreuung) auch von hinten.
4. Wasser/Kristall: halbtransparenter Zweig (Fresnel-Alpha) für Wasserkrone/Blasen.
5. `uFlash`/`uGlow` je Material sind schon nutzbar – bitte als stabile API behalten.

## 7. Offen
- Vogel- und Schwebend-Vorlage (Route 1: Flausch 059, Blinki 061) noch nicht gebaut; Knabbi 112 (Vierbeiner klein) fehlt ebenfalls.
- Ladezeit im SwiftShader-Test mit parallel laufenden Agenten 9–15 s je Modell (Draco-Dekodierung auf ausgelasteter CPU); früher allein 0,35 s – auf dem Handy messen.
- Dreiecke der Grundstufen leicht über 8 k; Fang-Clip zeigt Zusammenzucken/Zappeln, eine eigene Kapsel-Zitter-Pose fehlt.
