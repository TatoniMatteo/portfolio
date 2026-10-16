import {test, expect} from '@playwright/test';
import {mockGitHub, mockFonts, samplePDF} from './fixtures';

const sections = ['home', 'about-me', 'career', 'resume', 'open-source', 'my-projects', 'contact-me'];

for (const width of [320, 390, 768, 769, 1024, 1440, 2560]) {
    test(`all content fits a ${width}px viewport and remains visible`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.emulateMedia({colorScheme: 'light'});
        await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'it'));
        await mockGitHub(page);
        await mockFonts(page);
        await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        for (const id of sections) {
            const section = page.locator(`#${id}`);
            await section.scrollIntoViewIfNeeded();
            const heading = section.getByRole('heading').first();
            await expect(heading).toBeVisible();
            // Check real rectangles: overflow-x:hidden can hide broken layouts.
            await expect.poll(async () => section.locator('h1,h2,h3,p,button,a,img,canvas,.about-skills,.skill-chip,.project-list,.contribution-card').evaluateAll((elements) =>
                elements.filter((element) => {
                    const rect = element.getBoundingClientRect();
                    return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
                }).map((element) => `${element.tagName}.${element.className}: ${element.textContent?.slice(0, 45)}`)), {message: `clipped content in #${id}`}).toEqual([]);
        }
        expect(errors).toEqual([]);
    });
}

for (const device of ['desktop', 'mobile'] as const) {
    for (const theme of ['light', 'dark'] as const) {
        test(`${device} ${theme} visual review`, async ({page}, testInfo) => {
            await page.setViewportSize(device === 'desktop' ? {width: 1440, height: 1000} : {width: 390, height: 844});
            await page.emulateMedia({colorScheme: theme});
            await page.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'));
            await page.addInitScript((lang) => localStorage.setItem('portfolio-lang', lang), device === 'desktop' ? 'en' : 'it');
            await mockGitHub(page);
            await mockFonts(page);
            await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
            await page.goto('/');
            await page.evaluate(() => document.fonts.ready);
            await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
            for (const id of sections) {
                if (id === 'home') await page.evaluate(() => scrollTo(0, 0));
                else await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView({block: 'start'}));
                if (id === 'resume') {
                    await expect(page.locator('.pdf-page-info')).toHaveText('1 / 1');
                    await expect(page.locator('.pdf-viewer')).toHaveAttribute('aria-busy', 'false');
                }
                // Wait for Motion opacity transitions; CSS screenshot animation
                // disabling alone cannot settle JavaScript-driven animations.
                await expect.poll(() => page.locator(`#${id}`).evaluate((element) =>
                    Array.from(element.querySelectorAll<HTMLElement>('[style*="opacity"]')).every((child) => {
                        const rect = child.getBoundingClientRect();
                        const visibleWidth = Math.min(rect.right, innerWidth) - Math.max(rect.left, 0);
                        const visibleHeight = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
                        return visibleWidth <= rect.width * 0.5 || visibleHeight <= rect.height * 0.5 || Number(getComputedStyle(child).opacity) === 1;
                    })), {timeout: 5000}).toBe(true);
                await expect(page).toHaveScreenshot(`${device}-${theme}-${id}.png`, {animations: 'disabled', maxDiffPixels: 50});
                const file = testInfo.outputPath(`${device}-${theme}-${id}.png`);
                await page.screenshot({path: file, animations: 'disabled'});
                await testInfo.attach(id, {path: file, contentType: 'image/png'});
            }
            await page.getByRole('button', {name: 'Portfolio Website', exact: true}).click();
            const preview = page.locator('#project-preview');
            await expect(preview.getByRole('heading')).toHaveText('Portfolio Website');
            await expect.poll(() => preview.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 1440)).toBe(true);
            await expect(preview).toHaveCSS('opacity', '1');
            await preview.scrollIntoViewIfNeeded();
            await expect(page).toHaveScreenshot(`${device}-${theme}-portfolio.png`, {animations: 'disabled', maxDiffPixels: 50});
            await page.getByRole('button', {name: 'Water Health', exact: true}).click();
            await expect(preview.getByRole('heading')).toHaveText('Water Health');
            await expect(preview).toHaveCSS('opacity', '1');
            // Cover the lower content of sections taller than a mobile screen.
            for (const [name, selector] of [
                ['skills', '.skill-group-ai'],
                ['resume-controls', '.pdf-controls'],
                ['project-details', '#project-preview a'],
                ['footer', 'footer'],
            ]) {
                await page.locator(selector).scrollIntoViewIfNeeded();
                await expect(page.locator(selector)).toHaveCSS('opacity', '1');
                await expect(page).toHaveScreenshot(`${device}-${theme}-${name}.png`, {animations: 'disabled', maxDiffPixels: 50});
            }
            if (device === 'mobile') {
                await page.getByRole('button', {name: 'Menu di navigazione'}).click();
                await expect(page.locator('#mobile-navigation')).toHaveCSS('opacity', '1');
                await expect(page).toHaveScreenshot(`${device}-${theme}-menu.png`, {animations: 'disabled', maxDiffPixels: 50});
            }
        });
    }
}

for (const theme of ['light', 'dark'] as const) {
    test(`wide ${theme} hero fades across the viewport`, async ({page}) => {
        await page.setViewportSize({width: 2560, height: 1100});
        await page.emulateMedia({colorScheme: theme});
        await mockFonts(page);
        await mockGitHub(page);
        await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'en'));
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        const atmosphere = page.locator('.hero-atmosphere');
        const bounds = (await atmosphere.boundingBox())!;
        expect(Math.abs(bounds.x)).toBeLessThan(1);
        expect(bounds.width).toBe(2560);
        await expect(atmosphere).toHaveCSS('mask-image', /radial-gradient/);
        await expect(page.locator('#home h1')).toHaveCSS('opacity', '1');
        await expect(page).toHaveScreenshot(`desktop-wide-${theme}-hero.png`, {animations: 'disabled', maxDiffPixels: 50});
    });
}

test('theme updates shared surfaces and preserves a transparent logo', async ({page}) => {
    await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
    await mockFonts(page);
    await mockGitHub(page);
    await page.emulateMedia({colorScheme: 'light'});
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(245, 241, 232)');
    await page.locator('#resume').scrollIntoViewIfNeeded();
    await page.emulateMedia({colorScheme: 'dark'});
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await expect(page.locator('.about-skills')).toHaveCSS('color', 'rgb(248, 250, 252)');
    await expect(page.locator('.brand-image')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const cornerAlpha = await page.locator('.brand-image').evaluate(async (image: HTMLImageElement) => {
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]]
            .map(([x, y]) => context.getImageData(x, y, 1, 1).data[3]);
    });
    expect(cornerAlpha).toEqual([0, 0, 0, 0]);
    await page.emulateMedia({colorScheme: 'light'});
    await expect(page.locator('.about-skills')).toHaveCSS('color', 'rgb(15, 23, 42)');
});
