# Figuren-Kanon (Loop B1, Opus hoch) – Stand 10.11.

Quelle im Code: `src/34-figures.js` (Daten + Logik), Zeichnen in `src/08-gfx.js` (`drawFigure`, `drawFigPortrait`, `drawPerson`), Intro in `src/23-intro.js`, Migration in `src/21-species.js` (Block „B1 Figuren“). Test: `node test/unit_figures.mjs` (32 Prüfungen), Screenshots: `node test/b1_shots.mjs` → `test/b1_*.png`.

## Eigene Begriffe (ersetzen Fremd-Jargon)

| Begriff | Bedeutung | Schlüssel `FIGURES.terms` |
|---|---|---|
| **Turmrat** | vier Hüter im Kristallturm von Aurenstadt | `elite` |
| **Turmhüter / Turmhüterin** | ein Mitglied des Turmrats | `eliteOne`, `eliteW` |
| **Kronenhüterin Ardena** | Trägerin der **Kristallkrone**, letzte Herausforderung | `champ`, `champTitle`, `champLong`, `crown` |
| **Veyra-Profi** | erfahrene Wanderer auf den Routen | `ace` |
| **Ordensrekrut** | Helfer des Schattenordens (Begriff von B2 übernommen) | `grunt` |
| **Dämmerbund** | der geläuterte Orden nach dem Finale | `orderNew` |
| **Kreaturenstation · Fangkapsel · Chronik · Lehr-Kristall · Medaille** | Grundbegriffe der Welt | `station`, `capsule`, `chronik`, `lehrkristall`, `medal` |

`figTerms(text)` ersetzt alte Wörter in beliebigen Texten. `FIGURES.terms` ist nicht aufzählbar (`for…in FIGURES` liefert nur Figuren).

Turmrat = vier Säle nach Tageszeiten: **Brann** (Morgenrot, Glut/Flora), **Zaria** (Mittagslicht, Böe/Volt), **Ondra** (Abendflut, Flut/Frost), **Hesper** (Mitternacht, Schatten/Fels); oben **Ardena** (Kronenhüterin, alle Elemente).
Arena-Reihenfolge (Vorschlag, `ARENA_ORDER`, Höchstlevel steigend 15→48): Lior (Flora) · Neria (Flut) · Kael (Glut) · Torvik (Fels) · Sylva (Böe) · Eira (Frost) · Nymera (Schatten) · Solan (Lumen). Eira und Ardena = Namen, die B2 bereits in 02-world nutzte (übernommen; Frost-Leiterin war im Kanon offen). `figTeam(id,{lv})` verschiebt Teams auf jede andere Reihenfolge.

## Kanon-Tabelle (40 Figuren)

