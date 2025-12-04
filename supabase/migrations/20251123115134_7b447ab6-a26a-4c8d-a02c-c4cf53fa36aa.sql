-- Create teachers table for approved teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  qualification text,
  experience text,
  subject text,
  approved_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on teachers table
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Teachers can view own profile
CREATE POLICY "Teachers can view own profile"
ON public.teachers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all teachers
CREATE POLICY "Admins can manage teachers"
ON public.teachers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add phone and reason fields to teacher_requests if not exists
ALTER TABLE public.teacher_requests 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS reason text;

-- Create a function to create the first admin user (call this manually after creating your admin account)
CREATE OR REPLACE FUNCTION public.setup_admin_user(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user id from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Insert admin role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Insert profile if not exists
  INSERT INTO public.profiles (id, full_name)
  VALUES (admin_user_id, 'Admin User')
  ON CONFLICT (id) DO NOTHING;
END;
$$;