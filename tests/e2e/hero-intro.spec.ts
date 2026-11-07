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
        const header = page.getByRole('banner');
        const initialTop = (await stage.boundingBox())!.y;
        const headerTop = (await header.boundingBox())!.y;
        expect(initialTop).toBeCloseTo(0, 0);
        await page.evaluate(() => window.scrollTo({top: 40, behavior: 'instant'}));
        await expect.poll(async () => (await stage.boundingBox())!.y).toBeCloseTo(initialTop, 0);
        expect((await header.boundingBox())!.y).toBeCloseTo(headerTop, 0);
        await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
        await expect(page.locator('.portrait-brackets, .hero-code-sparks')).toHaveCount(0);
        await page.screenshot({path: testInfo.outputPath('intro-first.png')});
        const start = await page.locator('#home').evaluate((element) => element.offsetTop);
        await page.evaluate((top) => {
            document.documentElement.style.scrollSnapType = 'none';
            window.scrollTo({top, behavior: 'instant'});
        }, start + 100);
        const pinnedTop = (await page.locator('.hero-stage').boundingBox())!.y;
        await page.evaluate((top) => window.scrollTo({top, behavior: 'instant'}), start + 720);
        await expect(second).toHaveAttribute('aria-hidden', 'false');
        await expect(first).toHaveAttribute('inert', '');
        await expect(second).toHaveCSS('opacity', '1');
        expect((await page.locator('.hero-stage').boundingBox())!.y).toBeCloseTo(pinnedTop, 0);
        expect((await header.boundingBox())!.y).toBeCloseTo(headerTop, 0);
        await expect(header.getByRole('navigation')).toBeInViewport();
        await page.screenshot({path: testInfo.outputPath('intro-second.png')});
        await page.evaluate((top) => window.scrollTo({top, behavior: 'instant'}), start + 450);
        await expect.poll(() => second.evaluate((element) => Number(getComputedStyle(element).opacity)))
            .toBeGreaterThan(.2);
        for (const scene of [first, second]) {
            expect(await scene.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42)).toBe(0);
        }
        await page.screenshot({path: testInfo.outputPath('intro-transition.png')});
        await page.evaluate((top) => window.scrollTo({top, behavior: 'instant'}), start + 1050);
        await expect.poll(async () => (await stage.boundingBox())!.y).toBeLessThan(-100);
        expect((await header.boundingBox())!.y).toBeCloseTo((await stage.boundingBox())!.y, 0);
        await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
        await expect(first).toHaveAttribute('aria-hidden', 'false');
        await expect(first).toHaveCSS('opacity', '1');
        await page.locator('.hero-scroll-hint').click();
        await expect(page.locator('#about-heading')).toBeInViewport();
        await expect(page.locator('.hero-stage')).not.toBeInViewport();
    });
}

test('reduced motion presents both scenes in normal flow and translates the introduction', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/');
    await expect(page.locator('.hero-stage')).toHaveCSS('position', 'relative');
    await expect(page.locator('.portrait-brackets, .hero-code-sparks')).toHaveCount(0);
    await expect(page.locator('.hero-scene[inert]')).toHaveCount(0);
    await expect(page.locator('.hero-scene-second .hero-copy')).toHaveCSS('opacity', '1');
    await expect(page.locator('#home h1')).toContainText('Ciao, sono Matteo Tatoni.');
    await page.getByRole('button', {name: 'Menu di navigazione'}).click();
    await page.getByRole('button', {name: 'EN', exact: true}).click();
    await expect(page.locator('#home h1')).toContainText('Hi, I’m Matteo Tatoni.');
    await expect(page.locator('#home h2')).toContainText('Frontend is my playground.');
});
