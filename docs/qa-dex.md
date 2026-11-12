# QA Dex – Fangkarte ohne Bild (Nutzer-Meldung 10.11. 21:43, zweite Meldung)

Agent „Fangkarte“ (Opus, Stufe hoch). Betroffen: Karte „Neu im Dex“ direkt nach dem Fang (14-battle `catchCard`), außerdem Ergebnis-Karte (Sieg, 44 px),
Level-up-Karte (25-evolve `capFill`), Entwicklung (Bild der neuen Form) und Dex-Liste/-Detail derselben Art.
Die erste Behebung (rDex Lazy, Loop B3) betraf nur das Öffnen der Dex-Liste, nicht diese Karte.

## Nachstellung (Playwright, SwiftShader, `test/art_serve.mjs`, neuer Spielstand, Starter, Route 1, Fang über Tasche → Fangkapsel)

| Fall | vorher | Befund |
|---|---|---|
| Art mit Illustration (059), Bild vorgeladen | Bild da | in Chromium unauffällig |
| bildlose Art (112/120), Vorschaubild frisch | Bild da | `monThumb` rendert synchron (80–300 ms Block) |
| **bildlose Art (108), WebGL-Kontext des Vorschau-Renderers `TR` verloren** | **leeres Farbfeld** (nur Kontaktschatten) | **reproduziert** |
| Illustration noch nicht geladen (langsames Netz, App lädt beim Start 105 Bilder = 5,3 MB vor) | Farbfeld leer, Karte schließt fest nach 3,4 s | **reproduziert** (Bild künstlich verzögert) |
| Artifact-Build (Bilder als data-URI), Glanz, Legende | Bild da | unauffällig |

## Ursachen

1. **Leeres 3D-Vorschaubild wurde für immer gecacht** (`10-mon3d.js monThumb`). Bildlose Arten bekommen ihr Kartenbild aus einem eigenen
   WebGL-Renderer (`TR`, `preserveDrawingBuffer`). Ist dessen Kontext verloren (App im Hintergrund – auf Handys häufig –, zu viele
   WebGL-Kontexte: Welt, Kampf, 3D-Ansicht, Entwicklung, Intro, Vorschau; GPU-Neustart), zeichnet `render()` nichts → das 256-px-Bild ist komplett
   transparent und landete in `THUMB[id]`. Folge: leere Fang-Karte, leerer Dex-Eintrag, kein Welt-Sprite – dauerhaft für diese Art.
2. **Illustration noch nicht geladen/dekodiert, Karte schließt trotzdem.** Die Karte setzte ein `<img decoding="async">` ein und schloss nach
   fest 3,4 s. Beim ersten Fang kurz nach dem Start (Vorladen läuft noch) kam das Bild zu spät oder gar nicht mehr auf die Karte.
3. **Zerbrechliche Darstellung in der 3D-Wende** (nicht in Chromium nachstellbar, kein WebKit im Container): Breite des Bildes nur über
   `width:auto + aspect-ratio + height:100%` in einem schrumpfenden Flex-Element; `<img>` mit eigener Ebene (`will-change`, Schwebe-Animation)
   in `preserve-3d`/`backface-visibility` und darüber das animierte Licht `.front::before` – auf WebKit/iOS bekannt für 0-px-Breite bzw. falsch
   sortierte Ebenen (Bild hinter der weißen Vorderseite).

## Fix

- **`src/10-mon3d.js` (nur Vorschaubild-Cache):** `monThumb` prüft die Deckung (`thumbCover`), cacht leere Bilder nie, legt `TR` bei
  Kontextverlust neu an (`trLost`/`trReset`, höchstens 3× – mehr Kontexte würden den Welt-Renderer verdrängen), Fehlversuche pausieren 4 s/8 s und
  enden nach 3 Versuchen → Aufrufer zeichnen den 2D-Rückfall (`drawMon2D`). Neu `monThumbAsync(id)`: Warteschlange, ein Bild je Leerlauf-Slot.
