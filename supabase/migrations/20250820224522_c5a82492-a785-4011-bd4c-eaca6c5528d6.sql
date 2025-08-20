-- Enable Row Level Security on the gdpr_consents table
ALTER TABLE public.gdpr_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Approved users can view all GDPR consents
CREATE POLICY "Approved users can view all GDPR consents" 
ON public.gdpr_consents 
FOR SELECT 
USING (is_user_approved(auth.uid()));

-- Policy: Approved users can create GDPR consents
CREATE POLICY "Approved users can create GDPR consents" 
ON public.gdpr_consents 
FOR INSERT 
WITH CHECK (is_user_approved(auth.uid()));

-- Policy: Approved users can update GDPR consents
CREATE POLICY "Approved users can update GDPR consents" 
ON public.gdpr_consents 
FOR UPDATE 
USING (is_user_approved(auth.uid()));

-- Policy: Approved users can delete GDPR consents
CREATE POLICY "Approved users can delete GDPR consents" 
ON public.gdpr_consents 
FOR DELETE 
USING (is_user_approved(auth.uid()));

-- Policy: Service role can access all GDPR consents (for edge functions)
CREATE POLICY "Service role can access all GDPR consents" 
ON public.gdpr_consents 
FOR ALL 
USING (true)
WITH CHECK (true);