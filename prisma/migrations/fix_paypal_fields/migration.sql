-- Fix PayPal fields for Provider table
ALTER TABLE "Provider" ALTER COLUMN "paypalMerchantId" TYPE TEXT;
ALTER TABLE "Provider" ALTER COLUMN "paypalEmail" TYPE TEXT;
ALTER TABLE "Provider" ALTER COLUMN "paypalOnboardingComplete" SET DEFAULT false;

-- If columns don't exist, create them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Provider' AND column_name='paypalMerchantId') THEN
        ALTER TABLE "Provider" ADD COLUMN "paypalMerchantId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Provider' AND column_name='paypalEmail') THEN
        ALTER TABLE "Provider" ADD COLUMN "paypalEmail" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Provider' AND column_name='paypalOnboardingComplete') THEN
        ALTER TABLE "Provider" ADD COLUMN "paypalOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END
$$; 