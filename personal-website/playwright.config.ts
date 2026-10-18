import { defineConfig } from '@playwright/test';

// Browser tests run against the static export (out/), served like Vercel serves it.
// Build first: `npm run build`. Locally they use the Chrome that is installed;
// in CI they use the Chromium that `npx playwright install` fetches.
export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    channel: process.env.CI ? undefined : 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-out.mjs 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
