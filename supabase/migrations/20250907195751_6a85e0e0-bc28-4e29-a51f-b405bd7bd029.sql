-- Security hardening: Add explicit authentication checks to all RLS policies
-- This prevents any potential anonymous access to sensitive data

-- Update analytics_metrics policies
DROP POLICY IF EXISTS "Approved users can delete analytics_metrics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Approved users can update analytics_metrics" ON public.analytics_metrics;  
DROP POLICY IF EXISTS "Approved users can view analytics_metrics" ON public.analytics_metrics;

CREATE POLICY "Approved users can delete analytics_metrics" 
ON public.analytics_metrics FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update analytics_metrics" 
ON public.analytics_metrics FOR UPDATE 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can view analytics_metrics" 
ON public.analytics_metrics FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()));

-- Update campaign_churches policies
DROP POLICY IF EXISTS "Admins can manage any campaign_churches" ON public.campaign_churches;
DROP POLICY IF EXISTS "Approved users can view campaign_churches for their campaigns" ON public.campaign_churches;
DROP POLICY IF EXISTS "Users can manage their own churches in their campaigns" ON public.campaign_churches;

CREATE POLICY "Admins can manage any campaign_churches" 
ON public.campaign_churches FOR ALL 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Approved users can view campaign_churches for their campaigns" 
ON public.campaign_churches FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()) AND 
       (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_churches.campaign_id AND campaigns.created_by = auth.uid())));

CREATE POLICY "Users can manage their own churches in their campaigns" 
ON public.campaign_churches FOR ALL 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()) AND 
       (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_churches.campaign_id AND campaigns.created_by = auth.uid())) AND 
       (EXISTS (SELECT 1 FROM churches WHERE churches.id = campaign_churches.church_id AND churches.created_by = auth.uid())));

-- Update campaign_tasks policies
DROP POLICY IF EXISTS "Users can delete campaign_tasks for their campaigns" ON public.campaign_tasks;
DROP POLICY IF EXISTS "Users can update campaign_tasks for their campaigns or assigned" ON public.campaign_tasks;
DROP POLICY IF EXISTS "Users can view campaign_tasks for their campaigns or assigned t" ON public.campaign_tasks;

CREATE POLICY "Users can delete campaign_tasks for their campaigns" 
ON public.campaign_tasks FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()) AND 
       ((auth.uid() = created_by) OR (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_tasks.campaign_id AND campaigns.created_by = auth.uid()))));

CREATE POLICY "Users can update campaign_tasks for their campaigns or assigned" 
ON public.campaign_tasks FOR UPDATE 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()) AND 
       ((auth.uid() = created_by) OR (auth.uid() = assigned_to) OR (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_tasks.campaign_id AND campaigns.created_by = auth.uid()))));

CREATE POLICY "Users can view campaign_tasks for their campaigns or assigned" 
ON public.campaign_tasks FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()) AND 
       ((auth.uid() = created_by) OR (auth.uid() = assigned_to) OR (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_tasks.campaign_id AND campaigns.created_by = auth.uid()))));

-- Update campaigns policies  
DROP POLICY IF EXISTS "Approved users can delete campaigns they created" ON public.campaigns;
DROP POLICY IF EXISTS "Approved users can update campaigns they created" ON public.campaigns;
DROP POLICY IF EXISTS "Approved users can view campaigns they created" ON public.campaigns;

CREATE POLICY "Approved users can delete campaigns they created" 
ON public.campaigns FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = created_by AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update campaigns they created" 
ON public.campaigns FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = created_by AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can view campaigns they created" 
ON public.campaigns FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = created_by AND is_user_approved(auth.uid()));