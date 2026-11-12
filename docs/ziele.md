# Veyra – Ziele des Nutzers (Leitdokument für den Orchestrator)

Stand 12.11.2026. Dieses Dokument kennt der Orchestrator (Fable 5.1, mittlere Stufe) und richtet jede Arbeit daran aus. Es wird fortgeschrieben, nie gelöscht.

## Produktziel
- Eigenes Monster-Sammel-RPG „Veyra – Kreaturenchronik, Die Welt der Terras“ für ein kleines Kind; später App/PWA (Netlify, immer dieselbe Site). Deutsch, kurze Sätze, Kampf rundenbasiert.
- Ausschließlich eigene Kreaturen, Namen, Orte, Figuren, Grafiken. Fremde Marken (Pokémon, Nintendo u. a.) dienen nur als Qualitäts-Maßstab auf Prinzipienebene (Lesbarkeit, Lebendigkeit, Spielgefühl), nie als Vorlage.
- Spielstände überleben jedes Update. 2D-Modus bleibt versteckte Option. Runway/Meshy werden nicht genutzt.

## Qualitätsziele (Phase „Detailing“, ab 12.11.)
1. **Innengebäude**: eigene, glaubhafte Innenräume (Häuser, Labor, Läden, Arenen) mit Thema, Möbeln, Licht – kein leerer Kasten.
2. **Höhlen & Sonderorte**: Nebelgrotte, Glutschlucht-Innen, Frosthöhlen usw. mit eigenem Design (Licht, Material, Nebel, Geräusch).
3. **Kreaturenstationen**: Innendesign verbessern; Heil-Sequenz in gleichmäßiger Qualität (keine pixeligen oder „komischen“ Bilder), überall gleiche Bildqualität.
4. **Terras**: moderner, deutlich tierhafter (weniger Fabelwesen), einheitlich hochwertig. Kunstrichtung wird mit dem Nutzer festgelegt (siehe offene Fragen).
5. **Charaktere**: sollen „echt“ wirken (Proportionen, Gesichter, Kleidung, Animation) statt rund/comichaft. Kunstrichtung wird mit dem Nutzer festgelegt.
6. **Charakterentwicklung**: Bedeutung mit dem Nutzer klären (Fortschritt des Spielers? Aussehen des Helden im Spielverlauf?).
7. **Bewegungsdynamik**: Sprinten und Gehen Schritt für Schritt glaubhaft (Fußkontakt, Körperneigung, Armschwung, Beschleunigen/Bremsen), kein Gleiten, kein Zappeln.
8. **Reiten**: Funktion vollständig entfernen (Knopf, Taste R, Zustände, Texte); Schwimmen/Gleiten/Klettern bleiben.
9. **Kreaturenbilder**: Dex, Team, Lager, Kampf zeigen immer das Bild – nie ein Fragezeichen. Ursache finden, robust machen, gleichmäßige Qualität.

## Arbeitsweise (vom Nutzer festgelegt)
- Pro Thema ein eigener Agent („Entwicklerteam pro Aktion“), Opus hohe Stufe für Umbau, Sonnet hohe Stufe für QA. Bei jedem Schritt Modell und Stufe nennen.
- Nach jedem Loop QA mit Noten 1–10; unter 8 Nachbesserung (max. 2 Runden); dann Artifact-Update (gleiche URL) und neue veyra-web.zip.
- Max-Plan: Agenten dürfen ausführlich arbeiten. Tokenoptimiert beim Orchestrator.
- Container: 2 Kerne/8 GB → Browser-Tests nur mit EINEM Chromium gleichzeitig (Sperre, siehe AGENTS.md).

## Entscheidungen des Nutzers (12.11., 11:10)
- Terras: KEINE neuen Bilder. Die prozeduralen 3D-Modelle und Sprites werden moderner und deutlich tierhafter gebaut (echte Tieranatomie als Grundlage: Katze, Hund, Vogel, Fisch, Echse, Nager, Huftier …), zuerst Starter + Welt I (~40 Arten), dann der Rest in Wellen.
- Charaktere: realistische Proportionen im Cel-Look (Erwachsenen-/Kind-Proportionen, echte Gesichter, Kleidung mit Falten), kein Fotorealismus, kein Chibi.
- Charakterentwicklung = Aussehen wächst mit: Der Held bekommt im Spielverlauf sichtbar neue Kleidung, Ausrüstung und Medaillen am Körper.

## Staging und Produktion (Nutzer, 12.11. 15:19)
- **Staging** = Werkstatt-Build (Live-Ansicht in der Veyra Werkstatt, eigener Spielstand). Alle Änderungen der Agenten landen zuerst hier; der Nutzer testet dort.
- **Produktion** = geprüftes Spiel (Artifact Lrpv1XYiorMys1CKhopBKc) und veyra-web.zip für Netlify. Wird NUR nach Freigabe aktualisiert: durch den Nutzer oder durch den Dirigenten nach bestandener QA + Gegenprüfung, wenn der Nutzer das für den jeweiligen Loop erlaubt hat.
- **Vorschau vor Einbau**: Sichtbare Neuerungen (Figuren, Kreaturen, Räume, Oberflächen) werden zuerst als Vorschau in der Werkstatt gezeigt (Abschnitt „Vorschauen zur Freigabe“). Erst nach „Freigeben“ kommt die Änderung in den Werkstatt-Build. Das spart Umbauten, die nachher nicht gefallen.
- Beenden muss im Staging immer sofort möglich sein (Chronik › „Speichern & schließen“, Strg+Q); das Spiel startet aus der Werkstatt in einem eigenen Fenster.
- **Entscheidungen im Staging (Nutzer, 15:20):** Der Dirigent entscheidet im Staging selbst anhand dieses Dokuments – auch über Vorschauen (markiert „freigegeben (Dirigent)“ oder schickt sie mit Begründung zurück). Ist ein Ziel nicht klar genug, fragt er den Nutzer. Der Nutzer kann Vorschauen in der Werkstatt jederzeit ablehnen (Begründung in `note`) – das gilt dann. Am Tagesende gibt der Nutzer einmal das Okay, ob der Staging-Stand in die Produktion geht.
- **Qualitätsanspruch (Nutzer, 15:17):** Das Spiel soll wie ein hochwertiges Vollpreisspiel wirken, nicht „pixelig“: scharfe Texturen mit Details (Stoff, Haut, Fell, Holz, Stein), saubere Kanten (Antialiasing), Schatten, Licht. Figuren so natürlich wie möglich. Terras laufen in der Welt als 3D-Modelle herum; im Kampf erscheint das gemalte Bild (wo vorhanden) – ein bewusster Wechsel.
