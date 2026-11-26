// Zugriff auf den Server. Alle Adressen sind relativ, damit die App unter dem Ingress-Pfad von HA läuft.
// In der Vorschau-Seite (ohne Server) übernimmt js/vorschau/server.js dieselben Aufgaben im Browser.
import { istDatum } from './alter.js';

export const istVorschau = Boolean(globalThis.KINDERKUNST_VORSCHAU);
const vorschau = istVorschau ? await import('./vorschau/server.js') : null;

// JSON-Anfrage; wirft bei Fehlern einen Error mit der Meldung des Servers.
export async function anfrage(methode, pfad, daten) {
  if (vorschau) return vorschau.anfrage(methode, pfad, daten);
  const antwort = await fetch(pfad, {
    method: methode,
    headers: { Accept: 'application/json', ...(daten ? { 'Content-Type': 'application/json' } : {}) },
    body: daten ? JSON.stringify(daten) : undefined,
  });
  const ergebnis = await antwort.json().catch(() => ({}));
  if (!antwort.ok) throw Object.assign(new Error(ergebnis.fehler || `Fehler ${antwort.status}`), { status: antwort.status });
  return ergebnis;
}

export function holeJson(pfad) {
  return anfrage('GET', pfad);
}

// Adresse der Originaldatei eines Mediums (für <audio> und den Download).
export function dateiUrl(id) {
  return vorschau ? vorschau.dateiUrl(id) : `api/medien/${id}/datei`;
}

// Vorschaubild (400 px fürs Raster, 2000 px fürs Vollbild). In der Vorschau-Seite: das Original.
export function vorschauUrl(id, groesse = 400) {
  return vorschau ? vorschau.dateiUrl(id) : `api/medien/${id}/vorschau?groesse=${groesse}`;
}

const TYP_NACH_ENDUNG = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };

function mitTyp(datei) {
  if (datei.type) return datei;
  const endung = (datei.name || '').split('.').pop().toLowerCase();
  const typ = TYP_NACH_ENDUNG[endung];
  return typ ? new File([datei], datei.name, { type: typ, lastModified: datei.lastModified }) : datei;
}

function dateiDatumVon(datei) {
  if (!datei.lastModified) return null;
  const d = new Date(datei.lastModified);
  const text = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return istDatum(text) ? text : null;
}

// Lädt eine Datei unverändert hoch. beiFortschritt bekommt einen Wert zwischen 0 und 1.
export function ladeHoch(rohdatei, { art = 'werkfoto', dauerMs = null, beiFortschritt = () => {} } = {}) {
  const datei = mitTyp(rohdatei);
  const dateiDatum = dateiDatumVon(datei);
  if (vorschau) return vorschau.ladeHoch(datei, { art, dauerMs, dateiDatum, beiFortschritt });
  return new Promise((erfuellt, abgelehnt) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `api/medien?art=${encodeURIComponent(art)}`);
    xhr.setRequestHeader('Content-Type', datei.type || 'application/octet-stream');
    xhr.setRequestHeader('X-Dateiname', encodeURIComponent(datei.name || ''));
    if (dateiDatum) xhr.setRequestHeader('X-Datei-Datum', dateiDatum);
    if (dauerMs != null) xhr.setRequestHeader('X-Dauer-Ms', String(Math.round(dauerMs)));
    xhr.upload.onprogress = (e) => e.lengthComputable && beiFortschritt(e.loaded / e.total);
    xhr.onload = () => {
      let daten = {};
      try {
        daten = JSON.parse(xhr.responseText);
      } catch {
        /* keine JSON-Antwort, z. B. von einem Proxy */
      }
      if (xhr.status >= 200 && xhr.status < 300) erfuellt(daten);
      else abgelehnt(new Error(daten.fehler || `Fehler ${xhr.status}${xhr.status === 413 ? ' (zu groß für die Verbindung)' : ''}`));
    };
    xhr.onerror = () => abgelehnt(new Error('Verbindung abgebrochen'));
    xhr.send(datei);
  });
}

// Kinderliste, kurz zwischengespeichert, weil fast jede Ansicht sie braucht.
let kinderCache = null;
export async function ladeKinder({ neu = false } = {}) {
  if (!kinderCache || neu) kinderCache = anfrage('GET', 'api/kinder').then((d) => d.kinder);
  try {
    return await kinderCache;
  } catch (f) {
    kinderCache = null;
    throw f;
  }
}
export function vergissKinder() {
  kinderCache = null;
}
