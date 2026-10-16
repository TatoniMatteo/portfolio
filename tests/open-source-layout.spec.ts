import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub} from './fixtures';

// Supply a repository list through Vite's module request, only in this test.
// No example contributions are added to the actual portfolio configuration.
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
            await page.route('**/src/data/openSource.ts*', (route) => route.fulfill({
                contentType: 'application/javascript',
                body: `export const openSourceProjects = ${JSON.stringify(projects)};`,
            }));
            await page.route('https://api.github.com/repos/**', (route) => {
                const fullName = new URL(route.request().url()).pathname.slice('/repos/'.length);
                return route.fulfill({json: {
                    name: fullName.split('/')[1], full_name: fullName,
                    description: 'Example repository for layout review.', html_url: `https://github.com/${fullName}`,
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
