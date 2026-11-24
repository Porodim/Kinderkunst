// Kinderprofile (K-01 bis K-04): Liste, anlegen, ändern, Profilbild, Profilfarbe, archivieren.
import { anfrage, vergissKinder, vorschauUrl } from '../api.js';
import { alterLang, sternzeichen, datumText, heute } from '../alter.js';
import { esc } from '../format.js';
import { oeffneBlatt } from '../bausteine/blatt.js';
import { zeigeHinweis } from '../bausteine/hinweis.js';
import { fotoKnoepfe, ladeFotosHoch } from '../bausteine/fotos-hochladen.js';

// Profilfarben aus dem Farb-Guide (PROJEKT.md Abschnitt 2).
const FARBEN = ['#B2B89D', '#E8C1B7', '#D28A74', '#E6BA72', '#A8C3C8', '#6B8E9B'];

function profilbild(kind) {
  return kind.profilbild_id
    ? `<img class="profil" alt="" src="${esc(vorschauUrl(kind.profilbild_id, 400))}" style="--k:${esc(kind.farbe || 'var(--sage)')}">`
    : `<div class="profil" style="--k:${esc(kind.farbe || 'var(--sage)')};display:flex;align-items:center;justify-content:center;font-family:'Dancing Script',cursive;font-size:30px;font-weight:700">${esc(kind.name.slice(0, 1))}</div>`;
}

export function kinderKarte(kind) {
  const geboren = kind.geburtsdatum ? `${esc(alterLang(kind.geburtsdatum))} · ${sternzeichen(kind.geburtsdatum)}` : 'Geburtsdatum fehlt';
  return `<div class="card kc"><div class="row" style="margin:0;flex-wrap:nowrap">${profilbild(kind)}<div>
      <h2>${esc(kind.name)}${kind.spitzname ? ` <span class="mute" style="font-size:20px">„${esc(kind.spitzname)}“</span>` : ''}</h2>
      <div>${geboren}</div>
      <small>${kind.geburtsdatum ? `geboren am ${esc(datumText(kind.geburtsdatum))} · ` : ''}${kind.anzahl_werke} ${kind.anzahl_werke === 1 ? 'Werk' : 'Werke'}${kind.archiviert_am ? ' · archiviert' : ''}</small>
    </div></div>
    <div class="row"><a class="btn s" href="#archiv-kind-${kind.id}" style="text-decoration:none">Werke ansehen</a>
      <button class="chip" data-aendern="${kind.id}">Profil ändern</button></div></div>`;
}

