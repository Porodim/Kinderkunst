# Dünne Hülle (A1, A8): holt den App-Code aus dem Repo und baut ihn wie app/Dockerfile.
# Der Schritt mit ADD fragt den aktuellen Stand des Branches bei GitHub ab; ändert er sich,
# baut „Neu bauen“ in Home Assistant den Code frisch, auch ohne neue Versionsnummer.
ARG BUILD_FROM=node:24-alpine
FROM ${BUILD_FROM}

ARG QUELLE_REF=main
ARG QUELLE_URL=https://github.com/porodim/kinderkunst.git
ADD "https://api.github.com/repos/porodim/kinderkunst/git/refs/heads/${QUELLE_REF}" /tmp/quelle-stand.json

RUN apk add --no-cache --virtual .bauwerkzeug git \
 && git clone --depth 1 --branch "${QUELLE_REF}" "${QUELLE_URL}" /quelle \
 && mv /quelle/app /app \
 && rm -rf /quelle /tmp/quelle-stand.json \
 && apk del .bauwerkzeug

WORKDIR /app
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

ENV NODE_ENV=production \
    PORT=8099 \
    DATEN_DIR=/data \
    KANAL=test \
    NUR_INGRESS=1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/start.js"]
