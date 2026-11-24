// Liest aus dem Anfang einer Bilddatei Aufnahmedatum, Ausrichtung und Größe (W-05, B-05).
// Ohne Fremdpakete: JPEG (EXIF in APP1, Größe aus SOF) und PNG (IHDR). Andere Formate liefern {}.
// Läuft auf dem Server (Buffer) und im Browser (Uint8Array), z. B. in der Vorschau-Seite.

function ascii(bytes, start, laenge) {
  let s = '';
  for (let i = start; i < Math.min(start + laenge, bytes.length); i++) s += String.fromCharCode(bytes[i]);
  return s.replace(/\0+$/, '');
}

// TIFF-Struktur im EXIF-Block: liefert { ausrichtung, datum }.
function leseTiff(bytes, sicht, basis) {
  const le = ascii(bytes, basis, 2) === 'II';
  const u16 = (o) => sicht.getUint16(basis + o, le);
  const u32 = (o) => sicht.getUint32(basis + o, le);
  const ergebnis = {};

  function ifd(offset, unterIfd) {
    if (offset < 8 || basis + offset + 2 > bytes.length) return;
    const anzahl = u16(offset);
    for (let i = 0; i < anzahl; i++) {
      const e = offset + 2 + i * 12;
      if (basis + e + 12 > bytes.length) return;
      const tag = u16(e);
      const typ = u16(e + 2);
      const zahl = u32(e + 4);
      if (tag === 0x0112 && typ === 3) ergebnis.ausrichtung = u16(e + 8);
      if (tag === 0x8769 && unterIfd) ifd(u32(e + 8), false);
      if ((tag === 0x9003 || (tag === 0x0132 && !ergebnis.datum)) && typ === 2 && zahl >= 19) {
        const stelle = basis + u32(e + 8);
        if (stelle + 19 <= bytes.length) {
          const t = /^(\d{4}):(\d{2}):(\d{2})/.exec(ascii(bytes, stelle, 19)); // "2026:03:14 10:22:01"
          if (t && t[1] !== '0000') ergebnis.datum = `${t[1]}-${t[2]}-${t[3]}`;
        }
      }
    }
  }

  ifd(u32(4), true);
  return ergebnis;
}

function leseJpeg(bytes, sicht) {
  const ergebnis = {};
  let o = 2;
  while (o + 4 <= bytes.length) {
    if (bytes[o] !== 0xff) break;
    const marker = bytes[o + 1];
    const laenge = sicht.getUint16(o + 2);
    if (marker === 0xe1 && ascii(bytes, o + 4, 6) === 'Exif') Object.assign(ergebnis, leseTiff(bytes, sicht, o + 10));
    // SOF0–SOF15 außer DHT (C4), JPG (C8), DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker) && o + 9 <= bytes.length) {
      ergebnis.hoehe = sicht.getUint16(o + 5);
      ergebnis.breite = sicht.getUint16(o + 7);
      break;
    }
    if (marker === 0xda) break;
    o += 2 + laenge;
  }
  // Bei Ausrichtung 5–8 liegt das Bild quer im Speicher: Breite und Höhe tauschen.
  if (ergebnis.ausrichtung >= 5 && ergebnis.ausrichtung <= 8 && ergebnis.breite) {
    [ergebnis.breite, ergebnis.hoehe] = [ergebnis.hoehe, ergebnis.breite];
  }
  return ergebnis;
}

export function leseBildInfo(daten) {
  const bytes = daten instanceof Uint8Array ? daten : new Uint8Array(daten);
  const sicht = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  try {
    if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return leseJpeg(bytes, sicht);
    if (bytes.length > 24 && ascii(bytes, 1, 3) === 'PNG') return { breite: sicht.getUint32(16), hoehe: sicht.getUint32(20) };
  } catch {
    /* beschädigte Datei: keine Angaben */
  }
  return {};
}
