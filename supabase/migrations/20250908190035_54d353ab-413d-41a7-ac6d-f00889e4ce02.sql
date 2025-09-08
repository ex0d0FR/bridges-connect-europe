-- Update church RLS policies for collaborative team access

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view churches they created" ON public.churches;

-- Create new SELECT policy allowing all approved users to view all churches
CREATE POLICY "Approved users can view all churches" 
ON public.churches 
FOR SELECT 
USING (is_user_approved(auth.uid()));

-- Drop existing UPDATE policy and create new one with admin override
DROP POLICY IF EXISTS "Users can update churches they created" ON public.churches;

CREATE POLICY "Users can update churches they created or admins can update any" 
ON public.churches 
FOR UPDATE 
USING (
  is_user_approved(auth.uid()) AND 
  (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role))
);

-- Drop existing DELETE policy and create new one with admin override
DROP POLICY IF EXISTS "Users can delete churches they created" ON public.churches;

CREATE POLICY "Users can delete churches they created or admins can delete any" 
ON public.churches 
FOR DELETE 
USING (
  is_user_approved(auth.uid()) AND 
  (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role))
);