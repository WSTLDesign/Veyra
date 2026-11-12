# Veyra – Bestandsaufnahme „Vollausbau“ (Stand 2026-11-09 nach Phase 3 + Kreaturen-Neuentwurf + Loop A1 Dex-Kanon)

| System | Status | Anmerkung |
|---|---|---|
| Wesenszüge (nature) | fehlt | – |
| Anlage-Werte (iv) / Trainings-Werte (ev) | fehlt | stat() nutzt nur Basiswerte + Level |
| Fähigkeiten normal/versteckt | teilweise | 8 passive Fähigkeiten, 1 je Art, keine versteckte |
| Geschlecht / Formvarianten | teilweise | Modell-Rendering vorhanden, wilde Kreaturen erhalten gender; Daten/Regeln Phase 3/4 |
| Glanzform (shiny) | teilweise | Rendering + Erscheinen + Fang (1/400 vorläufig); Quote 1:4096, Serie, Talisman fehlen (Phase 3) |
| Freundschaft | fehlt | – |
| Begleiter folgt | vorhanden | Pfadfolgen 2D/3D, Reaktionen (heal/storm/shiny/pet), Antippen |
| Kreaturenrufe | vorhanden | prozedural je Art (22-cries.js), Welt/Kampf/Viewer |
| Zucht / Eier / Schlüpfen | fehlt | – |
| Doppelkampf 2v2 | fehlt | Kampfkern ist 1v1 |
| Wetter-/Feldeffekte | teilweise | 6 Wetter visuell (09), noch ohne Kampf-/Begegnungswirkung |
| Lehr-Kristalle / Attacken-Lehrer / Erinnerer | fehlt | Attacken nur per Level; Zuordnung aus erlernter Liste existiert |
| Kooperativer Boss-Kampf | fehlt | – |
| Kreaturenbox (mehrere Boxen, Drag&Drop, Filter) | teilweise | G.box = eine flache Liste, Team↔Lager verschieben |
| Chronik-Dex (Lebensraum, Fundort, Größe, Ruf, Glanz) | teilweise | gesehen/gefangen, Beschreibung, 3D-Ansicht, Fortschrittsring |
| 8 Arenen mit Rätseln | teilweise | 4 Arenen ohne Rätsel, Liga Top-Drei + Champion |
| Rivale (5 Begegnungen) | teilweise | 1 Begegnung (Lio) |
| Bösewicht-Organisation | teilweise | Dämmerorden: Rekrut + Vargo |
| Postgame (Kampfturm, Gebiete, Talisman) | fehlt | Legenden-Quests vorhanden |
| Angeln | fehlt | – |
| Versteckte Items / Detektor / Beeren | teilweise | Item-NPCs sichtbar; keine versteckten, kein Nachwachsen |
| Weltwetter je Zone | fehlt | – |
| Trainer-Blickkontakt | teilweise | Sichtlinie + „!“ + Dialog + Kampf; Trainer läuft nicht heran, kein Musikwechsel |
| Musik pro Ort / Gegnerart, Crossfade | teilweise | 5 generative Stücke (Titel/Welt/Nacht/Kampf/Intro), harter Wechsel |
| Jingles | teilweise | SFX für Heilen/Fang/Level-up; keine eigenen Jingles für Entwicklung/Ei/Medaille/Glanz |
| Tausch-/Freundeskampf-Code | fehlt | – |
| Geschenk-Codes | fehlt | – |
| Medaillen / Tagesaufgaben / Spielzeit | fehlt | – |
| Picknick / Fotomodus / Spielfigur anpassen | fehlt | – |
| Spielstand-Slots / Export / Cloud | teilweise | 1 Slot localStorage + Autosave im Heilzentrum |
| Offline-fähig | vorhanden | PWA, alles inline |
| Lokalisierung DE/EN | fehlt | Texte hart kodiert (Deutsch) |
| docs/app-release.md | fehlt | – |

| Bewegungszustände (reiten/schwimmen/gleiten/klettern/Eis/Kanten) | vorhanden | Phase 2, 17-move.js; Freischaltung über Orden |
| Chronik-Menü (diegetisch, Hüllen) | vorhanden | Phase 2; Box/Medaillen-Seiten Platzhalter |
| Intro mit Charaktererstellung | vorhanden | Phase 2, 23-intro.js (G.outfit/G.name/G.rival) |
| Übergänge (Tür-Farbfade, Banner, Schnellreise, Fähre) | vorhanden | Phase 2 |
| NPC-Emotes, Sprechblasen, Anrufe, Schilder | vorhanden | Phase 2 |
| Kampf-UI (Echtzeit-Blüte, Lock-on, Runden-Karten, Chips) | vorhanden | Phase 2; Resonanz/Status/Wetter-Logik folgt in Phase 3 |

