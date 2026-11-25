// Gemeinsamer Speicher des Kinderkunst-Ateliers (routen/atelier.js) und Auslieferung der App.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starteTestServer, erzeugeClient } from './hilfen.js';

const ZUSTAND = { kids: [{ id: 'k1', name: 'Mia', bd: '2021-05-10' }], photos: [], pages: [] };

test('Atelier: laden, speichern, Konflikt erkennen, Sicherung', async () => {
  const s = await starteTestServer();
  const api = erzeugeClient(s.basis);
  try {
    const leer = await api('GET', 'api/atelier');
    assert.deepEqual([leer.daten.revision, leer.daten.zustand], [0, null]);
    assert.equal((await api('PUT', 'api/atelier', { revision: 0, zustand: { kids: [] } })).status, 400);

    const erst = await api('PUT', 'api/atelier', { revision: 0, zustand: ZUSTAND });
    assert.deepEqual(erst, { status: 200, daten: { revision: 1 } });
    const geladen = (await api('GET', 'api/atelier')).daten;
    assert.equal(geladen.revision, 1);
    assert.deepEqual(geladen.zustand, ZUSTAND);
    assert.equal(geladen.geaendert_von, 'Testperson');

    // Zweites Gerät mit veraltetem Stand: 409 und der aktuelle Stand kommt zurück
    const konflikt = await api('PUT', 'api/atelier', { revision: 0, zustand: { kids: [], photos: [], pages: [] } });
    assert.equal(konflikt.status, 409);
    assert.equal(konflikt.daten.revision, 1);
    assert.deepEqual(konflikt.daten.zustand, ZUSTAND);

    const neu = { ...ZUSTAND, pages: [{ id: 'p1', kid: 'k1', s: [] }] };
    assert.equal((await api('PUT', 'api/atelier', { revision: 1, zustand: neu })).daten.revision, 2);
    const { sicherungen } = (await api('GET', 'api/atelier/sicherungen')).daten;
    assert.equal(sicherungen.length, 1);
    assert.equal(sicherungen[0].revision, 1);
    const kopie = await fetch(`${s.basis}/api/atelier/sicherungen/${sicherungen[0].id}`);
    assert.deepEqual(await kopie.json(), ZUSTAND);
  } finally {
    await s.stopp();
  }
});

test('Atelier ist die Startseite, Technik-Test unter /technik', async () => {
  const s = await starteTestServer();
  try {
    const start = await (await fetch(`${s.basis}/`)).text();
    assert.match(start, /<script src="speicher.js"><\/script>/);
    assert.match(start, /Speicher\.original\(p,f\)/);
    assert.equal((await fetch(`${s.basis}/speicher.js`)).status, 200);
    assert.equal((await fetch(`${s.basis}/fotodatum.js`)).status, 200);
    const aq = await (await fetch(`${s.basis}/aquarell.js`)).text();
    assert.match(aq, /var AQ=\{"winter"/);
    assert.match(aq, /var FAM=\["data:image\/webp/);
    assert.match(start, /data-t="gal">Kunstwerke</);
    assert.match(await (await fetch(`${s.basis}/technik`)).text(), /js\/app\.js/);
    assert.equal((await fetch(`${s.basis}/js/app.js`)).status, 200);
  } finally {
    await s.stopp();
  }
});

test('Atelier: Aufnahmedatum aus dem Foto (fotodatum.js)', async () => {
  const vm = await import('node:vm');
  const fs = await import('node:fs');
  const { jpegMitExif, MINI_PNG } = await import('./hilfen.js');
  const kontext = {};
  vm.runInNewContext(fs.readFileSync(new URL('../atelier/fotodatum.js', import.meta.url), 'utf8'), kontext);
  const { Fotodatum } = kontext;
  assert.equal(Fotodatum.ausBytes(jpegMitExif({ datum: '2024:03:14 09:30:00' })), '2024-03-14');
  assert.equal(Fotodatum.ausBytes(jpegMitExif({ datum: '0000:00:00 00:00:00' })), null);
  assert.equal(Fotodatum.ausBytes(MINI_PNG), null);
  assert.equal(Fotodatum.ausBytes(new Uint8Array([0xff, 0xd8, 0xff])), null);
  assert.equal(await Fotodatum.lesen(new Blob([jpegMitExif({ datum: '2023:12:24 18:00:00' })])), '2023-12-24');
});
