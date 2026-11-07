import {test, expect} from '@playwright/test';
import {mockFonts, mockGitHub, samplePDF} from './fixtures';

const anchors = ['home', 'about-me', 'career', 'resume', 'open-source', 'my-projects', 'contact-me'];

test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
        if (!localStorage.getItem('portfolio-lang')) localStorage.setItem('portfolio-lang', 'en');
    });
    await mockFonts(page);
    await mockGitHub(page);
    await page.route('**/cv/*.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF(2)}));
});

for (const mobile of [false, true]) {
    test(`every navigation link reaches its section on ${mobile ? 'mobile' : 'desktop'}`, async ({page}) => {
        await page.setViewportSize(mobile ? {width: 390, height: 844} : {width: 1440, height: 1000});
        await page.goto('/');
        for (const id of anchors) {
            if (mobile) await page.getByRole('button', {name: 'Navigation menu'}).click();
            await page.locator(`nav .nav-menu a[href="#${id}"]`).click();
            await expect(page).toHaveURL(new RegExp(`#${id}$`));
            await expect(page.locator(`#${id}`).getByRole('heading').first()).toBeInViewport();
            if (mobile) await expect(page.getByRole('button', {name: 'Navigation menu'})).toHaveAttribute('aria-expanded', 'false');
        }
    });
}

test('CV renders actual pixels, changes pages, zooms and downloads a PDF', async ({page}) => {
    await page.goto('/');
    await page.locator('#resume').scrollIntoViewIfNeeded();
    await expect(page.locator('.pdf-page-info')).toHaveText('1 / 2');
    const canvas = page.locator('.pdf-viewer canvas');
    await expect.poll(() => canvas.evaluate((element: HTMLCanvasElement) => {
        const context = element.getContext('2d')!;
        const data = context.getImageData(0, 0, element.width, element.height).data;
        let darkPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0 && data[i] < 120 && data[i + 1] < 120 && data[i + 2] < 120) darkPixels++;
        }
        return darkPixels;
    })).toBeGreaterThan(100);
    const originalWidth = await canvas.evaluate((element) => element.getBoundingClientRect().width);
    await page.getByRole('button', {name: 'Zoom in', exact: true}).click();
    await expect.poll(() => canvas.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(originalWidth);
    await page.getByRole('button', {name: 'Next page', exact: true}).click();
    await expect(page.locator('.pdf-page-info')).toHaveText('2 / 2');
    await expect(page.getByRole('button', {name: 'Next page', exact: true})).toBeDisabled();
    await page.getByRole('button', {name: 'Previous page', exact: true}).click();
    await expect(page.locator('.pdf-page-info')).toHaveText('1 / 2');
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Download PDF', exact: true}).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('CV-Matteo-Tatoni.pdf');
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).subarray(0, 4).toString()).toBe('%PDF');
});

test('unavailable CV shows an error and recovers when switching to an available language', async ({page}) => {
    await page.route('**/cv/cv-en.pdf', (route) => route.fulfill({status: 404}));
    await page.goto('/');
    await page.locator('#resume').scrollIntoViewIfNeeded();
    await expect(page.getByRole('alert')).toContainText('Resume not available at the moment.');
    await page.getByRole('button', {name: 'IT', exact: true}).click();
    await expect(page.locator('.pdf-page-info')).toHaveText('1 / 2');
    await expect(page.getByRole('alert')).toHaveCount(0);
});

test('language persists across reload and selected content survives desktop/mobile resizing', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button', {name: 'IT', exact: true}).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    const project = page.getByRole('button', {name: 'Portfolio Website', exact: true});
    await project.click();
    for (const width of [390, 1440, 768, 769]) {
        await page.setViewportSize({width, height: 900});
        await expect(project).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator(width <= 768 ? '.navbar-mobile' : '.navbar-desktop')).toBeVisible();
        await expect(page.locator('#home')).toHaveCount(1);
        await expect(page.locator('#about-me')).toHaveCount(1);
    }
});

