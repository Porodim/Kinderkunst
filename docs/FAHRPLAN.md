# Fahrplan – in Alltagssprache

Dieses Dokument erklärt, wie die App Schritt für Schritt entsteht, ohne Technik-Vorwissen. Claude führt es nach jedem Meilenstein nach.

## Was ist ein Meilenstein?

Ein **Meilenstein** ist ein Paket von Funktionen, das zusammen benutzbar ist. Beispiel: „Archiv“ = Kinder anlegen, Werke fotografieren, Geschichten dazu, alles wiederfinden. Erst wenn ein Paket als Ganzes funktioniert, kommt es zu euch auf Home Assistant.

## Wie ein Meilenstein abläuft

1. **Wünsche sammeln.** Du sagst einfach, was du möchtest oder was dich stört. Claude ordnet es dem passenden Meilenstein zu, erklärt es kurz und sagt, wann es drankommt.
2. **Bauen und prüfen.** Claude baut, testet automatisch und klickt sich selbst im Browser durch.
3. **Ausprobieren in der Vorschau.** Die Seite „Kinderkunst Vorschau“ bei Claude zeigt den neuesten Stand. Dort probierst du ohne Home Assistant aus; Fotos bleiben nur in deinem Browserfenster. Kamera und Mikrofon gehen dort nicht.
4. **Feinschliff.** Deine Rückmeldungen werden eingebaut, so oft wie nötig.
5. **Ausliefern.** Wenn alle Punkte der Prüfliste unten erfüllt sind, sagt Claude: „Meilenstein fertig“. Dann:
   - Claude schnürt das Paket für GitHub (das heißt **Pull Request**).
   - Dein Mann schaut es an und übernimmt es (**Merge**).
   - In Home Assistant beim Add-on auf **„Neu bauen“** tippen. Zuerst im Test-Add-on ausprobieren, dann im echten.

## Leitlinie für die Gestaltung

Die App **ist** deine alte App (das Kinderkunst-Atelier). Sie wird weiterentwickelt, nicht ersetzt, und bleibt so **einfach und intuitiv** wie bisher („Das kleine Atelier für große Werke“): wenige Knöpfe, kurze Wege, nur das Nötige sichtbar. Alles Seltene liegt zugeklappt unter „Mehr“. Neue Funktionen werden nur dann sichtbar, wenn sie im Alltag wirklich gebraucht werden.

## Prüfliste: Wann ist ein Meilenstein fertig?

Claude entscheidet danach, ob ein Stand ins Repository kommt:

- [ ] Alle geplanten Funktionen des Meilensteins sind da (siehe Tabelle unten).
- [ ] Die Oberfläche ist so schlicht wie in der alten App (Leitlinie oben).
- [ ] Alle automatischen Tests laufen fehlerfrei, auch bei GitHub (dort zusätzlich der Bau für den Raspberry Pi).
- [ ] Claude hat den kompletten Ablauf selbst im Browser durchgeklickt: in der App und in der Vorschau, ohne Fehlermeldungen.
- [ ] Die Vorschau ist auf dem neuesten Stand, damit du sie ausprobieren kannst.
- [ ] Keine echten Fotos, Namen oder Aufnahmen im Repository.
- [ ] Änderungsprotokoll und Stand in den Dokumenten sind nachgetragen.
- [ ] Offene Fragen an dich oder deinen Mann sind gestellt.

## Die Meilensteine

| | Meilenstein | Was ihr davon habt | Stand |
|---|---|---|---|
| M0 | Bestandsaufnahme | Klarheit, was von der alten App bleibt | ✅ fertig |
| M1 | Fundament | App läuft auf Home Assistant, Fotos und Ton werden sicher gespeichert, Technik-Test | ✅ fertig, offen: Backup als eigene Datei |
| **M2a** | **Dein Atelier auf Home Assistant** | Deine bisherige App, unverändert in der Bedienung. Speichert jetzt gemeinsam auf Home Assistant: du und dein Mann seht dieselben Kinder, Fotos und Seiten. Originalfotos werden in voller Größe aufbewahrt, frühere Stände als Sicherung | ✅ gebaut, **jetzt ausprobieren** |
| M2 (ruht) | **Archiv (neue Oberfläche)** | Schlicht wie die alte App: Kind mit Name und Geburtsdatum, Werk sichern (Foto, Kind, was es ist, Datum, Titel, „Was sagt das Kind dazu?“ als Text oder Aufnahme), Archiv nach Kindern und Alter. Seltenes (Tags, ungefähres Datum, Suche, Filter) zugeklappt | ruht (auf Wunsch der Nutzerin) |
| M3 | Fotos geraderücken | Schräg fotografierte Bilder gerade ziehen, zuschneiden, drehen, aufhellen; das Original bleibt immer erhalten | ⬜ als Nächstes |
| M4 | Sticker & Themen | Aquarell-Sticker in Druckqualität, Themen, Rahmen, Sticker-Vorschläge passend zu den Tags | ⬜ |
| M5 | Seiten gestalten | Albumseiten aus dem Archiv, wie in der alten App, aber verknüpft: ändert sich ein Werk, ändert sich die Seite | ⬜ |
| M6 | Fotobuch & PDF | Bücher zusammenstellen, Deckblatt, Paket für CEWE, PDF für den Drucker zu Hause | ⬜ |

## Kleines Wörterbuch

| Wort | Bedeutung |
|---|---|
| Repository (Repo) | Der Ordner bei GitHub, in dem der gesamte Code liegt. Home Assistant holt sich die App von dort. |
| Branch (Zweig) | Eine Arbeitskopie im Repo, an der gebaut wird, ohne die fertige Fassung zu stören. |
| Pull Request | Ein geschnürtes Paket von Änderungen mit Beschreibung, das dein Mann prüft. |
| Merge | Das Paket wird in die fertige Fassung übernommen. |
| Add-on | Eine App, die auf eurem Home-Assistant-Rechner läuft. Es gibt zwei: „Kinderkunst (Test)“ zum Ausprobieren und „Kinderkunst“ mit euren echten Daten. |
| Vorschau | Die Seite „Kinderkunst Vorschau“ bei Claude zum Ausprobieren ohne Home Assistant. |
