import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    console.log("Generating motivational message");

    // Prompt for OpenAI
    const prompt = "Generate a short, uplifting motivational message (1–2 sentences) for a student. Make it warm, encouraging, and specific to academic journey. Return ONLY the message text.";

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", 
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      console.error(await response.text());
      throw new Error("OpenAI request failed");
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim() 
                    || "Keep pushing forward—your hard work will lead you to success! 🌟";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in motivational-message function:", error);

    // Always return a motivational fallback message
    return new Response(
      JSON.stringify({
        message: "Believe in yourself—every step you take brings you closer to your goals! ✨"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
