# Veyra – Hauptgeschichte „Das Lied der acht Kristalle“ (Loop B2 Story)

Agent B2 (Opus hoch) · 10.11.2026 · Code: `src/27-story.js` (Daten, Hooks, Zielführung, Kapitel-Karte, Missionsseite), `src/02-world.js` (Figuren/Auslöser in `NPCS`, Sperr-Texte), `src/21-species.js` (Block „B2“: Spielstand), `src/12-intro.js`/`src/13-intro3d.js` (Intro-Texte). Test: `test/unit_story.mjs`.

## Leitidee (kindgerecht)
Veyra wird von acht **Elementarkristallen** im Gleichgewicht gehalten: sieben bekannte (Glut, Flut, Flora, Fels, Böe, Lumen, Schatten) und ein verborgener achter (Frost – „das achte, verborgene Königreich“). Seit einiger Zeit **flackern** die Kristalle. **Lord Varkon** und sein **Schattenorden** haben Angst um Veyra und wollen alle Kristalle in seiner Kristallfeste „in Sicherheit“ bringen. Doch Kristalle, die man aus ihrer Heimat holt, werden dunkel. Der Spieler bringt jeden Kristall nach Hause, gewinnt dabei die acht **Medaillen** und lernt mit Rayan, Mira, Elara, Elowen und Tarek: *„Gemeinsam, nicht allein.“* Im Finale ruft die Resonanz aller Freunde **Auralis** herbei; die Kristalle singen wieder, Varkon versteht seinen Irrtum, der Orden wird zum **Dämmerbund** (Begriff von B1), der die Kristalle pflegt.
Regeln: niemand stirbt, keine Angst-Szenen (Ordensleute sind eher tollpatschig, Seraphine elegant-streng, Varkon der „strenge Irrende“), kurze Sätze, max. 2 Zeilen je Kasten (lange Fremdtexte teilt `kanonLines` automatisch an der Satzgrenze), keine Bestrafung.

