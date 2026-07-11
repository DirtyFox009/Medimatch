import { test, expect } from 'playwright/test';

// Smoke tests for the web build (Section 9 of the SRS): each test walks a
// surface that must work without seeded data or a signed-in user.

test('login screen renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('MediMatch').first()).toBeVisible();
  await expect(page.getByText('Welcome back')).toBeVisible();
  await expect(page.getByText('Log In').first()).toBeVisible();
});

test('emergency locator is reachable from the login screen without an account', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Emergency — find nearby hospitals').click();
  // No auth redirect: the bundled hospital list renders with call buttons.
  await expect(page.getByText('Call 999').first()).toBeVisible();
  await expect(page.getByText('Dhaka Medical College Hospital').first()).toBeVisible();
});

test('registration screen is reachable and asks for privacy consent', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Create Account').first().click();
  await expect(page.getByText('Create your account')).toBeVisible();
  await expect(page.getByText(/Privacy Policy/).first()).toBeVisible();
});
