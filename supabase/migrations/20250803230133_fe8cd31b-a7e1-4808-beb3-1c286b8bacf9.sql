-- Fix critical database security issues

-- 1. Secure the database functions by setting secure search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND status = 'approved'
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- 2. Fix church data exposure - replace overly permissive policy
DROP POLICY IF EXISTS "Users can view all churches" ON public.churches;

-- Create more restrictive church access policy
CREATE POLICY "Approved users can view churches they created or are assigned to" 
ON public.churches 
FOR SELECT 
USING (
  is_user_approved(auth.uid()) AND (
    -- Church creator can view
    created_by = auth.uid() 
    OR 
    -- Users can view churches assigned to their campaigns
    EXISTS (
      SELECT 1 FROM public.campaign_churches cc
      JOIN public.campaigns c ON c.id = cc.campaign_id
      WHERE cc.church_id = churches.id 
      AND c.created_by = auth.uid()
    )
  )
);