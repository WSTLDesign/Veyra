# Veyra – Dex-Kanon (Stand 09.11.2026, Agent A1 „Dex-Kanon & Daten“, Opus hoch)

Quelle der Namen: docs/kreaturen-kanon.md (Nutzer) + DEX-KANON-Tabelle und Lieferungen 1–31 in AGENTS.md. Die Nummer ist der Index in `MONS` (src/01-data.js).
Bilder: `public/art/<Nr>_<name>.webp` (3-stellig, z. B. `001_funki.webp`) → `window.ART_SRC[<Nr>]`. Alte Spielstände werden per `ID_MAP` (src/21-species.js) umgestellt.

**Umfang: 153 Arten** – 001–107 Nutzer-Kanon · 108–139 Füll-Arten (eigene Entwürfe im Nutzer-Stil, jederzeit durch neue Nutzer-Linien ersetzbar) · 140–149 Legenden · 150–153 Mythische (Typ „Ursprung“ = Anzeige-Typ, kampfneutral ×1).

## Namensentscheidungen
- Nutzer-Namen sind verbindlich. Vom Agenten vergeben (fehlende Mittelstufen / Linien ohne Kanon-Namen): **050 Brutzel**, **053 Quallio** (Nutzer-Name aus der Dublette „Quappi → Quallio“ – keine Doppel-Linie), **065 Sternheuler**, **067 Kristallschild**, **070 Goldschwinge**, **079 Wogenwal**, **082 Scherenwacht**, **085 Kiemling**, **088 Waldgreif**, **090–092 Moosel → Moosgolem → Kristallbär**, **093–095 Wellchen → Riffschwimmer → Gezeitenkönig**, **096–098 Pilzlein → Glimmerpilz → Laternenpilz**, **099–101 Welli → Gischtwolf → Azurion** (Flut-Wolf, Tareks Begleiter), **102–104 Dornwelp → Dornwolf → Rubindorn** (Ordens-Linie), **105–107 Kitzli → Blatthirsch → Lichthirsch** (Elowens Linie).
- Kollisionen: zweites „Wirbel“ (Sprudel → Wirbel) heißt **110 Sprudel → 111 Strudelo**. **Sylvarok** entfällt (009 heißt Blühro). **Aurelion** geht in **062 Strahli** auf, **Solaryn** in **142 Ignivar**, **Kristallin** in **011 Dornox**, **Prismalin** in **053 Quallio**, Nocturyx → **147 Noctyra**, Tempestar → **144 Aetherion** (nur Spielstand-Umstellung). Arenaleiter Lumen heißt im Spiel **Solan** (Legende 149 behält „Aureon“).
- Aliasse (Feld `alias`): 001 Funki = „Funkel“, 004 Plippi = „Plätscha“.
- **146 „Glacira“** ist Arbeitstitel des Frost-Wächters (Eishirsch mit Kristallgeweih, Begegnung Nordlichtsee bei Polarlicht); Bilddatei bleibt `146_frostwaechter.webp`, bis der Nutzer den Namen nennt.
- Typen nach Kanon: 025–027 sind reine Böe (alter Hinweis „Sturmwisp Böe/Volt“ überholt), Starter-Endstufen bleiben einfarbig (Glut/Flut/Flora).

## Entwicklung (Kurzregel)
Jede Kanon-Linie ist per Level erreichbar (`ev`). Sonderwege sind Abkürzungen oder Zweige für „Tareks Experimente“ (EVO_DEF in src/25-evolve.js): Kristall, Freundschaft (+Tageszeit), Ort, Getragen (+Tageszeit), Attacke, Geschlecht, Tausch, Spezial-Training (9 Methoden).

## Signatur-Fähigkeiten (Wirkung in src/37-species-data.js)
Lunaris **Sternenwacht** (Team schläft nie ein, nachts Lumen +20 %) · Thalor **Gezeitenwacht** (Regen, bei Regen +1/8 KP) · Ignivar **Glutwiege** (1× pro Kampf mit halben KP wieder auf) · Sylvaris **Lebenshauch** (Team +1/16 KP je Runde) · Aetherion **Sturmhüter** (Gewitter, Böe +30 %) · Crystalon **Kristallwall** (Team −20 % Schaden) · Glacira **Firnkrone** (Schnee, Frost +20 %) · Noctyra **Sternenschleier** (Gegner treffen 15 % seltener) · Floravon **Waldsaat** (Blütenwiese 8 Runden) · Aureon **Lichtwind** (Böe wirkt auch wie Lumen, +20 %) · Auralis **Gleichgewicht** (Attacken nehmen das Schwäche-Element an) · Terravon **Urwuchs** (Blütenwiese + Team-Heilung) · Solaryx **Ewiges Licht** (Schatten-Schaden ×0,5, +1/16 KP) · Umbryx **Zwielicht** (Schatten/Lumen wirken neutral).
Signatur-Attacken (ab L40): Sternenregen, Gezeitenwoge, Phönixglut, Lebensblüte, Sturmschwinge, Kristallbrecher, Polarschein, Mondschleier, Waldkrone, Greifenlicht, Urlicht (Ursprung), Urzeitbeben, Sonnenthron, Eklipse.

