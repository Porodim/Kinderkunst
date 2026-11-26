// Liest Werke für Archiv-Galerie (D-01, D-03, D-05) und Detailansicht (D-02).
import { MEDIUM_FELDER } from './routen/medien.js';
import { platzhalter } from './eingabe.js';

const SORTIERUNG = "COALESCE(w.datum, substr(w.angelegt_am, 1, 10)) DESC, w.id DESC";

// Geburtstag plus n Jahre als JJJJ-MM-TT (für den Filter "mit 4 Jahren").
function plusJahre(datum, jahre) {
  return `${String(Number(datum.slice(0, 4)) + jahre).padStart(4, '0')}${datum.slice(4)}`;
}

export function erzeugeWerkLeser(db) {
  const kindDatum = db.prepare('SELECT geburtsdatum FROM kind WHERE familie_id = ? AND id = ?');

  function bedingungen(familieId, filter) {
    const wo = ['w.familie_id = ?', filter.papierkorb ? 'w.geloescht_am IS NOT NULL' : 'w.geloescht_am IS NULL'];
    const werte = [familieId];
    if (filter.kind) {
      wo.push('EXISTS (SELECT 1 FROM werk_kind wk WHERE wk.werk_id = w.id AND wk.kind_id = ?)');
      werte.push(filter.kind);
      const kind = kindDatum.get(familieId, filter.kind);
      if (Number.isInteger(filter.alter) && kind?.geburtsdatum) {
        wo.push('w.datum >= ? AND w.datum < ?');
        werte.push(plusJahre(kind.geburtsdatum, filter.alter), plusJahre(kind.geburtsdatum, filter.alter + 1));
      }
    }
    if (filter.art) {
      wo.push('w.art = ?');
      werte.push(filter.art);
    }
    if (filter.tag) {
      wo.push('EXISTS (SELECT 1 FROM werk_tag wt JOIN tag t ON t.id = wt.tag_id WHERE wt.werk_id = w.id AND t.name = ?)');
      werte.push(filter.tag);
    }
    if (filter.favorit) wo.push('w.favorit = 1');
    if (filter.unvollstaendig) wo.push('NOT EXISTS (SELECT 1 FROM werk_kind wk WHERE wk.werk_id = w.id)');
    if (filter.suche) {
      const muster = `%${filter.suche.replace(/[\\%_]/g, (z) => `\\${z}`)}%`;
      wo.push(`(w.titel LIKE ? ESCAPE '\\'
        OR EXISTS (SELECT 1 FROM story s WHERE s.werk_id = w.id AND s.text LIKE ? ESCAPE '\\')
        OR EXISTS (SELECT 1 FROM werk_tag wt JOIN tag t ON t.id = wt.tag_id WHERE wt.werk_id = w.id AND t.name LIKE ? ESCAPE '\\'))`);
      werte.push(muster, muster, muster);
    }
    return { wo: wo.join(' AND '), werte };
  }

  // Kinder, Titelbild, Tags und Story-Angaben für eine Liste von Werken ergänzen.
  function ergaenze(werke) {
    if (!werke.length) return [];
    const ids = werke.map((w) => w.id);
    const ph = platzhalter(ids);
    const kinder = db.prepare(`SELECT wk.werk_id, k.id, k.name, k.spitzname, k.farbe, k.geburtsdatum, wk.beitrag
      FROM werk_kind wk JOIN kind k ON k.id = wk.kind_id WHERE wk.werk_id IN (${ph}) ORDER BY wk.reihenfolge, k.id`).all(...ids);
    const fotos = db.prepare(`SELECT wm.werk_id, COUNT(*) AS anzahl,
        (SELECT x.medium_id FROM werk_medium x WHERE x.werk_id = wm.werk_id ORDER BY x.reihenfolge, x.medium_id LIMIT 1) AS titelbild
      FROM werk_medium wm WHERE wm.werk_id IN (${ph}) GROUP BY wm.werk_id`).all(...ids);
    const tags = db.prepare(`SELECT wt.werk_id, t.name FROM werk_tag wt JOIN tag t ON t.id = wt.tag_id
      WHERE wt.werk_id IN (${ph}) ORDER BY t.name`).all(...ids);
    const storys = db.prepare(`SELECT werk_id, COUNT(*) AS anzahl, MAX(audio_id IS NOT NULL) AS audio,
        MAX(text IS NOT NULL AND text != '') AS text FROM story WHERE werk_id IN (${ph}) GROUP BY werk_id`).all(...ids);
    const nach = (zeilen) => Map.groupBy(zeilen, (z) => z.werk_id);
    const k = nach(kinder);
    const f = new Map(fotos.map((z) => [z.werk_id, z]));
    const t = nach(tags);
    const s = new Map(storys.map((z) => [z.werk_id, z]));
    return werke.map((w) => {
      const kinderListe = (k.get(w.id) || []).map(({ werk_id, ...rest }) => rest);
      return {
        ...w,
        favorit: Boolean(w.favorit),
        titelbild_id: f.get(w.id)?.titelbild ?? null,
        anzahl_fotos: f.get(w.id)?.anzahl ?? 0,
        kinder: kinderListe,
        tags: (t.get(w.id) || []).map((z) => z.name),
        anzahl_storys: s.get(w.id)?.anzahl ?? 0,
        hat_audio: Boolean(s.get(w.id)?.audio),
        hat_text: Boolean(s.get(w.id)?.text),
        unvollstaendig: kinderListe.length === 0,
      };
    });
  }

  const FELDER = `w.id, w.titel, w.art, w.datum, w.datum_genauigkeit, w.datum_quelle, w.favorit, w.angelegt_am, w.geaendert_am,
    w.geloescht_am, (SELECT anzeigename FROM benutzer b WHERE b.id = w.angelegt_von) AS angelegt_von,
    (SELECT anzeigename FROM benutzer b WHERE b.id = w.geaendert_von) AS geaendert_von`;

  function liste(familieId, filter, { anzahl = 60, ab = 0 } = {}) {
    const { wo, werte } = bedingungen(familieId, filter);
    const gesamt = db.prepare(`SELECT COUNT(*) AS n FROM werk w WHERE ${wo}`).get(...werte).n;
    const zeilen = db.prepare(`SELECT ${FELDER} FROM werk w WHERE ${wo} ORDER BY ${SORTIERUNG} LIMIT ? OFFSET ?`).all(...werte, anzahl, ab);
    return { werke: ergaenze(zeilen.map((z) => ({ ...z }))), gesamt, mehr: ab + zeilen.length < gesamt };
  }

  function einzeln(familieId, id, { auchGeloescht = false } = {}) {
    const zeile = db.prepare(`SELECT ${FELDER} FROM werk w WHERE w.familie_id = ? AND w.id = ? ${auchGeloescht ? '' : 'AND w.geloescht_am IS NULL'}`)
      .get(familieId, id);
    if (!zeile) return null;
    const [werk] = ergaenze([{ ...zeile }]);
    werk.medien = db.prepare(`SELECT ${MEDIUM_FELDER}, wm.reihenfolge FROM werk_medium wm JOIN medium m ON m.id = wm.medium_id
      WHERE wm.werk_id = ? ORDER BY wm.reihenfolge, m.id`).all(id).map((z) => ({ ...z }));
    werk.storys = db.prepare(`SELECT s.id, s.text, s.erzaehler_kind_id, s.reihenfolge, s.angelegt_am,
        (SELECT anzeigename FROM benutzer b WHERE b.id = s.angelegt_von) AS angelegt_von,
        a.id AS audio_id, a.dauer_ms AS audio_dauer_ms, a.mime AS audio_mime
      FROM story s LEFT JOIN medium a ON a.id = s.audio_id WHERE s.werk_id = ? ORDER BY s.reihenfolge, s.id`).all(id).map((z) => ({ ...z }));
    return werk;
  }

  return { liste, einzeln };
}
