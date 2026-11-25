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
| M2 (ruht) | Archiv (neue Oberfläche) | Ersetzt durch die Meilensteine A1–A4 in deinem Atelier | ruht (auf Wunsch der Nutzerin) |

### Deine Wünsche vom 25.11.2026, alle im Atelier (`app/atelier/index.html`)

Die Nummern sind die aus deiner Auswahlliste.

| | Meilenstein | Was ihr davon habt | Stand |
|---|---|---|---|
| **A1** | **Archiv** | Eigener Bereich „Kunstwerke“ unten in der Leiste (11), mit einem Satz, wofür er da ist. Suchen zugeklappt, Papierkorb immer unten. Kind mit Profilbild und Lieblingsfarbe (1). Zeitstrahl: Werke nach Alter sortiert, „Im ersten Lebensjahr“, „Mit 2 Jahren“ … (2). Datum kommt automatisch aus dem Foto und lässt sich ändern (6). Stichwörter mit Vorschlägen (8). Viele Fotos auf einmal, Angaben später mit „Jetzt ausfüllen“ (10). Groß ansehen und wischen (12). Suchen und Filtern nach Art und Stichwort (13). Papierkorb 30 Tage (14). Warnung, wenn ein Werk noch auf einer Seite klebt (15) | ✅ gebaut, **jetzt ausprobieren** |
| A2 | Fotos verbessern | Blatt gerade ziehen mit Lupe und automatischer Eckenerkennung (16), fein drehen (17), Vorher/Nachher (18) | ⬜ als Nächstes |
| A3 | Seiten | Sticker drehen (19), Sticker-Vorschläge passend zu den Stichwörtern (20), Bilder ohne Abschneiden (21), Seiten ändern sich mit, wenn ein Werk geändert wird (24) | ⬜ |
| A4 | Fotobuch & PDF | PDF sieht aus wie in der App, PDF-Knopf repariert (22), Fotobuch aus mehreren Seiten, sortieren, auch Geschwister zusammen (23) | ⬜ |

Die früher geplanten Meilensteine M3–M6 gehen in A2–A4 auf.

## Kleines Wörterbuch

| Wort | Bedeutung |
|---|---|
| Repository (Repo) | Der Ordner bei GitHub, in dem der gesamte Code liegt. Home Assistant holt sich die App von dort. |
| Branch (Zweig) | Eine Arbeitskopie im Repo, an der gebaut wird, ohne die fertige Fassung zu stören. |
| Pull Request | Ein geschnürtes Paket von Änderungen mit Beschreibung, das dein Mann prüft. |
| Merge | Das Paket wird in die fertige Fassung übernommen. |
| Add-on | Eine App, die auf eurem Home-Assistant-Rechner läuft. Es gibt zwei: „Kinderkunst (Test)“ zum Ausprobieren und „Kinderkunst“ mit euren echten Daten. |
| Vorschau | Die Seite „Kinderkunst Vorschau“ bei Claude zum Ausprobieren ohne Home Assistant. |
