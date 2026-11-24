# Kinderkunst – Architektur, Betrieb und Deployment

| | |
|---|---|
| **Stand** | 24.11.2026 |
| **Status** | Entscheidungen A1–A6 sind getroffen. A7 (Tech-Stack) ist offen und wird in M0 vorgeschlagen. Der Entwickler entscheidet. |

Dieses Dokument regelt, **wie** die App betrieben wird. Was sie können soll, steht in `ANFORDERUNGEN.md`.

## Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| A1 | Die App ist ein **normaler Docker-Container**. Das Home-Assistant-Add-on ist nur eine Hülle darum (V-03). | Später ohne Umbau auch auf einem anderen Server lauffähig. |
| A2 | Betrieb als **Home-Assistant-Add-on** mit **Ingress**. Anmeldung über den HA-Benutzer, kein zweites Passwort (R-03). | Beide Eltern haben schon HA-Zugang. Die Benutzerkennung wird aus den Ingress-Headern gelesen; **die genauen Header beim Bau prüfen**, nicht annehmen. |
| A3 | **Speicher:** SQLite für Metadaten, Dateien (Originale, Vorschauen, Audio) in einem Ordner im Add-on-Datenverzeichnis. Dateiablage hinter einer Schnittstelle (V-04). | Beides liegt automatisch im HA-Backup (B-07, B-08). Keine Fremd-Cloud (N-04). |
| A4 | **Zwei Kanäle:** ein Add-on „Kinderkunst (Test)“ mit erfundenen Daten und ein Add-on „Kinderkunst“ mit dem echten Archiv. Getrennte Datenordner. | Ein fehlerhafter Test gefährdet nie die echten Bilder. |
| A5 | **Fernzugriff** über den vorhandenen Cloudflare-Zugang, wie bei den bisherigen Add-ons. | Vorhanden und erprobt. HTTPS ist damit gegeben, was für das Mikrofon Pflicht ist (N-02). |
| A6 | **Das Repo ist die Quelle der Wahrheit.** Änderungen auf `main` bzw. per Pull Request, von dort wird auf HA ausgerollt. Release-Notizen in `CHANGELOG.md`. | Nachvollziehbar, und die Weiterarbeit braucht keine lokale Entwicklungsumgebung. |
| A7 | **Tech-Stack: offen.** Vorschlag kommt aus M0. | Hängt vom Code-Review ab. |

## Randbedingungen an den Tech-Stack (A7)

- Läuft in einem Docker-Container auf dem HA-Rechner (ressourcenschonend).
- Bildverarbeitung **auf dem Server**: EXIF-Ausrichtung, Vorschaubilder, Hash, später Export in 300 dpi (B-02 bis B-05, B-12).
- Mehrere gleichzeitige Nutzer auf einer Datenbank (R-01).
- Audioaufnahme im Browser, Ablage als Datei (B-11).
- **Wartbar in kleinen Schritten:** viele kleine Dateien statt einer großen, keine exotischen Werkzeuge. Weiterentwickelt wird auch mit Claude bei begrenztem Kontingent.
- Der Look der alten App (Papeterie, Aquarell, Schriften) bleibt erhalten.

## Wichtige Frühtests (M1)

Diese Punkte entscheiden über die Machbarkeit und werden **vor** dem Ausbau getestet:

1. **Kamera und Mikrofon in der HA-App (Android)**: Funktioniert der Zugriff innerhalb von Ingress in der Companion-App? Falls nicht: Fallback über den Browser mit der Cloudflare-Adresse, und für Fotos ein Datei-Upload mit direktem Kamerazugriff.
2. **Große Uploads** (mehrere Fotos à 4 MB und mehr) über Ingress und Cloudflare: Gibt es Größen- oder Zeitlimits?
3. **Zwei Benutzer gleichzeitig** (er und sie) auf demselben Bestand.
4. **Backup und Wiederherstellung** eines Add-on-Datenordners samt Bildern.

## Offene Punkte (Entwickler klärt)

- **Wie kommt das Add-on auf HA?** Der Entwickler hat das bei früheren Add-ons schon gemacht. Den bewährten Weg übernehmen und hier festhalten. Zu klären ist insbesondere, ob das Repo für den Add-on-Weg öffentlich sein muss oder ob es auch privat geht. Das Repo darf nie echte Kinderdaten enthalten, damit beides möglich bleibt.
- **Versionierung:** gleiches Schema wie bei früheren Add-ons (Versionsnummer aus Datum und Uhrzeit)? Vorschlag, noch nicht entschieden.
- **Automatischer Build** (GitHub Actions) oder Bau direkt auf dem HA-Rechner?

## Repository-Zielstruktur (Vorschlag, in M1 anpassen)

```
kinderkunst/
├─ CLAUDE.md · README.md · PROJEKT.md · CHANGELOG.md
├─ docs/             Anforderungen, Architektur, Review der alten App
├─ alt/              alte App, unverändert
├─ app/              Anwendung (Backend, Frontend, Dockerfile)
│  └─ testdaten/     erfundene Beispieldaten für den Testkanal
└─ addon/            Home-Assistant-Hülle (Konfiguration, Symbole, Übersetzungen)
```
