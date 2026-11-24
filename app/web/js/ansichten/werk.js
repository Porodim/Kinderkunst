// Vollbild-Ansicht eines Werks (D-02): Fotos zum Wischen, Wischen über den Rand zum nächsten Werk,
// Alter pro Kind, Story und Tonaufnahme direkt sichtbar, Favorit, Papierkorb.
import { anfrage, dateiUrl, ladeKinder, vorschauUrl } from '../api.js';
import { alterKurz, datumText } from '../alter.js';
import { dauer, esc } from '../format.js';
import { zustand, nachbar } from '../archiv-zustand.js';
import { bestaetige } from '../bausteine/blatt.js';
import { zeigeHinweis } from '../bausteine/hinweis.js';
import { oeffneStoryBlatt } from '../bausteine/story-blatt.js';
import { ART_TEXT } from '../bausteine/werk-formular.js';

export async function zeigeWerk(ziel, istAktuell, parameter) {
  const id = Number(parameter);
  const [kinder, { werk }] = await Promise.all([ladeKinder(), anfrage('GET', `api/werke/${id}`)]);
  if (!istAktuell()) return;
  // Bei jedem Neuzeichnen frischer Inhalt, damit keine Klick-Reaktionen doppelt hängen.
  const huelle = document.createElement('div');
  ziel.replaceChildren(huelle);
  const name = (kindId) => {
    const k = kinder.find((x) => x.id === kindId) || werk.kinder.find((x) => x.id === kindId);
    return k ? k.spitzname || k.name : '';
  };

  function aktualisiereListe(aenderung) {
    const eintrag = zustand.werke.find((w) => w.id === werk.id);
    if (eintrag) Object.assign(eintrag, aenderung);
  }

  const alter = werk.kinder
    .map((k) => {
      const a = alterKurz(k.geburtsdatum, werk.datum, werk.datum_genauigkeit);
      return `<b>${esc(k.spitzname || k.name)}</b>${a ? ` ${esc(a)}` : ''}${k.beitrag ? ` <span class="mute">(${esc(k.beitrag)})</span>` : ''}`;
    })
    .join(' &amp; ');

  huelle.innerHTML = `
    ${werk.geloescht_am ? '<div class="tp">Dieses Werk liegt im Papierkorb. <button class="chip wiederherstellen">Wiederherstellen</button></div>' : ''}
    <div class="buehne" tabindex="0" aria-label="Fotos des Werks">${werk.medien.map((m) => `<figure><img alt="" src="${esc(vorschauUrl(m.id, 2000))}"></figure>`).join('')}</div>
    ${werk.medien.length > 1 ? `<div class="punkte">${werk.medien.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
    <div class="blaettern">
      <button class="chip zurueckwerk" aria-label="Vorheriges Werk">‹ Vorheriges</button>
      <button class="chip favorit" aria-pressed="${werk.favorit}">${werk.favorit ? '♥ Lieblingswerk' : '♡ Lieblingswerk'}</button>
      <button class="chip weiterwerk" aria-label="Nächstes Werk">Nächstes ›</button>
    </div>
    <div class="card">
      <h2>${esc(werk.titel || ART_TEXT[werk.art])}</h2>
      <p style="margin:6px 0">${alter || '<span class="offen" style="position:static;display:inline-block">Kind fehlt</span> <a href="#bearbeiten-' + werk.id + '">zuordnen</a>'}</p>
      <small>${esc([datumText(werk.datum, werk.datum_genauigkeit), ART_TEXT[werk.art], werk.anzahl_fotos > 1 ? `${werk.anzahl_fotos} Fotos` : ''].filter(Boolean).join(' · '))}</small>
      ${werk.tags.length ? `<div class="chips" style="margin-top:10px;flex-wrap:wrap">${werk.tags.map((t) => `<button class="chip" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
    </div>
    <div class="card">
      <h3>Story</h3>
      ${werk.storys.length ? werk.storys.map((s) => `<div class="story">
          ${s.text ? `<p>„${esc(s.text)}“</p>` : ''}
          ${s.audio_id ? `<audio controls preload="none" src="${esc(dateiUrl(s.audio_id))}"></audio><small>🎙 ${dauer(s.audio_dauer_ms || 0)}</small>` : ''}
          <small>${s.erzaehler_kind_id ? `erzählt von ${esc(name(s.erzaehler_kind_id))} · ` : ''}eingetragen von ${esc(s.angelegt_von || '')}
            · <button class="chip" style="padding:2px 10px;font-size:12px" data-story="${s.id}">ändern</button></small>
        </div>`).join('') : '<p class="mute">Noch keine Story. Was hat das Kind dazu erzählt?</p>'}
      ${werk.geloescht_am ? '' : '<button class="btn s neuestory">＋ Story (Text oder Ton)</button>'}
    </div>
    <div class="row">
      ${werk.geloescht_am ? '' : `<a class="btn" href="#bearbeiten-${werk.id}" style="text-decoration:none">Bearbeiten</a><button class="btn g loeschen">In den Papierkorb</button>`}
    </div>
    <small>Erfasst von ${esc(werk.angelegt_von || '–')}${werk.geaendert_von ? `, zuletzt geändert von ${esc(werk.geaendert_von)}` : ''}</small>`;

  const buehne = huelle.querySelector('.buehne');

  async function blaettere(richtung) {
    const ziel_ = await nachbar(werk.id, richtung);
    if (ziel_) location.replace(`#werk-${ziel_.id}`);
    else zeigeHinweis(richtung > 0 ? 'Das war das letzte Werk.' : 'Das ist das erste Werk.');
  }
  const inListe = zustand.werke.some((w) => w.id === werk.id);
  huelle.querySelector('.zurueckwerk').disabled = !inListe;
  huelle.querySelector('.weiterwerk').disabled = !inListe;

  // Punkte unter den Fotos mitführen
  buehne.addEventListener('scroll', () => {
    const i = Math.round(buehne.scrollLeft / buehne.clientWidth);
    huelle.querySelectorAll('.punkte i').forEach((p, j) => p.classList.toggle('on', i === j));
  }, { passive: true });

  // Über den Rand wischen: nächstes bzw. vorheriges Werk
  let start = null;
  buehne.addEventListener('touchstart', (e) => {
    start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, links: buehne.scrollLeft } : null;
  }, { passive: true });
  buehne.addEventListener('touchend', (e) => {
    if (!start || !inListe) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const amEnde = start.links >= buehne.scrollWidth - buehne.clientWidth - 2;
    const amAnfang = start.links <= 2;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 60) {
      if (dx < 0 && amEnde) blaettere(1);
      if (dx > 0 && amAnfang) blaettere(-1);
    }
    start = null;
  });
  const taste = (e) => {
    if (!istAktuell()) return removeEventListener('keydown', taste);
    if (e.target.closest?.('input, textarea, select') || document.querySelector('.ov')) return;
    if (e.key === 'ArrowRight' && inListe) blaettere(1);
    if (e.key === 'ArrowLeft' && inListe) blaettere(-1);
  };
  if (ziel.taste) removeEventListener('keydown', ziel.taste);
  ziel.taste = taste;
  addEventListener('keydown', taste);

  const neuZeigen = () => istAktuell() && zeigeWerk(ziel, istAktuell, parameter);
  huelle.addEventListener('click', async (e) => {
    if (e.target.closest('.zurueckwerk')) blaettere(-1);
    if (e.target.closest('.weiterwerk')) blaettere(1);
    const tag = e.target.closest('[data-tag]');
    if (tag) {
      Object.assign(zustand.filter, { tag: tag.dataset.tag, papierkorb: false });
      zustand.werke = [];
      location.hash = 'archiv';
    }
    if (e.target.closest('.favorit')) {
      const neu = !werk.favorit;
      await anfrage('PUT', `api/werke/${werk.id}`, { favorit: neu });
      aktualisiereListe({ favorit: neu });
      neuZeigen();
    }
    if (e.target.closest('.neuestory')) oeffneStoryBlatt({ werk, kinder, nachSpeichern: neuZeigen });
    const storyKnopf = e.target.closest('[data-story]');
    if (storyKnopf) {
      const story = werk.storys.find((s) => s.id === Number(storyKnopf.dataset.story));
      oeffneStoryBlatt({ werk, story, kinder, nachSpeichern: neuZeigen });
    }
    if (e.target.closest('.loeschen') && (await bestaetige('Dieses Werk in den Papierkorb legen? Es bleibt 30 Tage wiederherstellbar.', 'In den Papierkorb'))) {
      await anfrage('DELETE', `api/werke/${werk.id}`);
      zustand.werke = zustand.werke.filter((w) => w.id !== werk.id);
      zeigeHinweis('Im Papierkorb – 30 Tage wiederherstellbar');
      location.hash = 'archiv';
    }
    if (e.target.closest('.wiederherstellen')) {
      await anfrage('POST', `api/werke/${werk.id}/wiederherstellen`);
      zustand.werke = [];
      zeigeHinweis('Wiederhergestellt');
      neuZeigen();
    }
  });
}
