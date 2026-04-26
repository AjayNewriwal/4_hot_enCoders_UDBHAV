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

    const { skill } = await req.json();
    if (!skill) throw new Error("Skill is required");

    // 1. Get logged-in user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) throw new Error("Unauthorized");

    // 2. Fetch user's college_id and college name
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("college_id, colleges(name)")
      .eq("user_id", currentUser.id)
      .single();

    if (profileError || !profile?.college_id) {
      throw new Error("User college not found. Please update your profile.");
    }

    const userCollegeId = profile.college_id;
    const collegeName = profile.colleges?.name || "Your College";

    // 3. Query: SELECT users from SAME college WHERE skill = selected skill
    const { data, error } = await supabase
      .from("skill_scores")
      .select(`
        user_id,
        score,
        skill,
        user_profiles!inner (
          username,
          college_id
        )
      `)
      .eq("skill", skill.toUpperCase())
      .eq("user_profiles.college_id", userCollegeId)
      .order("score", { ascending: false });

    if (error) throw error;

    // 4. Add dynamic ranking
    const rankedData = (data || []).map((item, index) => ({
      rank: index + 1,
      user_id: item.user_id,
      username: item.user_profiles.username || "Anonymous",
      score: item.score,
      is_current_user: item.user_id === currentUser?.id
    }));

    return new Response(JSON.stringify({
      collegeName,
      rankings: rankedData
    }), {
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
