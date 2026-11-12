# Intro-Film (10.11.2026, Agent „Intro-Video“, Opus mittel)

Grundlage: AGENTS.md › INTRO-VIDEO + LOOK-REFERENZ. Quelle: `public/video/intro_720.mp4` (1280×720, H.264/AAC, 87,5 s, 16,4 MB), `intro_480.mp4` (854×480, 6,0 MB), `intro_poster.jpg` (32 KB, trägt das Kristall-Logo „VEYRA – Die Welt der Terras“).

## Ablauf (App, dist/index.html)
1. **Titel:** Poster als Hintergrund (weich gezeichnet + abgedunkelt per `#title.poster::after`, weil das Poster das Logo selbst enthält → kein Doppel-Logo), Untertitel „Die Welt der Terras“ unter „VEYRA“ (`#title .tsub`, beide Varianten). Erst wenn der Titel sichtbar ist (Legenden-Intro `#intro` zu, `mode==='title'`), legt 44 ein `<video preload="metadata">` an – keine Videodaten während des Bootens.
2. **„Neues Spiel“** → `newGame()` (15) → `introFilmGate()` (44) → danach wie bisher `playSeq('intro')` (23, Veyran/Charaktererstellung).
3. **Erstes Mal** (`SET.introSeen` leer): Film sofort. **Danach:** kurze Glas-Abfrage „Intro ansehen?“ (Ja = Film, Nein/Escape = direkt interaktiv).
4. **Film-Overlay** `.ivL` (fixed, z 95, schwarz): Video füllt das Bild (`object-fit: cover`); weicht das Seitenverhältnis so stark von 16:9 ab, dass > 12 % Bild verloren gingen (z. B. 860×400 = 2,15:1, 4:3-Tablet, Hochformat), dann `contain` mit schwarzen Rändern. 2:1 bleibt cover.
5. **Ton:** `play()` mit Ton (direkt nach dem Tipp auf „Neues Spiel“, daher erlaubt), Lautstärke = `SET.vol`. Verweigert der Browser (`NotAllowedError`) → stumm starten + dezenter „Ton an“-Knopf unten links. Synth-Musik (11) ist währenddessen stumm (`SET.music` temporär 0, danach zurück).
6. **„Überspringen“** unten rechts (Glas-Pille, 48 px hoch) erscheint beim **ersten Ansehen erst nach 18 s** (vorher zeigt ihn weder Tippen noch Taste, Escape wirkt nicht), bei jedem weiteren Ansehen nach 2 s; Tippen ins Bild zeigt ihn dann sofort; Testharness (`navigator.webdriver`) ohne Sperre, `window.VEYRA_LOCK=1` erzwingt sie; Escape überspringt, Enter/Leertaste zeigen ihn bzw. überspringen, wenn sichtbar.
7. **Ende/Skip:** Bild und Ton blenden in 0,7 s zu Schwarz, dann startet die nächste Ebene unter einer 0,45-s-Schwarzblende (kein Aufblitzen des Titels). `SET.introSeen=1` wird gesetzt, sobald der Film tatsächlich läuft (`playing`).
8. **Fehler** (Datei fehlt/404, Codec – `canPlayType(INTRO_VIDEO.type)` leer –, `error`-Ereignis, `play()` scheitert auch stumm, kein Start binnen 8 s) → Overlay sofort weg, weiter ins interaktive Intro, Flag bleibt aus.
9. **Optionen › Erweitert › „Intro-Film abspielen“** (nur App): spielt nur den Film (`replayIntroFilm()`), danach zurück an die vorige Stelle (Titel bzw. Welt).

## Quelle
`ivSrc()`: 720p; `navigator.connection.saveData` oder `effectiveType` ∈ slow-2g/2g/3g → 480p.

