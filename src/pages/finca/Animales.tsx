import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, PawPrint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import AnimalFincaForm from "@/components/AnimalFincaForm";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type AnimalFinca = {
  id: string;
  nombre: string;
  tipo_id: string;
  edad: number | null;
  activo: boolean;
  tipos_animal_finca: { nombre: string } | null;
};

const FincaAnimales = () => {
  const navigate = useNavigate();
  const { fincaActiva } = useFinca();
  const [animals, setAnimals] = useState<AnimalFinca[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    if (!fincaActiva) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("animales_finca")
      .select("id, nombre, tipo_id, edad, activo, tipos_animal_finca(nombre)")
      .eq("finca_id", fincaActiva.id)
      .order("nombre");
    if (error) {
      toast.error(error.message);
      setAnimals([]);
    } else {
      setAnimals((data ?? []) as unknown as AnimalFinca[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return animals;
    return animals.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.tipos_animal_finca?.nombre ?? "").toLowerCase().includes(q),
    );
  }, [animals, query]);

  const openCreate = () => {
    setEditId(null);
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    setEditId(id);
    setFormOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <FincaActivaChip />
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate("/menu-finca")}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">Animales de la finca</span>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o tipo"
            className="pl-9"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {animals.length === 0 ? "No hay animales en esta finca" : "Sin resultados"}
            </p>
          </div>
        ) : (
          filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => openEdit(a.id)}
              className={`w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform text-left ${
                !a.activo ? "opacity-40 grayscale" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-full border-[3px] border-gold bg-card flex items-center justify-center shrink-0">
                <PawPrint className="h-6 w-6 text-gold-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-ink leading-tight truncate">
                  {a.nombre}
                </p>
                <p className="text-xs text-muted-foreground tracking-wide">
                  {a.tipos_animal_finca?.nombre ?? "Sin tipo"}
                  {a.edad != null ? ` · ${a.edad} años` : ""}
                </p>
              </div>
              {!a.activo && (
                <span className="text-[10px] uppercase tracking-jps font-semibold border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                  Inactivo
                </span>
              )}
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
