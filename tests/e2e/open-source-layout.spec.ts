import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub} from './fixtures';

// Supply discovered repositories through the GitHub API, without a fixed list.
for (const count of [2, 3]) {
    for (const width of [390, 1440]) {
        test(`${count} Open Source projects form a responsive grid at ${width}px`, async ({page}) => {
            const theme = count === 2 ? 'light' : 'dark';
            await page.setViewportSize({width, height: 1000});
            await page.emulateMedia({colorScheme: theme});
            await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'en'));
            await mockFonts(page);
            await mockGitHub(page);
            const projects = [
                {owner: 'apache', repo: 'syncope'},
                {owner: 'example', repo: 'another-project'},
                {owner: 'example', repo: 'a-project-with-a-longer-repository-name'},
            ].slice(0, count);
            await page.route('https://api.github.com/search/**', (route) => {
                const query = new URL(route.request().url()).searchParams.get('q')!;
                if (query.includes('repo:')) return route.fallback();
                return route.fulfill({json: {
                    total_count: projects.length, incomplete_results: false,
                    items: projects.map(({owner, repo}) => ({
                        repository_url: `https://api.github.com/repos/${owner}/${repo}`,
                        number: 42, title: 'A contribution', state: 'open',
                        created_at: '2026-01-01T12:00:00Z', pull_request: {},
                    })),
                }});
            });
            await page.route('https://api.github.com/repos/**', (route) => {
                const fullName = new URL(route.request().url()).pathname.slice('/repos/'.length);
                return route.fulfill({json: {
                    name: fullName.split('/')[1], full_name: fullName,
                    description: 'Example repository for layout review.', html_url: `https://github.com/${fullName}`,
                    private: false, license: {key: 'mit'},
                }});
            });
            await page.goto('/');
            await page.evaluate(() => document.fonts.ready);
            const section = page.locator('#open-source');
            const cards = section.locator('.contribution-card');
            await expect(cards).toHaveCount(count);
            for (let index = 0; index < count; index++) {
                await cards.nth(index).scrollIntoViewIfNeeded();
                await expect(cards.nth(index)).toHaveCSS('opacity', '1');
                await expect(cards.nth(index).locator('.contribution-owner')).toHaveText(`${projects[index].owner}/${projects[index].repo}`);
            }
            const first = (await cards.nth(0).boundingBox())!;
            const second = (await cards.nth(1).boundingBox())!;
            if (width > 768) {
                expect(Math.abs(first.y - second.y)).toBeLessThan(1);
                expect(second.x).toBeGreaterThan(first.x + first.width);
                expect(Math.abs(first.height - second.height)).toBeLessThan(1);
            } else {
                expect(Math.abs(first.x - second.x)).toBeLessThan(1);
                expect(second.y).toBeGreaterThan(first.y + first.height);
            }
            const story = (await section.locator('.open-source-story').boundingBox())!;
            expect(story.y + story.height).toBeLessThan(first.y);
            expect(await section.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
            await expect(section).toHaveScreenshot(`open-source-${count}-${width}-${theme}.png`, {animations: 'disabled', maxDiffPixels: 50});
        });
    }
}
