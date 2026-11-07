# syntax=docker/dockerfile:1
#
# Un'unica immagine e un container: Caddy e updater CV gestiti da start.mjs.
# I PDF e le credenziali restano sul server, fuori dall'immagine.

# ---- build del frontend ----
FROM --platform=$BUILDPLATFORM node:24.22.2-alpine AS build

WORKDIR /app

RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
RUN npm ci

# Solo gli input del frontend: gli script del CV e i file di deploy
# non devono invalidare la cache di questa build.
COPY index.html tsconfig*.json vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build


# ---- build personalizzata di Caddy ----
FROM caddy:2.11.7-builder-alpine AS caddy-build

# Usa una versione Go aggiornata per includere le correzioni di sicurezza.
ENV GOTOOLCHAIN=go1.27.3

# Aggiorna x/net senza registrarlo come plugin Caddy.
# --with non è adatto: x/net non è un plugin importabile da xcaddy.
RUN xcaddy build v2.11.7 \
    --replace golang.org/x/net=golang.org/x/net@v0.62.0 \
    --replace github.com/go-jose/go-jose/v4=github.com/go-jose/go-jose/v4@v4.1.6 \
    --output /usr/bin/caddy


# ---- immagine runtime ----
FROM node:24.22.2-alpine AS runtime

COPY --from=caddy-build /usr/bin/caddy /usr/bin/caddy

# Il runtime richiede solo Node e Caddy, senza package manager.
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
    && mkdir -p /cv-data /data/caddy /config/caddy \
    && chown -R node:node /cv-data /data /config

WORKDIR /app

COPY --chown=node:node scripts/cv/fetch-cv.mjs scripts/cv/github-auth.mjs ./
COPY --chown=node:node docker/start.mjs ./
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/target/dist /srv

USER node

ENV CV_OUT_DIR=/cv-data \
    XDG_DATA_HOME=/data \
    XDG_CONFIG_HOME=/config

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

CMD ["node", "start.mjs"]
