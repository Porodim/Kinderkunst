# Kinderkunst – Review der alten App (M0)

| | |
|---|---|
| **Stand** | 24.11.2026 |
| **Geprüft** | `alt/index.html` (Commit `8e0f2d1`), Prüfmaßstab `docs/ANFORDERUNGEN.md` v0.2 |
| **Methode** | Code-Lesung ohne Ausführung. Die 185 eingebetteten WebP-Grafiken wurden für die Analyse ausgeblendet; übrig bleiben ca. 60 KB Code. Zeilenangaben (Z.) beziehen sich auf `alt/index.html`. Nichts wurde im Browser getestet; Aussagen zum Laufzeitverhalten sind als „vermutlich“ gekennzeichnet. |
| **Ergebnis kurz** | Gestaltung und Bildbearbeitung sind gut und übertragbar. Datenhaltung, Archiv und Mehrbenutzerbetrieb fehlen grundsätzlich. Empfehlung: **neues Gerüst, alte Logik und Grafiken gezielt umziehen** (Abschnitt 5). |

**Legende:** ✅ erfüllt · 🟡 teilweise · ❌ fehlt · – nicht anwendbar

---

## 1. Aufbau der alten App in Kürze

| Teil | Zeilen | Inhalt |
|---|---|---|
| CSS | 6–105 | Papeterie-Look, Farben aus dem Design-Guide, Rahmen-Stile, Dunkelmodus (`prefers-color-scheme`) |
| Grafiken | 111–113 | `ST`: 185 WebP-Sticker als Daten-URLs (max. 249 px Kantenlänge). Davon **122 genutzt** (`n*`, 15 Sets in `NSET`) und **63 ungenutzt** (`s*`, ca. 183 KB, ältere Sticker-Version) |
| Hilfsfunktionen | 116–124 | Datum, Alter (`age`, `sage`), Sternzeichen (`zod`) |
| Speicher | 126–128 | IndexedDB `kinderkunst`, **ein** Schlüssel `state` mit dem ganzen Bestand |
| Bildverarbeitung | 130–159 | Perspektive (`warp`, Homographie), Aufhellen/Kontrast/Sättigung/„Papier aufhellen“ (`adjust`), Pipeline (`process`), Upload |
| Seiten | 161–183 | Layouts 1–5 (`LAY`, `CAND`), automatische Anordnung (`layOf`, `fitBox`), Themen (`TT`), Rahmen (`FR`, `FM`), Seiten-HTML |
| Ansichten | 185–207 | Start, Galerie, Seitenliste, Seiten-Editor, Deckblatt, Export |
| Foto-Editor | 209–237 | Zuschneiden mit 8 Griffen und Verschieben, Perspektive mit 4 Ecken + 4 Kanten + Verschieben, Pointer Events |
| Gestaltung | 255–276 | Sticker-Bibliothek, Sticker-Auswahl, Design-Beraterin (`tips`) |
| Export | 279–347 | Canvas-Renderer (`renderPg`, `frame`, `wash`), eigener PDF-Schreiber (`mkPdf`), eigener ZIP-Schreiber (`mkZip`), JSON-Backup |
| Start | 371 | Laden, Bereinigung alter Daten (Deko-Ebenen und Rahmen Oval/Stern/Floral werden entfernt) |

**Datenmodell der alten App:** `kids[]` (id, name, bd, cv = Deckblatt), `photos[]` (id, kid, **src = JPEG als Base64**, **out = bearbeitete Vorschau als Base64**, title, type, date, edit, ar), `pages[]` (id, kid, o, n, th, fr, va, ds = Sticker, s = Foto-IDs, t = Texte). Ein „Foto“ ist zugleich Werk und Medium.

---

## 2. Prüfung der Schwerpunkt-Abschnitte

### 3. Medien

