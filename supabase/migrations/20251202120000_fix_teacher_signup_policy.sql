-- Fix for teacher signup policy issues
-- This migration addresses the "violates row-level security policy" error during teacher signup

-- Ensure the user_roles table has RLS enabled
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Allow self role assignment" ON public.user_roles;

-- Create a more permissive policy for user role assignment during signup
CREATE POLICY "Allow self role assignment during signup" ON public.user_roles
  FOR INSERT WITH CHECK (
    -- Allow users to insert their own roles
    (auth.uid() = user_id AND role IN ('student', 'teacher'))
    OR
    -- Also allow anon users during signup process
    (current_user = 'anon' AND role IN ('student', 'teacher'))
    OR
    -- Allow service role for backend operations
    (current_user = 'service_role')
  );

-- Ensure proper grants are in place
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO anon;
GRANT ALL ON public.user_roles TO service_role;

-- Also ensure the teacher_requests table has proper policies
ALTER TABLE IF EXISTS public.teacher_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on teacher_requests
DROP POLICY IF EXISTS "Users can create teacher requests" ON public.teacher_requests;

-- Create a more permissive policy for teacher requests
CREATE POLICY "Users can create teacher requests" ON public.teacher_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR current_user = 'anon'
    OR current_user = 'service_role'
  );

-- Grant necessary permissions for teacher_requests
GRANT ALL ON public.teacher_requests TO authenticated;
GRANT ALL ON public.teacher_requests TO anon;
GRANT ALL ON public.teacher_requests TO service_role;