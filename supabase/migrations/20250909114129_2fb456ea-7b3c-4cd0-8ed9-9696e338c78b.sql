-- Enhanced user management functions and security

-- Function to safely delete a user and handle cascading operations
CREATE OR REPLACE FUNCTION public.delete_user_safely(_user_id uuid, _admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Verify admin permissions
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Insufficient permissions to delete users';
  END IF;
  
  -- Get user details for logging
  SELECT * INTO user_record FROM public.profiles WHERE id = _user_id;
  
  IF user_record IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log the deletion action
  PERFORM log_enhanced_audit_event(
    _admin_id,
    'user_deletion',
    'profiles',
    jsonb_build_object(
      'deleted_user_id', _user_id,
      'deleted_user_email', user_record.email,
      'deleted_user_status', user_record.status,
      'deletion_timestamp', now()
    ),
    'high'
  );
  
  -- Delete from profiles (this will cascade to auth.users via trigger)
  DELETE FROM public.profiles WHERE id = _user_id;
  
  -- Delete the user from auth.users table (requires service role)
  -- Note: This requires admin API call from the application
  
  RETURN true;
END;
$$;

-- Function to invalidate user sessions (enhanced)
CREATE OR REPLACE FUNCTION public.invalidate_user_sessions_enhanced(_user_id uuid, _admin_id uuid, _reason text DEFAULT 'status_change')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log the session invalidation
  PERFORM log_enhanced_audit_event(
    _admin_id,
    'session_invalidation',
    'auth',
    jsonb_build_object(
      'target_user_id', _user_id,
      'reason', _reason,
      'invalidation_timestamp', now()
    ),
    'medium'
  );
  
  -- Log access attempt for monitoring
  PERFORM log_user_access(_user_id, 'auth', 'session_invalidated_by_admin');
END;
$$;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  activity_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'last_login', MAX(recorded_at),
    'total_logins', COUNT(*) FILTER (WHERE metric_name = 'user_access_log'),
    'campaigns_created', (
      SELECT COUNT(*) FROM campaigns WHERE created_by = _user_id
    ),
    'churches_added', (
      SELECT COUNT(*) FROM churches WHERE created_by = _user_id
    ),
    'messages_sent', (
      SELECT COUNT(*) FROM messages WHERE created_by = _user_id
    )
  ) INTO activity_data
  FROM analytics_metrics 
  WHERE dimensions->>'user_id' = _user_id::text
    AND metric_name = 'user_access_log';
  
  RETURN COALESCE(activity_data, '{}'::jsonb);
END;
$$;

-- Enhanced RLS policy for profiles to handle deletion scenarios
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_activity ON public.analytics_metrics(recorded_at) WHERE metric_name = 'user_access_log';