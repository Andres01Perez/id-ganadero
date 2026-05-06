import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fetchEleven = async (url: string, apiKey: string) => {
  const res = await fetch(url, { headers: { "xi-api-key": apiKey } });
  if (!res.ok) {
    const detail = await res.text();
    return { error: `ElevenLabs ${res.status}: ${detail}`, status: res.status };
  }
  return { data: await res.json() };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claims, error: authError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !claims?.claims?.sub) return json({ error: "No autorizado" }, 401);

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return json({ error: "ELEVENLABS_API_KEY no está configurada" }, 500);

    let agentId: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.agent_id === "string") agentId = body.agent_id.trim();
    } catch {
      // body opcional
    }
    if (!agentId) return json({ error: "Falta agent_id" }, 400);

    const encoded = encodeURIComponent(agentId);
    const [tokenRes, signedRes] = await Promise.all([
      fetchEleven(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encoded}`,
        apiKey,
      ),
      fetchEleven(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encoded}`,
        apiKey,
      ),
    ]);

    if (tokenRes.error && signedRes.error) {
      return json({ error: tokenRes.error }, tokenRes.status ?? 500);
    }

    return json({
      token: tokenRes.data?.token ?? null,
      signed_url: signedRes.data?.signed_url ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return json({ error: message }, 500);
  }
});
