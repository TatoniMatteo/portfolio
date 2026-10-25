import {test, expect} from '@playwright/test';
import {mockGitHub, mockFonts, samplePDF} from './fixtures';

test.beforeEach(async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'en'));
    await mockFonts(page);
    await mockGitHub(page);
});

test('mobile menu supports Enter, Tab and Escape and hides closed links from focus', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const toggle = page.getByRole('button', {name: 'Navigation menu'});
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#mobile-navigation a:focus')).toHaveCount(0);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', {name: 'Home', exact: true})).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
});

test('projects and career events can be selected with the keyboard', async ({page}) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const project = page.getByRole('button', {name: 'Portfolio Website', exact: true});
    await project.focus();
    await page.keyboard.press('Enter');
    await expect(project).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#project-preview')).toContainText('My space on the web, where I share my journey');
    const event = page.getByRole('button', {name: /High School Diploma$/});
    await event.focus();
    await page.keyboard.press('Space');
    await expect(event).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.timeline-detail-card')).toContainText('High School Diploma');
});

test('PDF code and document wait for the CV section; switching language loads the matching CV', async ({page}) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    expect(requests.some((url) => /PDFViewer\.tsx|\/cv\/|pdf\.worker/.test(url))).toBe(false);
    await page.locator('#resume').scrollIntoViewIfNeeded();
    await expect(page.locator('.pdf-page-info')).toHaveText('1 / 1');
    expect(requests.some((url) => url.endsWith('/cv/cv-en.pdf'))).toBe(true);
    await page.getByRole('button', {name: 'IT', exact: true}).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.locator('.pdf-page-info')).toHaveText('1 / 1');
    expect(requests.some((url) => url.endsWith('/cv/cv-it.pdf'))).toBe(true);
    await expect(page.getByRole('button', {name: 'Pagina successiva'})).toBeDisabled();
});

test('all configured contribution projects render and merged PRs are labelled Merged', async ({page}) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.contribution-card h3')).toHaveText(['syncope', 'ConnIdAzureBundle', 'ConnIdADBundle', 'ConnIdLDAPBundle']);
    await expect(page.locator('.contribution-card:first-child .contribution-meta')).toContainText('Merged');
    await expect(page.locator('.contribution-card:first-child .contribution-count strong')).toHaveText('7');
    await expect(page.locator('.contribution-card:first-child .contribution-latest h4 a')).toHaveAttribute('href', 'https://github.com/apache/syncope/pull/42');
});

test('contributions sort by PR count then recency and highlight the current leader', async ({page}) => {
    const stats: Record<string, {count: number; date: string}> = {
        'apache/syncope': {count: 3, date: '2026-07-01T12:00:00Z'},
        'Tirasa/ConnIdAzureBundle': {count: 8, date: '2026-01-01T12:00:00Z'},
        'Tirasa/ConnIdADBundle': {count: 8, date: '2026-05-01T12:00:00Z'},
        'Tirasa/ConnIdLDAPBundle': {count: 1, date: '2026-10-01T12:00:00Z'},
    };
    await page.route('https://api.github.com/search/**', (route) => {
        const query = new URL(route.request().url()).searchParams.get('q')!;
        const match = query.match(/repo:(\S+)/);
        if (!match) return route.fallback();
        const repository = match[1];
        const {count, date} = stats[repository];
        return route.fulfill({json: {
            total_count: count, incomplete_results: false,
            items: [{number: 42, title: 'A contribution', state: 'open', created_at: date, pull_request: {}}],
        }});
    });
    await page.goto('/');
    await expect(page.locator('.contribution-card h3')).toHaveText(['ConnIdADBundle', 'ConnIdAzureBundle', 'syncope', 'ConnIdLDAPBundle']);
    const featured = page.locator('.contribution-card-featured');
    await expect(featured).toHaveCount(1);
    await expect(featured.locator('h3')).toHaveText('ConnIdADBundle');
    await expect(featured.locator('.contribution-featured-label')).toHaveText('Most contributions');

    stats['apache/syncope'].count = 12;
    await page.evaluate(() => {
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith('portfolio-github-v1:')) localStorage.removeItem(key);
        }
    });
    await page.reload();
    await expect(page.locator('.contribution-card h3')).toHaveText(['syncope', 'ConnIdADBundle', 'ConnIdAzureBundle', 'ConnIdLDAPBundle']);
    await expect(featured).toHaveCount(1);
    await expect(featured.locator('h3')).toHaveText('syncope');
});

