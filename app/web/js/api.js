// Zugriff auf den Server. Alle Adressen sind relativ, damit die App unter dem Ingress-Pfad von HA läuft.
// In der Vorschau-Seite (ohne Server) übernimmt js/vorschau/server.js dieselben Aufgaben im Browser.

export const istVorschau = Boolean(globalThis.KINDERKUNST_VORSCHAU);
const vorschau = istVorschau ? await import('./vorschau/server.js') : null;

export async function holeJson(pfad) {
  if (vorschau) return vorschau.holeJson(pfad);
  const antwort = await fetch(pfad, { headers: { Accept: 'application/json' } });
  const daten = await antwort.json().catch(() => ({}));
  if (!antwort.ok) throw new Error(daten.fehler || `Fehler ${antwort.status}`);
  return daten;
}

// Adresse der Originaldatei eines Mediums (für <img> und <audio>).
export function dateiUrl(id) {
  return vorschau ? vorschau.dateiUrl(id) : `api/medien/${id}/datei`;
}

const TYP_NACH_ENDUNG = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };

function mitTyp(datei) {
  if (datei.type) return datei;
  const endung = (datei.name || '').split('.').pop().toLowerCase();
  const typ = TYP_NACH_ENDUNG[endung];
  return typ ? new File([datei], datei.name, { type: typ }) : datei;
}

// Lädt eine Datei unverändert hoch. beiFortschritt bekommt einen Wert zwischen 0 und 1.
export function ladeHoch(rohdatei, { art = 'werkfoto', dauerMs = null, beiFortschritt = () => {} } = {}) {
  const datei = mitTyp(rohdatei);
  if (vorschau) return vorschau.ladeHoch(datei, { art, dauerMs, beiFortschritt });
  return new Promise((erfuellt, abgelehnt) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `api/medien?art=${encodeURIComponent(art)}`);
    xhr.setRequestHeader('Content-Type', datei.type || 'application/octet-stream');
    xhr.setRequestHeader('X-Dateiname', encodeURIComponent(datei.name || ''));
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
