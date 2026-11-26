// Alter, Sternzeichen und Datumsanzeige (K-03, W-05, W-06). Aus alt/index.html übernommen (age, sage, zod)
// und um die Datumsgenauigkeit ergänzt. Läuft im Browser und auf dem Server.

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function teile(datum) {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum || '');
  return treffer ? { j: Number(treffer[1]), m: Number(treffer[2]), t: Number(treffer[3]) } : null;
}

export function heute() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function istDatum(datum) {
  const d = teile(datum);
  if (!d) return false;
  const probe = new Date(d.j, d.m - 1, d.t);
  return probe.getFullYear() === d.j && probe.getMonth() === d.m - 1 && probe.getDate() === d.t;
}

// Alter als { jahre, monate, tage } am Tag "datum" (Vorgabe heute); null wenn unbekannt oder vor der Geburt.
export function alter(geburtsdatum, datum = heute()) {
  const b = teile(geburtsdatum);
  const a = teile(datum);
  if (!b || !a) return null;
  if (a.j * 10000 + a.m * 100 + a.t < b.j * 10000 + b.m * 100 + b.t) return null;
  let jahre = a.j - b.j;
  let monate = a.m - b.m;
  let tage = a.t - b.t;
  if (tage < 0) {
    monate--;
    tage += new Date(a.j, a.m - 1, 0).getDate();
  }
  if (monate < 0) {
    jahre--;
    monate += 12;
  }
  return { jahre, monate, tage };
}

// Kurzform für Raster und Listen: "4 J. 3 Mo.", "7 Mo.", "12 T.", bei "ungefaehr" "ca. 4 J.".
export function alterKurz(geburtsdatum, datum, genauigkeit = 'tag') {
  const a = alter(geburtsdatum, datum);
  if (!a) return '';
  if (genauigkeit === 'ungefaehr') return a.jahre ? `ca. ${a.jahre} J.` : `ca. ${a.monate} Mo.`;
  if (a.jahre) return a.monate ? `${a.jahre} J. ${a.monate} Mo.` : `${a.jahre} J.`;
  if (a.monate) return `${a.monate} Mo.`;
  return genauigkeit === 'monat' ? '0 Mo.' : `${a.tage} T.`;
}

// Langform wie in der alten App: "4 Jahre, 3 Monate, 2 Tage".
export function alterLang(geburtsdatum, datum = heute()) {
  const a = alter(geburtsdatum, datum);
  if (!a) return '';
  const p = [];
  if (a.jahre) p.push(`${a.jahre} ${a.jahre === 1 ? 'Jahr' : 'Jahre'}`);
  if (a.monate || (!a.jahre && !a.tage)) p.push(`${a.monate} ${a.monate === 1 ? 'Monat' : 'Monate'}`);
  if (a.tage) p.push(`${a.tage} ${a.tage === 1 ? 'Tag' : 'Tage'}`);
  return p.join(', ');
}

const ZEICHEN = [
  ['Steinbock', '♑', 1, 19], ['Wassermann', '♒', 2, 18], ['Fische', '♓', 3, 20], ['Widder', '♈', 4, 19],
  ['Stier', '♉', 5, 20], ['Zwillinge', '♊', 6, 21], ['Krebs', '♋', 7, 22], ['Löwe', '♌', 8, 22],
  ['Jungfrau', '♍', 9, 22], ['Waage', '♎', 10, 22], ['Skorpion', '♏', 11, 21], ['Schütze', '♐', 12, 21],
  ['Steinbock', '♑', 12, 31],
];

export function sternzeichen(geburtsdatum) {
  const d = teile(geburtsdatum);
  if (!d) return '';
  for (const [name, symbol, monat, tag] of ZEICHEN) if (d.m < monat || (d.m === monat && d.t <= tag)) return `${symbol} ${name}`;
  return '';
}

// "3. März 2026", "März 2026" oder "ca. März 2026".
export function datumText(datum, genauigkeit = 'tag') {
  const d = teile(datum);
  if (!d) return '';
  const monat = `${MONATE[d.m - 1]} ${d.j}`;
  if (genauigkeit === 'monat') return monat;
  if (genauigkeit === 'ungefaehr') return `ca. ${monat}`;
  return `${d.t}. ${monat}`;
}

// Lebensjahr (0, 1, 2 …) für den Zeitstrahl "Mit 4 Jahren" (D-04).
export function lebensjahr(geburtsdatum, datum) {
  const a = alter(geburtsdatum, datum);
  return a ? a.jahre : null;
}
