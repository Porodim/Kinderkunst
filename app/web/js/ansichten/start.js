// Startseite: Kinder mit Alter und Sternzeichen (wie in der alten App), schnelles Erfassen,
// Hinweis auf Werke ohne Kind, zuletzt gesicherte Werke.
import { anfrage, ladeKinder } from '../api.js';
import { esc } from '../format.js';
import { kinderKarte, oeffneKindFormular } from './kinder.js';
import { werkKachel } from '../bausteine/werk-kachel.js';

const KANAL = {
  test: 'Testkanal – nur erfundene Daten',
  entwicklung: 'Entwicklungsumgebung',
  vorschau: 'Vorschau – Fotos bleiben nur in diesem Fenster',
};

export async function zeigeStart(ziel, istAktuell) {
  const [status, kinder, letzte, offen] = await Promise.all([
    anfrage('GET', 'api/status'),
    ladeKinder({ neu: true }),
    anfrage('GET', 'api/werke?anzahl=6'),
    anfrage('GET', 'api/werke?unvollstaendig=1&anzahl=1'),
  ]);
  if (!istAktuell()) return;
  const name = status.benutzer.anzeigename || status.benutzer.name || '';
  // Frischer Inhalt bei jedem Zeichnen, damit Klick-Reaktionen nicht doppelt hängen.
  const huelle = document.createElement('div');
  ziel.replaceChildren(huelle);

  huelle.innerHTML = `
    <h1 class="hero"><span class="lf">🌿</span> Kinderkunst <span class="lf" style="display:inline-block;transform:scaleX(-1)">🌿</span></h1>
    <p class="serif sub">Das kleine Atelier für große Werke</p>
    ${KANAL[status.kanal] ? `<p><span class="pill">${esc(KANAL[status.kanal])}</span></p>` : ''}
    <div class="card">
      <h3>Hallo${name ? ` ${esc(name)}` : ''}</h3>
      <p style="margin-top:0">Hat heute jemand gemalt, gebastelt oder gebaut?</p>
      <div class="row"><a class="btn" href="#erfassen" style="text-decoration:none">＋ Werk erfassen</a>
        <a class="btn s" href="#erfassen-korb" style="text-decoration:none">Viele Fotos auf einmal</a></div>
      ${offen.gesamt ? `<div class="tp">${offen.gesamt} ${offen.gesamt === 1 ? 'Werk wartet' : 'Werke warten'} noch auf ein Kind. <a href="#archiv-unvollstaendig">Jetzt nachtragen</a></div>` : ''}
    </div>
    ${kinder.length ? kinder.map(kinderKarte).join('') : '<div class="card"><p>Lege das erste Kinderprofil an – Alter und Sternzeichen werden aus dem Geburtsdatum berechnet.</p></div>'}
    <button class="btn g neueskind">Kind hinzufügen</button>
    ${letzte.werke.length ? `<h3 class="gruppe">Zuletzt gesichert</h3><div class="grid">${letzte.werke.map(werkKachel).join('')}</div>
      <div class="row"><a class="btn g" href="#archiv" style="text-decoration:none">Ganzes Archiv</a></div>` : ''}`;

  const neu = () => istAktuell() && zeigeStart(ziel, istAktuell);
  huelle.addEventListener('click', (e) => {
    if (e.target.closest('.neueskind')) oeffneKindFormular(null, neu);
    const aendern = e.target.closest('[data-aendern]');
    if (aendern) oeffneKindFormular(kinder.find((k) => k.id === Number(aendern.dataset.aendern)), neu);
  });
}
