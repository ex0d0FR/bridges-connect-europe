-- Fix security vulnerability: Restrict church data access to prevent competitor data theft
-- Remove overly permissive admin policies that allow viewing all churches

-- Drop the problematic admin policies for churches
DROP POLICY IF EXISTS "Admins can view all churches" ON public.churches;
DROP POLICY IF EXISTS "Admins can update any church" ON public.churches;
DROP POLICY IF EXISTS "Admins can delete any church" ON public.churches;

-- Create more restrictive admin policies that only allow admins to manage churches in their own organization/context
-- For now, we'll remove broad admin access entirely to fix the security issue
-- Admins can still create churches like regular users, but cannot access other users' churches

-- Keep the existing user-scoped policies (these are secure)
-- Users can only view/update/delete churches they created
-- Service role retains full access for system operations

-- Add a comment to document the security fix
COMMENT ON TABLE public.churches IS 'Church contact data - access restricted to creator only for security. Admins cannot view other users churches to prevent competitor data theft.';