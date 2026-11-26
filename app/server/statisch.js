// Liefert die Oberfläche (Ordner web/) und die lokal installierten Schriften aus.
// Alle Verweise in der Oberfläche sind relativ, damit die App unter dem Ingress-Pfad von HA läuft.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(APP, 'web');
// Hauptoberfläche ist das Kinderkunst-Atelier (die App der Nutzerin); der Technik-Test liegt unter /technik.
const ATELIER = path.join(APP, 'atelier');
const SCHRIFTEN = path.join(APP, 'node_modules', '@fontsource');

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function innerhalb(wurzel, relativ) {
  const ziel = path.resolve(wurzel, '.' + path.posix.normalize('/' + relativ));
  return ziel.startsWith(wurzel + path.sep) ? ziel : null;
}

// Gibt true zurück, wenn die Anfrage beantwortet wurde.
export function liefereStatisch(req, res, pfad) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  let datei = null;
  if (pfad === '/' || pfad === '') datei = path.join(ATELIER, 'index.html');
  else if (pfad === '/technik') datei = path.join(WEB, 'index.html');
  else if (pfad.startsWith('/schriften/')) datei = innerhalb(SCHRIFTEN, pfad.slice('/schriften/'.length).replace(/^([\w-]+)\//, '$1/files/'));
  else datei = [innerhalb(ATELIER, pfad), innerhalb(WEB, pfad)].find((d) => d && fs.existsSync(d) && fs.statSync(d).isFile()) || null;
  if (!datei || !fs.existsSync(datei) || !fs.statSync(datei).isFile()) return false;

  const endung = path.extname(datei);
  res.writeHead(200, {
    'Content-Type': TYPEN[endung] || 'application/octet-stream',
    'Content-Length': fs.statSync(datei).size,
    'Cache-Control': endung === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(datei).on('error', () => res.destroy()).pipe(res);
  return true;
}
