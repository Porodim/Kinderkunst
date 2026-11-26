// Medien (F-01): hochladen, auflisten, Original und Vorschaubild ausliefern.
//   POST /api/medien?art=werkfoto     Rohdaten im Anfragekörper; Kopfzeilen Content-Type, X-Dateiname,
//                                     X-Dauer-Ms (Audio), X-Datei-Datum (Änderungsdatum der Datei, JJJJ-MM-TT)
//   GET  /api/medien                  neueste zuerst
//   GET  /api/medien/:id
//   GET  /api/medien/:id/datei        unverändertes Original, mit Range-Unterstützung (Audio auf dem iPhone)
//   GET  /api/medien/:id/vorschau?groesse=400|2000   WebP-Vorschau (B-04), sonst Original
import { HttpFehler, sendeJson } from '../antworten.js';
import { leseBildInfo } from '../../web/js/exif.js';
import { GROESSEN } from '../vorschauen.js';
import { istDatum } from '../../web/js/alter.js';

const BILD = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};
const AUDIO = {
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
};
const ARTEN = ['werkfoto', 'kindfoto', 'profilbild', 'audio', 'sonstiges'];
export const MEDIUM_FELDER = `m.id, m.art, m.mime, m.originalname, m.groesse, m.sha256, m.breite, m.hoehe, m.dauer_ms,
  m.aufgenommen_am, json_extract(m.exif, '$.dateiDatum') AS datei_datum, m.hochgeladen_am,
  (SELECT anzeigename FROM benutzer b WHERE b.id = m.hochgeladen_von) AS hochgeladen_von`;

function dateiname(req) {
  try {
    return decodeURIComponent(req.headers['x-dateiname'] || '').slice(0, 200) || null;
  } catch {
    return null;
  }
}

