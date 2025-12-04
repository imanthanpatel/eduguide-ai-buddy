-- Temporary migration to disable email confirmation requirement for development
-- ONLY FOR DEVELOPMENT/TESTING PURPOSES
-- DO NOT RUN THIS IN PRODUCTION

-- This migration confirms all existing users' emails
-- Note: We can't directly modify auth.users table, so we'll provide the SQL command
-- that should be run in the Supabase SQL editor with proper permissions

-- The following command should be run manually in the Supabase SQL editor:
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email_confirmed_at IS NULL;

-- For applications where you have the necessary permissions, you can create a function:
CREATE OR REPLACE FUNCTION public.confirm_all_users()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- This would work if you have the necessary permissions
  -- UPDATE auth.users 
  -- SET email_confirmed_at = NOW() 
  -- WHERE email_confirmed_at IS NULL;
  --
  -- For now, we'll just raise a notice
  RAISE NOTICE 'To confirm all users, run: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;';
END;
$$;

-- Note: For new signups, you would need to modify the auth configuration
-- This can be done in the Supabase Dashboard under Authentication > Settings
-- Set "Enable email confirmations" to OFF for development

-- To re-enable email confirmations later, you would need to:
-- 1. Set "Enable email confirmations" to ON in the Supabase Dashboard
-- 2. Optionally reset email_confirmed_at for users who shouldn't have access

-- For production, always keep email confirmations enabled for security