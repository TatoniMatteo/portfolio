#!/usr/bin/env node
/**
 * Scarica i PDF del CV (italiano + inglese) dall'ULTIMA release del repo
 * privato e li salva come:
 *
 *   <CV_OUT_DIR>/cv-it.pdf
 *   <CV_OUT_DIR>/cv-en.pdf
 *
 * Due modalità:
 *   node scripts/fetch-cv.mjs            controllo singolo (sviluppo locale)
 *   node scripts/fetch-cv.mjs --watch    resta attivo e controlla ogni
 *                                        CV_CHECK_INTERVAL_HOURS (default 24)
 *                                        -> è quello che gira nel container
 *                                           "cv-updater" sul server
 *
 * Scarica solo se la release è cambiata (tag / id / data degli asset) e
 * sostituisce i file in modo atomico: il sito non serve mai un PDF a metà.
 *
 * Autenticazione (in ordine di priorità):
 *   1. CV_APP_ID + CV_APP_PRIVATE_KEY_FILE - GitHub App, rinnovo automatico
 *   2. CV_REPO_TOKEN - fine-grained PAT con "Contents: read" sul repo CV
 *   3. GITHUB_TOKEN
 *   4. `gh auth token` (comodo in locale se hai la GitHub CLI loggata)
 *
 * Variabili opzionali:
 *   CV_OUT_DIR                 cartella di destinazione (default: public/cv)
 *   CV_REPO                    repo sorgente            (default: TatoniMatteo/CV)
 *   CV_IT_PATTERN              regex nome asset italiano (default: it|ita|italiano|italian)
 *   CV_EN_PATTERN              regex nome asset inglese  (default: en|eng|english|inglese)
 *   CV_CHECK_INTERVAL_HOURS    solo --watch, default 24
 *   CV_RETRY_MINUTES           solo --watch, attesa dopo un errore, default 60
 *   GITHUB_API_URL             base API                 (default: https://api.github.com)
 *
 * Errori:
 *   - modalità singola in CI (CI=true): exit 1;
 *   - modalità singola in locale: avvisa e prosegue (npm run dev parte lo stesso);
 *   - --watch: non esce mai, riprova dopo CV_RETRY_MINUTES.
 */
