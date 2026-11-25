#!/usr/bin/env python3
"""Aquarell-Hintergründe und Sticker aus den Vorlage-Blättern der Nutzerin aufbereiten.

Aufruf:
  python3 werkzeuge/grafiken/aufbereiten.py HINTERGRUND-BLATT STICKER-BLATT [STICKER-BLATT ...]

Erzeugt app/atelier/aquarell.js mit
  AQ   Aquarell-Hintergründe als WebP-Daten-URLs (aus dem Blatt ausgeschnitten bzw. umgefärbt)
  FAM  Sticker „Familie & Liebe“ als WebP-Daten-URLs mit transparentem Rand

Die Vorlage-Blätter selbst kommen nicht ins Repo (nur die aufbereiteten Grafiken). Es sind gemalte
Illustrationen, keine Fotos von echten Personen. Braucht numpy, scipy und Pillow.
"""
import base64, io, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

WURZEL = Path(__file__).resolve().parents[2]

# Karten auf dem Hintergrund-Blatt (x, y, Breite, Höhe), von Hand vermessen am Blatt vom 25.11.2026 (1792×2388)
KARTEN = {
    'winter': (293, 315, 423, 287),
    'feenwald': (1026, 316, 423, 287),
    'meer': (293, 738, 423, 284),
    'sterne': (1025, 738, 423, 284),
    'sonne': (293, 1383, 423, 286),
    'urzeit': (1025, 1383, 423, 286),
    'goldglanz': (684, 1794, 422, 447),
}
FARBE = {'salbei': '#B2B89D', 'rose': '#E8C1B7', 'terra': '#D28A74', 'senf': '#E6BA72', 'eis': '#A8C3C8', 'stern': '#6B8E9B'}
# Weitere Themen: Form einer Vorlage, umgefärbt in Farben der Palette (rund um die Mitte verteilt)
UMGEFAERBT = {
    'regenbogen': ('urzeit', ['rose', 'senf', 'eis', 'salbei']),
    'jahrmarkt': ('sonne', ['rose', 'terra']),
    'kita': ('feenwald', ['senf', 'eis']),
    'tierpark': ('urzeit', ['salbei', 'terra']),
    'natur': ('feenwald', ['salbei', 'rose']),
    'ostern': ('sonne', ['senf', 'salbei', 'rose']),
    'familie': ('urzeit', ['rose', 'rose', 'terra']),
}


def webp(img, q=82):
    b = io.BytesIO()
    img.save(b, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


def rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)


def umfaerben(karte, farben):
    a = np.asarray(karte.convert('RGB')).astype(float)
    h, w, _ = a.shape
    papier = np.percentile(a.reshape(-1, 3), 99.5, axis=0)  # hellstes Papier
    lum = a.mean(2)
    farbig = (a.max(2) - a.min(2))
    malung = np.clip(((papier.mean() - lum) * 1.4 + farbig * 1.1) / 90, 0, 1)
    malung = nd.gaussian_filter(malung, 0.8)
    yy, xx = np.mgrid[0:h, 0:w]
    winkel = (np.arctan2(yy - h / 2, xx - w / 2) / (2 * np.pi) + 0.5 + 0.08) % 1  # 0..1 rund um die Mitte
    n = len(farben)
    pos = winkel * n
    i0 = np.floor(pos).astype(int) % n
    t = pos - np.floor(pos)
    t = t * t * (3 - 2 * t)
    cs = np.stack([rgb(FARBE[f]) for f in farben])
    farbe = cs[i0] * (1 - t[..., None]) + cs[(i0 + 1) % n] * t[..., None]
    papierfarbe = rgb('#FBF8F2')
    aus = papierfarbe * (1 - malung[..., None] * 0.62) + farbe * (malung[..., None] * 0.62)
    korn = (a.mean(2, keepdims=True) - nd.gaussian_filter(a.mean(2), 3)[..., None]) * 0.6  # Papierstruktur behalten
    return Image.fromarray(np.clip(aus + korn, 0, 255).astype(np.uint8))


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
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    blatt = Image.open(sys.argv[1]).convert('RGB')
    if blatt.size != (1792, 2388):
        sys.exit('Hintergrund-Blatt hat nicht die erwartete Größe 1792×2388; KARTEN neu vermessen.')
    karten = {k: blatt.crop((x, y, x + w, y + h)) for k, (x, y, w, h) in KARTEN.items()}
    aq = {k: webp(v) for k, v in karten.items()}
    for k, (vorlage, farben) in UMGEFAERBT.items():
        aq[k] = webp(umfaerben(karten[vorlage], farben))
    fam = []
    for pfad in sys.argv[2:]:
        fam += [webp(s, 80) for s in sticker_ausschneiden(Image.open(pfad))]
    ziel = WURZEL / 'app' / 'atelier' / 'aquarell.js'
    ziel.write_text(
        '/* Aquarell-Hintergründe (AQ) und Sticker „Familie & Liebe“ (FAM) nach Vorlagen der Nutzerin.\n'
        '   Erzeugt mit werkzeuge/grafiken/aufbereiten.py – nicht von Hand bearbeiten. */\n'
        f'var AQ={json.dumps(aq)};\nvar FAM={json.dumps(fam)};\n', encoding='utf-8')
    print(f'{ziel}: {len(aq)} Hintergründe, {len(fam)} Sticker, {ziel.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
