// Navigation zwischen den Ansichten über den Teil hinter # in der Adresse (funktioniert auch unter dem
// Ingress-Pfad von Home Assistant und in der Vorschau-Seite). Muster: #name oder #name-parameter.
import { zeigeStart } from './ansichten/start.js';
import { zeigeArchiv } from './ansichten/archiv.js';
import { zeigeErfassen } from './ansichten/erfassen.js';
import { zeigeWerk } from './ansichten/werk.js';
import { zeigeBearbeiten } from './ansichten/bearbeiten.js';
import { zeigeTechnikTest } from './ansichten/technik-test.js';
import { esc } from './format.js';

const ANSICHTEN = {
  start: { titel: 'Erinnerungen', zeige: zeigeStart, nav: 'start' },
  archiv: { titel: 'Archiv', zeige: zeigeArchiv, nav: 'archiv' },
  erfassen: { titel: 'Werk sichern', zeige: zeigeErfassen, nav: null, zurueck: true },
  werk: { titel: 'Werk', zeige: zeigeWerk, nav: 'archiv', zurueck: true },
  bearbeiten: { titel: 'Bearbeiten', zeige: zeigeBearbeiten, nav: 'archiv', zurueck: true },
  technik: { titel: 'Technik-Test', zeige: zeigeTechnikTest, nav: null, zurueck: true },
};

let aufruf = 0;

function zerlege(hash) {
  const text = hash.replace(/^#/, '');
  const trenner = text.indexOf('-');
  const name = trenner < 0 ? text : text.slice(0, trenner);
  return Object.hasOwn(ANSICHTEN, name) ? { name, parameter: trenner < 0 ? null : text.slice(trenner + 1) } : { name: 'start', parameter: null };
}

async function wechsle() {
  const { name, parameter } = zerlege(location.hash);
  const ansicht = ANSICHTEN[name];
  const nummer = ++aufruf;
  document.getElementById('titel').textContent = ansicht.titel;
  document.getElementById('zurueck').style.visibility = ansicht.zurueck ? 'visible' : 'hidden';
  document.querySelectorAll('#navigation button').forEach((b) => b.classList.toggle('on', b.dataset.ansicht === ansicht.nav));
  const inhalt = document.createElement('div');
  document.getElementById('inhalt').replaceChildren(inhalt);
  if (name !== 'archiv') window.scrollTo(0, 0);
  try {
    await ansicht.zeige(inhalt, () => nummer === aufruf, parameter);
  } catch (fehler) {
    console.error(fehler);
    if (nummer === aufruf) {
      inhalt.innerHTML = `<div class="card"><h3>Das hat nicht geklappt</h3><p class="mute">${esc(fehler.message)}</p>
        <a class="btn g" href="#start" style="text-decoration:none">Zur Startseite</a></div>`;
    }
  }
}

document.getElementById('navigation').addEventListener('click', (e) => {
  const knopf = e.target.closest('[data-ansicht]');
  if (knopf) location.hash = knopf.dataset.ansicht;
});
document.getElementById('einstellungen').addEventListener('click', () => (location.hash = 'technik'));
document.getElementById('zurueck').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.hash = 'archiv';
});
addEventListener('hashchange', wechsle);
wechsle();
