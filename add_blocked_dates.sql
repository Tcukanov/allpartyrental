-- Add blockedDates column to Service table
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "blockedDates" TIMESTAMP[] DEFAULT '{}'; 