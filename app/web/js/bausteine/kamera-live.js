// Frühtest 1: Darf die App die Kamera direkt nutzen (Live-Vorschau)? Wichtig für spätere Funktionen
// wie das Ausrichten eines Blatts. Es wird nichts gespeichert.
import { istVorschau } from '../api.js';
import { esc } from '../format.js';

export function bausteinKameraLive() {
  const karte = document.createElement('div');
  karte.className = 'card';
  karte.innerHTML = `
    <h3>3. Kamera live</h3>
    <p class="mute">Prüft, ob die App die Kamera direkt anzeigen darf. Es wird nichts gespeichert.</p>
    <div class="row"><button class="btn s" data-k="an">Kamera einschalten</button></div>
    <p class="meldung"></p>`;
  const knopf = karte.querySelector('[data-k]');
  const ausgabe = karte.querySelector('.meldung');
  let strom = null;

  async function umschalten() {
    if (istVorschau) {
      ausgabe.innerHTML = '<span class="mute">Live-Kamera: In der Vorschau-Seite gesperrt. Bitte in der Home-Assistant-App testen.</span>';
      return;
    }
    if (strom) {
      strom.getTracks().forEach((t) => t.stop());
      strom = null;
      karte.querySelector('video')?.remove();
      knopf.textContent = 'Kamera einschalten';
      ausgabe.textContent = '';
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      ausgabe.innerHTML = '<span class="fehler">Nur über eine sichere Verbindung (HTTPS) möglich.</span>';
      return;
    }
    try {
      strom = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (f) {
      ausgabe.innerHTML = `<span class="fehler">${f.name === 'NotAllowedError' ? 'Zugriff auf die Kamera wurde nicht erlaubt.' : esc(f.message)}</span>`;
      return;
    }
    const video = document.createElement('video');
    Object.assign(video, { autoplay: true, muted: true, playsInline: true, srcObject: strom });
    video.className = 'vorschau';
    karte.querySelector('.row').after(video);
    const einstellung = strom.getVideoTracks()[0].getSettings();
    ausgabe.innerHTML = `<span class="ok">Kamera funktioniert</span> (${einstellung.width || '?'} × ${einstellung.height || '?'} Pixel).`;
    knopf.textContent = 'Kamera ausschalten';
  }

  knopf.addEventListener('click', umschalten);
  return karte;
}
