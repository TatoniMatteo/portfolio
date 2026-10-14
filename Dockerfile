# syntax=docker/dockerfile:1
#
# Un solo Dockerfile, due immagini (target):
#   --target web          sito statico servito da Caddy      (porta 80)
#   --target cv-updater   controlla ogni giorno la release del CV e aggiorna i PDF
#
# I PDF del CV NON sono dentro l'immagine web: stanno in un volume condiviso
# (/cv-data) che il cv-updater tiene aggiornato. Così il sito si aggiorna
# senza ricostruire nulla e nessun token finisce in un'immagine.

# ---- build del frontend (gira sempre sulla piattaforma del builder: veloce anche per arm64) ----
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---- immagine web ----
FROM caddy:2-alpine AS web

# Volume dei CV: uid 1000 = utente "node" del cv-updater, così il volume
# nominato nasce scrivibile da lui, qualunque container venga creato per primo.
RUN mkdir -p /cv-data && chown 1000:1000 /cv-data

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://127.0.0.1/ || exit 1


# ---- immagine cv-updater ----
FROM node:22-alpine AS cv-updater
WORKDIR /app

RUN mkdir -p /cv-data && chown node:node /cv-data
COPY --chown=node:node scripts/fetch-cv.mjs ./fetch-cv.mjs

USER node
ENV CV_OUT_DIR=/cv-data \
    CV_CHECK_INTERVAL_HOURS=24

# "sano" = entrambi i PDF presenti (segnala subito token errato o release senza CV)
HEALTHCHECK --interval=15m --timeout=3s --start-period=2m \
    CMD test -f /cv-data/cv-it.pdf && test -f /cv-data/cv-en.pdf || exit 1

CMD ["node", "fetch-cv.mjs", "--watch"]
