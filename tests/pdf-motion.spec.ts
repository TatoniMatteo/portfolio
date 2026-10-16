import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub, samplePDF} from './fixtures';

async function readyPDF(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.locator('#resume').scrollIntoViewIfNeeded();
    await expect(page.locator('.pdf-viewer')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('.pdf-text-layer')).toContainText('Matteo Tatoni');
}

test.beforeEach(async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'en'));
    await mockFonts(page);
    await mockGitHub(page);
    await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF(3)}));
});

test('PDF text is selectable and aligned with the rendered page', async ({page}) => {
    await readyPDF(page);
    const text = page.locator('.pdf-text-layer span').first();
    const canvas = page.locator('.pdf-page canvas');
    const paperBox = (await canvas.boundingBox())!;
    const textBox = (await text.boundingBox())!;
    const scale = paperBox.width / 595;
    expect(Math.abs(textBox.x - paperBox.x - 50 * scale)).toBeLessThan(2);
    expect(textBox.height).toBeGreaterThan(10);
    const selected = await text.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        return selection.toString();
    });
    expect(selected).toBe('Matteo Tatoni');
});

test('fit modes switch between readable width and a complete page', async ({page}) => {
    await readyPDF(page);
    const viewport = page.locator('.pdf-viewer');
    expect(await viewport.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await page.getByRole('button', {name: 'Fit page', exact: true}).click();
    await expect(viewport).toHaveAttribute('aria-busy', 'false');
    expect(await viewport.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    await page.getByRole('button', {name: 'Fit width', exact: true}).click();
    await expect(viewport).toHaveAttribute('aria-busy', 'false');
    expect(await viewport.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
});

test('rapid zoom and page changes commit the final readable frame', async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await readyPDF(page);
    const initial = await page.locator('.pdf-page canvas').evaluate((canvas) => canvas.getBoundingClientRect().width);
    await page.getByRole('button', {name: 'Zoom in', exact: true}).evaluate((button: HTMLButtonElement) => {
        for (let i = 0; i < 15; i++) button.click();
    });
    await expect(page.locator('.pdf-zoom')).toHaveText('300%');
    await expect(page.locator('.pdf-viewer')).toHaveAttribute('aria-busy', 'false');
    await expect.poll(() => page.locator('.pdf-page canvas').evaluate((canvas) => canvas.getBoundingClientRect().width)).toBeCloseTo(initial * 3, 0);
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    await page.getByRole('button', {name: 'Previous page', exact: true}).click();
    await expect(page.locator('.pdf-viewer')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('.pdf-text-layer')).toContainText('Test resume - page 2');
    await page.getByRole('button', {name: 'Reset zoom', exact: true}).click();
    await expect(page.locator('.pdf-zoom')).toHaveText('100%');
    expect(errors).toEqual([]);
});

test('PDF keyboard controls and fullscreen work without losing the document', async ({page}) => {
    await readyPDF(page);
    const viewport = page.getByRole('region', {name: 'Resume preview'});
    await viewport.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.pdf-page-info')).toHaveText('2 / 3');
    await page.keyboard.press('+');
    await expect(page.locator('.pdf-zoom')).toHaveText('120%');
    await page.keyboard.press('0');
    await expect(page.locator('.pdf-zoom')).toHaveText('100%');
    const scrollBeforeFullscreen = await page.evaluate(() => scrollY);
    await page.getByRole('button', {name: 'Fullscreen', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Exit fullscreen'})).toBeVisible();
    await expect(page.locator('.pdf-viewer')).toHaveAttribute('aria-busy', 'false');
    await page.getByRole('button', {name: 'Exit fullscreen'}).click();
    await expect(page.getByRole('button', {name: 'Fullscreen', exact: true})).toBeVisible();
    await expect(page.locator('.pdf-text-layer')).toContainText('Test resume - page 2');
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(scrollBeforeFullscreen, 0);
});

test.describe('high density mobile screen', () => {
    test.use({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
    test('PDF remains sharp and can scroll naturally on touch devices', async ({page}) => {
        await readyPDF(page);
        const ratio = await page.locator('.pdf-page canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width / canvas.getBoundingClientRect().width);
        expect(ratio).toBeGreaterThanOrEqual(2);
        const viewport = page.locator('.pdf-viewer');
        await page.getByRole('button', {name: 'Zoom in', exact: true}).click();
        await page.getByRole('button', {name: 'Zoom in', exact: true}).click();
        await expect(viewport).toHaveAttribute('aria-busy', 'false');
        await viewport.evaluate((element) => { element.scrollTop = 120; });
        expect(await viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        await page.getByRole('button', {name: 'Zoom in', exact: true}).click();
        await expect(viewport).toHaveAttribute('aria-busy', 'false');
        expect(await viewport.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    });
});

test('reduced motion disables decorative loops and keeps content immediately readable', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('.hero-atmosphere span').first()).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.hero-portrait')).toHaveCSS('transform', 'none');
    await expect(page.locator('#home h1')).toHaveCSS('filter', 'none');
    await expect(page.locator('.reading-progress')).toHaveCount(0);
});

test('pointer tilt, orbital animation and scroll progress respond with motion enabled', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto('/');
    await expect(page.locator('#home h1')).toHaveCSS('opacity', '1');
    const portrait = page.locator('.hero-portrait');
    const bounds = (await portrait.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height * 0.3);
    await expect.poll(() => portrait.locator('img').evaluate((image) => getComputedStyle(image).transform !== 'none')).toBe(true);
    await expect(portrait.locator('.portrait-orbit-gold')).toHaveCSS('animation-name', 'hero-orbit-gold');
    await expect(portrait.locator('.portrait-orbit')).toHaveCount(2);
    await expect(portrait.locator('.portrait-orbit-gold')).toHaveAttribute('stroke-linecap', 'round');
    await page.locator('#my-projects').scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('.reading-progress').evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a)).toBeGreaterThan(0.1);
});

for (const width of [390, 1440]) {
    test(`animated fullscreen returns to Resume at ${width}px`, async ({page}, testInfo) => {
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.setViewportSize({width, height: 1000});
        await readyPDF(page);
        const container = page.locator('.pdf-container');
        await page.getByRole('button', {name: 'Next page', exact: true}).click();
        await expect(page.locator('.pdf-viewer')).toHaveAttribute('aria-busy', 'false');
        for (const nativeExit of [false, true]) {
            await page.getByRole('button', {name: 'Fullscreen', exact: true}).click();
            await expect(container).toHaveClass(/is-fullscreen-transition/);
            await expect(container).not.toHaveClass(/is-fullscreen-transition/);
            await expect(page.getByRole('button', {name: 'Exit fullscreen'})).toBeVisible();
            if (!nativeExit) await page.screenshot({path: testInfo.outputPath(`fullscreen-${width}.png`)});
            if (nativeExit) {
                await page.emulateMedia({reducedMotion: 'reduce'});
                await page.evaluate(() => document.exitFullscreen());
            }
            else await page.getByRole('button', {name: 'Exit fullscreen'}).click();
            await expect(container).not.toHaveClass(/is-fullscreen-transition/);
            await expect(page.locator('html')).not.toHaveAttribute('data-pdf-fullscreen');
            await expect(container).toBeInViewport();
            await expect(page.locator('.pdf-text-layer')).toContainText('Test resume - page 2');
            expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000);
            await expect(page.getByRole('button', {name: 'Fullscreen', exact: true})).toBeFocused();
        }
    });
}

test('motion stays subtle, pauses offscreen and responds to reduced motion changes', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto('/');
    await expect(page.locator('.hero-action')).toHaveCSS('opacity', '1');
    const orbit = page.locator('.portrait-orbit-gold');
    await expect(orbit).toHaveCSS('animation-duration', '48s');
    await expect(orbit).toHaveCSS('animation-play-state', 'running');
    await expect(page.locator('.hero-atmosphere span').first()).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.hero-greeting')).toHaveCSS('animation-name', 'none');
    await page.locator('#contact-me').scrollIntoViewIfNeeded();
    await expect(orbit).toHaveCSS('animation-play-state', 'paused');
    await page.mouse.move(0, 0);
    const contact = page.getByRole('link', {name: 'Email', exact: true});
    await expect(contact).toHaveCSS('opacity', '1');
    await contact.hover();
    await expect(contact).toHaveCSS('translate', '0px -2px');
    await page.emulateMedia({reducedMotion: 'reduce'});
    await expect(contact).toHaveCSS('translate', 'none');
    await expect(orbit).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.reading-progress')).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCSS('animation-name', 'none');
});
