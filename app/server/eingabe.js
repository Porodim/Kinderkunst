// Liest und prüft JSON-Eingaben aus dem Anfragekörper.
import { HttpFehler } from './antworten.js';

export async function leseJson(req, maxBytes = 256 * 1024) {
  let text = '';
  for await (const teil of req) {
    text += teil;
    if (text.length > maxBytes) throw new HttpFehler(413, 'Anfrage zu groß');
  }
  if (!text.trim()) return {};
  try {
    const daten = JSON.parse(text);
    if (!daten || typeof daten !== 'object' || Array.isArray(daten)) throw new Error();
    return daten;
  } catch {
    throw new HttpFehler(400, 'Ungültige Eingabe');
  }
}

// Kürzt und leert Text: "" und reine Leerzeichen werden zu null.
export function text(wert, maxLaenge = 2000) {
  if (wert == null) return null;
  const t = String(wert).trim().slice(0, maxLaenge);
  return t || null;
}

export function ganzzahl(wert) {
  const n = Number(wert);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function jetzt() {
  return new Date().toISOString();
}

// "?,?,?" für IN-Abfragen
export function platzhalter(liste) {
  return liste.map(() => '?').join(',');
}
