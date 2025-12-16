import { expect, test } from '@playwright/test';

test.describe('Recurring Transaction Management', () => {
  const uniqueId = Date.now();
  const walletName = `Recurring Wallet ${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    // Create a wallet and categories before each test
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

    // Create categories for recurring transactions
    await page.getByRole('tab', { name: /categories/i }).click();

    // Expense category
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel(/category name/i).fill('Subscriptions');
    await page.getByRole('combobox', { name: /type/i }).click();
    await page.getByRole('option', { name: /expense/i }).click();
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

    // Income category
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel(/category name/i).fill('Income');
    await page.getByRole('combobox', { name: /type/i }).click();
    await page.getByRole('option', { name: /income/i }).click();
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

    // Go to recurring transactions tab
    await page.getByRole('tab', { name: /recurring/i }).click();
  });

  test.describe('Create Recurring Transactions', () => {
    test('should create a monthly expense recurring transaction', async ({ page }) => {
      // Arrange & Act
      await page.getByRole('button', { name: /add recurring/i }).click();
      
      await page.getByLabel(/name/i).fill('Netflix');
      await page.getByLabel(/amount/i).fill('15.99');
      
      // Select type
      await page.locator('#transactionType').click();
      await page.getByRole('option', { name: /expense/i }).click();
      
      // Select frequency
      await page.locator('#frequency').click();
      await page.getByRole('option', { name: /monthly/i }).click();
      
      // Select category
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Subscriptions' }).click();
      
      await page.getByLabel(/description/i).fill('Streaming service');
      await page.getByRole('button', { name: /add recurring/i }).last().click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText('Netflix')).toBeVisible();
      await expect(page.getByText('$15.99')).toBeVisible();
      await expect(page.getByText(/monthly/i)).toBeVisible();
    });

    test('should create a monthly income recurring transaction (salary)', async ({ page }) => {
      // Arrange & Act
      await page.getByRole('button', { name: /add recurring/i }).click();
      
      await page.getByLabel(/name/i).fill('Monthly Salary');
      await page.getByLabel(/amount/i).fill('5000');
      
      // Select type
      await page.locator('#transactionType').click();
      await page.getByRole('option', { name: /income/i }).click();
      
      // Select frequency
      await page.locator('#frequency').click();
      await page.getByRole('option', { name: /monthly/i }).click();
      
      // Select category
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Income' }).click();
      
      await page.getByRole('button', { name: /add recurring/i }).last().click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText('Monthly Salary')).toBeVisible();
      await expect(page.getByText('$5,000.00')).toBeVisible();
    });

    test('should create a weekly recurring transaction', async ({ page }) => {
      // Arrange & Act
      await page.getByRole('button', { name: /add recurring/i }).click();
      
      await page.getByLabel(/name/i).fill('Weekly Groceries');
      await page.getByLabel(/amount/i).fill('100');
      
      // Select type (default is expense)
      await page.locator('#transactionType').click();
      await page.getByRole('option', { name: /expense/i }).click();
      
      // Select frequency
      await page.locator('#frequency').click();
      await page.getByRole('option', { name: /weekly/i }).click();
      
      // Select category
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Subscriptions' }).click();
      
      await page.getByRole('button', { name: /add recurring/i }).last().click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText('Weekly Groceries')).toBeVisible();
      await expect(page.getByText(/weekly/i)).toBeVisible();
    });
  });

  test.describe('Edit Recurring Transactions', () => {
    test('should edit recurring transaction amount', async ({ page }) => {
      // Arrange: Create recurring transaction
      await page.getByRole('button', { name: /add recurring/i }).click();
      await page.getByLabel(/name/i).fill('Spotify');
      await page.getByLabel(/amount/i).fill('9.99');
      await page.locator('#transactionType').click();
      await page.getByRole('option', { name: /expense/i }).click();
      await page.locator('#frequency').click();
      await page.getByRole('option', { name: /monthly/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Subscriptions' }).click();
      await page.getByRole('button', { name: /add recurring/i }).last().click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Act: Edit the recurring transaction
      const recurringCard = page.locator('[class*="Card"]').filter({ hasText: 'Spotify' });
      await recurringCard.getByRole('button', { name: /more/i }).click();
      await page.getByRole('menuitem', { name: /edit/i }).click();

      // Update amount
      await page.getByLabel(/amount/i).clear();
      await page.getByLabel(/amount/i).fill('12.99');
      await page.getByRole('button', { name: /save changes/i }).click();

      // Assert
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText('$12.99')).toBeVisible();
    });
  });

  test.describe('Delete Recurring Transactions', () => {
    test('should delete a recurring transaction', async ({ page }) => {
      // Arrange: Create recurring transaction
      await page.getByRole('button', { name: /add recurring/i }).click();
      await page.getByLabel(/name/i).fill('HBO Max');
      await page.getByLabel(/amount/i).fill('14.99');
      await page.locator('#transactionType').click();
      await page.getByRole('option', { name: /expense/i }).click();
      await page.locator('#frequency').click();
      await page.getByRole('option', { name: /monthly/i }).click();
      await page.locator('#category').click();
      await page.getByRole('option', { name: 'Subscriptions' }).click();
      await page.getByRole('button', { name: /add recurring/i }).last().click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

      // Act: Delete the recurring transaction
      const recurringCard = page.locator('[class*="Card"]').filter({ hasText: 'HBO Max' });
      await recurringCard.getByRole('button', { name: /more/i }).click();

      // Handle confirmation dialog
      page.on('dialog', (dialog) => dialog.accept());
      await page.getByRole('menuitem', { name: /delete/i }).click();

      // Assert
      await expect(page.getByText('HBO Max')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Frequency Options', () => {
    test('should support all frequency options', async ({ page }) => {
      const frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

      for (const frequency of frequencies) {
        // Arrange & Act
        await page.getByRole('button', { name: /add recurring/i }).click();
        await page.getByLabel(/name/i).fill(`${frequency} Test`);
        await page.getByLabel(/amount/i).fill('10');
        await page.locator('#transactionType').click();
        await page.getByRole('option', { name: /expense/i }).click();
        await page.locator('#frequency').click();
        await page.getByRole('option', { name: new RegExp(frequency, 'i') }).click();
        await page.locator('#category').click();
        await page.getByRole('option', { name: 'Subscriptions' }).click();
        await page.getByRole('button', { name: /add recurring/i }).last().click();

        // Assert
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
        await expect(page.getByText(`${frequency} Test`)).toBeVisible();
      }
    });
  });
});

