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

test('GitHub search merged PRs are labelled Merged', async ({page}) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.contribution-meta')).toContainText('Merged');
    await expect(page.locator('.contribution-count strong')).toHaveText('7');
    await expect(page.locator('.contribution-latest h4 a')).toHaveAttribute('href', 'https://github.com/apache/syncope/pull/42');
});

test('cached GitHub contributions survive a network failure', async ({page}) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.contribution-meta')).toContainText('Merged');
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
    await expect(page.locator('.contribution-meta')).toContainText('Merged');
    await expect(page.locator('.contribution-count strong')).toHaveText('7');
});

test('cold offline visit keeps curated projects and a GitHub fallback without inventing statistics', async ({page}) => {
    await page.route('https://api.github.com/**', (route) => route.abort());
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('button', {name: 'Water Health', exact: true})).toBeAttached();
    await expect(page.locator('.contribution-card h3')).toHaveText('syncope');
    await expect(page.locator('.contribution-repo-link')).toHaveAttribute('href', 'https://github.com/apache/syncope');
    await expect(page.locator('.contribution-count strong')).toHaveText('–');
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
    await expect(page.locator('.contribution-meta')).toContainText('Merged');
    let networkCalls = 0;
    await page.route('https://api.github.com/**', (route) => {
        networkCalls++;
        return route.abort();
    });
    await page.reload();
    await expect(page.locator('.contribution-meta')).toContainText('Merged');
    expect(networkCalls).toBe(0);
});

test('malformed GitHub data falls back without a runtime crash', async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://api.github.com/**', (route) => route.fulfill({json: {items: [null]}}));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.contribution-count strong')).toHaveText('–');
    await expect(page.locator('.project-item-loading')).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Water Health', exact: true})).toBeAttached();
    expect(errors).toEqual([]);
});
