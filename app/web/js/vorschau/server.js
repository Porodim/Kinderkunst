// Nachbildung des Servers für die Vorschau-Seite (ohne Home Assistant, ohne Server).
// Gleiche Antworten wie app/server/routen/*.js, Daten nur im Speicher dieses Browserfensters.
// Wird nur geladen, wenn globalThis.KINDERKUNST_VORSCHAU gesetzt ist.

const BILD = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/wav'];
const ARTEN = ['werkfoto', 'kindfoto', 'profilbild', 'audio', 'sonstiges'];
const MAX_BILD = 60 * 1024 * 1024;
const MAX_AUDIO = 25 * 1024 * 1024;
const BENUTZER = { anzeigename: 'Vorschau', name: 'vorschau', kennung: 'vorschau' };

const medien = [];
const adressen = new Map();
let naechsteId = 1;

function oeffentlich({ blob, ...medium }) {
  return { ...medium };
}

async function sha256(blob) {
  const puffer = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function status() {
  const bytes = medien.reduce((summe, m) => summe + m.groesse, 0);
  return {
    app: 'kinderkunst',
    version: 'Vorschau',
    kanal: 'vorschau',
    benutzer: BENUTZER,
    alleBenutzer: [{ anzeigename: BENUTZER.anzeigename, name: BENUTZER.name, zuletzt_gesehen: new Date().toISOString() }],
    kopfzeilen: {},
    datenbank: { schema: 1, medien: { anzahl: medien.length, bytes } },
    speicher: { frei: Math.max(0, 500 * 1024 * 1024 - bytes), gesamt: 500 * 1024 * 1024 },
  };
}

export async function holeJson(pfad) {
  const url = new URL(pfad, 'https://vorschau.invalid/');
  if (url.pathname === '/api/status') return status();
  if (url.pathname === '/api/medien') {
    const anzahl = Math.min(500, Math.max(1, Number(url.searchParams.get('anzahl')) || 100));
    return { medien: [...medien].reverse().slice(0, anzahl).map(oeffentlich) };
  }
  const einzeln = /^\/api\/medien\/(\d+)$/.exec(url.pathname);
  if (einzeln) {
    const medium = medien.find((m) => m.id === Number(einzeln[1]));
    if (!medium) throw new Error('Medium nicht gefunden');
    return { medium: oeffentlich(medium) };
  }
  throw new Error('Unbekannte Adresse');
}

export async function ladeHoch(datei, { art = 'werkfoto', dauerMs = null, beiFortschritt = () => {} } = {}) {
  if (!ARTEN.includes(art)) throw new Error(`Unbekannte Art: ${art}`);
  const mime = (datei.type || '').split(';')[0].trim().toLowerCase();
  const istAudio = art === 'audio';
  if (!(istAudio ? AUDIO : BILD).includes(mime)) throw new Error(`Dateityp ${mime || 'unbekannt'} wird für „${art}“ nicht unterstützt`);
  const max = istAudio ? MAX_AUDIO : MAX_BILD;
  if (datei.size > max) throw new Error(`Datei ist größer als ${Math.round(max / 1048576)} MB`);
  if (!datei.size) throw new Error('Leere Datei');

  // Kurzer, sichtbarer Fortschritt wie beim echten Hochladen
  for (const anteil of [0.25, 0.5, 0.75, 1]) {
    beiFortschritt(anteil);
    await new Promise((r) => setTimeout(r, 60));
  }
  const hash = await sha256(datei);
  const vorhanden = medien.find((m) => m.sha256 === hash);
  if (vorhanden) return { duplikat: true, medium: oeffentlich(vorhanden) };

  const medium = {
    id: naechsteId++,
    art,
    mime,
    originalname: datei.name || null,
    groesse: datei.size,
    sha256: hash,
    breite: null,
    hoehe: null,
    dauer_ms: istAudio && Number.isFinite(dauerMs) ? Math.round(dauerMs) : null,
    aufgenommen_am: null,
    hochgeladen_am: new Date().toISOString(),
    hochgeladen_von: BENUTZER.anzeigename,
    blob: datei,
  };
  medien.push(medium);
  return { duplikat: false, medium: oeffentlich(medium) };
}

export function dateiUrl(id) {
  if (!adressen.has(id)) {
    const medium = medien.find((m) => m.id === Number(id));
    if (!medium) return '';
    adressen.set(id, URL.createObjectURL(medium.blob));
  }
  return adressen.get(id);
}
