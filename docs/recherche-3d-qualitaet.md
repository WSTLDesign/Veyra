# Recherche „3D-Qualität“ – Figuren und Terras wie aus einem Profi-3D-Programm

Team „3D-Qualität“ (Opus 5.5, hohe Stufe) · 12.11.2026 · nur Recherche, kein Code geändert.
Maßstab: aktuelle Pokémon-Spiele (Karmesin/Purpur, Legenden: Arceus, Legenden: Z-A) **nur für Technik und Qualität**. Keine Designs, Formen, Farben, Namen übernommen; nichts heruntergeladen oder gerippt (AGENTS.md „eigene Entwürfe“).
Nutzer-Entscheidung (Stand 19:30): Look „wie die neuen Pokémon-Spiele“ = hochwertig stilisiert, nicht fotorealistisch; echte, per Skript gebaute GLB-Modelle sind erlaubt (Blender/bpy, eigene Designs, Basismodelle nur mit freier Lizenz).

---

## Kurzfazit

1. Die neuen Pokémon-Spiele sind **kein klassischer Cel-Look**: Karmesin/Purpur rendert mit PBR (GGX-Glanz, Lambert-Diffus, Bildlicht/IBL, Deferred), Figuren bleiben stilisiert durch **Form, Proportion und weiche Normalen**, nicht durch harte Toon-Stufen.
2. Der „Profi“-Eindruck kommt aus vier Dingen: **saubere Subdivision-Form mit weicher Silhouette**, **gemalte/gebackene Texturen** (Farbe, AO, Normal), **gezielte Materialtricks** (Unterhautstreuung, Augenglanz, Irisieren) und **lebendige Gesichter** (Blendshapes, eigene Augen-Meshes).
3. Veyra kann das im Browser mit three.js r128 weitgehend nachbilden: **eigener „Soft-Toon“-Shader** (2–3 weiche Stufen + Wrap-Licht + SSS-Tönung + Rand-/Rim-Licht + Matcap-Glanz) auf **GLB-Modellen mit Skinning, Shape Keys und Clips**.
4. Budget Mittelklasse-Handy: **Figur 6–12 k Dreiecke**, **Terra 4–10 k** (Legenden bis 15 k), **eine 1024er-Textur je Modell** (Albedo+AO gebacken, optional Normal 512–1024), ≤ 40 Knochen, 1–2 Draw-Calls je Modell + Umriss.
5. Szene: Kampf ≤ 60 k Dreiecke / ≤ 30 Calls, Welt ≤ 250 k / ≤ 150 Calls; FXAA statt SMAA; Schatten: eine Sonne, kleine Shadow-Map + Kontaktschatten.
6. **Herstellung: Blender als Python-Modul (bpy 5.3) läuft im Container** – getestet: Modifikatoren, Shape Keys, Armature, Cycles-CPU-Backen und GLB-Export funktionieren ohne GPU.
7. Figuren: **Weg (d)** = MPFB/MakeHuman-Basis (CC0) für Anatomie und Rig, stark stilisiert per bpy-Skript, eigene Kleidung/Haare, Texturen per Cycles gebacken.
8. Kreaturen: **Weg (b)** = bpy-Baukasten aus eigenen Grundkörpern (Metaball/Skin-Modifier → Remesh → Subdivision → Sculpt-ähnliche Verformung), Rig je Körperbautyp, Clips je Typ wiederverwendet (wie Game Freaks „PokeRig“-Prinzip).
9. Weg (a) – prozedural in three.js – bleibt als Rückfall und für Requisiten, erreicht aber die Zielqualität nicht (keine gebackenen Texturen, kein echtes Gesichts-Rig).
10. Größte Risiken: Agent sieht Modelle nur über Test-Renders (Qualitätsurteil braucht Bildvergleich + Nutzerfreigabe), Draco fehlt im pip-bpy (→ gltf-transform nachschalten), AGENTS.md-Regel „keine externen Assets“ muss für GLB formal angepasst werden.

---

## 1. Figuren (Menschen)

### Was die Vorbilder machen

