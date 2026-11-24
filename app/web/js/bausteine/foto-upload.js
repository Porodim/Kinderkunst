// Frühtest 1 und 2: Foto über Kamera oder Galerie hochladen, auch viele und große Dateien auf einmal.
// Zeigt pro Datei Fortschritt und Ergebnis sowie die Übertragungsgeschwindigkeit.
import { ladeHoch } from '../api.js';
import { bytes, esc } from '../format.js';

export function bausteinFotoUpload(nachHochladen) {
  const karte = document.createElement('div');
  karte.className = 'card';
  karte.innerHTML = `
    <h3>1. Fotos hochladen</h3>
    <p class="mute">Kamera öffnet die Foto-App, „Fotos wählen“ die Galerie (auch mehrere). Die Fotos werden in voller Größe gespeichert.</p>
    <div class="row">
      <label class="btn">Kamera<input type="file" accept="image/*" capture="environment" hidden></label>
      <label class="btn s">Fotos wählen<input type="file" accept="image/*" multiple hidden></label>
    </div>
    <ul class="liste"></ul>
    <p class="zusammenfassung mute"></p>`;
  const liste = karte.querySelector('.liste');
  const zusammenfassung = karte.querySelector('.zusammenfassung');

  karte.addEventListener('change', async (e) => {
    const feld = e.target;
    if (!(feld instanceof HTMLInputElement) || !feld.files.length) return;
    const dateien = [...feld.files];
    feld.value = '';
    const start = performance.now();
    let gesamt = 0;
    let fehler = 0;
    for (const datei of dateien) {
      const zeile = document.createElement('li');
      zeile.innerHTML = `<div class="row between" style="margin:0"><span>${esc(datei.name || 'Foto')}</span><small>${bytes(datei.size)}</small></div>
        <div class="balken"><i></i></div><small class="ergebnis">wird hochgeladen …</small>`;
      liste.prepend(zeile);
      const balken = zeile.querySelector('.balken i');
      const ergebnis = zeile.querySelector('.ergebnis');
      try {
        const antwort = await ladeHoch(datei, { art: 'werkfoto', beiFortschritt: (anteil) => (balken.style.width = `${anteil * 100}%`) });
        balken.style.width = '100%';
        ergebnis.innerHTML = antwort.duplikat
          ? '<span class="ok">Schon vorhanden</span> – dieses Foto wurde bereits hochgeladen.'
          : '<span class="ok">Gespeichert</span>';
        gesamt += datei.size;
      } catch (f) {
        fehler++;
        ergebnis.innerHTML = `<span class="fehler">Fehlgeschlagen:</span> ${esc(f.message)}`;
      }
    }
    const sekunden = (performance.now() - start) / 1000;
    zusammenfassung.textContent = `${dateien.length - fehler} von ${dateien.length} Fotos übertragen, ${bytes(gesamt)} in ${sekunden.toFixed(1)} s (${bytes(gesamt / Math.max(sekunden, 0.001))}/s).`;
    nachHochladen();
  });
  return karte;
}
