import { expect, test as setup } from '@playwright/test';

const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
};

setup('authenticate', async ({ page }) => {
  // Arrange: Navigate to register page
  await page.goto('/register');

  // Act: Fill registration form and submit
  await page.getByPlaceholder(/email/i).fill(TEST_USER.email);
  await page.getByPlaceholder(/password/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /create account/i }).click();

  // Assert: Should redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  // Save authentication state for reuse in other tests
  await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
});

