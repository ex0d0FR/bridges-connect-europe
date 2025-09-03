-- Fix infinite recursion in RLS policies by removing circular dependencies

-- First, let's remove the problematic "Users can view churches in their campaigns" policy
-- This policy causes recursion because it references campaign_churches which now references churches
DROP POLICY IF EXISTS "Users can view churches in their campaigns" ON public.churches;

-- Replace it with a simpler approach that doesn't cause recursion
-- Users can view churches they created, and admins can view all churches
-- Campaign access will be handled at the application level through joins

-- The existing policies we keep:
-- "Users can view churches they created" - this is safe
-- "Admins can view all churches" - this is safe
-- "Users can update/delete churches they created" - these are safe

-- No additional policies needed for churches table to avoid recursion