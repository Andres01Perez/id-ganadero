import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import listaHeader from "@/assets/lista-header.jpg";
import BottomTabBar from "@/components/BottomTabBar";
import FincaForm from "@/components/FincaForm";
import { ArrowLeft, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";

type Finca = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  hectareas: number | null;
};

const Fincas = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [fincas, setFincas] = useState<Finca[]>([]);
  const [opCounts, setOpCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fincas")
      .select("id, nombre, ubicacion, hectareas")
      .eq("activo", true)
      .order("nombre");
    if (error) {
      toast.error("No se pudieron cargar las fincas");
      setLoading(false);
      return;
    }
    setFincas(data ?? []);

    if (isAdmin && data && data.length > 0) {
      const { data: accesos } = await supabase
        .from("user_finca_acceso")
        .select("finca_id")
        .in(
          "finca_id",
          data.map((f) => f.id)
        );
      const counts: Record<string, number> = {};
      (accesos ?? []).forEach((a) => {
        counts[a.finca_id] = (counts[a.finca_id] ?? 0) + 1;
      });
      setOpCounts(counts);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const openNew = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    if (!isAdmin) return;
    setEditingId(id);
    setFormOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <header className="relative h-36 overflow-hidden">
        <img src={listaHeader} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        <button
          onClick={() => navigate("/menu")}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      <div className="bg-gold-solid text-ink py-3 text-center tracking-jps font-semibold uppercase text-base">
        Fincas
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : fincas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No hay fincas registradas</p>
            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-1">
                Toca el botón + para agregar
              </p>
            )}
          </div>
        ) : (
          fincas.map((f) => (
            <button
              key={f.id}
              onClick={() => openEdit(f.id)}
              disabled={!isAdmin}
              className="w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform disabled:active:scale-100"
            >
              <div className="w-14 h-14 rounded-full border-[3px] border-gold bg-white flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-gold-deep" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-base text-ink leading-tight truncate">{f.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[f.ubicacion, f.hectareas != null ? `${f.hectareas} ha` : null]
                    .filter(Boolean)
                    .join(" · ") || "Sin detalles"}
                </p>
              </div>
              {isAdmin && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/60 rounded-full px-2 py-1 shrink-0">
                  <Users className="h-3 w-3" />
                  {opCounts[f.id] ?? 0}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {isAdmin && (
        <button
          onClick={openNew}
          className="fixed bottom-20 right-5 h-14 w-14 rounded-full bg-gold-solid text-ink shadow-gold flex items-center justify-center active:scale-95 transition-transform z-30"
          aria-label="Agregar finca"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <FincaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        fincaId={editingId}
        onSaved={load}
      />

      <BottomTabBar />
    </div>
  );
};

export default Fincas;
