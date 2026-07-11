import { defineConfig } from 'playwright/test';

/**
 * Browser smoke tests for the web build. Runs against the Expo dev server;
 * the first page load triggers a Metro bundle, hence the generous timeouts.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  retries: 0,
  use: {
    baseURL: 'http://localhost:8081',
    navigationTimeout: 120_000,
    // The emergency locator sorts hospitals by distance from the device;
    // pin the test location to central Dhaka.
    permissions: ['geolocation'],
    geolocation: { latitude: 23.7808, longitude: 90.2792 },
  },
  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
