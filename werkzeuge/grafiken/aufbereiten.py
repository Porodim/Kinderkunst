#!/usr/bin/env python3
"""Sticker „Familie & Liebe“ aus den Sticker-Blättern der Nutzerin ausschneiden.

Aufruf:
  python3 werkzeuge/grafiken/aufbereiten.py STICKER-BLATT [STICKER-BLATT ...]

Schreibt die Zeile `var FAM=[...]` in app/atelier/aquarell.js (WebP-Daten-URLs mit transparentem Rand).
Die Hintergründe (`var AQ`) malt werkzeuge/grafiken/aquarell-malen.py.
Die Blätter selbst kommen nicht ins Repo. Es sind gemalte Illustrationen, keine Fotos von echten Personen.
Braucht numpy, scipy und Pillow.
"""
import base64, io, json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

WURZEL = Path(__file__).resolve().parents[2]

def webp(img, q=82):
    b = io.BytesIO()
    img.save(b, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


def sticker_ausschneiden(blatt, groesse=320):
    a = np.asarray(blatt.convert('RGB')).astype(float)
    weiss = np.percentile(a.reshape(-1, 3), 90, axis=0)
    abw = (weiss - a).max(2)
    maske = nd.binary_fill_holes(nd.binary_closing(abw > 10, iterations=3))
    maske = nd.binary_opening(maske, iterations=2)
    lab, n = nd.label(maske)
    teile = []
    for i, sl in enumerate(nd.find_objects(lab)):
        hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if hh * ww < 20000:
            continue
        m = (lab[sl] == i + 1)
        alpha = nd.gaussian_filter(m.astype(float), 0.7)
        rgba = np.dstack([a[sl], np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
        img = Image.fromarray(rgba, 'RGBA')
        img = img.crop(img.getbbox())
        k = groesse / max(img.size)
        img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
        teile.append(((sl[0].start // 400, sl[1].start), img))  # Reihenfolge: Zeilen, dann Spalten
    teile.sort(key=lambda t: t[0])
    return [t[1] for t in teile]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    fam = []
    for pfad in sys.argv[1:]:
        fam += [webp(s, 80) for s in sticker_ausschneiden(Image.open(pfad))]
    ziel = WURZEL / 'app' / 'atelier' / 'aquarell.js'
    text = ziel.read_text(encoding='utf-8')
    neu = re.sub(r'^var FAM=.*$', lambda _: f'var FAM={json.dumps(fam)};', text, count=1, flags=re.M)
    ziel.write_text(neu, encoding='utf-8')
    print(f'{ziel}: {len(fam)} Sticker, {ziel.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