| ID | Status | Befund |
|---|---|---|
| F-01 | ❌ | Kein eigenes Medium. Das Foto-Objekt enthält eine verkleinerte Kopie (`src`), eine Vorschau (`out`) und Bearbeitungsparameter (`edit`), aber kein Original, keine EXIF-Daten, keine Hochlade-Info (Z. 158–159, 262). |
| F-02 | ❌ | Keine Medium-Art. `type` kennt nur Gemalt/Lego/Kapla/Sonstiges (Werkart). „Foto vom Kind“ ist technisch ein Werk. |
| F-03 | 🟡 | Seiten und Deckblatt **verweisen** per ID auf Fotos (`pg.s`), es wird nichts kopiert – gute Grundlage für E1. Profilbilder gibt es nicht. Die Bildauswahl einer Seite zeigt aber nur Fotos, die noch auf **keiner** Seite sind (Z. 271), ein Werk lässt sich also nicht bewusst auf zwei Seiten verwenden. |
| F-04 | ❌ | Jedes Foto hat genau ein Kind und ein Datum; die Art „Foto vom Kind“ fehlt (siehe F-02). |

### 5. Bilddatenhaltung (Einzelprüfung)

| ID | Status | Befund |
|---|---|---|
| B-01 | ❌ | Fotos liegen als **Base64-Daten-URLs** im Browser (IndexedDB), nicht als Dateien auf einem Server (Z. 128, 159). |
| B-02 | ❌ | Beim Upload wird auf **max. 1.800 px** verkleinert und als JPEG (Qualität 0,88) neu kodiert (Z. 158, 262). Das Original geht verloren, EXIF ebenso. Eine ganzseitige A4-Platzierung erreicht damit höchstens ca. 218 dpi, nach Zuschnitt weniger. |
| B-03 | 🟡 | Bearbeitung ist **parametrisch** (`edit`: Drehung, Zuschnitt, Zoom, Helligkeit, Kontrast, Sättigung, Papier, Perspektiv-Ecken; Z. 131) und wird bei Bedarf neu berechnet (`process`, Z. 152). Zurücksetzen pro Werkzeug ist möglich. Einschränkung: Basis ist die verkleinerte Kopie, und die Vorschau `out` wird fest gespeichert. |
| B-04 | 🟡 | Es gibt eine Vorschau mit 900 px (`out`, Z. 157), Raster und Seiten nutzen sie. Es gibt aber nur eine Größe, und beim Start wird der **gesamte** Bestand inkl. aller `src`-Kopien in den Speicher geladen. |
| B-05 | 🟡 | Vermutlich korrekt, weil aktuelle Browser die EXIF-Ausrichtung beim Dekodieren selbst anwenden (`image-orientation: from-image`). Die App tut nichts Eigenes dafür; ältere Browser würden quer liegende Fotos zeigen. Danach ist die EXIF-Information verloren. |
| B-06 | ❌ | Keine Duplikaterkennung. |
| B-07 | ❌ | Keine Datenbank; ein einziger JSON-Wert unter dem Schlüssel `state` (Z. 128). |
| B-08 | 🟡 | JSON-Backup mit allen Base64-Bildern exportier- und importierbar (Z. 345, 347). Kein ZIP mit Dateien, kein HA-Backup, Import ersetzt alles. |
| B-09 | ❌ | Werk löschen per `confirm()` ohne Liste der Verwendungen; es wird still aus allen Seiten entfernt (Z. 244). Kind löschen entfernt **alle** Fotos und Seiten des Kindes (Z. 242). Kein Papierkorb. |
| B-10 | ❌ | Nicht tragfähig: Der gesamte Bestand wird bei jeder Änderung (400 ms nach der letzten Eingabe) als **ein** Objekt neu geschrieben. Bei 2.000 Werken wären das grob 1 GB Base64 pro Schreibvorgang. Fehler beim Speichern werden verschluckt (`catch(e){}`), z. B. bei vollem Browser-Speicher → **stiller Datenverlust möglich**. |
| B-11 | ❌ | Keine Audiofunktion. |
| B-12 | 🟡 | Der Export rechnet aus `src` + Parametern neu (`process(p,2600)`, Z. 314), nicht aus den Vorschauen – richtig gedacht. Da `src` aber schon auf 1.800 px verkleinert ist, wird keine echte Druckauflösung erreicht. |

### 6. Bildbearbeitung