## Kapitelübersicht
| Nr. | Region | Titel | Ziel (ein Satz) | Ort heute → Kanon | Wichtig | Belohnung (Kapitelende) |
|---|---|---|---|---|---|---|
| 1 | Lichtlande | Der erste Funke | Hol dir deinen ersten Partner bei Professor Veyran. | Morgenau/Labor/Route 1 → Aurenstadt | Starter, Rayan & Mira, erster Fang, Kaine beobachtet, Elowen erklärt die Elementarkristalle | 3 Kobaltkapseln, 3 Kräutertränke |
| 2 | Smaragdwald | Das Flüstern im Wald | Beschütze den Flora-Kristall in Wurzelheim. | Kupferhain → Wurzelheim, Nebelgrotte → Altwurzeltempel | Elara, Lior (Floramedaille), Ordensrekrut Knut, Seraphine (1. Begegnung, ohne Kampf) | 2 Sternkapseln, 2 Honigtau, 800 ¤ |
| 3 | Flutküste | Wellen der Freundschaft | Rette den Flut-Kristall im Leuchtturm. | Brisenhafen → Azurhafen, Windküsten-Pfad → Muschelbucht, Möwenbucht → Leuchtturmklippen | Mira-Probekampf, Neria (Flutmedaille), Kaine (1. Kampf), Ruven, Thalor-Hinweis | 3 Netzkapseln, 2 Starke Kräutertränke, 1000 ¤ |
| 4 | Himmelsweiten | Die Brücke im Wind | Hol den Böen-Kristall zurück zu Sylva. | Sonnenhang (Route 3) → Himmelsbrücke | Rayan-Kampf, Seraphine (2. Begegnung, Kampf auf der Brücke, erster Zweifel), Sylva (Böenmedaille) | 2 Sternkapseln, Böesiegel + Medaillen-Geschenk |
| 5 | Frosttundra | Das verborgene achte Königreich | Finde das Geheimnis des achten Kristalls in Eiswacht. | Frostheim → Eiswacht | Eira (Frostmedaille), Elowens Legende, **Eisruinen-Bilder (Wendepunkt)**, Kaine zweifelt; Anruf von Veyran | 2 Quellessenzen, Frostsiegel, 1200 ¤ |
| 6 | Glutlande | Zusammen sind wir stärker | Hilf Rayan und Kael, den Glut-Kristall zu schützen. | Glutschlucht → Emberklamm | Rayan lernt Teamgeist, zwei Ordensrekruten (Doppelkampf), Kael (Glutmedaille) | Glutsiegel, 3 Sternkapseln |
| 7 | Kristallgebirge | Tief in der Mine | Rette den Fels-Kristall in der Tiefenmine. | Nebelgrotte (Westteil) → Tiefenmine | Torvik, Rekruten-Trio, Felsmedaille, Tareks Messung („alle Kristalle werden schwächer“) | Felssiegel, Resonanzprisma |
| 8 | Schattenmoor | Licht im Dämmerland | Finde heraus, warum der Schatten-Kristall flackert. | Nebelmarsch → Morastplateau, Schattmoor → Nebelholm/Dämmerbruch, Flüstertal → Schattenhain | Kaine (2. Kampf) **läuft über**, Nymera (Schattenmedaille, „Schatten ist nicht böse“), Schatten-Kristall beruhigt sich | Schattensiegel, 3 Quellessenzen, 1500 ¤ |
| Finale | Lichtlande | Das Lied der acht Kristalle | Bring den Schattenorden und die Kristalle wieder zusammen. | Siegesstraße → Sonnentor/Kristallkammern/Kristallfeste, Liga → Kristallturm/Palast | Solan (Lumenmedaille), Seraphine (3. Begegnung, wechselt die Seite), Varkon-Kampf, **Auralis-Moment** (alle Freunde, Resonanz, Versöhnung), Palastwache gibt den Weg frei, Turmrat (4) + Kronenhüterin Ardena | Lumensiegel, 3 Lebensfunken, 3000 ¤; Ardena: Absolutkapsel |
| Epilog | Aurenstadt | Ein neuer Morgen | Feiere mit allen in Aurenstadt. | Labor → Forschungszentrum | Fest mit Mama, Rayan, Mira, Kaine, Elowen; Ausblick auf Legenden | Schimmertalisman, 5 Sternkapseln, 3000 ¤ |

Kapitel-Karte: Beim Wechsel in ein neues Kapitel erscheint oben mittig eine Glas-Karte (`#stCard`, Elementfarbe aus `PALETTE.el`) mit Kapitel, Region, Titel und Ziel. Kapitelende: Toast „Kapitel n geschafft! Der …-Kristall leuchtet.“ Anrufe über die Chronik: Veyran nach dem Wendepunkt, Mira vor dem Finale.

## Flag-Tabelle (41 Schritte, Reihenfolge = `QUESTS`)
`sOn` = Figur erst sichtbar, wenn dieses Flag gesetzt ist (Vorgänger), `alt` = beim Laden eines Altstands erledigt, wenn dieses alte Flag gesetzt ist (`migrateStory`). Neue Flags: 30 (davon 4 neue Medaillen `badge_boe/glut/fels/lumen` und `top4`).

