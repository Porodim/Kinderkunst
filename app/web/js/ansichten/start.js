// Startseite. Das Archiv kommt in M2; bis dahin führt sie zum Technik-Test.
import { holeJson } from '../api.js';
import { esc } from '../format.js';

const KANAL = { test: 'Testkanal – nur erfundene Daten', entwicklung: 'Entwicklungsumgebung' };

export async function zeigeStart(ziel) {
  const status = await holeJson('api/status');
  const name = status.benutzer.anzeigename || status.benutzer.name || 'du';
  ziel.innerHTML = `
    <h1 class="hero"><span class="lf">🌿</span> Kinderkunst <span class="lf" style="display:inline-block;transform:scaleX(-1)">🌿</span></h1>
    <p class="serif sub">Das kleine Atelier für große Werke</p>
    ${KANAL[status.kanal] ? `<p><span class="pill">${esc(KANAL[status.kanal])}</span></p>` : ''}
    <div class="card">
      <h3>Hallo ${esc(name)}</h3>
      <p>Das Fundament steht: Fotos und Tonaufnahmen werden unverändert auf eurem Home-Assistant-Rechner gespeichert.</p>
      <p class="mute">Archiv, Kinderprofile und Werke folgen im nächsten Schritt. Bis dahin kannst du prüfen, ob Kamera, Mikrofon und Hochladen auf deinem Gerät funktionieren.</p>
      <div class="row"><a class="btn" href="#technik" style="text-decoration:none">Technik testen</a></div>
    </div>`;
}
