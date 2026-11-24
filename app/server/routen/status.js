// GET /api/status: Version, angemeldeter Benutzer, Ingress-Kopfzeilen, Datenbank- und Speicherstand.
// Grundlage der Technik-Test-Seite (Frühtests M1).
import { sendeJson } from '../antworten.js';
import { ingressKopfzeilen } from '../anmeldung.js';
import { schemaVersion } from '../datenbank.js';
import { hatSharp } from '../vorschauen.js';

export function registriereStatus(router, { db, ablage, konfiguration, version }) {
  const medienStand = db.prepare(
    'SELECT COUNT(*) AS anzahl, COALESCE(SUM(groesse), 0) AS bytes FROM medium WHERE familie_id = ? AND geloescht_am IS NULL',
  );
  const benutzerListe = db.prepare(
    'SELECT anzeigename, name, zuletzt_gesehen FROM benutzer WHERE familie_id = ? ORDER BY zuletzt_gesehen DESC',
  );

  router.get('/api/status', (req, res, { benutzer }) => {
    sendeJson(res, 200, {
      app: 'kinderkunst',
      version,
      kanal: konfiguration.kanal,
      benutzer: { anzeigename: benutzer.anzeigename, name: benutzer.name, kennung: benutzer.kennung },
      alleBenutzer: benutzerListe.all(benutzer.familie_id),
      kopfzeilen: ingressKopfzeilen(req),
      datenbank: { schema: schemaVersion(db), medien: { ...medienStand.get(benutzer.familie_id) } },
      speicher: ablage.speicherplatz(),
      vorschaubilder: hatSharp(),
    });
  });
}
