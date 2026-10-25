import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub} from './fixtures';

test.beforeEach(async ({page}) => {
    await mockFonts(page);
    await mockGitHub(page);
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'en'));
});

const contribution = (repository: string, number = 42) => ({
    repository_url: `https://api.github.com/repos/${repository}`,
    number, title: 'A contribution', state: 'open', created_at: '2026-01-01T12:00:00Z', pull_request: {},
});

test('discovers licensed external projects across pages and removes duplicate, own and private repositories', async ({page}) => {
    const pages: number[] = [];
    await page.route('https://api.github.com/search/**', (route) => {
        const url = new URL(route.request().url());
        const query = url.searchParams.get('q')!;
        if (query.includes('repo:')) return route.fallback();
        expect(query).toContain('is:public -user:TatoniMatteo');
        const currentPage = Number(url.searchParams.get('page'));
        pages.push(currentPage);
        const items = currentPage === 1
            ? Array.from({length: 100}, (_, index) => contribution(index === 0 ? 'TatoniMatteo/portfolio' : 'apache/syncope', index))
            : ['community/new-project', 'Community/New-Project', 'community/unlicensed', 'community/private'].map((repo) => contribution(repo));
        return route.fulfill({json: {total_count: 104, incomplete_results: false, items}});
    });
    await page.route('https://api.github.com/repos/community/**', (route) => {
        const fullName = new URL(route.request().url()).pathname.slice('/repos/'.length);
        return route.fulfill({json: {
            name: fullName.split('/')[1].toLowerCase(), full_name: fullName,
            html_url: `https://github.com/${fullName}`, description: 'A new community project',
            private: fullName.endsWith('/private'), license: fullName.endsWith('/unlicensed') ? null : {key: 'mit'},
        }});
    });
    // Repository names are case-insensitive, including metadata lookups.
    await page.route('https://api.github.com/repos/Community/**', (route) => route.fulfill({json: {
        name: 'new-project', full_name: 'community/new-project',
        html_url: 'https://github.com/community/new-project', description: 'A new community project',
        private: false, license: {key: 'mit'},
    }}));
    await page.goto('/');
    await expect(page.locator('.contribution-card')).toHaveCount(2);
    await expect(page.locator('.contribution-card h3')).toHaveText(['syncope', 'new-project']);
    expect(pages).toEqual([1, 2]);
    await expect(page.locator('.contribution-repo-link').last()).toHaveAttribute('href', 'https://github.com/community/new-project');
});

test('splits searches above GitHub’s result limit to discover older projects', async ({page}) => {
    const ranges: string[] = [];
    await page.route('https://api.github.com/search/**', (route) => {
        const query = new URL(route.request().url()).searchParams.get('q')!;
        if (query.includes('repo:')) return route.fallback();
        if (!query.includes('created:')) return route.fulfill({json: {
            total_count: 1001, incomplete_results: false, items: [contribution('apache/syncope')],
        }});
        ranges.push(query);
        return route.fulfill({json: {
            total_count: 1, incomplete_results: false,
            items: [contribution(ranges.length === 1 ? 'community/recent-project' : 'community/older-project')],
        }});
    });
    await page.goto('/');
    await expect(page.locator('.contribution-card')).toHaveCount(2);
    await expect(page.locator('.contribution-card h3')).toHaveText(['recent-project', 'older-project']);
    expect(ranges).toHaveLength(2);
});

for (const width of [320, 1440]) {
    test(`long PR titles fit two lines at ${width}px with full text available`, async ({page}) => {
        await page.setViewportSize({width, height: 1000});
        const title = 'Improve '.repeat(80) + 'identity management';
        await page.route('https://api.github.com/search/**', (route) => {
            if (!new URL(route.request().url()).searchParams.get('q')!.includes('repo:')) return route.fallback();
            return route.fulfill({json: {
                total_count: 1, incomplete_results: false, items: [{...contribution('apache/syncope'), title}],
            }});
        });
        await page.goto('/');
        const link = page.locator('.contribution-latest h4 a').first();
        await expect(link).toHaveAttribute('title', title);
        const bounds = await link.evaluate((element) => ({
            height: element.getBoundingClientRect().height,
            lineHeight: parseFloat(getComputedStyle(element).lineHeight),
            fullHeight: element.scrollHeight,
        }));
        expect(bounds.height).toBeLessThanOrEqual(bounds.lineHeight * 2 + 1);
        expect(bounds.fullHeight).toBeGreaterThan(bounds.height);
        await expect(link).toHaveCSS('overflow', 'hidden');
    });
}
