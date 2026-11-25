/* Aufnahmedatum aus einem Foto lesen (Wunsch 6: Datum automatisch aus dem Foto, änderbar im Info-Tab).
 *
 * Liest nur den Anfang der Datei und sucht im EXIF-Block eines JPEG das Aufnahmedatum
 * (DateTimeOriginal, sonst DateTime). Dieselbe Logik wie app/web/js/exif.js, hier als klassisches
 * Skript, weil die App der Nutzerin (index.html) keine Module verwendet. Ohne Fremdpakete.
 * Liefert "JJJJ-MM-TT" oder null.
 */
var Fotodatum = (() => {
  function text(b, start, laenge) {
    let s = '';
    for (let i = start; i < Math.min(start + laenge, b.length); i++) s += String.fromCharCode(b[i]);
    return s;
  }

  function ausTiff(b, sicht, basis) {
    const le = text(b, basis, 2) === 'II';
    const u16 = (o) => sicht.getUint16(basis + o, le);
    const u32 = (o) => sicht.getUint32(basis + o, le);
    let original = null;
    let sonst = null;
    const ifd = (offset, tiefer) => {
      if (offset < 8 || basis + offset + 2 > b.length) return;
      const anzahl = u16(offset);
      for (let i = 0; i < anzahl; i++) {
        const e = offset + 2 + i * 12;
        if (basis + e + 12 > b.length) return;
        const tag = u16(e);
        if (tag === 0x8769 && tiefer) ifd(u32(e + 8), false);
        if ((tag === 0x9003 || tag === 0x0132) && u16(e + 2) === 2 && u32(e + 4) >= 19) {
          const t = /^(\d{4}):(\d{2}):(\d{2})/.exec(text(b, basis + u32(e + 8), 19)); // "2026:03:14 10:22:01"
          if (t && t[1] !== '0000') {
            const d = `${t[1]}-${t[2]}-${t[3]}`;
            if (tag === 0x9003) original = d;
            else sonst = d;
          }
        }
      }
    };
    ifd(u32(4), true);
    return original || sonst;
  }

  function ausBytes(daten) {
    const b = daten instanceof Uint8Array ? daten : new Uint8Array(daten);
    try {
      if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
      const sicht = new DataView(b.buffer, b.byteOffset, b.byteLength);
      let o = 2;
      while (o + 4 <= b.length && b[o] === 0xff) {
        const marker = b[o + 1];
        if (marker === 0xda) break; // Bilddaten beginnen
        if (marker === 0xe1 && text(b, o + 4, 4) === 'Exif') return ausTiff(b, sicht, o + 10);
        o += 2 + sicht.getUint16(o + 2);
      }
    } catch (e) {
      /* beschädigte Datei: kein Datum */
    }
    return null;
  }

  async function lesen(datei) {
    try {
      return ausBytes(await datei.slice(0, 256 * 1024).arrayBuffer());
    } catch (e) {
      return null;
    }
  }

  return { lesen, ausBytes };
})();
