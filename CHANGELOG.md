# Changelog

Tutte le modifiche applicate al progetto rispetto allo stato originale
(commit `665c9b3`, "Aggiornamento CV"), raggruppate per area. Non è un
changelog versionato: è il riepilogo di un'unica revisione complessiva.

## Internazionalizzazione (EN/IT)

- Aggiunto `react-i18next` con rilevamento automatico della lingua del
  browser e scelta salvata in `localStorage` (`src/i18n/`).
- Traduzioni in `src/i18n/locales/en.json` e `it.json`: navbar, Hero,
  About, Career (incluso l'array degli eventi della timeline), Resume,
  Open Source, Project, Contact, Footer.
- Selettore di lingua (EN/IT) nella navbar, sia desktop che mobile
  (`src/components/language-switcher/`).
- Gli id delle sezioni usati per la navigazione (`#about-me`, `#career`,
  ...) restano fissi in inglese indipendentemente dalla lingua mostrata,
  altrimenti i link di navigazione si romperebbero cambiando lingua.
- Limite noto: le descrizioni dei repository recuperate dinamicamente da
  GitHub (sezioni Open Source e Project) restano nella lingua in cui sono
  scritte su GitHub, perché arrivano da un'API esterna a runtime e non dai
  file di traduzione.

## Nuove sezioni / riorganizzazione dei contenuti

- **Resume**: nuova sezione dedicata al CV (`src/components/resume/`),
  prima incorporato nella sezione Contatti.
- **Open Source**: nuova sezione (`src/components/opensource/`) che mostra
  dati reali recuperati dalla API di GitHub — repository e Pull Request
  dell'utente su Apache Syncope e Apereo CAS — invece di contenuti statici
  o segnaposto.
- **Project**: oltre ai due progetti curati manualmente, la sezione
  recupera automaticamente fino a 4 repository pubblici aggiuntivi
  dall'account GitHub, escludendo i fork e quelli già mostrati come
  curati. Se l'API non risponde, i progetti curati restano comunque
  visibili.
- **Contact**: niente più form di contatto (scelta deliberata: niente
  backend applicativo, solo link/mailto statici).
- Estratto `useIsMobile` come hook condiviso (`src/hooks/useIsMobile.ts`),
  prima la stessa logica di `resize` era duplicata in più componenti.

## Résumé: scaricato da un repository separato

- Il PDF del CV non è più incluso in questo repository
  (`src/assets/documents/` è stato rimosso).
- `scripts/fetch-cv.mjs` scarica l'ultima release del repository privato
  `TatoniMatteo/CV` (due PDF, italiano e inglese), scegliendo l'asset giusto
  in base al nome; scarica solo se la release è cambiata e sostituisce i
  file in modo atomico.
- In sviluppo locale (`npm run predev`) lo scarica una volta.
- In produzione lo fa un container dedicato (`cv-updater`), che lo
  ricontrolla una volta al giorno (configurabile) e aggiorna i PDF in un
  volume condiviso, senza bisogno di ricostruire o riavviare il sito.
- Il sito mostra il PDF nella lingua attiva (`src/hooks/useResumeUrl.ts`).

## Deploy: da GitHub Pages a Docker/home server

- Rimossi il deploy su GitHub Pages, `CNAME` e la dipendenza `gh-pages`.
- `Dockerfile` con due target: `web` (il sito, servito da Caddy) e
  `cv-updater` (il processo che aggiorna il CV).
- `docker-compose.yml` e `.env.example` per eseguire entrambi i servizi su
  un server (o in locale, con `docker compose up --build`).
- `docker/Caddyfile`: routing statico con cache lunga per gli asset con
  hash nel nome, cache corta per HTML/CV, header di sicurezza di base.
- `.github/workflows/docker.yml`: a ogni push/merge su `main` costruisce le
  due immagini (amd64 + arm64), le scansiona con Trivy (blocca la
  pubblicazione se trova vulnerabilità HIGH/CRITICAL con fix disponibile) e
  le pubblica su GitHub Container Registry con tag `latest` e `sha-<commit>`.
  Sulle pull request fa solo build + scan, senza pubblicare.

## Dipendenze e sicurezza

- `eslint` 9 → 10 (la 9 è end-of-life); aggiornati `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `typescript-eslint`, `@eslint/js` alle
  versioni compatibili. `eslint.config.js` aggiornato di conseguenza
  (`eslint-plugin-react-hooks` v7 sposta la config flat sotto `.flat`).
- `pdfjs-dist` 5 → 6 (corregge una vulnerabilità alta). Nella v6
  `getDocument()` richiede un oggetto `{ url }` invece di una stringa:
  `PDFViewer.tsx` aggiornato di conseguenza. Aggiunti anche: gestione
  dell'errore di caricamento, annullamento del caricamento precedente
  quando cambia `src` (serve per il CV multilingua), nome del file di
  download personalizzabile.
- `vite` aggiornato alla patch sicura 7.3.x.
- `tsconfig.app.json`: aggiunto `resolveJsonModule` (necessario per
  importare i file di traduzione `.json`).
- `.github/dependabot.yml`: aggiornamenti automatici settimanali per npm,
  immagini Docker di base e GitHub Actions, raggruppando i soli
  minor/patch per ridurre il rumore.
- `npm audit` → 0 vulnerabilità.

## SEO e metadati

- `index.html`: meta description, Open Graph, Twitter Card, canonical.
- `public/robots.txt`, `public/sitemap.xml`.
- `public/og-preview.png`: card per le anteprime social, con il logo del
  sito, nome/ruolo e la stessa palette blu/oro del tema (font Poppins come
  sostituto più vicino a Outfit, non disponibile nell'ambiente in cui è
  stata generata).

## Open Source: rimosso Apereo CAS

- Tolto `apereo/cas` dall'elenco progetti di `OpenSource.tsx`: niente commit
  lì, resta solo Apache Syncope. La card Apereo CAS come *tecnologia che so
  usare* resta in About (sono due cose diverse: contributi vs competenze).
- `OpenSource.css`: con un solo progetto la griglia non si stira più a
  piena larghezza (prima lo faceva, con `auto-fit`); resta centrata e
  limitata, e torna a espandersi da sola se in futuro aggiungi un secondo
  progetto (`:has(.contribution-card:nth-child(2))`).

## About: tutte le tecnologie del CV, incluso Docker

- Elenco skill allineato al CV, nello stesso ordine: Java, Spring Boot,
  PostgreSQL, Apache Syncope, Apereo CAS, Maven, HTML, CSS, React,
  TypeScript, uso di strumenti AI, Docker, Linux, Git, GitHub.
- Aggiunte le icone mancanti (Maven, React, TypeScript, Docker, Git,
  GitHub), scaricate dal repository ufficiale di Devicon
  (`src/assets/images/`).
- "Uso di strumenti AI" non ha un singolo brand di riferimento: è
  un'icona FontAwesome (`faWandMagicSparkles`), non un logo prodotto.
  `About.tsx` ora supporta un terzo tipo di skill (`'fa'`) oltre a SVG e
  immagine per questo caso.
- Ogni icona ha un `title`/`alt` con il nome della tecnologia (prima
  mancava), utile sia per l'accessibilità sia come tooltip al passaggio
  del mouse.

## Correzione contrasto colori: sezione Project

- `.project-item:hover` e `.project-item.active` usavano `var(--color-text)`
  (colore del testo generico) su uno sfondo colorato (`var(--color-primary)`
  / `var(--color-primary-hover)`): il contrasto reale era ~2:1–2.9:1 in
  entrambi i temi, ben sotto la soglia minima WCAG AA di 4.5:1 — verificato
  calcolando il contrasto secondo la formula ufficiale, non a occhio.
  Corretto fissando sfondo `--color-blue-700` (un token che non cambia con
  il tema) e testo bianco: ~9:1 in entrambi i temi, verificato anche con
  screenshot reali (hover e stato attivo).

## UI

- Navbar desktop riscritta a griglia 3 colonne (logo / menu / selettore
  lingua) con spaziatura fluida (`clamp()`), per ospitare le voci di menu
  aggiuntive senza affollamento.
