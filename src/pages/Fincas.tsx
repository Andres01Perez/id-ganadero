import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFinca, type FincaActiva } from "@/contexts/FincaContext";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS } from "@/lib/asset-keys";
import BottomTabBar from "@/components/BottomTabBar";
import FincaForm from "@/components/FincaForm";
import { ArrowLeft, MapPin, Pencil, Plus, Users } from "lucide-react";
import { toast } from "sonner";

const Fincas = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const headerImg = useAppAsset(ASSET_KEYS.bannerFincas, ASSET_FALLBACKS[ASSET_KEYS.bannerFincas]);

  const { fincasAccesibles, loading: loadingFincas, setFincaActiva, reloadFincas } = useFinca();
  const [opCounts, setOpCounts] = useState<Record<string, number>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Conteo de operarios por finca (admins)
  useEffect(() => {
    if (!isAdmin || fincasAccesibles.length === 0) {
      setOpCounts({});
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_finca_acceso")
        .select("finca_id")
        .in("finca_id", fincasAccesibles.map((f) => f.id));
      const counts: Record<string, number> = {};
      (data ?? []).forEach((a) => {
        counts[a.finca_id] = (counts[a.finca_id] ?? 0) + 1;
      });
      setOpCounts(counts);
    })();
  }, [isAdmin, fincasAccesibles]);

  const handleSelect = (f: FincaActiva) => {
    setFincaActiva(f);
    navigate(`/finca/${f.id}/menu-finca`);
  };

  const openNew = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingId(id);
    setFormOpen(true);
  };

  const handleSaved = async () => {
    const list = await reloadFincas();
    // Si se acaba de crear (no había editingId) y hay una nueva, podríamos activarla.
    // Por simplicidad mantenemos selección manual.
    void list;
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <header className="relative aspect-[865/503] overflow-hidden">
        <img src={headerImg} alt="" className="w-full h-full object-cover" loading="eager" />
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
        Selecciona una finca
      </div>

      <div className="px-4 py-4 space-y-3">
        {loadingFincas ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : fincasAccesibles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No tienes fincas asignadas</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin ? "Toca el botón + para crear una finca." : "Pide a un administrador que te asigne una finca."}
            </p>
          </div>
        ) : (
          fincasAccesibles.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelect(f)}
              className="w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform"
            >
              <div className="w-14 h-14 rounded-full border-[3px] border-gold bg-white flex items-center justify-center shrink-0 overflow-hidden">
                {f.foto_url ? (
                  <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MapPin className="h-6 w-6 text-gold-deep" />
                )}
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
              {isAdmin && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => openEdit(e, f.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openEdit(e as unknown as React.MouseEvent, f.id);
                  }}
                  className="h-9 w-9 rounded-full bg-secondary/60 flex items-center justify-center shrink-0 active:scale-95"
                  aria-label="Editar finca"
                >
                  <Pencil className="h-4 w-4 text-ink" />
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {isAdmin && (
        <button
          onClick={openNew}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full bg-gold-solid text-ink shadow-gold flex items-center justify-center active:scale-95 transition-transform z-30"
          aria-label="Agregar finca"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <FincaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        fincaId={editingId}
        onSaved={handleSaved}
      />

      <BottomTabBar />
    </div>
  );
};

export default Fincas;