| Flag | Kap. | Schritt (HUD) | Auslöser: Karte (x,y) · Typ | sOn | alt |
|---|---|---|---|---|---|
| `starter` | 1 | Wähle deinen ersten Partner | labor (5,4) · Starterwahl | – | – |
| `s1_rivalen` | 1 | Lerne Rayan und Mira kennen | labor (3,6) · Hook `rayan_labor` (auch `mira_labor` 7,6); im Intro von B1 bereits gesetzt, Labor-Szene greift nur ohne Intro-Starter | `starter` | `badge1` |
| `firstcatch` | 1 | Fange eine wilde Kreatur | route1 (9,6) · Fang im Gras | – | – |
| `s1_kaine` | 1 | Folge dem Fremden im Mantel | route1 (12,2) · Hook `kaine1` | `firstcatch` | `badge1` |
| `s1_elowen` | 1 | Zeig Oma Elowen den Splitter | haus_nachbar (4,3) · Hook `elowen` | – | `badge1` |
| `s2_elara` | 2 | Triff die Waldhüterin Elara | kupferhain (16,12) · Hook `elara` | `s1_elowen` | `badge1` |
| `badge1` | 2 | Gewinne die Floramedaille | arena1 (5,2) · Lior (Kampf) | – | – |
| `grunt1` | 2 | Folge dem Orden in die Grotte | nebelgrotte (8,8) · Ordensrekrut Knut (Kampf) | – | – |
| `s2_seraphine` | 2 | Sprich mit der Frau in Violett | nebelgrotte (10,7) · Hook `seraphine1` | `grunt1` | `badge2` |
| `s2_kristall` | 2 | Bring den Kristall zu Elara | kupferhain (16,12) · Hook `elara` | `s1_elowen` | `badge2` |
| `s3_mira` | 3 | Triff Mira am Hafen | brisenhafen (6,12) · Hook `mira1` (Kampf) | `s2_kristall` | `badge3` |
| `badge2` | 3 | Gewinne die Flutmedaille | arena2 (5,2) · Neria (Kampf) | – | – |
| `s3_kaine` | 3 | Halte den Späher Kaine auf | windkueste (17,19) · Hook `kaine_kueste` (Kampf) | `badge2` | `badge3` |
| `s3_leuchtturm` | 3 | Besuche den Leuchtturmwärter | haus_moewe3 (5,4) · Hook `ruven` | – | `badge3` |
| `tr_lio` | 4 | Stell dich deinem Rivalen Rayan | route3 (9,6) · Rivale Rayan (Kampf, Sicht) | – | – |
| `s4_seraphine` | 4 | Stell Seraphine auf der Brücke | route3 (9,9) · Hook `seraphine2` (Kampf) | `tr_lio` | `badge3` |
| `s4_kristall` | 4 | Bring Sylva ihren Kristall | route3 (14,3) · Hook `sylva` | `tr_lio` | `badge3` |
| `badge_boe` | 4 | Gewinne die Böenmedaille | route3 (14,3) · Hook `sylva` (Kampf) | `tr_lio` | – |
| `badge3` | 5 | Gewinne die Frostmedaille | arena3 (5,2) · Eira (Kampf) | – | – |
| `s5_elowen` | 5 | Hör Oma Elowens Legende | frostheim (16,12) · Hook `elowen2` | `badge3` | `boss1` |
| `s5_ruinen` | 5 | Untersuche die Eisruinen | frostheim (17,1) · Hook `eisruine` (Fundstück) | `s5_elowen` | `boss1` |
| `s5_kaine` | 5 | Sprich mit Kaine | frostheim (15,1) · Hook `kaine2` | `s5_ruinen` | `boss1` |
| `s6_rayan` | 6 | Hilf Rayan | glutschlucht (3,6) · Hook `rayan_glut` | `s5_kaine` | `badge4` |
| `s6_orden` | 6 | Stoppe die zwei Ordensrekruten | glutschlucht (4,8) · Hook `orden_glut` (Doppelkampf) | `s6_rayan` | `badge4` |
| `badge_glut` | 6 | Gewinne die Glutmedaille | glutschlucht (6,13) · Hook `kael` (Kampf) | `s6_orden` | – |
| `s6_rayan2` | 6 | Sprich noch einmal mit Rayan | glutschlucht (3,6) · Hook `rayan_glut` | `s5_kaine` | `badge4` |
| `s7_torvik` | 7 | Triff Torvik | nebelgrotte (14,7) · Hook `torvik` | `s6_rayan2` | `badge4` |
| `s7_rekruten` | 7 | Stoppe die Ordensrekruten | nebelgrotte (4,10) · Hook `rekruten` (Kampf) | `s7_torvik` | `badge4` |
| `badge_fels` | 7 | Gewinne die Felsmedaille | nebelgrotte (14,7) · Hook `torvik` (Kampf) | `s6_rayan2` | – |
| `s7_tarek` | 7 | Hör Tareks Messung | nebelgrotte (16,9) · Hook `tarek_mine` | `badge_fels` | `badge4` |
| `boss1` | 8 | Stell Kaine im Nebelmarsch | route4 (8,6) · Späher Kaine (Kampf, Sicht) | – | – |
| `s8_kaine` | 8 | Hör Kaine zu | route4 (8,5) · Hook `kaine3` | `boss1` | `badge4` |
| `badge4` | 8 | Gewinne die Schattenmedaille | arena4 (5,2) · Nymera (Kampf) | – | – |
| `s8_hain` | 8 | Besuche den Schatten-Kristall | fluestertal (17,5) · Hook `schattenkristall` (Fundstück) | `badge4` | `champion` |
| `badge_lumen` | F | Gewinne die Lumenmedaille | siegesstrasse (4,12) · Hook `solan` (Kampf) | `s8_hain` | – |
| `sf_seraphine` | F | Stell Seraphine | siegesstrasse (12,7) · Hook `seraphine3` (Kampf) | `badge_lumen` | `champion` |
| `sf_varkon` | F | Stell Lord Varkon | siegesstrasse (12,6) · Hook `varkon` (Kampf) | `sf_seraphine` | `champion` |
| `sf_auralis` | F | Sprich mit Varkon (Auralis-Moment) | siegesstrasse (12,6) · Hook `varkon` | `sf_seraphine` | `champion` |
| `top4` | F | Besiege den Turmrat | liga (5,13/10/7/5) · Brann, Zaria, Ondra, Hesper (`top1`–`top4`) | – | `top3` |
| `champion` | F | Triff Kronenhüterin Ardena | liga (5,3) · Kampf | – | – |
| `se_fest` | E | Feiere mit Professor Veyran | labor (5,2) · Hook `veyran` | – | – |