## Loop/Performance
Während des Films ist `mode='title'` (vorheriger Modus wird danach wiederhergestellt): `loopIdle()` drosselt auf 30 FPS, `loop()` (15) rendert keine Welt (`draw3d`/`draw` nur bei `mode!=='title'`), HUD (`hudTick`) aus, Uhr/Roamer stehen. Auch die Titel-Kreaturen (`#tcv`) zeichnen nicht, solange `IV.on`. Geprüft im Spiel: 0 `draw3d`-Aufrufe während des Films.

## Webdriver/QA
- `navigator.webdriver` ohne `VEYRA_DEMO` (Smoke): Film übersprungen, `SET.introSeen=1`, kein Vorladen.
- `VEYRA_DEMO` (qa_b_intro): Film übersprungen. Tests, die den Film echt abspielen, setzen zusätzlich `window.VEYRA_VIDEO=1`.

## Artifact (dist/artifact.html)
Kein Video (16-MB-Grenze): `window.INTRO_VIDEO=null`, nur das Poster als data-URI (`window.INTRO_POSTER`, ~44 KB). Beim ersten „Neues Spiel“: Poster-Standbild 2 s – das Poster (mit Logo) schärft sich aus Unschärfe/Dunkel auf (Logo-Einblendung), Tippen kürzt ab, dann Blende ins interaktive Intro; danach `SET.introSeen=1`, weitere neue Spiele ohne Standbild. Titel ohne Poster-Hintergrund, keine Options-Zeile. Das Artifact enthält kein „.mp4“ (Dateiname/Typ kommen nur aus build.mjs in die App).

## Build (build.mjs)
`introJs(inline)` schreibt `window.INTRO_VIDEO={hd,sd,poster,type}` (App, nur wenn `public/video/intro_720.mp4` existiert) bzw. `null` (Artifact) und `window.INTRO_POSTER`. `public/video` → `dist/video` (wie models/vendor, vorher geleert).

## Service Worker (public/sw.js)
- Video **nicht** im Vorab-Cache (`SHELL` unverändert).
- `/video/*` (außer jpg): eigener Cache `veyra-video-1` (übersteht Versionswechsel; `activate` löscht ihn nicht). Treffer → Range-Anfragen des Video-Elements werden aus dem Blob als `206` mit `Content-Range` beantwortet (nötig für Safari/iOS). Fehlt die Datei im Cache → Netz direkt (Streaming) und im Hintergrund einmal die ganze Datei (200) ablegen – nicht bei `saveData`.
- Allgemeiner Cache legt nur noch `200`-Antworten ab (vorher `res.ok` → `206` hätte `cache.put` scheitern lassen).
- Spielstand/Einstellungen (localStorage) bleiben unberührt.

## Schnittstellen (44-introvideo.js)
| Name | Bedeutung |
|---|---|
| `introFilmGate()` | Promise; Tor vor dem interaktiven Intro (Abfrage, Film bzw. Poster, Webdriver-Abkürzung) |
| `playIntroFilm(o)` | Promise `{played, why}`; why ∈ ended · skip · error · timeout · codec · none |
| `replayIntroFilm()` | Optionen: Film erneut, Optionen/Chronik schließen |
| `ivSrc()`, `ivSlow()` | gewählte Quelle / langsame Verbindung |
| `IV` | `{el, err, on, busy, last}` – `on` während des Films, `last` = letzter Ausgang |
| `SET.introSeen` | 1 nach erstem Abspielen (07-Einstellungen, localStorage) |

## Tests
`node build.mjs && node test/unit_introvideo.mjs` (43 Prüfungen): Build/Artifact/SW statisch, Titel (Poster, Untertitel, Vorladen), Abspielen, Skip nach 2 s/≥ 48 px, Tippen zeigt Skip, Escape, cover/contain je Seitenverhältnis, Flag, „Intro ansehen?“ Ja/Nein, Optionen, 480p bei 3g, Fehlerpfad 404 + Codec, Webdriver-Pfad, Loop-Pause im Spiel, stummer Start + „Ton an“ (Autoplay-Sperre nachgebildet, Headless ignoriert die echte Regel), Artifact-Variante (in Dokument-Skelett gelegt).
Screenshots: `test/introvideo_title.png`, `test/introvideo_overlay.png` (1280×720), `test/introvideo_overlay_860.png`, `test/introvideo_ask.png`, `test/introvideo_poster.png`.