| ID | Status | Befund |
|---|---|---|
| I-01 | 🟡 | 4-Ecken-Perspektive mit echter Homographie und bilinearer Interpolation (`warp`, Z. 133–142). Griffe an 4 Ecken **und** 4 Kantenmitten, ganzes Viereck verschiebbar (Z. 232–237). **Lupe fehlt.** Läuft im Browser auf der verkleinerten Kopie. |
| I-02 | 🟡 | Drehen in 90°-Schritten, Zuschneiden mit 8 Griffen und Verschieben des ganzen Rahmens (Z. 227–231), Zoom-Knöpfe. **Feines Drehen fehlt.** |
| I-03 | ✅ | Helligkeit, Kontrast, Sättigung je −100…+100 und „Papier aufhellen“ (Weißpunkt aus dem Histogramm, leichte Gamma-Anhebung; Z. 143–151). |
| I-04 | ❌ | Keine automatische Blatterkennung; Startrahmen ist fest 8 % vom Rand (Z. 223). |
| I-05 | 🟡 | „Zurücksetzen“ je Werkzeug und „Abbrechen“ (stellt den Stand vor dem Öffnen her). **Keine Vorher/Nachher-Ansicht.** |
| I-06 | 🟡 | Bearbeiten direkt nach dem Hochladen (Editor öffnet sich für das erste Foto, Z. 262) oder später über das Bildfeld der Seite. Das Ergebnis gilt überall, weil Seiten per ID verweisen. |

### 9. Seiten kuratieren

| ID | Status | Befund |
|---|---|---|
| S-01 | 🟡 | Bild pro Feld wählen: hochladen oder aus noch unbenutzten Fotos des Kindes (Z. 271). Kein Filter, keine Mehrfachauswahl aus dem Bestand (nur Mehrfach-Upload füllt die folgenden Felder). |
| S-02 | 🟡 | Hoch-/Querformat, 1–5 Bilder, je Bildzahl mehrere Anordnungen; „Automatisch“ wählt die Anordnung mit der größten Bildfläche (Z. 174–179). **Nicht `contain`:** `fitBox` erlaubt bewusst bis zu 10 % Beschnitt (`CROP=.1`, Z. 170/172), dargestellt mit `background-size:cover` bzw. `cover()` im Export. Kein eigener Ausschnitt pro Platzierung (Zuschnitt gilt am Foto). |
| S-03 | 🟡 | Textfelder Name, Datum, Alter, Anekdote, Knopf „Automatisch“ fürs Alter. Die Werte werden beim Anlegen der Seite **kopiert** (Datum = heute, Z. 245), nicht aus dem Werk gelesen; Änderungen am Werk aktualisieren die Seite nicht. Die Anekdote gehört zur Seite, nicht zum Werk. |
| S-04 | 🟡 | 12 Themen (inkl. Weihnachten, Ostern, Geburtstag) als Aquarell-Verlauf aus der Palette plus Papierstruktur, 12 Rahmen. **Fehlend gegenüber Design-Guide:** Rahmen Oval, Stern, Floral Border (beim Start auf „Papierrahmen“ umgestellt, Z. 371); Deko-Ebenen (`mkDeco` liefert leer, Z. 256) und „Schlichter“ (Aktion `dk` ohne Knopf). |
| S-05 | 🟡 | Sticker per Maus und Touch verschieben, über Eckgriff oder Knöpfe skalieren, löschen (Z. 362–370). **Drehen fehlt.** |
| S-06 | 🟡 | Positionen in % der Seite, Größen in `cqw` (relativ zur Seitenbreite) – richtig. Die Vorschau ist aber HTML/CSS, der Export ein **zweiter, getrennter** Canvas-Renderer (Z. 311–325). Pixelgleichheit ist so nicht garantiert (siehe Fehler F8). |
| S-07 | ❌ | Kein QR-Code (keine Audio-Story). |
| S-08 | ❌ | Kein automatischer Seitenvorschlag (nur automatische Anordnung). |

---

## 3. Übrige Anforderungen (Kurzprüfung)