**Pokémon Karmesin/Purpur (CEDEC 2023, Keiichi Maezawa, Game Freak)**
- **Rendermodell:** physikalisch basiert, gleiche PBR-Materialvorgabe für Menschen und Pokémon; Oberflächendaten in vier G-Buffer-Zielen; Glanz GGX, Diffus Lambert; Licht: Richtungs-, Punkt-, Spotlicht und **IBL**; Transparentes per Forward-Rendering. Hintergründe realistischer als in Schwert/Schild, **Figuren bewusst stilisiert** – Texturen eher realistisch, Silhouetten an die stilisierten Formen angepasst.
- **Gesicht – der wichtigste Trick:** eine **Pseudo-Normale in Form eines „Rugbyballs“** (Ellipsoid um das Kopf-Gelenk) wird mit den Mesh-Normalen gemischt → weiche, „niedliche“ Schattierung ohne Nasen-/Augenhöhlen-Flecken. Mischverhältnis hängt vom Kamerawinkel zum Gesicht und von Gegen-/Frontlicht ab. Glanz geglättet, Hautrötung im Spätstadium reduziert.
- **Augen und Mund:** Menschenaugen haben **eigene Meshes für Grundauge und Glanzpunkt**, je mit eigenem Gelenk; ungleichmäßige Skalierung am Wurzelgelenk lässt hohe Augen drehen. Augen und Mund werden mit **Lattices** verformt (eine Lattice fürs ganze Gesicht, eigene für Lider und Mund); Varianten als mischbare Lattice-Muster. Mimik über **fünf Blendshape-Gruppen**: Brauenbereich, rechtes Auge, linkes Auge, Mund, ganzes Gesicht – mit Presets statt Feinsteuerung.
- **Wimpern und Brauen:** Textur mit Alpha (Farbvarianten über Alpha je Farbe), keine Geometrie.
- **Kleidung/Charakter-Anpassung:** modulare Teile (Kleidung, Frisuren als Wechsel-Meshes); Schmutz/Schnee wird als **überlagerte Zweit-Textur** eingeblendet (auch an den Schuhen des Helden).
- **Polygonzahlen:** Game Freak nennt keine offiziellen Zahlen; in den öffentlichen Quellen fanden wir keine belastbaren Werte. Einschätzung (unbestätigt, aus Sicht auf das Material und Switch-Üblichem): Hauptfiguren grob im niedrigen fünfstelligen Dreiecksbereich, NPCs deutlich weniger, plus LOD-Stufen. **Nicht als Fakt verwenden.**
- **Proportionen:** realistische Jugend-/Erwachsenen-Proportionen (ca. 6–7,5 Kopfhöhen), Köpfe und Augen leicht vergrößert, Hände/Schuhe leicht überbetont für Lesbarkeit.

**Pokémon Legenden: Arceus / Z-A**
- Arceus: gemalte, aquarellartige Welt, Figuren ohne Umrisslinien (Fans haben Umriss-Mods gebaut); Digital Foundry: **gar kein Antialiasing**, 720p mobil, 30 fps, viel Pop-in. Z-A: Switch 2 mit DLSS 1080p mobil / 1440p TV, 60 fps; Kritik an flachen, wiederholten Gebäudetexturen und Pop-in; ferne Figuren animieren mit reduzierter Rate.
- Lehre: Die **Figuren** tragen den Qualitätseindruck, die Technik drumherum ist bescheiden. Für Veyra heißt das: Geld (= Rechenzeit) in Modelle, Gesicht und Shader stecken, nicht in Szenen-Effekte.

**Vergleich Anime-Rendering**
- **Guilty Gear Xrd (GDC 2015, Junya Motomura):** ~40 k Dreiecke und ~500 Knochen je Figur (Kampfspiel, nur 2 Figuren im Bild); Details als Geometrie statt Normal Maps; **Normalen von Hand bearbeitet** (sauberes Anime-Licht); Vertex-Farbe verschiebt die Schattenschwelle (Stellen dauerhaft im Schatten = „gemalte“ AO) und steuert Umrissdicke; zwei Lookup-Texturen „Basis“ (Licht) und „Tint“ (Schattenfarbe, multipliziert). **Licht je Figur eigens gesetzt**, kein globales Licht auf Figuren. Animation ohne Interpolation („auf Zweien“), viel Skalierung für Squash/Stretch.
- **Guilty Gear Umriss (ASW Academy):** Inverted Hull; Vertex-Alpha = Linienbreite (0,5 Standard, 0 = keine, 1 = doppelt); Blau-Kanal schiebt die Hülle von der Kamera weg (Linien in Haaren ausblenden); **zweiter, geglätteter Normalensatz nur für den Umriss** (im Tangenten-Slot), weil harte Kanten die Hülle aufreißen; Breite ∝ Abstand × tan(FOV/2).
- **Genshin Impact:** Rampen-Textur (Tag/Nacht, Zeile je Material), Lightmap mit Kanälen für Schattenschwelle/Glanz, **SDF-Gesichtsschatten** (Schattentextur für Schlüssel-Lichtwinkel, per Schwellwert mit Gesicht·Licht abgetastet → Schatten wandert sauber über das Gesicht, keine Flecken), Tiefen-basiertes Rim-Licht, Umriss mit geglätteten Normalen, Metall per Matcap.
- **Zelda BotW (Fan-Analysen):** PBR-Basis mit künstlerischem Dreh; Figuren mit 2–3 Licht-/Schattenbändern, Haar/Metall mit Mittelton-Band, „Seitenglanz“ auf der Lichtseite, weißer Rim-Rand (über 1 → Bloom), angehobener Schattenboden; SSAO, Licht-Proben für Umgebungslicht.
- **Monster Hunter Stories 2:** Entwickler haben Proportionen hin zu **lebensnäheren Körpern** umgebaut, Tiefe und Schatten betont – derselbe Schritt, den Veyra mit „kein Chibi“ schon gegangen ist.

