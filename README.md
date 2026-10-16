<div align="center">

<a href="https://portfolio.matato.it.eu.org">
  <img src="public/brand/mt-logo.png" alt="MT — Matteo Tatoni" width="480" />
</a>

# Matteo Tatoni · Portfolio

Projects, experience and open source contributions. Available in English and Italian.

![React](https://img.shields.io/badge/React-20232a?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

**[Live website ↗](https://portfolio.matato.it.eu.org)** · [Deployment guide](DEPLOYMENT.md) · [Changelog](CHANGELOG.md)

</div>

---

## Local development

Requires **Node.js 24** and **npm**.

```bash
npm ci
npm run dev
```

Styles use a single [SASS theme](src/styles/README.md); translations live in `src/i18n/locales/`.
Open Source repositories are listed in `src/data/openSource.ts`; the layout adapts automatically. CV downloads use `CV_REPO_TOKEN` or an
authenticated GitHub CLI session; the site also starts without the PDFs.

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
builds, scans with Trivy and publishes both images to GHCR.

```bash
cp .env.example .env
# Set CV_REPO_TOKEN in .env

docker compose pull
docker compose up -d
```

Available at **[localhost:8080](http://localhost:8080)** by default.
For a local image build, run `docker compose up --build`.
See the [deployment guide](DEPLOYMENT.md) for credentials, HTTPS and troubleshooting.
