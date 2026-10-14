# Matteo Tatoni — Portfolio

Personal portfolio website showcasing my background, skills, and projects as a Software Developer.

**Live:** https://portfolio.matato.it.eu.org

> This repository was recently overhauled (i18n, Docker-based deployment, a
> résumé pipeline, dependency/security fixes, and more). See
> [`CHANGELOG.md`](./CHANGELOG.md) for the full list and
> [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the one-time setup checklist.

## Stack

React 19 · TypeScript · Vite · Framer Motion · react-i18next

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Internationalization

Available in English and Italian, auto-detected from the browser (with manual override via the language switcher in the navbar). Translations live in `src/i18n/locales/`.

## Résumé

The résumé PDFs (Italian and English) live in the releases of a private repository, not in this one. In production a small `cv-updater` container checks once a day for a new release and refreshes the PDFs the site serves, with no rebuild or restart. For local development, `npm run dev` downloads them first (requires `gh auth login` or `CV_REPO_TOKEN`); without it the site still starts, just without the résumé.

## Deployment

The site ships as two Docker images, built and published to GitHub Container Registry on every push to `main` (see `.github/workflows/docker.yml`). On the server:

```bash
cp .env.example .env     # set CV_REPO_TOKEN
docker compose pull
docker compose up -d
```

To try everything locally: `docker compose up --build`, then open http://localhost:8080.

Full one-time setup (token, package visibility, DNS/reverse proxy) is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Project Structure

```
src/
  components/   UI components, one folder per section
  hooks/        Shared React hooks
  i18n/         react-i18next setup and translations (en, it)
  assets/       Images and icons
public/         Static assets, robots.txt, sitemap.xml, og-preview.png
scripts/        Résumé download script (fetch-cv.mjs)
docker/         Caddy configuration for the web image
Dockerfile      Two targets: web, cv-updater
docker-compose.yml
```

## License

© Matteo Tatoni. All rights reserved.
