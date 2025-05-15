-- Add PayPal fields to Provider table
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "paypalMerchantId" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "paypalEmail" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "paypalOnboardingComplete" BOOLEAN NOT NULL DEFAULT false; 