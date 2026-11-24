// Kinderprofile wie in der alten App: Karte mit Name, Alter und Sternzeichen; Formular nur mit Name
// und Geburtsdatum (K-01 bis K-03). Profilbild, Farbe und Spitzname gibt es im Datenmodell, sie
// werden in der Oberfläche bewusst nicht abgefragt.
import { anfrage, vergissKinder } from '../api.js';
import { alterLang, sternzeichen, datumText, heute } from '../alter.js';
import { esc } from '../format.js';
import { oeffneBlatt, bestaetige } from '../bausteine/blatt.js';
import { zeigeHinweis } from '../bausteine/hinweis.js';

export function kinderKarte(kind) {
  const alter = kind.geburtsdatum ? `${esc(alterLang(kind.geburtsdatum))} · ${sternzeichen(kind.geburtsdatum)}` : '';
  const geboren = kind.geburtsdatum ? `geboren am ${esc(datumText(kind.geburtsdatum))} · ` : '';
  return `<div class="card kc"><h2>${esc(kind.name)}</h2><div>${alter}</div>
    <small>${geboren}${kind.anzahl_werke} ${kind.anzahl_werke === 1 ? 'Werk' : 'Werke'}</small>
    <div class="row"><a class="btn s" href="#archiv-kind-${kind.id}" style="text-decoration:none">Werke ansehen</a>
      <button class="chip" data-aendern="${kind.id}">Profil ändern</button></div></div>`;
}

export function oeffneKindFormular(kind, nachSpeichern) {
  const inhalt = document.createElement('div');
  inhalt.innerHTML = `<h3>${kind ? 'Profil ändern' : 'Neues Kind'}</h3>
    <label class="fl">Name<input class="name" maxlength="80" value="${esc(kind?.name || '')}" autocomplete="off"></label>
    <label class="fl">Geburtsdatum<input class="geb" type="date" max="${heute()}" value="${esc(kind?.geburtsdatum || '')}"></label>
    <p class="serif alter" style="font-size:20px;margin:6px 0"></p>
    <p class="meldung"></p>
    <div class="row"><button type="button" class="btn speichern">Speichern</button>
      ${kind ? '<button type="button" class="btn g entfernen">Profil entfernen</button>' : ''}</div>`;
  const blatt = oeffneBlatt(inhalt);
  const feld = (s) => inhalt.querySelector(s);
  const zeichneAlter = () => {
    const geb = feld('.geb').value;
    feld('.alter').textContent = geb ? `${alterLang(geb)} · ${sternzeichen(geb)}` : '';
  };

  inhalt.addEventListener('input', zeichneAlter);
  inhalt.addEventListener('click', async (e) => {
    if (e.target.closest('.speichern')) {
      const daten = { name: feld('.name').value, geburtsdatum: feld('.geb').value || null };
      if (!daten.name.trim() || !daten.geburtsdatum) {
        feld('.meldung').innerHTML = '<span class="fehler">Bitte Name und Geburtsdatum angeben.</span>';
        return;
      }
      try {
        if (kind) await anfrage('PUT', `api/kinder/${kind.id}`, daten);
        else await anfrage('POST', 'api/kinder', daten);
        vergissKinder();
        blatt.schliessen();
        nachSpeichern();
      } catch (fehler) {
        feld('.meldung').innerHTML = `<span class="fehler">${esc(fehler.message)}</span>`;
      }
    }
    if (e.target.closest('.entfernen')) {
      blatt.schliessen();
      const frage = kind.anzahl_werke
        ? `Profil von ${kind.name} entfernen? Die ${kind.anzahl_werke} Werke bleiben im Archiv erhalten.`
        : `Profil von ${kind.name} entfernen?`;
      if (!(await bestaetige(frage, 'Entfernen'))) return;
      await anfrage('PUT', `api/kinder/${kind.id}`, { archiviert: true });
      vergissKinder();
      zeigeHinweis('Profil entfernt');
      nachSpeichern();
    }
  });
  zeichneAlter();
  feld('.name').focus();
}
