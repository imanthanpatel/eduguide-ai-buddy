/**
 * Helper function to send email/SMS notifications when a notification is created
 * Call this function after inserting a notification into the database
 */

import { supabase } from "@/integrations/supabase/client";

interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

export async function sendNotificationEmailSMS(notification: NotificationData) {
  try {
    // Get the Supabase project URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.error("VITE_SUPABASE_URL not configured");
      return { success: false, error: "Configuration missing" };
    }

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        record: notification,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send notification:", error);
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a notification and automatically send email/SMS
 * Use this function instead of directly inserting into notifications table
 */
export async function createNotificationWithEmailSMS(
  user_id: string,
  title: string,
  message: string,
  type: string = "info"
) {
  try {
    // First, create the notification in the database
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id,
          title,
          message,
          type,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Then, send email/SMS via Edge Function
    // This happens asynchronously, so we don't wait for it
    sendNotificationEmailSMS({
      id: notification.id,
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      created_at: notification.created_at,
    }).catch((error) => {
      console.error("Failed to send notification email/SMS:", error);
      // Don't throw - notification was created successfully
    });

    return { success: true, notification };
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }
}

