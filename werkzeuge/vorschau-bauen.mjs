// Baut die Vorschau-Seite „Kinderkunst Vorschau“ (Claude-Artefakt) aus dem Kinderkunst-Atelier (app/atelier).
// Ohne Home Assistant speichert speicher.js automatisch im Browser, wie die alte App.
// Aufruf: node werkzeuge/vorschau-bauen.mjs <Zielordner>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = path.join(WURZEL, 'app', 'atelier');
const ZIEL = path.resolve(process.argv[2] || path.join(WURZEL, 'vorschau-ausgabe'));

fs.rmSync(ZIEL, { recursive: true, force: true });
fs.cpSync(QUELLE, ZIEL, { recursive: true });
const dateien = fs.readdirSync(ZIEL);
console.log(`Vorschau gebaut in ${ZIEL} (${dateien.length} Dateien)`);
console.log(JSON.stringify(dateien));
