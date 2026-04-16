-- Add created_at column to visits table if it doesn't exist
ALTER TABLE "public"."visits" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now();