| ID | Name | Rolle | Region · Ort | Element | Begleiter | Team (Art Level) | Porträt-Bilder |
|---|---|---|---|---|---|---|---|
| `held` | Noa | Held | Lichtlande · Aurenstadt · Wohnviertel | – | – | G.team | – |
| `heldin` | Noa | Heldin | Lichtlande · Aurenstadt · Wohnviertel | – | – | G.team | – |
| `rayan` | Rayan | Rivale | Lichtlande · Aurenstadt | Glut | 001 Funki | Funki 5 | `rayan_face_*` |
| `mira` | Mira | Rivalin | Lichtlande · Aurenstadt | Flut | 004 Plippi | Plippi 5 | `mira_face_*` |
| `veyran` | Prof. Veyran | Professor & Mentor | Lichtlande · Aurenstadt · Forschungszentrum | Flora | 007 Blättchen (Knospi) | Blühro 45, Blatthirsch 42, Wolkito 40 | `prof_face_*` |
| `tarek` | Tarek | Kreaturenforscher | Lichtlande · Aurenstadt · Forschungszentrum (Außenstellen Kristallwacht, Dämmerbruch) | Flut | 101 Azurion | Azurion 38, Blitzmähne 36, Kristallschild 36 | `tarek_face_*` |
| `mirael` | Mirael | Kreaturen-Heilerin | alle · jede Kreaturenstation | Flora | 055 Wurzel | Wurzelin 30, Quallio 30, Strahli 30 | `mirael_face_*` |
| `borwin` | Borwin | Reisender Händler | alle · wandert (Hauptstand Sternenplatz, Aurenstadt) | Flora | 007 Knubbel (Knospi) | Rankel 24, Teekrug 26, Knackel 25 | `borwin_face_*` |
| `elara` | Elara | Waldhüterin | Smaragdwald · Feenlichtung | Flora | 056 Wurzelin | Wurzelin 36, Waldgreif 34, Blatthirsch 34 | `elara_face_*` |
| `elowen` | Oma Elowen | Hüterin der alten Legenden | Smaragdwald · Blütenhain · Haus am Fliederbaum | Flora | 105 Kitzli | Lichthirsch 45, Glimmerpilz 42, Dämmerin 42 | `elowen_face_*` |
| `lior` | Lior | Arenaleiter Flora | Smaragdwald · Wurzelheim · Garten-Tempel | Flora | 008 Rankel | Fipsa 12, Tilli 12, Rankel 15 | `lior_face_*` |
| `neria` | Neria | Arenaleiterin Flut | Flutküste · Azurhafen · Wasserpalast | Flut | 005 Wabbel | Molli 15, Mumpi 15, Wabbel 18 | `neria_face_*` |
| `kael` | Kael | Arenaleiter Glut | Glutlande · Flammenkrone · Vulkanarena | Glut | 002 Loddo | Aschi 19, Knister 19, Loddo 22 | `kael_face_*` |
| `torvik` | Torvik | Arenaleiter Fels | Kristallgebirge · Kristallwacht · Felsarena | Fels | 022 Kiesel | Kiesel 26, Scherenwacht 27, Dornox 29 | `torvik_face_*` |
| `sylva` | Sylva | Arenaleiterin Böe | Himmelsweiten · Windfels · Sturm-Arena | Böe | 069 Federling | Wirbel 32, Wolkito 32, Goldschwinge 34 | `sylva_face_*` |
| `eira` | Eira | Arenaleiterin Frost | Frosttundra · Eiswacht · Eis-Arena | Frost | 125 Flocki | Firnhase 36, Glazirr 37, Schollotter 37 | `eira_face_*` |
| `nymera` | Nymera | Arenaleiterin Schatten | Schattenmoor · Dämmerbruch · Mondtempel | Schatten | 065 Sternheuler | Noxli 40, Nachtkauz 40, Sternheuler 43 | `nymera_face_*` |
| `solan` | Solan | Arenaleiter Lumen | Lichtlande · Sonnenfels · Sonnentempel | Lumen | 029 Glimma | Strahli 45, Glanzfell 45, Solaro 48 | `lumenleiter_face_*` |
| `brann` | Brann | Turmhüter des Morgenrots | Lichtlande · Aurenstadt · Kristallturm, Saal Morgenrot | Glut | 109 Feuerblatt | Feuerblatt 52, Vulkanjo 52, Brandor 53, Floralis 53 | `brann_face_*` |
| `zaria` | Zaria | Turmhüterin des Mittagslichts | Lichtlande · Aurenstadt · Kristallturm, Saal Mittagslicht | Böe | 128 Brummblitz | Blitzahn 53, Himmora 53, Sturmilo 53, Brummblitz 54 | `zaria_face_*` |
| `ondra` | Ondra | Turmhüterin der Abendflut | Lichtlande · Aurenstadt · Kristallturm, Saal Abendflut | Flut | 138 Schollotter | Gezeitenkönig 52, Kristallo 52, Granthor 53, Ozeano 55 | `ondra_face_*` |
| `hesper` | Hesper | Turmhüter der Mitternacht | Lichtlande · Aurenstadt · Kristallturm, Saal Mitternacht | Schatten | 136 Laternenflatter | Mondoro 55, Basalor 55, Kerzwacht 55, Laternenflatter 56 | `hesper_face_*` |
| `ardena` | Ardena | Kronenhüterin (Trägerin der Kristallkrone) | Lichtlande · Aurenstadt · Spitze des Kristallturms | Lumen | 071 Auregrif | Auregrif 57, Lumaxel 57, Kristallbär 57, Azurion 58, Krystak 60 | `ardena_face_*` |
| `varkon` | Lord Varkon | Anführer des Schattenordens | Kristallgebirge · Kristallfeste (Varkons Festung) | Schatten | 104 Rubindorn | Kerzwacht 48, Nagnox 48, Vulkanjo 49, Rubindorn 52 | `varkon_face_*` |
| `seraphine` | Seraphine | Varkons rechte Hand | Kristallgebirge · Geheime Kristallkammern | Schatten | 104 Rubindorn | Nachtkauz 38, Düstro 38, Rubindorn 42 | `seraphine_face_*` |
| `kaine` | Kaine | Späher des Schattenordens | Schattenmoor · Ordens-Außenposten (Morastplateau) | Schatten | 104 Rubindorn | Huschu 20, Dornwelp 21 | `kaine_face_*` |
| `lehrling` | Ordensrekrut | Handlanger des Schattenordens (allgemein) | überall · Ordens-Stützpunkte | Schatten | 031 Dumbi | Dumbi 12, Flatti 12 | – |
| `mama` | Mama | Mutter des Helden | Lichtlande · Aurenstadt · Wohnviertel | Böe | 059 Flausch | Wolkito 20 | – |
| `fiete` | Fiete | Kreaturenfan | Lichtlande · Aurenstadt · Stadtpark | Kern | 112 Knabbi | Knabbi 4 | – |
| `lotte` | Lotte | Café-Wirtin | Lichtlande · Aurenstadt · Café am Sternenplatz | Kern | 130 Teekrug | Teekrug 15 | – |
| `grom` | Meister Grom | Schmied (Lehr-Kristalle) | Glutlande · Glutheim · Schmiede | Glut | 050 Brutzel | Brutzel 28 | – |
| `jorin` | Kapitän Jorin | Luftschiff-Kapitän | Himmelsweiten · Sturmhafen · Luftschiffhafen | Böe | 119 Wolkenwoll | Wolkenwoll 30 | – |
| `halvard` | Halvard | Bergführer | Frosttundra · Gletschergrat · Gipfelwacht | Frost | 126 Firnhase | Firnhase 34 | – |
| `ylva` | Ylva | Sternen-Beobachterin | Frosttundra · Nordlichtsee · Sternenwacht | Lumen | 139 Sternschnuppi | Sternschnuppi 35 | – |
| `wilma` | Gärtnerin Wilma | Gärtnerin | Lichtlande · Aurenstadt · Gärten | Flora | 040 Tilli | Tilli 10, Pilzlein 10 | – |
| `marlene` | Kapitänin Marlene | Fährkapitänin | Flutküste · Azurhafen · Fähre | Flut | 093 Wellchen | Riffschwimmer 30, Perlo 28 | – |
| `corvin` | Sternendeuter Corvin | Sternendeuter | Schattenmoor · Nebelholm | Schatten | 135 Flatti | Laternenflatter 34, Mondoro 36 | – |
| `ruven` | Leuchtturmwärter Ruven | Leuchtturmwärter | Flutküste · Leuchtturmklippen | Böe | 043 Flitzi | Federel 30, Wirbel 28 | – |
| `asta` | Hüttenwärterin Asta | Hüttenwärterin | Glutlande · Hütte am Schluchteingang | Glut | 013 Aschi | Kohlo 22 | – |
| `wache` | Palastwache | Wache am Königspalast | Lichtlande · Aurenstadt · Königspalast | Fels | 022 Kiesel | Brummit 40 | – |

