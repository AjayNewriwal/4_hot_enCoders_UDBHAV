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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*, colleges(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!profileData || profileData.length === 0) {
      return new Response(JSON.stringify({
        error: "Profile not found",
        summary: "Please complete your career profile first.",
        scorecard: { dsa: 0, backend: 0, system_design: 0, projects: 0 },
        priority_gaps: [],
        roadmap: [],
        interview_readiness: "Not Ready"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profileData[0];

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
            content: `Analyze this profile and return ONLY pure JSON.
Profile: ${JSON.stringify(profile)}

Format:
{
  "summary": "string",
  "scorecard": { "dsa": 0, "backend": 0, "system_design": 0, "projects": 0 },
  "priority_gaps": [{ "gap": "string", "reason": "string", "priority": "Critical" }],
  "roadmap": [{ "phase": "string", "duration": "string", "focus": "string", "tasks": [] }],
  "interview_readiness": "Not Ready"
}`
          }
        ],
        temperature: 0.5
      }),
    });

    const res = await aiRes.json();
    const raw = res?.choices?.[0]?.message?.content || "";

    // Robust JSON extraction
    let clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      clean = clean.substring(start, end + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return new Response(JSON.stringify({
        error: "AI Parsing Failed",
        summary: "The AI response was malformed. Please try again.",
        scorecard: { dsa: 0, backend: 0, system_design: 0, projects: 0 },
        priority_gaps: [],
        roadmap: [],
        interview_readiness: "Not Ready"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
