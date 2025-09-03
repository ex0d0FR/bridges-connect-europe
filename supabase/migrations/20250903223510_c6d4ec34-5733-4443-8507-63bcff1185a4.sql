-- Fix security vulnerability: Restrict campaign_churches access to prevent unauthorized church viewing

-- Drop the overly permissive policy for managing campaign_churches
DROP POLICY IF EXISTS "Approved users can manage campaign_churches for their campaigns" ON public.campaign_churches;

-- Create more restrictive policies for campaign_churches
-- Users can only add churches they created OR are explicitly shared with them
CREATE POLICY "Users can add their own churches to campaigns" 
ON public.campaign_churches 
FOR INSERT 
WITH CHECK (
  is_user_approved(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_churches.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM churches 
    WHERE churches.id = campaign_churches.church_id 
    AND churches.created_by = auth.uid()
  )
);

-- Users can update/delete campaign_churches entries for their campaigns and their churches
CREATE POLICY "Users can manage their own churches in their campaigns" 
ON public.campaign_churches 
FOR ALL 
USING (
  is_user_approved(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_churches.campaign_id 
    AND campaigns.created_by = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM churches 
    WHERE churches.id = campaign_churches.church_id 
    AND churches.created_by = auth.uid()
  )
);

-- Admins can still manage any campaign_churches (for administrative purposes)
CREATE POLICY "Admins can manage any campaign_churches" 
ON public.campaign_churches 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));