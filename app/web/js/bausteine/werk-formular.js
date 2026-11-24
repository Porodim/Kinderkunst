// Felder eines Werks, bewusst schlicht wie im Foto-Editor der alten App (Reiter „Info“):
// Kind, Was ist es?, Datum, Titel. Seltener Gebrauchtes (Tags, ungefähres Datum, Lieblingswerk) liegt
// zugeklappt unter „Mehr“. Wird beim Erfassen und beim Bearbeiten verwendet.
import { chipAuswahl } from './chips.js';
import { tagEingabe } from './tag-eingabe.js';
import { alterKurz, alterLang, heute, istDatum } from '../alter.js';
import { esc } from '../format.js';

// Kurze Namen wie in der alten App (Gemalt, Lego, Kapla, Sonstiges), ergänzt um Gebastelt (W-03).
export const WERK_ARTEN = [
  { wert: 'bild', text: 'Gemalt' },
  { wert: 'basteln', text: 'Gebastelt' },
  { wert: 'lego', text: 'Lego' },
  { wert: 'kapla', text: 'Kapla' },
  { wert: 'sonstiges', text: 'Sonstiges' },
];
export const ART_TEXT = Object.fromEntries(WERK_ARTEN.map((a) => [a.wert, a.text]));
const GENAU = [
  ['tag', 'Genauer Tag'],
  ['monat', 'Nur Monat'],
  ['ungefaehr', 'Ungefähr'],
];

export function werkFormular({ kinder, werk = {}, vorhandeneTags = [] }) {
  const element = document.createElement('div');
  let quelle = werk.datum_quelle || 'manuell';
  let genauigkeit = werk.datum_genauigkeit || 'tag';
  // Bei nur einem Kind ist es automatisch ausgewählt.
  const vorauswahl = werk.kinder?.length ? werk.kinder.map((k) => k.id) : kinder.length === 1 ? [kinder[0].id] : [];

  element.innerHTML = `
    ${kinder.length > 1 ? '<label class="fl">Von wem?</label><div class="kinder"></div>' : ''}
    <label class="fl">Was ist es?</label><div class="arten"></div>
    <label class="fl">Datum<input type="date" class="datum" max="${heute()}" value="${esc(werk.datum || '')}"></label>
    <small class="datumhinweis"></small>
    <label class="fl">Titel<input class="titel" maxlength="120" value="${esc(werk.titel || '')}" placeholder="optional"></label>
    <details class="mehr" style="margin-top:12px"><summary class="mute">Mehr (Tags, ungefähres Datum, Lieblingswerk)</summary>
      <label class="fl">Tags</label><div class="tags"></div>
      <label class="fl">Wie genau ist das Datum?</label>
      <div class="seg genau">${GENAU.map(([w, t]) => `<button type="button" data-g="${w}">${t}</button>`).join('')}</div>
      <label class="row" style="margin-top:14px"><input type="checkbox" class="favorit" style="width:auto;margin:0" ${werk.favorit ? 'checked' : ''}> ♥ Lieblingswerk</label>
    </details>`;

  const kinderWahl = chipAuswahl(
    kinder.map((k) => ({ wert: k.id, text: k.name })),
    vorauswahl,
    { mehrfach: true, beiAenderung: zeichneHinweis },
  );
  element.querySelector('.kinder')?.append(kinderWahl.element);
  const artWahl = chipAuswahl(WERK_ARTEN, werk.art || 'bild', { leerErlaubt: false });
  element.querySelector('.arten').append(artWahl.element);
  const tags = tagEingabe(werk.tags || [], vorhandeneTags);
  element.querySelector('.tags').append(tags.element);
  const datum = element.querySelector('.datum');
  const hinweis = element.querySelector('.datumhinweis');

  function zeichneHinweis() {
    element.querySelectorAll('.genau button').forEach((b) => b.classList.toggle('on', b.dataset.g === genauigkeit));
    const alter = kinder
      .filter((k) => kinderWahl.wert().includes(k.id))
      .map((k) => [k, genauigkeit === 'tag' ? alterLang(k.geburtsdatum, datum.value) : alterKurz(k.geburtsdatum, datum.value, genauigkeit)])
      .filter(([, a]) => a)
      .map(([k, a]) => `${esc(k.name)}: ${esc(a)}`)
      .join(' · ');
    hinweis.innerHTML = istDatum(datum.value) && alter ? alter : '';
  }

  element.addEventListener('input', (e) => {
    if (e.target === datum) {
      quelle = 'manuell';
      zeichneHinweis();
    }
  });
  element.querySelector('.genau').addEventListener('click', (e) => {
    const knopf = e.target.closest('[data-g]');
    if (!knopf) return;
    genauigkeit = knopf.dataset.g;
    zeichneHinweis();
  });
  zeichneHinweis();

  return {
    element,
    // Datum aus dem Foto übernehmen, solange niemand es von Hand geändert hat.
    schlageDatumVor(neuesDatum, neueQuelle) {
      if (quelle === 'manuell' && datum.value) return;
      datum.value = neuesDatum;
      quelle = neueQuelle;
      zeichneHinweis();
    },
    gewaehlteKinder: () => kinderWahl.wert(),
    werte() {
      const alt = new Map((werk.kinder || []).map((k) => [k.id, k.beitrag || null]));
      return {
        kinder: kinderWahl.wert().map((id) => ({ id, beitrag: alt.get(id) ?? null })),
        art: artWahl.wert(),
        datum: datum.value || null,
        datum_genauigkeit: genauigkeit,
        datum_quelle: quelle,
        titel: element.querySelector('.titel').value,
        tags: tags.wert(),
        favorit: element.querySelector('.favorit').checked,
      };
    },
  };
}

// Datumsvorschlag aus den hochgeladenen Fotos: EXIF, sonst Dateidatum, sonst heute (W-05).
export function datumAusMedien(medien) {
  const exif = medien.map((m) => m.aufgenommen_am).filter(Boolean).sort()[0];
  if (exif) return [exif, 'exif'];
  const datei = medien.map((m) => m.datei_datum).filter(Boolean).sort()[0];
  if (datei) return [datei, 'datei'];
  return [heute(), 'heute'];
}
