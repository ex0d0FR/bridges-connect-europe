-- SECURITY FIX: Restrict church data access to prevent competitive data harvesting

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Approved users can view all churches" ON public.churches;
DROP POLICY IF EXISTS "Approved users can update any church" ON public.churches;
DROP POLICY IF EXISTS "Approved users can delete any church" ON public.churches;

-- NEW RESTRICTIVE POLICIES: Users can only access churches they created or have campaign access to

-- Policy 1: Users can view churches they created
CREATE POLICY "Users can view churches they created" 
ON public.churches 
FOR SELECT 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

-- Policy 2: Users can view churches that are part of their campaigns
CREATE POLICY "Users can view churches in their campaigns" 
ON public.churches 
FOR SELECT 
USING (
  is_user_approved(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM campaign_churches cc
    JOIN campaigns c ON c.id = cc.campaign_id
    WHERE cc.church_id = churches.id 
    AND c.created_by = auth.uid()
  )
);

-- Policy 3: Admins can view all churches (for system management)
CREATE POLICY "Admins can view all churches" 
ON public.churches 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Policy 4: Users can only update churches they created
CREATE POLICY "Users can update churches they created" 
ON public.churches 
FOR UPDATE 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

-- Policy 5: Admins can update any church
CREATE POLICY "Admins can update any church" 
ON public.churches 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Policy 6: Users can only delete churches they created
CREATE POLICY "Users can delete churches they created" 
ON public.churches 
FOR DELETE 
USING (is_user_approved(auth.uid()) AND auth.uid() = created_by);

-- Policy 7: Admins can delete any church
CREATE POLICY "Admins can delete any church" 
ON public.churches 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Keep existing creation policy (users create churches they own)
-- "Approved users can create churches" policy already exists and is appropriate

-- Keep service role policy for edge functions
-- "Service role can access all churches" policy already exists and is needed