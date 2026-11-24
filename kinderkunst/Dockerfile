# Home-Assistant-Add-on „Kinderkunst“ – das echte Archiv (A1, A4, A8). Gebaut vom Supervisor auf dem HA-Rechner.
# Seit Supervisor 2026.04 stehen Basis-Image und Argumente direkt hier (kein build.yaml mehr).
# Holt den App-Code aus dem Repo und baut ihn wie app/Dockerfile.
FROM node:24-alpine

# Branch, aus dem gebaut wird. Für Tests eines Feature-Branches hier vorübergehend dessen Namen eintragen.
ARG QUELLE_REF="main"
ARG QUELLE_URL="https://github.com/porodim/kinderkunst.git"

# Fragt den aktuellen Stand aller Branches bei GitHub ab. Ändert er sich, baut „Neu bauen“ den Code frisch.
ADD "https://api.github.com/repos/porodim/kinderkunst/branches" /tmp/quelle-stand.json

RUN apk add --no-cache --virtual .bauwerkzeug git \
 && git clone --depth 1 --branch "${QUELLE_REF}" "${QUELLE_URL}" /quelle \
 && echo "Kinderkunst gebaut aus ${QUELLE_REF} @ $(git -C /quelle rev-parse --short HEAD)" \
 && mv /quelle/app /app \
 && rm -rf /quelle /tmp/quelle-stand.json \
 && apk del .bauwerkzeug

WORKDIR /app
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

ENV NODE_ENV=production \
    PORT=8099 \
    DATEN_DIR=/data \
    KANAL=echt \
    NUR_INGRESS=1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/start.js"]
