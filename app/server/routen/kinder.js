// Kinderprofile (K-01, K-02). Alter und Sternzeichen berechnet die Oberfläche (K-03).
//   GET  /api/kinder?archivierte=1
//   POST /api/kinder        { name, spitzname, geburtsdatum, farbe, profilbild_id }
//   PUT  /api/kinder/:id    dieselben Felder, dazu { archiviert: true|false }
import { HttpFehler, sendeJson } from '../antworten.js';
import { leseJson, text, ganzzahl, jetzt } from '../eingabe.js';
import { istDatum } from '../../web/js/alter.js';

export const KIND_FELDER = `k.id, k.name, k.spitzname, k.geburtsdatum, k.farbe, k.profilbild_id, k.reihenfolge, k.archiviert_am,
  (SELECT COUNT(*) FROM werk_kind wk JOIN werk w ON w.id = wk.werk_id WHERE wk.kind_id = k.id AND w.geloescht_am IS NULL) AS anzahl_werke`;

export function registriereKinder(router, { db }) {
  const liste = db.prepare(`SELECT ${KIND_FELDER} FROM kind k WHERE k.familie_id = ? AND (? OR k.archiviert_am IS NULL) ORDER BY k.reihenfolge, k.id`);
  const eines = db.prepare(`SELECT ${KIND_FELDER} FROM kind k WHERE k.familie_id = ? AND k.id = ?`);
  const medium = db.prepare("SELECT id FROM medium WHERE familie_id = ? AND id = ? AND art != 'audio'");

  function pruefe(benutzer, daten, alt = {}) {
    const zusammen = { ...alt, ...daten };
    const name = text(zusammen.name, 80);
    if (!name) throw new HttpFehler(400, 'Bitte einen Namen eingeben');
    const geburtsdatum = text(zusammen.geburtsdatum, 10);
    if (geburtsdatum && !istDatum(geburtsdatum)) throw new HttpFehler(400, 'Geburtsdatum ist ungültig');
    const farbe = text(zusammen.farbe, 7);
    if (farbe && !/^#[0-9a-fA-F]{6}$/.test(farbe)) throw new HttpFehler(400, 'Farbe ist ungültig');
    const profilbild = zusammen.profilbild_id == null ? null : ganzzahl(zusammen.profilbild_id);
    if (profilbild && !medium.get(benutzer.familie_id, profilbild)) throw new HttpFehler(400, 'Profilbild nicht gefunden');
    return { name, spitzname: text(zusammen.spitzname, 40), geburtsdatum, farbe, profilbild };
  }

  router.get('/api/kinder', (req, res, { benutzer, query }) => {
    sendeJson(res, 200, { kinder: liste.all(benutzer.familie_id, query.get('archivierte') === '1' ? 1 : 0) });
  });

  router.post('/api/kinder', async (req, res, { benutzer }) => {
    const k = pruefe(benutzer, await leseJson(req));
    const { id } = db
      .prepare(`INSERT INTO kind (familie_id, name, spitzname, geburtsdatum, farbe, profilbild_id, reihenfolge, angelegt_von)
        VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(reihenfolge), 0) + 1 FROM kind WHERE familie_id = ?), ?) RETURNING id`)
      .get(benutzer.familie_id, k.name, k.spitzname, k.geburtsdatum, k.farbe, k.profilbild, benutzer.familie_id, benutzer.id);
    sendeJson(res, 201, { kind: eines.get(benutzer.familie_id, id) });
  });

  router.put('/api/kinder/:id', async (req, res, { benutzer, params }) => {
    const alt = eines.get(benutzer.familie_id, Number(params.id));
    if (!alt) throw new HttpFehler(404, 'Kind nicht gefunden');
    const daten = await leseJson(req);
    const k = pruefe(benutzer, daten, alt);
    const archiviert = daten.archiviert === undefined ? alt.archiviert_am : daten.archiviert ? alt.archiviert_am || jetzt() : null;
    db.prepare(`UPDATE kind SET name = ?, spitzname = ?, geburtsdatum = ?, farbe = ?, profilbild_id = ?, archiviert_am = ?,
        geaendert_von = ?, geaendert_am = ? WHERE id = ?`)
      .run(k.name, k.spitzname, k.geburtsdatum, k.farbe, k.profilbild, archiviert, benutzer.id, jetzt(), alt.id);
    sendeJson(res, 200, { kind: eines.get(benutzer.familie_id, alt.id) });
  });
}
