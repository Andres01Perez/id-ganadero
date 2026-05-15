import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import AnimalFincaForm from "@/components/AnimalFincaForm";
import { toast } from "sonner";

type AnimalFinca = {
  id: string;
  categoria: string | null;
  subtipo: string | null;
  tipo: string;
  cantidad: number;
};

const CATEGORIA_LABEL: Record<string, string> = {
  bovinos: "Bovinos",
  equinos: "Equinos",
};

const SUBTIPO_LABEL: Record<string, string> = {
  machos: "Machos",
  hembras: "Hembras",
  caballos: "Caballos",
  yeguas: "Yeguas",
};

const CATEGORIA_ORDER = ["bovinos", "equinos", "_legacy"];

const FincaAnimales = () => {
  const navigate = useNavigate();
  const { fincaId } = useParams<{ fincaId: string }>();
  const { fincaActiva } = useFinca();
  const [animals, setAnimals] = useState<AnimalFinca[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    if (!fincaActiva) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("animales_finca")
      .select("id, categoria, subtipo, tipo, cantidad")
      .eq("finca_id", fincaActiva.id)
      .order("categoria", { nullsFirst: false })
      .order("subtipo");
    if (error) {
      toast.error(error.message);
      setAnimals([]);
    } else {
      setAnimals((data ?? []) as AnimalFinca[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id]);

  const openCreate = () => {
    setEditId(null);
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    setEditId(id);
    setFormOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate(`/finca/${fincaId}/menu-finca`)}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          Animales de la finca
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : animals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No hay animales registrados
            </p>
            <p className="text-xs text-muted-foreground mt-2 px-6">
              Toca el botón + para agregar (ej. Caballos: 10).
            </p>
          </div>
        ) : (
          animals.map((a) => (
            <button
              key={a.id}
              onClick={() => openEdit(a.id)}
              className="w-full flex items-center justify-between bg-card rounded-xl p-4 shadow-soft active:scale-[0.99] transition-transform text-left"
            >
              <p className="font-bold text-base text-ink capitalize">{a.tipo}</p>
              <p className="font-bold text-2xl text-gold-deep tabular-nums">
                {a.cantidad}
              </p>
            </button>
          ))
        )}
      </div>

      <button
        onClick={openCreate}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full bg-gold-solid text-ink shadow-gold flex items-center justify-center active:scale-95 transition-transform z-30"
        aria-label="Agregar"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AnimalFincaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        animalId={editId}
        onSaved={load}
      />

      <BottomTabBar />
    </div>
  );
};

export default FincaAnimales;
