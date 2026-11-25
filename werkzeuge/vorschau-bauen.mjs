// Baut die Vorschau-Seite „Kinderkunst Vorschau“ (Claude-Artefakt) aus dem Kinderkunst-Atelier (app/atelier).
// Ohne Home Assistant speichert speicher.js automatisch im Browser, wie die alte App.
// Zusätzlich nur hier: werkzeuge/vorschau/beispielfotos.js (erfundene Beispielfotos zum Ausprobieren).
// Aufruf: node werkzeuge/vorschau-bauen.mjs <Zielordner>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = path.join(WURZEL, 'app', 'atelier');
const ZIEL = path.resolve(process.argv[2] || path.join(WURZEL, 'vorschau-ausgabe'));

fs.rmSync(ZIEL, { recursive: true, force: true });
fs.cpSync(QUELLE, ZIEL, { recursive: true });
// Nur in der Vorschau: Knopf „Beispielfotos“, weil sich in der Claude-App oft keine Datei auswählen lässt.
fs.copyFileSync(path.join(WURZEL, 'werkzeuge', 'vorschau', 'beispielfotos.js'), path.join(ZIEL, 'beispielfotos.js'));
const seite = path.join(ZIEL, 'index.html');
const html = fs.readFileSync(seite, 'utf8');
if (!html.includes('</script></body>')) throw new Error('Einbaustelle für beispielfotos.js nicht gefunden');
fs.writeFileSync(seite, html.replace('</script></body>', '</script><script src="beispielfotos.js"></script></body>'));
const dateien = fs.readdirSync(ZIEL);
console.log(`Vorschau gebaut in ${ZIEL} (${dateien.length} Dateien)`);
console.log(JSON.stringify(dateien));
