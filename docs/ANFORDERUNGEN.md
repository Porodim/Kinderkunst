# Kinderkunst – Fachliche Anforderungen & Meilensteine

| | |
|---|---|
| **Version** | 0.2 – Entwurf zur Abstimmung (Entwickler bestätigt, seine Frau ergänzt) |
| **Stand** | 24.11.2026 |
| **Zweck** | Prüfmaßstab für den gelieferten Code und Grundlage für Designentscheidungen. Betrieb und Hosting stehen in `ARCHITEKTUR.md`, Design-Guide in `../PROJEKT.md`. |

**Priorität:** **M** = Muss (MVP) · **S** = Soll · **K** = Kann/später
**IDs** (z. B. `W-03`) dienen als Referenz in Code-Review, Issues und Commits.
**Zuständigkeit Optik:** Gestaltung, Farben, Schriften und Look liegen bei seiner Frau. Dieses Dokument regelt Funktion, Daten und Abläufe.

---

## 0. Entscheidungen

| # | Entscheidung | Status |
|---|---|---|
| E1 | **Archiv zuerst.** Das Werk ist das zentrale Objekt und existiert genau einmal. Seiten und Bücher **verweisen** auf Werke, sie kopieren keine Bilddaten. Wer auf einer Seite ein Foto hochlädt, legt dabei automatisch ein Werk im Archiv an. | ✅ bestätigt (Entwickler) |
| E2 | **Bilder sind eine eigene Entität („Medium“)** in der Datenbank und werden überall wiederverwendet: Werkfoto, Profilbild, Deckblatt, Foto vom Kind, Seitenhintergrund. | ✅ bestätigt (Entwickler) |
| E3 | **Gemeinschaftswerke** über eine Mehrfach-Zuordnung Werk ↔ Kind, **kein** künstlicher dritter Kind-Datensatz und kein Tag (Details W-04). | ⬜ Vorschlag |
| E4 | **CEWE** ist erster Zielanbieter fürs Fotobuch. Format noch offen. | ✅ erste Wahl |
| E5 | Testdaten aus der bisherigen App zu übernehmen ist **optional** (nur Testdaten vorhanden). | ✅ |
| E6 | Original wird **immer in voller Auflösung** aufbewahrt; Begradigen/Zuschneiden ist Pflichtfunktion, aber nicht-destruktiv. | ✅ bestätigt (Entwickler) |
| E7 | **Gestaltung bleibt nah an der alten App** (Rahmen, Themen, Sticker, Look). Bilder auf Seiten werden höchstens **5 %** beschnitten (S-02). | ✅ 24.11.2026 |

---

## 1. Rollen & Zugriff

| ID | Anforderung | Prio |
|---|---|---|
| R-01 | Mehrere Benutzer (zunächst die beiden Eltern) arbeiten auf **demselben** Datenbestand, gleichzeitig, von Handy und PC. | M |
| R-02 | Jede Änderung speichert, **wer** sie wann gemacht hat (hochgeladen von / geändert von). | S |
| R-03 | Anmeldung im Heimbetrieb über Home Assistant (Ingress), kein zweites Passwort. | M |
| R-04 | Lese-Zugriff für Großeltern / Familie (z. B. Galerie oder einzelnes Buch per Link). | K |

## 2. Kinderprofile

| ID | Anforderung | Prio |
|---|---|---|
| K-01 | Beliebig viele Kinder anlegen, bearbeiten, archivieren. | M |
| K-02 | Felder: Name, Geburtsdatum, **Profilbild** (Medium, zuschneidbar), optional Spitzname und Profilfarbe. | M |
| K-03 | Alter und Sternzeichen werden **berechnet**, nicht gespeichert. | M |
| K-04 | Kind-Seite zeigt Anzahl Werke, Zeitstrahl nach Alter, letzte Werke. | S |
| K-05 | Profilbild kann pro Lebensjahr wechseln (z. B. für Deckblätter „Mit 4 Jahren“). | K |

