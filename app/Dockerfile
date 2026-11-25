# Normaler Docker-Container der App (V-03, A1). Unabhängig von Home Assistant lauffähig:
#   docker build -t kinderkunst app/
#   docker run -p 8099:8099 -v kinderkunst-daten:/data -e DEV_BENUTZER=Testperson kinderkunst
FROM node:24-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server ./server
COPY web ./web
COPY atelier ./atelier

ENV NODE_ENV=production \
    PORT=8099 \
    DATEN_DIR=/data
EXPOSE 8099
VOLUME ["/data"]
CMD ["node", "--disable-warning=ExperimentalWarning", "server/start.js"]
