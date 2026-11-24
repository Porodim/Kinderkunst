// Nachbildung des Servers für die Vorschau-Seite (ohne Home Assistant, ohne Server).
// Gleiche Antworten wie app/server/routen/*.js, Daten nur im Speicher dieses Browserfensters.
// Wird nur geladen, wenn globalThis.KINDERKUNST_VORSCHAU gesetzt ist.
import { leseBildInfo } from '../exif.js';
import { istDatum } from '../alter.js';
import { BENUTZER, daten, fehler } from './speicher.js';
import * as archiv from './archiv.js';

export { zuruecksetzen } from './speicher.js';

const BILD = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/wav'];
const ARTEN = ['werkfoto', 'kindfoto', 'profilbild', 'audio', 'sonstiges'];
const MAX_BILD = 60 * 1024 * 1024;
const MAX_AUDIO = 25 * 1024 * 1024;
const adressen = new Map();

function mediumAusgabe({ blob, ...medium }) {
  return { ...medium };
}

async function sha256(blob) {
  const puffer = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function status() {
  const bytes = daten.medien.reduce((summe, m) => summe + m.groesse, 0);
  return {
    app: 'kinderkunst',
    version: 'Vorschau',
    kanal: 'vorschau',
    benutzer: { anzeigename: BENUTZER.anzeigename, name: BENUTZER.name, kennung: BENUTZER.kennung },
    alleBenutzer: [{ anzeigename: BENUTZER.anzeigename, name: BENUTZER.name, zuletzt_gesehen: new Date().toISOString() }],
    kopfzeilen: {},
    datenbank: { schema: 2, medien: { anzahl: daten.medien.length, bytes } },
    speicher: { frei: Math.max(0, 500 * 1024 * 1024 - bytes), gesamt: 500 * 1024 * 1024 },
    vorschaubilder: false,
  };
}

// Entspricht einer JSON-Anfrage an den Server: liefert die Antwort oder wirft einen Fehler mit .status.
export async function anfrage(methode, pfad, eingabe = {}) {
  const url = new URL(pfad, 'https://vorschau.invalid/');
  const p = url.pathname;
  const q = url.searchParams;
  let t;
  if (methode === 'GET' && p === '/api/status') return status();
  if (methode === 'GET' && p === '/api/medien') {
    const anzahl = Math.min(500, Math.max(1, Number(q.get('anzahl')) || 100));
    return { medien: [...daten.medien].reverse().slice(0, anzahl).map(mediumAusgabe) };
  }
  if (methode === 'GET' && (t = /^\/api\/medien\/(\d+)$/.exec(p))) {
    const medium = daten.medien.find((m) => m.id === Number(t[1]));
    if (!medium) throw fehler(404, 'Medium nicht gefunden');
    return { medium: mediumAusgabe(medium) };
  }
  if (methode === 'GET' && p === '/api/kinder') return archiv.kinderListe(q);
  if (methode === 'POST' && p === '/api/kinder') return archiv.kindAnlegen(eingabe);
  if (methode === 'PUT' && (t = /^\/api\/kinder\/(\d+)$/.exec(p))) return archiv.kindAendern(t[1], eingabe);
  if (methode === 'GET' && p === '/api/werke') return archiv.werkeListe(q);
  if (methode === 'POST' && p === '/api/werke') return archiv.werkAnlegen(eingabe, mediumAusgabe);
  if ((t = /^\/api\/werke\/(\d+)$/.exec(p))) {
    if (methode === 'GET') return archiv.werkDetail(t[1], { auchGeloescht: true }, mediumAusgabe);
    if (methode === 'PUT') return archiv.werkAendern(t[1], eingabe, mediumAusgabe);
    if (methode === 'DELETE') return archiv.werkLoeschen(t[1]);
  }
  if (methode === 'POST' && (t = /^\/api\/werke\/(\d+)\/wiederherstellen$/.exec(p))) return archiv.werkWiederherstellen(t[1], mediumAusgabe);
  if (methode === 'POST' && (t = /^\/api\/werke\/(\d+)\/storys$/.exec(p))) return archiv.storyAnlegen(t[1], eingabe);
  if ((t = /^\/api\/storys\/(\d+)$/.exec(p))) {
    if (methode === 'PUT') return archiv.storyAendern(t[1], eingabe);
    if (methode === 'DELETE') return archiv.storyLoeschen(t[1]);
  }
  if (methode === 'GET' && p === '/api/tags') return archiv.tagsListe();
  throw fehler(404, 'Unbekannte Adresse');
}

export async function holeJson(pfad) {
  return anfrage('GET', pfad);
}

export async function ladeHoch(datei, { art = 'werkfoto', dauerMs = null, dateiDatum = null, beiFortschritt = () => {} } = {}) {
  if (!ARTEN.includes(art)) throw fehler(400, `Unbekannte Art: ${art}`);
  const mime = (datei.type || '').split(';')[0].trim().toLowerCase();
  const istAudio = art === 'audio';
  if (!(istAudio ? AUDIO : BILD).includes(mime)) throw fehler(415, `Dateityp ${mime || 'unbekannt'} wird für „${art}“ nicht unterstützt`);
  const max = istAudio ? MAX_AUDIO : MAX_BILD;
  if (datei.size > max) throw fehler(413, `Datei ist größer als ${Math.round(max / 1048576)} MB`);
  if (!datei.size) throw fehler(400, 'Leere Datei');

  // Kurzer, sichtbarer Fortschritt wie beim echten Hochladen
  for (const anteil of [0.25, 0.5, 0.75, 1]) {
    beiFortschritt(anteil);
    await new Promise((r) => setTimeout(r, 40));
  }
  const hash = await sha256(datei);
  const vorhanden = daten.medien.find((m) => m.sha256 === hash);
  if (vorhanden) return { duplikat: true, medium: mediumAusgabe(vorhanden) };

  const info = istAudio ? {} : leseBildInfo(new Uint8Array(await datei.slice(0, 256 * 1024).arrayBuffer()));
  const medium = {
    id: daten.ids.medium++,
    art,
    mime,
    originalname: datei.name || null,
    groesse: datei.size,
    sha256: hash,
    breite: info.breite ?? null,
    hoehe: info.hoehe ?? null,
    dauer_ms: istAudio && Number.isFinite(dauerMs) ? Math.round(dauerMs) : null,
    aufgenommen_am: info.datum ?? null,
    datei_datum: istDatum(dateiDatum) ? dateiDatum : null,
    hochgeladen_am: new Date().toISOString(),
    hochgeladen_von: BENUTZER.anzeigename,
    blob: datei,
  };
  daten.medien.push(medium);
  return { duplikat: false, medium: mediumAusgabe(medium) };
}

export function dateiUrl(id) {
  if (!adressen.has(id)) {
    const medium = daten.medien.find((m) => m.id === Number(id));
    if (!medium) return '';
    adressen.set(id, URL.createObjectURL(medium.blob));
  }
  return adressen.get(id);
}
