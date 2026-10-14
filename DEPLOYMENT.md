# Deployment

Il sito gira come due immagini Docker (`web` e `cv-updater`), costruite e
pubblicate su GitHub Container Registry a ogni push su `main`. Questa guida
copre il setup iniziale e le operazioni di tutti i giorni.

## Setup iniziale (una tantum)

1. **Token per il repository del CV.**
   Su https://github.com/settings/personal-access-tokens/new crea un token
   fine-grained: *Only select repositories* → `TatoniMatteo/CV`, permesso
   **Contents: Read-only**. Scadenza massima 1 anno: quando scade, il
   container `cv-updater` smette di aggiornarsi (vedi "Troubleshooting"),
   basta rigenerarlo.

2. **Visibilità dei package.**
   Dopo la prima build su GitHub Actions, in *Packages* del repo rendi
   pubbliche `portfolio` e `portfolio-cv-updater` (Package settings →
   *Change visibility*): contengono solo il sito già pubblico, e così il
   server non ha bisogno di autenticarsi per scaricarle. Se preferisci
   tenerle private, sul server serve `docker login ghcr.io` con un token
   **classic** con scope `read:packages` (i fine-grained non bastano per
   GHCR).

3. **Sul server.**
   ```bash
   git clone https://github.com/TatoniMatteo/portfolio.git
   cd portfolio
   cp .env.example .env
   ```
   Apri `.env` e imposta `CV_REPO_TOKEN` (il token del punto 1). Le altre
   variabili hanno già un default sensato.

4. **Avvio.**
   ```bash
   docker compose pull
   docker compose up -d
   ```
   Il container `web` risponde in HTTP sulla porta `WEB_PORT` (default
   `8080`).

5. **HTTPS e dominio.**
   Il container `web` parla solo HTTP: davanti ci va un reverse proxy o un
   tunnel che gestisce TLS per `portfolio.matato.it.eu.org` (es. un altro
   Caddy sul server con `reverse_proxy localhost:8080`, oppure Cloudflare
   Tunnel). Non è incluso in questo repo perché dipende da come è
   configurato il resto del tuo home server.

6. **Pulizia del vecchio deploy.**
   Una volta verificato che il sito risponde dal server: in Settings →
   Pages imposta *Unpublish*, cancella il branch `gh-pages` se esiste
   ancora, e rimuovi l'eventuale secret `CV_REPO_TOKEN` salvato in passato
   per la CI — non serve più lì, il token vive solo nel `.env` del server.

## Operazioni quotidiane

| Cosa | Comando |
|---|---|
| Aggiornare il sito all'ultima immagine | `docker compose pull && docker compose up -d` |
| Tornare a una versione precedente | imposta `IMAGE_TAG=sha-<commit>` nel `.env`, poi `docker compose up -d` |
| Forzare subito un controllo del CV | `docker compose restart cv-updater` |
| Stato dei servizi | `docker compose ps` |
| Log del CV | `docker compose logs -f cv-updater` |
| Log del sito | `docker compose logs -f web` |

## Nomi dei PDF riconosciuti

`fetch-cv.mjs` individua la lingua dal nome dell'asset nella release: deve
contenere `IT`/`ITA`/`italiano` oppure `EN`/`ENG`/`english` (separati da
`-`, `_`, `.` o spazio) — es. `CV-Matteo-Tatoni-IT.pdf`. Se i tuoi file
hanno nomi diversi, imposta `CV_IT_PATTERN` / `CV_EN_PATTERN` come variabili
d'ambiente del servizio `cv-updater` in `docker-compose.yml`.

## Troubleshooting

- **`docker compose ps` mostra `cv-updater` come `unhealthy`.**
  Mancano uno o entrambi i PDF nel volume. Guarda i log
  (`docker compose logs cv-updater`): quasi sempre è un token scaduto/errato
  (401) o una release senza PDF riconoscibili.
- **Il sito risponde ma senza CV.**
  Normale al primissimo avvio finché `cv-updater` non ha completato il
  primo download; dopo, indica lo stesso problema del punto sopra.
- **Serve rivedere cosa è cambiato nel progetto rispetto a prima.**
  Vedi [`CHANGELOG.md`](./CHANGELOG.md).
