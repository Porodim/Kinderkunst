// Auswahl als Chips (einfach oder mehrfach), z. B. Kinder, Werkart, Filter.
import { esc } from '../format.js';

// optionen: [{ wert, text, farbe }]; gewaehlt: Wert oder Liste von Werten.
export function chipAuswahl(optionen, gewaehlt, { mehrfach = false, leerErlaubt = true, beiAenderung = () => {} } = {}) {
  const element = document.createElement('div');
  element.className = 'chips';
  let auswahl = new Set(mehrfach ? gewaehlt || [] : gewaehlt == null ? [] : [gewaehlt]);

  function zeichne() {
    element.innerHTML = optionen
      .map((o, i) => {
        const punkt = o.farbe !== undefined ? `<span class="punkt" style="--k:${esc(o.farbe || 'var(--sage)')}"></span>` : '';
        return `<button type="button" class="chip${auswahl.has(o.wert) ? ' on' : ''}" data-i="${i}" aria-pressed="${auswahl.has(o.wert)}">${punkt}${esc(o.text)}</button>`;
      })
      .join('');
  }

  element.addEventListener('click', (e) => {
    const knopf = e.target.closest('[data-i]');
    if (!knopf) return;
    const wert = optionen[Number(knopf.dataset.i)].wert;
    if (mehrfach) {
      if (auswahl.has(wert)) auswahl.delete(wert);
      else auswahl.add(wert);
    } else if (auswahl.has(wert) && leerErlaubt) {
      auswahl = new Set();
    } else {
      auswahl = new Set([wert]);
    }
    zeichne();
    beiAenderung(wert_());
  });

  function wert_() {
    return mehrfach ? optionen.map((o) => o.wert).filter((w) => auswahl.has(w)) : ([...auswahl][0] ?? null);
  }

  zeichne();
  return { element, wert: wert_ };
}
