# Veyra – 3D-Asset-Pipeline (Option 1: Dirigent bedient Meshy/Tripo im Chrome des Nutzers)

## Ablauf je Modell
1. Quelle: public/art/<id>_<name>.webp (Kreatur) bzw. public/art_ref/<figur>_sheet.png (3 Ansichten) → als PNG in den Scratchpad konvertieren, ≤ 2048 px, Hintergrund weiß/transparent.
2. Tool (Meshy „Image to 3D“ oder Tripo „Image to Model“): Modus Low-Poly/Stylized, Ziel 3–8k Dreiecke (Kreaturen) / 8–15k (Figuren), PBR-Textur 1024, Symmetrie an, Hintergrund entfernen an.
3. Nachbearbeitung im Tool: Remesh auf Zielpolygonzahl, Textur „Cartoon/Toon“ falls angeboten, Rigging (Vierbeiner/Vogel/Humanoid) + Animationen Idle, Walk, Attack, Hit (soweit verfügbar).
4. Export GLB (Draco oder ohne), Dateiname `<kanon-id>_<name>.glb` (Kreaturen) / `fig_<name>.glb` (Figuren) → public/models/.
5. Einbau: 38-models.js (GLTFLoader + DRACOLoader lokal in public/vendor/, Toon-Material-Override, Outline-Shell, Scale-Normierung auf Dex-Größe, Animationen via AnimationMixer, LOD → Sprite-Fallback (Weg 1) wenn Modell fehlt oder zu weit entfernt).
6. Qualitätscheck: test/models_sheet.png (Bild | Sprite | GLB) – Nutzer gibt frei.

## Pilot
- 001 Funki (Einzelbild) und fig_hero_m (3-Ansichten-Sheet) zuerst.

## Status
- 14:33 Chrome-Erweiterung nicht erreichbar → warten auf Nutzer (Chrome offen, Erweiterung angemeldet, Seite freigegeben).

## Einbau-Anleitung für GLB-Lieferungen (Loop A2, ab 09.11.)
Der Code-Pfad ist fertig (src/38-models.js) und mit einem Test-Würfel geprüft (test/fixtures/cube.glb, test/unit_art.mjs). Für ein neues Modell ist **kein Code nötig**:
1. Datei ablegen: `public/models/<Kanon-Nr. 3-stellig>_<name>.glb`, z. B. `public/models/001_funki.glb` (Nummer = Dex-Kanon, docs/dex-kanon.md). Draco-komprimiert oder unkomprimiert, beides geht.
2. `node build.mjs` → schreibt `window.MODEL_SRC` (App: `models/…`, Artifact: data-URI nur solange alle GLB zusammen ≤ 1,5 MB, sonst Sprite-Fallback im Artifact) und kopiert nach `dist/models/`.
3. Aktivieren: `window.MON_RENDER='model'` (z. B. Konsole oder später Optionen). Standard bleibt `'sprite'`, bis der Nutzer das Pilotmodell freigibt (Schritt 6 oben). Kette: **model → sprite → proc** – fehlt das GLB oder lädt es nicht, greift automatisch das Bild bzw. der prozedurale Nachbau. In der Welt wird ein Modell ab ~15 Feldern Abstand zum Sprite (LOD).
4. Prüfen: Welt (Roamer/Begleiter), Kampf 3D, Dex/Team-„3D“-Ansicht (nutzt das GLB, sobald geladen) und `node test/unit_art.mjs`.

### Was 38-models.js mit dem Modell macht
- Laden: GLTFLoader + DRACOLoader + SkeletonUtils (three **r128** examples/js, global `THREE`) – erst beim ersten Bedarf. App: lokal `vendor/loaders|utils|libs/draco/gltf/` (aus npm three@0.128.0 kopiert, MIT-Lizenz). Artifact: `cdnjs …/three.js/r128/examples/js/…`, Ausweichpfad `cdn.jsdelivr.net/npm/three@0.128.0/examples/js/…` (cdnjs führt die examples nicht zuverlässig).
- Material: jede Fläche wird `MeshToonMaterial` mit dem 2-stufigen Kreaturen-Verlauf `monGrad()` (Kreaturen-Regel „gradientMap 2 Stufen“; `toonGrad()` ist der 3-stufige Welt-Verlauf). Farbe, Textur (`map`), Vertex-Farben, Emissive werden übernommen; dazu eine Umriss-Hülle (Rückseiten, ~0,014 Welt-Einheiten, auch mit Skinning). Glanzform tönt die Farben zur Glanz-Palette + Funkeln.
- Größe/Lage: auf die Dex-Größe skaliert (Welt `worldScale(id)`, Kampf `battleH`), Unterkante auf den Boden, horizontal zentriert. glTF schaut nach +Z, Kreaturen im Spiel nach −Z → Drehung π. Abweichungen je Modell in `MODEL_FIX[id]={ry,y,s}` (Drehung, Bodenversatz, Zusatzskalierung) eintragen.
- Animationen (AnimationMixer, weich überblendet): Clip-Namen werden erkannt an `idle|stand|breath|ruhe`, `walk|run|move|lauf`, `attack|atk|bite|strike|angriff`, `hit|hurt|damage|treffer`. Fehlt ein Clip, übernimmt prozedurales Wippen/Hüpfen/Ausfallschritt; Treffer-Blitz, K.O.-Kippen, Fang-Schrumpfen und Hüpfer gelten immer.
- Budget: Ziel 3–8k Dreiecke, ≤ 60 Meshes, eine Textur ≤ 1024 px. Jede Fläche + Umriss = 2 Draw-Calls.

### Sprite-Modus (Standard) – Kurzbeschreibung
- Kreaturen mit Bild (public/art, freigestellt) erscheinen in Welt und 3D-Kampf als Billboard: zur Kamera gedreht, leicht geneigt, Papierwende beim Richtungswechsel (`ART_FACE` in 26-art.js), Wippen ≤ 3 px, Lauf-Hüpfer, Treffer-Blitz, Glanz (Farbton-Drehung + Funkeln), weiches Ein-/Ausblenden, Kontaktschatten.
- Die gemalte helle Boden-Platte der Illustrationen wird zur Laufzeit entfernt (`artCut`), alle Bilder einer Szene liegen in einem Atlas (2048², 16 Plätze) → **1 Draw-Call** für alle Sprites. Bilder müssen von derselben Herkunft kommen (App/Artifact ja; `file://` sperrt Canvas-Pixel → automatischer Rückfall auf prozedural).
- Key-Art der Legenden/Mythischen (Hintergrund, nicht freigestellt) wird in 2D gerahmt gezeigt; in 3D bleibt der prozedurale Nachbau, bis ein freigestelltes Bild oder ein GLB kommt (freigestellte PNG/WebP mit Alpha werden automatisch als Sprite genutzt).
