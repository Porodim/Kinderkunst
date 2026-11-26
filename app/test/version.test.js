// Versionen mit Datumsstempel: beide Add-ons und der Server tragen dieselbe Version,
// und für jede Version gibt es Release-Notizen, die Home Assistant anzeigt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { datumsVersion } from '../../werkzeuge/version-setzen.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lies = (pfad) => readFileSync(join(WURZEL, pfad), 'utf8');
const FORM = /^\d{4}\.\d{2}\.\d{2}\.\d{4}$/;

test('Datumsversion in deutscher Zeit', () => {
  assert.equal(datumsVersion(new Date('2026-11-26T06:52:00Z')), '2026.11.26.0752');
  assert.equal(datumsVersion(new Date('2026-07-01T22:05:00Z')), '2026.07.02.0005');
});

test('Add-ons und Server haben dieselbe Version mit Release-Notizen', () => {
  const paket = JSON.parse(lies('app/package.json')).version;
  assert.match(paket, FORM);
  for (const addon of ['kinderkunst', 'kinderkunst-test']) {
    const version = lies(`${addon}/config.yaml`).match(/^version: "(.*)"$/m)[1];
    assert.equal(version, paket, `${addon}/config.yaml`);
    const erste = lies(`${addon}/CHANGELOG.md`).match(/^## (.+)$/m);
    assert.ok(erste, `${addon}/CHANGELOG.md ohne Eintrag`);
    assert.equal(erste[1].trim(), version, `${addon}/CHANGELOG.md beginnt nicht mit der aktuellen Version`);
  }
});
