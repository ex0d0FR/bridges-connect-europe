-- Create enum types for message types and statuses
CREATE TYPE public.message_type AS ENUM ('email', 'sms', 'whatsapp');
CREATE TYPE public.message_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- Churches table - core entity for storing church information
CREATE TABLE public.churches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  contact_name TEXT,
  country TEXT NOT NULL DEFAULT 'France',
  address TEXT,
  city TEXT,
  postal_code TEXT,
  denomination TEXT,
  size_category TEXT, -- small, medium, large
  notes TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Campaigns table - for organizing outreach efforts
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status campaign_status DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_countries TEXT[] DEFAULT '{}',
  target_denominations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Message templates table - for email/SMS templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type message_type NOT NULL,
  language TEXT DEFAULT 'en',
  subject TEXT, -- for email templates
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- template variables like {church_name}, {contact_name}
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Messages table - tracking all sent messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.templates(id),
  type message_type NOT NULL,
  status message_status DEFAULT 'pending',
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  external_id TEXT, -- ID from email/SMS provider
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Campaign churches junction table - many-to-many relationship
CREATE TABLE public.campaign_churches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, church_id)
);

-- Enable Row Level Security
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_churches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for churches
CREATE POLICY "Users can view all churches" ON public.churches FOR SELECT USING (true);
CREATE POLICY "Users can create churches" ON public.churches FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update churches they created" ON public.churches FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete churches they created" ON public.churches FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns they created" ON public.campaigns FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update campaigns they created" ON public.campaigns FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete campaigns they created" ON public.campaigns FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for templates
CREATE POLICY "Users can view templates they created" ON public.templates FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update templates they created" ON public.templates FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete templates they created" ON public.templates FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for messages
CREATE POLICY "Users can view messages they created" ON public.messages FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update messages they created" ON public.messages FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for campaign_churches
CREATE POLICY "Users can view campaign_churches for their campaigns" ON public.campaign_churches 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_churches.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  );
CREATE POLICY "Users can manage campaign_churches for their campaigns" ON public.campaign_churches 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_churches.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_churches_country ON public.churches(country);
CREATE INDEX idx_churches_email ON public.churches(email);
CREATE INDEX idx_churches_created_by ON public.churches(created_by);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX idx_messages_campaign_id ON public.messages(campaign_id);
CREATE INDEX idx_messages_church_id ON public.messages(church_id);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_messages_type ON public.messages(type);
CREATE INDEX idx_templates_type ON public.templates(type);
CREATE INDEX idx_templates_language ON public.templates(language);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();