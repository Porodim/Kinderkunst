// Felder eines Werks (W-03 bis W-07, W-09, W-11): Kinder, Werkart, Datum mit Genauigkeit, Titel, Tags, Favorit.
// Wird beim Erfassen und beim Bearbeiten verwendet.
import { chipAuswahl } from './chips.js';
import { tagEingabe } from './tag-eingabe.js';
import { alterKurz, datumText, heute, istDatum } from '../alter.js';
import { esc } from '../format.js';

export const WERK_ARTEN = [
  { wert: 'bild', text: 'Bild / Malerei' },
  { wert: 'basteln', text: 'Basteln' },
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
const QUELLE_TEXT = { exif: 'aus dem Foto', datei: 'Datum der Fotodatei', heute: 'heute', manuell: '' };

// werk: vorhandene Werte (beim Bearbeiten) oder Vorgaben (beim Erfassen).
export function werkFormular({ kinder, werk = {}, vorhandeneTags = [], mitBeitrag = false }) {
  const element = document.createElement('div');
  let quelle = werk.datum_quelle || 'manuell';
  let genauigkeit = werk.datum_genauigkeit || 'tag';
  const beitraege = new Map((werk.kinder || []).map((k) => [k.id, k.beitrag || '']));

  element.innerHTML = `
    <label class="fl">Von wem ist das Werk?</label><div class="kinder"></div><div class="beitraege"></div>
    <label class="fl">Was ist es?</label><div class="arten"></div>
    <label class="fl">Wann ist es entstanden?<input type="date" class="datum" max="${heute()}" value="${esc(werk.datum || '')}"></label>
    <div class="seg genau">${GENAU.map(([w, t]) => `<button type="button" data-g="${w}">${t}</button>`).join('')}</div>
    <small class="datumhinweis" style="margin-top:6px"></small>
    <label class="fl">Titel (optional)<input class="titel" maxlength="120" value="${esc(werk.titel || '')}" placeholder="z. B. Die große Burg"></label>
    <label class="fl">Tags</label><div class="tags"></div>
    <label class="row" style="margin-top:14px"><input type="checkbox" class="favorit" style="width:auto;margin:0" ${werk.favorit ? 'checked' : ''}> ♥ Lieblingswerk</label>`;

  const kinderWahl = chipAuswahl(
    kinder.map((k) => ({ wert: k.id, text: k.spitzname || k.name, farbe: k.farbe })),
    (werk.kinder || []).map((k) => k.id),
    { mehrfach: true, beiAenderung: zeichneHinweis },
  );
  element.querySelector('.kinder').append(kinderWahl.element);
  if (!kinder.length) element.querySelector('.kinder').innerHTML = '<p class="mute" style="margin:0">Noch keine Kinder angelegt. Unter „Kinder“ anlegen; das Werk kannst du trotzdem speichern und später zuordnen.</p>';
  const artWahl = chipAuswahl(WERK_ARTEN, werk.art || 'bild', { leerErlaubt: false });
  element.querySelector('.arten').append(artWahl.element);
  const tags = tagEingabe(werk.tags || [], vorhandeneTags);
  element.querySelector('.tags').append(tags.element);
  const datum = element.querySelector('.datum');
  const hinweis = element.querySelector('.datumhinweis');

  function zeichneHinweis() {
    element.querySelectorAll('.genau button').forEach((b) => b.classList.toggle('on', b.dataset.g === genauigkeit));
    const gewaehlt = kinder.filter((k) => kinderWahl.wert().includes(k.id));
    const alter = gewaehlt
      .map((k) => [k, alterKurz(k.geburtsdatum, datum.value, genauigkeit)])
      .filter(([, a]) => a)
      .map(([k, a]) => `${esc(k.spitzname || k.name)} ${a}`)
      .join(' & ');
    const herkunft = QUELLE_TEXT[quelle] ? ` (${QUELLE_TEXT[quelle]})` : '';
    hinweis.innerHTML = istDatum(datum.value) ? `${esc(datumText(datum.value, genauigkeit))}${herkunft}${alter ? ` · ${alter}` : ''}` : 'Ohne Datum wird kein Alter berechnet.';
    if (mitBeitrag) {
      const ziel = element.querySelector('.beitraege');
      ziel.innerHTML = gewaehlt.length > 1
        ? gewaehlt.map((k) => `<div class="kinderzeile"><span style="min-width:70px">${esc(k.spitzname || k.name)}</span>
            <input data-beitrag="${k.id}" maxlength="40" placeholder="Beitrag, z. B. gemalt" value="${esc(beitraege.get(k.id) || '')}"></div>`).join('')
        : '';
    }
  }

  element.addEventListener('input', (e) => {
    if (e.target === datum) quelle = 'manuell';
    if (e.target.dataset.beitrag) beitraege.set(Number(e.target.dataset.beitrag), e.target.value);
    if (e.target === datum) zeichneHinweis();
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
    werte() {
      return {
        kinder: kinderWahl.wert().map((id) => ({ id, beitrag: beitraege.get(id) || null })),
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
