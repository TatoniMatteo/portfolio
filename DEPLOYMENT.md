# Deployment

Il sito gira come due immagini Docker (`web` e `cv-updater`), costruite e
pubblicate su GitHub Container Registry a ogni push su `main`. Questa guida
copre il setup iniziale e le operazioni di tutti i giorni.

## Setup iniziale (una tantum)

1. **GitHub App per il CV (consigliata, senza rinnovi manuali dei token).**
   In [Settings → Developer settings → GitHub Apps](https://github.com/settings/apps/new)
   crea un'app privata: Homepage URL del portfolio, webhook disabilitato,
   **Repository permissions → Contents: Read-only**, installabile solo sul tuo account.
   Non servono callback OAuth o un server pubblico per l'app.
   Da **Install App**, installala solo su `TatoniMatteo/CV`.
   In **General**, annota il **Client ID** (va bene anche l'App ID) e genera una
   private key. Il container userà la chiave per generare token temporanei e
   rinnovarli automaticamente quando necessario. La chiave non ha una scadenza
   automatica, ma può essere ruotata o revocata nelle impostazioni dell'app.

2. **Immagini pubbliche su GHCR.**
   Rendi pubblici i package `portfolio` e `portfolio-cv-updater` dalle rispettive
   impostazioni: il server potrà scaricarli senza login al registry.

3. **Solo i file di deploy sul server.**
   Non serve clonare il repository. Copia `docker-compose.yml`,
   `docker-compose.github-app.yml` e `.env.example` in una cartella sul server:
   ```bash
   cp .env.example .env
   mkdir -p secrets
   chmod 700 secrets
   ```
   Copia la private key in `secrets/cv-app.pem` e rendila leggibile solo
   all'utente del container (UID 1000):
   ```bash
   sudo chown 1000:1000 secrets/cv-app.pem
   sudo chmod 400 secrets/cv-app.pem
   ```
   Nel `.env` imposta:
   ```dotenv
   CV_APP_ID=il_client_id_della_app
   CV_APP_PRIVATE_KEY_PATH=./secrets/cv-app.pem
   COMPOSE_FILE=docker-compose.yml:docker-compose.github-app.yml
   CV_REPO_TOKEN=
   ```
   `COMPOSE_FILE` abilita l'override per tutti i comandi Compose su Linux.
   La chiave viene montata come secret in sola lettura solo nell'updater:
   non viene inclusa nelle immagini o nel container web. `secrets/`, `*.pem`
   e `*.key` sono esclusi da Git e dal contesto di build Docker.

4. **Scarica e avvia le immagini.**
   ```bash
   docker compose pull
   docker compose up -d --no-build
   docker compose logs cv-updater
   ```
   Il sito risponde in HTTP sulla porta `WEB_PORT` (default `8080`). I token
   dell'app restano in memoria: anche dopo giorni di inattività o un riavvio,
   l'updater ne genera uno valido prima di contattare GitHub.

   **Alternativa PAT:** senza app, lascia `CV_APP_ID` vuoto e non impostare
   `COMPOSE_FILE`. Basta il Compose principale e `CV_REPO_TOKEN`, un fine-grained
   PAT con **Contents: Read-only** sul solo repository CV. Il PAT deve essere
   sostituito alla scadenza; la GitHub App evita questa operazione periodica.

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
   per la CI — non serve più lì, le credenziali vivono solo sul server.

## Operazioni quotidiane

| Cosa | Comando |
|---|---|
| Aggiornare il sito all'ultima immagine | `docker compose pull && docker compose up -d --no-build` |
| Tornare a una versione precedente | imposta `IMAGE_TAG=sha-<commit>` nel `.env`, poi `docker compose pull && docker compose up -d --no-build` |
| Forzare subito un controllo del CV | `docker compose restart cv-updater` |
| Stato dei servizi | `docker compose ps` |
| Log del CV | `docker compose logs -f cv-updater` |
| Log del sito | `docker compose logs -f web` |

## Rotazione della chiave della GitHub App

Genera una nuova private key nelle impostazioni della GitHub App, sostituisci
`secrets/cv-app.pem` e riapplica proprietario e permessi (`1000:1000`, `400`).
Poi ricrea il solo updater per montare il nuovo file:

```bash
docker compose up -d --no-build --no-deps --force-recreate cv-updater
docker compose logs cv-updater
```

Dopo aver verificato un controllo riuscito, revoca la vecchia chiave su GitHub.
La ricreazione serve perché i secret di Compose sono file montati dall'host:
una sostituzione tramite rinomina potrebbe lasciare il container collegato
al vecchio file. Il volume dei PDF viene conservato.

## Nomi dei PDF riconosciuti

`fetch-cv.mjs` individua la lingua dal nome dell'asset nella release: deve
contenere `IT`/`ITA`/`italiano` oppure `EN`/`ENG`/`english` (separati da
`-`, `_`, `.` o spazio) — es. `CV-Matteo-Tatoni-IT.pdf`. Se i tuoi file
hanno nomi diversi, imposta `CV_IT_PATTERN` / `CV_EN_PATTERN` come variabili
d'ambiente del servizio `cv-updater` in `docker-compose.yml`.

## Troubleshooting

- **Il CV non si aggiorna.**
  Guarda i log
  (`docker compose logs cv-updater`): quasi sempre è un token scaduto/errato
  (401), permessi della GitHub App (403/404), chiave non leggibile
  dal container (EACCES) o una release senza PDF riconoscibili.
- **Il sito risponde ma senza CV.**
  Normale al primissimo avvio finché `cv-updater` non ha completato il
  primo download; dopo, indica lo stesso problema del punto sopra.
- **Serve rivedere cosa è cambiato nel progetto rispetto a prima.**
  Vedi [`CHANGELOG.md`](./CHANGELOG.md).

Documentazione GitHub: [token di installazione](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app),
[chiavi private](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps).
