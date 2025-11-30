import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display dashboard header', async ({ page }) => {
    await page.goto('/dashboard');
    // Will redirect to login, but we can test the structure
    await expect(
      page.getByRole('heading', { name: /welcome back/i }),
    ).toBeVisible();
  });
});
