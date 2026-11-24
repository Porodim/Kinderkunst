// Archiv-Galerie (D-00 bis D-05): Raster mit Vorschaubildern, Filter nach Kind, Werkart, Tag, Favorit,
// fehlenden Angaben und Papierkorb, Volltextsuche, Gruppierung nach Lebensjahr wenn ein Kind gewählt ist.
import { anfrage, ladeKinder } from '../api.js';
import { lebensjahr } from '../alter.js';
import { esc, gruppiere } from '../format.js';
import { zustand, ladeWerke } from '../archiv-zustand.js';
import { chipAuswahl } from '../bausteine/chips.js';
import { werkKachel } from '../bausteine/werk-kachel.js';
import { WERK_ARTEN } from '../bausteine/werk-formular.js';

function gruppenTitel(jahr) {
  if (jahr === null) return 'Ohne Datum';
  if (jahr === 0) return 'Im ersten Lebensjahr';
  return `Mit ${jahr} ${jahr === 1 ? 'Jahr' : 'Jahren'}`;
}

export async function zeigeArchiv(ziel, istAktuell, parameter) {
  const f = zustand.filter;
  // Sprung von außen (Kinderkarte, Hinweis auf der Startseite): alle anderen Filter zurücksetzen.
  const leer = { kind: null, art: null, tag: null, favorit: false, unvollstaendig: false, papierkorb: false, suche: '', alter: null };
  if (parameter?.startsWith('kind-')) Object.assign(f, leer, { kind: Number(parameter.slice(5)) });
  else if (parameter === 'unvollstaendig') Object.assign(f, leer, { unvollstaendig: true });
  const [kinder, { tags }] = await Promise.all([ladeKinder(), anfrage('GET', 'api/tags')]);
  if (!istAktuell()) return;

  ziel.innerHTML = `
    <h2>Archiv</h2>
    <div class="suche" style="margin:10px 0"><input type="search" class="suchfeld" placeholder="Suchen in Titel, Story, Tags" value="${esc(f.suche)}"></div>
    <div class="filter-kinder"></div>
    <div class="filter-arten"></div>
    <div class="chips filter-extra">
      <button type="button" class="chip" data-schalter="favorit">♥ Lieblingswerke</button>
      <button type="button" class="chip" data-schalter="unvollstaendig">Kind fehlt</button>
      <button type="button" class="chip" data-schalter="papierkorb">🗑 Papierkorb</button>
      ${tags.length ? `<select class="tagwahl" style="width:auto;margin:0;padding:6px 10px;border-radius:999px">
        <option value="">Tag …</option>${tags.map((t) => `<option value="${esc(t.name)}" ${f.tag === t.name ? 'selected' : ''}>${esc(t.name)} (${t.anzahl})</option>`).join('')}</select>` : ''}
    </div>
    <p class="mute anzahl" style="margin:6px 0"></p>
    <div class="ergebnis"></div>
    <div class="row"><button class="btn g mehr" hidden>Weitere laden</button></div>`;

  const kinderWahl = chipAuswahl(
    [{ wert: null, text: 'Alle Kinder' }, ...kinder.map((k) => ({ wert: k.id, text: k.spitzname || k.name, farbe: k.farbe }))],
    f.kind,
    { leerErlaubt: false, beiAenderung: (w) => neuLaden({ kind: w, alter: null }) },
  );
  ziel.querySelector('.filter-kinder').append(kinderWahl.element);
  const artWahl = chipAuswahl(WERK_ARTEN, f.art, { beiAenderung: (w) => neuLaden({ art: w }) });
  ziel.querySelector('.filter-arten').append(artWahl.element);
  const ergebnis = ziel.querySelector('.ergebnis');
  const anzahl = ziel.querySelector('.anzahl');
  const mehrKnopf = ziel.querySelector('.mehr');

  function zeichneSchalter() {
    ziel.querySelectorAll('[data-schalter]').forEach((b) => b.classList.toggle('on', Boolean(f[b.dataset.schalter])));
  }

  function zeichne() {
    const kind = kinder.find((k) => k.id === f.kind);
    anzahl.textContent = `${zustand.gesamt} ${zustand.gesamt === 1 ? 'Werk' : 'Werke'}${f.papierkorb ? ' im Papierkorb (werden nach 30 Tagen gelöscht)' : ''}`;
    if (!zustand.werke.length) {
      ergebnis.innerHTML = `<div class="card"><p>${f.papierkorb ? 'Der Papierkorb ist leer.' : 'Hier ist noch nichts. Über „＋ Werk“ sicherst du das erste Kunstwerk.'}</p></div>`;
    } else if (kind?.geburtsdatum) {
      // Zeitstrahl: nach Lebensjahr gruppiert (D-04)
      const gruppen = gruppiere(zustand.werke, (w) => (w.datum ? lebensjahr(kind.geburtsdatum, w.datum) : null));
      ergebnis.innerHTML = [...gruppen]
        .map(([jahr, werke]) => `<h3 class="gruppe">${gruppenTitel(jahr)}</h3><div class="grid">${werke.map(werkKachel).join('')}</div>`)
        .join('');
    } else {
      ergebnis.innerHTML = `<div class="grid">${zustand.werke.map(werkKachel).join('')}</div>`;
    }
    mehrKnopf.hidden = !zustand.mehr;
  }

  async function neuLaden(aenderung = {}) {
    Object.assign(f, aenderung);
    zeichneSchalter();
    await ladeWerke({ neu: true });
    if (istAktuell()) zeichne();
  }

  ziel.addEventListener('click', async (e) => {
    const schalter = e.target.closest('[data-schalter]');
    if (schalter) {
      const name = schalter.dataset.schalter;
      // Der Papierkorb ist eine eigene Ansicht: beim Einschalten die übrigen Filter zurücksetzen.
      if (name === 'papierkorb' && !f.papierkorb) {
        Object.assign(f, { kind: null, art: null, tag: null, favorit: false, unvollstaendig: false, suche: '', alter: null, papierkorb: true });
        zustand.werke = [];
        // Ansicht frisch aufbauen, damit auch die Auswahl-Chips zurückgesetzt sind.
        return dispatchEvent(new HashChangeEvent('hashchange'));
      }
      neuLaden({ [name]: !f[name], ...(name === 'papierkorb' ? {} : { papierkorb: false }) });
    }
    if (e.target === mehrKnopf) {
      mehrKnopf.disabled = true;
      await ladeWerke();
      mehrKnopf.disabled = false;
      if (istAktuell()) zeichne();
    }
    if (e.target.closest('a.tile')) zustand.scrollY = window.scrollY;
  });
  ziel.querySelector('.tagwahl')?.addEventListener('change', (e) => neuLaden({ tag: e.target.value || null }));
  let suchTakt = null;
  ziel.querySelector('.suchfeld').addEventListener('input', (e) => {
    clearTimeout(suchTakt);
    suchTakt = setTimeout(() => neuLaden({ suche: e.target.value.trim() }), 300);
  });

  // Automatisch nachladen, wenn das Ende der Liste sichtbar wird (B-10: auch bei 2.000 Werken flüssig).
  const beobachter = new IntersectionObserver((eintraege) => {
    if (!istAktuell()) return beobachter.disconnect();
    if (eintraege.some((x) => x.isIntersecting) && zustand.mehr && !mehrKnopf.disabled) mehrKnopf.click();
  }, { rootMargin: '600px' });
  beobachter.observe(mehrKnopf);

  zeichneSchalter();
  // Beim Zurückkehren aus der Vollbild-Ansicht: bereits geladene Liste und Position behalten.
  const zurueck = zustand.werke.length && !parameter;
  if (!zurueck) await ladeWerke({ neu: true });
  if (!istAktuell()) return;
  zeichne();
  if (zurueck) window.scrollTo(0, zustand.scrollY);
}
