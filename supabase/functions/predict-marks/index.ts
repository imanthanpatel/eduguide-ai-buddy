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
    const { hoursStudied, attendance, sleepHours, parentalInvolvement, familyIncome } = await req.json();

    // Use the correct environment variable name
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    console.log("Processing mark prediction request");

    const prompt = `
Predict a student's exam score (0-100) based on:

Hours Studied: ${hoursStudied}
Attendance: ${attendance}%
Sleep Hours: ${sleepHours}
Parental Involvement (1-5): ${parentalInvolvement}
Family Income: ${familyIncome}

Return ONLY this JSON:
{
  "predicted_score": number,
  "confidence": "low | medium | high",
  "analysis": "2-3 sentences"
}
    `;

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
        ]
      })
    });

    if (!response.ok) {
      const msg = await response.text();
      console.error("OpenAI API Error:", msg);
      throw new Error("OpenAI request failed");
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";

    // Extract JSON safely
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned invalid format");

    const result = JSON.parse(match[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in predict-marks function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});