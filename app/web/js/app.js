// Navigation zwischen den Ansichten (über #start, #technik – funktioniert auch unter dem Ingress-Pfad).
import { zeigeStart } from './ansichten/start.js';
import { zeigeTechnikTest } from './ansichten/technik-test.js';
import { esc } from './format.js';

const ANSICHTEN = {
  start: { titel: 'Erinnerungen', zeige: zeigeStart },
  technik: { titel: 'Technik-Test', zeige: zeigeTechnikTest },
};

let aufruf = 0;

async function wechsle() {
  const name = Object.hasOwn(ANSICHTEN, location.hash.slice(1)) ? location.hash.slice(1) : 'start';
  const ansicht = ANSICHTEN[name];
  const nummer = ++aufruf;
  document.getElementById('titel').textContent = ansicht.titel;
  document.querySelectorAll('#navigation button').forEach((b) => b.classList.toggle('on', b.dataset.ansicht === name));
  const inhalt = document.createElement('div');
  document.getElementById('inhalt').replaceChildren(inhalt);
  window.scrollTo(0, 0);
  try {
    await ansicht.zeige(inhalt, () => nummer === aufruf);
  } catch (fehler) {
    if (nummer === aufruf) {
      inhalt.innerHTML = `<div class="card"><h3>Das hat nicht geklappt</h3><p class="mute">${esc(fehler.message)}</p></div>`;
    }
  }
}

document.getElementById('navigation').addEventListener('click', (e) => {
  const knopf = e.target.closest('[data-ansicht]');
  if (knopf) location.hash = knopf.dataset.ansicht;
});
document.getElementById('einstellungen').addEventListener('click', () => (location.hash = 'technik'));
addEventListener('hashchange', wechsle);
wechsle();
