ALTER TABLE "public"."visitor_passes" ADD COLUMN "otp" text;
ALTER TABLE "public"."visitor_passes" ADD COLUMN "otp_expires_at" timestamptz;
