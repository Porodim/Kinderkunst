// Baut die Anwendung zusammen und liefert den Request-Handler. Getrennt von start.js, damit Tests
// die App mit eigener Konfiguration starten können.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { oeffneDatenbank } from './datenbank.js';
import { erzeugeAblage } from './ablage.js';
import { erzeugeAnmeldung } from './anmeldung.js';
import { erzeugeRouter } from './router.js';
import { HttpFehler, sendeFehler } from './antworten.js';
import { liefereStatisch } from './statisch.js';
import { registriereStatus } from './routen/status.js';
import { registriereMedien } from './routen/medien.js';

const PAKET = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'));

export function erzeugeApp(konfiguration) {
  fs.mkdirSync(konfiguration.datenDir, { recursive: true });
  const db = oeffneDatenbank(path.join(konfiguration.datenDir, 'kinderkunst.sqlite'));
  const ablage = erzeugeAblage(konfiguration.datenDir);
  const benutzerVon = erzeugeAnmeldung(db, konfiguration);
  const router = erzeugeRouter();
  const kontext = { db, ablage, konfiguration, version: PAKET.version };
  registriereStatus(router, kontext);
  registriereMedien(router, kontext);

  async function behandle(req, res) {
    try {
      const url = new URL(req.url, 'http://lokal');
      if (url.pathname.startsWith('/api/')) {
        const treffer = router.finde(req.method, url.pathname);
        if (!treffer) throw new HttpFehler(404, 'Unbekannte Adresse');
        if (treffer.nichtErlaubt) throw new HttpFehler(405, 'Methode nicht erlaubt');
        const benutzer = benutzerVon(req);
        await treffer.handler(req, res, { benutzer, params: treffer.params, query: url.searchParams });
        return;
      }
      // Auch die Oberfläche nur über Ingress (bzw. lokal) ausliefern.
      benutzerVon(req);
      if (!liefereStatisch(req, res, url.pathname)) throw new HttpFehler(404, 'Nicht gefunden');
    } catch (fehler) {
      sendeFehler(res, fehler);
    }
  }

  return { behandle, db };
}
