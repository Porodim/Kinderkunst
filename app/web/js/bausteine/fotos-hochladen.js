// Fotos wählen (Kamera oder Galerie) und nacheinander hochladen, mit Fortschritt pro Datei (W-01).
import { ladeHoch, vorschauUrl } from '../api.js';
import { esc } from '../format.js';

// Zwei Knöpfe: Kamera und Galerie. beiAuswahl(dateien) bekommt die gewählten Dateien.
export function fotoKnoepfe(beiAuswahl, { mehrfach = true, kameraText = 'Kamera', galerieText = 'Fotos wählen' } = {}) {
  const element = document.createElement('div');
  element.className = 'row';
  element.innerHTML = `
    <label class="btn">${esc(kameraText)}<input type="file" accept="image/*" capture="environment" hidden></label>
    <label class="btn s">${esc(galerieText)}<input type="file" accept="image/*" ${mehrfach ? 'multiple' : ''} hidden></label>`;
  element.addEventListener('change', (e) => {
    const feld = e.target;
    if (!(feld instanceof HTMLInputElement) || !feld.files.length) return;
    const dateien = [...feld.files];
    feld.value = '';
    beiAuswahl(dateien);
  });
  return element;
}

// Zeigt Kacheln mit Fortschritt; liefert die hochgeladenen Medien in gewählter Reihenfolge.
export async function ladeFotosHoch(dateien, ziel, { art = 'werkfoto' } = {}) {
  const ergebnisse = [];
  for (const datei of dateien) {
    const kachel = document.createElement('div');
    kachel.className = 'tile';
    kachel.innerHTML = '<span class="knopf" aria-hidden="true">…</span><div class="balken" style="margin:0"><i></i></div>';
    const bild = document.createElement('img');
    bild.alt = '';
    // Fotos, die der Browser nicht anzeigen kann (z. B. HEIC in Chrome), bekommen einen Platzhalter.
    bild.addEventListener('error', () => bild.replaceWith(Object.assign(document.createElement('div'), { className: 'leer', textContent: datei.name || 'Foto' })));
    bild.src = URL.createObjectURL(datei);
    kachel.prepend(bild);
    ziel.append(kachel);
    const balken = kachel.querySelector('.balken i');
    const marke = kachel.querySelector('.knopf');
    try {
      const antwort = await ladeHoch(datei, { art, beiFortschritt: (a) => (balken.style.width = `${a * 100}%`) });
      balken.style.width = '100%';
      marke.textContent = antwort.duplikat ? '↺' : '✓';
      marke.title = antwort.duplikat ? 'War schon hochgeladen' : 'Gespeichert';
      ergebnisse.push({ medium: antwort.medium, duplikat: antwort.duplikat, kachel });
    } catch (f) {
      marke.textContent = '!';
      marke.title = f.message;
      kachel.append(Object.assign(document.createElement('small'), { textContent: f.message, className: 'fehler' }));
      ergebnisse.push({ fehler: f.message, kachel });
    }
  }
  return ergebnisse;
}

// Kleines Vorschaubild eines bereits gespeicherten Mediums.
export function mediumBild(id, groesse = 400) {
  return `<img alt="" loading="lazy" src="${esc(vorschauUrl(id, groesse))}">`;
}
