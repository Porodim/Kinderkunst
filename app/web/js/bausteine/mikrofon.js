// Frühtest 1 (Technik-Test): Tonaufnahme im Browser (B-11) mit dem Baustein aus aufnahme.js.
import { bausteinAufnahme } from './aufnahme.js';

export function bausteinMikrofon(nachSpeichern) {
  const karte = document.createElement('div');
  karte.className = 'card';
  karte.innerHTML = `
    <h3>2. Mikrofon</h3>
    <p class="mute">Nimm einen kurzen Satz auf, hör ihn an und speichere ihn. So werden später die Geschichten zu den Werken aufgenommen.</p>`;
  karte.append(bausteinAufnahme({ beiGespeichert: nachSpeichern }).element);
  return karte;
}
