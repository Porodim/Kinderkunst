// Datenhaltung der Vorschau-Seite: alles nur im Speicher dieses Browserfensters.
// Gemeinsame Helfer für vorschau/server.js und vorschau/archiv.js.

export const BENUTZER = { id: 1, anzeigename: 'Vorschau', name: 'vorschau', kennung: 'vorschau' };

export const daten = { medien: [], kinder: [], werke: [], storys: [], tagNamen: new Map(), ids: { medium: 1, kind: 1, werk: 1, story: 1 } };

export function zuruecksetzen() {
  daten.medien.length = 0;
  daten.kinder.length = 0;
  daten.werke.length = 0;
  daten.storys.length = 0;
  daten.tagNamen.clear();
  Object.assign(daten.ids, { medium: 1, kind: 1, werk: 1, story: 1 });
}

export function fehler(status, meldung) {
  return Object.assign(new Error(meldung), { status });
}

export function jetzt() {
  return new Date().toISOString();
}

export function text(wert, max = 2000) {
  if (wert == null) return null;
  const t = String(wert).trim().slice(0, max);
  return t || null;
}

export function ganzzahl(wert) {
  const n = Number(wert);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function kopie(objekt) {
  return JSON.parse(JSON.stringify(objekt));
}
