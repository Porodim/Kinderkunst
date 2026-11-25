#!/usr/bin/env python3
"""Aquarell-Hintergründe für die Seiten selbst malen (in der Art der Vorlagen der Nutzerin vom 25.11.2026).

Aufruf:
  python3 werkzeuge/grafiken/aquarell-malen.py [--vorschau ORDNER]

Malt 9 Hintergründe (einer je Farbvariante) im Querformat 1600×1131 (Seitenverhältnis A4) und schreibt sie
als WebP-Daten-URLs in die Zeile `var AQ=...` von app/atelier/aquarell.js. Die App dreht sie fürs Hochformat
und dehnt nur die Ränder (aqDraw in index.html). Papierstruktur legt die App selbst darüber.
Reines Rechnen mit Zufallsrauschen (fester Startwert), keine fremden Bilder. Braucht numpy, scipy, Pillow.
"""
import base64, io, json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

WURZEL = Path(__file__).resolve().parents[2]
B, H = 1600, 1131
PAPIER = np.array([251, 248, 242], float)


def hexf(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)


class Maler:
    def __init__(self, saat, b=B, h=H):
        self.r = np.random.default_rng(saat)
        self.b, self.h = b, h
        yy, xx = np.mgrid[0:h, 0:b]
        self.x, self.y = xx / b, yy / h
        # Abstand zum nächsten Rand, in Bildhöhen gemessen (Ecken etwas runder)
        dx = np.minimum(self.x, 1 - self.x) * b / h
        dy = np.minimum(self.y, 1 - self.y)
        self.rand = np.minimum(dx, dy) * 0.75 + np.sqrt(dx * dy) * 0.25
        self.bild = np.ones((h, b, 3)) * PAPIER

    def rauschen(self, groesse, oktaven=4):
        """Weiches fraktales Rauschen, Mittel 0, ungefähr ±1."""
        f = np.zeros((self.h, self.b))
        amp, gs = 1.0, groesse
        for _ in range(oktaven):
            n = nd.gaussian_filter(self.r.standard_normal((self.h, self.b)), gs * self.h, mode='wrap')
            f += amp * n / (n.std() + 1e-9)
            amp *= 0.5
            gs *= 0.45
        return f / 1.6

    def lasur(self, menge, farbe, kanten=0.35):
        """Eine Farbschicht auflegen: menge 0..1 je Bildpunkt. Am Rand der Fläche sammelt sich mehr Farbe (Wasserrand)."""
        farbe = hexf(farbe) if isinstance(farbe, str) else farbe
        menge = np.clip(menge, 0, 1)
        grad = np.hypot(*np.gradient(nd.gaussian_filter(menge, 2)))
        rand = np.clip(grad * self.h * 0.012, 0, 1) * kanten
        a = np.clip(menge * 0.75 + rand, 0, 1)[..., None]
        # subtraktiv mischen wie Pigment
        self.bild = self.bild * (1 - a) + self.bild * (farbe / 255) * a

    def rahmen(self, breite, zacken=0.05, weich=0.03, papierrand=0.022):
        """Fläche entlang der Ränder mit unregelmäßiger Innenkante und schmalem unbemaltem Papierrand außen."""
        innen = breite + self.rauschen(0.05) * zacken + self.rauschen(0.012, 2) * zacken * 0.4
        m = np.clip((innen - self.rand) / weich, 0, 1)
        aussen = papierrand + self.rauschen(0.02, 2) * papierrand * 0.35
        m *= np.clip((self.rand - aussen) / 0.004, 0, 1)
        return m

    def wolkig(self, m, staerke=0.35, groesse=0.08):
        return m * np.clip(1 - staerke + self.rauschen(groesse) * staerke, 0, 1.2)

    def koernung(self, staerke=4):
        g = nd.gaussian_filter(self.r.standard_normal((self.h, self.b)), 0.8)
        self.bild += (g / g.std() * staerke)[..., None] * (self.bild.mean(2, keepdims=True) < 248)

    def punkte(self, n, farbe, groesse, dichte=None, glanz=False):
        """Sterne/Glitzer: kleine weiche Punkte, wahlweise mit vier Strahlen."""
        farbe = hexf(farbe)
        for _ in range(n):
            px, py = self.r.random(), self.r.random()
            if dichte is not None and self.r.random() > dichte(px, py):
                continue
            s = groesse * (0.4 + self.r.random() ** 2 * 1.6)
            cx, cy = px * self.b, py * self.h
            x0, x1 = int(max(0, cx - s * 8)), int(min(self.b, cx + s * 8))
            y0, y1 = int(max(0, cy - s * 8)), int(min(self.h, cy + s * 8))
            if x1 <= x0 or y1 <= y0:
                continue
            yy, xx = np.mgrid[y0:y1, x0:x1]
            dx, dy = xx - cx, yy - cy
            a = np.exp(-(dx * dx + dy * dy) / (2 * s * s))
            if glanz and s > groesse * 0.9:
                a = np.maximum(a, np.exp(-np.abs(dx) / (s * 0.35) - (dy / (s * 5)) ** 2) * 0.9)
                a = np.maximum(a, np.exp(-np.abs(dy) / (s * 0.35) - (dx / (s * 5)) ** 2) * 0.9)
            a = np.clip(a, 0, 1)[..., None] * 0.95
            self.bild[y0:y1, x0:x1] = self.bild[y0:y1, x0:x1] * (1 - a) + farbe * a

    def linie(self, pkte, farbe, breite, deckung=0.8):
        """Feine goldene Schwungline entlang einer Bézierkurve (Punkte in 0..1)."""
        farbe = hexf(farbe)
        p = np.array(pkte, float) * [self.b, self.h]
        t = np.linspace(0, 1, 900)[:, None]
        k = ((1 - t) ** 3 * p[0] + 3 * (1 - t) ** 2 * t * p[1] + 3 * (1 - t) * t * t * p[2] + t ** 3 * p[3])
        m = np.zeros((self.h, self.b))
        for (cx, cy), tt in zip(k, t[:, 0]):
            if 0 <= cx < self.b and 0 <= cy < self.h:
                m[int(cy), int(cx)] = np.sin(tt * np.pi) ** 0.5
        m = nd.gaussian_filter(m, breite) * breite * 5
        a = np.clip(m, 0, 1)[..., None] * deckung
        self.bild = self.bild * (1 - a) + farbe * a

    def fertig(self):
        return Image.fromarray(np.clip(self.bild, 0, 255).astype(np.uint8))


