-- Kinderkunst-Atelier (die App der Nutzerin, app/atelier/): gemeinsamer Zustand beider Eltern.
-- Kinder, Fotos (mit Verweisen auf Medien-Dateien) und Seiten als JSON, wie die App sie verwendet.
-- Revision verhindert, dass ein Gerät die Änderungen des anderen überschreibt.

CREATE TABLE atelier_zustand (
  familie_id     INTEGER PRIMARY KEY REFERENCES familie(id),
  revision       INTEGER NOT NULL,
  daten          TEXT NOT NULL,
  geaendert_von  INTEGER REFERENCES benutzer(id),
  geaendert_am   TEXT NOT NULL
);

-- Sicherungskopien früherer Stände (höchstens eine pro 15 Minuten, die letzten 200 bleiben).
CREATE TABLE atelier_sicherung (
  id           INTEGER PRIMARY KEY,
  familie_id   INTEGER NOT NULL REFERENCES familie(id),
  revision     INTEGER NOT NULL,
  daten        TEXT NOT NULL,
  gesichert_am TEXT NOT NULL
);
CREATE INDEX atelier_sicherung_zeit ON atelier_sicherung (familie_id, gesichert_am DESC);
