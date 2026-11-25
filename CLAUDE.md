# Kinderkunst – Arbeitsanweisung für Claude

Dieses Dokument liest Claude zuerst. Es ist die Übergabe der gemeinsamen Planung (Stand 24.11.2026) an die Instanz, die das Projekt weiterbaut.

## Worum es geht

„Kinderkunst“ ist eine Mobile-First-Web-App, mit der Eltern Kunstwerke und Bauwerke ihrer Kinder (0–10 Jahre) archivieren: Fotos, Entstehungsdatum, Alter, Story als Text **und Audio**, Tags. Aus dem Archiv lassen sich Albumseiten gestalten und als PDF bzw. als CEWE-Fotobuch-Paket exportieren. Die App läuft als **Home-Assistant-Add-on** im Heimnetz und ist von unterwegs über den vorhandenen Cloudflare-Zugang erreichbar. Beide Eltern nutzen sie gemeinsam.

Zeitkritisch ist das **Archivieren** (Foto + Story sichern, solange die Kinder klein sind). Das schöne Gestalten kommt danach.

## Wer ist wer

- **Der Entwickler** (Ehemann) – Softwareentwickler, Repo-Besitzer, betreibt Home Assistant. Entscheidet über Architektur und Technik.
- **Seine Frau** – Hauptnutzerin, Ideengeberin. Entscheidet über Optik, Farben, Schriften und Look.

## Was du zuerst lesen sollst

1. `PROJEKT.md` – Idee, Design-Guide, Ist-Stand der alten App, offene Punkte
2. `docs/ANFORDERUNGEN.md` – Anforderungen mit IDs (z. B. `W-04`), Entscheidungen E1–E7, Datenmodell, Meilensteine M0–M7
3. `docs/ARCHITEKTUR.md` – Entscheidungen zu Betrieb, Hosting und Deployment
4. `CHANGELOG.md` – was zuletzt geändert wurde
5. `alt/UEBERGABE.md` – Hintergrund zur alten App; Abschnitte 6–8 sind durch die obigen Dokumente überholt

## Arbeitsregeln

- Code immer **vollständig und lauffähig**, keine Platzhalter, kein „… wie vorher …“.
- **Kleine Schritte.** Pro Sitzung ein klar abgegrenztes Stück eines Meilensteins. Am Ende: `CHANGELOG.md` ergänzen und den Status in `PROJEKT.md` bzw. `docs/ANFORDERUNGEN.md` nachtragen.
- Anforderungs-IDs in Commit-Nachrichten nennen („W-08: Audio-Aufnahme am Werk“).
- **Nie** nach Passwörtern oder Tokens fragen. Zugriff läuft über die vorhandene GitHub-Anbindung.
- `alt/` bleibt unverändert (Referenz).
- Farb- und Stil-Guide in `PROJEKT.md` ist verbindlich. **Optik nicht eigenmächtig ändern**; Vorschläge als offene Frage notieren.
- **Datenschutz, höchste Priorität: Das Repo ist zeitweise öffentlich.** Es dürfen **niemals** Kinderfotos, Kindernamen, Geburtsdaten, Audioaufnahmen, Backups, Screenshots mit echten Inhalten oder andere persönliche Daten committet werden. Testdaten sind frei erfunden (erfundene Namen, Platzhalterbilder, selbst erzeugte Grafiken).
  - **Vor jedem Commit** prüfen: `git status` und `git diff --staged` durchsehen, keine Bild-, Audio-, JSON-Backup- oder Datenbankdateien aus dem echten Bestand dabei.
  - Echte Daten liegen ausschließlich im Datenordner des Add-ons auf dem Home-Assistant-Rechner. Dafür steht in `.gitignore` der Datenordner samt Bild-, Audio-, Datenbank- und Backup-Endungen.
  - **Falls doch etwas Persönliches im Repo gelandet ist:** sofort dem Entwickler melden und nicht nur die Datei löschen. Im Git-Verlauf bleibt sie sichtbar. Dann muss der Verlauf bereinigt oder das Repo neu angelegt werden, und das Repo muss bis dahin auf privat gestellt werden.
  - Keine externen Dienste oder Bild-APIs für Kinderfotos (N-04).
- Änderungen am Datenmodell nur mit Migration (N-05).
- Architektur-Entscheidungen aus `docs/ARCHITEKTUR.md` nur nach Rücksprache mit dem Entwickler ändern.
- Bei Unklarheiten nicht raten: Frage in `PROJEKT.md` unter „Offene Punkte“ eintragen und im Chat stellen.
- Dateien klein und übersichtlich halten (eine Aufgabe pro Datei). Die weitere Arbeit soll auch mit begrenztem Kontingent funktionieren, bei dem Claude nur die betroffene Datei und diese Anweisung sieht.

## Zusammenarbeit

- Vor jeder Sitzung `git pull` und `CHANGELOG.md` lesen.
- Kleine Dokumentations-Änderungen direkt auf `main`. Größere Umbauten auf einem Branch `feature/<name>` und per Pull Request.
- Strukturänderungen (Dateien verschoben, Framework gewechselt) im Changelog ausdrücklich vermerken.

### Entwicklungsablauf (seit 24.11.2026)