for (const scenario of ['zero', 'partial'] as const) {
    test(`contributions avoid highlighting a leader with ${scenario} statistics`, async ({page}) => {
        await page.route('https://api.github.com/search/**', (route) => {
            if (scenario === 'zero') return route.fulfill({json: {total_count: 0, incomplete_results: false, items: []}});
            if (new URL(route.request().url()).searchParams.get('q')!.includes('ConnIdAzureBundle')) return route.abort();
            return route.fallback();
        });
        await page.goto('/');
        if (scenario === 'partial') await expect(page.locator('.contribution-card')).toHaveCount(4);
        else await expect(page.getByRole('status')).toHaveText('No public contributions to open source projects found.');
        await expect(page.locator('.contribution-card-featured')).toHaveCount(0);
        if (scenario === 'partial') {
            await expect(page.locator('.contribution-card:last-child h3')).toHaveText('ConnIdAzureBundle');
            await expect(page.locator('.contribution-card:last-child .contribution-count strong')).toHaveText('–');
        } else {
            await expect(page.locator('article.contribution-card')).toHaveCount(0);
        }
    });
}

test('cached GitHub contributions survive a network failure', async ({page}) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.contribution-card:first-child .contribution-meta')).toContainText('Merged');
    // Expire the fresh cache so the next page tries the network, then uses stale data.
    await page.evaluate(() => {
        for (const key of Object.keys(localStorage)) {
            if (!key.startsWith('portfolio-github-v1:')) continue;
            const entry = JSON.parse(localStorage.getItem(key)!);
            entry.savedAt = Date.now() - 2 * 60 * 60 * 1000;
            localStorage.setItem(key, JSON.stringify(entry));
        }
    });
    await page.route('https://api.github.com/**', (route) => route.abort());
    await page.reload();
    await expect(page.locator('.contribution-card:first-child .contribution-meta')).toContainText('Merged');
    await expect(page.locator('.contribution-card:first-child .contribution-count strong')).toHaveText('7');
});

test('cold offline visit keeps personal projects and shows a contribution error without preloaded repositories', async ({page}) => {
    await page.route('https://api.github.com/**', (route) => route.abort());
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('button', {name: 'Water Health', exact: true})).toBeAttached();
    await expect(page.locator('#open-source')).toContainText('Unable to fetch information from GitHub.');
    await expect(page.locator('article.contribution-card')).toHaveCount(0);
    await expect(page.locator('.contribution-repo-link')).toHaveCount(0);
});

test('language switch updates descriptions, locale and document language', async ({page}) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Software Developer working with/);
    await page.getByRole('button', {name: 'IT', exact: true}).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'it_IT');
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', /Portfolio di Matteo/);
});

test('fresh cache avoids repeated GitHub calls on a new visit', async ({page}) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.contribution-card:first-child .contribution-meta')).toContainText('Merged');
    let networkCalls = 0;
    await page.route('https://api.github.com/**', (route) => {
        networkCalls++;
        return route.abort();
    });
    await page.reload();
    await expect(page.locator('.contribution-card:first-child .contribution-meta')).toContainText('Merged');
    expect(networkCalls).toBe(0);
});

test('malformed GitHub data falls back without a runtime crash', async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://api.github.com/**', (route) => route.fulfill({json: {items: [null]}}));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#open-source')).toContainText('Unable to fetch information from GitHub.');
    await expect(page.locator('article.contribution-card')).toHaveCount(0);
    await expect(page.locator('.project-item-loading')).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Water Health', exact: true})).toBeAttached();
    expect(errors).toEqual([]);
});
