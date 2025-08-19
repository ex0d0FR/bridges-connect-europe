-- Add new Twilio configuration fields to settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS twilio_account_name text,
ADD COLUMN IF NOT EXISTS twilio_phone_number text,
ADD COLUMN IF NOT EXISTS twilio_friendly_name text,
ADD COLUMN IF NOT EXISTS whatsapp_business_name text,
ADD COLUMN IF NOT EXISTS whatsapp_phone_numbers text[];