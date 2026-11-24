// Öffnet die SQLite-Datenbank und spielt fehlende Migrationen ein (N-05).
// Migrationen sind Dateien "NNN_name.sql" im Ordner migrationen/; der Stand steht in PRAGMA user_version.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONEN = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrationen');

export function oeffneDatenbank(datei) {
  if (datei !== ':memory:') fs.mkdirSync(path.dirname(datei), { recursive: true });
  const db = new DatabaseSync(datei);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  migriere(db);
  return db;
}

export function schemaVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version;
}

export function migriere(db) {
  const ist = schemaVersion(db);
  const dateien = fs.readdirSync(MIGRATIONEN).filter((f) => /^\d{3}_[\w-]+\.sql$/.test(f)).sort();
  for (const datei of dateien) {
    const nummer = Number(datei.slice(0, 3));
    if (nummer <= ist) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONEN, datei), 'utf8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${nummer}`);
      db.exec('COMMIT');
    } catch (fehler) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${datei} fehlgeschlagen: ${fehler.message}`);
    }
  }
  return schemaVersion(db);
}
