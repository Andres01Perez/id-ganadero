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

    // Service role for privileged ops
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check caller role
    const { data: callerRoles, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    if (roleErr) throw roleErr;

    const isAdminOrSuper =
      callerRoles?.some(
        (r) => r.role === "admin" || r.role === "super_admin"
      ) ?? false;

    if (!isAdminOrSuper) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const display_name = String(body?.display_name ?? "").trim();
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "operario") as
      | "super_admin"
      | "admin"
      | "operario";

    if (!display_name || display_name.length < 2 || display_name.length > 80) {
      return new Response(
        JSON.stringify({ error: "display_name inválido (2-80 chars)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (!password || password.length < 4) {
      return new Response(
        JSON.stringify({ error: "Contraseña mínimo 4 caracteres" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (!["super_admin", "admin", "operario"].includes(role)) {
      return new Response(JSON.stringify({ error: "role inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Solo super_admin puede crear super_admin o admin
    const isSuper =
      callerRoles?.some((r) => r.role === "super_admin") ?? false;
    if ((role === "super_admin" || role === "admin") && !isSuper) {
      return new Response(
        JSON.stringify({
          error: "Solo super_admin puede crear admin/super_admin",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const slug = slugify(display_name);
    if (!slug) {
      return new Response(
        JSON.stringify({ error: "display_name no genera slug válido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const email = `${slug}@yopmail.com`;

    // Verificar unicidad de display_name
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("display_name", display_name)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "display_name ya existe" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Crear usuario en auth
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });

    if (createErr || !created?.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "Error creando user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUserId = created.user.id;

    // Trigger creó profile básico; actualizarlo con display_name correcto y created_by
    const { error: upErr } = await admin
      .from("profiles")
      .update({ display_name, email, created_by: callerId, active: true })
      .eq("id", newUserId);

    if (upErr) {
      // rollback user
      await admin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Asignar rol
    const { error: roleInsErr } = await admin
      .from("user_roles")
      .insert({ user_id: newUserId, role });

    if (roleInsErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: roleInsErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: newUserId, display_name, email, role },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