export function oeffneKindFormular(kind, nachSpeichern) {
  const k = kind || { name: '', spitzname: '', geburtsdatum: '', farbe: FARBEN[0], profilbild_id: null };
  let farbe = k.farbe || FARBEN[0];
  let profilbildId = k.profilbild_id;
  const inhalt = document.createElement('div');
  inhalt.innerHTML = `
    <h3>${kind ? 'Profil ändern' : 'Neues Kind'}</h3>
    <label class="fl">Name<input class="name" maxlength="80" value="${esc(k.name)}" autocomplete="off"></label>
    <label class="fl">Spitzname (optional)<input class="spitz" maxlength="40" value="${esc(k.spitzname || '')}" autocomplete="off"></label>
    <label class="fl">Geburtsdatum<input class="geb" type="date" max="${heute()}" value="${esc(k.geburtsdatum || '')}"></label>
    <p class="serif alter" style="font-size:20px;margin:6px 0"></p>
    <label class="fl">Profilfarbe</label>
    <div class="farben">${FARBEN.map((f) => `<button type="button" data-farbe="${f}" style="background:${f}" aria-label="Farbe ${f}"></button>`).join('')}</div>
    <label class="fl">Profilbild</label>
    <div class="row bildzeile" style="flex-wrap:nowrap"><div class="bild"></div><div class="knoepfe"></div></div>
    <div class="auswahl hochladen" hidden></div>
    <p class="meldung"></p>
    <div class="row">
      <button type="button" class="btn speichern">Speichern</button>
      ${kind ? `<button type="button" class="btn g archiv">${kind.archiviert_am ? 'Wieder aktivieren' : 'Archivieren'}</button>` : ''}
    </div>
    ${kind ? '<small>Archivierte Kinder verschwinden aus den Auswahllisten. Ihre Werke bleiben erhalten.</small>' : ''}`;
  const blatt = oeffneBlatt(inhalt);
  const feld = (s) => inhalt.querySelector(s);

  function zeichne() {
    inhalt.querySelectorAll('[data-farbe]').forEach((b) => b.classList.toggle('on', b.dataset.farbe === farbe));
    const geb = feld('.geb').value;
    feld('.alter').textContent = geb ? `${alterLang(geb)} · ${sternzeichen(geb)}` : '';
    feld('.bild').innerHTML = profilbild({ ...k, name: feld('.name').value || '?', farbe, profilbild_id: profilbildId });
  }

  feld('.knoepfe').append(fotoKnoepfe(async (dateien) => {
    const ziel = feld('.hochladen');
    ziel.hidden = false;
    ziel.replaceChildren();
    const [ergebnis] = await ladeFotosHoch(dateien.slice(0, 1), ziel, { art: 'profilbild' });
    if (ergebnis?.medium) {
      profilbildId = ergebnis.medium.id;
      ziel.hidden = true;
      zeichne();
    }
  }, { mehrfach: false, kameraText: 'Foto', galerieText: 'Wählen' }));

  inhalt.addEventListener('input', zeichne);
  inhalt.addEventListener('click', async (e) => {
    const f = e.target.closest('[data-farbe]');
    if (f) {
      farbe = f.dataset.farbe;
      zeichne();
    }
    if (e.target.closest('.speichern') || e.target.closest('.archiv')) {
      const daten = { name: feld('.name').value, spitzname: feld('.spitz').value, geburtsdatum: feld('.geb').value || null, farbe, profilbild_id: profilbildId };
      if (e.target.closest('.archiv')) daten.archiviert = !kind.archiviert_am;
      try {
        if (kind) await anfrage('PUT', `api/kinder/${kind.id}`, daten);
        else await anfrage('POST', 'api/kinder', daten);
        vergissKinder();
        blatt.schliessen();
        zeigeHinweis(daten.archiviert === true ? 'Archiviert' : 'Gespeichert');
        nachSpeichern();
      } catch (fehler) {
        feld('.meldung').innerHTML = `<span class="fehler">${esc(fehler.message)}</span>`;
      }
    }
  });
  zeichne();
  feld('.name').focus();
}

export async function zeigeKinder(ziel) {
  async function zeichne() {
    const { kinder } = await anfrage('GET', 'api/kinder?archivierte=1');
    const aktiv = kinder.filter((k) => !k.archiviert_am);
    const archiviert = kinder.filter((k) => k.archiviert_am);
    ziel.innerHTML = `<h2>Kinder</h2>
      ${aktiv.length ? aktiv.map(kinderKarte).join('') : '<div class="card"><p>Lege das erste Kinderprofil an – Alter und Sternzeichen werden aus dem Geburtsdatum berechnet.</p></div>'}
      <button class="btn neu">Kind hinzufügen</button>
      ${archiviert.length ? `<details style="margin-top:20px"><summary class="mute">Archivierte Kinder (${archiviert.length})</summary>${archiviert.map(kinderKarte).join('')}</details>` : ''}`;
  }
  ziel.addEventListener('click', async (e) => {
    if (e.target.closest('.neu')) oeffneKindFormular(null, zeichne);
    const aendern = e.target.closest('[data-aendern]');
    if (aendern) {
      const { kinder } = await anfrage('GET', 'api/kinder?archivierte=1');
      oeffneKindFormular(kinder.find((k) => k.id === Number(aendern.dataset.aendern)), zeichne);
    }
  });
  await zeichne();
}
