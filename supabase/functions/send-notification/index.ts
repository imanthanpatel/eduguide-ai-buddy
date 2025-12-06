import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get notification data from request
    const { record }: { record: NotificationPayload } = await req.json();

    if (!record || !record.user_id) {
      throw new Error("Invalid notification data");
    }

    // Get user's email and phone from profiles and auth
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", record.user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(record.user_id);

    if (userError) {
      console.error("Error fetching user:", userError);
    }

    const userEmail = user?.email;
    const userName = profile?.full_name || "Student";
    const userPhone = profile?.phone;

    const results = {
      emailSent: false,
      smsSent: false,
      errors: [] as string[],
    };

    // Send Email via Resend
    if (RESEND_API_KEY && userEmail) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "EduGuide AI <notifications@eduguide-ai.com>", // Change this to your verified domain
            to: userEmail,
            subject: `🔔 ${record.title}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🔔 New Notification</h1>
                    </div>
                    <div class="content">
                      <p>Hello ${userName},</p>
                      <p><strong>${record.title}</strong></p>
                      <p>${record.message}</p>
                      <a href="${SUPABASE_URL?.replace('/rest/v1', '')}/student-dashboard?tab=notifications" class="button">View Notification</a>
                      <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        This is an automated notification from EduGuide AI.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          results.emailSent = true;
          console.log("Email sent successfully");
        } else {
          const errorData = await emailResponse.text();
          results.errors.push(`Email failed: ${errorData}`);
          console.error("Email send failed:", errorData);
        }
      } catch (error) {
        results.errors.push(`Email error: ${error.message}`);
        console.error("Email error:", error);
      }
    }

    // Send SMS via Twilio
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && userPhone) {
      try {
        // Format phone number (remove any non-digits)
        const formattedPhone = userPhone.replace(/\D/g, "");
        
        // Ensure phone starts with country code (assuming +1 for US/Canada)
        const phoneNumber = formattedPhone.startsWith("1") 
          ? `+${formattedPhone}` 
          : `+1${formattedPhone}`;

        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: TWILIO_PHONE_NUMBER,
              To: phoneNumber,
              Body: `🔔 ${record.title}\n\n${record.message}\n\nView: ${SUPABASE_URL?.replace('/rest/v1', '')}/student-dashboard?tab=notifications`,
            }),
          }
        );

        if (smsResponse.ok) {
          results.smsSent = true;
          console.log("SMS sent successfully");
        } else {
          const errorData = await smsResponse.text();
          results.errors.push(`SMS failed: ${errorData}`);
          console.error("SMS send failed:", errorData);
        }
      } catch (error) {
        results.errors.push(`SMS error: ${error.message}`);
        console.error("SMS error:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: results.emailSent || results.smsSent,
        ...results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

