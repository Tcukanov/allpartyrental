-- Add stripeAccountId column to Provider table if it doesn't exist
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT; 