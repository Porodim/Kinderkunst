// Werk erfassen (W-01, W-02, W-05, W-07, W-08, W-13): Fotos per Kamera oder Galerie, sofortiges Hochladen,
// Datumsvorschlag aus dem Foto, Story als Text und Ton. Viele Fotos auf einmal: ein Werk oder
// Eingangskorb (jedes Foto ein eigenes Werk, Angaben später nachtragen).
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
  let einzeln = parameter === 'korb';
  const fotos = []; // { medium, kachel }
  let laufend = 0;
  let audio = null; // { medium, dauerMs }

  ziel.innerHTML = `
    <h2>${einzeln ? 'Eingangskorb' : 'Werk erfassen'}</h2>
    <div class="card">
      <h3>Fotos</h3>
      <p class="mute" style="margin-top:0">Mehrere Fotos von einem Werk (z. B. Lego von allen Seiten) oder viele Werke auf einmal.</p>
      <div class="knoepfe"></div>
      <div class="auswahl"></div>
      <div class="modus" hidden>
        <div class="seg"><button type="button" data-modus="eins">Ein Werk aus allen Fotos</button><button type="button" data-modus="einzeln">Jedes Foto ein Werk</button></div>
        <small class="modushinweis" style="margin-top:6px"></small>
      </div>
    </div>
    <div class="card formular"><h3>Angaben</h3></div>
    <div class="card storykarte"><h3>Story</h3>
      <label class="fl">Was sagt das Kind dazu?<textarea class="storytext" rows="3" maxlength="5000" placeholder="z. B. „Das ist ein Drache, der Kuchen backt.“"></textarea></label>
      <label class="fl erzaehler-feld">Wer erzählt?<select class="erzaehler"><option value="">–</option>${kinder.map((k) => `<option value="${k.id}">${esc(k.spitzname || k.name)}</option>`).join('')}</select></label>
      <label class="fl">Oder als Tonaufnahme</label><div class="aufnahme"></div>
    </div>
    <p class="meldung"></p>
    <div class="row"><button class="btn speichern" disabled>Speichern</button></div>`;

  const auswahl = ziel.querySelector('.auswahl');
  const speichern = ziel.querySelector('.speichern');
  const meldung = ziel.querySelector('.meldung');
  const formular = werkFormular({ kinder, werk: { kinder: vorgabeKind ? [{ id: vorgabeKind }] : [] }, vorhandeneTags: tags.map((t) => t.name) });
  ziel.querySelector('.formular').append(formular.element);
  const aufnahme = bausteinAufnahme({
    speichernText: 'Aufnahme übernehmen',
    beiGespeichert: (medium, dauerMs) => {
      audio = { medium, dauerMs };
      ziel.querySelector('.aufnahme .meldung').innerHTML = '<span class="ok">Aufnahme übernommen.</span> Sie wird mit dem Werk gespeichert.';
    },
  });
  ziel.querySelector('.aufnahme').append(aufnahme.element);
  addEventListener('hashchange', () => aufnahme.beenden(), { once: true });

  function zeichneZustand() {
    const anzahl = fotos.length;
    ziel.querySelector('.modus').hidden = anzahl < 2;
    ziel.querySelectorAll('[data-modus]').forEach((b) => b.classList.toggle('on', (b.dataset.modus === 'einzeln') === einzeln));
    ziel.querySelector('.modushinweis').textContent = einzeln
      ? `${anzahl} eigene Werke. Kinder, Art und Tags gelten für alle, das Datum kommt aus jedem Foto. Fehlende Angaben kannst du später im Archiv nachtragen („Kind fehlt“).`
      : `Ein Werk mit ${anzahl} Fotos. Das erste Foto ist das Titelbild.`;
    ziel.querySelector('.storykarte').hidden = einzeln && anzahl > 1;
    speichern.disabled = laufend > 0 || anzahl === 0;
    speichern.textContent = laufend > 0 ? 'Fotos werden hochgeladen …' : einzeln && anzahl > 1 ? `${anzahl} Werke speichern` : 'Werk speichern';
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
    if (ergebnisse.some((e) => e.duplikat)) zeigeHinweis('Mindestens ein Foto war schon im Archiv. Es wird trotzdem verwendet.');
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
    const erzaehler = Number(ziel.querySelector('.erzaehler').value) || null;
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
        location.hash = werte.kinder.length ? 'archiv' : 'archiv-unvollstaendig';
      } else {
        const story = storyText || audio ? { text: storyText || null, audio_id: audio?.medium.id ?? null, erzaehler_kind_id: erzaehler } : null;
        const { werk } = await anfrage('POST', 'api/werke', { ...werte, medien: fotos.map((f) => f.medium.id), story });
        zustand.werke = [];
        zeigeHinweis('Werk gespeichert');
        location.hash = `werk-${werk.id}`;
      }
    } catch (fehler) {
      meldung.innerHTML = `<span class="fehler">${esc(fehler.message)}</span>`;
      speichern.disabled = false;
    }
  });

  zeichneZustand();
}
