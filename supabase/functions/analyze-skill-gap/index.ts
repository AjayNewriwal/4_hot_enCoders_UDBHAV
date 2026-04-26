import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") || "",
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data } = await supabase
      .from("user_attempts")
      .select("*")
      .eq("user_id", user.id);

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          summary: "No data yet",
          weak_areas: [],
          strengths: [],
          recommendations: ["Start solving easy problems"],
          difficulty_analysis: {},
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stats: any = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 },
    };

    data.forEach((item) => {
      if (stats[item.difficulty]) {
        stats[item.difficulty].total++;
        if (item.is_correct) stats[item.difficulty].correct++;
      }
    });

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: `Return ONLY valid JSON:
{
"summary": "string",
"weak_areas": ["string"],
"strengths": ["string"],
"recommendations": ["string"],
"difficulty_analysis": {
"easy": "string",
"medium": "string",
"hard": "string"
}
}

Data:
${JSON.stringify(stats)}`,
          },
        ],
      }),
    });

    const json = await aiRes.json();
    const raw = json?.choices?.[0]?.message?.content || "";

    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        summary: "AI parse failed",
        weak_areas: [],
        strengths: [],
        recommendations: [],
        difficulty_analysis: {},
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
