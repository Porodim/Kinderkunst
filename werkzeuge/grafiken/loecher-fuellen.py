"""Löcher in Stickern füllen (25.11.2026).

Einige Sticker der alten App haben weiße Flächen im Inneren (Wolke, Schaf, Schneemann, Leinwand …), die beim
Freistellen durchsichtig geworden sind. Auf farbigen Hintergründen sieht das wie ein Loch aus.
Dieses Werkzeug sucht in allen Stickern `"nX_Y": "data:image/webp;base64,…"` aus app/atelier/index.html
durchsichtige Flächen, die ringsum vom Sticker eingeschlossen sind, und füllt sie mit Papierweiß.
Kanten werden weich über Weiß gelegt. Flächen, die bis zum Bildrand reichen (echter Hintergrund), bleiben frei.

Sticker aus vielen Einzelteilen (Luftschlangen) haben große, offene Lücken im weißen Trägerpapier. Für die in
SCHLIESSEN genannten wird ein geschlossener weißer Träger unter das ganze Motiv gelegt.

Aufruf: python3 werkzeuge/grafiken/loecher-fuellen.py [--vorschau ORDNER]
"""
import base64, io, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

WURZEL = Path(__file__).resolve().parents[2]
WEISS = np.array([253, 251, 247], float)
SCHLIESSEN = {'n10_3': 11}  # Sticker-ID: Radius in Bildpunkten, mit dem die Lücken zwischen den Teilen geschlossen werden


def scheibe(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def traeger(png, r):
    """Geschlossenes weißes Trägerpapier mit zartem grauem Rand unter das ganze Motiv legen."""
    a = np.array(png.convert('RGBA')).astype(float)
    pad = r + 3
    m = np.pad(a[..., 3] > 40, pad)
    m = nd.binary_fill_holes(nd.binary_erosion(nd.binary_dilation(m, scheibe(r)), scheibe(r - 2)))
    m = m[pad:-pad, pad:-pad] | (a[..., 3] > 40)
    weich = np.clip(nd.gaussian_filter(m.astype(float), 0.8) * 1.15, 0, 1)
    rand = np.clip(weich - np.clip(nd.gaussian_filter(nd.binary_erosion(m, iterations=2).astype(float), 0.8), 0, 1), 0, 1)
    unten = np.zeros_like(a)
    unten[..., :3] = WEISS * (1 - rand[..., None] * 0.6) + np.array([214, 209, 203]) * rand[..., None] * 0.6
    unten[..., 3] = weich * 255
    oa = a[..., 3:4] / 255
    neu = unten.copy()
    neu[..., :3] = a[..., :3] * oa + unten[..., :3] * (1 - oa)
    neu[..., 3] = np.maximum(a[..., 3], unten[..., 3])
    return Image.fromarray(np.clip(neu, 0, 255).astype(np.uint8))


def fuellen(png):
    a = np.array(png.convert('RGBA')).astype(float)
    tr = a[..., 3] < 128
    lab, n = nd.label(tr)
    rand = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    loch = np.isin(lab, [i for i in range(1, n + 1) if i not in rand])
    if not loch.any():
        return None, 0
    bereich = nd.binary_dilation(loch, iterations=2) & ~nd.binary_dilation(~nd.binary_fill_holes(~tr) & tr, iterations=1)
    bereich |= loch
    al = a[..., 3:4] / 255
    neu = a.copy()
    neu[..., :3] = np.where(bereich[..., None], a[..., :3] * al + WEISS * (1 - al), a[..., :3])
    neu[..., 3] = np.where(bereich, 255, a[..., 3])
    return Image.fromarray(np.clip(neu, 0, 255).astype(np.uint8)), int(loch.sum())


def main():
    vorschau = Path(sys.argv[sys.argv.index('--vorschau') + 1]) if '--vorschau' in sys.argv else None
    ziel = WURZEL / 'app' / 'atelier' / 'index.html'
    text = ziel.read_text(encoding='utf-8')
    geaendert = 0

    def ersetzen(m):
        nonlocal geaendert
        bild = Image.open(io.BytesIO(base64.b64decode(m.group(2))))
        if m.group(1) in SCHLIESSEN and not np.array(bild.convert('RGBA'))[..., 3].min() == 255:
            geschlossen = traeger(bild, SCHLIESSEN[m.group(1)])
            if (np.array(geschlossen)[..., 3] > 128).sum() > (np.array(bild.convert('RGBA'))[..., 3] > 128).sum() * 1.02:
                bild_neu, _ = fuellen(geschlossen)
                neu, flaeche = bild_neu or geschlossen, 1
                return speichern(m, bild, neu, flaeche)
        neu, flaeche = fuellen(bild)
        if neu is None:
            return m.group(0)
        return speichern(m, bild, neu, flaeche)

    def speichern(m, bild, neu, flaeche):
        nonlocal geaendert
        geaendert += 1
        print(f'{m.group(1)}: {flaeche} Bildpunkte gefüllt')
        if vorschau:
            vorschau.mkdir(parents=True, exist_ok=True)
            bild.save(vorschau / f'{m.group(1)}-vorher.png')
            neu.save(vorschau / f'{m.group(1)}-nachher.png')
        b = io.BytesIO()
        neu.save(b, 'WEBP', quality=90, alpha_quality=100, method=6)
        return f'"{m.group(1)}": "data:image/webp;base64,{base64.b64encode(b.getvalue()).decode()}"'

    text = re.sub(r'"(n\d+_\d+)": "data:image/webp;base64,([A-Za-z0-9+/=]+)"', ersetzen, text)
    if not vorschau:
        ziel.write_text(text, encoding='utf-8')
    print(geaendert, 'Sticker geändert')


if __name__ == '__main__':
    main()