## 3. Medien (Bild-Entität)

| ID | Anforderung | Prio |
|---|---|---|
| F-01 | **Medium** = eine hochgeladene Datei (Foto, später Audio) mit Original, Vorschaubildern, EXIF-Daten, Bearbeitungsparametern, Hochlade-Info. | M |
| F-02 | Art des Mediums: **Werkfoto** · **Foto vom Kind** (z. B. Kind mit seinem Bild) · Profilbild · Sonstiges. Fotos vom Kind sind keine Werke, können aber auf Seiten und Deckblättern verwendet werden. | M |
| F-03 | Ein Medium kann an mehreren Stellen verwendet werden (Werk, Seite, Deckblatt, Profil), ohne Kopie. | M |
| F-04 | Fotos vom Kind sind ebenfalls einem oder mehreren Kindern und einem Datum zugeordnet (→ Alter). | S |

## 4. Werke (Archiv) – Kern

| ID | Anforderung | Prio |
|---|---|---|
| W-01 | Werk anlegen per **Kamera oder Galerie**, auch mehrere Fotos auf einmal. | M |
| W-02 | Ein Werk hat **1–n Medien** mit einem Titelbild (wichtig für Lego/Kapla aus mehreren Blickwinkeln). | M |
| W-03 | Werkart: Bild/Malerei, Basteln, Lego, Kapla, Sonstiges. | M |
| W-04 | **Gemeinschaftswerk:** Ein Werk ist **einem oder mehreren Kindern** zugeordnet (Zuordnungstabelle Werk ↔ Kind). Es erscheint im Archiv **jedes** beteiligten Kindes. Das Alter wird **pro Kind** berechnet („Kind A 4 J. & Kind B 1 J.“). Optional ein Beitrag pro Kind („gemalt“, „mitgeholfen“, „Idee“). Die Reihenfolge der Zuordnung bestimmt die Anzeige. | S |
| W-05 | **Entstehungsdatum** mit Genauigkeit: genauer Tag · Monat · „ungefähr“. Vorschlag aus EXIF-Datum des Fotos, sonst heute. | M |
| W-06 | **Alter zum Entstehungszeitpunkt** wird automatisch berechnet und angezeigt („4 J. 3 Mo.“, bei Ungenauigkeit „ca. 4 J.“). Ändert sich das Datum, ändert sich das Alter mit. | M |
| W-07 | Titel (optional) und **Story als Text**: was das Kind dazu sagt. | M |
| W-08 | **Story als Audio**: aufnehmen, anhören, neu aufnehmen, löschen – direkt am Werk. | M |
| W-08a | Ein Werk kann **mehrere Story-Einträge** haben, jeweils mit Erzähler (welches Kind) – wichtig bei Gemeinschaftswerken, wenn jedes Kind etwas anderes dazu sagt. | S |
| W-09 | **Tags**: frei vergebbar plus Vorschläge (Motiv, Anlass, Technik, Ort wie Kita/Zuhause). Tags sind über alle Werke wiederverwendbar (Autovervollständigung). | M |
| W-10 | **Sticker-Vorschläge** pro Werk, abgeleitet aus den Tags (Tag „Dino“ → Dino-Sticker). Vorschläge können übernommen/angepinnt werden. | S |
| W-11 | Favorit markieren (Herz). | S |
| W-12 | Verbleib des Originals: aufbewahrt · verschenkt an … · entsorgt. | K |
| W-13 | **Eingangskorb / Schnellerfassung:** viele Fotos auf einmal hochladen (z. B. Kita-Mappe), Metadaten später nachtragen. Unvollständige Werke sind sichtbar markiert. | M |

## 5. Bilddatenhaltung (Prüfkriterien für den Code)

Hier liegt laut Entwickler das größte Defizit. Diese Punkte sind beim Code-Review **einzeln** zu prüfen:

