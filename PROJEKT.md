# Kinderkunst – Projektübersicht

| | |
|---|---|
| **Version** | 4 |
| **Stand** | 24.11.2026 |
| **Weiterführend** | `CLAUDE.md` (Arbeitsanweisung) · `docs/ANFORDERUNGEN.md` (Anforderungen, Meilensteine) · `docs/ARCHITEKTUR.md` (Betrieb) |

**Legende Status:** ✅ fertig und getestet · ⚠️ vorhanden, aber fehlerhaft · ⬜ offen · 🔄 in Arbeit · ❓ ungeprüft

## 1. Idee

Mobile-First-Web-App zum **Archivieren und Gestalten von Kinderkunstwerken und Bauwerken** (gemalte Bilder, Lego, Kapla) von Kindern im Alter von 0–10 Jahren. Zu jedem Werk wird eine **kleine Story** festgehalten: was das Kind dazu sagt, **als Text oder Audioaufnahme**. Die Ergebnisse sind als **PDF oder CEWE-Fotobuch-Seiten** nutzbar.

Leitprinzip: Die App-Oberfläche ist ruhig und schlicht („Papeterie- & Atelier-Look“). Verspielte Aquarell-Themen erscheinen **nur auf der gestalteten Albumseite**.

Zeitkritisch: Erst das **Archivieren**, dann das Gestalten.

## 2. Design-Guide (verbindlich, Optik-Entscheidungen trifft seine Frau)

### Farben

| Name | Hex |
|---|---|
| Cremeweiß (Hintergrund) | `#F4EFEB` |
| Salbeigrün | `#B2B89D` |
| Altrosa | `#E8C1B7` |
| Terrakotta | `#D28A74` |
| Senfgelb | `#E6BA72` |
| Eisblau | `#A8C3C8` |
| Sternenblau | `#6B8E9B` |

### Schriften (aus der alten App)

| Einsatz | Schrift |
|---|---|
| Schreibschrift-Titel | Dancing Script |
| Überschriften | Cormorant Garamond |
| Fließtext / Oberfläche | Nunito |

Die Schriften sollen künftig **lokal ausgeliefert** werden, nicht von Google Fonts geladen (Datenschutz, funktioniert auch ohne Internet).

### Oberfläche

- Salbeigrüne App-Leiste mit Zurück-Pfeil, Titel und Zahnrad
- Kind-Pille „Name (4 Jahre, 3 Mo.) ♍“, Alter und Sternzeichen aus dem Geburtsdatum
- Werkzeugleisten: Drehen, Zuschneiden, Aufhellen, Perspektive / Layout, Thema, Sticker, Text, Deko an/aus, Assistent
- Dunkelmodus ist in der alten App vorhanden

### Themenwelten (nur Albumseite)

Feenwald, Unterwasserwelt, Regenbogen, Dino, Jahrmarkt, Kindergarten, Tierpark, Sonne/Mond/Sterne, Ruhige Naturtöne. **Zusätzlich gewünscht:** Weihnachten, Ostern, Geburtstag.

### Rahmen

Wie in der alten App (Entscheidung 24.11.2026: Design bleibt nah an der alten App): Ohne Rahmen, Soft Fade, Wolke, Papierrahmen, Polaroid, Büttenrand, Wellenrand, Torbogen, Briefmarke, Washi-Tape, Feinlinie, Kissenform. Oval, Stern und Floral Border entfallen; Deko-Ebenen bleiben wie in der alten App abgeschaltet.

### Bilder auf Seiten

Werke werden möglichst vollständig gezeigt. Damit wenig Weißraum bleibt, darf ein Bild höchstens **5 %** beschnitten werden (alte App: 10 %).

### Sticker

Die 122 Aquarell-Sticker der alten App bleiben. Für den Druck werden sie in M4 in höherer Auflösung gebraucht (siehe Offene Punkte). Die 63 älteren, ungenutzten Sticker werden nicht übernommen.

## 3. Alte App (`alt/index.html`)

