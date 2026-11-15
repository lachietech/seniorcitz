import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'static.spec.js',
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5099',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    headless: true,
    timezoneId: 'Australia/Brisbane'
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5099 --strictPort',
    url: 'http://127.0.0.1:5099',
    reuseExistingServer: false
  }
});
