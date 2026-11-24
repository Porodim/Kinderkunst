# Kinderkunst – Projektübergabe

Dieses Dokument beschreibt Ziel, Design und Funktionsumfang der App „Kinderkunst“. Es dient als Startpunkt für die Weiterentwicklung in Claude Code. Der alte Ist-Stand liegt im Ordner `alt/`.

## 0. Inhalt dieses Ordners

Die Dateien sind unverändert (1:1) aus den bisherigen claude.ai-Artifacts übernommen, Stand 24.11.2026.

| Datei | Herkunft | Bedeutung |
|---|---|---|
| `index.html` | Artifact „Kinderkunst – Atelier“ (zuletzt aktualisiert 24.11.2026) | **Aktueller Stand der App** nach Schritt 3, im Papeterie- & Atelier-Look |
| `fruehere-version/unser-kunstalbum.html` | Artifact „Unser Kunstalbum“ (22.11.2026) | Früher Prototyp in buntem Stil, nur als Referenz |
| `UEBERGABE.md` | dieses Dokument | Ziel, Design, Funktionen, offene Punkte |

**Tech-Stack von `index.html`:** eine einzige, in sich geschlossene HTML-Datei (ca. 1,1 MB) mit Vanilla-JavaScript und CSS. Kein Build-Schritt, keine Bibliotheken außer Google Fonts (Cormorant Garamond, Dancing Script, Nunito). Sticker und Aquarell-Grafiken sind als WebP-Daten-URLs eingebettet, daher die Dateigröße. Daten werden lokal im Browser gespeichert (IndexedDB, Datenbank `kinderkunst`). Für Downloads (PDF, ZIP, Backup) nutzt `saveFile()` die claude.ai-Laufzeit (`claude.use('downloads')`), wenn sie vorhanden ist, und fällt sonst auf einen normalen Browser-Download zurück. Die Datei läuft also auch außerhalb von claude.ai.

**Tech-Stack des Prototyps:** HTML mit jsPDF (cdnjs); Fotos und Einträge lagen über die claude.ai-Artifact-Laufzeit (`db`, `assets`, `downloads`) in der Cloud.

## 1. Worum es geht

Eine **Mobile-First-Web-App**, mit der Eltern Kunstwerke und Bauwerke ihrer Kinder (0–10 Jahre) archivieren und gestalten: gemalte Bilder, Lego, Kapla und Ähnliches. Die gestalteten Seiten lassen sich als PDF oder als Fotobuch-Seiten exportieren.

Der Look der App ist ein ruhiger **„Papeterie- & Atelier-Look“**. Verspielte Aquarell-Themen gibt es nur auf der gestalteten Albumseite, nicht in der App-Oberfläche.

## 2. Arbeitsregeln

- Code immer **vollständig und funktionierend**, keine Platzhalter und keine „…hier weiter wie vorher“-Abkürzungen.
- Es wird nie nach Passwörtern oder Tokens gefragt. Zugriff läuft über die bestehende GitHub-Anbindung.
- Die Weiterentwicklung findet an zwei Orten statt (siehe Abschnitt 8). Änderungen immer nachvollziehbar committen und in `CHANGELOG.md` festhalten.
- Der alte Ist-Stand in `alt/` bleibt als Referenz unverändert.

## 3. Design-Guide (verbindlich)

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

### Oberfläche

- Ruhige App-Oberfläche in Creme- und Naturtönen.
- Schreibschrift für Titel.
- Salbeigrüne App-Leiste mit Zurück-Button, Titel und Zahnrad.
- Kind-Pille im Format „Name (4 Jahre, 3 Mo.) ♍“, also Alter und Sternzeichen aus dem Geburtsdatum.
- Werkzeugleisten: Drehen, Zuschneiden, Aufhellen, Perspektive / Layout, Thema, Sticker, Text, Deko an/aus, Assistent.

### Themenwelten (nur für die gestaltete Albumseite)

Feenwald, Unterwasserwelt, Regenbogen, Dino, Jahrmarkt, Kindergarten, Tierpark, Sonne/Mond/Sterne, Ruhige Naturtöne. Zusätzlich gewünscht: **Weihnachten, Ostern, Geburtstag**.

### Rahmen

Rounded Paper, Wellenrand, Polaroid, Oval, Stern, gerissenes Papier, Floral Border.

## 4. Funktionsumfang (Stand der alten App)

### Basis, Galerie und Bildbearbeitung

- Kinderprofile mit Geburtsdatum. Daraus werden Alter und Sternzeichen berechnet.
- Seiten-Editor im Hoch- oder Querformat mit 1–5 Bildern pro Seite.
- Textfelder: Name, Datum, Alter, Anekdote.
- Upload per Kamera oder Galerie, **direkt auf der Albumseite**. Es gibt keine separate Zwischengalerie, alles passiert auf einer Seite.
- Bildbearbeitung: Drehen, Zuschneiden, Zoom, Helligkeit, Kontrast, Sättigung, „Papier aufhellen“, 4-Ecken-Perspektivkorrektur.

### Gestaltung

- Formen und Rahmen, wählbarer Themen-Hintergrund pro Seite.
- Ebenen-Logik: Basis-Aquarell plus einzeln antippbare Rand-Deko, mit Button „Schlichter“.
- Sticker-Sets zu allen Themen, inklusive Lego/Kapla und Sternzeichen.
- Stille Design-Beraterin als Icon in der Ecke. Sie reagiert nur auf Antippen, es gibt keine Pop-ups.