## Tabelle
| Nr. | Name | Typ | Stufe / Linie | Entwicklung | Region: Habitat (Methode) | Bild | alte ID | BST |
|---|---|---|---|---|---|---|---|---|
| 001 | Funki („Funkel“) | Glut | 1/3 (Funki → Loddo → Flammel) | → Loddo ab L16 | Glutlande: aurenstadt, aschental (starter) | ja | 1 | 315 |
| 002 | Loddo | Glut | 2/3 (Funki → Loddo → Flammel) | → Flammel ab L34 | Glutlande: aschental (entwicklung) | nein | 2 | 410 |
| 003 | Flammel | Glut | 3/3 (Funki → Loddo → Flammel) | – | Glutlande: aschental (entwicklung) | nein | 3 | 530 |
| 004 | Plippi („Plätscha“) | Flut | 1/3 (Plippi → Wabbel → Aquilo) | → Wabbel ab L16 | Flutküste: aurenstadt, muschelbucht (starter) | ja | 4 | 315 |
| 005 | Wabbel | Flut | 2/3 (Plippi → Wabbel → Aquilo) | → Aquilo ab L34 | Flutküste: muschelbucht (entwicklung) | nein | 5 | 410 |
| 006 | Aquilo | Flut | 3/3 (Plippi → Wabbel → Aquilo) | – | Flutküste: muschelbucht (entwicklung) | nein | 6 | 530 |
| 007 | Knospi | Flora | 1/3 (Knospi → Rankel → Blühro) | → Rankel ab L16 | Smaragdwald: aurenstadt, bluetenhain (starter) | ja | 7 | 315 |
| 008 | Rankel | Flora | 2/3 (Knospi → Rankel → Blühro) | → Blühro ab L34 | Smaragdwald: bluetenhain (entwicklung) | ja | 8 | 410 |
| 009 | Blühro | Flora | 3/3 (Knospi → Rankel → Blühro) | – | Smaragdwald: bluetenhain (entwicklung) | ja | 9 | 530 |
| 010 | Krumo | Fels | 1/3 (Krumo → Dornox → Granthor) | → Dornox ab L18 | Kristallgebirge: kristallwacht, tiefenmine (gras) | ja | – | 310 |
| 011 | Dornox | Fels/Frost | 2/3 (Krumo → Dornox → Granthor) | → Granthor ab L38 | Frosttundra: gletschergrat (gras) | ja | 37 | 410 |
| 012 | Granthor | Fels/Frost | 3/3 (Krumo → Dornox → Granthor) | – | Frosttundra: gletschergrat (entwicklung) | ja | – | 525 |
| 013 | Aschi | Glut | 1/3 (Aschi → Kohlo → Brandor) | → Kohlo ab L16 | Glutlande: aschental, glutheim (gras) | ja | – | 310 |
| 014 | Kohlo | Glut | 2/3 (Aschi → Kohlo → Brandor) | → Brandor ab L34 | Glutlande: aschental (gras) | ja | – | 410 |
| 015 | Brandor | Glut | 3/3 (Aschi → Kohlo → Brandor) | – | Glutlande: emberklamm (entwicklung) | ja | – | 525 |
| 016 | Molli | Flut | 1/3 (Molli → Blubbo → Strömi) | → Blubbo ab L16 | Smaragdwald: lichtquell (gras) | ja | – | 310 |
| 017 | Blubbo | Flut | 2/3 (Molli → Blubbo → Strömi) | → Strömi ab L36 | Flutküste: leuchtturmklippen (gras) | ja | – | 410 |
| 018 | Strömi | Flut/Böe | 3/3 (Molli → Blubbo → Strömi) | – | Flutküste: leuchtturmklippen (entwicklung) | ja | – | 525 |
| 019 | Fipsa | Flora | 1/3 (Fipsa → Blattin → Kronella) | → Blattin ab L16 | Smaragdwald: feenlichtung, bluetenhain (gras) | ja | – | 310 |
| 020 | Blattin | Flora | 2/3 (Fipsa → Blattin → Kronella) | → Kronella ab L34 | Smaragdwald: feenlichtung (gras) | ja | – | 410 |
| 021 | Kronella | Flora | 3/3 (Fipsa → Blattin → Kronella) | – | Smaragdwald: feenlichtung (entwicklung) | ja | – | 525 |
| 022 | Kiesel | Fels/Kern | 1/3 (Kiesel → Brummit → Basalor) | → Brummit ab L20; Tausch → Brummit | Kristallgebirge: kristallwacht, tiefenmine (hoehle) | ja | 33 | 310 |
| 023 | Brummit | Fels | 2/3 (Kiesel → Brummit → Basalor) | → Basalor ab L40 | Kristallgebirge: tiefenmine (hoehle) | ja | 34 | 410 |
| 024 | Basalor | Fels | 3/3 (Kiesel → Brummit → Basalor) | – | Kristallgebirge: tiefenmine (entwicklung) | ja | – | 525 |
| 025 | Pusti | Böe | 1/3 (Pusti → Wirbel → Sturmilo) | → Wirbel ab L20 | Himmelsweiten: windfels, himmelsbruecke (gras) | ja | 31 | 315 |
| 026 | Wirbel | Böe | 2/3 (Pusti → Wirbel → Sturmilo) | → Sturmilo ab L36 | Himmelsweiten: himmelsbruecke (gras) | ja | 32 | 420 |
| 027 | Sturmilo | Böe | 3/3 (Pusti → Wirbel → Sturmilo) | – | Himmelsweiten: sturmklippe (entwicklung) | ja | – | 530 |
| 028 | Lumli | Lumen | 1/3 (Lumli → Glimma → Solaro) | → Glimma ab L16; Lichtstein → Glimma | Lichtlande: goldbluetenpark, sonnenfels (gras, tags) | ja | – | 310 |
| 029 | Glimma | Lumen | 2/3 (Lumli → Glimma → Solaro) | → Solaro ab L36 | Lichtlande: goldbluetenpark (gras, tags) | ja | – | 410 |
| 030 | Solaro | Lumen/Glut | 3/3 (Lumli → Glimma → Solaro) | – | Lichtlande: sonnenfels (entwicklung, tags) | ja | – | 525 |
| 031 | Dumbi | Schatten | 1/3 (Dumbi → Noxli → Mondoro) | → Noxli ab L18; Dunkelstein / 20× Schattenkralle → Noxli | Schattenmoor: schattenhain, daemmerbruch (gras, nachts) | ja | 20 | 310 |
| 032 | Noxli | Schatten | 2/3 (Dumbi → Noxli → Mondoro) | → Mondoro ab L36 | Schattenmoor: schattenhain (gras, nachts) | ja | 21 | 410 |
| 033 | Mondoro | Schatten/Lumen | 3/3 (Dumbi → Noxli → Mondoro) | – | Schattenmoor: schattenhain (entwicklung, nachts) | ja | 41 | 525 |
| 034 | Zischi | Glut/Fels | 1/3 (Zischi → Funaro → Vulkanjo) | → Funaro ab L20 | Glutlande: aschental, emberklamm (gras) | ja | 36 | 310 |
| 035 | Funaro | Glut/Fels | 2/3 (Zischi → Funaro → Vulkanjo) | → Vulkanjo ab L40 | Glutlande: emberklamm (gras) | ja | – | 410 |
| 036 | Vulkanjo | Glut/Fels | 3/3 (Zischi → Funaro → Vulkanjo) | – | Glutlande: flammenkrone (entwicklung) | ja | – | 525 |
| 037 | Muschel | Flut | 1/3 (Muschel → Perlo → Korallux) | → Perlo ab L22; in Möwenbucht → Perlo | Flutküste: korallenriff, muschelbucht (wasser) | ja | 26 | 310 |
| 038 | Perlo | Flut/Fels | 2/3 (Muschel → Perlo → Korallux) | → Korallux ab L38 | Flutküste: korallenriff (wasser) | ja | 27 | 410 |
| 039 | Korallux | Flut/Fels | 3/3 (Muschel → Perlo → Korallux) | – | Flutküste: korallenriff (entwicklung) | ja | – | 525 |
| 040 | Tilli | Flora | 1/3 (Tilli → Sonnblatt → Floralis) | → Sonnblatt ab L18 | Smaragdwald: bluetenhain, wurzelheim (gras) | ja | – | 310 |
| 041 | Sonnblatt | Flora/Fels | 2/3 (Tilli → Sonnblatt → Floralis) | → Floralis ab L38 | Smaragdwald: bluetenhain (gras) | ja | – | 410 |
| 042 | Floralis | Flora/Fels | 3/3 (Tilli → Sonnblatt → Floralis) | – | Smaragdwald: wurzelheim (entwicklung) | ja | – | 525 |
| 043 | Flitzi | Böe | 1/3 (Flitzi → Federel → Himmora) | → Federel ab L20 | Himmelsweiten: wolkenruh, adlerhorst (gras, tags) | ja | – | 310 |
| 044 | Federel | Böe/Lumen | 2/3 (Flitzi → Federel → Himmora) | → Himmora ab L40 | Himmelsweiten: adlerhorst (gras) | ja | – | 410 |
| 045 | Himmora | Böe/Lumen | 3/3 (Flitzi → Federel → Himmora) | – | Himmelsweiten: adlerhorst (entwicklung) | ja | – | 525 |
| 046 | Mumpi | Flut | 1/3 (Mumpi → Nebbel → Dämmerin) | → Nebbel ab L16 | Schattenmoor: morastplateau (wasser) | ja | – | 310 |
| 047 | Nebbel | Flut/Flora | 2/3 (Mumpi → Nebbel → Dämmerin) | → Dämmerin ab L36 | Schattenmoor: morastplateau (wasser, nachts) | ja | – | 410 |
| 048 | Dämmerin | Flut/Flora | 3/3 (Mumpi → Nebbel → Dämmerin) | – | Schattenmoor: morastplateau (entwicklung) | ja | – | 525 |
| 049 | Knister | Glut | 1/3 (Knister → Brutzel → Funkoro) | → Brutzel ab L18 | Glutlande: aschental (gras, nachts) | ja | – | 310 |
| 050 | Brutzel | Glut/Fels | 2/3 (Knister → Brutzel → Funkoro) | → Funkoro ab L38 | Glutlande: aschental (gras) | ja | – | 410 |
| 051 | Funkoro | Glut/Fels | 3/3 (Knister → Brutzel → Funkoro) | – | Glutlande: aschental (entwicklung) | ja | – | 525 |
| 052 | Glibbi | Flut | 1/3 (Glibbi → Quallio → Lumedusa) | → Quallio ab L16 | Flutküste: korallenriff (wasser, nachts) | ja | – | 310 |
| 053 | Quallio | Flut/Lumen | 2/3 (Glibbi → Quallio → Lumedusa) | → Lumedusa ab L36 | Schattenmoor: morastplateau (wasser, nachts) | ja | 39 | 410 |
| 054 | Lumedusa | Flut/Lumen | 3/3 (Glibbi → Quallio → Lumedusa) | – | Flutküste: korallenriff (entwicklung) | ja | – | 525 |
| 055 | Wurzel | Flora | 1/2 (Wurzel → Wurzelin) | → Wurzelin ab L30 | Smaragdwald: feenlichtung, altwurzeltempel (gras) | ja | – | 330 |
| 056 | Wurzelin | Flora | 2/2 (Wurzel → Wurzelin) | – | Smaragdwald: altwurzeltempel (entwicklung) | ja | – | 500 |
| 057 | Knackel | Fels | 1/2 (Knackel → Brocken) | → Brocken ab L25 | Kristallgebirge: bergwohnviertel, kristallwacht (gras) | ja | 16 | 305 |
| 058 | Brocken | Fels | 2/2 (Knackel → Brocken) | – | Kristallgebirge: tiefenmine (hoehle) | nein | 17 | 480 |
| 059 | Flausch | Böe/Kern | 1/2 (Flausch → Wolkito) | → Wolkito ab L18 | Himmelsweiten: wolkenruh, windfels (gras) | ja | 10 | 300 |
| 060 | Wolkito | Böe/Kern | 2/2 (Flausch → Wolkito) | – | Himmelsweiten: wolkenruh (gras) | nein | 11 | 470 |
| 061 | Blinki | Lumen | 1/2 (Blinki → Strahli) | → Strahli ab L24; Freundschaft (tags) / Lichtstein → Strahli | Lichtlande: goldbluetenpark, lichtbrunn (gras) | ja | 22 | 305 |
| 062 | Strahli | Lumen | 2/2 (Blinki → Strahli) | – | Lichtlande: goldbluetenpark (gras) | nein | 23 | 475 |
| 063 | Schumi | Schatten | 1/3 (Schumi → Düstro → Sternheuler) | → Düstro ab L16 | Schattenmoor: schattenhain, nebelholm (gras, nachts) | ja | – | 310 |
| 064 | Düstro | Schatten | 2/3 (Schumi → Düstro → Sternheuler) | → Sternheuler ab L36 | Schattenmoor: schattenhain (gras, nachts) | ja | – | 410 |
| 065 | Sternheuler | Schatten/Lumen | 3/3 (Schumi → Düstro → Sternheuler) | – | Schattenmoor: mondklippe (entwicklung, nachts) | ja | – | 525 |
| 066 | Aquakrist | Flut | 1/3 (Aquakrist → Kristallschild → Kristallux) | → Kristallschild ab L18 | Kristallgebirge: amethystgrotte, kristallwacht (wasser) | ja | – | 310 |
| 067 | Kristallschild | Flut/Fels | 2/3 (Aquakrist → Kristallschild → Kristallux) | → Kristallux ab L38 | Kristallgebirge: amethystgrotte (wasser) | ja | – | 410 |
| 068 | Kristallux | Flut/Fels | 3/3 (Aquakrist → Kristallschild → Kristallux) | – | Kristallgebirge: amethystgrotte (entwicklung) | ja | – | 525 |
| 069 | Federling | Böe | 1/3 (Federling → Goldschwinge → Auregrif) | → Goldschwinge ab L18 | Himmelsweiten: adlerhorst, sturmhafen (gras, tags) | ja | – | 315 |
| 070 | Goldschwinge | Böe | 2/3 (Federling → Goldschwinge → Auregrif) | → Auregrif ab L38 | Himmelsweiten: adlerhorst (gras) | ja | – | 420 |
| 071 | Auregrif | Böe/Lumen | 3/3 (Federling → Goldschwinge → Auregrif) | – | Himmelsweiten: himmelsfeste (entwicklung) | ja | – | 530 |
| 072 | Knips | Volt | 1/3 (Knips → Blitzmähne → Blitzahn) | → Blitzmähne ab L16; Donnerstein / 3 Volltreffer → Blitzmähne; trägt Lichtstein tags → Glanzfell | Himmelsweiten: sturmhafen, himmelsbruecke (gras) | ja | 14 | 310 |
| 073 | Blitzmähne | Volt | 2/3 (Knips → Blitzmähne → Blitzahn) | → Blitzahn ab L36 | Himmelsweiten: sturmhafen (gras) | ja | 15 | 410 |
| 074 | Blitzahn | Volt/Böe | 3/3 (Knips → Blitzmähne → Blitzahn) | – | Himmelsweiten: sturmklippe (entwicklung) | ja | – | 525 |
| 075 | Frosti | Frost | 1/3 (Frosti → Glazirr → Kristallo) | → Glazirr ab L16; Froststein → Eisfee | Frosttundra: gletschergrat, eiswacht (gras) | ja | 18 | 310 |
| 076 | Glazirr | Frost/Böe | 2/3 (Frosti → Glazirr → Kristallo) | → Kristallo ab L38 | Frosttundra: gletschergrat (gras) | ja | 19 | 415 |
| 077 | Kristallo | Frost/Böe | 3/3 (Frosti → Glazirr → Kristallo) | – | Frosttundra: gletschergrat (entwicklung) | ja | – | 535 |
| 078 | Plitschi | Flut | 1/3 (Plitschi → Wogenwal → Ozeano) | → Wogenwal ab L18 | Flutküste: korallenriff, azurhafen (wasser) | ja | – | 315 |
| 079 | Wogenwal | Flut | 2/3 (Plitschi → Wogenwal → Ozeano) | → Ozeano ab L40 | Flutküste: korallenriff (wasser) | ja | – | 415 |
| 080 | Ozeano | Flut/Flora | 3/3 (Plitschi → Wogenwal → Ozeano) | – | Flutküste: offenes_meer (entwicklung) | ja | – | 530 |
| 081 | Krabbi | Fels | 1/3 (Krabbi → Scherenwacht → Krystak) | → Scherenwacht ab L18 | Kristallgebirge: tiefenmine, kristallwacht (gras) | ja | – | 310 |
| 082 | Scherenwacht | Fels | 2/3 (Krabbi → Scherenwacht → Krystak) | → Krystak ab L40 | Kristallgebirge: tiefenmine (hoehle) | ja | – | 415 |
| 083 | Krystak | Fels/Glut | 3/3 (Krabbi → Scherenwacht → Krystak) | – | Kristallgebirge: tiefenmine (entwicklung) | ja | – | 530 |
| 084 | Axelli | Flut | 1/3 (Axelli → Kiemling → Lumaxel) | → Kiemling ab L16 | Smaragdwald: lichtquell (wasser) | ja | – | 310 |
| 085 | Kiemling | Flut/Lumen | 2/3 (Axelli → Kiemling → Lumaxel) | → Lumaxel ab L36 | Smaragdwald: lichtquell (wasser) | ja | – | 410 |
| 086 | Lumaxel | Flut/Lumen | 3/3 (Axelli → Kiemling → Lumaxel) | – | Smaragdwald: lichtquell (entwicklung) | ja | – | 525 |
| 087 | Eulumi | Flora/Böe | 1/3 (Eulumi → Waldgreif → Waldorakel) | → Waldgreif ab L18 | Smaragdwald: feenlichtung, wurzelheim (gras, nachts) | ja | – | 310 |
| 088 | Waldgreif | Flora/Böe | 2/3 (Eulumi → Waldgreif → Waldorakel) | → Waldorakel ab L38 | Smaragdwald: wurzelheim (gras) | ja | – | 410 |
| 089 | Waldorakel | Flora/Böe | 3/3 (Eulumi → Waldgreif → Waldorakel) | – | Smaragdwald: altwurzeltempel (entwicklung) | ja | – | 525 |
| 090 | Moosel | Flora | 1/3 (Moosel → Moosgolem → Kristallbär) | → Moosgolem ab L20; Blattstein / ♂ ab L16 → Moosgolem | Kristallgebirge: bergwohnviertel, tiefenmine (gras) | ja | 24 | 310 |
| 091 | Moosgolem | Flora/Fels | 2/3 (Moosel → Moosgolem → Kristallbär) | → Kristallbär ab L38 | Smaragdwald: altwurzeltempel (gras) | ja | 25 | 410 |
| 092 | Kristallbär | Flora/Fels | 3/3 (Moosel → Moosgolem → Kristallbär) | – | Kristallgebirge: kristallwacht (entwicklung) | ja | – | 525 |
| 093 | Wellchen | Flut | 1/3 (Wellchen → Riffschwimmer → Gezeitenkönig) | → Riffschwimmer ab L18 | Flutküste: perleninsel (wasser) | ja | – | 310 |
| 094 | Riffschwimmer | Flut | 2/3 (Wellchen → Riffschwimmer → Gezeitenkönig) | → Gezeitenkönig ab L38 | Flutküste: perleninsel (wasser) | ja | – | 410 |
| 095 | Gezeitenkönig | Flut | 3/3 (Wellchen → Riffschwimmer → Gezeitenkönig) | – | Flutküste: perleninsel (entwicklung) | ja | – | 525 |
| 096 | Pilzlein | Flora | 1/3 (Pilzlein → Glimmerpilz → Laternenpilz) | → Glimmerpilz ab L16 | Smaragdwald: feenlichtung (gras, nachts) | ja | – | 310 |
| 097 | Glimmerpilz | Flora/Lumen | 2/3 (Pilzlein → Glimmerpilz → Laternenpilz) | → Laternenpilz ab L36 | Smaragdwald: feenlichtung (gras, nachts) | ja | – | 410 |
| 098 | Laternenpilz | Flora/Lumen | 3/3 (Pilzlein → Glimmerpilz → Laternenpilz) | – | Smaragdwald: feenlichtung (entwicklung, nachts) | ja | – | 525 |
| 099 | Welli | Flut | 1/3 (Welli → Gischtwolf → Azurion) | → Gischtwolf ab L18 | Flutküste: leuchtturmklippen (geschenk) | nein | – | 310 |
| 100 | Gischtwolf | Flut | 2/3 (Welli → Gischtwolf → Azurion) | → Azurion ab L38 | Flutküste: leuchtturmklippen (gras) | nein | – | 410 |
| 101 | Azurion | Flut/Lumen | 3/3 (Welli → Gischtwolf → Azurion) | – | Flutküste: leuchtturmklippen (entwicklung) | nein | – | 525 |
| 102 | Dornwelp | Schatten | 1/3 (Dornwelp → Dornwolf → Rubindorn) | → Dornwolf ab L18 | Kristallgebirge: varkons_festung (event, nachts) | nein | – | 315 |
| 103 | Dornwolf | Schatten/Fels | 2/3 (Dornwelp → Dornwolf → Rubindorn) | → Rubindorn ab L38 | Kristallgebirge: kristallkammern (event, nachts) | nein | – | 415 |
| 104 | Rubindorn | Schatten/Fels | 3/3 (Dornwelp → Dornwolf → Rubindorn) | – | Kristallgebirge: varkons_festung (entwicklung, nachts) | nein | – | 530 |
| 105 | Kitzli | Flora | 1/3 (Kitzli → Blatthirsch → Lichthirsch) | → Blatthirsch ab L18; Freundschaft (tags) → Blatthirsch | Smaragdwald: bluetenhain (geschenk, tags) | nein | – | 310 |
| 106 | Blatthirsch | Flora | 2/3 (Kitzli → Blatthirsch → Lichthirsch) | → Lichthirsch ab L38 | Smaragdwald: feenlichtung (gras, tags) | nein | – | 410 |
| 107 | Lichthirsch | Flora/Lumen | 3/3 (Kitzli → Blatthirsch → Lichthirsch) | – | Smaragdwald: altwurzeltempel (entwicklung) | nein | – | 525 |
| 108 | Glimmo | Glut/Flora | 1/2 (Glimmo → Feuerblatt) | → Feuerblatt ab L24 | Glutlande: glutheim (gras) | nein | – | 320 |
| 109 | Feuerblatt | Glut/Flora | 2/2 (Glimmo → Feuerblatt) | – | Glutlande: glutheim (entwicklung) | nein | – | 485 |
| 110 | Sprudel | Flut | 1/2 (Sprudel → Strudelo) | → Strudelo ab L22 | Flutküste: azurhafen, muschelbucht (wasser) | nein | – | 320 |
| 111 | Strudelo | Flut | 2/2 (Sprudel → Strudelo) | – | Flutküste: azurhafen (entwicklung) | nein | – | 485 |
| 112 | Knabbi | Kern | 1/2 (Knabbi → Nagnox) | → Nagnox ab L20; trägt Dunkelstein nachts → Nagnox | Lichtlande: aurenstadt, sternenplatz (gras) | nein | 12 | 305 |
| 113 | Nagnox | Kern/Schatten | 2/2 (Knabbi → Nagnox) | – | Schattenmoor: nebelholm (gras, nachts) | nein | 13 | 460 |
| 114 | Zippi | Volt | 1/2 (Zippi → Voltfink) | → Voltfink ab L20; kennt Blitzsprung → Voltfink | Himmelsweiten: sturmhafen (gras) | nein | – | 295 |
| 115 | Voltfink | Volt/Böe | 2/2 (Zippi → Voltfink) | – | Himmelsweiten: sturmhafen (gras) | nein | 35 | 470 |
| 116 | Huschu | Schatten/Böe | 1/2 (Huschu → Nachtkauz) | → Nachtkauz ab L22; Freundschaft (nachts) → Nachtkauz | Schattenmoor: nebelholm, daemmerbruch (gras, nachts) | nein | – | 300 |
| 117 | Nachtkauz | Schatten/Böe | 2/2 (Huschu → Nachtkauz) | – | Schattenmoor: ruinen_der_alten (gras, nachts) | nein | 38 | 475 |
| 118 | Wölki | Böe | 1/2 (Wölki → Wolkenwoll) | → Wolkenwoll ab L22; Ort Frostheim → Frostwölk; Lichtstein → Wolkengeist; trägt Glutkern tags → Glutwölk | Himmelsweiten: wolkenruh (gras) | nein | – | 295 |
| 119 | Wolkenwoll | Böe | 2/2 (Wölki → Wolkenwoll) | – | Himmelsweiten: wolkenruh (entwicklung) | nein | – | 470 |
| 120 | Frostwölk | Böe/Frost | Zweig (Stufe 2) | – | Frosttundra: eiswacht (entwicklung) | nein | – | 480 |
| 121 | Glutwölk | Böe/Glut | Zweig (Stufe 2) | – | Glutlande: glutheim (entwicklung, tags) | nein | – | 480 |
| 122 | Wolkengeist | Böe/Lumen | Zweig (Stufe 2) | – | Himmelsweiten: himmelsfeste (entwicklung, tags) | nein | 40 | 495 |
| 123 | Glanzfell | Volt/Lumen | Zweig (Stufe 2) | – | Lichtlande: sonnenfels (entwicklung, tags) | nein | – | 495 |
| 124 | Eisfee | Frost/Lumen | Zweig (Stufe 2) | – | Frosttundra: nordlichtsee (entwicklung, nachts) | nein | – | 495 |
| 125 | Flocki | Frost | 1/2 (Flocki → Firnhase) | → Firnhase ab L24 | Frosttundra: eiswacht, nordlichtsee (gras) | nein | – | 320 |
| 126 | Firnhase | Frost/Böe | 2/2 (Flocki → Firnhase) | – | Frosttundra: nordlichtsee (gras) | nein | – | 485 |
| 127 | Summsi | Volt | 1/2 (Summsi → Brummblitz) | → Brummblitz ab L22 | Himmelsweiten: wolkenruh, himmelsbruecke (gras, tags) | nein | – | 320 |
| 128 | Brummblitz | Volt/Böe | 2/2 (Summsi → Brummblitz) | – | Himmelsweiten: himmelsbruecke (gras, tags) | nein | – | 485 |
| 129 | Kannli | Kern | 1/2 (Kannli → Teekrug) | → Teekrug ab L30; Tausch → Teekrug | Frosttundra: quellental (gras) | nein | – | 320 |
| 130 | Teekrug | Kern/Flut | 2/2 (Kannli → Teekrug) | – | Frosttundra: quellental (gras) | nein | – | 485 |
| 131 | Dochti | Glut/Schatten | 1/2 (Dochti → Kerzwacht) | → Kerzwacht ab L26; 15× Funken → Kerzwacht | Schattenmoor: daemmerbruch, ruinen_der_alten (gras, nachts) | nein | – | 320 |
| 132 | Kerzwacht | Glut/Schatten | 2/2 (Dochti → Kerzwacht) | – | Schattenmoor: ruinen_der_alten (gras, nachts) | nein | – | 485 |
| 133 | Schnecki | Fels | 1/2 (Schnecki → Turmschneck) | → Turmschneck ab L26 | Kristallgebirge: bergwohnviertel (gras) | nein | – | 320 |
| 134 | Turmschneck | Fels/Flora | 2/2 (Schnecki → Turmschneck) | – | Smaragdwald: altwurzeltempel (gras) | nein | – | 485 |
| 135 | Flatti | Schatten | 1/2 (Flatti → Laternenflatter) | → Laternenflatter ab L24; trägt Dunkelstein nachts → Laternenflatter | Schattenmoor: daemmerbruch, nebelholm (gras, nachts) | nein | – | 320 |
| 136 | Laternenflatter | Schatten/Lumen | 2/2 (Flatti → Laternenflatter) | – | Schattenmoor: daemmerbruch (gras, nachts) | nein | – | 485 |
| 137 | Otti | Flut | 1/2 (Otti → Schollotter) | → Schollotter ab L24; Ort Frostheim → Schollotter | Flutküste: muschelbucht (wasser) | nein | – | 320 |
| 138 | Schollotter | Flut/Frost | 2/2 (Otti → Schollotter) | – | Frosttundra: nordlichtsee (wasser) | nein | – | 485 |
| 139 | Sternschnuppi | Lumen/Böe | einstufig | – | Himmelsweiten: himmelsfeste (selten, nachts) | nein | – | 470 |
| 140 | Lunaris | Lumen | Legende | – | Lichtlande: sternenklippe (legende, nachts) | ja | – | 580 |
| 141 | Thalor | Flut | Legende | – | Flutküste: offenes_meer, leuchtturmklippen (legende) | ja | – | 580 |
| 142 | Ignivar | Glut | Legende | – | Glutlande: ignivar_gipfel (legende, tags) | ja | 28 | 580 |
| 143 | Sylvaris | Flora | Legende | – | Smaragdwald: altwurzeltempel (legende) | ja | – | 580 |
| 144 | Aetherion | Böe | Legende | – | Himmelsweiten: sturmklippe (legende) | ja | 30 | 580 |
| 145 | Crystalon | Fels | Legende | – | Kristallgebirge: amethystgrotte (legende) | ja | – | 580 |
| 146 | Glacira | Frost | Legende | – | Frosttundra: nordlichtsee, eishoehlen (legende, nachts) | ja | – | 580 |
| 147 | Noctyra | Schatten | Legende | – | Schattenmoor: mondklippe (legende, nachts) | ja | 29 | 580 |
| 148 | Floravon | Flora | Legende | – | Smaragdwald: altwurzeltempel, feenlichtung (legende, tags) | ja | – | 580 |
| 149 | Aureon | Böe/Lumen | Legende | – | Himmelsweiten: himmelsfeste (legende, tags) | ja | – | 580 |
| 150 | Auralis | Ursprung | Mythisch | – | Lichtlande: aurora_tempel (mythos, nachts) | ja | – | 600 |
| 151 | Terravon | Fels/Flora | Mythisch | – | Smaragdwald: wandernde_insel (mythos) | ja | – | 600 |
| 152 | Solaryx | Lumen/Ursprung | Mythisch | – | Lichtlande: wolkenthron (mythos, tags) | ja | – | 600 |
| 153 | Umbryx | Schatten/Ursprung | Mythisch | – | Schattenmoor: schattenhain (mythos, nachts) | ja | – | 600 |

