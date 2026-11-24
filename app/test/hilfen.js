// Startet die App mit einem frischen Datenordner auf einem freien Port.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ladeKonfiguration } from '../server/konfiguration.js';
import { erzeugeApp } from '../server/app.js';

export async function starteTestServer(env = {}) {
  const datenDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kinderkunst-test-'));
  const konfiguration = ladeKonfiguration({ DATEN_DIR: datenDir, PORT: '0', HOST: '127.0.0.1', DEV_BENUTZER: 'Testperson', ...env });
  const app = erzeugeApp(konfiguration);
  const server = http.createServer(app.behandle);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const basis = `http://127.0.0.1:${server.address().port}`;
  return {
    basis,
    datenDir,
    async stopp() {
      await new Promise((r) => server.close(r));
      app.db.close();
      fs.rmSync(datenDir, { recursive: true, force: true });
    },
  };
}

// Kleinste gültige PNG-Datei (1×1 Pixel), selbst erzeugt, keine echten Daten.
export const MINI_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
