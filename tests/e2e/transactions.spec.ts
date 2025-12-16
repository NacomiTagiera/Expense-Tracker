import { expect, test } from '@playwright/test';

test.describe('Transaction Management', () => {
  const uniqueId = Date.now();
  const walletName = `Transactions Wallet ${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    // Create a wallet and category before each test
    await page.goto('/dashboard');

    // Create wallet
    await page.getByRole('button', { name: /new wallet/i }).click();
    await page.getByLabel(/wallet name/i).fill(walletName);
    await page.getByRole('button', { name: /create wallet/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

    // Navigate to wallet details
    const walletCard = page.locator('[class*="Card"]').filter({ hasText: walletName });
    await walletCard.getByRole('button', { name: /view details/i }).click();
    await expect(page).toHaveURL(/\/wallets\//);

    // Create expense category
    await page.getByRole('tab', { name: /categories/i }).click();
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel(/category name/i).fill('Food');
    await page.getByRole('combobox', { name: /type/i }).click();
    await page.getByRole('option', { name: /expense/i }).click();
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

    // Create income category
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel(/category name/i).fill('Salary');
    await page.getByRole('combobox', { name: /type/i }).click();
    await page.getByRole('option', { name: /income/i }).click();
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

    // Go back to transactions tab
    await page.getByRole('tab', { name: /transactions/i }).click();
  });

  test.describe('Create Transactions', () => {
    test('should create an expense transaction and decrease balance', async ({ page }) => {
      // Arrange
      const initialBalance = await page.getByTestId('wallet-balance').textContent();
      expect(initialBalance).toContain('$0.00');

      // Act: Create expense
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/amount/i).fill('50');
      await page.locator('#type').click();
      await page.getByRole('option', { name: /expense/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Food' }).click();
      await page.getByLabel(/description/i).fill('Lunch');
      await page.getByRole('button', { name: /add transaction/i }).last().click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByTestId('wallet-balance')).toContainText('-$50.00');
      await expect(page.getByText('Lunch')).toBeVisible();
    });

    test('should create an income transaction and increase balance', async ({ page }) => {
      // Arrange
      const initialBalance = await page.getByTestId('wallet-balance').textContent();
      expect(initialBalance).toContain('$0.00');

      // Act: Create income
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/amount/i).fill('1000');
      await page.locator('#type').click();
      await page.getByRole('option', { name: /income/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Salary' }).click();
      await page.getByLabel(/description/i).fill('Monthly salary');
      await page.getByRole('button', { name: /add transaction/i }).last().click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByTestId('wallet-balance')).toContainText('$1,000.00');
      await expect(page.getByText('Monthly salary')).toBeVisible();
    });

    test('should correctly calculate balance after multiple transactions', async ({ page }) => {
      // Arrange & Act: Create income transaction
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/amount/i).fill('500');
      await page.locator('#type').click();
      await page.getByRole('option', { name: /income/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Salary' }).click();
      await page.getByRole('button', { name: /add transaction/i }).last().click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Create expense transaction
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/amount/i).fill('150');
      await page.locator('#type').click();
      await page.getByRole('option', { name: /expense/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Food' }).click();
      await page.getByRole('button', { name: /add transaction/i }).last().click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Assert: Balance should be 500 - 150 = 350
      await expect(page.getByTestId('wallet-balance')).toContainText('$350.00');
    });
  });

  test.describe('Edit Transactions', () => {
    test('should edit a transaction and update balance', async ({ page }) => {
      // Arrange: Create initial expense
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/amount/i).fill('100');
      await page.locator('#type').click();
      await page.getByRole('option', { name: /expense/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Food' }).click();
      await page.getByLabel(/description/i).fill('Dinner');
      await page.getByRole('button', { name: /add transaction/i }).last().click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Initial balance should be -$100
      await expect(page.getByTestId('wallet-balance')).toContainText('-$100.00');

      // Act: Edit transaction - open menu and click edit
      const transactionCard = page.locator('[class*="Card"]').filter({ hasText: 'Dinner' });
      await transactionCard.getByRole('button', { name: /more/i }).click();
      await page.getByRole('menuitem', { name: /edit/i }).click();

      // Change amount to 200
      await page.getByLabel(/amount/i).clear();
      await page.getByLabel(/amount/i).fill('200');
      await page.getByRole('button', { name: /save changes/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Assert: Balance should be -$200
      await expect(page.getByTestId('wallet-balance')).toContainText('-$200.00');
    });
  });

  test.describe('Delete Transactions', () => {
    test('should delete a transaction and restore balance', async ({ page }) => {
      // Arrange: Create expense
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/amount/i).fill('75');
      await page.locator('#type').click();
      await page.getByRole('option', { name: /expense/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Food' }).click();
      await page.getByLabel(/description/i).fill('Coffee');
      await page.getByRole('button', { name: /add transaction/i }).last().click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Balance should be -$75
      await expect(page.getByTestId('wallet-balance')).toContainText('-$75.00');

      // Act: Delete transaction
      const transactionCard = page.locator('[class*="Card"]').filter({ hasText: 'Coffee' });
      await transactionCard.getByRole('button', { name: /more/i }).click();

      // Handle confirmation dialog
      page.on('dialog', (dialog) => dialog.accept());
      await page.getByRole('menuitem', { name: /delete/i }).click();

      // Assert: Balance should be restored to $0
      await expect(page.getByText('Coffee')).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('wallet-balance')).toContainText('$0.00');
    });
  });
});

