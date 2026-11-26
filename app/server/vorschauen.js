// Vorschaubilder (B-04, B-05): 400 px für Raster, 2000 px für die Vollbild-Ansicht, als WebP,
// EXIF-Ausrichtung angewandt. Erzeugt beim ersten Abruf und danach aus dem Ordner vorschauen/ geliefert.
// Braucht das Paket sharp (im Docker-Image vorhanden). Ohne sharp liefert pfad() null,
// dann zeigt der Server das Original (nur in der Entwicklung).
import fsp from 'node:fs/promises';
import path from 'node:path';

let sharp = null;
try {
  sharp = (await import('sharp')).default;
  sharp.concurrency(1);
} catch {
  sharp = null;
}

export const GROESSEN = [400, 2000];
const GLEICHZEITIG = 2;

export function hatSharp() {
  return Boolean(sharp);
}

export function erzeugeVorschauen(ablage) {
  const laufend = new Map();
  const warteschlange = [];
  let aktiv = 0;

  // Begrenzt gleichzeitige Bildberechnungen, damit der Raspberry Pi bedienbar bleibt.
  function einreihen(aufgabe) {
    return new Promise((erfuellt, abgelehnt) => {
      warteschlange.push({ aufgabe, erfuellt, abgelehnt });
      weiter();
    });
  }
  function weiter() {
    while (aktiv < GLEICHZEITIG && warteschlange.length) {
      const { aufgabe, erfuellt, abgelehnt } = warteschlange.shift();
      aktiv++;
      aufgabe()
        .then(erfuellt, abgelehnt)
        .finally(() => {
          aktiv--;
          weiter();
        });
    }
  }

  async function berechne(medium, groesse, relativ) {
    const ziel = ablage.absolut(relativ);
    await fsp.mkdir(path.dirname(ziel), { recursive: true });
    const tmp = `${ziel}.${process.pid}.tmp`;
    await sharp(ablage.absolut(medium.datei), { failOn: 'none' })
      .rotate()
      .resize({ width: groesse, height: groesse, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: groesse <= 400 ? 72 : 82 })
      .toFile(tmp);
    await fsp.rename(tmp, ziel);
    return relativ;
  }

  // Relativer Pfad der fertigen Vorschau oder null (kein sharp, Format nicht lesbar).
  async function pfad(medium, groesse) {
    const relativ = path.posix.join('vorschauen', medium.sha256.slice(0, 2), `${medium.sha256}-${groesse}.webp`);
    if (ablage.existiert(relativ)) return relativ;
    if (!sharp) return null;
    if (!laufend.has(relativ)) {
      laufend.set(
        relativ,
        einreihen(() => berechne(medium, groesse, relativ))
          .catch(() => null)
          .finally(() => laufend.delete(relativ)),
      );
    }
    return laufend.get(relativ);
  }

  return { pfad };
}
