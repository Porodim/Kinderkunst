# Kinderkunst

Familien-App zum Archivieren von Kinderkunstwerken und Bauwerken (Bilder, Lego, Kapla) mit Story als Text und Audio – später als Albumseiten, PDF und CEWE-Fotobuch-Paket exportierbar. Läuft als Home-Assistant-Add-on.

**Stand:** M2 Archiv (Kinder, Werke mit Fotos, Datum und Alter, Geschichten als Text und Ton, Tags, Galerie mit Filtern). Fahrplan in Alltagssprache: `docs/FAHRPLAN.md`. Die bisherige App liegt als Referenz in `alt/`.

| Ordner / Datei | Inhalt |
|---|---|
| `CLAUDE.md` | Arbeitsanweisung für Claude (zuerst lesen) |
| `PROJEKT.md` | Idee, Design-Guide, Ist-Stand, offene Punkte |
| `docs/` | Anforderungen, Architektur, Review der alten App |
| `CHANGELOG.md` | Änderungsprotokoll |
| `app/` | Die Anwendung: `server/` (Node.js), `web/` (Oberfläche), `test/` |
| `kinderkunst-test/` | Home-Assistant-Add-on „Kinderkunst (Test)“ |
| `kinderkunst/` | Home-Assistant-Add-on „Kinderkunst“ (echte Daten) |
| `werkzeuge/` | Bau der Vorschau-Seite |
| `alt/` | Bisherige App (unverändert) |

## In Home Assistant installieren (Testkanal)

1. Einstellungen → Add-ons → Add-on Store → ⋮ → **Repositories** → `https://github.com/porodim/kinderkunst` hinzufügen.
2. „Kinderkunst (Test)“ installieren (wird auf dem Raspberry Pi gebaut, dauert einige Minuten) und starten.
3. In der Seitenleiste „Kinderkunst Test“ öffnen → „Technik-Test“.

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
