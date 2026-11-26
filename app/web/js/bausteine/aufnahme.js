// Tonaufnahme (W-08, B-11): aufnehmen, anhören, neu aufnehmen, speichern. Höchstens 3 Minuten.
// beiGespeichert(medium, dauerMs) wird nach dem Hochladen aufgerufen.
import { istVorschau, ladeHoch } from '../api.js';
import { dauer, esc } from '../format.js';

const MAX_MS = 3 * 60 * 1000;
const FORMATE = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
const ENDUNG = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' };

function meldung(fehler) {
  if (fehler.name === 'NotAllowedError') return 'Zugriff aufs Mikrofon wurde nicht erlaubt. Bitte in den Einstellungen der App bzw. des Browsers freigeben.';
  if (fehler.name === 'NotFoundError') return 'Kein Mikrofon gefunden.';
  return fehler.message || String(fehler);
}

export function mikrofonMoeglich() {
  return !istVorschau && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(window.MediaRecorder);
}

export function bausteinAufnahme({ beiGespeichert = () => {}, speichernText = 'Speichern' } = {}) {
  const element = document.createElement('div');
  element.innerHTML = '<div class="uhr">0:00</div><div class="row knoepfe"></div><div class="abspielen"></div><p class="meldung mute"></p>';
  const uhr = element.querySelector('.uhr');
  const knoepfe = element.querySelector('.knoepfe');
  const abspielen = element.querySelector('.abspielen');
  const ausgabe = element.querySelector('.meldung');

  if (!mikrofonMoeglich()) {
    uhr.remove();
    ausgabe.innerHTML = istVorschau
      ? 'Tonaufnahmen sind in der Vorschau-Seite gesperrt. Bitte in der Home-Assistant-App aufnehmen.'
      : '<span class="fehler">Hier ist keine Tonaufnahme möglich.</span> Das Mikrofon funktioniert nur über eine sichere Verbindung (HTTPS), also über die Home-Assistant-App oder die Cloudflare-Adresse.';
    return { element, beenden() {} };
  }

  let rekorder = null;
  let strom = null;
  let teile = [];
  let start = 0;
  let laenge = 0;
  let takt = null;
  let aufnahme = null;

  function zeigeKnoepfe(zustand) {
    knoepfe.innerHTML = {
      bereit: '<button type="button" class="btn" data-k="start">● Aufnahme starten</button>',
      laeuft: '<button type="button" class="btn" data-k="stopp">■ Stopp</button>',
      fertig: `<button type="button" class="btn" data-k="speichern">${esc(speichernText)}</button><button type="button" class="btn g" data-k="start">Neu aufnehmen</button>`,
    }[zustand];
  }

  async function starte() {
    ausgabe.textContent = '';
    abspielen.replaceChildren();
    aufnahme = null;
    try {
      strom = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (f) {
      ausgabe.innerHTML = `<span class="fehler">${esc(meldung(f))}</span>`;
      return;
    }
    const format = FORMATE.find((f) => MediaRecorder.isTypeSupported(f));
    rekorder = new MediaRecorder(strom, format ? { mimeType: format } : undefined);
    teile = [];
    rekorder.ondataavailable = (e) => e.data.size && teile.push(e.data);
    rekorder.onstop = beendet;
    rekorder.start(1000);
    start = performance.now();
    takt = setInterval(() => {
      const ms = performance.now() - start;
      uhr.textContent = dauer(ms);
      if (ms >= MAX_MS) stoppe();
    }, 250);
    zeigeKnoepfe('laeuft');
  }

  function stoppe() {
    clearInterval(takt);
    laenge = performance.now() - start;
    if (rekorder?.state === 'recording') rekorder.stop();
  }

  function beendet() {
    strom.getTracks().forEach((t) => t.stop());
    const typ = (rekorder.mimeType || 'audio/webm').split(';')[0];
    aufnahme = new File(teile, `aufnahme-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ENDUNG[typ] || 'webm'}`, { type: typ });
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = URL.createObjectURL(aufnahme);
    abspielen.replaceChildren(audio);
    ausgabe.textContent = `Aufnahme: ${dauer(laenge)}. Anhören und dann speichern.`;
    zeigeKnoepfe('fertig');
  }

  async function speichere() {
    const knopf = knoepfe.querySelector('[data-k=speichern]');
    knopf.disabled = true;
    ausgabe.textContent = 'Wird gespeichert …';
    try {
      const antwort = await ladeHoch(aufnahme, { art: 'audio', dauerMs: laenge });
      ausgabe.innerHTML = '<span class="ok">Gespeichert.</span>';
      zeigeKnoepfe('bereit');
      uhr.textContent = '0:00';
      abspielen.replaceChildren();
      await beiGespeichert(antwort.medium, laenge);
    } catch (f) {
      ausgabe.innerHTML = `<span class="fehler">Speichern fehlgeschlagen:</span> ${esc(f.message)}`;
      knopf.disabled = false;
    }
  }

  knoepfe.addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]')?.dataset.k;
    if (k === 'start') starte();
    if (k === 'stopp') stoppe();
    if (k === 'speichern') speichere();
  });
  zeigeKnoepfe('bereit');

  return {
    element,
    // Laufende Aufnahme abbrechen, z. B. beim Schließen des Blatts.
    beenden() {
      clearInterval(takt);
      if (rekorder?.state === 'recording') {
        rekorder.onstop = null;
        rekorder.stop();
      }
      strom?.getTracks().forEach((t) => t.stop());
    },
  };
}