| ID | Status | Befund |
|---|---|---|
| R-01 | ❌ | Daten nur im Browser eines Geräts. |
| R-02 | ❌ | – |
| R-03 | – | Kein Server, keine Anmeldung. |
| R-04 | ❌ | – |
| K-01 | 🟡 | Anlegen, bearbeiten, löschen; kein Archivieren. |
| K-02 | 🟡 | Name, Geburtsdatum. Kein Profilbild, Spitzname, Profilfarbe. |
| K-03 | ✅ | Alter und Sternzeichen werden berechnet (Z. 121–124). |
| K-04 | 🟡 | Start zeigt Anzahl Werke und Seiten; kein Zeitstrahl. |
| K-05 | ❌ | – |
| W-01 | 🟡 | Kamera und Galerie, mehrere Fotos – aber nur über ein Bildfeld einer Seite. |
| W-02 | ❌ | Ein Foto = ein Werk. |
| W-03 | 🟡 | Gemalt, Lego, Kapla, Sonstiges; „Basteln“ fehlt. |
| W-04 | ❌ | Genau ein Kind pro Werk. |
| W-05 | 🟡 | Datumsfeld im Editor (Reiter „Info“), Vorgabe **heute**; kein EXIF-Datum, keine Genauigkeit. Bestätigt die Beobachtung aus Abschnitt 14. |
| W-06 | 🟡 | In der (unerreichbaren) Galerie aus dem Werkdatum berechnet; auf der Seite eine kopierte Textangabe. |
| W-07 | 🟡 | Titel am Werk; die Story steht nur als Anekdote auf der Seite. |
| W-08, W-08a | ❌ | Kein Audio. |
| W-09 | ❌ | Keine Tags. |
| W-10 | ❌ | – |
| W-11 | ❌ | – |
| W-12 | ❌ | – |
| W-13 | ❌ | Kein Eingangskorb. |
| D-00 | ❌ | Navigation Start · Seiten · Export. |
| D-01 | 🟡 | Eine Galerie-Ansicht ist programmiert (`vGal`, Z. 188), aber **nicht erreichbar** (siehe F1). |
| D-02 | ❌ | – |
| D-03 | ❌ | Nur Werkart-Filter in der unerreichbaren Galerie. |
| D-04 – D-07 | ❌ | – |
| G-01 | 🟡 | Sticker sind Bilddaten, aber im Code eingebettet und ohne Name/Tags; Zuordnung zu Themen über Index-Liste (Z. 260). |
| G-02 | 🟡 | Eigene Sticker und Hintergründe über `assets/assets.json` und Ordner (Z. 278). |
| G-03 | 🟡 | Siehe S-04. |
| G-04 | ❌ | – |
| E-01 | 🟡 | „Album“ = Deckblatt + alle Seiten eines Kindes in Anlage-Reihenfolge; nicht sortierbar, keine Bücher, kein Geschwisterbuch. |
| E-02 | ✅ | Deckblatt mit Thema, Rahmen, Bild, Überschrift, Untertitel, Stickern. |
| E-03 | 🟡 | ZIP mit 300-dpi-Seiten 21×28 cm bzw. 28×21 cm plus ca. 3 mm Beschnitt (35 px je Seite), JPG oder PNG, Dateinamen in Reihenfolge (Z. 340–343). Format fest, Bildquelle nur 1.800 px. |
| E-04 | 🟡 | Eigener PDF-Schreiber, A4, 300 dpi, ca. 10 mm Rand (Z. 326–339). Fehlerbild siehe F7. |
| E-05 | ❌ | – |
| N-01 | 🟡 | Mobile First, Pointer Events für Maus/Touch; HA-App nicht getestet. |
| N-02 | – | Kamera per `<input capture>`; Mikrofon nicht genutzt. |
| N-03 | ✅ | Farben und Schriften entsprechen dem Design-Guide. |
| N-04 | 🟡 | Keine Bilddienste; Schriften werden aber von **Google Fonts** geladen (Z. 5). |
| N-05 | 🟡 | Kleine Ad-hoc-Bereinigung beim Start, keine Versionierung des Datenstands. |
| V-01 – V-05 | ❌ | Kein Server. |

---

## 4. Bekannte Fehler und Schwachstellen

