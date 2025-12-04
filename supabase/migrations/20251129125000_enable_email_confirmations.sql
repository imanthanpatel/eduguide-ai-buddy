-- Enable email confirmations helper functions
-- This creates helper functions to work with email confirmations

-- Create a function to check if user email is confirmed
-- Note: We can't directly modify auth.users table, but we can create helper functions
CREATE OR REPLACE FUNCTION public.is_email_confirmed(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND email_confirmed_at IS NOT NULL
  );
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_email_confirmed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_confirmed(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.is_email_confirmed(UUID) TO service_role;

-- Create a function to manually confirm a user's email (for admin use)
CREATE OR REPLACE FUNCTION public.confirm_user_email(admin_user_id UUID, target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the admin user has admin rights
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin') THEN
    -- In a real scenario, we would use Supabase Admin API to confirm emails
    -- For now, we'll just return true since email confirmation is disabled
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.confirm_user_email(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(UUID, UUID) TO service_role;