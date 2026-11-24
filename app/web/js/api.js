// Zugriff auf den Server. Alle Adressen sind relativ, damit die App unter dem Ingress-Pfad von HA läuft.

export async function holeJson(pfad) {
  const antwort = await fetch(pfad, { headers: { Accept: 'application/json' } });
  const daten = await antwort.json().catch(() => ({}));
  if (!antwort.ok) throw new Error(daten.fehler || `Fehler ${antwort.status}`);
  return daten;
}

const TYP_NACH_ENDUNG = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };

function dateityp(datei) {
  if (datei.type) return datei.type;
  const endung = (datei.name || '').split('.').pop().toLowerCase();
  return TYP_NACH_ENDUNG[endung] || 'application/octet-stream';
}

// Lädt eine Datei unverändert hoch. beiFortschritt bekommt einen Wert zwischen 0 und 1.
export function ladeHoch(datei, { art = 'werkfoto', dauerMs = null, beiFortschritt = () => {} } = {}) {
  return new Promise((erfuellt, abgelehnt) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `api/medien?art=${encodeURIComponent(art)}`);
    xhr.setRequestHeader('Content-Type', dateityp(datei));
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
