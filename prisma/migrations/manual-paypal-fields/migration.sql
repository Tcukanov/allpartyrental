-- Add the missing fields to the Provider table
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "accountType" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "paypalStatus" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "paypalEnvironment" TEXT; 