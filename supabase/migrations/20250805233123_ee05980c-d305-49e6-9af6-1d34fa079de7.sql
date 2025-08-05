-- Fix RLS policy for service role access to churches table
-- The edge function uses service role key so it should bypass RLS
-- But let's ensure there's a policy for service role operations

-- Create a policy that allows service role to access all churches
CREATE POLICY "Service role can access all churches" 
ON public.churches 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Also ensure the existing policy doesn't conflict
DROP POLICY IF EXISTS "Approved users can view all churches" ON public.churches;

-- Recreate the user policy to be more specific
CREATE POLICY "Approved users can view all churches" 
ON public.churches 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'approved_user')
  )
);