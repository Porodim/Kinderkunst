// Kachel eines Werks in der Archiv-Galerie (D-01): Vorschaubild, Alter, Favorit, Hinweis auf fehlende Angaben.
import { vorschauUrl } from '../api.js';
import { alterKurz, datumText } from '../alter.js';
import { esc } from '../format.js';
import { ART_TEXT } from './werk-formular.js';

export function werkKachel(werk) {
  const alter = werk.kinder
    .map((k) => alterKurz(k.geburtsdatum, werk.datum, werk.datum_genauigkeit))
    .filter(Boolean)
    .join(' & ');
  const namen = werk.kinder.map((k) => k.spitzname || k.name).join(' & ');
  const bild = werk.titelbild_id
    ? `<img loading="lazy" alt="${esc(werk.titel || 'Werk')}" src="${esc(vorschauUrl(werk.titelbild_id, 400))}">`
    : '<div class="leer">Kein Foto</div>';
  const unterzeile = [namen, datumText(werk.datum, werk.datum_genauigkeit)].filter(Boolean).join(' · ');
  return `<a class="tile" href="#werk-${werk.id}" style="text-decoration:none;color:inherit;display:block">
    ${bild}
    ${alter ? `<span class="marke">${esc(alter)}</span>` : ''}
    ${werk.favorit ? '<span class="herz" aria-label="Lieblingswerk">♥</span>' : ''}
    ${werk.unvollstaendig ? '<span class="offen">ohne Kind</span>' : ''}
    <div class="tt">${esc(werk.titel || ART_TEXT[werk.art] || 'Werk')}${werk.hat_audio ? ' 🎙' : ''}${werk.anzahl_fotos > 1 ? ` · ${werk.anzahl_fotos} Fotos` : ''}
      <small>${esc(unterzeile)}</small></div></a>`;
}
