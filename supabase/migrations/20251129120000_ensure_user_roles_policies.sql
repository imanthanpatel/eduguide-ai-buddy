-- Ensure user_roles policies are correctly configured
-- This migration makes sure the user_roles table has the proper RLS policies

-- First, ensure the table exists and has RLS enabled
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on user_roles to ensure clean slate
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can set initial role" ON public.user_roles;

-- Recreate policies with proper permissions

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all roles (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own initial role during registration
-- This is a special case policy that allows users to set their initial role
CREATE POLICY "Users can set initial role" ON public.user_roles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('student', 'teacher')
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO anon; -- For signup process
GRANT ALL ON public.user_roles TO service_role; -- For admin operations

-- Add a new policy to handle the case where a user might be inserting their role
-- immediately after signup when the auth.uid() might not be immediately available
CREATE POLICY "Allow self role assignment" ON public.user_roles
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM auth.users WHERE id = user_id
    )
    AND role IN ('student', 'teacher')
  );