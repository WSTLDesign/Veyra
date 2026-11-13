# Fundstücke: Lehrrollen, versteckte Wesen, Glitzer (Agent „Fundstücke“, Opus hoch)

Nutzerwunsch 10.11. 21:49: Bodenfunde sollen Abwechslung bringen – eine Attacke (auch die Feld-Attacken), ein verstecktes Wesen, Tränke oder eine Fangkapsel.

## Dateien
| Datei | Inhalt |
|---|---|
| `src/01-data.js` | ITEMS `rolle_<attacke>` (k `scroll`, `mv`, `field`, `t`, p 0) – 7 Feld-Rollen + 6 Kampf-Rollen |
| `src/02-world.js` | `FIND_NPCS` am Dateiende (neue Funde je Karte), 4 alte Funde auf `t:'sparkle'` umgestellt (it_r1, it_wk2, it_mb1, it_gs1) |
| `src/03-engine.js` | nur die `case 'item'`-Zeile in `talk`: `case 'item':case 'scroll':case 'hidden':case 'sparkle':if(FINDS[n.f]||FINDS[n.t])return pickFind(n);…` |
| `src/47-finds.js` | Logik: `FINDS`, `pickFind(n,rnd)`, Lehrrollen-UI, Glitzer-Würfel, Wiederkehr, `FIND_HINTS`, 3D-Variante |
| `src/styles-finds.css` | Rubrik „Rollen“, Lern-Auswahl, Dex-Hinweis (Build hängt `styles-*.css` an) |
| `tools/balance.mjs` | `findsReport()` / `printFinds()`; `node tools/balance.mjs funde` |
| `test/unit_finds.mjs` | 33 Prüfungen (VM) · `test/finds_shots.mjs` Screenshots |

## Fund-Arten (alle sehen aus wie das gelbe Fundstück – 3D mit leichter Formvariante)
| Daten | Verhalten | Flag | 3D-Variante (gleiche 2 Meshes, nur Geometrie/Material) |
|---|---|---|---|
| `t:'item'` | wie bisher: Gegenstand in die Tasche | `it_*` | Kapsel-Kristall; Heilmittel mintgrün |
| `t:'scroll'` | Lehrrolle in die Tasche (Menge 1) | `sc_*` | Pergamentrolle mit Ring in Typfarbe |
| `t:'hidden'` | „Da bewegt sich etwas!“ → Kampf mit seltener Art | `hd_*` (+ `hd_*_t` = Spielzeit) | raschelnder Busch mit Glitzerring |
| `t:'sparkle'` | Glitzer: Inhalt wird beim Aufheben gewürfelt | `it_*` | Spitzenstern |

Technik: 47-finds.js stellt beim Laden jede Fund-Art auf `t:'item'` + `f:<Art>` um (`findsNormalize()`). Grund: 2D-Zeichnung (08-gfx), 3D-Mesh und Animation (09-three3d), Ausblenden per Flag (`npcHidden`), Emote-Regel (23-intro), Figuren-Ausnahme (34-figures) und `foundItems`-Migration (21-species) kennen nur `'item'` und sind für diesen Agenten nur lesbar. So bleibt dort alles unverändert. Wer später Fund-NPCs zur Laufzeit ergänzt, ruft `findsNormalize()` erneut auf (die Hook-Zeile fängt auch nicht umgestellte Arten ab).

## Lehrrollen
- **Wiederverwendbar** (verbrauchen sich nicht). Begründung: Zielgruppe kleines Kind – keine Angst, die Rolle „falsch“ zu benutzen; eine Feld-Attacke kann man jederzeit einer zweiten Kreatur beibringen, wenn die erste in der Box ist. Nicht im Laden, Preis 0.
- **Feld-Rollen** (Liste aus `FIELD_MOVES`, 05-field.js, Agent Bewegung): jede Art mit Lern-Typ, unabhängig von der Stufe, über `fieldTeach(m,id)` → `m.known`; belegt **keinen** Kampfplatz. „Kann es schon“, wenn `fieldKnows` wahr ist (auch durch Stufe).
- **Kampf-Rollen**: passender Typ, Lernliste der Art oder Kern-Attacke. Bei 4 Attacken: „Welche soll Platz machen?“ – die alte Attacke bleibt unter „Erlernte Attacken“ und kann im Team-Fenster wieder gewählt werden.
- Tasche: eigene Rubrik **„Rollen“** (Feld-Rollen zuerst), Knopf „Lernen“ → Team-Karten mit „Kann es lernen / Kann es schon / Passt nicht“.
- `fdSyncScrolls()` bindet die Rollen-ITEMS an Name/ID aus `FIELD_MOVES` (Beschreibung = `use`). Für Feld-Attacken ohne MOVES-Eintrag legt 47-finds.js einen Rückfall-Eintrag an (Kampfwerte s. `FIELD_FALLBACK`) – nötig, weil das Team-Fenster (15-ui `rPane`) jede ID in `m.known` als `MOVES[id]` liest.

## Verteilung
Feld-Rollen in Spielreihenfolge (Vorgabe Dirigent):
| Rolle | Karte (x,y) | vor … |
|---|---|---|
| Rankenschnitt | Route 1 (1,11) | Dornenhecke/Baumstamm Route 1 |
| Leuchtfeuer | Kupferhain (18,14) | Nebelgrotte (Eingang Route 2) |
| Felsschub | Route 2 (18,8) | Geröll Route 2/3 |
| Wellenritt | Brisenhafen (1,11) | Windküsten-Pfad / Route 3 (Wasser) |
| Eisbrücke | Route 3 (18,11) | Frostheim |
| Kletterkralle | Windküsten-Pfad (1,4) | Felswände der Glutschlucht |
| Sturmflügel | Frostheim (1,13) | Kristallgebirge/Himmelsweiten (noch ohne Karten) |

