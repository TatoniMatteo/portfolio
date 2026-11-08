import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub, samplePDF} from './fixtures';

test.beforeEach(async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'it'));
    await mockFonts(page);
    await mockGitHub(page);
    await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF()}));
});

for (const width of [390, 1440]) {
    test(`three pinned scenes advance and reverse at ${width}px`, async ({page}, testInfo) => {
        await page.setViewportSize({width, height: 900});
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => { document.documentElement.style.scrollSnapType = 'none'; });
        const travel = await page.locator('#home').evaluate((element) => element.getBoundingClientRect().height - innerHeight);
        const scenes = ['first', 'second', 'third'].map((name) => page.locator(`.hero-scene-${name}`));
        const stage = page.locator('.hero-stage');
        const header = page.getByRole('banner');
        const headerTop = (await header.boundingBox())!.y;
        await expect(page.locator('.code-transition-trail, .code-transition-ball, .code-transition-particle, .liquid-transition-defs')).toHaveCount(0);
        const jump = async (progress: number) => page.evaluate((top) => window.scrollTo({top, behavior: 'instant'}), travel * progress);
        for (const [index, progress] of [0, .5, 1].entries()) {
            await jump(progress);
            await expect(scenes[index]).toHaveAttribute('aria-hidden', 'false');
            await expect(scenes[index]).toHaveCSS('opacity', '1');
            await expect(page.locator('.hero-scene:not([inert])')).toHaveCount(1);
            expect((await stage.boundingBox())!.y).toBeCloseTo(0, 0);
            expect((await header.boundingBox())!.y).toBeCloseTo(headerTop, 0);
            await expect(page.locator('.hero-contact')).toBeInViewport();
            await page.screenshot({path: testInfo.outputPath(`intro-${index + 1}.png`)});
        }
        await expect(scenes[2]).toContainText('Apache Syncope.');
        await expect(scenes[2].getByRole('link')).toHaveAttribute('href', '#open-source');
        for (const [progress, visible] of [[.18, 0], [.36, 1], [.64, 1], [.82, 2]]) {
            await jump(progress);
            await expect.poll(() => scenes[visible].evaluate((element) => Number(getComputedStyle(element).opacity)))
                .toBeCloseTo(.5, 1);
            for (const index of [0, 1, 2].filter((candidate) => candidate !== visible)) {
                await expect(scenes[index]).toHaveCSS('opacity', '0');
            }
            for (const scene of scenes) {
                await expect(scene).toHaveCSS('filter', 'none');
                await expect(scene).toHaveCSS('clip-path', 'none');
                expect(await scene.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42)).toBe(0);
            }
            await page.screenshot({path: testInfo.outputPath(`intro-transition-${progress}.png`)});
        }
        await jump(0);
        await expect(scenes[0]).toHaveAttribute('aria-hidden', 'false');
        await expect(scenes[0]).toHaveCSS('opacity', '1');
        await page.evaluate((top) => window.scrollTo({top, behavior: 'instant'}), travel + 200);
        await expect.poll(async () => (await stage.boundingBox())!.y).toBeLessThan(-100);
        expect((await header.boundingBox())!.y).toBeCloseTo((await stage.boundingBox())!.y, 0);
        await jump(1);
        await expect(scenes[2]).toHaveAttribute('aria-hidden', 'false');
        await scenes[2].getByRole('link').click();
        await expect(page.locator('#open-source h2')).toBeInViewport();
        await jump(0);
        await page.locator('.hero-scroll-hint').click();
        await expect(page.locator('#about-heading')).toBeInViewport();
        await expect(stage).not.toBeInViewport();
    });
}

test('reduced motion presents all three scenes in normal flow and translates the introduction', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/');
    await expect(page.locator('.hero-stage')).toHaveCSS('position', 'relative');
    await expect(page.locator('.portrait-brackets, .hero-code-sparks')).toHaveCount(0);
    await expect(page.locator('.liquid-transition-defs, .code-transition-trail')).toHaveCount(0);
    await expect(page.locator('.hero-scene[inert]')).toHaveCount(0);
    await expect(page.locator('.hero-scene-second .hero-copy')).toHaveCSS('opacity', '1');
    await expect(page.locator('#home h1')).toContainText('Ciao, sono Matteo Tatoni.');
    await page.getByRole('button', {name: 'Menu di navigazione'}).click();
    await page.getByRole('button', {name: 'EN', exact: true}).click();
    await expect(page.locator('#home h1')).toContainText('Hi, I’m Matteo Tatoni.');
    await expect(page.locator('.hero-scene-third h2')).toContainText('I’m a committer on Apache Syncope.');
    await expect(page.locator('.hero-scene-second h2')).toContainText('Frontend is my playground.');
});

test('enabling reduced motion during the reveal releases all three complete scenes', async ({page}) => {
    await page.setViewportSize({width: 390, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto('/');
    await page.evaluate(() => {
        document.documentElement.style.scrollSnapType = 'none';
        window.scrollTo({top: (document.getElementById('home')!.offsetHeight - innerHeight) * .82, behavior: 'instant'});
    });
    await expect.poll(() => page.locator('.hero-scene-third').evaluate((element) => Number(getComputedStyle(element).opacity)))
        .toBeCloseTo(.5, 1);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await expect(page.locator('.liquid-transition-defs, .code-transition-trail')).toHaveCount(0);
    await expect(page.locator('.hero-scene[inert]')).toHaveCount(0);
    for (const scene of await page.locator('.hero-scene').all()) {
        await expect(scene).toHaveCSS('clip-path', 'none');
        await expect(scene).toHaveCSS('filter', 'none');
        await expect(scene).toHaveCSS('opacity', '1');
    }
});

for (const viewport of [{width: 320, height: 568}, {width: 667, height: 375}]) {
    test(`pinned scenes keep the header and actions clear at ${viewport.width}x${viewport.height}`, async ({page}, testInfo) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => { document.documentElement.style.scrollSnapType = 'none'; });
        for (const [top, scene] of [[0, '.hero-scene-first'], [viewport.height * 1.3, '.hero-scene-second'], [viewport.height * 2.6, '.hero-scene-third']] as const) {
            await page.evaluate((value) => window.scrollTo({top: value, behavior: 'instant'}), top);
            await expect(page.locator(scene)).toHaveCSS('opacity', '1');
            const header = (await page.locator('.site-header nav').boundingBox())!;
            const actions = (await page.locator('.hero-bottom').boundingBox())!;
            const copy = (await page.locator(`${scene} .hero-copy`).boundingBox())!;
            const illustration = (await page.locator(`${scene} ${top === 0 ? '.hero-portrait' : scene.endsWith('third') ? '.hero-community' : '.hero-tech'}`).boundingBox())!;
            expect(Math.min(copy.y, illustration.y)).toBeGreaterThanOrEqual(header.y + header.height);
            expect(Math.max(copy.y + copy.height, illustration.y + illustration.height)).toBeLessThanOrEqual(actions.y + 1);
            await expect(page.locator('.hero-contact')).toBeInViewport();
            await page.screenshot({path: testInfo.outputPath(`${scene}-small-screen.png`)});
        }
    });
}