| ID | Anforderung | Prio |
|---|---|---|
| B-01 | Fotos werden **als Dateien** auf dem Server gespeichert – **nicht** als Base64 in localStorage/IndexedDB/JSON. | M |
| B-02 | Das **Original bleibt unverändert** in voller Auflösung erhalten. Beim Upload wird **nicht** verkleinert. (Druck mit 300 dpi braucht z. B. ≥ 2.500 px Breite für eine ganze A4-Seite.) | M |
| B-03 | Bearbeitung ist **nicht-destruktiv**: gespeichert werden Parameter, die Darstellung wird daraus erzeugt. Zurücksetzen jederzeit möglich. | M |
| B-04 | Automatisch erzeugte **Vorschaubilder** (z. B. 400 px Raster, ~2.000 px Vollbild). Die Galerie lädt nie Originale. | M |
| B-05 | EXIF-Ausrichtung wird korrekt berücksichtigt (keine quer liegenden Handyfotos). | M |
| B-06 | Duplikaterkennung über Datei-Hash (gleiches Foto zweimal hochgeladen → Hinweis). | S |
| B-07 | Metadaten in einer **Datenbank** (z. B. SQLite), Dateien in einem Ordner; beides zusammen bildet den vollständigen Bestand. | M |
| B-08 | **Backup & Wiederherstellung**: ein Export (ZIP mit DB + Dateien) lässt sich vollständig zurückspielen. Zusätzlich Teil des Home-Assistant-Backups. | M |
| B-09 | Löschen eines Werks oder Mediums, das noch verwendet wird → Warnung mit Liste der Verwendungen. Gelöschtes 30 Tage im Papierkorb. | S |
| B-10 | Mengengerüst: 2 Kinder × ~150 Werke/Jahr × ~4 MB ≈ **1–2 GB pro Jahr**. Galerie bleibt bei 2.000 Werken flüssig. | M |
| B-11 | Audio als Datei (z. B. AAC/Opus), Länge sichtbar, max. ca. 3 Minuten. | M |
| B-12 | Der Export rechnet aus dem **Original + Bearbeitungsparametern** in Druckauflösung, nie aus Vorschaubildern. | M |

## 6. Bildbearbeitung (Begradigen & Freistellen)

| ID | Anforderung | Prio |
|---|---|---|
| I-01 | **Perspektivkorrektur mit 4 Ecken:** schräg fotografiertes Blatt wird gerade, Couch/Tisch drumherum fällt weg. Griffe an Ecken und Seitenmitten, Lupe beim Ziehen. | M |
| I-02 | Drehen (90°-Schritte und fein), Zuschneiden. | M |
| I-03 | Helligkeit, Kontrast, Sättigung, „Papier aufhellen“ (Grauschleier vom Handyfoto entfernen). | S |
| I-04 | **Automatische Blatterkennung:** Ecken des Papiers werden vorgeschlagen und müssen nur bestätigt werden. | S |
| I-05 | Vorher/Nachher-Ansicht und „Zurücksetzen“. | S |
| I-06 | Bearbeitung direkt beim Hochladen **oder** später, Ergebnis gilt überall, wo das Medium verwendet wird. | M |

## 7. Durchsehen & Finden

| ID | Anforderung | Prio |
|---|---|---|
| D-00 | Eigener Bereich **Archiv** in der Hauptnavigation (heute: Start · Seiten · Export – das Archiv fehlt). | M |
| D-01 | Raster-Galerie mit Vorschaubildern, neueste zuerst. | M |
| D-02 | **Vollbild-Ansicht mit Wischen** (links/rechts), Pinch-Zoom, Story und Audio-Button direkt sichtbar. | M |
| D-03 | Filter: Kind, Alter/Zeitraum, Werkart, Tags, Favoriten, „unvollständig“, „noch auf keiner Seite“. | M |
| D-04 | Zeitstrahl: Werke gruppiert nach Alter („Mit 3 Jahren“, „Mit 4 Jahren“). | S |
| D-05 | Volltextsuche über Titel, Story und Tags. | S |
| D-06 | „Heute vor einem Jahr“-Rückblick. | K |
| D-07 | Vergleich gleicher Motive über die Jahre (z. B. Tag „Familie“ mit 3, 5, 7). | K |

