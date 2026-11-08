import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub, samplePDF} from './fixtures';

for (const viewport of [{width: 320, height: 568}, {width: 390, height: 844}, {width: 667, height: 375}]) {
    for (const language of ['it', 'en']) {
        test(`mobile career and CV use the available screen at ${viewport.width}px in ${language}`, async ({page}, testInfo) => {
            await page.setViewportSize(viewport);
            await page.addInitScript((value) => localStorage.setItem('portfolio-lang', value), language);
            await mockFonts(page);
            await mockGitHub(page);
            await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF(2)}));
            await page.goto('/');
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => { document.documentElement.style.scrollSnapType = 'none'; });

            for (const id of ['about-me', 'career', 'resume', 'open-source', 'my-projects', 'contact-me']) {
                const section = page.locator(`#${id}`);
                await section.evaluate((element) => element.scrollIntoView({block: 'start', behavior: 'instant'}));
                expect((await section.boundingBox())!.height).toBeCloseTo(viewport.height, 0);
                expect(Math.abs((await section.boundingBox())!.y)).toBeLessThanOrEqual(1);
                const nextTop = await section.evaluate((element) =>
                    (element.nextElementSibling ?? document.querySelector('footer'))!.getBoundingClientRect().top);
                expect(nextTop).toBeGreaterThanOrEqual(viewport.height - 1);
                const overflow = await section.evaluate((element) => {
                    const bounds = element.getBoundingClientRect();
                    return Array.from(element.children).filter((child) => child.getBoundingClientRect().bottom > bounds.bottom + 1)
                        .map((child) => child.className);
                });
                expect(overflow).toEqual([]);
                const track = section.locator('.mobile-panels-track');
                if (await track.count()) {
                    const total = await track.locator(':scope > .mobile-panel').count();
                    const counter = section.locator('.mobile-panels-controls [aria-live]');
                    await track.focus();
                    await page.keyboard.press('End');
                    await expect(counter).toHaveText(`${total} / ${total}`);
                    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
                    await page.keyboard.press('Home');
                    await expect(counter).toHaveText(`1 / ${total}`);
                    await section.locator('.mobile-panels-controls button').last().click();
                    await expect(counter).toHaveText(`2 / ${total}`);
                    await section.locator('.mobile-panels-controls button').first().click();
                    await expect(counter).toHaveText(`1 / ${total}`);
                }
                if (id === 'contact-me') {
                    await expect(track).toHaveCount(0);
                    await expect(section.locator('.contact-social')).toHaveCount(8);
                    const before = await page.evaluate(() => window.scrollY);
                    await section.getByRole('link', {name: 'Gravatar', exact: true}).scrollIntoViewIfNeeded();
                    await expect(section.getByRole('link', {name: 'Gravatar', exact: true})).toBeInViewport();
                    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThanOrEqual(1);
                }
            }

            const career = page.locator('#career');
            await career.evaluate((element) => element.scrollIntoView({block: 'start'}));
            const milestones = page.locator('.timeline-event');
            await expect(milestones.last()).toBeInViewport();
            expect((await page.locator('.timeline-navigation').boundingBox())!.height).toBeLessThan(130);
            const detail = page.locator('.timeline-detail-card');
            await expect(detail).toBeInViewport();
            const careerHeight = (await career.boundingBox())!.height;
            expect(careerHeight).toBeCloseTo(viewport.height, 0);
            await milestones.first().focus();
            await page.keyboard.press('Enter');
            await expect(milestones.first()).toHaveAttribute('aria-pressed', 'true');
            await expect(detail.locator('h3')).toHaveText(await milestones.first().locator('.timeline-event-title').innerText());
            await expect(milestones.first()).toBeInViewport();
            await page.screenshot({path: testInfo.outputPath('mobile-career.png')});

            const resume = page.locator('#resume');
            await resume.evaluate((element) => element.scrollIntoView({block: 'start'}));
            await expect(page.locator('.pdf-page-info')).toHaveText('1 / 2');
            await expect(page.locator('.pdf-viewer')).toHaveAttribute('aria-busy', 'false');
            const resumeHeight = (await resume.boundingBox())!.height;
            expect(resumeHeight).toBeCloseTo(viewport.height, 0);
            await expect(page.locator('.resume-download')).toBeInViewport();
            await expect(page.locator('.resume-language-switcher')).toBeInViewport();
            await expect(page.locator('.pdf-controls')).toBeInViewport();
            await expect(page.locator('.pdf-viewer canvas')).toBeVisible();
            await page.screenshot({path: testInfo.outputPath('mobile-resume.png')});
            await testInfo.attach('mobile-section-heights', {
                body: JSON.stringify({viewport, language, careerHeight, resumeHeight}),
                contentType: 'application/json',
            });
        });
    }
}