| # | Fehler | Fundstelle | Folge |
|---|---|---|---|
| F1 | **Galerie ist toter Code.** Keine Navigation und kein Knopf führt zu `vGal` (Aktion `gal` wird nirgends ausgelöst); `addFiles` wird nie aufgerufen. Würde man die Galerie erreichen, liefe ihr Upload über `addTo` und bräuchte eine geöffnete Seite: ohne Seite erscheint „Dieses Bild konnte nicht gelesen werden“, mit zuletzt geöffneter Seite landen die Fotos in deren Feldern. | Z. 158, 188–189, 356 | Kein Archiv-Zugang, Grund für D-00 |
| F2 | Upload verkleinert auf 1.800 px und kodiert neu; Original und EXIF sind weg. | Z. 158, 262 | Druckqualität begrenzt, B-02 |
| F3 | Werk- und Seitendatum = Hochladetag statt Entstehungsdatum. | Z. 159, 245 | Falsches Alter auf Seiten |
| F4 | Texte der Seite sind Kopien, Story hängt an der Seite statt am Werk. | Z. 245 | S-03, W-07 |
| F5 | Bis zu 10 % Bildbeschnitt durch `CROP=.1` plus `cover`. Das ist ein bewusster Kompromiss gegen Weißraum, widerspricht aber Korrektur 3 („vollständig ohne Abschneiden“). | Z. 170–172, 284 | Korrektur 3 offen |
| F6 | Sticker-Grafiken sind nur 90–249 px groß. Ein Sticker von ca. 4 cm Breite bräuchte im Druck rund 470 px. | Z. 111–113, 321 | Sticker im Druck vermutlich unscharf |
| F7 | **PDF-Button:** Der Codepfad ist formal schlüssig (JPEG je Seite, gültige Objektstruktur). Vermutliche Ursachen für den Fehler: (a) Download-Weg in der claude.ai-Laufzeit (`saveFile`), (b) Speicherbedarf großer Canvas auf dem Handy (2.480 × 3.508 px ≈ 35 MB je Seite plus Zwischenpuffer), (c) `roundRect` fehlt in älteren Browsern (Safari < 16) → „Export fehlgeschlagen“. Nicht reproduziert. | Z. 283, 298, 336–344 | E-04 |
| F8 | **Zwei Renderer:** Vorschau in HTML/CSS, Export in Canvas mit eigenen Maßen. Rahmen, Textumbruch und Stickergrößen sind doppelt programmiert und können auseinanderlaufen. | Z. 181 vs. 311–325 | Ursache für „PDF im gleichen Stil“ (Korrektur 4), S-06 |
| F9 | Speichern schreibt den ganzen Bestand und verschluckt Fehler; Browser kann den Speicher räumen (kein `navigator.storage.persist`). | Z. 128 | Stiller Datenverlust möglich |
| F10 | Löschen ohne Verwendungsliste; Kind löschen entfernt alle Werke. | Z. 242, 244 | B-09 |
| F11 | Design-Guide-Rahmen Oval, Stern, Floral Border sowie Deko-Ebenen/„Schlichter“ sind entfernt bzw. ohne Bedienung. | Z. 243, 256, 371 | S-04, Abgleich mit Design-Guide nötig |
| F12 | 63 ungenutzte Sticker-Grafiken (ca. 183 KB) eingebettet. | Z. 111 | Nur Ballast; Übernahme klären |
| F13 | Kein feines Drehen, keine Lupe, kein Sticker-Drehen. | Editor, Z. 362–370 | I-01, I-02, S-05 |
| F14 | LIES-MICH im ZIP nennt 2.551 × 3.378 px, erzeugt werden 2.550 × 3.377 px. | Z. 340, 343 | Kosmetisch |
| F15 | Google Fonts extern geladen. | Z. 5 | Datenschutz, offline nicht nutzbar |

### Stand der Korrekturwünsche (`PROJEKT.md` Abschnitt 4)

| Korrektur | Stand im Code |
|---|---|
| Griffe an Ecken und Seitenmitten, Rahmen verschiebbar | ✅ für Zuschneiden und Perspektive umgesetzt (Lupe fehlt noch, I-01) |
| Sticker per Maus und Touch verschiebbar, skalierbar, löschbar | ✅ umgesetzt (Drehen fehlt, S-05) |
| Kinderbilder vollständig ohne Abschneiden | ⚠️ bis zu 10 % Beschnitt (F5) |
| PDF-Button funktioniert, PDF im Stil der Seiten | ⚠️ Ursache unklar (F7), Stilabweichung strukturell (F8) |

---

## 5. Empfehlung: neues Gerüst, alte Teile umziehen

**Empfehlung: neues Gerüst.** Ein Weiterbau der einen HTML-Datei lohnt nicht, weil genau die Muss-Anforderungen fehlen, die das Fundament bilden: Dateien auf dem Server (B-01, B-02), Datenbank (B-07), gemeinsamer Bestand (R-01), Medium als eigene Entität (F-01) und Werk mit mehreren Fotos, Kindern und Storys (W-02, W-04, W-08). Das betrifft Speicher, Datenmodell und Upload-Fluss zugleich; es bliebe kaum eine Zeile davon unverändert. Dazu kommt die Randbedingung „viele kleine Dateien“.

