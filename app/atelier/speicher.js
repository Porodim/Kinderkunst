/* Speicher des Kinderkunst-Ateliers (die App der Nutzerin, app/atelier/index.html).
 *
 * Ersetzt load()/save() der alten App. Auf Home Assistant speichert er gemeinsam für beide Eltern auf dem
 * Server (ARCHITEKTUR A5: SQLite + Dateiablage):
 *   - der Zustand (Kinder, Fotos, Seiten) als JSON in der Datenbank, mit Revision gegen Überschreiben,
 *   - Bilder als Dateien: Daten-URLs werden einmalig hochgeladen und durch die Adresse ersetzt,
 *   - das unveränderte Original jedes neuen Fotos zusätzlich (E6, B-02).
 * Ohne Server (z. B. Vorschau-Seite bei Claude) speichert er wie bisher im Browser (IndexedDB).
 * Klassisches Skript ohne Module, weil die App selbst eins ist. Wird vor dem App-Skript geladen.
 */
const Speicher = (() => {
  let modus = null; // 'server' | 'browser'
  let revision = 0;
  let bekannt = { kids: new Set(), photos: new Set(), pages: new Set() };
  let zeitgeber = null;
  let wartet = false;
  let laeuft = false;
  let nochmal = false;
  let fehlerGemeldet = false;
  const originale = new Map(); // Foto-ID -> laufender Upload des Originals

  // ---------- Browser (wie in der alten App) ----------
  const idb = () => new Promise((res, rej) => {
    try {
      const r = indexedDB.open('kinderkunst', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) {
      rej(e);
    }
  });
  async function browserLaden() {
    try {
      const d = await idb();
      return await new Promise((res) => {
        const q = d.transaction('kv').objectStore('kv').get('state');
        q.onsuccess = () => res(q.result);
        q.onerror = () => res(null);
      });
    } catch (e) {
      return null;
    }
  }
  async function browserSpeichern(z) {
    try {
      const d = await idb();
      d.transaction('kv', 'readwrite').objectStore('kv').put(z, 'state');
    } catch (e) {
      /* Browser erlaubt keinen Speicher, z. B. in manchen Vorschau-Fenstern */
    }
  }

  // ---------- Hilfen ----------
  function zustand() {
    return { kids: S.kids, photos: S.photos, pages: S.pages };
  }
  function merke(z) {
    for (const k of ['kids', 'photos', 'pages']) bekannt[k] = new Set(((z && z[k]) || []).map((x) => x.id));
  }
  function hinweis(text) {
    if (typeof say === 'function') say(text);
  }
  async function hochladen(blob, art, name) {
    const r = await fetch(`api/medien?art=${art}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg', 'X-Dateiname': encodeURIComponent(name || '') },
      body: blob,
    });
    if (!r.ok) throw new Error(`Hochladen fehlgeschlagen (${r.status})`);
    return (await r.json()).medium.id;
  }

  // Daten-URLs in Fotos einmalig hochladen und durch die Server-Adresse ersetzen.
  async function auslagern() {
    for (const p of S.photos) {
      for (const [feld, art] of [['src', 'werkfoto'], ['out', 'sonstiges']]) {
        const wert = p[feld];
        if (typeof wert !== 'string' || !wert.startsWith('data:')) continue;
        const blob = await (await fetch(wert)).blob();
        const id = await hochladen(blob, art, `${feld}-${p.id}.jpg`);
        if (p[feld] === wert) p[feld] = `api/medien/${id}/datei`; // nur ersetzen, wenn inzwischen nicht neu bearbeitet
      }
      if (originale.has(p.id)) {
        try {
          p.orig = await originale.get(p.id);
        } catch (e) {
          /* Original ließ sich nicht hochladen; die verkleinerte Fassung ist trotzdem gesichert */
        }
        originale.delete(p.id);
      }
    }
  }

  // Bei gleichzeitigen Änderungen auf zwei Geräten: nach ID zusammenführen, nichts verlieren.
  function zusammenfuehren(server) {
    const z = server.zustand || { kids: [], photos: [], pages: [] };
    for (const k of ['kids', 'photos', 'pages']) {
      const lokal = new Map((S[k] || []).map((x) => [x.id, x]));
      const ergebnis = [];
      for (const x of z[k] || []) {
        if (lokal.has(x.id)) ergebnis.push(lokal.get(x.id)); // hier zuletzt bearbeitet
        else if (!bekannt[k].has(x.id)) ergebnis.push(x); // neu vom anderen Gerät
        // sonst: hier gelöscht
      }
      const drin = new Set(ergebnis.map((x) => x.id));
      for (const x of S[k] || []) if (!drin.has(x.id)) ergebnis.push(x); // neu auf diesem Gerät
      S[k] = ergebnis;
    }
    revision = server.revision;
    merke(server.zustand);
    if (typeof render === 'function') render();
    hinweis('Auf dem anderen Handy wurde auch etwas geändert. Beides ist jetzt zusammen gespeichert.');
  }

  async function jetzt() {
    wartet = false;
    if (modus !== 'server') return browserSpeichern(zustand());
    if (laeuft) {
      nochmal = true;
      return;
    }
    laeuft = true;
    try {
      await auslagern();
      const z = zustand();
      const r = await fetch('api/atelier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision, zustand: z }),
      });
      if (r.status === 409) {
        zusammenfuehren(await r.json());
        nochmal = true;
      } else if (r.ok) {
        revision = (await r.json()).revision;
        merke(z);
        if (fehlerGemeldet) hinweis('Gespeichert.');
        fehlerGemeldet = false;
      } else {
        throw new Error(String(r.status));
      }
    } catch (e) {
      if (!fehlerGemeldet) hinweis('Noch nicht gespeichert – keine Verbindung zu Home Assistant. Neuer Versuch läuft.');
      fehlerGemeldet = true;
      setTimeout(speichern, 15000);
    } finally {
      laeuft = false;
      if (nochmal) {
        nochmal = false;
        speichern();
      }
    }
  }

  // ---------- öffentlich ----------
  async function laden() {
    try {
      const r = await fetch('api/atelier', { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      modus = 'server';
      revision = d.revision;
      if (!d.zustand) {
        // Erster Start auf Home Assistant: vorhandene Browser-Daten dieses Geräts übernehmen.
        const lokal = await browserLaden();
        merke(null);
        if (lokal && (lokal.photos || []).length) {
          setTimeout(speichern, 0);
          return lokal;
        }
        return null;
      }
      merke(d.zustand);
      return d.zustand;
    } catch (e) {
      modus = 'browser';
      return browserLaden();
    }
  }

  function speichern() {
    clearTimeout(zeitgeber);
    wartet = true;
    zeitgeber = setTimeout(jetzt, modus === 'server' ? 1200 : 400);
  }

  // Original eines neuen Fotos sofort im Hintergrund hochladen (volle Auflösung, unverändert).
  function original(foto, datei) {
    if (modus !== 'server' || !datei) return;
    const upload = hochladen(datei, 'werkfoto', datei.name);
    upload.catch(() => {});
    originale.set(foto.id, upload);
  }

  // Zurück in der App: Änderungen vom anderen Gerät holen.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || modus !== 'server' || laeuft || wartet) return;
    try {
      const d = await (await fetch('api/atelier', { headers: { Accept: 'application/json' } })).json();
      if (d.revision > revision && d.zustand) {
        S.kids = d.zustand.kids || [];
        S.photos = d.zustand.photos || [];
        S.pages = d.zustand.pages || [];
        if (!S.kids.some((k) => k.id === S.ui.kid)) S.ui.kid = S.kids[0] && S.kids[0].id;
        revision = d.revision;
        merke(d.zustand);
        if (typeof render === 'function') render();
      }
    } catch (e) {
      /* offline: beim nächsten Mal */
    }
  });

  return { laden, speichern, original, modus: () => modus };
})();

// Die alte App ruft load() und save() auf.
function load() {
  return Speicher.laden();
}
function save() {
  Speicher.speichern();
}
