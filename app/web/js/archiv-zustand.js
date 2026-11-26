// Gemeinsamer Zustand der Archiv-Galerie: aktuelle Filter und geladene Werke.
// Die Vollbild-Ansicht blättert damit zum vorherigen und nächsten Werk (D-02),
// und beim Zurückkehren bleiben Filter und Position erhalten.
import { anfrage } from './api.js';

export const zustand = {
  filter: { kind: null, art: null, tag: null, favorit: false, unvollstaendig: false, papierkorb: false, suche: '', alter: null },
  werke: [],
  gesamt: 0,
  mehr: false,
  scrollY: 0,
  geladenFuer: null,
};

export function abfrage(filter = zustand.filter) {
  const q = new URLSearchParams();
  for (const [name, wert] of Object.entries(filter)) {
    if (wert === null || wert === false || wert === '') continue;
    q.set(name, wert === true ? '1' : String(wert));
  }
  return q.toString();
}

// Lädt die erste Seite neu (neu = true) oder hängt die nächste an.
export async function ladeWerke({ neu = false, anzahl = 60 } = {}) {
  const q = abfrage();
  if (neu || zustand.geladenFuer !== q) {
    zustand.werke = [];
    zustand.geladenFuer = q;
  }
  const antwort = await anfrage('GET', `api/werke?${q}${q ? '&' : ''}ab=${zustand.werke.length}&anzahl=${anzahl}`);
  if (zustand.geladenFuer !== q) return zustand;
  zustand.werke.push(...antwort.werke);
  zustand.gesamt = antwort.gesamt;
  zustand.mehr = antwort.mehr;
  return zustand;
}

// Nachbar-Werk in der aktuellen Liste (richtung -1 oder +1); lädt bei Bedarf nach.
export async function nachbar(werkId, richtung) {
  let i = zustand.werke.findIndex((w) => w.id === werkId);
  if (i < 0) return null;
  if (richtung > 0 && i === zustand.werke.length - 1 && zustand.mehr) {
    await ladeWerke();
    i = zustand.werke.findIndex((w) => w.id === werkId);
  }
  return zustand.werke[i + richtung] || null;
}
