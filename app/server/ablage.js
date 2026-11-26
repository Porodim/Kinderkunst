// Dateiablage hinter einer kleinen Schnittstelle (V-04). Heute: lokaler Ordner.
// Originale werden unverändert gespeichert (B-02), der Pfad ergibt sich aus dem SHA-256 (B-06).
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { HttpFehler } from './antworten.js';

export function erzeugeAblage(wurzel) {
  const tmpDir = path.join(wurzel, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  function absolut(relativ) {
    const ziel = path.resolve(wurzel, relativ);
    if (!ziel.startsWith(path.resolve(wurzel) + path.sep)) throw new HttpFehler(400, 'Ungültiger Pfad');
    return ziel;
  }

  // Schreibt den Datenstrom in eine Datei und liefert { sha256, groesse, pfad }.
  async function speichere(quelle, { endung, maxBytes }) {
    const tmpDatei = path.join(tmpDir, `${Date.now()}-${crypto.randomUUID()}`);
    const hash = crypto.createHash('sha256');
    let groesse = 0;
    try {
      await pipeline(
        quelle,
        async function* zaehle(stueckchen) {
          for await (const teil of stueckchen) {
            groesse += teil.length;
            if (groesse > maxBytes) throw new HttpFehler(413, `Datei ist größer als ${Math.round(maxBytes / 1048576)} MB`);
            hash.update(teil);
            yield teil;
          }
        },
        fs.createWriteStream(tmpDatei),
      );
      if (groesse === 0) throw new HttpFehler(400, 'Leere Datei');
      const sha256 = hash.digest('hex');
      const pfad = path.posix.join('originale', sha256.slice(0, 2), `${sha256}${endung}`);
      const ziel = absolut(pfad);
      if (fs.existsSync(ziel)) {
        await fsp.unlink(tmpDatei);
      } else {
        await fsp.mkdir(path.dirname(ziel), { recursive: true });
        await fsp.rename(tmpDatei, ziel);
      }
      return { sha256, groesse, pfad };
    } catch (fehler) {
      await fsp.rm(tmpDatei, { force: true });
      throw fehler;
    }
  }

  function existiert(relativ) {
    return fs.existsSync(absolut(relativ));
  }

  // Die ersten Bytes einer Datei, z. B. für EXIF.
  async function leseAnfang(relativ, anzahl) {
    const datei = await fsp.open(absolut(relativ), 'r');
    try {
      const puffer = Buffer.alloc(anzahl);
      const { bytesRead } = await datei.read(puffer, 0, anzahl, 0);
      return puffer.subarray(0, bytesRead);
    } finally {
      await datei.close();
    }
  }

  function leseStream(relativ, bereich) {
    return fs.createReadStream(absolut(relativ), bereich);
  }

  async function groesse(relativ) {
    return (await fsp.stat(absolut(relativ))).size;
  }

  function speicherplatz() {
    const s = fs.statfsSync(wurzel);
    return { frei: s.bavail * s.bsize, gesamt: s.blocks * s.bsize };
  }

  return { speichere, leseStream, leseAnfang, existiert, absolut, groesse, speicherplatz };
}
