-- Create follow-up tasks table for campaign management
CREATE TABLE public.follow_up_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  assigned_to UUID,
  task_type TEXT NOT NULL CHECK (task_type IN ('call', 'email', 'meeting', 'visit', 'follow_up_email')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for follow_up_tasks
CREATE POLICY "Users can create follow-up tasks for their campaigns" 
ON public.follow_up_tasks 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = follow_up_tasks.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Users can view follow-up tasks for their campaigns" 
ON public.follow_up_tasks 
FOR SELECT 
USING (
  auth.uid() = created_by OR
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = follow_up_tasks.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update follow-up tasks for their campaigns" 
ON public.follow_up_tasks 
FOR UPDATE 
USING (
  auth.uid() = created_by OR
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = follow_up_tasks.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete follow-up tasks for their campaigns" 
ON public.follow_up_tasks 
FOR DELETE 
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = follow_up_tasks.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

-- Service role can access all
CREATE POLICY "Service role can access all follow_up_tasks" 
ON public.follow_up_tasks 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_follow_up_tasks_updated_at
BEFORE UPDATE ON public.follow_up_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create enhanced message responses table for better follow-up tracking
CREATE TABLE public.message_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  campaign_id UUID,
  church_id UUID,
  response_type TEXT NOT NULL CHECK (response_type IN ('email_reply', 'sms_reply', 'whatsapp_reply', 'phone_call', 'meeting_request')),
  response_content TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'interested', 'not_interested')),
  follow_up_required BOOLEAN DEFAULT false,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  metadata JSONB DEFAULT '{}',
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for message_responses
CREATE POLICY "Approved users can view message responses" 
ON public.message_responses 
FOR SELECT 
USING (is_user_approved(auth.uid()));

CREATE POLICY "Service role can access all message_responses" 
ON public.message_responses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create campaign contacts junction table for better contact management
CREATE TABLE public.campaign_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'secondary', 'leader', 'admin')),
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  last_interaction_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign_contacts
CREATE POLICY "Users can manage campaign contacts for their campaigns" 
ON public.campaign_contacts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_contacts.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_contacts.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

-- Service role can access all
CREATE POLICY "Service role can access all campaign_contacts" 
ON public.campaign_contacts 
FOR ALL 
USING (true) 
WITH CHECK (true);