import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub, samplePDF} from './fixtures';

test.beforeEach(async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'it'));
    await mockFonts(page);
    await mockGitHub(page);
    await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
});

for (const width of [390, 1440]) {
    test(`short pinned introduction advances and reverses at ${width}px`, async ({page}, testInfo) => {
        await page.setViewportSize({width, height: 900});
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        const first = page.locator('.hero-scene-first');
        const second = page.locator('.hero-scene-second');
        await expect(first).toHaveAttribute('aria-hidden', 'false');
        await expect(second).toHaveAttribute('inert', '');
        await expect(page.locator('.hero-contact')).toBeInViewport();
        const stage = page.locator('.hero-stage');
        const initialTop = (await stage.boundingBox())!.y;
        expect(initialTop).toBeCloseTo(0, 0);
        await page.evaluate(() => window.scrollTo({top: 40, behavior: 'instant'}));
        await expect.poll(async () => (await stage.boundingBox())!.y).toBeCloseTo(initialTop, 0);
        await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
        const spark = page.locator('.hero-code-sparks span').first();
        await expect(page.locator('.hero-code-sparks span')).toHaveCount(8);
        await expect(spark).toHaveCSS('font-weight', '900');
        await expect(spark).toHaveCSS('animation-name', 'portrait-code-spark');
        const sparkTransform = await spark.evaluate((element) => getComputedStyle(element).transform);
        await expect.poll(() => spark.evaluate((element) => getComputedStyle(element).transform)).not.toBe(sparkTransform);
        const appearance = await spark.evaluate((element) => ({
            text: element.textContent, left: element.style.left, top: element.style.top, fontSize: element.style.fontSize,
        }));
        await expect.poll(() => spark.textContent(), {timeout: 7000}).not.toBe(appearance.text);
        const nextAppearance = await spark.evaluate((element) => ({
            left: element.style.left, top: element.style.top, fontSize: element.style.fontSize,
        }));
        expect(nextAppearance.left).not.toBe(appearance.left);
        expect(nextAppearance.top).not.toBe(appearance.top);
        expect(nextAppearance.fontSize).not.toBe(appearance.fontSize);
        await page.screenshot({path: testInfo.outputPath('intro-first.png')});
        const start = await page.locator('#home').evaluate((element) => element.offsetTop);
        await page.evaluate((top) => {
            document.documentElement.style.scrollSnapType = 'none';
            window.scrollTo({top, behavior: 'instant'});
        }, start + 100);
        await expect.poll(() => page.locator('.hero-code-sparks').evaluate((element) => {
            const matrix = new DOMMatrix(getComputedStyle(element).transform);
            return Math.hypot(matrix.a, matrix.b);
        })).toBeGreaterThan(1.1);
        const pinnedTop = (await page.locator('.hero-stage').boundingBox())!.y;
        await page.evaluate((top) => window.scrollTo({top, behavior: 'instant'}), start + 720);
        await expect(second).toHaveAttribute('aria-hidden', 'false');
        await expect(first).toHaveAttribute('inert', '');
        await expect(second.locator('.hero-copy')).toHaveCSS('opacity', '1');
        expect((await page.locator('.hero-stage').boundingBox())!.y).toBeCloseTo(pinnedTop, 0);
        await page.screenshot({path: testInfo.outputPath('intro-second.png')});
        await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
        await expect(first).toHaveAttribute('aria-hidden', 'false');
        await expect(first.locator('.hero-copy')).toHaveCSS('opacity', '1');
        await page.locator('.hero-scroll-hint').click();
        await expect(page.locator('#about-heading')).toBeInViewport();
        await expect(page.locator('.hero-stage')).not.toBeInViewport();
    });
}

test('reduced motion presents both scenes in normal flow and translates the introduction', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/');
    await expect(page.locator('.hero-stage')).toHaveCSS('position', 'relative');
    await expect(page.locator('.hero-code-sparks span').first()).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.hero-code-sparks')).toHaveCSS('transform', 'none');
    await expect(page.locator('.hero-scene[inert]')).toHaveCount(0);
    await expect(page.locator('.hero-scene-second .hero-copy')).toHaveCSS('opacity', '1');
    await expect(page.locator('#home h1')).toContainText('Ciao, sono Matteo Tatoni.');
    await page.getByRole('button', {name: 'Menu di navigazione'}).click();
    await page.getByRole('button', {name: 'EN', exact: true}).click();
    await expect(page.locator('#home h1')).toContainText('Hi, I’m Matteo Tatoni.');
    await expect(page.locator('#home h2')).toContainText('Frontend is my playground.');
});