| Kampfkern (6 Werte, TYPE_CHART, Status, Wetter/Felder, Doppelkampf, Resonanz, KI) | vorhanden | Phase 3; nur Rundenkampf; Doppelkampf noch ohne Trainer-Inhalt |
| Wesenszüge / Anlage- & Trainings-Werte / Fähigkeiten (44) / Freundschaft / Glanz 1:4096 | vorhanden | Phase 3, 21-species.js, Migration |
| Fangkapseln (13 + 3, Kristalldesign), calcCatch, Fangsequenz, Werkbank | vorhanden | Phase 3, 24-capture.js |
| Entwicklung (9 Methoden, Verzweigungen, Sequenz, Abbruch) | vorhanden | Phase 3, 25-evolve.js; Dex-Kanon: alle Zielarten vorhanden (Frostwölk 120, Glutwölk 121, Glanzfell 123, Eisfee 124), Kanon-Linien immer per Level erreichbar |
| Level-up-/Heilstation-Sequenz | vorhanden | Phase 3 |
| Schwierigkeit leicht/normal | vorhanden | Standard leicht |
| Kreaturen-Design (40 Arten, Illustrationsstil, 16 Körpertypen) | vorhanden | Neuentwurf 2026-11-09, DESIGN-Tabelle in 10-mon3d.js |
| **Dex-Kanon: 153 Arten** (001–107 Nutzer, 108–139 Füll-Arten, 140–149 Legenden, 150–153 Mythische) | vorhanden | Loop A1 (Opus hoch): MONS in 01-data.js mit b6, Lernlisten, Fähigkeiten, Fangquote, Habitat (8 Regionen), Bild-Key; Tabelle docs/dex-kanon.md |
| Typ „Ursprung“ (Anzeige-Typ, kampfneutral) | vorhanden | TYPES.ursprung, TICON/PALETTE-Eintrag in 37-species-data.js |
| Signatur-Fähigkeiten/-Attacken der Legenden & Mythischen (14 + 14) | vorhanden | ABIL/MOVES in 01-data.js, Wirkung als Wrapper in 37-species-data.js |
| Spielstand-Migration alte Art-IDs → Kanon | vorhanden | ID_MAP + migrateKanon in 21-species.js (Team, Box, Eier, Dex, Glanz-Serie), g.dexKanon |
| Rivalen-Starter (G.starter, G.rivals) | vorbereitet | rivalStarters/ensureRivals (21), Starterwahl-Hook (37); Story nutzt sie noch nicht (Loop B) |
| Bilder 001–098 + 140–153 (Kanon-Nummern) | vorhanden | public/art/<Nr>_<name>.webp; ohne Bild: 002/003/005/006/058/060/062, 099–139 |
| Test test/unit_species.mjs | vorhanden | 33 Prüfungen (Felder, Typen, Evolutionen, BST-Monotonie, Bilder, Migration, Signatur-Fähigkeiten) |

| **Sprite-Modus (Standard, Loop A2)** – Kreaturen mit Bild als Billboard in Welt + 3D-Kampf | vorhanden | 10-mon3d.js: `MON_RENDER` 'sprite'/'model'/'proc' (Kette model→sprite→proc), 1 Atlas + 1 InstancedMesh je Szene, Platte entfernt (`artCut`), Papierwende nach `ART_FACE`, Wippen ≤ 3 px, Treffer-Blitz, Glanz, Ein-/Ausblenden, Kontaktschatten; route1 mit 7 Sprites + Begleiter ≈ 35 Draw-Calls |
| GLB-Pfad (public/models/<Nr>_<name>.glb) | vorbereitet | 38-models.js: GLTFLoader/DRACOLoader/SkeletonUtils r128 lokal (public/vendor) bzw. CDN (Artifact), Toon-Override + Umriss, Dex-Größe, Boden, AnimationMixer; Pilot 001_funki.glb folgt vom Nutzer, Test-Würfel test/fixtures/cube.glb |
| Bilder in 2D: Dex (Liste/Detail, Legenden gerahmt), Team/Detail/Lager, Fang-Karte, Kampf 2D (beide Seiten, Legende als Portrait-Karte), Begegnungs-Banner, Entwicklung, Starterwahl (3 Karten), Schlüpfen (`SEQ.hatch`) | vorhanden | 26-art.js; bildlose Arten zeigen das 3D-Vorschaubild in gleicher Rahmung; Dex-Nummern 3-stellig (`dexNr`) |
| Test test/unit_art.mjs + Screenshots test/art_*.png (art_shots.mjs, art_serve.mjs) | vorhanden | 20 Prüfungen (Bilder/404, hasArt, ART_FACE, Rahmen, Freistellung, Fallback-Kette, Instancing, Blickrichtung, GLB, Draw-Calls, Starterwahl, Schlüpfen) |
