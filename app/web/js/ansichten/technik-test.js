// Technik-Test (Frühtests M1, docs/ARCHITEKTUR.md): Fotos, Mikrofon, Kamera, Anmeldung, Speicher.
import { bausteinFotoUpload } from '../bausteine/foto-upload.js';
import { bausteinMikrofon } from '../bausteine/mikrofon.js';
import { bausteinKameraLive } from '../bausteine/kamera-live.js';
import { bausteinSysteminfo } from '../bausteine/systeminfo.js';
import { bausteinMedienliste } from '../bausteine/medienliste.js';

export async function zeigeTechnikTest(ziel) {
  ziel.innerHTML = `
    <h2>Technik-Test</h2>
    <p class="mute">Hier prüft ihr, ob alles Nötige auf eurem Gerät funktioniert. Bitte nur Testfotos verwenden, solange das der Testkanal ist.</p>`;
  const info = await bausteinSysteminfo();
  const liste = bausteinMedienliste();
  const aktualisieren = () => {
    info.aktualisiere();
    liste.aktualisiere();
  };
  ziel.append(
    bausteinFotoUpload(aktualisieren),
    bausteinMikrofon(aktualisieren),
    bausteinKameraLive(),
    info.element,
    liste.element,
  );
  liste.aktualisiere();
}
