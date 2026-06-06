import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Credentials must come from secrets — never hardcoded
    const email = Deno.env.get("BOOTSTRAP_ADMIN_EMAIL");
    const password = Deno.env.get("BOOTSTRAP_ADMIN_PASSWORD");

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error:
            "Bootstrap admin credentials are not configured. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD secrets.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 12) {
      return new Response(
        JSON.stringify({ error: "Bootstrap admin password must be at least 12 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingAdmins, error: checkError } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);

    if (checkError) {
      console.error("bootstrap-admin: failed admin check");
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: "Admin user already exists" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "System Administrator" },
    });

    if (createError) {
      console.error("bootstrap-admin: create user failed");
      return new Response(JSON.stringify({ error: "Failed to create admin" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newUser.user) {
      await adminClient.from("user_roles").update({ role: "admin" }).eq("user_id", newUser.user.id);
      await adminClient
        .from("profiles")
        .update({ department: "Administration", job_title: "System Administrator" })
        .eq("id", newUser.user.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Admin user created. Use configured credentials to sign in." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    console.error("bootstrap-admin: unexpected failure");
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
