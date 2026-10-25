import {rm} from 'node:fs/promises';

// Only reproducible output; source files, fixtures and CVs are preserved.
const directories = [
    'dist', 'dist-ssr', 'test-results', 'playwright-report', 'blob-report', 'coverage',
    'node_modules/.tmp', 'node_modules/.vite', 'node_modules/.vite-temp',
    'playwright/.cache',
];

await Promise.all(directories.map((directory) =>
    rm(new URL(`../${directory}`, import.meta.url), {recursive: true, force: true}),
));
