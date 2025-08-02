-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  status user_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND status = 'approved'
  )
$$;

-- RLS policies for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND status = OLD.status); -- Users can't change their own status

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profiles are created automatically"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can assign roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the first user (make them admin automatically)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE WHEN is_first_user THEN 'approved'::user_status ELSE 'pending'::user_status END
  );
  
  -- If first user, make them admin
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'admin', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing tables RLS to require approved status
-- Update campaigns table policies
DROP POLICY IF EXISTS "Users can view campaigns they created" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns they created" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns they created" ON public.campaigns;

CREATE POLICY "Approved users can view campaigns they created"
ON public.campaigns FOR SELECT
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create campaigns"
ON public.campaigns FOR INSERT
WITH CHECK (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update campaigns they created"
ON public.campaigns FOR UPDATE
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete campaigns they created"
ON public.campaigns FOR DELETE
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

-- Update churches table policies
DROP POLICY IF EXISTS "Users can create churches" ON public.churches;
DROP POLICY IF EXISTS "Users can update churches they created" ON public.churches;
DROP POLICY IF EXISTS "Users can delete churches they created" ON public.churches;

CREATE POLICY "Approved users can create churches"
ON public.churches FOR INSERT
WITH CHECK (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update churches they created"
ON public.churches FOR UPDATE
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete churches they created"
ON public.churches FOR DELETE
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

-- Update templates table policies
DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update templates they created" ON public.templates;
DROP POLICY IF EXISTS "Users can delete templates they created" ON public.templates;
DROP POLICY IF EXISTS "Users can view templates they created" ON public.templates;

CREATE POLICY "Approved users can view templates they created"
ON public.templates FOR SELECT
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create templates"
ON public.templates FOR INSERT
WITH CHECK (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update templates they created"
ON public.templates FOR UPDATE
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete templates they created"
ON public.templates FOR DELETE
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

-- Update messages table policies
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they created" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they created" ON public.messages;

CREATE POLICY "Approved users can view messages they created"
ON public.messages FOR SELECT
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update messages they created"
ON public.messages FOR UPDATE
USING (auth.uid() = created_by AND public.is_user_approved(auth.uid()));

-- Update settings table policies
DROP POLICY IF EXISTS "Users can create their own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.settings;

CREATE POLICY "Approved users can view their own settings"
ON public.settings FOR SELECT
USING (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own settings"
ON public.settings FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own settings"
ON public.settings FOR UPDATE
USING (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

-- Update campaign_churches policies
DROP POLICY IF EXISTS "Users can view campaign_churches for their campaigns" ON public.campaign_churches;
DROP POLICY IF EXISTS "Users can manage campaign_churches for their campaigns" ON public.campaign_churches;

CREATE POLICY "Approved users can view campaign_churches for their campaigns"
ON public.campaign_churches FOR SELECT
USING (
  public.is_user_approved(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_churches.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);

CREATE POLICY "Approved users can manage campaign_churches for their campaigns"
ON public.campaign_churches FOR ALL
USING (
  public.is_user_approved(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_churches.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
);