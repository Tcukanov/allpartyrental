-- Add slug column to Service table
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS "Service_slug_key" ON "Service"("slug");

