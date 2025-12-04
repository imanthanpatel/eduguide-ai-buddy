-- RUN THIS DIRECTLY IN SUPABASE SQL EDITOR
-- This script confirms all existing users' emails

-- Confirm all existing users' emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Verify the update
SELECT id, email, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Count of confirmed vs unconfirmed users
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;