// Startseite wie in der alten App: Überschrift, Kinderkarten mit Alter und Sternzeichen, „Kind hinzufügen“.
// Dazu ein Knopf zum Sichern eines Werks und die zuletzt gesicherten Werke.
import { anfrage, ladeKinder } from '../api.js';
import { esc } from '../format.js';
import { kinderKarte, oeffneKindFormular } from './kinder.js';
import { werkKachel } from '../bausteine/werk-kachel.js';

const KANAL = { test: 'Testkanal', entwicklung: 'Entwicklung', vorschau: 'Vorschau' };

export async function zeigeStart(ziel, istAktuell) {
  const [status, kinder, letzte, offen] = await Promise.all([
    anfrage('GET', 'api/status'),
    ladeKinder({ neu: true }),
    anfrage('GET', 'api/werke?anzahl=4'),
    anfrage('GET', 'api/werke?unvollstaendig=1&anzahl=1'),
  ]);
  if (!istAktuell()) return;
  // Frischer Inhalt bei jedem Zeichnen, damit Klick-Reaktionen nicht doppelt hängen.
  const huelle = document.createElement('div');
  ziel.replaceChildren(huelle);

  huelle.innerHTML = `
    <h1 class="hero"><span class="lf">🌿</span> Kinderkunst <span class="lf" style="display:inline-block;transform:scaleX(-1)">🌿</span></h1>
    <p class="serif sub">Das kleine Atelier für große Werke${KANAL[status.kanal] ? ` <span class="pill" style="font-style:normal;font-size:12px">${KANAL[status.kanal]}</span>` : ''}</p>
    ${kinder.length ? `<a class="btn" href="#erfassen" style="text-decoration:none;display:block;text-align:center;margin-bottom:14px">＋ Werk sichern</a>` : ''}
    ${offen.gesamt ? `<p class="tp">${offen.gesamt} ${offen.gesamt === 1 ? 'Werk ist' : 'Werke sind'} noch keinem Kind zugeordnet. <a href="#archiv-unvollstaendig">Ansehen</a></p>` : ''}
    ${kinder.length ? kinder.map(kinderKarte).join('') : '<div class="card"><p>Lege das erste Kinderprofil an – Alter und Sternzeichen werden aus dem Geburtsdatum berechnet.</p></div>'}
    <button class="btn ${kinder.length ? 'g' : ''} neueskind">Kind hinzufügen</button>
    ${letzte.werke.length ? `<h3 class="gruppe">Zuletzt gesichert</h3><div class="grid">${letzte.werke.map(werkKachel).join('')}</div>` : ''}`;

  const neu = () => istAktuell() && zeigeStart(ziel, istAktuell);
  huelle.addEventListener('click', (e) => {
    if (e.target.closest('.neueskind')) oeffneKindFormular(null, neu);
    const aendern = e.target.closest('[data-aendern]');
    if (aendern) oeffneKindFormular(kinder.find((k) => k.id === Number(aendern.dataset.aendern)), neu);
  });
}
