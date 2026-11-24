// Zuletzt hochgeladene Dateien. Im Technik-Test werden die Originale angezeigt; die Galerie ab M2
// nutzt Vorschaubilder (B-04).
import { dateiUrl, holeJson } from '../api.js';
import { bytes, dauer, esc, zeitpunkt } from '../format.js';

export function bausteinMedienliste() {
  const karte = document.createElement('div');
  karte.className = 'card';
  karte.innerHTML = '<h3>Zuletzt hochgeladen</h3><div class="grid"></div><p class="leer mute"></p>';
  const raster = karte.querySelector('.grid');
  const leer = karte.querySelector('.leer');

  async function aktualisiere() {
    const { medien } = await holeJson('api/medien?anzahl=30');
    leer.textContent = medien.length ? '' : 'Noch nichts hochgeladen.';
    raster.innerHTML = medien
      .map((m) => {
        const quelle = esc(dateiUrl(m.id));
        const inhalt = m.art === 'audio'
          ? `<div class="tt">🎙 ${dauer(m.dauer_ms || 0)}<audio controls preload="none" src="${quelle}"></audio></div>`
          : `<img loading="lazy" alt="" src="${quelle}">`;
        return `<div class="tile">${inhalt}<div class="tt">${esc(m.originalname || m.art)}
          <small>${bytes(m.groesse)} · ${esc(m.hochgeladen_von || '')} · ${zeitpunkt(m.hochgeladen_am)}</small></div></div>`;
      })
      .join('');
  }

  return { element: karte, aktualisiere: () => aktualisiere().catch((f) => (leer.textContent = f.message)) };
}
