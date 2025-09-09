-- Fix messages table RLS policies to require user approval
DROP POLICY IF EXISTS "Allow message creation from edge functions" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages and service role can access all" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages and service role can access all" ON public.messages;

-- Create new secure policies for messages table
CREATE POLICY "Approved users can create messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can view their messages" 
ON public.messages 
FOR SELECT 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can update their messages" 
ON public.messages 
FOR UPDATE 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Service role can access all messages" 
ON public.messages 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create granular permission functions for better security
CREATE OR REPLACE FUNCTION public.can_access_churches(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT is_user_approved(_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_campaigns(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT is_user_approved(_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.can_access_contacts(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT is_user_approved(_user_id);
$function$;

-- Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.log_user_access(_user_id uuid, _resource text, _action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access attempts for security monitoring
  INSERT INTO public.analytics_metrics (
    id,
    metric_name,
    metric_type,
    metric_value,
    dimensions,
    recorded_at
  ) VALUES (
    gen_random_uuid(),
    'user_access_log',
    'security',
    1,
    jsonb_build_object(
      'user_id', _user_id,
      'resource', _resource,
      'action', _action,
      'timestamp', now(),
      'approved', is_user_approved(_user_id)
    ),
    now()
  );
END;
$function$;

-- Create user session invalidation function
CREATE OR REPLACE FUNCTION public.invalidate_user_sessions(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- This function can be extended to work with external session stores
  -- For now, it logs the invalidation request
  PERFORM log_user_access(_user_id, 'auth', 'session_invalidated');
END;
$function$;