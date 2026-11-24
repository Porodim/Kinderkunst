// Frühtest 1: Tonaufnahme im Browser (B-11). Höchstens 3 Minuten, Datei wird unverändert gespeichert.
import { ladeHoch } from '../api.js';
import { dauer, esc } from '../format.js';

const MAX_MS = 3 * 60 * 1000;
const FORMATE = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
const ENDUNG = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' };

function meldung(fehler) {
  if (fehler.name === 'NotAllowedError') return 'Zugriff aufs Mikrofon wurde nicht erlaubt. Bitte in den Einstellungen der App bzw. des Browsers freigeben.';
  if (fehler.name === 'NotFoundError') return 'Kein Mikrofon gefunden.';
  return fehler.message || String(fehler);
}

export function bausteinMikrofon(nachSpeichern) {
  const karte = document.createElement('div');
  karte.className = 'card';
  karte.innerHTML = `
    <h3>2. Mikrofon</h3>
    <p class="mute">Nimm einen kurzen Satz auf, hör ihn an und speichere ihn. So werden später die Geschichten zu den Werken aufgenommen.</p>
    <div class="uhr">0:00</div>
    <div class="row knoepfe"></div>
    <div class="abspielen"></div>
    <p class="meldung"></p>`;
  const uhr = karte.querySelector('.uhr');
  const knoepfe = karte.querySelector('.knoepfe');
  const abspielen = karte.querySelector('.abspielen');
  const ausgabe = karte.querySelector('.meldung');

  let rekorder = null;
  let strom = null;
  let teile = [];
  let start = 0;
  let laenge = 0;
  let takt = null;
  let aufnahme = null;

  function zeigeKnoepfe(zustand) {
    knoepfe.innerHTML = {
      bereit: '<button class="btn" data-k="start">● Aufnahme starten</button>',
      laeuft: '<button class="btn" data-k="stopp">■ Stopp</button>',
      fertig: '<button class="btn" data-k="speichern">Speichern</button><button class="btn g" data-k="start">Neu aufnehmen</button>',
    }[zustand];
  }

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    ausgabe.innerHTML = '<span class="fehler">Hier ist keine Tonaufnahme möglich.</span> Das Mikrofon funktioniert nur über eine sichere Verbindung (HTTPS), also über die Home-Assistant-App oder die Cloudflare-Adresse.';
    return karte;
  }
  zeigeKnoepfe('bereit');

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
    ausgabe.textContent = `Aufnahme: ${dauer(laenge)}, Format ${typ}.`;
    zeigeKnoepfe('fertig');
  }

  async function speichere() {
    knoepfe.querySelector('[data-k=speichern]').disabled = true;
    try {
      const antwort = await ladeHoch(aufnahme, { art: 'audio', dauerMs: laenge });
      ausgabe.innerHTML = antwort.duplikat ? '<span class="ok">Schon vorhanden.</span>' : '<span class="ok">Gespeichert.</span> Unten in der Liste kannst du sie wieder abspielen.';
      zeigeKnoepfe('bereit');
      uhr.textContent = '0:00';
      abspielen.replaceChildren();
      nachSpeichern();
    } catch (f) {
      ausgabe.innerHTML = `<span class="fehler">Speichern fehlgeschlagen:</span> ${esc(f.message)}`;
      knoepfe.querySelector('[data-k=speichern]').disabled = false;
    }
  }

  knoepfe.addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]')?.dataset.k;
    if (k === 'start') starte();
    if (k === 'stopp') stoppe();
    if (k === 'speichern') speichere();
  });
  return karte;
}