import {createTokenProvider} from './github-auth.mjs';
import {access, mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const REPO = process.env.CV_REPO ?? 'TatoniMatteo/CV';
const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const IN_CI = process.env.CI === 'true';
const WATCH = process.argv.includes('--watch') || process.env.CV_WATCH === 'true';

const positiveNumber = (value, fallback) => {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const INTERVAL_MS = positiveNumber(process.env.CV_CHECK_INTERVAL_HOURS, 24) * 3_600_000;
const RETRY_MS = positiveNumber(process.env.CV_RETRY_MINUTES, 60) * 60_000;

const toRegex = (value, fallback) =>
    new RegExp(`(^|[^a-z])(${value ?? fallback})([^a-z]|$)`, 'i');

const LANGUAGES = [
    {code: 'it', pattern: toRegex(process.env.CV_IT_PATTERN, 'it|ita|italiano|italian')},
    {code: 'en', pattern: toRegex(process.env.CV_EN_PATTERN, 'en|eng|english|inglese')},
];

const OUT_DIR = process.env.CV_OUT_DIR
    ? resolve(process.env.CV_OUT_DIR)
    : join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'cv');
const META_FILE = join(OUT_DIR, '.cv-meta.json');

const log = (message) => console.log(`[cv] ${message}`);

const getToken = createTokenProvider();

const github = async (url, accept) => {
    const token = await getToken();
    if (!token) throw new Error(`Configura una GitHub App oppure CV_REPO_TOKEN con accesso in lettura a ${REPO}; in locale puoi usare gh auth login.`);
    const response = await fetch(url, {
        headers: {
            Accept: accept,
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'portfolio-fetch-cv',
        },
        signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} su ${url}`);
    }
    return response;
};

const readMeta = async () => {
    try {
        return JSON.parse(await readFile(META_FILE, 'utf8'));
    } catch {
        return null;
    }
};

const exists = (file) => access(file).then(() => true, () => false);

const syncOnce = async () => {
    const release = await (
        await github(`${API}/repos/${REPO}/releases/latest`, 'application/vnd.github+json')
    ).json();

    const pdfs = (release.assets ?? []).filter((a) => a.name.toLowerCase().endsWith('.pdf'));
    const matches = LANGUAGES.map(({code, pattern}) => ({
        code,
        asset: pdfs.find((a) => pattern.test(a.name)),
    }));

    const missing = matches.filter((m) => !m.asset).map((m) => m.code);
    if (missing.length > 0) {
        throw new Error(
            `Release ${release.tag_name}: nessun PDF riconosciuto per: ${missing.join(', ')}. Asset trovati: ` +
            `${pdfs.map((a) => a.name).join(', ') || '(nessuno)'}. ` +
            'Adatta CV_IT_PATTERN / CV_EN_PATTERN ai nomi dei file.',
        );
    }

    // "Firma" della release: se non cambia, non c'è nulla da scaricare.
    const signature = {
        tag: release.tag_name,
        assets: Object.fromEntries(
            matches.map(({code, asset}) => [code, `${asset.id}:${asset.updated_at ?? ''}:${asset.size ?? ''}`]),
        ),
    };
    const previous = await readMeta();
    const filesPresent = (await Promise.all(
        matches.map(({code}) => exists(join(OUT_DIR, `cv-${code}.pdf`))),
    )).every(Boolean);

    if (filesPresent && previous && JSON.stringify(previous.signature) === JSON.stringify(signature)) {
        log(`già aggiornato (release ${release.tag_name}), niente da scaricare.`);
        return;
    }

    // Prima scarico TUTTO in memoria, poi sostituisco i file: se una delle
    // due lingue fallisce, non resta mai un IT nuovo con un EN vecchio.
    const downloads = [];
    for (const {code, asset} of matches) {
        // L'URL API dell'asset (non browser_download_url) funziona anche sui repo privati.
        const response = await github(asset.url, 'application/octet-stream');
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.subarray(0, 4).toString('latin1') !== '%PDF') {
            throw new Error(`${asset.name} non sembra un PDF valido, lo scarto.`);
        }
        downloads.push({code, asset, buffer});
    }

    await mkdir(OUT_DIR, {recursive: true});
    for (const {code, asset, buffer} of downloads) {
        const target = join(OUT_DIR, `cv-${code}.pdf`);
        await writeFile(`${target}.tmp`, buffer);
        await rename(`${target}.tmp`, target); // atomico: stessa cartella
        log(`${asset.name} -> ${target} (${Math.round(buffer.length / 1024)} KB)`);
    }
    await writeFile(
        META_FILE,
        JSON.stringify({signature, updatedAt: new Date().toISOString()}, null, 2),
    );
    log(`aggiornato alla release ${release.tag_name}.`);
};

const run = async () => {
    try {
        await syncOnce();
        return true;
    } catch (error) {
        console.error(`[cv] ${error.message}`);
        return false;
    }
};

if (WATCH) {
    // Come PID 1 in un container Node ignora SIGTERM: gestiamolo, così
    // `docker stop` è immediato.
    for (const signal of ['SIGTERM', 'SIGINT']) {
        process.on(signal, () => process.exit(0));
    }
    log(`modalità watch: controllo ogni ${INTERVAL_MS / 3_600_000} h (repo ${REPO}, output ${OUT_DIR}).`);
    for (;;) {
        const ok = await run();
        const wait = ok ? INTERVAL_MS : RETRY_MS;
        log(`prossimo controllo tra ${Math.round(wait / 60_000)} min.`);
        await sleep(wait);
    }
} else if (!(await run())) {
    if (IN_CI) {
        process.exit(1);
    }
    console.warn('[cv] Procedo senza aggiornare il CV (in locale non è bloccante).');
}
