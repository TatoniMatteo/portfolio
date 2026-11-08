import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub, samplePDF} from './fixtures';

for (const viewport of [{width: 1440, height: 900}, {width: 2560, height: 1100}]) {
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
        test(`section indicators include both page ends at ${viewport.width}px with ${reducedMotion}`, async ({page}) => {
            await page.setViewportSize(viewport);
            await page.emulateMedia({reducedMotion});
            await mockFonts(page);
            await mockGitHub(page);
            await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
            await page.goto('/');
            await page.evaluate(() => {
                document.documentElement.style.scrollSnapType = 'none';
                document.documentElement.style.scrollBehavior = 'auto';
            });
            const guide = page.locator('.section-guide');
            const active = guide.locator('a[aria-current="location"]');
            await expect(active).toHaveCount(1);
            await expect(active).toHaveAttribute('href', '#home');
            for (const id of ['career', 'resume', 'my-projects']) {
                await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView({block: 'center', behavior: 'instant'}));
                await expect(active).toHaveAttribute('href', `#${id}`);
            }
            // A taller footer must not prevent the last section from becoming
            // active at the bottom, even when it no longer crosses the center.
            await page.locator('footer').evaluate((element, height) => { element.style.minHeight = `${height}px`; }, viewport.height * .7);
            await page.evaluate(() => window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}));
            await expect(active).toHaveAttribute('href', '#contact-me');
            const selectedColor = await page.locator('.about-location').evaluate((element) => getComputedStyle(element).color);
            await expect(active.locator('.section-guide-dot')).toHaveCSS('background-color', selectedColor);
            await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
            await expect(active).toHaveAttribute('href', '#home');
            await expect(active.locator('.section-guide-dot')).toHaveCSS('background-color', selectedColor);
            await page.setViewportSize({...viewport, height: viewport.height - 200});
            await page.evaluate(() => window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}));
            await expect(active).toHaveAttribute('href', '#contact-me');
            await expect(active).toHaveCount(1);
        });
    }
}

test('Home dot returns to the intro with native scroll snapping enabled', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await mockFonts(page);
    await mockGitHub(page);
    await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
    await page.goto('/');
    const guide = page.locator('.section-guide');
    await guide.locator('a[href="#about-me"]').click();
    await expect(guide.locator('[aria-current="location"]')).toHaveAttribute('href', '#about-me');
    await guide.locator('a[href="#home"]').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
    await expect(guide.locator('[aria-current="location"]')).toHaveAttribute('href', '#home');
    for (const top of [180, 500, 900, 1150]) {
        await page.evaluate((value) => window.scrollTo({top: value, behavior: 'instant'}), top);
        await expect(guide.locator('[aria-current="location"]')).toHaveAttribute('href', '#home');
    }
});

test('Home indicator follows the current intro after its DOM node is replaced', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await mockFonts(page);
    await mockGitHub(page);
    await page.goto('/');
    await page.evaluate(() => {
        document.documentElement.style.scrollSnapType = 'none';
        const home = document.getElementById('home')!;
        home.replaceWith(home.cloneNode(true));
        window.scrollTo({top: document.getElementById('home')!.offsetHeight - innerHeight * .7, behavior: 'instant'});
    });
    await expect(page.locator('.section-guide [aria-current="location"]')).toHaveAttribute('href', '#home');
});
