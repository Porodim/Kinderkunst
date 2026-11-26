// Vertragstest: Dasselbe Drehbuch läuft gegen den echten Server und gegen die Vorschau-Nachbildung
// (web/js/vorschau). Beide müssen dieselben Antworten liefern – sonst zeigt die Vorschau etwas anderes
// als die App auf Home Assistant.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starteTestServer, erzeugeClient, jpegMitExif } from './hilfen.js';

const vorschau = await import('../web/js/vorschau/server.js');

function serverAdapter(s) {
  const api = erzeugeClient(s.basis);
  return {
    async anfrage(methode, pfad, daten) {
      const { status, daten: antwort } = await api(methode, pfad, daten);
      if (status >= 400) throw Object.assign(new Error(antwort.fehler), { status });
      return antwort;
    },
    async hochladen(inhalt, typ, art, dauerMs) {
      const r = await fetch(`${s.basis}/api/medien?art=${art}`, {
        method: 'POST', headers: { 'Content-Type': typ, 'X-Dateiname': 'datei', ...(dauerMs ? { 'X-Dauer-Ms': String(dauerMs) } : {}) }, body: inhalt,
      });
      return (await r.json()).medium;
    },
  };
}

const vorschauAdapter = {
  anfrage: (methode, pfad, daten) => vorschau.anfrage(methode, `/${pfad}`, daten),
  async hochladen(inhalt, typ, art, dauerMs) {
    return (await vorschau.ladeHoch(new File([inhalt], 'datei', { type: typ }), { art, dauerMs })).medium;
  },
};

// Zeitstempel unterscheiden sich naturgemäß und werden entfernt.
function ohneZeiten(wert) {
  if (Array.isArray(wert)) return wert.map(ohneZeiten);
  if (wert && typeof wert === 'object') {
    return Object.fromEntries(Object.entries(wert).filter(([k]) => !k.endsWith('_am') && k !== 'zuletzt_gesehen').map(([k, v]) => [k, ohneZeiten(v)]));
  }
  return wert;
}

