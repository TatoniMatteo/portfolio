# syntax=docker/dockerfile:1
#
# Un solo Dockerfile, due immagini (target):
#   --target web          sito statico servito da Caddy (porta 80)
#   --target cv-updater   controlla ogni giorno la release del CV e aggiorna i PDF
#
# I PDF del CV NON sono dentro l'immagine web: stanno in un volume condiviso
# (/cv-data) che il cv-updater tiene aggiornato. Così il sito si aggiorna
# senza ricostruire nulla e nessun token finisce in un'immagine.

# ---- build del frontend ----
FROM --platform=$BUILDPLATFORM node:24-alpine AS build

WORKDIR /app

# Aggiorna i pacchetti Alpine disponibili.
RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---- immagine web ----
FROM caddy:2-alpine AS web

# Aggiorna Alpine e prepara il volume condiviso dei CV.
RUN apk upgrade --no-cache \
    && mkdir -p /cv-data \
    && chown 1000:1000 /cv-data

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://127.0.0.1/ || exit 1


# ---- immagine cv-updater ----
FROM node:24-alpine AS cv-updater

RUN apk upgrade --no-cache \
    && rm -rf \
        /usr/local/lib/node_modules/npm \
        /usr/local/lib/node_modules/corepack \
        /opt/yarn-v1.22.22 \
        /usr/local/bin/npm \
        /usr/local/bin/npx \
        /usr/local/bin/corepack \
        /usr/local/bin/yarn \
        /usr/local/bin/yarnpkg \
    && mkdir -p /cv-data \
    && chown node:node /cv-data

WORKDIR /app

COPY --chown=node:node scripts/fetch-cv.mjs ./fetch-cv.mjs

USER node

ENV CV_OUT_DIR=/cv-data

CMD ["node", "fetch-cv.mjs", "--watch"]