Eine einzige HTML-Datei (ca. 1,1 MB), Vanilla-JavaScript und CSS, kein Build-Schritt. Sticker und Aquarell-Grafiken sind als WebP-Daten-URLs eingebettet. Daten liegen **im Browser** (IndexedDB, Datenbank `kinderkunst`), nicht auf einem Server. Sie enthält nur **Testdaten**.

Funktionsumfang laut Übergabe, **geprüft in M0** (Code-Review, nicht im Browser getestet; Details und Zeilenangaben in `docs/REVIEW-ALT.md`):

| Bereich | Funktion | Status | Befund M0 |
|---|---|---|---|
| Basis | Kinderprofile mit Geburtsdatum, Alter und Sternzeichen berechnet | ✅ | Kein Profilbild |
| Basis | Seiten-Editor Hoch-/Querformat, 1–5 Bilder pro Seite | ✅ | Mehrere Anordnungen je Bildzahl, automatische Wahl |
| Basis | Textfelder Name, Datum, Alter, Anekdote | ⚠️ | Werte werden kopiert, Datum = Anlagetag statt Entstehungsdatum, Story hängt an der Seite |
| Basis | Upload per Kamera oder Galerie, direkt auf der Albumseite | ⚠️ | Verkleinert auf 1.800 px (Original weg); die programmierte Galerie ist nicht erreichbar |
| Bild | Drehen, Zuschneiden, Zoom, Helligkeit/Kontrast/Sättigung, „Papier aufhellen“ | ✅ | Nur 90°-Drehung, kein feines Drehen |
| Bild | 4-Ecken-Perspektivkorrektur | ✅ | Echte Perspektiventzerrung; Lupe fehlt |
| Gestaltung | Formen, Rahmen, Themen-Hintergründe pro Seite | ⚠️ | 12 Themen, 12 Rahmen; Oval, Stern, Floral Border entfernt |
| Gestaltung | Ebenen: Basis-Aquarell plus antippbare Rand-Deko, Button „Schlichter“ | ⬜ | Im Code abgeschaltet, keine Bedienung |
| Gestaltung | Sticker-Sets inkl. Lego/Kapla und Sternzeichen | ✅ | 122 Sticker in 15 Sets; nur ca. 150 px groß (Druckschärfe) |
| Gestaltung | Stille Design-Beraterin (Icon, nur auf Antippen, keine Pop-ups) | ✅ | Lokale Prüfungen inkl. dpi-Warnung |
| Export | Deckblatt-Generator | ✅ | |
| Export | Heimdrucker-PDF 300 dpi mit Druckrand | ⚠️ | Code formal schlüssig, Ursache des Fehlers nicht reproduziert; Vorschau und Export sind getrennt programmiert |
| Export | Fotobuch-ZIP, 300 dpi, 3 mm Beschnitt | ✅ | Format fest 21×28 cm; Bildquelle nur 1.800 px |
| Export | JSON-Backup-Export und -Import | ✅ | Nur Browser-Bestand mit Base64-Bildern |

**Nicht vorhanden (neu):** gemeinsamer Datenbestand für mehrere Nutzer, Audio-Story, eigener Archiv-Bereich, Medium-Entität, Gemeinschaftswerke, Tags, Eingangskorb. Siehe `docs/ANFORDERUNGEN.md`.

## 4. Bekannte Korrekturwünsche an der alten App

| Korrektur | Status | Befund M0 |
|---|---|---|
| Zuschneiden und Perspektivrahmen: Griffe an Ecken **und** Seitenmitten, ganzer Rahmen verschiebbar | ✅ | Im Code umgesetzt; Lupe fehlt noch (I-01) |
| Sticker per Maus und Touch verschiebbar, skalierbar, löschbar | ✅ | Im Code umgesetzt; Drehen fehlt (S-05) |
| Kinderbilder vollständig ohne Abschneiden (`object-contain`), wenig Weißraum | ✅ Ansicht / ⚠️ Export | In der App höchstens 5 % Beschnitt (A3). PDF/ZIP-Export schneidet noch auf Feldgröße zu, Korrektur in A4 |
| PDF-Button funktioniert; PDF im gleichen Stil wie die Albumseiten | ⚠️ | Ursache offen; Stilabweichung, weil Vorschau (HTML) und Export (Canvas) getrennt programmiert sind |