export function registriereMedien(router, { db, ablage, konfiguration, vorschauen }) {
  const nachHash = db.prepare(`SELECT ${MEDIUM_FELDER} FROM medium m WHERE m.familie_id = ? AND m.sha256 = ?`);
  const nachId = db.prepare(`SELECT ${MEDIUM_FELDER}, m.datei FROM medium m WHERE m.familie_id = ? AND m.id = ? AND m.geloescht_am IS NULL`);
  const liste = db.prepare(
    `SELECT ${MEDIUM_FELDER} FROM medium m WHERE m.familie_id = ? AND m.geloescht_am IS NULL ORDER BY m.hochgeladen_am DESC, m.id DESC LIMIT ?`,
  );
  const einfuegen = db.prepare(`
    INSERT INTO medium (familie_id, art, mime, datei, originalname, groesse, sha256, breite, hoehe, dauer_ms,
      aufgenommen_am, exif, hochgeladen_von)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`);

  router.post('/api/medien', async (req, res, { benutzer, query }) => {
    const art = query.get('art') || 'werkfoto';
    if (!ARTEN.includes(art)) throw new HttpFehler(400, `Unbekannte Art: ${art}`);
    const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const istAudio = art === 'audio';
    const endung = (istAudio ? AUDIO : BILD)[mime];
    if (!endung) throw new HttpFehler(415, `Dateityp ${mime || 'unbekannt'} wird für „${art}“ nicht unterstützt`);
    const laenge = Number(req.headers['content-length'] || 0);
    const maxBytes = istAudio ? konfiguration.maxAudioBytes : konfiguration.maxBildBytes;
    if (laenge > maxBytes) throw new HttpFehler(413, `Datei ist größer als ${Math.round(maxBytes / 1048576)} MB`);

    const gespeichert = await ablage.speichere(req, { endung, maxBytes });
    const vorhanden = nachHash.get(benutzer.familie_id, gespeichert.sha256);
    if (vorhanden) return sendeJson(res, 200, { duplikat: true, medium: vorhanden });

    const info = istAudio ? {} : leseBildInfo(await ablage.leseAnfang(gespeichert.pfad, 256 * 1024));
    const dateiDatum = String(req.headers['x-datei-datum'] || '');
    const exif = { ausrichtung: info.ausrichtung ?? null, dateiDatum: istDatum(dateiDatum) ? dateiDatum : null };
    const dauer = istAudio && Number.isFinite(Number(req.headers['x-dauer-ms'])) ? Math.round(Number(req.headers['x-dauer-ms'])) : null;
    try {
      einfuegen.get(benutzer.familie_id, art, mime, gespeichert.pfad, dateiname(req), gespeichert.groesse, gespeichert.sha256,
        info.breite ?? null, info.hoehe ?? null, dauer, info.datum ?? null, JSON.stringify(exif), benutzer.id);
    } catch (fehler) {
      // Gleiche Datei zeitgleich von zwei Geräten hochgeladen
      const doch = nachHash.get(benutzer.familie_id, gespeichert.sha256);
      if (doch) return sendeJson(res, 200, { duplikat: true, medium: doch });
      throw fehler;
    }
    sendeJson(res, 201, { duplikat: false, medium: nachHash.get(benutzer.familie_id, gespeichert.sha256) });
  });

  router.get('/api/medien', (req, res, { benutzer, query }) => {
    const anzahl = Math.min(500, Math.max(1, Number(query.get('anzahl')) || 100));
    sendeJson(res, 200, { medien: liste.all(benutzer.familie_id, anzahl) });
  });

  function lade(benutzer, id) {
    const medium = nachId.get(benutzer.familie_id, Number(id));
    if (!medium) throw new HttpFehler(404, 'Medium nicht gefunden');
    return medium;
  }

  router.get('/api/medien/:id', (req, res, { benutzer, params }) => {
    const { datei, ...medium } = lade(benutzer, params.id);
    sendeJson(res, 200, { medium });
  });

  async function sendeDatei(req, res, relativ, mime, etag) {
    const gesamt = await ablage.groesse(relativ);
    const kopf = {
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=31536000, immutable',
      ETag: `"${etag}"`,
    };
    if (req.headers['if-none-match'] === kopf.ETag) {
      res.writeHead(304, kopf);
      return res.end();
    }
    const bereich = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (bereich && (bereich[1] || bereich[2])) {
      const start = bereich[1] ? Number(bereich[1]) : Math.max(0, gesamt - Number(bereich[2]));
      const ende = bereich[1] && bereich[2] ? Math.min(Number(bereich[2]), gesamt - 1) : gesamt - 1;
      if (start > ende || start >= gesamt) {
        res.writeHead(416, { 'Content-Range': `bytes */${gesamt}` });
        return res.end();
      }
      res.writeHead(206, { ...kopf, 'Content-Range': `bytes ${start}-${ende}/${gesamt}`, 'Content-Length': ende - start + 1 });
      return ablage.leseStream(relativ, { start, end: ende }).on('error', () => res.destroy()).pipe(res);
    }
    res.writeHead(200, { ...kopf, 'Content-Length': gesamt });
    ablage.leseStream(relativ).on('error', () => res.destroy()).pipe(res);
  }

  router.get('/api/medien/:id/datei', async (req, res, { benutzer, params }) => {
    const medium = lade(benutzer, params.id);
    await sendeDatei(req, res, medium.datei, medium.mime, medium.sha256);
  });

  router.get('/api/medien/:id/vorschau', async (req, res, { benutzer, params, query }) => {
    const medium = lade(benutzer, params.id);
    if (medium.art === 'audio') throw new HttpFehler(404, 'Audio hat keine Vorschau');
    const groesse = GROESSEN.includes(Number(query.get('groesse'))) ? Number(query.get('groesse')) : GROESSEN[0];
    const vorschau = await vorschauen.pfad(medium, groesse);
    if (vorschau) return sendeDatei(req, res, vorschau, 'image/webp', `${medium.sha256}-${groesse}`);
    await sendeDatei(req, res, medium.datei, medium.mime, medium.sha256);
  });
}
