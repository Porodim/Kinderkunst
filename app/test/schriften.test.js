// Prüft, dass jede in schriften.css verwendete Schriftdatei im installierten @fontsource-Paket existiert.
// Ohne installierte Pakete (z. B. offline) wird der Test übersprungen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAKETE = path.join(APP, 'node_modules', '@fontsource');

test('Schriftdateien aus schriften.css sind vorhanden', { skip: !fs.existsSync(PAKETE) && 'Schriftpakete nicht installiert' }, () => {
  const css = fs.readFileSync(path.join(APP, 'web', 'css', 'schriften.css'), 'utf8');
  const urls = [...css.matchAll(/url\(\.\.\/schriften\/([\w-]+)\/([\w.-]+)\)/g)];
  assert.ok(urls.length >= 8);
  for (const [, paket, datei] of urls) {
    assert.ok(fs.existsSync(path.join(PAKETE, paket, 'files', datei)), `${paket}/files/${datei} fehlt`);
  }
});
