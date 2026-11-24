// Story hinzufügen oder ändern (W-07, W-08, W-08a): Text, Tonaufnahme und erzählendes Kind.
import { anfrage } from '../api.js';
import { esc } from '../format.js';
import { oeffneBlatt } from './blatt.js';
import { bausteinAufnahme } from './aufnahme.js';

export function oeffneStoryBlatt({ werk, story = null, kinder, nachSpeichern }) {
  let audioId = story?.audio_id ?? null;
  const beteiligte = kinder.filter((k) => werk.kinder.some((w) => w.id === k.id));
  const auswahl = beteiligte.length ? beteiligte : kinder;
  const inhalt = document.createElement('div');
  inhalt.innerHTML = `
    <h3>${story ? 'Story ändern' : 'Story hinzufügen'}</h3>
    <label class="fl">Was sagt das Kind dazu?<textarea class="text" rows="4" maxlength="5000">${esc(story?.text || '')}</textarea></label>
    <label class="fl">Wer erzählt?<select class="erzaehler"><option value="">–</option>
      ${auswahl.map((k) => `<option value="${k.id}" ${story?.erzaehler_kind_id === k.id ? 'selected' : ''}>${esc(k.spitzname || k.name)}</option>`).join('')}</select></label>
    <label class="fl">Tonaufnahme</label>
    <div class="vorhanden"></div><div class="aufnahme"></div>
    <p class="meldung"></p>
    <div class="row"><button type="button" class="btn speichern">Speichern</button><button type="button" class="btn g abbrechen">Abbrechen</button></div>`;
  const blatt = oeffneBlatt(inhalt);
  const feld = (s) => inhalt.querySelector(s);

  function zeichneVorhanden() {
    feld('.vorhanden').innerHTML = audioId
      ? `<div class="row" style="margin:4px 0"><span class="ok">Aufnahme vorhanden</span><button type="button" class="chip tonweg">Aufnahme entfernen</button></div>`
      : '';
  }

  const aufnahme = bausteinAufnahme({
    speichernText: 'Aufnahme übernehmen',
    beiGespeichert: (medium) => {
      audioId = medium.id;
      zeichneVorhanden();
    },
  });
  feld('.aufnahme').append(aufnahme.element);
  zeichneVorhanden();

  inhalt.addEventListener('click', async (e) => {
    if (e.target.closest('.tonweg')) {
      audioId = null;
      zeichneVorhanden();
    }
    if (e.target.closest('.abbrechen')) {
      aufnahme.beenden();
      blatt.schliessen();
    }
    if (e.target.closest('.speichern')) {
      const daten = { text: feld('.text').value, audio_id: audioId, erzaehler_kind_id: Number(feld('.erzaehler').value) || null };
      try {
        if (story) await anfrage('PUT', `api/storys/${story.id}`, daten);
        else await anfrage('POST', `api/werke/${werk.id}/storys`, daten);
        aufnahme.beenden();
        blatt.schliessen();
        nachSpeichern();
      } catch (fehler) {
        feld('.meldung').innerHTML = `<span class="fehler">${esc(fehler.message)}</span>`;
      }
    }
  });
}
