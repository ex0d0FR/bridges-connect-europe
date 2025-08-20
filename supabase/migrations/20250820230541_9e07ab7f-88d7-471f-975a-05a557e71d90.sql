-- PHASE 1: CRITICAL SECURITY FIXES - Enable RLS on all unprotected tables

-- Enable RLS on analytics_metrics table
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_metrics - Only approved users and service role can access
CREATE POLICY "Approved users can view analytics_metrics" 
ON public.analytics_metrics 
FOR SELECT 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create analytics_metrics" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update analytics_metrics" 
ON public.analytics_metrics 
FOR UPDATE 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete analytics_metrics" 
ON public.analytics_metrics 
FOR DELETE 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Service role can access all analytics_metrics" 
ON public.analytics_metrics 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on campaign_tasks table
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_tasks - Campaign creators and assigned users can access
CREATE POLICY "Users can view campaign_tasks for their campaigns or assigned to them" 
ON public.campaign_tasks 
FOR SELECT 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_tasks.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Approved users can create campaign_tasks for their campaigns" 
ON public.campaign_tasks 
FOR INSERT 
WITH CHECK (
  is_user_approved(auth.uid()) AND 
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_tasks.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update campaign_tasks for their campaigns or assigned to them" 
ON public.campaign_tasks 
FOR UPDATE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_tasks.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete campaign_tasks for their campaigns" 
ON public.campaign_tasks 
FOR DELETE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_tasks.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

-- Enable RLS on communication_schedules table
ALTER TABLE public.communication_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for communication_schedules - Campaign creators can access
CREATE POLICY "Users can view communication_schedules for their campaigns" 
ON public.communication_schedules 
FOR SELECT 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = communication_schedules.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can create communication_schedules for their campaigns" 
ON public.communication_schedules 
FOR INSERT 
WITH CHECK (
  is_user_approved(auth.uid()) AND 
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = communication_schedules.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update communication_schedules for their campaigns" 
ON public.communication_schedules 
FOR UPDATE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = communication_schedules.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete communication_schedules for their campaigns" 
ON public.communication_schedules 
FOR DELETE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = communication_schedules.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Service role can access all communication_schedules" 
ON public.communication_schedules 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on contact_interactions table
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for contact_interactions - Only approved users can access
CREATE POLICY "Approved users can view contact_interactions" 
ON public.contact_interactions 
FOR SELECT 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create contact_interactions" 
ON public.contact_interactions 
FOR INSERT 
WITH CHECK (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can update contact_interactions" 
ON public.contact_interactions 
FOR UPDATE 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete contact_interactions" 
ON public.contact_interactions 
FOR DELETE 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Service role can access all contact_interactions" 
ON public.contact_interactions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on contact_scraping_jobs table
ALTER TABLE public.contact_scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for contact_scraping_jobs - Job creators and admins can access
CREATE POLICY "Users can view their own contact_scraping_jobs" 
ON public.contact_scraping_jobs 
FOR SELECT 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Admins can view all contact_scraping_jobs" 
ON public.contact_scraping_jobs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved users can create contact_scraping_jobs" 
ON public.contact_scraping_jobs 
FOR INSERT 
WITH CHECK (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Users can update their own contact_scraping_jobs" 
ON public.contact_scraping_jobs 
FOR UPDATE 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Users can delete their own contact_scraping_jobs" 
ON public.contact_scraping_jobs 
FOR DELETE 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Service role can access all contact_scraping_jobs" 
ON public.contact_scraping_jobs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on event_attendees table
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for event_attendees - Only approved users can access
CREATE POLICY "Approved users can view event_attendees" 
ON public.event_attendees 
FOR SELECT 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create event_attendees" 
ON public.event_attendees 
FOR INSERT 
WITH CHECK (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update event_attendees" 
ON public.event_attendees 
FOR UPDATE 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete event_attendees" 
ON public.event_attendees 
FOR DELETE 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Service role can access all event_attendees" 
ON public.event_attendees 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies for events - Event creators and approved users can access
CREATE POLICY "Users can view events for their campaigns" 
ON public.events 
FOR SELECT 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = events.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can create events for their campaigns" 
ON public.events 
FOR INSERT 
WITH CHECK (
  is_user_approved(auth.uid()) AND 
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = events.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update events for their campaigns" 
ON public.events 
FOR UPDATE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = events.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete events for their campaigns" 
ON public.events 
FOR DELETE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = events.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Service role can access all events" 
ON public.events 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on social_media_posts table
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- Policies for social_media_posts - Post creators can access
CREATE POLICY "Users can view social_media_posts for their campaigns" 
ON public.social_media_posts 
FOR SELECT 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = social_media_posts.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can create social_media_posts for their campaigns" 
ON public.social_media_posts 
FOR INSERT 
WITH CHECK (
  is_user_approved(auth.uid()) AND 
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = social_media_posts.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update social_media_posts for their campaigns" 
ON public.social_media_posts 
FOR UPDATE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = social_media_posts.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete social_media_posts for their campaigns" 
ON public.social_media_posts 
FOR DELETE 
USING (
  is_user_approved(auth.uid()) AND (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = social_media_posts.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Service role can access all social_media_posts" 
ON public.social_media_posts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- STRENGTHEN PROFILES TABLE POLICIES
-- Drop existing user update policy that might allow status modification
DROP POLICY IF EXISTS "Users can update their own profile basic info" ON public.profiles;

-- Create new restrictive policy that prevents users from modifying sensitive fields
CREATE POLICY "Users can update their own profile basic info only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent modification of sensitive fields
  OLD.status = NEW.status AND
  OLD.approved_by = NEW.approved_by AND
  OLD.approved_at = NEW.approved_at AND
  OLD.rejection_reason = NEW.rejection_reason AND
  OLD.created_at = NEW.created_at
);