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

## Installation auf Home Assistant (entschieden 24.11.2026)

- Der Entwickler installiert das Add-on **manuell über dieses Repo** (als Add-on-Repository in Home Assistant hinzufügen).
- **Ob Home Assistant ein privates Repo lesen kann, ist ungeklärt.** Bis das geklärt ist, wird das Repo bei Bedarf **vorübergehend öffentlich** gestellt. Sobald der Weg läuft, geht es wieder auf privat, falls das technisch möglich ist.
- **Folge für alle:** Das Repo muss jederzeit öffentlichkeitstauglich sein. **Keine Kinderfotos, Kindernamen, Geburtsdaten, Audioaufnahmen, Backups oder andere persönliche Daten im Repo, auch nicht im Verlauf.** Details und Prüfschritte stehen in `CLAUDE.md`.
- Stand der Prüfung (24.11.2026): `alt/` enthält nur Sticker- und Hintergrundgrafiken (185 eingebettete WebP-Bilder, je unter 12 KB) und keine Fotos oder Namen. Die Screenshots der alten App liegen **nicht** im Repo und bleiben draußen.
- Die echten Daten liegen nur im Datenordner des Add-ons auf dem HA-Rechner (A3), nie im Repo. Dafür sorgt `.gitignore`.

## Offene Punkte (Entwickler klärt)

- **Privat oder öffentlich?** Ausprobieren, ob HA das private Repo lesen kann. Falls nicht: temporär öffentlich (siehe oben). Den bewährten Weg der bisherigen Add-ons hier festhalten.
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
