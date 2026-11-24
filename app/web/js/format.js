// Kleine Helfer für Anzeige und sicheres HTML.

export function esc(wert) {
  return String(wert ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]);
}

export function bytes(anzahl) {
  if (!Number.isFinite(anzahl)) return '–';
  const einheiten = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let wert = anzahl;
  while (wert >= 1024 && i < einheiten.length - 1) {
    wert /= 1024;
    i++;
  }
  return `${wert.toLocaleString('de-DE', { maximumFractionDigits: i ? 1 : 0 })} ${einheiten[i]}`;
}

export function dauer(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function zeitpunkt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
