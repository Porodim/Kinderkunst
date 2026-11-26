# Kinderkunst

Familien-App zum Archivieren von Kinderkunstwerken und Bauwerken (Bilder, Lego, Kapla): Foto, Datum, Alter, Geschichte als Text und Sprachaufnahme. Aus dem Archiv entstehen Albumseiten, ein PDF oder ein CEWE-Fotobuch-Paket. Die App läuft als Home-Assistant-Add-on im eigenen Heimnetz.

## Privates Projekt

- **Für den privaten Gebrauch unserer Familie.** Kein Produkt, kein Support, keine Gewähr.
- **Nur zum Testen online.** Das Repository ist zeitweise öffentlich sichtbar, damit Home Assistant das Add-on installieren kann. Das ist keine Veröffentlichung. Ob die App später öffentlich freigegeben wird, ist offen.
- **Keine Lizenz.** Damit sind alle Rechte vorbehalten. Wer den Code nutzen oder weitergeben möchte, fragt bitte vorher.
- **Keine persönlichen Daten im Repository.** Fotos, Namen und Aufnahmen liegen nur auf unserem Home-Assistant-Rechner. Alle Beispieldaten hier sind erfunden.

## Mit KI entwickelt

- **Code, Dokumente und Grafiken entstehen großteils mit Claude**, einem KI-Assistenten von Anthropic. Die ursprüngliche App (`alt/`) entstand in Gesprächen auf claude.ai, die Weiterentwicklung läuft mit Claude Code. Commits von Claude tragen den Autor „Claude“ bzw. die Zeile „Co-Authored-By: Claude“.
- **Menschen entscheiden.** Idee, Gestaltung und Wünsche kommen von der Familie. Jede Änderung wird vom Entwickler geprüft und per Pull Request übernommen; Änderungen an Aussehen und Bedienung erst nach Zustimmung der Hauptnutzerin (siehe `CLAUDE.md`).
- **Keine KI in der App selbst.** Fotos und Aufnahmen werden an keine KI und keinen anderen Dienst geschickt. „Automatisch verbessern“ ist gewöhnliche Bildbearbeitung im Browser.
- KI-geschriebener Code kann Fehler enthalten. Deshalb gibt es automatische Tests (`npm test`, GitHub Actions) und einen Testkanal in Home Assistant.

## Versionen

Die Versionsnummer ist ein Datumsstempel: `Jahr.Monat.Tag.Uhrzeit`, z. B. `2026.11.26.0748`. Home Assistant zeigt bei einem Update die Release-Notizen aus `kinderkunst/CHANGELOG.md` bzw. `kinderkunst-test/CHANGELOG.md`. Neue Version setzen:

```sh
node werkzeuge/version-setzen.mjs "Was ist neu, in Alltagssprache" "Noch etwas"
```

Das Skript setzt die Version in beiden Add-ons und in `app/package.json` und schreibt die Notizen. `npm test` prüft, dass alles zusammenpasst. Das ausführliche Entwicklungsprotokoll steht in `CHANGELOG.md` im Hauptordner.

## Aufbau

**Stand:** Das Kinderkunst-Atelier (`app/atelier/`) mit gemeinsamem Speicher auf Home Assistant, Sprachaufnahme und Fotobuch-Export. Fahrplan in Alltagssprache: `docs/FAHRPLAN.md`.

| Ordner / Datei | Inhalt |
|---|---|
| `CLAUDE.md` | Arbeitsanweisung für Claude (zuerst lesen) |
| `PROJEKT.md` | Idee, Design-Guide, Ist-Stand, offene Punkte |
| `docs/` | Anforderungen, Architektur, Review der alten App |
| `CHANGELOG.md` | Änderungsprotokoll |
| `app/` | Die Anwendung: `atelier/` (die App), `server/` (Node.js), `test/`; `web/` ruht |
| `kinderkunst-test/` | Home-Assistant-Add-on „Kinderkunst (Test)“ |
| `kinderkunst/` | Home-Assistant-Add-on „Kinderkunst“ (echte Daten) |
| `werkzeuge/` | Vorschau-Seite, Grafiken, `version-setzen.mjs` |
| `alt/` | Bisherige App (unverändert) |

## In Home Assistant installieren (Testkanal)

1. Einstellungen → Add-ons → Add-on Store → ⋮ → **Repositories** → `https://github.com/porodim/kinderkunst` hinzufügen.
2. „Kinderkunst (Test)“ installieren (wird auf dem Raspberry Pi gebaut, dauert einige Minuten) und starten.
3. In der Seitenleiste „Kinderkunst Test“ öffnen.

## Ohne Home Assistant starten

Voraussetzung Node.js ab 22.13 (empfohlen 24):

```sh
cd app
npm install        # nur für die Schriften nötig, die App läuft auch ohne
npm run dev        # http://localhost:8099, Benutzer „Testperson“, Daten in app/daten/
npm test
```

Oder mit Docker:

```sh
docker build -t kinderkunst app/
docker run -p 8099:8099 -v kinderkunst-daten:/data -e DEV_BENUTZER=Testperson kinderkunst
```

Die Kamera- und Mikrofon-Tests funktionieren im Browser nur über `localhost` oder HTTPS.
