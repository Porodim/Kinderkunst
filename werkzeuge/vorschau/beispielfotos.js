/* Nur für die Vorschau-Seite bei Claude (wird von werkzeuge/vorschau-bauen.mjs eingebunden, nicht auf Home Assistant).
 *
 * In der Claude-App auf dem Handy lässt sich auf der Vorschau-Seite oft keine Datei auswählen. Damit man trotzdem
 * Bildbearbeitung und das automatische Datum ausprobieren kann, erzeugt dieser Knopf im Archiv drei erfundene
 * Beispielfotos (gemalt mit Canvas, keine echten Bilder) samt eingebettetem Aufnahmedatum (EXIF) und gibt sie
 * genau so an die App wie Fotos aus der Galerie.
 */
(() => {
  const BEISPIELE = [
    { name: 'beispiel-haus.jpg', datum: '2023:06:12 10:15:00', malen: hausAufPapier },
    { name: 'beispiel-regenbogen.jpg', datum: '2024:12:20 16:40:00', malen: regenbogenImSchatten },
    { name: 'beispiel-turm.jpg', datum: '2025:09:03 11:05:00', malen: bausteinTurm },
  ];

  // Zufall mit festem Startwert, damit die Bilder immer gleich aussehen
  let saat = 7;
  const zufall = () => ((saat = (saat * 16807) % 2147483647) - 1) / 2147483646;
  const wackel = (n) => (zufall() - 0.5) * n;

  function tisch(x, w, h) {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#a77b52');
    g.addColorStop(1, '#7d5634');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.18;
    for (let y = 0; y < h; y += 9) {
      x.strokeStyle = zufall() > 0.5 ? '#5a3b22' : '#c49a6c';
      x.lineWidth = 1 + zufall() * 3;
      x.beginPath();
      x.moveTo(0, y + wackel(6));
      x.bezierCurveTo(w / 3, y + wackel(14), (2 * w) / 3, y + wackel(14), w, y + wackel(6));
      x.stroke();
    }
    x.globalAlpha = 1;
  }

  // Stiftstrich mit leichtem Zittern wie bei Kinderhand
  function strich(x, punkte, farbe, breite) {
    x.strokeStyle = farbe;
    x.lineWidth = breite;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.beginPath();
    punkte.forEach(([px, py], i) => (i ? x.lineTo(px + wackel(5), py + wackel(5)) : x.moveTo(px, py)));
    x.stroke();
  }
  function kreis(x, cx, cy, r, farbe, breite, fuellen) {
    const p = [];
    for (let i = 0; i <= 36; i++) p.push([cx + Math.cos(i / 5.73) * r, cy + Math.sin(i / 5.73) * r]);
    if (fuellen) {
      x.fillStyle = fuellen;
      x.beginPath();
      p.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
      x.fill();
    }
    strich(x, p, farbe, breite);
  }

  // Blatt Papier, schräg auf dem Tisch, mit Schatten; zeichne() malt im Blatt (0..bw, 0..bh)
  function blatt(x, mx, my, bw, bh, winkel, zeichne, licht = 1) {
    x.save();
    x.translate(mx, my);
    x.rotate(winkel);
    x.transform(1, 0, -0.06, 1, 0, 0); // etwas schief, wie von schräg oben fotografiert
    x.shadowColor = 'rgba(0,0,0,.35)';
    x.shadowBlur = 30;
    x.shadowOffsetY = 12;
    x.fillStyle = `rgb(${Math.round(238 * licht)},${Math.round(234 * licht)},${Math.round(226 * licht)})`;
    x.fillRect(-bw / 2, -bh / 2, bw, bh);
    x.shadowColor = 'transparent';
    x.translate(-bw / 2, -bh / 2);
    zeichne(x, bw, bh);
    x.restore();
  }

  function hausAufPapier(x, w, h) {
    tisch(x, w, h);
    blatt(x, w / 2, h / 2, 1000, 720, -0.09, (b) => {
      kreis(b, 830, 130, 70, '#e2a21c', 10, '#f3c745');
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        strich(b, [[830 + Math.cos(a) * 95, 130 + Math.sin(a) * 95], [830 + Math.cos(a) * 140, 130 + Math.sin(a) * 140]], '#e2a21c', 8);
      }
      b.fillStyle = 'rgba(210,90,70,.75)';
      b.fillRect(270, 330, 300, 260);
      strich(b, [[270, 330], [570, 330], [570, 590], [270, 590], [270, 330]], '#b3412f', 9);
      strich(b, [[240, 340], [420, 180], [600, 340], [240, 340]], '#6b4a8e', 10);
      strich(b, [[390, 590], [390, 470], [460, 470], [460, 590]], '#5b3a1e', 8);
      kreis(b, 510, 400, 30, '#3b7fb0', 7, '#9fd0ee');
      strich(b, [[40, 650], [200, 630], [380, 655], [560, 628], [760, 652], [960, 630]], '#4f9a3c', 14);
      for (const fx of [690, 790, 880]) {
        strich(b, [[fx, 650], [fx, 540]], '#4f9a3c', 7);
        kreis(b, fx, 525, 22, '#d6487e', 7, '#f08bb0');
      }
    });
  }

  function regenbogenImSchatten(x, w, h) {
    tisch(x, w, h);
    blatt(x, w / 2 + 30, h / 2, 980, 700, 0.06, (b) => {
      ['#d9443a', '#ee8a2e', '#efcd33', '#5aa646', '#3b82c4', '#7a4fa8'].forEach((f, i) => {
        const p = [];
        for (let k = 0; k <= 30; k++) {
          const a = Math.PI + (k / 30) * Math.PI;
          p.push([490 + Math.cos(a) * (380 - i * 34), 560 + Math.sin(a) * (380 - i * 34)]);
        }
        strich(b, p, f, 26);
      });
      for (const [cx, cy] of [[150, 560], [830, 560]]) {
        kreis(b, cx, cy, 70, '#8fa9b8', 6, '#ffffff');
        kreis(b, cx + 70, cy + 10, 55, '#8fa9b8', 6, '#ffffff');
        kreis(b, cx - 60, cy + 15, 50, '#8fa9b8', 6, '#ffffff');
      }
    }, 0.78);
    // Schatten vom Handy über einer Ecke: zum Ausprobieren von „Papier aufhellen“
    const g = x.createRadialGradient(w * 0.1, h * 0.95, 50, w * 0.1, h * 0.95, w * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,.42)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }

  function bausteinTurm(x, w, h) {
    tisch(x, w, h);
    const farben = ['#D28A74', '#E6BA72', '#A8C3C8', '#B2B89D', '#E8C1B7', '#6B8E9B'];
    let y = h - 220;
    for (let i = 0; i < 9; i++) {
      const bw = 300 - (i % 3) * 40;
      const bx = w / 2 - bw / 2 + wackel(40);
      x.fillStyle = farben[i % farben.length];
      x.shadowColor = 'rgba(0,0,0,.3)';
      x.shadowBlur = 14;
      x.fillRect(bx, y, bw, 110);
      x.shadowColor = 'transparent';
      x.fillStyle = 'rgba(255,255,255,.18)';
      x.fillRect(bx, y, bw, 18);
      for (let n = 0; n < bw / 75 - 0.5; n++) {
        x.fillStyle = farben[i % farben.length];
        x.fillRect(bx + 20 + n * 75, y - 22, 48, 24);
        x.fillStyle = 'rgba(0,0,0,.12)';
        x.fillRect(bx + 20 + n * 75, y - 4, 48, 4);
      }
      y -= 118;
    }
  }

  // EXIF-Block mit Aufnahmedatum direkt nach dem JPEG-Anfang einsetzen
  function mitDatum(jpeg, datum) {
    const tiff = new Uint8Array(8 + 2 + 12 + 4 + 2 + 12 + 4 + 20);
    const v = new DataView(tiff.buffer);
    tiff.set([0x49, 0x49], 0);
    v.setUint16(2, 42, true);
    v.setUint32(4, 8, true);
    v.setUint16(8, 1, true);
    const exifIfd = 8 + 2 + 12 + 4;
    v.setUint16(10, 0x8769, true);
    v.setUint16(12, 4, true);
    v.setUint32(14, 1, true);
    v.setUint32(18, exifIfd, true);
    v.setUint16(exifIfd, 1, true);
    const stelle = exifIfd + 2 + 12 + 4;
    v.setUint16(exifIfd + 2, 0x9003, true);
    v.setUint16(exifIfd + 4, 2, true);
    v.setUint32(exifIfd + 6, 20, true);
    v.setUint32(exifIfd + 10, stelle, true);
    for (let i = 0; i < datum.length; i++) tiff[stelle + i] = datum.charCodeAt(i);
    const kopf = [0xff, 0xe1, 0, 0, 0x45, 0x78, 0x69, 0x66, 0, 0];
    const laenge = kopf.length - 2 + tiff.length;
    kopf[2] = laenge >> 8;
    kopf[3] = laenge & 255;
    const aus = new Uint8Array(2 + kopf.length + tiff.length + jpeg.length - 2);
    aus.set(jpeg.subarray(0, 2), 0);
    aus.set(kopf, 2);
    aus.set(tiff, 2 + kopf.length);
    aus.set(jpeg.subarray(2), 2 + kopf.length + tiff.length);
    return aus;
  }

  async function erzeugen() {
    saat = 7;
    const dateien = [];
    for (const b of BEISPIELE) {
      const hoch = b.malen === bausteinTurm;
      const c = document.createElement('canvas');
      c.width = hoch ? 1200 : 1600;
      c.height = hoch ? 1600 : 1200;
      b.malen(c.getContext('2d'), c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
      const roh = new Uint8Array(await blob.arrayBuffer());
      const [j, m, t] = b.datum.slice(0, 10).split(':').map(Number);
      dateien.push(new File([mitDatum(roh, b.datum)], b.name, { type: 'image/jpeg', lastModified: new Date(j, m - 1, t, 12).getTime() }));
    }
    return dateien;
  }

  // Knopf im Archiv neben „Kamera“ und „Fotos wählen“
  const archivAlt = vGal;
  vGal = function () {
    const html = archivAlt();
    if (S.ui.ak || !kidOf(S.ui.kid)) return html;
    return html.replace(
      '<small id="ast">',
      '<div class="tp">Vorschau: Lässt sich hier kein Foto auswählen? Dann nimm drei erfundene Beispielfotos, um Bearbeiten und Datum auszuprobieren. <button class="chip" data-a="bsp" style="margin-left:4px">Beispielfotos</button></div><small id="ast">',
    );
  };
  act.bsp = async () => addFiles(await erzeugen());
})();
