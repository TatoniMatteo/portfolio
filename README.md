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
npm run dev
```

Styles use a single [SASS theme](src/styles/main.scss), with tokens in
`src/styles/_tokens.scss` and light/dark modes in `src/styles/_themes.scss`.
Translations live in `src/i18n/locales/`.
Open Source repositories are discovered automatically from public GitHub contributions;
the layout adapts automatically.
CV downloads support a GitHub App with automatic token renewal, a PAT or GitHub CLI authentication.

| Command           | Description                                 |
|:------------------|:--------------------------------------------|
| `npm run build`   | Production build in `dist/`                 |
| `npm run preview` | Preview the production build                |
| `npm run lint`    | Type-aware linting with Oxlint              |
| `npm run clean`   | Remove generated builds, reports and caches |

## Quality checks

```bash
npx playwright install chromium
npm test
npm run test:updater
```

Playwright covers responsive layouts, keyboard navigation, language switching,
PDF controls and API failures, using local fixtures and screenshot comparisons.

**Interactive runner:** `npm run test:ui` · **Report:** `npx playwright show-report`

<details>
<summary>Updating visual references</summary>

References target **Linux and Playwright's Chromium**. Review intentional UI changes
before updating them:

```bash
npm test -- tests/layout.spec.ts --update-snapshots
```

</details>

## Deployment

Two containers: **Caddy** serves the site; **cv-updater** refreshes the PDFs
independently. On pushes to `main`, [GitHub Actions](.github/workflows/docker.yml)
builds and scans both images with Trivy for AMD64 and ARM64. Publication to GHCR
starts only after every build and scan passes, with tags `latest`, `YYYYMMDD`
(UTC release date) and `sha-<short commit>`. A failed check prevents all image uploads.

Copy `.env.example` to `.env` and configure the CV repository and credentials there.
For GitHub App authentication, use `docker-compose.github-app.yml` alongside
`docker-compose.yml`, following the settings documented in `.env.example`.

```bash
docker compose pull
docker compose up -d --no-build
```

Available at **[localhost:8080](http://localhost:8080)** by default.
Only Compose files and server credentials are needed; no source checkout is required.
Set `IMAGE_TAG` in `.env` to select a dated release or a specific commit.
The web container serves HTTP; configure HTTPS through your reverse proxy or tunnel.
For a local image build, run `docker compose up --build`.