### Was das für Veyra heißt
- **Proportionen** bleiben wie in docs/charaktere.md (Kind 5,3 · Jugend 6,2 · Erwachsen 7 Kopfhöhen) – passt zum Vorbild. Kopf +5–10 %, Augen +15–25 % über real, Hände/Schuhe +10 %.
- **Topologie:** Quad-basierte Subdivision-Form (Kantenschleifen um Augen, Mund, Schultern, Ellbogen, Knie, Hüfte) – genau das, was ein Basismesh wie MakeHuman schon mitbringt. Daraus Spielmodell 6–12 k Dreiecke.
- **Gesicht:** (1) **Gesichts-Normalen auf ein Ellipsoid mischen** (Pokémon-Trick, in bpy per „Data Transfer“-Modifier von einer Kugel/Ellipsoid auf das Gesicht übertragen, 50–80 %) – günstigster Einzelschritt mit größtem Effekt. (2) **Augen als eigene kleine Meshes** (Augapfel-Kappe mit Iris-Textur, separater Glanzpunkt-Quad), Blick per Knochen. (3) **Shape Keys:** Blinzeln L/R, Lächeln, Mund offen (A), O, Ärger, Staunen, Brauen hoch/runter = 8–10 Keys. Achtung r128: **höchstens 8 gleichzeitig wirksame Morph-Einflüsse (4 mit morphNormals)** → Keys je Gesichtsteil so anlegen, dass nie mehr als 4–8 gleichzeitig ≠ 0 sind; morphNormals aus, Normalen kommen aus der Ellipsoid-Mischung.
- **Haare:** Mesh-Strähnen-Gruppen (5–15 Hauptsträhnen als Subdivision-Körper), keine Alphakarten (Sortierprobleme, Overdraw auf Handy). Glanzband über Shader (anisotroper Streifen) statt Textur.
- **Kleidung:** große Falten modelliert (Ellbogen, Knie, Saum), feine Falten/Nähte als **Normal- bzw. AO-Bake** in die Textur.
- **Texturen:** 1 × 1024² Albedo mit eingebackener AO und weicher Höhlenabdunklung (Basis + „Schattenfarbe“ wie Xrd über Shader), optional 1024² Normal; Gesicht über UV-Insel mit ~25 % der Texturfläche (Texeldichte im Gesicht ×2).
- **Shader:** eigener Soft-Toon (siehe 4.), Umriss nur dezent (Nahaufnahme dünn) – der Pokémon-Look hat kaum sichtbare Umrisse.
- **Rig:** 30–40 Deform-Knochen (Wirbel 3, Hals, Kopf, Kiefer optional, Augen 2, Arme 2×4, Hände vereinfacht 2×3, Beine 2×4, Zusatz: Haar/Umhang 2–4). Animationen als GLB-Clips (siehe Zielvorgabe).

---

## 2. Kreaturen (Terras)

### Was die Vorbilder machen
- **Materialvielfalt statt Polygonen (CEDEC 2023):** Unterhautstreuung (SSS) für Haut und flüssigkeitsartige Teile – Farbe blutet in die Schattenseite; **Parameter skaliert mit Körpergröße** (große Wesen dunkler, kleine heller), dünne Körperteile heller. „Gel“-Effekt: SSS nur an den Rändern → wirkt wie durchscheinende Außenschicht. **Strukturfarbe** (Seifenblasen-Schimmer) als einfache Drei-Farben-Mischung nach Winkel Kamera↔Normale statt Physik. Funkelpartikel über 4×4-Flipbook (16 Bilder) mit Tiefentextur. **Augenglanz** über Punktlichter an den Augengelenken – Glanz wandert mit Kamera und Blick und ist bei jedem Licht sichtbar. Kristallform = gleiches Mesh, nur Material getauscht, Masken schließen Körperteile aus.
- **Augen und Mund in 3D:** Ab Legenden: Arceus haben Pokémon modellierte Augen und Münder statt reiner Texturen (Leak-Berichte); frühere Spiele tauschten Augen-Texturen (Blinzel-Animation auf Augen-Material).
- **Oberflächen:** Karmesin/Purpur-Modelle haben sichtbar mehr Oberflächeninformation als Schwert/Schild: Glanz auf Metall, Beulen/Prägungen auf Stein, „flauschig“ wirkendes Fell durch definiertere Schattierung – alles über **Textur + Normal + Material**, nicht über Fellgeometrie. Fell = Form mit gezackter Silhouette an wenigen Stellen (Mähne, Schwanzspitze, Wangen) + Strähnen in Normal/Albedo.
- **Rig und Animation (CEDEC 2022):** „PokeRig“: Skelette aus wiederverwendbaren Bausteinen; Animationen werden über **Körperbau-Vorlagen** (schlangen-, drachen-, hunde-/katzenartig) zwischen Arten übertragen; Spline-Werkzeuge für weiche Ketten (Schwänze, Hälse).
- **Tierhaft trotz Stilisierung:** Gewicht (Körper sinkt beim Auftreten), Atmen (Brustkorb 1–3 % Skalierung, 3–4 s Zyklus), Blinzeln (alle 2–6 s, 120–180 ms, gelegentlich doppelt), Ohr-/Schwanz-Nachschwingen (Feder-Dämpfer auf Endknochen), Kopf schaut zuerst, Körper folgt (Overlap). Riesen-Wesen: langsamere Zyklen, kleine Wesen: schneller, sprunghafter.

