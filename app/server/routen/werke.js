// Werke (W-01 bis W-13, D-01 bis D-05, B-09).
//   GET    /api/werke?kind=&alter=&art=&tag=&favorit=1&unvollstaendig=1&suche=&papierkorb=1&ab=&anzahl=
//   GET    /api/werke/:id
//   POST   /api/werke                      { medien, kinder, art, titel, datum, datum_genauigkeit, datum_quelle, favorit, tags, story }
//   PUT    /api/werke/:id                  dieselben Felder, nur die mitgeschickten werden geändert
//   DELETE /api/werke/:id                  in den Papierkorb (30 Tage)
//   POST   /api/werke/:id/wiederherstellen
//   GET    /api/tags
import { HttpFehler, sendeJson } from '../antworten.js';
import { leseJson, text, ganzzahl, jetzt } from '../eingabe.js';
import { transaktion } from '../datenbank.js';
import { erzeugeWerkLeser } from '../werke-lesen.js';
import { istDatum } from '../../web/js/alter.js';
import { pruefeStory, legeStoryAn } from './storys.js';

export const WERK_ARTEN = ['bild', 'basteln', 'lego', 'kapla', 'sonstiges'];
const GENAUIGKEITEN = ['tag', 'monat', 'ungefaehr'];
const QUELLEN = ['exif', 'datei', 'heute', 'manuell'];
const PAPIERKORB_TAGE = 30;

export function leerePapierkorb(db) {
  const grenze = new Date(Date.now() - PAPIERKORB_TAGE * 86400000).toISOString();
  return db.prepare('DELETE FROM werk WHERE geloescht_am IS NOT NULL AND geloescht_am < ?').run(grenze).changes;
}

function filterAus(query) {
  const zahl = (n) => (query.get(n) === null || query.get(n) === '' ? null : Number(query.get(n)));
  return {
    kind: ganzzahl(query.get('kind')),
    alter: Number.isInteger(zahl('alter')) ? zahl('alter') : null,
    art: WERK_ARTEN.includes(query.get('art')) ? query.get('art') : null,
    tag: text(query.get('tag'), 40),
    favorit: query.get('favorit') === '1',
    unvollstaendig: query.get('unvollstaendig') === '1',
    suche: text(query.get('suche'), 100),
    papierkorb: query.get('papierkorb') === '1',
  };
}

