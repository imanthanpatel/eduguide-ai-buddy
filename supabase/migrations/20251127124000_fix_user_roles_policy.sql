-- Fix user_roles RLS policies to allow proper role assignment
-- This addresses the "new row violates RLS policy for table user_roles" error

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Recreate policies with proper permissions

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all roles
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