async function drehbuch(a) {
  const log = [];
  const merke = (name, wert) => log.push([name, ohneZeiten(wert)]);
  const versuch = async (name, fn) => {
    try {
      merke(name, await fn());
    } catch (f) {
      merke(name, { status: f.status, fehler: f.message });
    }
  };

  await versuch('kind ohne Name', () => a.anfrage('POST', 'api/kinder', { name: '' }));
  await versuch('kind falsches Datum', () => a.anfrage('POST', 'api/kinder', { name: 'X', geburtsdatum: '2023-02-30' }));
  const mia = (await a.anfrage('POST', 'api/kinder', { name: 'Mia', geburtsdatum: '2021-05-10', farbe: '#D28A74' })).kind;
  const ben = (await a.anfrage('POST', 'api/kinder', { name: 'Ben', geburtsdatum: '2024-01-15' })).kind;
  await versuch('kind ändern', () => a.anfrage('PUT', `api/kinder/${ben.id}`, { spitzname: 'Benni' }));

  const f1 = await a.hochladen(jpegMitExif({ datum: '2025:03:14 10:00:00', ausrichtung: 6, rauschen: 1 }), 'image/jpeg', 'werkfoto');
  const f2 = await a.hochladen(jpegMitExif({ rauschen: 2 }), 'image/jpeg', 'werkfoto');
  const f3 = await a.hochladen(jpegMitExif({ rauschen: 3 }), 'image/jpeg', 'werkfoto');
  merke('foto', f1);
  merke('duplikat', await a.hochladen(jpegMitExif({ rauschen: 3 }), 'image/jpeg', 'werkfoto'));
  const ton = await a.hochladen(new TextEncoder().encode('erfunden'), 'audio/webm', 'audio', 2500);

  await versuch('werk ohne Foto', () => a.anfrage('POST', 'api/werke', { medien: [] }));
  await versuch('werk falsches Kind', () => a.anfrage('POST', 'api/werke', { medien: [f1.id], kinder: [99] }));
  await versuch('werk Audio als Foto', () => a.anfrage('POST', 'api/werke', { medien: [ton.id] }));
  const w1 = (await a.anfrage('POST', 'api/werke', {
    medien: [f1.id, f2.id], kinder: [{ id: mia.id, beitrag: 'gemalt' }, ben.id], art: 'lego', titel: 'Burg',
    datum: '2025-03-14', datum_quelle: 'exif', tags: ['Burg', 'zuhause', 'burg'], story: { text: 'Ein Drache wohnt da.', erzaehler_kind_id: mia.id },
  })).werk;
  merke('werk angelegt', w1);
  await a.anfrage('POST', 'api/werke', { medien: [f3.id], kinder: [mia.id], datum: '2024-07-01', tags: ['Zuhause'], favorit: true });
  await a.anfrage('POST', 'api/werke', { medien: [f2.id], datum: '2023-01-01', titel: 'Regenbogen' });
  await versuch('werk ändern', () => a.anfrage('PUT', `api/werke/${w1.id}`, { medien: [f2.id, f1.id], datum: '2025-03-15', datum_genauigkeit: 'monat' }));

  for (const q of ['', 'kind=1', 'kind=1&alter=3', 'art=lego', 'tag=ZUHAUSE', 'favorit=1', 'unvollstaendig=1', 'suche=drache', 'suche=regen', 'anzahl=1&ab=1']) {
    merke(`liste ${q}`, await a.anfrage('GET', `api/werke?${q}`));
  }
  merke('tags', await a.anfrage('GET', 'api/tags'));
  merke('kinder', await a.anfrage('GET', 'api/kinder'));

  await versuch('story leer', () => a.anfrage('POST', `api/werke/${w1.id}/storys`, {}));
  await versuch('story Foto als Ton', () => a.anfrage('POST', `api/werke/${w1.id}/storys`, { audio_id: f1.id }));
  const story = await a.anfrage('POST', `api/werke/${w1.id}/storys`, { audio_id: ton.id, erzaehler_kind_id: ben.id });
  await a.anfrage('PUT', `api/storys/${story.id}`, { text: 'Nachgetragen' });
  merke('detail mit storys', await a.anfrage('GET', `api/werke/${w1.id}`));
  await a.anfrage('DELETE', `api/storys/${story.id}`);

  merke('löschen', await a.anfrage('DELETE', `api/werke/${w1.id}`));
  merke('papierkorb', await a.anfrage('GET', 'api/werke?papierkorb=1'));
  await versuch('gelöschtes ändern', () => a.anfrage('PUT', `api/werke/${w1.id}`, { titel: 'x' }));
  merke('wiederherstellen', await a.anfrage('POST', `api/werke/${w1.id}/wiederherstellen`));
  merke('archivieren', await a.anfrage('PUT', `api/kinder/${mia.id}`, { archiviert: true }));
  merke('kinder ohne archivierte', await a.anfrage('GET', 'api/kinder'));
  return log;
}

test('Vorschau verhält sich wie der Server', async () => {
  const s = await starteTestServer({ DEV_BENUTZER: 'Vorschau' });
  try {
    const vomServer = await drehbuch(serverAdapter(s));
    vorschau.zuruecksetzen();
    const vonVorschau = await drehbuch(vorschauAdapter);
    for (let i = 0; i < vomServer.length; i++) {
      assert.deepEqual(vonVorschau[i], vomServer[i], `Abweichung bei „${vomServer[i][0]}“`);
      assert.ok(JSON.stringify(vomServer[i][1]).length > 2, `leer: ${vomServer[i][0]}`);
    }
    assert.equal(vonVorschau.length, vomServer.length);
    assert.ok(vomServer.length >= 30);
  } finally {
    await s.stopp();
  }
});