Diese Korrekturen werden **nicht** mehr an der alten App umgesetzt, sondern in der neuen Version (Meilensteine M3 bis M6).

## 5. Ziel und Roadmap

Ziel, Betrieb und Entscheidungen stehen in `docs/ARCHITEKTUR.md`, die Meilensteine M0 bis M7 in `docs/ANFORDERUNGEN.md` Abschnitt 15.

| # | Meilenstein | Status |
|---|---|---|
| M0 | Bestandsaufnahme, Entscheidung Weiterbau/Neustart, Tech-Stack | ✅ Review fertig (`docs/REVIEW-ALT.md`), **Entscheidung durch den Entwickler offen** |
| M1 | Fundament: Repo, Docker + HA-Add-on, SQLite + Dateiablage, Ingress, Backup, Kamera-/Mikrofontest | ✅ fertig (Add-ons „Kinderkunst (Test)“ und „Kinderkunst“). Offen: Frühtests auf HA, Backup-Export als Datei (B-08) |
| M2 | Archiv-MVP: Kinder, Werke, Fotos, Story Text + Audio, Tags, Galerie | ✅ gebaut (Branch `feature/entwicklung`, PR); Rückmeldungen ausstehend. Umfang siehe `docs/ANFORDERUNGEN.md` Abschnitt 15a |
| M3 | Bildbearbeitung nicht-destruktiv | ⬜ |
| M4 | Sticker und Themen | ⬜ |
| M5 | Seiten kuratieren | ⬜ |
| M6 | Buch und Export (CEWE-ZIP, PDF) | ⬜ |
| M7 | Veröffentlichung (optional) | ⬜ |

Seit 25.11.2026 entsteht alles im Atelier der Nutzerin, in vier Meilensteinen aus ihrer Wunschliste (Einzelheiten `docs/FAHRPLAN.md`, Stand `docs/ANFORDERUNGEN.md` Abschnitt 15b):

| # | Meilenstein | Status |
|---|---|---|
| A1 | Archiv: Profilbild und Lieblingsfarbe, Zeitstrahl, Datum aus dem Foto, Stichwörter, viele Fotos auf einmal, Großansicht mit Wischen, Suchen und Filtern, Papierkorb, Warnung beim Löschen | ✅ fertig 25.11.2026 (von der Nutzerin abgenommen) |
| A2 | Fotos verbessern: Lupe und automatische Eckenerkennung, feines Drehen, Vorher/Nachher | ✅ fertig 25.11.2026 (abgenommen) |
| A3 | Seiten: Sticker drehen, Sticker-Vorschläge aus Stichwörtern, kein Abschneiden, Seiten ändern sich mit | ✅ gebaut 25.11.2026, Rückmeldung ausstehend |
| A4 | Fotobuch & PDF: PDF wie in der App, PDF-Knopf, Fotobuch aus mehreren Seiten, Geschwister | ⬜ |

### Frühtests M1 (auf Home Assistant, Technik-Test-Seite)

| Test | Ergebnis |
|---|---|
| Fotos per Kamera/Galerie in der HA-App (Android) hochladen | ⬜ |
| Mehrere große Fotos (je 4 MB+) über Cloudflare hochladen | ⬜ |
| Mikrofon-Aufnahme in der HA-App | ⬜ |
| Live-Kamera in der HA-App | ⬜ |
| Beide Eltern gleichzeitig, jeder mit eigenem HA-Konto (zwei Namen sichtbar) | ⬜ |
| Backup und Wiederherstellung des Add-ons | ⬜ |

Lokal (Chrome mit simulierter Kamera und simuliertem Mikrofon) am 24.11.2026 erfolgreich: Upload 4,7 MB byte-genau gespeichert, Duplikat erkannt, Aufnahme gespeichert, Live-Kamera.

### Zu CEWE / MCF

