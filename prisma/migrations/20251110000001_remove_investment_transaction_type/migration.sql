-- First, update any existing transactions with type 'investment' to 'expense'
-- (unlikely to exist, but safe to handle)
UPDATE "transactions" 
SET type = 'expense' 
WHERE type = 'investment';

-- Update any existing subscriptions with transactionType 'investment' to 'expense'
UPDATE "subscriptions" 
SET "transactionType" = 'expense' 
WHERE "transactionType" = 'investment';

-- Now remove 'investment' from the TransactionType enum
-- PostgreSQL doesn't support removing enum values directly, so we need to:
-- 1. Create a new enum without 'investment'
-- 2. Alter columns to use the new enum
-- 3. Drop the old enum

-- Create new enum type
CREATE TYPE "TransactionType_new" AS ENUM ('income', 'expense');

-- Update columns to use new enum type
ALTER TABLE "transactions" 
  ALTER COLUMN "type" TYPE "TransactionType_new" 
  USING ("type"::text::"TransactionType_new");

ALTER TABLE "subscriptions" 
  ALTER COLUMN "transactionType" TYPE "TransactionType_new" 
  USING ("transactionType"::text::"TransactionType_new");

-- Drop old enum and rename new one
DROP TYPE "TransactionType";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";

