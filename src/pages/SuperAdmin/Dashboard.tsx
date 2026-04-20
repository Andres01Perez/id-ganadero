import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Beef, Sparkles } from "lucide-react";

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["sa_dashboard"],
    queryFn: async () => {
      const [fincas, animales, usuarios] = await Promise.all([
        supabase.from("fincas").select("id", { count: "exact", head: true }).eq("activo", true),
        supabase.from("animales").select("tipo", { count: "exact" }).eq("activo", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("active", true),
      ]);
      const tipos: Record<string, number> = {};
      (animales.data ?? []).forEach((a) => {
        tipos[a.tipo] = (tipos[a.tipo] ?? 0) + 1;
      });
      return {
        fincas: fincas.count ?? 0,
        animales: animales.count ?? 0,
        usuarios: usuarios.count ?? 0,
        tipos,
      };
    },
  });

  const cards = [
    { label: "Fincas activas", value: data?.fincas ?? 0, icon: Building2 },
    { label: "Total animales", value: data?.animales ?? 0, icon: Beef },
    { label: "Usuarios activos", value: data?.usuarios ?? 0, icon: Users },
    {
      label: "Embriones",
      value: data?.tipos.embrion ?? 0,
      icon: Sparkles,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          Vista general de la plataforma JPS Ganadería.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-card border border-border rounded-xl p-5 shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <c.icon className="h-4 w-4 text-gold" />
            </div>
            <p className="text-3xl font-bold">
              {isLoading ? "…" : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Animales por tipo</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {["macho", "hembra", "cria", "embrion", "otro"].map((t) => (
              <div
                key={t}
                className="bg-secondary/40 rounded-lg p-3 text-center"
              >
                <p className="text-xs uppercase text-muted-foreground">{t}</p>
                <p className="text-2xl font-bold">{data?.tipos[t] ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
