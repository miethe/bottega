import { defineConfig } from '@playwright/test';

const live = process.env.BOTTEGA_URL;
const baseURL = live ?? 'http://localhost:4173/bottega/';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL, browserName: 'chromium', trace: 'off' },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 } },
    { name: 'desk', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: live
    ? undefined
    : { command: 'npm run preview', url: 'http://localhost:4173/bottega/', reuseExistingServer: true, timeout: 30_000 },
});
