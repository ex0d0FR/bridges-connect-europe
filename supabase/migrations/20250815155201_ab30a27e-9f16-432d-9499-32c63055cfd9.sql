-- Fix database function search paths for security
-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Update is_user_approved function  
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND status = 'approved'
  )
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the first user (make them admin automatically)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Insert profile with explicit type casting
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
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Set search path to prevent schema-related security risks
    SET search_path = 'public';
    
    -- Update timestamp
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;