## ID_MAP (alte Art-ID → Kanon)
1→001 · 2→002 · 3→003 · 4→004 · 5→005 · 6→006 · 7→007 · 8→008 · 9→009 · 10→059 · 11→060 · 12→112 · 13→113 · 14→072 · 15→073 · 16→057 · 17→058 · 18→075 · 19→076 · 20→031 · 21→032 · 22→061 · 23→062 · 24→090 · 25→091 · 26→037 · 27→038 · 28→142 · 29→147 · 30→144 · 31→025 · 32→026 · 33→022 · 34→023 · 35→115 · 36→034 · 37→011 · 38→117 · 39→053 · 40→122 · 41→033

## Bilder
Umbenannt nach Kanon-Nummer (Protokoll unten). `098_laternenpilz.webp` neu aus `public/art_variants/pilz_A_aktiv.png` geschnitten (die alte Datei 89 war leer → `public/art_unused/89_laternenpilz.webp.leer`). Ohne Bild (prozeduraler 3D-Fallback): 002, 003, 005, 006, 058, 060, 062, 099–139. Für 099–107 gibt es nur kleine Streifen mit dunklem Hintergrund in public/art_ref (flutwolf_linie, schattenwolf_rot_linie, waldhirsch_linie, je 530 px breit) – zu klein für saubere Einzelbilder; Nutzer-Einzelbilder erwünscht.

