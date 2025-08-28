-- SECURITY FIX: Database Functions Security Hardening
-- Fix all database functions to include proper security context and search_path settings

-- Drop and recreate functions with enhanced security

-- 1. Fix handle_new_user function with proper security settings
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Set search path to prevent schema-related security risks
  SET search_path = 'public';
  
  -- Check if this is the first user (make them admin automatically)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Insert profile with explicit type casting and validation
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE WHEN is_first_user THEN 'approved'::public.user_status ELSE 'pending'::public.user_status END
  );
  
  -- If first user, make them admin
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'admin'::public.app_role, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Fix auto_approve_new_user function with proper security settings
DROP FUNCTION IF EXISTS public.auto_approve_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.auto_approve_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set search path to prevent schema-related security risks
  SET search_path = 'public';
  
  -- Auto-approve new users immediately with validation
  UPDATE public.profiles 
  SET 
    status = 'approved'::public.user_status,
    approved_by = 'e44693b2-5ac1-4f86-9748-a08cb8e698e2', -- Admin user ID
    approved_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 3. Enhanced prevent_profile_sensitive_updates function with proper security
DROP FUNCTION IF EXISTS public.prevent_profile_sensitive_updates() CASCADE;
CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set search path to prevent schema-related security risks
  SET search_path = 'public';
  
  -- Only allow updates to full_name and updated_at
  IF OLD.status IS DISTINCT FROM NEW.status OR
     OLD.approved_by IS DISTINCT FROM NEW.approved_by OR
     OLD.approved_at IS DISTINCT FROM NEW.approved_at OR
     OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason OR
     OLD.created_at IS DISTINCT FROM NEW.created_at OR
     OLD.id IS DISTINCT FROM NEW.id OR
     OLD.email IS DISTINCT FROM NEW.email THEN
    RAISE EXCEPTION 'Updates to sensitive profile fields are not allowed';
  END IF;
  
  -- Validate full_name length and content
  IF NEW.full_name IS NOT NULL THEN
    IF LENGTH(NEW.full_name) > 100 THEN
      RAISE EXCEPTION 'Full name cannot exceed 100 characters';
    END IF;
    
    -- Basic XSS prevention for full_name
    IF NEW.full_name ~ '<[^>]*>' THEN
      RAISE EXCEPTION 'HTML tags are not allowed in full name';
    END IF;
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Add input validation trigger for churches table
CREATE OR REPLACE FUNCTION public.validate_church_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set search path to prevent schema-related security risks
  SET search_path = 'public';
  
  -- Validate name length and content
  IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Church name is required';
  END IF;
  
  IF LENGTH(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Church name cannot exceed 200 characters';
  END IF;
  
  -- Basic XSS prevention for text fields
  IF NEW.name ~ '<[^>]*>' THEN
    RAISE EXCEPTION 'HTML tags are not allowed in church name';
  END IF;
  
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NOT NEW.email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    IF LENGTH(NEW.email) > 254 THEN
      RAISE EXCEPTION 'Email address too long';
    END IF;
  END IF;
  
  -- Validate phone format if provided
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    -- Remove spaces, dashes, parentheses for validation
    IF LENGTH(REGEXP_REPLACE(NEW.phone, '[^0-9+]', '', 'g')) < 7 THEN
      RAISE EXCEPTION 'Phone number too short';
    END IF;
    
    IF LENGTH(NEW.phone) > 20 THEN
      RAISE EXCEPTION 'Phone number too long';
    END IF;
  END IF;
  
  -- Validate website URL format if provided
  IF NEW.website IS NOT NULL AND NEW.website != '' THEN
    IF NOT (NEW.website ~ '^https?://.*' OR NEW.website ~ '^www\..*') THEN
      RAISE EXCEPTION 'Website must be a valid URL starting with http://, https:// or www.';
    END IF;
    
    IF LENGTH(NEW.website) > 500 THEN
      RAISE EXCEPTION 'Website URL too long';
    END IF;
  END IF;
  
  -- Sanitize and validate notes field
  IF NEW.notes IS NOT NULL THEN
    IF LENGTH(NEW.notes) > 2000 THEN
      RAISE EXCEPTION 'Notes field cannot exceed 2000 characters';
    END IF;
    
    -- Basic XSS prevention
    IF NEW.notes ~ '<script[^>]*>' THEN
      RAISE EXCEPTION 'Script tags are not allowed in notes';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for church data validation
DROP TRIGGER IF EXISTS validate_church_data_trigger ON public.churches;
CREATE TRIGGER validate_church_data_trigger
  BEFORE INSERT OR UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.validate_church_data();

-- 5. Add input validation trigger for contacts table
CREATE OR REPLACE FUNCTION public.validate_contact_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set search path to prevent schema-related security risks
  SET search_path = 'public';
  
  -- Validate name fields
  IF NEW.first_name IS NOT NULL THEN
    IF LENGTH(NEW.first_name) > 50 THEN
      RAISE EXCEPTION 'First name cannot exceed 50 characters';
    END IF;
    
    IF NEW.first_name ~ '<[^>]*>' THEN
      RAISE EXCEPTION 'HTML tags are not allowed in first name';
    END IF;
  END IF;
  
  IF NEW.last_name IS NOT NULL THEN
    IF LENGTH(NEW.last_name) > 50 THEN
      RAISE EXCEPTION 'Last name cannot exceed 50 characters';
    END IF;
    
    IF NEW.last_name ~ '<[^>]*>' THEN
      RAISE EXCEPTION 'HTML tags are not allowed in last name';
    END IF;
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NOT NEW.email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    IF LENGTH(NEW.email) > 254 THEN
      RAISE EXCEPTION 'Email address too long';
    END IF;
  END IF;
  
  -- Validate phone numbers
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF LENGTH(REGEXP_REPLACE(NEW.phone, '[^0-9+]', '', 'g')) < 7 THEN
      RAISE EXCEPTION 'Phone number too short';
    END IF;
    
    IF LENGTH(NEW.phone) > 20 THEN
      RAISE EXCEPTION 'Phone number too long';
    END IF;
  END IF;
  
  IF NEW.mobile IS NOT NULL AND NEW.mobile != '' THEN
    IF LENGTH(REGEXP_REPLACE(NEW.mobile, '[^0-9+]', '', 'g')) < 7 THEN
      RAISE EXCEPTION 'Mobile number too short';
    END IF;
    
    IF LENGTH(NEW.mobile) > 20 THEN
      RAISE EXCEPTION 'Mobile number too long';
    END IF;
  END IF;
  
  -- Validate notes field
  IF NEW.notes IS NOT NULL THEN
    IF LENGTH(NEW.notes) > 2000 THEN
      RAISE EXCEPTION 'Notes field cannot exceed 2000 characters';
    END IF;
    
    -- Basic XSS prevention
    IF NEW.notes ~ '<script[^>]*>' THEN
      RAISE EXCEPTION 'Script tags are not allowed in notes';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for contact data validation
DROP TRIGGER IF EXISTS validate_contact_data_trigger ON public.contacts;
CREATE TRIGGER validate_contact_data_trigger
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_data();