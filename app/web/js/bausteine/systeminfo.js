// Frühtest 3 und 4: Wer ist angemeldet, welche Ingress-Kopfzeilen kommen an, wie voll ist der Speicher.
import { holeJson } from '../api.js';
import { bytes, esc, zeitpunkt } from '../format.js';

export async function bausteinSysteminfo() {
  const karte = document.createElement('div');
  karte.className = 'card';

  async function aktualisiere() {
    const s = await holeJson('api/status');
    const kopf = Object.entries(s.kopfzeilen);
    karte.innerHTML = `
      <h3>4. Anmeldung und Speicher</h3>
      <dl class="werte">
        <dt>Angemeldet als</dt><dd>${esc(s.benutzer.anzeigename || s.benutzer.name || s.benutzer.kennung)}</dd>
        <dt>Bisher gesehen</dt><dd>${s.alleBenutzer.map((b) => `${esc(b.anzeigename || b.name)} <small style="display:inline">(${zeitpunkt(b.zuletzt_gesehen)})</small>`).join('<br>')}</dd>
        <dt>Gespeichert</dt><dd>${s.datenbank.medien.anzahl} Dateien, ${bytes(s.datenbank.medien.bytes)}</dd>
        <dt>Freier Platz</dt><dd>${bytes(s.speicher.frei)} von ${bytes(s.speicher.gesamt)}</dd>
        <dt>Version</dt><dd>${esc(s.version)} · Kanal ${esc(s.kanal)} · Datenbank v${s.datenbank.schema}</dd>
      </dl>
      <p class="mute" style="font-size:14px">Öffnet die App beide, jeder mit seinem eigenen Home-Assistant-Konto. Dann sollten hier zwei Namen stehen.</p>
      <details><summary class="mute" style="font-size:14px">Technische Details (Ingress-Kopfzeilen)</summary>
        <dl class="werte" style="margin-top:8px">${kopf.length ? kopf.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('') : '<dt>keine</dt><dd>Die App läuft nicht hinter Home Assistant.</dd>'}</dl>
      </details>`;
  }

  await aktualisiere();
  return { element: karte, aktualisiere: () => aktualisiere().catch(() => {}) };
}
