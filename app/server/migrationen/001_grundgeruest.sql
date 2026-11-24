-- M1: Familie (Mandant, V-01), Benutzer (R-01, R-02) und Medium (F-01, B-01 bis B-07).
-- Zeitstempel als ISO-8601 in UTC.

CREATE TABLE familie (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  angelegt_am TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Vorerst gibt es genau eine Familie.
INSERT INTO familie (id, name) VALUES (1, 'Familie');

CREATE TABLE benutzer (
  id              INTEGER PRIMARY KEY,
  familie_id      INTEGER NOT NULL REFERENCES familie(id),
  kennung         TEXT NOT NULL UNIQUE,   -- Home-Assistant-Benutzer-ID, lokal "dev:<name>"
  name            TEXT,
  anzeigename     TEXT,
  angelegt_am     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  zuletzt_gesehen TEXT
);

CREATE TABLE medium (
  id              INTEGER PRIMARY KEY,
  familie_id      INTEGER NOT NULL REFERENCES familie(id),
  art             TEXT NOT NULL CHECK (art IN ('werkfoto', 'kindfoto', 'profilbild', 'audio', 'sonstiges')),
  mime            TEXT NOT NULL,
  datei           TEXT NOT NULL,          -- Pfad des unveränderten Originals relativ zum Datenordner
  originalname    TEXT,
  groesse         INTEGER NOT NULL,
  sha256          TEXT NOT NULL,
  breite          INTEGER,                -- wird ab M2 beim Hochladen ermittelt
  hoehe           INTEGER,
  dauer_ms        INTEGER,                -- nur Audio
  aufgenommen_am  TEXT,                   -- ab M2 aus EXIF
  exif            TEXT,                   -- JSON
  bearbeitung     TEXT,                   -- JSON mit Bearbeitungsparametern (B-03)
  hochgeladen_von INTEGER REFERENCES benutzer(id),
  hochgeladen_am  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  geaendert_von   INTEGER REFERENCES benutzer(id),
  geaendert_am    TEXT,
  geloescht_am    TEXT,                   -- Papierkorb (B-09)
  UNIQUE (familie_id, sha256)             -- Duplikaterkennung (B-06)
);

CREATE INDEX medium_familie_zeit ON medium (familie_id, hochgeladen_am DESC);