## 8. Sticker, Themen & Gestaltungsbausteine

| ID | Anforderung | Prio |
|---|---|---|
| G-01 | Sticker sind **Daten**, nicht Code: Sticker-Bibliothek mit Name, Set/Thema, Tags, Datei (SVG/PNG). | M |
| G-02 | Eigene Sticker/Hintergründe können ergänzt werden (Ordner oder Upload). | S |
| G-03 | Themenwelten und Rahmen wie in `PROJEKT.md` Abschnitt 2. | S |
| G-04 | Zuordnung **Tag → Sticker/Thema** ist pflegbar (Grundlage für W-10). | S |

## 9. Seiten kuratieren

| ID | Anforderung | Prio |
|---|---|---|
| S-01 | Seite aus Werken und Medien des Archivs zusammenstellen (Auswahl per Filter, Mehrfachauswahl). | M |
| S-02 | Layout-Vorlagen mit 1–5 Bildern, Hoch-/Querformat. Werke werden vollständig gezeigt (`contain`), pro Platzierung eigener Ausschnitt möglich. | M |
| S-03 | Textelemente mit Platzhaltern aus den Metadaten (Name, Datum, Alter, Story) – Änderungen am Werk aktualisieren die Seite. | M |
| S-04 | Hintergrund/Thema, Rahmen, Deko-Ebenen, „Schlichter“-Button. | S |
| S-05 | Sticker verschieben, skalieren, drehen, löschen (Maus und Touch). | M |
| S-06 | Alle Positionen werden **auflösungsunabhängig** gespeichert (relativ zur Seite bzw. in mm), damit der Export in 300 dpi pixelgenau dem Editor entspricht. | M |
| S-07 | Audio-Story als **QR-Code** auf der Seite (führt zur Aufnahme). | K |
| S-08 | Automatischer Seitenvorschlag aus einer Auswahl (z. B. „alle Favoriten von Kind X mit 4“). | K |

## 10. Bücher & Export

| ID | Anforderung | Prio |
|---|---|---|
| E-01 | Buch = geordnete Liste von Seiten mit festem Format, Seiten per Drag & Drop sortierbar. Ein Buch gehört zu einem Kind **oder** mehreren (Geschwisterbuch). | M |
| E-02 | Deckblatt-Generator. | S |
| E-03 | Export als **Einzelbilder 300 dpi inkl. 3 mm Beschnitt** als ZIP für **CEWE**, Dateinamen in Seitenreihenfolge. | M |
| E-04 | Export als **PDF** (Heimdrucker A4, gleicher Stil wie die Seiten). | M |
| E-05 | Vorlage „Jahresbuch“: Buch automatisch aus allen Werken eines Kindes für ein Lebensjahr vorschlagen. | K |

## 11. Nicht-funktionale Anforderungen

| ID | Anforderung | Prio |
|---|---|---|
| N-01 | Mobile First, nutzbar in der Home-Assistant-App (Android) und im Browser am PC. | M |
| N-02 | **Kamera und Mikrofon** funktionieren in der HA-App bzw. über Cloudflare (HTTPS ist Pflicht für Mikrofonzugriff). | M |
| N-03 | Farb- und Stil-Guide aus `PROJEKT.md` ist verbindlich; ruhige App-Oberfläche, verspielt nur auf den Seiten. Optik-Entscheidungen trifft seine Frau. | M |
| N-04 | Kinderfotos verlassen den Heimserver nicht (keine Fremd-Clouds, keine externen Bild-APIs ohne Zustimmung). | M |
| N-05 | Datenmodell-Änderungen nur mit Migration. Übernahme der bisherigen Testdaten optional. | M |