**Aber kein Neuschreiben der wertvollen Teile.** Die alte App ist in Gestaltung und Bildbearbeitung weit und sauber gelöst. Diese Teile sind reines JavaScript ohne Abhängigkeiten und lassen sich fast 1:1 in eigene Module umziehen. Daraus ergibt sich auch der Stack-Vorschlag: **JavaScript durchgehend**, damit dieser Code wiederverwendet wird statt übersetzt.

### Übernehmen

| Was | Woher | Wohin / Hinweis |
|---|---|---|
| Look: CSS, Farben, Dunkelmodus | Z. 6–105 | In mehrere CSS-Dateien teilen (Farben, Grundgerüst, Komponenten, Seite, Rahmen). Optik unverändert. |
| Schriften | Z. 5 | Lokal ausliefern (alle drei unter freier Lizenz, OFL) |
| 122 Aquarell-Sticker in 15 Sets | `ST`, `NSET`, `STS` | Als einzelne WebP-Dateien plus Sticker-Liste mit Name, Set, Tags (G-01). Wegen F6 möglichst höher aufgelöste Quelldateien beschaffen. |
| Themen (Verläufe aus Palette, Papierstruktur) und 12 Rahmen | `TT`, `TH`, `wash`, `FR`, `FM`, `frame`, `TORN`, `ZIG`, `CLOUD` | Als Daten + ein Render-Modul |
| Layouts 1–5, Varianten, automatische Anordnung | `LAY`, `CAND`, `fitBox`, `layOf`, `slotBox` | Unverändert, `CROP` als Einstellung (F5) |
| Bildbearbeitung: Perspektive, Aufhellen, Pipeline-Reihenfolge, Parameterformat | `warp`, `solve`, `adjust`, `process`, `newEdit` | Wird `Medium.bearbeitung`; läuft im Browser (Vorschau) **und** auf dem Server (Export aus dem Original) |
| Editor-Bedienung: 8 Griffe, Verschieben, Pointer Events | `cbDrag`, `pqDrag`, `drag` | Erfüllt bereits Korrektur 1 und 2 |
| Seiten-Renderer | `renderPg` | **Ein** Renderer für Vorschau und Export (Canvas), löst F8 |
| Design-Beraterin (lokale Prüfungen inkl. dpi-Warnung) | `tips` | Unverändert, keine externen Dienste |
| Alter, Sternzeichen | `age`, `sage`, `zod` | Gemeinsames Modul für Browser und Server |
| Deckblatt-Konzept, ZIP-Dateinamen, Beschnitt-Berechnung | `cvOf`, `exportAll` | Für M6 |

### Nicht übernehmen

IndexedDB-Speicher, Base64-Bilder, verkleinerter Upload, `saveFile` mit claude.ai-Laufzeit, eigener ZIP-Schreiber für Backups (hält alles im Speicher), Google-Fonts-Link, die 63 ungenutzten Sticker (außer auf Wunsch). Die Testdaten der alten App werden nicht übernommen (E5 optional); ein Import des JSON-Backups wäre bei Bedarf in M2 machbar.

---

## 6. Tech-Stack-Vorschlag (A7, Entscheidung: Entwickler)

### Vorschlag A (empfohlen): Node.js + SQLite + sharp, Frontend ohne Build-Schritt

