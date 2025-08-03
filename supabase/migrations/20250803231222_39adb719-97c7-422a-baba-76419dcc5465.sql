-- Remove sensitive API key columns from settings table
-- These will now be stored as Supabase secrets instead

ALTER TABLE public.settings 
DROP COLUMN IF EXISTS sendgrid_api_key,
DROP COLUMN IF EXISTS twilio_account_sid,
DROP COLUMN IF EXISTS twilio_auth_token,
DROP COLUMN IF EXISTS google_maps_api_key,
DROP COLUMN IF EXISTS apify_api_token;