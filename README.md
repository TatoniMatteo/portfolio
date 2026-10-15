 <div align="center">

# Matteo Tatoni

### Software Developer · Personal Portfolio

A modern, multilingual portfolio showcasing my background, technical skills, and software projects.

[**Visit the Portfolio ↗**](https://portfolio.matato.it.eu.org)

<br />

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![Trivy](https://img.shields.io/badge/Security-Trivy-1904DA?style=flat-square&logo=aquasecurity&logoColor=white)

</div>

---

## Overview

This repository contains the source code and deployment configuration for my personal portfolio website.

Built with a modern frontend stack, the project combines a responsive user experience with automated résumé delivery, containerized deployment, and security scanning.

| Feature                      | Description                                                    |
|:-----------------------------|:---------------------------------------------------------------|
| **Multilingual UI**          | English and Italian, with automatic language detection         |
| **Modern frontend**          | React, TypeScript, Vite, and Framer Motion                     |
| **Automated résumé updates** | Periodic downloads of the latest PDF releases                  |
| **Containerized deployment** | Separate Docker images for the website and résumé updater      |
| **CI/CD**                    | Automated image builds, security scans, and publishing to GHCR |

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Internationalization](#internationalization)
- [Résumé Pipeline](#résumé-pipeline)
- [Deployment](#deployment)
- [Security](#security)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

---

## Tech Stack

<div align="center">

| Category             | Technologies                 |
|:---------------------|:-----------------------------|
| Frontend             | React 19 · TypeScript · Vite |
| UI & Animation       | Framer Motion                |
| Internationalization | react-i18next                |
| Containers           | Docker · Docker Compose      |
| Automation           | GitHub Actions               |
| Image Registry       | GitHub Container Registry    |
| Security             | Trivy                        |

</div>

## Getting Started

### Prerequisites

- Node.js and npm
- Git

### Development

Clone the repository and install its dependencies:

```bash
git clone <repository-url>
cd portfolio
npm install
npm run dev
```

The development server URL will be displayed in the terminal.

### Production Build

Create and preview a production build:

```bash
npm run build
npm run preview
```

The optimized frontend assets are generated in `dist/`.

## Internationalization

The portfolio is available in **English and Italian**, powered by `react-i18next`.

- **Automatic detection:** the initial language is selected based on the browser's language preferences.
- **Manual selection:** visitors can switch languages using the navigation bar.
- **Translation resources:** maintained in `src/i18n/locales/`.

## Résumé Pipeline

The Italian and English résumé PDFs are hosted in a separate private repository and distributed through GitHub Releases.

A dedicated `cv-updater` container periodically checks for a new release and refreshes the PDFs served by the website.

This separation allows résumé updates to be deployed **without rebuilding or restarting the frontend container**.

### Local Development

The résumé download script can retrieve the latest PDFs before starting the development server.

Authentication requires either:

- An authenticated GitHub CLI session (`gh auth login`).
- A `CV_REPO_TOKEN` environment variable with the required repository access.

If the PDFs cannot be downloaded, the website can still start without them.

## Deployment

The application is distributed as two Docker images:

| Image        | Responsibility                      |
|:-------------|:------------------------------------|
| `web`        | Serves the production frontend      |
| `cv-updater` | Retrieves and refreshes résumé PDFs |

On pushes to `main`, the [Docker workflow](./.github/workflows/docker.yml) builds the images, scans them with Trivy, and publishes them to GitHub Container Registry (GHCR), subject to the workflow's configured checks.

### Deploy on the Server

Create the environment file and configure `CV_REPO_TOKEN`:

```bash
cp .env.example .env
```

Then pull the published images and start the services:

```bash
docker compose pull
docker compose up -d
```

### Run Locally with Docker

Build the images and start the complete application stack:

```bash
docker compose up --build
```

Open **[http://localhost:8080](http://localhost:8080)** to access the website.

For initial server setup, GitHub package permissions, token configuration, DNS, and reverse-proxy requirements, consult the [Deployment Guide](./DEPLOYMENT.md).

## Security

Security checks are integrated into the container publishing workflow.

- **Trivy scanning** checks container images for known vulnerabilities.
- **Severity filtering** targets HIGH and CRITICAL findings.
- **Unfixed vulnerabilities** are excluded according to the configured scan policy.
- **Publishing gates** prevent publication when the configured scan fails.

Keeping the base images and dependencies up to date helps reduce the application's attack surface.

## Project Structure

```text
.
├── .github/
│   └── workflows/        CI/CD workflows
├── public/               Static assets, SEO files, and social preview
├── scripts/              Résumé download and update automation
├── src/
│   ├── assets/           Images and icons
│   ├── components/       UI components, organized by section
│   ├── hooks/            Shared React hooks
│   └── i18n/             Internationalization and translations
├── Dockerfile            Multi-target Docker build
├── docker-compose.yml    Application services
├── CHANGELOG.md          Project history
└── DEPLOYMENT.md         Deployment and initial setup guide
```

## Documentation

| Document                                          | Description                                                |
|:--------------------------------------------------|:-----------------------------------------------------------|
| [Deployment Guide](./DEPLOYMENT.md)               | Server setup, secrets, package permissions, and networking |
| [Changelog](./CHANGELOG.md)                       | Project changes and improvements                           |
| [Docker Workflow](./.github/workflows/docker.yml) | Image build, security scan, and publishing automation      |

---

## License

**© Matteo Tatoni. All rights reserved.**

