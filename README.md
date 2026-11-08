<div align="center">

<a href="https://portfolio.matato.it.eu.org">
  <img src="public/favicon.svg" alt="MT — Matteo Tatoni" width="120" height="120" />
</a>

# Matteo Tatoni · Portfolio

Projects, experience and open source contributions. Available in English and Italian.

![React](https://img.shields.io/badge/React-20232a?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

**[Live website ↗](https://portfolio.matato.it.eu.org)**

</div>

---

## Local development

Requires **Node.js 24** and **npm**.

```bash
npm ci
npm run dev -- --port 0
```

`--port 0` lets the operating system select an available port. Open the local URL
printed by Vite in the terminal; the port can change on each start.

To preview a production build with an automatically selected port:

```bash
npm run build
npm run preview -- --port 0
```

Styles use a single [SASS theme](src/styles/main.scss), with tokens in
`src/styles/_tokens.scss` and light/dark modes in `src/styles/_themes.scss`.
Translations live in `src/i18n/locales/`.
Open Source repositories are discovered automatically from public GitHub contributions;
the layout adapts automatically.
CV downloads support a GitHub App with automatic token renewal, a PAT or GitHub CLI authentication.

| Command           | Description                                 |
|:------------------|:--------------------------------------------|
| `npm run build`   | Production build in `target/dist/`          |
| `npm run preview -- --port 0` | Preview the production build on an available port |
| `npm run lint`    | Type-aware linting with Oxlint              |
| `npm run test:report` | Open the HTML report in `target/playwright-report/` |
| `npm run clean`   | Remove generated builds, reports and caches |

## Project layout

```text
src/                 React components, hooks, translations and styles
public/              Static assets and locally downloaded CVs
scripts/cv/          CV synchronization and GitHub authentication
scripts/clean.mjs    Remove reproducible output
tests/e2e/           Browser tests, fixtures and versioned screenshots
tests/updater/       CV synchronization and authentication tests
tests/runtime/       Container process supervision tests
docker/              Caddy configuration and container startup
target/              Generated builds, caches, test results and reports
```

Generated output stays under `target/`: the site in `target/dist/`, browser traces
and screenshots in `target/test-results/`, and HTML reports in
`target/playwright-report/`. The reference screenshots under `tests/e2e/` are
versioned test inputs. Private CVs remain under `public/cv/` locally and are
excluded from Git and the Docker build context.

## Quality checks

```bash
npx playwright install chromium
npm test
npm run test:updater
npm run test:runtime
```

Playwright covers responsive layouts, keyboard navigation, language switching,
PDF controls and API failures, using local fixtures and screenshot comparisons.

**Interactive runner:** `npm run test:ui` · **Report:** `npm run test:report`

<details>
<summary>Updating visual references</summary>

References target **Linux and Playwright's Chromium**. Review intentional UI changes
before updating them:

```bash
npm test -- tests/e2e/layout.spec.ts --update-snapshots
```

</details>

## Deployment

One image, `ghcr.io/tatonimatteo/portfolio`, runs in a single **web** container.
A small Node supervisor starts Caddy and the CV updater as the unprivileged
`node` user, forwards shutdown signals and stops both if either process exits
unexpectedly. Docker then restarts the container according to its restart policy.

Temporary CV download failures are retried without interrupting the site. PDFs
remain in the persistent `cv-data` volume. GitHub credentials are supplied at
runtime; the supervisor removes CV/GitHub environment variables from Caddy's
environment. The GitHub App private key is mounted as a Docker secret.

On pushes to `main`, [GitHub Actions](.github/workflows/docker.yml) builds and
scans the image with Trivy for AMD64 and ARM64. Publication to GHCR starts only
after both architectures pass, with only the tags `latest` and `YYYYMMDD`
(UTC release date). A later release on the same day replaces that day's tag;
`latest` always points to the most recent successful release. Architecture
variants are uploaded by digest, without additional tags. A failed check prevents
image uploads.

CV updater and process supervision tests run inside each architecture's image
before its vulnerability scan.

Copy `.env.example` to `.env` and configure the CV repository and credentials there.
For GitHub App authentication, use `docker-compose.github-app.yml` alongside
`docker-compose.yml`, following the settings documented in `.env.example`.

```bash
docker compose pull
docker compose up -d --no-build --remove-orphans
```

Available at **[localhost:8080](http://localhost:8080)** by default.
Only Compose files and server credentials are needed; no source checkout is required.
Set `IMAGE_TAG` in `.env` to select a dated release, or use `latest`.
The web container serves HTTP; configure HTTPS through your reverse proxy or tunnel.
For a local image build, run `docker compose up --build`.

When migrating from the previous two-image deployment, update both Compose files
and select a release built with this unified image. Keep the existing `cv-data`
volume and private key. `--remove-orphans` removes the former updater container
without deleting the CV volume. The public port remains `${WEB_PORT:-8080}`; Caddy now
listens on port 8080 inside the container. Older releases using the separate
`portfolio-cv-updater` image require their matching Compose files.

For the existing `ingress_portfolio` proxy network, use
[`docker-compose.server.yml`](docker-compose.server.yml). It keeps the
`portfolio-web` alias, log rotation and GitHub App secret, with the CV volume
writable by the integrated updater. Configure the proxy upstream as
`http://portfolio-web:8080` (the previous internal port 80 has changed).

```bash
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d --no-build --remove-orphans
```

Run this under the same Compose project name as the existing deployment to
reuse its `cv-data` volume. The server file pins the daily `20261108` release;
update the tag when a newer release is published. The image's integrated
supervisor and healthcheck replace the external `cv-worker-supervisor.mjs`
command and its custom healthcheck; that external script is no longer mounted.

The Apache logo is provided by the [ASF brand kit](https://www.apache.org/foundation/press/kit/).
Apache and the Apache logo are trademarks of The Apache Software Foundation.