Alias-IDs (für fig-Schlüssel in 02-world): `champion→ardena`, `orden/rekrut→lehrling`, `runa→eira`, `prof/professor→veyran`, `lumenleiter→solan`. Alle 40 Figuren haben je Situation 3–5 Sprüche (`gruss`, `kampf` = vor Kampf, `sieg` = Figur gewinnt, `niederlage` = Figur verliert, `alltag`), ≤ 62 Zeichen, Beziehungen in `rel`, Aussehen in `look`.

## Schnittstellen für B2 (Story) und Loop C/D (Karten)

| Funktion | Zweck |
|---|---|
| NPC-Feld `fig:'<id>'` | genügt: 2D-Figur, 3D-Figur (person3d mit Figuren-Farben), Dialog-Porträt mit Ausdruck, Begegnung wird in `G.figs.met` gemerkt. Fehlen `pre`/`post` (Trainer) bzw. `txt` (talk), liefern Getter bei jedem Ansprechen einen neuen Kanon-Spruch („Name: …“). Eigene Werte haben Vorrang. Optional `n.expr` (fester Ausdruck), `n.look` (Teil-Überschreibung). |
| `figNpc(id,{x,y,d,t,flag,lv,stufe,name,…})` | fertiges NPC-Objekt (Trainer mit Team oder talk) |
| `figById(id)` · `figByName(name)` · `figIdOf(npc)` · `figKey(id)` | Nachschlagen (Titel wie „Arenaleiter“, „Rivale“, „Prof.“ werden ignoriert; „Prof. Lindqvist“ → Veyran) |
| `figLine(id,sit[,i])` · `figLines(id,sit)` · `figSay(id,sit[,i])` · `figTalk(id,[sits],cb)` | Sprüche; Platzhalter `{name}`, `{partner}` (erste Teamkreatur), `{mon}` (Begleiter der Figur bzw. Rivalen-Starter), `{rayan}`, `{mira}` |
| `figTeam(id,{lv,stufe})` | Team-Kopie, Level verschoben; Kaine: `stufe:2` = zweite Begegnung; generische Figuren (Ordensrekrut, Palastwache) ziehen aus `pool` |
| `rivalTeam('rayan'|'mira', stufe 0–8)` | Rivalen-Team je Begegnung (Level 7→48, 1→5 Kreaturen, Starter-Linie entwickelt sich, Pool: Rayan Zischi/Knips/Schumi/Kiesel, Mira Pusti/Axelli/Federling/Lumli) |
| `rivalStartersFig(p)` | Nutzer-Regel: Rayan nimmt das Element, das gegen den Spieler-Starter stark ist, Mira das schwache (Knospi → Rayan Funki, Mira Plippi; Funki → Rayan Plippi, Mira Knospi; Plippi → Rayan Knospi, Mira Funki). Gilt für Intro und Labor (erste Starterwahl). Alte Spielstände behalten ihre Zuordnung (`rivalStarters` in 21 bleibt Altregel für `ensureRivals`). |
| `figMeet(id)` · `figMet(id)` · `figBond(id,n)` | Begegnung / Freundschaft 0–100 mit Figuren (`G.figs`) |
| `figExprFor(text,sit)` | Ausdruck (neutral, freudig, laechelnd, zaertlich, entschlossen, ueberrascht, nachdenklich, traurig, stolz, ernst) |
| `figTerm(k)` · `figTerms(text)` · `FIGURES.terms` | Begriffe (oben) |
| `ARENA_ORDER`, `TURMRAT`, `FIGURES[id].medal` | Arenen/Medaillen |
| `drawFigure(c,x,y,s,look,t,{expr,talk})` · `drawFigPortrait(c,look,W,t,expr)` · `heroLook(G.outfit)` · `figPortrait(c,id,W,expr)` | Zeichnen (Cutscenes, Chronik-Seiten, Ruf-Overlay) |
| `welcomeHome` (23) | nach dem Intro: Mama begrüßt Spieler + Partner; B2 darf per Zuweisung (`welcomeHome=function…`) neu definieren – bitte **keine** Funktionsdeklaration in 27 (würde durch die Zuweisung in 23 überschrieben) |

