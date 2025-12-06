# Notification Email/SMS Setup Guide

This guide will help you set up free email and SMS notifications for your EduGuide AI application.

## 📧 Email Setup (Resend - Recommended)

### Step 1: Sign up for Resend
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (3,000 emails/month free)
3. Verify your email address

### Step 2: Get API Key
1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it "EduGuide Notifications"
4. Copy the API key (starts with `re_`)

### Step 3: Add Domain (Optional but Recommended)
1. Go to [Resend Domains](https://resend.com/domains)
2. Add your domain (e.g., `eduguide-ai.com`)
3. Add the DNS records they provide
4. Wait for verification (usually takes a few minutes)

### Step 4: Set Environment Variable
```bash
# In Supabase Dashboard or via CLI
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

**Note:** If you don't have a domain, Resend allows sending from `onboarding@resend.dev` for testing, but you should verify a domain for production.

---

## 📱 SMS Setup (Twilio - Recommended)

### Step 1: Sign up for Twilio
1. Go to [twilio.com](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your phone number
4. You'll get $15.50 in free credits (enough for ~1,000 SMS messages)

### Step 2: Get Credentials
1. Go to [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** (starts with `AC`)
3. Find your **Auth Token** (click the eye icon to reveal)
4. Get a **Phone Number**:
   - Go to "Phone Numbers" → "Buy a number"
   - Choose a number (free trial numbers are available)
   - Copy the phone number (format: +1234567890)

### Step 3: Set Environment Variables
```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🚀 Alternative Free Options

### Email Alternatives:
1. **SendGrid** - 100 emails/day free
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Get API key from Settings → API Keys
   - Set: `SENDGRID_API_KEY=your_key`

2. **Mailgun** - 5,000 emails/month free (first 3 months), then 1,000/month
   - Sign up at [mailgun.com](https://www.mailgun.com)
   - Get API key from Dashboard
   - Set: `MAILGUN_API_KEY=your_key`

### SMS Alternatives:
1. **AWS SNS** - Free tier includes SMS
   - Sign up at [aws.amazon.com/sns](https://aws.amazon.com/sns)
   - Free tier: 100 SMS/month
   - Requires AWS account setup

2. **Vonage (Nexmo)** - Free trial
   - Sign up at [vonage.com](https://www.vonage.com)
   - Get API key and secret
   - Set: `VONAGE_API_KEY` and `VONAGE_API_SECRET`

---

## ⚙️ Configuration Steps

### 1. Deploy the Edge Function
```bash
supabase functions deploy send-notification
```

### 2. Set Environment Variables in Supabase
Go to your Supabase Dashboard → Project Settings → Edge Functions → Secrets, or use CLI:

```bash
# Required
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890

# Optional (for database triggers - see Option 2 below)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note:** Replace `your-project` with your actual Supabase project reference ID (found in your project URL).

### 3. Apply Database Migration
The migration adds a `phone` column to the `profiles` table:
```bash
supabase db push
```

Or apply manually in Supabase SQL Editor:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;
```

### 4. Choose Your Integration Method

#### **Option 1: Application Code (Recommended - Easiest)**
Use the helper function in your code when creating notifications:

```typescript
import { createNotificationWithEmailSMS } from "@/lib/sendNotification";

// Instead of:
// await supabase.from("notifications").insert([{...}]);

// Use:
await createNotificationWithEmailSMS(
  user_id,
  "New Assignment",
  "You have a new assignment due tomorrow",
  "info"
);
```

#### **Option 2: Database Webhook (Automatic - No Code Changes)**
1. Go to Supabase Dashboard → Database → Webhooks
2. Click "Create a new webhook"
3. Configure:
   - **Name**: Send Notification Email/SMS
   - **Table**: `notifications`
   - **Events**: INSERT
   - **Type**: HTTP Request
   - **URL**: `https://your-project.supabase.co/functions/v1/send-notification`
   - **HTTP Method**: POST
   - **HTTP Headers**: 
     - Key: `Authorization`
     - Value: `Bearer YOUR_SERVICE_ROLE_KEY`
   - **HTTP Body**: 
     ```json
     {
       "record": {
         "id": "{{ $1.id }}",
         "user_id": "{{ $1.user_id }}",
         "title": "{{ $1.title }}",
         "message": "{{ $1.message }}",
         "type": "{{ $1.type }}",
         "created_at": "{{ $1.created_at }}"
       }
     }
     ```
4. Save the webhook

Now notifications will automatically send email/SMS when inserted!

---

## 🔄 How It Works

1. **When a notification is created** in the `notifications` table:
   - A database trigger fires
   - The trigger calls the `send-notification` Edge Function
   - The Edge Function sends email (via Resend) and SMS (via Twilio)

2. **User Requirements:**
   - Email: User must have an email in `auth.users.email`
   - SMS: User must have a phone number in `profiles.phone`

### Add Phone Number to Profiles Table

If the `profiles` table doesn't have a `phone` column, run this migration:

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.phone IS 'User phone number for SMS notifications (format: +1234567890)';
```

---

## 🧪 Testing

### Test Email:
1. Create a notification in your app
2. Check the user's email inbox
3. Check Supabase Edge Function logs for errors

### Test SMS:
1. Make sure user has a phone number in their profile
2. Create a notification
3. User should receive SMS
4. Check Twilio console for delivery status

### Manual Test via Edge Function:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "test-id",
      "user_id": "user-uuid",
      "title": "Test Notification",
      "message": "This is a test",
      "type": "info",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }'
```

---

## 💰 Cost Estimates

### Free Tier Limits:
- **Resend**: 3,000 emails/month (FREE)
- **Twilio**: $15.50 credit (FREE) ≈ 1,000 SMS
- **SendGrid**: 100 emails/day (FREE)
- **Mailgun**: 5,000 emails/month (FREE for 3 months)

### After Free Tier:
- **Resend**: $20/month for 50,000 emails
- **Twilio**: ~$0.0075 per SMS (US numbers)
- **SendGrid**: $19.95/month for 50,000 emails

---

## 🔒 Security Notes

1. **Never commit API keys** to version control
2. **Use Supabase Secrets** for all API keys
3. **Verify domains** for email (prevents spam)
4. **Rate limit** notifications to prevent abuse
5. **Validate phone numbers** before sending SMS

---

## 🐛 Troubleshooting

### Emails not sending:
- Check Resend API key is correct
- Verify domain is verified (if using custom domain)
- Check Edge Function logs in Supabase Dashboard
- Ensure user has an email address

### SMS not sending:
- Check Twilio credentials are correct
- Verify phone number format (+1234567890)
- Check Twilio account has credits
- Ensure user has a phone number in profile
- Check Twilio console for delivery status

### Trigger not firing:
- Verify `pg_net` extension is enabled
- Check database settings are configured
- Review Edge Function logs
- Try calling Edge Function directly to test

---

## 📝 Next Steps

1. Set up Resend account and get API key
2. Set up Twilio account and get credentials
3. Deploy the Edge Function
4. Configure database settings
5. Test with a sample notification
6. Add phone number field to user profiles (if needed)

For questions or issues, check the Supabase Edge Functions logs or the service provider's documentation.

