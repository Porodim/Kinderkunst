// Werk bearbeiten (W-02 bis W-09, W-13): Fotos ergänzen, umsortieren, Titelbild wählen, entfernen;
// Kinder mit Beitrag, Werkart, Datum, Titel, Tags, Favorit; Storys ändern und löschen.
import { anfrage, ladeKinder, vorschauUrl } from '../api.js';
import { dauer, esc } from '../format.js';
import { zustand } from '../archiv-zustand.js';
import { fotoKnoepfe, ladeFotosHoch } from '../bausteine/fotos-hochladen.js';
import { werkFormular } from '../bausteine/werk-formular.js';
import { oeffneStoryBlatt } from '../bausteine/story-blatt.js';
import { bestaetige } from '../bausteine/blatt.js';
import { zeigeHinweis } from '../bausteine/hinweis.js';

export async function zeigeBearbeiten(ziel, istAktuell, parameter) {
  const id = Number(parameter);
  const [kinder, { werk }, { tags }] = await Promise.all([ladeKinder(), anfrage('GET', `api/werke/${id}`), anfrage('GET', 'api/tags')]);
  if (!istAktuell()) return;
  let medien = werk.medien.map((m) => m.id);
  let laufend = 0;

  ziel.innerHTML = `
    <div class="card">
      <div class="auswahl fotos"></div><div class="auswahl neu"></div><div class="knoepfe"></div>
      <small>Das erste Foto ist das Titelbild. ★ macht ein Foto zum Titelbild.</small></div>
    <div class="card formular"></div>
    <div class="card"><h3>Was sagt das Kind dazu?</h3><div class="storys"></div><button type="button" class="chip neuestory">＋ Hinzufügen</button></div>
    <p class="meldung"></p>
    <button class="btn speichern" style="display:block;width:100%">Speichern</button>
    <div class="row"><button class="chip loeschen">Werk löschen</button></div>`;

  const fotos = ziel.querySelector('.fotos');
  const speichern = ziel.querySelector('.speichern');
  const formular = werkFormular({ kinder, werk, vorhandeneTags: tags.map((t) => t.name) });
  ziel.querySelector('.formular').append(formular.element);

  function zeichneFotos() {
    fotos.innerHTML = medien
      .map((m, i) => `<div class="tile" data-medium="${m}"><img alt="" src="${esc(vorschauUrl(m, 400))}">
        ${i === 0 ? '<span class="titelmarke">Titelbild</span>' : ''}
        <div class="row" style="position:absolute;left:4px;right:4px;top:4px;margin:0;justify-content:flex-end;gap:4px">
          ${i > 0 ? '<button type="button" class="knopf" style="position:static" data-aktion="titel" aria-label="Als Titelbild">★</button>' : ''}
          ${medien.length > 1 ? '<button type="button" class="knopf" style="position:static" data-aktion="weg" aria-label="Foto entfernen">✕</button>' : ''}
        </div></div>`)
      .join('');
  }

  async function zeichneStorys() {
    const { werk: aktuell } = await anfrage('GET', `api/werke/${werk.id}`);
    Object.assign(werk, { storys: aktuell.storys });
    ziel.querySelector('.storys').innerHTML = aktuell.storys.length
      ? aktuell.storys.map((s) => `<div class="story">${s.text ? `<p>„${esc(s.text)}“</p>` : ''}${s.audio_id ? `<small>🎙 Aufnahme ${dauer(s.audio_dauer_ms || 0)}</small>` : ''}
          <button type="button" class="chip" style="padding:2px 10px;font-size:12px" data-story="${s.id}">ändern</button></div>`).join('')
      : '';
  }

  ziel.querySelector('.knoepfe').append(fotoKnoepfe(async (dateien) => {
    laufend++;
    speichern.disabled = true;
    const ziel_ = ziel.querySelector('.neu');
    const ergebnisse = await ladeFotosHoch(dateien, ziel_);
    laufend--;
    for (const e of ergebnisse) if (e.medium && !medien.includes(e.medium.id)) medien.push(e.medium.id);
    if (!laufend) {
      ziel_.replaceChildren();
      speichern.disabled = false;
    }
    zeichneFotos();
  }, { kameraText: '＋ Foto', galerieText: '＋ Aus Galerie' }));

  ziel.addEventListener('click', async (e) => {
    const aktion = e.target.closest('[data-aktion]');
    if (aktion) {
      const m = Number(aktion.closest('[data-medium]').dataset.medium);
      const i = medien.indexOf(m);
      if (aktion.dataset.aktion === 'titel') medien = [m, ...medien.filter((x) => x !== m)];
      if (aktion.dataset.aktion === 'vor' && i > 0) [medien[i - 1], medien[i]] = [medien[i], medien[i - 1]];
      if (aktion.dataset.aktion === 'weg' && medien.length > 1) medien.splice(i, 1);
      zeichneFotos();
    }
    if (e.target.closest('.neuestory')) oeffneStoryBlatt({ werk, kinder, nachSpeichern: zeichneStorys });
    const storyKnopf = e.target.closest('[data-story]');
    if (storyKnopf) oeffneStoryBlatt({ werk, story: werk.storys.find((s) => s.id === Number(storyKnopf.dataset.story)), kinder, nachSpeichern: zeichneStorys });
    if (e.target === speichern) {
      speichern.disabled = true;
      try {
        await anfrage('PUT', `api/werke/${werk.id}`, { ...formular.werte(), medien });
        zustand.werke = [];
        zeigeHinweis('Gespeichert');
        location.replace(`#werk-${werk.id}`);
      } catch (fehler) {
        ziel.querySelector('.meldung').innerHTML = `<span class="fehler">${esc(fehler.message)}</span>`;
        speichern.disabled = false;
      }
    }
    if (e.target.closest('.loeschen') && (await bestaetige('Dieses Werk löschen? Im Archiv unter „Papierkorb“ kannst du es 30 Tage lang zurückholen.', 'Löschen'))) {
      await anfrage('DELETE', `api/werke/${werk.id}`);
      zustand.werke = [];
      zeigeHinweis('Gelöscht – 30 Tage im Papierkorb');
      location.hash = 'archiv';
    }
  });

  zeichneFotos();
  await zeichneStorys();
}
