// Setzt eine neue Version mit Datumsstempel und schreibt die Release-Notizen für Home Assistant.
//
// Aufruf (im Repo-Ordner):
//   node werkzeuge/version-setzen.mjs "Erste Änderung" "Zweite Änderung" …
//
// Die Version ist Datum und Uhrzeit in deutscher Zeit: JJJJ.MM.TT.HHMM, z. B. 2026.11.26.0815.
// Geändert werden:
//   - kinderkunst/config.yaml und kinderkunst-test/config.yaml (Home Assistant erkennt daran das Update)
//   - app/package.json (der Server meldet die Version unter api/status)
//   - kinderkunst/CHANGELOG.md und kinderkunst-test/CHANGELOG.md (Home Assistant zeigt sie als Release-Notizen)
// Notizen in Alltagssprache für die Familie schreiben. Keine Namen, Daten oder anderen persönlichen Angaben.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const ADDONS = ['kinderkunst', 'kinderkunst-test'];
const KOPF = '# Änderungen\n\nDie Versionsnummer ist der Zeitpunkt der Veröffentlichung: Jahr.Monat.Tag.Uhrzeit.\n';

export function datumsVersion(zeit = new Date()) {
  const teile = Object.fromEntries(
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(zeit).map((t) => [t.type, t.value]),
  );
  return `${teile.year}.${teile.month}.${teile.day}.${teile.hour}${teile.minute}`;
}

function datei(pfad) {
  return join(WURZEL, pfad);
}

function setzeConfig(addon, version) {
  const pfad = datei(`${addon}/config.yaml`);
  const alt = readFileSync(pfad, 'utf8');
  if (!/^version: ".*"$/m.test(alt)) throw new Error(`Keine Versionszeile in ${addon}/config.yaml`);
  writeFileSync(pfad, alt.replace(/^version: ".*"$/m, `version: "${version}"`));
}

function setzePaket(version) {
  for (const name of ['app/package.json', 'app/package-lock.json']) {
    const pfad = datei(name);
    if (!existsSync(pfad)) continue;
    const json = JSON.parse(readFileSync(pfad, 'utf8'));
    json.version = version;
    if (json.packages && json.packages['']) json.packages[''].version = version;
    writeFileSync(pfad, JSON.stringify(json, null, 2) + '\n');
  }
}

function schreibeNotizen(addon, version, notizen) {
  const pfad = datei(`${addon}/CHANGELOG.md`);
  const alt = existsSync(pfad) ? readFileSync(pfad, 'utf8') : KOPF;
  const rumpf = alt.startsWith(KOPF) ? alt.slice(KOPF.length) : alt.replace(/^# .*\n+/, '');
  const eintrag = `\n## ${version}\n\n${notizen.map((n) => `- ${n}`).join('\n')}\n`;
  writeFileSync(pfad, KOPF + eintrag + rumpf);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const notizen = process.argv.slice(2).map((n) => n.trim()).filter(Boolean);
  if (!notizen.length) {
    console.error('Bitte mindestens eine Notiz angeben: node werkzeuge/version-setzen.mjs "Was ist neu"');
    process.exit(1);
  }
  const version = datumsVersion();
  for (const addon of ADDONS) {
    setzeConfig(addon, version);
    schreibeNotizen(addon, version, notizen);
  }
  setzePaket(version);
  console.log(`Neue Version ${version}`);
}
