-- Fix analytics_metrics RLS policies to prevent unauthorized access to user tracking data
-- This addresses the security issue where all approved users could access sensitive analytics data

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Approved users can view analytics_metrics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Approved users can update analytics_metrics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Approved users can delete analytics_metrics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Approved users can create analytics_metrics" ON public.analytics_metrics;

-- Create restrictive policies that only allow access to user's own data or admin/system access
CREATE POLICY "Users can view their own analytics_metrics" 
ON public.analytics_metrics 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  is_user_approved(auth.uid()) AND 
  (
    -- Allow access if the user_id in dimensions matches the authenticated user
    (dimensions->>'user_id')::uuid = auth.uid()
    OR
    -- Allow admins to view all analytics
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "System can create analytics_metrics" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (
  -- Only allow system/service role to create analytics entries
  -- or approved users creating entries for themselves
  (auth.uid() IS NULL) OR
  (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()) AND (dimensions->>'user_id')::uuid = auth.uid())
);

CREATE POLICY "Users can update their own analytics_metrics" 
ON public.analytics_metrics 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  is_user_approved(auth.uid()) AND 
  (
    (dimensions->>'user_id')::uuid = auth.uid()
    OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can delete their own analytics_metrics" 
ON public.analytics_metrics 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  is_user_approved(auth.uid()) AND 
  (
    (dimensions->>'user_id')::uuid = auth.uid()
    OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Keep service role policy for system operations
CREATE POLICY "Service role can access all analytics_metrics" 
ON public.analytics_metrics 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add function to safely log analytics with proper user context
CREATE OR REPLACE FUNCTION public.log_user_analytics(
  _metric_name text,
  _metric_type text,
  _metric_value numeric,
  _dimensions jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user_id is set to the authenticated user
  _dimensions := _dimensions || jsonb_build_object('user_id', auth.uid());
  
  -- Only allow approved users to log analytics
  IF NOT is_user_approved(auth.uid()) THEN
    RAISE EXCEPTION 'Only approved users can log analytics data';
  END IF;
  
  INSERT INTO public.analytics_metrics (
    id,
    metric_name,
    metric_type,
    metric_value,
    dimensions,
    recorded_at
  ) VALUES (
    gen_random_uuid(),
    _metric_name,
    _metric_type,
    _metric_value,
    _dimensions,
    now()
  );
END;
$function$;

-- Update the existing log_user_access function to use the new secure logging
CREATE OR REPLACE FUNCTION public.log_user_access(_user_id uuid, _resource text, _action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use the secure analytics logging function
  PERFORM log_user_analytics(
    'user_access_log',
    'security',
    1,
    jsonb_build_object(
      'user_id', _user_id,
      'resource', _resource,
      'action', _action,
      'timestamp', now(),
      'approved', is_user_approved(_user_id)
    )
  );
END;
$function$;