**Intro-Ergebnis (Spielstand):** `G.name`, `G.outfit` (`body` held/heldin), `G.team=[Starter L5]`, `G.starter`, `G.rivals={rayan:{starter},mira:{starter}}`, `G.flags.starter=1`, `G.flags.introStarter=1`, **`G.flags.s1_rivalen=1`** (Rivalen sind im Intro schon vorgestellt – B2-Schritt „Sprich mit Rayan und Mira“ entfällt), Tasche +5 Fangkapsel +3 Kräutertrank, `G.figs.met` veyran/rayan/mira, `G.rival='Rayan'` (Altfeld; ersetzt „Lio“ in alten Texten). Webdriver-Kurzpfad unverändert (Name Noa, Rivale Lio, ohne Starter → Labor).

## Spielstand (SPIELSTAND-SICHERHEIT)
- Neu: `G.figs = {met:{<id>:1}, bond:{<id>:0–100}}`, `G.outfit.body = 'held'|'heldin'`.
- Migration `migrateFigures(g)` in `21-species.js` (Block „B1 Figuren“, Wrapper um `migrateSave` nach B2): legt `figs` an/repariert es, leitet `body` aus alter Frisur ab (zopf/lang/dutt → heldin), lässt Stände ohne `outfit` unverändert; idempotent. Geprüft in `test/unit_figures.mjs`, `test/unit_migration.mjs` bleibt grün.

