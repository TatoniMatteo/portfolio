import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    reporter: [['list'], ['html', {open: 'never'}]],
    snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        browserName: 'chromium',
        channel: process.env.PLAYWRIGHT_CHANNEL,
        reducedMotion: 'reduce',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npm exec vite -- --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
    },
});