## 12. Vorbereitung auf eine mögliche Veröffentlichung

Nur das, was **heute fast nichts kostet**, später aber einen Umbau erspart:

| ID | Anforderung | Prio |
|---|---|---|
| V-01 | Alle Daten hängen an einer **Familie** (Mandant), auch wenn es vorerst nur eine gibt. | M |
| V-02 | Anmeldung hinter einer Schnittstelle: heute HA-Ingress, später eigener Login. | S |
| V-03 | App läuft als **normaler Docker-Container**; das HA-Add-on ist nur eine Hülle darum. | M |
| V-04 | Dateiablage hinter einer Schnittstelle: heute lokaler Ordner, später z. B. S3. | S |
| V-05 | Später: Registrierung, Mandantentrennung, Konto- und Datenlöschung, Datenschutzerklärung (DSGVO, Kinderfotos), Speicherkosten. | K |

## 13. Datenmodell (Skizze)

```
Familie ─┬─ Benutzer
         ├─ Kind ──────────── Profilbild → Medium
         ├─ Medium            (Original, Vorschauen, EXIF, Bearbeitungsparameter, Art)
         ├─ Werk ─┬─ WerkKind (Kind, Beitrag, Reihenfolge)      ← Gemeinschaftswerk
         │        ├─ WerkMedium (Medium, Reihenfolge, Titelbild)
         │        ├─ Story (Text und/oder Audio-Medium, Erzähler-Kind)
         │        └─ WerkTag → Tag
         ├─ Sticker ── StickerTag → Tag
         ├─ Seite ─┬─ Platzierung (Werk/Medium, Slot, Ausschnitt)
         │         ├─ Textelement (Platzhalter aus Metadaten)
         │         └─ StickerElement (Position relativ, Skalierung, Drehung)
         └─ Buch ── BuchSeite (Reihenfolge), Format, Deckblatt, BuchKind
```

Alter wird nirgends gespeichert, sondern immer aus Geburtsdatum und Entstehungsdatum berechnet.

## 14. Beobachtungen aus den Screenshots der alten App (24.11.2026)

Nur funktional, die Optik bleibt wie von seiner Frau gestaltet.

- Startseite zeigt „15 Werke · 3 Seiten“ → es gibt offenbar schon einen Werk-Begriff. Prüfen, ob Werke eigene Datensätze sind oder nur Bilder auf Seiten.
- Navigation: Start · Seiten · Export. **Archiv fehlt** (→ D-00).
- Seiten hängen an genau einem Kind (ein Reiter pro Kind) → für Geschwisterbücher erweitern (→ E-01).
- Eine Seite enthält ein **Foto vom Kind**, kein Werk → bestätigt die Medium-Arten (→ F-02).
- Datum/Alter auf Seite 2 und 3 entspricht vermutlich dem Hochladedatum statt dem Entstehungsdatum → prüfen (→ W-05).
- Seiten-Editor hat Layouts 1–5, Themen, Rahmen (Wellenrand, Torbogen, Briefmarke), Anordnung, Sticker, Assistent-Button ✦ → Funktionen im Code-Review gegen S-01 bis S-05 abhaken.

---

## 15. Meilensteine

