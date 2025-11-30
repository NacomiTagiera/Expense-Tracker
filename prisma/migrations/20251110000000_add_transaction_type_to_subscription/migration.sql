-- AlterTable
-- Add transactionType column to subscriptions table with default value EXPENSE
ALTER TABLE "subscriptions" ADD COLUMN "transactionType" "TransactionType" NOT NULL DEFAULT 'expense';