Kampf-Rollen: Wellenschlag (Möwenbucht 18,10), Frostzahn (Frostheim 18,10), Glutwirbel (Glutschlucht 18,13, Ostteil – seit Loop C frei erreichbar), Donnerkeil (Route 4 18,3), Nachtbiss (Schattmoor 18,9), Blattwirbel (Flüstertal 2,20).

Versteckte Wesen (Arten auf keiner `enc`-Liste, keine Legenden, Stufe ≈ Obergrenze der Karte):
| Region | Karte (x,y) | Art | Lv |
|---|---|---|---|
| Lichtlande | Route 1 (18,1, hinter Baumstamm) | Lumli (028) | 5 |
| Lichtlande | Route 2 (1,1) | Fipsa (019) | 9 |
| Kristallgebirge | Nebelgrotte (18,3) | Krabbi (081) | 13 |
| Flutküste | Windküsten-Pfad (1,25) | Otti (137) | 21 |
| Flutküste | Möwenbucht (1,13) | Plitschi (078) | 21 |
| Frosttundra | Frostheim (1,1, hinter Geröll) | Flocki (125) | 25 |
| Frosttundra | Frostheim (18,12) | Kannli (129) | 25 |
| Glutlande | Glutschlucht (1,15) | Knister (049) | 28 |
| Glutlande | Glutschlucht (18,15) | Glimmo (108) | 29 |
| Schattenmoor | Route 4 (1,10) | Schumi (063) | 30 |
| Schattenmoor | Schattmoor (18,1) | Dochti (131) | 33 |
| Smaragdwald | Flüstertal (17,23) | Pilzlein (096) | 36 |

**Wiederkehr:** Nach Flucht, Niederlage oder Sieg ohne Fang kommt das Wesen nach **einem Spieltag** wieder (1440 s Spielzeit = 1440 Spielminuten; Prüfung beim Kartenwechsel `findsTick()`), Toast „… ist weggehuscht. Morgen ist es wieder da.“. Begründung: Ein Kind soll eine seltene Art nicht für immer verpassen; ein ganzer Tag Pause macht den Fund trotzdem besonders. Ist die Art gefangen, bleibt der Fund weg. Mit müden Kreaturen startet kein Kampf, der Fund bleibt liegen.

Glitzer (Gewichte): Fangkapsel 1–2 (30), Kräutertrank (25), Starker Kräutertrank (10), Beere 1–2 (Honigtau/Glanzbeere/Steinnuss/Federschote/Rankfrucht, 20), 100–300 ¤ (15). Je Glitzer im Mittel 0,45 Kapseln, 0,35 Heilmittel, 30 ¤.

Neue feste Gegenstände (mehr Kapsel-Sorten, je 1–2): Balsamkapsel (Kupferhain), Echokapsel (Nebelgrotte), Zündkapsel ×2 (Brisenhafen), Geduldkapsel (Route 3), Dämmerkapsel ×2 (Schattmoor), Herzkapsel (Flüstertal), Starker Kräutertrank (Route 4), Quellessenz (Siegesstraße). Neue Glitzer: Windküsten-Pfad, Route 4.

Balance (`node tools/balance.mjs funde`): Kapseln fest 24 + Glitzer ≈ 2,7 · Heilmittel fest 11 + Glitzer ≈ 2,1 · Beeren ≈ 1,8 · ≈ 180 ¤ – über 15 Karten verteilt, also rund 2 Kapseln je Karte. Gegenüber vorher: +8 Kapseln, Heilmittel leicht weniger (7 feste Tränke wurden zu Glitzer). Für „leicht“ angemessen, nicht zu großzügig.

## Dex-Hinweis
`FIND_HINTS[artId] = {map, region, text:'Irgendwo im Smaragdwald versteckt.'}` (Region aus `skyRegion(karte)`). 47-finds.js umhüllt `rDex` (15-ui.js unverändert) und hängt den Satz im Dex-Detail an, wenn die Art gesehen, aber nicht gefangen ist.

## Offene Punkte
- **Dex-Hinweis für ungesehene Arten** („???“-Felder öffnen kein Detail): bräuchte eine Änderung in 15-ui.js `rDex` (z. B. Tooltip/Detail für `FIND_HINTS[i]`). Der jetzige Weg ist ein Klick-Hook über `rDex`; sauberer wäre ein Aufruf in `dexDetail()`.
- **Himmelsweiten:** noch keine Karte → kein verstecktes Wesen dort (Kandidaten: Sternschnuppi 139, Flitzi 043, Zippi 114). Sturmflügel liegt deshalb in Frostheim.
- **2D-Modus:** alle Funde bleiben die gelbe Kugel (08-gfx nur lesbar).
- **Feld-Attacken im Team-Fenster:** Durch die Rückfall-MOVES erscheinen gelernte Feld-Attacken unter „Erlernte Attacken“ und könnten auf einen Kampfplatz gelegt werden. Agent Bewegung entscheidet, ob 15-ui sie ausblenden soll (dann MOVES-Einträge trotzdem behalten, sonst bricht `rPane`).
- Regionszuordnung kommt aus `SKY_MAPREG` (44-sky.js); Kupferhain/Route 2 zählen derzeit zu den Lichtlanden.