### Was das für Veyra heißt
- **Polygonbudget:** Basis-Terra 4–8 k Dreiecke, Endstufe 6–10 k, Legenden 10–15 k (nur Kampf/Dex), LOD1 50 %, LOD2 25 %, ab ~15 Feldern bisheriger Sprite/Billboard.
- **Material-IDs statt Einzelmeshes:** je Terra 1 Mesh, Materialarten in einem Vertex-Attribut oder Kanal der Textur (wie euer `aKind`: Haut, Fell, Schuppe, Horn, Kristall, Leuchtteil). Schuppen/Panzer als Normal-Bake, Horn/Kristall mit Matcap-Glanz, Haut mit SSS-Tönung, Fell mit „Fluff“-Rand (Rim + gezackte Silhouette).
- **Flügel:** Flughaut als dünnes Doppelsegment mit Durchlicht-Tönung (Licht von hinten → Farbe heller), Federn als 6–12 modellierte Hauptfedern pro Flügel, kein Alpha.
- **Augen:** eigene Augen-Meshes mit Glanz-Quad, der zur Kamera/zum Hauptlicht ausgerichtet wird (Pokémon-Prinzip, billig per Shader).
- **Rig-Vorlagen:** 6 Körperbau-Typen (Vierbeiner, Zweibeiner, Vogel, Schlange/Fisch, Kugel/Schwebend, Insekt) mit je 20–40 Knochen und gemeinsamem Clip-Satz → ein Satz Animationen für viele Arten.
- **Sekundärbewegung zur Laufzeit** (Federdämpfer auf Schwanz/Ohren, Atmen, Blinzeln per Shape Key) statt in jedem Clip – spart Clip-Daten und wirkt lebendiger.

---

## 3. Licht und Bild

### Was die Vorbilder machen
- **Karmesin/Purpur:** Deferred PBR, GGX/Lambert, IBL, Richtungs-/Punkt-/Spotlichter. Switch-1-Bild mit schwacher Kantenglättung; Switch 2 DLSS, mobil ~648 p dynamisch → 1080 p.
- **Arceus:** kein AA, 720 p mobil, Nebel gegen Pop-in. **Z-A:** Schatten auf Switch 1 flackernd/niedrig aufgelöst.
- **Guilty Gear Xrd:** Licht je Figur gesetzt, Kampf-Licht fest, in Zwischensequenzen je Bild animiert.
- **BotW:** PBR mit Licht-Proben, SSAO, Schattenvolumen für Sonne/Mond.
- Allgemein: Bloom dezent (Leuchtteile, Rim > 1), Farbkorrektur warm, Tonemapping filmisch.

### Was das für Veyra heißt
- **Licht-Rezept Figur/Terra:** Sonne (gerichtet, warm) + Hemisphäre (Himmel/Boden) **plus Umgebungslicht aus der vorhandenen Skybox** (euer Hybrid-Plan: envMap aus der Skybox) + **eigenes Rim-Licht im Shader** (Kamera-Gegenlicht, kühl). Im Kampf: Licht je Szene fest und für die Kreaturen „gestellt“ (Xrd-Prinzip), nicht physikalisch.
- **Schatten:** eine Sonnen-Shadow-Map 1024² (Kampf) / 2048² nur für den Nahbereich der Welt; Figuren/Terras zusätzlich weicher **Kontakt-Blob** unter den Füßen (billig, wirkt hochwertig). Selbstschatten auf dem Körper macht der Toon-Shader, nicht die Shadow-Map (vermeidet Akne/Flackern – genau Z-As Schwäche).
- **Post:** kein volles EffectComposer-Paket auf dem Handy. ACES-Tonemapping (schon aktiv), Vignette/Farbkorrektur im Material oder ein einziger Abschluss-Pass. Bloom nur „falsch“: additive Glow-Sprites an Leuchtteilen.
- **Antialiasing:** `antialias:true` (MSAA) beibehalten – auf Kachel-GPUs (Mali/Adreno) ist 4×MSAA laut ARM praktisch kostenlos (1–2 %). FXAA nur, wenn ein Post-Pass ohnehin nötig ist; SMAA (3 Passes) zu teuer. Wichtiger: **Pixelverhältnis begrenzen** (perf-basis.md: „1440“ erzeugt 4,46 Mpx – mehr als das Display) – Ziel ≤ 2,6 Mpx bzw. DPR ≤ 2.

