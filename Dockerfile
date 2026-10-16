# syntax=docker/dockerfile:1
#
# Un solo Dockerfile, due immagini (target):
#   --target web          sito statico servito da Caddy (porta 80)
#   --target cv-updater   controlla la release del CV e aggiorna i PDF
#
# I PDF del CV sono conservati nel volume condiviso /cv-data.
# Il cv-updater li aggiorna senza ricostruire il sito e senza includere token
# nell'immagine web.

# ---- build del frontend ----
FROM --platform=$BUILDPLATFORM node:25-alpine AS build

WORKDIR /app

RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---- build personalizzata di Caddy ----
FROM caddy:2.11.7-builder-alpine AS caddy-build

# Usa una versione Go aggiornata per includere le correzioni di sicurezza.
ENV GOTOOLCHAIN=go1.27.2

# Aggiorna x/net senza registrarlo come plugin Caddy.
# --with non è adatto: x/net non è un plugin importabile da xcaddy.
RUN xcaddy build v2.11.7 \
    --replace golang.org/x/net=golang.org/x/net@v0.61.0 \
    --output /usr/bin/caddy


# ---- immagine web ----
FROM caddy:2.11.7-alpine AS web

# Sostituisce il binario ufficiale con quello ricompilato.
COPY --from=caddy-build /usr/bin/caddy /usr/bin/caddy

RUN apk upgrade --no-cache \
    && mkdir -p /cv-data \
    && chown 1000:1000 /cv-data

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://127.0.0.1/ || exit 1


# ---- immagine cv-updater ----
FROM node:25-alpine AS cv-updater

# Non servono npm, npx, Corepack o Yarn durante l'esecuzione.
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