## Darstellung
- **Prozedural (alle Figuren):** `drawFigure` – Anime-Figur mit Zwei-Ton-Cel-Shading, Kontur, großen Augen (Lidlinie, zwei Glanzpunkte), Brauen/Mund je Ausdruck, 12 Frisuren mit Glanzband, Bärte, Brille, Sommersprossen/Narbe/Ohrringe, Kleidung in Lagen (Jacke offen mit Innenteil, Mantel/Kittel/Umhang, Weste, Fellkragen, Schal, Gürtel, Hose/Cargo/Shorts/Rock/Gewand, Stiefel mit Schnürsenkeln in `--sig`), Requisiten (Rucksack mit Schlafrolle, Tasche mit Symbol, Stab mit Kristall, Laterne mit Schein, Bogen, Buch, Amulett, rote Kristallkugel, Fernglas, Veyra-Kristallkapsel), Posen (verschränkt, Hände in den Hüften, winken, zeigen), Embleme (Blatt, Flamme, Welle, Berg, Wind, Sonne, Mond, Flocke, Kreuz+Blatt, Orden-Dorn, Stern, Turm). Körperbau kind/klein/teen/adult/alt/kraeftig.
- **2D-Oberwelt:** `drawPerson(…, look)` nutzt Figurenfarben, Mantel/Umhang, Frisur, Mütze/Kapuze, Bart, Stab, Rucksack, Signaturstreifen.
- **3D-Welt:** Wrapper um `build3d` ersetzt Figuren-NPCs durch `person3d` mit Figuren-Outfit (`figOutfit3d`). Volle 3D-Figuren nach den Sheets bleiben offen (Entscheidung „vorerst Sprites“).
- **Porträt-Bilder:** werden automatisch genutzt, sobald `ART_SRC['<art>_face_<ausdruck>']` existiert (eigene Prüfung `figHasArt`, nicht `hasArt`). Ausdruck mit Rückfallkette (z. B. stolz → zufrieden → laechelnd → freudig → neutral). Ohne Bild: prozeduraler Kopf mit gleichem Ausdruck.

### Aktivierung der Porträt-Bilder (Dirigent, eine Aktion)
Die 89 Gesichter liegen in `public/art_ref/*_face_*.webp` (256 px, ≈ 1,1 MB, im Artifact ≈ +1,5 MB) und sind deshalb **noch nicht** im Build. Zum Einschalten nach `public/art/` kopieren (Dateiname = Schlüssel): `cp public/art_ref/*_face_*.webp public/art/`. Wichtig: `lumenleiter_face_*` → für Solan entweder umbenennen in `solan_…` oder `art:'lumenleiter'` belassen (so im Code) – beides funktioniert. Kopf-Ausschnitte (ohne Kugel-Kapsel) für Figuren ohne Gesichter-Set (Vorschlag, geprüft):
`python3 -I -c "from PIL import Image as I;[I.open('public/art_ref/'+f+'.png').crop(b).resize((256,256)).save('public/art/'+k+'_face_freudig.webp',quality=80) for f,k,b in [('hero_m','held',(370,10,650,290)),('hero_f','heldin',(250,10,560,320)),('rival_rayan','rayan',(260,0,560,300)),('rival_mira','mira',(150,0,430,280))]]"` (für Held/Heldin dann `art:'held'/'heldin'` in FIGURES ergänzen).
Stand Loop-B-Nachbesserung: `rayan_face_freudig.webp` (Ausschnitt 260,0,560,300) und `mira_face_freudig.webp` (Ausschnitt 140,0,410,270, ohne Kapsel) liegen in `public/art/`. Für Eira, Brann, Zaria, Ondra, Hesper und Ardena gibt es kein Bildmaterial – sie nutzen den prozeduralen Kopf (`drawFigPortrait`), bis Bilder geliefert werden.

## Hinweise an B2 (aus der Kanon-Arbeit)
- Namen in 02-world prüfen: „Wanderin **Frida**“ = deutscher Name der Frost-Arenaleiterin aus der Fremdmarke; „Ass-Trainer **Bruno**“ = Name eines Elite-Mitglieds der Fremdmarke → umbenennen. „Gärtner Pim“ neben Kind „Fiete“ (B1) bewusst verschieden.
- „Ordenszwillinge Mox & Lox“ als Komik-Duo im Bösewicht-Team ist ein bekanntes Muster der Fremdmarke → eher zwei einzelne Rekruten.
- `T_('orderNew')` lieferte „Kristallwacht“ (= Hauptstadt des Kristallgebirges) → jetzt „Dämmerbund“.
