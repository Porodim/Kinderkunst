// Tags eingeben (W-09): vorhandene Tags zur Auswahl, freie Eingabe mit Autovervollständigung, Vorschläge.
import { esc } from '../format.js';

// Vorschläge nach Motiv, Anlass, Technik und Ort (W-09).
export const TAG_VORSCHLAEGE = ['Familie', 'Tiere', 'Dino', 'Haus', 'Fahrzeug', 'Natur', 'Weihnachten', 'Ostern', 'Geburtstag',
  'Wasserfarben', 'Buntstifte', 'Fingerfarben', 'Kita', 'Zuhause', 'Oma & Opa'];

let zaehler = 0;

export function tagEingabe(startTags, vorhandene = []) {
  const element = document.createElement('div');
  const listenId = `tags-${++zaehler}`;
  let tags = [...startTags];
  const alle = [...new Set([...vorhandene, ...TAG_VORSCHLAEGE])];

  element.innerHTML = `
    <div class="chips gewaehlt" style="flex-wrap:wrap"></div>
    <div class="suche"><input list="${listenId}" placeholder="Tag eingeben, z. B. Dino" enterkeyhint="done" autocomplete="off">
      <button type="button" class="btn s">＋</button></div>
    <datalist id="${listenId}">${alle.map((t) => `<option value="${esc(t)}">`).join('')}</datalist>
    <small style="margin-top:8px">Vorschläge</small><div class="chips vorschlaege"></div>`;
  const gewaehlt = element.querySelector('.gewaehlt');
  const vorschlaege = element.querySelector('.vorschlaege');
  const feld = element.querySelector('input');

  function zeichne() {
    gewaehlt.innerHTML = tags.map((t, i) => `<button type="button" class="chip on" data-weg="${i}" aria-label="${esc(t)} entfernen">${esc(t)} ✕</button>`).join('');
    const klein = new Set(tags.map((t) => t.toLowerCase()));
    vorschlaege.innerHTML = alle
      .filter((t) => !klein.has(t.toLowerCase()))
      .slice(0, 24)
      .map((t) => `<button type="button" class="chip" data-neu="${esc(t)}">${esc(t)}</button>`)
      .join('');
  }

  function hinzu(name) {
    const t = name.trim().slice(0, 40);
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
    feld.value = '';
    zeichne();
  }

  element.addEventListener('click', (e) => {
    const weg = e.target.closest('[data-weg]');
    const neu = e.target.closest('[data-neu]');
    if (weg) {
      tags.splice(Number(weg.dataset.weg), 1);
      zeichne();
    } else if (neu) {
      hinzu(neu.dataset.neu);
    } else if (e.target.closest('.suche button')) {
      hinzu(feld.value);
    }
  });
  feld.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      hinzu(feld.value);
    }
  });

  zeichne();
  // Noch nicht bestätigte Eingabe beim Speichern mitnehmen.
  return { element, wert: () => (feld.value.trim() ? (hinzu(feld.value), tags) : tags) };
}