- **`src/24-capture.js` – Kartenbild `cardPic`:** Canvas in fester Pixelgröße (DPR ≤ 3), synchron aus dekodierter Quelle gezeichnet
  (Illustration, Glanz-Canvas, Key-Art „cover“, Vorschaubild); Deckungsprüfung jeder Zeichnung (leer ⇒ 2D-Rückfall). Fehlt die Quelle:
  Platzhalter in Elementfarbe (pulsierend), `picPrep` lädt/dekodiert, Nachfüllen mit Einblendung, `el.ready` (Promise); spätestens nach 2,6 s
  2D-Rückfall, das echte Bild wird danach noch nachgezogen. Aufruf über `mini(id,size,dim,{card:true})` – ohne `card` bleibt `mini` unverändert.
  Vorladen beim Kampfstart (`startBattleNow`-Hülle): Illustration dekodieren bzw. Vorschaubild im Leerlauf → Karte ist normalerweise sofort voll.
  Stile per JS-`<style>` (keine Änderung an styles.css): feste Größe, `z-index:1` über dem Licht, kein `will-change`, keine Schwebe-Ebene.
- **`src/14-battle.js` (Karten-Teil):** `showCard(html,cls,max,fill)` – `fill(card)` setzt die Bilder ein und liefert „Bild steht“; kommt das Bild
  spät, schließt die Karte frühestens 1,8 s danach. Fang-, Ergebnis-Karte nutzen `cardMini`; Bildgröße folgt der echten `.pm`-Höhe
  (120 px, 100 px im niedrigen Querformat).
- **`src/25-evolve.js` (nur Karte):** Level-up-Karte über `cardPic` + Halten bis Bild steht; `SEQ.evolve` dekodiert Bilder vorher/nachher sofort.
- Dex-Liste/-Detail profitieren über `monThumb` (kein leeres Bild mehr im Cache); `src/15-ui.js` unverändert.

## Tests

`node test/unit_catchcard.mjs` – Foto-Vergleich des Kartenbilds mit/ohne Kreaturen-Ebene (Anteil > 15 %) + Canvas-Deckung; Fälle: Erstfang mit
Bild, Glanz, bildlos frisch, bildlos bei Kontextverlust, Legende, verspätetes Bild (Platzhalter → Nachfüllen, Karte bleibt ≥ 1,5 s offen),
Ergebnis-Karte, Level-up-Karte, Entwicklung 061 → 062 („Neu“), Dex-Liste + Detail nach den Fängen, alle bildlosen Arten mit nicht-leerem
Vorschaubild, 860×400. Ergebnis **29/29 ✓**. Bildschirmfotos `test/catchcard_<fall>.png`.
Zeitverlauf (isoliert): Platzhalter → 2D-Rückfall 2,7 s → Bild 3,2 s → Karte zu 5,3 s (vorher fest 3,4 s).

Regression: `node build.mjs && node test/smoke.mjs` „Keine Fehler.“; alle `unit_*` grün (art 20, battle 33, capture, dex_firstopen 29, encounter 15,
fieldmoves 14, figures 32, finds 34, hybrid 29, introvideo 40, migration 27, opening 24, qa3 36, sky 15, species 33, story 26, walk 16, bigmap 24 –
hybrid und bigmap im Sammellauf je 1 Zeit-/Zwischenstand-Ausreißer, einzeln wiederholt grün; bigmap/hybrid wurden parallel von anderen Agenten geändert);
`qa_look_kampf` 26/26.

## Offen

- Echtes iPhone/Safari ungetestet (kein WebKit im Container); Ursache 3 ist durch den Canvas-Weg umgangen, aber nicht am Gerät bestätigt.
- Drehbare 3D-Ansicht im Dex-Detail (`viewer3d`, eigener Renderer `VR`) hat keinen Kontextverlust-Schutz (nicht in meinem Bereich).