export function registriereWerke(router, { db }) {
  const leser = erzeugeWerkLeser(db);
  const kindDa = db.prepare('SELECT id FROM kind WHERE familie_id = ? AND id = ?');
  const mediumDa = db.prepare("SELECT id FROM medium WHERE familie_id = ? AND id = ? AND art != 'audio' AND geloescht_am IS NULL");

  function pruefeFelder(benutzer, d, neu) {
    const f = {};
    if (neu || 'titel' in d) f.titel = text(d.titel, 120);
    if (neu || 'art' in d) {
      f.art = d.art ?? 'bild';
      if (!WERK_ARTEN.includes(f.art)) throw new HttpFehler(400, 'Unbekannte Werkart');
    }
    if (neu || 'datum' in d) {
      f.datum = text(d.datum, 10);
      if (f.datum && !istDatum(f.datum)) throw new HttpFehler(400, 'Datum ist ungültig');
    }
    if (neu || 'datum_genauigkeit' in d) {
      f.datum_genauigkeit = d.datum_genauigkeit ?? 'tag';
      if (!GENAUIGKEITEN.includes(f.datum_genauigkeit)) throw new HttpFehler(400, 'Unbekannte Datumsgenauigkeit');
    }
    if (neu || 'datum_quelle' in d) {
      f.datum_quelle = d.datum_quelle ?? (neu ? 'manuell' : 'manuell');
      if (!QUELLEN.includes(f.datum_quelle)) throw new HttpFehler(400, 'Unbekannte Datumsquelle');
    } else if ('datum' in d) {
      f.datum_quelle = 'manuell';
    }
    if (neu || 'favorit' in d) f.favorit = d.favorit ? 1 : 0;
    if (neu || 'medien' in d) {
      if (!Array.isArray(d.medien) || !d.medien.length) throw new HttpFehler(400, 'Ein Werk braucht mindestens ein Foto');
      f.medien = [...new Set(d.medien.map(ganzzahl))];
      if (f.medien.some((m) => !m || !mediumDa.get(benutzer.familie_id, m))) throw new HttpFehler(400, 'Foto nicht gefunden');
    }
    if (neu || 'kinder' in d) {
      const roh = Array.isArray(d.kinder) ? d.kinder : [];
      const gesehen = new Set();
      f.kinder = [];
      for (const eintrag of roh) {
        const id = ganzzahl(typeof eintrag === 'object' && eintrag ? eintrag.id : eintrag);
        if (!id || !kindDa.get(benutzer.familie_id, id)) throw new HttpFehler(400, 'Kind nicht gefunden');
        if (gesehen.has(id)) continue;
        gesehen.add(id);
        f.kinder.push({ id, beitrag: typeof eintrag === 'object' ? text(eintrag.beitrag, 40) : null });
      }
    }
    if (neu || 'tags' in d) {
      const roh = Array.isArray(d.tags) ? d.tags : [];
      const gesehen = new Set();
      f.tags = [];
      for (const t of roh) {
        const name = text(t, 40);
        if (name && !gesehen.has(name.toLowerCase()) && f.tags.length < 30) {
          gesehen.add(name.toLowerCase());
          f.tags.push(name);
        }
      }
    }
    return f;
  }

  function setzeBeziehungen(familieId, werkId, f) {
    if (f.medien) {
      db.prepare('DELETE FROM werk_medium WHERE werk_id = ?').run(werkId);
      const rein = db.prepare('INSERT INTO werk_medium (werk_id, medium_id, reihenfolge) VALUES (?, ?, ?)');
      f.medien.forEach((m, i) => rein.run(werkId, m, i));
    }
    if (f.kinder) {
      db.prepare('DELETE FROM werk_kind WHERE werk_id = ?').run(werkId);
      const rein = db.prepare('INSERT INTO werk_kind (werk_id, kind_id, beitrag, reihenfolge) VALUES (?, ?, ?, ?)');
      f.kinder.forEach((k, i) => rein.run(werkId, k.id, k.beitrag, i));
    }
    if (f.tags) {
      db.prepare('DELETE FROM werk_tag WHERE werk_id = ?').run(werkId);
      const tagAnlegen = db.prepare('INSERT INTO tag (familie_id, name) VALUES (?, ?) ON CONFLICT (familie_id, name) DO NOTHING');
      const tagId = db.prepare('SELECT id FROM tag WHERE familie_id = ? AND name = ?');
      const rein = db.prepare('INSERT OR IGNORE INTO werk_tag (werk_id, tag_id) VALUES (?, ?)');
      for (const name of f.tags) {
        tagAnlegen.run(familieId, name);
        rein.run(werkId, tagId.get(familieId, name).id);
      }
      // Nicht mehr verwendete Tags entfernen
      db.prepare('DELETE FROM tag WHERE familie_id = ? AND NOT EXISTS (SELECT 1 FROM werk_tag wt WHERE wt.tag_id = tag.id)').run(familieId);
    }
  }

  function ladeWerk(benutzer, id, optionen) {
    const werk = leser.einzeln(benutzer.familie_id, Number(id), optionen);
    if (!werk) throw new HttpFehler(404, 'Werk nicht gefunden');
    return werk;
  }

  router.get('/api/werke', (req, res, { benutzer, query }) => {
    const anzahl = Math.min(200, Math.max(1, Number(query.get('anzahl')) || 60));
    const ab = Math.max(0, Number(query.get('ab')) || 0);
    sendeJson(res, 200, leser.liste(benutzer.familie_id, filterAus(query), { anzahl, ab }));
  });

  router.get('/api/werke/:id', (req, res, { benutzer, params }) => {
    sendeJson(res, 200, { werk: ladeWerk(benutzer, params.id, { auchGeloescht: true }) });
  });

  router.post('/api/werke', async (req, res, { benutzer }) => {
    const d = await leseJson(req);
    const f = pruefeFelder(benutzer, d, true);
    const story = d.story ? pruefeStory(db, benutzer, d.story) : null;
    const id = transaktion(db, () => {
      const { id: neu } = db
        .prepare(`INSERT INTO werk (familie_id, titel, art, datum, datum_genauigkeit, datum_quelle, favorit, angelegt_von)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
        .get(benutzer.familie_id, f.titel, f.art, f.datum, f.datum_genauigkeit, f.datum_quelle, f.favorit, benutzer.id);
      setzeBeziehungen(benutzer.familie_id, neu, f);
      if (story) legeStoryAn(db, benutzer, neu, story);
      return neu;
    });
    sendeJson(res, 201, { werk: ladeWerk(benutzer, id) });
  });

  router.put('/api/werke/:id', async (req, res, { benutzer, params }) => {
    const alt = ladeWerk(benutzer, params.id);
    const f = pruefeFelder(benutzer, await leseJson(req), false);
    transaktion(db, () => {
      const spalten = ['titel', 'art', 'datum', 'datum_genauigkeit', 'datum_quelle', 'favorit'].filter((s) => s in f);
      const zuweisung = [...spalten.map((s) => `${s} = ?`), 'geaendert_von = ?', 'geaendert_am = ?'].join(', ');
      db.prepare(`UPDATE werk SET ${zuweisung} WHERE id = ?`).run(...spalten.map((s) => f[s]), benutzer.id, jetzt(), alt.id);
      setzeBeziehungen(benutzer.familie_id, alt.id, f);
    });
    sendeJson(res, 200, { werk: ladeWerk(benutzer, alt.id) });
  });

  router.delete('/api/werke/:id', (req, res, { benutzer, params }) => {
    const werk = ladeWerk(benutzer, params.id);
    db.prepare('UPDATE werk SET geloescht_am = ?, geaendert_von = ?, geaendert_am = ? WHERE id = ?').run(jetzt(), benutzer.id, jetzt(), werk.id);
    // Verwendungen auf Seiten gibt es erst ab M5; dann hier mitliefern (B-09).
    sendeJson(res, 200, { geloescht: true, verwendungen: [], tage_im_papierkorb: PAPIERKORB_TAGE });
  });

  router.post('/api/werke/:id/wiederherstellen', (req, res, { benutzer, params }) => {
    const werk = ladeWerk(benutzer, params.id, { auchGeloescht: true });
    db.prepare('UPDATE werk SET geloescht_am = NULL, geaendert_von = ?, geaendert_am = ? WHERE id = ?').run(benutzer.id, jetzt(), werk.id);
    sendeJson(res, 200, { werk: ladeWerk(benutzer, werk.id) });
  });

  router.get('/api/tags', (req, res, { benutzer }) => {
    const tags = db
      .prepare(`SELECT t.name, COUNT(w.id) AS anzahl FROM tag t JOIN werk_tag wt ON wt.tag_id = t.id
        JOIN werk w ON w.id = wt.werk_id AND w.geloescht_am IS NULL WHERE t.familie_id = ? GROUP BY t.id ORDER BY anzahl DESC, t.name`)
      .all(benutzer.familie_id);
    sendeJson(res, 200, { tags });
  });
}
