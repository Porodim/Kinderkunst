// Die Vorschau-Nachbildung (web/js/vorschau/server.js) soll sich wie der echte Server verhalten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MINI_PNG } from './hilfen.js';

const vorschau = await import('../web/js/vorschau/server.js');

test('Vorschau: Hochladen, Duplikat, Liste, Status', async () => {
  const datei = new File([MINI_PNG], 'Bild.png', { type: 'image/png' });
  const erst = await vorschau.ladeHoch(datei);
  assert.equal(erst.duplikat, false);
  assert.equal(erst.medium.originalname, 'Bild.png');
  assert.equal(erst.medium.blob, undefined);
  assert.equal((await vorschau.ladeHoch(datei)).duplikat, true);

  const { medien } = await vorschau.holeJson('api/medien?anzahl=30');
  assert.equal(medien.length, 1);
  const status = await vorschau.holeJson('api/status');
  assert.equal(status.kanal, 'vorschau');
  assert.equal(status.datenbank.medien.anzahl, 1);
  assert.match(vorschau.dateiUrl(erst.medium.id), /^blob:/);
});

test('Vorschau: falscher Typ wird wie auf dem Server abgelehnt', async () => {
  await assert.rejects(vorschau.ladeHoch(new File(['x'], 'a.txt', { type: 'text/plain' })), /nicht unterstützt/);
  await assert.rejects(vorschau.ladeHoch(new File(['x'], 'a.webm', { type: 'audio/webm' }), { art: 'werkfoto' }), /nicht unterstützt/);
  const audio = await vorschau.ladeHoch(new File(['erfunden'], 'a.webm', { type: 'audio/webm;codecs=opus' }), { art: 'audio', dauerMs: 4200 });
  assert.equal(audio.medium.mime, 'audio/webm');
  assert.equal(audio.medium.dauer_ms, 4200);
});
