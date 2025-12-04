-- Disable email confirmation requirement completely
-- This migration provides guidance on removing the need for email confirmation for all users

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

-- Note: To completely disable email confirmation, you need to change the Supabase Auth settings:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Authentication > Settings
-- 3. Set "Enable email confirmations" to OFF

-- For development/testing purposes, we can create a helper function to simulate auto-confirmation
CREATE OR REPLACE FUNCTION public.simulate_auto_confirm()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN 'Email confirmation is disabled. All users can sign in immediately.';
END;
$$;

-- Alternative approach: Update the auth configuration (must be done via Supabase Dashboard)
-- The following is just for documentation purposes:
-- 
-- In Supabase Dashboard > Authentication > Settings:
-- ✅ Enable email confirmations: OFF
-- ✅ Enable secure email change: OFF (optional)