| Schicht | Wahl | Begründung |
|---|---|---|
| Laufzeit | **Node.js LTS** im Docker-Container (Alpine) | Gleiche Sprache wie der übernommene Code; Render- und Bildlogik laufen in Browser und Server. Schlank genug für den HA-Rechner. |
| Web-Server | **Fastify** (alternativ Express) | Kleine Routen-Dateien, Datei-Uploads per Stream, eingebaute Schema-Prüfung |
| Datenbank | **SQLite** über **better-sqlite3**, WAL-Modus | Einfach, eine Datei, zwei gleichzeitige Nutzer problemlos (R-01). Migrationen als nummerierte SQL-Dateien (N-05). |
| Dateiablage | Ordner im Add-on-Datenverzeichnis, Pfad aus Inhalts-Hash | Hinter kleiner Schnittstelle (V-04); Hash liefert gleich die Duplikaterkennung (B-06) |
| Bilder | **sharp** (libvips) | EXIF-Ausrichtung, EXIF-Datum, Vorschauen 400/2.000 px, schnell und sparsam (B-02 bis B-05). Fertige Pakete für amd64 und arm64. |
| Perspektive und Seiten-Export | übernommene `warp`/`adjust`/`renderPg` + **@napi-rs/canvas** auf dem Server | Export immer aus Original + Parametern in 300 dpi (B-12); dieselbe Canvas-Logik wie in der Vorschau (F8). Fertige Pakete ohne Compiler. |
| PDF | Seiten als JPEG, eingebettet mit dem übernommenen `mkPdf` oder **pdf-lib** | Gleiche Seitenbilder wie im CEWE-ZIP, also gleicher Stil (Korrektur 4) |
| ZIP / Backup | **archiver** (Streaming) | Backups mit mehreren GB ohne Speicherprobleme (B-08) |
| Audio | Browser-`MediaRecorder`, Datei unverändert ablegen (Android: Opus/WebM, iPhone: AAC/MP4) | Kein ffmpeg nötig; Länge wird beim Aufnehmen mitgeschickt (B-11) |
| Frontend | **Vanilla-JS mit ES-Modulen, kein Build-Schritt**, eine Datei pro Ansicht/Komponente | Nah an der alten App, keine Werkzeugkette, auch mit begrenztem Kontingent einzeln bearbeitbar. Bei Bedarf später Preact + htm, ebenfalls ohne Build. |
| Anmeldung | HA-Ingress-Header, hinter einer Schnittstelle (V-02) | Welche Header genau ankommen, wird in M1 gemessen, nicht angenommen (A2) |
| Tests | `node:test` (eingebaut) | Für Alter, Layout, Migrationen, Export-Maße |

Vorteil gegenüber den Alternativen: **ein** Bild- und Seiten-Code für Vorschau und Druck, und der vorhandene, funktionierende Code wird weiterverwendet.

### Vorschlag B: Python (FastAPI + SQLite + Pillow)

Passt gut zum Home-Assistant-Umfeld, Pillow ist robust. Nachteil: Seiten-Renderer, Rahmen, Perspektive und Aufhell-Logik müssten nach Python übersetzt werden, und die Vorschau im Browser bliebe JavaScript. Damit kehrt das Problem zweier Renderer (F8) zurück.

### Vorschlag C: Go (eine Binärdatei)

Sehr kleiner Container, aber Bildverarbeitung (libvips per cgo) und Canvas-Rendering wären aufwändiger, und die alte Logik müsste vollständig neu geschrieben werden.

### Folgen für M1 (nur zur Einordnung, nicht begonnen)

Repo-Struktur wie in `ARCHITEKTUR.md`; in M1 zuerst die Frühtests (Kamera/Mikrofon in der HA-App, große Uploads über Ingress und Cloudflare, zwei Nutzer, Backup). Vor dem Einsatz von sharp und @napi-rs/canvas ist die **CPU-Architektur des HA-Rechners** zu klären (siehe offene Fragen).

---

## 7. Offene Fragen aus M0

**An den Entwickler**
1. Tech-Stack A, B oder C (A7)?
2. CPU-Architektur und Leistung des HA-Rechners (z. B. Raspberry Pi 4/5 = arm64 oder Mini-PC = amd64)?
3. Frontend ohne Build-Schritt (Vanilla-JS-Module) in Ordnung?

**An seine Frau (Optik)**
4. Bisher werden Bilder auf Seiten um bis zu 10 % beschnitten, damit weniger Weißraum bleibt. Gewünscht ist laut Korrektur 3 „vollständig“. Soll das neu **immer vollständig** sein, oder ist leichter Beschnitt als Einstellung gewünscht?
5. Rahmen Oval, Stern und Floral Border stehen im Design-Guide, sind in der alten App aber entfernt; dafür gibt es Soft Fade, Wolke, Washi-Tape, Feinlinie, Kissenform, Büttenrand. Welche Liste gilt?
6. Die Deko-Ebenen mit „Schlichter“-Knopf sind in der letzten Version abgeschaltet. Sollen sie zurückkommen?
7. Die Sticker sind nur ca. 150 px groß und werden im Druck vermutlich unscharf. Gibt es die Aquarell-Sticker in höherer Auflösung (Originaldateien)?
8. Sollen die 63 älteren, ungenutzten Sticker übernommen werden?
