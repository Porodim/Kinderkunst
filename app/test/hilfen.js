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
      app.beenden();
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

// Minimales JPEG mit EXIF (Aufnahmedatum, Ausrichtung) und Größenangabe. Nicht dekodierbar, aber für den
// EXIF-Leser ausreichend. Selbst erzeugt, keine echten Daten.
export function jpegMitExif({ datum = '2025:06:01 10:00:00', ausrichtung = 1, breite = 4000, hoehe = 3000, rauschen = 0 } = {}) {
  const tiff = Buffer.alloc(8 + 2 + 2 * 12 + 4 + 2 + 12 + 4 + 20);
  tiff.write('II', 0, 'latin1');
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  let o = 8;
  tiff.writeUInt16LE(2, o); o += 2;
  tiff.writeUInt16LE(0x0112, o); tiff.writeUInt16LE(3, o + 2); tiff.writeUInt32LE(1, o + 4); tiff.writeUInt16LE(ausrichtung, o + 8); o += 12;
  const exifIfd = 8 + 2 + 24 + 4;
  tiff.writeUInt16LE(0x8769, o); tiff.writeUInt16LE(4, o + 2); tiff.writeUInt32LE(1, o + 4); tiff.writeUInt32LE(exifIfd, o + 8); o += 12;
  tiff.writeUInt32LE(0, o); o += 4;
  tiff.writeUInt16LE(1, o); o += 2;
  const datumStelle = exifIfd + 2 + 12 + 4;
  tiff.writeUInt16LE(0x9003, o); tiff.writeUInt16LE(2, o + 2); tiff.writeUInt32LE(20, o + 4); tiff.writeUInt32LE(datumStelle, o + 8); o += 12;
  tiff.writeUInt32LE(0, o); o += 4;
  tiff.write(`${datum}\0`, datumStelle, 'latin1');
  const app1 = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const app1Kopf = Buffer.from([0xff, 0xe1, 0, 0]);
  app1Kopf.writeUInt16BE(app1.length + 2, 2);
  const sof = Buffer.from([0xff, 0xc0, 0, 11, 8, 0, 0, 0, 0, 1, 1, 0x11, 0]);
  sof.writeUInt16BE(hoehe, 5);
  sof.writeUInt16BE(breite, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app1Kopf, app1, sof, Buffer.from([rauschen & 0xff, 0xff, 0xd9])]);
}

// Kleine JSON-Hilfe für Tests gegen den Server.
export function erzeugeClient(basis) {
  return async function anfrage(methode, pfad, daten) {
    const r = await fetch(`${basis}/${pfad}`, {
      method: methode,
      headers: daten ? { 'Content-Type': 'application/json' } : {},
      body: daten ? JSON.stringify(daten) : undefined,
    });
    return { status: r.status, daten: await r.json() };
  };
}