### Export und Speicher

- Deckblatt-Generator: Aquarell-Hintergrund, Titelbild, Überschrift, Untertitel.
- Heimdrucker-PDF mit 300 dpi und Druckrand.
- Fotobuch-Paket: 300-dpi-Einzelbilder im ZIP mit 3 mm Beschnitt (für Pixum/CEWE).
- JSON-Backup-Export und -Import.
- Ordner für eigene Aquarell-Sticker und Hintergründe.
- Cloud-Speicher über Supabase vorgesehen.

## 5. Offene Korrekturen (Schritt 3)

Diese Punkte sind aus der Nutzung entstanden und noch zu erledigen oder zu prüfen. Sie werden zusätzlich im Chat weiterbearbeitet (siehe Abschnitt 8).

1. **Zuschneiden und Perspektivrahmen:** Griffe an den Ecken und Seitenmitten, außerdem muss sich der ganze Rahmen verschieben lassen.
2. **Sticker:** per Maus und Touch verschiebbar, skalierbar und löschbar.
3. **Kinderbilder:** vollständig ohne Abschneiden darstellen (`object-contain`), ohne viel Weißraum.
4. **PDF-Button:** muss zuverlässig funktionieren. Das PDF soll im gleichen schönen Stil wie die Albumseiten gestaltet sein.

## 6. Zielbild Technik und Betrieb

- Die App wird **gehostet**, damit auch der Ehemann Fotos hochladen kann.
- Meilenstein „technische Lösung finalisieren“: Entscheidung zwischen **Integration in Home Assistant** und **eigener Anwendung auf einem Server**. Eine spätere öffentliche Veröffentlichung ist optional.
- Das Repository ist die Quelle der Wahrheit. Von dort wird künftig immer wieder auf Home Assistant ausgerollt.
- Frühere Überlegungen zum Hosting: Vercel oder Netlify, Cloud-Speicher mit Supabase.
- Die App soll später auch in der kostenlosen Claude-Version weitergeführt werden können. Der Code muss deshalb gut lesbar und in überschaubaren Dateien aufgebaut sein, und dieses Dokument muss aktuell bleiben.

## 7. Offene Fragen und Ideen

- **Tech-Stack der neuen Version:** offen. Der alte Stand ist eine einzelne HTML-Datei (siehe Abschnitt 0). Für Hosting, mehrere Nutzer und Home Assistant ist eine Aufteilung in mehrere Dateien und ein gemeinsamer Speicher nötig.
- **Fotobuch-Export per One-Click:** Wunsch ist die Übergabe an einen Fotobuch-Hersteller als **MCF-Datei** (gemeint ist vermutlich CEWE), die dort als Projekt eingefügt und gedruckt werden kann. Zu klären: gibt es dafür eine offizielle Schnittstelle (API), und ist das Format dokumentiert? Bis dahin bleibt das ZIP mit 300-dpi-Einzelbildern und 3 mm Beschnitt der Weg.
- **Home Assistant vs. eigener Server:** Entscheidung steht aus. Dafür sind Datenspeicherung, Authentifizierung und der Upload vom Handy zu bewerten.
- Neue Ideen aus Claude Code zur Überarbeitung von Code und Projekt sind ausdrücklich erwünscht. Größere Umbauten bitte zuerst hier unter „Offene Fragen“ oder in einem Issue festhalten.

## 8. Zusammenarbeit an zwei Orten

Es wird an zwei Stellen gearbeitet:

- **Claude Code (Repo-Besitzer):** Überarbeitung von Code und Projektstruktur, neue Ideen, Rollout.
- **Claude-Chat (Schritt 3):** Weiterführung der offenen Korrekturen aus Abschnitt 5 im Chat-Projekt „Kinderkunst“.

Damit sich beide Seiten nicht in die Quere kommen:

1. Vor dem Start einer Arbeitssitzung den aktuellen Stand holen (`git pull`) und `CHANGELOG.md` lesen.
2. Claude Code arbeitet auf einem eigenen Branch (z. B. `ueberarbeitung`), nicht direkt auf `main`.
3. Jede Änderung bekommt einen Eintrag in `CHANGELOG.md` mit Datum und kurzer Beschreibung.
4. Ergebnisse aus dem Chat (Code-Dateien) werden als Commit oder Pull Request ins Repo übernommen. Beim Zurückholen in den Chat wird die aktuelle ZIP-Datei oder die geänderte Datei hochgeladen.
5. Strukturänderungen (Dateien verschoben, Framework gewechselt) werden hier in Abschnitt 7 oder im Changelog ausdrücklich vermerkt, damit der Chat-Stand nicht veraltet.

## 9. Repository-Struktur (Soll)

```
/
├── README.md
├── CHANGELOG.md     ← Änderungsprotokoll (noch anzulegen)
├── alt/             ← Ist-Stand der alten App (Referenz, unverändert)
│   ├── index.html
│   ├── UEBERGABE.md ← dieses Dokument
│   └── fruehere-version/
└── …                ← neue/überarbeitete App (Struktur nach Entscheidung in Abschnitt 7)
```

Vorschlag: Dieses Dokument wird bei der Überarbeitung als `CLAUDE.md` in die Wurzel des Repos übernommen, damit Claude Code es automatisch liest.
