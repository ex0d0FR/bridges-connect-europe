-- Fix church visibility policy to allow approved users to view all churches
-- This fixes the chicken-and-egg problem where users need to see churches to assign them to campaigns

DROP POLICY IF EXISTS "Approved users can view churches they created or are assigned t" ON public.churches;

CREATE POLICY "Approved users can view all churches" 
ON public.churches 
FOR SELECT 
USING (is_user_approved(auth.uid()));