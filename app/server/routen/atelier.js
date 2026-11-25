// Gemeinsamer Speicher des Kinderkunst-Ateliers (app/atelier/speicher.js).
//   GET /api/atelier                    { revision, zustand, geaendert_von, geaendert_am }
//   PUT /api/atelier { revision, zustand }  speichert, wenn revision der aktuelle Stand ist;
//                                       sonst 409 mit dem aktuellen Stand (anderes Gerät war schneller)
//   GET /api/atelier/sicherungen        Liste der Sicherungskopien
//   GET /api/atelier/sicherungen/:id    eine Sicherungskopie (zum Wiederherstellen per JSON-Import)
import { HttpFehler, sendeJson } from '../antworten.js';
import { leseJson, jetzt } from '../eingabe.js';
import { transaktion } from '../datenbank.js';

const MAX_BYTES = 20 * 1024 * 1024;
const SICHERUNG_ABSTAND_MS = 15 * 60 * 1000;
const SICHERUNGEN_BEHALTEN = 200;

export function registriereAtelier(router, { db }) {
  const lies = db.prepare(`SELECT z.revision, z.daten, z.geaendert_am, b.anzeigename AS geaendert_von
    FROM atelier_zustand z LEFT JOIN benutzer b ON b.id = z.geaendert_von WHERE z.familie_id = ?`);
  const letzteSicherung = db.prepare('SELECT gesichert_am FROM atelier_sicherung WHERE familie_id = ? ORDER BY gesichert_am DESC LIMIT 1');

  function aktuell(familieId) {
    const z = lies.get(familieId);
    return z
      ? { revision: z.revision, zustand: JSON.parse(z.daten), geaendert_von: z.geaendert_von, geaendert_am: z.geaendert_am }
      : { revision: 0, zustand: null, geaendert_von: null, geaendert_am: null };
  }

  router.get('/api/atelier', (req, res, { benutzer }) => {
    sendeJson(res, 200, aktuell(benutzer.familie_id));
  });

  router.put('/api/atelier', async (req, res, { benutzer }) => {
    const { revision, zustand } = await leseJson(req, MAX_BYTES);
    if (!zustand || typeof zustand !== 'object' || !['kids', 'photos', 'pages'].every((k) => Array.isArray(zustand[k]))) {
      throw new HttpFehler(400, 'Ungültiger Zustand');
    }
    const daten = JSON.stringify({ kids: zustand.kids, photos: zustand.photos, pages: zustand.pages });
    const ergebnis = transaktion(db, () => {
      const alt = lies.get(benutzer.familie_id);
      const ist = alt ? alt.revision : 0;
      if (Number(revision) !== ist) return null;
      const zeit = jetzt();
      if (alt) {
        const letzte = letzteSicherung.get(benutzer.familie_id);
        if (!letzte || Date.parse(zeit) - Date.parse(letzte.gesichert_am) >= SICHERUNG_ABSTAND_MS) {
          db.prepare('INSERT INTO atelier_sicherung (familie_id, revision, daten, gesichert_am) VALUES (?, ?, ?, ?)')
            .run(benutzer.familie_id, alt.revision, alt.daten, zeit);
          db.prepare(`DELETE FROM atelier_sicherung WHERE familie_id = ? AND id NOT IN
            (SELECT id FROM atelier_sicherung WHERE familie_id = ? ORDER BY gesichert_am DESC LIMIT ?)`)
            .run(benutzer.familie_id, benutzer.familie_id, SICHERUNGEN_BEHALTEN);
        }
      }
      db.prepare(`INSERT INTO atelier_zustand (familie_id, revision, daten, geaendert_von, geaendert_am) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (familie_id) DO UPDATE SET revision = excluded.revision, daten = excluded.daten,
          geaendert_von = excluded.geaendert_von, geaendert_am = excluded.geaendert_am`)
        .run(benutzer.familie_id, ist + 1, daten, benutzer.id, zeit);
      return ist + 1;
    });
    if (ergebnis === null) return sendeJson(res, 409, { fehler: 'Inzwischen auf einem anderen Gerät geändert', ...aktuell(benutzer.familie_id) });
    sendeJson(res, 200, { revision: ergebnis });
  });

  router.get('/api/atelier/sicherungen', (req, res, { benutzer }) => {
    const liste = db.prepare('SELECT id, revision, gesichert_am, length(daten) AS bytes FROM atelier_sicherung WHERE familie_id = ? ORDER BY gesichert_am DESC')
      .all(benutzer.familie_id).map((z) => ({ ...z }));
    sendeJson(res, 200, { sicherungen: liste });
  });

  router.get('/api/atelier/sicherungen/:id', (req, res, { benutzer, params }) => {
    const z = db.prepare('SELECT daten FROM atelier_sicherung WHERE familie_id = ? AND id = ?').get(benutzer.familie_id, Number(params.id));
    if (!z) throw new HttpFehler(404, 'Sicherung nicht gefunden');
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="kinderkunst-sicherung-${params.id}.json"`,
    });
    res.end(z.daten);
  });
}
