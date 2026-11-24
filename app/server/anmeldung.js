// Anmeldung hinter einer Schnittstelle (V-02). Heute: Home-Assistant-Ingress (R-03).
// Der Supervisor schickt den angemeldeten HA-Benutzer in Kopfzeilen mit. Welche genau ankommen,
// zeigt die Technik-Test-Seite an (ARCHITEKTUR A2: prüfen, nicht annehmen).
import { HttpFehler } from './antworten.js';

// Der HA-Supervisor erreicht Add-ons immer von dieser Adresse aus.
const SUPERVISOR_IP = '172.30.32.2';

export const INGRESS_KOPFZEILEN = ['x-remote-user-id', 'x-remote-user-name', 'x-remote-user-display-name', 'x-ingress-path'];

// Node liest Kopfzeilen als Latin-1. Kommen UTF-8-Bytes (z. B. Umlaute im Anzeigenamen), hier zurückwandeln.
function utf8(wert) {
  if (!wert) return '';
  const umgewandelt = Buffer.from(wert, 'latin1').toString('utf8');
  return umgewandelt.includes('�') ? wert : umgewandelt;
}

export function vomSupervisor(req) {
  const adresse = req.socket.remoteAddress || '';
  return adresse === SUPERVISOR_IP || adresse === `::ffff:${SUPERVISOR_IP}`;
}

export function ingressKopfzeilen(req) {
  const ergebnis = {};
  for (const name of INGRESS_KOPFZEILEN) if (req.headers[name]) ergebnis[name] = utf8(req.headers[name]);
  return ergebnis;
}

export function erzeugeAnmeldung(db, konfiguration) {
  const speichern = db.prepare(`
    INSERT INTO benutzer (familie_id, kennung, name, anzeigename, zuletzt_gesehen)
    VALUES (1, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT (kennung) DO UPDATE SET
      name = excluded.name, anzeigename = excluded.anzeigename, zuletzt_gesehen = excluded.zuletzt_gesehen
    RETURNING id, familie_id, kennung, name, anzeigename`);
  const zwischenspeicher = new Map(); // kennung -> { benutzer, zeit }

  // Liefert den angemeldeten Benutzer oder wirft 401/403.
  return function benutzerVon(req) {
    if (konfiguration.nurIngress && !vomSupervisor(req)) {
      throw new HttpFehler(403, 'Nur über Home Assistant erreichbar');
    }
    const k = ingressKopfzeilen(req);
    let daten = k['x-remote-user-id']
      ? { kennung: k['x-remote-user-id'], name: k['x-remote-user-name'] || '', anzeigename: k['x-remote-user-display-name'] || '' }
      : null;
    if (!daten && !konfiguration.nurIngress && konfiguration.devBenutzer) {
      const n = konfiguration.devBenutzer;
      daten = { kennung: `dev:${n}`, name: n, anzeigename: n };
    }
    if (!daten) throw new HttpFehler(401, 'Nicht angemeldet');

    const gemerkt = zwischenspeicher.get(daten.kennung);
    if (gemerkt && Date.now() - gemerkt.zeit < 60_000 && gemerkt.benutzer.anzeigename === daten.anzeigename) {
      return gemerkt.benutzer;
    }
    const benutzer = { ...speichern.get(daten.kennung, daten.name, daten.anzeigename) };
    zwischenspeicher.set(daten.kennung, { benutzer, zeit: Date.now() });
    return benutzer;
  };
}
