-- M2 Archiv: Kinder (K-01, K-02), Werke (W-02 bis W-13), Gemeinschaftswerke (W-04),
-- Storys mit Text und Audio (W-07, W-08, W-08a), Tags (W-09).
-- Alter und Sternzeichen werden nicht gespeichert, sondern berechnet (K-03, W-06).

CREATE TABLE kind (
  id             INTEGER PRIMARY KEY,
  familie_id     INTEGER NOT NULL REFERENCES familie(id),
  name           TEXT NOT NULL,
  spitzname      TEXT,
  geburtsdatum   TEXT,                    -- JJJJ-MM-TT
  farbe          TEXT,                    -- Profilfarbe aus der Palette, z. B. "#D28A74"
  profilbild_id  INTEGER REFERENCES medium(id),
  reihenfolge    INTEGER NOT NULL DEFAULT 0,
  archiviert_am  TEXT,
  angelegt_von   INTEGER REFERENCES benutzer(id),
  angelegt_am    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  geaendert_von  INTEGER REFERENCES benutzer(id),
  geaendert_am   TEXT
);

CREATE TABLE werk (
  id                 INTEGER PRIMARY KEY,
  familie_id         INTEGER NOT NULL REFERENCES familie(id),
  titel              TEXT,
  art                TEXT NOT NULL DEFAULT 'bild' CHECK (art IN ('bild', 'basteln', 'lego', 'kapla', 'sonstiges')),
  datum              TEXT,                -- Entstehungsdatum JJJJ-MM-TT
  datum_genauigkeit  TEXT NOT NULL DEFAULT 'tag' CHECK (datum_genauigkeit IN ('tag', 'monat', 'ungefaehr')),
  datum_quelle       TEXT CHECK (datum_quelle IN ('exif', 'datei', 'heute', 'manuell')),
  favorit            INTEGER NOT NULL DEFAULT 0,
  angelegt_von       INTEGER REFERENCES benutzer(id),
  angelegt_am        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  geaendert_von      INTEGER REFERENCES benutzer(id),
  geaendert_am       TEXT,
  geloescht_am       TEXT                 -- Papierkorb (B-09)
);
CREATE INDEX werk_familie_datum ON werk (familie_id, datum DESC, id DESC);

-- Gemeinschaftswerk: Reihenfolge bestimmt die Anzeige, Beitrag optional ("gemalt", "mitgeholfen" …).
CREATE TABLE werk_kind (
  werk_id      INTEGER NOT NULL REFERENCES werk(id) ON DELETE CASCADE,
  kind_id      INTEGER NOT NULL REFERENCES kind(id),
  beitrag      TEXT,
  reihenfolge  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (werk_id, kind_id)
);
CREATE INDEX werk_kind_kind ON werk_kind (kind_id);

-- Fotos eines Werks; das Foto mit der kleinsten Reihenfolge ist das Titelbild.
CREATE TABLE werk_medium (
  werk_id      INTEGER NOT NULL REFERENCES werk(id) ON DELETE CASCADE,
  medium_id    INTEGER NOT NULL REFERENCES medium(id),
  reihenfolge  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (werk_id, medium_id)
);
CREATE INDEX werk_medium_medium ON werk_medium (medium_id);

CREATE TABLE story (
  id                 INTEGER PRIMARY KEY,
  werk_id            INTEGER NOT NULL REFERENCES werk(id) ON DELETE CASCADE,
  text               TEXT,
  audio_id           INTEGER REFERENCES medium(id),
  erzaehler_kind_id  INTEGER REFERENCES kind(id),
  reihenfolge        INTEGER NOT NULL DEFAULT 0,
  angelegt_von       INTEGER REFERENCES benutzer(id),
  angelegt_am        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  geaendert_von      INTEGER REFERENCES benutzer(id),
  geaendert_am       TEXT
);
CREATE INDEX story_werk ON story (werk_id);

CREATE TABLE tag (
  id          INTEGER PRIMARY KEY,
  familie_id  INTEGER NOT NULL REFERENCES familie(id),
  name        TEXT NOT NULL COLLATE NOCASE,
  UNIQUE (familie_id, name)
);

CREATE TABLE werk_tag (
  werk_id  INTEGER NOT NULL REFERENCES werk(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (werk_id, tag_id)
);
CREATE INDEX werk_tag_tag ON werk_tag (tag_id);