def rahmen_bild(saat, farben, breite=0.2, staerke=0.55, zweite=None):
    m = Maler(saat)
    r = m.rahmen(breite)
    # Farbe wandert rund um die Mitte
    w = (np.arctan2(m.y - 0.5, (m.x - 0.5) * B / H) / (2 * np.pi) + 0.5 + m.rauschen(0.15, 2) * 0.05) % 1
    n = len(farben)
    cs = np.stack([hexf(f) for f in farben])
    pos = w * n
    i0 = np.floor(pos).astype(int) % n
    t = pos - np.floor(pos)
    t = t * t * (3 - 2 * t)
    farbe = cs[i0] * (1 - t[..., None]) + cs[(i0 + 1) % n] * t[..., None]
    m.lasur(m.wolkig(r, 0.45) * staerke, farbe)
    r2 = m.rahmen(breite * 0.55, zacken=0.07)
    m.lasur(m.wolkig(r2, 0.6, 0.05) * staerke * 0.55, zweite and hexf(zweite) or farbe)
    m.koernung(2.5)
    return m


def feenwald():
    return rahmen_bild(11, ['#B9C3A2', '#A9B48F', '#C8CFB0', '#AEB896'], 0.21, 0.42).fertig()


def sonne():
    return rahmen_bild(12, ['#F2D488', '#EECB78', '#F5DE9E'], 0.2, 0.45).fertig()


def urzeit():
    return rahmen_bild(13, ['#E7A88C', '#DC9378', '#EDB89C', '#E29F83'], 0.24, 0.6).fertig()


def familie():
    return rahmen_bild(14, ['#ECBDB2', '#E3A79A', '#F0C9C0', '#E6B0A6'], 0.23, 0.55).fertig()


def regenbogen():
    return rahmen_bild(15, ['#E8B4A8', '#EFCB86', '#B8D0B0', '#A9C7D2', '#C6B8D8'], 0.22, 0.55).fertig()


def winter():
    m = rahmen_bild(16, ['#D4D2EC', '#C9D6EC', '#DCD6EE'], 0.18, 0.5)
    m.punkte(320, '#B9C4E0', 1.6, dichte=lambda x, y: 1 - min(1, min(x, 1 - x, y, 1 - y) * 5))
    m.punkte(160, '#FFFFFF', 2.4, dichte=lambda x, y: 1 - min(1, min(x, 1 - x, y, 1 - y) * 5))
    return m.fertig()


def meer():
    m = Maler(17)
    papier = m.rahmen(2, zacken=0)
    unten = np.clip((m.y - 0.3) / 0.65, 0, 1) ** 1.4 + m.rauschen(0.08) * 0.08 + np.sin(m.x * 7 + m.rauschen(0.12) * 2.5) * 0.035
    flaeche = np.clip(unten * 1.1 + m.rahmen(0.1, zacken=0.04) * 0.3, 0, 1) * papier
    m.lasur(m.wolkig(flaeche, 0.18, 0.12) * 0.85, '#94C4D4')
    wellen = np.clip((m.y - 0.66) / 0.3 + np.sin(m.x * 13 + m.rauschen(0.1) * 3) * 0.08 + m.rauschen(0.07) * 0.12, 0, 1)
    m.lasur(wellen * 0.65 * papier, '#6AA6BE', kanten=0.5)
    m.koernung(2.5)
    return m.fertig()


