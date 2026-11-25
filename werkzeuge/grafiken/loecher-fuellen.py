"""Löcher in Stickern füllen (25.11.2026).

Einige Sticker der alten App haben weiße Flächen im Inneren (Wolke, Schaf, Schneemann, Leinwand …), die beim
Freistellen durchsichtig geworden sind. Auf farbigen Hintergründen sieht das wie ein Loch aus.
Dieses Werkzeug sucht in allen Stickern `"nX_Y": "data:image/webp;base64,…"` aus app/atelier/index.html
durchsichtige Flächen, die ringsum vom Sticker eingeschlossen sind, und füllt sie mit Papierweiß.
Kanten werden weich über Weiß gelegt. Flächen, die bis zum Bildrand reichen (echter Hintergrund), bleiben frei.

Aufruf: python3 werkzeuge/grafiken/loecher-fuellen.py [--vorschau ORDNER]
"""
import base64, io, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

WURZEL = Path(__file__).resolve().parents[2]
WEISS = np.array([253, 251, 247], float)


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
        neu, flaeche = fuellen(bild)
        if neu is None:
            return m.group(0)
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
