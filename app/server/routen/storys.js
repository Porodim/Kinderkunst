// Storys am Werk (W-07, W-08, W-08a): Text und/oder Tonaufnahme, optional mit erzählendem Kind.
//   POST   /api/werke/:id/storys   { text, audio_id, erzaehler_kind_id }
//   PUT    /api/storys/:id         dieselben Felder
//   DELETE /api/storys/:id
import { HttpFehler, sendeJson } from '../antworten.js';
import { leseJson, text, ganzzahl, jetzt } from '../eingabe.js';

export function pruefeStory(db, benutzer, d, alt = {}) {
  const zusammen = { ...alt, ...d };
  const s = {
    text: text(zusammen.text, 5000),
    audio_id: zusammen.audio_id == null ? null : ganzzahl(zusammen.audio_id),
    erzaehler_kind_id: zusammen.erzaehler_kind_id == null ? null : ganzzahl(zusammen.erzaehler_kind_id),
  };
  if (!s.text && !s.audio_id) throw new HttpFehler(400, 'Story braucht Text oder eine Aufnahme');
  if (s.audio_id && !db.prepare("SELECT 1 FROM medium WHERE familie_id = ? AND id = ? AND art = 'audio'").get(benutzer.familie_id, s.audio_id)) {
    throw new HttpFehler(400, 'Aufnahme nicht gefunden');
  }
  if (s.erzaehler_kind_id && !db.prepare('SELECT 1 FROM kind WHERE familie_id = ? AND id = ?').get(benutzer.familie_id, s.erzaehler_kind_id)) {
    throw new HttpFehler(400, 'Kind nicht gefunden');
  }
  return s;
}

export function legeStoryAn(db, benutzer, werkId, s) {
  return db
    .prepare(`INSERT INTO story (werk_id, text, audio_id, erzaehler_kind_id, reihenfolge, angelegt_von)
      VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(reihenfolge), 0) + 1 FROM story WHERE werk_id = ?), ?) RETURNING id`)
    .get(werkId, s.text, s.audio_id, s.erzaehler_kind_id, werkId, benutzer.id).id;
}

export function registriereStorys(router, { db }) {
  const werkDa = db.prepare('SELECT id FROM werk WHERE familie_id = ? AND id = ? AND geloescht_am IS NULL');
  const storyMitWerk = db.prepare(`SELECT s.id, s.werk_id, s.text, s.audio_id, s.erzaehler_kind_id FROM story s
    JOIN werk w ON w.id = s.werk_id WHERE w.familie_id = ? AND s.id = ? AND w.geloescht_am IS NULL`);
  const beruehre = db.prepare('UPDATE werk SET geaendert_von = ?, geaendert_am = ? WHERE id = ?');

  router.post('/api/werke/:id/storys', async (req, res, { benutzer, params }) => {
    const werk = werkDa.get(benutzer.familie_id, Number(params.id));
    if (!werk) throw new HttpFehler(404, 'Werk nicht gefunden');
    const id = legeStoryAn(db, benutzer, werk.id, pruefeStory(db, benutzer, await leseJson(req)));
    beruehre.run(benutzer.id, jetzt(), werk.id);
    sendeJson(res, 201, { id });
  });

  router.put('/api/storys/:id', async (req, res, { benutzer, params }) => {
    const alt = storyMitWerk.get(benutzer.familie_id, Number(params.id));
    if (!alt) throw new HttpFehler(404, 'Story nicht gefunden');
    const s = pruefeStory(db, benutzer, await leseJson(req), alt);
    db.prepare('UPDATE story SET text = ?, audio_id = ?, erzaehler_kind_id = ?, geaendert_von = ?, geaendert_am = ? WHERE id = ?')
      .run(s.text, s.audio_id, s.erzaehler_kind_id, benutzer.id, jetzt(), alt.id);
    beruehre.run(benutzer.id, jetzt(), alt.werk_id);
    sendeJson(res, 200, { id: alt.id });
  });

  router.delete('/api/storys/:id', (req, res, { benutzer, params }) => {
    const alt = storyMitWerk.get(benutzer.familie_id, Number(params.id));
    if (!alt) throw new HttpFehler(404, 'Story nicht gefunden');
    db.prepare('DELETE FROM story WHERE id = ?').run(alt.id);
    beruehre.run(benutzer.id, jetzt(), alt.werk_id);
    sendeJson(res, 200, { geloescht: true });
  });
}