def sterne():
    m = Maler(18)
    papier = m.rahmen(2, zacken=0)
    oben = np.clip(1.08 - m.y * 1.2 + m.rauschen(0.12) * 0.1, 0, 1)
    m.lasur(m.wolkig(oben * papier, 0.12, 0.15) * 0.95, '#7383AC')
    m.lasur(np.clip(oben - 0.4, 0, 1) * 1.2 * m.wolkig(papier, 0.2, 0.12) * 0.75, '#53628F', kanten=0.3)
    wolken = np.clip(0.5 - np.abs(m.y - 0.7) * 2.4 + m.rauschen(0.09) * 0.25, 0, 1) * papier
    m.lasur(wolken * 0.3, '#CBC5DF')
    m.punkte(650, '#FFF6DA', 1.5, dichte=lambda x, y: max(0.0, 1 - y * 1.35))
    m.punkte(40, '#F3D990', 3.4, dichte=lambda x, y: max(0.0, 1 - y * 1.4), glanz=True)
    m.koernung(2.5)
    return m.fertig()


def goldglanz():
    m = Maler(19)
    ecken = (np.exp(-((m.x - 1.0) ** 2 / 0.07 + (m.y - 0.0) ** 2 / 0.12))
             + np.exp(-((m.x - 0.0) ** 2 / 0.07 + (m.y - 1.0) ** 2 / 0.14)) * 1.1
             + np.exp(-((m.x - 0.0) ** 2 / 0.025 + (m.y - 0.0) ** 2 / 0.04)) * 0.6
             + np.exp(-((m.x - 1.0) ** 2 / 0.02 + (m.y - 1.0) ** 2 / 0.03)) * 0.5)
    flaeche = np.clip(ecken * 1.2 + m.rauschen(0.05) * 0.08 - 0.05, 0, 1)
    m.lasur(m.wolkig(flaeche, 0.45, 0.05) * 0.85, '#AFC6DF')
    m.lasur(m.wolkig(m.rahmen(0.32, zacken=0.08, papierrand=0), 0.5) * 0.3, '#F0E0B4')
    gold = '#C59C45'
    schwuenge = [[(0.0, 0.17), (0.04, 0.07), (0.1, 0.03), (0.19, 0.01)],
                 [(0.02, 0.25), (0.06, 0.12), (0.14, 0.07), (0.24, 0.05)],
                 [(0.8, 0.0), (0.88, 0.04), (0.95, 0.1), (0.99, 0.2)],
                 [(0.0, 0.8), (0.05, 0.9), (0.11, 0.95), (0.2, 0.99)],
                 [(0.78, 0.99), (0.88, 0.96), (0.95, 0.9), (0.99, 0.79)],
                 [(0.7, 0.98), (0.83, 0.92), (0.91, 0.84), (0.96, 0.72)]]
    for k, pk in enumerate(schwuenge):
        m.linie(pk, gold, 0.75, 0.75 if k % 2 == 0 else 0.5)
    ecke = lambda x, y: 1.0 if min(np.hypot(x, y), np.hypot(1 - x, y), np.hypot(x, 1 - y), np.hypot(1 - x, 1 - y)) < 0.26 else 0.0
    m.punkte(320, '#D6B460', 1.2, dichte=ecke)
    m.punkte(16, '#C59C45', 4.2, dichte=ecke, glanz=True)
    m.koernung(2.5)
    return m.fertig()


MOTIVE = {'feenwald': feenwald, 'meer': meer, 'regenbogen': regenbogen, 'urzeit': urzeit, 'sterne': sterne,
          'goldglanz': goldglanz, 'sonne': sonne, 'winter': winter, 'familie': familie}


def main():
    vorschau = sys.argv[sys.argv.index('--vorschau') + 1] if '--vorschau' in sys.argv else None
    nur = [a for a in sys.argv[1:] if a in MOTIVE] or list(MOTIVE)
    aq = {}
    for k in nur:
        bild = MOTIVE[k]()
        if vorschau:
            Path(vorschau).mkdir(parents=True, exist_ok=True)
            bild.save(Path(vorschau) / f'{k}.png')
        b = io.BytesIO()
        bild.save(b, 'WEBP', quality=80, method=6)
        aq[k] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
        print(k, len(b.getvalue()) // 1024, 'KB')
    if vorschau and len(nur) < len(MOTIVE):
        return
    ziel = WURZEL / 'app' / 'atelier' / 'aquarell.js'
    text = ziel.read_text(encoding='utf-8')
    neu = re.sub(r'^var AQ=.*$', lambda _: f'var AQ={json.dumps(aq)};', text, count=1, flags=re.M)
    ziel.write_text(neu, encoding='utf-8')
    print(f'{ziel}: {ziel.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
