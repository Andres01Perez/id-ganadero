import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
        Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const isSuper = callerRoles?.some((r) => r.role === "super_admin") ?? false;

    if (!isSuper) {
      return new Response(
        JSON.stringify({ error: "Solo super_admin" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const target_user_id = String(body?.target_user_id ?? "");
    const display_name: string | undefined = body?.display_name?.trim();
    const password: string | undefined = body?.password;
    const active: boolean | undefined = body?.active;

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates: Record<string, unknown> = {};
    const authUpdates: Record<string, unknown> = {};

    if (display_name) {
      if (display_name.length < 2 || display_name.length > 80) {
        return new Response(
          JSON.stringify({ error: "display_name inválido (2-80)" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const slug = slugify(display_name);
      if (!slug) {
        return new Response(JSON.stringify({ error: "slug inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const newEmail = `${slug}@yopmail.com`;

      // Validar que el display_name/email no choque con otro usuario
      const { data: dup } = await admin
        .from("profiles")
        .select("id")
        .eq("display_name", display_name)
        .neq("id", target_user_id)
        .maybeSingle();
      if (dup) {
        return new Response(
          JSON.stringify({ error: "display_name ya existe" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      updates.display_name = display_name;
      updates.email = newEmail;
      authUpdates.email = newEmail;
      authUpdates.user_metadata = { display_name };
    }

    if (password) {
      if (password.length < 4) {
        return new Response(
          JSON.stringify({ error: "Contraseña mínimo 4 caracteres" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      authUpdates.password = password;
    }

    if (typeof active === "boolean") {
      updates.active = active;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: aErr } = await admin.auth.admin.updateUserById(
        target_user_id,
        authUpdates
      );
      if (aErr) {
        return new Response(JSON.stringify({ error: aErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: pErr } = await admin
        .from("profiles")
        .update(updates)
        .eq("id", target_user_id);
      if (pErr) {
        return new Response(JSON.stringify({ error: pErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
