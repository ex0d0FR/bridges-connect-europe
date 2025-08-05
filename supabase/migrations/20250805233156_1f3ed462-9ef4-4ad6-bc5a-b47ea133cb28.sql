-- Create a simple policy for service role access to churches table
-- Drop the existing policy first
DROP POLICY IF EXISTS "Service role can access all churches" ON public.churches;

-- Create a policy that allows service role to access all churches
CREATE POLICY "Service role can access all churches" 
ON public.churches 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);