Weitere Story-Flags/Felder: Palastwache `wache` (siegesstrasse 10,6) steht vor der Palasttür, bis `sf_auralis` (oder `champion`/`top1` aus Altständen) gesetzt ist. Bestehende Story-Flags blieben erhalten (`starter, firstcatch, badge1–4, grunt1, boss1, tr_lio, top1–3, champion`), damit alte Spielstände und andere Module (Sperren in MAPS, Kapselgeschenke, Läden) unverändert funktionieren.
Medaillen (`G.badges`, ersetzt „Orden“): Floramedaille (`badge1`), Flutmedaille (`badge2`), Böenmedaille (`badge_boe`), Frostmedaille (`badge3`), Glutmedaille (`badge_glut`), Felsmedaille (`badge_fels`), Schattenmedaille (`badge4`), Lumenmedaille (`badge_lumen`). Altnamen Blüten-/Wellen-/Gletscher-/Mondorden werden beim Laden umbenannt.

## Nebenmissionen
Neu (11, Flags `sq_<id>_on` angenommen / `sq_<id>` erledigt; Fundstücke erscheinen erst nach Annahme):

| Flag | Titel | Geber (Karte) | Aufgabe | Belohnung |
|---|---|---|---|---|
| `sq_korb` | Mamas Picknickkorb | Mama (haus_spieler) | Korb zu Oma Elowen nebenan bringen | 3 Kräutertränke, Honigtau |
| `sq_funkel` | Tareks Funkelsteine | Tarek (labor) | 3 Funkelsteine: Route 1, Kupferhain, Route 2 (`sq_fs1–3`) | 2 Sternkapseln, Honigtau |
| `sq_experiment` | Tareks Experiment | Tarek (labor) | Entwickelte Kreatur im Team zeigen | Donnerstein, Blattstein, 800 ¤ |
| `sq_faehrten` | Elaras Fährten | Elara (kupferhain) | 3 Tierspuren: 2× Route 2, 1× Nebelgrotte (`sq_fa1–3`) | 3 Sternkapseln, 2 Federkapseln |
| `sq_blumen` | Wilmas durstige Blumen | Gärtnerin Wilma (kupferhain) | Flut-Kreatur im Team | 3 Honigtau, 2 Sonnbeeren |
| `sq_laterne` | Borwins Laterne | Händler Borwin (brisenhafen) | Laterne auf Route 2 finden (`sq_laterne_found`) | 5 Kobaltkapseln, 2 Balsamkapseln |
| `sq_knoten` | Marlenes Flut-Freunde | Kapitänin Marlene (brisenhafen) | 3 verschiedene Flut-Arten gefangen | 5 Netzkapseln, Flutsiegel |
| `sq_fieber` | Das frierende Frosti | Heilerin Mirael (frostheim) | Sonnbeere oder Honigtau abgeben | 3 Balsamkapseln, 2 Quellessenzen |
| `sq_ofen` | Astas kalter Ofen | Asta (huette_glut, heilt weiterhin) | Glutnuss im Westteil der Glutschlucht (`sq_nuss`) | Glutkern, 2 Starke Kräutertränke |
| `sq_sterne` | Corvins Sternenfreund | Sternendeuter Corvin (schattmoor) | Schatten-Kreatur im Team | 5 Dämmerkapseln, Dunkelstein |
| `sq_signal` | Kaines Signalkristalle | Kaine (schattmoor, nach `s8_kaine`) | 3 Signalkristalle: 2× Nebelmarsch, 1× Schattmoor (`sq_sk1–3`) | 3 Sternkapseln, Resonanzprisma |

