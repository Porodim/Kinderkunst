// Auswahlblatt, das von unten hereinfährt (wie sheet() in der alten App).
export function oeffneBlatt(inhalt) {
  const huelle = document.createElement('div');
  huelle.className = 'ov';
  const blatt = document.createElement('div');
  blatt.className = 'sheet';
  blatt.setAttribute('role', 'dialog');
  if (typeof inhalt === 'string') blatt.innerHTML = inhalt;
  else blatt.append(inhalt);
  huelle.append(blatt);
  document.body.append(huelle);

  function schliessen() {
    huelle.remove();
    removeEventListener('keydown', taste);
    removeEventListener('hashchange', schliessen);
  }
  function taste(e) {
    if (e.key === 'Escape') schliessen();
  }
  huelle.addEventListener('click', (e) => e.target === huelle && schliessen());
  addEventListener('keydown', taste);
  addEventListener('hashchange', schliessen);
  return { element: blatt, schliessen };
}

// Rückfrage mit eigenem Blatt (window.confirm ist in manchen Umgebungen gesperrt).
export function bestaetige(frage, jaText = 'Ja', neinText = 'Abbrechen') {
  return new Promise((erfuellt) => {
    const inhalt = document.createElement('div');
    inhalt.innerHTML = `<p style="font-size:17px"></p><div class="row"><button type="button" class="btn ja"></button><button type="button" class="btn g nein"></button></div>`;
    inhalt.querySelector('p').textContent = frage;
    inhalt.querySelector('.ja').textContent = jaText;
    inhalt.querySelector('.nein').textContent = neinText;
    const blatt = oeffneBlatt(inhalt);
    let antwort = false;
    inhalt.querySelector('.ja').addEventListener('click', () => {
      antwort = true;
      blatt.schliessen();
    });
    inhalt.querySelector('.nein').addEventListener('click', () => blatt.schliessen());
    new MutationObserver((_, beobachter) => {
      if (!blatt.element.isConnected) {
        beobachter.disconnect();
        erfuellt(antwort);
      }
    }).observe(document.body, { childList: true });
  });
}
