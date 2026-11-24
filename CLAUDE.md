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
2. `docs/ANFORDERUNGEN.md` – Anforderungen mit IDs (z. B. `W-04`), Entscheidungen E1–E6, Datenmodell, Meilensteine M0–M7
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

## Nächster Schritt: M0 Bestandsaufnahme

Noch **kein** neuer App-Code. Zuerst:

1. Prüfe `alt/index.html` gegen `docs/ANFORDERUNGEN.md`, vor allem Abschnitt 3 (Medien), 5 (Bilddatenhaltung, Einzelprüfung B-01 bis B-12), 6 (Bildbearbeitung) und 9 (Seiten).
   - Die Datei ist 1,1 MB groß, weil Sticker und Aquarell-Grafiken als WebP-Daten-URLs eingebettet sind. **Nicht komplett lesen.** Mit Suche und Auszügen arbeiten und die Daten-URLs überspringen.
   - Bekannt: Vanilla-JS, eine Datei, Speicher in IndexedDB (Datenbank `kinderkunst`), Schriften Dancing Script / Cormorant Garamond / Nunito.
2. Schreibe das Ergebnis nach `docs/REVIEW-ALT.md`: pro Anforderungs-ID erfüllt / teilweise / fehlt, dazu bekannte Fehler (offene Korrekturen siehe `PROJEKT.md` Abschnitt 4).
3. Gib eine begründete Empfehlung **„Weiterbau oder neues Gerüst“** und einen Tech-Stack-Vorschlag. Berücksichtige die Randbedingungen aus `docs/ARCHITEKTUR.md` (Docker-Container, SQLite plus Dateiablage, Bildverarbeitung auf dem Server, Mikrofon und Kamera in der HA-App).
4. **Der Entwickler entscheidet**, danach beginnt M1 (Fundament).

Verwerfe nicht reflexartig, was nicht passt. Aus der alten App sind Look, Aquarell-Grafiken, Sticker, Layout-Ideen und Bildbearbeitungs-Logik wertvoll und sollen übernommen werden, auch wenn Speicher und Struktur neu entstehen.
