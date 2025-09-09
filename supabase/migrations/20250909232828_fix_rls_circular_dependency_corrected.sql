-- Fix RLS circular dependency issues for templates and user management
-- This addresses the issue where users can't access templates or admins can't access user management

-- Fix 1: Allow users to access their own profiles regardless of approval status
-- This is needed for the admin check to work properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix 2: Allow users to access their own user roles regardless of approval status  
-- This is needed for admin detection to work
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Fix 3: Update templates policies to allow access for basic users
-- Users should be able to access their templates even if not approved yet
DROP POLICY IF EXISTS "Approved users can view templates they created" ON public.templates;
DROP POLICY IF EXISTS "Approved users can create templates" ON public.templates; 
DROP POLICY IF EXISTS "Approved users can update templates they created" ON public.templates;
DROP POLICY IF EXISTS "Approved users can delete templates they created" ON public.templates;

-- Also drop the old policy names that might exist
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

-- New template policies that work for both approved and pending users
CREATE POLICY "Users can view their own templates"
ON public.templates 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own templates"
ON public.templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
ON public.templates 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
ON public.templates 
FOR DELETE 
USING (auth.uid() = created_by);

-- Fix 4: Ensure admins can always access all profiles for user management
-- Drop existing admin policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can access all templates" ON public.templates;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all profiles"  
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role policy for system operations
CREATE POLICY "Service role can access all profiles"
ON public.profiles
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all templates"
ON public.templates
FOR ALL
USING (true)
WITH CHECK (true);

-- Fix 5: Update the is_user_approved function to handle cases where profile doesn't exist yet
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  -- Return true if user has approved status, false if pending/rejected/suspended, null if no profile
  SELECT COALESCE(
    (SELECT status = 'approved' FROM public.profiles WHERE id = _user_id),
    false
  );
$function$;