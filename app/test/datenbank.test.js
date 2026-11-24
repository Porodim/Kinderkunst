import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oeffneDatenbank, migriere, schemaVersion } from '../server/datenbank.js';

test('Migrationen laufen und sind wiederholbar', () => {
  const db = oeffneDatenbank(':memory:');
  assert.equal(schemaVersion(db), 2);
  assert.equal(migriere(db), 2);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM familie').get().n, 1);
  db.close();
});

test('Medium: gleicher Hash pro Familie nur einmal (B-06)', () => {
  const db = oeffneDatenbank(':memory:');
  const rein = db.prepare(
    "INSERT INTO medium (familie_id, art, mime, datei, groesse, sha256) VALUES (1, 'werkfoto', 'image/png', 'x.png', 1, 'abc')",
  );
  rein.run();
  assert.throws(() => rein.run(), /UNIQUE/);
  db.close();
});

test('Medium: unbekannte Art wird abgelehnt', () => {
  const db = oeffneDatenbank(':memory:');
  assert.throws(
    () => db.prepare("INSERT INTO medium (familie_id, art, mime, datei, groesse, sha256) VALUES (1, 'quatsch', 'x', 'x', 1, 'a')").run(),
    /CHECK/,
  );
  db.close();
});