Kein Eier-System vorhanden → keine Kreatur-Eier als Belohnung, nur Items. Ehemalige Arenaleiter (Wilma, Marlene, Corvin) leben als Missions-Figuren weiter. Bestehende Nebenmissionen (16-expansion: Wölkchen, Post, Fotosafari, Tausch, Schatz, Hitzeprobe, Flüsterlichter, Nyx) bleiben; ihre Sperren heißen jetzt „Ab n Medaillen“ (`req`-Feld statt Texterkennung). Zielführung der Nebenmissionen greift wie bisher erst nach der Hauptgeschichte.

## Lernliste (STORY_HELP)
Wird einmal gezeigt, wenn der zugehörige Schritt dran ist **und** der Spieler auf der Zielkarte steht; erscheint danach unter „Gelernt“ auf der Missionsseite: Reden (A), Starterwahl, Fangen (Tasche → Fangkapsel), Leuchtpfeil, Chronik-Karte, Kreaturenstation, Typen (Glut > Flora > Flut > Glut), Feldfähigkeiten, Resonanz-Ring, Medaillen, Kreaturenbox, Doppelkampf, Missionszeile.

## Schnittstellen (für Loop C/D, B3, UI)
- **`SITES`** (27-story.js): Kanon-Ort → heutige Karte, Textname `n`, Wendung `in`. Texte nutzen `{@ort}` / `{in@ort}`; Loop C/D ändern nur `map/n/in` (und verschieben die Figuren in `NPCS` – die Zielführung liest die Koordinaten aus dem NPC über `by:{map,hook|flag}`).
- **NPC-Felder** (02-world.js): `hook` (Gesprächslogik in `HOOKS`), `fig` (Figuren-ID für 34-figures.js), `sOn` (alle Flags nötig), `sOff` (verschwindet bei einem Flag); `t:'item'` + `hook` = besonderes Fundstück, setzt sein Flag selbst.
- **Teams**: Arenaleiter, Kaine, Seraphine, Varkon, Turmrat, Ardena nutzen `figTeam(id,{lv,stufe})`, Rayan/Mira `rivalTeam(id,stufe)` aus 34-figures.js (Getter, Fallback = Team in 02-world). Level je Kapitel in `FIG_FIGHT`.
- **Begriffe**: `T_(k)` liest `FIGURES.terms` (B1: Turmrat, Turmhüter/in, Kronenhüterin, Kristallkrone, Veyra-Profi, Dämmerbund), Fallback `STORY_TERM`.
- **Text-Filter** (`kanonText`, über `say`/`ask`/`rivalize`/`chronikCall`): Prof. Lindqvist → Professor Veyran, Dämmerorden → Schattenorden, „den …medaille“ → „die …medaille“, „n Orden“ → „n Medaillen“, Top Vier/Top-Drei → Turmrat/Turmhüter, Geldverlust-Satz entfällt auf „leicht“. `kanonLines` teilt Kästen > 110 Zeichen.
- **Neu definiert (gleiche Signatur)**: `questTarget` (Ziel-Funktionen für Hauptschritte), `npcHidden` (sOn/sOff), `rQuest` (Kapitel, Kristalle, 8 Medaillen, Gelernt), `updHud` („n/8 Medaillen“), `guideTick` (+ `storyTick`), `say`, `ask`, `rivalize`, `chronikCall`.
- **Spielstand**: `G.story={ch,help{},seen{},mig}` (Default in 21-species.js Block „B2“), `migrateStory(g)` leitet Schritte einmalig aus altem Fortschritt ab (Spalte „alt“), benennt Orden um, trägt Medaillen aus Flags nach. Idempotent, getestet.
- Kein Auto-Ereignis (Kapitel-Karte, Tipp, Anruf) läuft in Testläufen (`SEQ_AUTO()`), damit Smoke-Schritte nicht gestört werden.