---

## 4. Was mit three.js r128 auf einem Mittelklasse-Handy realistisch ist

Geprüft an three@0.128.0 (npm-Paket im Scratchpad, nichts ins Projekt gelegt):

| Baustein | r128-Lage | Empfehlung |
|---|---|---|
| **MeshToonMaterial** | hat `gradientMap`, `normalMap`, `aoMap`, `emissiveMap`, keinen Glanz | nur als Rückfall; für Pokémon-Qualität zu hart (keine SSS, kein Rim, kein Glanz) |
| **Eigener Toon-Shader** | `ShaderMaterial` oder `onBeforeCompile` auf MeshToon/MeshStandard (ihr nutzt das schon: `toonFx`, `rigMat`) | **ja**: „Soft-Toon“ = Wrap-Diffus (N·L+w)/(1+w) → weiche Rampe (2–3 Stufen, `smoothstep` Breite 0,05–0,15) · Schattenfarbe statt Schwarz (Xrd-„Tint“, warm/gesättigt) · SSS-Tönung an Schattenkante (Haut/Gel) · Rim (Fresnel, Lichtseite betont) · Glanz: Matcap oder Blinn-Streifen je Material-ID · AO aus Textur multipliziert in den Schatten · Gesichts-Pseudo-Normale (Ellipsoid) |
| **Normal Maps** | unterstützt (Tangenten aus glTF oder Ableitung im Shader) | 1024² für Kampf/Dex, in der Welt per LOD aus (Material-LOD) |
| **MatCaps** | `MeshMatcapMaterial` vorhanden; Matcap-Lookup lässt sich in eigenen Shader einbauen | für Metall, Horn, Kristall, Augen; 256² je Matcap, alle in einem Atlas |
| **Umriss** | `OutlineEffect` vorhanden (Skinning + Morphs ja, **Dicke je Vertex nein** – TODO im Code), zeichnet jede Szene doppelt | **eigene Inverted Hull** wie bisher, aber mit geglätteten Normalen in einem Zusatz-Attribut und Vertex-Alpha als Breite (GG-Technik), Breite ∝ Abstand; im Pokémon-Look dünn (1–1,5 px) oder nur Silhouette |
| **Skinning** | Knochen per Float-Textur (keine harte Grenze auf modernen Handys) | ≤ 40 Knochen je Modell, 4 Einflüsse je Vertex |
| **Shape Keys** | max. **8 aktive Morph-Einflüsse** (4 mit morphNormals) | Gesichts-Keys gruppieren, morphNormals aus |
| **GLB-Kompression** | GLTFLoader r128: `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, `KHR_mesh_quantization`, `EXT_texture_webp`, `KHR_texture_basisu` | Meshopt + Quantisierung (kleiner Decoder, komprimiert auch Animationen); Draco geht ebenfalls (Loader liegt schon in public/vendor). Texturen WebP 1024 |
| **KTX2/Basis** | `KTX2Loader` nur in `examples/jsm` (ES-Module), in `examples/js` nur `BasisTextureLoader` | erst später; WebP reicht für ≤ 20 gleichzeitige Modelle |
| **FXAA/SMAA** | `FXAAShader`, `SMAAPass` vorhanden | MSAA behalten, FXAA nur mit Post-Pass |
| **LOD** | `THREE.LOD` vorhanden | 3 Stufen (100/50/25 %) + Sprite, Wechsel mit Hysterese |

**Budget (Mittelklasse, z. B. Adreno 6xx / Mali-G5x–G7x, 30 fps Ziel):**
- Android-Richtlinie: Dreiecke ≥ 10 px Fläche, 50 % je LOD-Stufe, < 65 535 Vertices je Mesh; Referenz-Demo ~210 k Dreiecke/Frame bei 30 fps.
- Kampf: 2 Terras à ≤ 10 k + Trainer ≤ 12 k + Hintergrund ≤ 25 k → **≤ 60 k Dreiecke, ≤ 30 Calls** (perf-basis: heute 37 k / 15 Calls).
- Welt: Held + Begleiter + ≤ 6 Figuren/Terras in Nähe mit LOD → Charaktere ≤ 60 k von **≤ 250 k gesamt, ≤ 150 Calls** (bestehende Grenze).
- Speicher: je Modell 1–2 Texturen à 1024² ≈ 4–8 MB GPU (mit Mipmaps); GLB je Modell 150–400 KB komprimiert.

---

## 5. Herstellung durch einen KI-Agenten im Linux-Container ohne GPU

**Getesteter Stand im Container (12.11.):** `pip install bpy==5.3.0` (Python 3.13, ~920 MB) läuft. Funktioniert ohne GPU: Mesh-Erzeugung, Subdivision-/Displace-Modifikatoren, Shape Keys, Armature + Vertex-Gruppen, Smart-UV, **Cycles-CPU-Backen (AO)**, glTF-Export (0,9 s für das Testobjekt), Rendern mit Workbench (0,2 s) und Cycles (1,5 s bei 320×240, 16 Samples). EEVEE rendert, aber nur mit EGL-Fehlern und sehr langsam (81 s für 320×240) → für Vorschaubilder Cycles oder three.js-Headless nutzen. Mitgeliefert: Add-ons **rigify** und **io_scene_gltf2**. **Draco- und Meshopt-Bibliothek fehlen im pip-Paket** → Kompression danach mit `gltf-transform` (npm) – oder unkomprimiert + `KHR_mesh_quantization`.

### (a) Prozedurale Geometrie in three.js (wie bisher)
- **Qualität:** mittel. Ihr seid hier schon weit (Ein-Rig-SkinnedMesh, prozedurale Oberflächen per Shader), aber: keine gebackene AO/Normal, Formen aus Primitiven wirken „gebaut“, keine sauberen Kantenschleifen fürs Verformen, Gesicht ohne Blendshapes.
- **Aufwand:** gering je Modell, hoch je Qualitätsstufe (jede Verbesserung ist Code).
- **Lizenz:** problemlos. **Risiko:** Qualitätsdecke erreicht.

### (b) Blender/bpy skriptgesteuert
- **Qualität:** hoch (näher am Profi-Werkzeug als jeder andere Weg ohne Mensch): Skin-/Metaball-Grundkörper → Voxel-Remesh → Subdivision → „Sculpt“-artige Verformung (Displace mit Texturen, Lattice, Hook, Smooth/Corrective-Smooth, Proportional-Edit per Skript) → Retopo per Decimate/Quadriflow → UV → **Backen in Cycles** (AO, Normal von High- auf Low-Poly, Krümmung, Farb-IDs) → Rig (Rigify-Metarig oder eigenes Skelett, Auto-Gewichte) → Shape Keys → Aktionen per Keyframe-Skript → GLB.
- **Aufwand:** hoch einmalig (Baukasten-Bibliothek, 1–2 Agenten-Loops), danach mittel je Modell (Daten + Feinschliff).
- **Lizenz:** Blender GPL – **Ausgaben (Modelle, Texturen) gehören dem Ersteller**, keine Pflichten fürs Spiel.
- **Risiken:** Agent beurteilt Form nur über Renders (Silhouetten-/Ansichten-Blätter + Vergleich mit Konzeptbild nötig); Auto-Gewichte an Achseln/Hüfte brauchen Korrekturregeln; Remesh-Topologie verformt schlechter als handgebaute Schleifen (für Kreaturen akzeptabel, für Gesichter kritisch); 1 GB Werkzeug im Container.

### (c) Offene Basismodelle (MakeHuman/MPFB)
- **Qualität:** Anatomie und Topologie sehr gut (animationsfähige Quad-Schleifen), **Look aber realistisch-generisch** – ohne Stilisierung wirkt es wie ein Avatar-Baukasten, nicht wie Veyra.
- **Lizenz:** MPFB-Code GPLv3, MakeHuman AGPL; **Kern-Assets CC0**, **exportierte Modelle CC0**, keine Namensnennung, auch kommerziell und in Closed-Source-Spielen. **Achtung:** Community-Assets sind teils CC-BY (Namensnennung) – nur Kern-Assets oder selbst gebaute Teile nutzen. Rig „GameEngine“ (Unity-Mecanim-kompatibel) oder Rigify; Proxy-Topologien für weniger Polygone; Shape Keys vor Export backen.
- **Aufwand:** gering für die Basis, hoch für Stilisierung und Kleidung. MPFB ist ein Blender-Add-on (ab Blender 4.2) – im bpy-Modul installierbar, aber **noch nicht im Container getestet**.
- **Risiko:** realistischer „Uncanny“-Anteil, wenn zu wenig stilisiert; Gesichtsrig muss trotzdem selbst gebaut werden.

### (d) Kombination
- Figuren: Basis aus (c) → in (b) stilisieren (Kopf/Augen/Hände-Proportionen per Shape Key, Ellipsoid-Normalen im Gesicht, eigene Haare/Kleidung aus dem bpy-Baukasten) → backen → GLB → im Spiel eigener Soft-Toon-Shader.
- Kreaturen: reiner (b)-Baukasten; (a) bleibt Rückfall und für Requisiten.

### Empfehlung (an Nutzer-Entscheidung 19:30 ausgerichtet)
- **Figuren: Weg (d)** – MPFB-Kern (CC0) als Anatomie + Rig + Topologie, alles Sichtbare (Gesichtsform, Augen, Haare, Kleidung, Farben) eigener Entwurf per bpy. Fallback, falls MPFB im Container nicht läuft: eigenes Basismesh einmalig in bpy bauen (Box-Modelling per Skript) – dann (b).
- **Kreaturen: Weg (b)** – bpy-Baukasten mit 6 Körperbau-Rigs und geteilten Clips; je Terra ein Daten-Steckbrief (Grundkörper, Anhänge, Material-IDs, Farben aus docs/terras.md).
- **Pilot:** 1 Figur (Held/Heldin Noa) + 1 Terra (001 Funki), Vergleichsblatt alt/neu, Nutzerfreigabe, dann Serie.

---

## 6. Technische Zielvorgabe

| Größe | Figur (Mensch) | Terra Basis/Endstufe | Legende | Szene |
|---|---|---|---|---|
| Dreiecke LOD0 | 6–12 k (Held bis 15 k) | 4–8 k / 6–10 k | 10–15 k | Kampf ≤ 60 k · Welt ≤ 250 k |
| LOD1 / LOD2 | 50 % / 25 %, dann Sprite | 50 % / 25 %, dann Sprite | nur Kampf/Dex | – |
| Draw-Calls | 1 Körper + 1 Augen/Transparenz + 1 Umriss | dito (+1 Leuchtteile) | dito | Kampf ≤ 30 · Welt ≤ 150 |
| Knochen | 30–40 (+2 Augen) | 20–40 je Körperbau | ≤ 50 | – |
| Shape Keys | 8–10 (Blinzeln L/R, A, O, Lächeln, Ärger, Staunen, Brauen ×2), ≤ 8 aktiv | 2–4 (Blinzeln, Maul auf, Atmen optional) | 4–6 | – |
| Texturen | Albedo+AO 1024² WebP, Normal 1024² (Welt: aus), Gesicht ~25 % UV | Albedo+AO 1024², Normal 512–1024² | 1024² ×2 | Matcap-Atlas 512² gemeinsam |
| Material-IDs | Haut, Haar, Stoff, Leder, Metall, Auge | Haut, Fell, Schuppe, Horn/Kristall, Leuchtteil, Auge | + Irisieren | – |
| GLB komprimiert | 200–400 KB | 120–300 KB | ≤ 500 KB | Artifact-Grenze beachten |

**Shader-Bausteine (eigener Soft-Toon, ein Programm für alle):** Wrap-Diffus · Rampe 2–3 weiche Stufen · Schattenfarbe je Material (warm, gesättigt) · AO-Textur in Schatten · SSS-Rand (Haut/Gel, Stärke nach Größe) · Rim/Fresnel · Glanz: Matcap (Metall/Horn/Kristall), anisotroper Streifen (Haar), weicher Blinn (Haut, schwach) · Irisieren (3-Farben-Winkelmischung) für besondere Terras/Glanzform · Gesichts-Pseudo-Normale (Ellipsoid, in bpy vorgebacken) · Augenglanz-Quad · Umriss: Inverted Hull mit geglätteten Normalen, Breite aus Vertex-Alpha × Abstand, dünn · Distanz-LOD: Normal-Map und Rim ab LOD1 aus.

**Animationen je Modell (GLB-Clips, 30 fps, Schleifen sauber):**
- Figur: Idle (4 s, Atmen + Gewichtsverlagerung), Gehen, Laufen, Winken/Reden, Werfen (Fangkapsel), Jubeln, Enttäuscht, Kampf-Kommando; Laufzeit: Blinzeln, Blick-Folgen, Mimik per Keys.
- Terra: Idle (3–4 s), Gehen/Fliegen/Schwimmen je Typ, Angriff körperlich, Angriff Element, Treffer, K.O., Freude, Ausruhen/Schlaf; Laufzeit: Atmen, Blinzeln, Schwanz/Ohr-Federn.
- Clip-Namen passend zu 38-models.js (`idle`, `walk`, `attack`, `hit`, …).

**Pipeline-Schritte (Agent):** bpy-Skript `tools/blender/build_<id>.py` → Render-Blatt (vorne/seitlich/hinten/¾, Cycles 512², ≤ 10 s) → Vergleich mit Konzeptbild → GLB → `gltf-transform` (meshopt/quantize, WebP) → `public/models/<id>.glb` → `node build.mjs && node test/smoke.mjs` + Modellblatt im Spiel-Shader → Nutzerfreigabe.

---

## 7. Offene Fragen an den Nutzer
1. AGENTS.md sagt „keine externen Assets, alles prozedural oder inline“ – soll die Regel für **selbst gebaute GLB in public/models** offiziell gelockert werden (Code-Pfad existiert schon)?
2. Umrisslinien: Pokémon-Look heißt fast keine – sollen Umrisse dünn bleiben oder weitgehend weg?
3. Darf der Agent ~1 GB Blender-Modul im Container dauerhaft installieren, und MPFB (Add-on, GPL) dafür nutzen?
4. Reihenfolge Pilot: Held/Heldin + Funki zuerst einverstanden?
5. Artifact-Variante: Mit echten GLB wird die 1,5-MB-Grenze schnell überschritten – genügt dort weiter Sprite/prozedural?

---

## Quellen
- CEDEC 2023, Game Freak (Maezawa) – Game Watch: https://game.watch.impress.co.jp/docs/news/1525779.html
- CEDEC 2023 – Denfaminicogamer (Gesicht, Lattices, Blendshapes, PBR/GGX): https://news.denfaminicogamer.jp/kikakuthetower/230824n
- CEDEC 2023 – Nintendo Wire: https://nintendowire.com/news/2023/08/24/cedec-pokemon-presentation-discusses-new-visual-techniques-used-in-scarlet-and-violet/
- CEDEC 2023 – Siliconera: https://www.siliconera.com/cedec-2023-pokemon-scarlet-and-violet-presentation-looked-at-design-decisions/
- CEDEC 2022 (PokeRig, Animations-Vorlagen) – Threadreader: https://threadreaderapp.com/thread/1562660116159008768
- CEDEC 2022 – GoNintendo: https://gonintendo.com/contents/8412-game-freak-at-cedec-2022-concept-art-character-models-game-development-and-more
- Legenden: Arceus 3D-Augen/Münder – Pro Game Guides: https://progameguides.com/pokemon-legends-arceus/pokemon-legends-arceus-models-have-improved-as-pokemon-now-have-3d-rendered-mouths-and-eyes/
- Digital Foundry zu Arceus – Nintendo Wire: https://nintendowire.com/news/2022/02/08/digital-foundry-analyzes-pokemon-legends-arceus-graphics-in-new-breakdown/
- Digital Foundry zu Arceus – Nintendo Life: https://www.nintendolife.com/news/2022/02/are-complaints-about-pokemon-legends-arceus-graphics-fair-digital-foundry-digs-in
- Digital Foundry zu Z-A – Nintendo Life: https://www.nintendolife.com/news/2025/11/digital-foundry-covers-the-disappointing-tech-in-pokemon-legends-z-a
- Z-A Switch 1 vs. 2 – RPG Site: https://www.rpgsite.net/feature/18710-pokemon-legends-z-a-runs-great-on-nintendo-switch-2-but-what-about-nintendo-switch-1
- Karmesin/Purpur auf Switch 2 – Notebookcheck: https://www.notebookcheck.net/Analysis-finds-Switch-2-specs-massively-boost-Pokemon-Scarlet-and-Violet-performance-and-confirms-DLSS.1040112.0.html
- Karmesin/Purpur vs. Schwert/Schild Modelle – GamesRadar: https://gamesradar.com/pokemon-scarlet-and-violet-models-and-textures-blow-sword-and-shields-away
- Augen-Material/Blinzeln in Pokémon-Modellen (Modding) – Luminescent Team: https://luminescent.team/rom-hacking/art/mesh_and_texture_replacement
- Guilty Gear Xrd GDC 2015, Folien Motomura: https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf
- GDC Vault Xrd: https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The
- Guilty Gear Toon Line Control (ASW Academy): https://www.docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng
- Genshin-Shader (vereinfachter Nachbau, SDF-Gesicht): https://github.com/NoiRC256/URPSimpleGenshinShaders
- Stilisierter Gesichtsschatten (SDF): https://sydianandrewchen.github.io/projects/3-stylized-facial-shadow-workflow
- miHoYo Unity-Vortrag (Folien): https://www.docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi
- BotW-Toon-Shader-Nachbau: https://github.com/ccontinisio/zelda-botw-toon-shader
- BotW technische Analyse – ResetEra: https://www.resetera.com/threads/zelda-breath-of-the-wild-the-technical-analysis.8197
- Monster Hunter Stories 2 Stilwechsel: https://nintendoeverything.com/monster-hunter-stories-2-updated-graphics-co-op/
- Android Geometrie-Richtlinien: https://developer.android.com/games/optimize/geometry
- ARM Mali MSAA: https://arm-software.github.io/vulkan-sdk/multisampling.html
- glTF-Transform CLI: https://gltf-transform.dev/cli
- Blender als Python-Modul: https://docs.blender.org/api/5.3/info_advanced_blender_as_bpy.html
- MakeHuman Lizenz: https://static.makehumancommunity.org/about/license.html
- MakeHuman FAQ Verkauf/CC0: https://static.makehumancommunity.org/oldsite/faq/can_i_sell_models_created_with_makehuman.html
- MPFB FAQ: https://static.makehumancommunity.org/mpfb/faq.html
- MPFB Export: https://static.makehumancommunity.org/mpfb/docs/exporting.html
- MPFB 2 – CG Channel: https://www.cgchannel.com/2025/03/check-out-open-source-blender-character-generation-plugin-mpfb-2
- three.js r128 (npm three@0.128.0, eigene Prüfung von GLTFLoader, OutlineEffect, WebGLMorphtargets, MeshToonMaterial)
