import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import type {Page} from '@playwright/test';

const repository = {
    name: 'syncope', full_name: 'apache/syncope',
    description: 'Identity management', html_url: 'https://github.com/apache/syncope',
};
const mergedPR = {
    number: 42, title: 'Improve identity management', state: 'closed',
    created_at: '2026-01-01T12:00:00Z', pull_request: {merged_at: '2026-01-02T12:00:00Z'},
};

export async function mockGitHub(page: Page) {
    await page.route('https://api.github.com/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        const json = path.includes('/search/')
            ? {total_count: 7, incomplete_results: false, items: [mergedPR]}
            : path.includes('/users/') ? [] : repository;
        await route.fulfill({json});
    });
}

// A complete, locally generated one-page PDF: tests never need the private CV.
export function samplePDF(pageCount = 1) {
    const fontId = 3 + pageCount * 2;
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${Array.from({length: pageCount}, (_, i) => `${3 + i * 2} 0 R`).join(' ')}] /Count ${pageCount} >>`,
    ];
    for (let i = 0; i < pageCount; i++) {
        const content = `BT /F1 22 Tf 50 770 Td (Matteo Tatoni) Tj 0 -35 Td /F1 14 Tf (Test resume - page ${i + 1}) Tj 0 -35 Td (Software Developer) Tj ET`;
        objects.push(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${4 + i * 2} 0 R >>`,
            `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
        );
    }
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const [index, object] of objects.entries()) {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    }
    const xref = Buffer.byteLength(pdf);
    const size = objects.length + 1;
    pdf += `xref\n0 ${size}\n0000000000 65535 f \n${offsets.slice(1).map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}`;
    return Buffer.from(`${pdf}trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
}

export async function mockFonts(page: Page) {
    const folder = new URL('./assets/fonts/', import.meta.url);
    await page.route('https://fonts.googleapis.com/**', async (route) => route.fulfill({
        contentType: 'text/css', body: await readFile(new URL('google-fonts.css', folder)),
    }));
    await page.route('https://fonts.gstatic.com/**', (route) => route.fulfill({
        contentType: 'font/woff2',
        path: fileURLToPath(new URL(new URL(route.request().url()).pathname.split('/').pop()!, folder)),
    }));
}
