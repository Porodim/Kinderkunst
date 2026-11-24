// M2 Archiv: Kinder, Werke, Gemeinschaftswerke, Storys, Tags, Filter, Papierkorb.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starteTestServer, erzeugeClient, jpegMitExif } from './hilfen.js';
import { leseBildInfo } from '../web/js/exif.js';
import { alterKurz, alterLang, sternzeichen, datumText } from '../web/js/alter.js';

async function foto(s, optionen = {}, art = 'werkfoto') {
  const r = await fetch(`${s.basis}/api/medien?art=${art}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg', 'X-Datei-Datum': '2025-07-01' },
    body: jpegMitExif(optionen),
  });
  return (await r.json()).medium;
}

test('EXIF: Datum, Ausrichtung und gedrehte Größe', () => {
  assert.deepEqual(leseBildInfo(jpegMitExif({ datum: '2024:02:29 09:15:00', ausrichtung: 6 })), {
    ausrichtung: 6, datum: '2024-02-29', breite: 3000, hoehe: 4000,
  });
  assert.deepEqual(leseBildInfo(Buffer.from('kein Bild')), {});
});

test('Alter und Sternzeichen wie in der alten App (K-03, W-06)', () => {
  assert.equal(alterKurz('2021-05-10', '2025-08-20'), '4 J. 3 Mo.');
  assert.equal(alterKurz('2021-05-10', '2025-08-20', 'ungefaehr'), 'ca. 4 J.');
  assert.equal(alterKurz('2025-01-10', '2025-01-20'), '10 T.');
  assert.equal(alterKurz('2025-01-10', '2024-12-01'), '');
  assert.equal(alterLang('2021-05-10', '2022-05-10'), '1 Jahr');
  assert.equal(sternzeichen('2021-05-10'), '♉ Stier');
  assert.equal(datumText('2025-03-03', 'monat'), 'März 2025');
});

test('Hochladen liest EXIF-Datum und Bildgröße', async () => {
  const s = await starteTestServer();
  try {
    const m = await foto(s, { datum: '2025:03:14 10:00:00', ausrichtung: 6 });
    assert.equal(m.aufgenommen_am, '2025-03-14');
    assert.equal(m.datei_datum, '2025-07-01');
    assert.equal(m.breite, 3000);
    assert.equal(m.hoehe, 4000);
  } finally {
    await s.stopp();
  }
});

test('Kinder anlegen, ändern, archivieren (K-01, K-02)', async () => {
  const s = await starteTestServer();
  const api = erzeugeClient(s.basis);
  try {
    assert.equal((await api('POST', 'api/kinder', { name: '  ' })).status, 400);
    assert.equal((await api('POST', 'api/kinder', { name: 'Mia', geburtsdatum: '2025-02-30' })).status, 400);
    const { daten } = await api('POST', 'api/kinder', { name: 'Mia', geburtsdatum: '2021-05-10', farbe: '#D28A74' });
    assert.equal(daten.kind.name, 'Mia');
    const geaendert = await api('PUT', `api/kinder/${daten.kind.id}`, { spitzname: 'Mimi' });
    assert.equal(geaendert.daten.kind.spitzname, 'Mimi');
    assert.equal(geaendert.daten.kind.geburtsdatum, '2021-05-10');
    await api('PUT', `api/kinder/${daten.kind.id}`, { archiviert: true });
    assert.equal((await api('GET', 'api/kinder')).daten.kinder.length, 0);
    assert.equal((await api('GET', 'api/kinder?archivierte=1')).daten.kinder.length, 1);
  } finally {
    await s.stopp();
  }
});

test('Werk mit mehreren Fotos, Gemeinschaftswerk, Tags, Story (W-02, W-04, W-07, W-09)', async () => {
  const s = await starteTestServer();
  const api = erzeugeClient(s.basis);
  try {
    const mia = (await api('POST', 'api/kinder', { name: 'Mia', geburtsdatum: '2021-05-10' })).daten.kind;
    const ben = (await api('POST', 'api/kinder', { name: 'Ben', geburtsdatum: '2024-01-15' })).daten.kind;
    const f1 = await foto(s, { rauschen: 1 });
    const f2 = await foto(s, { rauschen: 2 });
    assert.equal((await api('POST', 'api/werke', { medien: [] })).status, 400);

    const { status, daten } = await api('POST', 'api/werke', {
      medien: [f2.id, f1.id],
      kinder: [{ id: mia.id, beitrag: 'gemalt' }, ben.id],
      art: 'lego',
      titel: 'Große Burg',
      datum: '2025-06-01',
      datum_quelle: 'exif',
      tags: ['Burg', 'burg', 'Zuhause'],
      story: { text: 'Da wohnt ein Drache.', erzaehler_kind_id: mia.id },
    });
    assert.equal(status, 201);
    const w = daten.werk;
    assert.equal(w.titelbild_id, f2.id);
    assert.equal(w.anzahl_fotos, 2);
    assert.deepEqual(w.kinder.map((k) => [k.name, k.beitrag]), [['Mia', 'gemalt'], ['Ben', null]]);
    assert.deepEqual(w.tags, ['Burg', 'Zuhause']);
    assert.equal(w.storys[0].text, 'Da wohnt ein Drache.');
    assert.equal(w.unvollstaendig, false);
    assert.equal(w.angelegt_von, 'Testperson');

    // Ändern: Reihenfolge der Fotos, Favorit, Datum (Quelle wird "manuell")
    const neu = await api('PUT', `api/werke/${w.id}`, { medien: [f1.id, f2.id], favorit: true, datum: '2025-05-20' });
    assert.equal(neu.daten.werk.titelbild_id, f1.id);
    assert.equal(neu.daten.werk.favorit, true);
    assert.equal(neu.daten.werk.datum_quelle, 'manuell');
    assert.equal(neu.daten.werk.titel, 'Große Burg');

    const kinder = (await api('GET', 'api/kinder')).daten.kinder;
    assert.deepEqual(kinder.map((k) => k.anzahl_werke), [1, 1]);
    assert.deepEqual((await api('GET', 'api/tags')).daten.tags.map((t) => t.name), ['Burg', 'Zuhause']);
  } finally {
    await s.stopp();
  }
});

test('Audio-Story anlegen, ändern, löschen (W-08, W-08a)', async () => {
  const s = await starteTestServer();
  const api = erzeugeClient(s.basis);
  try {
    const f = await foto(s);
    const w = (await api('POST', 'api/werke', { medien: [f.id] })).daten.werk;
    assert.equal(w.unvollstaendig, true);
    const audio = await (await fetch(`${s.basis}/api/medien?art=audio`, {
      method: 'POST', headers: { 'Content-Type': 'audio/webm', 'X-Dauer-Ms': '3100' }, body: 'erfundene Aufnahme',
    })).json();
    assert.equal((await api('POST', `api/werke/${w.id}/storys`, {})).status, 400);
    assert.equal((await api('POST', `api/werke/${w.id}/storys`, { audio_id: f.id })).status, 400);
    const { daten } = await api('POST', `api/werke/${w.id}/storys`, { audio_id: audio.medium.id });
    let detail = (await api('GET', `api/werke/${w.id}`)).daten.werk;
    assert.equal(detail.storys[0].audio_dauer_ms, 3100);
    assert.equal(detail.hat_audio, true);
    await api('PUT', `api/storys/${daten.id}`, { text: 'Nachgetragen' });
    detail = (await api('GET', `api/werke/${w.id}`)).daten.werk;
    assert.equal(detail.storys[0].text, 'Nachgetragen');
    assert.equal(detail.storys[0].audio_id, audio.medium.id);
    await api('DELETE', `api/storys/${daten.id}`);
    assert.equal((await api('GET', `api/werke/${w.id}`)).daten.werk.storys.length, 0);
  } finally {
    await s.stopp();
  }
});

test('Filter, Suche, Alter, Seiten und Papierkorb (D-03, D-05, B-09)', async () => {
  const s = await starteTestServer();
  const api = erzeugeClient(s.basis);
  try {
    const mia = (await api('POST', 'api/kinder', { name: 'Mia', geburtsdatum: '2021-05-10' })).daten.kind;
    const werke = [];
    for (let i = 0; i < 5; i++) {
      const f = await foto(s, { rauschen: 10 + i });
      const daten = {
        medien: [f.id], kinder: i < 4 ? [mia.id] : [], art: i % 2 ? 'lego' : 'bild',
        datum: `202${4 + (i % 2)}-06-0${i + 1}`, favorit: i === 0, tags: i === 1 ? ['Dino'] : [],
        titel: i === 2 ? 'Regenbogen' : null,
      };
      werke.push((await api('POST', 'api/werke', daten)).daten.werk);
    }
    const liste = async (q) => (await api('GET', `api/werke?${q}`)).daten;
    assert.equal((await liste('')).gesamt, 5);
    assert.equal((await liste('')).werke[0].datum, '2025-06-04');
    assert.equal((await liste('art=lego')).gesamt, 2);
    assert.equal((await liste('favorit=1')).gesamt, 1);
    assert.equal((await liste('unvollstaendig=1')).gesamt, 1);
    assert.equal((await liste('tag=dino')).gesamt, 1);
    assert.equal((await liste('suche=regen')).gesamt, 1);
    assert.equal((await liste('suche=Din')).gesamt, 1);
    assert.equal((await liste(`kind=${mia.id}&alter=3`)).gesamt, 2);
    assert.equal((await liste(`kind=${mia.id}&alter=4`)).gesamt, 2);
    const seite1 = await liste('anzahl=2');
    assert.equal(seite1.werke.length, 2);
    assert.equal(seite1.mehr, true);
    assert.equal((await liste('anzahl=2&ab=4')).mehr, false);

    const loesch = await api('DELETE', `api/werke/${werke[0].id}`);
    assert.equal(loesch.daten.tage_im_papierkorb, 30);
    assert.equal((await liste('')).gesamt, 4);
    assert.equal((await liste('papierkorb=1')).gesamt, 1);
    await api('POST', `api/werke/${werke[0].id}/wiederherstellen`);
    assert.equal((await liste('')).gesamt, 5);
  } finally {
    await s.stopp();
  }
});

test('Vorschaubild: liefert WebP mit sharp, sonst das Original (B-04)', async () => {
  const s = await starteTestServer();
  try {
    const status = await (await fetch(`${s.basis}/api/status`)).json();
    const sharp = status.vorschaubilder ? (await import('sharp')).default : null;
    const inhalt = sharp
      ? await sharp({ create: { width: 1600, height: 1200, channels: 3, background: '#D28A74' } }).jpeg().toBuffer()
      : jpegMitExif();
    const m = (await (await fetch(`${s.basis}/api/medien`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: inhalt })).json()).medium;
    const r = await fetch(`${s.basis}/api/medien/${m.id}/vorschau?groesse=400`);
    assert.equal(r.status, 200);
    if (sharp) {
      assert.equal(r.headers.get('content-type'), 'image/webp');
      const info = await sharp(Buffer.from(await r.arrayBuffer())).metadata();
      assert.equal(info.width, 400);
      assert.equal(info.height, 300);
    } else {
      assert.equal(r.headers.get('content-type'), 'image/jpeg');
    }
  } finally {
    await s.stopp();
  }
});
