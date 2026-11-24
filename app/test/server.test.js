import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { starteTestServer, MINI_PNG } from './hilfen.js';

async function hochladen(basis, inhalt, typ = 'image/png', art = 'werkfoto', kopf = {}) {
  return fetch(`${basis}/api/medien?art=${art}`, {
    method: 'POST',
    headers: { 'Content-Type': typ, 'X-Dateiname': encodeURIComponent('Bild Ä.png'), ...kopf },
    body: inhalt,
  });
}

test('Status liefert Benutzer, Version und Speicher', async () => {
  const s = await starteTestServer();
  try {
    const r = await fetch(`${s.basis}/api/status`);
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.benutzer.anzeigename, 'Testperson');
    assert.equal(j.datenbank.schema, 2);
    assert.ok(j.speicher.frei > 0);
  } finally {
    await s.stopp();
  }
});

test('Ingress-Kopfzeilen legen den Benutzer an, Umlaute bleiben erhalten', async () => {
  const s = await starteTestServer({ DEV_BENUTZER: '' });
  try {
    const ohne = await fetch(`${s.basis}/api/status`);
    assert.equal(ohne.status, 401);
    // HA schickt UTF-8-Bytes; fetch erlaubt nur Latin-1, daher hier vorab umkodiert.
    const anzeigename = Buffer.from('Jürgen Test', 'utf8').toString('latin1');
    const r = await fetch(`${s.basis}/api/status`, {
      headers: { 'X-Remote-User-Id': 'abc123', 'X-Remote-User-Name': 'juergen', 'X-Remote-User-Display-Name': anzeigename },
    });
    const j = await r.json();
    assert.equal(j.benutzer.anzeigename, 'Jürgen Test');
    assert.equal(j.kopfzeilen['x-remote-user-id'], 'abc123');
  } finally {
    await s.stopp();
  }
});

test('Nur-Ingress-Modus weist direkte Zugriffe ab', async () => {
  const s = await starteTestServer({ NUR_INGRESS: '1' });
  try {
    assert.equal((await fetch(`${s.basis}/api/status`, { headers: { 'X-Remote-User-Id': 'x' } })).status, 403);
    assert.equal((await fetch(`${s.basis}/`)).status, 403);
  } finally {
    await s.stopp();
  }
});

test('Hochladen speichert das Original unverändert, Duplikat wird erkannt (B-01, B-02, B-06)', async () => {
  const s = await starteTestServer();
  try {
    const r1 = await hochladen(s.basis, MINI_PNG);
    assert.equal(r1.status, 201);
    const { medium, duplikat } = await r1.json();
    assert.equal(duplikat, false);
    assert.equal(medium.originalname, 'Bild Ä.png');
    assert.equal(medium.hochgeladen_von, 'Testperson');

    const datei = path.join(s.datenDir, 'originale', medium.sha256.slice(0, 2), `${medium.sha256}.png`);
    assert.deepEqual(fs.readFileSync(datei), MINI_PNG);

    const r2 = await hochladen(s.basis, MINI_PNG);
    assert.equal(r2.status, 200);
    assert.equal((await r2.json()).duplikat, true);

    const liste = await (await fetch(`${s.basis}/api/medien`)).json();
    assert.equal(liste.medien.length, 1);

    const original = await fetch(`${s.basis}/api/medien/${medium.id}/datei`);
    assert.equal(original.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await original.arrayBuffer()), MINI_PNG);

    const teil = await fetch(`${s.basis}/api/medien/${medium.id}/datei`, { headers: { Range: 'bytes=0-9' } });
    assert.equal(teil.status, 206);
    assert.equal((await teil.arrayBuffer()).byteLength, 10);
  } finally {
    await s.stopp();
  }
});

test('Audio wird mit Dauer gespeichert (B-11)', async () => {
  const s = await starteTestServer();
  try {
    const r = await hochladen(s.basis, Buffer.from('erfundene Testdaten'), 'audio/webm;codecs=opus', 'audio', { 'X-Dauer-Ms': '4200' });
    assert.equal(r.status, 201);
    const { medium } = await r.json();
    assert.equal(medium.mime, 'audio/webm');
    assert.equal(medium.dauer_ms, 4200);
  } finally {
    await s.stopp();
  }
});

test('Falscher Typ und zu große Datei werden abgelehnt', async () => {
  const s = await starteTestServer({ MAX_BILD_MB: '0.0001' });
  try {
    assert.equal((await hochladen(s.basis, Buffer.from('x'), 'text/plain')).status, 415);
    assert.equal((await hochladen(s.basis, Buffer.from('x'), 'audio/webm', 'werkfoto')).status, 415);
    assert.equal((await hochladen(s.basis, Buffer.alloc(500))).status, 413);
    assert.equal(fs.readdirSync(path.join(s.datenDir, 'tmp')).length, 0);
  } finally {
    await s.stopp();
  }
});

test('Oberfläche wird ausgeliefert, Pfade außerhalb nicht', async () => {
  const s = await starteTestServer();
  try {
    const r = await fetch(`${s.basis}/`);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /Kinderkunst/);
    assert.equal((await fetch(`${s.basis}/../server/app.js`)).status, 404);
    assert.equal((await fetch(`${s.basis}/%2e%2e/server/app.js`)).status, 404);
  } finally {
    await s.stopp();
  }
});