### Umbenennungsprotokoll public/art (alt → neu)
```
01_glimmo.webp -> 001_funki
04_troepfli.webp -> 004_plippi
07_keimling.webp -> 007_knospi
08_rankora.webp -> 008_rankel
09_sylvarok.webp -> 009_bluehro
100_auralis.webp -> 150_auralis
101_terravon.webp -> 151_terravon
102_bergwaechter.webp -> 024_basalor
103_wurzel.webp -> 055_wurzel
104_wurzelin.webp -> 056_wurzelin
105_solaryx.webp -> 152_solaryx
106_federling.webp -> 069_federling
107_goldschwinge.webp -> 070_goldschwinge
108_auregrif.webp -> 071_auregrif
109_blitzahn.webp -> 074_blitzahn
10_pieplo.webp -> 059_flausch
110_umbryx.webp -> 153_umbryx
111_kristallo.webp -> 077_kristallo
112_floravon.webp -> 148_floravon
113_plitschi.webp -> 078_plitschi
114_wogenwal.webp -> 079_wogenwal
115_ozeano.webp -> 080_ozeano
116_krabbi.webp -> 081_krabbi
117_scherenwacht.webp -> 082_scherenwacht
118_krystak.webp -> 083_krystak
119_aureon.webp -> 149_aureon
120_eulumi.webp -> 087_eulumi
121_waldgreif.webp -> 088_waldgreif
122_waldorakel.webp -> 089_waldorakel
14_knips.webp -> 072_knips
15_blitzmaehne.webp -> 073_blitzmaehne
16_kieselix.webp -> 057_knackel
18_frosti.webp -> 075_frosti
19_glazirr.webp -> 076_glazirr
20_schemmo.webp -> 031_dumbi
21_nachtmahr.webp -> 032_noxli
22_leuchtling.webp -> 061_blinki
24_moosel.webp -> 090_moosel
25_moosgolem.webp -> 091_moosgolem
26_riffel.webp -> 037_muschel
27_korallix.webp -> 038_perlo
31_zephyrit.webp -> 025_pusti
32_sturmwisp.webp -> 026_wirbel
33_felsmoll.webp -> 022_kiesel
34_granitor.webp -> 023_brummit
36_magmaal.webp -> 034_zischi
41_astramahr.webp -> 033_mondoro
42_flammigel.webp -> 013_aschi
43_glutigel.webp -> 014_kohlo
44_pyrostachel.webp -> 015_brandor
45_quellotl.webp -> 016_molli
46_wogendrak.webp -> 017_blubbo
47_gezeitendrache.webp -> 018_stroemi
48_bluemling.webp -> 019_fipsa
49_blattloewe.webp -> 020_blattin
50_florleu.webp -> 021_kronella
51_kristallbaer.webp -> 092_kristallbaer
52_schildkiesel.webp -> 010_krumo
53_kristallpanzer.webp -> 011_dornox
54_bergkoloss.webp -> 012_granthor
55_boeenwolf.webp -> 027_sturmilo
56_sonnenwelp.webp -> 028_lumli
57_solfuchs.webp -> 029_glimma
58_heliomane.webp -> 030_solaro
59_mondwelp.webp -> 063_schumi
60_lunawolf.webp -> 064_duestro
61_astrowolf.webp -> 065_sternheuler
62_lavadrak.webp -> 035_funaro
63_vulkanor.webp -> 036_vulkanjo
64_muschelfuerst.webp -> 039_korallux
65_sproessling.webp -> 040_tilli
66_hainschild.webp -> 041_sonnblatt
67_bluetenarch.webp -> 042_floralis
68_wellchen.webp -> 093_wellchen
69_riffschwimmer.webp -> 094_riffschwimmer
70_gezeitenkoenig.webp -> 095_gezeitenkoenig
71_aquakrist.webp -> 066_aquakrist
72_kristallschild.webp -> 067_kristallschild
73_kristallux.webp -> 068_kristallux
74_sternkueken.webp -> 043_flitzi
75_himmelsflug.webp -> 044_federel
76_astraphoenix.webp -> 045_himmora
77_lunaris.webp -> 140_lunaris
78_lotusquak.webp -> 046_mumpi
79_teichfrosch.webp -> 047_nebbel
80_lotusfuerst.webp -> 048_daemmerin
81_axelli.webp -> 084_axelli
82_kiemling.webp -> 085_kiemling
83_lumaxel.webp -> 086_lumaxel
84_thalor.webp -> 141_thalor
85_ignivar.webp -> 142_ignivar
86_sylvaris.webp -> 143_sylvaris
87_pilzlein.webp -> 096_pilzlein
88_glimmerpilz.webp -> 097_glimmerpilz
89_laternenpilz.webp -> leer→art_unused
90_aetherion.webp -> 144_aetherion
91_crystalon.webp -> 145_crystalon
92_frostwaechter.webp -> 146_frostwaechter
93_noctyra.webp -> 147_noctyra
94_glutkaefer.webp -> 049_knister
95_lavapanzer.webp -> 050_brutzel
96_magmaritter.webp -> 051_funkoro
97_quallino.webp -> 052_glibbi
98_schleierqualle.webp -> 053_quallio
99_tiefenschleier.webp -> 054_lumedusa
```
