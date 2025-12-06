-- Add phone column to profiles table for SMS notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.profiles.phone IS 'User phone number for SMS notifications (format: +1234567890)';

-- Note: Database triggers for calling Edge Functions require pg_net extension
-- The recommended approach is to call the Edge Function from your application code
-- when creating notifications, OR use Supabase Database Webhooks (available in Dashboard)

-- Option 1: Use Supabase Database Webhooks (Recommended - No code needed)
-- 1. Go to Supabase Dashboard → Database → Webhooks
-- 2. Create a new webhook on the 'notifications' table
-- 3. Set event: INSERT
-- 4. Set URL: https://your-project.supabase.co/functions/v1/send-notification
-- 5. Set HTTP method: POST
-- 6. Add header: Authorization: Bearer YOUR_SERVICE_ROLE_KEY
-- 7. Set payload: { "record": NEW }

-- Option 2: Use pg_net extension (if available)
-- First enable: CREATE EXTENSION IF NOT EXISTS pg_net;
-- Then uncomment the function and trigger below

/*
CREATE OR REPLACE FUNCTION public.send_notification_via_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get from environment variables set via Supabase secrets
  webhook_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/send-notification';
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Use pg_net to make HTTP request
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'user_id', NEW.user_id,
          'title', NEW.title,
          'message', NEW.message,
          'type', NEW.type,
          'created_at', NEW.created_at
        )
      )
    );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to send notification webhook: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (only if pg_net is enabled)
DROP TRIGGER IF EXISTS trigger_send_notification_via_webhook ON public.notifications;
CREATE TRIGGER trigger_send_notification_via_webhook
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_notification_via_webhook();
*/

