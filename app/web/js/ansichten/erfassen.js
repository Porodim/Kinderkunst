// Werk sichern (W-01, W-02, W-05, W-07, W-08, W-13), schlicht wie in der alten App:
// Fotos → Kind, Was ist es?, Datum, Titel → „Was sagt das Kind dazu?“ (Text, oder aufnehmen) → Speichern.
// Bei mehreren Fotos eine Frage: ein Werk oder jedes Foto einzeln (Eingangskorb).
import { anfrage, ladeKinder } from '../api.js';
import { esc } from '../format.js';
import { fotoKnoepfe, ladeFotosHoch } from '../bausteine/fotos-hochladen.js';
import { werkFormular, datumAusMedien } from '../bausteine/werk-formular.js';
import { bausteinAufnahme } from '../bausteine/aufnahme.js';
import { zeigeHinweis } from '../bausteine/hinweis.js';
import { zustand } from '../archiv-zustand.js';

export async function zeigeErfassen(ziel, istAktuell, parameter) {
  const [kinder, { tags }] = await Promise.all([ladeKinder(), anfrage('GET', 'api/tags')]);
  if (!istAktuell()) return;
  const vorgabeKind = parameter?.startsWith('kind-') ? Number(parameter.slice(5)) : null;
  let einzeln = false;
  const fotos = []; // { medium, kachel }
  let laufend = 0;
  let audio = null; // { medium, dauerMs }

  ziel.innerHTML = `
    <div class="card">
      <div class="knoepfe"></div>
      <div class="auswahl"></div>
      <div class="modus" hidden>
        <div class="seg"><button type="button" data-modus="eins">Ein Werk</button><button type="button" data-modus="einzeln">Jedes Foto einzeln</button></div>
      </div>
    </div>
    <div class="card angaben" hidden>
      <div class="formular"></div>
      <label class="fl geschichte">Was sagt das Kind dazu?<textarea class="storytext" rows="3" maxlength="5000"></textarea></label>
      <details class="ton geschichte"><summary class="mute">🎙 Lieber aufnehmen</summary><div class="aufnahme"></div></details>
    </div>
    <p class="meldung"></p>
    <button class="btn speichern" hidden style="display:block;width:100%">Speichern</button>`;

  const auswahl = ziel.querySelector('.auswahl');
  const speichern = ziel.querySelector('.speichern');
  const meldung = ziel.querySelector('.meldung');
  const formular = werkFormular({ kinder, werk: vorgabeKind ? { kinder: [{ id: vorgabeKind }] } : {}, vorhandeneTags: tags.map((t) => t.name) });
  ziel.querySelector('.formular').append(formular.element);
  const aufnahme = bausteinAufnahme({
    speichernText: 'Aufnahme übernehmen',
    beiGespeichert: (medium, dauerMs) => {
      audio = { medium, dauerMs };
    },
  });
  ziel.querySelector('.aufnahme').append(aufnahme.element);
  addEventListener('hashchange', () => aufnahme.beenden(), { once: true });

  function zeichneZustand() {
    const anzahl = fotos.length;
    ziel.querySelector('.angaben').hidden = anzahl === 0 && laufend === 0;
    ziel.querySelector('.modus').hidden = anzahl < 2;
    ziel.querySelectorAll('[data-modus]').forEach((b) => b.classList.toggle('on', (b.dataset.modus === 'einzeln') === einzeln));
    ziel.querySelectorAll('.geschichte').forEach((e) => (e.hidden = einzeln && anzahl > 1));
    speichern.hidden = anzahl === 0 && laufend === 0;
    speichern.disabled = laufend > 0 || anzahl === 0;
    speichern.textContent = laufend > 0 ? 'Fotos werden geladen …' : einzeln && anzahl > 1 ? `${anzahl} Werke speichern` : 'Speichern';
    if (anzahl) formular.schlageDatumVor(...datumAusMedien(fotos.map((f) => f.medium)));
  }

  ziel.querySelector('.knoepfe').append(fotoKnoepfe(async (dateien) => {
    laufend++;
    zeichneZustand();
    const ergebnisse = await ladeFotosHoch(dateien, auswahl);
    laufend--;
    for (const e of ergebnisse) {
      if (e.medium && !fotos.some((f) => f.medium.id === e.medium.id)) fotos.push(e);
      else if (e.medium) e.kachel.remove(); // gleiches Foto zweimal gewählt
    }
    if (istAktuell()) zeichneZustand();
  }, { galerieText: 'Fotos wählen' }));

  ziel.addEventListener('click', async (e) => {
    const modus = e.target.closest('[data-modus]');
    if (modus) {
      einzeln = modus.dataset.modus === 'einzeln';
      zeichneZustand();
    }
    if (e.target !== speichern) return;
    const werte = formular.werte();
    const storyText = ziel.querySelector('.storytext').value.trim();
    speichern.disabled = true;
    meldung.textContent = '';
    try {
      if (einzeln && fotos.length > 1) {
        for (const f of fotos) {
          if (f.gespeichert) continue; // bei erneutem Versuch nach einem Fehler nichts doppelt anlegen
          const [datum, quelle] = werte.datum_quelle === 'manuell' ? [werte.datum, 'manuell'] : datumAusMedien([f.medium]);
          await anfrage('POST', 'api/werke', { ...werte, datum, datum_quelle: quelle, medien: [f.medium.id] });
          f.gespeichert = true;
        }
        zustand.werke = [];
        zeigeHinweis(`${fotos.length} Werke gespeichert`);
        location.hash = 'archiv';
      } else {
        const erzaehler = werte.kinder[0]?.id ?? null;
        const story = storyText || audio ? { text: storyText || null, audio_id: audio?.medium.id ?? null, erzaehler_kind_id: erzaehler } : null;
        const { werk } = await anfrage('POST', 'api/werke', { ...werte, medien: fotos.map((f) => f.medium.id), story });
        zustand.werke = [];
        zeigeHinweis('Gespeichert');
        location.replace(`#werk-${werk.id}`);
      }
    } catch (fehler) {
      meldung.innerHTML = `<span class="fehler">${esc(fehler.message)}</span>`;
      speichern.disabled = false;
    }
  });

  zeichneZustand();
}