## Titel-Opening (ersetzt das Legenden-Intro, Nutzer 10.11. 21:34: „weniger machen, keine Kreaturen“)
Läuft **vor dem Titelbild** (`#intro`, 12-intro.js); der Intro-Film nach „Neues Spiel“ (oben) bleibt unverändert und zeigt die Kreaturen.
- **Ablauf (≈ 5,2 s + 0,6 s Blende):** „Tippe, um zu beginnen“ liegt über einem abgedunkelten Standbild desselben Himmels. Nach dem Tippen: Dämmerung über Veyra – Himmelsbild `sky_lichtlande_abend` als Panorama (2D-Ausschnitt aus dem Equirect), Kamera schwenkt langsam nach links zur Sonne und hebt sich, die Kulisse `horizon_lichtlande` (Kristall-Kathedrale, abgedunkelt zur Silhouette) zieht schneller (Parallax = Tiefe). Licht steigt (Abdunklung 0,58 → 0,08), weiche Sonnenstrahlen, der Kristallring der Kathedrale leuchtet auf, Lichtfunken steigen auf. Ab 1,5 s blendet der Titel „VEYRA · Kreaturenchronik · Die Welt der Terras“ ein (`#introLogo`, Untertitel 0,7 s später), Abdunklung hinter dem Titel für Lesbarkeit. Bei 5,2 s → `endIntro()` → Titelbild.
- **Bewusst ohne Kreaturen, Figuren oder Fremd-Elemente**; kein `drawMon`/`buildMon3D`/`animMon` (geprüft in `test/unit_opening.mjs`).
- **Warum 2D statt three.js:** echte Tiefe durch Parallax (bei einer Himmelskugel liegen Himmel und Kulisse beide „im Unendlichen“ und bewegen sich gleich), kein zweiter WebGL-Kontext auf dem Handy, funktioniert auch unter `file://` (Canvas-`drawImage` ist dort erlaubt, WebGL-Upload nicht). Der Endblick legt die Kathedrale auf ~18–28 % Bildbreite (auch hochkant).
- **Überspringen:** ab 1 s per Tippen, Taste (außer Tab) oder Knopf „Überspringen“ (erscheint ab 1 s). `navigator.webdriver`/`VEYRA_DEMO`: sofort Endbild mit Titel, Knopf sofort, schließt nach 2,5 s selbst (Smoke klickt bei 1,2 s). `window.VEYRA_OPEN=1` spielt im Test echt ab, `window.VEYRA_OPEN_T=<s>` friert das Bild auf eine Zeit ein (Screenshots).
- **Klang:** `I3` ist während des Openings gesetzt → 11-fx spielt die leise „intro“-Klangfläche; dazu zwei leise Sinus-Sweeps (`sweep` aus 16, nur bei `SET.sfx`). Kein neues Asset.
- **Rückfall:** fehlt ein Bild → prozeduraler Abend-Verlauf, sanfte Bergschatten und eine einfache Turm-/Ring-Silhouette. Artifact nutzt automatisch die `_lo`-Bilder (bereits eingebettet, keine neue Datei).
- **Optionen:** „Titel-Opening beim Start“ (`SET.intro`) und „Titel-Opening ansehen“ (`playLegendIntro()`, Name bleibt). Erhaltene Namen: `startIntro`, `startIntro3D` (Alias), `endIntro`, `playLegendIntro`, `introOn`, `I3`. 13-intro3d.js ist nur noch ein Hinweis-Kommentar.
- **Test:** `node build.mjs && node test/unit_opening.mjs` (24 Prüfungen) · Screenshots `test/opening_{0s,2s,4s}_{1920,860}.png`, `test/opening_fallback_860.png`.