## Tests
`node test/unit_story.mjs` (26 Prüfungen): Struktur (8 Kapitel + Finale + Epilog, 3–6 Flags, Ziel-Satz), jeder Auslöser-Ort in MAPS/INTERIORS, jeder Hook definiert, Figuren auf freien erreichbaren Feldern (BFS ab Karteneingang, Feldhindernisse zählen als Wand), keine Doppelbelegung, **Flag-Kette neues Spiel ohne Sackgasse** (Kartengraph mit Sperren, Sichtbarkeit, Hook setzt Flag), Endzustand 8/8 Medaillen, Palastwache, Zielführung je Schritt, 11 Nebenmissionen durchspielbar, Altstand mit 4 Orden bzw. als Champion (Umbenennung, Ableitung, idempotent, Kette bis Epilog), Texte (Markenwörter aus qa_a_recht.mjs, keine Fremdbegriffe, keine offenen Platzhalter, ≤ 110 Zeichen, kindgerecht), Lernliste, Text-Filter. Screenshots: `test/story/b2_*.png` (860×400).

## Interim-Zuordnung und offene Punkte
- Die Regionen sind heute auf die bestehenden 15 Karten gelegt (Tabelle oben). Himmelsweiten → Sonnenhang und Kristallgebirge → Nebelgrotte (Westteil) sind Notlösungen, bis Loop C/D die Kanon-Karten bauen; Sylva, Kael, Torvik und Solan stehen deshalb draußen statt in eigenen Arenen. Die Arena-Reihenfolge folgt den heutigen Sperren (Lior, Neria, Sylva, Eira, Kael, Torvik, Nymera, Solan) statt B1-Vorschlag `ARENA_ORDER`.
- Region-Namen auf Kartenkarte (06-regions) passen noch nicht zu den Kapiteln (z. B. Kupferhügel statt Smaragdwald).
- Einige Fremdtexte bleiben in Dateien anderer Agenten und werden nur gefiltert (Starterwahl/Chronik-Anruf in 03/15: „Prof. Lindqvist“, Rivale `G.rival`/„Lio“, Kapitel-Siegtext „Champion“ in 14-battle).
