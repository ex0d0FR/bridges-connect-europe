-- CRITICAL SECURITY FIX: Restrict messages table access to prevent data exposure
-- Issue: Service role policy allows unauthorized access to sensitive customer data

-- Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can access all messages" ON public.messages;

-- Create a proper service role policy that only applies to the actual service role
-- This policy will only work when using the service role key, not for regular authenticated users
CREATE POLICY "Service role can access all messages"
ON public.messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure no other overly permissive policies exist
-- Recreate the user policies with additional security checks

-- Drop existing user policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Approved users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Approved users can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Approved users can create messages" ON public.messages;

-- Recreate with stricter access control and logging
CREATE POLICY "Users can view only their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND is_user_approved(auth.uid()) 
  AND auth.uid() = created_by
);

CREATE POLICY "Users can update only their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND is_user_approved(auth.uid()) 
  AND auth.uid() = created_by
)
WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "Users can create messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_user_approved(auth.uid()) 
  AND auth.uid() = created_by
);

-- Add a policy to prevent deletion by regular users (only service role should delete)
CREATE POLICY "Prevent message deletion by users"
ON public.messages
FOR DELETE
TO authenticated
USING (false);

-- Create an audit trigger for message access
CREATE OR REPLACE FUNCTION public.audit_message_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to messages for security monitoring
  PERFORM log_enhanced_audit_event(
    auth.uid(),
    TG_OP || '_message',
    'messages',
    jsonb_build_object(
      'message_id', COALESCE(NEW.id, OLD.id),
      'recipient_phone', COALESCE(NEW.recipient_phone, OLD.recipient_phone),
      'church_id', COALESCE(NEW.church_id, OLD.church_id),
      'access_timestamp', now()
    ),
    CASE 
      WHEN TG_OP = 'SELECT' THEN 'low'
      WHEN TG_OP = 'INSERT' THEN 'medium'
      WHEN TG_OP = 'UPDATE' THEN 'medium'
      WHEN TG_OP = 'DELETE' THEN 'high'
      ELSE 'medium'
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for comprehensive message access auditing
DROP TRIGGER IF EXISTS audit_message_access_trigger ON public.messages;
CREATE TRIGGER audit_message_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.audit_message_access();

-- Add additional security: Anonymize phone numbers in logs for non-admin users
CREATE OR REPLACE FUNCTION public.get_safe_message_data(_message_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  message_data jsonb;
  is_admin bool;
BEGIN
  -- Check if user is admin
  SELECT has_role(_user_id, 'admin'::app_role) INTO is_admin;
  
  -- Get message data only if user owns it or is admin
  SELECT to_jsonb(m.*) INTO message_data
  FROM messages m
  WHERE m.id = _message_id 
    AND (m.created_by = _user_id OR is_admin);
  
  IF message_data IS NULL THEN
    RAISE EXCEPTION 'Access denied: Message not found or unauthorized';
  END IF;
  
  -- Anonymize sensitive data for non-admins in logs
  IF NOT is_admin THEN
    message_data := message_data || jsonb_build_object(
      'recipient_phone', CASE 
        WHEN message_data->>'recipient_phone' IS NOT NULL 
        THEN regexp_replace(message_data->>'recipient_phone', '.(?=.{4})', '*', 'g')
        ELSE NULL
      END,
      'content', CASE
        WHEN length(message_data->>'content') > 50
        THEN left(message_data->>'content', 50) || '...[truncated for security]'
        ELSE message_data->>'content'
      END
    );
  END IF;
  
  RETURN message_data;
END;
$$;

-- Force RLS to be active even for table owners
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;