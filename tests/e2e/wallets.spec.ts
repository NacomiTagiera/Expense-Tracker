import { expect, test } from '@playwright/test';

test.describe('Wallet Management', () => {
  const uniqueId = Date.now();

  test.describe('Create Wallet', () => {
    test('should create a new wallet with default currency', async ({ page }) => {
      // Arrange
      await page.goto('/dashboard');
      const walletName = `Test Wallet ${uniqueId}`;

      // Act
      await page.getByRole('button', { name: /new wallet/i }).click();
      await page.getByLabel(/wallet name/i).fill(walletName);
      await page.getByRole('button', { name: /create wallet/i }).click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText(walletName)).toBeVisible();
    });

    test('should create a wallet with PLN currency and description', async ({ page }) => {
      // Arrange
      await page.goto('/dashboard');
      const walletName = `PLN Wallet ${uniqueId}`;
      const description = 'My Polish savings account';

      // Act
      await page.getByRole('button', { name: /new wallet/i }).click();
      await page.getByLabel(/wallet name/i).fill(walletName);
      await page.getByRole('combobox', { name: /currency/i }).click();
      await page.getByRole('option', { name: 'PLN' }).click();
      await page.getByLabel(/description/i).fill(description);
      await page.getByRole('button', { name: /create wallet/i }).click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText(walletName)).toBeVisible();
      await expect(page.getByText(description)).toBeVisible();
    });
  });

  test.describe('Edit Wallet', () => {
    test('should edit an existing wallet', async ({ page }) => {
      // Arrange: Create a wallet first
      await page.goto('/dashboard');
      const originalName = `Edit Test ${uniqueId}`;
      const updatedName = `Updated Wallet ${uniqueId}`;

      await page.getByRole('button', { name: /new wallet/i }).click();
      await page.getByLabel(/wallet name/i).fill(originalName);
      await page.getByRole('button', { name: /create wallet/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Act: Open dropdown menu and click Edit
      const walletCard = page.locator('[class*="Card"]').filter({ hasText: originalName });
      await walletCard.getByRole('button', { name: /more/i }).click();
      await page.getByRole('menuitem', { name: /edit/i }).click();

      // Update wallet name
      await page.getByLabel(/wallet name/i).clear();
      await page.getByLabel(/wallet name/i).fill(updatedName);
      await page.getByRole('button', { name: /save changes/i }).click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText(updatedName)).toBeVisible();
      await expect(page.getByText(originalName)).not.toBeVisible();
    });
  });

  test.describe('Delete Wallet', () => {
    test('should delete an existing wallet', async ({ page }) => {
      // Arrange: Create a wallet to delete
      await page.goto('/dashboard');
      const walletName = `Delete Test ${uniqueId}`;

      await page.getByRole('button', { name: /new wallet/i }).click();
      await page.getByLabel(/wallet name/i).fill(walletName);
      await page.getByRole('button', { name: /create wallet/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText(walletName)).toBeVisible();

      // Act: Open dropdown menu and click Delete
      const walletCard = page.locator('[class*="Card"]').filter({ hasText: walletName });
      await walletCard.getByRole('button', { name: /more/i }).click();

      // Handle confirmation dialog
      page.on('dialog', (dialog) => dialog.accept());
      await page.getByRole('menuitem', { name: /delete/i }).click();

      // Assert
      await expect(page.getByText(walletName)).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('View Wallet Details', () => {
    test('should navigate to wallet details page', async ({ page }) => {
      // Arrange: Create a wallet
      await page.goto('/dashboard');
      const walletName = `Details Test ${uniqueId}`;

      await page.getByRole('button', { name: /new wallet/i }).click();
      await page.getByLabel(/wallet name/i).fill(walletName);
      await page.getByRole('button', { name: /create wallet/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Act: Click View Details
      const walletCard = page.locator('[class*="Card"]').filter({ hasText: walletName });
      await walletCard.getByRole('button', { name: /view details/i }).click();

      // Assert
      await expect(page).toHaveURL(/\/wallets\//);
      await expect(page.getByRole('heading', { name: walletName })).toBeVisible();
      await expect(page.getByTestId('wallet-balance')).toBeVisible();
    });
  });
});
