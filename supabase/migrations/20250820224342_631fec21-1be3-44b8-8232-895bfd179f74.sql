-- Enable Row Level Security on the contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Approved users can view all contacts
CREATE POLICY "Approved users can view all contacts" 
ON public.contacts 
FOR SELECT 
USING (is_user_approved(auth.uid()));

-- Policy: Approved users can create contacts
CREATE POLICY "Approved users can create contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (is_user_approved(auth.uid()) AND auth.uid() = created_by);

-- Policy: Approved users can update any contact
CREATE POLICY "Approved users can update any contact" 
ON public.contacts 
FOR UPDATE 
USING (is_user_approved(auth.uid()));

-- Policy: Approved users can delete any contact
CREATE POLICY "Approved users can delete any contact" 
ON public.contacts 
FOR DELETE 
USING (is_user_approved(auth.uid()));

-- Policy: Service role can access all contacts (for edge functions)
CREATE POLICY "Service role can access all contacts" 
ON public.contacts 
FOR ALL 
USING (true)
WITH CHECK (true);