- **Die App ist das Kinderkunst-Atelier der Nutzerin (`app/atelier/index.html`).** Entscheidung der Nutzerin am 25.11.2026: Sie will ihre alte App weiterbearbeiten, nicht die neu gebaute Oberfläche. Alle Änderungen an Bedienung und Aussehen passieren **in dieser Datei**, im Stil und mit den Bausteinen der alten App. Nicht neu erfinden, nicht umbauen, nichts „modernisieren“. Die Datei ist 1,1 MB groß (eingebettete Grafiken): gezielt mit Suche und Auszügen arbeiten.
- **Speicherung wie vom Entwickler festgelegt** (SQLite + Dateiablage auf Home Assistant): `app/atelier/speicher.js` ersetzt `load()`/`save()` der alten App. Zustand (Kinder, Fotos, Seiten) als JSON in der Datenbank mit Revision und Sicherungskopien (`routen/atelier.js`, Migration 003); Bilder werden als Dateien hochgeladen und im Zustand durch `api/medien/<id>/datei` ersetzt; jedes neue Foto zusätzlich als **Original in voller Auflösung** (`p.orig`). Gleichzeitige Änderungen zweier Geräte werden nach ID zusammengeführt. Ohne Server speichert `speicher.js` im Browser.
- **Gestaltung: so einfach und intuitiv wie die alte App.** Wenige Knöpfe, kurze Wege. Lieber eine Funktion weglassen als die Oberfläche überladen; im Zweifel fragen.
- **Die Nutzerin ist technische Laiin.** Claude führt sie durch die Meilensteine: Wünsche in Alltagssprache einem Meilenstein zuordnen, erklären, was als Nächstes passiert, und selbst entscheiden, wann ein Stand fertig ist. Maßstab ist die Prüfliste in **`docs/FAHRPLAN.md`**; den Fahrplan nach jedem Meilenstein nachführen. Fachwörter (Branch, Pull Request …) beim ersten Mal kurz erklären.
- Laufende Arbeit auf dem Branch **`feature/entwicklung`**. Ist ein Meilenstein nach der Prüfliste fertig, wird der Branch gepusht und ein **Pull Request** angelegt; der Entwickler übernimmt ihn. Dazwischen wird lokal committet und die Vorschau aktualisiert.
- **Vorschau zum Ausprobieren** ohne Home Assistant: `node werkzeuge/vorschau-bauen.mjs <Ordner>` kopiert `app/atelier`; als privates Claude-Artefakt „Kinderkunst Vorschau“ veröffentlichen (Slug `6ba8c030-c2f4-47ad-acf9-082bbedb4432`), nach jeder Änderung neu. Dort speichert die App im Browser. Das Artefakt hat die Fähigkeit `downloads` (seit 25.11.2026, von der Nutzerin erlaubt), damit PDF, ZIP und Backup dort heruntergeladen werden können (`saveFile` nutzt `claude.use('downloads')`).
- **Ruhend:** `app/web/` (neu gebaute Oberfläche aus M2) und die Routen `kinder`, `werke`, `storys`, `tags` werden von der App nicht benutzt. Unter `/technik` bleibt der Technik-Test erreichbar. Nicht weiterentwickeln, solange die Nutzerin nicht danach fragt; Löschen entscheidet der Entwickler.

## Code-Aufbau (seit M1)

- `app/server/` Node.js ohne Fremdpakete (`node:http`, `node:sqlite`), eine Aufgabe pro Datei: `start.js` → `app.js` → `routen/*.js`; `datenbank.js` + `migrationen/NNN_*.sql`; `ablage.js` (Dateien); `anmeldung.js` (Ingress).
- `app/web/` Oberfläche ohne Build-Schritt: `index.html`, `css/` (Look aus `alt/`), `js/ansichten/` (eine Datei pro Seite), `js/bausteine/` (wiederverwendbare Teile). Alle Adressen **relativ** (Ingress-Pfad).
- `app/test/` mit `node:test`; `npm test` muss grün sein. GitHub Actions (`.github/workflows/pruefen.yml`) testet unter Node 24 und baut beide Docker-Images.
- `kinderkunst-test/` HA-Add-on (Testkanal) und `kinderkunst/` (echte Daten, `KANAL=echt`), beide bauen den Code per `git clone` aus dem Branch in `ARG QUELLE_REF` (Dockerfile). Kein `build.yaml` (seit Supervisor 2026.04 veraltet).
- Gemeinsame Logik für Browser und Server liegt in `app/web/js/` (z. B. `alter.js`, `exif.js`); der Server importiert sie von dort.
- Vorschaubilder mit **sharp** (`server/vorschauen.js`), optional geladen: ohne sharp (z. B. in Claudes Umgebung) liefert der Server das Original. Die sharp-Tests laufen in GitHub Actions.
- Aus `alt/index.html` werden Logik und Grafiken **umgezogen**, nicht neu erfunden (`docs/REVIEW-ALT.md` Abschnitt 5).

## Nächster Schritt

1. Das Atelier läuft mit gemeinsamem Speicher (PR liegt vor). Die Wünsche der Nutzerin vom 25.11.2026 sind in die Meilensteine A1–A4 aufgeteilt (`docs/FAHRPLAN.md`). A1 und A2 sind fertig, A3 Seiten gebaut; als Nächstes A4 Fotobuch & PDF (Export soll aussehen wie die Seitenansicht: `frame()` nutzt noch `cover()` statt `fitBox`). Rückmeldungen **in `app/atelier/index.html`** einarbeiten, in kleinen Schritten, jeweils Vorschau aktualisieren.
2. Offene Korrekturen der alten App (`PROJEKT.md` Abschnitt 4, `docs/REVIEW-ALT.md` Abschnitt 4), z. B. PDF-Button, Bildbeschnitt 5 % (`CROP` in `fitBox`), nur nach Rücksprache.
3. Frühtests auf HA (Kamera, große Uploads über Cloudflare, zwei Benutzer gleichzeitig) in `PROJEKT.md` eintragen.
