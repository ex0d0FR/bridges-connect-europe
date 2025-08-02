-- Fix RLS policies for messages table to allow edge functions to insert records
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Approved users can create messages" ON public.messages;

-- Create new policy that allows both authenticated users and service role to insert
CREATE POLICY "Allow message creation from edge functions" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Update the select policy to allow service role access for edge functions
DROP POLICY IF EXISTS "Approved users can view messages they created" ON public.messages;

CREATE POLICY "Users can view their messages and service role can access all" 
ON public.messages 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- Update the update policy similarly
DROP POLICY IF EXISTS "Approved users can update messages they created" ON public.messages;

CREATE POLICY "Users can update their messages and service role can access all" 
ON public.messages 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.jwt() ->> 'role' = 'service_role'
);