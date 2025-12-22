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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if any admin exists
    const { data: existingAdmins, error: checkError } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);

    if (checkError) {
      console.error("Error checking for admins:", checkError.message);
      return new Response(JSON.stringify({ error: checkError.message }), {
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

    // Create the admin user
    const email = "admin@intellinks.co.ke";
    const password = "Admin123!";

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "System Administrator" },
    });

    if (createError) {
      console.error("Error creating admin:", createError.message);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The profile and user role are created by the trigger, but we need to upgrade to admin
    if (newUser.user) {
      // Update the role to admin
      const { error: roleError } = await adminClient
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", newUser.user.id);

      if (roleError) {
        console.error("Error setting admin role:", roleError.message);
      }

      // Update profile with department
      await adminClient
        .from("profiles")
        .update({ department: "Administration", job_title: "System Administrator" })
        .eq("id", newUser.user.id);
    }

    console.log("Admin user created successfully");
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Admin user created",
      credentials: { email, password }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Bootstrap admin error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
