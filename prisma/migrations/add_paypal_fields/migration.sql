-- Add PayPal fields to Provider table
ALTER TABLE "Provider" ADD COLUMN "paypalMerchantId" TEXT;
ALTER TABLE "Provider" ADD COLUMN "paypalEmail" TEXT;
ALTER TABLE "Provider" ADD COLUMN "paypalOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- Update SystemSettings JSON field to include PayPal settings
-- This is a bit tricky with PostgreSQL and JSON fields, but we can use a dummy update
-- to ensure the schema is updated
UPDATE "SystemSettings"
SET "settings" = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{payments}',
  COALESCE(settings->'payments', '{}'::jsonb) || 
  '{"paypalMode": "sandbox", 
    "paypalSandboxClientId": "", 
    "paypalSandboxClientSecret": "", 
    "paypalLiveClientId": "", 
    "paypalLiveClientSecret": "", 
    "paypalPartnerId": "",
    "activePaymentProvider": "paypal"}'::jsonb
)
WHERE id IS NOT NULL; 