| # | Meilenstein | Inhalt | Ergebnis |
|---|---|---|---|
| **M0** | Bestandsaufnahme | Code sichten, Review gegen diese Liste (v. a. Abschnitte 3, 5, 9), Entscheidung **Weiterbau oder neues Gerüst**, Tech-Stack festlegen | Review-Bericht, Entscheidung |
| **M1** | Fundament | Repo, Docker + HA-Add-on, Backend mit SQLite + Dateiablage, Medium-Entität, Anmeldung über Ingress, Backup. **Frühe Tests:** Kamera und Mikrofon in der HA-App | Leere App läuft bei euch |
| **M2** | **Archiv-MVP** (zeitkritisch) | Kinderprofile, Werke mit Fotos/Datum/Alter/Story Text+Audio/Tags/Gemeinschaftswerk, Eingangskorb, Archiv-Galerie, Wisch-Ansicht, Filter | Ab hier nutzt ihr beide die App täglich |
| **M3** | Bildbearbeitung | Perspektive, Zuschneiden, Drehen, Aufhellen – nicht-destruktiv; danach automatische Blatterkennung | Gerade, saubere Werkfotos |
| **M4** | Sticker & Themen | Sticker-Bibliothek, Tag→Sticker-Vorschläge, Themen, Rahmen | Gestaltungsbausteine |
| **M5** | Seiten kuratieren | Bestehenden Seiten-Editor auf das Archiv umstellen | Erste fertige Seiten |
| **M6** | Buch & Export | Bücher, Deckblatt, CEWE-ZIP 300 dpi + Beschnitt, PDF | Erstes CEWE-Fotobuch bestellt |
| **M7** | Veröffentlichung (optional) | Nur bei echtem Interesse von außen | – |

## 15a. Stand der Umsetzung (M2, 24.11.2026)

| Bereich | Umgesetzt | Bewusst später |
|---|---|---|
| Kinder | K-01, K-02 (Profilbild ohne Zuschneiden), K-03, K-04 (Anzahl Werke, Zeitstrahl über Archiv) | K-05 |
| Medien | F-01 (Original, Vorschaubilder, EXIF-Datum, Ausrichtung, Größe), F-03 | F-02/F-04 „Foto vom Kind“ mit Zuordnung (eigene Oberfläche) |
| Werke | W-01, W-02, W-03 (inkl. Basteln), W-04 mit Beitrag, W-05 mit Genauigkeit und Vorschlag aus EXIF/Dateidatum, W-06, W-07, W-08, W-08a, W-09 mit Vorschlägen, W-11, W-13 | W-10 (M4), W-12 |
| Daten | B-01 bis B-07, B-09 (Papierkorb 30 Tage; Verwendungsliste ab M5), B-10 (seitenweises Laden), B-11 | B-08 Export als Datei, B-12 (M6) |
| Finden | D-00, D-01, D-02 (Wischen zwischen Fotos und über den Rand zum nächsten Werk), D-03 (ohne „noch auf keiner Seite“, kommt mit M5), D-04, D-05 | D-06, D-07 |

## 16. Offene Fragen

1. W-04 Gemeinschaftswerk: Lösung wie beschrieben in Ordnung? Braucht ihr den „Beitrag pro Kind“?
2. Sollen Großeltern irgendwann mitlesen dürfen (R-04)?
3. CEWE-Format (z. B. 21×28 hoch, 30×30 quadratisch)? Fragen an seine Frau.
4. Ideen seiner Frau: in Abschnitt 17 ergänzen.

## 17. Ideen seiner Frau

⬜ *werden ergänzt*

## 18. Änderungsprotokoll

| Datum | Änderung |
|---|---|
| 24.11.2026 | v0.1 Entwurf: Anforderungen mit IDs und Prioritäten, Prüfkriterien Bilddatenhaltung, Meilensteine M0–M7 |
| 24.11.2026 | v0.2: Entscheidungen E1–E6, Medium-Entität (Abschnitt 3), Gemeinschaftswerk (W-04, W-08a), Bildbearbeitung (Abschnitt 6), Archiv-Navigation (D-00), Datenmodell-Skizze, Beobachtungen aus Screenshots, CEWE als Ziel |
| 24.11.2026 | Ins Repo übernommen (`docs/`); Verweise auf `PROJEKT.md` und `ARCHITEKTUR.md` angepasst, Inhalt sonst unverändert |
