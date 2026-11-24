# Kinderkunst – Projektübersicht

| | |
|---|---|
| **Version** | 4 |
| **Stand** | 24.11.2026 |
| **Weiterführend** | `CLAUDE.md` (Arbeitsanweisung) · `docs/ANFORDERUNGEN.md` (Anforderungen, Meilensteine) · `docs/ARCHITEKTUR.md` (Betrieb) |

**Legende Status:** ✅ fertig und getestet · ⚠️ vorhanden, aber fehlerhaft · ⬜ offen · ❓ ungeprüft (wird in M0 geklärt)

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

Rounded Paper, Wellenrand, Polaroid, Oval, Stern, gerissenes Papier, Floral Border (in der alten App zusätzlich Torbogen und Briefmarke).

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
| Kinderbilder vollständig ohne Abschneiden (`object-contain`), wenig Weißraum | ⚠️ | Bis zu 10 % Beschnitt gegen Weißraum (bewusster Kompromiss im Code) |
| PDF-Button funktioniert; PDF im gleichen Stil wie die Albumseiten | ⚠️ | Ursache offen; Stilabweichung, weil Vorschau (HTML) und Export (Canvas) getrennt programmiert sind |

Diese Korrekturen werden **nicht** mehr an der alten App umgesetzt, sondern in der neuen Version (Meilensteine M3 bis M6).

## 5. Ziel und Roadmap

Ziel, Betrieb und Entscheidungen stehen in `docs/ARCHITEKTUR.md`, die Meilensteine M0 bis M7 in `docs/ANFORDERUNGEN.md` Abschnitt 15.

| # | Meilenstein | Status |
|---|---|---|
| M0 | Bestandsaufnahme, Entscheidung Weiterbau/Neustart, Tech-Stack | ✅ Review fertig (`docs/REVIEW-ALT.md`), **Entscheidung durch den Entwickler offen** |
| M1 | Fundament: Repo, Docker + HA-Add-on, SQLite + Dateiablage, Ingress, Backup, Kamera-/Mikrofontest | ⬜ |
| M2 | Archiv-MVP: Kinder, Werke, Fotos, Story Text + Audio, Tags, Galerie | ⬜ |
| M3 | Bildbearbeitung nicht-destruktiv | ⬜ |
| M4 | Sticker und Themen | ⬜ |
| M5 | Seiten kuratieren | ⬜ |
| M6 | Buch und Export (CEWE-ZIP, PDF) | ⬜ |
| M7 | Veröffentlichung (optional) | ⬜ |

### Zu CEWE / MCF

- MCF/MCFX ist ein proprietäres CEWE-Projektformat (MCFX ist ein SQLite-Container). Eine öffentliche Spezifikation wurde nicht gefunden.
- Eine öffentliche API für Privatentwickler wurde nicht gefunden. Partner-Schnittstellen wären direkt bei CEWE zu erfragen (optional).
- Realistischer Weg: druckfertige Seitenbilder (ZIP) bzw. PDF statt Direktübergabe.

## 6. Offene Punkte

- [x] M0 durchführen und Status in Abschnitt 3 und 4 eintragen
- [ ] Weiterbau oder neues Gerüst und Tech-Stack festlegen (Entwickler). Empfehlung aus M0: neues Gerüst, alte Logik und Grafiken umziehen, Node.js + SQLite + sharp, Frontend ohne Build-Schritt (`docs/REVIEW-ALT.md` Abschnitt 5 und 6)
- [ ] CPU-Architektur des HA-Rechners (arm64 oder amd64) für die Wahl der Bildbibliotheken (Entwickler)
- [ ] **Datenschutz:** Sind die Vornamen in `docs/ANFORDERUNGEN.md` (Beispiel bei W-04 und Abschnitt 14) echte Namen der Kinder? Falls ja: ersetzen und Verlauf bereinigen, bevor das Repo öffentlich wird (Entwickler)
- [ ] Bilder auf Seiten immer vollständig oder leichter Beschnitt als Einstellung? (seine Frau)
- [ ] Welche Rahmenliste gilt: Design-Guide (mit Oval, Stern, Floral Border) oder Stand der alten App? Sollen Deko-Ebenen mit „Schlichter“ zurückkommen? (seine Frau)
- [ ] Gibt es die Aquarell-Sticker in höherer Auflösung? Sollen die 63 älteren, ungenutzten Sticker übernommen werden? (seine Frau)
- [ ] CEWE-Format festlegen, z. B. 21×28 cm hoch oder 30×30 cm quadratisch (seine Frau)
- [ ] Gemeinschaftswerk-Lösung W-04 bestätigen, Beitrag pro Kind nötig? (beide)
- [ ] Sollen Großeltern mitlesen dürfen (R-04)? (beide)
- [ ] Zusatzideen der Frau in `docs/ANFORDERUNGEN.md` Abschnitt 17 ergänzen
- [ ] Deployment-Weg auf HA festhalten (Entwickler), siehe `docs/ARCHITEKTUR.md`

## 7. Änderungsprotokoll

Siehe `CHANGELOG.md`.
