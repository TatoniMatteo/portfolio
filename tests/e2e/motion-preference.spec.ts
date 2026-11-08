import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub} from './fixtures';

const preferenceKey = 'portfolio-reduced-motion';

test.beforeEach(async ({page}) => {
    await mockFonts(page);
    await mockGitHub(page);
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'it'));
});

for (const width of [390, 1440]) {
    test(`footer switch controls and remembers motion at ${width}px`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.goto('/');
        const toggle = page.getByRole('switch', {name: 'Riduci le animazioni'});
        const orbit = page.locator('.portrait-orbit-gold');
        await expect(toggle).not.toBeChecked();
        await toggle.scrollIntoViewIfNeeded();
        await toggle.check();
        await expect(toggle).toBeChecked();
        await expect(toggle).toBeInViewport();
        await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
        await expect(orbit).toHaveCSS('animation-name', 'none');
        await expect(page.locator('.hero-stage')).toHaveCSS('position', 'relative');
        const scenes = page.locator('.hero-scene');
        await expect(scenes).toHaveCount(3);
        let previousBottom = -Infinity;
        for (const scene of await scenes.all()) {
            await expect(scene).toHaveCSS('position', 'relative');
            await expect(scene).toHaveCSS('opacity', '1');
            await expect(scene).toHaveAttribute('aria-hidden', 'false');
            await expect(scene).not.toHaveAttribute('inert', '');
            const bounds = (await scene.boundingBox())!;
            expect(bounds.height).toBeGreaterThan(0);
            expect(bounds.y).toBeGreaterThanOrEqual(previousBottom - 1);
            previousBottom = bounds.y + bounds.height;
        }
        const sceneContainer = (await page.locator('.hero-scenes').boundingBox())!;
        expect(sceneContainer.y + sceneContainer.height).toBeGreaterThanOrEqual(previousBottom - 1);
        for (const name of ['first', 'second', 'third']) {
            const scene = page.locator(`.hero-scene-${name}`);
            await scene.getByRole('heading').scrollIntoViewIfNeeded();
            await expect(scene.getByRole('heading')).toBeInViewport();
            await expect(scene.locator('.hero-copy p')).toBeInViewport();
        }
        await toggle.scrollIntoViewIfNeeded();
        await expect(page.locator('.reading-progress')).toHaveCount(0);
        await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
        expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBe('true');
        await page.reload();
        await expect(toggle).toBeChecked();
        await expect(orbit).toHaveCSS('animation-name', 'none');
        await toggle.scrollIntoViewIfNeeded();
        await toggle.focus();
        await page.keyboard.press('Space');
        await expect(toggle).not.toBeChecked();
        await expect(toggle).toBeFocused();
        await expect(toggle).toBeInViewport();
        await expect(page.locator('.hero-stage')).toHaveCSS('position', 'sticky');
        await expect(orbit).toHaveCSS('animation-name', 'hero-orbit-gold');
        await expect(page.locator('.reading-progress')).toHaveCount(1);
        await page.emulateMedia({reducedMotion: 'reduce'});
        await expect(toggle).not.toBeChecked();
        await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false');
        await page.evaluate((key) => {
            localStorage.removeItem(key);
            window.dispatchEvent(new StorageEvent('storage', {key}));
        }, preferenceKey);
        await expect(toggle).toBeChecked();
        await expect(orbit).toHaveCSS('animation-name', 'none');
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await expect(toggle).not.toBeChecked();
    });
}

test('motion choice works when browser storage is unavailable', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.addInitScript((key) => {
        const get = Storage.prototype.getItem.bind(localStorage);
        const set = Storage.prototype.setItem.bind(localStorage);
        Storage.prototype.getItem = function (name) {
            if (name === key) throw new Error('Storage unavailable');
            return get(name);
        };
        Storage.prototype.setItem = function (name, value) {
            if (name === key) throw new Error('Storage unavailable');
            return set(name, value);
        };
    }, preferenceKey);
    await page.goto('/');
    const toggle = page.getByRole('switch', {name: 'Riduci le animazioni'});
    await toggle.check();
    await expect(toggle).toBeChecked();
    await expect(page.locator('.portrait-orbit-gold')).toHaveCSS('animation-name', 'none');
    await page.reload();
    await expect(toggle).not.toBeChecked();
});

test('motion choice synchronizes between tabs', async ({page, context}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto('/');
    const other = await context.newPage();
    await mockFonts(other);
    await mockGitHub(other);
    await other.emulateMedia({reducedMotion: 'no-preference'});
    await other.goto('/');
    const remoteToggle = other.getByRole('switch', {name: 'Riduci le animazioni'});
    await expect(remoteToggle).not.toBeChecked();
    await page.getByRole('switch', {name: 'Riduci le animazioni'}).check();
    await expect(remoteToggle).toBeChecked();
    await expect(other.locator('.portrait-orbit-gold')).toHaveCSS('animation-name', 'none');
    await other.close();
});
