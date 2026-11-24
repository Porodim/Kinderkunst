# Kinderkunst – Projektübersicht

| | |
|---|---|
| **Version** | 3 |
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

Funktionsumfang laut Übergabe, Status in M0 zu prüfen:

| Bereich | Funktion | Status |
|---|---|---|
| Basis | Kinderprofile mit Geburtsdatum, Alter und Sternzeichen berechnet | ❓ |
| Basis | Seiten-Editor Hoch-/Querformat, 1–5 Bilder pro Seite | ❓ |
| Basis | Textfelder Name, Datum, Alter, Anekdote | ❓ |
| Basis | Upload per Kamera oder Galerie, direkt auf der Albumseite | ❓ |
| Bild | Drehen, Zuschneiden, Zoom, Helligkeit/Kontrast/Sättigung, „Papier aufhellen“ | ❓ |
| Bild | 4-Ecken-Perspektivkorrektur | ❓ |
| Gestaltung | Formen, Rahmen, Themen-Hintergründe pro Seite | ❓ |
| Gestaltung | Ebenen: Basis-Aquarell plus antippbare Rand-Deko, Button „Schlichter“ | ❓ |
| Gestaltung | Sticker-Sets inkl. Lego/Kapla und Sternzeichen | ❓ |
| Gestaltung | Stille Design-Beraterin (Icon, nur auf Antippen, keine Pop-ups) | ❓ |
| Export | Deckblatt-Generator | ❓ |
| Export | Heimdrucker-PDF 300 dpi mit Druckrand | ⚠️ PDF-Button zuletzt fehlerhaft |
| Export | Fotobuch-ZIP, 300 dpi, 3 mm Beschnitt | ❓ |
| Export | JSON-Backup-Export und -Import | ❓ |

**Nicht vorhanden (neu):** gemeinsamer Datenbestand für mehrere Nutzer, Audio-Story, eigener Archiv-Bereich, Medium-Entität, Gemeinschaftswerke, Tags, Eingangskorb. Siehe `docs/ANFORDERUNGEN.md`.

## 4. Bekannte Korrekturwünsche an der alten App

| Korrektur | Status |
|---|---|
| Zuschneiden und Perspektivrahmen: Griffe an Ecken **und** Seitenmitten, ganzer Rahmen verschiebbar | ❓ |
| Sticker per Maus und Touch verschiebbar, skalierbar, löschbar | ❓ |
| Kinderbilder vollständig ohne Abschneiden (`object-contain`), wenig Weißraum | ❓ |
| PDF-Button funktioniert; PDF im gleichen Stil wie die Albumseiten | ⚠️ |

Diese Korrekturen werden **nicht** mehr an der alten App umgesetzt, sondern in der neuen Version (Meilensteine M3 bis M6).

## 5. Ziel und Roadmap

Ziel, Betrieb und Entscheidungen stehen in `docs/ARCHITEKTUR.md`, die Meilensteine M0 bis M7 in `docs/ANFORDERUNGEN.md` Abschnitt 15.

| # | Meilenstein | Status |
|---|---|---|
| M0 | Bestandsaufnahme, Entscheidung Weiterbau/Neustart, Tech-Stack | ⬜ **nächster Schritt** |
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

- [ ] M0 durchführen und Status in Abschnitt 3 und 4 eintragen
- [ ] Tech-Stack festlegen (Entwickler)
- [ ] CEWE-Format festlegen, z. B. 21×28 cm hoch oder 30×30 cm quadratisch (seine Frau)
- [ ] Gemeinschaftswerk-Lösung W-04 bestätigen, Beitrag pro Kind nötig? (beide)
- [ ] Sollen Großeltern mitlesen dürfen (R-04)? (beide)
- [ ] Zusatzideen der Frau in `docs/ANFORDERUNGEN.md` Abschnitt 17 ergänzen
- [ ] Deployment-Weg auf HA festhalten (Entwickler), siehe `docs/ARCHITEKTUR.md`

## 7. Änderungsprotokoll

Siehe `CHANGELOG.md`.
