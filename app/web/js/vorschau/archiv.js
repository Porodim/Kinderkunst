// Vorschau-Nachbildung von routen/kinder.js, routen/werke.js, routen/storys.js und werke-lesen.js.
// Gleiche Felder, gleiche Prüfungen, gleiche Fehlermeldungen (geprüft in test/vertrag.test.js).
import { istDatum } from '../alter.js';
import { BENUTZER, daten, fehler, jetzt, text, ganzzahl } from './speicher.js';

const WERK_ARTEN = ['bild', 'basteln', 'lego', 'kapla', 'sonstiges'];
const GENAUIGKEITEN = ['tag', 'monat', 'ungefaehr'];
const QUELLEN = ['exif', 'datei', 'heute', 'manuell'];

// ---------- Kinder ----------

function kindAusgabe(k) {
  const anzahl = daten.werke.filter((w) => !w.geloescht_am && w.kinder.some((x) => x.id === k.id)).length;
  const { id, name, spitzname, geburtsdatum, farbe, profilbild_id, reihenfolge, archiviert_am } = k;
  return { id, name, spitzname, geburtsdatum, farbe, profilbild_id, reihenfolge, archiviert_am, anzahl_werke: anzahl };
}

function pruefeKind(d, alt = {}) {
  const z = { ...alt, ...d };
  const name = text(z.name, 80);
  if (!name) throw fehler(400, 'Bitte einen Namen eingeben');
  const geburtsdatum = text(z.geburtsdatum, 10);
  if (geburtsdatum && !istDatum(geburtsdatum)) throw fehler(400, 'Geburtsdatum ist ungültig');
  const farbe = text(z.farbe, 7);
  if (farbe && !/^#[0-9a-fA-F]{6}$/.test(farbe)) throw fehler(400, 'Farbe ist ungültig');
  const profilbild = z.profilbild_id == null ? null : ganzzahl(z.profilbild_id);
  if (profilbild && !daten.medien.some((m) => m.id === profilbild && m.art !== 'audio')) throw fehler(400, 'Profilbild nicht gefunden');
  return { name, spitzname: text(z.spitzname, 40), geburtsdatum, farbe, profilbild_id: profilbild };
}

export function kinderListe(query) {
  const alle = query.get('archivierte') === '1';
  return { kinder: daten.kinder.filter((k) => alle || !k.archiviert_am).sort((a, b) => a.reihenfolge - b.reihenfolge || a.id - b.id).map(kindAusgabe) };
}

export function kindAnlegen(d) {
  const k = pruefeKind(d);
  const kind = { id: daten.ids.kind++, ...k, reihenfolge: Math.max(0, ...daten.kinder.map((x) => x.reihenfolge)) + 1, archiviert_am: null };
  daten.kinder.push(kind);
  return { kind: kindAusgabe(kind) };
}

export function kindAendern(id, d) {
  const alt = daten.kinder.find((k) => k.id === Number(id));
  if (!alt) throw fehler(404, 'Kind nicht gefunden');
  const k = pruefeKind(d, alt);
  const archiviert = d.archiviert === undefined ? alt.archiviert_am : d.archiviert ? alt.archiviert_am || jetzt() : null;
  Object.assign(alt, k, { archiviert_am: archiviert });
  return { kind: kindAusgabe(alt) };
}

// ---------- Werke lesen ----------

function sortierDatum(w) {
  return w.datum || w.angelegt_am.slice(0, 10);
}

function tagName(name) {
  return daten.tagNamen.get(name.toLowerCase()) || name;
}

function werkAusgabe(w) {
  const kinder = w.kinder.map(({ id, beitrag }) => {
    const k = daten.kinder.find((x) => x.id === id);
    return { id, name: k.name, spitzname: k.spitzname, farbe: k.farbe, geburtsdatum: k.geburtsdatum, beitrag };
  });
  const storys = daten.storys.filter((s) => s.werk_id === w.id);
  const { medien, kinder: _k, tags, ...rest } = w;
  return {
    ...rest,
    favorit: Boolean(w.favorit),
    titelbild_id: medien[0] ?? null,
    anzahl_fotos: medien.length,
    kinder,
    tags: tags.map(tagName).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    anzahl_storys: storys.length,
    hat_audio: storys.some((s) => s.audio_id),
    hat_text: storys.some((s) => s.text),
    unvollstaendig: kinder.length === 0,
  };
}

function plusJahre(datum, jahre) {
  return `${String(Number(datum.slice(0, 4)) + jahre).padStart(4, '0')}${datum.slice(4)}`;
}

export function werkeListe(query) {
  const kind = ganzzahl(query.get('kind'));
  const alterRoh = query.get('alter');
  const alter = alterRoh === null || alterRoh === '' ? null : Number(alterRoh);
  const art = WERK_ARTEN.includes(query.get('art')) ? query.get('art') : null;
  const tag = text(query.get('tag'), 40)?.toLowerCase();
  const suche = text(query.get('suche'), 100)?.toLowerCase();
  const papierkorb = query.get('papierkorb') === '1';
  const bd = kind ? daten.kinder.find((k) => k.id === kind)?.geburtsdatum : null;

  const treffer = daten.werke.filter((w) => {
    if (papierkorb ? !w.geloescht_am : w.geloescht_am) return false;
    if (kind && !w.kinder.some((k) => k.id === kind)) return false;
    if (kind && Number.isInteger(alter) && bd && !(w.datum >= plusJahre(bd, alter) && w.datum < plusJahre(bd, alter + 1))) return false;
    if (art && w.art !== art) return false;
    if (tag && !w.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (query.get('favorit') === '1' && !w.favorit) return false;
    if (query.get('unvollstaendig') === '1' && w.kinder.length) return false;
    if (suche) {
      const inStory = daten.storys.some((s) => s.werk_id === w.id && (s.text || '').toLowerCase().includes(suche));
      if (!(w.titel || '').toLowerCase().includes(suche) && !inStory && !w.tags.some((t) => t.toLowerCase().includes(suche))) return false;
    }
    return true;
  });
  treffer.sort((a, b) => (sortierDatum(a) < sortierDatum(b) ? 1 : sortierDatum(a) > sortierDatum(b) ? -1 : b.id - a.id));
  const anzahl = Math.min(200, Math.max(1, Number(query.get('anzahl')) || 60));
  const ab = Math.max(0, Number(query.get('ab')) || 0);
  const seite = treffer.slice(ab, ab + anzahl);
  return { werke: seite.map(werkAusgabe), gesamt: treffer.length, mehr: ab + seite.length < treffer.length };
}

export function werkDetail(id, { auchGeloescht = true } = {}, mediumAusgabe) {
  const w = daten.werke.find((x) => x.id === Number(id) && (auchGeloescht || !x.geloescht_am));
  if (!w) throw fehler(404, 'Werk nicht gefunden');
  const werk = werkAusgabe(w);
  werk.medien = w.medien.map((mid, i) => ({ ...mediumAusgabe(daten.medien.find((m) => m.id === mid)), reihenfolge: i }));
  werk.storys = daten.storys
    .filter((s) => s.werk_id === w.id)
    .sort((a, b) => a.reihenfolge - b.reihenfolge || a.id - b.id)
    .map((s) => {
      const audio = s.audio_id ? daten.medien.find((m) => m.id === s.audio_id) : null;
      return {
        id: s.id, text: s.text, erzaehler_kind_id: s.erzaehler_kind_id, reihenfolge: s.reihenfolge, angelegt_am: s.angelegt_am,
        angelegt_von: BENUTZER.anzeigename, audio_id: audio?.id ?? null, audio_dauer_ms: audio?.dauer_ms ?? null, audio_mime: audio?.mime ?? null,
      };
    });
  return { werk };
}

// ---------- Werke schreiben ----------

function pruefeWerk(d, neu) {
  const f = {};
  if (neu || 'titel' in d) f.titel = text(d.titel, 120);
  if (neu || 'art' in d) {
    f.art = d.art ?? 'bild';
    if (!WERK_ARTEN.includes(f.art)) throw fehler(400, 'Unbekannte Werkart');
  }
  if (neu || 'datum' in d) {
    f.datum = text(d.datum, 10);
    if (f.datum && !istDatum(f.datum)) throw fehler(400, 'Datum ist ungültig');
  }
  if (neu || 'datum_genauigkeit' in d) {
    f.datum_genauigkeit = d.datum_genauigkeit ?? 'tag';
    if (!GENAUIGKEITEN.includes(f.datum_genauigkeit)) throw fehler(400, 'Unbekannte Datumsgenauigkeit');
  }
  if (neu || 'datum_quelle' in d) {
    f.datum_quelle = d.datum_quelle ?? 'manuell';
    if (!QUELLEN.includes(f.datum_quelle)) throw fehler(400, 'Unbekannte Datumsquelle');
  } else if ('datum' in d) {
    f.datum_quelle = 'manuell';
  }
  if (neu || 'favorit' in d) f.favorit = d.favorit ? 1 : 0;
  if (neu || 'medien' in d) {
    if (!Array.isArray(d.medien) || !d.medien.length) throw fehler(400, 'Ein Werk braucht mindestens ein Foto');
    f.medien = [...new Set(d.medien.map(ganzzahl))];
    if (f.medien.some((m) => !m || !daten.medien.some((x) => x.id === m && x.art !== 'audio'))) throw fehler(400, 'Foto nicht gefunden');
  }
  if (neu || 'kinder' in d) {
    f.kinder = [];
    for (const eintrag of Array.isArray(d.kinder) ? d.kinder : []) {
      const id = ganzzahl(typeof eintrag === 'object' && eintrag ? eintrag.id : eintrag);
      if (!id || !daten.kinder.some((k) => k.id === id)) throw fehler(400, 'Kind nicht gefunden');
      if (f.kinder.some((k) => k.id === id)) continue;
      f.kinder.push({ id, beitrag: typeof eintrag === 'object' ? text(eintrag.beitrag, 40) : null });
    }
  }
  if (neu || 'tags' in d) {
    f.tags = [];
    for (const t of Array.isArray(d.tags) ? d.tags : []) {
      const name = text(t, 40);
      if (name && !f.tags.some((x) => x.toLowerCase() === name.toLowerCase()) && f.tags.length < 30) f.tags.push(name);
    }
  }
  return f;
}

function merkeTags(tags) {
  for (const t of tags) if (!daten.tagNamen.has(t.toLowerCase())) daten.tagNamen.set(t.toLowerCase(), t);
  for (const schluessel of [...daten.tagNamen.keys()]) {
    if (!daten.werke.some((w) => w.tags.some((t) => t.toLowerCase() === schluessel))) daten.tagNamen.delete(schluessel);
  }
}

export function werkAnlegen(d, mediumAusgabe) {
  const f = pruefeWerk(d, true);
  const story = d.story ? pruefeStory(d.story) : null;
  const werk = { id: daten.ids.werk++, ...f, angelegt_am: jetzt(), geaendert_am: null, geloescht_am: null, angelegt_von: BENUTZER.anzeigename, geaendert_von: null };
  daten.werke.push(werk);
  merkeTags(f.tags);
  if (story) legeStoryAn(werk.id, story);
  return werkDetail(werk.id, { auchGeloescht: false }, mediumAusgabe);
}

export function werkAendern(id, d, mediumAusgabe) {
  const w = daten.werke.find((x) => x.id === Number(id) && !x.geloescht_am);
  if (!w) throw fehler(404, 'Werk nicht gefunden');
  const f = pruefeWerk(d, false);
  Object.assign(w, f, { geaendert_am: jetzt(), geaendert_von: BENUTZER.anzeigename });
  if (f.tags) merkeTags(f.tags);
  return werkDetail(w.id, { auchGeloescht: false }, mediumAusgabe);
}

export function werkLoeschen(id) {
  const w = daten.werke.find((x) => x.id === Number(id) && !x.geloescht_am);
  if (!w) throw fehler(404, 'Werk nicht gefunden');
  w.geloescht_am = jetzt();
  return { geloescht: true, verwendungen: [], tage_im_papierkorb: 30 };
}

export function werkWiederherstellen(id, mediumAusgabe) {
  const w = daten.werke.find((x) => x.id === Number(id));
  if (!w) throw fehler(404, 'Werk nicht gefunden');
  w.geloescht_am = null;
  return werkDetail(w.id, { auchGeloescht: false }, mediumAusgabe);
}

export function tagsListe() {
  const zaehler = new Map();
  for (const w of daten.werke.filter((x) => !x.geloescht_am)) {
    for (const t of w.tags) zaehler.set(tagName(t), (zaehler.get(tagName(t)) || 0) + 1);
  }
  const tags = [...zaehler].map(([name, anzahl]) => ({ name, anzahl }));
  tags.sort((a, b) => b.anzahl - a.anzahl || a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return { tags };
}

// ---------- Storys ----------

function pruefeStory(d, alt = {}) {
  const z = { ...alt, ...d };
  const s = {
    text: text(z.text, 5000),
    audio_id: z.audio_id == null ? null : ganzzahl(z.audio_id),
    erzaehler_kind_id: z.erzaehler_kind_id == null ? null : ganzzahl(z.erzaehler_kind_id),
  };
  if (!s.text && !s.audio_id) throw fehler(400, 'Story braucht Text oder eine Aufnahme');
  if (s.audio_id && !daten.medien.some((m) => m.id === s.audio_id && m.art === 'audio')) throw fehler(400, 'Aufnahme nicht gefunden');
  if (s.erzaehler_kind_id && !daten.kinder.some((k) => k.id === s.erzaehler_kind_id)) throw fehler(400, 'Kind nicht gefunden');
  return s;
}

function legeStoryAn(werkId, s) {
  const reihenfolge = Math.max(0, ...daten.storys.filter((x) => x.werk_id === werkId).map((x) => x.reihenfolge)) + 1;
  const story = { id: daten.ids.story++, werk_id: werkId, ...s, reihenfolge, angelegt_am: jetzt() };
  daten.storys.push(story);
  return story.id;
}

export function storyAnlegen(werkId, d) {
  const w = daten.werke.find((x) => x.id === Number(werkId) && !x.geloescht_am);
  if (!w) throw fehler(404, 'Werk nicht gefunden');
  return { id: legeStoryAn(w.id, pruefeStory(d)) };
}

function ladeStory(id) {
  const s = daten.storys.find((x) => x.id === Number(id));
  if (!s || daten.werke.find((w) => w.id === s.werk_id)?.geloescht_am) throw fehler(404, 'Story nicht gefunden');
  return s;
}

export function storyAendern(id, d) {
  const s = ladeStory(id);
  Object.assign(s, pruefeStory(d, s));
  return { id: s.id };
}

export function storyLoeschen(id) {
  const s = ladeStory(id);
  daten.storys.splice(daten.storys.indexOf(s), 1);
  return { geloescht: true };
}