- MCF/MCFX ist ein proprietäres CEWE-Projektformat (MCFX ist ein SQLite-Container). Eine öffentliche Spezifikation wurde nicht gefunden.
- Eine öffentliche API für Privatentwickler wurde nicht gefunden. Partner-Schnittstellen wären direkt bei CEWE zu erfragen (optional).
- Realistischer Weg: druckfertige Seitenbilder (ZIP) bzw. PDF statt Direktübergabe.

## 6. Offene Punkte

- [x] M0 durchführen und Status in Abschnitt 3 und 4 eintragen
- [x] Neues Gerüst und Tech-Stack festgelegt (24.11.2026), siehe `docs/ARCHITEKTUR.md` A7/A8
- [x] HA-Rechner: Raspberry Pi, vermutlich Pi 5 (`aarch64`)
- [x] Datenschutz: Personennamen und Foto-Beschreibungen aus allen Dokumenten **und dem Git-Verlauf** entfernt (24.11.2026)
- [ ] **Repo privat und Home Assistant (Entwickler, spätestens zum nächsten Meilenstein):** Das Test-Add-on holt sich den Code beim Bauen von GitHub. Ist das Repo privat, schlägt „Neu bauen“ fehl (das installierte Add-on läuft weiter). Möglichkeiten: (a) Repo zum Ausrollen kurz öffentlich stellen, (b) fertiges Image in GitHub Packages (privat) bauen lassen und in HA unter „Registries“ hinterlegen; dann braucht es ein kleines öffentliches Repo nur mit der Add-on-Beschreibung, (c) Add-on-Ordner als lokales Add-on per Samba in den Ordner `addons` auf dem HA-Rechner kopieren.
- [ ] Alte Commits sind bei GitHub noch über ihre direkte Kennung abrufbar, bis GitHub sie aufräumt. Für endgültiges Entfernen beim GitHub-Support „cached views“ löschen lassen (Entwickler)
- [x] Bildbeschnitt auf Seiten höchstens 5 %; Rahmen und Deko wie in der alten App
- [ ] **Sticker in Druckauflösung (M4):** Die vorhandenen Sticker sind 90–249 px groß. Claude kann keine neuen Aquarell-Rastergrafiken malen. Möglich sind: (a) hochrechnen der vorhandenen Grafiken (wird etwas weicher), (b) neue Fassungen mit einem Bildgenerator erzeugen, die vorhandenen Sticker als Vorlage, (c) Sticker im Druck kleiner halten. Entscheidung in M4 (seine Frau)
- [ ] CEWE-Format festlegen, z. B. 21×28 cm hoch oder 30×30 cm quadratisch (seine Frau)
- [ ] Gemeinschaftswerk-Lösung W-04 bestätigen, Beitrag pro Kind nötig? (beide)
- [ ] Sollen Großeltern mitlesen dürfen (R-04)? (beide)
- [ ] Zusatzideen der Frau in `docs/ANFORDERUNGEN.md` Abschnitt 17 ergänzen
- [ ] Deployment-Weg auf HA festhalten (Entwickler), siehe `docs/ARCHITEKTUR.md`
- [x] Hintergründe in Druckqualität: selbst gemalt mit `werkzeuge/grafiken/aquarell-malen.py` (1600×1131), Rückmeldung der Nutzerin ausstehend.
- [ ] **Endgültig gelöschte Werke (Entwickler):** Leert die App den Papierkorb, verschwindet das Werk aus dem gespeicherten Zustand; die Bilddateien (Original, Arbeitsfassung) bleiben aber im Datenordner des Add-ons liegen. Sollen sie automatisch mit gelöscht werden? (Vorschlag: täglicher Aufräumlauf, der Dateien löscht, auf die weder der Zustand noch eine der letzten Sicherungskopien verweist.)
- [x] Knopf „Foto hochladen“ klemmt in der Vorschau (Claude-App lässt dort keine Dateiauswahl zu). Ersatz: Knopf „Beispielfotos“ nur in der Vorschau. Auf Home Assistant noch prüfen (Frühtest).

## 7. Änderungsprotokoll

Siehe `CHANGELOG.md`.
