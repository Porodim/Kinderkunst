# Changelog

| Datum | Änderung |
|---|---|
| 24.11.2026 | Bisherige App 1:1 nach `alt/` übernommen (Commit von der Claude-Instanz der Nutzerin). |
| 24.11.2026 | Planung ins Repo übernommen: `CLAUDE.md`, `PROJEKT.md`, `docs/ANFORDERUNGEN.md` (v0.2), `docs/ARCHITEKTUR.md`. Kein App-Code geändert. Nächster Schritt: M0 Bestandsaufnahme. |
| 24.11.2026 | Datenschutz-Regel verschärft (Repo zeitweise öffentlich), Installationsweg auf HA festgehalten, `.gitignore` für Fotos, Audio, Datenbanken und Backups angelegt. `alt/` geprüft: nur Sticker und Hintergründe, keine Fotos oder Namen. |
| 24.11.2026 | **M0 Bestandsaufnahme:** `docs/REVIEW-ALT.md` neu (Prüfung von `alt/index.html` pro Anforderungs-ID, 15 Fehler/Schwachstellen, Empfehlung „neues Gerüst, alte Logik und Grafiken umziehen“, Tech-Stack-Vorschlag Node.js + SQLite + sharp). Status in `PROJEKT.md` Abschnitt 3 und 4 nachgetragen, offene Fragen ergänzt, Verweis in `docs/ARCHITEKTUR.md` (A7). Kein App-Code geändert, `alt/` unverändert. Nächster Schritt: Entscheidung durch den Entwickler, dann M1. |
| 24.11.2026 | **Datenschutz-Bereinigung:** Kindernamen, Vorname des Entwicklers, Namen anderer Add-ons und die Beschreibung eines echten Fotos aus allen Dokumenten entfernt; **gesamter Git-Verlauf umgeschrieben** (Force-Push auf `main`, alle Commit-Kennungen neu). Wer das Repo schon geklont hat (auch Home Assistant), muss es neu holen. |
| 24.11.2026 | Entscheidungen nach M0 festgehalten: Tech-Stack A7 und Bauweg A8 (`docs/ARCHITEKTUR.md`), Gestaltung nah an der alten App mit max. 5 % Bildbeschnitt (E7, `PROJEKT.md` Abschnitt 2), offene Frage zu Stickern in Druckauflösung. |
