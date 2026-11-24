// Gemeinsame Helfer für HTTP-Antworten und Fehler.

export class HttpFehler extends Error {
  constructor(status, meldung) {
    super(meldung);
    this.status = status;
  }
}

export function sendeJson(res, status, daten) {
  const text = JSON.stringify(daten);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

export function sendeFehler(res, fehler) {
  const status = fehler instanceof HttpFehler ? fehler.status : 500;
  const meldung = fehler instanceof HttpFehler ? fehler.message : 'Interner Fehler';
  if (status === 500) console.error(fehler);
  if (res.headersSent) {
    res.destroy();
    return;
  }
  sendeJson(res, status, { fehler: meldung });
}