test('dynamically loaded repositories can be selected and all project images load', async ({page}) => {
    await page.route('https://api.github.com/users/**', (route) => route.fulfill({json: [{
        name: 'Example repository', description: 'A project loaded from GitHub.',
        html_url: 'https://github.com/TatoniMatteo/example', stargazers_count: 3, forks_count: 1,
        language: 'Java', fork: false, archived: false,
    }]}));
    await page.goto('/');
    const project = page.getByRole('button', {name: 'Example repository'});
    await project.click();
    await expect(page.locator('#project-preview')).toContainText('A project loaded from GitHub.');
    await expect(page.locator('#project-preview a')).toHaveAttribute('href', 'https://github.com/TatoniMatteo/example');
    for (const title of ['Water Health', 'Portfolio Website']) {
        await page.getByRole('button', {name: title, exact: true}).click();
        await expect.poll(() => page.locator('#project-preview img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
});

test('normal animations reveal the main content without runtime errors', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('#home h1')).toHaveCSS('opacity', '1');
    await page.locator('#my-projects').scrollIntoViewIfNeeded();
    await expect(page.locator('#project-preview')).toHaveCSS('opacity', '1');
    await page.locator('#contact-me').scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', {name: 'Email', exact: true})).toBeInViewport();
    await expect(page.getByRole('link', {name: 'Email', exact: true})).toHaveAttribute('href', 'mailto:tatonimatteo@gmail.com');
    expect(errors).toEqual([]);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer')).toHaveCSS('transform', 'none');
    await expect(page.locator('footer')).toHaveCSS('animation-name', 'none');
    await page.getByRole('link', {name: 'Back to top', exact: true}).click();
    await expect(page.locator('#home h1')).toBeInViewport();
});

test('section guide follows centered scrolling and keeps long sections readable', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto('/');
    const guide = page.getByRole('navigation', {name: 'Section navigation'});
    await expect(guide).toBeVisible();
    await guide.getByRole('link', {name: 'Contact Me', exact: true}).click();
    await expect(guide.getByRole('link', {name: 'Contact Me', exact: true})).toHaveAttribute('aria-current', 'location');
    await expect.poll(() => page.locator('#contact-me').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const end = document.querySelector('footer')!.getBoundingClientRect().bottom;
        return Math.abs((rect.top + end) / 2 - innerHeight / 2);
    })).toBeLessThan(4);
    // A wheel gesture near a section settles onto its center.
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, -180);
    await expect.poll(() => page.locator('#contact-me').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const end = document.querySelector('footer')!.getBoundingClientRect().bottom;
        return Math.abs((rect.top + end) / 2 - innerHeight / 2);
    })).toBeLessThan(4);
    await page.setViewportSize({width: 390, height: 844});
    await expect(guide).toBeHidden();
    await page.locator('.skill-group-tools').scrollIntoViewIfNeeded();
    await expect(page.locator('.skill-group-tools')).toBeInViewport();
    await expect(page.locator('.skill-group-tools')).toContainText('Git');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer')).toBeInViewport();
});

for (const width of [390, 1440]) {
    test(`theme preference cycles, persists and follows the system at ${width}px`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.emulateMedia({colorScheme: 'dark'});
        await page.goto('/');
        const root = page.locator('html');
        const button = page.locator('.theme-switcher');
        await expect(button).toHaveAccessibleName('Theme: System. Switch to Light');
        await expect(root).toHaveAttribute('data-theme', 'dark');
        await button.focus();
        await page.keyboard.press('Enter');
        await expect(root).toHaveAttribute('data-theme', 'light');
        await page.reload();
        await expect(root).toHaveAttribute('data-theme', 'light');
        await expect(button).toHaveAccessibleName('Theme: Light. Switch to Dark');
        await button.click();
        await expect(root).toHaveAttribute('data-theme', 'dark');
        await page.emulateMedia({colorScheme: 'light'});
        await expect(root).toHaveAttribute('data-theme', 'dark');
        await button.click();
        await expect(root).toHaveAttribute('data-theme', 'light');
        await page.emulateMedia({colorScheme: 'dark'});
        await expect(root).toHaveAttribute('data-theme', 'dark');
        await page.setViewportSize({width: width === 390 ? 1440 : 390, height: 900});
        await expect(page.locator('.theme-switcher')).toHaveAccessibleName('Theme: System. Switch to Light');
    });
}

test('an invalid saved theme falls back to the system preference', async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-theme', 'invalid'));
    await page.emulateMedia({colorScheme: 'dark'});
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.theme-switcher')).toHaveAccessibleName('Theme: System. Switch to Light');
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`arrow keys move section by section with ${reducedMotion} motion`, async ({page}) => {
        await page.emulateMedia({reducedMotion});
        await page.setViewportSize({width: 1440, height: 1000});
        await page.goto('/');
        const guide = page.locator('.section-guide');
        for (const id of anchors.slice(1)) {
            await page.keyboard.press('ArrowDown');
            await expect(guide.locator(`a[href="#${id}"]`)).toHaveAttribute('aria-current', 'location');
            await expect(page.locator(`#${id}`).getByRole('heading').first()).toBeInViewport();
        }
        await expect(page.locator('footer')).toBeInViewport();
        for (const id of [...anchors.slice(0, -1)].reverse()) {
            await page.keyboard.press('ArrowUp');
            await expect(guide.locator(`a[href="#${id}"]`)).toHaveAttribute('aria-current', 'location');
        }
        await expect(page.locator('.navbar-desktop')).toBeInViewport();
        await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
    });
}

