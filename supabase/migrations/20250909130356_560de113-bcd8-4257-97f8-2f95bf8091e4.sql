-- Fix analytics_metrics RLS policies to prevent unauthorized access to user activity data

-- Drop the overly permissive SELECT policy that allows any approved user to see all analytics
DROP POLICY IF EXISTS "Approved users can view analytics_metrics" ON public.analytics_metrics;

-- Create restrictive policies that only allow users to see their own data
CREATE POLICY "Users can view their own analytics_metrics" 
ON public.analytics_metrics 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_user_approved(auth.uid()) 
  AND (
    -- Users can only see analytics where they are the subject
    (dimensions->>'user_id')::uuid = auth.uid()
    -- OR analytics for churches/campaigns they created
    OR EXISTS (
      SELECT 1 FROM churches 
      WHERE id = analytics_metrics.church_id 
      AND created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM campaigns 
      WHERE id = analytics_metrics.campaign_id 
      AND created_by = auth.uid()
    )
  )
);

-- Allow admins to view all analytics for system monitoring
CREATE POLICY "Admins can view all analytics_metrics" 
ON public.analytics_metrics 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Update other policies to be more restrictive
DROP POLICY IF EXISTS "Approved users can update analytics_metrics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Approved users can delete analytics_metrics" ON public.analytics_metrics;

-- Only allow users to update/delete their own analytics or admins to manage all
CREATE POLICY "Users can update their own analytics_metrics" 
ON public.analytics_metrics 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND is_user_approved(auth.uid()) 
  AND (
    (dimensions->>'user_id')::uuid = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can delete their own analytics_metrics" 
ON public.analytics_metrics 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND is_user_approved(auth.uid()) 
  AND (
    (dimensions->>'user_id')::uuid = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Ensure INSERT policy is restrictive - users can only create analytics for themselves
DROP POLICY IF EXISTS "Approved users can create analytics_metrics" ON public.analytics_metrics;

CREATE POLICY "Users can create analytics_metrics for themselves" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_user_approved(auth.uid()) 
  AND (
    (dimensions->>'user_id')::uuid = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Add audit logging for analytics access
CREATE OR REPLACE FUNCTION public.log_analytics_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to analytics data for security monitoring
  PERFORM log_user_access(
    auth.uid(),
    'analytics_metrics',
    TG_OP || '_' || COALESCE(NEW.metric_name, OLD.metric_name)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for analytics access logging
DROP TRIGGER IF EXISTS audit_analytics_access ON public.analytics_metrics;
CREATE TRIGGER audit_analytics_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE
  ON public.analytics_metrics
  FOR EACH ROW
  EXECUTE FUNCTION log_analytics_access();