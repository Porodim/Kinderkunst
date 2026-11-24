// Baut die Vorschau-Seite aus app/web: gleiche Oberfläche, aber ohne Server (js/vorschau/server.js).
// Aufruf: node werkzeuge/vorschau-bauen.mjs <Zielordner>
// Der Zielordner wird als Claude-Artefakt veröffentlicht (mehrere Dateien, relative Pfade).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = path.join(WURZEL, 'app', 'web');
const ZIEL = path.resolve(process.argv[2] || path.join(WURZEL, 'vorschau-ausgabe'));

// In der Vorschau dürfen Schriften nur von Google Fonts kommen (wie in der alten App).
const GOOGLE_FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Dancing+Script:wght@600;700&family=Nunito:wght@400;600;700;800&display=swap">';

fs.rmSync(ZIEL, { recursive: true, force: true });
fs.cpSync(QUELLE, ZIEL, { recursive: true });
fs.rmSync(path.join(ZIEL, 'css', 'schriften.css'));

const indexPfad = path.join(ZIEL, 'index.html');
let html = fs.readFileSync(indexPfad, 'utf8');
const ersetzen = (alt, neu) => {
  if (!html.includes(alt)) throw new Error(`index.html: „${alt}“ nicht gefunden`);
  html = html.replace(alt, neu);
};
ersetzen('<link rel="stylesheet" href="css/schriften.css">', GOOGLE_FONTS);
ersetzen('<script type="module" src="js/app.js"></script>', '<script>globalThis.KINDERKUNST_VORSCHAU = true;</script>\n<script type="module" src="js/app.js"></script>');
ersetzen('<title>Kinderkunst</title>', '<title>Kinderkunst Vorschau</title>');
fs.writeFileSync(indexPfad, html);

const dateien = [];
(function sammle(ordner) {
  for (const eintrag of fs.readdirSync(ordner, { withFileTypes: true })) {
    const voll = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) sammle(voll);
    else dateien.push(path.relative(ZIEL, voll).split(path.sep).join('/'));
  }
})(ZIEL);
console.log(`Vorschau gebaut in ${ZIEL} (${dateien.length} Dateien)`);
console.log(JSON.stringify(dateien));