test('rapid arrow presses reach the requested section and leave PDF keys alone', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto('/');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.section-guide a[href="#career"]')).toHaveAttribute('aria-current', 'location');
    await page.keyboard.press('ArrowDown');
    const pdf = page.getByRole('region', {name: 'Resume preview'});
    await expect(pdf).toHaveAttribute('aria-busy', 'false');
    await pdf.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.pdf-page-info')).toHaveText('2 / 2');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.section-guide a[href="#resume"]')).toHaveAttribute('aria-current', 'location');
});

for (const width of [390, 1440]) {
    test(`career milestones remain readable and selectable at ${width}px`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.goto('/');
        const buttons = page.locator('.timeline-event');
        await expect(buttons).toHaveCount(5);
        await page.locator('#career').scrollIntoViewIfNeeded();
        const list = page.locator('.timeline-container');
        await expect(list).toHaveCSS('direction', 'rtl');
        await expect.poll(async () => {
            const navigation = (await page.locator('.timeline-navigation').boundingBox())!;
            const card = (await page.locator('.timeline-detail-card').boundingBox())!;
            return Math.abs(navigation.height - card.height);
        }).toBeLessThan(1);
        expect(await page.locator('.timeline-detail-card').evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(440);
        const overflows = await list.evaluate((element) => element.scrollHeight > element.clientHeight);
        if (overflows) {
            await list.evaluate((element) => { element.scrollTop = element.scrollHeight; });
            expect(await list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        }
        await expect(buttons.last()).toBeInViewport();
        for (let index = 0; index < 5; index++) {
            const button = buttons.nth(index);
            const title = await button.locator('.timeline-event-title').innerText();
            await button.focus();
            await page.keyboard.press('Enter');
            await expect(button).toHaveAttribute('aria-pressed', 'true');
            await expect(page.locator('.timeline-detail-card h3')).toHaveText(title);
            await expect(page.locator('.timeline-event[aria-pressed="true"]')).toHaveCount(1);
            await expect(button).toBeInViewport();
            await page.locator('.timeline-detail-card').scrollIntoViewIfNeeded();
            await expect(page.locator('.timeline-description')).toBeInViewport();
        }
    });
}

for (const width of [390, 1440]) {
    test(`CV language changes independently of the site at ${width}px`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.route('**/cv/cv-en.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF(3)}));
        await page.route('**/cv/cv-it.pdf', (route) => route.fulfill({contentType: 'application/pdf', body: samplePDF(2)}));
        await page.goto('/');
        const selector = page.getByRole('group', {name: 'Resume language'});
        await selector.scrollIntoViewIfNeeded();
        await expect(selector.getByRole('button', {name: 'English', exact: true})).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.pdf-page-info')).toHaveText('1 / 3');
        await selector.getByRole('button', {name: 'Italiano', exact: true}).focus();
        await page.keyboard.press('Space');
        await expect(page.locator('.pdf-page-info')).toHaveText('1 / 2');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('.pdf-document-title')).toContainText('Italiano');
        await expect(page.locator('.resume-download')).toHaveAttribute('href', /cv-it\.pdf$/);
        const downloadEvent = page.waitForEvent('download');
        await page.locator('.resume-download').click();
        expect((await downloadEvent).url()).toMatch(/cv-it\.pdf$/);
        await selector.getByRole('button', {name: 'English', exact: true}).click();
        await expect(page.locator('.pdf-page-info')).toHaveText('1 / 3');
        await expect(page.locator('.resume-download')).toHaveAttribute('href', /cv-en\.pdf$/);
    });
}

test('phone contact opens the dialer and matches the WhatsApp number', async ({page}) => {
    await page.goto('/');
    const phone = page.getByRole('link', {name: 'Phone', exact: true});
    await phone.scrollIntoViewIfNeeded();
    await expect(phone).toHaveAttribute('href', 'tel:+393318985076');
    await expect(phone).toContainText('+39 331 898 5076');
    await expect(page.getByRole('link', {name: 'Whatsapp', exact: true})).toHaveAttribute('href', 'https://wa.me/393318985076');
    // Inspect the link without launching a real phone application.
    await expect(phone).not.toHaveAttribute('target', '_blank');
    await page.getByRole('button', {name: 'IT', exact: true}).click();
    await expect(page.getByRole('link', {name: 'Telefono', exact: true})).toHaveAttribute('href', 'tel:+393318985076');
});
