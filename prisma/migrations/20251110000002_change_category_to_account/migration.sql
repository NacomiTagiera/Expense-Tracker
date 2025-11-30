-- Step 1: Add accountId column (nullable initially)
ALTER TABLE "categories" ADD COLUMN "accountId" TEXT;

-- Step 2: Populate accountId from transactions or subscriptions
-- First, try to get accountId from transactions
UPDATE "categories" c
SET "accountId" = (
  SELECT t."accountId"
  FROM "transactions" t
  WHERE t."categoryId" = c."id"
  LIMIT 1
)
WHERE c."accountId" IS NULL;

-- If no transaction found, try subscriptions
UPDATE "categories" c
SET "accountId" = (
  SELECT s."accountId"
  FROM "subscriptions" s
  WHERE s."categoryId" = c."id"
  LIMIT 1
)
WHERE c."accountId" IS NULL;

-- Step 3: For categories without transactions/subscriptions, use first account of the user
UPDATE "categories" c
SET "accountId" = (
  SELECT a."id"
  FROM "accounts" a
  WHERE a."userId" = c."userId"
  ORDER BY a."createdAt" ASC
  LIMIT 1
)
WHERE c."accountId" IS NULL;

-- Step 4: Drop old constraints and indexes
DROP INDEX IF EXISTS "categories_userId_name_type_key";
DROP INDEX IF EXISTS "categories_userId_type_idx";
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_userId_fkey";

-- Step 5: Make accountId NOT NULL (after data migration)
ALTER TABLE "categories" ALTER COLUMN "accountId" SET NOT NULL;

-- Step 6: Add foreign key constraint
ALTER TABLE "categories" ADD CONSTRAINT "categories_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Drop userId column
ALTER TABLE "categories" DROP COLUMN "userId";

-- Step 8: Create new unique constraint and index
CREATE UNIQUE INDEX "categories_accountId_name_type_key" ON "categories"("accountId", "name", "type");
CREATE INDEX "categories_accountId_type_idx" ON "categories"("accountId", "type");

