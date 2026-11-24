// Startpunkt: Konfiguration lesen, App bauen, HTTP-Server starten, sauber beenden.
import http from 'node:http';
import { ladeKonfiguration } from './konfiguration.js';
import { erzeugeApp } from './app.js';

const konfiguration = ladeKonfiguration();
const { behandle, db } = erzeugeApp(konfiguration);
const server = http.createServer(behandle);
// Große Uploads über langsame Mobilverbindungen nicht abbrechen.
server.requestTimeout = 30 * 60 * 1000;

server.listen(konfiguration.port, konfiguration.host, () => {
  console.log(`Kinderkunst läuft auf http://${konfiguration.host}:${konfiguration.port} (Kanal ${konfiguration.kanal}, Daten in ${konfiguration.datenDir})`);
  if (!konfiguration.nurIngress && !konfiguration.devBenutzer) {
    console.log('Hinweis: Ohne DEV_BENUTZER braucht jede Anfrage die Kopfzeile X-Remote-User-Id.');
  }
});

function beenden() {
  console.log('Kinderkunst wird beendet …');
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', beenden);
process.on('SIGINT', beenden);
